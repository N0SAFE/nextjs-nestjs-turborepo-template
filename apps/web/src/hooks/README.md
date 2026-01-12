# Web App Hooks Architecture

This directory contains all React hooks for the web application, following established patterns for type safety, cache management, and developer experience.

## 📚 Table of Contents

- [Hook Categories](#hook-categories)
- [ORPC Hooks Pattern](#orpc-hooks-pattern)
- [Better Auth Plugin Hooks](#better-auth-plugin-hooks)
- [Query Keys Architecture](#query-keys-architecture)
- [Custom Hooks with Invalidations](#custom-hooks-with-invalidations)
- [Best Practices](#best-practices)
- [Migration Status](#migration-status)

---

## Hook Categories

### 🔷 ORPC Hooks (Type-Safe API Integration)

These hooks use the `@repo/orpc-utils` package for automatic type-safe hook generation from ORPC contracts:

- **useUser.orpc-hooks.ts** - User CRUD operations
- **useHealth.orpc-hooks.ts** - Health check endpoints
- **usePush.orpc-hooks.ts** - Push notification management
- **useTest.orpc-hooks.ts** - Test endpoints for development

**Why ORPC Hooks?**
- ✅ **Automatic Type Inference**: Full end-to-end TypeScript types from API contracts
- ✅ **Zero Boilerplate**: Hooks generated automatically based on HTTP methods (GET → query, POST/PUT/DELETE → mutation)
- ✅ **Smart Cache Invalidation**: Declarative invalidation configuration that runs automatically after mutations
- ✅ **Consistent API**: All ORPC hooks follow the same patterns and conventions
- ✅ **Composite Patterns**: Built-in hooks for common UI patterns (pagination, infinite scroll, forms, selection)

### 🔶 Better Auth Plugin Hooks (Authentication & Authorization)

These hooks wrap Better Auth's plugin APIs and should maintain their current implementation:

- **useAuth.ts** - Authentication (Better Auth client SDK)
- **useOrganization.ts** - Organization management (Better Auth Organization plugin)
- **useInvitation.ts** - Invitation system (Better Auth Invitation plugins)
- **useAdmin.ts** - Admin operations (Better Auth Admin plugin)
- **usePermissions.ts** - Permission checks (Better Auth permission system)

**Why Separate from ORPC?**
- These use Better Auth's plugin APIs (`client.organization`, `client.admin`, etc.)
- They provide client-side wrappers around Better Auth's built-in functionality
- They have their own invalidation patterns based on Better Auth's cache keys

---

## ORPC Hooks Pattern

### Structure

Each ORPC hook file follows this comprehensive pattern:

```typescript
'use client'

import {
  createRouterHooks,
  createCompositeHooks,
  defineInvalidations,
  type RouterHooksResult,
  type CompositeHooksResult,
} from '@repo/orpc-utils/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { orpc, appContract } from '@/lib/orpc'

/**
 * FILE DOCUMENTATION (10-20 lines)
 * Explains benefits of ORPC hooks over manual hooks
 */

/**
 * 1. Define invalidations with typed generics
 */
const entityInvalidations = defineInvalidations<
  typeof appContract.entity,
  typeof orpc.entity
>(orpc.entity, {
  // Query invalidation after mutations
  create: ['list', 'count'],
  update: (input) => ({ findById: { id: input.id } }),
  delete: ['list', 'count', 'findById'],
})

/**
 * 2. Create router hooks with both type parameters
 * CRITICAL: Pass raw contract type as first parameter
 */
const entityRouterHooks = createRouterHooks<
  typeof appContract.entity,
  typeof orpc.entity
>(orpc.entity, {
  invalidations: entityInvalidations,
  useQueryClient,
})

/**
 * 3. Create composite hooks for UI patterns
 */
const entityComposite = createCompositeHooks(
  orpc.entity,
  entityRouterHooks,
  { useQueryClient }
)

/**
 * 4. Named exports with usage examples
 */
export const entityHooks = {
  ...entityRouterHooks,
  ...entityComposite,
}

/**
 * 5. Wrapper functions for each operation
 */
export function useEntityCreate() {
  return entityHooks.useCreate()
}
// ... more wrappers

/**
 * 6. Composite wrapper functions
 */
export function useEntityManagement() {
  return entityHooks.useManagement()
}
// ... more composite wrappers

/**
 * 7. Type exports
 */
export type EntityHooks = typeof entityHooks
export type EntityCreateResult = ReturnType<typeof useEntityCreate>
// ... more type exports
```

### Key Components

1. **Invalidation Configuration** - Defines which queries to invalidate after mutations
2. **Router Hooks** - Auto-generated query/mutation hooks based on HTTP methods
3. **Composite Hooks** - Pre-built patterns for management, pagination, infinite scroll, forms, selection
4. **Wrapper Functions** - Named exports for each operation with JSDoc
5. **Type Exports** - TypeScript types for consumers

### Type Parameters

**CRITICAL**: ORPC hooks require **two type parameters** for proper type discrimination:

```typescript
// ✅ CORRECT - Two type parameters
createRouterHooks<typeof appContract.entity, typeof orpc.entity>(...)

// ❌ WRONG - Single type parameter (won't work)
createRouterHooks<typeof orpc.entity>(...)
```

**Why Two Parameters?**
- `TContract` (first) - Raw contract type from `appContract` for type-level metadata
- `TRouter` (second) - Runtime router from `orpc` for implementation
- This enables proper discrimination between queries (GET) and mutations (POST/PUT/DELETE)

---

## Better Auth Plugin Hooks

### Structure

Better Auth hooks follow a custom pattern optimized for Better Auth's API:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth/client'

/**
 * 1. Query keys (MUST be flat structure)
 */
export const entityKeys = {
  session: () => ['session'] as const,
  all: () => ['entity'] as const,
  list: () => ['entity', 'list'] as const,
  detail: (id: string) => ['entity', 'detail', id] as const,
  // ❌ NO NESTED OBJECTS - breaks QueryKeys type
}

/**
 * 2. Query hooks
 */
export function useEntityList() {
  return useQuery({
    queryKey: entityKeys.list(),
    queryFn: async () => {
      const result = await authClient.entity.list()
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

/**
 * 3. Mutation hooks with manual invalidation
 */
export function useEntityCreate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const result = await authClient.entity.create({ data })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all() })
    },
  })
}
```

### Key Differences from ORPC

- **Manual Hook Definition**: Each hook is defined explicitly (no auto-generation)
- **Better Auth Client**: Uses `authClient` instead of `orpc`
- **Manual Invalidation**: `onSuccess` callbacks handle cache invalidation
- **Flat Query Keys**: Keys MUST be flat (no nested objects) for type safety

---

## Query Keys Architecture

### The Flat Keys Requirement

**CRITICAL**: All query keys MUST use a **flat structure** to satisfy the `QueryKeys` type constraint:

```typescript
// ✅ CORRECT - Flat structure
export const entityKeys = {
  all: () => ['entity'] as const,
  list: () => ['entity', 'list'] as const,
  detail: (id: string) => ['entity', 'detail', id] as const,
  userList: (userId: string) => ['entity', 'user', userId, 'list'] as const,
}

// ❌ WRONG - Nested structure (breaks type safety)
export const entityKeys = {
  all: () => ['entity'] as const,
  user: {  // ❌ Nested object
    list: (userId: string) => [...],
    detail: (userId: string) => [...],
  },
}
```

### Why Flat Keys?

The `QueryKeys` type from `@repo/orpc-utils/hooks` enforces:

```typescript
type QueryKeys = Record<string, QueryKeyFactory>
type QueryKeyFactory = (...args: any[]) => readonly unknown[]
```

This means:
- ✅ All top-level properties MUST be functions
- ❌ Nested objects break type inference
- ✅ Use naming like `userList`, `userDetail` instead of `user.list`, `user.detail`

### Query Key Patterns

**Hierarchical Keys** (recommended):
```typescript
export const invitationKeys = {
  all: () => ['invitations'] as const,
  
  // Platform namespace
  platformAll: () => ['invitations', 'platform'] as const,
  platformLists: () => ['invitations', 'platform', 'list'] as const,
  platformList: (status?: string) => ['invitations', 'platform', 'list', { status }] as const,
  
  // Organization namespace
  organizationAll: () => ['invitations', 'organization'] as const,
  organizationLists: () => ['invitations', 'organization', 'list'] as const,
  organizationPending: () => ['invitations', 'organization', 'list', 'pending'] as const,
}
```

**Reference Keys** (for complex hierarchies):
```typescript
export const organizationQueryKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationQueryKeys.all, 'list'] as const,
  list: (filters?: object) => [...organizationQueryKeys.lists(), filters] as const,
  details: () => [...organizationQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationQueryKeys.details(), id] as const,
  members: (id: string) => [...organizationQueryKeys.detail(id), 'members'] as const,
}
```

---

## Custom Hooks with Invalidations

### Unified Pattern

You can define custom hooks alongside ORPC hooks and use a single invalidation configuration:

```typescript
import { defineCustomHooks } from '@repo/orpc-utils/hooks'

/**
 * 1. Define custom hooks
 */
const customHooks = defineCustomHooks({
  useProfile: (userId: string) => {
    return useQuery({
      queryKey: ['user', 'profile', userId],
      queryFn: async () => {
        const user = await orpc.user.findById.call({ id: userId })
        return {
          ...user,
          displayName: `${user.name} (${user.email})`,
        }
      },
    })
  },

  useUpdateProfile: () => {
    return useMutation({
      mutationFn: async (data: { userId: string; name: string }) => {
        return await orpc.user.update.call(data)
      },
    })
  },
})

/**
 * 2. Define ALL invalidations in one place
 */
const invalidations = defineInvalidations<
  typeof appContract.user,
  typeof orpc.user,
  typeof customHooks
>(orpc.user, {
  // ORPC mutation invalidations
  create: ['list', 'count'],
  update: (input) => ({ findById: { id: input.id } }),
  
  // Custom mutation invalidations
  custom: {
    useUpdateProfile: ['useProfile', 'list'],  // Mix custom and ORPC!
  }
})

/**
 * 3. Merge everything
 */
export const hooks = mergeHooks({
  router: routerHooks,
  composite: compositeHooks,
  custom: customHooks,
  invalidations: invalidations,
})
```

### Benefits

- ✅ **Single Source of Truth**: All invalidations in one place
- ✅ **Type Safety**: Full TypeScript validation for custom hooks
- ✅ **Consistency**: Same pattern for ORPC and custom mutations
- ✅ **Flexibility**: Can invalidate ORPC queries from custom mutations and vice versa

---

## Best Practices

### 1. Query Keys

```typescript
// ✅ DO: Flat structure with descriptive names
export const keys = {
  all: () => ['entity'] as const,
  userList: (userId: string) => ['entity', 'user', userId, 'list'] as const,
  orgDetail: (orgId: string) => ['entity', 'org', orgId, 'detail'] as const,
}

// ❌ DON'T: Nested objects
export const keys = {
  user: {
    list: (userId: string) => [...],  // ❌ Breaks type safety
  },
}
```

### 2. Invalidations

```typescript
// ✅ DO: Invalidate broadly to ensure consistency
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: entityKeys.all() })
}

// ⚠️ CAREFUL: Narrow invalidation (might miss related data)
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: entityKeys.list() })
}
```

### 3. Error Handling

```typescript
// ✅ DO: Throw errors for React Query to catch
queryFn: async () => {
  const result = await authClient.entity.list()
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data
}

// ❌ DON'T: Return error objects (breaks type inference)
queryFn: async () => {
  const result = await authClient.entity.list()
  return result  // ❌ Returns { data?: T, error?: E }
}
```

### 4. Type Exports

```typescript
// ✅ DO: Export types for consumers
export type EntityHooks = typeof entityHooks
export type EntityCreateResult = ReturnType<typeof useEntityCreate>

// ✅ DO: Re-export common types
export type {
  RouterHooksResult,
  CompositeHooksResult,
} from '@repo/orpc-utils/hooks'
```

### 5. Documentation

```typescript
/**
 * ✅ DO: Document hooks with JSDoc
 * 
 * @example
 * ```ts
 * const { data, isLoading } = useEntityList()
 * const { mutate } = useEntityCreate()
 * ```
 */
export function useEntityList() {
  return entityHooks.useList()
}
```

---

## Migration Status

### ✅ Completed - ORPC Hooks

All ORPC hook files have been migrated to the comprehensive pattern:

| File | Lines | Operations | Status |
|------|-------|-----------|--------|
| useUser.ts | 312 | list, findById, create, update, delete, checkEmail, count | ✅ Complete (Reference Pattern) |
| useHealth.ts | 213 | check, detailed | ✅ Complete (Standardized) |
| usePush.ts | 313 | subscribe, unsubscribe, getPublicKey, getSubscriptions, getStats, sendTestNotification | ✅ Complete (Standardized) |
| useTest.ts | 219 | nonAuthenticated, authenticated, fileUpload, fileDownload, streamOutput | ✅ Complete (Standardized) |

### ✅ Verified - Better Auth Hooks

All Better Auth plugin hooks use correct flat key structures:

| File | Lines | Key Structure | Status |
|------|-------|--------------|--------|
| useAuth.ts | 500 | authKeys (flat) | ✅ Correct |
| useInvitation.ts | 490 | invitationKeys (flat) | ✅ Fixed |
| useAdmin.ts | 400 | adminQueryKeys (flat) | ✅ Correct |
| useOrganization.ts | 351 | organizationQueryKeys (flat) | ✅ Correct |

### 🎯 Pattern Compliance

- ✅ **Type Safety**: All hooks pass TypeScript compilation
- ✅ **Flat Keys**: No nested key structures
- ✅ **Zero Hacks**: No `as any` casts or eslint-disable comments
- ✅ **Consistent**: All files follow established patterns

---

## Related Documentation

### Core Concepts
- [ORPC Client Hooks Pattern](../../../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md) - Complete pattern documentation
- [Declarative Routing Pattern](../../../.docs/core-concepts/12-DECLARATIVE-ROUTING-PATTERN.md) - Type-safe routing

### Implementation
- [ORPC Utils Package](../../../packages/utils/orpc/src/hooks/README.md) - Hook generation implementation
- [Generate Hooks](../../../packages/utils/orpc/src/hooks/generate-hooks.ts) - Core hook generator
- [Merge Hooks](../../../packages/utils/orpc/src/hooks/merge-hooks.ts) - Hook merging utility

### Examples
- [useUser.orpc-hooks.ts](./useUser.orpc-hooks.ts) - Reference ORPC implementation
- [useAuth.ts](./useAuth.ts) - Reference Better Auth implementation
- [useInvitation.ts](./useInvitation.ts) - Reference flat keys with complex hierarchy

---

## Quick Reference

### ORPC Hook Template

```typescript
'use client'
import { createRouterHooks, createCompositeHooks, defineInvalidations } from '@repo/orpc-utils/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { orpc, appContract } from '@/lib/orpc'

const invalidations = defineInvalidations<typeof appContract.entity, typeof orpc.entity>(
  orpc.entity,
  { create: ['list'], update: (input) => ({ findById: { id: input.id } }) }
)

const routerHooks = createRouterHooks<typeof appContract.entity, typeof orpc.entity>(
  orpc.entity,
  { invalidations, useQueryClient }
)

const composite = createCompositeHooks(orpc.entity, routerHooks, { useQueryClient })

export const entityHooks = { ...routerHooks, ...composite }
```

### Better Auth Hook Template

```typescript
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth/client'

export const entityKeys = {
  all: () => ['entity'] as const,
  list: () => ['entity', 'list'] as const,
}

export function useEntityList() {
  return useQuery({
    queryKey: entityKeys.list(),
    queryFn: async () => {
      const result = await authClient.entity.list()
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}
```

---

**Last Updated**: 2025-01-11  
**Pattern Version**: 2.0 (Flat Keys + Unified Invalidations)
