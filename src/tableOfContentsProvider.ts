'use strict';

import * as vscode from 'vscode';
import { SkinnyTextDocument, TextmateEngine, matlabTokenSymbolKind, IMatlabToken, matlabTokens, matlabTokenBlockScope } from './textmateEngine';

export interface TocEntry {
	readonly level: number;
	readonly line: number;
	readonly location: vscode.Location;
	readonly text: string;
	readonly token: string;
	readonly type: vscode.SymbolKind;
}

export class TableOfContentsProvider {
	private toc?: TocEntry[];

	public constructor(
		private _document: SkinnyTextDocument,
		private _engine: TextmateEngine
	) { }

	public async getToc(): Promise<TocEntry[]> {
		if (!this.toc) {
			try {
				this.toc = await this.buildToc(this._document);
			} catch (e) {
				this.toc = [];
			}
		}
		return this.toc;
	}

	public async lookup(text: string): Promise<TocEntry | undefined> {
		const toc = await this.getToc();
		return toc.find(entry => entry.text === text);
	}

	private async buildToc(document: SkinnyTextDocument): Promise<TocEntry[]> {
		const toc: TocEntry[] = [];
		const tokens = await this._engine.tokenizeDocument(document);

		for (const token of tokens.filter(this.isSymbolToken)) {
      if (token.type === 'entity.name.function.matlab') {
        console.log(token);
      }
    }

		for (const entry of tokens.filter(this.isSymbolToken)) {
			const lineNumber = entry.line;
			const line = document.lineAt(lineNumber);

      toc.push({
        level: entry.level,
        line: lineNumber,
        location: new vscode.Location(
          document.uri,
          new vscode.Range(lineNumber, 0, lineNumber, line.text.length)
        ),
        text: this.getText(entry),
        token: entry.type,
        type: matlabTokenSymbolKind[entry.type]
      });
		}

		// Get full range of section
		return toc.map((entry, startIndex): TocEntry => {
			let end: number | undefined = undefined;
			for (let i = startIndex + 1; i < toc.length; ++i) {
				if (toc[i].level <= entry.level) {
					end = toc[i].line - 1;
					break;
				}
			}
			const endLine = end ?? document.lineCount - 1;
			return {
				...entry,
				location: new vscode.Location(document.uri,
					new vscode.Range(
						entry.location.range.start,
						new vscode.Position(endLine, document.lineAt(endLine).text.length)
					)
				)
			};
		});
	}

	private isSymbolToken(token: IMatlabToken): boolean {
		return (
      matlabTokenSymbolKind[token.type]
      && (
        !token.type.startsWith('entity')
        || / meta\.([\w-]+)\.declaration\.matlab entity\.name\.\1/.test(token.scopes.join(' '))
        || / meta\.assignment\.definition\.([\w-]+)\.matlab entity\.name\.\1/.test(token.scopes.join(' '))
        || / meta\.assignment\.definition\.([\w-]+)\.matlab entity\.name\.\1/.test(token.scopes.join(' '))
        || / comment\.line\.[\w-]+\.matlab entity\.name\.section.matlab$/.test(token.scopes.join(' '))
      )
    );
	}

	private getText(entry: IMatlabToken): string {
		switch (matlabTokenSymbolKind[entry.type]) {
			case vscode.SymbolKind.String:
				return `%% ${entry.text}`;
				break;
			default:
				return entry.text;
				break;
		}
	}
}
