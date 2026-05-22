---
description: "Implementation tasks for Environment Configuration System"
---

# Tasks: Environment Configuration System

**Input**: Design documents from `/specs/002-env-config-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested in specification - test tasks omitted per constitution

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Paths use `packages/env-config/` prefix per plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create package structure `packages/env-config/` with `src/`, `src/cli/`, `src/modules/`, `__tests__/`, `examples/`, `README.md`, `package.json`
- [ ] T002 Initialize TypeScript project with strict mode and decorators in `packages/env-config/tsconfig.json` (enable `experimentalDecorators`, `emitDecoratorMetadata`)
- [ ] T003 [P] Install NestJS dependencies (@nestjs/common, @nestjs/core, nest-commander, reflect-metadata) in `packages/env-config/package.json`
- [ ] T004 [P] Install other dependencies (yaml, @inquirer/prompts, zod) in `packages/env-config/package.json`
- [ ] T005 [P] Configure Vitest testing framework in `packages/env-config/vitest.config.ts`
- [ ] T006 [P] Setup ESLint and Prettier for code quality in `packages/env-config/.eslintrc.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**FR-002, FR-015, FR-018**: Result monad, error hierarchy, type system foundation, NestJS module setup

- [ ] T007 [P] Implement Result<T,E> monad with map/bind/combine/traverse in `packages/env-config/src/core/result.ts`
- [ ] T008 [P] Create ErrorCode enum (24 codes: YAML_*, VAR_*, PLUGIN_*, CIRCULAR_*, TRANSFORM_*) in `packages/env-config/src/core/error-codes.ts`
- [ ] T009 [P] Implement ValidationError with source location tracking in `packages/env-config/src/core/validation-error.ts`
- [ ] T010 [P] Create ResultOps helper class (ok, fail, combine operations) in `packages/env-config/src/core/result-ops.ts`
- [ ] T011 [P] Define ValidatorType, TransformerType, ExecutionMode enums in `packages/env-config/src/core/types.ts`
- [ ] T012 Create VariableDefinition interface aligned with data-model.md entity 1 in `packages/env-config/src/models/variable-definition.ts`
- [ ] T013 [P] Create IValidator interface (meta, type, validate, getSchema) in `packages/env-config/src/core/interfaces/validator.interface.ts`
- [ ] T014 [P] Create ITransformer interface (meta, name, transform, getSchema) in `packages/env-config/src/core/interfaces/transformer.interface.ts`
- [ ] T015 [P] Create IPluginRegistry interface per data-model.md entity 7 in `packages/env-config/src/core/interfaces/plugin-registry.interface.ts`
- [ ] T016 Create CLIModule root module in `packages/env-config/src/cli/cli.module.ts` (imports all feature modules)
- [ ] T017 Create CLI entry point using CommandFactory in `packages/env-config/src/cli.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Generate .env from YAML template (Priority: P1) 🎯 MVP

**Goal**: Parse YAML template, extract variable definitions, generate .env file

**Independent Test**: Run CLI with basic template → produces valid .env file with KEY=value format

**FR-001, FR-003a**: YAML parsing with nested properties, basic execution mode

**Entities**: Template (4), Variable Definition (1), Configuration (5)

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create Template entity model aligned with data-model.md entity 4 in `packages/env-config/src/models/template.ts`
- [ ] T019 [P] [US1] Create Configuration entity model aligned with data-model.md entity 5 in `packages/env-config/src/models/configuration.ts`
- [ ] T020 [US1] Create ParserModule in `packages/env-config/src/modules/parser/parser.module.ts`
- [ ] T021 [US1] Implement YamlParser injectable service using `yaml` library in `packages/env-config/src/modules/parser/yaml-parser.service.ts`
- [ ] T022 [US1] Add YAML error handling (non-throwing) with structured error collection in `packages/env-config/src/modules/parser/yaml-parser.service.ts`
- [ ] T023 [US1] Implement TemplateValidator service for schema compliance in `packages/env-config/src/modules/parser/template-validator.service.ts`
- [ ] T024 [US1] Create ConfigurationBuilder service with default values per data-model.md in `packages/env-config/src/modules/parser/configuration-builder.service.ts`
- [ ] T025 [US1] Implement EnvFileWriter service with KEY=value format in `packages/env-config/src/modules/writer/env-file-writer.service.ts`
- [ ] T026 [US1] Create WriterModule in `packages/env-config/src/modules/writer/writer.module.ts`
- [ ] T027 [US1] Create GeneratorService orchestrating parsing → validation → writing pipeline in `packages/env-config/src/modules/generator/generator.service.ts`
- [ ] T028 [US1] Create GeneratorModule exporting GeneratorService in `packages/env-config/src/modules/generator/generator.module.ts`
- [ ] T029 [US1] Create GenerateCommand class extending CommandRunner with @Command decorator in `packages/env-config/src/cli/commands/generate.command.ts`
- [ ] T030 [US1] Add command options: --template <path>, --output <path>, --mode <interactive|args|ci> in `packages/env-config/src/cli/commands/generate.command.ts`
- [ ] T031 [US1] Inject GeneratorService into GenerateCommand constructor and wire run() method in `packages/env-config/src/cli/commands/generate.command.ts`
- [ ] T032 [US1] Register GenerateCommand as provider in CLIModule in `packages/env-config/src/cli/cli.module.ts`
- [ ] T033 [US1] **Independent Test**: Create basic YAML template with simple variables (API_KEY, PORT) → run CLI → verify .env file generated with correct KEY=value format

**Checkpoint**: At this point, User Story 1 should be fully functional - basic YAML → .env generation works

---

## Phase 4: User Story 2 - Type validation with error reporting (Priority: P1)

**Goal**: Validate variable values against type constraints, collect all errors before failing

**Independent Test**: Template with type violations → CLI reports all errors with line numbers, exits non-zero

**FR-004, FR-016**: Multi-error validation, YAML syntax validation with source location

**Entities**: Validation Result (6), Validator Plugin (2)

### Implementation for User Story 2

- [ ] T034 [P] [US2] Create ValidationResult entity model aligned with data-model.md entity 6 in `packages/env-config/src/models/validation-result.ts`
- [ ] T035 [US2] Create ValidationModule in `packages/env-config/src/modules/validation/validation.module.ts`
- [ ] T036 [P] [US2] Implement BaseValidator abstract class with common validation logic in `packages/env-config/src/modules/validation/validators/base-validator.ts`
- [ ] T037 [P] [US2] Create StringValidator as injectable provider (min, max, pattern, enum) in `packages/env-config/src/modules/validation/validators/string-validator.ts`
- [ ] T038 [P] [US2] Create NumberValidator as injectable provider (min, max, integer, range) in `packages/env-config/src/modules/validation/validators/number-validator.ts`
- [ ] T039 [P] [US2] Create BooleanValidator as injectable provider (true/false, yes/no, 1/0) in `packages/env-config/src/modules/validation/validators/boolean-validator.ts`
- [ ] T040 [P] [US2] Create URLValidator as injectable provider (protocols, hostname, port) in `packages/env-config/src/modules/validation/validators/url-validator.ts`
- [ ] T041 [US2] Register all validators as providers in ValidationModule in `packages/env-config/src/modules/validation/validation.module.ts`
- [ ] T042 [US2] Implement ValidationService with error aggregation (all errors collected, not fail-fast) in `packages/env-config/src/modules/validation/validation.service.ts`
- [ ] T043 [US2] Inject validators into ValidationService constructor via array injection in `packages/env-config/src/modules/validation/validation.service.ts`
- [ ] T044 [US2] Add source location tracking (file, line, column) to ValidationError in `packages/env-config/src/core/validation-error.ts`
- [ ] T045 [US2] Create ErrorFormatter service for human-readable error output in `packages/env-config/src/modules/validation/error-formatter.service.ts`
- [ ] T046 [US2] Inject ValidationService into GeneratorService and wire into pipeline after parsing in `packages/env-config/src/modules/generator/generator.service.ts`
- [ ] T047 [US2] Add --strict flag to GenerateCommand options for failing on warnings in `packages/env-config/src/cli/commands/generate.command.ts`
- [ ] T048 [US2] **Independent Test**: Create YAML template with type violations (URL, number range) → run CLI → verify all errors reported with line numbers, exits non-zero

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - type validation catches errors before .env generation

---

## Phase 5: User Story 3 - Pipe-based syntax parsing (Priority: P1)

**Goal**: Parse pipe syntax `type|param=value|required/default:value`, support nested properties, handle escapes

**Independent Test**: Template with pipe syntax → CLI parses correctly, validates, generates .env

**FR-001, FR-012, FR-016**: Pipe parsing, escape sequences, nested properties (dot notation)

**Entities**: Variable Definition (1) with parsed params

### Implementation for User Story 3

- [ ] T036 [US3] Create PipeModule in `packages/env-config/src/modules/pipe/pipe.module.ts`
- [ ] T037 [P] [US3] Define TokenType enum (PIPE, COLON, EQUALS, COMMA, STRING, NUMBER, IDENTIFIER) in `packages/env-config/src/modules/pipe/token-types.ts`
- [ ] T038 [P] [US3] Create Token interface (type, value, position) in `packages/env-config/src/modules/pipe/token.ts`
- [ ] T039 [US3] Implement Tokenizer service (injectable) for pipe syntax with escape handling (\\, \", \,, \:, \., \|, \n, \t) in `packages/env-config/src/modules/pipe/services/tokenizer.service.ts`
- [ ] T040 [US3] Create AST node types (PropertyNode, ParamNode, ValueNode) in `packages/env-config/src/modules/pipe/ast-nodes.ts`
- [ ] T041 [US3] Implement PipeParser service (injectable, tokens → AST) with recursive descent in `packages/env-config/src/modules/pipe/services/pipe-parser.service.ts`
- [ ] T042 [US3] Add nested property support (dot notation: `db.host`, `api.auth.secret`) in PipeParser service
- [ ] T043 [US3] Create PipeConfig interface (maxDepth, maxSegmentLength) in `packages/env-config/src/modules/pipe/config.ts`
- [ ] T044 [US3] Implement PipeValidator service (injectable, structure/escapes/nesting limits) in `packages/env-config/src/modules/pipe/services/pipe-validator.service.ts`
- [ ] T045 [US3] Create EscapeUtils helper for escape sequence processing in `packages/env-config/src/lib/escape-utils.ts`
- [ ] T046 [US3] Register Tokenizer, PipeParser, PipeValidator as providers in PipeModule
- [ ] T047 [US3] Import PipeModule into ParserModule
- [ ] T048 [US3] Inject PipeParser into YamlParser service constructor
- [ ] T049 [US3] Integrate PipeParser into YamlParser workflow
- [ ] T050 [US3] **Independent Test**: Create YAML template with pipe syntax (type|param=value|required:true) → run CLI → verify correct parsing, validation, .env generation

**Checkpoint**: At this point, User Stories 1-3 should work - pipe syntax parsing enables parameter extraction

---

## Phase 6: User Story 7 - Interactive prompts (Priority: P1)

**Goal**: Interactive mode with 6 prompt types (select, multiselect, toggle, number, string, autocomplete)

**Independent Test**: Run CLI without args → prompts user for each variable → generates .env with user inputs

**FR-003b, FR-010, FR-011**: Interactive execution mode, default values, optional variables

**Entities**: Configuration (5) with ExecutionMode.INTERACTIVE, PromptConfig

### Implementation for User Story 7

- [ ] T051 [US7] Create InteractiveModule in `packages/env-config/src/modules/interactive/interactive.module.ts`
- [ ] T052 [P] [US7] Create PromptConfig interface (type, label, options, min, max, default) in `packages/env-config/src/modules/interactive/prompt-config.ts`
- [ ] T053 [P] [US7] Implement PromptFactory service (injectable) for creating typed prompts from @inquirer/prompts in `packages/env-config/src/modules/interactive/services/prompt-factory.service.ts`
- [ ] T054 [P] [US7] Create SelectPrompt service (injectable, single choice from options) in `packages/env-config/src/modules/interactive/services/select-prompt.service.ts`
- [ ] T055 [P] [US7] Create MultiselectPrompt service (injectable, multiple choices) in `packages/env-config/src/modules/interactive/services/multiselect-prompt.service.ts`
- [ ] T056 [P] [US7] Create TogglePrompt service (injectable, yes/no boolean) in `packages/env-config/src/modules/interactive/services/toggle-prompt.service.ts`
- [ ] T057 [P] [US7] Create NumberPrompt service (injectable) with min/max validation in `packages/env-config/src/modules/interactive/services/number-prompt.service.ts`
- [ ] T058 [P] [US7] Create StringPrompt service (injectable, text input) in `packages/env-config/src/modules/interactive/services/string-prompt.service.ts`
- [ ] T059 [P] [US7] Create AutocompletePrompt service (injectable, search with suggestions) in `packages/env-config/src/modules/interactive/services/autocomplete-prompt.service.ts`
- [ ] T060 [US7] Register all prompt services as providers in InteractiveModule
- [ ] T061 [US7] Implement InteractiveService (injectable) orchestrating prompt flow in `packages/env-config/src/modules/interactive/services/interactive.service.ts`
- [ ] T062 [US7] Inject PromptFactory into InteractiveService constructor
- [ ] T063 [US7] Add default value handling (skip prompt if default exists and optional) in InteractiveService
- [ ] T064 [US7] Add optional variable handling (user can skip with Enter key) in InteractiveService
- [ ] T065 [US7] Import InteractiveModule into GeneratorModule
- [ ] T066 [US7] Inject InteractiveService into GeneratorService constructor for INTERACTIVE mode
- [ ] T067 [US7] Integrate InteractiveService into GeneratorService workflow
- [ ] T068 [US7] Create InteractiveCommand extending CommandRunner with @Command decorator in `packages/env-config/src/cli/commands/interactive.command.ts`
- [ ] T069 [US7] Register InteractiveCommand as provider in CLIModule
- [ ] T070 [US7] **Independent Test**: Run CLI without args → verify prompts appear for each variable with correct input types (select, toggle, number, etc.) → generates .env with user inputs

**Checkpoint**: At this point, P1 user stories (1, 2, 3, 7) complete - MVP ready for deployment

---

## Phase 7: User Story 4 - Variable references (Priority: P2)

**Goal**: Support `${VAR_NAME}` references, detect circular dependencies, resolve in dependency order

**Independent Test**: Template with references → CLI resolves in correct order, detects circular refs, generates .env

**FR-005, FR-013**: Reference resolution, circular reference detection

**Entities**: Variable Definition (1) with dependencies

### Implementation for User Story 4

- [ ] T071 [US4] Create ReferenceModule in `packages/env-config/src/modules/reference/reference.module.ts`
- [ ] T072 [P] [US4] Create VariableContext interface (variables map, currentVariable) in `packages/env-config/src/modules/reference/variable-context.ts`
- [ ] T073 [US4] Implement CircularRefDetector service (injectable) with graph traversal algorithm in `packages/env-config/src/modules/reference/services/circular-ref-detector.service.ts`
- [ ] T074 [US4] Create DependencyGraph service (injectable, topological sort) in `packages/env-config/src/modules/reference/services/dependency-graph.service.ts`
- [ ] T075 [US4] Implement ReferenceResolver service (injectable, substitution logic) in `packages/env-config/src/modules/reference/services/reference-resolver.service.ts`
- [ ] T076 [US4] Add reference parsing (detect `${...}` patterns) in ReferenceResolver service
- [ ] T077 [US4] Register CircularRefDetector, DependencyGraph, ReferenceResolver as providers in ReferenceModule
- [ ] T078 [US4] Import ReferenceModule into ValidationModule
- [ ] T079 [US4] Inject CircularRefDetector into ValidationService constructor
- [ ] T080 [US4] Integrate CircularRefDetector into ValidationService workflow
- [ ] T081 [US4] Import ReferenceModule into GeneratorModule
- [ ] T082 [US4] Inject ReferenceResolver into GeneratorService constructor
- [ ] T083 [US4] Add dependency resolution phase to GeneratorService before validation
- [ ] T084 [US4] **Independent Test**: Create YAML template with ${VAR_NAME} references → run CLI → verify resolution in correct order, circular refs detected, .env generated

**Checkpoint**: At this point, User Stories 1-4, 7 work - variable references enable derived values

---

## Phase 8: User Story 5 - Transform with plugins (Priority: P2)

**Goal**: Apply transformations (truncate, concat) via pipe syntax, support chaining

**Independent Test**: Template with transformers → CLI applies transformations, generates .env with transformed values

**FR-006, FR-007**: Built-in transformers, transformation chaining

**Entities**: Transformer Plugin (3)

### Implementation for User Story 5

- [ ] T085 [US5] Create TransformationModule in `packages/env-config/src/modules/transformation/transformation.module.ts`
- [ ] T086 [P] [US5] Create ITransformer interface with transform() method in `packages/env-config/src/modules/transformation/transformer.interface.ts`
- [ ] T087 [P] [US5] Create BaseTransformer abstract class (injectable) with common logic in `packages/env-config/src/modules/transformation/services/base-transformer.service.ts`
- [ ] T088 [P] [US5] Implement TruncateTransformer service (injectable, maxLength parameter) in `packages/env-config/src/modules/transformation/services/truncate-transformer.service.ts`
- [ ] T089 [P] [US5] Implement ConcatTransformer service (injectable, values array, separator) in `packages/env-config/src/modules/transformation/services/concat-transformer.service.ts`
- [ ] T090 [US5] Register all transformer services as providers in TransformationModule
- [ ] T091 [US5] Create TransformationService (injectable) with plugin orchestration in `packages/env-config/src/modules/transformation/services/transformation.service.ts`
- [ ] T092 [US5] Inject transformer array into TransformationService constructor via array injection
- [ ] T093 [US5] Add transformation chaining support (pipeline execution) in TransformationService
- [ ] T094 [US5] Import TransformationModule into GeneratorModule
- [ ] T095 [US5] Inject TransformationService into GeneratorService constructor
- [ ] T096 [US5] Integrate TransformationService into GeneratorService after validation
- [ ] T097 [US5] **Independent Test**: Create YAML template with transformers (truncate, concat) → run CLI → verify transformations applied, .env generated with transformed values

**Checkpoint**: At this point, User Stories 1-5, 7 work - transformations enable value manipulation

---

## Phase 9: User Story 8 - CI/CD integration (Priority: P2)

**Goal**: CI mode (strict validation, no prompts), exit codes, GitHub Actions integration

**Independent Test**: Run in CI mode with missing required → exits non-zero with error, no prompts

**FR-003c, FR-014, FR-017**: CI execution mode, exit codes, environment variable support

**Entities**: Configuration (5) with ExecutionMode.CI

### Implementation for User Story 8

- [ ] T098 [US8] Create CIModule in `packages/env-config/src/modules/ci/ci.module.ts`
- [ ] T099 [P] [US8] Create ExitCode enum (SUCCESS=0, VALIDATION_ERROR=1, MISSING_REQUIRED=2, etc.) in `packages/env-config/src/modules/ci/exit-codes.ts`
- [ ] T100 [US8] Implement CIService (injectable) with strict validation (fail on missing required, no prompts) in `packages/env-config/src/modules/ci/services/ci.service.ts`
- [ ] T101 [US8] Create EnvLoader service (injectable) for environment variable support (ENV_CONFIG_TEMPLATE, ENV_CONFIG_OUTPUT, etc.) in `packages/env-config/src/modules/ci/services/env-loader.service.ts`
- [ ] T102 [US8] Register CIService and EnvLoader as providers in CIModule
- [ ] T103 [US8] Import CIModule into CLIModule
- [ ] T104 [US8] Create CICommand extending CommandRunner with @Command decorator in `packages/env-config/src/cli/commands/ci.command.ts`
- [ ] T105 [US8] Inject CIService and EnvLoader into CICommand constructor
- [ ] T106 [US8] Add exit code mapping (ValidationError → exit 1, PluginError → exit 3, etc.) in CICommand
- [ ] T107 [US8] Register CICommand as provider in CLIModule
- [ ] T108 [US8] Create GitHub Actions example workflow in `packages/env-config/examples/ci-integration/.github/workflows/env-config.yml`
- [ ] T109 [US8] **Independent Test**: Run CLI in CI mode with missing required variable → verify exits non-zero with error, no prompts

**Checkpoint**: At this point, User Stories 1-5, 7-8 work - CI integration enables automation

---

## Phase 10: User Story 6 - Custom plugins (Priority: P3)

**Goal**: Hybrid plugin discovery (auto + explicit), load custom validators/transformers

**Independent Test**: Create custom plugin → place in conventional directory → CLI auto-discovers and uses it

**FR-008, FR-009**: Custom plugin support, hybrid discovery

**Entities**: Plugin Registry (7), Validator Plugin (2), Transformer Plugin (3)

### Implementation for User Story 6

- [ ] T110 [US6] Create PluginRegistryModule in `packages/env-config/src/modules/plugin-registry/plugin-registry.module.ts`
- [ ] T111 [P] [US6] Create IPluginRegistry interface with register/discover methods in `packages/env-config/src/modules/plugin-registry/plugin-registry.interface.ts`
- [ ] T112 [P] [US6] Create PluginMetadata interface (name, version, description, author) in `packages/env-config/src/modules/plugin-registry/plugin-metadata.ts`
- [ ] T113 [P] [US6] Create DiscoveryConfig interface (paths, pattern, maxDepth) in `packages/env-config/src/modules/plugin-registry/discovery-config.ts`
- [ ] T114 [US6] Implement PluginRegistry service (injectable) implementing IPluginRegistry in `packages/env-config/src/modules/plugin-registry/services/plugin-registry.service.ts`
- [ ] T115 [US6] Implement PluginLoader service (injectable) with file system scanning in `packages/env-config/src/modules/plugin-registry/services/plugin-loader.service.ts`
- [ ] T116 [US6] Add conventional directory support (`./plugins/validators/`, `./plugins/transformers/`) in PluginLoader service
- [ ] T117 [US6] Add explicit registration API (registerValidator, registerTransformer) in PluginRegistry service
- [ ] T118 [US6] Implement PluginValidator service (injectable, schema check before registration) in `packages/env-config/src/modules/plugin-registry/services/plugin-validator.service.ts`
- [ ] T119 [US6] Add plugin error handling (loading failures don't crash, reported as errors) in PluginLoader service
- [ ] T120 [US6] Register PluginRegistry, PluginLoader, PluginValidator as providers in PluginRegistryModule
- [ ] T121 [US6] Implement dynamic module pattern: PluginRegistryModule.forRoot(config) for plugin path configuration
- [ ] T122 [US6] Create example custom EmailValidator service in `packages/env-config/examples/custom-plugin/validators/email-validator.service.ts`
- [ ] T123 [US6] Create example custom Base64Transformer service in `packages/env-config/examples/custom-plugin/transformers/base64-transformer.service.ts`
- [ ] T124 [US6] Import PluginRegistryModule.forRoot() into CLIModule with default paths
- [ ] T125 [US6] Inject PluginRegistry into ValidationService and TransformationService constructors
- [ ] T126 [US6] Integrate PluginRegistry into ValidationService and TransformationService workflows
- [ ] T127 [US6] Create PluginCommand extending CommandRunner with @Command decorator for `plugin` command in `packages/env-config/src/cli/commands/plugin.command.ts`
- [ ] T128 [US6] Add --plugin-path option to GenerateCommand for custom plugin directories
- [ ] T129 [US6] Register PluginCommand as provider in CLIModule
- [ ] T130 [US6] **Independent Test**: Create custom plugin in conventional directory → run CLI → verify auto-discovery and plugin usage in template validation

**Checkpoint**: All user stories (1-8) now complete - full feature set implemented

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, performance, documentation

- [ ] T131 Create PerformanceModule in `packages/env-config/src/modules/performance/performance.module.ts`
- [ ] T132 [P] Implement CacheService (injectable) with variable caching (50-variable cache) in `packages/env-config/src/modules/performance/services/cache.service.ts`
- [ ] T133 [P] Implement BatchProcessor service (injectable) for parallel validation (batch size 50) in `packages/env-config/src/modules/performance/services/batch-processor.service.ts`
- [ ] T134 [P] Register CacheService and BatchProcessor as providers in PerformanceModule
- [ ] T135 [P] Import PerformanceModule into ValidationModule and inject services
- [ ] T136 Create LoggingModule in `packages/env-config/src/modules/logging/logging.module.ts`
- [ ] T137 [P] Implement Logger service (injectable) with verbosity levels in `packages/env-config/src/modules/logging/services/logger.service.ts`
- [ ] T138 [P] Register Logger as provider in LoggingModule
- [ ] T139 [P] Import LoggingModule into CLIModule as global module
- [ ] T140 [P] Add --verbose option to commands using nest-commander options decorator
- [ ] T141 [P] Add --dry-run option to GenerateCommand for validation without .env generation
- [ ] T142 [P] Implement BackupService (injectable) for file backup before overwriting in `packages/env-config/src/modules/writer/services/backup.service.ts`
- [ ] T143 [P] Register BackupService in WriterModule and inject into EnvFileWriter
- [ ] T144 [P] Create comprehensive README.md with installation, usage examples, CLI reference in `packages/env-config/README.md`
- [ ] T145 [P] Create basic-template.yml example in `packages/env-config/examples/basic-template.yml`
- [ ] T146 [P] Create advanced-template.yml example with all features in `packages/env-config/examples/advanced-template.yml`
- [ ] T147 Validate against quickstart.md examples (all examples work as documented)
- [ ] T148 [P] Add Zod schema validation for all entity constructors in `packages/env-config/src/models/`
- [ ] T149 [P] Code cleanup: remove any `any` types, ensure strict null checks throughout
- [ ] T150 [P] Security audit: validate input sanitization, path traversal prevention in file operations
- [ ] T151 Add performance benchmarks per FR-017 (parse <780ms, generate <1100ms, discover <500ms) in `packages/env-config/__tests__/benchmarks/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - MVP
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2), integrates with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2), extends US1 parsing
- **User Story 7 (Phase 6)**: Depends on Foundational (Phase 2), integrates with US1-3
- **User Story 4 (Phase 7)**: Depends on US1 (needs parsing), extends US3 (pipe syntax)
- **User Story 5 (Phase 8)**: Depends on US4 (needs resolution), uses US3 (pipe syntax)
- **User Story 8 (Phase 9)**: Depends on US1-3 (needs core pipeline), no prompts
- **User Story 6 (Phase 10)**: Depends on US2, US5 (extends plugin system)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2)
       ↓
    ┌──┴──┐
    ▼     ▼
   US1   US2 ──→ (Validation extends parsing)
    │     │
    ▼     ▼
   US3 ←──┘ (Pipe syntax uses validators)
    │
    ▼
   US7 (Interactive uses parsing + validation)
    │
    ├──→ US4 (References need parsing)
    │     │
    │     ▼
    │    US5 (Transformers need resolution)
    │     │
    ├─────┘
    │
    ├──→ US8 (CI mode uses core pipeline, no prompts)
    │
    └──→ US6 (Custom plugins extend validator/transformer system)
```

### Critical Path (MVP = US1-US3, US7)

1. **Setup** (T001-T005) → 5 tasks
2. **Foundational** (T006-T014) → 9 tasks ⚠️ BLOCKS ALL
3. **US1** (T015-T024) → 10 tasks (Basic YAML → .env)
4. **US2** (T025-T035) → 11 tasks (Type validation)
5. **US3** (T036-T045) → 10 tasks (Pipe syntax)
6. **US7** (T046-T058) → 13 tasks (Interactive prompts)

**Total MVP tasks**: 58 tasks (Setup + Foundational + US1 + US2 + US3 + US7)

### Within Each User Story

**General pattern**:
1. Models/Entities (can run in parallel if marked [P])
2. Core implementation (depends on models)
3. Integration into services (depends on core)
4. CLI integration (depends on services)

**US1 Example**:
- T015, T016 [P] → Create models (parallel)
- T017, T018 → Implement parser (sequential - extends same file)
- T019, T020 [P] → Validator + Builder (parallel)
- T021-T024 → Integration pipeline (sequential dependencies)

### Parallel Opportunities

**Setup Phase**: All tasks marked [P] can run simultaneously (T003, T004, T005)

**Foundational Phase**: Model/interface tasks can run in parallel:
- T006, T007, T008, T009, T010 [P] → Core types
- T012, T013, T014 [P] → Interfaces

**User Story Phases**: After Foundational complete, multiple stories can start in parallel if team capacity allows:
- US1 + US2 + US3 can begin simultaneously (different components)
- US7 requires US1-US3 models but can work on prompt wrappers in parallel

**Within Stories**: Tasks marked [P] can run in parallel:
- US2: All validators (T027-T030) can be built simultaneously
- US7: All prompt types (T048-T053) can be built simultaneously
- US6: Plugin examples (T088-T089) can be built simultaneously

---

## Parallel Example: User Story 2

```bash
# Launch all validator plugins together:
[P] T027: "Create StringValidator plugin in packages/env-config/src/validators/string-validator.ts"
[P] T028: "Create NumberValidator plugin in packages/env-config/src/validators/number-validator.ts"
[P] T029: "Create BooleanValidator plugin in packages/env-config/src/validators/boolean-validator.ts"
[P] T030: "Create URLValidator plugin in packages/env-config/src/validators/url-validator.ts"

# After validators complete, can parallelize:
[P] T025: "Create ValidationResult entity model in packages/env-config/src/models/validation-result.ts"
[P] T026: "Implement BaseValidator abstract class in packages/env-config/src/validators/base-validator.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3, 7 Only)

**Goal**: Deliver working interactive CLI with type validation and pipe syntax in 58 tasks

1. **Phase 1: Setup** (T001-T005) → Project initialized
2. **Phase 2: Foundational** (T006-T014) → Type system ready
3. **Phase 3: US1** (T015-T024) → Basic YAML → .env works
4. **Phase 4: US2** (T025-T035) → Validation catches errors
5. **Phase 5: US3** (T036-T045) → Pipe syntax parsed
6. **Phase 6: US7** (T046-T058) → Interactive prompts work
7. **STOP and VALIDATE**: Test MVP independently
8. **Deploy/Demo**: Show basic workflow

**MVP Success Criteria**:
- User can run `env-config` interactively
- CLI prompts for each variable with appropriate input type
- Type validation catches errors with line numbers
- Pipe syntax `type|param=value|required:true` parses correctly
- Generates valid .env file
- Exit codes work (0 = success, 1 = validation error)

### Incremental Delivery (Add P2 Stories)

After MVP validated:

9. **Phase 7: US4** (T059-T066) → Variable references work
10. **Phase 8: US5** (T067-T072) → Transformations work
11. **Phase 9: US8** (T073-T079) → CI mode works
12. **VALIDATE**: Test P1+P2 features independently
13. **Deploy/Demo**: Show advanced features

### Full Feature Set (Add P3 Story)

After P2 validated:

14. **Phase 10: US6** (T080-T091) → Custom plugins work
15. **Phase 11: Polish** (T092-T105) → Performance, docs, examples
16. **FINAL VALIDATE**: All 8 user stories work
17. **Production Deploy**: Full feature release

### Parallel Team Strategy

With 3 developers after Foundational (Phase 2) completes:

- **Developer A**: US1 (T015-T024) → Basic generation
- **Developer B**: US2 (T025-T035) → Validation system
- **Developer C**: US3 (T036-T045) → Pipe parser

Then converge on US7 (interactive prompts) together, or continue in parallel:

- **Developer A**: US4 (T059-T066) → References
- **Developer B**: US5 (T067-T072) → Transformers
- **Developer C**: US8 (T073-T079) → CI mode

---

## FR → Task Mapping

| FR | Description | Tasks |
|----|-------------|-------|
| FR-001 | Parse YAML nested properties, JSON syntax | T017, T018, T041 |
| FR-002 | Result monad error handling | T006, T009 |
| FR-003 | Three execution modes (interactive, argument, CI) | T022-T024, T054-T058, T074-T079 |
| FR-004 | Validation with error collection | T031, T033 |
| FR-005 | Variable reference resolution | T062, T064 |
| FR-006 | Built-in transformers | T068, T069 |
| FR-007 | Transformation chaining | T071 |
| FR-008 | Custom plugin support | T088-T091 |
| FR-009 | Hybrid plugin discovery | T083-T085 |
| FR-010 | Default values | T055 |
| FR-011 | Optional variables | T056 |
| FR-012 | Escape sequences | T038, T044 |
| FR-013 | Circular reference detection | T060, T065 |
| FR-014 | Exit codes | T073, T077 |
| FR-015 | Error hierarchy | T007, T008 |
| FR-016 | Source location in errors | T032 |
| FR-017 | Performance benchmarks | T092, T093, T105 |
| FR-018 | Type safety (no `any`) | T002, T103 |

---

## User Story → Task Mapping

| User Story | Priority | Tasks | Count |
|------------|----------|-------|-------|
| US1: Generate .env | P1 🎯 | T015-T024 | 10 |
| US2: Type validation | P1 🎯 | T025-T035 | 11 |
| US3: Pipe syntax | P1 🎯 | T036-T045 | 10 |
| US7: Interactive prompts | P1 🎯 | T046-T058 | 13 |
| US4: Variable references | P2 | T059-T066 | 8 |
| US5: Transformations | P2 | T067-T072 | 6 |
| US8: CI/CD integration | P2 | T073-T079 | 7 |
| US6: Custom plugins | P3 | T080-T091 | 12 |

**Total User Story Tasks**: 77 tasks  
**Total with Setup + Foundational + Polish**: 105 tasks

---

## Entity → Task Mapping

| Entity | Data Model # | Created In | Used In |
|--------|--------------|------------|---------|
| Variable Definition | 1 | T011 | T015, T059-T066 (dependencies) |
| Validator Plugin | 2 | T012, T026-T030 | T031, T090 |
| Transformer Plugin | 3 | T013, T067-T069 | T070-T072, T090 |
| Template | 4 | T015 | T017-T019 |
| Configuration | 5 | T016 | T020, T054, T074 |
| Validation Result | 6 | T025 | T031, T033 |
| Plugin Registry | 7 | T014, T080 | T083-T087, T090 |

---

## Success Criteria Validation

| Criteria | Tasks Covering |
|----------|----------------|
| Parse YAML templates with validation | T017-T019, T045 |
| Generate valid .env files | T021, T024 |
| Support 6 prompt types | T048-T053 |
| Built-in validators (4 types) | T027-T030 |
| Built-in transformers (2 types) | T068-T069 |
| Custom plugin loading | T083-T091 |
| Circular reference detection | T060, T065 |
| Performance benchmarks met | T105 |

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story independently completable after Foundational phase
- Tests not included per constitution (not requested in spec)
- Commit after each task or logical group
- Verify at checkpoints to catch issues early
- MVP = 58 tasks (Setup + Foundational + US1 + US2 + US3 + US7)
- Full feature set = 105 tasks
- Paths use `packages/env-config/` prefix per plan.md structure
- TypeScript strict mode enforced (no `any`, strict null checks)
- All entities align with data-model.md specifications
- All FRs covered across implementation tasks
