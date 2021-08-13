'use strict';

import * as vscode from 'vscode';

export function isMatlabFile(document: vscode.TextDocument) {
	return document.languageId === 'matlab';
}
