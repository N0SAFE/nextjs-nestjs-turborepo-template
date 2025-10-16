# Monorepo (Turborepo)

This repository is organized with Turborepo workspaces for apps and packages.

## Structure

- apps/api: NestJS API
- apps/web: Next.js app
- packages/*: shared libraries and configs

## Common commands (root)

- Dev (Docker): `bun run dev`
- Dev (local): `bun run dev:local`
- Build all: `bun run build`
- Test: `bun run test`
- Lint/Format: `bun run lint` / `bun run format`

## Per-workspace commands

Use workspace runners:
- Web: `bun run web -- <script>`
- API: `bun run api -- <script>`
- UI, types, etc.: `bun run @repo/ui -- <script>`

## See also

- Development workflow: ../DEVELOPMENT-WORKFLOW.md
- Tech stack: ../TECH-STACK.md
