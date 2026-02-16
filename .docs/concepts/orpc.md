# ORPC: End-to-end types

ORPC provides shared contracts between the NestJS API and the Next.js client for type-safe requests and responses.

## What it is

- Contract-first: Define routes, params, and schemas in `packages/contracts/api`
- Single source of truth: Server implements the contract; client consumes it
- Typed everywhere: Compiler enforces correctness across changes

## Why this matters in this repo

- The API and web app evolve together in one monorepo.
- ORPC removes "stringly-typed" API contracts and runtime guesswork.
- Contract changes become compile-time changes in both API and web.

## Architecture flow

1. **Contract definition** in `@repo/api-contracts` (`packages/contracts/api`)
2. **API implementation** in `apps/api` with `@Implement(...)`
3. **Web client utils** in `apps/web/src/lib/orpc/index.ts`
4. **Domain-level hooks/endpoints** in `apps/web/src/domains/**`

This keeps transport and contract concerns centralized while UI logic stays domain-focused.

## How it works here

- Contracts live in `packages/contracts/api` (package name: `@repo/api-contracts`)
- API implements contracts in `apps/api` using `@Implement(...)` + `implement(...).handler(...)`
- Web consumes ORPC endpoints through `apps/web/src/lib/orpc/index.ts` and domain hooks (`queryOptions` / `mutationOptions`)

## Typical development lifecycle

1. Update a contract in `packages/contracts/api`
2. Implement or adjust API handler in `apps/api/src/**/controllers`
3. Update web domain endpoints/hooks (`apps/web/src/domains/**`)
4. Regenerate route/openapi artifacts when relevant (`bun run web -- generate`, `bun run web -- dr:build`)
5. Run validation (`bun run check`)

## Development loop

1. Edit or add a contract in `packages/contracts/api`
2. Implement the handler in apps/api
3. Regenerate web artifacts when required (`bun run web -- generate` and/or `bun run web -- dr:build` when routes changed)
4. Use the typed hooks or server client in apps/web

## Error handling

- Errors are represented through contract response schemas and ORPC handler return shapes
- Prefer narrow, explicit error shapes for better DX

## Common pitfalls

- Updating handler logic without updating contract schemas
- Bypassing domain hooks and scattering ORPC usage in random UI components
- Confusing physical package path (`packages/contracts/api`) with import name (`@repo/api-contracts`)

## Quick checklist before merge

- Contract and API implementation are in sync
- Affected web hooks/endpoints still type-check
- Generated artifacts refreshed when needed
- `bun run check` passes

## See also

- Feature details: ../features/ORPC-TYPE-CONTRACTS.md
- Core pattern: ../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md
- Client hook pattern: ../core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md
- Internal package model: ./internal-packages.md
- Architecture: ../reference/ARCHITECTURE.md
