# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-08-11

### Added
- Complete Result-based API with functional programming philosophy
- Elixir-style destructuring with `unwrap()` method
- `fromPromiseTuple()` helper for direct Promise-to-tuple conversion
- Comprehensive JSDoc documentation across entire codebase
- Result-based array utilities: `map`, `filter`, `reduce`, `head`, `tail`, `get`, `isEmpty`, `length`
- Result-based object utilities: `propResult`, `pickResult`, `omitResult`, `getPath`
- Function composition utilities: `compose`, `pipe`, `composeAsync`, `pipeAsync`
- Utility functions: `curry`, `tryCatch`, `fromPromise`, `all`

### Changed
- Unified API to exclusively use Result type for error handling
- Renamed composition functions to remove "Result" suffix for cleaner API
- Enhanced `fromPromise` with optional error handler parameter
- Improved TypeScript types and inference

### Removed
- Unsafe array and composition functions to maintain functional consistency

### Fixed
- All TypeScript compilation errors
- ES modules configuration issues
- Linting and formatting consistency

## [0.1.0] - Initial Release

### Added
- Basic project structure
- Core Result type implementation
- Initial array and object utilities
