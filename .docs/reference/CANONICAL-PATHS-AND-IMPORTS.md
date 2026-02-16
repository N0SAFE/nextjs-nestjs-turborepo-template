📍 [Documentation Hub](../README.md) > [Reference](./README.md) > Canonical Paths & Imports

# Canonical Paths & Imports

> **Purpose**: single source of truth for high-signal import names, physical locations, and command entry points used across this monorepo.

## Why this exists

This repository intentionally separates **package import names** from **filesystem locations**.

- Import names are what application code uses.
- Physical paths are where package source lives.

When in doubt, trust this page for canonical references and then follow links to deeper docs.

## Canonical mappings

### Contracts and ORPC

- Import name: `@repo/api-contracts`
- Physical path: `packages/contracts/api`
- Typical usage:
  - API implements contracts via `@Implement(...)` + `implement(...).handler(...)`
  - Web consumes through domain hooks and `@/lib/orpc`

See:
- [Concept: ORPC](../concepts/orpc.md)
- [Feature: ORPC Type Contracts](../features/ORPC-TYPE-CONTRACTS.md)

### Authentication

- Import name: `@repo/auth`
- Physical path: `packages/utils/auth`
- API auth bootstrap entry: `apps/api/src/auth.ts`

See:
- [Concept: Authentication](../concepts/authentication.md)

### Declarative routing

- Internal CLI package: `@repo/cli-declarative-routing`
- Physical path: `packages/bin/declarative-routing`
- Web route scripts:
  - `bun run web -- dr:build`
  - `bun run web -- dr:build:watch`

See:
- [Concept: Declarative Routing](../concepts/declarative-routing.md)
- [`apps/web/src/routes/README.md`](../../apps/web/src/routes/README.md)

### Database schema

- Canonical schema directory: `apps/api/src/config/drizzle/schema`
- Typical command family: `bun run api -- db:<action>`

See:
- [Concept: Database](../concepts/database.md)
- [Guide: Development Workflow](../guides/DEVELOPMENT-WORKFLOW.md)

## Fast checks before editing docs

Use this quick checklist to avoid drift:

1. Does the doc use canonical import names (`@repo/*`) instead of old path aliases?
2. If a package path is shown, is it the real filesystem location?
3. Are routing commands `dr:build` / `dr:build:watch` (not legacy names)?
4. Is Drizzle schema path `apps/api/src/config/drizzle/schema`?
5. Are ORPC web examples based on `@/lib/orpc` and domain hooks?

## Related references

- [Architecture Overview](./ARCHITECTURE.md)
- [Tech Stack](./TECH-STACK.md)
- [Concepts Index](../concepts/README.md)
- [Supplemental docs index](../../docs/README.md)
