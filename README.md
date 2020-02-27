# MATLAB for Visual Studio Code

This extension adds language support for MATLAB to Visual Studio Code.

[![Marketplace](https://vsmarketplacebadge.apphb.com/version-short/Gimly81.matlab.svg)](https://marketplace.visualstudio.com/items?itemName=Gimly81.matlab)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/Gimly81.matlab.svg)](https://marketplace.visualstudio.com/items?itemName=Gimly81.matlab)
[![GitHub issues](https://img.shields.io/github/issues/Gimly/vscode-matlab.svg)](https://github.com/Gimly/vscode-matlab/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/Gimly/vscode-matlab.svg)](https://github.com/Gimly/vscode-matlab/pulls)
[![License](https://img.shields.io/github/license/Gimly/vscode-matlab.svg)](https://github.com/Gimly/vscode-matlab/blob/master/LICENSE)

# Main features
## Colorization 
![syntax](images/syntax.png)

(imported from [MathWorks TextMate grammar](https://github.com/mathworks/MATLAB-Language-grammar))

## Snippets
![snippets](images/snippets.png)

(Translated from TextMate's snippets)

## Code Checking
Uses *mlint* for checking the MATLAB code for problems on save.
![snippets](images/linter.png)

## Usage
### Install the extension in VS Code
* Open the command palette using `Ctrl+Shift+P`
* Type `ext install Matlab` in the command palette

### Select MATLAB as a language
* On the bottom-right corner, click on the *select language mode* button, if you have created a new file it should display *Plain Text*
* Select *MATLAB* in the list of languages.

Alternatively, saving the file with a `.m` extension, will allow VS Code to understand that it is a MATLAB file, and automatically select the language correctly.

### Using snippets
* Bring-up the *autocomplete* menu by hitting the `Ctrl+Shift` key combination
* Select the snippet that you want to use in the list
* Use `tab` to navigate through the snippet's variables

### Setting-up linter
* Open the *User Settings* by going to *File*>*Preferences*>*User Settings*
* On the right pane, where you have the *settings.json* file open, add to the json file.

	`"matlab.mlintpath" : "path to your mlint.exe file"` 

	For example, on a PC : 
	
	`"matlab.mlintpath": "C:\\Program Files (x86)\\MATLAB\\R2012a\\bin\\win32\\mlint.exe"`
	
	And on a Mac :
	
	`"matlab.mlintpath": "/Applications/MATLAB_R2016a.app/bin/maci64/mlint"`
* Save your *settings.json* file
* Now, when you open a Matlab document (*.m*), VS Code displays warnings and errors. 
  
  **Remark:** If you don't want the *lint on save* option and you want to remove the error message being displayed when the extension activates, change the `matlab.lintOnSave` option in the settings file to `False`.

#### Setting the linter configuration
By adding `"matlab.linterConfig" : "path-to-linter-config-file"` to your VSCode configuration file, you can pass a configuration file to the mlint call. Check [Matlab's documentation](https://uk.mathworks.com/help/matlab/ref/mlint.html) to create this configuration file.

#### Setting the linter encoding
For some languages, like Chinese, the return of the linter is not using the default utf-8 encoding, but a different encoding (gb2312 for Chinese). If the linting doesn't show correctly, change the `matlab.linterEncoding` to the encoding used by your Windows console. For example, if your Windows is installed in Chinese, add `"matlab.linterEncoding" : "gb2312"` to your settings.json.

### Changing the default file association
Visual Studio Code's default file association for `.m` files is _Objective-C_, if you want to set up the default file association to be Matlab go to the Users preference (*File*>*Preferences*>*User Settings*) and add the following line:
```
"files.associations": {"*.m": "matlab"}
```

### Changing the default file encoding
MATLAB default file encoding is not utf-8, but Visual Studio Code is using utf-8 as default. The following setting specifies the default encoding for MATLAB files in Visual Studio Code:
````
"[matlab]": { "files.encoding": "windows1252" }
````
