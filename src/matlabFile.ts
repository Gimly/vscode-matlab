'use strict';

import vscode = require('vscode');
import fs = require('fs');
import { window, workspace, Uri } from 'vscode';
import path = require('path')
export class matlabFileWatcher {
    private watcher = null;
    // private cancel = null;
    private functionSnippet = null;
    constructor() {
        this.watcher = workspace.createFileSystemWatcher('**/*.m', false, true, true);
        // this.cancel = new vscode.CancellationTokenSource();
        this.watcher.onDidCreate(function (args) {
            console.log('Inside ' + this.watcher);
            console.log('Created file' + args);
        });
        this.functionSnippet = new vscode.SnippetString(
            "function [ ${1:output} ] = ${TM_FILENAME_BASE}(${2:input})\n" +
            "%${TM_FILENAME_BASE} - ${3:Description}\n" +
            "%\n" +
            "% Syntax: $1 = ${TM_FILENAME_BASE}($2)\n" +
            "%\n" +
            "% ${4:Long description}\n" +
            "\t$0\n" +
            "end\n"
        );
    }

    public newMatlabFunction() {

        const option: vscode.InputBoxOptions = {
            ignoreFocusOut: true,
            prompt: 'Please type your function name.',
            value: 'myFunc.m',
            valueSelection: [0, 6]
        }

        console.log('New matlab function executed');
        // console.log('Show input box it returns ' + fileName);
        // create file and put content
        // let rootPath = workspace.workspaceFolders[0].uri.fsPath;
        // const newFile = vscode.Uri.parse('untitled:' + fileName);
        // console.log(rootPath);
        let functionSaveOption: vscode.SaveDialogOptions = {
            saveLabel: 'Save Function',
            defaultUri: Uri.parse('file:myFunc.m'),
            filters: {
                'MatLab Files(.m)': ['m']
            }
        }
        let win = vscode.window.showSaveDialog(functionSaveOption).then(fileName => {
            
            if (fileName) {
                if (fs.existsSync(fileName.fsPath)) {
                    fs.unlink(fileName.fsPath, () => {
                        console.log('Deleted');
                        this.matlabFunctionCreator(fileName);
                    });
                } else {
                    console.log('Newly created');
                    this.matlabFunctionCreator(fileName);
                }

            } else {
                console.log('Save cancel');
            }
        });
        // let fd = fs.openSync(path[0].name + '\\' + fileName, 'a');
        // fs.closeSync(fd);
        // let newFile = vscode.workspace.openTextDocument(Uri.file(fileName));
        // let editor = newFile.then(document => window.showTextDocument(document));
    }

    public dispose() {
        this.watcher.dispose();
        // this.cancel.dispose();
    }

    private matlabFunctionCreator(fileName: Uri) {
        // call if we are safe to create
        console.log(fileName.fsPath);
        vscode.workspace.openTextDocument(fileName.with({ scheme: 'untitled' })).then(document => {
            let edit = vscode.window.showTextDocument(document);
            edit.then(editor => {
                console.log('Document shown succeeded');
                document.save().then(success => {
                    if (success) {
                        console.log('Saved successful');
                        window.showTextDocument(fileName).then(iEditor => {
                            iEditor.insertSnippet(this.functionSnippet, new vscode.Position(0, 0));
                        });
                        window.showInformationMessage('Function ' + fileName.fragment + ' was created.');
                    } else {
                        console.log('Saved failed');
                        window.showErrorMessage('Unable to save the document, please check your path \n' + fileName.toString());
                    }
                });
            });
        });
        console.log('Show dialog ' + fileName);
    }
}


// export function newMatlabFunction() {
    //cmd.then(() => {
    //let cmd = vscode.commands.executeCommand('explorer.newFile');
    //})
    // vscode.window.showInformationMessage('Hello, new Function created');
    // let newFile = vscode.workspace.openTextDocument({language:'matlab',content:'function'})
    // newFile.then(document => vscode.window.showTextDocument(document));
    // const options: vscode.OpenDialogOptions = {
    // 	canSelectMany: false,
    // 	openLabel: 'Open',
    // }
    // vscode.window.showOpenDialog(options);
    // const options: vscode.SaveDialogOptions = {
    // }
    // let win = vscode.window.showSaveDialog(options);
    // let newDoc = vscode.workspace.openTextDocument({language:'matlab'});
    // vscode.window.showTextDocument(vscode.Uri.file('abc.m'));
    // watcher.dispose();
    // vscode.workspace.onDidOpenTextDocument(function (event) {
    //     console.log('New Event' + event.getText());
    // });
// }