# Migration Guide: From Permission Decorators to Plugin-Based Access Control

> **Date**: 2025-12-16  
> **Updated**: 2025-01-XX  
> **Status**: Current Best Practice

## Overview

This guide explains how to migrate from the deprecated permission-based decorators (`@RequirePermissions`, `@RequireCommonPermission`) to the new plugin-based access control system using role-based middlewares like `adminMiddlewares.requireRole()` and `organizationMiddlewares.requireRole()`.

## Why This Change?

### Old Approach Problems

The old approach using `@RequirePermissions` had several issues:

1. **Tight coupling**: Permission checks were coupled to Better Auth's `userHasPermission` API
2. **Type safety gaps**: Permission structures weren't fully type-safe
3. **Boilerplate**: Required manual permission configuration for every route
4. **Inflexible**: Hard to extend for new plugins or custom access logic

### New Approach Benefits

The new plugin-based approach provides:

1. **Role-based access**: Simple role checks using `requireRole(['admin'])`
2. **Permission-based access**: Permission checks using `requirePermission({ user: ['read'] })`
3. **Full type safety**: Uses Better Auth's type inference for all checks
4. **Extensible**: Easy to add new plugins with automatic decorator/middleware generation
5. **Consistent**: Same pattern across NestJS controllers and ORPC procedures

## Migration Steps

### For NestJS Controllers

#### Old Way (Deprecated)

```typescript
import { RequirePermissions, RequireCommonPermission } from '@/core/modules/auth/decorators/decorators';

@Controller('admin')
export class AdminController {
  // Old: Using permission-based decorator
  @RequirePermissions({
    user: ['create', 'update', 'delete']
  })
  @Post('/users')
  createUser(@Body() data: CreateUserDto) {
    // ...
  }

  // Old: Using common permission
  @RequireCommonPermission('userManagement')
  @Get('/users')
  listUsers() {
    // ...
  }
}
```

#### New Way (Recommended)

```typescript
import { UseGuards } from '@nestjs/common';
import { adminDecorators } from '@/core/modules/auth/plugin-utils';
import { PluginAccessGuard } from '@/core/modules/auth/guards/plugin-access.guard';

@Controller('admin')
@UseGuards(PluginAccessGuard) // Apply guard at controller level
export class AdminController {
  // New: Using plugin-based decorator with role check
  @adminDecorators.RequireRole(['admin'])
  @Post('/users')
  async createUser(@Body() data: CreateUserDto) {
    // Role check is handled by PluginAccessGuard
    // ...
  }

  // New: Same pattern for all admin operations
  @adminDecorators.RequireRole(['admin', 'superAdmin'])
  @Get('/users')
  async listUsers() {
    // Consistent role checking
    // ...
  }
}
```

### For ORPC Procedures

#### Old Way (Deprecated)

```typescript
import { accessControl } from '@/core/modules/auth/orpc/middlewares';

export const userRouter = implement(userContract, {
  create: {
    // Old: Using permission-based middleware
    middleware: [
      accessControl({
        permissions: {
          user: ['create', 'update']
        }
      })
    ],
    handler: async ({ context, input }) => {
      // ...
    },
  },
});
```

#### New Way (Recommended)

```typescript
import { adminMiddlewares, requireAuth } from '@/core/modules/auth/plugin-utils';
import { assertAuthenticated } from '@/core/modules/auth/orpc/types';

export const userRouter = implement(userContract, {
  create: {
    // New: Using plugin-based middleware with role check
    middleware: [requireAuth(), adminMiddlewares.requireRole(['admin'])],
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // Role already checked by middleware
      const user = await auth.admin.createUser(input);
      return user;
    },
  },
  
  // For operations that don't need admin role check,
  // just authenticate the user
  getSelf: {
    middleware: [requireAuth()],
    handler: async ({ context }) => {
      const auth = assertAuthenticated(context.auth);
      
      // Just need to be authenticated, no admin role required
      return auth.user;
    },
  },
});
```

### For Organization-Scoped Operations

#### Old Way (Deprecated)

```typescript
@Controller('organizations')
export class OrganizationController {
  // Old: Permission-based check
  @RequirePermissions({
    organization: ['manage-members']
  })
  @Post('/:orgId/members')
  async addMember(
    @Param('orgId') orgId: string,
    @Body() data: AddMemberDto
  ) {
    // ...
  }
}
```

#### New Way (Recommended)

```typescript
import { UseGuards } from '@nestjs/common';
import { organizationDecorators } from '@/core/modules/auth/plugin-utils';
import { PluginAccessGuard } from '@/core/modules/auth/guards/plugin-access.guard';
import { AuthUtils } from '@/core/modules/auth/utils/auth-utils';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly authService: AuthService) {}

  // New: Check organization role in handler
  @UseGuards(AuthGuard) // Still need authentication
  @Post('/:orgId/members')
  async addMember(
    @Param('orgId') orgId: string,
    @Body() data: AddMemberDto,
    @Session() session: UserSession,
    @Req() request: Request
  ) {
    // Create AuthUtils with headers
    const headers = new Headers();
    if (request.headers.authorization) {
      headers.set('authorization', request.headers.authorization);
    }
    
    const authUtils = new AuthUtils(
      session,
      this.authService.instance,
      headers
    );
    
    // Check if user has admin or owner role in organization
    const userOrgRole = session.user.organizationRole;
    if (!['owner', 'admin'].includes(userOrgRole)) {
      throw new ForbiddenException('Only organization owners and admins can add members');
    }
    
    // Proceed with operation
    const member = await authUtils.org.addMember({
      organizationId: orgId,
      userId: data.userId,
      role: data.role,
    });
    
    return member;
  }
}
```

For ORPC with organization scope:

```typescript
import { organizationMiddlewares, requireAuth } from '@/core/modules/auth/plugin-utils';

export const organizationRouter = implement(organizationContract, {
  addMember: {
    // Use role-based middleware for organization
    middleware: [
      requireAuth(),
      organizationMiddlewares.requireRole(['owner', 'admin'])
    ],
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // Role already verified by middleware
      const member = await auth.org.addMember(input);
      return member;
    },
  },
});
```

## Factory Functions for Custom Plugins

If you add new Better Auth plugins in the future, you can easily generate decorators and middlewares:

```typescript
import { createPluginDecorators, createPluginMiddlewares } from '@/core/modules/auth/plugin-utils';

// Define your plugin metadata
const myPluginMetadata = {
  name: 'myPlugin',
  type: 'my_plugin',
  scopeAccessor: 'myPlugin', // Property name in auth context
};

// Generate decorators
export const myPluginDecorators = createPluginDecorators(myPluginMetadata);

// Generate middlewares
export const myPluginMiddlewares = createPluginMiddlewares(myPluginMetadata);

// Use in code
@myPluginDecorators.RequireRole(['admin'])
@Get('/my-plugin-route')
async myRoute() { ... }

// Or in ORPC
implement(contract)
  .use(myPluginMiddlewares.requireRole(['admin']))
  .handler(({ context }) => { ... })
```

## Type Safety with Better Auth Inference

The new approach leverages Better Auth's type inference system:

```typescript
import type { Auth } from '@/auth';

// Auth type is inferred from your Better Auth configuration
// All plugin methods are fully typed based on your config

export const handler = async ({ context }: { context: ORPCContextWithAuth }) => {
  const auth = assertAuthenticated(context.auth);
  
  // TypeScript knows all available methods on auth.admin
  const user = await auth.admin.createUser({
    email: 'test@example.com',
    password: 'secure123',
    name: 'Test User',
    role: 'user', // Type-checked against your role configuration
  });
  
  // TypeScript knows all available methods on auth.org
  const org = await auth.org.createOrganization({
    name: 'Test Org',
    slug: 'test-org',
    userId: auth.user.id,
  });
  
  return { user, org };
};
```

## Checklist for Migration

Use this checklist when migrating your code:

### NestJS Controllers

- [ ] Replace `@RequirePermissions()` with `@adminDecorators.RequireRole(['admin'])` or role checks
- [ ] Replace `@RequireCommonPermission()` with plugin-specific decorators
- [ ] Add `@UseGuards(PluginAccessGuard)` where needed
- [ ] Remove imports of deprecated decorators
- [ ] Update tests to mock new role-based methods

### ORPC Procedures

- [ ] Replace `accessControl({ permissions: ... })` with `adminMiddlewares.requireRole(['admin'])`
- [ ] For organization checks, use `organizationMiddlewares.requireRole(['owner', 'admin'])`
- [ ] For permission checks, use `adminMiddlewares.requirePermission({ resource: ['action'] })`
- [ ] Update handler logic to use plugin methods (`auth.admin.*`, `auth.org.*`)
- [ ] Remove manual header passing (now automatic)
- [ ] Update tests to mock plugin methods

### General

- [ ] Update documentation and comments
- [ ] Remove unused permission configuration
- [ ] Test all access control scenarios
- [ ] Verify type safety throughout

## Common Patterns

### Pattern 1: Admin-Only Route

```typescript
@UseGuards(PluginAccessGuard)
@adminDecorators.RequireRole(['admin'])
@Post('/admin/action')
async adminAction() {
  // Only admins can access
}
```

### Pattern 2: Organization Member Check

```typescript
@Get('/organizations/:orgId/data')
async getOrgData(
  @Param('orgId') orgId: string,
  @Session() session: UserSession
) {
  // Check user's organization role
  const userOrgRole = session.user.organizationRole;
  if (!['owner', 'admin', 'member'].includes(userOrgRole)) {
    throw new ForbiddenException('You are not a member of this organization');
  }
  
  // Proceed
  return this.orgService.getData(orgId);
}
```

### Pattern 3: Mixed Access (Admin OR Owner)

```typescript
@Get('/resources/:id')
async getResource(
  @Param('id') resourceId: string,
  @Session() session: UserSession
) {
  const authUtils = new AuthUtils(session, this.authService.instance, headers);
  
  // Check if admin role OR resource owner
  const isAdmin = ['admin', 'superAdmin'].includes(session.user.role);
  const isOwner = resource.ownerId === authUtils.user.id;
  
  if (!isAdmin && !isOwner) {
    throw new ForbiddenException();
  }
  
  return resource;
}
```

## FAQ

### Q: Can I still use role-based decorators?

**A:** Yes! `@RequireRole()` and `@RequireAllRoles()` are still supported and work well alongside the new plugin-based approach.

### Q: What about the RoleGuard?

**A:** `RoleGuard` is still used for role-based checks. `PluginAccessGuard` is specifically for plugin-specific access control.

### Q: Do I need to migrate everything at once?

**A:** No. The old decorators are deprecated but still functional. Migrate incrementally, starting with new code.

### Q: How do I test the new approach?

**A:** Mock the role-based methods in your tests:

```typescript
const mockAuth = {
  isLoggedIn: true,
  user: { id: 'user-123', role: 'admin' },
  admin: {
    createUser: vi.fn(),
    setRole: vi.fn(),
  },
  org: {
    addMember: vi.fn(),
    updateMemberRole: vi.fn(),
  },
};
```

## Support

For questions or issues with migration:
- Review the [Better Auth Plugin Utilities documentation](../features/BETTER-AUTH-PLUGIN-UTILITIES.md)
- Check the implementation in `apps/api/src/core/modules/auth/plugin-utils/`
- Open an issue in the repository
