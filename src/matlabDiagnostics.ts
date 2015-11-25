'use strict';

import vscode = require('vscode');
import path = require('path');

export interface ICheckResult {
	file: string;
	line: number;
	column: [number, number];
	msg: string;
	severity: string
}

export function check(filename: string, buildOnSave = true, lintOnSave = true) : Promise<ICheckResult> {
	var matlabBuild = !buildOnSave ? Promise.resolve([]) : new Promise((resolve, reject) => {
		
	});
	
	var matlabLint = !lintOnSave ? Promise.resolve([]) : new Promise((resolve, reject) => {
		
	});
	
	return Promise.all([matlabBuild, matlabLint]).then(resultSets => [].concat.apply([], resultSets));
}