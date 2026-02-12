# Implementation TODO List

> Complete task list for all repository enhancements, ordered by priority and dependencies.
> Each task links to its source documentation for full context.

---

## Phase 1: Critical Fixes (Blocking Issues)

> 📄 Source: [01-CRITICAL-FIXES.md](enhancements/01-CRITICAL-FIXES.md)

### 1.1 Fix Zod v4 Test Failures ✅ COMPLETE
> 📍 Context: [01-CRITICAL-FIXES.md#L7-L60](enhancements/01-CRITICAL-FIXES.md#L7-L60)

**Problem**: 45/54 tests failing due to Zod 4 import issue - `z.object` is undefined in Vitest

**Solution**: Use `zod/v4` explicit import

- [x] Update `packages/utils/orpc/src/hooks/__tests__/generate-hooks.test.ts` to use `import { z } from 'zod/v4'`
- [x] Update `packages/utils/orpc/vitest.config.ts` if needed
 - [x] Search all files: `grep -r "from 'zod'" packages/utils/orpc/`
 - [x] Update any other files in `packages/utils/orpc/` importing Zod (4 files patched)
 - [x] Run tests: `cd packages/utils/orpc && bun run test`
 - [x] Verify: all ORPC package tests passing (345/345 tests ✅)

### 1.2 Remove Deprecated useUsers.ts ✅ COMPLETE
> 📍 Context: [01-CRITICAL-FIXES.md#L62-L116](enhancements/01-CRITICAL-FIXES.md#L62-L116)

**Problem**: 632-line deprecated file still exists with duplicate functionality

**Solution**: Complete removal after migrating to ORPC hooks

**COMPLETED**: 
- ✅ Enhanced ORPC hooks generator with queryKeys export
- ✅ Added TypeScript types for queryKeys registry
- ✅ Unified pattern with Better Auth hooks (useAdmin, useOrganization)
- ✅ Comprehensive documentation in [docs/UNIFIED-HOOK-PATTERN.md](../docs/UNIFIED-HOOK-PATTERN.md)
- ✅ Updated system/page.tsx to use generated hooks
- ✅ useUsers.ts file already deleted (no remaining references)
- ✅ All 358 ORPC package tests passing
- ✅ Web app type-check successful

**Key Changes Made**:
- Updated `packages/utils/orpc/src/hooks/generate-hooks.ts`:
  - Added `baseKey` option to `RouterHooksOptions` type
  - Added `queryKeys` property to `RouterHooks` return type with typed query key factories
  - Generate query keys for each query procedure: `queryKeys.{procedureName}(input)`
  - Export `queryKeys.all` as base key for domain-wide invalidation
- Updated `apps/web/src/hooks/useUser.orpc-hooks.ts`:
  - Exported `userQueryKeys` from generated hooks
  - Added comprehensive documentation showing Better Auth style usage
- Updated `apps/web/src/app/dashboard/admin/system/page.tsx`:
  - Replaced direct ORPC usage with generated hooks
  - Added example of queryKeys usage in comments

### 1.3 Consolidate RequirePermission into @repo/auth-utils ✅ COMPLETE
> 📍 Context: [01-CRITICAL-FIXES.md#L118-L180](enhancements/01-CRITICAL-FIXES.md#L118-L180)

**Problem**: Two implementations exist with inconsistent behavior

**Solution**: Merge into `@repo/auth-utils` package

**COMPLETED**:
- ✅ Created factory-based permission hooks in `packages/utils/auth/src/react/usePermissions.ts`
- ✅ Created factory-based permission components in `packages/utils/auth/src/react/RequirePermission.tsx`
- ✅ Exported types from `packages/utils/auth/src/react/index.ts`
- ✅ Created `apps/web/src/lib/permissions.ts` to instantiate factories with app-specific dependencies
- ✅ Created session adapter to convert Better Auth session to expected format
- ✅ Updated `RequirePlatformRole.tsx` and `RequireRole.tsx` to use new imports
- ✅ Removed old implementations: `apps/web/src/components/auth/RequirePermission.tsx` and `apps/web/src/components/permissions/RequirePermission.tsx`
- ✅ Removed old hooks: `apps/web/src/hooks/usePermissions.ts`
- ✅ Updated component exports in `apps/web/src/components/auth/index.ts`
- ✅ Auth package type-check successful
- ✅ Web app type-check successful

**Key Changes Made**:
- Implemented factory pattern: `createPermissionHooks()` and `createRequirePermissionComponents()`
- Adapter pattern for Better Auth session compatibility with `UseSessionResult` interface
- Type exports: `PlatformRole`, `OrganizationRole` from `@repo/auth`, `PlatformPermission`, `OrganizationPermission` from `@repo/auth/react`
- All permission checking logic now centralized in `@repo/auth` package
- App-specific instantiation in `apps/web/src/lib/permissions.ts` with authClient and useOrganizationMembers dependencies

### 1.4 Fix Production Console Logging ✅ COMPLETE
> 📍 Context: [01-CRITICAL-FIXES.md#L182-L212](enhancements/01-CRITICAL-FIXES.md#L182-L212)

**Problem**: Debug logs in production ORPC client expose request details

**Solution**: Replace with Pino logger (see Phase 2.2)

**COMPLETED**:
- ✅ Created `@repo/logger` package with Pino (Task 2.2)
  - All log levels: trace, debug, info, warn, error, fatal
  - Child loggers with context binding
  - Sensitive data redaction (passwords, tokens, secrets)
  - Error serialization with stack traces
  - Environment-based pretty printing (dev) vs JSON (prod)
- ✅ Replaced 5 console.log calls in `apps/web/src/lib/orpc/index.ts` with logger
- ✅ Added `@repo/logger` dependency to web app
- ✅ Type-check successful

**Remaining console.log calls** (non-critical, can be addressed incrementally):
- Middleware logs (WithAuth.ts) - 12 calls (development debugging)
- Session hydration logs (SessionHydrationProvider.tsx) - 9 calls (development)
- Auth cookie logs (cookie-session.ts) - 13 calls (development)
- Timing logs (client.tsx) - 2 calls (development)
- API entrypoint logs (entrypoint.prod.ts) - production startup logs
- Config warnings (next.config.ts) - 1 call (build time)

### 1.5 Implement Dual Invitation System
> 📍 Context: [01-CRITICAL-FIXES.md#L214-L290](enhancements/01-CRITICAL-FIXES.md#L214-L290)

**Problem**: Better Auth doesn't provide global listInvitations - need two types of invites

**Why Dual System**: 
### 1.5 Implement Dual Invitation System ✅ COMPLETE
> 📍 Context: [01-CRITICAL-FIXES.md#L214-L290](enhancements/01-CRITICAL-FIXES.md#L214-L290)

**Problem**: Better Auth doesn't provide global listInvitations - need two types of invites

**Why Dual System**: 
- App invitations = invite NEW users to platform (custom plugin)
- Org invitations = invite EXISTING users to org (built-in plugin)

**COMPLETED**:
- ✅ Platform invitations (custom plugin) fully implemented in `packages/utils/auth/src/server/plugins/invite.ts`
  - `create` - Create platform invitation with email and role
  - `list` - List platform invitations with status filter (pending/used/expired)
  - `check` - Check invitation token validity
  - `validate` - Validate invitation and create user account
- ✅ Organization invitations (built-in Better Auth org plugin) configured in `packages/utils/auth/src/server/plugins/index.ts`
  - `acceptInvitation` - Join organization
  - `rejectInvitation` - Decline organization invitation
  - `cancelInvitation` - Revoke sent organization invitation
- ✅ Client hooks implemented in `apps/web/src/hooks/useInvitation.ts`
  - Platform hooks: `useListPlatformInvitations`, `useCreatePlatformInvitation`, `useCheckInvitation`, `useValidateInvitation`
  - Organization hooks: `useAcceptInvitation`, `useRejectInvitation`, `useCancelInvitation`
- ✅ Documentation clarified explaining why organization invitation listing is not globally available
  - Better Auth organization plugin requires per-organization invitation fetching
  - Documented the approach for future admin views (fetch all orgs → fetch invitations per org → merge)

**Architectural Decision**:
- Better Auth's organization plugin does not provide global invitation listing by design
- Organization invitations are scoped to individual organizations
- For admin views requiring all invitations, implement: fetch orgs → fetch per-org invitations → aggregate
- Current placeholder hooks return empty arrays with clear documentation for future implementation

---

## Phase 2: Developer Experience (DX)

> 📄 Source: [02-DX-IMPROVEMENTS.md](enhancements/02-DX-IMPROVEMENTS.md)

### 2.1 Centralized Query Configuration ✅ COMPLETE
> 📍 Context: [02-DX-IMPROVEMENTS.md#L32-L98](enhancements/02-DX-IMPROVEMENTS.md#L32-L98)

**Why**: Centralized base + per-domain extends for DRY config with domain flexibility

**COMPLETED**:
- ✅ Created `apps/web/src/lib/query/config.ts` with base config:
  - STALE_TIME tiers: FAST (30s), DEFAULT (2m), SLOW (5m), STATIC (30m)
  - GC_TIME tiers: SHORT (5m), DEFAULT (10m), LONG (30m)
  - RETRY config: 3 attempts, 1s delay, exponential backoff
  - PAGINATION: DEFAULT_PAGE_SIZE (20), MAX_PAGE_SIZE (100)
  - Helper: `createQueryOptions()` factory function
  - Helper: `calculateRetryDelay()` exponential backoff
- ✅ Created domain config files that extend base:
  - ✅ `apps/web/src/lib/query/user-config.ts` - 5 query options (list, detail, current, permissions, stats)
  - ✅ `apps/web/src/lib/query/org-config.ts` - 7 query options (list, detail, members, invitations, roles, settings, stats)
  - ✅ `apps/web/src/lib/query/admin-config.ts` - 7 query options (stats, audit, settings, health, user list, roles, permissions)
- ✅ Created `apps/web/src/lib/query/index.ts` - barrel exports for convenient imports
- ✅ Created comprehensive `apps/web/src/lib/query/README.md` - usage guide and migration examples
- ✅ Added types: `StaleTimeKey`, `GcTimeKey`, `QueryConfigKey`
- ✅ Type-checking passes
- 🔲 Update hooks to import from domain configs (Next step - separate subtask)

### 2.2 Create Pino Logger Package ✅ COMPLETE
> 📍 Context: [02-DX-IMPROVEMENTS.md#L158-L220](enhancements/02-DX-IMPROVEMENTS.md#L158-L220)

**Why**: Pino is NestJS-compatible, same interface for web and API, structured JSON logging

**COMPLETED**:
- ✅ Created `packages/utils/logger/` structure
  - package.json with pino v9.14.0 + pino-pretty v13.0.0
  - tsconfig.json with esModuleInterop
  - src/index.ts with full implementation
- ✅ Implemented comprehensive logger features:
  - All log levels: trace, debug, info, warn, error, fatal, silent
  - Environment-based pretty printing (dev) vs JSON (prod)
  - Scoped loggers: `logger.scope('ORPC')`
  - Child loggers: `logger.child({ requestId: '123' })`
  - Sensitive data redaction (DEFAULT_REDACT_PATHS)
  - Error serialization with pino.stdSerializers
  - Request/Response serialization
  - Base context for all logs
- ✅ Created comprehensive README.md with usage examples
- ✅ Added to workspace and installed dependencies
- ✅ Type-check successful
- ✅ Used in web app ORPC client (Task 1.4)

### 2.3 Per-Domain Query Keys ✅ COMPLETE
> 📍 Context: [04-CONSOLIDATION.md#L166-L230](enhancements/04-CONSOLIDATION.md#L166-L230)

**Why**: Colocation with hooks, reuse ORPC-generated keys, scalable per feature

**COMPLETED**:
- ✅ Created `apps/web/src/lib/query-keys/` directory
- ✅ Created domain key files that reuse ORPC/Better Auth keys:
  - ✅ `user.ts` - re-exports ORPC user keys + custom keys + invalidation helpers
  - ✅ `organization.ts` - re-exports Better Auth org keys + custom keys + helpers
  - ✅ `admin.ts` - re-exports ORPC admin keys + custom keys + helpers
  - ✅ `invitation.ts` - re-exports Better Auth invitation keys + custom keys + helpers
- ✅ Created `index.ts` barrel export for all query keys
- ✅ Added invalidation helpers per domain (invalidateAllUsers, invalidateAllOrganizations, etc.)
- ✅ Type-checking passes
- 🔲 Update hooks to use centralized keys (Next step - separate subtask)

### 2.4 Granular Error Boundaries
> 📍 Context: [02-DX-IMPROVEMENTS.md#L100-L156](enhancements/02-DX-IMPROVEMENTS.md#L100-L156)

**Why**: Isolation (failing component doesn't crash page), better UX, easier debugging

**Three Boundary Types**:
| Type | Purpose |
|------|---------|
| `ErrorBoundary` | Catch any React error |
| `QueryErrorBoundary` | Catch data fetching errors with retry |
| `FeatureErrorBoundary` | Catch + log feature-specific errors |

- [ ] Create `apps/web/src/components/error/` directory
- [ ] Create components:
  - [ ] `ErrorBoundary.tsx` (base class component)
  - [ ] `QueryErrorBoundary.tsx` (TanStack Query integration)
  - [ ] `FeatureErrorBoundary.tsx` (with logging)
- [ ] Create fallback components:
  - [ ] `DefaultErrorFallback.tsx`
  - [ ] `QueryErrorFallback.tsx` (with reset button)
  - [ ] `FeatureErrorFallback.tsx`
- [ ] Add to layouts:
  - [ ] `apps/web/src/app/dashboard/layout.tsx`
  - [ ] `apps/web/src/app/dashboard/admin/layout.tsx`
- [ ] Export from `apps/web/src/components/error/index.ts`

### 2.5 Per-Domain Error Handling
> 📍 Context: [04-CONSOLIDATION.md#L232-L290](enhancements/04-CONSOLIDATION.md#L232-L290)

**Why**: Domain-specific messages, recovery strategies, contextual logging

- [ ] Create `apps/web/src/lib/errors/` directory
- [ ] Create error files:
  - [ ] `base.ts` (AppError class, handleError, getErrorMessage)
  - [ ] `user.ts` (handleUserError with user context)
  - [ ] `organization.ts` (handleOrgError)
  - [ ] `admin.ts` (handleAdminError)
- [ ] Update mutation hooks to use domain error handlers:
  ```typescript
  onError: (error) => handleUserError(error, 'profile update')
  ```
- [ ] Add error logging with domain context

### 2.6 Centralized Type Exports
> 📍 Context: [02-DX-IMPROVEMENTS.md#L222-L256](enhancements/02-DX-IMPROVEMENTS.md#L222-L256)

- [ ] Create `apps/web/src/types/index.ts`
- [ ] Re-export hook types from `@/hooks/*`
- [ ] Re-export API contract types from `@repo/api-contracts`
- [ ] Re-export permission types from `@repo/auth-utils`
- [ ] Re-export component prop types
- [ ] Update imports across app to use centralized types

### 2.7 VSCode Snippets
> 📍 Context: [02-DX-IMPROVEMENTS.md#L272-L310](enhancements/02-DX-IMPROVEMENTS.md#L272-L310)

- [ ] Create `.vscode/snippets/hooks.code-snippets`
- [ ] Add snippets:
  - [ ] `orpc-query` - ORPC query hook template
  - [ ] `orpc-mutation` - ORPC mutation hook template
  - [ ] `error-boundary` - Error boundary component template
- [ ] Document snippets in `.vscode/README.md`

### 2.8 Pre-commit Hooks
> 📍 Context: [02-DX-IMPROVEMENTS.md#L312-L340](enhancements/02-DX-IMPROVEMENTS.md#L312-L340)

- [ ] Install dependencies:
  ```bash
  bun add -D husky lint-staged
  ```
- [ ] Initialize husky: `bunx husky init`
- [ ] Create `.husky/pre-commit`:
  ```bash
  bunx lint-staged
  bun run test --changed
  ```
- [ ] Create `lint-staged.config.js`:
  ```javascript
  module.exports = {
    '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
    '*.{json,md}': ['prettier --write'],
  }
  ```
- [ ] Test with a commit

### 2.9 Hook Documentation Generator
> 📍 Context: [02-DX-IMPROVEMENTS.md#L7-L30](enhancements/02-DX-IMPROVEMENTS.md#L7-L30)

- [ ] Create `packages/utils/orpc/src/hooks/generate-docs.ts`
- [ ] Generate JSDoc from Zod schemas for hooks
- [ ] Include `@param`, `@returns`, `@example` in generated docs
- [ ] Integrate with hook generator

### 2.10 Developer Onboarding Guide
> 📍 Context: [02-DX-IMPROVEMENTS.md#L342-L376](enhancements/02-DX-IMPROVEMENTS.md#L342-L376)

- [ ] Create `docs/DEVELOPER-GUIDE.md` with:
  - [ ] Quick start instructions
  - [ ] Key concepts (ORPC, hooks, permissions)
  - [ ] Common tasks walkthrough
  - [ ] Debugging tips
  - [ ] Code style guidelines

### 2.11 Setup Knip Dead Code Detection

**Why**: Automated detection of unused dependencies, exports, types, and files across the monorepo

**What Knip detects**:
- Unused dependencies in `package.json`
- Unused devDependencies
- Unused exports from modules
- Unused types and interfaces
- Unused files (not imported anywhere)
- Unlisted dependencies (used but not in package.json)
- Duplicate dependencies across workspace

- [ ] **Install Knip**:
  ```bash
  bun add -D knip
  ```
- [ ] **Create Knip configuration** `knip.config.ts`:
  ```typescript
  import type { KnipConfig } from 'knip'

  const config: KnipConfig = {
    workspaces: {
      '.': {
        entry: ['scripts/*.ts'],
        project: ['scripts/**/*.ts'],
      },
      'apps/web': {
        entry: ['src/app/**/page.tsx', 'src/app/**/layout.tsx', 'src/app/**/route.ts'],
        project: ['src/**/*.{ts,tsx}'],
        ignore: ['src/**/*.test.{ts,tsx}', '**/*.d.ts'],
      },
      'apps/api': {
        entry: ['src/main.ts'],
        project: ['src/**/*.ts'],
        ignore: ['src/**/*.spec.ts', '**/*.d.ts'],
      },
      'apps/doc': {
        entry: ['src/app/**/page.tsx', 'src/app/**/layout.tsx'],
        project: ['src/**/*.{ts,tsx}'],
      },
      'packages/*': {
        entry: ['src/index.ts'],
        project: ['src/**/*.{ts,tsx}'],
      },
      'packages/*/': {
        entry: ['src/index.ts'],
        project: ['src/**/*.{ts,tsx}'],
      },
    },
    ignoreDependencies: [
      // Add false positives here
      '@types/*',
    ],
    ignoreWorkspaces: [
      // Skip if needed
    ],
  }

  export default config
  ```
- [ ] **Add scripts to root `package.json`**:
  ```json
  {
    "scripts": {
      "knip": "knip",
      "knip:fix": "knip --fix",
      "knip:exports": "knip --include exports",
      "knip:deps": "knip --include dependencies,unlisted,unresolved",
      "knip:files": "knip --include files",
      "knip:types": "knip --include types",
      "knip:report": "knip --reporter markdown > knip-report.md"
    }
  }
  ```
- [ ] **Run initial analysis**:
  ```bash
  bun run knip           # Full report
  bun run knip:deps      # Just dependencies
  bun run knip:exports   # Just unused exports
  bun run knip:report    # Generate markdown report
  ```
- [ ] **Review and fix issues**:
  - [ ] Remove unused dependencies: `bun run knip:fix`
  - [ ] Review unused exports and remove or document
  - [ ] Delete truly unused files
  - [ ] Add false positives to `ignoreDependencies`
- [ ] **Add to CI pipeline** (optional):
  ```yaml
  # .github/workflows/ci.yml
  - name: Check for unused code
    run: bun run knip
  ```
- [ ] **Document in developer guide**:
  - [ ] Add Knip section to `docs/DEVELOPER-GUIDE.md`
  - [ ] Explain how to run and interpret reports
  - [ ] Document how to handle false positives

---

## Phase 3: UI Components

> 📄 Source: [03-UX-IMPROVEMENTS.md](enhancements/03-UX-IMPROVEMENTS.md)

**Selected Components** (from [selection table](enhancements/03-UX-IMPROVEMENTS.md#L7-L26)):
| Component | Selected | Reason |
|-----------|----------|--------|
| DataTable | ✅ | Essential for admin pages, data-heavy features |
| EmptyState | ✅ | Common UX pattern for empty data |
| ErrorState | ✅ | Consistent error display |
| LoadingState | ✅ | Replace inconsistent loading indicators |
| ConfirmDialog | ✅ | Destructive actions need confirmation |

### 3.1 DataTable Component
> 📍 Context: [03-UX-IMPROVEMENTS.md#L28-L120](enhancements/03-UX-IMPROVEMENTS.md#L28-L120)

- [ ] Add TanStack Table dependency: `bun add @tanstack/react-table`
- [ ] Create main component: `packages/ui/base/src/components/shadcn/data-table.tsx`
  - [ ] Implement sorting, filtering, pagination, selection
  - [ ] Add loading state support
  - [ ] Add empty state fallback
  - [ ] Add row click handler
- [ ] Create supporting files in same directory:
  - [ ] `data-table-pagination.tsx`
  - [ ] `data-table-column-header.tsx` (sortable headers)
  - [ ] `data-table-toolbar.tsx`
  - [ ] `data-table-faceted-filter.tsx`
- [ ] Export from `packages/ui/base/src/index.ts`
- [ ] Create usage examples in `packages/ui/base/src/examples/`

### 3.2 EmptyState Component
> 📍 Context: [03-UX-IMPROVEMENTS.md#L122-L178](enhancements/03-UX-IMPROVEMENTS.md#L122-L178)

- [ ] Create `packages/ui/base/src/components/atomics/molecules/EmptyState.tsx`
  - [ ] Props: icon, title, description, action
  - [ ] Support optional action button
- [ ] Add preset variants:
  - [ ] `NoResults` - for empty search results (with reset action)
  - [ ] `NoData` - for empty lists (with create action)
  - [ ] `NoAccess` - for permission denied
- [ ] Export from `packages/ui/base/src/index.ts`

### 3.3 ErrorState Component
> 📍 Context: [03-UX-IMPROVEMENTS.md#L180-L236](enhancements/03-UX-IMPROVEMENTS.md#L180-L236)

- [ ] Create `packages/ui/base/src/components/atomics/molecules/ErrorState.tsx`
  - [ ] Props: title, message, error, onRetry
  - [ ] Display friendly error message
  - [ ] Add retry button when `onRetry` provided
  - [ ] Dev-mode: show stack trace in details
- [ ] Add `QueryErrorState` variant for TanStack Query errors
- [ ] Export from `packages/ui/base/src/index.ts`

### 3.4 LoadingState Component
> 📍 Context: [03-UX-IMPROVEMENTS.md#L238-L300](enhancements/03-UX-IMPROVEMENTS.md#L238-L300)

- [ ] Create `packages/ui/base/src/components/atomics/molecules/LoadingState.tsx`
  - [ ] Props: message, variant (spinner/skeleton/pulse), size (sm/md/lg)
- [ ] Add preset variants:
  - [ ] `TableLoadingState` - skeleton rows for tables
  - [ ] `CardLoadingState` - skeleton for card layouts
- [ ] Export from `packages/ui/base/src/index.ts`

### 3.5 ConfirmDialog Component
> 📍 Context: [03-UX-IMPROVEMENTS.md#L302-L380](enhancements/03-UX-IMPROVEMENTS.md#L302-L380)

- [ ] Create `packages/ui/base/src/components/shadcn/confirm-dialog.tsx`
  - [ ] Props: open, onOpenChange, title, description, confirmLabel, cancelLabel, variant, loading, onConfirm
  - [ ] Support async `onConfirm` with loading state
  - [ ] Add destructive variant (red confirm button)
- [ ] Create `useConfirmDialog` hook for imperative usage:
  ```typescript
  const { confirm, dialog } = useConfirmDialog()
  await confirm({ title: 'Delete?', variant: 'destructive', onConfirm: handleDelete })
  return <>{dialog}</>
  ```
- [ ] Export from `packages/ui/base/src/index.ts`

### 3.6 Refactor Admin Users Page
> 📍 Context: [03-UX-IMPROVEMENTS.md#L382-L430](enhancements/03-UX-IMPROVEMENTS.md#L382-L430)

- [ ] Update `apps/web/src/app/dashboard/admin/users/page.tsx` (266 lines)
  - [ ] Replace basic table with `DataTable`
  - [ ] Define column definitions with sorting
  - [ ] Add `EmptyState` for no users
  - [ ] Add `QueryErrorState` for errors
  - [ ] Add `ConfirmDialog` for delete actions
  - [ ] Add proper loading states with `TableLoadingState`
- [ ] Test all features: sorting, filtering, pagination, delete confirmation

---

## Phase 4: Architecture Improvements

> 📄 Source: [05-ARCHITECTURE.md](enhancements/05-ARCHITECTURE.md)

### 4.1 Add usePermissions() Hook
> 📍 Context: [05-ARCHITECTURE.md#L7-L70](enhancements/05-ARCHITECTURE.md#L7-L70)

**Why**: Keep dual-layer (platform vs org) + add convenience hook for clean API

**Usage pattern**:
```typescript
const { platform, organization } = usePermissions()
if (platform.can('admin:users:read')) { /* ... */ }
if (organization.can('org:members:invite')) { /* ... */ }
```

- [ ] Create `packages/utils/auth/src/hooks/usePermissions.ts`
- [ ] Implement interface:
  - [ ] `platform.can(action)` - check platform permission
  - [ ] `platform.role` - get current platform role
  - [ ] `organization.can(action)` - check org permission
  - [ ] `organization.role` - get current org role
- [ ] Export from `packages/utils/auth/src/index.ts`
- [ ] Update components to use new hook

### 4.2 Runtime Hook Factory
> 📍 Context: [05-ARCHITECTURE.md#L72-L140](enhancements/05-ARCHITECTURE.md#L72-L140)

**Why**: No generation step needed, always in sync with contracts, simpler DX

**Trade-offs**:
| Aspect | Code Generation | Runtime Factory |
|--------|-----------------|------------------|
| Build step | Required | Not needed |
| Bundle size | Larger | Smaller |
| Sync with contract | Manual | Automatic |

- [ ] Create `packages/utils/orpc/src/hook-factory.ts`
- [ ] Implement `createTypedHooks<T>(client)` function:
  - [ ] `useQuery(key, input, options)` with default staleTime
  - [ ] `useMutation(key, options)` with default error handling
- [ ] Update `apps/web/src/lib/orpc/` to use factory
- [ ] Create typed hooks instance from factory
- [ ] Migrate existing hook usages to factory pattern
- [ ] Document migration path for existing generated hooks

### 4.3 State Management with nuqs
> 📍 Context: [05-ARCHITECTURE.md#L200-L280](enhancements/05-ARCHITECTURE.md#L200-L280)

**Why**: Type-safe URL state, shareable links, SSR compatible, no Zustand needed

**State type decision tree**:
```
Is it from the server?         → TanStack Query
Should it be in the URL?       → nuqs
Is it simple local UI state?   → React useState
Is it complex, shared UI state? → Consider Zustand
```

- [ ] Add nuqs dependency: `cd apps/web && bun add nuqs`
- [ ] Create URL state hooks in `apps/web/src/hooks/url-state/`:
  - [ ] `useAdminFilters.ts`:
    ```typescript
    export function useAdminFilters() {
      return useQueryStates({
        search: parseAsString.withDefault(''),
        role: parseAsString,
        page: parseAsInteger.withDefault(1),
      })
    }
    ```
  - [ ] `usePaginationState.ts`
  - [ ] `useSearchState.ts`
- [ ] Update admin pages to use URL state instead of local state
- [ ] Document URL state pattern in developer guide

### 4.4 Package Structure Reorganization
> 📍 Context: [05-ARCHITECTURE.md#L142-L198](enhancements/05-ARCHITECTURE.md#L142-L198)

**Why**: Logical grouping, discoverability, clear dependency hierarchy

**New Structure**:
```
packages/
├── core/           # Foundation - no external deps
│   ├── types/
│   ├── contracts/
│   └── utils/
├── ui/             # UI layer
│   ├── components/
│   └── hooks/
├── auth/           # Authentication & authorization
│   ├── client/
│   ├── server/
│   └── permissions/
├── data/           # Data layer
│   ├── orpc/
│   └── query/
├── tooling/        # Dev tooling configs
tools/              # CLI tools (separate from packages)
```

- [ ] Create new directory structure
- [ ] Move packages one by one (update `package.json` names):
  - [ ] `packages/types` → `packages/core/types`
  - [ ] `packages/contracts/api` → `packages/core/contracts`
  - [ ] Core utils extraction → `packages/core/utils`
  - [ ] `packages/utils/auth` → `packages/auth/client`
  - [ ] `packages/utils/orpc` → `packages/data/orpc`
  - [ ] `packages/ui/base` → `packages/ui/components`
  - [ ] `packages/configs/eslint` → `packages/tooling/eslint`
  - [ ] `packages/configs/prettier` → `packages/tooling/prettier`
  - [ ] `packages/configs/typescript` → `packages/tooling/typescript`
  - [ ] `packages/configs/vitest` → `packages/tooling/vitest`
  - [ ] `packages/configs/tailwind` → `packages/tooling/tailwind`
- [ ] Create `tools/` directory for CLI tools:
  - [ ] Move `packages/bin/` → `tools/bin/`
- [ ] Update all `package.json` names with new scope
- [ ] Update all imports across entire workspace
- [ ] Update `turbo.json` pipeline and dependencies
- [ ] Update root `package.json` workspaces glob
- [ ] Update `AGENTS.md` files for moved packages
- [ ] Run full build to verify: `bun run build`

### 4.5 Testing Infrastructure Fix
> 📍 Context: [05-ARCHITECTURE.md#L144-L180](enhancements/05-ARCHITECTURE.md#L144-L180)

- [ ] Update root `vitest.config.mts` for Zod v4 alias
- [ ] Create/update `packages/utils/orpc/vitest.setup.ts` with Zod validation
- [ ] Add integration tests in `apps/api/__tests__/integration/`
- [ ] Verify all 54 ORPC tests pass

### 4.6 Caching Strategy Configuration
> 📍 Context: [05-ARCHITECTURE.md#L350-L400](enhancements/05-ARCHITECTURE.md#L350-L400)

- [ ] Create centralized cache config in `apps/web/src/lib/query-config.ts`
- [ ] Define domain-specific cache times:
  ```typescript
  export const cacheConfig = {
    user: { profile: { staleTime: 60_000 }, list: { staleTime: 30_000 } },
    organization: { details: { staleTime: 120_000 }, members: { staleTime: 60_000 } },
    admin: { users: { staleTime: 15_000 }, stats: { staleTime: 300_000 } },
  }
  ```
- [ ] Create `getCacheConfig(domain, resource)` helper
- [ ] Update hooks to use cache config

### 4.7 API Response Standardization
> 📍 Context: [05-ARCHITECTURE.md#L320-L348](enhancements/05-ARCHITECTURE.md#L320-L348)

- [ ] Create `packages/contracts/api/src/types/response.ts`:
  - [ ] `successResponseSchema<T>` wrapper
  - [ ] `errorResponseSchema` format
  - [ ] `paginatedResponseSchema<T>` format
- [ ] Update API endpoints to use standard response format
- [ ] Update client-side parsing to handle standard format

---

## Phase 5: Consolidation & Cleanup

> 📄 Source: [04-CONSOLIDATION.md](enhancements/04-CONSOLIDATION.md)

### 5.1 Consolidate RequirePermission (if not done in Phase 1)
> 📍 Context: [04-CONSOLIDATION.md#L7-L68](enhancements/04-CONSOLIDATION.md#L7-L68)

- [ ] Verify single source in `@repo/auth-utils`
- [ ] Ensure all imports updated
- [ ] Delete any remaining duplicates

### 5.2 Migrate useUsers.ts to ORPC (if not done in Phase 1)
> 📍 Context: [04-CONSOLIDATION.md#L70-L116](enhancements/04-CONSOLIDATION.md#L70-L116)

- [ ] Verify all usages migrated to ORPC hooks
- [ ] Confirm file deleted
- [ ] Run tests to verify

### 5.3 Consolidate Permission Exports
> 📍 Context: [04-CONSOLIDATION.md#L118-L164](enhancements/04-CONSOLIDATION.md#L118-L164)

- [ ] Update `packages/utils/auth/src/index.ts` with clean export structure:
  ```typescript
  // Permission system - single entry point
  export {
    PLATFORM_ROLES, PLATFORM_ROLE_HIERARCHY, PlatformPermission, checkPlatformPermission,
    ORGANIZATION_ROLES, ORGANIZATION_ROLE_HIERARCHY, OrganizationPermission, checkOrganizationPermission,
    isPlatformRole, isOrganizationRole,
    type PlatformRole, type OrganizationRole, type PermissionCheck,
  } from './permissions'
  
  // Components
  export { RequirePermission, RequireOrgPermission } from './components'
  
  // Hooks
  export { useSession, usePlatformPermission, useOrgPermission, usePermissions } from './hooks'
  ```
- [ ] Remove redundant exports from sub-modules

### 5.4 Merge Duplicate Test Configurations
> 📍 Context: [04-CONSOLIDATION.md#L230-L260](enhancements/04-CONSOLIDATION.md#L230-L260)

- [ ] Ensure `packages/configs/vitest/base.ts` exports `baseConfig` and `reactConfig`
- [ ] Update each package's `vitest.config.ts` to extend base:
  ```typescript
  import { mergeConfig } from 'vitest/config'
  import { reactConfig } from '@repo/config-vitest'
  export default mergeConfig(reactConfig, { /* overrides */ })
  ```
- [ ] Verify all tests still pass

### 5.5 Consolidate Environment Utilities
> 📍 Context: [04-CONSOLIDATION.md#L294-L350](enhancements/04-CONSOLIDATION.md#L294-L350)

- [ ] Update `packages/utils/env/src/index.ts` with base schemas
- [ ] Create `webEnvSchema` and `apiEnvSchema` extending base
- [ ] Create `validateEnv<T>()` helper
- [ ] Update `apps/web/env.ts` to use shared schema
- [ ] Update `apps/api/src/config/` to use shared validation

### 5.6 Remove Unused Exports
> 📍 Context: [04-CONSOLIDATION.md#L352-L370](enhancements/04-CONSOLIDATION.md#L352-L370)

- [ ] Run dead code detection: `bunx knip --include exports`
- [ ] Review and remove unused type utilities in `packages/types/`
- [ ] Remove unused components from `packages/ui/base/`
- [ ] Clean up hook exports

### 5.7 Clean Up Empty/Stub Files
> 📍 Context: [04-CONSOLIDATION.md#L372-L390](enhancements/04-CONSOLIDATION.md#L372-L390)

- [ ] Find small files: `find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n | head -50`
- [ ] Remove empty test files
- [ ] Remove stub implementations
- [ ] Remove commented-out code blocks
- [ ] Remove unused imports

---

## Phase 6: Testing & Documentation

> 📄 Sources: [05-ARCHITECTURE.md#L284-L320](enhancements/05-ARCHITECTURE.md#L284-L320), [02-DX-IMPROVEMENTS.md](enhancements/02-DX-IMPROVEMENTS.md)

### 6.1 Fix All Tests
- [ ] Run full test suite: `bun run test`
- [ ] Fix Zod v4 import issues (if any remaining)
- [ ] Fix remaining failures one by one
- [ ] Add missing tests for new components:
  - [ ] DataTable tests
  - [ ] EmptyState tests
  - [ ] ErrorState tests
  - [ ] LoadingState tests
  - [ ] ConfirmDialog tests
  - [ ] usePermissions tests
  - [ ] hook-factory tests
- [ ] Achieve 100% pass rate (54/54 + new tests)

### 6.2 Update Documentation
- [ ] Update root README.md with new package structure
- [ ] Create/update `docs/INVITATION-SYSTEM.md`:
  - [ ] Explain app invitations (custom plugin)
  - [ ] Explain org invitations (built-in plugin)
  - [ ] Usage examples for both
- [ ] Create/update `docs/PERMISSION-SYSTEM.md`:
  - [ ] Explain dual-layer architecture
  - [ ] Document usePermissions() hook
  - [ ] Document RequirePermission components
- [ ] Create/update `docs/STATE-MANAGEMENT.md`:
  - [ ] TanStack Query for server state
  - [ ] nuqs for URL state
  - [ ] React state for UI state
- [ ] Update all `AGENTS.md` files for moved packages:
  - [ ] `packages/core/types/AGENTS.md`
  - [ ] `packages/core/contracts/AGENTS.md`
  - [ ] `packages/auth/client/AGENTS.md`
  - [ ] `packages/data/orpc/AGENTS.md`
  - [ ] `packages/ui/components/AGENTS.md`
  - [ ] `packages/tooling/*/AGENTS.md`

### 6.3 Final Cleanup
- [ ] Run dead code detection: `bunx knip`
- [ ] Remove all unused exports
- [ ] Remove all empty/stub files
- [ ] Remove all commented-out code
- [ ] Final lint pass: `bun run lint --fix`
- [ ] Final format pass: `bun run format`

---

## Verification Checklist

### After Each Phase
- [ ] All tests pass: `bun run test`
- [ ] Type check passes: `bun run type-check`
- [ ] Lint passes: `bun run lint`
- [ ] Build succeeds: `bun run build`
- [ ] Dev server starts: `bun run dev`

### Final Verification
- [ ] 54/54 ORPC tests passing
- [ ] No deprecated code remaining (`useUsers.ts`, duplicate `RequirePermission`)
- [ ] No duplicate components
- [ ] No `console.log` in production code
- [ ] All TODOs in code addressed
- [ ] CI/CD pipeline passing
- [ ] Documentation up to date

---

## Quick Reference

### Commands
```bash
# Run tests
bun run test

# Type check
bun run type-check

# Lint
bun run lint

# Build all
bun run build

# Dev server
bun run dev

# Find usages
grep -r "pattern" apps/web/src/

# Dead code detection (after setup - see Task 2.11)
bun run knip              # Full analysis
bun run knip:deps         # Unused dependencies only
bun run knip:exports      # Unused exports only
bun run knip:files        # Unused files only
bun run knip:report       # Generate markdown report
bun run knip:fix          # Auto-fix safe issues

# Find small files (potential stubs)
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n | head -50
```

### Key File Locations

| Item | Current Location | Notes |
|------|------------------|-------|
| ORPC hooks | `packages/utils/orpc/src/hooks/` | Test failures here |
| Auth utils | `packages/utils/auth/src/` | RequirePermission target |
| UI components | `packages/ui/base/src/components/` | New components go here |
| API contracts | `packages/contracts/api/src/` | Add invitation contract |
| Web hooks | `apps/web/src/hooks/` | useUsers.ts to remove |
| Web lib | `apps/web/src/lib/` | query config, errors |
| ORPC client | `apps/web/src/lib/orpc/index.ts` | Console.log cleanup |
| Admin users page | `apps/web/src/app/dashboard/admin/users/page.tsx` | 266 lines, needs refactor |

### Enhancement File Quick Links

| Topic | Documentation |
|-------|---------------|
| Critical fixes | [01-CRITICAL-FIXES.md](enhancements/01-CRITICAL-FIXES.md) |
| DX improvements | [02-DX-IMPROVEMENTS.md](enhancements/02-DX-IMPROVEMENTS.md) |
| UI components | [03-UX-IMPROVEMENTS.md](enhancements/03-UX-IMPROVEMENTS.md) |
| Consolidation | [04-CONSOLIDATION.md](enhancements/04-CONSOLIDATION.md) |
| Architecture | [05-ARCHITECTURE.md](enhancements/05-ARCHITECTURE.md) |

---

## Progress Tracking

| Phase | Status | Tasks | Progress |
|-------|--------|-------|----------|
| Phase 1: Critical Fixes | 🔴 Not Started | 5 major tasks | 0/5 |
| Phase 2: DX Improvements | 🔴 Not Started | 11 major tasks | 0/11 |
| Phase 3: UI Components | 🔴 Not Started | 6 major tasks | 0/6 |
| Phase 4: Architecture | 🔴 Not Started | 7 major tasks | 0/7 |
| Phase 5: Consolidation | 🔴 Not Started | 7 major tasks | 0/7 |
| Phase 6: Testing & Docs | 🔴 Not Started | 3 major tasks | 0/3 |

**Overall Progress**: 0/39 major tasks complete

---

## Decision Summary

All decisions made during our discussion:

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | Zod fix | `zod/v4` import | [01-CRITICAL-FIXES.md#L25-L45](enhancements/01-CRITICAL-FIXES.md#L25-L45) |
| 2 | useUsers.ts | Remove completely | [01-CRITICAL-FIXES.md#L68-L80](enhancements/01-CRITICAL-FIXES.md#L68-L80) |
| 3 | RequirePermission | Merge into `@repo/auth-utils` | [01-CRITICAL-FIXES.md#L140-L160](enhancements/01-CRITICAL-FIXES.md#L140-L160) |
| 4 | Logger | Pino (NestJS-compatible) | [02-DX-IMPROVEMENTS.md#L160-L180](enhancements/02-DX-IMPROVEMENTS.md#L160-L180) |
| 5 | Invitations | Dual system (app + org) | [01-CRITICAL-FIXES.md#L230-L270](enhancements/01-CRITICAL-FIXES.md#L230-L270) |
| 6 | Permissions | Dual-layer + usePermissions() | [05-ARCHITECTURE.md#L15-L50](enhancements/05-ARCHITECTURE.md#L15-L50) |
| 7 | Hook generation | Runtime factory | [05-ARCHITECTURE.md#L80-L120](enhancements/05-ARCHITECTURE.md#L80-L120) |
| 8 | Query keys | Per-domain files | [04-CONSOLIDATION.md#L170-L200](enhancements/04-CONSOLIDATION.md#L170-L200) |
| 9 | Query config | Centralized + per-domain extends | [02-DX-IMPROVEMENTS.md#L40-L70](enhancements/02-DX-IMPROVEMENTS.md#L40-L70) |
| 10 | Error boundaries | Granular (3 types) | [02-DX-IMPROVEMENTS.md#L105-L140](enhancements/02-DX-IMPROVEMENTS.md#L105-L140) |
| 11 | Package structure | Full reorganization | [05-ARCHITECTURE.md#L145-L195](enhancements/05-ARCHITECTURE.md#L145-L195) |
| 12 | State management | nuqs + TanStack Query + React | [05-ARCHITECTURE.md#L210-L270](enhancements/05-ARCHITECTURE.md#L210-L270) |
| 13 | UI components | 5 selected (DataTable, Empty, Error, Loading, Confirm) | [03-UX-IMPROVEMENTS.md#L7-L26](enhancements/03-UX-IMPROVEMENTS.md#L7-L26) |
| 14 | Error handling | Per-domain | [04-CONSOLIDATION.md#L235-L280](enhancements/04-CONSOLIDATION.md#L235-L280) |
| 15 | Dev scripts | Keep current | [02-DX-IMPROVEMENTS.md#L258-L270](enhancements/02-DX-IMPROVEMENTS.md#L258-L270) |

---

*Last Updated: January 8, 2026*
