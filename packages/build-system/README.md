# @repo/build-system

A monorepo build orchestration package that provides a consistent, type-safe interface for building workspace packages with support for multiple builders (bun, esbuild, tsc, rollup).

## Features

- 🚀 **Unified Build Interface**: Single CLI and programmatic API for all package builds
- 🔐 **Per-package Locking**: Prevents concurrent builds from corrupting outputs
- ⚡ **Multiple Builders**: Supports Bun (default), esbuild, TypeScript compiler, and Rollup
- 📦 **Artifact Discovery**: Automatic discovery and checksumming of build artifacts
- 🎯 **Type-safe Configuration**: TypeScript-first configuration with runtime validation
- 📊 **Structured Results**: Machine-readable JSON output for CI/CD integration

## Documentation

See the specification for complete details: `specs/002-build-package-handler/spec.md`

## License

UNLICENSED
