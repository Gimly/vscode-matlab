'use strict';

import * as vscode from 'vscode';
import { Disposable } from './util/dispose';
import { isMatlabFile } from './util/file';
import { Lazy, lazy } from './util/lazy';
import { MatlabDocumentSymbolProvider } from './documentSymbolProvider';
import { SkinnyTextDocument, SkinnyTextLine } from './textmateEngine';

export interface WorkspaceMatlabDocumentProvider {
	getAllMatlabDocuments(): Thenable<Iterable<SkinnyTextDocument>>;
	getMatlabDocument(resource: vscode.Uri): Thenable<SkinnyTextDocument | undefined>;

	readonly onDidChangeMatlabDocument: vscode.Event<SkinnyTextDocument>;
	readonly onDidCreateMatlabDocument: vscode.Event<SkinnyTextDocument>;
	readonly onDidDeleteMatlabDocument: vscode.Event<vscode.Uri>;
}

class VSCodeWorkspaceMatlabDocumentProvider extends Disposable implements WorkspaceMatlabDocumentProvider {

	private readonly _onDidChangeMatlabDocumentEmitter = this._register(new vscode.EventEmitter<SkinnyTextDocument>());
	private readonly _onDidCreateMatlabDocumentEmitter = this._register(new vscode.EventEmitter<SkinnyTextDocument>());
	private readonly _onDidDeleteMatlabDocumentEmitter = this._register(new vscode.EventEmitter<vscode.Uri>());

	private _watcher: vscode.FileSystemWatcher | undefined;

	async getAllMatlabDocuments() {
		const resources = await vscode.workspace.findFiles('**/*.m', '**/node_modules/**');
		const docs = await Promise.all(resources.map(doc => this.getMatlabDocument(doc)));
		return docs.filter(doc => !!doc) as SkinnyTextDocument[];
	}

    async getMatlabDocument(resource: vscode.Uri): Promise<SkinnyTextDocument | undefined> {
		const matchingDocuments = vscode.workspace.textDocuments.filter((doc) => doc.uri.toString() === resource.toString());
		if (matchingDocuments.length !== 0) {
			return matchingDocuments[0];
		}

		const bytes = await vscode.workspace.fs.readFile(resource);

		// We assume that matlab is in UTF-8
		const text = Buffer.from(bytes).toString('utf-8');

		const lines: SkinnyTextLine[] = [];
		const parts = text.split(/(\r?\n)/);
		const lineCount = Math.floor(parts.length / 2) + 1;
		for (let line = 0; line < lineCount; line++) {
			lines.push({
				text: parts[line * 2]
			});
		}

		return {
			uri: resource,
			version: 0,
			lineCount: lineCount,
			lineAt: (i) => {
				return lines[i];
			},
			getText: () => {
				return text;
			}
		};
	}

	public get onDidChangeMatlabDocument() {
		this.ensureWatcher();
		return this._onDidChangeMatlabDocumentEmitter.event;
	}

	public get onDidCreateMatlabDocument() {
		this.ensureWatcher();
		return this._onDidCreateMatlabDocumentEmitter.event;
	}

	public get onDidDeleteMatlabDocument() {
		this.ensureWatcher();
		return this._onDidDeleteMatlabDocumentEmitter.event;
	}

	private ensureWatcher(): void {
		if (this._watcher) {
			return;
		}

		this._watcher = this._register(vscode.workspace.createFileSystemWatcher('**/*.m'));

		this._watcher.onDidChange(async resource => {
			const document = await this.getMatlabDocument(resource);
			if (document) {
				this._onDidChangeMatlabDocumentEmitter.fire(document);
			}
		}, null, this._disposables);

		this._watcher.onDidCreate(async resource => {
			const document = await this.getMatlabDocument(resource);
			if (document) {
				this._onDidCreateMatlabDocumentEmitter.fire(document);
			}
		}, null, this._disposables);

		this._watcher.onDidDelete(async resource => {
			this._onDidDeleteMatlabDocumentEmitter.fire(resource);
		}, null, this._disposables);

		vscode.workspace.onDidChangeTextDocument(e => {
			if (isMatlabFile(e.document)) {
				this._onDidChangeMatlabDocumentEmitter.fire(e.document);
			}
		}, null, this._disposables);
	}
}

export class MatlabWorkspaceSymbolProvider extends Disposable implements vscode.WorkspaceSymbolProvider {
	private _symbolCache = new Map<string, Lazy<Thenable<vscode.SymbolInformation[]>>>();
	private _symbolCachePopulated: boolean = false;

	public constructor(
		private _symbolProvider: MatlabDocumentSymbolProvider,
		private _workspaceMatlabDocumentProvider: WorkspaceMatlabDocumentProvider = new VSCodeWorkspaceMatlabDocumentProvider()
	) {
		super();
	}

	public async provideWorkspaceSymbols(query: string): Promise<vscode.SymbolInformation[]> {
		if (!this._symbolCachePopulated) {
			await this.populateSymbolCache();
			this._symbolCachePopulated = true;

			this._workspaceMatlabDocumentProvider.onDidChangeMatlabDocument(this.onDidChangeDocument, this, this._disposables);
			this._workspaceMatlabDocumentProvider.onDidCreateMatlabDocument(this.onDidChangeDocument, this, this._disposables);
			this._workspaceMatlabDocumentProvider.onDidDeleteMatlabDocument(this.onDidDeleteDocument, this, this._disposables);
		}

		const allSymbolsSets = await Promise.all(Array.from(this._symbolCache.values(), x => x.value));
		const allSymbols = [].concat(...allSymbolsSets);
		return allSymbols.filter(symbolInformation => symbolInformation.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
	}

	public async populateSymbolCache(): Promise<void> {
		const matlabDocumentUris = await this._workspaceMatlabDocumentProvider.getAllMatlabDocuments();
		for (const document of matlabDocumentUris) {
			this._symbolCache.set(document.uri.fsPath, this.getSymbols(document));
		}
	}

	private getSymbols(document: SkinnyTextDocument): Lazy<Thenable<vscode.SymbolInformation[]>> {
		return lazy(async () => {
			return this._symbolProvider.provideDocumentSymbolInformation(document);
		});
	}

	private onDidChangeDocument(document: SkinnyTextDocument) {
		this._symbolCache.set(document.uri.fsPath, this.getSymbols(document));
	}

	private onDidDeleteDocument(resource: vscode.Uri) {
		this._symbolCache.delete(resource.fsPath);
	}
}
