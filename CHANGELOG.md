# Change Log

## [3.0.2]
- Name change
- Update README

## [3.0.1]
Fixes missing grammar

## [3.0.0]

- Browser support for editor language features.
- Update vscode-textmate-languageservice to 1.1.0.
- Large performance optimization in folding provider indentation and header algorithms.

## [2.3.1]

Fix performance regressions
- Update vscode-textmate-languageservice to 0.2.1
- Enable extension for Markdown
- Remove unsupported wildcard scope selector

## [2.3.0]

- Updates the Matlab syntax, for extended function definition syntax and superclass method `@` operator.
- Update the VS Code Textmate service API to the latest version with multiple bugfixes and optimisati
- Add injection grammar for Matlab code block highlighting in Markdown files.

## [2.2.1]

- Remove `node_modules` from `.vscodeignore`.
- Add a GitHub Actions to automate the deployment.

## [2.1.0]

- Add injection grammars for packages, validation and overloads
- Add dynamic language providers
    - Table of Contents / outline provider
    - Document symbol provider for all entity symbols
    - Folding provider
    - Peek definition provider for all entity symbols
    - Workspace symbol provider
Thanks a lot to [SNDST00M](https://github.com/SNDST00M) for the great work on all that.

## [2.0.1]

- Fix a security issue linked to the scope of the Matlab lint configuration. Those configuration settings are now defined at
the machine level and cannot be overriden by workspace settings.

## [2.0.0]

- New functionality thanks to [Robin Tournemenne](https://github.com/RobinTournemenne) which adds the Go to definition functionality.

## [1.6.0]

- Updates the Matlab syntax to the latest version. Fixes issue with varargin transposed and triple dot coloration.
- Adds differenciation between linter errors and warnings. Thanks a lot to [Robin Tournemenne](https://github.com/RobinTournemenne) for his awesome work.

## [1.4.2]

- Update the Matlab syntax, fix issues with color highlightings in
  if statements and event block in class.

## [1.4.1]

- Update the Matlab syntax, fix an issue with end of line comment.

## [1.4.0]

- Support for function argument validation. Matlab now supports function argument validation (see https://www.mathworks.com/help/matlab/ref/arguments.html). This new version adds coloration support for it through an update from the official syntax.

## [1.3.0]

- Updates to the latest version of the official [Mathworks matlab syntax](https://github.com/mathworks/MATLAB-Language-grammar)

## [1.2.0]

- Fixes a few issues linked to the linter and improve performances
- Add properties, methods, events, and enumeration to intent patterns
- Run mlint on already opened files when activating extension
Thanks again to [Ryan Livingston](https://github.com/rlivings39) for the great work.

## [1.1.0]

- Fixes the functions highlighting that were removed in version 1.0 when switching to Matlab's official syntax.
- Updates to a more recent version of Matlab's official syntax that should fix a few highlighting issue.

## [1.0.0]

- Switches the syntax highlighting to the official [Mathworks Matlab syntax](https://github.com/mathworks/MATLAB-Language-grammar). It should greatly improve the syntax highlighting and fix most (hopefully all) issues that were related to it. Thanks to [rlivings39](https://github.com/rlivings39) for the PR.

## [0.9.0]

- Added option to add configuration settings for the linter. The configuration file is setup by adding mlint.linterConfig to the VSCode configuration file and passing the path to the linter config file.
- Fixes the auto indent capabilities, if, else, and most other keywords should correctly indent and remove indentation
- Improved the block comments capabilites, they are now correctly created (a bug still exists for removing them). Thanks to [CelsoReyes](https://github.com/CelsoReyes) for the proposal.

## [0.8.1]

- Fixed missing AddParameter function highlighting (thanks to [sco1](https://github.com/sco1))
- Added integer tag support to the printf syntax (thanks to [otaithleigh](https://github.com/otaithleigh))

## [0.8.0]

- Added the `-all` flag to the linter so that it displays all comments. (thanks to [jeroendv](https://github.com/jeroendv) for the help)
- Fixed go to symbol hanging or breaking for certain functions with long name
- Adds the symbols even if the linter isn't setup

## [0.7.1]

### Fixed

- Really fixed the linting character encoding issue! Thanks a lot to my awesome testers for helping fixing that issue.

## [0.7.0]

### Added

- Added support for Go To Symbol in a document, hit `Ctrl+Shift+O` to get the list of symbols in the document.

### Changed

- Fixed (hopefully) the issue with the linting encoding. Added a parameter to set the encoding of the linter.

## [0.6.0]

### Changed

- Fixed the block comments
- Fixed the getter and setters syntax highlighting
