# API Usage Examples (Current ORPC Pattern)

This document shows practical API usage patterns aligned with the current web architecture (`@/lib/orpc` + domain hooks).

**Related docs**:
- [ORPC concept](../concepts/orpc.md)
- [ORPC implementation pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- [ORPC client hooks pattern](../core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md)

## 1) Client-side query usage (recommended)

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { userEndpoints } from '@/domains/user/endpoints'

export function UserCard({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery(
    userEndpoints.findById.queryOptions({ input: { params: { id } } })
  )

  if (isLoading) return <div>Loading…</div>
  if (error) return <div>Failed to load user</div>
  if (!data) return <div>Not found</div>

  return <div>{data.name}</div>
}
```

## 2) Client-side mutation usage (recommended)

```tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userEndpoints } from '@/domains/user/endpoints'

export function RenameUser({ id }: { id: string }) {
  const queryClient = useQueryClient()

  const mutation = useMutation(
    userEndpoints.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['user'] })
      },
    })
  )

  return (
    <button
      onClick={() => mutation.mutate({ id, name: 'New name' })}
      disabled={mutation.isPending}
    >
      Rename
    </button>
  )
}
```

## 3) Server-side ORPC calls

```tsx
import { orpc } from '@/lib/orpc'

export default async function ServerProfile({ id }: { id: string }) {
  const user = await orpc.user.findById.call({ params: { id } })

  if (!user) return <div>User not found</div>
  return <div>{user.email}</div>
}
```

## 4) Domain-first import strategy

Prefer importing from domain modules in UI components:

- `@/domains/user/hooks`
- `@/domains/auth/hooks`
- `@/domains/organization/hooks`

Use `@/lib/orpc` directly for:
- server-side imperative calls
- low-level utilities
- framework glue code

## 5) Query key invalidation tip

When invalidating cache after writes, prefer domain-scoped keys over ad-hoc strings.
If a domain exports key factories, use them consistently.

## 6) Anti-patterns to avoid

- Importing from legacy paths like `@/lib/api` or `@/lib/orpc-client`
- Calling ORPC directly in many scattered components instead of domain hooks
- Skipping cache invalidation after mutations that change list/detail data
- Returning broad untyped error shapes when contracts can be explicit

## 7) Quick checklist

- Read endpoint from domain `queryOptions`
- Write endpoint from domain `mutationOptions`
- Handle loading + error + empty states
- Invalidate related queries on successful write
- Run `bun run check` before merge
