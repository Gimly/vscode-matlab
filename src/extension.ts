'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { commands, window, workspace, InputBoxOptions } from 'vscode';
import { TextmateEngine } from './textmateEngine';
import { MatlabDocumentSymbolProvider } from './documentSymbolProvider';
import { MatlabFoldingProvider } from './foldingProvider';
import PeekDefinitionProvider from './peekDefinitionProvider';
import { MatlabWorkspaceSymbolProvider } from './workspaceSymbolProvider';
import { check, ICheckResult } from './matlabDiagnostics';
let diagnosticCollection: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Activating extension Matlab');

	const selector: vscode.DocumentSelector = { language: 'matlab', scheme: 'file' };
	const engine: TextmateEngine = new TextmateEngine();
	const documentSymbolProvider = new MatlabDocumentSymbolProvider(engine);
	const foldingProver = new MatlabFoldingProvider(engine);
	const workspaceSymbolProvider = new MatlabWorkspaceSymbolProvider(documentSymbolProvider);
	const peekFileDefinitionProvider = new PeekDefinitionProvider(documentSymbolProvider);

	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, documentSymbolProvider));
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(selector, foldingProver));
	context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(['matlab'], peekFileDefinitionProvider));

	var matlabConfig = workspace.getConfiguration('matlab');

	if (!matlabConfig['lintOnSave']) {
		return;
	}

	if (!matlabConfig.has('mlintpath') || matlabConfig['mlintpath'] == null) {
		window.showErrorMessage('Could not find path to the mlint executable in the configuration file.')
		return;
	}

	var mlintPath = matlabConfig['mlintpath'];

	if (!fs.existsSync(mlintPath)) {
		window.showErrorMessage('Cannot find mlint at the given path, please check your configuration file.')
		return;
	}

	diagnosticCollection = vscode.languages.createDiagnosticCollection('matlab');
	context.subscriptions.push(diagnosticCollection);

	context.subscriptions.push(workspace.onDidSaveTextDocument(document => { lintDocument(document, mlintPath) }));
	context.subscriptions.push(workspace.onDidOpenTextDocument(document => { lintDocument(document, mlintPath) }));

	// Run mlint on any open documents since our onDidOpenTextDocument callback won't be hit for those
	workspace.textDocuments.forEach(document => lintDocument(document, mlintPath));

}

function lintDocument(document: vscode.TextDocument, mlintPath: string) {

	function mapSeverityToVSCodeSeverity(sev: string) {
		switch (sev) {
			case 'error': return vscode.DiagnosticSeverity.Error;
			case 'warning': return vscode.DiagnosticSeverity.Warning;
			default: return vscode.DiagnosticSeverity.Error;
		}
	}

	if (document.languageId != 'matlab' || document.uri.scheme != 'file') {
		return;
	}

	let matlabConfig = vscode.workspace.getConfiguration('matlab');

	check(document, matlabConfig['lintOnSave'], mlintPath).then(errors => {
		diagnosticCollection.delete(document.uri);

		let diagnosticMap: Map<vscode.Uri, vscode.Diagnostic[]> = new Map();;

		errors.forEach(error => {
			let targetUri = vscode.Uri.file(error.file);

			var line = error.line - 1;
			if (line < 0) line = 0;

			var startColumn = error.column[0] - 1;
			if (startColumn < 0) startColumn = 0;

			var endColumn = error.column[1];

			let range = new vscode.Range(line, startColumn, line, endColumn);
			let diagnostic = new vscode.Diagnostic(range, error.msg, mapSeverityToVSCodeSeverity(error.severity));

			let diagnostics = diagnosticMap.get(targetUri);
			if (!diagnostics) {
				diagnostics = [];
			}

			diagnostics.push(diagnostic);
			diagnosticMap.set(targetUri, diagnostics);
		});

		let entries: [vscode.Uri, vscode.Diagnostic[]][] = [];
		diagnosticMap.forEach((diags, uri) => {
			entries.push([uri, diags]);
		});

		diagnosticCollection.set(entries);
	}).catch(err => {
		vscode.window.showErrorMessage(err);
	});
}
