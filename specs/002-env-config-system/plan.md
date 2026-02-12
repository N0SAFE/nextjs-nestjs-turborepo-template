# Implementation Plan: Environment Configuration Management System

**Branch**: `002-env-config-system` | **Date**: 2025-11-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-env-config-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a bullet-proof, plugin-based environment configuration system that generates `.env` files from YAML templates using a pipe-based syntax. The system supports three execution modes (interactive prompts, CLI arguments, CI strict mode), comprehensive validation with error aggregation, nested property syntax via dot notation, JSON-like complex values, and hybrid plugin discovery (auto-discover + explicit API). Core focus: type safety, error handling, edge case coverage, and robust validation at every layer to prevent runtime failures.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) with Bun 1.2.14+ runtime
**Architecture**: NestJS modular architecture with nest-commander (follows apps/api/cli pattern)
**Primary Dependencies**: 
- Framework: `@nestjs/common`, `@nestjs/core`, `reflect-metadata` (dependency injection, modularity)
- CLI: `nest-commander` (integrates Commander.js with NestJS via decorators and CommandRunner pattern)
- YAML parsing: `yaml` (selected for better TypeScript support and modern API)
- Interactive prompts: `@inquirer/prompts` or `prompts` (supports select, multiselect, toggle, number, string, autocomplete)
- Validation: Zod for schema validation (aligns with existing monorepo patterns)
- Plugin system: NestJS providers with dynamic module imports for custom plugins

**Storage**: File system only (read YAML templates, write `.env` files, discover plugins from conventional directory)

**Testing**: Vitest (inheriting from `@repo/vitest-config`) with comprehensive coverage:
- Unit tests for parser, validators, transformers
- Integration tests for CLI execution modes
- Contract tests for plugin interfaces
- Edge case tests for circular references, malformed YAML, plugin errors

**Target Platform**: Cross-platform CLI (Linux, macOS, Windows) - Node.js/Bun compatible

**Project Type**: Shared package in monorepo (`packages/env-config/`) - standalone CLI tool

**Performance Goals**: 
- Parse 500+ variable templates in <1 second
- Generate `.env` file in <2 seconds for 100 variables
- Plugin discovery in <500ms
- Interactive prompts responsive (<100ms per keystroke)

**Constraints**: 
- Zero external API dependencies (fully offline-capable)
- No database required (all configuration in YAML)
- Must work in CI environments (non-interactive mode)
- Plugin errors must not crash main process (isolated execution)
- Type safety enforced at compile-time (no runtime type coercion)

**Scale/Scope**: 
- Support 500+ variables per template without performance degradation
- 50+ custom plugins loadable simultaneously
- Nested property depth up to 5 levels (e.g., `prompt.validation.rules.pattern`)
- Template files up to 10MB size

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Constitution Context

**Note**: This constitution was designed for Next.js/NestJS web applications in this template. As the first standalone CLI package, only universal principles (type safety, testing, documentation) apply. Web-specific principles (ORPC, routing, UI frameworks) are not applicable to CLI tools.

### Principle I: End-to-End Type Safety via ORPC
**Status**: ✅ NOT APPLICABLE (CLI tool, no API communication)
**Rationale**: This package is a standalone CLI tool for environment configuration, not a web service. No API contracts needed. ORPC is a web API pattern and does not apply to command-line tools.

### Principle II: Monorepo Discipline via Turborepo & Workspace References
**Status**: ✅ COMPLIANT
**Implementation**:
- Package location: `packages/env-config/` (shared package)
- Workspace reference: Will be used by other packages/apps as `"@repo/env-config": "*"`
- Dependencies: All internal refs use workspace `"*"` notation
- Clear separation: Standalone tool, no circular dependencies
- TypeScript configs: Extends from `@repo/tsconfig`

### Principle III: Docker-First Development & Deployment  
**Status**: ✅ COMPLIANT
**Implementation**:
- CLI tool can run in Docker containers for consistency
- No running services required (stateless execution)
- Compatible with `bun run` commands from monorepo root
- Can be executed inside Docker dev containers for testing

### Principle IV: Centralized Testing via Vitest & Unified Coverage
**Status**: ✅ COMPLIANT
**Implementation**:
- Test config: Inherits from `@repo/vitest-config`
- Test location: `packages/env-config/__tests__/` (colocated)
- Coverage: Participates in merged coverage via `bun run test:coverage`
- Minimum coverage target: 90% for critical validation/parsing logic

### Principle V: Declarative Routing & Type-Safe Navigation
**Status**: ✅ NOT APPLICABLE (CLI tool, no web routing)
**Rationale**: This is a command-line tool with no web interface or routing requirements.

### Principle VI: Shared UI Component Library with Shadcn
**Status**: ✅ NOT APPLICABLE (CLI tool, no UI components)
**Rationale**: This package provides terminal-based prompts only, no React components.

### Principle VII: Documentation-First Workflow
**Status**: ✅ COMPLIANT
**Implementation**:
- Specification created BEFORE implementation (this document)
- README.md will document API, CLI usage, plugin development
- Examples directory with common use cases
- Plugin development guide in docs/
- Updates to parent README when package is ready

**GATE RESULT**: ✅ **PASS** - No principle violations. Package aligns with monorepo standards as a shared CLI utility.

## Project Structure

### Documentation (this feature)

```
specs/002-env-config-system/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output - technology choices, patterns
├── data-model.md        # Phase 1 output - entities, relationships, schemas
├── quickstart.md        # Phase 1 output - setup guide, usage examples
├── contracts/           # Phase 1 output - plugin interfaces, type definitions
└── tasks.md             # Phase 2 output - NOT created by /speckit.plan
```

### Source Code (repository root)

```
packages/env-config/
├── package.json                    # Package manifest with CLI bin entry
├── tsconfig.json                   # Extends @repo/tsconfig/base.json
├── vitest.config.ts                # Extends @repo/vitest-config
├── README.md                       # Comprehensive usage guide
│
├── src/
│   ├── index.ts                    # Public API exports
│   ├── cli.ts                      # CLI entry point (commander/yargs)
│   │
│   ├── core/
│   │   ├── parser.ts               # YAML template parser with nested property support
│   │   ├── validator.ts            # Validation orchestrator (error aggregation)
│   │   ├── generator.ts            # .env file generator
│   │   ├── plugin-loader.ts        # Hybrid plugin discovery (auto + explicit)
│   │   └── error-handler.ts        # Centralized error collection & reporting
│   │
│   ├── models/
│   │   ├── template.ts             # YAML template representation
│   │   ├── variable-definition.ts  # Variable entity with nested params
│   │   ├── plugin.ts               # Plugin interface & base classes
│   │   └── validation-result.ts    # Validation error aggregation types
│   │
│   ├── parsers/
│   │   ├── yaml-parser.ts          # YAML file parsing
│   │   ├── pipe-syntax-parser.ts   # Pipe syntax with dot notation support
│   │   └── json-value-parser.ts    # JSON-like value parsing
│   │
│   ├── validators/
│   │   ├── base-validator.ts       # Abstract validator class
│   │   ├── string-validator.ts     # String validation (min, max, pattern)
│   │   ├── number-validator.ts     # Number validation (min, max, range)
│   │   ├── boolean-validator.ts    # Boolean validation
│   │   └── url-validator.ts        # URL validation (protocols, format)
│   │
│   ├── transformers/
│   │   ├── base-transformer.ts     # Abstract transformer class
│   │   ├── truncate.ts             # Truncate transformation
│   │   ├── concat.ts               # Concatenation transformation
│   │   └── reference.ts            # Reference plugin (variable derivation)
│   │
│   ├── prompts/
│   │   ├── prompt-factory.ts       # Factory for creating typed prompts
│   │   ├── select-prompt.ts        # Select input type
│   │   ├── multiselect-prompt.ts   # Multiselect input type
│   │   ├── toggle-prompt.ts        # Toggle/boolean input type
│   │   ├── number-prompt.ts        # Number input type with validation
│   │   ├── string-prompt.ts        # String input type
│   │   └── autocomplete-prompt.ts  # Autocomplete input type
│   │
│   └── lib/
│       ├── circular-ref-detector.ts    # Detect circular variable references
│       ├── file-writer.ts              # Safe .env file writing with backups
│       └── escape-utils.ts             # Special character escaping
│
├── __tests__/
│   ├── unit/
│   │   ├── parser.test.ts              # YAML & pipe syntax parsing tests
│   │   ├── validators/*.test.ts        # Validator unit tests
│   │   ├── transformers/*.test.ts      # Transformer unit tests
│   │   └── circular-ref.test.ts        # Circular reference detection tests
│   │
│   ├── integration/
│   │   ├── cli-interactive.test.ts     # Interactive mode end-to-end
│   │   ├── cli-arguments.test.ts       # Argument mode end-to-end
│   │   ├── cli-ci-mode.test.ts         # CI mode end-to-end
│   │   └── plugin-loading.test.ts      # Hybrid plugin discovery tests
│   │
│   └── fixtures/
│       ├── templates/                  # Sample YAML templates
│       ├── plugins/                    # Test custom plugins
│       └── expected-outputs/           # Expected .env files
│
└── examples/
    ├── basic-template.yml              # Simple example
    ├── advanced-template.yml           # Complex with transformations
    ├── custom-plugin/                  # Example custom plugin
    └── ci-integration/                 # CI/CD usage example
```

**Structure Decision**: Standalone shared package structure chosen because:
- Self-contained CLI tool with no web/API dependencies
- Clear separation of concerns: parsers, validators, transformers, prompts, core orchestration
- Plugin system isolated in separate directory for discovery
- Comprehensive test coverage with unit + integration tests
- Examples directory for user onboarding

## Complexity Tracking

**Status**: ✅ No violations requiring tracking

**Analysis**: All constitution principles validated in Constitution Check section. Package aligns with monorepo standards, testing patterns, and documentation-first workflow. No complexity concerns identified.

