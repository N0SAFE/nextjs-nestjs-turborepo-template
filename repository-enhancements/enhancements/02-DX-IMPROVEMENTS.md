# Developer Experience (DX) Improvements

> Enhancements to improve developer productivity and code quality

---

## 1. Hook Generation Improvements

### Current State
- `generate-hooks.ts` (999 lines) generates hooks from contracts
- Works well but could be more intuitive

### Enhancement: Hook Documentation Generator

**Problem:** Generated hooks lack inline documentation

**Solution:** Add JSDoc generation to hook generator

```typescript
// Before
export function useUserList(options?: UseUserListOptions) {
  return useQuery(...)
}

// After
/**
 * Fetches a paginated list of users.
 * 
 * @param options.pagination - Pagination configuration
 * @param options.filter - Filter criteria
 * @param options.enabled - Enable/disable query
 * @returns UseQueryResult with user list
 * 
 * @example
 * const { data, isLoading } = useUserList({ pagination: { page: 1 } })
 */
export function useUserList(options?: UseUserListOptions) {
  return useQuery(...)
}
```

**Implementation:**
```typescript
// packages/utils/orpc/src/hooks/generate-docs.ts
export function generateHookDocs(
  procedureName: string,
  operationType: 'query' | 'mutation',
  inputSchema: ZodSchema,
  outputSchema: ZodSchema
): string {
  // Generate JSDoc from Zod schemas
}
```

---

## 2. Create Constants File for Timing Values

### Current State
Magic numbers scattered throughout codebase:
```typescript
staleTime: 1000 * 60 * 2    // 2 minutes
gcTime: 1000 * 60 * 10      // 10 minutes
```

### Enhancement: Centralized Query Configuration (Per-Domain Extends)

#### Why This Approach?

During our discussion, we considered:
- **Option A**: Fully centralized (one config file)
- **Option B**: Per-domain only (separate configs)
- **Option C**: Centralized + per-domain extends (CHOSEN)

We chose **Option C** because:
1. **DRY base config**: Common values (default stale times, retry logic) defined once
2. **Domain flexibility**: User queries might need different caching than admin queries
3. **Type safety**: Central types, domain-specific overrides
4. **Discoverability**: Easy to find defaults, easy to customize per feature

#### How It Works

1. **Base config** in `apps/web/src/lib/query/config.ts` defines defaults
2. **Domain configs** like `user-query-config.ts` extend the base
3. **Hooks** import from their domain config for consistency

**Create:** `apps/web/src/lib/query/config.ts`

```typescript
export const QUERY_CONFIG = {
  // Stale times
  STALE_TIME: {
    FAST: 1000 * 30,           // 30 seconds
    DEFAULT: 1000 * 60 * 2,    // 2 minutes
    SLOW: 1000 * 60 * 5,       // 5 minutes
    STATIC: 1000 * 60 * 30,    // 30 minutes
  },
  
  // Garbage collection times
  GC_TIME: {
    SHORT: 1000 * 60 * 5,      // 5 minutes
    DEFAULT: 1000 * 60 * 10,   // 10 minutes
    LONG: 1000 * 60 * 30,      // 30 minutes
  },
  
  // Retry configuration
  RETRY: {
    COUNT: 3,
    DELAY: 1000,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const

// Type-safe usage
export type StaleTimeKey = keyof typeof QUERY_CONFIG.STALE_TIME
export type GcTimeKey = keyof typeof QUERY_CONFIG.GC_TIME
```

**Usage:**
```typescript
import { QUERY_CONFIG } from '@/lib/query/config'

useQuery({
  staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
  gcTime: QUERY_CONFIG.GC_TIME.DEFAULT,
})
```

---

## 3. Create Type-Safe Query Key Factory

### Current State
Query keys defined inconsistently across hooks

### Enhancement: Centralized Query Key Factory

**Create:** `apps/web/src/lib/query/keys.ts`

```typescript
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Organizations
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (filters?: OrgFilters) => [...queryKeys.organizations.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.organizations.all, 'detail', id] as const,
    members: (orgId: string) => [...queryKeys.organizations.detail(orgId), 'members'] as const,
  },
  
  // Invitations
  invitations: {
    all: ['invitations'] as const,
    byOrg: (orgId: string) => [...queryKeys.invitations.all, 'org', orgId] as const,
  },
  
  // Admin
  admin: {
    all: ['admin'] as const,
    users: (filters?: AdminFilters) => [...queryKeys.admin.all, 'users', filters] as const,
  },
} as const

// Invalidation helpers
export const invalidateKeys = {
  allUsers: () => queryKeys.users.all,
  userLists: () => queryKeys.users.lists(),
  userDetail: (id: string) => queryKeys.users.detail(id),
  // ... etc
}
```

---

## 4. Add Error Boundary Components

### Current State
Only `global-error.tsx` exists at app level

### Why Granular Error Boundaries?

During our discussion, we considered:
- **Option A**: Single global error boundary
- **Option B**: Granular error boundaries (CHOSEN)

We chose **granular boundaries** because:
1. **Isolation**: A failing user list shouldn't crash the entire dashboard
2. **Better UX**: Users can retry individual features, not the whole page
3. **Debugging**: Errors are scoped to specific features, easier to identify
4. **Recovery**: `QueryErrorBoundary` integrates with TanStack Query's reset mechanism

#### The Three Boundary Types

| Type | Purpose | When to Use |
|------|---------|-------------|
| `ErrorBoundary` | Catch any React error | Wrap entire layouts or high-risk components |
| `QueryErrorBoundary` | Catch data fetching errors | Wrap components that use `useQuery`/`useMutation` |
| `FeatureErrorBoundary` | Catch + log feature errors | Wrap individual features with error reporting |

#### How to Use

```tsx
// Layout level - catch everything
<ErrorBoundary fallback={<LayoutError />}>
  {children}
</ErrorBoundary>

// Feature level - catch with retry
<QueryErrorBoundary>
  <UserList />
</QueryErrorBoundary>

// Specific feature - catch with logging
<FeatureErrorBoundary feature="admin-users">
  <AdminUsersTable />
</FeatureErrorBoundary>
```

### Enhancement: Granular Error Boundaries

Implement three boundary types: `ErrorBoundary`, `QueryErrorBoundary`, `FeatureErrorBoundary`

**Create:** `apps/web/src/components/error/`

```typescript
// ErrorBoundary.tsx
export function ErrorBoundary({
  children,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      fallback={fallback ?? <DefaultErrorFallback />}
      onError={onError}
    >
      {children}
    </ReactErrorBoundary>
  )
}

// QueryErrorBoundary.tsx
export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={<QueryErrorFallback onReset={reset} />}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

// FeatureErrorBoundary.tsx
export function FeatureErrorBoundary({
  feature,
  children,
}: {
  feature: string
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={<FeatureErrorFallback feature={feature} />}
      onError={(error) => {
        // Log to error service
        logError(error, { feature })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

---

## 5. Create Debug Logging Service

### Current State
`console.log` used directly in production code

### Why Pino?

During our discussion, we considered:
- **Option A**: Simple wrapper around console
- **Option B**: Winston (popular Node.js logger)
- **Option C**: Pino (CHOSEN)

We chose **Pino** because:
1. **NestJS compatibility**: Pino is the recommended logger for NestJS, our backend framework
2. **Shared interface**: Same logger API works in both web (Next.js) and API (NestJS)
3. **Performance**: Pino is one of the fastest Node.js loggers
4. **Structured logging**: JSON output, perfect for log aggregation services
5. **Pretty printing**: Dev-friendly output in development mode

#### How to Use

```typescript
// In any package or app
import { logger } from '@repo/logger'

// Basic logging
logger.info('User logged in', { userId: '123' })
logger.error('Failed to fetch', { error, endpoint: '/api/users' })

// Scoped logger for a module
const orpcLogger = logger.scope('ORPC')
orpcLogger.debug('Setting cookie header')  // Output: [ORPC] Setting cookie header
```

#### Configuration

```typescript
// Development: Pretty printed, all levels
// Production: JSON format, info+ levels only
const isDev = process.env.NODE_ENV === 'development'
```

### Enhancement: Structured Logging Service with Pino

Create `@repo/logger` package using **Pino** for NestJS compatibility.
Provides structured logging across web and API with the same interface.

**Create:** `packages/utils/logger/src/index.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(`🔍 [DEBUG] ${message}`, context ?? '')
    }
  },
  
  info: (message: string, context?: LogContext) => {
    console.info(`ℹ️ [INFO] ${message}`, context ?? '')
  },
  
  warn: (message: string, context?: LogContext) => {
    console.warn(`⚠️ [WARN] ${message}`, context ?? '')
  },
  
  error: (message: string, error?: Error, context?: LogContext) => {
    console.error(`❌ [ERROR] ${message}`, { error, ...context })
    // Optionally send to error tracking service
  },
  
  // Scoped logger
  scope: (scope: string) => ({
    debug: (msg: string, ctx?: LogContext) => logger.debug(`[${scope}] ${msg}`, ctx),
    info: (msg: string, ctx?: LogContext) => logger.info(`[${scope}] ${msg}`, ctx),
    warn: (msg: string, ctx?: LogContext) => logger.warn(`[${scope}] ${msg}`, ctx),
    error: (msg: string, err?: Error, ctx?: LogContext) => 
      logger.error(`[${scope}] ${msg}`, err, ctx),
  }),
}

// Usage
const orpcLogger = logger.scope('ORPC')
orpcLogger.debug('Setting cookie header', { length: 100 })
```

---

## 6. Improve Type Exports

### Current State
Types scattered, hard to find

### Enhancement: Centralized Type Exports

**Create:** `apps/web/src/types/index.ts`

```typescript
// Re-export all hook types
export type { UserData, UserList, UserActions } from '@/hooks/useUsers'
export type { AdminPlatformRole, AdminActions } from '@/hooks/useAdmin'
export type { 
  PlatformPermissionCheck, 
  OrganizationPermissionCheck 
} from '@/hooks/usePermissions'

// Re-export API types
export type { 
  AppContract, 
  UserContract, 
  OrgContract 
} from '@repo/api-contracts'

// Re-export permission types
export type {
  PlatformRole,
  OrganizationRole,
  PlatformResource,
  OrganizationResource,
} from '@repo/auth-utils'

// Component prop types
export type { RequirePermissionProps } from '@/components/permissions/RequirePermission'
```

---

## 7. Development Scripts

### Current State
Current dev scripts are sufficient. No additional scripts needed.

**Existing scripts are adequate:**
```json
{
  "scripts": {
    "dev:clean": "bun run clean && bun run dev",
    "dev:fresh": "rm -rf node_modules && bun install && bun run dev",
    "check:all": "bun run lint && bun run type-check && bun run test",
    "check:quick": "bun run type-check",
    "gen:hooks": "bun run --cwd packages/utils/orpc generate",
    "gen:routes": "bun run --cwd apps/web dr:build",
    "db:reset": "bun run --cwd apps/api db:push && bun run --cwd apps/api db:seed",
    "deps:check": "bunx depcheck",
    "deps:update": "bunx npm-check-updates -u",
    "size:analyze": "bunx source-map-explorer dist/**/*.js"
  }
}
```

---

## 8. Create Hook Templates

### Enhancement: Code Snippets for Hooks

**Create:** `.vscode/snippets/hooks.code-snippets`

```json
{
  "ORPC Query Hook": {
    "prefix": "orpc-query",
    "body": [
      "export function use${1:Name}(options?: {",
      "  enabled?: boolean",
      "}) {",
      "  return useQuery(orpc.${2:router}.${3:procedure}.queryOptions({",
      "    input: {},",
      "    enabled: options?.enabled ?? true,",
      "    staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,",
      "    gcTime: QUERY_CONFIG.GC_TIME.DEFAULT,",
      "  }))",
      "}"
    ]
  },
  "ORPC Mutation Hook": {
    "prefix": "orpc-mutation",
    "body": [
      "export function use${1:Name}() {",
      "  const queryClient = useQueryClient()",
      "",
      "  return useMutation(orpc.${2:router}.${3:procedure}.mutationOptions({",
      "    onSuccess: () => {",
      "      toast.success('${4:Success message}')",
      "      void queryClient.invalidateQueries({",
      "        queryKey: queryKeys.${5:resource}.all",
      "      })",
      "    },",
      "    onError: (error) => {",
      "      toast.error(`Failed: ${error.message}`)",
      "    },",
      "  }))",
      "}"
    ]
  }
}
```

---

## 9. Add Pre-Commit Hooks

### Enhancement: Automated Quality Checks

**Create:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type check on staged files
bunx lint-staged

# Run tests for changed packages
bun run test --changed
```

**Create:** `lint-staged.config.js`

```javascript
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md}': [
    'prettier --write',
  ],
}
```

---

## 10. Create Development Documentation

### Enhancement: Developer Onboarding Docs

**Create:** `docs/DEVELOPER-GUIDE.md`

```markdown
# Developer Guide

## Quick Start
1. Clone repository
2. Run `bun install`
3. Run `bun run dev`

## Key Concepts
- ORPC for API contracts
- Hook generation system
- Permission system

## Common Tasks
- Creating new hooks
- Adding API endpoints
- Working with permissions

## Debugging Tips
- Enable debug logging
- Use React Query DevTools
- Check network tab

## Code Style
- Follow existing patterns
- Use provided snippets
- Run checks before committing
```

---

## Implementation Priority

| Enhancement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Query config constants | High | Low | 1 |
| Logger service | High | Low | 2 |
| Query key factory | High | Medium | 3 |
| Error boundaries | High | Medium | 4 |
| Type exports | Medium | Low | 5 |
| Dev scripts | Medium | Low | 6 |
| Hook templates | Medium | Low | 7 |
| Pre-commit hooks | Medium | Medium | 8 |
| Hook docs generator | Medium | High | 9 |
| Developer guide | Low | Medium | 10 |

---

## Checklist

- [ ] Query config constants created
- [ ] Logger service implemented
- [ ] Query key factory created
- [ ] Error boundaries added
- [ ] Type exports centralized
- [ ] Dev scripts added
- [ ] Hook templates created
- [ ] Pre-commit hooks configured
- [ ] Hook documentation generator added
- [ ] Developer guide written
