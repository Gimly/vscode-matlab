# Change Log
All notable changes to the "matlab" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.9.0]
- Added option to add configuration settings for the linter. The configuration file is setup by adding mlint.linterConfig to the VSCode configuration file and passing the path to the linter config file.
- Fixes the auto indent capabilities, if, else, and most other keywords should correctly indent and remove indentation
- Improved the block comments capabilites, they are now correctly created (a bug still exists for removing them). Thanks to [CelsoReys](https://github.com/CelsoReyes) for the proposal.

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
