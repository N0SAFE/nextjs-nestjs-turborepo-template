# Query Key-Based Invalidation System Design

> **Status**: Design Document  
> **Date**: 2026-01-09  
> **Purpose**: Define architecture for type-safe, query-key-based cache invalidation

## Overview

This document defines a new invalidation system where:
- Invalidations use **actual query keys** instead of operation name strings
- Query keys are **discoverable and type-safe** via exported `keys` objects
- All query key generation is **centralized and consistent**
- Invalidations can be defined **inline** (within defineInvalidations) or **externally** (in other files)

## Current Problem

### Current Pattern (String-Based)
```typescript
// Current: Reference by operation name (strings)
const invalidations = defineInvalidations({
  contract: appContract.user,
  custom: authCustomHooks
}, {
  // String-based references - no type safety for query keys
  create: () => ['list'],  // What query key does 'list' generate?
  update: (input) => ['list', ['findById', { id: input.id }]],
  
  // Custom hooks
  useSignIn: () => [SESSION_QUERY_KEY],  // Hard-coded constant
})
```

**Issues**:
1. ❌ No way to know what query key `'list'` actually generates
2. ❌ No type safety for query key structure
3. ❌ Can't reuse query keys in other files without importing hooks
4. ❌ Hard to discover what query keys are available
5. ❌ Magic strings that can break with refactoring

## Proposed Solution

### New Pattern (Query Key-Based)

```typescript
// ✅ Define invalidations using actual query keys
const invalidations = defineInvalidations({
  contract: appContract.user,
  custom: authCustomHooks
}, {
  // Access query keys via 'keys' parameter
  create: ({ keys }) => [
    keys.list(),              // Type-safe, returns actual query key
    keys.count(),
  ],
  
  update: ({ keys, input }) => [
    keys.list(),
    keys.findById({ id: input.id }),  // Type-safe input
  ],
  
  // Custom hooks also get their keys
  useSignIn: ({ keys }) => [
    keys.session(),           // Custom hook query key
  ],
})

// ✅ Use query keys externally in other files
import { userHooks } from '@/hooks/useUser.orpc-hooks'

// Access query keys from anywhere
const userListKey = userHooks.keys.list()
const userDetailKey = userHooks.keys.findById({ id: '123' })

// Use in manual invalidation
queryClient.invalidateQueries({ queryKey: userHooks.keys.list() })
```

---

## Architecture Design

### 1. Query Key Generation

Each generated hook file exports a `keys` object containing functions for all query operations:

```typescript
// Generated in useUser.orpc-hooks.ts
export const userHooks = {
  // Existing hooks
  useList: () => useQuery(...),
  useFindById: (params) => useQuery(...),
  useCreate: () => useMutation(...),
  
  // NEW: Exported query keys
  keys: {
    // Query operation keys
    list: (input?: ListInput) => ['user', 'list', input] as const,
    findById: (input: FindByIdInput) => ['user', 'findById', input] as const,
    count: () => ['user', 'count'] as const,
    
    // Special keys
    all: () => ['user'] as const,  // Match all user queries
    detail: (id: string) => ['user', 'findById', { id }] as const,  // Convenience
  }
}
```

**For Custom Hooks:**

```typescript
// In useAuth.ts
export const authHooks = {
  // Custom hooks
  useSignInEmail: () => useMutation(...),
  useSignOut: () => useMutation(...),
  
  // NEW: Exported query keys
  keys: {
    session: () => SESSION_QUERY_KEY,
    all: () => ['auth'] as const,
  }
}
```

---

### 2. defineInvalidations API

The invalidation config receives a `keys` parameter containing all query key generators:

```typescript
type InvalidationContext<TKeys> = {
  keys: TKeys,      // All query key generators
  input: TInput,    // Mutation input
  result?: TResult, // Mutation result (in onSuccess)
}

// Usage
const invalidations = defineInvalidations({
  contract: appContract.user,
  custom: authCustomHooks
}, {
  // ORPC operations
  create: ({ keys, input }) => [
    keys.list(),                    // Invalidate all lists
    keys.count(),                   // Invalidate count
  ],
  
  update: ({ keys, input, result }) => [
    keys.findById({ id: input.id }), // Invalidate specific item
    keys.list(),                     // Invalidate lists
  ],
  
  delete: ({ keys, input }) => [
    keys.all(),                      // Invalidate everything
  ],
  
  // Custom operations
  useSignIn: ({ keys }) => [
    keys.session(),                  // Invalidate session
  ],
  
  useSignOut: ({ keys }) => [
    keys.all(),                      // Clear all cache
  ],
})
```

---

### 3. Type Safety & Inference

**Query Key Types:**

```typescript
// Query key with no parameters
type ListKey = readonly ['user', 'list', ListInput?]

// Query key with required parameters
type FindByIdKey = readonly ['user', 'findById', { id: string }]

// All possible keys
type UserQueryKeys = 
  | ListKey 
  | FindByIdKey 
  | readonly ['user', 'count']
  | readonly ['user']

// Keys object type
type UserKeys = {
  list: (input?: ListInput) => ListKey
  findById: (input: { id: string }) => FindByIdKey
  count: () => readonly ['user', 'count']
  all: () => readonly ['user']
}
```

**Invalidation Function Type:**

```typescript
type InvalidationFn<TInput, TResult, TKeys> = (
  context: {
    keys: TKeys
    input: TInput
    result?: TResult
  }
) => QueryKey[]

// Example
type CreateInvalidation = InvalidationFn<
  CreateUserInput,
  User,
  UserKeys
>
```

---

### 4. External Usage Patterns

**Pattern 1: Manual Invalidation in Components**

```typescript
import { userHooks } from '@/hooks/useUser.orpc-hooks'
import { useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const queryClient = useQueryClient()
  
  const handleRefresh = () => {
    // Type-safe query key access
    queryClient.invalidateQueries({ 
      queryKey: userHooks.keys.list() 
    })
  }
  
  const handleRefreshUser = (id: string) => {
    queryClient.invalidateQueries({ 
      queryKey: userHooks.keys.findById({ id }) 
    })
  }
}
```

**Pattern 2: Prefetching with Query Keys**

```typescript
import { userHooks } from '@/hooks/useUser.orpc-hooks'

function UserList() {
  const queryClient = useQueryClient()
  
  const handleMouseEnter = (userId: string) => {
    // Prefetch user details
    queryClient.prefetchQuery({
      queryKey: userHooks.keys.findById({ id: userId }),
      queryFn: () => orpcClient.user.findById({ id: userId })
    })
  }
}
```

**Pattern 3: Cross-Hook Invalidation**

```typescript
// In useOrganization.ts
import { userHooks } from '@/hooks/useUser.orpc-hooks'

const orgInvalidations = defineInvalidations({
  custom: orgCustomHooks
}, {
  addMember: ({ keys, input }) => [
    keys.members({ orgId: input.orgId }),  // Invalidate org members
    userHooks.keys.findById({ id: input.userId }),  // Also invalidate user
  ],
})
```

**Pattern 4: Testing with Query Keys**

```typescript
import { userHooks } from '@/hooks/useUser.orpc-hooks'

describe('User hooks', () => {
  it('should use correct query key', () => {
    const key = userHooks.keys.list({ page: 1 })
    expect(key).toEqual(['user', 'list', { page: 1 }])
  })
})
```

---

## Implementation Plan

### Phase 1: Generate Keys Objects

**File**: `packages/utils/orpc/src/hooks/generate-hooks.ts`

```typescript
function generateQueryKeys<TContract>(contract: TContract) {
  const keys: Record<string, Function> = {}
  
  // For each operation in contract
  for (const [name, operation] of Object.entries(contract)) {
    if (operation.type === 'query') {
      // Generate key function
      keys[name] = (input?: any) => {
        return [contract._name, name, input] as const
      }
    }
  }
  
  // Add utility keys
  keys.all = () => [contract._name] as const
  
  return keys
}

// Export in generated hooks
export const userHooks = {
  ...hooks,
  keys: generateQueryKeys(appContract.user)
}
```

### Phase 2: Update defineInvalidations

**File**: `packages/utils/orpc/src/hooks/generate-hooks.ts`

```typescript
export function defineInvalidations<TContract, TCustom>(
  sources: {
    contract?: TContract
    custom?: TCustom
  },
  config: {
    [K in keyof (TContract & TCustom)]: InvalidationFn<
      InputType<K>,
      ResultType<K>,
      GeneratedKeys<TContract & TCustom>  // NEW: Pass keys
    >
  }
) {
  // Generate keys object from contract + custom
  const keys = {
    ...generateContractKeys(sources.contract),
    ...generateCustomKeys(sources.custom)
  }
  
  // Wrap each invalidation function to inject keys
  const wrappedConfig = Object.entries(config).reduce((acc, [key, fn]) => {
    acc[key] = (input, result) => {
      // Call with keys injected
      return fn({ keys, input, result })
    }
    return acc
  }, {})
  
  return wrappedConfig
}
```

### Phase 3: Update Custom Hooks

**File**: `apps/web/src/hooks/useAuth.ts`

```typescript
// Define custom hooks
export const authCustomHooks = defineCustomHooks({
  useSignInEmail: () => useMutation({ ... }),
  useSignOut: () => useMutation({ ... }),
})

// Add keys object
authCustomHooks.keys = {
  session: () => SESSION_QUERY_KEY,
  all: () => ['auth'] as const,
}

// Define invalidations with keys
const authInvalidations = defineInvalidations({
  custom: authCustomHooks
}, {
  useSignInEmail: ({ keys }) => [keys.session()],
  useSignOut: ({ keys }) => [keys.all()],
})
```

### Phase 4: Update mergeHooks

Ensure merged hooks also export combined keys:

```typescript
export function mergeHooks(sources) {
  return {
    ...sources.router,
    ...sources.custom,
    keys: {
      ...sources.router?.keys,
      ...sources.custom?.keys,
    }
  }
}
```

---

## Migration Guide

### Before (String-Based)

```typescript
const invalidations = defineInvalidations({
  contract: appContract.user
}, {
  create: () => ['list', 'count'],
  update: (input) => [['findById', { id: input.id }], 'list'],
})
```

### After (Query Key-Based)

```typescript
const invalidations = defineInvalidations({
  contract: appContract.user
}, {
  create: ({ keys }) => [keys.list(), keys.count()],
  update: ({ keys, input }) => [keys.findById({ id: input.id }), keys.list()],
})
```

---

## Benefits

### ✅ Type Safety
- Query keys are typed at every level
- TypeScript catches mismatched inputs
- Autocomplete for available keys

### ✅ Discoverability
- `hooks.keys` shows all available query keys
- No magic strings to remember
- Self-documenting API

### ✅ Reusability
- Use keys anywhere in codebase
- Share keys across files
- Consistent key generation

### ✅ Maintainability
- Refactoring is safer (rename operations)
- Clear dependency tracking
- Easier to test

### ✅ Flexibility
- Use keys inline or externally
- Mix ORPC and custom keys
- Compose complex invalidation patterns

---

## Examples

### Example 1: User CRUD with Invalidations

```typescript
// useUser.orpc-hooks.ts (generated)
export const userHooks = {
  useList: () => useQuery(...),
  useCreate: () => useMutation(...),
  
  keys: {
    list: (input?: ListInput) => ['user', 'list', input] as const,
    findById: (input: { id: string }) => ['user', 'findById', input] as const,
    count: () => ['user', 'count'] as const,
    all: () => ['user'] as const,
  }
}

// Define invalidations
const userInvalidations = defineInvalidations({
  contract: appContract.user
}, {
  create: ({ keys }) => [
    keys.list(),    // Invalidate all lists
    keys.count(),   // Update count
  ],
  
  update: ({ keys, input }) => [
    keys.findById({ id: input.id }),  // Invalidate updated user
    keys.list(),                       // Refresh lists
  ],
  
  delete: ({ keys, input }) => [
    keys.all(),  // Clear everything for simplicity
  ],
})
```

### Example 2: Auth with Session Management

```typescript
// useAuth.ts
export const authHooks = {
  useSignInEmail: () => useMutation(...),
  useSignOut: () => useMutation(...),
  
  keys: {
    session: () => SESSION_QUERY_KEY,
    all: () => ['auth'] as const,
  }
}

const authInvalidations = defineInvalidations({
  custom: authHooks
}, {
  useSignInEmail: ({ keys }) => [keys.session()],
  useSignOut: ({ keys }) => [keys.all()],
})
```

### Example 3: Cross-Domain Invalidation

```typescript
// useOrganization.ts
import { userHooks } from '@/hooks/useUser.orpc-hooks'

const orgInvalidations = defineInvalidations({
  custom: orgHooks
}, {
  addMember: ({ keys, input }) => [
    keys.members({ orgId: input.orgId }),           // Org members
    userHooks.keys.findById({ id: input.userId }),  // User details
  ],
  
  removeMember: ({ keys, input }) => [
    keys.members({ orgId: input.orgId }),
    keys.detail(input.orgId),  // Organization detail
    userHooks.keys.all(),       // Clear all user cache
  ],
})
```

### Example 4: Manual Invalidation in Component

```typescript
// UserProfile.tsx
import { userHooks } from '@/hooks/useUser.orpc-hooks'
import { authHooks } from '@/hooks/useAuth'

function UserProfile({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  
  const handleRefresh = () => {
    // Invalidate specific user
    queryClient.invalidateQueries({ 
      queryKey: userHooks.keys.findById({ id: userId }) 
    })
    
    // Invalidate session
    queryClient.invalidateQueries({ 
      queryKey: authHooks.keys.session() 
    })
  }
  
  return <button onClick={handleRefresh}>Refresh</button>
}
```

---

## Edge Cases & Considerations

### 1. Wildcard Invalidation

```typescript
// Invalidate all user queries
queryClient.invalidateQueries({ 
  queryKey: userHooks.keys.all() 
})

// Invalidate specific user and all related
queryClient.invalidateQueries({ 
  predicate: (query) => {
    const [scope, operation] = query.queryKey
    return scope === 'user' && operation === 'findById'
  }
})
```

### 2. Partial Key Matching

```typescript
// Match all lists regardless of input
queryClient.invalidateQueries({ 
  predicate: (query) => {
    const [scope, operation] = query.queryKey
    return scope === 'user' && operation === 'list'
  }
})
```

### 3. Optimistic Updates

```typescript
const { mutate } = userHooks.useUpdate()

mutate(updateData, {
  onMutate: async (input) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ 
      queryKey: userHooks.keys.findById({ id: input.id }) 
    })
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(
      userHooks.keys.findById({ id: input.id })
    )
    
    // Optimistically update
    queryClient.setQueryData(
      userHooks.keys.findById({ id: input.id }),
      (old) => ({ ...old, ...input })
    )
    
    return { previous }
  },
  
  onError: (err, input, context) => {
    // Rollback on error
    queryClient.setQueryData(
      userHooks.keys.findById({ id: input.id }),
      context.previous
    )
  },
})
```

### 4. Custom Key Factories

```typescript
// Advanced: User-defined key factories
userHooks.keys.byRole = (role: string) => {
  return ['user', 'list', { filter: { role } }] as const
}

// Usage
const adminUsers = userHooks.keys.byRole('admin')
```

---

## Open Questions

1. **Should we auto-generate convenience keys?**
   - Example: `keys.detail(id)` as shorthand for `keys.findById({ id })`
   - Pro: More ergonomic
   - Con: More API surface

2. **How to handle nested/complex inputs?**
   - Example: `keys.list({ filter: { nested: { deep: true } } })`
   - Should we normalize/hash complex objects?

3. **Should keys be functions or objects?**
   - Functions: `keys.list()` (current proposal)
   - Objects: `keys.list` (simpler, but less flexible)

4. **How to version query keys?**
   - Should keys include version info for breaking changes?
   - Example: `['user', 'v2', 'list']`

---

## Success Metrics

- ✅ All hook files export `keys` objects
- ✅ Zero string-based invalidations in codebase
- ✅ Type errors for mismatched query key inputs
- ✅ Documentation examples using query keys
- ✅ Tests covering key generation and usage
- ✅ No manual query key construction in app code

---

## Next Steps

1. **Review & Approve Design** ⏳
2. Implement Phase 1: Generate keys in ORPC hooks
3. Implement Phase 2: Update defineInvalidations signature
4. Implement Phase 3: Update custom hooks (useAuth, useAdmin, etc.)
5. Implement Phase 4: Update mergeHooks
6. Write tests for query key generation
7. Update documentation and examples
8. Migrate existing code to new pattern
9. Remove old string-based invalidation support

---

## Related Documents

- `.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md` - Hook pattern documentation
- `packages/utils/orpc/src/hooks/generate-hooks.ts` - Implementation file
- `apps/web/src/hooks/useAuth.ts` - Example custom hooks
