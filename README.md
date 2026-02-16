# Next.js + NestJS Turborepo Template

Production-oriented monorepo template for building full-stack apps with:

- **Web**: Next.js App Router
- **API**: NestJS + ORPC contracts
- **Auth**: Better Auth
- **DB**: PostgreSQL + Drizzle
- **Monorepo**: Turborepo + Bun workspaces

## Why this template

- End-to-end type safety (contracts shared between API and web)
- Docker-first local development
- Clear domain boundaries and reusable packages
- Opinionated docs and architecture patterns out of the box

## Quick start

### 1) Clone and initialize

```bash
git clone https://github.com/N0SAFE/nextjs-nestjs-turborepo-template.git
cd nextjs-nestjs-turborepo-template
bun run init
bun install
```

### 2) Start development

```bash
bun run dev
```

By default this starts the full dev stack (web, api, db, redis) using Docker compose.

### 3) Validate the workspace

```bash
bun run check
```

## Most used commands

```bash
bun run dev
bun run dev:api
bun run dev:web
bun run test
bun run build
bun run lint
bun run format
bun run check
```

## Project layout

```text
apps/
  api/      NestJS API
  web/      Next.js app
  doc/      Fumadocs app
packages/
  contracts/  Shared API contracts
  ui/         Shared UI packages
  utils/      Shared runtime/build utilities
  configs/    Shared lint/ts/prettier/tailwind configs
.docs/        Main documentation hub
docs/         Additional deep-dive design notes
```

## Documentation

Start here:

- **Main docs hub**: [`.docs/README.md`](./.docs/README.md)
- Navigation helper: [`.docs/NAVIGATION.md`](./.docs/NAVIGATION.md)

Primary paths:

- Core concepts: [`.docs/core-concepts/README.md`](./.docs/core-concepts/README.md)
- Guides: [`.docs/guides/README.md`](./.docs/guides/README.md)
- Features: [`.docs/features/README.md`](./.docs/features/README.md)
- Reference: [`.docs/reference/README.md`](./.docs/reference/README.md)
- Planning: [`.docs/planning/README.md`](./.docs/planning/README.md)

Additional architecture notes:

- [docs/README.md](./docs/README.md)

## Contributing

1. Follow root and scoped `AGENTS.md` instructions
2. Keep contracts, API implementation, and web hooks aligned
3. Update docs whenever behavior or workflows change

## License

MIT
