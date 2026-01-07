# Permission System Showcase Specification

> **Status**: Planning  
> **Created**: 2025-12-22  
> **Author**: AI Agent  
> **Related PR**: #136 - Better Auth Plugin Integration with Factory-Based Wrapper Architecture

## 1. Overview

### 1.1 Purpose

Create a comprehensive **Permission System Showcase** that demonstrates the full capabilities of the Better Auth integration with:
- Organization management (Better Auth Organization Plugin)
- Admin panel (Better Auth Admin Plugin)
- Type-safe routing (Declarative Routing)
- ORPC middlewares (`.forInput()` pattern + guards)
- Dual-layer permission system (Platform + Organization roles)

### 1.2 Goals

1. **Educational**: Serve as a reference implementation for developers using this template
2. **Functional**: Provide real, working organization and admin features
3. **Type-Safe**: Demonstrate end-to-end type safety from contracts to UI
4. **Patterns**: Showcase all recommended patterns for auth/permissions

### 1.3 Non-Goals

- Production-ready admin UI (this is a showcase/demo)
- Complex business logic beyond demonstrating permissions
- Full CRUD for all entity types

---

## 2. Architecture

### 2.1 Dual-Layer Permission System

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM LAYER (Global)                       │
├─────────────────────────────────────────────────────────────────┤
│  Roles: superAdmin > admin > user                               │
│  Resources: user, session, organization, system, platformLogs   │
│  Scope: Entire platform, all organizations                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               ORGANIZATION LAYER (Per-Org)                       │
├─────────────────────────────────────────────────────────────────┤
│  Roles: owner > admin > member                                  │
│  Resources: member, invite, project, settings, analytics        │
│  Scope: Single organization context                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Permission Resolution Flow

```
User Request
     │
     ▼
┌─────────────────┐
│ Authentication  │  ← requireAuth() middleware
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Platform Check  │  ← hasRole(['admin']) or hasPermission({ user: ['list'] })
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Org Membership  │  ← isMemberOf.forInput() + mapInput
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Org Permission  │  ← hasOrganizationRole/Permission
└────────┬────────┘
         │
         ▼
    Handler
```

---

## 3. Directory Structure

### 3.1 Web App Structure

```
apps/web/src/app/
├── (app)/                                  # Protected app routes group
│   └── dashboard/
│       ├── page.tsx                        # Dashboard home
│       ├── page.info.ts                    # Declarative routing info
│       ├── layout.tsx                      # Dashboard layout with sidebar
│       │
│       ├── organizations/                  # Organization management
│       │   ├── page.tsx                    # List user's organizations
│       │   ├── page.info.ts
│       │   ├── new/                        # Create organization
│       │   │   ├── page.tsx
│       │   │   └── page.info.ts
│       │   └── [organizationId]/           # Organization detail (dynamic)
│       │       ├── page.tsx                # Org dashboard/overview
│       │       ├── page.info.ts
│       │       ├── layout.tsx              # Org-scoped layout
│       │       ├── settings/               # Org settings (owner/admin)
│       │       │   ├── page.tsx
│       │       │   └── page.info.ts
│       │       ├── members/                # Member management
│       │       │   ├── page.tsx
│       │       │   └── page.info.ts
│       │       ├── invites/                # Invite management
│       │       │   ├── page.tsx
│       │       │   └── page.info.ts
│       │       └── projects/               # Organization projects
│       │           ├── page.tsx
│       │           └── page.info.ts
│       │
│       ├── admin/                          # Admin panel (platform admin only)
│       │   ├── page.tsx                    # Admin dashboard
│       │   ├── page.info.ts
│       │   ├── layout.tsx                  # Admin layout
│       │   ├── users/                      # User management
│       │   │   ├── page.tsx
│       │   │   └── page.info.ts
│       │   ├── organizations/              # All organizations (platform view)
│       │   │   ├── page.tsx
│       │   │   └── page.info.ts
│       │   └── system/                     # System settings
│       │       ├── page.tsx
│       │       └── page.info.ts
│       │
│       └── profile/                        # User profile
│           ├── page.tsx
│           └── page.info.ts
│
├── showcase/
│   └── auth/                               # Auth showcase page
│       ├── page.tsx                        # Interactive demo
│       └── page.info.ts
```

### 3.2 API Module Structure

```
apps/api/src/modules/
└── organization/                           # Organization module
    ├── organization.module.ts              # NestJS module definition
    ├── controllers/
    │   ├── organization.controller.ts      # Org CRUD endpoints
    │   └── organization-member.controller.ts # Member management
    ├── services/
    │   └── organization.service.ts         # Business logic
    └── repositories/
        └── organization.repository.ts      # Database access
```

### 3.3 API Contracts Structure

```
packages/contracts/api/modules/
└── organization/                           # Organization contracts
    ├── index.ts                            # Main router
    ├── list.ts                             # List user's organizations
    ├── create.ts                           # Create organization
    ├── findById.ts                         # Get organization details
    ├── update.ts                           # Update organization
    ├── delete.ts                           # Delete organization
    └── members/
        ├── index.ts                        # Members router
        ├── list.ts                         # List members
        ├── invite.ts                       # Invite member
        ├── remove.ts                       # Remove member
        └── updateRole.ts                   # Update member role
```

---

## 4. Feature Specifications

### 4.1 Organization Management

#### 4.1.1 List Organizations

| Aspect | Details |
|--------|---------|
| **Route** | `GET /organization/list` |
| **Web Route** | `/dashboard/organizations` |
| **Auth** | Authenticated user |
| **Middleware** | `requireAuth()` |
| **Returns** | Organizations where user is a member |

#### 4.1.2 Create Organization

| Aspect | Details |
|--------|---------|
| **Route** | `POST /organization/create` |
| **Web Route** | `/dashboard/organizations/new` |
| **Auth** | Authenticated user with `organization:create` permission |
| **Middleware** | `requireAuth()` → `hasPermission({ organization: ['create'] })` |
| **Input** | `{ name: string, slug?: string }` |
| **Effect** | Creates org, sets user as owner |

#### 4.1.3 View Organization

| Aspect | Details |
|--------|---------|
| **Route** | `GET /organization/:organizationId` |
| **Web Route** | `/dashboard/organizations/[organizationId]` |
| **Auth** | Organization member |
| **Middleware** | `requireAuth()` → `isMemberOf.forInput()` |
| **Pattern** | `.forInput()` with mapInput |

#### 4.1.4 Update Organization

| Aspect | Details |
|--------|---------|
| **Route** | `PATCH /organization/:organizationId` |
| **Web Route** | `/dashboard/organizations/[organizationId]/settings` |
| **Auth** | Organization owner or admin |
| **Middleware** | `requireAuth()` → `hasOrganizationRole(['owner', 'admin'])` |
| **Pattern** | Generic resolver for multi-param |

#### 4.1.5 Delete Organization

| Aspect | Details |
|--------|---------|
| **Route** | `DELETE /organization/:organizationId` |
| **Auth** | Organization owner only |
| **Middleware** | `requireAuth()` → `isOrganizationOwner.forInput()` |
| **Pattern** | `.forInput()` with mapInput |

### 4.2 Member Management

#### 4.2.1 List Members

| Aspect | Details |
|--------|---------|
| **Route** | `GET /organization/:organizationId/members` |
| **Web Route** | `/dashboard/organizations/[organizationId]/members` |
| **Auth** | Organization member |
| **Middleware** | `requireAuth()` → `isMemberOf.forInput()` |

#### 4.2.2 Invite Member

| Aspect | Details |
|--------|---------|
| **Route** | `POST /organization/:organizationId/members/invite` |
| **Auth** | `invite:create` permission in org |
| **Middleware** | `requireAuth()` → `hasOrganizationPermission({ invite: ['create'] })` |
| **Input** | `{ email: string, role: 'admin' | 'member' }` |

#### 4.2.3 Remove Member

| Aspect | Details |
|--------|---------|
| **Route** | `DELETE /organization/:organizationId/members/:memberId` |
| **Auth** | `member:delete` permission or org admin |
| **Middleware** | `requireAuth()` → `hasOrganizationRole(['owner', 'admin'])` |

#### 4.2.4 Update Member Role

| Aspect | Details |
|--------|---------|
| **Route** | `PATCH /organization/:organizationId/members/:memberId/role` |
| **Auth** | Org owner or admin (can't promote beyond own role) |
| **Middleware** | `requireAuth()` → `hasOrganizationRole(['owner', 'admin'])` |
| **Input** | `{ role: 'admin' | 'member' }` |

### 4.3 Admin Panel

#### 4.3.1 Admin Dashboard

| Aspect | Details |
|--------|---------|
| **Web Route** | `/dashboard/admin` |
| **Auth** | Platform admin or superAdmin |
| **Middleware** | `requireAuth()` → `hasRole(['admin', 'superAdmin'])` |
| **Shows** | Platform stats, quick actions |

#### 4.3.2 User Management

| Aspect | Details |
|--------|---------|
| **Route** | `GET /admin/users` |
| **Web Route** | `/dashboard/admin/users` |
| **Auth** | `user:list` permission |
| **Middleware** | `requireAuth()` → `hasPermission({ user: ['list'] })` |
| **Actions** | List, ban/unban, change role |

#### 4.3.3 All Organizations

| Aspect | Details |
|--------|---------|
| **Route** | `GET /admin/organizations` |
| **Web Route** | `/dashboard/admin/organizations` |
| **Auth** | `organization:list` permission |
| **Middleware** | `requireAuth()` → `hasPermission({ organization: ['list'] })` |

---

## 5. ORPC Middleware Patterns

### 5.1 Pattern Reference

```typescript
// ═══════════════════════════════════════════════════════════════════
// PATTERN 1: Static Permission Check
// Use when permission values are known at compile time
// ═══════════════════════════════════════════════════════════════════
.use(middleware.admin.hasPermission({ user: ['list'] }))
.use(middleware.admin.hasRole(['admin', 'superAdmin']))

// ═══════════════════════════════════════════════════════════════════
// PATTERN 2: Dynamic with .forInput() + mapInput (RECOMMENDED)
// Use for single-param methods with dynamic input
// ═══════════════════════════════════════════════════════════════════
.use(
  middleware.org.isMemberOf.forInput(),      // Returns middleware expecting string
  input => input.organizationId               // ORPC auto-types from schema
)

.use(
  middleware.org.isOrganizationOwner.forInput(),
  input => input.organizationId
)

.use(
  middleware.admin.hasPermission.forInput(),
  input => ({ [input.resource]: [input.action] })
)

// ═══════════════════════════════════════════════════════════════════
// PATTERN 3: Generic Resolver (for multi-param methods)
// Use when you need both dynamic AND static params
// ═══════════════════════════════════════════════════════════════════
interface Input { organizationId: string; /* ... */ }

.use(middleware.org.hasOrganizationRole<Input>(
  ctx => ctx.input.organizationId,    // Dynamic first param
  ['owner', 'admin']                   // Static second param
))

// ═══════════════════════════════════════════════════════════════════
// PATTERN 4: Composite Checks
// Use for complex permission logic (AND/OR combinations)
// ═══════════════════════════════════════════════════════════════════
.use(middleware.admin.composite([
  checks.admin.hasRole(['admin']),
  checks.admin.hasPermission({ system: ['view'] }),
]))
```

### 5.2 Method Compatibility Table

| Method | Single-Param | `.forInput()` | Pattern |
|--------|--------------|---------------|---------|
| `hasPermission(permissions)` | ✅ | ✅ Perfect | 1 or 2 |
| `hasRole(roles)` | ✅ | ✅ Perfect | 1 or 2 |
| `requireAdminRole()` | ✅ (no params) | N/A | 1 only |
| `hasPermissionByRole(role, perms)` | ❌ Multi | ⚠️ First only | 3 |
| `isMemberOf(orgId)` | ✅ | ✅ Perfect | 1 or 2 |
| `hasOrganizationRole(orgId, roles)` | ❌ Multi | ⚠️ First only | 3 |
| `isOrganizationOwner(orgId)` | ✅ | ✅ Perfect | 1 or 2 |
| `hasOrganizationPermission(perms)` | ✅ | ✅ Perfect | 1 or 2 |

---

## 6. Web Components

### 6.1 Permission-Aware Components

```tsx
// ═══════════════════════════════════════════════════════════════════
// RequirePermission - Shows children only if user has permission
// ═══════════════════════════════════════════════════════════════════
interface RequirePermissionProps {
  permission: PlatformPermission | OrganizationPermission;
  organizationId?: string;  // Required for org permissions
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

<RequirePermission 
  permission={{ organization: ['delete'] }}
  organizationId={organization.id}
  fallback={<Tooltip>Owner only</Tooltip>}
>
  <DeleteOrganizationButton />
</RequirePermission>

// ═══════════════════════════════════════════════════════════════════
// RequireRole - Shows children only if user has role
// ═══════════════════════════════════════════════════════════════════
interface RequireRoleProps {
  roles: OrganizationRole[];
  organizationId: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

<RequireRole roles={['owner', 'admin']} organizationId={org.id}>
  <SettingsTab />
</RequireRole>

// ═══════════════════════════════════════════════════════════════════
// RequirePlatformRole - Shows children only if user has platform role
// ═══════════════════════════════════════════════════════════════════
interface RequirePlatformRoleProps {
  roles: PlatformRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

<RequirePlatformRole roles={['admin', 'superAdmin']}>
  <AdminPanel />
</RequirePlatformRole>
```

### 6.2 Organization Components

```tsx
// Organization switcher for sidebar
<OrganizationSwitcher 
  organizations={organizations}
  activeOrganization={activeOrg}
  onSelect={handleOrgChange}
/>

// Member list with role badges and actions
<MemberList 
  organizationId={orgId}
  canManage={hasPermission('member:manage')}
/>

// Invite form with role selection
<InviteMemberForm 
  organizationId={orgId}
  availableRoles={['admin', 'member']}
/>

// Organization creation form
<CreateOrganizationForm onSuccess={handleCreated} />
```

### 6.3 Type-Safe Routing

```tsx
// ═══════════════════════════════════════════════════════════════════
// Link with typed params
// ═══════════════════════════════════════════════════════════════════
import { DashboardOrganizationDetail } from '@/routes';

<DashboardOrganizationDetail.Link organizationId={org.id}>
  View Organization
</DashboardOrganizationDetail.Link>

// ═══════════════════════════════════════════════════════════════════
// useParams with type safety
// ═══════════════════════════════════════════════════════════════════
import { useParams } from '@/routes/hooks';
import { DashboardOrganizationDetail } from '@/routes';

const { organizationId } = useParams(DashboardOrganizationDetail);
// organizationId is typed as string

// ═══════════════════════════════════════════════════════════════════
// Programmatic navigation
// ═══════════════════════════════════════════════════════════════════
import { usePush } from '@/routes/hooks';
import { DashboardOrganizationDetail } from '@/routes';

const push = usePush(DashboardOrganizationDetail);
push({ organizationId: newOrg.id });
```

#### 6.3.1 Route Builder Anatomy

All routes exported from `@/routes` are created via a typed builder generated from `page.info.ts` and `makeRoute`. A route builder exposes:

- `Link`: A typed component for links (params and search are validated at compile time)
- `ParamsLink`: Like `Link`, but accepts a single `params` object for convenience
- `Page`: Wraps a Next.js page to provide typed `params` and `search` in server components
- `immediate(router, params?, search?)`: Programmatic navigation using a Next.js router instance
- `validateParams(params)`: Runtime validation against the route's params schema
- `validateSearch(search)`: Runtime validation against the route's search schema
- `routeName`: Stable route identifier string (useful for logging/analytics)

Example of capabilities with the organization detail route:

```tsx
import { DashboardOrganizationDetail } from '@/routes'

// 1) Typed link with params
<DashboardOrganizationDetail.Link organizationId={org.id}>
  View Organization
</DashboardOrganizationDetail.Link>

// 2) ParamsLink variant
<DashboardOrganizationDetail.ParamsLink params={{ organizationId: org.id }}>
  Open
</DashboardOrganizationDetail.ParamsLink>

// 3) Programmatic navigation
import { useRouter } from 'next/navigation'
const router = useRouter()
DashboardOrganizationDetail.immediate(router, { organizationId: org.id })

// 4) Server component page with typed params/search
export default DashboardOrganizationDetail.Page(async ({ params }) => {
  // params.organizationId is fully typed and validated
  // fetch data using typed id
  return <OrgOverview organizationId={params.organizationId} />
})

// 5) Runtime guards (SSR or utilities)
const okParams = DashboardOrganizationDetail.validateParams({ organizationId: maybeId })
if (!okParams.success) {
  // handle invalid params
}
```

#### 6.3.2 Reading Params and Search

Use the hooks from `@/routes/hooks` for type-safe access to route params and search:

```tsx
import { useParams, useSearchParams } from '@/routes/hooks'
import { DashboardOrganizationMembers } from '@/routes'

// Params
const { organizationId } = useParams(DashboardOrganizationMembers)

// Search (typed via the page.info.ts search schema)
const { role, q } = useSearchParams(DashboardOrganizationMembers)
```

For interactive query state (search params) use `useSearchParamState`:

```tsx
import { useSearchParamState } from '@/routes/hooks'
import { DashboardOrganizationMembers } from '@/routes'

// Assuming the search schema defines: { role?: enum, q?: string }
const [search, setSearch] = useSearchParamState(DashboardOrganizationMembers)

// Update search params (URL is kept in sync, types are enforced)
setSearch({ role: 'admin', q: 'alice' })
```

Advanced SSR parsing helpers are available via `@/routes/utils` (e.g., `safeParseSearchParams`) when you need to parse `URLSearchParams` outside React.

#### 6.3.3 Rebuilding Routes

When you change any `page.info.ts` (path, params, search, or route name), regenerate the typed routes to keep everything in sync:

```bash
# Rebuild declarative routes after structural changes
bun run web -- dr:build
```

No rebuild is needed for purely schema refinements that do not alter route names/paths.

---

## 7. Better Auth Client Integration

> **IMPLEMENTATION NOTE**: This project uses custom React hooks wrapping authClient instead of calling authClient methods directly in components. See `apps/web/src/hooks/useOrganization.ts` for the full implementation.

### 7.1 Organization Hooks (Recommended Approach)

```typescript
import {
  useOrganizations,
  useOrganization,
  useOrganizationMembers,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useInviteOrganizationMember,
  useUpdateOrganizationMemberRole,
  useRemoveOrganizationMember,
} from '@/hooks/useOrganization';

// ═══════════════════════════════════════════════════════════════════
// List user's organizations
// ═══════════════════════════════════════════════════════════════════
const { data: organizations, isLoading } = useOrganizations({
  pagination: { page: 1, pageSize: 20 }
});

// ═══════════════════════════════════════════════════════════════════
// Get single organization with members
// ═══════════════════════════════════════════════════════════════════
const { data: organization } = useOrganization(organizationId, {
  enabled: !!organizationId
});

// ═══════════════════════════════════════════════════════════════════
// List organization members
// ═══════════════════════════════════════════════════════════════════
const { data: members } = useOrganizationMembers(organizationId);

// ═══════════════════════════════════════════════════════════════════
// Create organization
// ═══════════════════════════════════════════════════════════════════
const { mutate: createOrganization, isPending } = useCreateOrganization();

createOrganization({
  name: 'My Organization',
  slug: 'my-org',
}, {
  onSuccess: (org) => {
    // Automatically invalidates queries and shows success toast
    router.push(`/dashboard/organizations/${org.id}`);
  }
});

// ═══════════════════════════════════════════════════════════════════
// Update organization
// ═══════════════════════════════════════════════════════════════════
const { mutate: updateOrganization } = useUpdateOrganization();

updateOrganization({
  organizationId: org.id,
  data: { name: 'New Name' }
});

// ═══════════════════════════════════════════════════════════════════
// Delete organization
// ═══════════════════════════════════════════════════════════════════
const { mutate: deleteOrganization } = useDeleteOrganization();

deleteOrganization({ organizationId: org.id }, {
  onSuccess: () => {
    router.push('/dashboard/organizations');
  }
});

// ═══════════════════════════════════════════════════════════════════
// Invite member
// ═══════════════════════════════════════════════════════════════════
const { mutate: inviteMember } = useInviteOrganizationMember();

inviteMember({
  organizationId: org.id,
  email: 'user@example.com',
  role: 'member',
});

// ═══════════════════════════════════════════════════════════════════
// Update member role
// ═══════════════════════════════════════════════════════════════════
const { mutate: updateMemberRole } = useUpdateOrganizationMemberRole();

updateMemberRole({
  organizationId: org.id,
  memberId: member.id,
  newRole: 'admin',
});

// ═══════════════════════════════════════════════════════════════════
// Remove member
// ═══════════════════════════════════════════════════════════════════
const { mutate: removeMember } = useRemoveOrganizationMember();

removeMember({
  organizationId: org.id,
  memberId: member.id,
});
```

### 7.2 Direct authClient Usage (Low-Level)

> **Note**: For UI components, prefer the hooks above. Direct authClient methods are available but require manual cache invalidation and error handling.

```typescript
import { authClient } from '@/lib/auth';

// Direct API calls (used internally by hooks)
const result = await authClient.organization.create({
  name: 'My Organization',
  slug: 'my-org',
});

if (result.error) {
  console.error(result.error.message);
} else {
  console.log('Created:', result.data);
}

// Other direct methods available:
// - authClient.organization.list()
// - authClient.organization.getFullOrganization({ organizationId })
// - authClient.organization.update({ organizationId, data })
// - authClient.organization.delete({ organizationId })
// - authClient.organization.inviteMember({ organizationId, email, role })
// - authClient.organization.removeMember({ organizationId, memberId })
// - authClient.organization.updateMemberRole({ organizationId, memberId, role })
```

### 7.3 Type Inference from authClient

```typescript
// All types are inferred from authClient.$Infer
type Organization = typeof authClient.$Infer.Organization;
type OrganizationMember = typeof authClient.$Infer.Member;
type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;

// Role types are inferred from method parameters
type InviteMemberParams = Parameters<typeof authClient.organization.inviteMember>[0];
type OrganizationRole = InviteMemberParams['role']; // 'owner' | 'admin' | 'member'
```

### 7.4 Admin Client Methods

> **TODO**: Create `useAdmin.ts` hooks similar to `useOrganization.ts` for admin operations.

```typescript
import { authClient } from '@/lib/auth';

// ═══════════════════════════════════════════════════════════════════
// List all users (admin only)
// ═══════════════════════════════════════════════════════════════════
const { data: users } = await authClient.admin.listUsers({
  limit: 20,
  offset: 0,
});

// ═══════════════════════════════════════════════════════════════════
// Ban user
// ═══════════════════════════════════════════════════════════════════
await authClient.admin.banUser({ userId: user.id });

// ═══════════════════════════════════════════════════════════════════
// Unban user
// ═══════════════════════════════════════════════════════════════════
await authClient.admin.unbanUser({ userId: user.id });

// ═══════════════════════════════════════════════════════════════════
// Set user role
// ═══════════════════════════════════════════════════════════════════
await authClient.admin.setRole({
  userId: user.id,
  role: 'admin',
});
```

---

## 8. Implementation Phases

### Phase 1: API Foundation (Estimated: 4-6 hours)

**Deliverables:**
1. [ ] Organization contracts in `packages/contracts/api/modules/organization/`
2. [ ] Organization module in `apps/api/src/modules/organization/`
3. [ ] ORPC endpoints showcasing ALL middleware patterns
4. [ ] Unit tests for permission checks

**Files to Create:**
- `packages/contracts/api/modules/organization/index.ts`
- `packages/contracts/api/modules/organization/list.ts`
- `packages/contracts/api/modules/organization/create.ts`
- `packages/contracts/api/modules/organization/findById.ts`
- `packages/contracts/api/modules/organization/update.ts`
- `packages/contracts/api/modules/organization/delete.ts`
- `packages/contracts/api/modules/organization/members/index.ts`
- `packages/contracts/api/modules/organization/members/list.ts`
- `packages/contracts/api/modules/organization/members/invite.ts`
- `packages/contracts/api/modules/organization/members/remove.ts`
- `packages/contracts/api/modules/organization/members/updateRole.ts`
- `apps/api/src/modules/organization/organization.module.ts`
- `apps/api/src/modules/organization/controllers/organization.controller.ts`
- `apps/api/src/modules/organization/services/organization.service.ts`

### Phase 2: Web App Structure (Estimated: 4-6 hours)

**Deliverables:**
1. [ ] Dashboard layout with sidebar navigation
2. [ ] Organization list and create pages
3. [ ] Organization detail pages (overview, settings, members, invites)
4. [ ] Declarative routing (`page.info.ts`) for all routes

**Files to Create:**
- `apps/web/src/app/(app)/dashboard/layout.tsx`
- `apps/web/src/app/(app)/dashboard/page.tsx`
- `apps/web/src/app/(app)/dashboard/page.info.ts`
- `apps/web/src/app/(app)/dashboard/organizations/page.tsx`
- `apps/web/src/app/(app)/dashboard/organizations/page.info.ts`
- `apps/web/src/app/(app)/dashboard/organizations/new/page.tsx`
- `apps/web/src/app/(app)/dashboard/organizations/new/page.info.ts`
- `apps/web/src/app/(app)/dashboard/organizations/[organizationId]/layout.tsx`
- `apps/web/src/app/(app)/dashboard/organizations/[organizationId]/page.tsx`
- `apps/web/src/app/(app)/dashboard/organizations/[organizationId]/page.info.ts`
- `apps/web/src/app/(app)/dashboard/organizations/[organizationId]/settings/page.tsx`
- `apps/web/src/app/(app)/dashboard/organizations/[organizationId]/settings/page.info.ts`
- `apps/web/src/app/(app)/dashboard/organizations/[organizationId]/members/page.tsx`
- `apps/web/src/app/(app)/dashboard/organizations/[organizationId]/members/page.info.ts`

### Phase 3: Permission Components (Estimated: 2-3 hours)

**Deliverables:**
1. [ ] `<RequirePermission>` component
2. [ ] `<RequireRole>` component
3. [ ] `<RequirePlatformRole>` component
4. [ ] Organization context provider
5. [ ] Permission hooks

**Files to Create:**
- `apps/web/src/components/auth/RequirePermission.tsx`
- `apps/web/src/components/auth/RequireRole.tsx`
- `apps/web/src/components/auth/RequirePlatformRole.tsx`
- `apps/web/src/components/auth/index.ts`
- `apps/web/src/contexts/OrganizationContext.tsx`
- `apps/web/src/hooks/useOrganization.ts`
- `apps/web/src/hooks/useOrganizationPermission.ts`

### Phase 4: Admin Panel (Estimated: 3-4 hours)

**Deliverables:**
1. [ ] Admin dashboard
2. [ ] User management pages
3. [ ] Platform organization view
4. [ ] System settings page

**Files to Create:**
- `apps/web/src/app/(app)/dashboard/admin/layout.tsx`
- `apps/web/src/app/(app)/dashboard/admin/page.tsx`
- `apps/web/src/app/(app)/dashboard/admin/page.info.ts`
- `apps/web/src/app/(app)/dashboard/admin/users/page.tsx`
- `apps/web/src/app/(app)/dashboard/admin/users/page.info.ts`
- `apps/web/src/app/(app)/dashboard/admin/organizations/page.tsx`
- `apps/web/src/app/(app)/dashboard/admin/organizations/page.info.ts`
- `apps/web/src/app/(app)/dashboard/admin/system/page.tsx`
- `apps/web/src/app/(app)/dashboard/admin/system/page.info.ts`

### Phase 5: Integration & Showcase (Estimated: 2-3 hours)

**Deliverables:**
1. [ ] ORPC hooks for organization endpoints
2. [ ] Auth showcase page with interactive demo
3. [ ] Integration tests
4. [ ] Documentation updates

**Files to Create:**
- `apps/web/src/hooks/useOrganization.orpc-hooks.ts`
- `apps/web/src/app/showcase/auth/page.tsx`
- `apps/web/src/app/showcase/auth/page.info.ts`

---

## 9. Data Models

### 9.1 Organization (Better Auth)

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

### 9.2 Member (Better Auth)

```typescript
interface Member {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}
```

### 9.3 Invitation (Better Auth)

```typescript
interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'canceled';
  expiresAt: Date;
  inviterId: string;
}
```

---

## 10. API Response Schemas

### 10.1 Organization Responses

```typescript
// List organizations response
interface ListOrganizationsResponse {
  organizations: Organization[];
  total: number;
}

// Organization detail response
interface OrganizationDetailResponse {
  organization: Organization;
  membership: {
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
  };
  stats: {
    memberCount: number;
    pendingInvites: number;
  };
}
```

### 10.2 Member Responses

```typescript
// List members response
interface ListMembersResponse {
  members: Member[];
  total: number;
}

// Invite response
interface InviteMemberResponse {
  invitation: Invitation;
}
```

---

## 11. Error Handling

### 11.1 Permission Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Authenticated but no permission |
| `ORG_NOT_FOUND` | 404 | Organization doesn't exist |
| `NOT_A_MEMBER` | 403 | User is not a member of org |
| `INSUFFICIENT_ROLE` | 403 | User's role is too low |
| `MISSING_PERMISSION` | 403 | Specific permission missing |

### 11.2 Error Response Format

```typescript
interface PermissionError {
  code: string;
  message: string;
  details?: {
    required?: string[];      // Required permissions
    userRole?: string;        // User's current role
    requiredRole?: string[];  // Required roles
  };
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

- Permission check functions
- Middleware behavior
- Component rendering

### 12.2 Integration Tests

- API endpoint permissions
- Role-based access
- Organization membership flow

### 12.3 E2E Tests (Future)

- Complete user flows
- Organization lifecycle
- Admin panel operations

---

## 13. Success Criteria

1. **Functional**: All CRUD operations work with proper permission checks
2. **Type-Safe**: No TypeScript errors, full inference from contracts to UI
3. **Patterns Demonstrated**: All 4 middleware patterns showcased
4. **UI/UX**: Clean, responsive dashboard with clear permission feedback
5. **Documentation**: Inline code comments explain patterns
6. **Tests**: Core permission logic has test coverage

---

## 14. Open Questions

1. **Projects Feature**: Should we include a simple "projects" entity within organizations to demonstrate nested resources?
2. **Invitation Flow**: Full email invitation flow or simplified in-app accept?
3. **Admin Impersonation**: Include "login as user" feature for admins?
4. **Audit Logging**: Include audit log UI for permission changes?

---

## Appendix A: Role Hierarchy

### Platform Roles
```
superAdmin (all permissions)
    └── admin (user management, org oversight)
            └── user (basic authenticated access)
```

### Organization Roles
```
owner (full org control, can delete, transfer)
    └── admin (member management, settings)
            └── member (basic org access)
```

---

## Appendix B: Permission Matrix

### Platform Permissions by Role

| Resource | Action | superAdmin | admin | user |
|----------|--------|------------|-------|------|
| user | list | ✅ | ✅ | ❌ |
| user | read | ✅ | ✅ | ✅ (own) |
| user | create | ✅ | ✅ | ❌ |
| user | ban | ✅ | ✅ | ❌ |
| user | setRole | ✅ | ✅ | ❌ |
| user | impersonate | ✅ | ❌ | ❌ |
| organization | list | ✅ | ✅ | ✅ (own) |
| organization | create | ✅ | ✅ | ✅ |
| system | configure | ✅ | ❌ | ❌ |

### Organization Permissions by Role

| Resource | Action | owner | admin | member |
|----------|--------|-------|-------|--------|
| settings | read | ✅ | ✅ | ✅ |
| settings | update | ✅ | ✅ | ❌ |
| member | list | ✅ | ✅ | ✅ |
| member | manage | ✅ | ✅ | ❌ |
| member | delete | ✅ | ✅ | ❌ |
| invite | create | ✅ | ✅ | ❌ |
| invite | delete | ✅ | ✅ | ❌ |
| organization | delete | ✅ | ❌ | ❌ |
| organization | transfer | ✅ | ❌ | ❌ |
