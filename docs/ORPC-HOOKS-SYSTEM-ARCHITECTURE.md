# ORPC Hooks System Architecture

> **Note (current repo reality):** this document is a detailed architectural reference and may include design-level context. For canonical current imports/paths and day-to-day implementation docs, see:
> - [`.docs/reference/CANONICAL-PATHS-AND-IMPORTS.md`](../.docs/reference/CANONICAL-PATHS-AND-IMPORTS.md)
> - [`.docs/features/ORPC-TYPE-CONTRACTS.md`](../.docs/features/ORPC-TYPE-CONTRACTS.md)
> - [`.docs/examples/API-USAGE-EXAMPLES.md`](../.docs/examples/API-USAGE-EXAMPLES.md)
> - [`.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md`](../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md)

> **Document Type**: Master Architectural Reference  
> **Package**: `@repo/orpc-utils/hooks`  
> **Last Updated**: 2025-01-XX  
> **Priority**: 🔴 CRITICAL - Core Infrastructure

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Prerequisites](#3-prerequisites)
4. [Contract Requirements](#4-contract-requirements)
5. [Type-Level Discrimination Pattern](#5-type-level-discrimination-pattern)
6. [Hook Generation Pipeline](#6-hook-generation-pipeline)
7. [Operation Type Detection](#7-operation-type-detection)
8. [Generated Hook Types](#8-generated-hook-types)
9. [Invalidation System](#9-invalidation-system)
10. [Query Key Registry](#10-query-key-registry)
11. [Custom Hooks Integration](#11-custom-hooks-integration)
12. [Composite Hooks](#12-composite-hooks)
13. [mergeHooks Pattern](#13-mergehooks-pattern)
14. [Complete Usage Example](#14-complete-usage-example)
15. [Type Safety Guarantees](#15-type-safety-guarantees)
16. [Best Practices](#16-best-practices)
17. [Migration Guide](#17-migration-guide)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. System Overview

### What Is This System?

The ORPC Hooks System is a **type-safe hook generation framework** that automatically creates TanStack Query hooks from ORPC contracts. It eliminates manual hook creation boilerplate while providing:

- **Full type inference** from ORPC contracts to React components
- **Automatic invalidation** with declarative configuration
- **Query key management** with exported registries
- **Streaming support** for EventIterator-based contracts
- **Composite patterns** for common UI requirements (pagination, forms, CRUD)
- **Custom hook integration** for non-ORPC operations (like Better Auth)

### Core Philosophy

The system follows these principles:

1. **Contracts are the source of truth** - Hook types are inferred from ORPC contracts
2. **No manual type annotations** - Everything flows from the contract definition
3. **Declarative invalidation** - Define relationships once, apply automatically
4. **Separation of concerns** - Generation, composition, and custom hooks are modular
5. **Type-level safety** - Invalid operations are caught at compile time

### Package Structure

```
packages/utils/orpc/src/
├── hooks/
│   ├── generate-hooks.ts      # Core hook generation (~1200 lines)
│   ├── composite-hooks.ts     # Higher-level patterns (~260 lines)
│   ├── merge-hooks.ts         # Hook combination utilities (~100 lines)
│   └── index.ts               # Public exports
├── builder/
│   ├── route-builder.ts       # Contract builder with fluent API
│   ├── mount-method.ts        # RouteBuilder discriminator (~160 lines)
│   └── types.ts               # Shared types
└── index.ts                   # Package root exports
```

---

## 2. Architecture Diagram

```
                                   ORPC HOOKS SYSTEM ARCHITECTURE
  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                                 │
  │  ┌─────────────────────┐                    ┌─────────────────────┐                            │
  │  │   ORPC CONTRACTS    │                    │   CUSTOM HOOKS      │                            │
  │  │   (RouteBuilder)    │                    │   (defineCustomHooks)│                           │
  │  │                     │                    │                     │                            │
  │  │  userContract = {   │                    │  authHooks = {      │                            │
  │  │    list: rb.get()   │                    │    useSignIn: ...   │                            │
  │  │    create: rb.post()│                    │    useSignOut: ...  │                            │
  │  │    ...              │                    │  }                  │                            │
  │  │  }                  │                    │                     │                            │
  │  └─────────┬───────────┘                    └──────────┬──────────┘                            │
  │            │                                           │                                        │
  │            │ RouteBuilder                              │ defineCustomHooks()                    │
  │            │ Metadata                                  │                                        │
  │            ▼                                           │                                        │
  │  ┌─────────────────────┐                              │                                        │
  │  │   TYPE-LEVEL        │                              │                                        │
  │  │   DISCRIMINATION    │                              │                                        │
  │  │                     │                              │                                        │
  │  │  TContract = raw    │◄─ Has ~orpc metadata         │                                        │
  │  │  TRouter = utils    │◄─ Has runtime methods        │                                        │
  │  │                     │                              │                                        │
  │  └─────────┬───────────┘                              │                                        │
  │            │                                           │                                        │
  │            ▼                                           ▼                                        │
  │  ┌─────────────────────────────────────────────────────────────────┐                           │
  │  │                    defineInvalidations()                         │                           │
  │  │                                                                  │                           │
  │  │  {                                                               │                           │
  │  │    contract: appContract.user,   // For ORPC procedure names    │                           │
  │  │    custom: authHooks,            // For custom hook names       │                           │
  │  │  },                                                              │                           │
  │  │  {                                                               │                           │
  │  │    create: ['list', 'count'],                 // List form      │                           │
  │  │    update: (input) => ({ list: {}, findById: { id: input.id }}),│   // Resolver form       │
  │  │    useSignIn: () => [SESSION_KEY],            // Custom hook    │                           │
  │  │  }                                                               │                           │
  │  │                                                                  │                           │
  │  └─────────────────────────┬────────────────────────────────────────┘                           │
  │                            │                                                                     │
  │                            │ InvalidationConfig                                                  │
  │                            ▼                                                                     │
  │  ┌─────────────────────────────────────────────────────────────────┐                           │
  │  │                    createRouterHooks()                           │                           │
  │  │                                                                  │                           │
  │  │  Input:                                                          │                           │
  │  │    - router: typeof orpc.user (TanStack utils)                  │                           │
  │  │    - TContract: typeof appContract.user (for type discrimination)│                          │
  │  │    - invalidations: InvalidationConfig                           │                           │
  │  │    - useQueryClient: () => QueryClient                          │                           │
  │  │                                                                  │                           │
  │  │  Process:                                                        │                           │
  │  │    1. Iterate contract procedures                                │                           │
  │  │    2. detectOperationType() for each                             │                           │
  │  │    3. Create appropriate hook (query/mutation/streaming)         │                           │
  │  │    4. Attach invalidation logic to mutations                     │                           │
  │  │    5. Generate queryKeys registry                                │                           │
  │  │                                                                  │                           │
  │  └─────────────────────────┬────────────────────────────────────────┘                           │
  │                            │                                                                     │
  │                            │ RouterHooks<TContract, TRouter>                                     │
  │                            ▼                                                                     │
  │  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐│
  │  │                                 OUTPUT                                                       ││
  │  │                                                                                              ││
  │  │  ┌───────────────────────┐ ┌────────────────────────┐ ┌─────────────────────────────────┐  ││
  │  │  │    QUERY HOOKS        │ │   MUTATION HOOKS       │ │     STREAMING HOOKS             │  ││
  │  │  │                       │ │                        │ │                                 │  ││
  │  │  │  useList()            │ │  useCreate()           │ │  useLiveNotifications()         │  ││
  │  │  │  useFindById()        │ │  useUpdate()           │ │  useStreamedProgress()          │  ││
  │  │  │  useCount()           │ │  useDelete()           │ │                                 │  ││
  │  │  │                       │ │                        │ │  (EventIterator output)         │  ││
  │  │  │  (GET methods)        │ │  (POST/PUT/DELETE)     │ │                                 │  ││
  │  │  └───────────────────────┘ └────────────────────────┘ └─────────────────────────────────┘  ││
  │  │                                                                                              ││
  │  │  ┌────────────────────────────────────────────────────────────────────────────────────────┐ ││
  │  │  │                             QUERY KEYS REGISTRY                                         │ ││
  │  │  │                                                                                         │ ││
  │  │  │  queryKeys = {                                                                          │ ││
  │  │  │    all: ['user'] as const,                                                              │ ││
  │  │  │    list: (input?) => ['user', 'list', input],                                          │ ││
  │  │  │    findById: (input) => ['user', 'findById', input],                                   │ ││
  │  │  │    count: (input?) => ['user', 'count', input],                                        │ ││
  │  │  │  }                                                                                      │ ││
  │  │  └────────────────────────────────────────────────────────────────────────────────────────┘ ││
  │  └─────────────────────────────────────────────────────────────────────────────────────────────┘│
  │                                                                                                 │
  └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Prerequisites

### Required Dependencies

```json
{
  "@orpc/client": "^0.x.x",
  "@orpc/contract": "^0.x.x",
  "@tanstack/react-query": "^5.x.x",
  "zod": "^3.x.x or zod/v4"
}
```

### ORPC Client Setup

Before using hooks, you need to set up the ORPC client with TanStack Query utilities:

```typescript
// apps/web/src/lib/orpc/index.ts

import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createORPCClient } from "@orpc/client";
import { appContract } from "@repo/api-contracts";

// Create the ORPC client
function createORPCClientWithCookies() {
  return createORPCClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    // ... other options
  });
}

// Create TanStack Query utilities
const client = createORPCClientWithCookies();
export const orpc = createTanstackQueryUtils(appContract, client);

// IMPORTANT: Also export the raw contract for type-level discrimination
export { appContract };
```

### Why Export Both `orpc` and `appContract`?

This is **critical** for the type-level discrimination pattern:

| Export | Purpose | Has ~orpc Metadata? |
|--------|---------|---------------------|
| `orpc` | Runtime TanStack Query utilities | ❌ No |
| `appContract` | Type-level contract definition | ✅ Yes |

The `~orpc` metadata is needed to distinguish between query and mutation procedures at the type level.

---

## 4. Contract Requirements

### RouteBuilder Metadata Discriminator

**Not all ORPC contracts can generate hooks.** Only contracts created with `RouteBuilder` have the necessary metadata for hook generation.

#### The Discriminator Key

```typescript
// packages/utils/orpc/src/builder/mount-method.ts

export const ROUTE_METHOD_META_KEY = "__orpc_route_builder_method__" as const;
```

This key is embedded in contracts created via `RouteBuilder.build()`:

```typescript
// Inside RouteBuilder.build():
return withRouteMethod(this._method, oc)
  .route(this.routeMetadata)
  .input(finalInput)
  .output(finalOutput);
```

#### Contracts That Generate Hooks ✅

```typescript
import { RouteBuilder } from "@repo/orpc-utils";

// ✅ Using RouteBuilder
export const userListContract = new RouteBuilder()
  .method("GET")
  .path("/users")
  .input(inputSchema)
  .output(outputSchema)
  .build();

// ✅ Using standard.zod() helper (wraps RouteBuilder)
import { standard } from "@repo/orpc-utils";

const userOps = standard.zod(userSchema, "user");
export const userListContract = userOps.list(queryConfig).build();
```

#### Contracts That DON'T Generate Hooks ❌

```typescript
import { oc } from "@orpc/contract";

// ❌ Hand-made contracts - no RouteBuilder metadata
export const myContract = oc
  .route({ method: "GET", path: "/manual" })
  .input(inputSchema)
  .output(outputSchema);
```

### Detection at Runtime

```typescript
// packages/utils/orpc/src/builder/mount-method.ts

export function hasRouteMethodMeta(contract: unknown): boolean {
  return (
    typeof contract === "object" &&
    contract !== null &&
    ROUTE_METHOD_META_KEY in contract
  );
}

export function getRouteMethod(contract: object): string | undefined {
  if (hasRouteMethodMeta(contract)) {
    return (contract as Record<string, unknown>)[ROUTE_METHOD_META_KEY] as string;
  }
  return undefined;
}
```

When a contract doesn't have RouteBuilder metadata, `detectOperationType()` returns `'unsupported'` and no hook is generated.

---

## 5. Type-Level Discrimination Pattern

### The Problem

TanStack Query utilities (`orpc`) are great for runtime, but they **lose the `~orpc` metadata** needed to distinguish between query and mutation procedures at the type level.

```typescript
// ❌ This doesn't work - can't determine if 'create' is a query or mutation at type level
const hooks = createRouterHooks(orpc.user, options);
```

### The Solution: Two Generic Parameters

```typescript
// ✅ Pass both the raw contract AND the TanStack utils
const hooks = createRouterHooks<
  typeof appContract.user,  // TContract - has ~orpc metadata
  typeof orpc.user          // TRouter - has runtime methods
>(orpc.user, options);
```

### How It Works

The `createRouterHooks` function uses conditional types to inspect `TContract`:

```typescript
// packages/utils/orpc/src/hooks/generate-hooks.ts

// Detect if a procedure is a GET method (query)
type IsGetMethod<T> = T extends {
  "~orpc": { route: infer R };
} ? (R extends { method: "GET" } ? true : false) : false;

// Detect if a procedure is a non-GET method (mutation)
type IsNonGetMethod<T> = T extends {
  "~orpc": { route: infer R };
} ? (R extends { method: "POST" | "PUT" | "DELETE" | "PATCH" } ? true : false) : false;

// Extract query procedure names
type QueryProcedureNames<T> = {
  [K in keyof T]: IsGetMethod<T[K]> extends true ? K : never;
}[keyof T] & string;

// Extract mutation procedure names
type MutationProcedureNames<T> = {
  [K in keyof T]: IsNonGetMethod<T[K]> extends true ? K : never;
}[keyof T] & string;
```

### Example Type-Level Discrimination

Given this contract:

```typescript
const userContract = oc.router({
  list: rb.method("GET").path("/users").build(),      // Query
  findById: rb.method("GET").path("/users/{id}").build(), // Query
  create: rb.method("POST").path("/users").build(),   // Mutation
  update: rb.method("PUT").path("/users/{id}").build(), // Mutation
  delete: rb.method("DELETE").path("/users/{id}").build(), // Mutation
});
```

The type system extracts:

```typescript
type Queries = QueryProcedureNames<typeof userContract>;
// = "list" | "findById"

type Mutations = MutationProcedureNames<typeof userContract>;
// = "create" | "update" | "delete"
```

This information flows through to:
- Hook return types
- Invalidation config type checking
- Query key registry types

---

## 6. Hook Generation Pipeline

### Overview

The hook generation process follows these steps:

```
Contract → Detection → Hook Factory → Hook Instance
```

### Step 1: Iterate Contract Procedures

```typescript
// packages/utils/orpc/src/hooks/generate-hooks.ts

export function createRouterHooks<TContract, TRouter>(
  router: TRouter,
  options: RouterHooksOptions<TContract, TRouter, unknown>
): RouterHooks<TContract, TRouter> {
  const hooks: Record<string, unknown> = {};
  const queryKeysRegistry: Record<string, unknown> = {};

  // Iterate all procedures in the router
  for (const [procedureName, procedure] of Object.entries(router as object)) {
    // Step 2: Detect operation type
    const opType = detectOperationType(procedure, procedureName);
    
    // Step 3: Create appropriate hook
    switch (opType) {
      case 'query':
        hooks[`use${capitalize(procedureName)}`] = createQueryHook(/* ... */);
        break;
      case 'mutation':
        hooks[`use${capitalize(procedureName)}`] = createMutationHook(/* ... */);
        break;
      case 'streaming':
        hooks[`useLive${capitalize(procedureName)}`] = createLiveQueryHook(/* ... */);
        hooks[`useStreamed${capitalize(procedureName)}`] = createStreamedQueryHook(/* ... */);
        break;
      case 'unsupported':
        // Skip - no RouteBuilder metadata
        break;
    }
    
    // Step 4: Generate query key
    queryKeysRegistry[procedureName] = (input?: unknown) => 
      [routerName, procedureName, ...(input ? [input] : [])];
  }

  return {
    ...hooks,
    queryKeys: {
      all: [routerName],
      ...queryKeysRegistry,
    },
  } as RouterHooks<TContract, TRouter>;
}
```

### Step 2: Detection Logic

```typescript
function detectOperationType(
  procedure: unknown,
  procedureName: string
): 'query' | 'mutation' | 'streaming' | 'unsupported' {
  // Check for RouteBuilder metadata
  if (!hasRouteMethodMeta(procedure)) {
    return 'unsupported';
  }

  const method = getRouteMethod(procedure as object);
  
  // Check for EventIterator output (streaming)
  if (hasEventIteratorOutput(procedure)) {
    return 'streaming';
  }

  // Determine by HTTP method
  if (method === 'GET') {
    return 'query';
  }
  
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method ?? '')) {
    return 'mutation';
  }

  return 'unsupported';
}
```

### Step 3: Hook Factory Functions

```typescript
// Query hook factory
function createQueryHook(
  procedure: unknown,
  procedureName: string,
  routerName: string,
  options: QueryHookOptions
) {
  return function useGeneratedQuery(
    input?: unknown,
    queryOptions?: Partial<UseQueryOptions>
  ) {
    const queryKey = [routerName, procedureName, ...(input ? [input] : [])];
    
    return useQuery({
      queryKey,
      queryFn: () => (procedure as any).call(input),
      ...queryOptions,
    });
  };
}

// Mutation hook factory
function createMutationHook(
  procedure: unknown,
  procedureName: string,
  routerName: string,
  invalidations: InvalidationConfig,
  useQueryClient: () => QueryClient
) {
  return function useGeneratedMutation(
    mutationOptions?: Partial<UseMutationOptions>
  ) {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (input: unknown) => (procedure as any).call(input),
      onSuccess: async (data, input, context) => {
        // Apply invalidations
        await applyInvalidations(
          queryClient,
          procedureName,
          invalidations,
          { input, output: data, context }
        );
        
        // Call user's onSuccess if provided
        mutationOptions?.onSuccess?.(data, input, context);
      },
      ...mutationOptions,
    });
  };
}
```

---

## 7. Operation Type Detection

### Decision Tree

```
Is this a procedure?
├── NO → Skip
└── YES → Has ROUTE_METHOD_META_KEY?
    ├── NO → Return 'unsupported'
    └── YES → Has EventIterator output?
        ├── YES → Return 'streaming'
        └── NO → What's the HTTP method?
            ├── GET → Return 'query'
            ├── POST/PUT/DELETE/PATCH → Return 'mutation'
            └── Other → Return 'unsupported'
```

### EventIterator Detection

Streaming endpoints use ORPC's `eventIterator()` wrapper:

```typescript
// In contract:
import { eventIterator } from "@orpc/contract";

export const notificationsContract = new RouteBuilder()
  .method("GET")
  .path("/notifications/stream")
  .output(notificationSchema)
  .wrapOutput(eventIterator)  // ← This marks it as streaming
  .build();
```

Detection at runtime:

```typescript
function hasEventIteratorOutput(procedure: unknown): boolean {
  // Check for EventIterator type marker in output schema
  const output = (procedure as any)["~orpc"]?.output;
  return output?.["~standard"]?.vendor === "orpc/event-iterator";
}
```

### Method-to-Hook Mapping

| HTTP Method | Hook Type | Use Case |
|-------------|-----------|----------|
| `GET` | Query | Reading data |
| `POST` | Mutation | Creating resources |
| `PUT` | Mutation | Full update |
| `PATCH` | Mutation | Partial update |
| `DELETE` | Mutation | Removing resources |
| `GET` + EventIterator | Streaming | Real-time updates |

---

## 8. Generated Hook Types

### Query Hooks

Generated for `GET` methods without EventIterator:

```typescript
// Generated hook signature
function useList(
  input?: UserListInput,
  options?: UseQueryOptions<UserListOutput, Error>
): UseQueryResult<UserListOutput, Error>;

// Usage
const { data, isLoading, error } = userHooks.useList({
  pagination: { limit: 10 },
});
```

### Mutation Hooks

Generated for `POST`, `PUT`, `DELETE`, `PATCH` methods:

```typescript
// Generated hook signature
function useCreate(
  options?: UseMutationOptions<UserCreateOutput, Error, UserCreateInput>
): UseMutationResult<UserCreateOutput, Error, UserCreateInput>;

// Usage
const { mutate, isPending } = userHooks.useCreate();
mutate({ name: "John", email: "john@example.com" });
```

### Streaming Hooks

Generated for methods with EventIterator output. **Two variants are created**:

#### `useLive*` - Continuous Updates

Maintains an open connection and updates state on each event:

```typescript
// Generated hook
function useLiveNotifications(
  input?: NotificationInput,
  options?: UseLiveQueryOptions<NotificationOutput>
): UseLiveQueryResult<NotificationOutput>;

// Usage - state updates on each SSE event
const { data, isConnected, error } = notificationHooks.useLiveNotifications();
```

#### `useStreamed*` - Accumulated Results

Collects all events into an array:

```typescript
// Generated hook
function useStreamedProgress(
  input?: ProgressInput,
  options?: UseStreamedQueryOptions<ProgressOutput>
): UseStreamedQueryResult<ProgressOutput[]>;

// Usage - data is array of all received events
const { data: events, isStreaming } = progressHooks.useStreamedProgress();
```

### Hook Naming Convention

| Operation | Hook Name Pattern | Example |
|-----------|-------------------|---------|
| Query | `use{ProcedureName}` | `useList`, `useFindById` |
| Mutation | `use{ProcedureName}` | `useCreate`, `useUpdate` |
| Live Streaming | `useLive{ProcedureName}` | `useLiveNotifications` |
| Streamed | `useStreamed{ProcedureName}` | `useStreamedProgress` |

---

## 9. Invalidation System

### The Problem with Manual Invalidation

Without a centralized system, invalidation logic is scattered:

```typescript
// ❌ Manual - scattered and error-prone
const useCreate = () => useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'count'] });
    // Easy to forget queries...
  },
});
```

### The Solution: `defineInvalidations()`

Centralize invalidation logic in one place. The function returns **a list of query keys** to invalidate.

```typescript
import { defineInvalidations } from "@repo/orpc-utils/hooks";

const invalidations = defineInvalidations({
  contract: appContract.user,
  custom: authHooks,  // Optional - for custom hooks
}, {
  // List form - invalidate these query names after mutation
  create: ['list', 'count'],
  delete: ['list', 'count'],
  
  // Resolver form - dynamic invalidation based on input/output
  update: (input, output, context) => ({
    list: undefined,  // Invalidate all 'list' queries
    findById: { id: input.id },  // Invalidate specific findById query
  }),
  
  // Custom hook invalidation - RETURNS A LIST OF QUERY KEYS
  useSignIn: () => [SESSION_QUERY_KEY],
});
```

### 🔴 CRITICAL: Return Value Format

**`defineInvalidations` functions must return a LIST of query keys:**

```typescript
type QueryKey = readonly unknown[]  // e.g., ['users', id] or ['session']

// Return type is: QueryKey[] — an array of query keys
// Example: [['users', id], ['session']]
```

**Real examples:**

```typescript
const invalidations = defineInvalidations({
  contract: appContract.user,
  custom: authHooks,
}, {
  // After creating a user, invalidate users list and count
  useCreateUser: ({ input }) => [
    ['users', 'list'],           // First query key to invalidate
    ['users', 'count'],          // Second query key to invalidate
  ],
  
  // After updating a user, invalidate that specific user AND the list
  useUpdateUser: ({ input }) => [
    ['users', input.id],         // Invalidate specific user by ID
    ['users', 'list'],           // Invalidate users list
  ],
  
  // After sign in, invalidate session
  useSignIn: () => [
    ['session'],                 // Just one query key, but still in a list
  ],
  
  // After sign out, invalidate multiple things
  useSignOut: () => [
    ['session'],                 // Invalidate session
    ['users', 'me'],             // Invalidate current user
    ['permissions'],             // Invalidate permissions
  ],
});
```

### Understanding the Double Array `[[...]]`

```typescript
// A single query key identifies ONE query in the cache:
['users', 'list']              // Query key for user list
['users', '123']               // Query key for user with ID 123
['session']                    // Query key for session

// defineInvalidations returns a LIST of these query keys:
[                              // ← Outer array: the LIST
  ['users', 'list'],           // ← Inner array: first query key
  ['users', '123'],            // ← Inner array: second query key
]

// So when you invalidate after a mutation:
useDeleteUser: ({ input }) => [
  ['users', input.id],         // Invalidate deleted user
  ['users', 'list'],           // Invalidate list (user count changed)
  ['users', 'count'],          // Invalidate count
]
// Returns: [['users', '123'], ['users', 'list'], ['users', 'count']]
```

### Common Mistakes

```typescript
// ❌ WRONG - This is a single query key, not a list of query keys
useSignIn: () => ['session']

// ✅ CORRECT - This is a list containing one query key
useSignIn: () => [['session']]


// ❌ WRONG - This is ONE query key with 3 parts, not 3 query keys
useSignOut: () => ['session', 'users', 'permissions']

// ✅ CORRECT - This is THREE separate query keys
useSignOut: () => [['session'], ['users'], ['permissions']]


// ❌ WRONG - Mixing formats
useUpdate: ({ input }) => ['users', input.id]

// ✅ CORRECT - Return a list, even for one query key
useUpdate: ({ input }) => [['users', input.id]]
```

### Invalidation Config Types

```typescript
// packages/utils/orpc/src/hooks/generate-hooks.ts

// The unified invalidation config type
export type InvalidationConfig<
  TContract,
  TRouter,
  TCustom extends Record<string, () => ReturnType<typeof useMutation>>
> = 
  // ORPC mutation invalidations
  & {
    [K in MutationProcedureNames<TContract>]?: 
      | QueryProcedureNames<TContract>[]  // List form
      | InvalidationResolver<TContract, TRouter, K>;  // Resolver form
  }
  // Custom hook invalidations  
  & {
    [K in keyof TCustom]?: () => QueryKey[];  // Returns LIST of query keys
  };

// Resolver function type - MUST return QueryKey[] (array of arrays)
type InvalidationResolver<TContract, TRouter, K> = (
  input: InferMutationInput<TRouter, K>,
  output: InferMutationOutput<TRouter, K>,
  context: { queryClient: QueryClient }
) => QueryKey[];  // ← Returns a LIST of query keys
```

### List Form vs Resolver Form vs Custom Hook Form

#### List Form (ORPC Mutations Only)

Simple array of **query procedure names** to invalidate:

```typescript
{
  create: ['list', 'count'],           // Strings = procedure names
  delete: ['list', 'count', 'findById'],
}
```

**Behavior**: Converts procedure names to query keys internally, then invalidates ALL queries with that name, regardless of input.

#### Resolver Form (ORPC Mutations)

Dynamic function returning **a list of query keys**:

```typescript
{
  update: (input, output, context) => [
    // Return a LIST of query keys to invalidate
    ['user', 'list'],                    // Invalidate all 'list' queries  
    ['user', 'findById', { id: input.id }], // Invalidate specific query
  ],
}
```

**Return Type**: `QueryKey[]` - An array of query key arrays.

#### Custom Hook Form

Function returning **a list of query keys**:

```typescript
{
  // Returns: [['session']] — a list with one query key
  useSignIn: () => [
    ['session'],
  ],
  
  // Returns: [['session'], ['users'], ['permissions']] — a list with three query keys
  useSignOut: () => [
    ['session'],
    ['users'],
    ['permissions'],
  ],
  
  // Dynamic based on input
  // If input.id = '42', returns: [['users', '42'], ['users', 'list']]
  useUpdateProfile: ({ input }) => [
    ['users', input.id],
    ['users', 'list'],
  ],
}
```

**Return Type**: `QueryKey[]` — An array where each element is a query key array.

### Visual Explanation of Return Format

```
defineInvalidations returns a LIST of query keys to invalidate.

┌─────────────────────────────────────────────────────────────────┐
│  useSignIn: () => [['session']]                                 │
│                                                                 │
│  Result: [['session']]                                          │
│          ▲                                                      │
│          └── List containing 1 query key                        │
│                                                                 │
│  TanStack Query will invalidate:                                │
│    • queryClient.invalidateQueries({ queryKey: ['session'] })   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  useDeleteUser: ({ input }) => [                                │
│    ['users', input.id],                                         │
│    ['users', 'list'],                                           │
│    ['users', 'count'],                                          │
│  ]                                                              │
│                                                                 │
│  If input.id = '42', result is:                                 │
│  [['users', '42'], ['users', 'list'], ['users', 'count']]      │
│   ▲                ▲                   ▲                        │
│   │                │                   └── 3rd query key        │
│   │                └── 2nd query key                            │
│   └── 1st query key                                             │
│                                                                 │
│  TanStack Query will invalidate:                                │
│    • queryClient.invalidateQueries({ queryKey: ['users', '42']})│
│    • queryClient.invalidateQueries({ queryKey: ['users', 'list']})│
│    • queryClient.invalidateQueries({ queryKey: ['users', 'count']})│
└─────────────────────────────────────────────────────────────────┘
```

### How Invalidation Is Applied

```typescript
// Inside generated mutation hook
onSuccess: async (data, input, context) => {
  const config = invalidations[procedureName];
  
  if (!config) return;
  
  if (Array.isArray(config)) {
    // List form
    for (const queryName of config) {
      await queryClient.invalidateQueries({
        queryKey: [routerName, queryName],
      });
    }
  } else if (typeof config === 'function') {
    // Resolver form
    const result = config(input, data, { queryClient });
    
    for (const [queryName, queryInput] of Object.entries(result)) {
      if (queryInput === undefined) {
        // Invalidate all
        await queryClient.invalidateQueries({
          queryKey: [routerName, queryName],
        });
      } else {
        // Invalidate specific
        await queryClient.invalidateQueries({
          queryKey: [routerName, queryName, queryInput],
        });
      }
    }
  }
};
```

---

## 10. Query Key Registry

### What Is the Query Key Registry?

Every generated hooks object includes a `queryKeys` object for external query key access:

```typescript
const userHooks = createRouterHooks<...>(orpc.user, options);

// Access query keys
userHooks.queryKeys.all;          // ['user']
userHooks.queryKeys.list;         // (input?) => ['user', 'list', input?]
userHooks.queryKeys.findById;     // (input) => ['user', 'findById', input]
userHooks.queryKeys.count;        // (input?) => ['user', 'count', input?]
```

### Query Key Structure

```typescript
// packages/utils/orpc/src/hooks/generate-hooks.ts

type QueryKeys<TContract, TRouter> = {
  // Base key - matches all queries for this router
  all: readonly [string];
  
  // Per-procedure keys
} & {
  [K in QueryProcedureNames<TContract>]: (
    input?: InferQueryInput<TRouter, K>
  ) => readonly [string, string, ...unknown[]];
};
```

### Use Cases

#### Manual Invalidation

```typescript
// Outside of the generated hooks system
const queryClient = useQueryClient();

// Invalidate all user queries
queryClient.invalidateQueries({
  queryKey: userHooks.queryKeys.all,
});

// Invalidate specific user list query
queryClient.invalidateQueries({
  queryKey: userHooks.queryKeys.list({ limit: 10 }),
});
```

#### Prefetching

```typescript
// Prefetch in server component
await queryClient.prefetchQuery({
  queryKey: userHooks.queryKeys.findById({ id: "123" }),
  queryFn: () => orpc.user.findById.call({ id: "123" }),
});
```

#### Cache Reading

```typescript
// Read from cache
const cachedUser = queryClient.getQueryData(
  userHooks.queryKeys.findById({ id: "123" })
);
```

#### Optimistic Updates

```typescript
// In mutation options
onMutate: async (newUser) => {
  await queryClient.cancelQueries({
    queryKey: userHooks.queryKeys.list(),
  });
  
  const previous = queryClient.getQueryData(
    userHooks.queryKeys.list()
  );
  
  queryClient.setQueryData(
    userHooks.queryKeys.list(),
    (old) => [...(old ?? []), newUser]
  );
  
  return { previous };
},
```

---

## 11. Custom Hooks Integration

### Why Custom Hooks?

Not everything comes from ORPC contracts. You may need hooks for:

- **Better Auth** - Authentication operations
- **External APIs** - Third-party services
- **Local storage** - Browser state
- **Complex composed logic** - Multi-step operations

### `defineCustomHooks()`

Type-safe custom hook definitions:

```typescript
// apps/web/src/hooks/useAuth.ts

import { defineCustomHooks } from "@repo/orpc-utils/hooks";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";

export const authHooks = defineCustomHooks({
  useSignInEmail: () => useMutation({
    mutationKey: ['auth', 'signInEmail'],
    mutationFn: async (input: { email: string; password: string }) => {
      return authClient.signIn.email(input);
    },
    // Note: NO onSuccess invalidation here
    // Invalidation is defined in the invalidations config
  }),
  
  useSignOut: () => useMutation({
    mutationKey: ['auth', 'signOut'],
    mutationFn: async () => {
      return authClient.signOut();
    },
  }),
  
  useSignUp: () => useMutation({
    mutationKey: ['auth', 'signUp'],
    mutationFn: async (input: SignUpInput) => {
      return authClient.signUp.email(input);
    },
  }),
});

export type AuthHooks = typeof authHooks;
```

### Unified Invalidation for Custom Hooks

Custom hooks can participate in the same invalidation system:

```typescript
// apps/web/src/hooks/useAuth.ts

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export const authInvalidations = defineInvalidations({
  custom: authHooks,
}, {
  // Custom hooks use function form for invalidation
  useSignInEmail: () => [SESSION_QUERY_KEY],
  useSignOut: () => ['*'],  // Special: invalidate everything
  useSignUp: () => [SESSION_QUERY_KEY],
});
```

### Why Not Just Use `onSuccess`?

Centralizing invalidation in the config provides:

1. **Single source of truth** - All invalidation rules in one place
2. **Consistency** - Same pattern for ORPC and custom hooks
3. **Maintainability** - Change relationships without editing hook implementations
4. **Visibility** - Easy to audit what invalidates what

---

## 12. Composite Hooks

### What Are Composite Hooks?

Higher-level hooks that combine base hooks for common UI patterns:

```typescript
// packages/utils/orpc/src/hooks/composite-hooks.ts

export function createCompositeHooks<
  TContract,
  TRouter,
  THooks extends RouterHooks<TContract, TRouter>
>(
  hooks: THooks,
  useQueryClient: () => QueryClient
): CompositeHooks<TContract, TRouter>;
```

### Available Composite Hooks

#### `useManagement()` - CRUD Operations

Combines create, update, delete with unified loading/error states:

```typescript
const { create, update, delete: remove, isLoading, errors } = 
  userComposite.useManagement();

// All operations in one object
create.mutate({ name: "John" });
update.mutate({ id: "1", name: "Jane" });
remove.mutate({ id: "1" });

// Unified loading state
if (isLoading.create || isLoading.update || isLoading.delete) {
  // Any operation in progress
}
```

#### `usePaginatedList()` - Page-Based Pagination

```typescript
const {
  data,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  goToNextPage,
  goToPreviousPage,
  isLoading,
} = userComposite.usePaginatedList({
  initialPage: 1,
  initialPageSize: 20,
  sortField: 'createdAt',
  sortDirection: 'desc',
});
```

#### `useInfiniteList()` - Infinite Scroll

```typescript
const {
  data,            // Flattened array of all items
  pages,           // Raw pages array
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  error,
} = userComposite.useInfiniteList({
  pageSize: 20,
});

// In scroll handler
if (hasNextPage && !isFetchingNextPage) {
  fetchNextPage();
}
```

#### `useFormData()` - Form Integration

Combines findById (for initial data) with update:

```typescript
const {
  data,             // Current entity data
  isLoading,        // Loading initial data
  update,           // Mutation to update
  isUpdating,       // Update in progress
  reset,            // Reset to initial data
  isDirty,          // Has changes
} = userComposite.useFormData({ id: userId });

// In form submission
update.mutate({ id: userId, ...formValues });
```

#### `useSelection()` - Bulk Operations

For managing selected items and bulk actions:

```typescript
const {
  selected,         // Set of selected IDs
  toggleSelect,     // Toggle single item
  selectAll,        // Select all visible items
  clearSelection,   // Clear all
  isSelected,       // Check if ID is selected
  selectionCount,   // Number selected
  bulkDelete,       // Delete all selected
  isBulkDeleting,   // Bulk operation in progress
} = userComposite.useSelection({
  allIds: data?.map(u => u.id) ?? [],
});

// In row
<Checkbox 
  checked={isSelected(user.id)} 
  onChange={() => toggleSelect(user.id)} 
/>

// In header
<Button onClick={selectAll}>Select All</Button>
<Button onClick={bulkDelete.mutate}>Delete Selected ({selectionCount})</Button>
```

### Composite Hooks Structure

```typescript
type CompositeHooks<TContract, TRouter> = {
  useManagement: () => ManagementResult;
  usePaginatedList: (options?: PaginatedListOptions) => PaginatedListResult;
  useInfiniteList: (options?: InfiniteListOptions) => InfiniteListResult;
  useFormData: (options: { id: string }) => FormDataResult;
  useSelection: (options: SelectionOptions) => SelectionResult;
};
```

---

## 13. mergeHooks Pattern

### Why Merge Hooks?

A complete hook file needs:
1. **Router hooks** - From `createRouterHooks()`
2. **Composite hooks** - From `createCompositeHooks()`
3. **Custom hooks** - From `defineCustomHooks()` (if any)

The `mergeHooks()` function combines these with conflict detection:

```typescript
// packages/utils/orpc/src/hooks/merge-hooks.ts

export function mergeHooks<
  TRouterHooks extends Record<string, unknown>,
  TCompositeHooks extends Record<string, unknown>,
  TCustomHooks extends Record<string, unknown>
>(
  routerHooks: TRouterHooks,
  compositeHooks: TCompositeHooks,
  customHooks?: TCustomHooks
): TRouterHooks & TCompositeHooks & TCustomHooks {
  // Detect naming conflicts
  const allKeys = new Set([
    ...Object.keys(routerHooks),
    ...Object.keys(compositeHooks),
    ...(customHooks ? Object.keys(customHooks) : []),
  ]);
  
  for (const key of allKeys) {
    const sources = [
      key in routerHooks && 'routerHooks',
      key in compositeHooks && 'compositeHooks',
      customHooks && key in customHooks && 'customHooks',
    ].filter(Boolean);
    
    if (sources.length > 1) {
      console.warn(
        `Hook name collision: "${key}" exists in ${sources.join(' and ')}`
      );
    }
  }
  
  return {
    ...routerHooks,
    ...compositeHooks,
    ...customHooks,
  };
}
```

### Usage Pattern

```typescript
// apps/web/src/hooks/useUser.orpc-hooks.ts

import { createRouterHooks, createCompositeHooks, mergeHooks } from "@repo/orpc-utils/hooks";

// Step 1: Define invalidations
const invalidations = defineInvalidations({ contract: appContract.user }, {
  create: ['list', 'count'],
  update: (input) => ({ list: undefined, findById: { id: input.id } }),
  delete: ['list', 'count'],
});

// Step 2: Create router hooks
const routerHooks = createRouterHooks<typeof appContract.user, typeof orpc.user>(
  orpc.user,
  { invalidations, useQueryClient }
);

// Step 3: Create composite hooks
const compositeHooks = createCompositeHooks(routerHooks, useQueryClient);

// Step 4: Merge everything
export const userHooks = mergeHooks(routerHooks, compositeHooks);

// Access everything from one object
userHooks.useList();        // Router hook
userHooks.useCreate();      // Router hook
userHooks.useManagement();  // Composite hook
userHooks.queryKeys.list(); // Query keys
```

---

## 14. Complete Usage Example

### Full Hook File

```typescript
// apps/web/src/hooks/useUser.orpc-hooks.ts

import { useQueryClient } from "@tanstack/react-query";
import { 
  createRouterHooks, 
  createCompositeHooks, 
  defineInvalidations,
  mergeHooks,
} from "@repo/orpc-utils/hooks";
import { orpc, appContract } from "@/lib/orpc";
import type { UserListInput, UserCreateInput } from "@repo/api-contracts";

// ============================================================================
// 1. INVALIDATION CONFIGURATION
// ============================================================================

const invalidations = defineInvalidations(
  { contract: appContract.user },
  {
    // Create: Invalidate list and count
    create: ['list', 'count'],
    
    // Update: Invalidate list (all) and specific findById
    update: (input, output) => ({
      list: undefined,
      findById: { id: input.id },
    }),
    
    // Delete: Invalidate everything related
    delete: ['list', 'count', 'findById'],
    
    // CheckEmail: No invalidation needed (query-like mutation)
  }
);

// ============================================================================
// 2. HOOK GENERATION
// ============================================================================

// Generate base router hooks
const routerHooks = createRouterHooks<
  typeof appContract.user,
  typeof orpc.user
>(orpc.user, {
  invalidations,
  useQueryClient,
});

// Generate composite hooks
const compositeHooks = createCompositeHooks(routerHooks, useQueryClient);

// Merge all hooks
const mergedHooks = mergeHooks(routerHooks, compositeHooks);

// ============================================================================
// 3. WRAPPER FUNCTIONS (Optional but recommended)
// ============================================================================

/**
 * Hook for fetching paginated user list
 */
export function useUsers(input?: UserListInput) {
  return mergedHooks.useList(input);
}

/**
 * Hook for fetching single user by ID
 */
export function useUser(id: string) {
  return mergedHooks.useFindById({ id });
}

/**
 * Hook for creating a new user
 */
export function useCreateUser() {
  return mergedHooks.useCreate();
}

/**
 * Hook for updating a user
 */
export function useUpdateUser() {
  return mergedHooks.useUpdate();
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser() {
  return mergedHooks.useDelete();
}

/**
 * Hook for user count
 */
export function useUserCount() {
  return mergedHooks.useCount();
}

/**
 * Hook for checking if email exists
 */
export function useCheckEmail() {
  return mergedHooks.useCheckEmail();
}

// Composite hook wrappers
export function useUserManagement() {
  return mergedHooks.useManagement();
}

export function useUserPaginatedList(options?: Parameters<typeof mergedHooks.usePaginatedList>[0]) {
  return mergedHooks.usePaginatedList(options);
}

export function useUserInfiniteList(options?: Parameters<typeof mergedHooks.useInfiniteList>[0]) {
  return mergedHooks.useInfiniteList(options);
}

// ============================================================================
// 4. EXPORTS
// ============================================================================

// Export everything
export const userHooks = mergedHooks;
export const userComposite = compositeHooks;
export const userQueryKeys = routerHooks.queryKeys;

// Type exports
export type UserHooks = typeof mergedHooks;
export type UserQueryKeys = typeof routerHooks.queryKeys;
```

### Using the Hooks

```tsx
// components/UserList.tsx
"use client";

import { useUsers, useDeleteUser, userQueryKeys } from "@/hooks/useUser.orpc-hooks";
import { useQueryClient } from "@tanstack/react-query";

export function UserList() {
  const queryClient = useQueryClient();
  
  // Fetch users with pagination
  const { data, isLoading, error } = useUsers({
    pagination: { limit: 10, offset: 0 },
    sorting: { field: 'createdAt', direction: 'desc' },
  });
  
  // Delete mutation
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  
  // Manual cache prefetch
  const prefetchUser = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: userQueryKeys.findById({ id }),
      queryFn: () => orpc.user.findById.call({ id }),
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data?.items.map((user) => (
        <li 
          key={user.id}
          onMouseEnter={() => prefetchUser(user.id)}
        >
          {user.name}
          <button
            onClick={() => deleteUser({ id: user.id })}
            disabled={isDeleting}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// components/UserForm.tsx
"use client";

import { useCreateUser, useUpdateUser } from "@/hooks/useUser.orpc-hooks";
import { useState } from "react";

interface UserFormProps {
  userId?: string;
  initialData?: { name: string; email: string };
}

export function UserForm({ userId, initialData }: UserFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userId) {
      updateUser({ id: userId, name, email });
    } else {
      createUser({ name, email });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
      />
      <button 
        type="submit" 
        disabled={isCreating || isUpdating}
      >
        {userId ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
```

---

## 15. Type Safety Guarantees

### What's Type-Safe?

| Feature | Type-Safe? | How? |
|---------|------------|------|
| Hook input types | ✅ | Inferred from contract input schemas |
| Hook output types | ✅ | Inferred from contract output schemas |
| Invalidation config keys | ✅ | Only mutation names allowed |
| Invalidation target keys | ✅ | Only query names allowed |
| Query key registry | ✅ | Typed per procedure |
| Custom hook types | ✅ | Inferred from defineCustomHooks |

### Type Inference Examples

```typescript
// Contract defines the types
const userListContract = rb
  .method("GET")
  .input(z.object({ 
    limit: z.number().default(10),
    offset: z.number().default(0),
  }))
  .output(z.object({
    items: z.array(userSchema),
    total: z.number(),
  }))
  .build();

// Hook automatically infers types
const { data, isLoading } = userHooks.useList({ limit: 20 });
//      ^-- { items: User[]; total: number } | undefined

// TypeScript catches errors
userHooks.useList({ invalid: "param" }); // ❌ Type error

// Invalidation config is type-checked
defineInvalidations({ contract }, {
  create: ['list'],      // ✅ 'list' is a query name
  create: ['invalid'],   // ❌ Type error - not a query name
  useList: ['list'],     // ❌ Type error - useList is a query, not mutation
});
```

### Type-Level Contract Discrimination

The two-generic pattern ensures correct type discrimination:

```typescript
// ✅ Correct - TContract has ~orpc metadata
createRouterHooks<typeof appContract.user, typeof orpc.user>(orpc.user, opts);

// ❌ Incorrect - orpc.user doesn't have ~orpc metadata
createRouterHooks<typeof orpc.user, typeof orpc.user>(orpc.user, opts);
// This would make all procedures appear as neither query nor mutation
```

---

## 16. Best Practices

### DO ✅

1. **Always export queryKeys**
   ```typescript
   export const userQueryKeys = userHooks.queryKeys;
   ```

2. **Use wrapper functions for discoverability**
   ```typescript
   export function useUsers(input?: UserListInput) {
     return userHooks.useList(input);
   }
   ```

3. **Centralize invalidation logic**
   ```typescript
   const invalidations = defineInvalidations({ contract }, {
     create: ['list', 'count'],
     // All in one place
   });
   ```

4. **Use the resolver form for complex invalidation**
   ```typescript
   update: (input, output) => ({
     findById: { id: input.id },  // Only invalidate updated item
   }),
   ```

5. **Type the generic parameters explicitly**
   ```typescript
   createRouterHooks<typeof appContract.user, typeof orpc.user>(...);
   ```

### DON'T ❌

1. **Don't use ORPC directly in components**
   ```typescript
   // ❌ Direct ORPC usage
   const { data } = useQuery({
     queryKey: ['user', 'list'],
     queryFn: () => orpc.user.list.call({}),
   });
   
   // ✅ Use generated hooks
   const { data } = useUsers();
   ```

2. **Don't scatter invalidation in onSuccess**
   ```typescript
   // ❌ Scattered invalidation
   const mutation = useCreateUser();
   mutation.mutate(data, {
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['user', 'list'] });
     },
   });
   
   // ✅ Defined in invalidations config
   ```

3. **Don't hardcode query keys**
   ```typescript
   // ❌ Hardcoded
   queryClient.invalidateQueries({ queryKey: ['user', 'list'] });
   
   // ✅ Use registry
   queryClient.invalidateQueries({ queryKey: userQueryKeys.list() });
   ```

4. **Don't create hand-made contracts expecting hooks**
   ```typescript
   // ❌ Won't generate hooks
   const myContract = oc.route({...}).input(...).output(...);
   
   // ✅ Use RouteBuilder
   const myContract = new RouteBuilder().method("GET")...build();
   ```

---

## 17. Migration Guide

### From Manual Hooks

#### Before (Manual)

```typescript
// hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function useUsers(input: UserListInput) {
  return useQuery({
    queryKey: ['user', 'list', input],
    queryFn: () => orpc.user.list.call(input),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: UserCreateInput) => orpc.user.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'count'] });
    },
  });
}

// ... repeat for every procedure
```

#### After (Generated)

```typescript
// hooks/useUser.orpc-hooks.ts
import { createRouterHooks, defineInvalidations } from "@repo/orpc-utils/hooks";
import { orpc, appContract } from "@/lib/orpc";

const invalidations = defineInvalidations({ contract: appContract.user }, {
  create: ['list', 'count'],
  update: (input) => ({ list: undefined, findById: { id: input.id } }),
  delete: ['list', 'count'],
});

export const userHooks = createRouterHooks<
  typeof appContract.user,
  typeof orpc.user
>(orpc.user, { invalidations, useQueryClient });

// Export convenience wrappers
export const useUsers = userHooks.useList;
export const useCreateUser = userHooks.useCreate;
export const userQueryKeys = userHooks.queryKeys;
```

### Migration Checklist

1. [ ] Ensure contracts use `RouteBuilder`
2. [ ] Create invalidation config with `defineInvalidations()`
3. [ ] Generate hooks with `createRouterHooks()`
4. [ ] Create composite hooks if needed
5. [ ] Export `queryKeys` for external usage
6. [ ] Create wrapper functions for discoverability
7. [ ] Update imports throughout codebase
8. [ ] Remove old manual hook files

---

## 18. Troubleshooting

### Hooks Not Being Generated

**Symptom**: Some procedures don't have hooks generated.

**Cause**: Contract doesn't have RouteBuilder metadata.

**Solution**: Ensure you're using `RouteBuilder.build()`:

```typescript
// ❌ No hooks generated
const myContract = oc.route({...}).input(...).output(...);

// ✅ Hooks generated
const myContract = new RouteBuilder()
  .method("GET")
  .path("/my-endpoint")
  .input(inputSchema)
  .output(outputSchema)
  .build();
```

### Type Errors in Invalidation Config

**Symptom**: TypeScript complains about invalidation keys.

**Cause**: Using wrong procedure names or not passing TContract.

**Solution**: Ensure you pass the raw contract to `defineInvalidations()`:

```typescript
// ❌ Wrong - using TanStack utils
defineInvalidations({ contract: orpc.user }, { ... });

// ✅ Correct - using raw contract
defineInvalidations({ contract: appContract.user }, { ... });
```

### Query Keys Not Matching

**Symptom**: Manual invalidation doesn't work.

**Cause**: Query key structure doesn't match.

**Solution**: Always use the queryKeys registry:

```typescript
// ❌ Might not match
queryClient.invalidateQueries({ queryKey: ['user', 'list'] });

// ✅ Always matches
queryClient.invalidateQueries({ queryKey: userQueryKeys.list() });
```

### Streaming Hooks Not Working

**Symptom**: `useLive*` or `useStreamed*` hooks not generated.

**Cause**: Contract output not wrapped with `eventIterator`.

**Solution**: Use `wrapOutput(eventIterator)`:

```typescript
import { eventIterator } from "@orpc/contract";

const streamContract = new RouteBuilder()
  .method("GET")
  .output(dataSchema)
  .wrapOutput(eventIterator)  // ← Required for streaming
  .build();
```

### Invalidation Not Triggering

**Symptom**: Queries not refetching after mutation.

**Causes**:
1. Invalidation config not defined for that mutation
2. Query key mismatch
3. Resolver returning wrong structure

**Solution**: Check config and add logging:

```typescript
update: (input, output, context) => {
  console.log('Invalidating for:', input);
  return {
    list: undefined,
    findById: { id: input.id },
  };
},
```

---

## Summary

The ORPC Hooks System provides a robust, type-safe framework for generating TanStack Query hooks from ORPC contracts. Key takeaways:

1. **Use RouteBuilder** for contracts that need hooks
2. **Pass both TContract and TRouter** for correct type discrimination
3. **Centralize invalidation** with `defineInvalidations()`
4. **Export queryKeys** for external cache operations
5. **Use composite hooks** for common UI patterns
6. **Merge everything** with `mergeHooks()` for a unified API

The system eliminates boilerplate while maintaining full type safety from contract definition to React component.

---

*Document maintained by the development team. Last comprehensive review: [Date]*
