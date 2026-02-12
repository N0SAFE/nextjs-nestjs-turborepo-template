# Architecture Improvements

> Structural changes for scalability, maintainability, and performance

---

## 1. Permission System Architecture

### Current Architecture
Dual-layer permission system:
- **Platform roles**: `superAdmin`, `admin`, `user`
- **Organization roles**: `owner`, `admin`, `member`

### Why Keep Dual-Layer?

During our discussion, we considered:
- **Option A**: Unify into single permission model
- **Option B**: Keep dual-layer + add convenience hook (CHOSEN)

We chose to **keep dual-layer** because:
1. **Different concerns**: Platform = "can you access admin features?" vs Org = "can you manage this team?"
2. **Different sources**: Platform role from user.role, org role from membership
3. **Real-world mapping**: SaaS apps genuinely have these two permission levels
4. **Better Auth alignment**: Organization plugin already implements org roles

#### The `usePermissions()` Hook

Adding a convenience hook that provides a clean API for both permission types:

```typescript
const { platform, organization } = usePermissions()

// Check platform permissions
if (platform.can('admin:users:read')) {
  // Show admin panel
}

// Check org permissions
if (organization.can('org:members:invite')) {
  // Show invite button
}

// Get current roles
console.log(platform.role)      // 'admin'
console.log(organization.role)  // 'owner'
```

### Improvement: Keep Dual-Layer + Add `usePermissions()` Hook

Keep current architecture and add unified `usePermissions()` hook for convenient access:

```typescript
// packages/utils/auth/src/permissions/index.ts

// Clear separation of concerns
export const platformPermissions = {
  check: checkPlatformPermission,
  roles: PLATFORM_ROLES,
  hierarchy: PLATFORM_ROLE_HIERARCHY,
}

export const organizationPermissions = {
  check: checkOrganizationPermission,
  roles: ORGANIZATION_ROLES,
  hierarchy: ORGANIZATION_ROLE_HIERARCHY,
}

// Convenience hooks
export function usePermissions() {
  const { session } = useSession()
  const { currentOrg } = useOrganization()
  
  return {
    platform: {
      can: (action: PlatformPermission) => 
        checkPlatformPermission(session?.user?.role, action),
      role: session?.user?.role,
    },
    organization: {
      can: (action: OrganizationPermission) =>
        checkOrganizationPermission(currentOrg?.role, action),
      role: currentOrg?.role,
    },
  }
}
```

---

## 2. ORPC Hook Generation Architecture

### Current Architecture
- Manual hook generation via script
- Generate on-demand with `bun run web -- hooks:generate`
- Output to `apps/web/src/hooks/orpc/`

### Why Runtime Hook Factory?

During our discussion, we considered:
- **Option A**: Build-time code generation (current)
- **Option B**: Runtime hook factory (CHOSEN)
- **Option C**: Full codegen with build step

We chose **runtime hook factory** because:
1. **No generation step**: Hooks exist at runtime, no `bun run generate` needed
2. **Always in sync**: Contract changes immediately reflected in hooks
3. **Type safety preserved**: TypeScript infers types from contracts at compile time
4. **Simpler DX**: One less step in the workflow
5. **Less generated code**: No `.orpc-hooks.ts` files to maintain

#### How It Works

Instead of generating hook files, we create hooks at runtime:

```typescript
// Before: Generated file with 1000+ lines
export function useUserFindCurrentProfile() { ... }
export function useUserUpdate() { ... }
// ... hundreds more

// After: Runtime factory creates hooks on-demand
const { useQuery, useMutation } = createTypedHooks(orpcClient)

// Usage is the same but hooks are created at runtime
const { data } = useQuery('user.findCurrentProfile', {})
const { mutate } = useMutation('user.update')
```

#### Trade-offs

| Aspect | Code Generation | Runtime Factory |
|--------|-----------------|------------------|
| Build step | Required | Not needed |
| Bundle size | Larger (all hooks) | Smaller (factory only) |
| Autocomplete | Full (generated types) | Full (inferred types) |
| Sync with contract | Manual generation | Automatic |

### Improvement: Runtime Hook Factory (No Code Generation)

Use runtime hook factory approach - hooks are created at runtime from contracts:

```typescript
// packages/utils/orpc/src/hook-factory.ts
import { createORPCHooks } from '@orpc/react-query'
import type { ContractRouter } from '@repo/api-contracts'

export function createTypedHooks<T extends ContractRouter>(
  client: ORPCClient<T>
) {
  const hooks = createORPCHooks(client)
  
  // Wrap with consistent patterns
  return {
    useQuery: <K extends keyof T>(
      key: K,
      input: T[K]['input'],
      options?: QueryOptions
    ) => {
      return hooks.useQuery(key, input, {
        staleTime: 30_000,
        ...options,
      })
    },
    useMutation: <K extends keyof T>(
      key: K,
      options?: MutationOptions
    ) => {
      return hooks.useMutation(key, {
        onError: (error) => toast.error(error.message),
        ...options,
      })
    },
  }
}
```

---

## 3. Testing Infrastructure

### Current Issues
- 45/54 tests failing in `@repo/orpc-utils`
- Zod 4 import issue in vitest

### Solution: Fix Test Environment

**Step 1: Update vitest config for Zod 4**

```typescript
// vitest.config.mts (root)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      // Ensure Zod v4 is used consistently
      'zod': require.resolve('zod'),
    },
    deps: {
      optimizer: {
        web: {
          include: ['zod'],
        },
      },
    },
  },
})
```

**Step 2: Package-specific fix**

```typescript
// packages/utils/orpc/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '@repo/config-vitest'

export default mergeConfig(baseConfig, {
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
})

// packages/utils/orpc/vitest.setup.ts
import * as z from 'zod'

// Ensure Zod is properly initialized
if (!z.object) {
  throw new Error('Zod not properly loaded')
}
```

**Step 3: Add Integration Tests**

```typescript
// apps/api/__tests__/integration/orpc.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestClient } from '../helpers/test-client'

describe('ORPC Integration', () => {
  let client: ReturnType<typeof createTestClient>
  
  beforeAll(async () => {
    client = await createTestClient()
  })
  
  it('should handle user.findCurrentProfile', async () => {
    const result = await client.user.findCurrentProfile({})
    expect(result).toHaveProperty('id')
  })
})
```

---

## 4. Package Structure Optimization

### Current Structure
```
packages/
├── bin/
├── configs/
├── contracts/
├── types/
├── ui/
└── utils/
```

### Why Full Reorganization?

During our discussion, we considered:
- **Option A**: Keep current structure
- **Option B**: Minor cleanup
- **Option C**: Full reorganization (CHOSEN)

We chose **full reorganization** because:
1. **Logical grouping**: Auth stuff together, data stuff together, tooling together
2. **Discoverability**: "Where's the permission code?" → `packages/auth/`
3. **Dependency clarity**: Core packages have no deps, feature packages can import core
4. **Scalability**: Adding new features has a clear home
5. **Convention**: Follows monorepo best practices from projects like Turborepo examples

#### The New Structure Explained

```
packages/
├── core/           # Foundation - no external deps
│   ├── types/      # Shared TypeScript types
│   ├── contracts/  # API contracts (ORPC)
│   └── utils/      # Pure utility functions
│
├── ui/             # UI layer
│   ├── components/ # React components (ShadCN + custom)
│   └── hooks/      # UI-specific hooks (not data hooks)
│
├── auth/           # Authentication & authorization
│   ├── client/     # Better Auth client, React hooks
│   ├── server/     # Server-side auth utilities
│   └── permissions/# Permission system
│
├── data/           # Data layer
│   ├── orpc/       # ORPC client utilities
│   └── query/      # TanStack Query utilities
│
├── tooling/        # Dev tooling configs
│   ├── eslint/
│   ├── prettier/
│   ├── typescript/
│   ├── vitest/
│   └── tailwind/
│
tools/              # CLI tools (separate from packages)
├── bin/
│   ├── declarative-routing/
│   └── runthenkill/
└── codegen/
    └── orpc-hooks/
```

#### Migration Path

1. Create new directory structure
2. Move packages one at a time
3. Update `package.json` names and imports
4. Update `turbo.json` pipeline
5. Run full build to verify

### New Structure (Full Reorganization)

```
packages/
├── core/
│   ├── types/           # Shared TypeScript types
│   ├── contracts/       # API contracts (renamed from contracts/api)
│   └── utils/           # Core utilities
├── ui/
│   ├── components/      # Renamed from ui/base
│   └── hooks/           # UI-specific hooks
├── auth/
│   ├── client/          # Client-side auth (Better Auth)
│   ├── server/          # Server-side auth
│   └── permissions/     # Permission system
├── data/
│   ├── orpc/            # ORPC utilities
│   └── query/           # TanStack Query utilities
├── tooling/
│   ├── eslint/
│   ├── prettier/
│   ├── typescript/
│   ├── vitest/
│   └── tailwind/
tools/
├── bin/
│   ├── declarative-routing/
│   └── runthenkill/
└── codegen/
    └── orpc-hooks/
```

### Migration Steps

```bash
# 1. Create new structure
mkdir -p packages/{core,auth,data,tooling}

# 2. Move packages (update package.json names)
mv packages/types packages/core/types
mv packages/contracts/api packages/core/contracts
mv packages/utils/auth packages/auth/client
mv packages/utils/orpc packages/data/orpc

# 3. Update all imports across workspace
# 4. Update turbo.json dependencies
# 5. Update root package.json workspaces
```

---

## 5. State Management Architecture

### Current State
- TanStack Query for server state
- No clear client state solution

### Why This Hybrid Strategy?

During our discussion, we identified that different state types need different solutions:

| State Type | Solution | Why |
|------------|----------|-----|
| Server state | TanStack Query | Caching, refetching, optimistic updates |
| URL state | nuqs | Shareable links, browser history |
| UI state | React useState | Simple, local, no need for library |
| Complex UI | Zustand (if needed) | Only when React state isn't enough |

#### nuqs for URL State (Key Decision)

We chose **nuqs** over alternatives because:
1. **Type-safe**: Full TypeScript support for URL params
2. **SSR compatible**: Works with Next.js App Router
3. **Shareable URLs**: Filters, pagination, etc. are in the URL
4. **Browser history**: Back button works correctly
5. **No Zustand needed**: Most "client state" is actually URL state

#### How to Decide What State Type to Use

```
Is it from the server?         → TanStack Query
│
Should it be in the URL?       → nuqs (filters, pagination, tabs)
│
Is it simple local UI state?   → React useState
│
Is it complex, shared UI state? → Consider Zustand
```

#### Example: Admin User Filters

```typescript
// Before: Zustand store for filters
const useFiltersStore = create((set) => ({ ... }))

// After: nuqs for URL state (shareable, bookmarkable)
import { parseAsString, useQueryStates } from 'nuqs'

export function useAdminFilters() {
  return useQueryStates({
    search: parseAsString.withDefault(''),
    role: parseAsString,
    page: parseAsInteger.withDefault(1),
  })
}

// URL: /admin/users?search=john&role=admin&page=2
// This URL can be shared and bookmarked!
```

### Improvement: Hybrid State Strategy

- **Server state**: TanStack Query (already implemented)
- **URL state**: nuqs for shareable/bookmarkable state
- **UI state**: React state (useState/useReducer) for simple cases
- **Complex UI state**: Zustand only if needed

```typescript
// apps/web/src/stores/index.ts

// Server state: TanStack Query (already implemented)
// UI state: Zustand for complex UI
// URL state: nuqs for shareable state

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Example: UI preferences store
interface UIStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  toggleSidebar: () => void
  setTheme: (theme: UIStore['theme']) => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'system',
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        setTheme: (theme) => set({ theme }),
      }),
      { name: 'ui-store' }
    )
  )
)

// Example: Admin filters (shareable via URL)
// Use nuqs instead of zustand
import { parseAsString, parseAsInteger, useQueryStates } from 'nuqs'

export const adminFilters = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  role: parseAsString,
}

export function useAdminFilters() {
  return useQueryStates(adminFilters)
}
```

---

## 6. Error Boundary Architecture

### Current State
No consistent error boundaries

### Improvement: Layered Error Boundaries

```typescript
// apps/web/src/components/errors/ErrorBoundary.tsx
'use client'

import { Component, type ReactNode } from 'react'
import { ErrorState } from '@repo/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info)
    // Report to error tracking service
    console.error('Error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <ErrorState
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}

// Query error boundary for data fetching
export function QueryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider>
      <ErrorBoundary
        fallback={<QueryErrorState error={null} />}
        onError={(error) => {
          // Log query errors specifically
        }}
      >
        {children}
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
```

**Layout integration:**

```typescript
// apps/web/src/app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <QueryErrorBoundary>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </QueryErrorBoundary>
    </ErrorBoundary>
  )
}
```

---

## 7. API Layer Abstraction

### Current State
Direct ORPC calls in hooks

### Improvement: Repository Pattern

```typescript
// apps/web/src/repositories/user.repository.ts
import { orpc } from '@/lib/orpc'
import type { User, UpdateUserInput } from '@repo/api-contracts'

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    try {
      return await orpc.user.findById({ id })
    } catch (error) {
      if (isNotFoundError(error)) return null
      throw error
    }
  },
  
  async findCurrentProfile(): Promise<User> {
    return orpc.user.findCurrentProfile({})
  },
  
  async update(id: string, data: UpdateUserInput): Promise<User> {
    return orpc.user.update({ id, ...data })
  },
  
  async list(params: ListParams): Promise<PaginatedResult<User>> {
    return orpc.user.list(params)
  },
}

// Use in hooks
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: userRepository.findCurrentProfile,
  })
}
```

---

## 8. API Response Standardization

### Improvement: Consistent Response Format

```typescript
// packages/contracts/api/src/types/response.ts
import { z } from 'zod'

// Success response wrapper
export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime(),
      requestId: z.string().optional(),
    }).optional(),
  })

// Error response
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
})

// Paginated response
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  successResponseSchema(z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }))
```

---

## 9. Caching Strategy

### Improvement: Centralized Cache Configuration

```typescript
// apps/web/src/lib/query-config.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds
      gcTime: 5 * 60 * 1000,       // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        toast.error(error.message)
      },
    },
  },
})

// Domain-specific cache times
export const cacheConfig = {
  user: {
    profile: { staleTime: 60_000 },      // 1 minute
    list: { staleTime: 30_000 },          // 30 seconds
  },
  organization: {
    details: { staleTime: 120_000 },      // 2 minutes
    members: { staleTime: 60_000 },       // 1 minute
  },
  admin: {
    users: { staleTime: 15_000 },         // 15 seconds (frequent updates)
    stats: { staleTime: 300_000 },        // 5 minutes
  },
}

// Helper for consistent cache times
export function getCacheConfig(domain: string, resource: string) {
  return cacheConfig[domain]?.[resource] ?? { staleTime: 30_000 }
}
```

---

## 10. Logging & Monitoring Architecture

### Improvement: Structured Logging

```typescript
// packages/utils/logger/src/index.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  requestId?: string
  [key: string]: unknown
}

class Logger {
  private context: LogContext = {}
  
  setContext(ctx: LogContext) {
    this.context = { ...this.context, ...ctx }
  }
  
  private log(level: LogLevel, message: string, data?: unknown) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data }),
    }
    
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
      console[level](JSON.stringify(entry))
    } else {
      console[level](message, entry)
    }
  }
  
  debug(message: string, data?: unknown) { this.log('debug', message, data) }
  info(message: string, data?: unknown) { this.log('info', message, data) }
  warn(message: string, data?: unknown) { this.log('warn', message, data) }
  error(message: string, data?: unknown) { this.log('error', message, data) }
}

export const logger = new Logger()
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- [ ] Fix Zod test failures
- [ ] Remove deprecated useUsers.ts
- [ ] Consolidate RequirePermission

### Phase 2: DX Improvements (Week 2)
- [ ] Centralize query keys
- [ ] Add error boundary architecture
- [ ] Improve hook generation

### Phase 3: Architecture (Week 3-4)
- [ ] Package structure optimization
- [ ] State management strategy
- [ ] Caching configuration

### Phase 4: UI/UX (Week 5-6)
- [ ] Add missing components
- [ ] Refactor admin pages
- [ ] Improve error states

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test pass rate | 16.7% | 100% |
| Build time | ~60s | <45s |
| Type check errors | 0 | 0 |
| Duplicate code | High | Low |
| Component coverage | Basic | Comprehensive |

---

## Checklist

- [ ] Permission system reviewed
- [ ] Hook generation improved
- [ ] Tests fixed and passing
- [ ] Package structure optimized
- [ ] State management documented
- [ ] Error boundaries added
- [ ] API layer abstracted
- [ ] Caching configured
- [ ] Logging implemented
- [ ] Documentation updated
