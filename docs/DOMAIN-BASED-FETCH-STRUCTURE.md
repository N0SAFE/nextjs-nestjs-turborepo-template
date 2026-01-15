# Domain-Based Fetch Structure

> Proposed architecture to consolidate hooks, query configs, query keys, and timing in domain-focused folders

## Current Structure Problems

### Current Layout
```
apps/web/src/
├── hooks/                              # Scattered hooks
│   ├── useAuth.ts                      # Auth domain
│   ├── useUser.orpc-hooks.ts          # User domain (ORPC)
│   ├── useAdmin.ts                     # Admin domain
│   ├── useOrganization.ts             # Org domain
│   └── ...
├── lib/
│   └── query/                          # Centralized query config
│       ├── config.ts                   # Base timing/retry config
│       ├── user-config.ts             # User query options
│       ├── org-config.ts              # Org query options
│       └── admin-config.ts            # Admin query options
```

### Problems
1. **Split concerns**: Hooks in `/hooks`, configs in `/lib/query`
2. **Boilerplate**: Separate files for timing, keys, invalidations
3. **Hard to navigate**: Need to jump between 3+ files for one domain
4. **Duplication**: Query keys defined in multiple places
5. **No clear ownership**: Which file "owns" the user domain?

---

## Proposed Structure: Domain-Based

### New Layout
```
apps/web/src/
├── domains/                            # ALL fetch logic by domain
│   ├── user/
│   │   ├── index.ts                    # Barrel export
│   │   ├── config.ts                   # Endpoint behavior configuration
│   │   ├── hooks.ts                    # All user hooks
│   │   ├── queries.ts                  # Query keys + timing + invalidations
│   │   ├── server.ts                   # Server-side static functions
│   │   └── README.md                   # Domain documentation
│   │
│   ├── organization/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── hooks.ts
│   │   ├── queries.ts
│   │   ├── server.ts
│   │   └── README.md
│   │
│   ├── admin/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── hooks.ts
│   │   ├── queries.ts
│   │   ├── server.ts
│   │   └── README.md
│   │
│   ├── auth/
│   │   ├── index.ts
│   │   ├── config.ts                   # Manual queryKeys for Better Auth
│   │   ├── hooks.ts                    # Better Auth hooks
│   │   ├── queries.ts                  # Session keys + config
│   │   ├── server.ts                   # Server-side auth queries
│   │   └── README.md
│   │
│   └── shared/
│       ├── config.ts                   # Base timing constants (STALE_TIME, GC_TIME, RETRY)
│       ├── types.ts                    # Shared query types + config interfaces
│       └── server.ts                   # Shared server utilities
│
├── hooks/                              # DEPRECATED - migrate to domains/
└── lib/query/                          # DEPRECATED - migrate to domains/
```

### Key Principles

1. **Co-location**: Everything related to a domain lives together
2. **Single Import**: `import { useUserManagement } from '@/domains/user'`
3. **Config-Driven**: 
   - `config.ts` defines endpoint behavior (timing, retry, keys)
   - ORPC endpoints use auto-generated queryKeys
   - Custom hooks define manual queryKeys
4. **Dual Usage**: Same config works for client hooks AND server-side functions
5. **Clear Separation**: 
   - `config.ts` → Endpoint definitions
   - `queries.ts` → Query key factories & cache utilities
   - `hooks.ts` → React hooks using config
   - `server.ts` → Server-side functions using config
6. **Documentation**: Each domain documents its own API and patterns

---

## Config System Architecture

The config system defines how endpoints behave for both client hooks AND server-side calls. It handles two patterns:

### Pattern 1: ORPC Endpoints (Auto-generated QueryKeys)

ORPC contracts automatically generate queryKeys via `contract.queryOptions()`. We just reference the contract:

```typescript
// domains/user/config.ts
import { orpc } from '@/lib/orpc-client'
import { STALE_TIME, GC_TIME, RETRY_CONFIG } from '@/domains/shared/config'

export const userEndpoints = {
  list: {
    type: 'orpc' as const,
    contract: orpc.user.list.queryOptions,  // Auto-generates queryKey
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.DEFAULT,
    retry: RETRY_CONFIG.attempts,
  },
  
  detail: {
    type: 'orpc' as const,
    contract: orpc.user.getById.queryOptions,  // Auto-generates queryKey
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.LONG,
    retry: RETRY_CONFIG.attempts,
  },
}
```

### Pattern 2: Custom Hooks (Manual QueryKeys)

Custom hooks like Better Auth require manual queryKey definitions:

```typescript
// domains/auth/config.ts
import { authClient } from '@/lib/auth-client'
import { STALE_TIME, GC_TIME, RETRY_CONFIG } from '@/domains/shared/config'

// Manual queryKey factory
export const authKeys = {
  all: ['auth'] as const,
  session: () => ['auth', 'session'] as const,
  user: () => ['auth', 'user'] as const,
  permissions: (userId: string) => ['auth', 'permissions', userId] as const,
}

export const authEndpoints = {
  session: {
    type: 'custom' as const,
    queryKey: authKeys.session,
    fetcher: () => authClient.getSession(),
    staleTime: STALE_TIME.FAST,
    gcTime: GC_TIME.SHORT,
    retry: 1,
  },
  
  user: {
    type: 'custom' as const,
    queryKey: authKeys.user,
    fetcher: () => authClient.getUser(),
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.DEFAULT,
    retry: 2,
  },
}
```

### Shared Types

```typescript
// domains/shared/types.ts
import type { QueryOptions } from '@tanstack/react-query'

/**
 * Base query configuration
 */
export interface BaseQueryConfig {
  staleTime: number
  gcTime: number
  retry: number
  onError?: (error: Error) => void
}

/**
 * ORPC endpoint - uses auto-generated queryKeys
 */
export interface ORPCEndpoint extends BaseQueryConfig {
  type: 'orpc'
  contract: any  // orpc.contract.queryOptions function
}

/**
 * Custom endpoint - requires manual queryKey definition
 */
export interface CustomEndpoint extends BaseQueryConfig {
  type: 'custom'
  queryKey: (...args: any[]) => any[]
  fetcher: (...args: any[]) => Promise<any>
}

export type EndpointConfig = ORPCEndpoint | CustomEndpoint
```

---

## File Structure Example: User Domain

### `apps/web/src/domains/user/config.ts`

```typescript
/**
 * User Domain Endpoint Configuration
 * 
 * Uses orpcEndpoint() factory for type-safe endpoint definitions.
 * All types automatically inferred from ORPC contracts.
 */

import { orpcEndpoint } from '@/domains/shared/helpers'
import { orpc } from '@/lib/orpc-client'
import { STALE_TIME, GC_TIME, RETRY_CONFIG } from '@/domains/shared/config'

/**
 * User endpoints - fully typed with orpcEndpoint factory
 * Input/output types automatically inferred from contracts
 */
export const userEndpoints = {
  list: orpcEndpoint({
    contract: orpc.user.list,
    staleTime: STALE_TIME.DEFAULT,    // 2 minutes
    gcTime: GC_TIME.DEFAULT,          // 10 minutes
    retry: RETRY_CONFIG.attempts,      // 3 attempts
  }),

  detail: orpcEndpoint({
    contract: orpc.user.getById,
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.LONG,             // 30 minutes (rarely changes)
    retry: RETRY_CONFIG.attempts,
  }),

  current: orpcEndpoint({
    contract: orpc.user.getCurrent,
    staleTime: STALE_TIME.FAST,       // 30 seconds (auth-critical)
    gcTime: GC_TIME.SHORT,            // 5 minutes
    retry: RETRY_CONFIG.attempts,
  }),

  permissions: orpcEndpoint({
    contract: orpc.user.getPermissions,
    staleTime: STALE_TIME.FAST,       // 30 seconds (security-critical)
    gcTime: GC_TIME.SHORT,
    retry: RETRY_CONFIG.attempts,
  }),

  stats: orpcEndpoint({
    contract: orpc.user.getStats,
    staleTime: STALE_TIME.STATIC,     // 30 minutes (expensive query)
    gcTime: GC_TIME.LONG,
    retry: 1,                         // Don't retry expensive queries
  }),
} as const

export type UserEndpoints = typeof userEndpoints
```

### `apps/web/src/domains/user/server.ts`

Server-side static functions using the same config:

```typescript
/**
 * User Domain Server Functions
 * 
 * Server-side query functions for use in:
 * - Server Components
 * - Server Actions
 * - API Routes
 * 
 * Uses the same config as client hooks for consistency.
 */

import 'server-only'
import { userEndpoints } from './config'

/**
 * User query functions for server-side
 * Uses factory-generated fetch methods with automatic type inference
 */
export const userQueries = {
  /**
   * Fetch user list with filters
   * Types automatically inferred from endpoint factory
   * @example
   * const users = await userQueries.list({ page: 1, pageSize: 20 })
   */
  list: (input?: any) => userEndpoints.list.fetch(input),
  //                     ^? Fully typed Promise<UserList>

  /**
   * Fetch single user by ID
   * Types automatically inferred from endpoint factory
   * @example
   * const user = await userQueries.detail('user-id')
   */
  detail: (id: string) => userEndpoints.detail.fetch({ id }),
  //                      ^? Fully typed Promise<User>

  /**
   * Fetch current authenticated user
   * Types automatically inferred from endpoint factory
   * @example
   * const currentUser = await userQueries.current()
   */
  current: () => userEndpoints.current.fetch(undefined),
  //              ^? Fully typed Promise<User>

  /**
   * Fetch user permissions
   * Types automatically inferred from endpoint factory
   * @example
   * const permissions = await userQueries.permissions('user-id')
   */
  permissions: (userId: string) => userEndpoints.permissions.fetch({ userId }),
  //                              ^? Fully typed Promise<Permissions>

  /**
   * Fetch user statistics
   * Types automatically inferred from endpoint factory
   * @example
   * const stats = await userQueries.stats()
   */
  stats: () => userEndpoints.stats.fetch(undefined),
  //            ^? Fully typed Promise<UserStats>
} as const

/**
 * User mutation functions for server-side
 */
export const userMutations = {
  create: async (data: Parameters<typeof orpc.user.create>[0]) => {
    return await orpc.user.create(data)
  },

  update: async (data: Parameters<typeof orpc.user.update>[0]) => {
    return await orpc.user.update(data)
  },

  delete: async (id: string) => {
    return await orpc.user.delete({ id })
  },
} as const

/**
 * Example: Using in Server Component
 * 
 * import { userQueries } from '@/domains/user'
 * 
 * export default async function UsersPage() {
 *   const users = await userQueries.list({ page: 1, pageSize: 20 })
 *   return <UserList users={users} />
 * }
 */

/**
 * Example: Using in Server Action
 * 
 * 'use server'
 * import { userMutations } from '@/domains/user'
 * 
 * export async function createUserAction(formData: FormData) {
 *   const user = await userMutations.create({
 *     name: formData.get('name'),
 *     email: formData.get('email'),
 *   })
 *   revalidatePath('/users')
 *   return user
 * }
 */
```

### `apps/web/src/domains/user/queries.ts`
```typescript
/**
 * User Domain Query Configuration
 * 
 * Centralized query keys, timing, and invalidations for user operations.
 * Follows ORPC hooks pattern with domain-specific configuration.
 */

import { defineInvalidations } from '@repo/orpc-utils/hooks'
import { appContract } from '@repo/api-contracts'
import { orpc } from '@/lib/orpc-client'
import { STALE_TIME, GC_TIME } from '../shared/config'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const userKeys = {
  all: () => ['user'] as const,
  lists: () => [...userKeys.all(), 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all(), 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all(), 'current'] as const,
  permissions: (id: string) => [...userKeys.detail(id), 'permissions'] as const,
  stats: () => [...userKeys.all(), 'stats'] as const,
}

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================

export const userTiming = {
  list: {
    staleTime: STALE_TIME.DEFAULT,    // 2 minutes
    gcTime: GC_TIME.DEFAULT,          // 10 minutes
  },
  detail: {
    staleTime: STALE_TIME.DEFAULT,    // 2 minutes
    gcTime: GC_TIME.LONG,             // 30 minutes
  },
  current: {
    staleTime: STALE_TIME.FAST,       // 30 seconds (frequently changes)
    gcTime: GC_TIME.DEFAULT,          // 10 minutes
  },
  permissions: {
    staleTime: STALE_TIME.SLOW,       // 5 minutes (rarely changes)
    gcTime: GC_TIME.LONG,             // 30 minutes
  },
  stats: {
    staleTime: STALE_TIME.SLOW,       // 5 minutes
    gcTime: GC_TIME.DEFAULT,          // 10 minutes
  },
}

// ============================================================================
// INVALIDATIONS
// ============================================================================

export const userInvalidations = defineInvalidations<
  typeof appContract.user,
  typeof orpc.user
>({
  // After creating user: invalidate list and stats
  create: ['list', 'stats'],
  
  // After updating user: invalidate that user's detail and list (sort might change)
  update: (input, output) => ({
    detail: { id: input.id },
    list: undefined,
  }),
  
  // After deleting user: invalidate everything
  delete: ['list', 'detail', 'stats'],
})

// ============================================================================
// QUERY OPTIONS FACTORY
// ============================================================================

export const userQueryOptions = {
  list: (filters?: UserFilters) => ({
    queryKey: userKeys.list(filters),
    ...userTiming.list,
  }),
  
  detail: (id: string) => ({
    queryKey: userKeys.detail(id),
    ...userTiming.detail,
  }),
  
  current: () => ({
    queryKey: userKeys.current(),
    ...userTiming.current,
  }),
  
  permissions: (id: string) => ({
    queryKey: userKeys.permissions(id),
    ...userTiming.permissions,
  }),
  
  stats: () => ({
    queryKey: userKeys.stats(),
    ...userTiming.stats,
  }),
}

// ============================================================================
// TYPES
// ============================================================================

export interface UserFilters {
  search?: string
  role?: string
  status?: 'active' | 'inactive'
}
```

### `apps/web/src/domains/user/hooks.ts`
```typescript
/**
 * User Domain Hooks
 * 
 * All user-related data fetching hooks using config from config.ts.
 * Both ORPC hooks and composite hooks for complex operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc-client'
import { userEndpoints } from './config'
import { userKeys } from './queries'
import type { UserListFilters, UserFormData } from '@/types/user'

// ============================================================================
// QUERY HOOKS (using config)
// ============================================================================

/**
 * List users with optional filters
 * Types automatically inferred from orpcEndpoint factory
 * @example
 * const { data } = useListUsers({ search: 'john' })
 */
export const useListUsers = (filters?: UserListFilters, options?: any) => 
  userEndpoints.list.useQuery(filters, options)
//    ^? Return type inferred from orpc.user.list contract

/**
 * Get single user by ID
 * Types automatically inferred from orpcEndpoint factory
 * @example
 * const { data } = useUserDetail('user-123')
 */
export const useUserDetail = (id: string, options?: any) => 
  userEndpoints.detail.useQuery({ id }, options)
//    ^? Return type inferred from orpc.user.getById contract

/**
 * Get current authenticated user
 * Types automatically inferred from orpcEndpoint factory
 * @example
 * const { data: currentUser } = useCurrentUser()
 */
export const useCurrentUser = (options?: any) => 
  userEndpoints.current.useQuery(undefined, options)
//    ^? Return type inferred from orpc.user.getCurrent contract

/**
 * Get user permissions
 * Types automatically inferred from orpcEndpoint factory
 * @example
 * const { data: permissions } = useUserPermissions('user-123')
 */
export const useUserPermissions = (userId: string, options?: any) => 
  userEndpoints.permissions.useQuery({ userId }, options)
//    ^? Return type inferred from orpc.user.getPermissions contract

/**
 * Get user statistics
 * Types automatically inferred from orpcEndpoint factory
 * @example
 * const { data: stats } = useUserStats()
 */
export const useUserStats = (options?: any) => 
  userEndpoints.stats.useQuery(undefined, options)
//    ^? Return type inferred from orpc.user.getStats contract

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create new user
 * @example
 * const { mutate: createUser } = useCreateUser()
 * createUser({ name: 'John', email: 'john@example.com' })
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UserFormData) => orpc.user.create(data),
    onSuccess: () => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Update existing user
 * @example
 * const { mutate: updateUser } = useUpdateUser()
 * updateUser({ id: 'user-123', name: 'Jane' })
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<UserFormData>) => 
      orpc.user.update({ id, ...data }),
    onSuccess: (_, variables) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Delete user
 * @example
 * const { mutate: deleteUser } = useDeleteUser()
 * deleteUser('user-123')
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => orpc.user.delete({ id }),
    onSuccess: (_, id) => {
      // Remove user query and invalidate list
      queryClient.removeQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * All user management actions in one hook
 * @example
 * const { createUser, updateUser, deleteUser, isCreating } = useUserActions()
 */
export function useUserActions() {
  const create = useCreateUser()
  const update = useUpdateUser()
  const remove = useDeleteUser()
  
  return {
    createUser: create.mutate,
    createUserAsync: create.mutateAsync,
    updateUser: update.mutate,
    updateUserAsync: update.mutateAsync,
    deleteUser: remove.mutate,
    deleteUserAsync: remove.mutateAsync,
    
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
    
    createError: create.error,
    updateError: update.error,
    deleteError: remove.error,
  }
}

/**
 * User management dashboard hook
 * Combines list, stats, and actions for admin UI
 * All config-driven from userEndpoints
 * @example
 * const { users, stats, createUser, isLoading } = useUserManagement()
 */
export function useUserManagement(filters?: UserListFilters) {
  const listQuery = useListUsers(filters)
  const statsQuery = useUserStats()
  const actions = useUserActions()
  
  return {
    // Query data
    users: listQuery.data?.users ?? [],
    totalUsers: listQuery.data?.total ?? 0,
    stats: statsQuery.data,
    
    // Loading states
    isLoading: listQuery.isLoading || statsQuery.isLoading,
    
    // Mutations
    ...actions,
    
    // Refetch methods
    refetch: () => {
      listQuery.refetch()
      statsQuery.refetch()
    },
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { UserFilters } from './queries'
```

### `apps/web/src/domains/user/index.ts`
```typescript
/**
 * User Domain - Barrel Export
 * 
 * Single import point for all user-related functionality
 */

// Hooks
export {
  useListUsers,
  useUserDetail,
  useCurrentUser,
  useUserPermissions,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserActions,
  useUserManagement,
  usePrefetchUserList,
  useInvalidateUsers,
} from './hooks'

// Query configuration
export {
  userKeys,
  userTiming,
  userInvalidations,
  userQueryOptions,
  type UserFilters,
} from './queries'
```

### `apps/web/src/domains/user/README.md`
```markdown
# User Domain

All user-related data fetching, query configuration, and hooks.

## Quick Import

\`\`\`typescript
import { useUserManagement, userKeys } from '@/domains/user'
\`\`\`

## Available Hooks

### Query Hooks
- \`useListUsers(filters?)\` - List users with optional filtering
- \`useUserDetail(id)\` - Get single user by ID
- \`useCurrentUser()\` - Get authenticated user
- \`useUserPermissions(id)\` - Get user permissions
- \`useUserStats()\` - Get user statistics

### Mutation Hooks
- \`useCreateUser()\` - Create new user
- \`useUpdateUser()\` - Update existing user
- \`useDeleteUser()\` - Delete user

### Composite Hooks
- \`useUserActions()\` - All CRUD actions in one hook
- \`useUserManagement()\` - Dashboard-ready hook with list + stats + actions

### Utility Hooks
- \`usePrefetchUserList()\` - Prefetch for performance
- \`useInvalidateUsers()\` - Manual cache invalidation

## Query Keys

\`\`\`typescript
import { userKeys } from '@/domains/user'

userKeys.all()                  // ['user']
userKeys.list({ search: 'john' }) // ['user', 'list', { search: 'john' }]
userKeys.detail('user-123')     // ['user', 'detail', 'user-123']
\`\`\`

## Timing Configuration

\`\`\`typescript
import { userTiming } from '@/domains/user'

userTiming.list.staleTime    // 2 minutes
userTiming.detail.gcTime     // 30 minutes
\`\`\`
```

---

## Shared Configuration

### `apps/web/src/domains/shared/config.ts`
```typescript
/**
 * Shared Query Configuration
 * 
 * Base timing and retry configuration used across all domains
 */

// ============================================================================
// STALE TIME - How long data is considered fresh
// ============================================================================

export const STALE_TIME = {
  FAST: 30_000,        // 30 seconds - Frequently changing data
  DEFAULT: 120_000,    // 2 minutes - Normal data
  SLOW: 300_000,       // 5 minutes - Rarely changing data
  STATIC: 1_800_000,   // 30 minutes - Almost never changes
} as const

// ============================================================================
// GARBAGE COLLECTION TIME - How long unused data stays in cache
// ============================================================================

export const GC_TIME = {
  SHORT: 300_000,      // 5 minutes
  DEFAULT: 600_000,    // 10 minutes
  LONG: 1_800_000,     // 30 minutes
} as const

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export const RETRY_CONFIG = {
  attempts: 3,
  delay: 1000,         // 1 second
  backoff: 2,          // Exponential: 1s, 2s, 4s
} as const

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(attempt: number): number {
  return RETRY_CONFIG.delay * Math.pow(RETRY_CONFIG.backoff, attempt - 1)
}
```

### `apps/web/src/domains/shared/helpers.ts`
```typescript
/**
 * Type-Safe Endpoint Factory Functions
 * 
 * Eliminates boilerplate and ensures full type inference for all endpoints.
 * Export and use these helpers in domain config files.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { Contract } from '@orpc/contract'

// ============================================================================
// ORPC ENDPOINT FACTORY
// ============================================================================

/**
 * Create a type-safe ORPC endpoint
 * Automatically infers input/output types from contract
 * 
 * @example
 * const userList = orpcEndpoint({
 *   contract: orpc.user.list,
 *   staleTime: STALE_TIME.DEFAULT,
 * })
 * // Types automatically inferred from contract
 */
export function orpcEndpoint<
  TContract extends Contract<any, any, any>
>(config: {
  contract: TContract
  staleTime?: number
  gcTime?: number
  retry?: number
  onError?: (error: any) => void
}) {
  type TInput = TContract extends Contract<infer I, any, any> ? I : never
  type TOutput = TContract extends Contract<any, infer O, any> ? O : never

  return {
    type: 'orpc' as const,
    ...config,
    
    // Type-safe hook
    useQuery: (input: TInput, options?: UseQueryOptions<TOutput, any>) => {
      const queryOptions = config.contract.queryOptions({
        input,
        staleTime: config.staleTime,
        gcTime: config.gcTime,
        retry: config.retry,
      })
      return useQuery({ ...queryOptions, ...options })
    },
    
    // Type-safe server fetch
    fetch: async (input: TInput): Promise<TOutput> => {
      return await config.contract(input)
    },
  }
}

// ============================================================================
// CUSTOM ENDPOINT FACTORY
// ============================================================================

/**
 * Create a type-safe custom endpoint (for Better Auth, etc.)
 * Requires explicit queryKey and fetcher definitions
 * 
 * @example
 * const session = customEndpoint<void, SessionData>({
 *   name: 'session',
 *   queryKey: () => ['auth', 'session'] as const,
 *   fetcher: () => authClient.getSession(),
 *   staleTime: STALE_TIME.FAST,
 * })
 */
export function customEndpoint<
  TInput = void,
  TOutput = unknown,
  TError = Error
>(config: {
  name: string
  queryKey: TInput extends void 
    ? () => readonly string[] 
    : (input: TInput) => readonly [...string[], TInput?]
  fetcher: TInput extends void 
    ? () => Promise<TOutput> 
    : (input: TInput) => Promise<TOutput>
  staleTime?: number
  gcTime?: number
  retry?: number
  mutationFn?: (input: TInput) => Promise<TOutput>
}) {
  return {
    type: 'custom' as const,
    name: config.name,
    queryKey: config.queryKey,
    fetcher: config.fetcher,
    staleTime: config.staleTime,
    gcTime: config.gcTime,
    retry: config.retry,
    
    // Type-safe query hook
    useQuery: (input: TInput extends void ? void : TInput, options?: any) => {
      return useQuery({
        queryKey: config.queryKey(input as any),
        queryFn: () => config.fetcher(input as any),
        staleTime: config.staleTime,
        gcTime: config.gcTime,
        retry: config.retry,
        ...options,
      })
    },
    
    // Type-safe mutation hook (optional)
    useMutation: config.mutationFn ? () => {
      return useMutation({
        mutationFn: config.mutationFn!,
      })
    } : undefined,
    
    // Type-safe server fetch
    fetch: async (input: TInput extends void ? void : TInput): Promise<TOutput> => {
      return await config.fetcher(input as any)
    },
  }
}

// ============================================================================
// GENERIC ENDPOINT FACTORY
// ============================================================================

/**
 * Create a fully custom type-safe endpoint
 * Most flexible option with explicit type parameters
 * 
 * @example
 * const getUser = defineEndpoint<{ id: string }, User>({
 *   queryKey: (input) => ['user', input.id],
 *   fetcher: (input) => fetch(`/api/users/${input.id}`).then(r => r.json()),
 *   staleTime: STALE_TIME.DEFAULT,
 * })
 */
export function defineEndpoint<
  TInput = void,
  TOutput = unknown,
  TError = Error
>(config: {
  queryKey: TInput extends void 
    ? () => readonly any[] 
    : (input: TInput) => readonly any[]
  fetcher: TInput extends void 
    ? () => Promise<TOutput> 
    : (input: TInput) => Promise<TOutput>
  staleTime?: number
  gcTime?: number
  retry?: number
}) {
  return {
    type: 'custom' as const,
    ...config,
    
    useQuery: (input: TInput, options?: UseQueryOptions<TOutput, TError>) => {
      return useQuery({
        queryKey: config.queryKey(input as any),
        queryFn: () => config.fetcher(input as any),
        staleTime: config.staleTime,
        gcTime: config.gcTime,
        retry: config.retry,
        ...options,
      })
    },
    
    fetch: async (input: TInput): Promise<TOutput> => {
      return await config.fetcher(input as any)
    },
  }
}
```

### `apps/web/src/domains/shared/types.ts`
```typescript
/**
 * Shared TypeScript types for domain endpoints
 */

import type { QueryKey } from '@tanstack/react-query'

/**
 * Base endpoint configuration (legacy - prefer factory functions)
 */
export interface BaseEndpointConfig {
  staleTime?: number
  gcTime?: number
  retry?: number
  onError?: (error: Error) => void
}

/**
 * ORPC endpoint type (legacy - use orpcEndpoint() instead)
 */
export interface ORPCEndpoint extends BaseEndpointConfig {
  type: 'orpc'
  contract: any
}

/**
 * Custom endpoint type (legacy - use customEndpoint() instead)
 */
export interface CustomEndpoint extends BaseEndpointConfig {
  type: 'custom'
  queryKey: (...args: any[]) => QueryKey
  fetcher: (...args: any[]) => Promise<any>
}

export type EndpointConfig = ORPCEndpoint | CustomEndpoint
```

---

## Type-Safe Helper Functions

To eliminate boilerplate and ensure full type safety, we provide factory functions that automatically infer types from your endpoint definitions.

### `defineEndpoint()` - Generic Endpoint Factory

The base factory function that creates strongly-typed endpoint definitions:

```typescript
// domains/shared/endpoint-factory.ts
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query'

/**
 * Generic endpoint definition with full type inference
 */
export function defineEndpoint<
  TInput = void,
  TOutput = unknown,
  TError = Error,
  TQueryKey extends QueryKey = QueryKey
>(config: {
  queryKey: TInput extends void 
    ? () => TQueryKey 
    : (input: TInput) => TQueryKey
  fetcher: TInput extends void 
    ? () => Promise<TOutput> 
    : (input: TInput) => Promise<TOutput>
  staleTime?: number
  gcTime?: number
  retry?: number
  onError?: (error: TError) => void
  onSuccess?: (data: TOutput) => void
}) {
  return {
    type: 'custom' as const,
    ...config,
    // Type-safe helpers
    useQuery: (input: TInput, options?: UseQueryOptions<TOutput, TError>) => {
      return useQuery({
        queryKey: config.queryKey(input as any),
        queryFn: () => config.fetcher(input as any),
        staleTime: config.staleTime,
        gcTime: config.gcTime,
        retry: config.retry,
        ...options,
      })
    },
    fetch: async (input: TInput): Promise<TOutput> => {
      return await config.fetcher(input as any)
    },
  }
}

/**
 * Usage Example - Strongly typed endpoint
 */
interface UserListInput {
  page: number
  pageSize: number
  search?: string
}

interface UserListOutput {
  users: User[]
  total: number
  hasMore: boolean
}

const userListEndpoint = defineEndpoint<UserListInput, UserListOutput>({
  queryKey: (input) => ['user', 'list', input] as const,
  fetcher: async (input) => {
    const response = await fetch(`/api/users?${new URLSearchParams(input)}`)
    return response.json()
  },
  staleTime: STALE_TIME.DEFAULT,
  gcTime: GC_TIME.DEFAULT,
  retry: 3,
})

// ✅ Fully typed hook
const { data } = userListEndpoint.useQuery({ page: 1, pageSize: 20 })
//    ^? const data: UserListOutput | undefined

// ✅ Fully typed server function
const users = await userListEndpoint.fetch({ page: 1, pageSize: 20 })
//    ^? const users: UserListOutput

// ❌ TypeScript error - invalid input
userListEndpoint.useQuery({ page: 'invalid' })  // Error: Type 'string' is not assignable to type 'number'
```

### `orpcEndpoint()` - ORPC-Specific Factory

Simplified factory for ORPC endpoints with auto-generated query keys:

```typescript
// domains/shared/endpoint-factory.ts
import type { Contract } from '@orpc/contract'

/**
 * ORPC endpoint factory with automatic type inference
 * Extracts input/output types from ORPC contract
 */
export function orpcEndpoint<
  TContract extends Contract<any, any, any>
>(config: {
  contract: TContract
  staleTime?: number
  gcTime?: number
  retry?: number
  onError?: (error: any) => void
}) {
  type TInput = TContract extends Contract<infer I, any, any> ? I : never
  type TOutput = TContract extends Contract<any, infer O, any> ? O : never

  return {
    type: 'orpc' as const,
    ...config,
    // Auto-inferred from contract
    useQuery: (input: TInput, options?: any) => {
      const queryOptions = config.contract.queryOptions({
        input,
        staleTime: config.staleTime,
        gcTime: config.gcTime,
        retry: config.retry,
      })
      return useQuery({ ...queryOptions, ...options })
    },
    fetch: async (input: TInput): Promise<TOutput> => {
      return await config.contract(input)
    },
  }
}

/**
 * Usage Example - ORPC endpoint
 */
import { orpc } from '@/lib/orpc-client'

const userListEndpoint = orpcEndpoint({
  contract: orpc.user.list,
  staleTime: STALE_TIME.DEFAULT,
  gcTime: GC_TIME.DEFAULT,
  retry: 3,
})

// ✅ Types automatically inferred from ORPC contract
const { data } = userListEndpoint.useQuery({ page: 1, pageSize: 20 })
//    ^? Inferred from orpc.user.list output type

// ✅ Server-side fetch also typed
const users = await userListEndpoint.fetch({ page: 1, pageSize: 20 })
//    ^? Same type as useQuery
```

### `customEndpoint()` - Better Auth Style Factory

Specialized factory for custom hooks like Better Auth:

```typescript
// domains/shared/endpoint-factory.ts

/**
 * Custom endpoint for non-ORPC APIs (like Better Auth)
 * Requires explicit queryKey definition
 */
export function customEndpoint<
  TInput = void,
  TOutput = unknown,
  TError = Error
>(config: {
  name: string
  queryKey: TInput extends void 
    ? () => readonly string[] 
    : (input: TInput) => readonly [...string[], TInput?]
  fetcher: TInput extends void 
    ? () => Promise<TOutput> 
    : (input: TInput) => Promise<TOutput>
  staleTime?: number
  gcTime?: number
  retry?: number
  mutationFn?: (input: TInput) => Promise<TOutput>
}) {
  return {
    type: 'custom' as const,
    name: config.name,
    queryKey: config.queryKey,
    fetcher: config.fetcher,
    staleTime: config.staleTime,
    gcTime: config.gcTime,
    retry: config.retry,
    
    // Query hook
    useQuery: (input: TInput extends void ? void : TInput, options?: any) => {
      return useQuery({
        queryKey: config.queryKey(input as any),
        queryFn: () => config.fetcher(input as any),
        staleTime: config.staleTime,
        gcTime: config.gcTime,
        retry: config.retry,
        ...options,
      })
    },
    
    // Mutation hook (if provided)
    useMutation: config.mutationFn ? () => {
      return useMutation({
        mutationFn: config.mutationFn!,
      })
    } : undefined,
    
    // Server-side fetch
    fetch: async (input: TInput extends void ? void : TInput): Promise<TOutput> => {
      return await config.fetcher(input as any)
    },
  }
}

/**
 * Usage Example - Better Auth session
 */
import { authClient } from '@/lib/auth-client'

interface SessionData {
  user: { id: string; email: string }
  expires: Date
}

const sessionEndpoint = customEndpoint<void, SessionData>({
  name: 'session',
  queryKey: () => ['auth', 'session'] as const,
  fetcher: () => authClient.getSession(),
  staleTime: STALE_TIME.FAST,
  gcTime: GC_TIME.SHORT,
  retry: 1,
})

// ✅ Typed query hook
const { data } = sessionEndpoint.useQuery()
//    ^? const data: SessionData | undefined

// ✅ Typed server function
const session = await sessionEndpoint.fetch()
//    ^? const session: SessionData
```

### Complete Domain Example with Factory Functions

Here's how a complete domain looks using the factory functions:

```typescript
// domains/user/endpoints.ts
import { orpcEndpoint } from '@/domains/shared/endpoint-factory'
import { orpc } from '@/lib/orpc-client'
import { STALE_TIME, GC_TIME, RETRY_CONFIG } from '@/domains/shared/config'

/**
 * User domain endpoints - fully typed with factory functions
 */
export const userEndpoints = {
  list: orpcEndpoint({
    contract: orpc.user.list,
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.DEFAULT,
    retry: RETRY_CONFIG.attempts,
  }),
  
  detail: orpcEndpoint({
    contract: orpc.user.getById,
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.LONG,
    retry: RETRY_CONFIG.attempts,
  }),
  
  current: orpcEndpoint({
    contract: orpc.user.getCurrent,
    staleTime: STALE_TIME.FAST,
    gcTime: GC_TIME.SHORT,
    retry: RETRY_CONFIG.attempts,
  }),
  
  stats: orpcEndpoint({
    contract: orpc.user.getStats,
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.LONG,
    retry: 1,
  }),
} as const

// Type exports - automatically inferred
export type UserEndpoints = typeof userEndpoints
```

```typescript
// domains/user/hooks.ts
import { userEndpoints } from './endpoints'

/**
 * All hooks automatically typed from endpoint definitions
 */
export const useListUsers = (filters?: any, options?: any) => 
  userEndpoints.list.useQuery(filters, options)
//    ^? Return type automatically inferred from orpc.user.list

export const useUserDetail = (id: string, options?: any) => 
  userEndpoints.detail.useQuery({ id }, options)
//    ^? Return type automatically inferred from orpc.user.getById

export const useCurrentUser = (options?: any) => 
  userEndpoints.current.useQuery(undefined, options)
//    ^? Return type automatically inferred from orpc.user.getCurrent

export const useUserStats = (options?: any) => 
  userEndpoints.stats.useQuery(undefined, options)
//    ^? Return type automatically inferred from orpc.user.getStats
```

```typescript
// domains/user/server.ts
import 'server-only'
import { userEndpoints } from './endpoints'

/**
 * Server functions - automatically typed from endpoints
 */
export const userQueries = {
  list: (filters?: any) => userEndpoints.list.fetch(filters),
  //                       ^? Fully typed Promise<UserList>
  
  detail: (id: string) => userEndpoints.detail.fetch({ id }),
  //                      ^? Fully typed Promise<User>
  
  current: () => userEndpoints.current.fetch(undefined),
  //              ^? Fully typed Promise<User>
  
  stats: () => userEndpoints.stats.fetch(undefined),
  //            ^? Fully typed Promise<UserStats>
} as const
```

### Complete Auth Domain Example (Custom Endpoints)

```typescript
// domains/auth/endpoints.ts
import { customEndpoint } from '@/domains/shared/endpoint-factory'
import { authClient } from '@/lib/auth-client'
import { STALE_TIME, GC_TIME } from '@/domains/shared/config'

/**
 * Auth endpoints using Better Auth client
 */
export const authEndpoints = {
  session: customEndpoint<void, SessionData>({
    name: 'session',
    queryKey: () => ['auth', 'session'] as const,
    fetcher: () => authClient.getSession(),
    staleTime: STALE_TIME.FAST,
    gcTime: GC_TIME.SHORT,
    retry: 1,
  }),
  
  user: customEndpoint<void, UserData>({
    name: 'user',
    queryKey: () => ['auth', 'user'] as const,
    fetcher: () => authClient.getUser(),
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.DEFAULT,
    retry: 2,
  }),
  
  permissions: customEndpoint<{ userId: string }, PermissionData[]>({
    name: 'permissions',
    queryKey: (input) => ['auth', 'permissions', input.userId] as const,
    fetcher: (input) => authClient.getPermissions(input.userId),
    staleTime: STALE_TIME.FAST,
    gcTime: GC_TIME.SHORT,
    retry: 2,
  }),
  
  // Mutation example
  signIn: customEndpoint<SignInInput, SessionData>({
    name: 'signIn',
    queryKey: () => ['auth', 'signIn'] as const,
    fetcher: () => { throw new Error('Use mutation') },
    mutationFn: (input) => authClient.signIn(input),
  }),
} as const

export type AuthEndpoints = typeof authEndpoints
```

```typescript
// domains/auth/hooks.ts
import { authEndpoints } from './endpoints'

/**
 * Auth hooks - fully typed from endpoint definitions
 */
export const useAuth = (options?: any) => 
  authEndpoints.session.useQuery(undefined, options)
//    ^? Return type: { data: SessionData | undefined, ... }

export const useAuthUser = (options?: any) => 
  authEndpoints.user.useQuery(undefined, options)
//    ^? Return type: { data: UserData | undefined, ... }

export const useUserPermissions = (userId: string, options?: any) => 
  authEndpoints.permissions.useQuery({ userId }, options)
//    ^? Return type: { data: PermissionData[] | undefined, ... }

export const useSignIn = () => 
  authEndpoints.signIn.useMutation!()
//    ^? Return type: { mutate: (input: SignInInput) => void, ... }
```

### Type Safety Benefits

**Before (Manual Typing):**
```typescript
// ❌ Manual typing, error-prone, verbose
export interface UserListInput {
  page: number
  pageSize: number
}

export interface UserListOutput {
  users: User[]
  total: number
}

export const useListUsers = (input: UserListInput): UseQueryResult<UserListOutput> => {
  return useQuery({
    queryKey: ['user', 'list', input],
    queryFn: () => orpc.user.list(input),
    staleTime: 120_000,
  })
}
```

**After (Factory Functions):**
```typescript
// ✅ Types inferred automatically, concise, type-safe
export const userEndpoints = {
  list: orpcEndpoint({
    contract: orpc.user.list,  // Types inferred from contract
    staleTime: STALE_TIME.DEFAULT,
  }),
}

export const useListUsers = (input: any) => 
  userEndpoints.list.useQuery(input)
//    ^? All types inferred: input, output, error
```

### Key Advantages

1. **Zero Boilerplate**: Define endpoint once, get hook + server function
2. **Full Type Inference**: Input/output types automatically inferred
3. **Compile-Time Safety**: TypeScript catches mismatches immediately
4. **Consistent API**: Same pattern for ORPC, Better Auth, custom APIs
5. **Easy Refactoring**: Change contract → types update everywhere
6. **Self-Documenting**: Type signatures serve as documentation
7. **Test Friendly**: Mock endpoints, not individual hooks

### Migration Path

**Step 1: Create endpoint factories** in `domains/shared/endpoint-factory.ts`

**Step 2: Convert one domain** using factories
```typescript
// Old
export const useUser = (id: string) => useQuery({ ... })

// New
export const userEndpoints = { 
  detail: orpcEndpoint({ contract: orpc.user.getById, ... }) 
}
export const useUser = (id: string) => userEndpoints.detail.useQuery({ id })
```

**Step 3: Gradually migrate** other domains

**Step 4: Remove manual types** - rely on inference

---

## Example: Custom Hook Domain (Better Auth)

For custom hooks like Better Auth, we define queryKeys manually in the config:

### `apps/web/src/domains/auth/config.ts`

```typescript
/**
 * Auth Domain Configuration (Custom Hooks)
 * 
 * Uses customEndpoint() factory for Better Auth client API.
 * Types automatically inferred from factory function.
 */

import { customEndpoint } from '@/domains/shared/helpers'
import { authClient } from '@/lib/auth-client'
import { STALE_TIME, GC_TIME } from '@/domains/shared/config'

/**
 * Auth endpoints using customEndpoint factory
 * Requires explicit queryKey + fetcher, but types are inferred
 */
export const authEndpoints = {
  session: customEndpoint<void, SessionData>({
    name: 'session',
    queryKey: () => ['auth', 'session'] as const,
    fetcher: () => authClient.getSession(),
    staleTime: STALE_TIME.FAST,       // 30 seconds
    gcTime: GC_TIME.SHORT,            // 5 minutes
    retry: 1,                         // Low retry for auth
  }),

  user: customEndpoint<void, UserData>({
    name: 'user',
    queryKey: () => ['auth', 'user'] as const,
    fetcher: () => authClient.getUser(),
    staleTime: STALE_TIME.DEFAULT,    // 2 minutes
    gcTime: GC_TIME.DEFAULT,          // 10 minutes
    retry: 2,
  }),

  permissions: customEndpoint<{ userId: string }, PermissionData[]>({
    name: 'permissions',
    queryKey: (input) => ['auth', 'permissions', input.userId] as const,
    fetcher: (input) => authClient.getPermissions(input.userId),
    staleTime: STALE_TIME.FAST,       // 30 seconds
    gcTime: GC_TIME.SHORT,            // 5 minutes
    retry: 2,
  }),
} as const

export type AuthEndpoints = typeof authEndpoints

/**
 * Type definitions for auth data
 */
interface SessionData {
  user: { id: string; email: string }
  expires: Date
}

interface UserData {
  id: string
  email: string
  name: string
}

interface PermissionData {
  permission: string
  granted: boolean
}
```

### `apps/web/src/domains/auth/hooks.ts`

```typescript
import { authEndpoints } from './config'

/**
 * Get current session
 * Types automatically inferred from customEndpoint factory
 * @example
 * const { data } = useAuth()
 * //    ^? const data: SessionData | undefined
 */
export const useAuth = (options?: any) => 
  authEndpoints.session.useQuery(undefined, options)

/**
 * Get authenticated user
 * Types automatically inferred from customEndpoint factory
 * @example
 * const { data } = useAuthUser()
 * //    ^? const data: UserData | undefined
 */
export const useAuthUser = (options?: any) => 
  authEndpoints.user.useQuery(undefined, options)

/**
 * Get user permissions
 * Types automatically inferred from customEndpoint factory
 * @example
 * const { data } = useUserPermissions('user-123')
 * //    ^? const data: PermissionData[] | undefined
 */
export const useUserPermissions = (userId: string, options?: any) => 
  authEndpoints.permissions.useQuery({ userId }, options)
```

### `apps/web/src/domains/auth/server.ts`

```typescript
import 'server-only'
import { authEndpoints } from './config'

/**
 * Auth queries for server-side
 * Uses factory-generated fetch methods with automatic type inference
 */
export const authQueries = {
  /**
   * Get session from server
   * Types automatically inferred from endpoint factory
   * @example
   * const session = await authQueries.session()
   * //    ^? const session: SessionData
   */
  session: () => authEndpoints.session.fetch(undefined),

  /**
   * Get user from server
   * Types automatically inferred from endpoint factory
   * @example
   * const user = await authQueries.user()
   * //    ^? const user: UserData
   */
  user: () => authEndpoints.user.fetch(undefined),

  /**
   * Get user permissions from server
   * Types automatically inferred from endpoint factory
   * @example
   * const perms = await authQueries.permissions('user-123')
   * //    ^? const perms: PermissionData[]
   */
  permissions: (userId: string) => authEndpoints.permissions.fetch({ userId }),
} as const
```

**Key Differences from ORPC:**
- **queryKey**: Manually defined factory functions (not auto-generated)
- **fetcher**: Custom function using Better Auth client
- **Config**: Same timing/retry pattern, works for client + server
- **Server usage**: Call `authQueries.session()` just like `userQueries.list()`

---

## Migration Example

### Before (Manual Configuration)
```typescript
// ❌ Scattered imports, manual typing, verbose
import { useUser } from '@/hooks/useUser.orpc-hooks'
import { USER_QUERY_CONFIG } from '@/lib/query/user-config'
import { queryKeys } from '@/lib/query/keys'

// Manual configuration, no type inference
const { data } = useUser(userId, {
  staleTime: USER_QUERY_CONFIG.detail.staleTime,
  queryKey: queryKeys.user.detail(userId),
})
```

### After (Factory Functions)
```typescript
// ✅ Single import, types inferred, concise
import { useUserDetail } from '@/domains/user'

// Configuration built-in, fully typed from factory
const { data } = useUserDetail(userId)
//    ^? const data: User | undefined (inferred from orpcEndpoint)
```

### Migration Steps

**Step 1: Create helper functions**
```typescript
// domains/shared/helpers.ts
import { orpcEndpoint, customEndpoint } from '@/domains/shared/helpers'
```

**Step 2: Convert config to use factories**
```typescript
// domains/user/config.ts - Before
export const userEndpoints = {
  detail: {
    type: 'orpc',
    contract: orpc.user.getById.queryOptions,
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.LONG,
  } satisfies ORPCEndpoint,  // ❌ Manual type annotation
}

// domains/user/config.ts - After
export const userEndpoints = {
  detail: orpcEndpoint({    // ✅ Factory function
    contract: orpc.user.getById,
    staleTime: STALE_TIME.DEFAULT,
    gcTime: GC_TIME.LONG,
  }),  // Types inferred automatically
}
```

**Step 3: Use factory-generated methods**
```typescript
// domains/user/hooks.ts - Before
export const useUserDetail = (id: string) => {
  const endpoint = userEndpoints.detail
  const queryOptions = endpoint.contract({
    input: { id },
    staleTime: endpoint.staleTime,
    gcTime: endpoint.gcTime,
    retry: endpoint.retry,
  })
  return useQuery({ ...queryOptions })
}

// domains/user/hooks.ts - After
export const useUserDetail = (id: string, options?: any) => 
  userEndpoints.detail.useQuery({ id }, options)
//    ^? Return type inferred from orpcEndpoint factory
```

**Step 4: Server functions also use factories**
```typescript
// domains/user/server.ts - Before
export const userQueries = {
  detail: async (id: string) => await orpc.user.getById({ id }),
}

// domains/user/server.ts - After
export const userQueries = {
  detail: (id: string) => userEndpoints.detail.fetch({ id }),
  //                      ^? Fully typed Promise<User>
}
```

---

## Benefits

### 1. **Co-location**
All user-related code in one folder - hooks, keys, timing, invalidations

### 2. **Less Boilerplate**
No need to manually pass query keys and timing to every hook

### 3. **Better DX**
- Single import: `import { useUserManagement } from '@/domains/user'`
- TypeScript auto-complete shows all user hooks together
- Easy to find everything related to users

### 4. **Clear Ownership**
Each domain folder is self-contained and independently maintainable

### 5. **Easier Testing**
Mock entire domain by mocking `@/domains/user` module

### 6. **Scalability**
Add new domains without touching existing ones

### 7. **Documentation**
Each domain has its own README explaining usage

---

## Import Path Aliases

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/domains/*": ["./src/domains/*"]
    }
  }
}
```

Now import like:
```typescript
import { useUserManagement, userKeys } from '@/domains/user'
import { useOrgMembers, orgKeys } from '@/domains/organization'
import { useAdminStats } from '@/domains/admin'
```

---

## Migration Strategy

### Phase 1: Create Structure (No Breaking Changes)
1. Create `apps/web/src/domains/` folder
2. Copy and refactor one domain (e.g., user) to new structure
3. Keep old hooks/lib structure intact
4. Gradually update components to use new imports

### Phase 2: Migrate Components
1. Update components one by one to use `@/domains/*` imports
2. Track progress with grep: `grep -r "from '@/hooks/useUser" src/`
3. No rush - both systems work during migration

### Phase 3: Cleanup (Breaking Change)
1. Once all components migrated, delete old structure
2. Remove deprecated files: `apps/web/src/hooks/*`, `apps/web/src/lib/query/*`
3. Update documentation

---

## Complete Domain List

Proposed domains for this project:

- `domains/user/` - User CRUD, current user, permissions
- `domains/organization/` - Org CRUD, members, invitations
- `domains/admin/` - Admin stats, audit logs, system health
- `domains/auth/` - Session, sign in/out, password reset (Better Auth)
- `domains/push/` - Push notification subscriptions (ORPC)
- `domains/health/` - API health checks (ORPC)
- `domains/shared/` - Base configuration, shared types

---

## Questions & Answers

**Q: What about Better Auth hooks? They don't use ORPC.**

A: Better Auth hooks still go in `domains/auth/` but use Better Auth's client API instead of ORPC. Same structure, different underlying implementation.

**Q: Should forms be in domains too?**

A: Forms could go in `domains/{name}/forms.ts` if they're domain-specific. Global forms stay in `components/forms/`.

**Q: What about server actions?**

A: Server actions can go in `domains/{name}/actions.ts` if they're domain-specific.

**Q: Do we still use ORPC hooks generation?**

A: Yes! `createRouterHooks` still generates hooks, but now they're wrapped in domain-specific files with pre-configured options.
