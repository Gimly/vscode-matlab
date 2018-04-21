'use strict';

import vscode = require('vscode');
import fs = require('fs');
import { window, workspace, Uri } from 'vscode';
import path = require('path')
export class matlabFile {
    private functionSnippet = null;
    constructor() {
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

        console.log('New matlab function executed');
        let functionSaveOption: vscode.SaveDialogOptions = {
            saveLabel: 'Save Function',
            defaultUri: Uri.parse('file:myFunc.m'),
            filters: {
                'MatLab Files(.m)': ['m']
            }
        }
        let win = window.showSaveDialog(functionSaveOption).then(fileName => {
            if (fileName) {
                if (fs.existsSync(fileName.fsPath)) {
                    fs.unlinkSync(fileName.fsPath);
                    console.log('Deleted');
                } else {
                    console.log('Newly created');
                }
                this.matlabFunctionCreator(fileName);
            } else {
                console.log('Save cancel');
            }
        });
    }

    public dispose() {
        this.functionSnippet.dispose();
    }

    private matlabFunctionCreator(fileName: Uri) {
        // call if we are safe to create
        console.log(fileName.fsPath);
        workspace.openTextDocument(fileName.with({ scheme: 'untitled' })).then(document => {
            document.save().then(success => {
                if (success) {
                    console.log('Saved successful');
                    workspace.openTextDocument(fileName).then(doc => {
                        window.showTextDocument(doc).then(editor => {
                            editor.insertSnippet(this.functionSnippet, new vscode.Position(0, 0));
                        });
                        window.showInformationMessage('Function ' + path.basename(fileName.fsPath) + ' was created.');
                    })
                } else {
                    console.log('Saved failed');
                    window.showErrorMessage('Unable to save the document, please check your path \n' + fileName.toString());
                }
            });
        });
        console.log('Show dialog ' + fileName);
    }
}