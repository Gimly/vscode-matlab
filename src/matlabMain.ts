'use strict';

import vscode = require('vscode'); 

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log("Activating extension Matlab");

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('matlab.build', () => {
				
		var matlabConfig = vscode.workspace.getConfiguration('matlab');
		
		if (!matlabConfig.has('matlab.path') || matlabConfig.get('matlab.path') == null) {
			vscode.window.showErrorMessage("Could not find Matlab path in configuration.");
			return;
		}
		
		
	});
	
	context.subscriptions.push(disposable);
}