# Shared Domain Utilities

## Custom ORPC-Native Contract Helper

The `custom()` helper in `helpers.ts` creates endpoints that use ORPC's native `createProcedureUtils` function. This ensures perfect alignment with ORPC's behavior and API surface.

### ✅ Key Achievement

**Now using ORPC's native implementation!**
- Uses `createProcedureUtils` from `@orpc/tanstack-query`
- Creates real ORPC `Client` functions with Zod validation
- Returns exact same type as native ORPC procedures (`ProcedureUtils`)
- Perfectly aligned - inherits all ORPC behavior automatically

### Benefits

1. **Perfect Alignment**: Uses ORPC's internal functions, not reimplemented
2. **Automatic Updates**: Any ORPC improvements automatically apply
3. **Type Safety**: Exact same types as native ORPC procedures
4. **Smaller Code**: ~150 lines instead of ~400
5. **No Maintenance**: ORPC team maintains the enhancement logic

### Usage

#### With Zod Schema (Recommended)

```typescript
import { custom } from '@/domains/shared/helpers'
import { z } from 'zod'

const login = custom({
  input: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  keys: ['auth', 'login'],
  handler: async (input) => {
    // input is fully typed from Zod schema!
    return await authClient.signIn.email(input)
  }
})

// Usage in components (same as ORPC!)
const { data } = useQuery(login.queryOptions({
  input: { email: 'test@example.com', password: 'password123' }
}))

// Direct call
const result = await login.call({ email: '...', password: '...' })
```

#### Without Schema (Explicit Generics)

```typescript
const session = custom<void, Session>({
  keys: ['auth', 'session'],
  handler: async () => authClient.getSession()
})

// Usage
const { data } = useQuery(session.queryOptions({ input: undefined }))
```

### ORPC API Surface

All custom endpoints expose the exact same API as native ORPC procedures:

- **`call(input)`** - Direct execution
- **`queryKey({ input })`** - Query cache key  
- **`queryOptions({ input, ...options })`** - TanStack Query options
- **`mutationKey()`** - Mutation cache key
- **`mutationOptions(...options)`** - TanStack Mutation options
- **`infiniteKey({ input })`** - Infinite query key
- **`infiniteOptions({ input, ...options })`** - Infinite query options
- **`experimental_liveKey({ input })`** - Live query key (experimental)
- **`experimental_liveOptions({ input })`** - Live query options (experimental)
- **`experimental_streamedKey({ input })`** - Streamed query key (experimental)
- **`experimental_streamedOptions({ input })`** - Streamed query options (experimental)

### Configuration Options

```typescript
custom({
  input: zodSchema,              // Zod schema for validation & types
  keys: ['domain', 'endpoint'],   // Cache key path
  handler: async (input) => {},  // Handler function
  
  // Optional TanStack Query defaults
  staleTime: 1000 * 60,          // 1 minute
  gcTime: 1000 * 60 * 5,         // 5 minutes  
  retry: 3,
  enabled: true,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchOnReconnect: true,
})
```

### How It Works

```typescript
// 1. Create ORPC Client function with Zod validation
const client: Client<Record<never, never>, TInput, TOutput, TError> = (...args) => {
  const input = args[0]
  const validated = zodSchema.parse(input) // Runtime validation
  return handler(validated)
}

// 2. Use ORPC's native enhancement
return createProcedureUtils(client, {
  path: ['domain', 'endpoint'],
  experimental_defaults: { queryOptions: { staleTime, ... } }
})

// 3. Result: Full ORPC-compatible procedure!
// - Same types
// - Same behavior
// - Same API surface
// - Always in sync with ORPC
```

### Migration from Old Implementation

**Before** (~400 lines, manually implemented):
```typescript
// Manually created all methods
return {
  call: async (input) => { ... },
  queryKey: (input) => { ... },
  queryOptions: (input, overrides) => ({ 
    queryKey: ...,
    queryFn: ...
  }),
  // ... many more manual implementations
}
```

**After** (~150 lines, ORPC native):
```typescript
// Use ORPC's native functions
const client = (...args) => handler(args[0])
return createProcedureUtils(client, { path, experimental_defaults })
```

### Key Differences from Pure ORPC

1. **Zod Validation**: Custom endpoints validate input with Zod at runtime
2. **Better Auth Integration**: Wraps Better Auth SDK calls for type safety
3. **Defaults**: Can set default query options via `experimental_defaults`
4. **Simplified Keys**: Uses simple array of strings instead of full route objects

Everything else is identical to native ORPC procedures!
