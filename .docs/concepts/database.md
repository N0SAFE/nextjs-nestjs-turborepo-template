# Database (Drizzle + PostgreSQL)

The API uses Drizzle ORM with PostgreSQL for schema and data access.

## Components

- Drizzle schema files in apps/api
- Drizzle Kit for migrations
- PostgreSQL in Docker for dev/prod

## Common commands

- Generate migrations: `bun run api -- db:generate`
- Push schema: `bun run api -- db:push`
- Migrate: `bun run api -- db:migrate`
- Studio: `bun run api -- db:studio`
- Seed: `bun run api -- db:seed`

## See also

- Getting started: ./GETTING-STARTED.md
- Production deployment: ./PRODUCTION-DEPLOYMENT.md
