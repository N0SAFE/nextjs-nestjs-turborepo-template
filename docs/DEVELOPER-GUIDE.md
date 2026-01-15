📍 [Documentation Hub](../.docs/README.md) > Developer Guide

# Developer Onboarding Guide

> **Last Updated**: January 2026  
> **Target Audience**: New developers joining the project  
> **Prerequisite**: Complete [Getting Started](../.docs/guides/GETTING-STARTED.md) setup

This guide explains the core principles, patterns, and workflows used throughout this Next.js + NestJS turborepo template. After reading this, you'll understand how to work effectively with authentication, API design, data fetching, error handling, and all other system components.

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Core Principles](#core-principles)
- [Development Workflow](#development-workflow)
- [Authentication System](#authentication-system)
- [Authorization & Permissions](#authorization--permissions)
- [API Layer (ORPC)](#api-layer-orpc)
- [Data Fetching (React Query)](#data-fetching-react-query)
- [Declarative Routing](#declarative-routing)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [State Management](#state-management)
- [UI Components](#ui-components)
- [Testing](#testing)
- [Docker Development](#docker-development)
- [Common Tasks](#common-tasks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Reference

| What You Need | Where To Look |
|---------------|---------------|
| Run development server | `bun run dev` |
| Run tests | `bun run test` |
| Type check | `bun run type-check` |
| Lint code | `bun run lint` |
| Format code | `bun run format` |
| Database migrations | `bun run api -- db:generate` |
| Rebuild routes | `bun run web -- dr:build` |
| Add UI component | `bun run ui-add <component>` |
| Check logs | `bun run dev:api:logs` or `bun run dev:web:logs` |

---

## Core Principles

### 1. **Docker-First Development**

Everything runs in Docker containers by default. This ensures consistency across all development environments.

```bash
# Start full stack (API + Web + Database + Redis)
bun run dev

# Start only API with database
bun run dev:api

# Start only Web app
bun run dev:web
```

**Why Docker?**
- Consistent environment across team
- Easy service dependencies (PostgreSQL, Redis)
- No "works on my machine" issues
- Production parity

### 2. **Type Safety End-to-End**

Every layer is fully typed from database to UI:

```
PostgreSQL Schema (Drizzle)
  ↓
API Contracts (ORPC)
  ↓
Domain Hooks (React Query + ORPC Client)
  ↓
React Components (TypeScript)
```

**Result**: Change your database schema → API types update automatically → Hooks use updated contracts → Compiler catches breaking changes.

### 3. **Declarative Over Imperative**

We prefer declarative patterns that generate code and enforce constraints:

- **Routing**: `<Route.Link>` instead of `<Link href="/path">`
- **API Calls**: Domain hooks instead of raw `fetch()`
- **Forms**: Schema-based validation instead of manual checks
- **Permissions**: Declarative components instead of if-statements

### 4. **Monorepo Organization**

Code is organized by concern, not by file type:

```
apps/
  api/          # Backend (NestJS)
  web/          # Frontend (Next.js)
  doc/          # Documentation (Fumadocs)

packages/
  utils/        # Shared utilities
  ui/           # UI components
  contracts/    # API contracts
  configs/      # Shared configs
```

### 5. **Convention Over Configuration**

We follow strong conventions to reduce decision fatigue:

- **Hooks**: `useEntity` for queries, `useEntityActions` for mutations
- **Files**: `route.info.ts` for routes, `*.errors.ts` for domain errors
- **Errors**: Domain-specific error handlers (`handleUserError`, `handleAdminError`)
- **Query Keys**: Defined in hook files following hierarchical pattern

---

## Development Workflow

### Daily Development

**1. Start Development Environment**

```bash
# Terminal 1: Start all services
bun run dev

# Wait for services to be ready (watch logs)
# - API: http://localhost:3001/health
# - Web: http://localhost:3000
```

**2. Make Changes**

```bash
# Changes to apps/api → API container auto-restarts
# Changes to apps/web → Next.js hot reloads
# Changes to packages/* → Turborepo rebuilds dependencies
```

**3. Type Check**

```bash
# Check entire monorepo
bun run type-check

# Check specific app
bun run web -- type-check
bun run api -- type-check
```

**4. Run Tests**

```bash
# All tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage
```

### Development Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start full development stack |
| `bun run dev:api` | Start API + database only |
| `bun run dev:web` | Start web app only |
| `bun run build` | Build all packages and apps |
| `bun run clean` | Clean all build artifacts |
| `bun run type-check` | TypeScript type checking |
| `bun run lint` | ESLint all code |
| `bun run format` | Prettier format all code |
| `bun run test` | Run all tests |

### Hot Reloading

- **Web App**: Next.js Fast Refresh - instant UI updates
- **API**: NestJS watch mode - auto-restart on changes
- **Packages**: Turborepo cache - instant rebuilds

---

## Authentication System

We use **Better Auth** for authentication with custom session management.

### Architecture

```
Client (Browser)
  ↓ authClient.signIn.email()
Better Auth Client (@repo/auth/react)
  ↓ HTTP Request
API (/api/auth/*)
  ↓
Better Auth Server (@repo/auth/server)
  ↓
PostgreSQL (session/user tables)
```

### Key Concepts

**1. Server-Side Session Hydration**

Sessions are fetched on the server and hydrated to React Query cache:

```tsx
// apps/web/src/app/layout.tsx
<SessionHydrationProvider>
  <MainNavigation />
  {children}
</SessionHydrationProvider>
```

**Result**: Client components can read session instantly without loading states.

**2. Two Ways to Access Session**

**Option A: Client Components (React Query)**

```tsx
'use client'
import { useSession } from '@/lib/auth'

export function ProfileButton() {
  const { data: session, isPending } = useSession()
  
  if (isPending) return <Spinner />
  if (!session?.user) return <SignInButton />
  
  return <UserMenu user={session.user} />
}
```

**Option B: Server Components (Direct Fetch)**

```tsx
// apps/web/src/app/dashboard/page.tsx
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) redirect('/auth/login')
  
  return <Dashboard user={session.user} />
}
```

**3. Protected Routes**

Use the `SessionRoute` pattern for pages that require authentication:

```tsx
// apps/web/src/app/dashboard/profile/page.tsx
import { AuthDashboardProfile } from '@/routes'

export default AuthDashboardProfile.SessionRoute(async ({ session }) => {
  // session is guaranteed to exist (redirects to login if not)
  return <ProfilePage user={session.user} />
})
```

### Authentication Hooks

Implemented in `apps/web/src/domains/auth/hooks.ts` following domain patterns:

| Hook | Purpose |
|------|---------|
| `useSession()` | Get current session |
| `useSignIn()` | Sign in with email/password |
| `useSignOut()` | Sign out current user |
| `useSignUp()` | Create new account |
| `useResetPassword()` | Reset forgotten password |
| `useUpdateProfile()` | Update user profile |
| `useChangePassword()` | Change user password |
| `useAuthActions()` | Composite hook with all actions |

**Example: Sign In Form**

```tsx
'use client'
import { useSignIn } from '@/domains/auth/hooks'

export function SignInForm() {
  const { mutate: signIn, isPending, error } = useSignIn()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    signIn({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
    </form>
  )
}
```

### Configuration

**Better Auth Config** (`packages/utils/auth/src/server/index.ts`):

```typescript
export const createAuthConfig = (options: AuthConfigOptions) => ({
  database: options.database,
  secret: options.secret,
  
  // Email/Password auth
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  // Session settings
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // 1 day
  },
  
  // Plugins
  plugins: [
    admin(),           // Admin panel
    organization(),    // Organization management
  ],
})
```

### Session Storage

Sessions are stored in PostgreSQL using Drizzle ORM:

```typescript
// Database tables (auto-created by Better Auth)
- user
- session
- account
- verification
```

---

## Authorization & Permissions

We use a **dual-layer permission system** for platform-level and organization-level access control.

### Architecture

```
User
  ├── Platform Role (superAdmin, admin, user)
  │   └── Platform Permissions (admin:users:read, admin:roles:write, etc.)
  │
  └── Organization Memberships
      └── Organization Role per Org (owner, admin, member)
          └── Organization Permissions (org:members:invite, etc.)
```

### Platform Permissions

**Platform Roles** (`@repo/auth` package):

```typescript
type PlatformRole = 'superAdmin' | 'admin' | 'user'
```

**Checking Platform Permissions**:

```tsx
// Client Component
import { usePermissions } from '@/lib/permissions'

export function AdminPanel() {
  const { platform } = usePermissions()
  
  if (!platform.can('admin:users:read')) {
    return <AccessDenied />
  }
  
  return <UserManagementTable />
}
```

**Server Component**:

```tsx
import { checkPlatformPermission } from '@repo/auth/permissions'

export default async function AdminUsersPage() {
  const session = await auth()
  const hasAccess = checkPlatformPermission(
    session?.user,
    'admin:users:read'
  )
  
  if (!hasAccess) return <AccessDenied />
  
  return <UsersList />
}
```

### Organization Permissions

**Organization Roles**:

```typescript
type OrganizationRole = 'owner' | 'admin' | 'member'
```

**Checking Organization Permissions**:

```tsx
import { usePermissions } from '@/lib/permissions'

export function InviteMemberButton({ orgId }: { orgId: string }) {
  const { organization } = usePermissions()
  
  if (!organization.can('org:members:invite', orgId)) {
    return null // Hide button if no permission
  }
  
  return <button onClick={handleInvite}>Invite Member</button>
}
```

### Permission Components

**RequirePlatformRole** - Hide UI based on platform role:

```tsx
import { RequirePlatformRole } from '@/components/auth'

export function Dashboard() {
  return (
    <>
      <h1>Dashboard</h1>
      
      <RequirePlatformRole roles={['admin', 'superAdmin']}>
        <AdminSection />
      </RequirePlatformRole>
      
      <RegularUserContent />
    </>
  )
}
```

**RequirePermission** - Hide UI based on specific permission:

```tsx
import { RequirePermission } from '@/components/auth'

export function UserActions({ userId }: { userId: string }) {
  return (
    <div>
      <RequirePermission permission="admin:users:read">
        <ViewUserButton userId={userId} />
      </RequirePermission>
      
      <RequirePermission permission="admin:users:write">
        <EditUserButton userId={userId} />
      </RequirePermission>
      
      <RequirePermission permission="admin:users:delete">
        <DeleteUserButton userId={userId} />
      </RequirePermission>
    </div>
  )
}
```

### API-Level Authorization

**NestJS with ORPC** (`apps/api`):

```typescript
import { requireAuth, requireRole } from '@/core/modules/auth/orpc/middlewares'

export const userController = {
  // Public endpoint
  list: RouteBuilder.get('/users')
    .input(z.object({ limit: z.number().default(20) }))
    .handler(async ({ input }) => {
      return getUserList(input)
    }),
  
  // Requires authentication
  me: RouteBuilder.get('/users/me')
    .use(requireAuth())
    .handler(async ({ context }) => {
      return context.auth.user
    }),
  
  // Requires admin role
  delete: RouteBuilder.delete('/users/:id')
    .use(requireAuth())
    .use(adminMiddlewares.requireRole(['admin', 'superAdmin']))
    .handler(async ({ input, context }) => {
      return deleteUser(input.id, context.auth.user)
    }),
}
```

### Permission Hooks

Located in `apps/web/src/hooks/usePermissions.ts`:

| Hook | Purpose |
|------|---------|
| `usePermissions()` | Get permission checker for platform and org |
| `useHasPlatformPermission()` | Check single platform permission |
| `useHasOrganizationPermission()` | Check single org permission |

---

## API Layer (ORPC + Better Auth)

We use **ORPC** for type-safe API communication between Next.js frontend and NestJS backend, plus **Better Auth** for authentication endpoints.

### Architecture

```
apps/web (Client)
  ↓ useUserList() / useSession()
Domain Hooks (React Query + ORPC/Better Auth)
  ↓
ORPC Client ← packages/contracts/api (Shared Contracts) → apps/api (NestJS)
Better Auth Client ← packages/utils/auth (Shared Config) → Better Auth Server
  ↓
Database (Drizzle ORM)
```

### Domain-Based Organization

The codebase uses a **domain-based architecture** where code is organized by feature areas under `apps/web/src/domains/`:

```
apps/web/src/domains/
├── user/              # User management domain
│   ├── endpoints.ts   # Endpoint definitions (ORPC re-exports)
│   ├── hooks.ts       # React Query hooks
│   ├── invalidations.ts # Cache invalidation config
│   └── schemas.ts     # Zod validation schemas
├── auth/              # Authentication domain
│   ├── endpoints.ts   # Custom contracts (Better Auth)
│   ├── hooks.ts       # Auth hooks (session, signIn, etc.)
│   ├── invalidations.ts
│   └── schemas.ts
├── organization/      # Organization domain
│   └── ...
└── shared/            # Shared utilities
    ├── helpers.ts     # custom(), wrapWithInvalidations, etc.
    └── config.ts      # STALE_TIME constants
```

**Backward Compatibility**: Old hooks in `apps/web/src/hooks/` are deprecated and re-export from domains:

```typescript
// apps/web/src/hooks/useUser.ts
/** @deprecated Use hooks from '@/domains/user/hooks' instead */
export * from '@/domains/user/hooks'
```

### Domain Structure (3-File Pattern)

Each domain follows a standardized structure:

#### 1. **endpoints.ts** - Endpoint Definitions

This file defines all endpoints for a domain, supporting two types:

**A. ORPC Contracts** (from NestJS API):

```typescript
// apps/web/src/domains/user/endpoints.ts
import { orpc } from '@/lib/orpc'

// Direct re-export of ORPC contracts
export const userEndpoints = {
  list: orpc.user.list,
  findById: orpc.user.findById,
  create: orpc.user.create,
  update: orpc.user.update,
  delete: orpc.user.delete,
} as const
```

**B. Custom Contracts** (for Better Auth SDK or custom logic):

```typescript
// apps/web/src/domains/auth/endpoints.ts
import { custom, mapBetterAuth } from '@/domains/shared/helpers'
import { authClient } from '@/lib/auth/options'
import { DEFAULT_SESSION_QUERY_KEY } from '@repo/auth/react'

export const authEndpoints = {
  // Custom contract wrapping Better Auth SDK
  session: custom({
    keys: DEFAULT_SESSION_QUERY_KEY,
    handler: authClient.getSession,
    map: mapBetterAuth(), // Extracts data from Better Auth response
    staleTime: 1000 * 60, // 1 minute
  }),
  
  signIn: custom({
    input: signInSchema, // Zod validation
    keys: (i) => ['auth', 'signIn', i], // Dynamic query key
    handler: authClient.signIn.email,
    map: mapBetterAuth(), // Handles error extraction
  }),
  
  signOut: custom({
    keys: (i) => ['auth', 'signOut', i],
    handler: authClient.signOut,
    map: mapBetterAuth(),
  }),
} as const
```

**Key Points**:
- ORPC endpoints are simple re-exports (no wrappers needed)
- Custom contracts use `custom()` helper to create ORPC-compatible endpoints
- Both types share the same API: `.call()`, `.queryOptions()`, `.mutationOptions()`, `.queryKey()`
- `mapBetterAuth()` helper extracts data from Better Auth responses and handles errors automatically

#### 2. **invalidations.ts** - Cache Invalidation Config

This file defines which queries to invalidate after mutations using `defineInvalidations()`:

```typescript
// apps/web/src/domains/user/invalidations.ts
import { defineInvalidations } from '@/domains/shared/helpers'
import { userEndpoints } from './endpoints'

export const userInvalidations = defineInvalidations(userEndpoints, {
  // After creating a user, invalidate the list and count
  create: ({ keys }) => [keys.list(), keys.count()],
  
  // After updating, invalidate specific user and list (might affect sort)
  update: ({ input, keys }) => [
    keys.findById({ input: { id: input.id } }),
    keys.list(),
  ],
  
  // After deleting, remove from cache and invalidate list
  delete: ({ input, keys }) => [
    keys.findById({ input: { id: input.id } }),
    keys.list(),
    keys.count(),
  ],
})
```

**Cross-Domain Invalidations**:

You can also invalidate queries from other domains:

```typescript
// apps/web/src/domains/organization/invalidations.ts
import { authInvalidations } from '@/domains/auth/invalidations'

export const organizationInvalidations = defineInvalidations(organizationEndpoints, {
  // When creating an org, invalidate auth session (active org changed)
  create: ({ keys }) => [
    keys.list(),
    authInvalidations.session({}), // Cross-domain invalidation
  ],
})
```

#### 3. **hooks.ts** - React Query Hooks with Type-Safe Cache Operations

This file contains manually written React Query hooks that use endpoints and cache operations:

```typescript
// apps/web/src/domains/user/hooks.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userEndpoints } from './endpoints'
import { wrapWithInvalidations } from '@/domains/shared/helpers'
import { userInvalidations } from './invalidations'
import { toast } from 'sonner'

// Enhance endpoints with automatic invalidation
const enhancedUser = wrapWithInvalidations(userEndpoints, userInvalidations)

// ============================================================================
// QUERY HOOKS (Read Operations)
// ============================================================================

/**
 * Fetch list of users with pagination
 */
export function useUsers(options?: {
  pagination?: { page?: number; pageSize?: number }
  enabled?: boolean
}) {
  return useQuery(
    enhancedUser.list.queryOptions({
      input: options?.pagination,
      enabled: options?.enabled ?? true,
    })
  )
}

/**
 * Fetch single user by ID
 */
export function useUser(userId: string, options?: { enabled?: boolean }) {
  return useQuery(
    enhancedUser.findById.queryOptions({
      input: { id: userId },
      enabled: (options?.enabled ?? true) && !!userId,
    })
  )
}

// ============================================================================
// MUTATION HOOKS (Write Operations)
// ============================================================================

/**
 * Create a new user
 * Automatically invalidates user list and updates cache after success
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation(
    enhancedUser.create.mutationOptions({
      onSuccess: enhancedUser.create.withInvalidationOnSuccess((newUser) => {
        toast.success(`User "${newUser.name}" created!`)
      })),
      onError: (error: Error) => {
        toast.error(`Failed to create user: ${error.message}`)
      },
    })
  )
}

/**
 * Update an existing user
 * Updates cache optimistically and invalidates related queries
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation(
    enhancedUser.update.mutationOptions({
      onMutate: async (variables) => {
        // Cancel ongoing queries
        await enhancedUser.findById.cache.cancel(
          queryClient,
          { id: variables.id }
        )
        
        // Optimistic update
        const previous = enhancedUser.findById.cache.get(
          queryClient,
          { id: variables.id }
        )
        
        enhancedUser.findById.cache.set(
          queryClient,
          { id: variables.id },
          (old) => ({
            ...old,
            ...variables,
          })
        )
        
        return { previous }
      },
      onSuccess: enhancedUser.update.withInvalidationOnSuccess((updatedUser) => {
        // Confirm cache update
        enhancedUser.findById.cache.set(
          queryClient,
          { id: updatedUser.id },
          updatedUser
        )
        
        toast.success(`User "${updatedUser.name}" updated!`)
      }),
      onError: (error: Error, variables, context) => {
        // Rollback on error
        if (context?.previous) {
          enhancedUser.findById.cache.set(
            queryClient,
            { id: variables.id },
            context.previous
          )
        }
        
        toast.error(`Failed to update user: ${error.message}`)
      },
    })
  )
}

/**
 * Delete a user
 * Removes from cache and invalidates list
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation(
    enhancedUser.delete.mutationOptions({
      onSuccess: enhancedUser.delete.withInvalidationOnSuccess((_, variables) => {
        // Remove from cache completely
        enhancedUser.findById.cache.remove(
          queryClient,
          { id: variables.id }
        )
        
        toast.success('User deleted successfully')
      }),
      onError: (error: Error) => {
        toast.error(`Failed to delete user: ${error.message}`)
      },
    })
  )
}

// ============================================================================
// COMPOSITE HOOKS (Multiple Operations)
// ============================================================================

/**
 * Get all user mutations in one hook
 */
export function useUserActions() {
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  return {
    createUser: createUser.mutate,
    createUserAsync: createUser.mutateAsync,
    updateUser: updateUser.mutate,
    updateUserAsync: updateUser.mutateAsync,
    deleteUser: deleteUser.mutate,
    deleteUserAsync: deleteUser.mutateAsync,
    
    isLoading: {
      create: createUser.isPending,
      update: updateUser.isPending,
      delete: deleteUser.isPending,
    },
    
    errors: {
      create: createUser.error,
      update: updateUser.error,
      delete: deleteUser.error,
    },
  }
}

/**
 * Get user profile with cache access
 */
export function useUserProfile(userId: string) {
  const queryClient = useQueryClient()
  const { data, ...query } = useUser(userId)
  
  return {
    user: data,
    ...query,
    
    // Manual cache operations if needed
    updateCache: (updater: (old: typeof data) => typeof data) => {
      enhancedUser.findById.cache.set(
        queryClient,
        { id: userId },
        updater
      )
    },
    
    getCached: () => enhancedUser.findById.cache.get(
      queryClient,
      { id: userId }
    ),
  }
}
```

### Using Domain Hooks

**Pattern 1: Query Hooks (Read Data)**

```tsx
'use client'
import { useUsers } from '@/domains/user/hooks'

export function UserListPage() {
  const { data, isLoading, error } = useUsers({
    pagination: { page: 1, pageSize: 20 }
  })
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorState error={error} />
  
  return (
    <div>
      {data?.users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

**Pattern 2: Mutation Hooks (Write Data)**

```tsx
'use client'
import { useCreateUser } from '@/domains/user/hooks'

export function CreateUserForm() {
  const { mutate, isPending, error } = useCreateUser()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    
    mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
      {error && <ErrorState error={error} />}
    </form>
  )
}
```

**Pattern 3: Composite Hooks (Multiple Operations)**

```tsx
'use client'
import { useUserActions } from '@/domains/user/hooks'

export function UserManagement() {
  const {
    createUser,
    updateUser,
    deleteUser,
    isLoading,
    errors,
  } = useUserActions()
  
  return (
    <div>
      <button 
        onClick={() => createUser({ name: 'John', email: 'john@example.com' })}
        disabled={isLoading.create}
      >
        {isLoading.create ? 'Creating...' : 'Create'}
      </button>
      
      {errors.create && <ErrorState error={errors.create} />}
    </div>
  )
}
```

### Backend Implementation (NestJS)
// WRONG: this is wrong recheck the real implementation to know of everythings work (use the implement function)

Controllers implement ORPC contracts in the NestJS API:

```typescript
// apps/api/src/modules/user/user.controller.ts
import { userContract } from '@repo/api-contracts'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @ORPCRoute(userContract.list)
  async list(@ORPCInput() input: ListUsersInput) {
    return this.userService.list(input)
  }
  
  @ORPCRoute(userContract.findById)
  async findById(@ORPCInput() input: { id: string }) {
    return this.userService.findById(input.id)
  }
  
  @ORPCRoute(userContract.create)
  async create(@ORPCInput() input: CreateUserInput) {
    return this.userService.create(input)
  }
}
```

### Adding New Endpoints/Hooks
// TODO: add explanation on how to use the standard() function for 

**Step 1: Define Contract** (`packages/contracts/api/`)

```typescript
// packages/contracts/api/common/user.ts
export const userContract = {
  findByEmail: RouteBuilder.get('/users/by-email/:email')
    .input(z.object({ email: z.string().email() }))
    .output(userSchema),
}
```

**Step 2: Implement in NestJS** (`apps/api/src/`)

```typescript
// apps/api/src/modules/user/user.controller.ts
@ORPCRoute(userContract.findByEmail)
async findByEmail(@ORPCInput() input: { email: string }) {
  return this.userService.findByEmail(input.email)
}
```

**Step 3: Add to Domain Endpoints** (`apps/web/src/domains/user/`)

```typescript
// apps/web/src/domains/user/endpoints.ts
export const userEndpoints = {
  // ... existing endpoints
  findByEmail: orpc.user.findByEmail,
} as const
```

**Step 4: Add Invalidation Rule** (optional)

```typescript
// apps/web/src/domains/user/invalidations.ts
export const userInvalidations = defineInvalidations(userEndpoints, {
  // ... existing invalidations
  
  // No invalidation needed for findByEmail (read-only)
})
```

**Step 5: Create Hook** (`apps/web/src/domains/user/hooks.ts`)

```typescript
// apps/web/src/domains/user/hooks.ts
export function useUserByEmail(
  email: string,
  options?: { enabled?: boolean }
) {
  return useQuery(
    userEndpoints.findByEmail.queryOptions({
      input: { email },
      enabled: (options?.enabled ?? true) && !!email,
    })
  )
}
```

### Key Helpers (`@/domains/shared/helpers.ts`)

**1. `custom()` - Create Custom Contracts**

Creates ORPC-compatible contracts for non-ORPC endpoints (like Better Auth):

```typescript
const session = custom({
  keys: ['auth', 'session'],
  handler: authClient.getSession,
  map: mapBetterAuth(),
  staleTime: 1000 * 60,
})

// Now use like any ORPC endpoint:
session.queryOptions() // For useQuery
session.call()         // For direct calls
session.queryKey()     // For invalidation
```

**2. `mapBetterAuth()` - Better Auth Response Handler**

Extracts data from Better Auth responses and handles errors:

```typescript
// Without mapBetterAuth:
const result = await authClient.signIn.email(input)
if (result.error) throw new Error(result.error.message)
return result.data

// With mapBetterAuth:
const login = custom({
  handler: authClient.signIn.email,
  map: mapBetterAuth(), // Automatically extracts data or throws error
})
```

**3. `defineInvalidations()` - Cache Invalidation Config**

Declaratively map mutations to query keys:

```typescript
const userInvalidations = defineInvalidations(userEndpoints, {
  create: ({ keys }) => [keys.list(), keys.count()],
  update: ({ input, keys }) => [
    keys.findById({ input: { id: input.id } }),
    keys.list(),
  ],
})
```

**4. `wrapWithInvalidations()` - Automatic Cache Invalidation**

Enhances endpoints with automatic invalidation:

```typescript
const enhancedUser = wrapWithInvalidations(userEndpoints, userInvalidations)

// Use in hooks:
export function useCreateUser() {
  return useMutation(
    userEndpoints.create.mutationOptions({
      onSuccess: enhancedUser.create.withInvalidationOnSuccess((newUser) => {
        toast.success(`User "${newUser.name}" created!`)
      })
    })
  )
}

// Invalidation happens automatically before the callback!
```

### ORPC Best Practices

✅ **DO**:
- Use domain hooks from `@/domains/*/hooks` instead of raw ORPC client
- Follow the 3-file domain pattern (endpoints, hooks, invalidations)
- Use `custom()` for non-ORPC endpoints (Better Auth, external APIs)
- Use `mapBetterAuth()` when wrapping Better Auth SDK calls
- Use `defineInvalidations()` for declarative cache management
- Use `wrapWithInvalidations()` for automatic cache invalidation
- Define Zod schemas for all inputs/outputs
- Handle loading/error states in components

❌ **DON'T**:
- Call ORPC client directly in components (use domain hooks)
- Create hooks in `apps/web/src/hooks/` (deprecated, use domains)
- Skip invalidation configuration for mutations
- Forget to handle error states
- Use raw `fetch()` for API calls
- Create custom invalidation logic (use helpers)

---

## Data Fetching (React Query)

We use **TanStack Query (React Query)** for all data fetching, integrated with ORPC/Better Auth through domain hooks.

### Architecture

```
React Component
  ↓ useUsers()
Domain Hook (apps/web/src/domains/user/hooks.ts)
  ↓ useQuery + ORPC Client or Custom Contract
React Query
  ↓ Cache + Network
ORPC Client
  ↓ HTTP Request
API Server
```

### Query Configuration

Centralized query config in `apps/web/src/domains/shared/config.ts`:

```typescript
// STALE_TIME - How long data is considered fresh
export const STALE_TIME = {
  FAST: 30_000,        // 30 seconds - Frequently changing data
  DEFAULT: 120_000,    // 2 minutes - Normal data
  SLOW: 300_000,       // 5 minutes - Rarely changing data
  STATIC: 1_800_000,   // 30 minutes - Almost never changes
} as const

// GC_TIME - How long unused data stays in cache
export const GC_TIME = {
  SHORT: 300_000,      // 5 minutes
  DEFAULT: 600_000,    // 10 minutes
  LONG: 1_800_000,     // 30 minutes
} as const

// RETRY_CONFIG - Retry configuration for failed queries
export const RETRY_CONFIG = {
  attempts: 3,
  delay: 1000,         // 1 second
  backoff: 2,          // Exponential: 1s, 2s, 4s
} as const
```

**Usage in Endpoints**:

```typescript
// apps/web/src/domains/user/endpoints.ts
import { STALE_TIME } from '@/domains/shared/config'
import { custom } from '@/domains/shared/helpers'

export const userEndpoints = {
  list: custom({
    keys: ['user', 'list'],
    handler: () => orpc.user.list.call(),
    staleTime: STALE_TIME.DEFAULT,  // Use shared config
  }),
}
```

### Query Keys
// TODO: use the same principle for the withInvalidationOnSuccess and also the use of the optimstic update with direct endpoitn.cache.[methods] access
Query keys are automatically generated by the `custom()` helper or provided by ORPC:

```typescript
// ORPC endpoints have built-in queryKey methods
import { orpc } from '@/lib/orpc'

const queryKey = orpc.user.list.queryKey({ input: { page: 1 } })
// Returns: [['user.list', { input: { page: 1 } }]]

// Custom endpoints define keys explicitly
import { custom } from '@/domains/shared/helpers'

const session = custom({
  keys: ['auth', 'session'],  // Explicit query key
  handler: authClient.getSession,
})

// Use in invalidation
queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
```

### Cache Invalidation

**Pattern 1: Invalidate After Mutation**

```typescript
const { mutate: createUser } = useMutation({
  mutationFn: (data) => orpc.user.create(data),
  onSuccess: () => {
    // Invalidate list to refetch with new user
    queryClient.invalidateQueries({ queryKey: ['user', 'list'] })
    
    // Invalidate count
    queryClient.invalidateQueries({ queryKey: ['user', 'count'] })
  },
})
```

**Pattern 2: Optimistic Updates**

```typescript
const { mutate: updateUser } = useMutation({
  mutationFn: (data) => orpc.user.update(data),
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['user', newData.id] })
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['user', newData.id])
    
    // Optimistically update
    queryClient.setQueryData(['user', newData.id], newData)
    
    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['user', newData.id], context?.previous)
  },
  onSettled: (data, err, variables) => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
  },
})
```

### React Query DevTools

Available in development:

```tsx
// apps/web/src/app/layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function RootLayout({ children }) {
  return (
    <ReactQueryProviders>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </ReactQueryProviders>
  )
}
```

Access at: `http://localhost:3000` - Look for React Query icon in bottom right

### Query Patterns

**Dependent Queries** - Query B depends on Query A:

```tsx
function UserWithPosts({ userId }: { userId: string }) {
  // First query
  const { data: user } = useUser(userId)
  
  // Second query depends on first
  const { data: posts } = useUserPosts(user?.id, {
    enabled: !!user?.id, // Only run if user exists
  })
  
  return <div>{/* render */}</div>
}
```

**Parallel Queries** - Multiple independent queries:

```tsx
function Dashboard() {
  const usersQuery = useUsers()
  const statsQuery = useStats()
  const recentQuery = useRecentActivity()
  
  if (usersQuery.isLoading || statsQuery.isLoading || recentQuery.isLoading) {
    return <LoadingState />
  }
  
  return <div>{/* render all data */}</div>
}
```

**Infinite Queries** - Pagination with infinite scroll:

```tsx
function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      orpc.user.list({ page: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage) => 
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
  
  return (
    <div>
      {data?.pages.flatMap(page => page.users).map(user => (
        <UserCard key={user.id} user={user} />
      ))}
      
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          Load More
        </button>
      )}
    </div>
  )
}
```

---

## Declarative Routing

We use **type-safe declarative routing** instead of string-based URLs.

### Architecture

```
route.info.ts (Definition)
  ↓ bun run web -- dr:build
Type-Safe Routes (@/routes)
  ↓ Import in components
<Route.Link> or Route.fetch()
```

### Route Definition

**File**: `apps/web/src/app/dashboard/users/[id]/route.info.ts`

```typescript
import { z } from 'zod'

export default {
  routeName: 'DashboardUserDetail',
  
  params: z.object({
    id: z.string(),
  }),
  
  search: z.object({
    tab: z.enum(['profile', 'activity', 'settings']).optional(),
  }),
}
```

### Using Routes

**Pattern 1: Navigation Links**

```tsx
import { DashboardUserDetail } from '@/routes'

export function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map(user => (
        <DashboardUserDetail.Link 
          key={user.id}
          params={{ id: user.id }}
          search={{ tab: 'profile' }}
          className="user-link"
        >
          {user.name}
        </DashboardUserDetail.Link>
      ))}
    </div>
  )
}
```

**Pattern 2: Programmatic Navigation**

```tsx
import { usePush } from '@/routes/hooks'
import { DashboardUserDetail } from '@/routes'

export function CreateUserSuccess({ userId }: { userId: string }) {
  const push = usePush(DashboardUserDetail)
  
  useEffect(() => {
    // Navigate after success
    push({ params: { id: userId }, search: { tab: 'profile' } })
  }, [userId, push])
  
  return <SuccessMessage />
}
```

**Pattern 3: Read Route Params**

```tsx
import { useParams, useSearchParams } from '@/routes/hooks'
import { DashboardUserDetail } from '@/routes'

export function UserDetailPage() {
  const params = useParams(DashboardUserDetail)
  const search = useSearchParams(DashboardUserDetail)
  
  // Fully typed! params.id is string, search.tab is enum
  const { data: user } = useUser(params.id)
  const activeTab = search.tab ?? 'profile'
  
  return <UserDetail user={user} activeTab={activeTab} />
}
```

**Pattern 4: Server Components**

```tsx
import { DashboardUserDetail } from '@/routes'

export default DashboardUserDetail.Page(async ({ params, search }) => {
  // Params and search are validated server-side
  const user = await getUser(params.id)
  
  return <UserDetail user={user} initialTab={search.tab} />
})
```

**Pattern 5: Session-Protected Routes**

```tsx
import { DashboardUserDetail } from '@/routes'

export default DashboardUserDetail.SessionRoute(async ({ params, session }) => {
  // Session is guaranteed to exist
  const user = await getUser(params.id)
  
  // Check permissions
  if (!canViewUser(session.user, user)) {
    return <AccessDenied />
  }
  
  return <UserDetail user={user} />
})
```

### Rebuilding Routes

After adding/modifying route.info.ts files:

```bash
# Rebuild routes
bun run web -- dr:build

# Or watch mode
bun run web -- dr:build:watch
```

### Route Best Practices

✅ **DO**:
- Use `<Route.Link>` instead of `<Link href="...">`
- Define search params in route.info.ts with Zod
- Use `SessionRoute` for protected pages
- Rebuild routes after structural changes

❌ **DON'T**:
- Use raw string URLs anywhere
- Skip search param validation
- Forget to rebuild after route changes

---

## Error Handling

We use **error boundaries** and **domain-specific error handlers** for consistent error handling.

### Error Boundary Hierarchy

```
Root Layout
  └── <ErrorBoundary context="Root">
      Dashboard Layout
        └── <QueryErrorBoundary context="Dashboard">
            Admin Layout
              └── <FeatureErrorBoundary feature="AdminPanel">
                  Page Content
```

### Error Boundaries

**1. ErrorBoundary** - Catch any React errors:

```tsx
import { ErrorBoundary } from '@/components/error'

export function Layout({ children }) {
  return (
    <ErrorBoundary context="Dashboard">
      {children}
    </ErrorBoundary>
  )
}
```

**2. QueryErrorBoundary** - Catch React Query errors with retry:

```tsx
import { QueryErrorBoundary } from '@/components/error'

export function Layout({ children }) {
  return (
    <QueryErrorBoundary context="Dashboard">
      {children}
    </QueryErrorBoundary>
  )
}
```

**3. FeatureErrorBoundary** - Feature-specific with metadata:

```tsx
import { FeatureErrorBoundary } from '@/components/error'

export function AdminLayout({ children }) {
  return (
    <FeatureErrorBoundary 
      feature="AdminPanel" 
      metadata={{ section: 'admin' }}
    >
      {children}
    </FeatureErrorBoundary>
  )
}
```

### Domain Error Handlers

Located in `apps/web/src/lib/errors/`:

**User Domain** (`user.ts`):

```typescript
import { handleUserError, UserErrorCode } from '@/lib/errors'

const { mutate: updateProfile } = useMutation({
  mutationFn: updateUserProfile,
  onError: (error) => {
    handleUserError(error, 'profile-update')
  },
})
```

**Admin Domain** (`admin.ts`):

```typescript
import { handleAdminError } from '@/lib/errors'

const { mutate: deleteUser } = useMutation({
  mutationFn: deleteUserById,
  onError: (error) => {
    handleAdminError(error, 'user-deletion', userId)
  },
})
```

**Organization Domain** (`organization.ts`):

```typescript
import { handleOrganizationError } from '@/lib/errors'

const { mutate: addMember } = useMutation({
  mutationFn: addOrgMember,
  onError: (error) => {
    handleOrganizationError(error, 'member-add', orgId)
  },
})
```

### Creating Domain Errors

```typescript
import { createUserError, UserErrorCode } from '@/lib/errors'

// In your API handler
if (!user) {
  throw createUserError(
    UserErrorCode.USER_NOT_FOUND,
    'User does not exist',
    { userId }
  )
}
```

### Error Codes

| Domain | Error Codes |
|--------|-------------|
| User | `PROFILE_UPDATE_FAILED`, `PASSWORD_CHANGE_FAILED`, `EMAIL_ALREADY_EXISTS`, etc. |
| Admin | `USER_MANAGEMENT_FAILED`, `PERMISSION_DENIED`, `SYSTEM_SETTING_INVALID`, etc. |
| Organization | `ORG_CREATE_FAILED`, `MEMBER_ADD_FAILED`, `INVITATION_EXPIRED`, etc. |

See `apps/web/src/lib/errors/README.md` for complete reference.

### Error Handling Best Practices

✅ **DO**:
- Use error boundaries for layout-level error handling
- Use domain error handlers in mutation hooks
- Provide user-friendly error messages
- Log errors with context for debugging

❌ **DON'T**:
- Catch errors without handling them
- Show raw error stack traces to users
- Forget to log errors for debugging

---

## Logging

We use **Pino** for structured logging across both API and web applications.

### Logger Setup

**Location**: `packages/utils/logger/src/index.ts`

**Usage in API** (`apps/api`):

```typescript
import { createLogger } from '@repo/logger'

const logger = createLogger({
  name: 'api',
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'nestjs-api',
    environment: process.env.NODE_ENV,
  },
})

// Log messages
logger.info('Server started')
logger.debug('Processing request', { userId: '123' })
logger.warn('Slow query detected', { duration: 5000 })
logger.error('Database connection failed', { host: 'localhost' })
```

**Usage in Web** (`apps/web`):

```typescript
import { createLogger } from '@repo/logger'

const logger = createLogger({
  name: 'web',
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  browser: {
    write: {
      info: (msg) => console.log(msg),
      error: (msg) => console.error(msg),
    },
  },
})

// In components/lib files
logger.debug('Component mounted', { component: 'UserList' })
logger.error('API call failed', { endpoint: '/api/users', status: 500 })
```

### Log Levels

| Level | When to Use |
|-------|-------------|
| `trace` | Very detailed debugging |
| `debug` | Development debugging |
| `info` | Important business logic |
| `warn` | Recoverable errors, deprecations |
| `error` | Errors that need attention |
| `fatal` | Application crashes |

### Structured Logging

Always include context:

```typescript
// ❌ BAD - No context
logger.error('Failed to create user')

// ✅ GOOD - With context
logger.error('Failed to create user', {
  userId: user.id,
  email: user.email,
  error: err.message,
  stack: err.stack,
})
```

### Error Logging

The logger has enhanced error extraction:

```typescript
// Logs with automatic error property extraction
logger.error(error) // Extracts message, stack, code, etc.

// With additional context
logger.error('User creation failed', error, {
  email: 'user@example.com',
  timestamp: Date.now(),
})
```

### Production Logging

In production:
- Logs are JSON formatted for log aggregation
- `console.log` calls in production code should be replaced with logger
- Set `LOG_LEVEL=warn` or `LOG_LEVEL=error` to reduce noise

---

## State Management

We use **React Query** for server state and **React hooks** for client state.

### When to Use Each

```
Server State (from API) → React Query (TanStack Query)
URL State (shareable) → Declarative Routing (useSearchParams)
Simple Local State → useState
Complex Component State → useReducer
Form State → React Hook Form + Zod
```

### Server State with React Query

All data from the API is managed by React Query through domain hooks:

```typescript
import { useUsers, useCreateUser } from '@/domains/user/hooks'

export function UserManagement() {
  // Server state is cached and managed by React Query
  const { data: users } = useUsers()
  const { mutate: createUser } = useCreateUser()
  
  return <div>{/* UI */}</div>
}
```

### URL State

Shareable state like filters, tabs, and pagination goes in the URL:

```typescript
import { useSearchParams, usePush } from '@/routes/hooks'
import { UserList } from '@/routes'

export function UserListPage() {
  const search = useSearchParams(UserList)
  const push = usePush(UserList)
  
  // Read from URL
  const currentTab = search.tab ?? 'all'
  
  // Update URL
  const setTab = (tab: string) => {
    push({ search: { tab } })
  }
  
  return <div>{/* UI */}</div>
}
```

### Component State

Local UI state that doesn't need to be shared:

```typescript
import { useState } from 'react'

export function ExpandableSection() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <div>Content</div>}
    </div>
  )
}
```

### State Management Best Practices

✅ **DO**:
- Use React Query for all server data
- Use URL params for shareable/bookmarkable state
- Use useState for simple local UI state
- Use useReducer for complex component state logic

❌ **DON'T**:
- Store server data in component state
- Use global state when local state suffices
- Put non-shareable state in the URL
- Over-engineer with unnecessary state management libraries

---

## UI Components

We use **Shadcn UI** components built on Radix UI and Tailwind CSS.

### Adding Components

```bash
# Add a single component
bun run @repo/ui ui:add button

# Add multiple components
bun run @repo/ui ui:add button input card dialog
```

Components are added to `packages/ui/base/src/components/shadcn/`.

### Using Components

```tsx
import { Button } from '@repo/ui/base'
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/base'

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click Me</Button>
      </CardContent>
    </Card>
  )
}
```

### Component Categories

**Available Components**:
- **Layout**: Card, Separator, Tabs, Accordion
- **Forms**: Input, Button, Select, Checkbox, Radio, Switch, Textarea, Slider
- **Feedback**: Alert, Toast, Dialog, AlertDialog, Progress, Skeleton
- **Overlay**: Popover, Dropdown, Tooltip, Sheet, Drawer
- **Data**: Table, Avatar, Badge, Calendar, Command
- **Navigation**: NavigationMenu, Menubar, ContextMenu, Breadcrumb

### Component Variants

Most components support variants:

```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Theming

Themes are configured in `tailwind.config.ts`:

```typescript
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Your brand colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more colors
      },
    },
  },
}
```

Toggle theme:

```tsx
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

---

## Testing

We use **Vitest** for unit and integration testing across the monorepo.

### Running Tests

```bash
# All tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage

# Specific package
bun run test --filter=web
bun run test --filter=@repo/ui
```

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('UserService', () => {
  beforeEach(() => {
    // Setup before each test
  })
  
  afterEach(() => {
    // Cleanup after each test
  })
  
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const user = await userService.create({
        name: 'John Doe',
        email: 'john@example.com',
      })
      
      expect(user).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      })
    })
    
    it('should throw error for duplicate email', async () => {
      await expect(
        userService.create({ name: 'Jane', email: 'duplicate@example.com' })
      ).rejects.toThrow('Email already exists')
    })
  })
})
```

### Testing Patterns

**1. Testing React Components**

```tsx
import { render, screen } from '@testing-library/react'
import { UserCard } from './UserCard'

describe('UserCard', () => {
  it('renders user information', () => {
    render(<UserCard user={{ name: 'John', email: 'john@example.com' }} />)
    
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
  
  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<UserCard user={user} onEdit={onEdit} />)
    
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    
    expect(onEdit).toHaveBeenCalledWith(user.id)
  })
})
```

**2. Testing Hooks**

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useUsers } from '@/hooks/useUser'

describe('useUsers', () => {
  it('fetches users successfully', async () => {
    const { result } = renderHook(() => useUsers())
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data?.users)).toBe(true)
  })
})
```

**3. Testing API Endpoints (NestJS)**

```typescript
import { Test } from '@nestjs/testing'
import { UserController } from './user.controller'
import { UserService } from './user.service'

describe('UserController', () => {
  let controller: UserController
  let service: UserService
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            list: vi.fn(),
            create: vi.fn(),
          },
        },
      ],
    }).compile()
    
    controller = module.get(UserController)
    service = module.get(UserService)
  })
  
  it('should return user list', async () => {
    const mockUsers = [{ id: '1', name: 'John' }]
    vi.spyOn(service, 'list').mockResolvedValue(mockUsers)
    
    const result = await controller.list({ page: 1, pageSize: 20 })
    
    expect(result).toEqual(mockUsers)
  })
})
```

### Coverage Goals

- **Packages**: >80% coverage
- **API Services**: >70% coverage
- **UI Components**: >60% coverage

View coverage report:
```bash
bun run test:coverage
# Open coverage/report/index.html
```

---

## Docker Development

All development happens in Docker containers for consistency.

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main development setup (default) |
| `docker-compose.dev.yml` | Development overrides |
| `docker-compose.prod.yml` | Production configuration |
| `docker-compose.api.dev.yml` | API-only development |
| `docker-compose.web.dev.yml` | Web-only development |

### Common Docker Commands

```bash
# Start services
bun run dev                    # All services
bun run dev:api               # API + database only
bun run dev:web               # Web only

# Stop services
docker-compose down

# View logs
bun run dev:api:logs
bun run dev:web:logs
docker-compose logs -f [service]

# Rebuild containers
docker-compose build
docker-compose up --build

# Shell into container
docker-compose exec api bash
docker-compose exec web sh

# Clean everything
docker-compose down -v        # Remove volumes too
docker system prune           # Clean Docker cache
```

### Volume Mounts

Source code is mounted for hot reloading:

```yaml
volumes:
  - ./apps/api:/app/apps/api
  - ./apps/web:/app/apps/web
  - ./packages:/app/packages
```

### Environment Variables

Docker Compose reads from `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:password@api-db-dev:5432/nestjs_api

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001

# Web
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_PORT=3000
```

### Troubleshooting Docker

**Services won't start**:
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

**Port conflicts**:
```bash
# Check what's using port
lsof -i :3001
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Database issues**:
```bash
# Reset database
docker-compose down -v
bun run dev
bun run api -- db:push
bun run api -- db:seed
```

---

## Common Tasks

### Adding a New API Endpoint

**1. Define Contract** (`packages/contracts/api/common/user.ts`):

```typescript
export const userContract = {
  // ... existing endpoints
  
  updateProfile: RouteBuilder.patch('/users/:id')
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      bio: z.string().optional(),
    }))
    .output(userSchema),
}
```

**2. Implement in API** (`apps/api/src/modules/user/user.controller.ts`):
// ISSUE: still not the right way use the implement pattern
```typescript
@ORPCRoute(userContract.updateProfile)
async updateProfile(@ORPCInput() input: UpdateProfileInput) {
  return this.userService.updateProfile(input.id, input)
}
```

**3. Add to Hook File** (`apps/web/src/hooks/useUser.ts`):

```typescript
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  // ISSUE: use the withInvalidationOnSuccess
  return useMutation(orpc.user.updateProfile.mutationOptions({
    onSuccess: (data) => {
      // Invalidate user cache
      queryClient.invalidateQueries({ 
        queryKey: ['user', data.id] 
      })
    },
  }))
}
```

**4. Use in Frontend**:

```tsx
import { useUpdateProfile } from '@/hooks/useUser'

const { mutate: updateProfile } = useUpdateProfile()

updateProfile({ id: '123', name: 'New Name' })
```

### Adding a New Page

**1. Create Route Info** (`apps/web/src/app/dashboard/settings/route.info.ts`):

```typescript
export default {
  routeName: 'DashboardSettings',
  params: z.object({}),
  search: z.object({
    tab: z.enum(['profile', 'security', 'billing']).optional(),
  }),
}
```

**2. Create Page** (`apps/web/src/app/dashboard/settings/page.tsx`):

```tsx
import { DashboardSettings } from '@/routes'

export default DashboardSettings.SessionRoute(async ({ session, search }) => {
  return <SettingsPage user={session.user} activeTab={search.tab} />
})
```

**3. Rebuild Routes**:

```bash
bun run web -- dr:build
```

**4. Add Navigation**:

```tsx
import { DashboardSettings } from '@/routes'

<DashboardSettings.Link search={{ tab: 'profile' }}>
  Settings
</DashboardSettings.Link>
```

### Adding a New Component

**1. Add Shadcn Component** (if needed):

```bash
bun run @repo/ui ui:add button card
```

**2. Create Component** (`apps/web/src/components/UserProfile.tsx`):

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/base'

interface UserProfileProps {
  user: User
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{user.email}</p>
      </CardContent>
    </Card>
  )
}
```

**3. Export** (`apps/web/src/components/index.ts`):

```typescript
export { UserProfile } from './UserProfile'
```

### Adding Database Tables

**1. Define Schema** (`apps/api/src/db/drizzle/schema/user.ts`):

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  bio: text('bio'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

**2. Generate Migration**:

```bash
bun run api -- db:generate
```

**3. Apply Migration**:

```bash
bun run api -- db:push
```

**4. Update Types** (auto-generated by Drizzle):

```typescript
import { userProfiles } from '@/db/drizzle/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type UserProfile = InferSelectModel<typeof userProfiles>
```

---

## Best Practices

### Code Organization

✅ **DO**:
- Keep related files together (co-location)
- Use barrel exports (`index.ts`) for clean imports
- Follow naming conventions (`useEntity.orpc-hooks.ts`)
- Separate concerns (hooks, components, utils)

❌ **DON'T**:
- Create deeply nested folder structures
- Mix different concerns in one file
- Use non-descriptive names

### TypeScript

✅ **DO**:
- Enable strict mode
- Use type inference over explicit types
- Use `unknown` instead of `any`
- Define interfaces for public APIs

❌ **DON'T**:
- Use `any` type
- Disable TypeScript errors with comments
- Over-use type assertions (`as`)

### React

✅ **DO**:
- Use Server Components by default
- Add `'use client'` only when needed
- Keep components small and focused
- Use composition over inheritance

❌ **DON'T**:
- Make everything a Client Component
- Create mega-components with 500+ lines
- Use inline styles (use Tailwind classes)

### API Design

✅ **DO**:
- Validate all inputs with Zod
- Use consistent error responses
- Document endpoint purposes
- Version breaking changes

❌ **DON'T**:
- Skip input validation
- Return different error formats
- Make breaking changes without versioning

### Performance

✅ **DO**:
- Use React.memo for expensive renders
- Implement proper loading states
- Use proper React Query cache times
- Lazy load heavy components

❌ **DON'T**:
- Fetch data in loops
- Store large objects in state
- Skip loading indicators
- Load everything upfront

---

## Troubleshooting

### Common Issues

**Issue: TypeScript errors after `git pull`**

```bash
# Clean and reinstall
bun run clean
bun install

# Rebuild packages
bun run build

# Rebuild declarative routes
bun run web -- dr:build
```

**Issue: Docker containers won't start**

```bash
# Check logs
docker-compose logs

# Stop and remove everything
docker-compose down -v

# Rebuild
docker-compose build --no-cache
docker-compose up
```

**Issue: Database connection errors**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart api-db-dev

# Reset database
docker-compose down -v
bun run dev
bun run api -- db:push
```

**Issue: Hot reload not working**

```bash
# Restart the specific service
docker-compose restart api
docker-compose restart web

# Check volume mounts
docker-compose config
```

**Issue: Port already in use**

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
API_PORT=3002
```

**Issue: React Query not updating**

```typescript
// Force refetch
queryClient.invalidateQueries({ queryKey: ['user'] })

// Or reset entire cache
queryClient.clear()
```

**Issue: Route not found after adding page**

```bash
# Rebuild declarative routes
bun run web -- dr:build

# Restart web server
docker-compose restart web
```

### Debug Mode

Enable debug logging:

```bash
# API debug logs
LOG_LEVEL=debug bun run dev:api

# Web debug logs
LOG_LEVEL=debug bun run dev:web
```

### Getting Help

1. Check documentation: `.docs/` folder
2. Search existing issues on GitHub
3. Check memory bank: Look for similar problems in progress
4. Ask in team chat with:
   - What you're trying to do
   - What error you're seeing
   - What you've already tried

---

## Additional Resources

### Documentation

- [Getting Started](../.docs/guides/GETTING-STARTED.md) - Initial setup
- [Architecture Overview](../.docs/reference/ARCHITECTURE.md) - System design
- [Technology Stack](../.docs/reference/TECH-STACK.md) - Tech choices
- [Development Workflow](../.docs/guides/DEVELOPMENT-WORKFLOW.md) - Daily development
- [ORPC Type-Safe Contracts](../.docs/features/ORPC-TYPE-CONTRACTS.md) - API contracts
- [Testing Guide](../.docs/features/TESTING.md) - Testing strategies
- [Docker Build Strategies](../.docs/guides/DOCKER-BUILD-STRATEGIES.md) - Docker setups
- [Production Deployment](../.docs/guides/PRODUCTION-DEPLOYMENT.md) - Production guide

### Core Concepts

- [ORPC Client Hooks Pattern](../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md) - API client pattern
- [Declarative Routing Pattern](../.docs/core-concepts/12-DECLARATIVE-ROUTING-PATTERN.md) - Type-safe routing
- [Service-Adapter Pattern](../.docs/core-concepts/02-SERVICE-ADAPTER-PATTERN.md) - Layered architecture

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Better Auth Documentation](https://better-auth.com/)
- [ORPC Documentation](https://orpc.io/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Shadcn UI Documentation](https://ui.shadcn.com/)

---

**Welcome to the team! 🎉** You now have a comprehensive understanding of how to work with this codebase. Start small, refer back to this guide often, and don't hesitate to ask questions.

Happy coding! 🚀
