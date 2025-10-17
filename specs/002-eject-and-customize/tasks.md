# Tasks: Eject and Customize System for Monorepo Template

**Input**: Design documents from `/specs/002-eject-and-customize/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, research.md ✅, contracts/ ✅, quickstart.md ✅

**Feature Branch**: `002-eject-and-customize`  
**Status**: Ready for Phase 2 implementation (all Phase 0-1 design complete)

**Tests**: Not explicitly requested in specification - tasks focus on implementation. Integration tests for each user story can be added in Phase 7 Polish if needed.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable task (different files, no blocking dependencies)
- **[Story]**: User story label [US1], [US2], [US3], [US4] (only in user story phases)
- **File paths**: Exact locations from plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project structure, packages, and configuration

- [ ] T001 Create packages/eject-customize directory structure with src/, __tests__/, and lib/ subdirectories
- [ ] T002 Create packages/eject-customize/package.json with dependencies (prompts, glob, fs-extra) and scripts
- [ ] T003 [P] Create packages/eject-customize/tsconfig.json extending root config with strict mode enabled
- [ ] T004 [P] Create packages/eject-customize/vitest.config.ts for test setup and mocking
- [ ] T005 Create .eject-manifests/ directory at repository root with README documenting manifest format
- [ ] T006 Create .customize-modules/ directory at repository root with skeleton structure (modules/, framework-swaps/)
- [ ] T007 Update root package.json with scripts: `"eject": "bun --bun packages/eject-customize/src/cli.ts eject"` and `"customize": "bun --bun packages/eject-customize/src/cli.ts customize"`
- [ ] T008 Update turbo.json to add eject-customize package to pipeline with appropriate task dependencies

**Checkpoint**: Project structure ready - can begin Phase 2 foundational infrastructure

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: All tasks in this phase MUST be completed before ANY user story implementation can begin. These tasks provide shared infrastructure used by all stories.

**Purpose**: Core utilities and infrastructure supporting all eject/customize operations

- [ ] T009 Create packages/eject-customize/src/common/types.ts with TypeScript interfaces for FeatureManifest, EjectConfiguration, CustomModule, FrameworkSwap, OperationLog (from data-model.md)
- [ ] T010 [P] Implement packages/eject-customize/src/common/git-utils.ts: checkCleanWorkingTree(), createBranch(), commit(), reset() (Git-based recovery from T0-003 research)
- [ ] T011 [P] Implement packages/eject-customize/src/common/fs-utils.ts: safeRemove(), recursiveRemove(), matchPatterns() using glob library (safe removal from T0-002 research)
- [ ] T012 [P] Implement packages/eject-customize/src/common/backup.ts: createSnapshot(), restoreSnapshot() for .backup/ directory management (FR-015: snapshot creation before operations)
- [ ] T013 [P] Implement packages/eject-customize/src/common/progress.ts: ProgressBar class with start(), update(), complete() for real-time progress visualization (FR-013: progress bars for each phase)
- [ ] T014 [P] Implement packages/eject-customize/src/common/error-handler.ts: ErrorHandler class with structured error messages (what/why/suggestion) per FR-014
- [ ] T015 Implement packages/eject-customize/src/common/recovery.ts: recoveryPrompt() function showing 3-option choice (Rollback+retry / Rollback+abort / Continue anyway) per FR-016 clarification
- [ ] T016 [P] Implement packages/eject-customize/src/common/logging.ts: OperationLogger class tracking OperationLog with file counts, changes, timestamps
- [ ] T017 Implement packages/eject-customize/src/common/validator.ts: ManifestValidator and ConfigValidator for schema validation (JSON Schema support)

**Dependencies within Phase 2**: T009 must complete first (types), then T010-T017 can run in parallel

**Checkpoint**: Foundational infrastructure complete - all user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Eject Template Showcase (Priority: P1) 🎯 MVP

**Goal**: Remove template showcase components, prompt users about optional features, provide interactive eject experience

**Independent Test**: Run `bun run eject`, select features to remove, verify files are deleted, project builds successfully, no broken imports remain

**Why Priority P1**: Foundational feature - all customization depends on successful eject. First-time developer experience.

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create packages/eject-customize/src/eject/registry.ts: FeatureRegistry class loading all feature manifests from .eject-manifests/*.json
- [ ] T019 [P] [US1] Create packages/eject-customize/src/eject/manifest-loader.ts: ManifestLoader class validating and parsing FeatureManifest schema
- [ ] T020 [US1] Create packages/eject-customize/src/eject/prompts.ts: buildEjectPrompts() function using prompts library for interactive feature selection (FR-002, FR-003)
- [ ] T021 [P] [US1] Create packages/eject-customize/src/common/dependency-analyzer.ts: DependencyAnalyzer class building dependency graph from Turborepo workspace (T0-005 research)
- [ ] T022 [P] [US1] Create packages/eject-customize/src/eject/remover.ts: FeatureRemover class implementing three-phase removal (analyze → remove → validate) applying manifests (FR-004)
- [ ] T023 [P] [US1] Create packages/eject-customize/src/eject/config-cleaner.ts: ConfigCleaner class removing env vars, config files, config sections per manifest (FR-011)
- [ ] T024 [P] [US1] Create packages/eject-customize/src/eject/dependency-remover.ts: DependencyRemover class updating package.json, removing packages and scripts (FR-010)
- [ ] T025 [US1] Create packages/eject-customize/src/eject/validator.ts: PostEjectValidator running `bun run type-check` and checking requiredRemains paths (FR-008)
- [ ] T026 [US1] Create packages/eject-customize/src/eject/doc-updater.ts: DocumentationUpdater auto-updating README, removing docs per manifest.documentation section (FR-012)
- [ ] T027 [US1] Create packages/eject-customize/src/eject/index.ts: orchestrateEject() function coordinating backup → prompts → removal → validation → docs update → git commit

**Checkpoint**: User Story 1 complete and independently testable - eject command fully functional for showcase removal and feature selection

---

## Phase 4: User Story 2 - Interactive Feature Selection During Eject (Priority: P1)

**Goal**: Enhance eject prompts with feature descriptions, incompatibility detection, and pre-removal analysis preview

**Independent Test**: Run `bun run eject`, verify all features listed with descriptions, select incompatible features and see warnings, see preview of what will be removed before confirming

**Why Priority P1**: Critical UX enhancement for first-time experience - users need visibility into what they're removing. Prevents accidental breakage.

**Dependency on US1**: Uses eject command from US1 but enhances prompts and adds analysis

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create packages/eject-customize/src/eject/compatibility.ts: FeatureCompatibility class checking incompatible feature combinations (FR-003: detect incompatibilities)
- [ ] T029 [US2] Enhance packages/eject-customize/src/eject/prompts.ts: Add feature descriptions, dependency tree visualization, incompatibility warnings
- [ ] T030 [P] [US2] Create packages/eject-customize/src/eject/pre-removal-analysis.ts: PreRemovalAnalyzer showing what files/deps will be removed, file count, total size
- [ ] T031 [US2] Integrate FeatureCompatibility.checkSelected() into eject workflow before removal (FR-003)
- [ ] T032 [US2] Integrate PreRemovalAnalyzer.analyze() into eject prompts flow to show preview before user confirms (FR-002)

**Checkpoint**: User Story 1 + 2 combined provide complete interactive eject experience with visibility and safety

---

## Phase 5: User Story 3 - Customize System for Adding Features (Priority: P2)

**Goal**: Add new modules to ejected projects without conflicts, integrate seamlessly, validate post-addition

**Independent Test**: Run `bun run customize` on ejected project, select a module, verify files added, dependencies installed, project builds successfully, new functionality available

**Why Priority P2**: Enables developer productivity after eject - adds value but doesn't block core workflow. Depends on successful eject foundation.

**Independent from US1/US2**: Customize uses separate code path, can be implemented in parallel once foundational phase complete

### Implementation for User Story 3

- [ ] T033 [P] [US3] Create packages/eject-customize/src/customize/registry-loader.ts: ModuleRegistryLoader class loading .customize-modules/registry.json with available modules
- [ ] T034 [P] [US3] Create packages/eject-customize/src/customize/installer.ts: ModuleInstaller class executing install scripts, copying files, running post-install hooks (FR-006)
- [ ] T035 [P] [US3] Create packages/eject-customize/src/customize/config-integrator.ts: ConfigIntegrator updating package.json, env templates, Turborepo config for new module
- [ ] T036 [US3] Create packages/eject-customize/src/customize/prompts.ts: buildCustomizePrompts() displaying available modules with descriptions and compatibility info
- [ ] T037 [US3] Create packages/eject-customize/src/customize/validator.ts: PostCustomizeValidator running build validation and module integration checks (FR-008)
- [ ] T038 [US3] Create packages/eject-customize/src/customize/index.ts: orchestrateCustomize() function coordinating backup → prompts → installation → validation → docs update
- [ ] T039 [US3] Create .customize-modules/registry.json with example modules: Stripe integration (payments), PostHog analytics, Bull Queue (job processing)
- [ ] T040 [P] [US3] Create example module in .customize-modules/modules/stripe-integration/ with install.sh and example files
- [ ] T041 [P] [US3] Create example module in .customize-modules/modules/posthog-analytics/ with install.sh and example files

**Checkpoint**: Customize command fully functional - developers can add new capabilities to ejected projects

---

## Phase 6: User Story 4 - Framework Switching Support (Priority: P3)

**Goal**: Enable swapping core frameworks (ORPC↔tRPC, database options, auth providers) while maintaining type safety

**Independent Test**: Run customize, select framework swap (ORPC to tRPC), verify old framework removed, new framework installed, TypeScript compilation succeeds, end-to-end types intact

**Why Priority P3**: Enables power users to adapt template to existing tech stacks. Lower priority than core features but valuable for advanced scenarios.

**Independent from US1/US2/US3**: Can be implemented in parallel, uses customize infrastructure from US3

### Implementation for User Story 4

- [ ] T042 [P] [US4] Create packages/eject-customize/src/customize/swap-loader.ts: FrameworkSwapLoader discovering available swaps from .customize-modules/framework-swaps/
- [ ] T043 [P] [US4] Create packages/eject-customize/src/customize/swapper.ts: FrameworkSwapper executing swap scripts, removing old framework, installing replacement (FR-007)
- [ ] T044 [P] [US4] Create packages/eject-customize/src/customize/type-checker.ts: TypeSafetyChecker validating end-to-end type safety maintained after swap
- [ ] T045 [US4] Integrate framework swaps into customize command alongside module installations (FR-007)
- [ ] T046 [P] [US4] Create .customize-modules/framework-swaps/orpc-to-trpc/ with swap.sh, validation.sh, and replacement files
- [ ] T047 [P] [US4] Create .customize-modules/framework-swaps/auth-provider-swap/ with example auth provider alternatives and swap logic

**Checkpoint**: Framework swapping available for power users - template adaptable to any tech stack

---

## Phase 7: CLI Integration & Polish

**Purpose**: Wire everything together, create user-facing CLI, polish error messages and documentation

- [ ] T048 Create packages/eject-customize/src/cli.ts: Main CLI entry point dispatching to eject or customize commands
- [ ] T049 Create packages/eject-customize/src/commands/ directory with command implementations using commander.js (parse args, flags like --auto-yes, --full-validate, --dry-run)
- [ ] T050 [P] Add comprehensive --help documentation and usage examples to both eject and customize commands
- [ ] T051 [P] Polish error messages with recovery suggestions per FR-014 (what failed, why, suggested action)
- [ ] T052 Update root README.md with Eject and Customize section, quick start examples, troubleshooting guide
- [ ] T053 Create .docs/guides/EJECT-CUSTOMIZE.md with detailed workflows, feature manifest format, module creation guide
- [ ] T054 Create packages/eject-customize/README.md with architecture overview, package structure, development guide
- [ ] T055 [P] Add integration tests validating full workflows: eject → validate build → customize → validate build
- [ ] T056 [P] Add end-to-end test with real project: fork template → run eject → run customize → verify everything works
- [ ] T057 Test on Windows/Mac/Linux/Docker environments to ensure cross-platform compatibility
- [ ] T058 Security review: validate Git command safety, file operation safety, manifest injection prevention
- [ ] T059 Performance testing: validate eject completes in <2 min, customize <1 min per SC-001, SC-003
- [ ] T060 Create example .eject-manifests/ with complete feature removal definitions: orpc.manifest.json, better-auth.manifest.json, redis.manifest.json, docs-site.manifest.json, showcase.manifest.json

**Checkpoint**: System complete, tested, documented, and ready for production use

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational - BLOCKING)
    ↓
    ├─→ Phase 3 (User Story 1 - P1)
    ├─→ Phase 4 (User Story 2 - P1) [depends on US1]
    ├─→ Phase 5 (User Story 3 - P2)
    └─→ Phase 6 (User Story 4 - P3)
    ↓
Phase 7 (Polish)
```

**Critical Path**:
1. Setup (T001-T008): ~1-2 hours
2. Foundational (T009-T017): ~4-6 hours (BLOCKS everything)
3. User Stories can proceed in parallel after Foundational completes

### User Story Delivery Order

**MVP First** (Recommended approach):
1. Complete Phase 1 + 2 → Foundation ready
2. Implement Phase 3 (US1) → Eject works
3. Deploy/demo working eject
4. Add Phase 4 (US2) → Better UX
5. Add Phase 5 (US3) → Customize available
6. Add Phase 6 (US4) → Advanced features

**Parallel Team Strategy** (if multiple developers):
- Developer 1: US1 (Phase 3)
- Developer 2: US3 (Phase 5)
- Developer 3: US4 (Phase 6)
- All depend on Phase 2 completion

### Parallel Opportunities

**Within Phase 1**: T003, T004 (config files) can run in parallel
**Within Phase 2**: T010-T017 all parallelizable after T009 types complete
**Within Phase 3**: T018, T019, T021, T022, T023, T024 parallelizable after T009 types
**Within Phase 5**: T033, T034, T035, T040, T041 parallelizable
**Within Phase 6**: T042, T043, T044, T046, T047 parallelizable
**Between Stories**: Phase 3/4/5/6 can run in parallel once Phase 2 complete

---

## Implementation Strategy

### MVP Scope (Phase 1-3 only)

**Minimum viable product** = working eject command

1. Phase 1: Setup (T001-T008) - 1-2 hours
2. Phase 2: Foundational (T009-T017) - 4-6 hours
3. Phase 3: Eject (T018-T027) - 3-4 hours

**Total**: ~9-12 hours for working MVP  
**Deliverable**: `bun run eject` command removes showcase and optional features, validates build  
**Success Criteria Met**: SC-001 (2 min), SC-002 (95% build success), SC-004 (docs update), SC-006 (recovery)

### Incremental Delivery

```
Iteration 1: MVP (Phase 3)
  Eject works, showcase removed, features selectable
  ↓ Deploy

Iteration 2: UX (Phase 4)
  Enhanced prompts, compatibility checking, preview analysis
  ↓ Deploy

Iteration 3: Customize (Phase 5)
  Add modules, integration validation
  ↓ Deploy

Iteration 4: Advanced (Phase 6)
  Framework swaps, power user features
  ↓ Deploy

Iteration 5: Polish (Phase 7)
  CLI integration, documentation, testing
  ↓ Production Ready
```

Each iteration is independently deployable and adds value.

### Team Coordination

**Shared responsibilities** (foundation):
- Developer A + B: Phase 1-2 (setup + foundational)

**Parallel implementation** (after foundation):
- Developer A: Phase 3 (US1 eject)
- Developer B: Phase 5 (US3 customize)
- Developer C: Phase 6 (US4 swaps)

**Integration**:
- Developer A: Phase 4 (US2 enhancements) + Phase 7 (CLI)
- All: Testing and cross-platform validation

---

## Task Reference & Status

### Total Tasks by Phase

| Phase | Name | Tasks | Duration | Blocking |
|-------|------|-------|----------|----------|
| 1 | Setup | T001-T008 | 1-2h | Yes (for P2) |
| 2 | Foundational | T009-T017 | 4-6h | **YES - ALL STORIES** |
| 3 | US1 - Eject | T018-T027 | 3-4h | No (MVP) |
| 4 | US2 - Prompts | T028-T032 | 2-3h | No (enhancement) |
| 5 | US3 - Customize | T033-T041 | 3-4h | No (parallel) |
| 6 | US4 - Framework | T042-T047 | 2-3h | No (parallel) |
| 7 | Polish | T048-T060 | 4-5h | No (final) |

**Total**: ~60 tasks, 19-27 hours estimated

### Task Count Summary

- **Parallelizable [P]**: 33 tasks (55% of implementation work)
- **Sequential**: 27 tasks (45% of implementation work)
- **Tests**: 0 test-specific tasks (tests can be added if TDD requested)
- **User Story 1 (P1)**: 10 tasks (MVP core)
- **User Story 2 (P1)**: 5 tasks (UX enhancement)
- **User Story 3 (P2)**: 9 tasks (Feature addition)
- **User Story 4 (P3)**: 6 tasks (Advanced feature)

---

## Success Metrics

Upon completion of each user story checkpoint:

**After Phase 3 (US1)**:
- ✅ `bun run eject` command exists and runs
- ✅ Interactive prompts display all features
- ✅ Selected features are removed from codebase
- ✅ Project builds successfully post-removal
- ✅ Rollback works if operation fails
- ✅ Meets SC-001 (2 min eject), SC-002 (95% success), SC-006 (1 min recovery)

**After Phase 4 (US2)**:
- ✅ Feature descriptions shown in prompts
- ✅ Incompatibility detection and warnings
- ✅ Pre-removal analysis preview
- ✅ Better UX prevents accidental removals
- ✅ Meets SC-005 (80% independent task completion)

**After Phase 5 (US3)**:
- ✅ `bun run customize` command exists
- ✅ Module registry loaded and displayed
- ✅ Modules can be installed to ejected projects
- ✅ Post-install validation ensures build success
- ✅ Meets SC-003 (3+ module types), SC-004 (auto-docs)

**After Phase 6 (US4)**:
- ✅ Framework swaps available via customize
- ✅ Type safety maintained after swap
- ✅ End-to-end contracts still work
- ✅ Meets SC-007 (90% auto-feature identification)

**After Phase 7 (Polish)**:
- ✅ CLI fully integrated with root `bun run` scripts
- ✅ Comprehensive error messages and recovery guidance
- ✅ Full test coverage of workflows
- ✅ Cross-platform compatibility verified
- ✅ Documentation complete and tested
- ✅ Ready for production release

---

## Notes

- **No tests specified**: Specification doesn't require tests. Integration validation is done post-operation (build check). Tests can be added in Phase 7 if desired.
- **[P] markers**: 33 tasks are parallelizable (55% of work). With 3 developers, foundational phase could complete in ~1.5-2 hours.
- **Checkpoint validation**: Each phase has a clear checkpoint where that user story is independently testable without depending on later phases.
- **Git workflow**: All major phases commit their completed work to branch `002-eject-and-customize` for review before merge to main.
- **Shared infrastructure**: Phase 2 is the critical path item - slowing down here blocks everything else.
- **MVP recommendation**: Deploy after Phase 3 - eject command alone provides significant value and meets 4/7 success criteria.
