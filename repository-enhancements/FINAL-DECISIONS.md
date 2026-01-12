````markdown
# Final Enhancement Decisions

> **Decision Date:** January 2026  
> **Status:** Approved by repository owner

This document records the final decisions made for each enhancement area.

---

## Decision Summary Table

| # | Topic | Decision |
|---|-------|----------|
| 1 | Zod test fix | Update imports to `zod/v4` |
| 2 | Deprecated useUsers.ts | Remove completely, migrate to ORPC hooks |
| 3 | Duplicate RequirePermission | Merge both into `@repo/auth-utils` package |
| 4 | Production logging | Create shared **Pino** logger package (NestJS-compatible) |
| 5 | useInvitation | Two types: App invitations via Better Auth plugin, Org invitations via built-in |
| 6 | Permission system | Keep dual-layer + add `usePermissions()` convenience hook |
| 7 | ORPC hook generation | **Runtime hook factory** (no code generation) |
| 8 | Query key management | **Per-domain files** that reuse ORPC-generated keys |
| 9 | Query config (staleTime) | **Centralized config + per-domain extends it** |
| 10 | Error boundaries | **Granular** (ErrorBoundary, QueryErrorBoundary, FeatureErrorBoundary) |
| 11 | Package structure | **Full reorganization** to new structure |
| 12 | State management | **nuqs for URL state** + TanStack Query + React state |
| 13 | UI components | DataTable, EmptyState, ErrorState, LoadingState, ConfirmDialog |
| 14 | Error handling | **Per-domain error handling** |
| 15 | Dev scripts | **Keep current** (no changes) |
| 16 | Bin/Codegen location | Move `packages/bin` → `tools/bin` |

---

## Detailed Decisions

### 1. Zod Test Fix
**Decision:** Update imports to `zod/v4`

Change all affected files from:
```typescript
import { z } from 'zod'
```
To:
```typescript
import { z } from 'zod/v4'
```

---

### 2. Deprecated useUsers.ts
**Decision:** Remove completely

- Delete `apps/web/src/hooks/useUsers.ts` (632 lines)
- Migrate any remaining usages to ORPC-generated hooks
- Update all imports across the codebase

---

### 3. RequirePermission Consolidation
**Decision:** Merge into `@repo/auth-utils` package

- Combine features from both implementations:
  - `apps/web/src/components/permissions/RequirePermission.tsx` (227 lines)
  - `apps/web/src/components/auth/RequirePermission.tsx` (174 lines)
- Create unified component in `packages/utils/auth/src/components/RequirePermission.tsx`
- Export from package, delete duplicates from web app

---

### 4. Logging Solution
**Decision:** Pino logger package

Create `packages/utils/logger/` with:
- **Pino** as the logging library
- **pino-pretty** for dev environment
- **nestjs-pino** integration for NestJS
- Shared across web, api, and all packages

Structure:
```
packages/utils/logger/
├── src/
│   ├── index.ts        # Main export
│   ├── pino.ts         # Pino instance configuration
│   └── nestjs.ts       # NestJS LoggerModule export
├── package.json
└── tsconfig.json
```

---

### 5. Invitation System
**Decision:** Two invitation types via Better Auth

1. **App-level invitations** (invite to create account)
   - Implemented as Better Auth plugin in `packages/utils/auth`
   - Self-contained, exportable plugin
   - No separate ORPC endpoints

2. **Organization invitations** (invite existing user to org)
   - Use built-in Better Auth organization plugin
   - Already functional

Update `useInvitation.ts` to handle both types with clear API.

---

### 6. Permission System
**Decision:** Keep dual-layer + add convenience hook

- **Keep** platform roles (`superAdmin`, `admin`, `user`)
- **Keep** organization roles (`owner`, `admin`, `member`)
- **Add** `usePermissions()` hook that exposes both:

```typescript
const { platform, organization } = usePermissions()
platform.can('user:read')
organization.can('member:invite')
```

---

### 7. ORPC Hook Generation
**Decision:** Runtime hook factory (no code generation)

Replace code generation with runtime factory:
```typescript
const hooks = createTypedHooks(orpcClient)
// hooks.useQuery, hooks.useMutation with type inference
```

Benefits:
- No generated files to maintain
- Instant type updates when contracts change
- Simpler DX

---

### 8. Query Key Management
**Decision:** Per-domain files reusing ORPC keys

Create per-domain key files that **reuse ORPC-generated keys** when available:

```
apps/web/src/lib/query/keys/
├── index.ts          # Re-exports all
├── user.keys.ts      # Uses orpc.user.*.key
├── org.keys.ts       # Uses orpc.org.*.key
└── admin.keys.ts     # Uses orpc.admin.*.key
```

For ORPC calls, use the native ORPC query keys. Only create custom keys for non-ORPC queries.

---

### 9. Query Configuration
**Decision:** Centralized + per-domain extends

**Centralized base config:**
```typescript
// apps/web/src/lib/query/config.ts
export const QUERY_CONFIG = {
  STALE_TIME: { FAST: 30_000, DEFAULT: 120_000, SLOW: 300_000 },
  GC_TIME: { SHORT: 300_000, DEFAULT: 600_000, LONG: 1800_000 },
}
```

**Per-domain extends:**
```typescript
// apps/web/src/lib/query/config/user.config.ts
import { QUERY_CONFIG } from '../config'

export const userQueryConfig = {
  profile: { staleTime: QUERY_CONFIG.STALE_TIME.SLOW },
  list: { staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT },
}
```

---

### 10. Error Boundaries
**Decision:** Granular error boundaries

Create three levels:
1. **ErrorBoundary** - Base component for any error
2. **QueryErrorBoundary** - TanStack Query specific with reset
3. **FeatureErrorBoundary** - Per-feature with logging

Location: `apps/web/src/components/error/`

---

### 11. Package Structure
**Decision:** Full reorganization

**New structure:**
```
packages/
├── core/
│   ├── types/           # From packages/types
│   ├── contracts/       # From packages/contracts/api
│   └── utils/           # Core shared utilities
├── ui/
│   └── components/      # From packages/ui/base
├── auth/
│   └── utils/           # From packages/utils/auth
├── data/
│   ├── orpc/            # From packages/utils/orpc
│   └── query/           # TanStack Query utilities
├── tooling/
│   ├── eslint/          # From packages/configs/eslint
│   ├── prettier/        # From packages/configs/prettier
│   ├── typescript/      # From packages/configs/typescript
│   ├── vitest/          # From packages/configs/vitest
│   └── tailwind/        # From packages/configs/tailwind

tools/
├── bin/
│   ├── declarative-routing/  # From packages/bin/declarative-routing
│   └── runthenkill/          # From packages/bin/runthenkill
```

---

### 12. State Management
**Decision:** nuqs + TanStack Query + React state

- **Server state:** TanStack Query (already in use)
- **URL state:** nuqs for shareable/bookmarkable state
- **UI state:** React useState/useReducer for local component state

No additional state library (Zustand, Jotai) needed.

---

### 13. UI Components to Add
**Decision:** 5 components

| Component | Purpose | Location |
|-----------|---------|----------|
| DataTable | Full-featured table with sorting/filtering/pagination | `packages/ui/components` |
| EmptyState | "No results" / "No data" displays | `packages/ui/components` |
| ErrorState | Error display with retry button | `packages/ui/components` |
| LoadingState | Consistent loading spinners/skeletons | `packages/ui/components` |
| ConfirmDialog | Confirmation modal with async support | `packages/ui/components` |

**NOT adding:** PageHeader, StatCard, SearchInput, CopyButton

---

### 14. Error Handling
**Decision:** Per-domain error handling

Each domain handles its own errors with domain-specific logic:
- `apps/web/src/lib/errors/user.errors.ts`
- `apps/web/src/lib/errors/org.errors.ts`
- `apps/web/src/lib/errors/admin.errors.ts`

---

### 15. Development Scripts
**Decision:** Keep current

No new convenience scripts needed. Current setup is sufficient.

---

### 16. Tools Location
**Decision:** Move bins to /tools

- Move `packages/bin/declarative-routing` → `tools/bin/declarative-routing`
- Move `packages/bin/runthenkill` → `tools/bin/runthenkill`
- Future codegen tools go to `tools/codegen/`

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. Fix Zod imports to `zod/v4`
2. Remove deprecated `useUsers.ts`
3. Merge RequirePermission into `@repo/auth-utils`

### Phase 2: Infrastructure (Week 2)
1. Create Pino logger package
2. Add granular error boundaries
3. Implement runtime hook factory

### Phase 3: Reorganization (Week 3)
1. Full package structure reorganization
2. Move bins to `/tools`
3. Update all imports

### Phase 4: Features (Week 4)
1. Add 5 UI components
2. Implement per-domain query keys
3. Add nuqs for URL state
4. Complete invitation plugin in auth package

### Phase 5: Polish (Week 5)
1. Add `usePermissions()` convenience hook
2. Per-domain error handling
3. Query config centralization
4. Documentation updates

---

## Tracking

- [ ] Zod v4 imports updated
- [ ] useUsers.ts removed
- [ ] RequirePermission merged to auth-utils
- [ ] Pino logger package created
- [ ] Invitation plugin completed
- [ ] usePermissions() hook added
- [ ] Runtime hook factory implemented
- [ ] Per-domain query keys created
- [ ] Query config centralized
- [ ] Error boundaries added
- [ ] Package structure reorganized
- [ ] nuqs integrated
- [ ] UI components added (5)
- [ ] Per-domain error handling
- [ ] Tools directory created

````