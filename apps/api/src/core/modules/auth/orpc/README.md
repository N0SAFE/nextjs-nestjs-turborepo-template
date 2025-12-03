# ORPC Auth Context Layer

This module provides a centralized authentication and authorization system for ORPC handlers through context injection, replacing decorator-based authentication with a contract-based middleware approach.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Basic Usage](#basic-usage)
4. [Available Auth Utilities](#available-auth-utilities)
5. [Middleware Options](#middleware-options)
6. [Migration Guide](#migration-guide)
7. [Advanced Examples](#advanced-examples)
8. [Best Practices](#best-practices)

## Overview

### Why Contract-Based Auth?

The ORPC auth context layer provides several advantages over decorator-based authentication:

- **Unified API**: All auth operations available through `context.auth`
- **Composable Middleware**: Chain authentication requirements with `.use()`
- **Programmatic Checks**: Use auth utilities directly in handler logic
- **Type Safety**: Full TypeScript support for auth context
- **Flexible Access Control**: Mix and match roles, permissions, and custom logic
- **Better Testing**: Easier to mock auth context in tests

### The Problem with Decorators

**Before (Decorator-based):**
```typescript
@RequireRole('admin')
@Implement(contract)
handler(@Session() session: Session) {
  // Auth logic split between decorators and handler
  // Can't do programmatic checks easily
  // Decorators evaluated before ORPC pipeline
}
```

**After (Contract-based):**
```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(requireAuth())
    .use(accessControl({ roles: ['admin'] }))
    .handler(({ context }) => {
      // All auth utilities available in context
      // Can do programmatic checks anywhere
      // Part of ORPC pipeline
    });
}
```

## Architecture

### Flow Diagram

```
Request → Global Auth Middleware → Procedure Middleware → Handler
          ↓                        ↓                       ↓
          Injects context.auth     Validates access        Uses auth utils
```

### Components

1. **Global Auth Middleware**: Automatically injects `context.auth` on every request
2. **Auth Utilities (`AuthUtils`)**: Provides authentication and authorization methods
3. **Middleware Factories**: Pre-built middleware for common auth patterns
4. **Type Definitions**: TypeScript interfaces for type-safe auth operations

## Basic Usage

### 1. Require Authentication

```typescript
import { requireAuth } from '@/core/modules/orpc-auth';

@Implement(contract)
handler() {
  return implement(contract)
    .use(requireAuth())
    .handler(({ context }) => {
      // User is guaranteed to be authenticated here
      const userId = context.auth.user!.id;
      const email = context.auth.user!.email;
      
      // Session is also available
      const sessionId = context.auth.session!.session.id;
    });
}
```

### 2. Check Authentication Status

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    // No requireAuth middleware
    .handler(({ context }) => {
      if (context.auth.isLoggedIn) {
        // User is authenticated
        const userId = context.auth.user!.id;
        return { message: `Hello, ${userId}` };
      }
      
      // User is not authenticated
      return { message: 'Hello, guest!' };
    });
}
```

### 3. Require Specific Roles

```typescript
import { accessControl } from '@/core/modules/orpc-auth';

@Implement(contract)
handler() {
  return implement(contract)
    .use(accessControl({ roles: ['admin', 'manager'] }))
    .handler(({ context }) => {
      // User has either 'admin' OR 'manager' role
      const userRoles = context.auth.getRoles();
    });
}
```

### 4. Require Multiple Roles

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(accessControl({ allRoles: ['admin', 'superuser'] }))
    .handler(({ context }) => {
      // User has BOTH 'admin' AND 'superuser' roles
    });
}
```

### 5. Require Permissions

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(accessControl({
      permissions: {
        project: ['create', 'update'],
        user: ['read']
      }
    }))
    .handler(({ context }) => {
      // User has all specified permissions
    });
}
```

### 6. Public Access (No Auth Required)

```typescript
import { publicAccess } from '@/core/modules/orpc-auth';

@Implement(contract)
handler() {
  return implement(contract)
    .use(publicAccess())
    .handler(({ context }) => {
      // Anyone can access, auth may or may not be present
      if (context.auth.isLoggedIn) {
        // Personalized response
      } else {
        // Generic response
      }
    });
}
```

## Available Auth Utilities

All utilities are available through `context.auth`:

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isLoggedIn` | `boolean` | Whether user is authenticated |
| `session` | `UserSession \| null` | Full session object (null if not logged in) |
| `user` | `User \| null` | User object (null if not logged in) |

### Methods

#### `requireAuth(): UserSession`

Requires user to be authenticated. Throws `UnauthorizedException` if not.

```typescript
const session = context.auth.requireAuth();
const userId = session.user.id;
```

#### `requireRole(...roles: RoleName[]): UserSession`

Requires user to have ANY of the specified roles. Throws error if not authenticated or missing roles.

```typescript
const session = context.auth.requireRole('admin', 'manager');
// User has either admin OR manager role
```

#### `requireAllRoles(...roles: RoleName[]): UserSession`

Requires user to have ALL specified roles.

```typescript
const session = context.auth.requireAllRoles('admin', 'superuser');
// User has BOTH admin AND superuser roles
```

#### `requirePermissions(permissions: Permission): Promise<UserSession>`

Requires user to have specific permissions.

```typescript
await context.auth.requirePermissions({
  project: ['create', 'delete'],
  organization: ['manage-members']
});
```

#### `access(options: AccessOptions): Promise<boolean>`

Non-throwing check for access. Returns `true` if user has access, `false` otherwise.

```typescript
const hasAccess = await context.auth.access({
  roles: ['admin'],
  permissions: { project: ['delete'] }
});

if (hasAccess) {
  // Perform privileged operation
}
```

#### `getRoles(): RoleName[]`

Get array of user's roles.

```typescript
const roles = context.auth.getRoles();
// ['admin', 'user']
```

#### `hasRole(role: RoleName): boolean`

Check if user has specific role.

```typescript
if (context.auth.hasRole('admin')) {
  // User is admin
}
```

#### `hasPermission(permission: Permission): Promise<boolean>`

Check if user has specific permission.

```typescript
const canDelete = await context.auth.hasPermission({
  project: ['delete']
});
```

## Middleware Options

### `requireAuth()`

Simplest auth middleware - requires user to be authenticated.

```typescript
.use(requireAuth())
```

### `accessControl(options)`

Flexible middleware for role and permission checking.

**Options:**
- `requireAuth?: boolean` - Whether to require authentication (default: auto-detect from other options)
- `roles?: RoleName[]` - User must have ANY of these roles
- `allRoles?: RoleName[]` - User must have ALL of these roles
- `permissions?: Permission` - User must have these permissions

**Examples:**

```typescript
// Require any of these roles
.use(accessControl({ roles: ['admin', 'editor'] }))

// Require all of these roles
.use(accessControl({ allRoles: ['admin', 'superuser'] }))

// Require specific permissions
.use(accessControl({
  permissions: {
    project: ['create', 'update'],
    user: ['read']
  }
}))

// Combine roles and permissions
.use(accessControl({
  roles: ['manager'],
  permissions: { project: ['delete'] }
}))

// Explicit auth requirement
.use(accessControl({ requireAuth: true }))
```

### `publicAccess()`

Marks endpoint as public - no authentication required.

```typescript
.use(publicAccess())
```

## Migration Guide

### Step 1: Remove Decorators

**Before:**
```typescript
import { Session, RequireRole } from '@/core/modules/auth/decorators/decorators';

@RequireRole('admin')
@Implement(contract)
handler(@Session() session: Session) {
  return implement(contract).handler(async ({ input }) => {
    const userId = session.user.id;
    // ...
  });
}
```

**After:**
```typescript
import { accessControl } from '@/core/modules/orpc-auth';

@Implement(contract)
handler() {
  return implement(contract)
    .use(accessControl({ roles: ['admin'] }))
    .handler(async ({ input, context }) => {
      const userId = context.auth.user!.id;
      // ...
    });
}
```

### Step 2: Update Handler Parameters

Remove all parameter decorators and use `context` instead:

**Before:**
```typescript
handler(@Session() session: Session, @UserRoles() roles: RoleName[]) {
  // ...
}
```

**After:**
```typescript
handler() {
  return implement(contract)
    .use(requireAuth())
    .handler(({ context }) => {
      const session = context.auth.session!;
      const roles = context.auth.getRoles();
      // ...
    });
}
```

### Step 3: Convert Public Endpoints

**Before:**
```typescript
@Public()
@Implement(contract)
handler() {
  // ...
}
```

**After:**
```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(publicAccess())
    .handler(({ context }) => {
      // Check if authenticated
      if (context.auth.isLoggedIn) {
        // ...
      }
    });
}
```

### Step 4: Convert Optional Auth

**Before:**
```typescript
@Optional()
@Implement(contract)
handler(@Session() session?: Session) {
  if (session) {
    // Authenticated
  }
}
```

**After:**
```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(publicAccess())
    .handler(({ context }) => {
      if (context.auth.isLoggedIn) {
        // Authenticated
      }
    });
}
```

### Step 5: Convert Permission Checks

**Before:**
```typescript
@RequirePermissions({ project: ['create'] })
@Implement(contract)
handler() {
  // ...
}
```

**After:**
```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(accessControl({
      permissions: { project: ['create'] }
    }))
    .handler(({ context }) => {
      // ...
    });
}
```

## Advanced Examples

### Dynamic Access Control

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      // Check if user is admin OR owns the resource
      const isAdmin = context.auth.hasRole('admin');
      const isOwner = input.userId === context.auth.user!.id;
      
      if (!isAdmin && !isOwner) {
        throw new ForbiddenException('Access denied');
      }
      
      // Proceed with operation
    });
}
```

### Conditional Permission Checks

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      // Different permissions based on action
      if (input.action === 'delete') {
        await context.auth.requirePermissions({
          project: ['delete']
        });
      } else if (input.action === 'update') {
        await context.auth.requirePermissions({
          project: ['update']
        });
      }
      
      // Proceed with operation
    });
}
```

### Combining Multiple Checks

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(accessControl({ roles: ['manager'] }))
    .handler(async ({ input, context }) => {
      // Additional programmatic checks
      if (input.dangerousAction) {
        // Require additional permission
        await context.auth.requirePermissions({
          project: ['dangerous-actions']
        });
      }
      
      // Proceed
    });
}
```

### Graceful Degradation

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(publicAccess())
    .handler(async ({ input, context }) => {
      let data = await fetchPublicData();
      
      // Add premium features if user has permission
      if (await context.auth.hasPermission({ premium: ['access'] })) {
        data = enhanceWithPremiumFeatures(data);
      }
      
      return data;
    });
}
```

### Audit Logging

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      const userId = context.auth.user!.id;
      const roles = context.auth.getRoles();
      
      // Log the action
      await auditLog.record({
        action: 'resource_accessed',
        userId,
        roles,
        timestamp: new Date(),
      });
      
      // Proceed with operation
    });
}
```

## Best Practices

### 1. Use Middleware for Static Requirements

If your auth requirements are static (don't depend on input), use middleware:

```typescript
// ✅ Good - Static requirement
.use(accessControl({ roles: ['admin'] }))

// ❌ Avoid - Same effect but less clear
.handler(({ context }) => {
  context.auth.requireRole('admin');
})
```

### 2. Use Programmatic Checks for Dynamic Logic

When auth depends on input or business logic, use utilities in handler:

```typescript
// ✅ Good - Dynamic check
.handler(async ({ input, context }) => {
  if (input.action === 'delete') {
    context.auth.requireRole('admin');
  }
})
```

### 3. Prefer `access()` for Non-Throwing Checks

Use `access()` when you want to check without throwing:

```typescript
// ✅ Good - Non-throwing check
const canDelete = await context.auth.access({
  roles: ['admin'],
  permissions: { project: ['delete'] }
});

if (canDelete) {
  // Delete operation
}
```

### 4. Chain Middleware Logically

```typescript
// ✅ Good - Clear progression
.use(requireAuth())
.use(accessControl({ roles: ['manager'] }))
.handler(({ context }) => {
  // Additional checks
})
```

### 5. Document Auth Requirements

```typescript
/**
 * Delete project
 * 
 * **Auth Requirements:**
 * - Must be authenticated
 * - Must have 'admin' or 'manager' role
 * - Must have project:delete permission
 */
@Implement(contract)
handler() {
  return implement(contract)
    .use(accessControl({
      roles: ['admin', 'manager'],
      permissions: { project: ['delete'] }
    }))
    .handler(({ context }) => {
      // ...
    });
}
```

### 6. Handle Edge Cases

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(requireAuth())
    .handler(async ({ context }) => {
      // Always check role exists before using
      const userRole = context.auth.session?.user.role;
      if (!userRole) {
        throw new Error('User has no role assigned');
      }
      
      // Safe to use role methods
      const roles = context.auth.getRoles();
    });
}
```

### 7. Type Guards

```typescript
@Implement(contract)
handler() {
  return implement(contract)
    .use(publicAccess())
    .handler(({ context }) => {
      // Use type guards for optional auth
      if (context.auth.isLoggedIn && context.auth.user) {
        // TypeScript knows user is defined here
        const userId: string = context.auth.user.id;
      }
    });
}
```

## Error Handling

The auth utilities throw standard NestJS exceptions:

- `UnauthorizedException` (401): Not authenticated
- `ForbiddenException` (403): Authenticated but insufficient permissions

These are automatically caught by ORPC error handlers and returned as proper HTTP responses.

## Testing

### Mocking Auth Context

```typescript
describe('MyController', () => {
  it('should work with authenticated user', async () => {
    const mockAuth = {
      isLoggedIn: true,
      user: { id: 'user-1', email: 'test@example.com' },
      session: { /* ... */ },
      requireAuth: () => ({ user: { id: 'user-1' } }),
      getRoles: () => ['admin'],
      hasRole: (role) => role === 'admin',
      // ... other methods
    };
    
    const context = {
      request: mockRequest,
      auth: mockAuth,
    };
    
    // Test your handler
  });
});
```

## Summary

The ORPC auth context layer provides a modern, flexible approach to authentication and authorization in ORPC handlers:

- **Unified API** through `context.auth`
- **Composable** with middleware chains
- **Type-safe** with full TypeScript support
- **Flexible** with both middleware and programmatic checks
- **Testable** with easy mocking

Migrate your controllers gradually, starting with new endpoints and then converting existing ones as needed.
