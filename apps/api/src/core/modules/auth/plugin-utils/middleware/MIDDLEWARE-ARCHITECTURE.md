# Middleware Architecture

> Type-safe middleware definitions for NestJS Guards and ORPC middleware, integrating with Better Auth permission plugins.

## Overview

This module provides a layered abstraction for creating type-safe authentication and authorization checks that can be converted to either NestJS Guards or ORPC middleware. The architecture is designed around the **Middleware Definition Pattern**, which separates the definition of auth checks from their runtime implementation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Permission Plugins                              │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐    │
│  │  AdminPermissionsPlugin │    │  OrganizationsPermissionsPlugin │    │
│  └───────────┬─────────────┘    └───────────────┬─────────────────┘    │
└──────────────┼──────────────────────────────────┼───────────────────────┘
               │                                  │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Factory Functions (Entry Point)                   │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐    │
│  │  createAdminMiddleware  │    │  createOrganizationMiddleware   │    │
│  └───────────┬─────────────┘    └───────────────┬─────────────────┘    │
└──────────────┼──────────────────────────────────┼───────────────────────┘
               │                                  │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Middleware Definitions                             │
│  ┌─────────────────────────────┐    ┌───────────────────────────────┐  │
│  │  AdminMiddlewareDefinition  │    │  OrganizationMiddlewareDef    │  │
│  │  ├─ hasPermission()         │    │  ├─ hasOrganizationPermission │  │
│  │  ├─ hasRole()               │    │  ├─ isMemberOf()              │  │
│  │  ├─ requireAdminRole()      │    │  ├─ hasOrganizationRole()     │  │
│  │  └─ requireSession()        │    │  └─ isOrganizationOwner()     │  │
│  └──────────────┬──────────────┘    └──────────────┬────────────────┘  │
└─────────────────┼───────────────────────────────────┼───────────────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Middleware Checks                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  BaseMiddlewareCheck<TContext, TError>                          │   │
│  │  ├─ name: string                                                │   │
│  │  ├─ check(context): Promise<void>                               │   │
│  │  └─ metadata: Record<string, unknown>                           │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │
                  ┌───────────────────┼───────────────────┐
                  │                   │                   │
                  ▼                   ▼                   ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   NestJS Guards     │ │   ORPC Middleware   │ │  Composite Guards   │
│  ┌───────────────┐  │ │  ┌───────────────┐  │ │  ┌───────────────┐  │
│  │createNestGuard│  │ │  │createOrpcMW   │  │ │  │createComposite│  │
│  └───────────────┘  │ │  └───────────────┘  │ │  │NestGuard      │  │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

## Quick Start

### Using Factory Functions (Recommended)

The simplest way to create middleware is using the factory functions:

```typescript
import {
  createAdminMiddleware,
  createOrganizationMiddleware,
  createNestGuard,
  createOrpcMiddleware,
} from '@/core/modules/auth/plugin-utils/middleware';

// Get your plugin instances (typically from dependency injection)
const adminPlugin = auth.api.getPlugin('admin');
const orgPlugin = auth.api.getPlugin('organization');

// Create middleware definitions
const adminMiddleware = createAdminMiddleware(adminPlugin);
const orgMiddleware = createOrganizationMiddleware(orgPlugin);

// Use in NestJS controller
@Controller('users')
class UsersController {
  @Get()
  @UseGuards(createNestGuard(adminMiddleware.hasPermission({ user: ['read'] })))
  findAll() {
    return this.usersService.findAll();
  }
}

// Use in ORPC router
const getUsersRoute = os
  .use(createOrpcMiddleware(adminMiddleware.hasPermission({ user: ['read'] })))
  .handler(async () => {
    return await usersService.findAll();
  });
```

### Custom Admin Roles

By default, `requireAdminRole()` uses the default roles from your permission builder. You can customize this:

```typescript
const adminMiddleware = createAdminMiddleware(adminPlugin, {
  adminRoles: ['superadmin', 'admin', 'moderator'],
});

// Now requireAdminRole() will accept these roles
const guard = createNestGuard(adminMiddleware.requireAdminRole());
```

## Core Concepts

### 1. Middleware Definitions

Middleware definitions are type-safe factories that create authorization checks. They wrap permission plugins and provide a fluent API for creating checks.

#### AdminMiddlewareDefinition

```typescript
const middleware = new AdminMiddlewareDefinition(adminPlugin);

// Permission-based check
const canRead = middleware.hasPermission({ user: ['read'] });

// Role-based check
const isAdmin = middleware.hasRole(['admin']);

// Convenience check for admin access
const requireAdmin = middleware.requireAdminRole();

// Session requirement
const needsSession = middleware.requireSession();
```

#### OrganizationMiddlewareDefinition

```typescript
const middleware = new OrganizationMiddlewareDefinition(orgPlugin);

// Organization permission check
const canManageOrg = middleware.hasOrganizationPermission({
  organization: ['manage'],
});

// Membership check
const isMember = middleware.isMemberOf('org-123');

// Role within organization
const isOrgAdmin = middleware.hasOrganizationRole('org-123', ['admin']);

// Owner check
const isOwner = middleware.isOrganizationOwner('org-123');
```

### 2. Middleware Checks

Checks are the smallest unit of authorization logic. Each check has:

- **name**: A descriptive identifier for logging/debugging
- **check(context)**: The async function that performs the authorization
- **metadata**: Static information about the check (permissions, roles, etc.)

```typescript
interface BaseMiddlewareCheck<TContext, TError extends Error> {
  name: string;
  check(context: TContext): Promise<void>;
  metadata: Record<string, unknown>;
}
```

### 3. Dynamic Value Resolution

Checks support both static values and dynamic resolution from context:

```typescript
// Static organization ID
const staticCheck = middleware.isMemberOf('org-123');

// Dynamic from context (request params, body, etc.)
const dynamicCheck = middleware.isMemberOf((context) => context.params.orgId);

// Dynamic permissions
const dynamicPermission = middleware.hasPermission((context) => ({
  [context.resource]: ['read'],
}));
```

### 4. Converters

Converters transform middleware checks into framework-specific guards/middleware:

#### NestJS Guards

```typescript
import { createNestGuard, createCompositeNestGuard } from './middleware-converter';

// Single check
@UseGuards(createNestGuard(adminMiddleware.hasPermission({ user: ['read'] })))

// Multiple checks (all must pass)
@UseGuards(
  createCompositeNestGuard([
    adminMiddleware.requireSession(),
    adminMiddleware.hasPermission({ user: ['read'] }),
  ])
)

// With logging
@UseGuards(
  createNestGuard(adminMiddleware.hasPermission({ user: ['read'] }), {
    enableLogging: true,
  })
)
```

#### ORPC Middleware

```typescript
import { createOrpcMiddleware, createCompositeOrpcMiddleware } from './middleware-converter';

// Single check
const route = os
  .use(createOrpcMiddleware(adminMiddleware.hasPermission({ user: ['read'] })))
  .handler(...);

// Multiple checks
const route = os
  .use(
    createCompositeOrpcMiddleware([
      adminMiddleware.requireSession(),
      orgMiddleware.isMemberOf((ctx) => ctx.input.orgId),
    ])
  )
  .handler(...);
```

## Usage Patterns

### Pattern 1: Role-Based Access Control (RBAC)

```typescript
// Define middleware
const adminMiddleware = createAdminMiddleware(adminPlugin);

// Admin-only endpoints
@Controller('admin')
@UseGuards(createNestGuard(adminMiddleware.requireAdminRole()))
class AdminController {
  @Get('users')
  listUsers() { ... }

  @Post('users')
  @UseGuards(createNestGuard(adminMiddleware.hasPermission({ user: ['create'] })))
  createUser() { ... }
}
```

### Pattern 2: Organization-Based Access

```typescript
const orgMiddleware = createOrganizationMiddleware(orgPlugin);

@Controller('organizations/:orgId')
class OrgController {
  // Any member can view
  @Get()
  @UseGuards(
    createNestGuard(
      orgMiddleware.isMemberOf((ctx) => ctx.params.orgId)
    )
  )
  getOrganization(@Param('orgId') orgId: string) { ... }

  // Only admins can update
  @Put()
  @UseGuards(
    createNestGuard(
      orgMiddleware.hasOrganizationRole(
        (ctx) => ctx.params.orgId,
        ['admin']
      )
    )
  )
  updateOrganization(@Param('orgId') orgId: string) { ... }

  // Only owner can delete
  @Delete()
  @UseGuards(
    createNestGuard(
      orgMiddleware.isOrganizationOwner((ctx) => ctx.params.orgId)
    )
  )
  deleteOrganization(@Param('orgId') orgId: string) { ... }
}
```

### Pattern 3: Composite Authorization

```typescript
const adminMiddleware = createAdminMiddleware(adminPlugin);
const orgMiddleware = createOrganizationMiddleware(orgPlugin);

// User must be admin AND member of the organization
@UseGuards(
  createCompositeNestGuard([
    adminMiddleware.hasRole(['admin']),
    orgMiddleware.isMemberOf((ctx) => ctx.params.orgId),
  ])
)
```

### Pattern 4: ORPC with Type-Safe Context

```typescript
const adminMiddleware = createAdminMiddleware(adminPlugin);

// Define a procedure with auth
const createUserProcedure = os
  .use(createOrpcMiddleware(adminMiddleware.requireSession()))
  .use(createOrpcMiddleware(adminMiddleware.hasPermission({ user: ['create'] })))
  .input(z.object({
    email: z.string().email(),
    name: z.string(),
  }))
  .handler(async ({ input, context }) => {
    // context.session is guaranteed to exist
    return await usersService.create(input, context.session.userId);
  });
```

### Pattern 5: Conditional Authorization

```typescript
// Different permissions based on action
@Controller('posts')
class PostsController {
  @Get()
  @UseGuards(createNestGuard(adminMiddleware.hasPermission({ post: ['read'] })))
  findAll() { ... }

  @Post()
  @UseGuards(createNestGuard(adminMiddleware.hasPermission({ post: ['create'] })))
  create() { ... }

  @Put(':id')
  @UseGuards(
    createCompositeNestGuard([
      adminMiddleware.hasPermission({ post: ['update'] }),
      // Custom check: user must own the post or be admin
      {
        name: 'ownsPostOrAdmin',
        check: async (ctx) => {
          const post = await postsService.findOne(ctx.params.id);
          if (post.authorId !== ctx.session.userId && ctx.session.role !== 'admin') {
            throw new ForbiddenException('Cannot edit this post');
          }
        },
        metadata: {},
      },
    ])
  )
  update(@Param('id') id: string) { ... }
}
```

## Error Handling

### Error Types

The middleware module uses typed errors for different failure scenarios:

```typescript
// Permission denied
MiddlewareAuthError {
  code: 'FORBIDDEN',
  message: 'Permission denied: missing required permission user:create',
  httpStatus: 403
}

// Session required
MiddlewareAuthError {
  code: 'UNAUTHORIZED', 
  message: 'Authentication required',
  httpStatus: 401
}

// Not a member
MiddlewareAuthError {
  code: 'FORBIDDEN',
  message: 'User is not a member of organization org-123',
  httpStatus: 403
}
```

### Custom Error Handling

```typescript
@UseGuards(createNestGuard(adminMiddleware.hasPermission({ user: ['read'] })))
@Catch(MiddlewareAuthError)
class AuthErrorFilter implements ExceptionFilter {
  catch(exception: MiddlewareAuthError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(exception.httpStatus).json({
      error: exception.code,
      message: exception.message,
    });
  }
}
```

## Testing

### Unit Testing Checks

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('hasPermission check', () => {
  it('should pass when user has permission', async () => {
    const mockPlugin = {
      assertCheckPermission: vi.fn().mockResolvedValue(undefined),
      getSession: vi.fn().mockResolvedValue({ userId: 'user-1' }),
    };
    
    const middleware = createAdminMiddleware(mockPlugin);
    const check = middleware.hasPermission({ user: ['read'] });
    
    await expect(check.check({ headers: {} })).resolves.toBeUndefined();
    expect(mockPlugin.assertCheckPermission).toHaveBeenCalled();
  });
});
```

### Integration Testing with Real Plugins

```typescript
describe('Admin Authorization Flow', () => {
  let app: INestApplication;
  let adminPlugin: AdminPermissionsPlugin;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [AuthService],
    }).compile();

    app = moduleRef.createNestApplication();
    adminPlugin = moduleRef.get(AuthService).getPlugin('admin');
    await app.init();
  });

  it('should allow admin to create users', async () => {
    const token = await getAdminToken();
    
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'test@example.com' })
      .expect(201);
  });

  it('should deny regular user from creating users', async () => {
    const token = await getUserToken();
    
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'test@example.com' })
      .expect(403);
  });
});
```

## API Reference

### Factory Functions

#### `createAdminMiddleware(plugin, options?)`

Creates an AdminMiddlewareDefinition from a plugin.

```typescript
function createAdminMiddleware<TPermissionBuilder, TAuth>(
  plugin: AdminPermissionsPlugin<TPermissionBuilder, TAuth>,
  options?: {
    adminRoles?: readonly InferRolesFromBuilder<TPermissionBuilder>[];
  }
): AdminMiddlewareDefinition<TPermissionBuilder, TAuth>;
```

#### `createOrganizationMiddleware(plugin)`

Creates an OrganizationMiddlewareDefinition from a plugin.

```typescript
function createOrganizationMiddleware<TPermissionBuilder, TAuth>(
  plugin: OrganizationsPermissionsPlugin<TPermissionBuilder, TAuth>
): OrganizationMiddlewareDefinition<TPermissionBuilder, TAuth>;
```

### Converters

#### `createNestGuard(check, options?)`

Converts a middleware check to a NestJS CanActivate guard.

```typescript
function createNestGuard<TContext, TError extends Error>(
  check: BaseMiddlewareCheck<TContext, TError>,
  options?: { enableLogging?: boolean }
): Type<CanActivate>;
```

#### `createCompositeNestGuard(checks, options?)`

Creates a composite guard from multiple checks (all must pass).

```typescript
function createCompositeNestGuard<TContext, TError extends Error>(
  checks: BaseMiddlewareCheck<TContext, TError>[],
  options?: { enableLogging?: boolean }
): Type<CanActivate>;
```

#### `createOrpcMiddleware(check)`

Converts a middleware check to an ORPC middleware function.

```typescript
function createOrpcMiddleware<TContext, TError extends Error>(
  check: BaseMiddlewareCheck<TContext, TError>
): ORPCMiddleware;
```

#### `createCompositeOrpcMiddleware(checks)`

Creates a composite ORPC middleware from multiple checks.

```typescript
function createCompositeOrpcMiddleware<TContext, TError extends Error>(
  checks: BaseMiddlewareCheck<TContext, TError>[]
): ORPCMiddleware;
```

### Exports

```typescript
// Main exports from index.ts
export {
  // Types
  BaseMiddlewareCheck,
  MiddlewareCheckOptions,
  PermissionCheckMetadata,
  RoleCheckMetadata,
  OrpcError,
  
  // Definitions
  BaseMiddlewareDefinition,
  AdminMiddlewareDefinition,
  OrganizationMiddlewareDefinition,
  
  // Factory functions
  createAdminMiddleware,
  createOrganizationMiddleware,
  CreateAdminMiddlewareOptions,
  
  // Converters
  createNestGuard,
  createCompositeNestGuard,
  createOrpcMiddleware,
  createCompositeOrpcMiddleware,
};
```

## Best Practices

1. **Use factory functions** - They provide the simplest API and handle type inference.

2. **Define middleware at module level** - Create middleware definitions once and reuse them.

3. **Prefer composition over inheritance** - Use composite guards for complex authorization.

4. **Use dynamic resolution for request-dependent values** - Don't hardcode IDs when they come from the request.

5. **Enable logging in development** - Use `enableLogging: true` for debugging.

6. **Test authorization separately** - Unit test checks, integration test the full flow.

7. **Handle errors gracefully** - Use exception filters for consistent error responses.
