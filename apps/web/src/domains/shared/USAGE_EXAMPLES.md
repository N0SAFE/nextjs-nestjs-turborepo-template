# ORPC-like Contract System

This document explains the unified contract interface for both ORPC endpoints and custom endpoints.

## Core Concept

**All endpoints (ORPC and custom) share the same API**:
- `.call(input)` - Direct server-side call
- `.queryKey(input)` - Query key for cache management
- `.queryOptions(input)` - TanStack Query options for queries
- `.mutationKey()` - Mutation key for cache management
- `.mutationOptions()` - TanStack Query options for mutations
- `.infiniteKey(input)` - Infinite query key
- `.infiniteOptions(input)` - Options for useInfiniteQuery
- `.experimental_liveKey(input)` - Live query key (experimental)
- `.experimental_liveOptions(input)` - Live query options (experimental)
- `.experimental_streamedKey(input)` - Streamed query key (experimental)
- `.experimental_streamedOptions(input)` - Streamed query options (experimental)

## Endpoint Types

### 1. ORPC Contracts (Use Directly)

ORPC contracts already have the correct API - use them directly without wrappers:

```typescript
import { orpc } from '@/lib/orpc'

// ✅ Use ORPC contracts directly
const contract = orpc.user.list

// Already has all methods:
contract.call(input)                          // Server-side direct call
contract.queryKey(input)                      // Query key
contract.queryOptions(input)                  // TanStack Query options
contract.mutationKey()                        // Mutation key  
contract.mutationOptions()                    // Mutation options
contract.infiniteKey(input)                   // Infinite query key
contract.infiniteOptions(input)               // Infinite query options
contract.experimental_liveKey(input)          // Live query key
contract.experimental_liveOptions(input)      // Live query options
contract.experimental_streamedKey(input)      // Streamed query key
contract.experimental_streamedOptions(input)  // Streamed query options
```

### 2. Custom Contracts (Use custom() Helper)

For non-ORPC endpoints (Better Auth, external APIs), use the `custom()` helper to create ORPC-like contracts:

```typescript
import { custom } from '@/domains/shared/helpers'

// Query example
const sessionContract = custom({
  type: 'query',
  queryKey: ['auth', 'session'],
  fetcher: async () => authClient.getSession(),
  staleTime: STALE_TIME.DEFAULT,
})

// Mutation example
const logoutContract = custom({
  type: 'mutation',
  queryKey: ['auth', 'logout'],
  mutationFn: async () => authClient.logout(),
})

// Both have same API as ORPC contracts:
sessionContract.call()                          // Server-side direct call
sessionContract.queryKey()                      // Query key
sessionContract.queryOptions()                  // TanStack Query options
sessionContract.mutationKey()                   // Mutation key  
sessionContract.mutationOptions()               // Mutation options
sessionContract.infiniteKey()                   // Infinite query key
sessionContract.infiniteOptions()               // Infinite query options
sessionContract.experimental_liveKey()          // Live query key
sessionContract.experimental_liveOptions()      // Live query options
sessionContract.experimental_streamedKey()      // Streamed query key
sessionContract.experimental_streamedOptions()  // Streamed query options
```

## Helper Function

The `custom()` helper creates ORPC-like contracts for custom endpoints:

```typescript
custom<TInput, TOutput, TError>({
  type: 'query' | 'mutation',
  queryKey: QueryKey | ((input: TInput) => QueryKey),
  fetcher?: (input: TInput) => Promise<TOutput>,     // For queries
  mutationFn?: (input: TInput) => Promise<TOutput>,  // For mutations
  staleTime?: number,
  gcTime?: number,
  retry?: number,
  enabled?: boolean,
  // ... other TanStack Query options
})
```

This returns an object with all the same methods as ORPC contracts.

## Usage Patterns

## Usage Patterns

### 1. Define Contracts (Endpoints File)

```typescript
// domains/user/endpoints.ts
import { orpc } from '@/lib/orpc'
import { custom } from '@/domains/shared/helpers'
import { authClient } from '@/lib/auth-client'

export const userEndpoints = {
  // ✅ ORPC contracts - use directly
  list: orpc.user.list,
  detail: orpc.user.findById,
  create: orpc.user.create,
  
  // ✅ Custom contracts - create with custom() helper
  session: custom({
    type: 'query',
    queryKey: ['auth', 'session'],
    fetcher: async () => authClient.getSession(),
    staleTime: STALE_TIME.DEFAULT,
  }),
  
  logout: custom({
    type: 'mutation',
    queryKey: ['auth', 'logout'],
    mutationFn: async () => authClient.logout(),
  }),
} as const
```

### 2. Client-Side with TanStack Query

Both ORPC and custom contracts work the same way:

```typescript
// Client component
import { useQuery, useMutation } from '@tanstack/react-query'
import { userEndpoints } from '@/domains/user/endpoints'

function UserList() {
  // ✅ ORPC contract - use queryOptions
  const { data: users } = useQuery(
    userEndpoints.list.queryOptions({ page: 1, limit: 20 })
  )
  
  // ✅ Custom contract - same API
  const { data: session } = useQuery(
    userEndpoints.session.queryOptions()
  )
  
  return <div>{users?.length} users</div>
}

function CreateUserForm() {
  // ✅ ORPC mutation
  const { mutate } = useMutation(
    userEndpoints.create.mutationOptions()
  )
  
  // ✅ Custom mutation - same API
  const { mutate: logout } = useMutation(
    userEndpoints.logout.mutationOptions()
  )
  
  return (
    <button onClick={() => mutate({ name: 'John', email: 'john@example.com' })}>
      Create User
    </button>
  )
}
```

### 3. Server-Side Direct Calls

Both ORPC and custom contracts use `.call()`:

```typescript
// Server component
export default async function UsersPage() {
  // ✅ ORPC contract - use call
  const users = await userEndpoints.list.call({ page: 1, limit: 20 })
  
  // ✅ Custom contract - same API
  const session = await userEndpoints.session.call()
  
  return (
    <div>
      <div>Session: {session?.user.name}</div>
      <div>{users.length} users</div>
    </div>
  )
}

// Server action
'use server'
export async function createUserAction(formData: FormData) {
  // ✅ Direct call with ORPC
  const user = await userEndpoints.create.call({
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  })
  
  revalidatePath('/users')
  return user
}
```

### 4. Hooks Layer (Optional Abstraction)

Create domain-specific hooks that use the contracts:

```typescript
// domains/user/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userEndpoints } from './endpoints'

// Query hooks
export function useUserList(filters: UserListInput) {
  return useQuery(userEndpoints.list.queryOptions(filters))
}

export function useSession() {
  return useQuery(userEndpoints.session.queryOptions())
}

// Mutation hooks with cache invalidation
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    ...userEndpoints.create.mutationOptions(),
    onSuccess: () => {
      // Invalidate using query keys
      queryClient.invalidateQueries({
        queryKey: userEndpoints.list.queryOptions({ page: 1, limit: 20 }).queryKey
      })
    }
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  
  return useMutation({
    ...userEndpoints.logout.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userEndpoints.session.queryOptions().queryKey
      })
    }
  })
}
```

### 5. Server Layer (Optional Abstraction)

Create server-side functions that use the contracts:

```typescript
// domains/user/server.ts
import { userEndpoints } from './endpoints'

// Server-side data fetchers
export async function getUserList(filters: UserListInput) {
  return await userEndpoints.list.call(filters)
}

export async function getSession() {
  return await userEndpoints.session.call()
}

export async function createUser(data: CreateUserInput) {
  return await userEndpoints.create.call(data)
}

// Use in server components
export default async function Page() {
  const users = await getUserList({ page: 1, limit: 20 })
  return <div>{users.length} users</div>
}
```

### 6. Cache Invalidation

Query keys are accessible through `.queryOptions().queryKey`:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { userEndpoints } from '@/domains/user/endpoints'

function InvalidationExample() {
  const queryClient = useQueryClient()
  
  const invalidateUserList = () => {
    queryClient.invalidateQueries({
      // Get query key from queryOptions
      queryKey: userEndpoints.list.queryOptions({ page: 1, limit: 20 }).queryKey
    })
  }
  
  const invalidateSession = () => {
    queryClient.invalidateQueries({
      queryKey: userEndpoints.session.queryOptions().queryKey
    })
  }
  
  return <button onClick={invalidateUserList}>Refresh</button>
}
```

## Type Safety Benefits

All methods maintain full type safety with automatic type inference:

```typescript
// ✅ Type-safe input - inferred from fetcher signature
const users = await userEndpoints.list.call({ 
  page: 1, 
  limit: 20 
})

// ❌ TypeScript error - missing required field
const users = await userEndpoints.list.call({ 
  page: 1 
  // Error: Property 'limit' is missing
})

// ✅ Type-safe output - inferred from fetcher return type
const { data } = useQuery(userEndpoints.list.queryOptions({ page: 1, limit: 20 }))
// data is typed as User[] | undefined

// ✅ Type-safe mutation input
const { mutate } = useMutation(userEndpoints.create.mutationOptions())
mutate({ name: 'John', email: 'john@example.com' })

// ❌ TypeScript error - invalid field
mutate({ name: 'John', invalidField: 'test' })
// Error: Object literal may only specify known properties
```

## Complete Contract API Reference

All contracts (ORPC and custom) expose these methods:

### Core Methods

```typescript
// Direct execution (server-side or client-side)
.call(input: TInput): Promise<TOutput>

// TanStack Query integration
.queryKey(input: TInput): QueryKey
.queryOptions(input: TInput): UseQueryOptions<TOutput>
.mutationKey(): QueryKey
.mutationOptions(): UseMutationOptions<TOutput, TError, TInput>

// Infinite query support
.infiniteKey(input: TInput): QueryKey
.infiniteOptions(input: TInput): UseInfiniteQueryOptions<TOutput>

// Base key property
.key: QueryKey
```

### Experimental Features

```typescript
// Live query support (experimental)
.experimental_liveKey(input: TInput): QueryKey
.experimental_liveOptions(input: TInput): UseLiveQueryOptions<TOutput>

// Streamed query support (experimental)
.experimental_streamedKey(input: TInput): QueryKey
.experimental_streamedOptions(input: TInput): UseStreamedQueryOptions<TOutput>
```

## Summary

Both ORPC contracts and custom contracts have **identical APIs**:

| Method | ORPC Contract | Custom Contract | Description |
|--------|---------------|-----------------|-------------|
| `.call(input)` | ✅ | ✅ | Direct server/client execution |
| `.queryKey(input)` | ✅ | ✅ | Query cache key |
| `.queryOptions(input)` | ✅ | ✅ | TanStack Query options |
| `.mutationKey()` | ✅ | ✅ | Mutation cache key |
| `.mutationOptions()` | ✅ | ✅ | TanStack Mutation options |
| `.infiniteKey(input)` | ✅ | ✅ | Infinite query key |
| `.infiniteOptions(input)` | ✅ | ✅ | Infinite query options |
| `.experimental_*` | ✅ | ✅ | Experimental features |

**Key Points:**
- Use ORPC contracts directly (no wrappers needed)
- Use `custom()` helper for non-ORPC endpoints
- Same API for both = consistent usage everywhere
- Full TypeScript type safety with inference
- Works in client components, server components, and server actions

