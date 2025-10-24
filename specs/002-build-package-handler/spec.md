```markdown
# Feature Specification: Build package handler

**Feature Branch**: `002-build-package-handler`  
**Created**: 2025-10-23  
**Status**: Draft  
**Input**: User description: "i want to build a package desingated to handle the build case of other packages"

## Summary

Create a shared monorepo package whose responsibility is to orchestrate, standardize, and run "build" workflows for other workspace packages. The package will provide a clear contract and CLI/API for invoking package builds (local developer, CI, and tooling), handle incremental build caching, surface structured build results, and integrate with the repository's existing tooling and documentation requirements.

This specification focuses on WHAT the package must provide (developer and CI value), why it matters, and measurable success criteria. Implementation choices (runtimes, specific build tools) are intentionally left out; the package must remain adaptable to the monorepo's conventions.

## Clarifications

### Session 2025-10-23

- Q: How should concurrent builds for the same package be handled? → A: Per-package lock (serialize builds) — MVP will acquire a per-package lock and run one build at a time to avoid output corruption. Future evolutions may include per-build isolated outputs, a central queue/worker pool, or containerized isolated builds for larger scale.
 - Q: Should the build system support multiple bundlers/builders (bun, esbuild, tsc, rollup)? → A: Yes — the build system will use a modular adapter/plugin architecture that prefers `bun build` when available but supports adapters for `esbuild`, `tsc` (TypeScript compiler), `rollup` and others. Adapters provide a consistent invocation surface and options mapping so packages can specify a `builder` and `builderOptions` in their `build.config.ts`.

### Glossary — "contract" vs "ORPC contract"

To avoid ambiguity in this specification, note the two uses of the word "contract":

- "build contract" (local): the CLI + programmatic API that consumers (developers, CI, tooling) use to invoke builds. This is implemented inside `packages/build-system` and is not, by itself, an inter-service RPC.
- "ORPC contract" (cross-service): an ORPC contract defined under `packages/api-contracts/` that describes a type-safe RPC between services. Per the repository constitution, any cross-service RPC must first be expressed as an ORPC contract before its server or client implementation is added.

Use the term "build contract" when referring to the local CLI/API, and "ORPC contract" when referring to cross-service RPCs to avoid accidental constitution violations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer: Run a package build (Priority: P1)

As a developer I want to run a build for a specific package in the monorepo using a single, consistent command so that I can produce build artifacts and verify the package is production-ready.

**Why this priority**: Developer productivity is critical; consistent builds reduce onboarding friction and CI problems.

**Independent Test**: From a clean workspace, run the package build command for a sample package and verify that build artifacts are produced and tests (if configured) run as part of the build.

**Acceptance Scenarios**:

1. **Given** a package with a valid build config, **When** a developer runs `build` for that package, **Then** the package produces expected artifacts into a documented output location and exits with status 0.
2. **Given** a package with build errors, **When** a developer runs `build`, **Then** the command fails with structured errors and a non-zero exit code.

---

### User Story 2 - CI: Orchestrate builds in CI pipeline (Priority: P1)

As a CI operator I want CI jobs to call the same package build contract so that CI results match local developer builds and caching can be reused across environments.

**Why this priority**: Ensures parity between local and CI builds and reduces duplicated configuration.

**Independent Test**: Configure a CI job to call the package build command for a package and verify the produced artifacts and exit code match a local run.

**Acceptance Scenarios**:

1. **Given** a CI runner environment and the package build command, **When** the job runs, **Then** artifacts are produced and stored in CI artifacts (or uploaded to configured storage) and the job exits with status 0.

---

### User Story 3 - Tooling: Query build status programmatically (Priority: P2)

As a tooling integrator I want to invoke the build API and receive structured results (success, artifacts, logs, duration) so other tools can react to build outcomes.

**Why this priority**: Enables observability and automation (e.g., dashboards, incremental deployments).

**Independent Test**: Call the build API for a sample package and assert the response contains structured fields: status, duration, artifact list, and error messages when applicable.

**Acceptance Scenarios**:

1. **Given** a build was invoked, **When** the tooling queries the build status, **Then** it receives a JSON object with status, timestamps, duration, and artifact URIs (or paths).

---

### Edge Cases

- Building a package with missing or invalid build configuration (should fail gracefully with clear error messages).
- Concurrent builds for the same package requested (should serialize or isolate work to avoid corrupting shared outputs).
- Build cache invalidation when source files change in ways that require a full rebuild.
- Network or storage unavailability when uploading artifacts (should retry with backoff and provide clear failure reason).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a simple contract (CLI and programmatic API) to invoke a build for a specified package and an optional set of flags (e.g., clean, incremental, target).
- **FR-002**: The system MUST return structured build results containing at minimum: status (success/failure), exit code, duration, artifact list (paths/URIs), and machine-readable error details.
- **FR-003**: The system MUST support incremental builds using a local cache so repeated builds for unchanged inputs avoid redoing work.
- **FR-004**: The system MUST allow CI to run builds deterministically and document how to invoke the build contract from CI jobs.
- **FR-005**: The system MUST validate package build configuration before executing and emit clear, actionable validation errors.
- **FR-006**: The system MUST surface build logs (streaming or stored) and correlate them with the structured build result.
- **FR-007**: The system MUST expose a means to clean build outputs and the build cache for a package.
 - **FR-008**: The system MUST detect and prevent unsafe concurrent operations on the same package output. MVP behavior: acquire a per-package lock and serialize builds for that package to avoid output corruption. Future options may include per-build isolated output directories, a central queue/worker pool, or containerized isolated builds.
- **FR-009**: The system MUST provide discoverability: list which packages can be built and their supported build options.
- **FR-010**: The system MUST include documentation and a quickstart in the monorepo docs and update parent README when the package is added.

 - **FR-011**: The system MUST support multiple bundlers/builders via a modular adapter/plugin interface. The system should prefer `bun build` when available (developer environment) but be able to invoke adapters for `esbuild`, the TypeScript compiler (`tsc`), `rollup`, or other builders as configured by the package's `build.config.ts` or global defaults.

### Non-functional Requirements

- **NFR-001**: Build invocation should produce output and complete within acceptable developer wait-times for small packages (target: under 60s for cached builds, under 5 minutes for full builds on CI hardware baseline) — these are targets and can be refined.
- **NFR-002**: The package must provide clear failure modes and non-zero exit codes usable by CI for job status.
- **NFR-003**: Build artifacts and cache metadata must be stored in a well-known location per package and documented.

### Key Entities *(include if feature involves data)*

- **BuildJob**: Represents an invocation (id, packageName, inputHash, startTime, endTime, status, artifacts[], logs[])
- **BuildArtifact**: Descriptor for produced files (path, size, checksum, optional URI)
- **PackageBuildConfig**: Per-package metadata describing build inputs, outputs, and flags
- **CacheEntry**: Metadata describing cached outputs for an inputHash with timestamps and expiry policy

### Package configuration (TypeScript)

Each package that participates in the build system SHOULD provide a TypeScript-based configuration file to describe how it should be built. This file should live at the package root and follow a stable filename convention such as `build.config.ts` or `package.build.config.ts`.

Guidelines for the per-package TypeScript configuration:

- Provide a typed export (e.g., `export const buildConfig: PackageBuildConfig`) so the build system can import and statically type-check the configuration during local development.
- The configuration MUST document and, where possible, strongly type the following areas (non-exhaustive):
	- package identity (name, optional friendlyName)
	- build entry points / commands (scripts or tool-specific entry)
	- output locations (default output dir, publication artifacts)
	- artifact globs and metadata (paths, checksums, optional publish URIs)
	- cache rules (include/exclude globs, custom cache key strategy, expiry)
	- incremental flags (which tasks are incremental vs full-rebuild)
	- pre/post build hooks (scripts or node functions)
	- environment variables required for the build and recommended defaults
	- clean commands and safe-clean flags
	- per-environment overrides (development, ci, production)
	- optional runtime validation schema (for example a Zod schema) exported alongside the typed config to enable the build system to perform runtime validation before executing.


	- builder selection (e.g., 'bun' | 'esbuild' | 'tsc' | 'rollup' | 'custom') and `builderOptions` for adapter-specific overrides. The `builder` field allows a package to prefer `bun` during local development while CI or specific environments may override to use `esbuild` or `tsc`.

Notes:
- While the configuration is TypeScript-first for developer ergonomics and IDE support, the build system should also support reading a compiled JS version at runtime (for CI runners that do not transpile TypeScript). The recommended practice is to provide both `build.config.ts` and a precompiled `build.config.js` as part of the package's repository artifacts or to compile on-demand as part of the build invocation.
- The repository-level `PackageBuildConfig` type (defined by the build system package) should be small and extensible; packages may include additional fields but the build system must only rely on the documented core fields for compatibility.

## Architecture Requirements (Core Concepts Compliance)

- The package MUST follow repository governance: provide documentation updates (Documentation Maintenance) and add parent README links when installed (Core Concept 10).
- For API-style invocations inside the repo, follow the ORPC contract-first approach when adding RPC-like endpoints between services (Core Concept 09): define contracts in `packages/api-contracts/` if cross-service RPCs are added.

- The build system MUST be designed as a modular adapter/plugin architecture for builders. Adapters expose a stable invocation contract (input, options, stdout/stderr handling, artifact discovery) and are responsible for translating generic build inputs into builder-specific invocations. This keeps the core orchestration logic independent of the concrete bundler implementations.
- Backend-style functionality (if any long-running service components are introduced) MUST adhere to the Service-Adapter pattern: Controllers → Services → Repositories → DatabaseService (Core Concept 02).
- If build-related data requires authentication or access control, integrate with the central AuthService wrapper (Core Concept 07) rather than custom auth logic.
- Data ownership and persistence must adhere to Repository Ownership rules (Core Concept 03): domain-specific data (cache metadata, logs) should be owned by this feature's repository layer and not scattered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can run a package build with a single documented command and receive an exit status and structured result; verification: run command in a clean workspace and observe artifacts and status 100% of the time for supported packages.
- **SC-002**: Cached builds reduce developer build time by at least 50% compared to uncached full builds for small-to-medium packages (measured across sample packages in the repo).
- **SC-003**: CI can call the same build contract and succeed in producing artifacts and a non-zero exit code on failure; verification: CI job using the build contract passes for a known-good package.
- **SC-004**: Documentation added to the monorepo (package README and parent README link) and a Quickstart demonstrates local and CI invocation.
- **SC-005**: Structured build results are machine-parseable (JSON) and include the required fields (status, duration, artifacts, errors) in 100% of invocations.

## Assumptions

- The monorepo will decide the package's location (recommended: `packages/build-system` or `packages/package-builder`) during implementation.
- Initial scope excludes building native binaries in special sandboxes; the package will target the repository's existing build targets (JS/TS web and node packages) on first delivery.
- Artifact storage beyond local filesystem (e.g., remote artifact registry) is out of scope for MVP but should be supported via extensible hooks.

## Out of Scope

- Provisioning remote artifact registries, advanced distributed caching across cluster nodes, and native/image compilation for platforms not currently used in the monorepo.

## Next Steps

1. Create package skeleton at `packages/build-system` and add README + quickstart.
	 - Recommended: use the NestJS CLI to scaffold the initial project. Example:
		 ```bash
		 # from repo root
		 npx @nestjs/cli new build-system --directory packages/build-system
		 # or, if nest is installed globally:
		 nest new build-system --directory packages/build-system
		 ```
		 After scaffolding, adapt the generated files to the monorepo layout (workspace package.json, tsconfig paths), add the `BuildModule` and CLI glue described in this spec, then commit the scaffold as the initial implementation.
2. Define minimal build contract (CLI + programmatic API) and document how to invoke from CI.
3. Implement incremental cache and basic locking to prevent concurrent output corruption.
4. Add documentation updates and a short demo package in `apps/web` or `packages/ui` to validate workflows.

```
