''

import * as vscode from 'vscode';
import { IGrammar, INITIAL, IToken, ITokenizeLineResult, Registry, StackElement } from 'vscode-textmate';
import escapeStringRegexp from 'escape-string-regexp';
import { IGrammarRegistration, ILanguageRegistration, Resolver } from './util/registryResolver';
import * as path from 'path';
import * as fs from 'fs';
import { getOniguruma } from './util/onigLibs';

export interface SkinnyTextLine {
  text: string;
}

export interface SkinnyTextDocument {
  readonly uri: vscode.Uri;
  readonly version: number;
  readonly lineCount: number;

  lineAt(line: number): SkinnyTextLine;
  getText(): string;
}

type Mutable<T> = { -readonly[P in keyof T]: T[P] };

export interface IMatlabToken extends Mutable<IToken> {
  level: number;
  line: number;
  text: string;
  type: string;
}

export interface IMatlabTokenizeLineResult extends ITokenizeLineResult {
  readonly tokens: IMatlabToken[],
  readonly stack: StackElement
}

export type MatlabTextmateToken = `${string}.matlab`;

interface IMatlabTokenizerState {
  context: boolean;
  continuation:  boolean;
  declaration: boolean;
  line: number;
  rule: StackElement;
  stack: number;
}

interface IMatlabTokenSymbolKindMap {
  [scope: string]: vscode.SymbolKind | undefined
}

interface IMatlabTokenScopeMap {
  [scope: string]: number | undefined
}

interface IMatlabTokenScopeContainerMap {
  [scope: string]: MatlabTextmateToken
}

export const matlabTokenSymbolKind: IMatlabTokenSymbolKindMap = {
  'keyword.control.for.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.if.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.repeat.parallel.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.switch.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.try.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.while.matlab': vscode.SymbolKind.Namespace,
  'entity.name.type.class.matlab': vscode.SymbolKind.Class,
  'variable.other.enummember.matlab': vscode.SymbolKind.EnumMember,
  'entity.name.type.event.matlab': vscode.SymbolKind.Event,
  'keyword.control.enum.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.events.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.methods.matlab': vscode.SymbolKind.Namespace,
  'keyword.control.properties.matlab': vscode.SymbolKind.Namespace,
  'entity.name.function.matlab': vscode.SymbolKind.Function,
  'variable.object.property.matlab': vscode.SymbolKind.Property,
  'entity.name.section.matlab': vscode.SymbolKind.String,
  'meta.assignment.variable.single.matlab': vscode.SymbolKind.Variable,
  'meta.assignment.variable.group.matlab': vscode.SymbolKind.Variable,
}

export const matlabTokenBlockScope: IMatlabTokenScopeMap = {
  'punctuation.definition.comment.begin.matlab': 1,
  'punctuation.definition.comment.end.matlab': -1,
  'keyword.control.for.matlab': 1,
  'keyword.control.end.for.matlab': -1,
  'keyword.control.if.matlab': 1,
  'keyword.control.end.if.matlab': -1,
  'keyword.control.else.matlab': -1,
  'keyword.control.elseif.matlab': -1,
  'keyword.control.repeat.parallel.matlab': 1,
  'keyword.control.end.repeat.parallel.matlab': -1,
  'keyword.control.switch.matlab': 1,
  'keyword.control.end.switch.matlab': -1,
  'keyword.control.try.matlab': 1,
  'keyword.control.end.try.matlab': -1,
  'keyword.control.while.matlab': 1,
  'keyword.control.end.while.matlab': -1,
  'storage.type.class.matlab': 1,
  'storage.type.class.end.matlab': -1,
  'keyword.control.enum.matlab': 1,
  'keyword.control.end.enum.matlab': -1,
  'keyword.control.events.matlab': 1,
  'keyword.control.end.events.matlab': -1,
  'keyword.control.methods.matlab': 1,
  'keyword.control.end.methods.matlab': -1,
  'keyword.control.properties.matlab': 1,
  'keyword.control.end.properties.matlab': -1,
  'storage.type.function.matlab': 1,
  'storage.type.function.end.matlab': -1,
  'keyword.control.arguments.matlab': 1,
  'keyword.control.end.arguments.matlab': -1
}

export const matlabTokens: Record<string, MatlabTextmateToken> = {
  accessorDot: 'punctuation.accessor.dot.matlab',
  commentBlock: 'punctuation.definition.comment.begin.matlab',
  elseifKeyword: 'keyword.control.elseif.matlab',
  elseKeyword: 'keyword.control.else.matlab',
  inlineComment: 'comment.line.percentage.matlab',
  continuation: 'punctuation.separator.continuation.line.matlab',
  function: 'entity.name.function.matlab',
  multipleAssignment: 'meta.assignment.variable.group.matlab'
};

const extension = vscode.extensions.getExtension('gimly81.matlab');

let matlabGrammar: IGrammar;

export class TextmateEngine {

  private _state?: IMatlabTokenizerState = {
    context: false,
    continuation: false,
    declaration: false,
    line: 0,
    rule: INITIAL,
    stack: 0
  };

  public getGrammar = getGrammar;

  public async tokenizeDocument(document: SkinnyTextDocument): Promise<IMatlabToken[]> {
    matlabGrammar = matlabGrammar || await getGrammar('source.matlab');
    const tokens: IMatlabToken[] = [];

    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
      let line: SkinnyTextLine = document.lineAt(lineNumber);
      const lineTokens = matlabGrammar.tokenizeLine(line.text, this._state.rule) as IMatlabTokenizeLineResult;

      for (const token of lineTokens.tokens) {
        token.type = token.scopes[token.scopes.length - 1];
        token.text = line.text.substring(token.startIndex, token.endIndex);
        token.line = lineNumber;
      }

      let skip = false;
      for (let i = 0; i < lineTokens.tokens.length; i++) {
        let token = lineTokens.tokens[i];

        if (skip) {
          skip = false;
          continue;
        }

        if (
          token.type === matlabTokens.accessorDot
          && !/^punctuation\./.test(lineTokens.tokens[i + 1].type)
        ) {
            lineTokens.tokens[i - 1].endIndex = lineTokens.tokens[i + 1].endIndex;
            lineTokens.tokens[i - 1].text += token.text + lineTokens.tokens[i + 1].text;
            lineTokens.tokens.splice(i, 2);
            skip = true;
        }
      }

      for (const token of lineTokens.tokens) {
        this._state.declaration =
          matlabTokenBlockScope[token.type] === 1
          || token.type === matlabTokens.elseifKeyword
          || token.type === matlabTokens.elseKeyword
          || this._state.declaration;

        if (this._state.declaration) {
          if (token.type === matlabTokens.continuaton) {
            this._state.continuation = true;
          }

          if (!this._state.continuation && lineNumber > this._state.line) {
            this._state.declaration = false;
            this._state.stack++;
          }
        }

        if (matlabTokenBlockScope.hasOwnProperty(token.type) && !this._state.declaration) {
          this._state.stack += matlabTokenBlockScope[token.type];
        }

        token.level = this._state.stack;
        tokens.push(token);

        this._state.line = lineNumber;
        this._state.rule = lineTokens.ruleStack;
      }
    }

    return tokens;
  }
}

function chunks(arr, chunkSize) {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
  }
  return res;
}

async function getGrammar(scopeName: string): Promise<IGrammar> {
  const grammars = [extension.packageJSON.contributes.grammars.find((g: IGrammarRegistration) => g.scopeName === scopeName)] as IGrammarRegistration[];
  grammars[0].path = path.resolve(extension.extensionPath, grammars[0].path);
  const languages = [extension.packageJSON.contributes.languages.find((g: ILanguageRegistration) => g.id === grammars[0].language)]  as ILanguageRegistration[];
  const onigLibPromise = getOniguruma();
  const resolver = new Resolver(grammars, languages, onigLibPromise);
  const registry = new Registry(resolver);
  return await registry.loadGrammar(grammars[0].scopeName);
}
