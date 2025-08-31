# AGENTS.md — apps/api (NestJS)

Follow the root `AGENTS.md` first. This file adds API-specific guidance.

## Scope Rules

- Read this file before changing any code in `apps/api/`.
- Use MCP resources and tools to inspect dependencies and scripts.

## Quick Context via MCP

- Inspect this app:
  - `repo://app/api/package.json`
  - `repo://app/api/dependencies`
  - `repo://graph/uses/api` and `repo://graph/used-by/api`

## Workflows

Development (Docker-first):
- `bun run dev:api` — start API + DB
- Logs: `bun run dev:api:logs`

Database (Mandatory MCP Tools):
- Local (host):
  - `api-db { action: "generate" }` — generate migrations
  - `api-db { action: "push" }` — push schema
  - `api-db { action: "migrate" }` — run migrations
- Inside Docker (dev):
  - `api-db { action: "seed" }` — seed development data; should run against the dev DB container
  - To open a shell inside the API container: `bun run dev:api:run`, then `bun --bun run db:seed`

Auth (Mandatory MCP Tool):
- Local (host): `auth-generate` — regenerate auth schema/types whenever `src/auth.ts` or auth plugins change

Testing and checks:
- Type-check: `bun run api -- type-check`
- Test: `bun run api -- test`

## Boundaries

- Contracts live in `packages/api-contracts`. Keep server implementation aligned with contracts.
- If contracts change, update docs and ensure web client rebuild is considered.
