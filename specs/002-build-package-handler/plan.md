tests/
# Implementation Plan: Build package handler

**Branch**: `002-build-package-handler` | **Date**: 2025-10-24 | **Spec**: `specs/002-build-package-handler/spec.md`
**Input**: Feature specification from `/specs/002-build-package-handler/spec.md`

## Summary

Create a monorepo package at `packages/build-system` that provides a single, consistent contract
to build workspace packages. The package will provide a NestJS-based CLI (using `nest-commander`),
a programmatic Node API, and a modular adapter system to support multiple builders (bun, esbuild, tsc,
rollup). Key responsibilities:

- Orchestrate package builds via CLI and API
- Enforce per-package locking (MVP: directory-based lock) to prevent concurrent output corruption
- Provide incremental caching and structured JSON build results
- Support a per-package TypeScript-first configuration (`build.config.ts`) with runtime validation
- Prefer `bun build` in developer environments but be adapter-agnostic for CI

This plan follows the repository constitution (ORPC, Service-Adapter pattern, documentation-first)
and the project's core concepts (see `docs/core-concepts/`).

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js/Bun runtime)
**Primary Dependencies**: NestJS 10.x, nest-commander, Bun (when available), esbuild, rollup, TypeScript (tsc), cross-spawn or execa for process execution, zod for runtime validation, tanstack/query only if needed for client caching (optional)
**Storage**: Local filesystem for artifacts and cache metadata; optional integration with PostgreSQL for persisted build job metadata (out-of-scope for MVP)
**Testing**: Vitest (existing monorepo standard)
**Target Platform**: Linux-based developer workstations and CI runners (Docker-first)
**Project Type**: Monorepo shared package under `packages/build-system`
**Performance Goals**: Cached builds < 60s for small packages; full builds < 5 minutes on CI baseline (targets)
**Constraints**: Must follow core concepts (ORPC-first if RPCs are added), Docker-first development, and workspace conventions (workspace references, Turborepo)
**Scale/Scope**: Initially intended for monorepo packages (JS/TS). Not targeting native binary builds for MVP.

## Constitution Check

GATE: The design MUST comply with the repository constitution. Key checks:

- ORPC: If cross-service RPCs are added, define contracts in `packages/api-contracts/` prior to implementation. (Design decision: initial programmatic API is local Node export; no cross-service RPCs are required in MVP.)
- Service-Adapter: Build orchestration core will apply Service-Adapter principles: `controllers/commands` (NestJS CLI) → `services` (orchestration) → `repositories` (cache/metadata) → `adapters` (builder implementations).
- Docker-First: CLI and programmatic API must be runnable both in local (host) and Docker dev mode; documentation will include `bun run dev:web` guidance and `bun run dev` for full stack.

Conclusion: PASS for Phase 0 with the following follow-ups in Phase 0 research to confirm implementation details (see `research.md`).

## Project Structure

Documentation and plan artifacts (in repo):

```
specs/002-build-package-handler/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 decisions and references
├── data-model.md        # Phase 1: entities and types
├── quickstart.md        # Phase 1: quickstart and CI examples
├── contracts/           # Phase 1: ORPC contract drafts (if needed)
└── tasks.md             # Phase 2: tasks and issue list
```

Source layout (implementation):

```
packages/build-system/
├── package.json
├── README.md
├── src/
│   ├── main.ts                 # NestJS CLI bootstrap (re-usable in apps/api/src/cli.ts)
│   ├── build.module.ts         # NestJS module wiring services and commands
│   ├── commands/
│   │   ├── build.command.ts    # `build:package` (nest-commander)
+│   │   ├── list.command.ts     # `build:list`
│   │   └── clean.command.ts    # `build:clean`
│   ├── services/
│   │   └── build.service.ts    # orchestration logic
│   ├── adapters/               # concrete builder adapters (bun, esbuild, tsc, rollup)
│   ├── lock.ts                 # per-package locking utilities
+│   ├── cache/                  # cache keying and storage helpers
│   └── types.ts                # PackageBuildConfig, BuildJob, BuildArtifact, BuildResult
└── cli.ts                      # thin bootstrap for direct node invocation
```

**Structure Decision**: Use a package-scoped NestJS module (in `packages/build-system`) for CLI commands to allow reusing the same DI/bootstrap logic in `apps/api/src/cli.ts` if desired. This keeps the implementation consistent with existing repo CLI patterns.

## Complexity Tracking

No constitution violations identified that require exception. The design enforces Service-Adapter pattern and ORPC requirements: any cross-service RPC will be designed as ORPC contracts in `packages/api-contracts/` before implementation.

## Phase 0: Research (deliverable: `research.md`)

Research items to resolve before Phase 1 design (will be produced in `research.md`):

1. Best practice for invoking `bun build` programmatically in Node (spawn vs bun JS API) and capturing artifacts and exit codes reliably.
2. Strategies for loading TypeScript `build.config.ts` at runtime in CI (precompile vs ts-node vs require hook) and recommended approach for Docker-based CI.
3. Cross-platform locking primitives in Node (fs lockfile vs mkdir-based lock vs flock native bindings) and recommendations for robust cross-process locks in containers.
4. Artifact discovery strategies: canonical glob patterns and checksum computation (sha256) for artifacts produced by various builders.
5. nest-commander wiring pattern and matching bootstrap code to align with `apps/api/src/cli.ts` (DI and shared modules reuse).

## Phase 1: Design & Contracts (deliverables: `data-model.md`, `contracts/`, `quickstart.md`)

After Phase 0 research completes we will:

- Finalize `PackageBuildConfig` TypeScript definition and Zod runtime schema
- Draft ORPC contract (if external services need to invoke builds remotely)
- Design the adapter interface (input options, stdout/stderr streaming, artifact discovery contract)
- Implement `build.service.ts` orchestrator that uses adapters + lock + cache
- Provide quickstart docs showing local developer and CI invocation examples

## Phase 2: Implementation & Validation

Phase 2 will implement the NestJS CLI, the Bun adapter (priority), additional adapters, caching, tests, and documentation. Each merge will include unit tests and a sample demo package to exercise the full flow.

## Artifacts to Commit

- `packages/build-system/*` (implementation)
- `specs/002-build-package-handler/*` (plan, research, data-model, quickstart, contracts)
- README updates linking to the new package

## Next steps (immediate)

1. Run research tasks and produce `research.md` (Phase 0).  
2. After research, produce `data-model.md`, `contracts/*`, and `quickstart.md` (Phase 1).  
3. Implement NestJS module + `build:package` command and a working Bun adapter (Phase 2 start).  


