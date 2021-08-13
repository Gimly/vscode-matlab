''

import * as vscode from 'vscode';
import * as vsctm from 'vscode-textmate';
import { contributes } from '../package.json';
import { IGrammarRegistration, ILanguageRegistration, Resolver } from './util/registryResolver';
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

export interface IMatlabToken extends vsctm.IToken {
	scope: number;
	lineNumber: number;
	text: string;
	type: string;
}

export interface IMatlabTokenizeLineResult extends vsctm.ITokenizeLineResult {
	readonly tokens: IMatlabToken[],
	readonly stack: vsctm.StackElement
}

export type MatlabTextmateToken = `${string}.matlab`;

interface IMatlabTokenizerState {
	continuation: boolean;
	declaration: boolean;
	lineNumber: number;
	offset: 0 | -1;
	stack: number;
}

interface IMatlabTokenSymbolKindMap {
	[scope: string]: vscode.SymbolKind | undefined
}

interface IMatlabTokenBlockScopeMap {
	[scope: string]: number | undefined
}

interface IMatlabTokenScopeContainerMap {
	[scope: string]: MatlabTextmateToken
}

export const matlabTokenSymbolKind: IMatlabTokenSymbolKindMap = {
	'entity.name.type.class.matlab': vscode.SymbolKind.Class,
	'variable.other.enummember.matlab': vscode.SymbolKind.EnumMember,
	'entity.name.type.event.matlab': vscode.SymbolKind.Event,
	'entity.name.function.matlab': vscode.SymbolKind.Method,
	'variable.object.property.matlab': vscode.SymbolKind.Property,
	'entity.name.section.matlab': vscode.SymbolKind.String,
	'meta.assignment.variable.single.matlab': vscode.SymbolKind.Variable,
	'meta.assignment.variable.group.matlab': vscode.SymbolKind.Variable
}

export const matlabTokenBlockScope: IMatlabTokenBlockScopeMap = {
	'punctuation.definition.comment.begin.matlab': 1,
	'punctuation.definition.comment.end.matlab': -1,
	'keyword.control.for.matlab': 1,
	'keyword.control.end.for.matlab': -1,
	'keyword.control.if.matlab': 1,
	'keyword.control.end.if.matlab': -1,
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
	commentBlock: 'punctuation.definition.comment.begin.matlab',
	inlineComment: 'comment.line.percentage.matlab',
	continuation: 'punctuation.separator.continuation.line.matlab',
	function: 'entity.name.function.matlab',
	section: 'entity.name.section.matlab'
};

export const matlabGrammar = await getGrammar('source.matlab');

export class MatlabEngine {

	private _state?: IMatlabTokenizerState;

	public getGrammar = getGrammar;

	public tokenizeDocument(document: SkinnyTextDocument): IMatlabToken[] {
		const tokens: IMatlabToken[] = [];
		let ruleStack: vsctm.StackElement = vsctm.INITIAL;

		for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
			let line: SkinnyTextLine = document.lineAt(lineNumber);
			const lineTokens = matlabGrammar.tokenizeLine(line.text, ruleStack) as IMatlabTokenizeLineResult;

			for (const token of lineTokens.tokens) {
				token.type = token.scopes[token.scopes.length - 1];
				token.text = line.text.substring(token.startIndex, token.endIndex);
				token.lineNumber = lineNumber;
				this._state.declaration = (
					matlabTokenBlockScope[token.type] === 1
					|| this._state.offset === -1
				);

				if (this._state.declaration) {
					if (token.type === matlabTokens.continuaton) {
						this._state.continuation = true;
					}

					if (!this._state.continuation && lineNumber > this._state.lineNumber) {
						this._state.offset = 0;
					} else {
						this._state.offset = -1;
					}
				}

				if (matlabTokenBlockScope.hasOwnProperty(token.type)) {
					this._state.stack += matlabTokenBlockScope[token.type] + this._state.offset;
				}

				token.scope = this._state.stack;
			}

			tokens.push(...lineTokens.tokens);
			ruleStack = lineTokens.ruleStack;
		}
		return tokens;
	}
}

async function getGrammar(scopeName: string) {
	const grammars = [contributes.grammars.filter(g => g.scopeName === scopeName)[0]] as IGrammarRegistration[];
	const languages = [contributes.languages.filter(g => g.id === grammars[0].language)[0]]  as ILanguageRegistration[];
	const onigLibPromise = getOniguruma();
	const resolver = new Resolver(grammars, languages, onigLibPromise);
	const registry = new vsctm.Registry(resolver);
	return await registry.loadGrammar(grammars[0].scopeName);
}
