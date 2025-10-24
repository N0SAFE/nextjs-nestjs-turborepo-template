# Research Notes — Build package handler (Phase 0)

Date: 2025-10-24

This file records short research outcomes for items enumerated in `plan.md`.

1) Invoking `bun build` programmatically

Decision: Use a spawned process (execa or cross-spawn) to invoke `bun build`.

Rationale:
- Bun exposes a CLI but no stable official Node API for `bun build` across versions; spawning the binary provides a deterministic contract for exit codes and stream capture.
- `execa` provides nice defaults for capturing stdout/stderr, returning exit codes and supports streaming.
- When running inside Bun runtime it's still safe to spawn `bun` as `bun` binary; prefer full path resolution and fallback to `bun` in PATH.

Implementation notes:
- Use `execa.command('bun build', { cwd, env, stdio: 'pipe' })` for non-streaming simple calls; for streaming logs use `execa('bun', ['build'], { cwd })` and forward `stdout`/`stderr` to listeners.
- Capture exit code, duration, stdout/stderr (with size cap for memory safety) and artifact discovery afterwards via configured globs.

Alternatives considered:
- Embedding Bun internals (not recommended: private API, compatibility risk)

2) Loading `build.config.ts` in CI

Decision: Support both strategies but recommend precompiled `build.config.js` for CI and support `ts-node/register` fallback when `build.config.ts` only is present.

Rationale:
- CI images often don't include TS toolchain; requiring `ts-node` increases CI image size and complexity.
- Documented Quickstart will recommend including `build.config.js` in CI artifacts or compile step as part of CI setup.

Implementation notes:
- Loader logic: attempt to require `./build.config.js`; if absent and `build.config.ts` exists, attempt `esbuild-register` or `ts-node` if installed (but prefer failing with actionable error instructing to precompile or install `ts-node`).
- Provide helper CLI flag `--compile-config` that will compile `build.config.ts` to a temp JS file using esbuild on-demand (fast) and load it, then remove temp file.

3) Cross-process locking

Decision: Use mkdir-based atomic lock (mkdir of `.build-lock`) with PID file + TTL watchers as MVP. Evaluate `proper-lockfile` (npm) for a more robust cross-platform solution in later phases.

Rationale:
- mkdir is atomic on POSIX and works in containers. It avoids native bindings and is simple.
- Add TTL and heartbeat detection to recover stale locks.

Implementation notes:
- `acquireLock(packageRoot, {timeoutMs})` creates a lock dir `.build-lock` with metadata (pid, startedAt, hostname).
- Release by removing dir; on startup, if lock dir older than TTL and PID absent, treat as stale and remove after logging.

4) Artifact discovery and checksums

Decision: Use configured `artifactGlobs` in `build.config`, defaulting to common patterns (`dist/**`, `build/**`, `lib/**`, `*.tgz`). Compute SHA256 checksums for artifacts.

Rationale:
- Globs are flexible and allow per-package overrides.
- SHA256 is widely available and collision-resistant for artifact integrity.

Implementation notes:
- Use `fast-glob` to resolve patterns, then `crypto.createHash('sha256')` to stream file and compute checksum.
- Artifact descriptors: `{ path, size, checksum, mimeType? }`.

5) nest-commander wiring and CLI patterns

Decision: Mirror `apps/api/src/cli.ts` bootstrap: provide `main.ts` that builds a Nest application with `CommandModule` and registers command providers located in `commands/` folder. Commands will inject `BuildService`.

Rationale:
- Keeps CLI bootstrap consistent across repo and allows `apps/api` to import `packages/build-system` module or reuse wiring.

Implementation notes:
- Each command (build:list, build:package, build:clean) will be a `Command` class from `nest-commander` and will call `BuildService` methods.
- CLI will support JSON output via `--json` flag to enable CI-friendly output.


Conclusions & Actionables:
- Implement `execa`-based Bun adapter and `--compile-config` helper for TypeScript config loading.
- Implement mkdir-based lock with TTL and stale-lock recovery.
- Artifact discovery via `fast-glob` + SHA256 checksums.
- Implement NestJS `BuildModule` and `Command` classes mirroring `apps/api/src/cli.ts` patterns.

References:
- execa: https://github.com/sindresorhus/execa
- fast-glob: https://github.com/mrmlnc/fast-glob
- proper-lockfile (alternative): https://github.com/moxystudio/node-proper-lockfile
- nest-commander: https://www.npmjs.com/package/nest-commander
