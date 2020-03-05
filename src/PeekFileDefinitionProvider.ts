'use strict';

import vscode = require('vscode');
import { isUndefined } from 'util';

export default class PeekFileDefinitionProvider implements vscode.DefinitionProvider {
  targetFileExtensions: string[] = [];

  constructor(targetFileExtensions: string[] = []) {
    this.targetFileExtensions = targetFileExtensions;
  }

  getComponentName(position: vscode.Position): String[] {
    const doc = vscode.window.activeTextEditor.document;
    const selection = doc.getWordRangeAtPosition(position);
    const selectedText = doc.getText(selection);
    let possibleFileNames = [];
    possibleFileNames.push(selectedText + '.m');
    return possibleFileNames;
  }

  searchFilePath(fileName: String): Thenable<vscode.Uri[]> {
    return vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules'); // Returns promise
  }

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location | vscode.Location[]> {
    
    let filePaths = [];
    const componentNames = this.getComponentName(position);
    const searchPathActions = componentNames.map(this.searchFilePath);
    const searchPromises = Promise.all(searchPathActions); // pass array of promises

    return searchPromises.then((paths) => {
      filePaths = [].concat.apply([], paths);
      if (filePaths.length) {
        let allPaths = [];
        filePaths.forEach(filePath => {
          allPaths.push(new vscode.Location(vscode.Uri.file(`${filePath.path}`),new vscode.Position(0,1) ))
        });
        return allPaths;
      } else {
        return undefined;
      }
    }, (reason) => {
      return undefined;
    });
  }
}