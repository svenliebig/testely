# Changelog

All notable changes to the "testely" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-12-06

### Added

- Implemented the root test folder flat strategy for TypeScript projects

### Fixed

- Fixed premature breaking in project resolving to actually find the most likely project
- Fixed function not returning after opening source file, which would in theory open the test as well

### Changed

- Renamed `assureDir` to `ensureDir` to align with standard naming conventions
- Renamed `likelyness` to `likelihood` for correct grammar
- Refactored file utils to use promises and better naming

## [0.0.2] - 2025-12-06

### Fixed

- Fixed `showDocument` not being able to open Cursor AI created documents with `openTextDocument`
- Fixed configuration only being written into workspace when the user does not have user settings

### Changed

- Refactored code to be more concrete when creating a new file
- Refactored logging and telemetry implementation

## [0.0.1] - 2025-12-03

- Initial release of Testely, only supporting TypeScript.