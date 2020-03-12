'use strict';

import vscode = require('vscode');
import { isUndefined } from 'util';

export default class PeekFileDefinitionProvider implements vscode.DefinitionProvider {

  constructor() {}

  getComponentName(position: vscode.Position): String[] {
    const doc = vscode.window.activeTextEditor.document;
    const selection = doc.getWordRangeAtPosition(position);
    const selectedText = doc.getText(selection);
    let possibleFileNames = [];
    possibleFileNames.push(selectedText + '.m');
    return possibleFileNames;
  }

  getNestedFuncPosition(position: vscode.Position): number[] {
    const doc = vscode.window.activeTextEditor.document;
    const selection = doc.getWordRangeAtPosition(position);
    const selectedText = doc.getText(selection);

    for (let lineNb = 0; lineNb < doc.lineCount; lineNb ++) {
      const txtLine = doc.lineAt(lineNb);
      if (!txtLine.isEmptyOrWhitespace) {
        const content = txtLine.text;
        const Colfunc = content.indexOf('function ');
        const ColName = content.indexOf(selectedText);
        if (Colfunc != -1 && ColName != -1) {
          return [lineNb, Colfunc];
        }
      }
    }
    return [];
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
    const posInFile = this.getNestedFuncPosition(position);
    return searchPromises.then((paths) => {
      filePaths = [].concat.apply([], paths);
      if (filePaths.length) {
        console.log(posInFile)
        let allPaths = [];
        filePaths.forEach(filePath => {
          allPaths.push(new vscode.Location(vscode.Uri.file(`${filePath.path}`),new vscode.Position(0,1) ))
        });
        return allPaths;
      } else {
        if (posInFile.length) {
          let allPaths = [];
          allPaths.push(new vscode.Location(document.uri,new vscode.Position(posInFile[0],posInFile[1])));
          return allPaths;
        } else {
          return undefined;
        }
      }
    }, (reason) => {
      return undefined;
    });
  }
}