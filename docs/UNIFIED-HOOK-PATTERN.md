# Unified Hook Pattern - ORPC + Better Auth

> **Note (current repo reality):** this is a supplemental deep dive. For canonical current imports/paths and operational references, see:
> - [`.docs/reference/CANONICAL-PATHS-AND-IMPORTS.md`](../.docs/reference/CANONICAL-PATHS-AND-IMPORTS.md)
> - [`.docs/features/ORPC-TYPE-CONTRACTS.md`](../.docs/features/ORPC-TYPE-CONTRACTS.md)
> - [`.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md`](../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md)

## Overview

This document describes the unified hook pattern used across the codebase for both ORPC-generated hooks and Better Auth hooks. The goal is to provide a consistent API for query key management and cache invalidation regardless of the hook source.

## Pattern Components

### 1. Query Key Registry

All hooks export a `queryKeys` object that provides:
- **Base key** (`queryKeys.all`): Root key for invalidating all queries
- **Procedure keys** (`queryKeys.{procedureName}(input)`): Factory functions that generate query keys for specific procedures

### 2. Hook Functions

Hooks follow the naming convention:
- **Queries**: `use{ProcedureName}()` - Returns `UseQueryResult<T>`
- **Mutations**: `use{ProcedureName}()` - Returns `UseMutationResult<T>`

### 3. Automatic Invalidation

ORPC hooks include automatic invalidation configuration, but manual invalidation can be done using exported `queryKeys`.

## Implementation Examples

### ORPC Hooks (Generated)

```typescript
// apps/web/src/hooks/useUser.orpc-hooks.ts
import { createRouterHooks } from '@repo/orpc-utils/hooks/generate-hooks'
import { appContract } from '@repo/api-contracts'
import { orpc } from '@/lib/orpc'

const userHooks = createRouterHooks<typeof appContract.user, typeof orpc.user>(
  orpc.user,
  {
    invalidations: userInvalidations,
    useQueryClient,
    baseKey: 'user', // Custom base key
  }
)

// Export query keys for manual operations
export const userQueryKeys = userHooks.queryKeys
export { userHooks }

// Usage in component:
function UserList() {
  const { data } = userHooks.useList({ limit: 20 })
  return <div>{data?.data.length} users</div>
}

// Manual cache operations:
function UserActions() {
  const queryClient = useQueryClient()
  
  const handleRefresh = () => {
    // Invalidate all user queries
    queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
  }
  
  const handleRefreshList = () => {
    // Invalidate specific query
    queryClient.invalidateQueries({ queryKey: userQueryKeys.list({ limit: 20 }) })
  }
  
  return (
    <>
      <button onClick={handleRefresh}>Refresh All</button>
      <button onClick={handleRefreshList}>Refresh List</button>
    </>
  )
}
```

### Better Auth Hooks (Manual)

```typescript
// apps/web/src/hooks/useAdmin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth'

// Query key registry
export const adminQueryKeys = {
  all: ['admin'] as const,
  users: (filters?: { limit?: number; offset?: number }) =>
    [...adminQueryKeys.all, 'users', filters] as const,
  user: (userId: string) =>
    [...adminQueryKeys.all, 'user', userId] as const,
  permissions: (userId: string) =>
    [...adminQueryKeys.all, 'permissions', userId] as const,
}

// Query hook
export function useAdminListUsers(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: adminQueryKeys.users(options),
    queryFn: async () => {
      const result = await authClient.admin.listUsers(options)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

// Mutation hook with invalidation
export function useAdminBanUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { userId: string }) => {
      const result = await authClient.admin.banUser(data)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific user
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.user(variables.userId)
      })
      // Invalidate user list
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users()
      })
    },
  })
}
```

## Unified Invalidation Pattern

Both ORPC and Better Auth hooks use the same invalidation approach:

```typescript
// In any mutation hook
const queryClient = useQueryClient()

useMutation({
  onSuccess: (data, variables) => {
    // Pattern 1: Invalidate specific query with exact input
    queryClient.invalidateQueries({
      queryKey: queryKeys.findById({ id: variables.id })
    })
    
    // Pattern 2: Invalidate all variants of a query (no input)
    queryClient.invalidateQueries({
      queryKey: queryKeys.list()
    })
    
    // Pattern 3: Invalidate all queries for this domain
    queryClient.invalidateQueries({
      queryKey: queryKeys.all
    })
  }
})
```

## Query Key Structure

All query keys follow a hierarchical structure:

```typescript
// Level 1: Domain (base key)
['user']                    // userQueryKeys.all
['admin']                   // adminQueryKeys.all
['organization']            // organizationQueryKeys.all

// Level 2: Procedure/Operation
['user', 'list']            // userQueryKeys.list()
['admin', 'users']          // adminQueryKeys.users()

// Level 3: Input parameters
['user', 'list', { limit: 20, offset: 0 }]        // userQueryKeys.list({ limit: 20, offset: 0 })
['admin', 'users', { limit: 10, offset: 0 }]      // adminQueryKeys.users({ limit: 10, offset: 0 })
['user', 'findById', { id: 'user-123' }]          // userQueryKeys.findById({ id: 'user-123' })
['admin', 'user', 'user-123']                     // adminQueryKeys.user('user-123')
```

## Benefits of Unified Pattern

1. **Consistency**: Same API across all hooks (ORPC, Better Auth, custom)
2. **Type Safety**: Full TypeScript inference for query keys and inputs
3. **Predictability**: Developers know exactly how to use any hook
4. **Maintainability**: Easy to add new hooks following the same pattern
5. **Cache Management**: Explicit control over cache invalidation
6. **Debugging**: Clear query key hierarchy in React Query DevTools

## Migration Guide

### From Old useUsers.ts to New Pattern

**Before:**
```typescript
// Old custom hook without queryKeys export
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  })
}

// No way to invalidate from other hooks
```

**After:**
```typescript
// New ORPC-generated hooks with queryKeys
import { userHooks, userQueryKeys } from '@/hooks/useUser.orpc-hooks'

function UserList() {
  const { data } = userHooks.useList({ limit: 20 })
  return <div>{data?.data.length} users</div>
}

// Can invalidate from anywhere
function SomeOtherComponent() {
  const queryClient = useQueryClient()
  
  const handleAction = () => {
    queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
  }
}
```

### Adding New ORPC Hooks

1. Define ORPC contract with RouteBuilder
2. Add to ORPC router
3. Create hook file with `createRouterHooks`
4. Export `queryKeys` for external use
5. Use in components

```typescript
// 1. Define contract (packages/contracts/api/src/user.ts)
export const userContract = {
  list: c.route({
    method: 'GET',
    path: '/users',
    // ... rest of contract
  }),
}

// 2. Create hooks (apps/web/src/hooks/useUser.orpc-hooks.ts)
const userHooks = createRouterHooks<typeof appContract.user>(orpc.user, {
  invalidations,
  useQueryClient,
  baseKey: 'user',
})

export const userQueryKeys = userHooks.queryKeys
export { userHooks }

// 3. Use in component
function MyComponent() {
  const { data } = userHooks.useList({ limit: 20 })
}
```

### Adding New Better Auth Hooks

1. Define query key registry
2. Create query/mutation hooks
3. Export queryKeys for external use

```typescript
// 1. Define query keys
export const myQueryKeys = {
  all: ['my-domain'] as const,
  items: (filters?) => [...myQueryKeys.all, 'items', filters] as const,
  item: (id: string) => [...myQueryKeys.all, 'item', id] as const,
}

// 2. Create hooks
export function useMyItems(filters?) {
  return useQuery({
    queryKey: myQueryKeys.items(filters),
    queryFn: async () => {
      // fetch logic
    }
  })
}

export function useUpdateMyItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      // mutation logic
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: myQueryKeys.item(variables.id) })
      queryClient.invalidateQueries({ queryKey: myQueryKeys.items() })
    }
  })
}
```

## Best Practices

1. **Always export queryKeys**: Make query keys available for external invalidation
2. **Use baseKey option**: Provide meaningful base keys for ORPC hooks (matches domain name)
3. **Consistent naming**: Follow `use{ProcedureName}` convention
4. **Hierarchical keys**: Build keys from general to specific (domain → procedure → input)
5. **Manual invalidation**: Use exported queryKeys in mutations that affect other queries
6. **Type safety**: Leverage TypeScript inference for query keys and inputs
7. **Documentation**: Document query key structure and usage in hook files

## Reference Files

- ORPC Hook Generator: `packages/utils/orpc/src/hooks/generate-hooks.ts`
- ORPC User Hooks: `apps/web/src/hooks/useUser.orpc-hooks.ts`
- Better Auth Admin Hooks: `apps/web/src/hooks/useAdmin.ts`
- Better Auth Organization Hooks: `apps/web/src/hooks/useOrganization.ts`

## Troubleshooting

### Query keys not exported

**Problem**: TypeScript error "Property 'queryKeys' does not exist"

**Solution**: Ensure you're using the latest version of `createRouterHooks` that includes the queryKeys export.

### Type inference issues

**Problem**: `hooks.useList()` returns `never` type

**Solution**: Pass the raw contract type as the first generic parameter:
```typescript
createRouterHooks<typeof appContract.user>(orpc.user, { ... })
```

### Invalidation not working

**Problem**: Cache not updating after mutation

**Solution**: Verify query keys match exactly:
```typescript
// Setting the query
queryKey: userQueryKeys.list({ limit: 20 })

// Invalidating - must use same structure
queryClient.invalidateQueries({ queryKey: userQueryKeys.list({ limit: 20 }) })

// Or invalidate all variants
queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
```
