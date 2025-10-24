# Quickstart — Build package handler

This quickstart shows how to run the build system locally and in CI (examples).

## Local developer (Docker-first recommended)

1. Ensure the dev stack is running (Docker):

```bash
bun run dev
```

2. From repo root, run the build package CLI for a package (example `packages/ui`):

```bash
# Run via node bootstrap (development)
node packages/build-system/cli.js --package packages/ui --json

# Or using npx when `packages/build-system` is installed
bun --package packages/build-system run build -- --package packages/ui --json
```

3. Check output: the CLI emits a structured JSON object with fields: `status`, `durationMs`, `artifacts`, `exitCode`, and `logs`.

## CI (recommended pattern)

1. Precompile TypeScript config or include `build.config.js` in the package repo.
2. Run the build command in your CI job and save produced artifacts.

Example GitHub Actions job snippet:

```yaml
jobs:
  build-package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: bun install
      - name: Build package
        run: node packages/build-system/cli.js --package packages/ui --json > build-result.json
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: package-artifacts
          path: |
            packages/ui/dist/**
            packages/ui/build/**
            build-result.json
```

## Notes and guidance
- Prefer providing `build.config.js` for CI to avoid runtime TypeScript compilation. The CLI supports `--compile-config` to compile `build.config.ts` on-demand (fast) when required.
- Use the `--json` flag for machine-readable output in CI.
- See `specs/002-build-package-handler/research.md` for implementation details on loaders, locking, and artifact discovery.
