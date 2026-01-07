# Declarative Routing Pattern (Next.js App Router)

> Type: Core Concept — Routing
> Priority: 🔴 Critical
> Last Updated: 2025-12-23

## Overview

This project uses a type-safe, declarative routing system to eliminate string-based hrefs and manual query handling. Instead of raw links and ad‑hoc URL composition, you import route objects from `@/routes` and use their helpers:

- Link components: `<Route.Link>` and `<Route.ParamsLink>`
- Page validation helpers: `Route.Page`, `Route.validateParams`, `Route.validateSearch`
- Typed hooks: `useParams(Route)`, `useSearchParams(Route)`, `useSearchParamState(Route)`, `usePush(Route)`

Benefits:
- Full TypeScript safety for URLs, params, and search
- Centralized route definitions via `page.info.ts`
- Consistent SSR/CSR behavior
- Fewer runtime bugs, no stringly-typed navigation

Related docs:
- `apps/web/src/routes/README.md` — System guide and route list
- `./11-ORPC-CLIENT-HOOKS-PATTERN.md` — API client hooks pattern (use together)

## Route Objects and Builder Anatomy

Each route exported from `@/routes` provides a typed API:

- `Route.Link` — typed link component (no params)
- `Route.ParamsLink` — typed link requiring params
- `Route.Page` — typed page wrapper with validated params/search on server components
- `Route.validateParams` — Zod-based params validation
- `Route.validateSearch` — Zod-based search validation
- `Route.routeName` — stable, generated route identifier
- `Route.immediate` — SSR-friendly fetch/execute helper

Example:
```tsx
import { Authsignin, Authsignup, Home } from '@/routes'
import { useSearchParams } from '@/routes/hooks'

export default function Example() {
  const search = useSearchParams(Authsignin)
  return (
    <div>
      <Authsignup.Link
        search={{ callbackUrl: search.callbackUrl }}
        className="text-primary"
      >
        Create one here
      </Authsignup.Link>

      <Home.Link className="inline-flex items-center">
        Back to Home
      </Home.Link>
    </div>
  )
}
```

## Typed Hooks

Use hooks from `@/routes/hooks` with a specific route to get typed values:

- `useParams(Route)` — returns typed params for dynamic routes
- `useSearchParams(Route)` — returns typed search values
- `useSearchParamState(Route)` — stateful search param helper (for client components)
- `usePush(Route)` — typed navigation (no string hrefs)

Example:
```tsx
import { Search } from '@/routes'
import { useSearchParams, usePush } from '@/routes/hooks'

export function SearchBar() {
  const search = useSearchParams(Search)
  const push = usePush(Search)

  const onSubmit = (query: string) => {
    push({ search: { query } }) // Typed
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit('hello') }}>
      <input defaultValue={search.query ?? ''} />
      <button type="submit">Search</button>
    </form>
  )
}
```

## SSR Helpers

Utilities in `@/routes/utils` help with server components:

- `safeParseSearchParams` — robust parsing of Next.js search params into Zod schemas

Pair these with `Route.Page` to validate incoming params/search on the server.

## When to Rebuild Routes

Run `bun run web -- dr:build` when:
- Route names change in `.info.ts`
- Folder locations or dynamic segments change (e.g., `[id]` → `[userId]`)
- New routes are added or removed
- API verbs change on API routes

No rebuild is needed when only the Zod schema changes for search typing.

## Usage Patterns

### Replace raw `next/link`

Do:
```tsx
<Home.Link className="btn">Home</Home.Link>
```

Don’t:
```tsx
// avoid
// <Link href="/">Home</Link>
```

### Typed search propagation

```tsx
const signinSearch = useSearchParams(Authsignin)
<Authsignup.Link search={{ callbackUrl: signinSearch.callbackUrl }}>
  Create one here
</Authsignup.Link>
```

### Server components with validation

```tsx
// page.tsx (server component)
import { ProductDetail } from '@/routes'

export default ProductDetail.Page(async ({ params, search }) => {
  // params and search are already validated by route schemas
  const product = await fetchProduct(params.productId)
  return <div>{product.name}</div>
})
```

## Migration Checklist

1. Inventory pages under `apps/web/src/app/**/page.tsx`
2. Replace raw `<Link href>` with `<Route.Link>` / `<Route.ParamsLink>`
3. Use `useSearchParams(Route)` and `useParams(Route)` in client components
4. Prefer `Route.Page` for server components that need validated inputs
5. Remove manual `URLSearchParams` logic and string concat, use `search={}`
6. Rebuild routes if you changed `.info.ts` structure: `bun run web -- dr:build`
7. Run lint and type-check on web workspace

## Best Practices

- Never use ORPC directly in components — follow the hooks pattern from `11-ORPC-CLIENT-HOOKS-PATTERN.md`
- Keep search typing narrow; validate only what you need
- Centralize navigation with route objects; avoid scattering raw `href` strings
- Prefer descriptive route names in `.info.ts` — they drive `@/routes` exports
- Keep SSR pages pure; do validation at the boundary with `Route.Page`

## Common Gotchas

- Missing rebuild after structural route changes → types get out of date
- Mixing raw `Link` with route helpers → inconsistent behavior and typing
- Forgetting to pass `search={}` as an object → breaks type safety

## References

- `apps/web/src/routes/README.md` — Detailed system guide and route list
- `apps/web/src/routes/makeRoute.tsx` — Owned copy, customizable if needed
- `apps/web/src/routes/hooks.ts` — Hook implementations
- `apps/web/src/routes/utils.ts` — SSR utilities
- `./11-ORPC-CLIENT-HOOKS-PATTERN.md` — Complementary API consumption pattern
