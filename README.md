# MATLAB for Visual Studio Code

This extension adds support for MATLAB to VS Code, including:

## Colorization 
![syntax](images/syntax.png)

(imported from [Textmate's syntax](https://github.com/textmate/matlab.tmbundle))

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
* Use `tab` to navigate trough the snippet's variables

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

### Changing the default file association
Visual Studio Code's default file association for `.m` files is _Objective-C_, if you want to setup the default file associationt to be Matlab go to the Users preference (*File*>*Preferences*>*User Settings*) and add the following line:
```
"files.associations": {"*.m": "matlab"}
```