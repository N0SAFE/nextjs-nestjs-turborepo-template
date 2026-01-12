# Critical Fixes Required

> Issues that block development, CI/CD, or cause runtime errors

---

## 🔴 1. Fix @repo/orpc-utils Test Failures

### Problem
45 out of 54 tests failing in `packages/utils/orpc/src/hooks/__tests__/`

### Root Cause
Zod 4 import issue - `z.object` is undefined in Vitest environment

```
TypeError: Cannot read properties of undefined (reading 'object')
```

### Impact
- CI/CD pipeline blocked
- Cannot verify hook generation logic
- Unsafe to refactor hooks

### Solution: Use `zod/v4` Explicit Import

#### Why This Solution?

During our discussion, we identified three possible approaches:
- **Option A**: Update to `zod/v4` import (CHOSEN)
- **Option B**: Add alias in vitest config
- **Option C**: Downgrade to Zod 3

We chose **Option A** because:
1. **Direct fix**: Explicitly imports Zod 4's API, which is what we actually want
2. **Future-proof**: Aligns with Zod 4's official ESM structure
3. **No tooling workarounds**: Doesn't require vitest config hacks
4. **Clear intent**: Code explicitly shows we're using Zod 4 features

#### Implementation

```typescript
// Before
import { z } from 'zod'

// After - Zod 4 explicit import
import { z } from 'zod/v4'
```

#### What This Fixes

The root cause is that Zod 4 changed its module structure. When importing from `'zod'` in certain test environments, the `z.object` and other schema builders are undefined. Using `'zod/v4'` directly bypasses this issue.

### Files to Modify
1. `packages/utils/orpc/vitest.config.ts`
2. `packages/utils/orpc/src/hooks/__tests__/generate-hooks.test.ts`
3. Potentially all files importing Zod

### Verification
```bash
cd packages/utils/orpc
bun run test
# Expected: 54/54 tests passing
```

---

## 🔴 2. Remove Deprecated useUsers.ts

### Problem
`apps/web/src/hooks/useUsers.ts` (632 lines) is marked deprecated but still exists

### Impact
- Code confusion
- Duplicate functionality
- Maintenance burden
- New developers might use wrong hooks

### Why Remove Completely?

During our discussion, we considered:
- **Option A**: Keep for backward compatibility
- **Option B**: Remove completely (CHOSEN)

We chose **complete removal** because:
1. **Already deprecated**: File is explicitly marked `@deprecated`, signaling intent to remove
2. **ORPC hooks exist**: Generated hooks in `useUser.orpc-hooks.ts` replace all functionality
3. **632 lines of debt**: Significant maintenance burden for dead code
4. **Confusion risk**: New developers might accidentally import the old hooks
5. **Clean codebase**: No reason to keep deprecated code that has replacements

### Solution

**Step 1: Find All Usages**
```bash
grep -r "from.*useUsers" apps/web/src/
grep -r "useUsers\(" apps/web/src/
```

**Step 2: Create Migration Map**
| Old Import | New Import |
|------------|------------|
| `import { useUsers } from '@/hooks/useUsers'` | `import { useUserList } from '@/hooks/useUser.orpc-hooks'` |
| `import { useUser } from '@/hooks/useUsers'` | `import { useUserById } from '@/hooks/useUser.orpc-hooks'` |
| `import { useCreateUser } from '@/hooks/useUsers'` | `import { useUserCreate } from '@/hooks/useUser.orpc-hooks'` |
| `import { useUpdateUser } from '@/hooks/useUsers'` | `import { useUserUpdate } from '@/hooks/useUser.orpc-hooks'` |
| `import { useDeleteUser } from '@/hooks/useUsers'` | `import { useUserDelete } from '@/hooks/useUser.orpc-hooks'` |

**Step 3: Update Each Consumer**
Replace imports and update hook calls to match new API

**Step 4: Delete File**
```bash
rm apps/web/src/hooks/useUsers.ts
```

**Step 5: Update Index Exports**
```typescript
// apps/web/src/hooks/index.ts
// Remove: export * from './useUsers'
```

### Verification
```bash
bun run type-check
bun run lint
```

---

## 🔴 3. Consolidate Duplicate RequirePermission Components

### Problem
Two implementations of `RequirePermission` exist:
1. `apps/web/src/components/permissions/RequirePermission.tsx` (227 lines)
2. `apps/web/src/components/auth/RequirePermission.tsx` (174 lines)

### Impact
- Inconsistent permission checking
- Maintenance burden
- Confusion about which to use

### Analysis

**Implementation 1 (permissions/):**
- Uses `usePermissions` hook
- Supports both platform and organization permissions
- More comprehensive

**Implementation 2 (auth/):**
- Uses direct permission checks
- Simpler implementation
- Less feature-rich

### Why Merge into `@repo/auth-utils`?

During our discussion, we determined:
1. **Single source of truth**: Permission components belong in the auth package where permission logic lives
2. **Shared across apps**: `@repo/auth-utils` is already a shared package, making the component reusable
3. **Colocation**: Keep permission checking logic and permission UI components together
4. **Canonical location**: Clear answer to "which RequirePermission should I use?"

### How to Use After Consolidation

```typescript
// Import from the auth utilities package
import { RequirePermission } from '@repo/auth-utils'

// Use for platform permissions
<RequirePermission permission="admin:users:read">
  <AdminPanel />
</RequirePermission>

// Use for organization permissions
<RequireOrgPermission orgId={orgId} permission="org:members:manage">
  <MemberList />
</RequireOrgPermission>
```

### Solution

**Step 1: Compare Features**
Create comparison table of supported features

**Step 2: Choose Primary Implementation**
Recommend: `permissions/RequirePermission.tsx` (more complete)

**Step 3: Migrate Features from auth/ to permissions/**
If auth/ has unique features, port them

**Step 4: Update All Imports**
```bash
# Find all usages
grep -r "RequirePermission" apps/web/src/

# Update imports to use single location
```

**Step 5: Delete Duplicate**
```bash
rm apps/web/src/components/auth/RequirePermission.tsx
```

**Step 6: Export from auth/ Directory**
```typescript
// apps/web/src/components/auth/index.ts
export { RequirePermission } from '../permissions/RequirePermission'
```

### Verification
```bash
bun run type-check
bun run build
```

---

## 🔴 4. Fix Console Logging in Production

### Problem
Production logging in ORPC client:
```typescript
console.log(`🔧 ORPC: Setting cookie header...`)
console.log(`🔧 ORPC fetch: Server-side request...`)
```

### Impact
- Security: Exposes request details
- Performance: Console calls have overhead
- Noise: Clutters production logs

### Solution

**Option A: Conditional Logging**
```typescript
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log(`🔧 ORPC: Setting cookie header...`)
}
```

**Option B: Proper Logger (Recommended)**
```typescript
import { logger } from '@/lib/logger'

logger.debug('ORPC: Setting cookie header', { length: cookieString.length })
```

**Option C: Remove Entirely**
For production-ready code, remove debug logs

### Files to Modify
- `apps/web/src/lib/orpc/index.ts`

### Verification
```bash
bun run build
# Check no console.log in production bundle
```

---

## 🔴 5. Address useInvitation TODOs

### Problem
Two TODO comments indicate missing functionality:
```typescript
// TODO: Better Auth doesn't provide a global listInvitations method
```

### Impact
- Limited invitation management
- Incomplete feature

### Why Two Invitation Types?

During our discussion, we identified a critical distinction that many projects miss:

1. **App-level invitations** = Inviting someone to CREATE AN ACCOUNT on the platform
   - "Hey, join our app!"
   - User doesn't exist yet in the system
   - Handled by a **custom Better Auth plugin** we create in `packages/utils/auth`

2. **Organization invitations** = Inviting an EXISTING USER to join an organization
   - "Hey, join my team!"
   - User already has an account
   - Handled by **Better Auth's built-in organization plugin**

### Solution: Dual Invitation System

#### App-Level Invitations (Custom Plugin)

**Location:** `packages/utils/auth/src/plugins/invitation.ts`

**Purpose:** Invite new users to the platform itself. This is NOT covered by Better Auth's organization plugin because that assumes the user already exists.

**How it works:**
1. Admin/user sends invitation email with unique token
2. Recipient clicks link and creates account
3. Token validates they were invited
4. Account is created and linked to inviter

**Usage:**
```typescript
// Send app invitation
const { sendAppInvitation } = useAppInvitations()
await sendAppInvitation({ email: 'new-user@example.com' })

// List pending app invitations
const { data: pendingInvites } = useAppInvitations()
```

#### Organization Invitations (Built-in Plugin)

**Purpose:** Invite existing platform users to join an organization.

**How it works:**
1. Org admin invites existing user by email
2. User receives notification
3. User accepts/declines
4. User gains org membership with specified role

**Usage:**
```typescript
// Built-in Better Auth org plugin
import { useOrganization } from '@repo/auth-utils'

const { inviteMember } = useOrganization()
await inviteMember({ email: 'existing-user@example.com', role: 'member' })
```

### Implementation: App Invitations via ORPC

```typescript
// packages/contracts/api/src/contracts/invitation.contract.ts
export const invitationContract = oc.router({
  list: RouteBuilder.get('/invitations')
    .build((b) => b
      .description('List all invitations')
      .output(z.array(invitationSchema))
    ),
})
```

### Verification
After implementation, remove TODO comments

---

## Implementation Priority

| Fix | Severity | Effort | Order |
|-----|----------|--------|-------|
| Test failures | Critical | Medium | 1 |
| Remove useUsers.ts | High | Medium | 2 |
| Consolidate RequirePermission | High | Low | 3 |
| Production logging | Medium | Low | 4 |
| useInvitation TODOs | Medium | Medium | 5 |

---

## Checklist

- [ ] Zod import issue resolved
- [ ] 54/54 tests passing
- [ ] useUsers.ts removed
- [ ] Single RequirePermission implementation
- [ ] Console logging cleaned up
- [ ] TODOs addressed or documented
- [ ] CI/CD passing
- [ ] All type checks passing
