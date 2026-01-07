# Web App Reorganization Plan
**Date:** 2025-12-27  
**Scope:** `apps/web/src` organization audit and improvements

## Executive Summary

After a comprehensive audit of `apps/web/src`, we've identified several organizational inconsistencies and opportunities for improvement. This plan addresses duplicated components, empty directories, routing generation issues, and proposes a clearer file organization strategy.

---

## 1. File-to-Use-Case Mapping

### Current Structure

```
apps/web/src/
├── actions/                    # Server actions (redirect, revalidatePath)
├── app/                        # Next.js App Router pages and layouts
│   ├── (auth)/dashboard/      # Protected dashboard routes
│   │   ├── admin/             # ⚠️ EMPTY placeholder directories
│   │   ├── demo/              # Demo/test page
│   │   └── organizations/     # Org management pages
│   ├── (internal)/            # Internal error pages (middleware errors)
│   ├── auth/                  # Auth pages (signin, signup, me, error)
│   ├── build-info/            # Build information page
│   ├── showcase/              # Feature showcase pages
│   ├── serwist/               # PWA service worker routes
│   └── ~offline/              # PWA offline fallback page
├── components/                # React components
│   ├── auth/                  # ⚠️ DUPLICATE: Permission components
│   ├── dashboard/             # Dashboard-specific components
│   ├── devtools/              # TanStack DevTools
│   ├── navigation/            # Main navigation
│   ├── notifications/         # ⚠️ EMPTY directory
│   ├── permissions/           # ⚠️ DUPLICATE: Permission components
│   ├── push-notifications/    # PWA push notifications
│   ├── pwa/                   # PWA install/update prompts
│   └── signout/               # Sign-out button and actions
├── hooks/                     # React Query hooks
│   ├── useAuth.ts
│   ├── useOrganization.ts
│   ├── usePermissions.ts
│   ├── usePushNotifications.ts
│   ├── useUser.orpc-hooks.ts  # ✅ Contract-generated hooks
│   └── useUsers.ts            # ⚠️ Manual hooks (duplication)
├── lib/                       # Core libraries and clients
│   ├── auth/                  # Better Auth client setup
│   │   └── with-session-hydration/  # ✅ Isomorphic session pattern
│   ├── debug/                 # Debug utilities
│   ├── orpc/                  # ✅ ORPC client configuration
│   ├── api-url.ts
│   ├── serwist-client.ts
│   └── utils.ts               # Common utilities (cn, toAbsoluteUrl)
├── middlewares/               # Next.js middleware stack
│   ├── utils/                 # Middleware utilities
│   ├── WithAuth.ts
│   ├── WithEnv.ts
│   ├── WithHeaders.ts
│   ├── WithHealthCheck.tsx
│   └── WithRedirect.ts
├── proxy.ts                   # Middleware composition/export
├── routes/                    # Declarative routing system
│   ├── hooks.ts               # ✅ Typed route hooks
│   ├── index.ts               # ⚠️ Generated with name collisions
│   ├── makeRoute.tsx          # Route factory
│   ├── openapi.ts/template.ts # OpenAPI generation
│   ├── page-wrappers/         # Server/client page wrappers
│   └── utils.ts
├── types/                     # TypeScript definitions
│   └── auth.d.ts
└── utils/                     # ⚠️ Providers should move?
    ├── providers/             # Auth & React Query providers
    ├── useSafeQueryStatesFromZod/  # Query state helpers
    ├── tanstack-query.ts
    └── transformCase.ts
```

---

## 2. Issues Identified

### 🔴 Critical Issues

#### Issue 1: Route Generation Naming Collision
**Location:** `src/routes/index.ts` lines 21-24, 126, 133, 140, 147

**Problem:** Four admin routes all generate the same import name `tempKeyRoute`:
```typescript
import * as tempKeyRoute from "@/app/\(auth\)/dashboard/admin/page.info";
import * as tempKeyRoute from "@/app/\(auth\)/dashboard/admin/organizations/page.info";
import * as tempKeyRoute from "@/app/\(auth\)/dashboard/admin/system/page.info";
import * as tempKeyRoute from "@/app/\(auth\)/dashboard/admin/users/page.info";
```

**Root Cause:** These directories exist but are empty (no `page.info.ts` or `page.tsx` files). The declarative routing generator creates placeholder imports with colliding names.

**Impact:** 
- TypeScript compilation errors (duplicate identifiers)
- Cannot use these routes in components
- Breaks the type-safe routing system

**Solution:** See Section 3.1

---

#### Issue 2: Duplicate Permission Components
**Locations:**
- `src/components/auth/` - Contains `RequirePlatformRole`, `RequireOrganizationRole`, `RequirePermission`
- `src/components/permissions/` - Contains `RequirePlatformRole`, `RequireRole`, `RequirePermission`

**Problem:** Two separate folders export nearly identical permission-checking components with slight naming variations (`RequireOrganizationRole` vs `RequireRole`).

**Impact:**
- Confusion about which to import
- Potential inconsistencies in behavior
- Harder to maintain (changes must be synced)

**Solution:** See Section 3.2

---

#### Issue 3: Hook Strategy Duplication
**Locations:**
- `src/hooks/useUsers.ts` - 400+ lines of manual React Query hooks
- `src/hooks/useUser.orpc-hooks.ts` - Contract-generated hooks with composites

**Problem:** Two competing approaches:
1. **Manual hooks** (`useUsers.ts`): Comprehensive but verbose; requires manual maintenance for each CRUD operation
2. **Contract-generated hooks** (`useUser.orpc-hooks.ts`): Streamlined, standardized, auto-synced with contracts

**Impact:**
- Inconsistent patterns across the codebase
- Maintenance burden (updating both when contracts change)
- New developers unsure which pattern to follow

**Solution:** See Section 3.3

---

### 🟡 Medium Issues

#### Issue 4: Empty `components/notifications/` Directory
**Location:** `src/components/notifications/`

**Status:** Directory exists but contains no files

**Options:**
1. Remove if no longer needed
2. Populate with notification components if planned
3. Document the intended purpose

**Solution:** See Section 3.4

---

#### Issue 5: Providers in `utils/` Directory
**Location:** `src/utils/providers/`

**Problem:** Provider components (`AuthProviders`, `ReactQueryProviders`) are placed under `utils/` which typically contains pure functions and utilities.

**Convention Mismatch:** Providers are React components and would be more discoverable under:
- `src/components/providers/` (component-centric)
- `src/lib/providers/` (library/setup-centric)

**Impact:** Minor organizational inconsistency

**Solution:** See Section 3.5

---

### 🟢 Low-Priority Observations

#### Observation 1: Middleware Composition Pattern
- ✅ Clean middleware stack in `proxy.ts`
- ✅ `WithRedirect` is commented out (intentional?)
- ✅ Middleware utilities are well-organized

#### Observation 2: ORPC Client Setup
- ✅ Excellent isomorphic setup with interceptors
- ✅ Cookie/header injection working correctly
- ✅ 401 redirect handling in place

#### Observation 3: Declarative Routing
- ✅ Type-safe hooks (`usePush`, `useParams`, `useSearchParams`)
- ✅ Conditional exports pattern for page wrappers
- ⚠️ Needs regeneration after fixing admin routes

#### Observation 4: Better Auth Integration
- ✅ Isomorphic session hydration with conditional exports
- ✅ Server/client separation working correctly
- ✅ Actions and components well-structured

---

## 3. Proposed Solutions

### 3.1 Fix Route Generation Naming Collision

**Priority:** 🔴 Critical (blocks type-safety)

**Option A: Create Admin Pages (Recommended)**
If admin pages are planned, create proper page files:

```bash
# Create page.info.ts for each admin route
apps/web/src/app/(auth)/dashboard/admin/page.info.ts
apps/web/src/app/(auth)/dashboard/admin/organizations/page.info.ts
apps/web/src/app/(auth)/dashboard/admin/system/page.info.ts
apps/web/src/app/(auth)/dashboard/admin/users/page.info.ts

# Each with unique route names:
export const Route = {
  name: "DashboardAdmin",           // Main admin
  name: "DashboardAdminOrganizations",  // Admin orgs
  name: "DashboardAdminSystem",      // System settings
  name: "DashboardAdminUsers",       // User management
}
```

**Option B: Remove Empty Directories (Quick Fix)**
If admin pages aren't ready:

```bash
rm -rf apps/web/src/app/\(auth\)/dashboard/admin
```

Then regenerate routes:
```bash
bun run web -- dr:build
```

**Recommendation:** Choose Option B now (cleanup), then implement Option A when admin features are ready.

---

### 3.2 Consolidate Permission Components

**Priority:** 🔴 Critical (reduces confusion)

**Strategy:** Merge into single canonical location

**Step 1: Choose canonical location**
- **Recommended:** Keep `src/components/permissions/` as the single source of truth
- Rationale: More semantically clear than `auth/` (which should focus on auth forms/flows)

**Step 2: Unify component names**
Create a single set of components with clear, consistent names:

```typescript
// src/components/permissions/index.ts
export { RequirePlatformRole } from './RequirePlatformRole'
export { RequireOrganizationRole } from './RequireRole'  // Rename for clarity
export { RequirePermission } from './RequirePermission'

// Optional: Provide backward-compatible aliases
export { RequireOrganizationRole as RequireRole }  // Alias
```

**Step 3: Remove `src/components/auth/` permission files**
- Delete `RequirePlatformRole.tsx`, `RequireOrganizationRole.tsx`, `RequirePermission.tsx`
- Keep only authentication-specific components in `components/auth/` if any exist

**Step 4: Update imports**
Use codemod or manual find-replace:
```typescript
// Before
import { RequirePermission } from '@/components/auth'

// After
import { RequirePermission } from '@/components/permissions'
```

**Validation:**
```bash
bun run web -- type-check
bun run web -- lint
bun run web -- test
```

---

### 3.3 Decide Hook Strategy Consolidation

**Priority:** 🔴 Critical (establishes pattern)

**Analysis:**

| Aspect | Manual (`useUsers.ts`) | Generated (`useUser.orpc-hooks.ts`) |
|--------|------------------------|-------------------------------------|
| **Lines of code** | 400+ | ~150 (including composites) |
| **Maintenance** | Manual updates needed | Auto-synced with contracts |
| **Consistency** | Custom per-hook | Standardized patterns |
| **Features** | Rich (infinite, prefetch) | Composites + standard operations |
| **Learning curve** | Higher (custom patterns) | Lower (consistent structure) |

**Recommendation:** Adopt contract-generated hooks as the standard pattern

**Migration Strategy:**

**Phase 1: Deprecate Manual Hooks**
1. Add deprecation notice to `useUsers.ts`:
```typescript
/**
 * @deprecated Use contract-generated hooks from useUser.orpc-hooks.ts instead
 * This file will be removed in a future version.
 */
```

2. Update documentation to reference new pattern

**Phase 2: Create Migration Guide**
Document how to migrate from manual to generated hooks:

```typescript
// Before (manual)
import { useUsers, useCreateUser } from '@/hooks/useUsers'

// After (generated)
import { userHooks } from '@/hooks/useUser.orpc-hooks'
const { useList, useCreate } = userHooks
```

**Phase 3: Gradual Migration**
- New features: Use only generated hooks
- Existing features: Migrate opportunistically during changes
- Remove `useUsers.ts` once all usages are migrated (can take multiple sprints)

**Additional Work:**
If manual hooks provide features missing from generated ones (e.g., specialized prefetch patterns), extend the hook generator or create thin wrapper utilities.

---

### 3.4 Handle Empty `notifications/` Directory

**Priority:** 🟡 Medium (cleanup)

**Option A: Remove Empty Directory**
```bash
rm -rf apps/web/src/components/notifications
```
- Simplest solution
- Remove if no immediate plans

**Option B: Create Placeholder Structure**
If notifications are planned:
```typescript
// src/components/notifications/index.ts
export { NotificationCenter } from './NotificationCenter'
export { NotificationBadge } from './NotificationBadge'
export { useNotifications } from './useNotifications'
```

**Recommendation:** Option A (remove) unless notifications are actively planned

---

### 3.5 Move Providers to More Logical Location

**Priority:** 🟡 Medium (organization)

**Current:** `src/utils/providers/`

**Proposed:** Move to `src/components/providers/`

**Rationale:**
- Providers are React components, not utilities
- More discoverable alongside other components
- Aligns with common Next.js patterns

**Migration Steps:**

1. Move files:
```bash
mv apps/web/src/utils/providers apps/web/src/components/providers
```

2. Update imports:
```typescript
// Before
import { ReactQueryProviders } from '@/utils/providers/ReactQueryProviders'

// After
import { ReactQueryProviders } from '@/components/providers/ReactQueryProviders'
```

3. Update any path aliases if needed

**Alternative:** Keep in `src/lib/providers/` if you consider them more "setup/config" than "UI components"

---

## 4. Implementation Roadmap

### Phase 1: Critical Fixes (Immediate)
**Goal:** Restore type-safety and reduce confusion

- [ ] **Task 1.1:** Remove empty admin directories
  ```bash
  rm -rf apps/web/src/app/\(auth\)/dashboard/admin
  ```

- [ ] **Task 1.2:** Regenerate routes
  ```bash
  bun run web -- dr:build
  ```

- [ ] **Task 1.3:** Verify no TypeScript errors
  ```bash
  bun run web -- type-check
  ```

- [ ] **Task 1.4:** Consolidate permission components
  - Merge `components/auth/` and `components/permissions/`
  - Update all imports
  - Run tests

- [ ] **Task 1.5:** Add deprecation notice to `useUsers.ts`
  - Document migration path
  - Update relevant docs

**Time Estimate:** 2-3 hours

---

### Phase 2: Organization Improvements (Short-term)
**Goal:** Clean up structure

- [ ] **Task 2.1:** Remove empty `components/notifications/` directory

- [ ] **Task 2.2:** Move providers to `components/providers/`
  - Update imports
  - Test builds

- [ ] **Task 2.3:** Create migration guide for hooks pattern
  - Document contract-generated hooks usage
  - Provide examples

**Time Estimate:** 2-4 hours

---

### Phase 3: Long-term Migration (Ongoing)
**Goal:** Establish new patterns

- [ ] **Task 3.1:** Migrate existing components from manual to generated hooks
  - Update component by component
  - Test each migration

- [ ] **Task 3.2:** Remove `useUsers.ts` once all migrations complete

- [ ] **Task 3.3:** Create admin pages when ready
  - Add proper `page.info.ts` files
  - Implement admin UI

**Time Estimate:** Ongoing (multiple sprints)

---

## 5. Validation Checklist

After each phase, run:

```bash
# Type checking
bun run web -- type-check

# Linting
bun run web -- lint

# Tests
bun run web -- test

# Route generation
bun run web -- dr:build

# Build test
bun run web -- build
```

---

## 6. Risks and Mitigations

### Risk 1: Breaking Changes During Migration
**Mitigation:**
- Keep deprecated `useUsers.ts` until all usages are migrated
- Use deprecation warnings, not immediate removal
- Test each component migration individually

### Risk 2: Route Generation Issues
**Mitigation:**
- Backup `src/routes/index.ts` before regeneration
- Verify all route names are unique before running `dr:build`
- Test critical routing flows after changes

### Risk 3: Import Path Changes
**Mitigation:**
- Use search-and-replace with verification
- Run type-check after each batch of import updates
- Consider using codemods for large-scale refactors

---

## 7. Documentation Updates Required

After completing changes, update:

1. **README.md** - Reflect new hook patterns
2. **Developer Guide** - Document permission component usage
3. **Architecture Docs** - Update component organization diagrams
4. **Migration Guide** - Provide examples for hook pattern transition

---

## 8. Next Steps

**Immediate Actions (Today):**
1. Get approval for this plan
2. Execute Phase 1 (Critical Fixes)
3. Run validation checklist
4. Update memory bank with outcomes

**Follow-up Actions (This Week):**
1. Execute Phase 2 (Organization Improvements)
2. Create migration guide document
3. Begin planning Phase 3 gradual migration

---

## Appendix A: File Move Commands

### Consolidate Permission Components
```bash
# Keep permissions/ as canonical location
# Remove duplicate files from auth/
rm apps/web/src/components/auth/RequirePlatformRole.tsx
rm apps/web/src/components/auth/RequireOrganizationRole.tsx
rm apps/web/src/components/auth/RequirePermission.tsx
rm apps/web/src/components/auth/index.ts

# Update permissions/index.ts with unified exports
```

### Move Providers
```bash
# Create new location
mkdir -p apps/web/src/components/providers

# Move provider files
mv apps/web/src/utils/providers/* apps/web/src/components/providers/

# Remove old directory
rmdir apps/web/src/utils/providers
```

---

## Appendix B: Import Update Patterns

### Permission Components
```bash
# Find all imports
grep -r "from '@/components/auth'" apps/web/src

# Replace pattern
# Before: import { RequirePermission } from '@/components/auth'
# After:  import { RequirePermission } from '@/components/permissions'
```

### Providers
```bash
# Find all imports
grep -r "from '@/utils/providers" apps/web/src

# Replace pattern
# Before: import { ReactQueryProviders } from '@/utils/providers/ReactQueryProviders'
# After:  import { ReactQueryProviders } from '@/components/providers/ReactQueryProviders'
```

---

**Document Status:** Draft for Review  
**Next Review:** After Phase 1 completion
