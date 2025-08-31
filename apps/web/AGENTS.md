# AGENTS.md — apps/web (Next.js)

Follow the root `AGENTS.md` first. This file adds Web-specific guidance.

## Scope Rules

- Always use the declarative routing system; do not hardcode `href` or manual `fetch()` to API.
- After route structure changes, run `bun run web -- dr:build`.

## Quick Context via MCP

- Inspect this app:
  - `repo://app/web/package.json`
  - `repo://app/web/dependencies`
  - `repo://graph/uses/web` and `repo://graph/used-by/web`

## Workflows

Development (Docker-first):
- Prefer MCP: `docker-up { mode: "dev", target: "web" }` — start the web app stack
- Legacy: `bun run dev:web` — also starts the web app
- Logs: `bun run dev:web:logs`

Routing:
- Routes defined by `src/app/**/page.info.ts`
- Generate routes: use MCP `run-script { targetType: "app", targetName: "web", script: "dr:build" }` or watch `dr:build:watch`

Testing and checks:
- Type-check: `bun run web -- type-check`
- Test: `bun run web -- test`

## Boundaries

- Use shared UI from `@repo/ui` where possible.
- Client API access should use generated ORPC hooks.
