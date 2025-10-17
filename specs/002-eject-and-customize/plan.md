# Implementation Plan: Eject and Customize System for Monorepo Template

**Branch**: `002-eject-and-customize` | **Date**: 2025-10-16 | **Spec**: [Eject and Customize Specification](./spec.md)
**Input**: Feature specification from `/specs/002-eject-and-customize/spec.md`

## Summary

Create a two-command system for developers to eject template showcase code and customize the monorepo template:

1. **`bun run eject`**: Interactive command that removes template showcase components and prompts users about removing optional features (ORPC, Better Auth, Redis, etc.). Uses feature removal manifests to cleanly remove selected features and their dependencies.

2. **`bun run customize`**: Command that operates on ejected projects to add new modules, swap frameworks, or integrate alternative technologies. Builds on the clean ejected base without conflicts.

Both commands validate success via TypeScript builds, provide detailed logging, include rollback mechanisms, and update documentation automatically.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20+ and Bun 1.2.14+  
**Primary Dependencies**: Bun CLI tooling, Node.js fs/path modules, interactive prompts (inquirer or similar), JSON parsing for manifests, Turborepo for dependency analysis  
**Storage**: File system (manifests, configs, code removal via fs operations) + Git (for rollback/recovery)  
**Testing**: Vitest for unit tests, integration tests validating full eject/customize workflows  
**Target Platform**: Linux/macOS/Windows development environments with Git and Docker available  
**Project Type**: Monorepo CLI tooling (scripts + commands integrated into root package.json)  
**Performance Goals**: Eject completes in <2 minutes, customize setup <1 minute per module, project builds within normal timeframe post-removal  
**Constraints**: Zero manual intervention after feature selection, 95% of projects build first-try post-eject, rollback <1 minute  
**Scale/Scope**: Handles ~15-20 optional features, ~100+ files per feature, supports framework swaps for ORPC↔tRPC and similar

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **End-to-End Type Safety (Principle I)**  
- **Status**: COMPATIBLE
- **Detail**: Eject preserves ORPC contracts for retained features. Customize can add new ORPC endpoints. Type safety maintained throughout.

✅ **Monorepo Discipline via Turborepo (Principle II)**  
- **Status**: COMPATIBLE
- **Detail**: Eject/customize operate within workspace structure, respect package boundaries, and use Turborepo to analyze dependencies.

✅ **Docker-First Development (Principle III)**  
- **Status**: COMPATIBLE
- **Detail**: Eject and customize operations work within Docker context. Validation builds happen in same environment as `bun run dev`.

✅ **Centralized Testing via Vitest (Principle IV)**  
- **Status**: COMPATIBLE
- **Detail**: Feature includes comprehensive test coverage using Vitest across all packages. Coverage merged centrally.

✅ **Declarative Routing & Type-Safe Navigation (Principle V)**  
- **Status**: COMPATIBLE
- **Detail**: Eject regenerates routes after removing showcase. Routes auto-update via `bun run web -- dr:build`.

✅ **Shared UI Component Library (Principle VI)**  
- **Status**: COMPATIBLE
- **Detail**: Customize can add/remove UI component packages. Shadcn components maintained as optional features.

✅ **Documentation-First Workflow (Principle VII)**  
- **Status**: REQUIRES ATTENTION
- **Detail**: Eject must auto-update README, docs, and example files to reflect removed features. Customize auto-generates docs for added modules.

**Constitution Violations**: NONE - Feature aligns with all 7 core principles.
**Gate Status**: ✅ PASS

## Project Structure

### Documentation (this feature)

```
specs/002-eject-and-customize/
├── spec.md              # Feature specification (COMPLETED)
├── checklists/
│   └── requirements.md  # Quality checklist (COMPLETED)
├── plan.md              # This file (Phase 0 planning)
├── research.md          # Phase 0 output (TO BE CREATED)
├── data-model.md        # Phase 1 output (TO BE CREATED)
├── quickstart.md        # Phase 1 output (TO BE CREATED)
├── contracts/           # Phase 1 output (TO BE CREATED)
│   ├── eject-manifest-schema.json
│   ├── customize-manifest-schema.json
│   └── feature-registry.json
└── tasks.md             # Phase 2 output (Phase 2 task breakdown)
```

### Source Code (repository root)

```
packages/eject-customize/          # NEW: Core CLI package
├── src/
│   ├── eject/
│   │   ├── index.ts               # Main eject command
│   │   ├── prompts.ts             # Interactive feature selection
│   │   ├── manifest-loader.ts     # Load feature removal manifests
│   │   ├── remover.ts             # File/dependency removal logic
│   │   ├── validator.ts           # Post-removal validation
│   │   └── recovery.ts            # Rollback mechanism
│   ├── customize/
│   │   ├── index.ts               # Main customize command
│   │   ├── registry.ts            # Available modules/frameworks
│   │   ├── installer.ts           # Module installation logic
│   │   └── framework-swaps.ts     # Framework replacement logic
│   ├── common/
│   │   ├── logging.ts             # Detailed operation logging
│   │   ├── git-utils.ts           # Git operations for recovery
│   │   ├── fs-utils.ts            # Safe file operations
│   │   ├── dependency-analyzer.ts # Analyze package dependencies
│   │   ├── types.ts               # Shared TypeScript types
│   │   └── constants.ts           # Feature lists, paths, etc.
│   └── cli.ts                     # CLI entry point
├── __tests__/
│   ├── eject.test.ts              # Eject command tests
│   ├── customize.test.ts          # Customize command tests
│   ├── manifest-loader.test.ts    # Manifest parsing tests
│   ├── remover.test.ts            # File removal tests
│   └── integration.test.ts        # End-to-end workflow tests
├── package.json
├── tsconfig.json
└── vitest.config.ts

.eject-manifests/                  # NEW: Feature removal manifests
├── orpc.manifest.json             # What to remove for ORPC feature
├── better-auth.manifest.json      # What to remove for Better Auth
├── redis.manifest.json            # What to remove for Redis caching
├── docs-site.manifest.json        # What to remove for documentation site
├── showcase.manifest.json         # What to remove for showcase components
├── example-modules.manifest.json  # Example module removals
└── README.md                      # Manifest format documentation

.customize-modules/                # NEW: Customize module templates
├── registry.json                  # Available modules and frameworks
├── modules/
│   ├── stripe-integration/
│   │   ├── install.sh
│   │   └── files/
│   ├── analytics/
│   │   ├── install.sh
│   │   └── files/
│   └── [other-modules]/
└── framework-swaps/
    ├── orpc-to-trpc/
    │   ├── swap.sh
    │   └── files/
    └── [other-swaps]/

packages/eject-customize-manifests/ # NEW: Package containing manifest schemas
├── index.ts
├── schemas/
│   ├── eject-manifest.ts
│   ├── customize-manifest.ts
│   ├── feature-definition.ts
│   └── removal-rules.ts
└── examples/
    ├── orpc-removal.json
    └── better-auth-removal.json

root/
├── package.json                   # Add eject/customize scripts
├── turbo.json                     # Add eject/customize pipeline
└── scripts/
    ├── commands/
    │   ├── eject.sh              # Bun/Node entry point for eject
    │   └── customize.sh          # Bun/Node entry point for customize
    └── [existing scripts]
```

**Structure Decision**: 
- **Primary Package**: `packages/eject-customize/` contains CLI logic, command implementations, and tests
- **Manifest Storage**: `.eject-manifests/` directory at root (not in packages) for easy access and editing
- **Module Registry**: `.customize-modules/` directory with template definitions for custom modules and framework swaps
- **Manifest Package**: `packages/eject-customize-manifests/` exports TypeScript schemas and examples for type-safe manifest validation
- **CLI Entry**: Root `package.json` scripts (`bun run eject`, `bun run customize`) delegate to package CLI
- **Integration**: Bun CLI entry points in `scripts/commands/` for cross-platform support

## Complexity Tracking

*No Constitution Check violations requiring justification. All architectural decisions align with core principles.*

---

## Phase 0: Research & Clarifications

### Research Tasks

The following research tasks will be executed to resolve technical unknowns and establish best practices:

| Task | Research Focus | Output |
|------|-----------------|--------|
| **T0-001** | Feature Manifest Format | Define exact JSON schema for `.eject-manifests/*.json` files (what fields required, validation rules) |
| **T0-002** | Safe File Removal Strategy | Research patterns for safely removing files, directories, and dependencies without breaking projects |
| **T0-003** | Git-based Recovery Mechanism | Design and validate Git-based rollback strategy (commit before eject, revert on failure) |
| **T0-004** | Interactive CLI Prompts | Evaluate libraries for interactive prompts: `inquirer`, `prompts`, or Bun native stdin handling |
| **T0-005** | Dependency Analysis Patterns | Research safe ways to analyze Turborepo `package.json` dependencies to detect what to remove |
| **T0-006** | Build Validation Strategy | Define minimal build validation approach (TypeScript check, Turbo validation, or full build) |
| **T0-007** | Module Registry Format | Design registry structure for `.customize-modules/` with metadata, dependencies, install scripts |
| **T0-008** | Documentation Auto-Update | Research approaches for automatic README/docs updates based on removed/added features |
| **T0-009** | Framework Swap Patterns | Document patterns for swapping ORPC↔tRPC, Next.js patterns, and other framework substitutions |
| **T0-010** | Container Environment Validation | Research how to validate eject operations work correctly in Docker development environment |

### Research Output

All research findings will be consolidated into `research.md` with:
- **Decision**: What was chosen
- **Rationale**: Why chosen
- **Alternatives Considered**: Other options evaluated and rejected
- **Implementation Notes**: Key insights for Phase 1 implementation

---

## Phase 1: Design & Contracts (Dependent on Research)

### 1.1 Data Model (`data-model.md`)

Key entities will be defined:
- **FeatureManifest**: Structure of removal manifests defining what to remove for each feature
- **EjectConfiguration**: User's selections from interactive prompt
- **CustomModule**: Available module/framework definitions
- **RemovalResult**: Tracking what was removed, changed, or rolled back
- **FrameworkSwap**: Definition of framework replacement options

### 1.2 API/Contract Definitions (`contracts/`)

Contracts will include:
- **eject-manifest-schema.json**: TypeScript schema for manifest validation
- **customize-manifest-schema.json**: Schema for module definitions
- **feature-registry.json**: Catalog of available optional features
- **Manifest Examples**: Concrete examples for ORPC, Better Auth, Redis removal

### 1.3 Quick Start Guide (`quickstart.md`)

Will document:
- How to run `bun run eject` step-by-step
- How to respond to interactive prompts
- How to run `bun run customize` and add modules
- Common workflows and troubleshooting
- How to create new feature manifests

### 1.4 Agent Context Update

After Phase 1 design, run agent context update:
```bash
.specify/scripts/bash/update-agent-context.sh copilot
```

This will add Eject/Customize system details to Copilot context for development.

---

## Phase 1: Completion Status - ✅ COMPLETE

All Phase 1 deliverables completed:

**Deliverables Summary:**
- ✅ **data-model.md** (439 lines) - 5 entity types with TypeScript interfaces and validation rules
- ✅ **research.md** (712 lines) - Phase 0 research consolidation: 10/10 tasks completed with decisions
- ✅ **eject-manifest-schema.json** (157 lines) - JSON Schema Draft-07 for feature removal validation
- ✅ **customize-module-registry-schema.json** (205 lines) - JSON Schema Draft-07 for module/framework swap definitions
- ✅ **feature-registry.example.json** (378 lines) - Example registry with 4 modules + 3 framework swaps
- ✅ **quickstart.md** (462 lines) - Comprehensive user guide with step-by-step workflows and troubleshooting

**Phase 1 Success Criteria Achieved:**
- ✅ All contracts valid according to their JSON schemas
- ✅ Quickstart guide tested with realistic user workflows (eject showcase → add modules → validate)
- ✅ Team members can understand system architecture from design docs alone
- ✅ Example data realistic and useful (Stripe, PostHog, GraphQL, Bull Queue as modules)
- ✅ Troubleshooting section addresses common issues (eject failures, module conflicts, build errors)
- ✅ Agent context document templates ready for Phase 1.4 execution

**Files Created in Phase 1:**
```
specs/002-eject-and-customize/
├── data-model.md ✅
├── research.md ✅
├── quickstart.md ✅
└── contracts/
    ├── eject-manifest-schema.json ✅
    ├── customize-module-registry-schema.json ✅
    └── feature-registry.example.json ✅
```

**Next Step (Phase 1.4):**
Execute agent context update to prepare Copilot for Phase 2 implementation:
```bash
bash .specify/scripts/bash/update-agent-context.sh copilot
```

---

## Phase 2: Implementation Tasks (Dependent on Phase 1)

*Note: Phase 2 task breakdown will be generated by `/speckit.tasks` command*

Implementation will follow priority order:

1. **P1 - Core Infrastructure**
   - Manifest loading and validation system
   - File removal safety mechanisms
   - Build validation logic
   - Git-based recovery/rollback

2. **P1 - Eject Command**
   - Interactive feature selection prompts
   - Feature manifest application
   - Dependency cleanup
   - Auto-documentation updates

3. **P2 - Customize Command**
   - Module registry system
   - Module installation logic
   - Framework swap execution
   - Integration validation

4. **P2 - Testing & Documentation**
   - Comprehensive test coverage
   - End-to-end integration tests
   - Feature manifest examples
   - Developer documentation

---

## Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| File removal causes project breakage | HIGH | Git-based recovery + comprehensive testing of manifest removal patterns |
| Dependency resolution errors | HIGH | Analyze Turborepo graph before removal, validate package.json integrity |
| Interrupted operations leave project in bad state | MEDIUM | Atomic operations + rollback mechanism + clear logging |
| Documentation becomes out-of-sync | MEDIUM | Auto-generate docs from feature registry + validate in tests |
| Framework swaps introduce type errors | MEDIUM | Require full TypeScript build validation before committing changes |
| Users skip steps and break projects | LOW | Clear error messages + detailed logging + rollback suggestions |

---

## Success Criteria Reference

*Mapping implementation deliverables to success criteria from specification*

| Success Criterion | Implementation Deliverable | Validation |
|---|---|---|
| **SC-001**: Eject <2 min | Optimized manifest processing, parallel file operations | Benchmark tests |
| **SC-002**: 95% first-try build success | Comprehensive manifest coverage, dependency analysis | Integration test suite |
| **SC-003**: 3+ module types addable | Registry extensibility, install script flexibility | Module examples |
| **SC-004**: Auto-updated docs | Template-based README regeneration, docs processor | Doc validation tests |
| **SC-005**: 80% independent task completion | Intuitive prompts, clear step-by-step guidance | User testing, quickstart guide |
| **SC-006**: <1 min rollback | Git-based recovery, pre-eject snapshots | Recovery mechanism tests |
| **SC-007**: 90% auto-feature identification | Comprehensive manifest definitions | Manifest coverage analysis |

---

## Next Steps

1. **Phase 0 Execution**: Run research tasks to fill in technical details
2. **Phase 0 Output**: Generate `research.md` with all decisions documented
3. **Phase 1 Design**: Create data model, contracts, and integration specs
4. **Agent Context**: Update Copilot context with implementation details
5. **Phase 2 Tasks**: Use `/speckit.tasks` to break down Phase 1 design into implementable tasks

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

