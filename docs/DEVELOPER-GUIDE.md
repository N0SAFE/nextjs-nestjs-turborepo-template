📍 [Documentation Hub](../.docs/README.md) > Developer Guide

# Developer Onboarding Guide

> **Last Updated**: 2026-02-13
> **Audience**: Developers onboarding to this monorepo

This guide is a practical map for working effectively in the project without memorizing every detail on day one.

## Start here first

- Canonical docs hub: [../.docs/README.md](../.docs/README.md)
- Canonical import/path mapping: [../.docs/reference/CANONICAL-PATHS-AND-IMPORTS.md](../.docs/reference/CANONICAL-PATHS-AND-IMPORTS.md)
- Required architecture/process rules: [../.docs/core-concepts/README.md](../.docs/core-concepts/README.md)
- First setup: [../.docs/guides/GETTING-STARTED.md](../.docs/guides/GETTING-STARTED.md)

## Monorepo overview

```text
apps/
  api/      NestJS backend
  web/      Next.js frontend
  doc/      Fumadocs app
packages/
  contracts/  API contracts
  utils/      shared runtime and helpers
  ui/         shared UI components
  configs/    shared lint/ts/prettier/tailwind configs
.docs/       canonical documentation hub
docs/        supplemental deep dives
```

## Core development model

1. **Docker-first local development** for reproducible environments.
2. **Contracts-first API workflow** (ORPC contracts drive implementation and client usage).
3. **Declarative routing** in web app (`page.info.ts` + route generation).
4. **Domain hooks for client data** (avoid direct raw API calls in components).

## Daily workflow

### Run the stack

```bash
bun run dev
```

Useful alternatives:

```bash
bun run dev:api
bun run dev:web
```

### Validate before pushing

```bash
bun run check
```

Additional focused checks:

```bash
bun run test
bun run lint
bun run build
bun run web -- type-check
bun run api -- type-check
```

## API + contracts workflow

When adding/changing API capabilities, keep this order:

1. Update contracts in `packages/contracts/api`
2. Implement in `apps/api`
3. Regenerate/refresh web side if needed
4. Update web domain hooks and consumers

Key references:

- [../.docs/features/ORPC-TYPE-CONTRACTS.md](../.docs/features/ORPC-TYPE-CONTRACTS.md)
- [../.docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md](../.docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- [../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md](../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md)

## Web routing workflow

Routes are generated from `page.info.ts` files.

After route structure changes:

```bash
bun run web -- dr:build
```

Key reference:

- [../.docs/core-concepts/12-DECLARATIVE-ROUTING-PATTERN.md](../.docs/core-concepts/12-DECLARATIVE-ROUTING-PATTERN.md)

## Authentication and authorization

Authentication uses Better Auth with project-specific wrappers and permissions.

Key references:

- [../.docs/core-concepts/07-BETTER-AUTH-INTEGRATION.md](../.docs/core-concepts/07-BETTER-AUTH-INTEGRATION.md)
- [../.docs/features/BETTER-AUTH-PLUGIN-UTILITIES.md](../.docs/features/BETTER-AUTH-PLUGIN-UTILITIES.md)

## Database workflow

Drizzle commands (run from root):

```bash
bun run api -- db:generate
bun run api -- db:push
bun run api -- db:migrate
bun run api -- db:seed
```

## Testing workflow

```bash
bun run test
bun run test:watch
bun run test:coverage
```

Reference:

- [../.docs/features/TESTING.md](../.docs/features/TESTING.md)

## UI workflow

Use shared UI package components whenever possible.

Add Shadcn components to shared UI package:

```bash
bun run @repo/ui ui:add button
```

## Troubleshooting shortcuts

- API logs: `bun run dev:api:logs`
- Web logs: `bun run dev:web:logs`
- Full cleanup (build artifacts): `bun run clean`
- Rebuild routes after route changes: `bun run web -- dr:build`

For deployment and Docker-specific incidents:

- [../.docs/guides/DOCKER-BUILD-STRATEGIES.md](../.docs/guides/DOCKER-BUILD-STRATEGIES.md)
- [../.docs/guides/PRODUCTION-DEPLOYMENT.md](../.docs/guides/PRODUCTION-DEPLOYMENT.md)
- [../.docs/guides/RENDER-DEPLOYMENT.md](../.docs/guides/RENDER-DEPLOYMENT.md)

## Documentation usage rules

- Use `.docs/` as source of truth for active workflows.
- Use `docs/` for supplemental deep dives and design notes.
- When changing behavior/workflows, update documentation in the same change.

## Fast reference map

- Setup: [../.docs/guides/GETTING-STARTED.md](../.docs/guides/GETTING-STARTED.md)
- Daily dev: [../.docs/guides/DEVELOPMENT-WORKFLOW.md](../.docs/guides/DEVELOPMENT-WORKFLOW.md)
- Architecture: [../.docs/reference/ARCHITECTURE.md](../.docs/reference/ARCHITECTURE.md)
- Tech stack: [../.docs/reference/TECH-STACK.md](../.docs/reference/TECH-STACK.md)
- Core rules: [../.docs/core-concepts/README.md](../.docs/core-concepts/README.md)

---

If you are new to this repo: start with `.docs/README.md`, run `bun run dev`, then use this guide as your quick operational checklist.
