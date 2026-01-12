# Code Consolidation

> Removing duplicates, merging features, and cleaning up technical debt

---

## 1. Consolidate RequirePermission Components

### Current State
Two implementations exist:
1. `apps/web/src/components/shared/RequirePermission.tsx`
2. `packages/utils/auth/src/components/RequirePermission.tsx`

### Solution: Single Source of Truth

**Step 1: Audit both implementations**

```bash
# Compare files
diff apps/web/src/components/shared/RequirePermission.tsx \
     packages/utils/auth/src/components/RequirePermission.tsx
```

**Step 2: Merge into package**

Keep the version in `@repo/auth-utils` as the canonical implementation since it's a shared utility.

**Location:** `packages/utils/auth/src/components/RequirePermission.tsx`

```typescript
import { useMemo, type ReactNode } from 'react'
import { useSession } from '../hooks/useSession'
import { checkPlatformPermission, type PlatformPermission } from '../permissions'

interface RequirePermissionProps {
  permission: PlatformPermission | PlatformPermission[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean // AND vs OR for arrays
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: RequirePermissionProps) {
  const { session, isLoading } = useSession()

  const hasPermission = useMemo(() => {
    if (!session?.user?.role) return false
    
    const permissions = Array.isArray(permission) ? permission : [permission]
    const checker = requireAll ? 'every' : 'some'
    
    return permissions[checker]((p) => 
      checkPlatformPermission(session.user.role, p)
    )
  }, [session?.user?.role, permission, requireAll])

  if (isLoading) return null
  if (!hasPermission) return <>{fallback}</>
  
  return <>{children}</>
}
```

**Step 3: Update imports in web app**

```bash
# Find all imports
grep -r "RequirePermission" apps/web/src --include="*.tsx"

# Replace imports
# FROM: import { RequirePermission } from '@/components/shared/RequirePermission'
# TO:   import { RequirePermission } from '@repo/auth-utils'
```

**Step 4: Remove duplicate**

```bash
rm apps/web/src/components/shared/RequirePermission.tsx
```

---

## 2. Migrate useUsers.ts to ORPC Hooks

### Current State
- `apps/web/src/hooks/useUsers.ts` (632 lines) - Marked @deprecated
- `apps/web/src/hooks/orpc/useUser.orpc-hooks.ts` - New generated hooks

### Migration Plan

**Step 1: Audit usage**

```bash
# Find all imports of useUsers
grep -r "from.*useUsers" apps/web/src --include="*.tsx" --include="*.ts"
```

**Step 2: Create migration mapping**

| Old Hook | New Hook |
|----------|----------|
| `useUserProfile` | `useUserFindCurrentProfile` |
| `useUpdateProfile` | `useUserUpdateProfile` |
| `useUpdateEmail` | `useUserUpdateEmail` |
| `useChangePassword` | `useUserChangePassword` |
| `useDeleteAccount` | `useUserDeleteAccount` |

**Step 3: Update each file**

```typescript
// Before
import { useUserProfile, useUpdateProfile } from '@/hooks/useUsers'

// After
import { 
  useUserFindCurrentProfile, 
  useUserUpdateProfile 
} from '@/hooks/orpc/useUser.orpc-hooks'
```

**Step 4: Remove deprecated file**

```bash
# After all migrations complete
rm apps/web/src/hooks/useUsers.ts
```

---

## 3. Consolidate Permission Exports

### Current State
Multiple permission-related exports scattered:
- `packages/utils/auth/src/permissions/index.ts`
- `packages/utils/auth/src/permissions/platform-permissions.ts`
- `packages/utils/auth/src/permissions/organization-permissions.ts`
- `packages/utils/auth/src/types.ts`

### Solution: Clean Export Structure

**Update:** `packages/utils/auth/src/index.ts`

```typescript
// Permission system - single entry point
export {
  // Platform permissions
  PLATFORM_ROLES,
  PLATFORM_ROLE_HIERARCHY,
  PlatformPermission,
  checkPlatformPermission,
  
  // Organization permissions  
  ORGANIZATION_ROLES,
  ORGANIZATION_ROLE_HIERARCHY,
  OrganizationPermission,
  checkOrganizationPermission,
  
  // Type guards
  isPlatformRole,
  isOrganizationRole,
  
  // Types
  type PlatformRole,
  type OrganizationRole,
  type PermissionCheck,
} from './permissions'

// Components
export { RequirePermission } from './components/RequirePermission'
export { RequireOrgPermission } from './components/RequireOrgPermission'

// Hooks
export { useSession } from './hooks/useSession'
export { usePlatformPermission } from './hooks/usePlatformPermission'
export { useOrgPermission } from './hooks/useOrgPermission'
```

---

## 4. Merge Duplicate Test Configurations

### Current State
Each package has separate vitest config with similar settings

### Solution: Extend Base Config

**Base config:** `packages/configs/vitest/base.ts`

```typescript
import { defineConfig } from 'vitest/config'

export const baseConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.turbo'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
  },
})

export const reactConfig = defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

**Package config:** `packages/ui/base/vitest.config.ts`

```typescript
import { mergeConfig } from 'vitest/config'
import { reactConfig } from '@repo-configs/vitest'

export default mergeConfig(reactConfig, {
  test: {
    // Package-specific overrides only
  },
})
```

---

## 5. Consolidate API Route Utilities

### Current State
Route utilities scattered:
- `apps/web/src/lib/api-url.ts`
- `apps/web/src/lib/routes/`
- `packages/utils/declarative-routing/`

### Solution: Unified Route System

**Keep in package:** `packages/utils/declarative-routing/`

**Update web app imports:**

```typescript
// Before
import { getApiUrl } from '@/lib/api-url'
import { makeRoute } from '@/lib/routes'

// After  
import { getApiUrl, makeRoute } from '@repo/declarative-routing-utils'
```

---

## 6. Remove Unused Exports

### Find Unused Exports

```bash
# Install knip for dead code detection
bun add -D knip

# Run analysis
bunx knip --include exports
```

### Common Cleanup Candidates

```typescript
// packages/types/src/index.ts
// Remove unused type utilities that aren't imported anywhere

// packages/ui/base/src/index.ts  
// Remove components not used in any app
```

---

## 7. Consolidate Environment Utilities

### Current State
- `packages/utils/env/src/index.ts` - Package version
- `apps/web/env.ts` - App-specific version
- `apps/api/src/config/` - NestJS config

### Solution: Shared Base with App Extensions

**Package:** `packages/utils/env/src/index.ts`

```typescript
import { z } from 'zod'

// Shared base schema
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Web-specific schema
export const webEnvSchema = baseEnvSchema.extend({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

// API-specific schema  
export const apiEnvSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
})

// Validation helper
export function validateEnv<T extends z.ZodSchema>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env
): z.infer<T> {
  const parsed = schema.safeParse(env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten())
    throw new Error('Invalid environment variables')
  }
  return parsed.data
}
```

**Web app:** `apps/web/env.ts`

```typescript
import { webEnvSchema, validateEnv } from '@repo/env-utils'

// Extend with app-specific vars if needed
const schema = webEnvSchema.extend({
  // app-specific
})

export const env = validateEnv(schema)
```

---

## 8. Consolidate Query Key Management

### Current State
Query keys defined in individual hook files

### Why Per-Domain Query Keys?

During our discussion, we considered:
- **Option A**: Fully centralized (one `queryKeys.ts` file)
- **Option B**: Per-domain files (CHOSEN)

We chose **per-domain** because:
1. **Colocation**: User query keys live near user hooks
2. **ORPC reuse**: ORPC already generates query keys - we extend, not duplicate
3. **Scalability**: As domains grow, they don't pollute a central file
4. **Discoverability**: Looking for user keys? Check `user-query-keys.ts`

#### How It Works

ORPC generates query keys automatically. Our per-domain files:
1. **Re-export ORPC keys** for consistency
2. **Add custom keys** for non-ORPC queries (e.g., local state)
3. **Provide invalidation helpers** for common patterns

```typescript
// apps/web/src/lib/query-keys/user.ts
import { orpc } from '@/lib/orpc'

export const userQueryKeys = {
  // ORPC-generated keys (just re-export for discoverability)
  profile: () => orpc.user.findCurrentProfile.key(),
  list: (filters?: UserFilters) => orpc.user.list.key({ filters }),
  
  // Custom keys for non-ORPC queries
  preferences: () => ['user', 'preferences'] as const,
}

// Invalidation helper
export const invalidateUserQueries = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: ['user'] })
}
```

### Solution: Per-Domain Query Keys (Reusing ORPC-Generated Keys)

Create per-domain query key files that reuse the keys ORPC already generates.

**Create:** `apps/web/src/lib/query-keys/user.ts` (and similar per-domain)

```typescript
export const queryKeys = {
  // User domain
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    byId: (id: string) => [...queryKeys.user.all, 'byId', id] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.user.all, 'list', filters] as const,
  },
  
  // Organization domain
  organization: {
    all: ['organization'] as const,
    byId: (id: string) => [...queryKeys.organization.all, id] as const,
    members: (orgId: string) => [...queryKeys.organization.all, orgId, 'members'] as const,
  },
  
  // Admin domain
  admin: {
    all: ['admin'] as const,
    users: {
      all: () => [...queryKeys.admin.all, 'users'] as const,
      list: (filters?: Record<string, unknown>) => 
        [...queryKeys.admin.users.all(), 'list', filters] as const,
    },
  },
} as const

// Type-safe query key type
export type QueryKeys = typeof queryKeys
```

**Usage in hooks:**

```typescript
import { queryKeys } from '@/lib/query-keys'

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => orpc.user.findCurrentProfile({}),
  })
}
```

---

## 9. Consolidate Error Handling

### Current State
Error handling scattered across components

### Why Per-Domain Error Handling?

During our discussion, we considered:
- **Option A**: Global error handler
- **Option B**: Per-domain error handling (CHOSEN)

We chose **per-domain** because:
1. **Domain-specific messages**: User errors need different messaging than org errors
2. **Recovery strategies**: Some errors can retry, others need redirect
3. **Logging context**: Domain-specific errors log with relevant context
4. **Composability**: Each domain handles its own errors, cleaner separation

#### How It Works

Each domain has an error handler that:
1. **Catches domain errors**: Knows the error types for that domain
2. **Shows appropriate toast**: User-friendly messages
3. **Logs with context**: Domain, action, user info
4. **Handles recovery**: Retry, redirect, or escalate

```typescript
// apps/web/src/lib/errors/user.ts
export function handleUserError(error: unknown, action: string) {
  const message = getUserErrorMessage(error)
  toast.error(message)
  logger.error(`User ${action} failed`, { error, action, domain: 'user' })
}

// Usage in hooks
onError: (error) => handleUserError(error, 'profile update')
```

### Solution: Per-Domain Error Handling

Implement error handling per domain (user errors, org errors, etc.)
rather than one global error handler.

**Create:** `apps/web/src/lib/errors/user.ts`, `errors/organization.ts`, etc.

```typescript
import { toast } from 'sonner'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, fallbackMessage = 'An error occurred') {
  console.error(error)
  
  if (error instanceof AppError) {
    toast.error(error.message)
    return
  }
  
  if (error instanceof Error) {
    toast.error(error.message || fallbackMessage)
    return
  }
  
  toast.error(fallbackMessage)
}

// For use with mutations
export function onMutationError(error: unknown) {
  handleError(error, 'Failed to complete action')
}

// For use with queries
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}
```

---

## 10. Remove Empty/Stub Files

### Audit Command

```bash
# Find small files that might be stubs
find . -name "*.ts" -o -name "*.tsx" | \
  xargs wc -l | \
  sort -n | \
  head -50
```

### Cleanup Checklist

- [ ] Remove empty test files
- [ ] Remove stub implementations
- [ ] Remove commented-out code blocks
- [ ] Remove unused imports
- [ ] Remove console.log statements

---

## Implementation Order

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| RequirePermission consolidation | High | Low | 1 |
| useUsers.ts removal | High | Medium | 2 |
| Query key centralization | Medium | Low | 3 |
| Error handling consolidation | Medium | Low | 4 |
| Permission exports cleanup | Medium | Low | 5 |
| Environment utils merge | Medium | Medium | 6 |
| Test config consolidation | Low | Medium | 7 |
| Dead code removal | Medium | Low | 8 |
| Route utils consolidation | Low | Medium | 9 |
| Empty file cleanup | Low | Low | 10 |

---

## Verification Checklist

- [ ] All imports updated
- [ ] No duplicate files remain
- [ ] All tests pass after changes
- [ ] No breaking changes to public APIs
- [ ] Documentation updated
- [ ] Type checking passes
- [ ] Lint passes
