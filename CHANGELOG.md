# Change Log

All notable changes to the "matlab" extension will be documented in this file.

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
