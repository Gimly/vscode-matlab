'use strict';

import vscode = require('vscode');

export class MatlabDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken): vscode.SymbolInformation[] {

        const _functionPattern = /function *(?:(?:(?:\[[ \w,]+\])|(?:\w+)) *= *)?(?:\w.?)+ *\(.*?\)/;

        const result: vscode.SymbolInformation[] = [];

        for (let line = 0; line < document.lineCount; line++) {
            const { text } = document.lineAt(line);

            if (!text.startsWith("%") && _functionPattern.test(text)) {
                result.push(
                    new vscode.SymbolInformation(
                        text, 
                        vscode.SymbolKind.Function,
                        '',
                        new vscode.Location(document.uri, new vscode.Position(line, 0))
                    ));
            }
        }

        return result;
    }
}
