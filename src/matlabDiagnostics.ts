'use strict';

import vscode = require('vscode');
import path = require('path');
import cp = require('child_process');
import iconv = require('iconv-lite');
import { ERROR_IDS } from './errorsId';

import { window } from 'vscode';

export interface ICheckResult {
  file: string;
  line: number;
  column: [number, number];
  msg: string;
  severity: string
}

export function check(document: vscode.TextDocument, lintOnSave = true, mlintPath = ""): Promise<ICheckResult[]> {
  var matlabLint = !lintOnSave ? Promise.resolve([]) : new Promise((resolve, reject) => {
    var filename = document.uri.fsPath;

    let matlabConfig = vscode.workspace.getConfiguration('matlab');

    let args: string[] = ['-all', '-id'];
    if (matlabConfig.has('linterConfig') && matlabConfig['linterConfig'] != null) {
      args.push(`-config=${matlabConfig['linterConfig']}`);
    }

    args.push(filename);

    let fileEncoding = 'utf8';
    if (matlabConfig.has('linterEncoding') && matlabConfig['linterEncoding'] != null) {
      fileEncoding = matlabConfig['linterEncoding'];
    }

    cp.execFile(
      mlintPath,
      args,
      { encoding: 'buffer' },
      (err: Error, stdout, stderr) => {
        try {
          let errorsString = iconv.decode(stderr, fileEncoding);

          var errors = errorsString.split('\n');

          var ret: ICheckResult[] = [];

          errors.forEach(error => {
            var regex = /L (\d+) \(C (\d+)-?(\d+)?\): (\S+): (.*)/;
            var match = regex.exec(error);

            if (match != null) {
              var [_, lineStr, startCol, endCol, idErrorWarn, msg] = match;
              var line = +lineStr;

              if (endCol == null) {
                endCol = startCol;
              }

              if (ERROR_IDS.includes(idErrorWarn)) {
                ret.push({ file: filename, line, column: [+startCol, +endCol], msg, severity: "error" });
              }
              else {
                ret.push({ file: filename, line, column: [+startCol, +endCol], msg, severity: "warning" });
              }
            }
          });

          resolve(ret);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
  });

  return Promise.all([matlabLint]).then(resultSets => [].concat.apply([], resultSets));
}
