# Declarative routing (Next.js)

A codegen system produces type-safe routes and links for the Next.js app.

## What it gives you

- Type-safe paths and params
- Generated Link helpers and validations
- Watch mode for rapid route changes

## Where it lives

- Config and generated files under apps/web/src/routes
- Scripts in apps/web/package.json: `dr:build`, `dr:build:watch`

## Typical usage

- Change a route folder/file or its page.info.ts
- Run `bun run web -- dr:build`
- Import from `@/routes` to navigate or link safely

## CI

- CI runs the route generator to ensure artifacts are present

## See also

- apps/web/src/routes/README.md
- Development workflow: ../DEVELOPMENT-WORKFLOW.md
