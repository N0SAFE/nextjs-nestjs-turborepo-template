# Tasks for: Build package handler

Feature: Build package handler
Spec: `specs/002-build-package-handler/spec.md`
Branch: `002-build-package-handler`

## Phase 1 — Setup (project initialization)

-   [ ] T001 Create project feature tasks file `specs/002-build-package-handler/tasks.md` (FR-010)
-   [ ] T002 [P] Scaffold the `packages/build-system` project using Nest CLI and initialize package manifest and workspace scripts (e.g. `npx @nestjs/cli new build-system --directory packages/build-system`). (FR-001, FR-010)
-   [ ] T003 [P] Create initial README `packages/build-system/README.md` with quick links to `specs/` files (FR-010)
-   [ ] T004 Add TypeScript config and build scripts to `packages/build-system/tsconfig.json` and `packages/build-system/package.json` scripts (FR-001)

## Phase 2 — Foundational (blocking prerequisites)

-   [ ] T005 [P] Adapt the generated NestJS bootstrap and add CLI glue (`packages/build-system/src/main.ts`, `packages/build-system/cli.ts`) to expose the local build contract (CLI + programmatic API). (FR-001, FR-002)
-   [ ] T006 [P] Scaffold `packages/build-system/src/build.module.ts` and export `BuildModule` (FR-001)
-   [ ] T007 Create `packages/build-system/src/types.ts` with `PackageBuildConfig`, `BuildJob`, `BuildArtifact`, `BuildResult` type stubs (FR-002, FR-001)
-   [ ] T008 Create runtime schema loader `packages/build-system/src/config.ts` (loads `build.config.ts` or `build.config.js`) (FR-005)
-   [ ] T009 [P] Add basic lock util `packages/build-system/src/lock.ts` with mkdir-lock MVP implementation (FR-008)
-   [ ] T010 Create repository abstraction `packages/build-system/src/repositories/cache.repository.ts` and `packages/build-system/src/repositories/buildjob.repository.ts` to own cache/metadata persistence (filesystem MVP). (FR-003)
-   [ ] T011 Implement runtime config validation `packages/build-system/src/validation/config.validator.ts` (Zod schema + runtime loader integration for `build.config.ts`). (FR-005)

## Phase 3 — User Story 1 (Developer CLI) [US1]

Story US1: As a developer, I want to run `build:package <pkg>` locally so I can build a package quickly using the preferred local builder (bun) and see structured results.

Independent test criteria (US1):

-   Dev can run `node packages/build-system/cli.js build:package packages/ui` and get an exit code and JSON summary at `--json`.
-   The CLI returns a `BuildResult` JSON with `artifacts[]`, `durationMs`, `success`.

Tasks for US1:

-   [ ] T012 [US1] Implement `packages/build-system/src/commands/build.command.ts` (nest-commander) with --json flag and CLI options. File: `packages/build-system/src/commands/build.command.ts` (FR-001)
-   [ ] T013 [US1] Implement `packages/build-system/src/services/build.service.ts` orchestrator method `buildPackage(pkgPath, options)` that uses locks and adapters. File: `packages/build-system/src/services/build.service.ts` (FR-001, FR-003)
-   [ ] T014 [US1] Hook the CLI command to `BuildService.buildPackage()` and return structured output in `packages/build-system/src/commands/build.command.ts` (FR-001, FR-002)
-   [ ] T015 [US1] Write a small integration test `packages/build-system/test/cli.build.test.ts` that runs the CLI against a tiny demo package (see demo task) and asserts JSON keys (FR-001, FR-002, FR-006)
-   [ ] T016 [US1] Implement `packages/build-system/src/commands/list.command.ts` (`build:list`) to provide discoverability of buildable packages and their options. File: `packages/build-system/src/commands/list.command.ts` (FR-009)
-   [ ] T017 [US1] Implement `packages/build-system/src/commands/clean.command.ts` (`build:clean`) to clean package outputs and cache. File: `packages/build-system/src/commands/clean.command.ts` (FR-007)

## Phase 4 — User Story 2 (Bun adapter + adapter core) [US2]

Story US2: As a developer, I want the system to prefer the Bun adapter locally and execute `bun build` reliably capturing stdout/stderr, exit code and artifacts.

Independent test criteria (US2):

-   Adapter spawns `bun build` for the package, returns exit code and a list of discovered artifact paths with checksums.

Tasks for US2:
(P) [ ] T018 [US2] Design adapter interface `packages/build-system/src/adapters/adapter.ts` (methods: build(), streamLogs(), discoverArtifacts())

-   [ ] T019 [US2] Implement adapter registry/loader `packages/build-system/src/adapters/index.ts` with priority (bun → esbuild → tsc → rollup)
-   [ ] T020 [US2] Implement Bun adapter `packages/build-system/src/adapters/bun.adapter.ts` that shells `bun build`, captures logs, and returns `BuildResult`
-   [ ] T021 [US2] Add integration test `packages/build-system/test/bun.adapter.test.ts` that validates `BuildResult` shape (can be skipped in CI if Bun not present; test guarded)
        (FR-011)

## Phase 5 — User Story 3 (Other adapters and selection) [US3]

Story US3: As a developer/CI user, I want alternative adapters (esbuild/tsc/rollup) available so packages without Bun can still be built.

Independent test criteria (US3):

-   Each adapter can be selected by the registry and produces `BuildResult` compatible with consumers.

Tasks for US3:
(P) [ ] T022 [US3] Implement esbuild adapter `packages/build-system/src/adapters/esbuild.adapter.ts` (Node API or CLI)

-   [ ] T023 [US3] Implement tsc adapter `packages/build-system/src/adapters/tsc.adapter.ts` (tsc --build)
-   [ ] T024 [US3] Implement rollup adapter `packages/build-system/src/adapters/rollup.adapter.ts`
-   [ ] T025 [US3] Add adapter selection unit tests `packages/build-system/test/adapters.test.ts`
        (FR-011)

## Phase 6 — Caching, locking improvements & robust behavior

(P) [ ] T026 Implement cache keying and storage `packages/build-system/src/cache/index.ts` (input hashing, metadata files)

-   [ ] T027 Improve locking with heartbeat & TTL in `packages/build-system/src/lock.ts` and add tests `packages/build-system/test/lock.test.ts`
-   [ ] T028 Add cache invalidation/GC strategy and CLI hooks `packages/build-system/src/cache/gc.ts`
        (FR-003, FR-008)

## Phase 7 — Programmatic API, CI integration & docs

(P) [ ] T029 [P] Export programmatic API `packages/build-system/src/index.ts` with `buildPackage()` and typed types

-   [ ] T030 [P] Add CI-friendly `--json` mode behavior documentation in `specs/002-build-package-handler/quickstart.md` and `packages/build-system/README.md`
-   [ ] T031 Create example CI job YAML `specs/002-build-package-handler/ci-example.yml` showing how to run and upload artifacts
        (FR-001, FR-004, FR-010)

## Phase 8 — Tests, demo package & validation

(P) [ ] T032 Create demo package `packages/demo-package/` with `build.config.ts` example and source to exercise adapters

-   [ ] T033 Write comprehensive integration tests `packages/build-system/test/integration.test.ts` using the demo package
-   [ ] T034 Run monorepo tests and ensure `bun run test` includes package tests
        (FR-001, FR-003, FR-011)

## Final Phase — Polish, docs, release

    - [ ] T035 Fix TypeScript & lint issues in `packages/build-system/src/*` and run `bun run lint` and `bun run build` (FR-010)

-   [ ] T036 Update root docs and `.docs` references to include the new package (README links). Files: `README.md`, `.docs/`, `specs/002-build-package-handler/quickstart.md` (FR-010)
-   [ ] T037 Prepare PR: commit branch `002-build-package-handler`, create PR with checklist and request reviewers. Files: `.github/PULL_REQUEST_TEMPLATE.md` (update), `specs/002-build-package-handler/tasks.md` (FR-010)
-   [ ] T038 Prepare release: bump `packages/build-system/package.json` version and document publishing or local usage. File: `packages/build-system/package.json` (FR-010)

## Additional Quality & Governance Tasks

-   [ ] T039 Create benchmark harness and baseline measurements `specs/002-build-package-handler/benchmarks/README.md` and `packages/build-system/scripts/benchmark.js` to measure cached vs full build times for the demo package and document the CI/dev hardware baseline.
-   [ ] T040 Implement cache correctness and hit/miss tests `packages/build-system/test/cache.correctness.test.ts` and include scenarios (cold build, cached build, invalidation) exercised by the demo package.
-   [ ] T041 Decide and implement config-loading strategy for `build.config.ts` in CI and local dev: add `packages/build-system/src/config/loader.ts` and documentation `specs/002-build-package-handler/quickstart.md` entry describing the chosen approach (ts-node, precompile, or JS fallback).
-   [ ] T042 Add PR checklist and review gating to ensure ORPC contracts are authored before any cross-service RPCs: create `.github/PULL_REQUEST_TEMPLATE.md` with an explicit item reminding reviewers to require ORPC contracts in `packages/api-contracts/` when RPC endpoints are introduced.
        (FR-003, FR-010, FR-005)

## Dependencies

-   US1 depends on Phase 2 (foundational types, CLI bootstrap) and Phase 4 (adapter core + bun adapter)
-   US2 depends on adapter core (T014–T015) before T016
-   US3 adapters can be implemented in parallel but must conform to adapter interface (T014)

## Parallel execution examples

-   Adapter implementations (T016, T018–T020) are parallelizable across engineers ([P]) because they live in separate files and implement the same interface.
-   Docs, README updates and CI examples (T026–T027) can be worked on in parallel with adapter implementation.

## Implementation strategy

-   MVP first: implement CLI + build service + bun adapter (T010–T013, T014–T016) and the demo package (T028) to get an end-to-end flow.
-   Incrementally add adapters and caching/locking improvements, adding tests after each adapter is available.
-   Keep changes small, run TypeScript and Vitest after each commit.

---

If you'd like, I will now create this `tasks.md` file in the repo (already prepared) and run the verification script `.specify/scripts/bash/manage-tasks.sh verify specs/002-build-package-handler/tasks.md` and iterate until it passes.
