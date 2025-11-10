# Docker Builder AGENTS — Pruner / Config-Copier / Installer / Source-Copier

This file documents the recommended multi-stage Docker build behaviour for this monorepo to maximize layer caching while still supporting packages that run postinstall scripts which need a small set of source/config files.

Goals
- Keep the Installer stage cacheable so `bun i` does NOT rerun on unrelated source edits.
- Provide the minimal set of files required for `postinstall` scripts to run during install.
- Copy full workspace source only after installation (in `source-copier`) so heavy operations and edits won't invalidate `installer`.
- Preserve node_modules symlinks when transferring between stages (use tar pipeline).

High-level stages
1. pruner — produce a minimal package.json tree for the target (ONLY package.json / dependency graph)
2. config-copier — copy minimal config files required by postinstall scripts (e.g. `apps/doc/source.config.ts`, other small config files)
3. installer — copy pruner output + config files, run `bun i` and any postinstall that depends only on these config files
4. source-copier — copy the full source tree for the pruned workspaces from the host (bind mount), independent of installer
5. runner/builder — copy node_modules (tar preserve symlinks) and run builds or start commands

Why this ordering?
- `bun i` often runs package `postinstall` scripts. If those scripts need small config files, copy only those into the installer stage so the installer can run successfully without the entire source.
- Source edits should not invalidate the `installer` stage; editing app source should only trigger `source-copier`.
- The pruner output is cheap and only invalidates when package.json / lockfiles change.

Mermaid diagram

```mermaid
flowchart LR
  subgraph build
    P[Pruner]\n(copy package.json tree)
    C[Config-Copier]\n(copy minimal config files for postinstall)
    I[Installer]\n(bun i + postinstall)
    S[Source-Copier]\n(copy full workspace sources from host)
    R[Runner/Builder]\n(copy node_modules via tar + build/start)
  end

  P --> C --> I --> S --> R

  %% Caching notes
  click P href "#pruner-caching" "Pruner caching"
  click I href "#installer-caching" "Installer caching"
  click S href "#source-copier-caching" "Source-copier caching"

  style P fill:#f9f,stroke:#333,stroke-width:1px
  style C fill:#fffae6,stroke:#333
  style I fill:#e6fffa,stroke:#333
  style S fill:#e6f0ff,stroke:#333
  style R fill:#f0f0f0,stroke:#333
```

Detailed behaviour and examples

## 1) Pruner
- Copy only `package.json`, `bun.lock*`, `turbo.json` and workspace package.json files with `COPY --parents apps/*/package.json packages/*/package.json ...`.
- Run `bun x turbo prune <target> --docker` to create `/app/out/json/` which contains a tree of package.json files for the target and its internal deps.
- This stage invalidates only when dependencies (package.json/bun.lock/turbo.json) change.

## 2) Config-Copier (new)
- Purpose: copy only small config files needed by postinstall scripts. Examples: `apps/doc/source.config.ts`, any `scripts/config.*`, small `.md` or templates used at install time.
- Implementation pattern (in Dockerfile):

```dockerfile
FROM base AS config-copier
WORKDIR /app
COPY --from=pruner /app/out/json/ /tmp/prune-structure/
# bind the host workspace and copy only config files referenced by postinstall
RUN --mount=type=bind,source=.,target=/mnt/source \
  && for pkg in $(find /tmp/prune-structure -name "package.json"); do \
       rel=$(echo "$pkg" | sed 's|/tmp/prune-structure/||' | sed 's|/package.json||'); \
       # If this package has small config files under ./config or known paths, copy them
       if [ -f "/mnt/source/$rel/source.config.ts" ]; then \
         mkdir -p "/app/$rel"; \
         cp "/mnt/source/$rel/source.config.ts" "/app/$rel/source.config.ts"; \
       fi; \
     done
# Also copy root config that installer may need
COPY --from=pruner /app/out/bun.lock* ./
COPY --from=pruner /app/out/package.json ./
```

Notes:
- Keep this list minimal. Don't copy entire `src/` trees here.
- Prefer to standardize small config filenames across packages (eg `source.config.ts`, `install.config.json`) so Dockerfile can copy them deterministically.

## 3) Installer
- Copy pruner's `/app/out/full/` (the pruned package manifest tree) and config files from `config-copier`.
- Run `bun i --verbose` with BuildKit caches:

```dockerfile
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/full/ ./
COPY --from=config-copier /app/ ./
RUN --mount=type=cache,target=/root/.bun \
    --mount=type=cache,target=/root/.cache \
    bun i --verbose
```

- Rationale: postinstall scripts will find the minimal config files they need. `bun i` and postinstall will succeed, and the layer is cacheable unless package manifests or the small config files change.

## 4) Source-Copier
- Now copy the full source for pruned workspaces using the pruner's `/app/out/json/` as the guide.
- This stage uses a bind mount to the host workspace and tars the required directories to preserve symlinks when extracting into the image:

```dockerfile
FROM base AS source-copier
WORKDIR /app
COPY --from=pruner /app/out/json/ /tmp/prune-structure/
RUN --mount=type=bind,source=.,target=/mnt/source \
  && cd /mnt_source && \
    for p in $(find /tmp/prune-structure -name "package.json" -type f); do \
      rel=$(echo "$p" | sed 's|/tmp/prune-structure/||' | sed 's|/package.json||'); \
      if [ -d "/mnt_source/$rel" ]; then \
         tar cf - "$rel" | tar xf - -C /app; \
      fi; \
    done
```

- This stage invalidates when any file in the copied source changes (expected).

## 5) Runner/Builder
- Copy node_modules from `installer` via tar to preserve symlinks; then run any heavy build steps (turbo run build) at this stage if desired.

```dockerfile
FROM base AS runner
WORKDIR /app
# copy full source
COPY --from=source-copier /app/ /app/
# copy node_modules via tar from installer
RUN --mount=type=bind,from=installer,source=/app,target=/mnt/installer \
    cd /mnt/installer && tar cf - node_modules | tar xf - -C /app
# run build
RUN --mount=type=cache,target=/root/.bun \
    bun x turbo run build --filter=<target>...
```

Cache invalidation summary
- Pruner: invalidates on package.json / lock file changes
- Config-copier: invalidates when the small config files change (these should be rare). Keep configs minimal.
- Installer: invalidates when pruner OR config-copier output changes (dependencies or config change)
- Source-copier: invalidates when full source files change (expected)
- Runner: invalidates when node_modules or source copy changes (build step)

Recommendations
- Keep postinstall scripts minimal and only depend on small, deterministic config files.
- Prefer generating non-code artifacts in CI rather than during postinstall where possible.
- Standardize minimal config filenames (e.g. `install.config.json`, `source.config.ts`) so `config-copier` can deterministically copy them.
- Validate `postinstall` step locally: run `bun i` inside a container that has only pruner+config-copier output.

Appendix — example snippet for Dockerfile change

Replace the previous pattern where installer ran before source-copying with the above order (pruner -> config-copier -> installer -> source-copier -> runner). Keep the `COPY --parents apps/*/package.json ...` for pruner to avoid invalidating that stage on source edits.

---

File: `docker/builder/AGENTS.md` — created by automation to explain the multi-stage caching strategy.
