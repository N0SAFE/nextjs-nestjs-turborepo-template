# Centralized Query Configuration

> **Phase 2, Task 2.1**: Query timing and caching configuration system for React Query hooks.

## Overview

This centralized configuration system provides consistent query timing, caching, retry logic, and pagination settings across all ORPC hooks. Instead of hardcoding timing values in each hook, we now use domain-specific configuration objects that extend a shared base configuration.

## Architecture

```
apps/web/src/lib/query/
├── config.ts           # Base configuration (timing tiers, retry, pagination)
├── user-config.ts      # User domain-specific config
├── org-config.ts       # Organization domain-specific config
├── admin-config.ts     # Admin domain-specific config
└── index.ts            # Barrel exports
```

### Configuration Hierarchy

```
Base Config (config.ts)
├── STALE_TIME tiers (FAST/DEFAULT/SLOW/STATIC)
├── GC_TIME tiers (SHORT/DEFAULT/LONG)
├── RETRY logic (count, delay, exponential backoff)
└── PAGINATION defaults

Domain Configs extend Base Config
├── USER_LIST_OPTIONS extends base with user-specific timing
├── ORG_INVITATIONS_OPTIONS extends base with org-specific timing
└── ADMIN_STATS_OPTIONS extends base with admin-specific timing
```

## Base Configuration

### Timing Tiers

**Stale Time** (how long data stays "fresh"):
- `FAST`: 30 seconds - Frequently accessed, time-sensitive data
- `DEFAULT`: 2 minutes - Standard data that changes moderately
- `SLOW`: 5 minutes - Rarely changing data
- `STATIC`: 30 minutes - Reference data that almost never changes

**Garbage Collection Time** (how long data stays in cache):
- `SHORT`: 5 minutes - Quick cleanup for transient data
- `DEFAULT`: 10 minutes - Standard cache retention
- `LONG`: 30 minutes - Extended cache for stable data

### Retry Configuration

```typescript
RETRY: {
  COUNT: 3,                    // Number of retry attempts
  DELAY: 1000,                 // Base delay in milliseconds
  EXPONENTIAL_BACKOFF: true    // Use exponential backoff
}
```

Retry delays: 1s → 2s → 4s

### Pagination

```typescript
PAGINATION: {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
}
```

## Domain-Specific Configurations

### User Domain (`user-config.ts`)

```typescript
import { USER_LIST_OPTIONS, USER_DETAIL_OPTIONS, USER_PAGINATION } from '@/lib/query'

// User list - frequently accessed
const users = useQuery({
  ...USER_LIST_OPTIONS,        // FAST stale (30s), SHORT gc (5m)
  pagination: { pageSize: USER_PAGINATION.PAGE_SIZE } // 20
})

// User detail - moderately accessed
const user = useQuery({
  ...USER_DETAIL_OPTIONS,      // DEFAULT stale (2m), DEFAULT gc (10m)
})

// Current user - very frequently accessed
const me = useQuery({
  ...CURRENT_USER_OPTIONS,     // FAST stale (30s), SHORT gc (5m)
})

// User permissions - rarely changes
const permissions = useQuery({
  ...USER_PERMISSIONS_OPTIONS, // SLOW stale (5m), LONG gc (30m)
})
```

### Organization Domain (`org-config.ts`)

```typescript
import { ORG_MEMBERS_OPTIONS, ORG_INVITATIONS_OPTIONS, ORG_PAGINATION } from '@/lib/query'

// Organization members
const members = useQuery({
  ...ORG_MEMBERS_OPTIONS,      // DEFAULT stale (2m), DEFAULT gc (10m)
  pagination: { pageSize: ORG_PAGINATION.MEMBERS_PAGE_SIZE } // 15
})

// Organization invitations - time-sensitive
const invitations = useQuery({
  ...ORG_INVITATIONS_OPTIONS,  // FAST stale (30s), SHORT gc (5m)
  pagination: { pageSize: ORG_PAGINATION.INVITATIONS_PAGE_SIZE } // 10
})

// Organization roles - static reference data
const roles = useQuery({
  ...ORG_ROLES_OPTIONS,        // STATIC stale (30m), LONG gc (30m)
})
```

### Admin Domain (`admin-config.ts`)

```typescript
import { ADMIN_STATS_OPTIONS, ADMIN_AUDIT_OPTIONS, ADMIN_PAGINATION } from '@/lib/query'

// Admin dashboard stats - real-time monitoring
const stats = useQuery({
  ...ADMIN_STATS_OPTIONS,      // FAST stale (30s), SHORT gc (5m)
})

// Audit logs - moderately changing
const auditLogs = useQuery({
  ...ADMIN_AUDIT_OPTIONS,      // DEFAULT stale (2m), DEFAULT gc (10m)
  pagination: { pageSize: ADMIN_PAGINATION.AUDIT_PAGE_SIZE } // 50
})

// Admin system health - real-time
const health = useQuery({
  ...ADMIN_HEALTH_OPTIONS,     // FAST stale (30s), SHORT gc (5m)
})

// Platform permissions - static reference
const permissions = useQuery({
  ...ADMIN_PERMISSIONS_OPTIONS, // STATIC stale (30m), LONG gc (30m)
})
```

## Migration Guide

### Before (Hardcoded Values)

```typescript
// In useUser.ts hook
export function useUserList() {
  return useQuery(orpc.user.list.queryOptions({
    input: {},
    staleTime: 1000 * 60,        // Hardcoded 1 minute
    gcTime: 1000 * 60 * 5,       // Hardcoded 5 minutes
  }))
}

export function useUser(userId: string) {
  return useQuery(orpc.user.findById.queryOptions({
    input: { id: userId },
    staleTime: 1000 * 60,        // Hardcoded 1 minute
    gcTime: 1000 * 60 * 5,       // Hardcoded 5 minutes
  }))
}
```

### After (Centralized Config)

```typescript
// In useUser.ts hook
import { USER_LIST_OPTIONS, USER_DETAIL_OPTIONS } from '@/lib/query'

export function useUserList() {
  return useQuery(orpc.user.list.queryOptions({
    input: {},
    ...USER_LIST_OPTIONS,        // FAST stale (30s), SHORT gc (5m)
  }))
}

export function useUser(userId: string) {
  return useQuery(orpc.user.findById.queryOptions({
    input: { id: userId },
    ...USER_DETAIL_OPTIONS,      // DEFAULT stale (2m), DEFAULT gc (10m)
  }))
}
```

## Benefits

### 1. **Consistency**
All hooks use the same timing tiers and retry logic. No more inconsistent hardcoded values across the codebase.

### 2. **Maintainability**
Change timing strategy in one place (domain config) instead of updating multiple hooks.

### 3. **Discoverability**
Clear naming makes it obvious which timing tier to use:
- `USER_LIST_OPTIONS` → "Ah, this is for user lists"
- `ORG_INVITATIONS_OPTIONS` → "This is for time-sensitive invitations"
- `ADMIN_STATS_OPTIONS` → "This is for real-time admin stats"

### 4. **Performance**
Optimized timing per data type:
- Frequently accessed data: FAST stale times
- Rarely changing data: SLOW/STATIC stale times
- Balanced cache retention: SHORT/DEFAULT/LONG gc times

### 5. **Type Safety**
TypeScript ensures correct configuration usage:
```typescript
type StaleTimeKey = 'FAST' | 'DEFAULT' | 'SLOW' | 'STATIC'
type GcTimeKey = 'SHORT' | 'DEFAULT' | 'LONG'
```

## Best Practices

### 1. Choose Appropriate Timing Tier

**FAST (30s stale)**: Use for frequently accessed, time-sensitive data
- Current user info
- Live dashboards
- Real-time stats
- Active sessions

**DEFAULT (2m stale)**: Use for standard data that changes moderately
- User lists
- Organization details
- Member lists
- Profile information

**SLOW (5m stale)**: Use for rarely changing data
- User permissions
- Organization settings
- Analytics data
- Historical stats

**STATIC (30m stale)**: Use for reference data that almost never changes
- Role definitions
- Permission definitions
- System constants
- Configuration options

### 2. Match GC Time to Usage Pattern

**SHORT (5m gc)**: Transient data that won't be needed again soon
- Search results
- Temporary filters
- Quick actions

**DEFAULT (10m gc)**: Standard cache retention for moderate reuse
- User lists
- Organization data
- Most queries

**LONG (30m gc)**: Extended cache for stable, reusable data
- Permissions
- Settings
- Reference data

### 3. Domain-Specific Pagination

Use domain pagination constants instead of hardcoded values:
```typescript
// ✅ Good - uses domain constant
pagination: { pageSize: USER_PAGINATION.PAGE_SIZE }

// ❌ Bad - hardcoded value
pagination: { pageSize: 20 }
```

### 4. Consistent Retry Logic

All queries use the same retry configuration:
- 3 attempts
- Exponential backoff (1s → 2s → 4s)
- Automatic handling of transient errors

## Testing

All configuration files pass type-checking:
```bash
bun run web -- type-check
```

Configuration is pure TypeScript objects - no runtime dependencies, so unit tests are not required.

## Future Enhancements

### 1. Environment-Specific Timing
```typescript
// Development: shorter stale times for testing
// Production: longer stale times for performance
const STALE_TIME = process.env.NODE_ENV === 'development'
  ? { FAST: 10_000, DEFAULT: 30_000, ... }
  : { FAST: 30_000, DEFAULT: 120_000, ... }
```

### 2. Dynamic Configuration
```typescript
// Load timing from remote config
const remoteConfig = await fetchQueryConfig()
export const STALE_TIME = remoteConfig.staleTimes
```

### 3. Per-Hook Overrides
```typescript
// Allow hook-specific overrides while maintaining defaults
export function useUserList(options?: { staleTime?: number }) {
  return useQuery({
    ...USER_LIST_OPTIONS,
    staleTime: options?.staleTime ?? USER_LIST_OPTIONS.staleTime
  })
}
```

## Related Documentation

- [ORPC Client Hooks Pattern](../../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md) - Hook structure and organization
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview) - TanStack Query fundamentals
- [TODO.md Phase 2](../../../repository-enhancements/TODO.md) - Full DX improvement roadmap

## Implementation Status

✅ **Task 2.1 COMPLETE** - Centralized Query Configuration
- ✅ Base configuration (`config.ts`) - Timing tiers, retry, pagination
- ✅ User domain config (`user-config.ts`) - 5 query options
- ✅ Organization domain config (`org-config.ts`) - 7 query options
- ✅ Admin domain config (`admin-config.ts`) - 7 query options
- ✅ Barrel exports (`index.ts`) - Convenient imports
- ✅ Type-checking passes
- 🔲 Update existing hooks to use new configs (Next step)

**Next Steps**:
1. Identify all hooks with hardcoded timing values
2. Replace with domain-specific config imports
3. Verify behavior remains consistent
4. Mark Task 2.1 as complete in TODO.md
5. Move to Task 2.2: Hook Wrapper Generator Script
