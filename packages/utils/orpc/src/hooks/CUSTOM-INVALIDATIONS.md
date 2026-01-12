# Custom Hook Invalidations

This guide explains how to define type-safe invalidations for custom mutation hooks alongside ORPC-generated hooks.

## Overview

When you create custom mutation hooks that modify data, you need to invalidate related query hooks to keep the UI in sync. The `defineCustomInvalidations` helper provides a type-safe way to declare which queries should be invalidated when custom mutations succeed.

## Basic Usage

### Step 1: Define Custom Hooks

First, define your custom hooks using `defineCustomHooks`:

```typescript
import { defineCustomHooks, defineCustomInvalidations, mergeHooks } from '@repo/orpc-utils/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const customUserHooks = defineCustomHooks({
  // Query hook
  useUserProfile: (userId: string) => {
    return useQuery({
      queryKey: ['userProfile', userId],
      queryFn: () => fetchUserProfile(userId),
    })
  },
  
  // Mutation hook that should invalidate queries
  useUpdateProfile: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: ProfileData) => updateProfile(data),
      onSuccess: () => {
        // Manual invalidation (will be replaced by defineCustomInvalidations)
        queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      }
    })
  },
  
  // Another query hook
  useStats: () => {
    return useQuery({
      queryKey: ['userStats'],
      queryFn: () => fetchStats(),
    })
  }
})
```

### Step 2: Define Custom Invalidations

Declare which queries should be invalidated by which mutations:

```typescript
const customInvalidations = defineCustomInvalidations(customUserHooks, {
  // When useUpdateProfile succeeds, invalidate these hooks
  useUpdateProfile: ['useUserProfile', 'useStats'],
})
```

### Step 3: Merge with ORPC Hooks

Pass the custom invalidations to `mergeHooks`:

```typescript
export const allUserHooks = mergeHooks({
  router: userRouterHooks,        // ORPC-generated hooks
  composite: userCompositeHooks,   // ORPC-generated composites
  custom: customUserHooks,         // Your custom hooks
  customInvalidations,             // Type-safe invalidation config
})
```

## Type Safety

The type system ensures:

1. **Only valid hook names**: You can only reference hooks that exist in `customUserHooks`
2. **Mutation hooks only**: The left side must be a mutation hook (returns `useMutation`)
3. **Query hooks only**: The right side must be query hooks (returns `useQuery`)

```typescript
// ✅ Type-safe - all hooks exist
const validConfig = defineCustomInvalidations(customUserHooks, {
  useUpdateProfile: ['useUserProfile', 'useStats'],
})

// ❌ Type error - 'nonExistentHook' doesn't exist
const invalidConfig = defineCustomInvalidations(customUserHooks, {
  useUpdateProfile: ['nonExistentHook'],
})
```

## Complete Example

```typescript
import { 
  createRouterHooks,
  createCompositeHooks,
  defineInvalidations,
  defineCustomHooks,
  defineCustomInvalidations,
  mergeHooks
} from '@repo/orpc-utils/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc, appContract } from '@/lib/orpc'

// 1. ORPC invalidations
const userInvalidations = defineInvalidations(orpc.user, {
  create: ['list', 'count'],
  update: (input) => ({ findById: { id: input.id } }),
})

// 2. Generate ORPC hooks
const userRouterHooks = createRouterHooks(orpc.user, {
  invalidations: userInvalidations,
  useQueryClient,
})

const userCompositeHooks = createCompositeHooks(orpc.user, userRouterHooks, {
  useQueryClient,
})

// 3. Define custom hooks
const customUserHooks = defineCustomHooks({
  // Query: User profile with computed fields
  useUserProfile: (userId: string) => {
    const user = userRouterHooks.useFindById({ id: userId })
    return {
      ...user,
      displayName: user.data ? `${user.data.name} (${user.data.email})` : undefined,
    }
  },
  
  // Mutation: Custom profile update with validation
  useUpdateUserProfile: () => {
    return useMutation({
      mutationFn: async (data: { userId: string; name: string; email: string }) => {
        // Custom validation, transformation, etc.
        return await orpc.user.update.call({ 
          id: data.userId, 
          name: data.name, 
          email: data.email 
        })
      },
    })
  },
  
  // Query: User statistics
  useUserStats: () => {
    return useQuery({
      queryKey: ['user', 'stats'],
      queryFn: async () => {
        const count = await orpc.user.count.call()
        return {
          total: typeof count === 'number' ? count : 0,
          active: Math.floor((typeof count === 'number' ? count : 0) * 0.8),
        }
      },
    })
  },
})

// 4. Define custom invalidations
const customInvalidations = defineCustomInvalidations(customUserHooks, {
  // When useUpdateUserProfile succeeds, invalidate:
  useUpdateUserProfile: ['useUserProfile', 'useUserStats'],
})

// 5. Merge everything
export const allUserHooks = mergeHooks({
  router: userRouterHooks,
  composite: userCompositeHooks,
  custom: customUserHooks,
  customInvalidations,
})

// Usage
function UserProfile({ userId }: { userId: string }) {
  // All hooks available in one place
  const profile = allUserHooks.useUserProfile(userId)
  const updateMutation = allUserHooks.useUpdateUserProfile()
  const stats = allUserHooks.useUserStats()
  
  return (
    <div>
      <h1>{profile.displayName}</h1>
      <button onClick={() => updateMutation.mutate({ 
        userId, 
        name: 'New Name', 
        email: 'new@email.com' 
      })}>
        Update Profile
      </button>
      <p>Total Users: {stats.data?.total}</p>
    </div>
  )
}
```

## Benefits

1. **Type Safety**: Compiler catches invalid hook names
2. **Centralized**: All invalidation logic in one place
3. **Maintainable**: Easy to see which mutations affect which queries
4. **Automatic**: Invalidations happen automatically when mutations succeed
5. **Consistent**: Same pattern for ORPC and custom hooks

## Future Enhancements

Currently, the `customInvalidations` configuration is logged but not yet applied automatically. Future versions will:

- Automatically wrap mutation hooks to invalidate specified queries
- Support resolver-style invalidations (like ORPC's `defineInvalidations`)
- Provide fine-grained control over when invalidations occur
- Add support for optimistic updates

## API Reference

### `defineCustomInvalidations<TCustomHooks>(customHooks, config)`

**Parameters:**
- `customHooks`: The custom hooks object (from `defineCustomHooks`)
- `config`: Object mapping mutation hooks to query hooks they invalidate

**Returns:** The same config object with proper typing

**Type Safety:**
- Only allows referencing hooks that exist in `customHooks`
- Keys must be mutation hooks
- Values must be arrays of query hook names
