'use strict';

import * as vscode from 'vscode';
import { TableOfContentsProvider, TocEntry } from './tableOfContentsProvider';
import { MatlabEngine, SkinnyTextDocument } from './matlabEngine';

interface MatlabSymbol {
	readonly level: number;
	readonly parent: MatlabSymbol | undefined;
	readonly children: vscode.DocumentSymbol[];
}

export class MatlabDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

	constructor(
		private engine: MatlabEngine
	) { }

	public async provideDocumentSymbolInformation(document: SkinnyTextDocument): Promise<vscode.SymbolInformation[]> {
		const toc = await new TableOfContentsProvider(document, this.engine).getToc();
		return toc.map(entry => this.toSymbolInformation(entry));
	}

	public async provideDocumentSymbols(document: SkinnyTextDocument): Promise<vscode.DocumentSymbol[]> {
		const toc = await new TableOfContentsProvider(document, this.engine).getToc();
		const root: MatlabSymbol = {
			level: -Infinity,
			children: [],
			parent: undefined
		};
		this.buildTree(root, toc);
		return root.children;
	}

	private buildTree(parent: MatlabSymbol, entries: TocEntry[]) {
		if (!entries.length) {
			return;
		}

		const entry = entries[0];
		const symbol = this.toDocumentSymbol(entry);
		symbol.children = [];

		while (parent && entry.level <= parent.level) {
			parent = parent.parent!;
		}
		parent.children.push(symbol);
		this.buildTree(
			{
				level: entry.level,
				children: symbol.children,
				parent
			},
			entries.slice(1)
		);
	}


	private toSymbolInformation(entry: TocEntry): vscode.SymbolInformation {
		return new vscode.SymbolInformation(
			this.getSymbolName(entry),
			entry.type,
			'',
			entry.location
		);
	}

	private toDocumentSymbol(entry: TocEntry) {
		return new vscode.DocumentSymbol(
			this.getSymbolName(entry),
			entry.token,
			entry.type,
			entry.location.range,
			entry.location.range
		);
	}

	private getSymbolName(entry: TocEntry): string {
		switch (entry.type) {
			case vscode.SymbolKind.String:
				return `%% ${entry.text}`;
				break;
			case vscode.SymbolKind.Function:
				return `${entry.text}()`;
				break;
			default:
				return entry.text;
				break;
		}
	}

	public getEntryText(symbol: vscode.SymbolInformation): string {
		switch (symbol.kind) {
			case vscode.SymbolKind.String:
				return symbol.name.substring(3);
				break;
			case vscode.SymbolKind.Function:
				return symbol.name.substring(0, symbol.name.length - 2);
				break;
			default:
				return symbol.name;
				break;
		}
	}
}
