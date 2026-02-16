# Declarative routing (Next.js)

A codegen system produces type-safe routes and links for the Next.js app.

## What it gives you

- Type-safe paths and params
- Generated route objects and Link/navigation helpers
- Watch mode for rapid route changes

## Why this exists

- Avoid hardcoded route strings across the app
- Keep route params/search schemas near route definitions
- Provide typed navigation and typed API-route metadata from the same source model

## Where it lives

- Source route metadata in `apps/web/src/app/**/page.info.ts`
- Generated routes under `apps/web/src/routes`
- Generated route metadata files (`route.info.ts`) under `apps/web/src/app/**`
- Scripts in `apps/web/package.json`: `dr:build`, `dr:build:watch`

## Generation model

1. Define/modify `page.info.ts` and route structure under `src/app`
2. Run `bun run web -- dr:build`
3. Generated route objects are refreshed in `src/routes`
4. Consume generated exports in app code (`@/routes`)

## Typical usage

- Change a route folder/file or its `page.info.ts`
- Run `bun run web -- dr:build`
- Import from `@/routes` to navigate or link safely

## Practical rules

- Prefer generated helpers from `@/routes` over manual `href` strings
- Re-run `dr:build` after route structure/name/params changes
- Keep `page.info.ts` schemas focused and explicit for params/search inputs

## Common pitfalls

- Editing route structure but forgetting `dr:build`
- Assuming generated files should be manually edited
- Mixing manual and generated route conventions in the same feature

## See also

- apps/web/src/routes/README.md
- Core pattern: ../core-concepts/12-DECLARATIVE-ROUTING-PATTERN.md
- Development workflow: ../guides/DEVELOPMENT-WORKFLOW.md
- Internal package model: ./internal-packages.md
