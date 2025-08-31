# AGENTS.md — Repository Operating Guide for AI Agents

This file defines how AI coding agents must operate in this repository. It exists alongside per-app and per-package AGENTS.md files that add local rules. Always read the root AGENTS.md first, then the closest AGENTS.md to where you will work.

## Golden Rules (Must Follow)

1) Always load repo context via MCP first
- Use the MCP server in `packages/mcp-repo-manager` as your primary interface.
- Before changing anything, call these resources in order:
  - `repo://summary` (overview)
  - `repo://apps` and `repo://packages`
  - `repo://agents` (index of all AGENTS.md files)
- Use resource templates to inspect targets:
  - `repo://app/{name}/package.json` and `repo://package/{name}/package.json`
  - `repo://app/{name}/dependencies` and `repo://package/{name}/dependencies`
  - `repo://graph/uses/{name}` and `repo://graph/used-by/{name}`

2) Read the nearest AGENTS.md
- For any change inside `apps/<name>/` or `packages/<name>/`, read that folder’s `AGENTS.md`.
- If conflicts exist, local AGENTS.md overrides root only for that scope.

3) Prefer MCP tools over ad-hoc edits
- Use MCP tools to list/create/update targets and dependencies:
  - Tools: `list-apps`, `list-packages`, `show-*-dependencies`, `add-dependency`, `remove-dependency`, `add-script`, `bump-version`, `run-script`, `delete-target` (danger), `list-internal-dependencies`.
- When creating apps/packages, use the provided tools: `create-app`, `create-package`.

4) Validate changes
- Run type-checks and tests before concluding work on a change.
- For graph-impacting changes (dependencies, versions), also check reverse dependents via `repo://graph/used-by/{name}`.

5) Documentation is mandatory
- If you add new concepts, patterns, or workflows, update documentation per `.github/copilot-instructions.md` “New Concept Documentation Protocol”.

6) Immediate error recovery for MCP actions
- When using the MCP Repo Manager tools/resources and an error occurs, you must immediately attempt to fix it and retry.
- Apply the smallest corrective action first (e.g., adjust parameters, create a missing script via `add-script`, add a missing dependency with `add-dependency`, run `docker-up` if a service is required) and retry up to 2 times.
- Use `repo://changes` and `repo://diff-summary/{path}` to understand pending changes; use `repo://commit/plan` and the `commit-plan` prompt to validate before committing.

## Development Workflows

- Default dev:
  - `bun run dev` (docker-orchestrated full stack) or local equivalents as documented
  - For scripts within a target, prefer `run-script` MCP tool to execute `package.json` scripts.
- Build & test:
  - `bun run build`
  - `bun run test` or `bun run test:coverage`

## Commit Policy

- Use conventional commit style with scopes that reflect the feature area, for example:
  - `feat(mcpRepoManager): Add list-agents tool`
  - `fix(webRouting): Resolve route gen race`
- Keep commits focused and logically grouped.

## Safety and Boundaries

- Do not remove or rename workspace packages without an explicit instruction and confirmation flag when using tools like `delete-target`.
- Avoid direct edits to generated files—use the documented generators.
- Treat environment and deployment configs with extra caution; update docs when changing them.

## Quickstart Checklists

Context bootstrap (always):
- [ ] Fetch `repo://summary`
- [ ] Fetch `repo://apps` and `repo://packages`
- [ ] Fetch `repo://agents` and open relevant AGENTS.md files

Change planning:
- [ ] Inspect target `package.json`
- [ ] Inspect deps via resource templates
- [ ] Check graph uses/used-by

Execution:
- [ ] Apply changes via MCP tools
- [ ] Type-check and test
- [ ] Update documentation as needed

This repository expects disciplined, tool-driven changes to maintain consistency and reliability.

## Mandatory MCP Tools by Area

Repo-wide (always):
- Resources: `repo://summary`, `repo://apps`, `repo://packages`, `repo://agents`
- Readiness: `repo://commit/plan` or `commit-plan` prompt (lint → type-check → build)
- Docker orchestration: `docker-up { mode: dev|prod, target: api|web|all }` (do not use `docker compose down`)
- Utilities: `list-agents`, `list-internal-dependencies`, `run-script`, `add-script`, `add-dependency`, `remove-dependency`, `bump-version`

API (apps/api):
- `auth-generate` — regenerate auth schema/types after any auth configuration changes
- `api-db { action: generate|push|migrate|seed|reset|studio }` — database lifecycle

Web (apps/web):
- Use `run-script` to execute `dr:build` (and `dr:build:watch`) after route changes
- Start stack via `docker-up { target: web }` as needed

UI (packages/ui):
- `ui-add { components: [...] }` — add Shadcn components to the shared UI library

General packages:
- Prefer `run-script` for local scripts, `bump-version` for versioning, and `list-internal-dependencies` to assess impact before changes.

## Execution Context: Local vs Docker (Dev)

Some tools/scripts are designed to run locally, while others must run inside the development containers.

- Local (host machine):
  - `auth-generate` (apps/api) — generates files from `src/auth.ts`
  - `api-db { action: "generate" | "push" | "migrate" }` (apps/api) — uses local Drizzle CLI and project files
  - `ui-add` (packages/ui) — installs UI components and updates files
  - `run-script` for `type-check`, `lint`, and build commands that do not require running services

- Inside Docker (dev containers):
  - `api-db { action: "seed" }` — seeds the database; should run against the dev database container
  - Any command that relies on container networking (e.g., services on `api:3001`)

How to run inside Docker:
- Prefer starting the stack with `docker-up { mode: "dev", target: "api" }` and then interact via service scripts.
- For interactive commands, use the provided root scripts, e.g.:
  - `bun run dev:api:run` — starts a shell inside the API dev container
  - Once inside, run `bun --bun run db:seed` or the equivalent script

Rule of thumb:
- If a command writes to the workspace (generates code/config), run it locally unless it needs container services.
- If a command depends on database/service availability (like seeding), run it inside the dev containers.
