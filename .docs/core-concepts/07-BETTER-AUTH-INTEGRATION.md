📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Better Auth Integration Pattern

# Better Auth Integration Pattern

> **Type**: Core Concept - Authentication & Authorization  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-20

## Overview

This project uses **Better Auth** for authentication and authorization with a comprehensive decorator-based access control system built on top of NestJS guards.

**⚠️ ALL auth-related operations MUST use AuthService.api**

## Table of Contents

1. [Auth Architecture](#auth-architecture)
2. [Permissions System](#permissions-system)
3. [Authentication Decorators](#authentication-decorators)
4. [Authorization Decorators](#authorization-decorators)
5. [Guards System](#guards-system)
6. [Hook System](#hook-system)
7. [Error Handling](#error-handling)
8. [Usage Examples](#usage-examples)
9. [AuthService API Methods](#authservice-api-methods)
10. [Plugin Utilities (New)](#plugin-utilities)
11. [Audit & Recommendations](#audit--recommendations)

---

## Auth Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                  Better Auth Instance                    │
│         (plugins: admin, organization, apiKey)          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
        ┌─────────────────────┐
        │   AuthService       │ ← Injectable service for auth operations
        │   .api / .instance  │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────┐      ┌──────────────┐
│  AuthGuard   │      │  RoleGuard   │
│ (Session)    │      │ (Roles/Perms)│
└──────┬───────┘      └──────┬───────┘
       │                     │
       ↓                     ↓
┌─────────────────────────────────────┐
│        Request Object               │
│  .session: UserSession              │
│  .user: User                        │
└─────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│     Controller Decorators           │
│  @Session(), @UserRoles(),          │
│  @AuthenticatedUser()               │
└─────────────────────────────────────┘
```

### Auth Flow

1. **Request arrives** → Headers contain auth token
2. **AuthGuard executes** → Calls `auth.api.getSession()`
3. **Session attached** → `request.session` and `request.user` populated
4. **RoleGuard executes** → Checks role/permission requirements
5. **Controller receives** → Can access session via decorators

---

## Permissions System

This project includes a **comprehensive type-safe permissions system** built on top of Better Auth's admin plugin.

### Overview

The permissions system is located in `apps/api/src/config/auth/permissions/` and provides:

- **Type-safe permission definitions** using TypeScript and Zod
- **Declarative role and statement builders** with fluent API
- **Collection APIs** for batch operations on statements and roles
- **Compile-time validation** of actions and resources
- **Pre-defined common permissions** for quick setup
- **Full documentation** with examples and best practices

### Folder Structure

```
config/auth/permissions/
├── index.ts                    # Main entry point - exports everything
├── common.ts                   # Pre-defined permission patterns
├── config.ts                   # Permission configuration
├── utils.ts                    # Helper utilities
├── system/                     # Core system (classes, types, builders)
│   ├── index.ts               # Barrel export for all system components
│   ├── types.ts               # All TypeScript type definitions
│   ├── TYPE_SAFETY.md         # Type safety documentation
│   └── builder/               # Builder implementation
│       ├── builder.ts         # PermissionBuilder and RoleBuilder classes
│       ├── shared/
│       │   └── base-config.ts # Base configuration class
│       ├── statements/
│       │   ├── statements-config.ts           # Statement configuration
│       │   ├── single-statement-config.ts     # Single statement config
│       │   └── statement-config-collection.ts # Batch operations on resources
│       └── roles/
│           ├── roles-config.ts                # Role configuration
│           ├── single-role-config.ts          # Single role config
│           └── role-config-collection.ts      # Batch operations on roles
└── docs/                       # Documentation
    ├── README.md              # Main documentation
    ├── GETTING-STARTED.md     # Quick start guide
    ├── BUILDER-EXAMPLES.md    # Builder pattern examples
    ├── COLLECTION-API-EXAMPLES.md  # Collection API examples
    └── REFACTORING-REPORT.md  # Refactoring documentation
```

### Quick Start

**Import pre-built configuration:**

```typescript
import { statement, ac, roles } from '@/config/auth/permissions';

// Use in Better Auth configuration
betterAuth({
  plugins: [
    admin({
      ac: { statement, ac, roles },
    }),
  ],
});
```

**Use in decorators:**

```typescript
import { commonPermissions } from '@/config/auth/permissions';

@RequireCommonPermission('projectFullAccess')
@Post('/projects')
createProject() {
  // Uses predefined permission set
}
```

### Key Features

#### 1. Type-Safe Statements (Resources & Actions)

```typescript
import { statementsConfig } from '@/config/auth/permissions';

// ✅ Valid - 'read' exists in statements
const readOnly = statementsConfig.getAll().readOnly();

// ❌ Type Error - 'invalid' doesn't exist
const invalid = statementsConfig.getAll().withAction('invalid');
// TypeScript error: Type '"invalid"' is not assignable to AllActions<TStatement>
```

#### 2. Type-Safe Roles

```typescript
import { rolesConfig } from '@/config/auth/permissions';

// Filter roles with specific permissions
const deleteCapable = rolesConfig.getAll().withAction('delete');
// Returns: { admin: {...} } - only roles with delete permission

// Filter roles by resource
const projectRoles = rolesConfig.getAll().withResource('project');
// Returns: { admin: {...}, editor: {...}, viewer: {...} }
```

#### 3. Collection APIs

**Statement Collections** - Filter resources by actions:
```typescript
statementsConfig.getAll().crudOnly();
// Returns: { user: ['create', 'read', 'update', 'delete'], ... }

statementsConfig.getAll().withAction('delete');
// Returns only resources with 'delete' action
```

**Role Collections** - Filter roles by permissions:
```typescript
rolesConfig.getAll().withActionOnResource('project', 'create');
// Returns: { admin: {...}, editor: {...} }

rolesConfig.getAll().readOnly();
// Returns: { viewer: { project: ['read'], user: ['read'] } }
```

#### 4. Builder Pattern

```typescript
import { PermissionBuilder } from '@/config/auth/permissions/system';
import { defaultStatements } from 'better-auth/plugins/admin';

const { statement, ac, roles } = PermissionBuilder
  .withDefaults(defaultStatements)
  .resources({
    project: ['create', 'read', 'update', 'delete', 'share'],
    organization: ['create', 'read', 'manage-members'],
  })
  .roles((ac) => ({
    admin: ac.newRole({
      project: ['*'],
      organization: ['*'],
    }),
    editor: ac.newRole({
      project: ['create', 'read', 'update'],
    }),
  }))
  .build();
```

### Documentation References

For detailed information about the permissions system:

| Documentation | Location | Purpose |
|--------------|----------|---------|
| **Getting Started** | `apps/api/src/config/auth/permissions/docs/GETTING-STARTED.md` | Quick start guide, core concepts, common patterns |
| **Main README** | `apps/api/src/config/auth/permissions/docs/README.md` | Complete documentation, all features explained |
| **Builder Examples** | `apps/api/src/config/auth/permissions/docs/BUILDER-EXAMPLES.md` | Real-world builder pattern examples |
| **Collection API** | `apps/api/src/config/auth/permissions/docs/COLLECTION-API-EXAMPLES.md` | Batch operations, filtering examples |
| **Type Safety** | `apps/api/src/config/auth/permissions/system/TYPE_SAFETY.md` | Type utilities, compile-time validation |

### Common Permission Patterns

The system includes pre-defined permission sets in `common.ts`:

```typescript
import { commonPermissions } from '@/config/auth/permissions';

// Use predefined patterns
@RequireCommonPermission('projectFullAccess')
@Post('/projects')
createProject() {
  // Requires: project:[create, read, update, delete, share]
}

@RequireCommonPermission('capsuleManagement')
@Post('/capsules')
createCapsule() {
  // Requires: capsule:[create, read, update, delete, list]
  //          + media:[create, read, delete]
}
```

**Available common permissions:**
- `projectFullAccess` - Full project CRUD
- `capsuleManagement` - Capsule + media management
- `userManagement` - Full user CRUD + permissions
- `organizationAdmin` - Organization management + members

### Integration with Decorators

The permissions system integrates seamlessly with authorization decorators:

```typescript
// Role-based (uses rolesConfig)
@RequireRole('admin', 'manager')
@Get('/projects')
listProjects() { }

// Permission-based (uses statementsConfig)
@RequirePermissions({
  project: ['create'],
  organization: ['read']
})
@Post('/projects')
createProject() { }

// Common permissions (uses commonPermissions)
@RequireCommonPermission('projectFullAccess')
@Put('/projects/:id')
updateProject() { }
```

### Type Safety Benefits

1. **Compile-time validation** - Invalid actions/resources cause TypeScript errors
2. **IDE auto-completion** - IntelliSense shows valid actions and resources
3. **Refactoring safety** - Removing permissions causes errors where used
4. **Zero runtime cost** - All validation at compile time
5. **Self-documenting** - Types serve as living documentation

### Example: Custom Permission Configuration

```typescript
// apps/api/src/config/auth/permissions/index.ts
import { PermissionBuilder } from './system';
import { defaultStatements } from 'better-auth/plugins/admin';

export const { statement, ac, roles, statementsConfig, rolesConfig } = 
  PermissionBuilder
    .withDefaults(defaultStatements)
    .resources({
      capsule: ['create', 'read', 'update', 'delete', 'list'],
      media: ['upload', 'delete', 'getUrl'],
      adminAction: ['view', 'export'],
    })
    .roles((ac) => ({
      superAdmin: ac.newRole({
        capsule: ['*'],
        media: ['*'],
        adminAction: ['*'],
        user: ['*'],
      }),
      admin: ac.newRole({
        capsule: ['*'],
        media: ['*'],
        user: ['create', 'read', 'update'],
      }),
      user: ac.newRole({
        capsule: ['read', 'list'],
      }),
    }))
    .build();

export const statementsConfig = new StatementsConfig(statement);
export const rolesConfig = new RolesConfig(roles);
```

**📚 For complete documentation, start with:** `apps/api/src/config/auth/permissions/docs/GETTING-STARTED.md`

---

## Authentication Decorators

### @Session()

**Parameter decorator** to extract authenticated user session from request.

```typescript
import { Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller()
export class ProfileController {
  @Get('/me')
  getProfile(@Session() session: UserSession) {
    // session.user contains user info
    // session.session contains session metadata
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  }
}
```

**UserSession Type Structure:**
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
    role?: string; // When using admin plugin
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
```

### @AuthenticatedUser()

**Parameter decorator** that extends @Session() with parsed role information.

```typescript
import { AuthenticatedUser } from '@/core/modules/auth/decorators/decorators';

@Get('/dashboard')
getDashboard(
  @AuthenticatedUser() user: {
    id: string;
    email: string;
    name: string;
    role: string | null;
    roles: RoleName[]; // Parsed role array
  }
) {
  // Provides roles array parsed from user.role string
  return {
    userId: user.id,
    userRoles: user.roles,
  };
}
```

### @UserRoles()

**Parameter decorator** to extract only the parsed roles array.

```typescript
import { UserRoles } from '@/core/modules/auth/decorators/decorators';
import type { RoleName } from '@/config/auth/permissions';

@Get('/permissions')
getPermissions(@UserRoles() roles: RoleName[]) {
  // Returns empty array if no role assigned
  return { roles };
}
```

### @Public()

**Route decorator** to mark endpoints as publicly accessible (no authentication required).

```typescript
import { Public } from '@/core/modules/auth/decorators/decorators';

@Public()
@Get('/health')
healthCheck() {
  // No authentication required
  return { status: 'ok' };
}

@Public()
@Controller()
export class PublicController {
  // Entire controller is public
}
```

### @Optional()

**Route decorator** to allow unauthenticated access while still providing session if available.

```typescript
import { Optional } from '@/core/modules/auth/decorators/decorators';

@Optional()
@Get('/content')
getContent(@Session() session?: UserSession) {
  if (session) {
    // User is authenticated - show personalized content
    return { content: 'Premium content', userId: session.user.id };
  }
  // User is not authenticated - show public content
  return { content: 'Public content' };
}
```

---

## Authorization Decorators

### @RequireRole(...roles)

**Route decorator** to require user has **ANY** of the specified roles.

```typescript
import { RequireRole } from '@/core/modules/auth/decorators/decorators';

@RequireRole('admin', 'manager')
@Get('/sensitive-data')
getSensitiveData() {
  // User must have 'admin' OR 'manager' role
}
```

### @RequireAllRoles(...roles)

**Route decorator** to require user has **ALL** of the specified roles.

```typescript
import { RequireAllRoles } from '@/core/modules/auth/decorators/decorators';

@RequireAllRoles('admin', 'superuser')
@Delete('/system/reset')
resetSystem() {
  // User must have BOTH 'admin' AND 'superuser' roles
}
```

### @RequirePermissions(permissions)

**Route decorator** for fine-grained permission checking using Better Auth admin plugin.

```typescript
import { RequirePermissions } from '@/core/modules/auth/decorators/decorators';

@RequirePermissions({
  project: ['create', 'update'],
  user: ['list']
})
@Post('/projects')
createProject() {
  // User must have:
  // - project:create permission
  // - project:update permission
  // - user:list permission
}
```

### @RequireCommonPermission(key)

**Route decorator** to use predefined permission sets from common permissions config.

```typescript
import { RequireCommonPermission } from '@/core/modules/auth/decorators/decorators';

@RequireCommonPermission('projectFullAccess')
@Put('/projects/:id')
updateProject() {
  // Uses predefined 'projectFullAccess' permission set
}
```

### @RequireRoleAndPermissions(role, permissions)

**Route decorator** combining role and permission requirements.

```typescript
import { RequireRoleAndPermissions } from '@/core/modules/auth/decorators/decorators';

@RequireRoleAndPermissions('manager', {
  project: ['delete'],
  organization: ['manage-members']
})
@Delete('/projects/:id/force-delete')
forceDeleteProject() {
  // User must:
  // - Have 'manager' role
  // - Have project:delete permission
  // - Have organization:manage-members permission
}
```

---

## Guards System

### AuthGuard

**Purpose:** Validates authentication and attaches session to request.

**Location:** `apps/api/src/core/modules/auth/guards/auth.guard.ts`

**Behavior:**
1. Extracts auth headers from request
2. Calls `auth.api.getSession()` via Better Auth
3. Attaches `session` and `user` to request object
4. Respects `@Public()` and `@Optional()` decorators
5. Throws 401 if authentication required but not present

**Request Augmentation:**
```typescript
request.session = UserSession | null;
request.user = User | null;
```

**Usage:** Applied globally in AppModule (guards all routes by default)

### RoleGuard

**Purpose:** Validates role and permission requirements.

**Location:** `apps/api/src/core/modules/auth/guards/role.guard.ts`

**Behavior:**
1. Reads metadata from decorators via Reflector
2. Allows access if no role/permission decorators present
3. Requires authentication if any role/permission decorators exist
4. Validates roles using hierarchical role system
5. Validates permissions using Better Auth admin plugin API
6. Throws 401 if not authenticated (when requirements exist)
7. Throws 403 if authenticated but lacks required roles/permissions

**Decorator Support:**
- `@RequireRole(...roles)` → User needs ANY role
- `@RequireAllRoles(...roles)` → User needs ALL roles
- `@RequirePermissions(perms)` → User needs specified permissions

**Permission Validation:**
Uses Better Auth's `userHasPermission` API:
```typescript
const hasPermission = await this.auth.api.userHasPermission({
  body: {
    userId: user.id,
    permissions: requiredPermissions,
  },
});
```

---

## Hook System

Better Auth provides a powerful hook system for intercepting auth operations. Hooks allow you to:
- Log authentication events
- Validate and sanitize input
- Implement rate limiting
- Enrich user data
- Integrate with external services

### Hook Decorators

**`@Hook()`**
- Marks a class as containing hook methods
- All methods with `@BeforeHook` or `@AfterHook` will be registered

**`@BeforeHook(path: '/${string}')`**
- Executes **before** the specified auth operation
- Can modify request data
- Can prevent operation by throwing error
- Path examples: `/sign-in/email`, `/admin/create-user`, `/organization/add-member`

**`@AfterHook(path: '/${string}')`**
- Executes **after** the specified auth operation
- Can access operation result via `context.returned`
- Useful for logging, notifications, analytics
- Same path format as `@BeforeHook`

### Hook Context

All hooks receive an `AuthHookContext` object:

```typescript
type AuthHookContext = {
  request: Request;           // Incoming HTTP request
  body: any;                  // Request body (parsed)
  query: any;                 // Query parameters
  headers: Record<string, string>; // Request headers
  session?: UserSession;      // Current session (if authenticated)
  returned?: any;             // Return value (afterHook only)
};
```

### Example: Audit Logging

```typescript
import { Injectable } from '@nestjs/common';
import { Hook, BeforeHook, AfterHook, AuthHookContext } from '@/core/modules/auth/decorators/decorators';

@Injectable()
@Hook()
export class AuditHooks {
  constructor(private readonly auditService: AuditService) {}

  @AfterHook('/sign-in/email')
  async logSignIn(context: AuthHookContext) {
    if (context.session) {
      await this.auditService.log({
        action: 'USER_SIGN_IN',
        userId: context.session.user.id,
        ip: context.request.headers['x-forwarded-for'],
        timestamp: new Date(),
      });
    }
    return context;
  }
}
```

### Example: Input Validation

```typescript
@Injectable()
@Hook()
export class ValidationHooks {
  @BeforeHook('/sign-up/email')
  async validateSignUp(context: AuthHookContext) {
    // Normalize email
    context.body.email = context.body.email.toLowerCase().trim();

    // Block disposable email domains
    const disposableDomains = ['tempmail.com', '10minutemail.com'];
    const domain = context.body.email.split('@')[1];
    if (disposableDomains.includes(domain)) {
      throw new Error('Disposable email addresses are not allowed');
    }

    return context;
  }
}
```

**📚 Complete hook documentation:** `apps/api/src/core/modules/auth/hooks/README.md`

---

## Error Handling

### Custom Auth Errors

The project provides custom NestJS-compatible error classes for Better Auth operations. All errors extend `HttpException` and include:
- HTTP status code
- Unique error code
- Contextual information
- Timestamp

### Error Hierarchy

```
AuthError (base)
├─ AuthenticationError (401)
├─ AuthorizationError (403)
├─ SessionError (401)
├─ AdminPluginError
│  ├─ AdminUserCreationError
│  ├─ AdminRoleAssignmentError
│  ├─ AdminBanUserError
│  └─ ...
├─ OrganizationPluginError
│  ├─ OrganizationCreationError
│  ├─ OrganizationAddMemberError
│  ├─ OrganizationMemberLimitError
│  └─ ...
└─ ApiKeyPluginError
   ├─ ApiKeyExpiredError
   ├─ ApiKeyRevokedError
   ├─ ApiKeyInsufficientPermissionsError
   └─ ...
```

### Usage Example

```typescript
import {
  AuthenticationError,
  OrganizationMemberLimitError,
  ApiKeyExpiredError,
} from '@/core/modules/auth/errors';

// Authentication failure
throw new AuthenticationError(
  'Invalid credentials',
  'INVALID_CREDENTIALS',
  { email: user.email }
);

// Organization limit reached
throw new OrganizationMemberLimitError(
  'Your plan allows maximum 5 members',
  'org-123',
  5, // current
  5, // max
  { plan: 'starter' }
);

// Expired API key
throw new ApiKeyExpiredError(
  'API key expired on Jan 1, 2024',
  'key-456',
  new Date('2024-01-01')
);
```

### Error Response Format

All errors return consistent JSON:

```json
{
  "statusCode": 403,
  "message": "Your plan allows maximum 5 members",
  "code": "ORGANIZATION_MEMBER_LIMIT",
  "context": {
    "organizationId": "org-123",
    "currentCount": 5,
    "maxCount": 5,
    "plan": "starter"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**📚 Complete error documentation:** `apps/api/src/core/modules/auth/errors/README.md`

---

## Usage Examples

### Basic Authentication

```typescript
import { Controller, Get } from '@nestjs/common';
import { Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller('profile')
export class ProfileController {
  @Get('/me')
  getCurrentUser(@Session() session: UserSession) {
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  }
}
```

### Role-Based Authorization

```typescript
import { Controller, Get, Post, Delete } from '@nestjs/common';
import { RequireRole, Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller('admin')
export class AdminController {
  @RequireRole('admin')
  @Get('/users')
  listUsers() {
    // Only admin role can access
    return { users: [] };
  }

  @RequireRole('admin', 'manager')
  @Post('/projects')
  createProject(@Session() session: UserSession) {
    // Admin OR manager can access
    const creatorId = session.user.id;
    return { project: 'created', creatorId };
  }

  @RequireAllRoles('admin', 'superuser')
  @Delete('/system/data')
  dangerousOperation() {
    // User must have BOTH admin AND superuser roles
    return { deleted: true };
  }
}
```

### Permission-Based Authorization

```typescript
import { Controller, Post } from '@nestjs/common';
import { RequirePermissions, RequireCommonPermission } from '@/core/modules/auth/decorators/decorators';

@Controller('projects')
export class ProjectController {
  @RequirePermissions({
    project: ['create'],
    organization: ['view']
  })
  @Post('/')
  createProject() {
    // User needs project:create AND organization:view permissions
    return { created: true };
  }

  @RequireCommonPermission('projectFullAccess')
  @Post('/:id/deploy')
  deployProject() {
    // Uses predefined permission set
    return { deployed: true };
  }
}
```

### Optional Authentication

```typescript
import { Controller, Get } from '@nestjs/common';
import { Optional, Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller('content')
export class ContentController {
  @Optional()
  @Get('/articles')
  getArticles(@Session() session?: UserSession) {
    if (session) {
      // Return personalized content for authenticated users
      return {
        articles: [],
        premium: true,
        userId: session.user.id,
      };
    }
    // Return public content for anonymous users
    return {
      articles: [],
      premium: false,
    };
  }
}
```

### Combined Decorators

```typescript
import { Controller, Put } from '@nestjs/common';
import {
  RequireRoleAndPermissions,
  Session,
  UserRoles,
  AuthenticatedUser,
} from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';
import type { RoleName } from '@/config/auth/permissions';

@Controller('organization')
export class OrganizationController {
  @RequireRoleAndPermissions('manager', {
    organization: ['manage-members', 'update'],
    project: ['create']
  })
  @Put('/:id/settings')
  updateSettings(
    @Session() session: UserSession,
    @UserRoles() roles: RoleName[],
    @AuthenticatedUser() user: any
  ) {
    return {
      updated: true,
      performedBy: session.user.id,
      userRoles: roles,
      fullUser: user,
    };
  }
}
```

### Public Endpoints

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { Public } from '@/core/modules/auth/decorators/decorators';

@Controller('public')
export class PublicController {
  @Public()
  @Get('/status')
  getStatus() {
    // No authentication required
    return { status: 'healthy' };
  }

  @Public()
  @Post('/contact')
  submitContact() {
    // No authentication required
    return { submitted: true };
  }
}

// Or apply to entire controller:
@Public()
@Controller('docs')
export class DocsController {
  // All routes in this controller are public
}
```

---

---

## AuthService API Methods

### User Management

```typescript
import { AuthService } from '@/core/modules/auth/services/auth.service';

@Injectable()
export class UserService {
  constructor(private readonly authService: AuthService) {}

  // Create user
  async createUser(data: { email: string; password: string; name: string }) {
    const result = await this.authService.api.createUser({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        data: {
          role: 'user', // Set initial role
          emailVerified: false,
        },
      },
    });
    return result.user;
  }

  // Update user
  async updateUser(userId: string, data: { name?: string; email?: string }) {
    const result = await this.authService.api.updateUser({
      body: {
        userId,
        ...data,
      },
    });
    return result.user;
  }

  // Delete user
  async deleteUser(userId: string) {
    await this.authService.api.deleteUser({
      body: { userId },
    });
  }

  // Assign role to user (admin plugin)
  async assignRole(userId: string, role: string) {
    const result = await this.authService.api.setRole({
      body: {
        userId,
        role,
      },
    });
    return result.user;
  }
}
```

### Organization Management

```typescript
@Injectable()
export class OrganizationService {
  constructor(private readonly authService: AuthService) {}

  // Create organization
  async createOrganization(data: { name: string; slug: string; userId: string }) {
    const result = await this.authService.api.createOrganization({
      body: {
        name: data.name,
        slug: data.slug,
        userId: data.userId, // Owner
      },
    });
    return result.organization;
  }

  // Update organization
  async updateOrganization(organizationId: string, data: { name?: string; slug?: string }) {
    const result = await this.authService.api.updateOrganization({
      body: {
        organizationId,
        ...data,
      },
    });
    return result.organization;
  }

  // Delete organization
  async deleteOrganization(organizationId: string) {
    await this.authService.api.deleteOrganization({
      body: { organizationId },
    });
  }

  // Add member to organization
  async addMember(data: { organizationId: string; userId: string; role: string }) {
    const result = await this.authService.api.addMember({
      body: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
      },
    });
    return result.member;
  }

  // Remove member from organization
  async removeMember(data: { organizationId: string; userId: string }) {
    await this.authService.api.removeMember({
      body: {
        organizationId: data.organizationId,
        userId: data.userId,
      },
    });
  }

  // Update member role
  async updateMemberRole(data: { organizationId: string; userId: string; role: string }) {
    const result = await this.authService.api.updateMemberRole({
      body: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
      },
    });
    return result.member;
  }
}
```

### Session Management

```typescript
@Injectable()
export class SessionService {
  constructor(private readonly authService: AuthService) {}

  // Get session (used by AuthGuard)
  async getSession(headers: Record<string, string>) {
    return await this.authService.api.getSession({ headers });
  }

  // Sign in user
  async signIn(email: string, password: string) {
    const result = await this.authService.api.signIn.email({
      body: {
        email,
        password,
      },
    });
    return result;
  }

  // Sign out user
  async signOut(token: string) {
    await this.authService.api.signOut({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  }
}
```

### Permission Management

```typescript
@Injectable()
export class PermissionService {
  constructor(private readonly authService: AuthService) {}

  // Check if user has permission
  async checkPermission(userId: string, permissions: any) {
    return await this.authService.api.userHasPermission({
      body: {
        userId,
        permissions,
      },
    });
  }

  // Grant permissions to user (admin plugin)
  async grantPermissions(userId: string, permissions: any) {
    const result = await this.authService.api.grantPermissions({
      body: {
        userId,
        permissions,
      },
    });
    return result;
  }

  // Revoke permissions from user (admin plugin)
  async revokePermissions(userId: string, permissions: any) {
    const result = await this.authService.api.revokePermissions({
      body: {
        userId,
        permissions,
      },
    });
    return result;
  }
}
```

### API Key Management

```typescript
@Injectable()
export class ApiKeyService {
  constructor(private readonly authService: AuthService) {}

  // Create API key
  async createApiKey(userId: string, name: string, expiresIn?: number) {
    const result = await this.authService.api.createApiKey({
      body: {
        userId,
        name,
        expiresIn, // Optional: milliseconds until expiration
      },
    });
    return {
      key: result.key,
      id: result.id,
    };
  }

  // Revoke API key
  async revokeApiKey(keyId: string) {
    await this.authService.api.revokeApiKey({
      body: { keyId },
    });
  }

  // List user API keys
  async listApiKeys(userId: string) {
    const result = await this.authService.api.listApiKeys({
      query: { userId },
    });
    return result.keys;
  }
}
```

---

## Plugin Utilities

**New Feature (2025-12-16)**: Context-aware Better Auth plugin utilities with automatic header injection.

### Overview

The project now includes powerful utility classes that wrap Better Auth plugin methods with automatic header injection from the ORPC context. This eliminates repetitive header passing and reduces code by up to 60%.

### Available Utilities

#### Admin Plugin Utilities

Access via `context.auth.admin.*` in ORPC handlers:

```typescript
import { assertAuthenticated } from '@/core/modules/auth/orpc/types';
import { adminMiddlewares, requireAuth } from '@/core/modules/auth/plugin-utils';

// Use middleware for role-based access control
implement(contract)
  .use(requireAuth())
  .use(adminMiddlewares.requireRole(['admin']))
  .handler(async ({ context, input }) => {
    const auth = assertAuthenticated(context.auth);
    
    // ✅ Create user (headers auto-injected)
    const user = await auth.admin.createUser({
      email: input.email,
      password: input.password,
      name: input.name,
      role: 'user'
    });
    
    return user;
  });
```

**Available Methods:**
- `createUser()` - Create new users
- `updateUser()` - Update user information
- `setRole()` - Assign user roles
- `deleteUser()` - Delete users
- `banUser()` / `unbanUser()` - Ban management
- `listUsers()` - List all users with pagination

#### Organization Plugin Utilities

Access via `context.auth.org.*` in ORPC handlers with role-based middleware:

```typescript
import { organizationMiddlewares, requireAuth } from '@/core/modules/auth/plugin-utils';

// Use middleware for organization role-based access control
implement(contract)
  .use(requireAuth())
  .use(organizationMiddlewares.requireRole(['owner', 'admin', 'member']))
  .handler(async ({ context, input }) => {
    const auth = assertAuthenticated(context.auth);
    
    // ✅ Add member (headers auto-injected)
    const member = await auth.org.addMember({
      organizationId: input.organizationId,
      userId: input.userId,
      role: 'member'
    });
    
    return member;
  });
```

**Available Methods:**
- `createOrganization()` - Create organizations
- `updateOrganization()` / `deleteOrganization()` - Manage organizations
- `getOrganization()` / `listOrganizations()` - Fetch organization data
- `addMember()` / `removeMember()` - Member management
- `updateMemberRole()` - Role management within organizations
- `listMembers()` / `getMember()` - Member queries
- `inviteMember()` - Send organization invitations
- `acceptInvitation()` / `rejectInvitation()` - Handle invitations

### Benefits

**Before (Manual Header Passing):**
```typescript
const result = await auth.api.organization.addMember({
  headers: {
    authorization: context.request.headers.get('authorization') ?? '',
    cookie: context.request.headers.get('cookie') ?? '',
  },
  body: {
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role
  }
});
```

**After (Auto-Injected Headers):**
```typescript
const result = await auth.org.addMember({
  organizationId: input.organizationId,
  userId: input.userId,
  role: input.role
});
```

**Improvements:**
- 60% less code
- No header extraction boilerplate
- Type-safe parameter structure
- Cleaner, more readable code
- Consistent API across all plugin methods
- Easier to test and maintain

### Usage in NestJS Services

Plugin utilities also work in NestJS services when you construct `AuthUtils` with headers:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from '@/core/modules/auth/services/auth.service';
import { AuthUtils } from '@/core/modules/auth/utils/auth-utils';

@Injectable()
export class UserManagementService {
  constructor(private readonly authService: AuthService) {}
  
  async createUserWithOrganization(
    session: UserSession,
    headers: Headers,
    data: CreateUserData
  ) {
    // Create AuthUtils with session and headers
    const authUtils = new AuthUtils(session, this.authService.instance, headers);
    
    // Use plugin utilities
    const user = await authUtils.admin.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'user',
    });
    
    const org = await authUtils.org.createOrganization({
      name: data.orgName,
      slug: data.orgName.toLowerCase().replace(/\s+/g, '-'),
      userId: user.id,
    });
    
    return { user, organization: org };
  }
}
```

### Complete Documentation

For comprehensive documentation, examples, and API reference:

**📚 [Better Auth Plugin Utilities Documentation](../features/BETTER-AUTH-PLUGIN-UTILITIES.md)**

This includes:
- Detailed API reference for all methods
- Complete usage examples for ORPC and NestJS
- Migration guide from manual header passing
- Testing strategies
- Troubleshooting guide

---

## Audit & Recommendations

### ✅ What Exists & Works Well

1. **Comprehensive Decorator System**
   - `@Session()`, `@AuthenticatedUser()`, `@UserRoles()` for accessing auth data
   - `@Public()` and `@Optional()` for authentication control
   - `@RequireRole()`, `@RequireAllRoles()` for role-based access
   - `@RequirePermissions()` for fine-grained permission control
   - `@RequireCommonPermission()` for reusable permission sets
   - `@RequireRoleAndPermissions()` for combined requirements

2. **Guard System**
   - `AuthGuard`: Validates authentication, attaches session to request
   - `RoleGuard`: Validates roles and permissions using Better Auth admin plugin
   - Both guards integrate seamlessly with NestJS reflector system

3. **Type Safety**
   - `UserSession` type provides full type safety for session data
   - Parameter decorators are fully typed
   - Role and permission types defined in config

4. **Better Auth Integration**
   - Clean abstraction via `AuthService`
   - Full access to Better Auth API methods
   - Plugin support (admin, organization, apiKey)

### 🟡 What Can Be Improved

#### 1. ✅ Comprehensive Permission System Implemented

**Status:** IMPLEMENTED - A complete type-safe permission system now exists.

**Location:** `/apps/api/src/config/auth/permissions/`

**What's Included:**

The permissions system provides:
- **Type-safe statement management** with compile-time validation
- **Type-safe role management** with resource-action mapping
- **Collection APIs** for batch operations on statements and roles
- **Builder pattern** for composing complex permission logic
- **Comprehensive documentation** with examples and guides

**Quick Reference:**

For detailed usage, see **Section 2: Permissions System** above, which provides:
- Complete overview of the folder structure
- Quick start guide with code examples
- Documentation reference table listing all available guides
- Integration examples with auth decorators
- Type safety benefits

**Key Features:**

```typescript
// Import permission configuration
import { statementConfig, roleConfig } from '@/config/auth/permissions';
import { commonPermissions } from '@/config/auth/permissions/common';

// Use with decorators
@RequireCommonPermission('projectFullAccess')
@RequirePermissions({ project: ['create', 'update'] })
@RequireRole('admin')
```

**Documentation Files:**

All documentation is available in `apps/api/src/config/auth/permissions/docs/`:
- `GETTING-STARTED.md` - Quick start guide
- `README.md` - Complete system documentation
- `BUILDER-EXAMPLES.md` - Real-world builder patterns
- `COLLECTION-API-EXAMPLES.md` - Batch operations and filtering
- `TYPE_SAFETY.md` - Type utilities and validation

**Impact:** Full type safety throughout the authorization system, preventing runtime errors and providing excellent developer experience with IntelliSense support.

#### 2. Hook System Not Fully Documented

**Issue:** `@Hook()`, `@BeforeHook()`, `@AfterHook()` exist but lack usage examples.

**Recommendation:** Add hook documentation section with examples:

```typescript
// Example: Log all sign-in attempts
@Injectable()
@Hook()
export class AuthHooks {
  constructor(private readonly logger: LoggerService) {}

  @BeforeHook('/sign-in/email')
  async beforeSignIn(context: AuthHookContext) {
    this.logger.log('Sign-in attempt', {
      email: context.body.email,
      ip: context.request.headers['x-forwarded-for'],
    });
    
    // Can modify context or throw errors to prevent sign-in
    return context;
  }

  @AfterHook('/sign-in/email')
  async afterSignIn(context: AuthHookContext) {
    if (context.session) {
      this.logger.log('Sign-in successful', {
        userId: context.session.user.id,
      });
    }
    
    return context;
  }
}
```

#### 3. No Middleware for Rate Limiting

**Issue:** No rate limiting on auth endpoints (sign-in, sign-up).

**Recommendation:** Add rate limiting middleware:

```typescript
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by IP + email combination
    const email = req.body?.email || 'anonymous';
    const ip = req.headers['x-forwarded-for'] || req.ip;
    return `${ip}-${email}`;
  }
}

// Apply to auth controller
@UseGuards(AuthRateLimitGuard)
@Controller('auth')
export class AuthController {
  // ...
}
```

#### 4. Session Refresh Mechanism Missing

**Issue:** No automatic session refresh before expiration.

**Recommendation:** Add session refresh endpoint:

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/refresh')
  async refreshSession(@Session() session: UserSession) {
    // Better Auth handles session refresh internally
    const newSession = await this.authService.api.refreshSession({
      headers: {
        authorization: `Bearer ${session.session.token}`,
      },
    });
    
    return {
      token: newSession.token,
      expiresAt: newSession.expiresAt,
    };
  }
}
```

#### 5. No Audit Logging for Authorization Failures

**Issue:** 403 errors don't log which permissions were missing.

**Recommendation:** Enhance RoleGuard with audit logging:

```typescript
// Add to RoleGuard
if (!hasPermission) {
  // Log authorization failure
  this.auditService.logAuthorizationFailure({
    userId: user.id,
    resource: context.getHandler().name,
    requiredPermissions,
    timestamp: new Date(),
  });

  throw new APIError(403, {
    code: "FORBIDDEN",
    message: `Access denied. Missing required permissions: ${JSON.stringify(requiredPermissions)}`,
  });
}
```

### 🔴 Critical Missing Features

#### 1. Permission Caching

**Issue:** Every request calls `auth.api.userHasPermission()` - potential performance bottleneck.

**Recommendation:** Implement Redis-based permission caching:

```typescript
@Injectable()
export class PermissionCache {
  constructor(private readonly redis: RedisService) {}

  async getPermissions(userId: string): Promise<Permission | null> {
    const cached = await this.redis.get(`permissions:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setPermissions(userId: string, permissions: Permission, ttl = 300) {
    await this.redis.set(
      `permissions:${userId}`,
      JSON.stringify(permissions),
      'EX',
      ttl
    );
  }

  async invalidate(userId: string) {
    await this.redis.del(`permissions:${userId}`);
  }
}
```

#### 2. Multi-Tenancy Support

**Issue:** No organization context isolation in guards.

**Recommendation:** Add organization context decorator and guard:

```typescript
// Decorator to extract organization from request
export const Organization = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.organization; // Set by OrganizationGuard
  }
);

// Guard to extract and validate organization context
@Injectable()
export class OrganizationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.headers['x-organization-id'] || 
                  request.params.organizationId;

    if (!orgId) {
      throw new APIError(400, {
        code: 'MISSING_ORGANIZATION',
        message: 'Organization context required',
      });
    }

    // Verify user has access to this organization
    const session = request.session;
    const member = await this.authService.api.getMember({
      query: {
        organizationId: orgId,
        userId: session.user.id,
      },
    });

    if (!member) {
      throw new APIError(403, {
        code: 'NOT_ORGANIZATION_MEMBER',
        message: 'User is not a member of this organization',
      });
    }

    request.organization = {
      id: orgId,
      role: member.role,
    };

    return true;
  }
}
```

#### 3. API Key Authentication

**Issue:** Only session-based auth; no support for API key authentication.

**Recommendation:** Add API key guard:

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      return false; // Let AuthGuard handle session auth
    }

    // Validate API key via Better Auth
    const result = await this.authService.api.validateApiKey({
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!result.valid) {
      throw new APIError(401, {
        code: 'INVALID_API_KEY',
        message: 'Invalid or expired API key',
      });
    }

    // Attach user info to request
    request.user = result.user;
    request.apiKey = result.key;

    return true;
  }
}

// Use in combination with AuthGuard
@UseGuards(ApiKeyGuard, AuthGuard, RoleGuard)
@Controller('api')
export class ApiController {
  // Accepts both API keys and session tokens
}
```

### 📋 Recommended Implementation Priority

1. **HIGH PRIORITY** (Security & Stability)
   - [x] ✅ **COMPLETED**: Create permission configuration file (see Section 2: Permissions System)
   - [ ] Implement rate limiting on auth endpoints
   - [ ] Add audit logging for authorization failures
   - [ ] Add permission caching with Redis

2. **MEDIUM PRIORITY** (Features)
   - [ ] Add API key authentication guard
   - [ ] Implement session refresh endpoint
   - [ ] Add organization context guard for multi-tenancy
   - [ ] Document hook system usage

3. **LOW PRIORITY** (Developer Experience)
   - [ ] Add permission testing utilities
   - [ ] Create auth decorator composition helpers
   - [ ] Add auth middleware for custom auth flows
   - [ ] Implement permission UI/debugging tools

---

## Related Core Concepts

- [ORPC Implementation Pattern](./09-ORPC-IMPLEMENTATION-PATTERN.md) - Uses @Session() for user context
- [Repository Ownership Rule](./03-REPOSITORY-OWNERSHIP-RULE.md) - Domain services own repositories
- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md) - Service layer structure

---

## When to Use Direct Database Access

Direct database operations are ONLY allowed for:

- **Non-auth domain entities**: Capsules, media files, admin actions, etc.
- **Queries that join auth + domain data**: Use repositories to join `user`/`organization` with domain tables
- **Read-only auth queries**: Fetching user/org data for display purposes

### ✅ Valid Auth Data Query

```typescript
// ✅ CORRECT - Reading auth data for domain logic
async findCapsulesByUser(userId: string) {
  return this.database.db
    .select({
      capsule: capsules,
      owner: user, // Join with user table for display
    })
    .from(capsules)
    .leftJoin(user, eq(capsules.userId, user.id))
    .where(eq(capsules.userId, userId));
}
```

### ❌ Invalid Direct Auth Operations

```typescript
// ❌ NEVER do this for auth entities
await this.database.db.insert(user).values({ ... });
await this.database.db.update(user).set({ role: 'admin' });
await this.database.db.insert(organization).values({ ... });
await this.database.db.insert(member).values({ ... });
await this.database.db.insert(apiKey).values({ ... });
await this.database.db.insert(session).values({ ... });
```

**Why?** Better Auth plugins manage these tables with complex logic for:
- Password hashing and validation
- Session token generation and validation
- Permission inheritance and role hierarchy
- Organization membership validation
- API key rotation and expiration

Direct database access bypasses this logic and will cause bugs.

---

## Enforcement

This pattern is **MANDATORY** for all auth-related operations. Violations include:

- ❌ Using `@Inject(REQUEST)` instead of `@Session()` for user context
- ❌ Direct database operations on auth tables
- ❌ Manual session validation instead of using guards
- ❌ Bypassing decorators with custom authorization logic in controllers
- ❌ Not using `AuthService.api` for auth entity operations

All auth operations MUST go through:
1. **Guards** for authentication/authorization
2. **Decorators** for accessing session data
3. **AuthService.api** for auth entity mutations
```
