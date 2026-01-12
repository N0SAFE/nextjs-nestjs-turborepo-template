# Technical Debt Inventory

> Known issues, TODOs, deprecated code, and test failures

---

## 🔴 Critical: Test Failures

### @repo/orpc-utils Test Suite
**Status:** 45/54 tests failing  
**Root Cause:** Zod 4 import issue - `z.object` is undefined in vitest environment

**Affected File:** `packages/utils/orpc/src/hooks/__tests__/generate-hooks.test.ts`

**Error Pattern:**
```
TypeError: Cannot read properties of undefined (reading 'object')
  at Module.z.object (generate-hooks.test.ts)
```

**Impact:**
- CI/CD pipeline likely failing
- Cannot verify hook generation logic
- Blocks safe refactoring

**Fix Required:**
1. Update Zod import strategy for Vitest
2. Potentially use `vi.mock('zod')` with proper ESM handling
3. Or update to Zod 4 proper import: `import { z } from 'zod/v4'`

---

## 🟡 Deprecated Code

### useUsers.ts (632 lines) - MARKED FOR REMOVAL
**Location:** `apps/web/src/hooks/useUsers.ts`  
**Status:** Explicitly marked `@deprecated`

```typescript
/**
 * @deprecated This file contains manually-written hooks that are being phased out.
 * Use the generated ORPC hooks from useUser.orpc-hooks.ts instead.
 */
```

**Replacement:** `apps/web/src/hooks/useUser.orpc-hooks.ts` (200 lines)

**Action Required:**
1. Audit all imports of `useUsers`
2. Migrate consumers to `useUser.orpc-hooks.ts`
3. Remove deprecated file
4. Update any documentation references

**Migration Guide:**
| Old Hook | New Hook |
|----------|----------|
| `useUsers()` | `useUserList()` |
| `useUser(id)` | `useUserById(id)` |
| `useCreateUser()` | `useUserCreate()` |
| `useUpdateUser()` | `useUserUpdate()` |
| `useDeleteUser()` | `useUserDelete()` |

---

## 🟡 Duplicate Components

### RequirePermission Component (2 implementations)

**Implementation 1:** `apps/web/src/components/permissions/RequirePermission.tsx`
- Lines: 227
- Uses: `usePermissions` hook
- Features: Platform + Organization permission checking

**Implementation 2:** `apps/web/src/components/auth/RequirePermission.tsx`
- Lines: 174
- Uses: Direct permission checks
- Features: Similar functionality, different approach

**Recommendation:**
1. Audit which implementation is more complete
2. Consolidate into single component
3. Delete duplicate
4. Update all imports

---

## 🟡 Unresolved TODOs

### apps/web/src/hooks/useInvitation.ts

**Line 31:**
```typescript
// TODO: Better Auth doesn't provide a global listInvitations method
```

**Line 53:**
```typescript
// TODO: Better Auth doesn't provide a global listInvitations method
```

**Impact:** Limited invitation management functionality

**Options:**
1. Implement custom invitation listing via ORPC
2. Wait for Better Auth update
3. Use organization-specific invitation listing as workaround

---

## 🟡 Large Files Requiring Refactoring

### High Complexity Files

| File | Lines | Concern |
|------|-------|---------|
| `route-builder.ts` | 1423 | Could be split by functionality |
| `standard-operations.ts` | 1697 | Very large, consider splitting |
| `generate-hooks.ts` | 999 | Approaching complexity limit |
| `tanstack-query.ts` | 800+ | Utility file, needs organization |
| `useUsers.ts` | 632 | DEPRECATED - remove |

### Recommended Splits

**route-builder.ts → Split into:**
- `route-builder-core.ts` - Core builder logic
- `route-builder-types.ts` - Type definitions
- `route-builder-utils.ts` - Helper functions

**standard-operations.ts → Split into:**
- `standard-queries.ts` - Query operations
- `standard-mutations.ts` - Mutation operations
- `standard-types.ts` - Shared types

---

## 🟡 Missing Error Boundaries

**Current State:**
- `global-error.tsx` exists at app level
- No component-level error boundaries

**Missing:**
- Per-route error boundaries
- Feature-specific error handling
- ORPC error boundary wrapper

---

## 🟡 Console Logging in Production Code

### ORPC Client
**File:** `apps/web/src/lib/orpc/index.ts`

```typescript
console.log(`🔧 ORPC: Setting cookie header (server-side)...`)
console.log(`🔧 ORPC fetch: Server-side request to ${request.url}`)
console.log(`🔧 ORPC fetch: Cookie header: ${cookieHeader}...`)
```

**Action:** Replace with proper logging service or conditional debug logging

---

## 🟢 Minor Issues

### Type Assertions
Various files use `as unknown as Type` patterns that could be improved with proper typing.

### Magic Numbers
Some timeout values and limits are hardcoded:
```typescript
staleTime: 1000 * 60 * 2    // Should be constant
gcTime: 1000 * 60 * 10      // Should be constant
```

**Recommendation:** Create constants file for timing values

---

## 🟢 Dead Code Candidates

### Commented Code in tanstack-query.ts
Lines 765-820 contain commented example code:
```typescript
//             `https://jsonplaceholder.typicode.com/todos/${id}?_page=${pageParam}`
```

**Action:** Remove or move to documentation/examples

---

## Priority Matrix

| Issue | Severity | Effort | Impact |
|-------|----------|--------|--------|
| Test Failures | 🔴 Critical | Medium | CI/CD blocked |
| Deprecated useUsers.ts | 🟡 High | Medium | Code quality |
| Duplicate RequirePermission | 🟡 High | Low | Maintenance |
| TODO in useInvitation | 🟡 Medium | Medium | Feature gap |
| Console logging | 🟢 Low | Low | Debug noise |
| Large files | 🟢 Low | High | Maintainability |

---

## Technical Debt Burndown Plan

### Week 1 - Critical
1. Fix Zod import issue in tests
2. Verify all 54 tests pass
3. Add to CI/CD pipeline

### Week 2 - High Priority
1. Remove useUsers.ts after migration audit
2. Consolidate RequirePermission components
3. Address useInvitation TODOs

### Week 3 - Medium Priority
1. Replace console.log with proper logging
2. Add component-level error boundaries
3. Extract timing constants

### Week 4 - Low Priority
1. Consider file splitting for large files
2. Remove dead/commented code
3. Improve type assertions

---

## Tracking

- [ ] Test failures fixed
- [ ] useUsers.ts removed
- [ ] RequirePermission consolidated
- [ ] TODOs addressed
- [ ] Console logging cleaned up
- [ ] Error boundaries added
- [ ] Constants extracted
- [ ] Dead code removed
