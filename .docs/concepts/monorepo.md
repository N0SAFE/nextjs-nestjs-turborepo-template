# Monorepo (Turborepo)

This repository is organized with Turborepo workspaces for apps and packages.

## Structure

- apps/api: NestJS API
- apps/web: Next.js app
- apps/doc: documentation app
- packages/*: shared libraries and configs

## Workspace model

- Workspaces are declared at root (`apps/**`, `packages/**`)
- Internal packages are imported with `@repo/*`
- Internal dependencies typically use workspace references (`"*"`)
- Turborepo orchestrates build/test/lint graph execution across workspaces

## Package boundary idea

- **apps/**: runtime products (web/api/doc)
- **packages/contracts/**: shared contract definitions
- **packages/utils/**: shared runtime utilities
- **packages/ui/**: shared UI library
- **packages/configs/**: lint/type/test/tailwind shared config
- **packages/bin/**: internal CLI tooling

## Common commands (root)

- Dev (Docker): `bun run dev`
- Dev (local): `bun run dev:local`
- Build all: `bun run build`
- Test: `bun run test`
- Lint/Format: `bun run lint` / `bun run format`
- Full validation: `bun run check`

## How changes propagate

1. Update a package
2. Dependent apps/packages pick up new types/behavior via workspace links
3. Turborepo tasks re-run based on dependency graph
4. Root validation (`bun run check`) confirms cross-workspace integrity

## Per-workspace commands

Use workspace runners:
- Web: `bun run web -- <script>`
- API: `bun run api -- <script>`
- UI, types, etc.: `bun run @repo/ui -- <script>`

## Common pitfalls

- Treating `@repo/*` packages like external packages with independent versioning semantics
- Mixing physical paths and package names in docs/import mental model
- Skipping root-level validation after cross-package changes

## See also

- Development workflow: ../guides/DEVELOPMENT-WORKFLOW.md
- Architecture: ../reference/ARCHITECTURE.md
- Tech stack: ../reference/TECH-STACK.md
- Internal package details: ./internal-packages.md
