# Internal packages: concept, usage, and how it works

This repository uses internal workspace packages (`@repo/*`) to share contracts, utilities, UI, and tooling across apps.

## Core idea

- Internal packages live under `packages/**`.
- Apps consume them through package imports (e.g. `@repo/api-contracts`, `@repo/auth`, `@repo/ui`).
- In app/package `package.json`, internal deps use `"*"` to resolve to local workspace packages.
- This gives a single-source monorepo dependency model with end-to-end type sharing.

## Physical path vs import name

A common source of confusion:

- **Physical path**: where code lives in repo (e.g. `packages/contracts/api`)
- **Import name**: what TypeScript imports (e.g. `@repo/api-contracts`)

Both are correct and intentionally different.

## Internal package categories in this repo

### 1) Contracts

- `@repo/api-contracts` → `packages/contracts/api`
- Role: shared ORPC contract definitions between API and web.

### 2) Shared auth

- `@repo/auth` → `packages/utils/auth`
- Role: Better Auth integration primitives and server/client/react exports.

### 3) ORPC utilities

- `@repo/orpc-utils` → `packages/utils/orpc`
- Role: ORPC builders, query/hook helpers, and shared ORPC ergonomics.

### 4) Declarative routing package

- `@repo/declarative-routing` → `packages/utils/declarative-routing`
- Role: shared routing wrappers/utilities used by web routing system.

### 5) UI library

- `@repo/ui` → `packages/ui/base`
- Role: shared UI components/styles for app-level reuse.

### 6) Environment utilities

- `@repo/env` → `packages/utils/env`
- Role: environment loading/validation/mocking helpers and CLI.

### 7) Shared logger

- `@repo/logger` → `packages/utils/logger`
- Role: shared logging primitives/config.

### 8) Shared config packages

- `@repo/config-eslint` → `packages/configs/eslint`
- `@repo/config-typescript` → `packages/configs/typescript`
- plus vitest/tailwind/prettier equivalents
- Role: central lint/build/tooling consistency.

### 9) Internal CLI packages

- `@repo/cli-declarative-routing` → `packages/bin/declarative-routing`
- Role: internal CLI used by web scripts (`dr:build`, `dr:build:watch`).

## How workspace linking works (practical)

1. A package exports modules via `exports` in its `package.json`.
2. Another workspace declares dependency with `"@repo/something": "*"`.
3. Bun workspace resolution links that dependency locally.
4. TypeScript and runtime resolve imports from local package sources/outputs.

## Usage patterns

### In apps

- API imports contracts/auth/logger from `@repo/*` packages.
- Web imports contracts/routing/auth/ui/orpc-utils from `@repo/*` packages.

### In packages

- Packages can depend on other internal packages (e.g. contracts → orpc-utils/auth).
- Keep dependency direction intentional to avoid circular coupling.

## Typical change flows

### A) Contract change

1. Update `@repo/api-contracts`
2. Update API handlers
3. Update web domain hooks/endpoints
4. Run `bun run check`

### B) Shared utility change

1. Update internal utility package (`@repo/auth`, `@repo/orpc-utils`, etc.)
2. Validate dependent apps/packages
3. Run root checks

## Design guidelines

- Keep packages focused (single responsibility by concern)
- Export stable, documented entry points
- Prefer explicit `exports` subpaths for public APIs
- Avoid deep imports into non-exported internals
- Validate cross-workspace changes from repo root

## Common pitfalls

- Mixing package import names with physical file paths in docs
- Adding app-specific logic into shared packages without clear boundaries
- Relying on implicit deep imports instead of exported entry points
- Skipping full monorepo validation after shared package changes

## See also

- [monorepo.md](./monorepo.md)
- [orpc.md](./orpc.md)
- [authentication.md](./authentication.md)
- [../core-concepts/README.md](../core-concepts/README.md)
- [../reference/ARCHITECTURE.md](../reference/ARCHITECTURE.md)
