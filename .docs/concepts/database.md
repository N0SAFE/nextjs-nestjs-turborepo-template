# Database (Drizzle + PostgreSQL)

The API uses Drizzle ORM with PostgreSQL for schema and data access.

## Components

- Drizzle schema files in `apps/api/src/config/drizzle/schema`
- Drizzle Kit for migrations
- PostgreSQL in Docker for dev/prod

## Ownership model

- Database access is owned by API-side modules/repositories.
- Web app should never access DB directly; it goes through ORPC/API contracts.
- Schema and migration lifecycle stays centralized in `apps/api`.

## Runtime flow

1. Schema definitions live in `apps/api/src/config/drizzle/schema`
2. CLI/scripts generate or apply migrations
3. NestJS modules/repositories use typed Drizzle access via DB services
4. Web consumes data through ORPC endpoints

## Common commands

- Generate migrations: `bun run api -- db:generate`
- Push schema: `bun run api -- db:push`
- Migrate: `bun run api -- db:migrate`
- Studio: `bun run api -- db:studio`
- Seed: `bun run api -- db:seed`

## Practical guidance

- Use `db:generate` after schema changes
- Use `db:migrate`/`db:push` based on migration strategy in your workflow
- Keep seed logic deterministic for local/dev repeatability

## Common pitfalls

- Editing schema without regenerating migrations
- Introducing DB assumptions in web code
- Mixing runtime-only SQL concerns with contract-level DTO design

## See also

- Development workflow: ../guides/DEVELOPMENT-WORKFLOW.md
- Getting started: ../guides/GETTING-STARTED.md
- Production deployment: ../guides/PRODUCTION-DEPLOYMENT.md
- Core architecture rules: ../core-concepts/02-SERVICE-ADAPTER-PATTERN.md
