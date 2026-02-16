# Better Auth Plugin Utilities

> **Type**: Feature Documentation - Advanced Auth Integration  
> **Priority**: 🟡 IMPORTANT  
> **Last Updated**: 2025-01-XX

## Overview

This document describes the comprehensive utilities system for Better Auth plugins that enables seamless integration between Better Auth's admin and organization plugins with both NestJS controllers and ORPC procedures.

## Table of Contents

1. [Plugin Wrapper Registry](#plugin-wrapper-registry)
2. [Plugin Factory System](#plugin-factory-system)
3. [Plugin-Based Decorator Generation](#plugin-based-decorator-generation)
4. [Plugin-Based Middleware Generation](#plugin-based-middleware-generation)
5. [Integration with AuthUtils](#integration-with-authutils)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)

---

## Plugin Wrapper Registry

The plugin wrapper registry provides a type-safe, builder-pattern approach to managing Better Auth plugin wrappers. It's designed to:

- Support multiple auth instances
- Provide fully typed plugin access
- Enable lazy instantiation with header injection

### Core Architecture

```
@repo/auth/permissions
├── plugins/system/registry.ts     # Generic PluginWrapperRegistry class
├── plugins/admin.ts               # AdminPermissionsPlugin wrapper
└── plugins/organization.ts        # OrganizationsPermissionsPlugin wrapper

apps/api/src/core/modules/auth/plugin-utils
├── plugin-wrapper-factory.ts      # Creates configured registry with type aliases
└── plugin-factory.ts              # NestJS decorators and ORPC middlewares
```

### PluginWrapperRegistry (Builder Pattern)

The registry uses a builder pattern where each `register()` call returns a NEW typed registry:

```typescript
import { PluginWrapperRegistry } from "@repo/auth/permissions";
import type { Auth } from "@/auth";

// Create registry bound to auth instance
const registry = new PluginWrapperRegistry<Auth>(auth)
  .register('admin', createAdminWrapper)        // Returns PluginWrapperRegistry<Auth, { admin: ... }>
  .register('organization', createOrgWrapper);  // Returns PluginWrapperRegistry<Auth, { admin: ..., organization: ... }>

// Get all plugins at once (typed record)
const plugins = registry.getAll(headers);
await plugins.admin.createUser({ ... });
await plugins.organization.createOrganization({ ... });

// Or get single plugin
const admin = registry.create('admin', headers);
await admin.setRole(userId, 'admin');
```

### Factory Function (App-Level)

The app provides a pre-configured factory:

```typescript
// apps/api/src/core/modules/auth/plugin-utils/plugin-wrapper-factory.ts

import { createPluginRegistry, type AdminPluginWrapper, type OrganizationPluginWrapper } from './plugin-wrapper-factory';

// Create registry for your auth instance
const registry = createPluginRegistry(auth);

// Get typed plugins
const plugins = registry.getAll(headers);
// plugins.admin: AdminPluginWrapper
// plugins.organization: OrganizationPluginWrapper
```

### Type Exports

```typescript
// Typed plugin wrappers
export type AdminPluginWrapper = AdminPermissionsPlugin<typeof platformBuilder, Auth>;
export type OrganizationPluginWrapper = OrganizationsPermissionsPlugin<typeof organizationBuilder, Auth>;

// Plugin registry interface
export interface PluginRegistry {
  admin: AdminPluginWrapper;
  organization: OrganizationPluginWrapper;
}
```

---

## Plugin Factory System

The plugin factory system provides a standardized way to generate type-safe decorators and middlewares for any Better Auth plugin.

### Why Use Plugin Factories?

1. **Type Safety**: Full TypeScript inference from Better Auth configuration
2. **Extensibility**: Easy to add support for new plugins
3. **Consistency**: Same patterns across all plugins
4. **Role-Based Access**: Uses plugin-specific `requireRole()` middlewares

### Scope-Based Access Control

Each plugin provides role-based access control methods:

```typescript
// Platform-level admin role check
adminMiddlewares.requireRole(['admin', 'superAdmin'])

// Organization-level role check
organizationMiddlewares.requireRole(['owner', 'admin', 'member'])
```

### Pre-configured Plugin Factories

```typescript
import { 
  adminDecorators, 
  adminMiddlewares,
  organizationDecorators,
  organizationMiddlewares
} from '@/core/modules/auth/plugin-utils';

// NestJS: Require admin role
@UseGuards(PluginAccessGuard)
@adminDecorators.RequireRole(['admin'])
@Get('/admin/users')
async listUsers() { ... }

// ORPC: Require admin role
implement(contract)
  .use(adminMiddlewares.requireRole(['admin']))
  .handler(({ context }) => { ... })

// ORPC: Require organization role
implement(contract)
  .use(organizationMiddlewares.requireRole(['owner', 'admin']))
  .handler(({ context, input }) => { ... })
```

---

## Plugin-Based Decorator Generation

Generate NestJS decorators from plugin metadata:

```typescript
import { createPluginDecorators } from '@/core/modules/auth/plugin-utils';

const myPluginDecorators = createPluginDecorators({
  name: 'myPlugin',
  type: 'my_plugin',
  scopeAccessor: 'myPlugin',
});

// Use in controllers
@UseGuards(PluginAccessGuard)
@myPluginDecorators.RequireAccess()
@Get('/resource')
async getResource() { ... }
```

### Built-in Decorators

```typescript
// Admin plugin
export const adminDecorators = createPluginDecorators({
  name: 'admin',
  type: 'admin',
  scopeAccessor: 'admin',
});

// Organization plugin
export const organizationDecorators = createPluginDecorators({
  name: 'organization',
  type: 'organization',
  scopeAccessor: 'org',
});
```

---

## Plugin-Based Middleware Generation

Generate ORPC middlewares from plugin metadata:

```typescript
import { createPluginMiddlewares } from '@/core/modules/auth/plugin-utils';

const myPluginMiddlewares = createPluginMiddlewares({
  name: 'myPlugin',
  type: 'my_plugin',
  scopeAccessor: 'myPlugin',
});

// Use in ORPC procedures
implement(contract)
  .use(myPluginMiddlewares.requireRole(['admin']))
  .handler(({ context }) => { ... })
```

### Built-in Middlewares

```typescript
// Admin plugin middlewares
export const adminMiddlewares = createPluginMiddlewares({
  name: 'admin',
  type: 'admin',
  scopeAccessor: 'admin',
});

// Organization plugin middlewares
export const organizationMiddlewares = createPluginMiddlewares({
  name: 'organization',
  type: 'organization',
  scopeAccessor: 'org',
});
```

### Middleware Methods

```typescript
// requireRole() - Check if user has any of the specified roles
adminMiddlewares.requireRole(['admin', 'superAdmin'])

// requireAllRoles() - Check if user has ALL specified roles
adminMiddlewares.requireAllRoles(['admin', 'moderator'])

// requirePermission() - Check user permission via Better Auth API
adminMiddlewares.requirePermission({ user: ['read', 'update'] })
```

---

## Integration with AuthUtils

The `AuthUtils` class provides plugin access via getters that use the registry:

```typescript
// apps/api/src/core/modules/auth/utils/auth-utils.ts

export class AuthUtils {
  private readonly _adminUtils: AdminPluginWrapper;
  private readonly _orgUtils: OrganizationPluginWrapper;

  constructor(
    private readonly _session: UserSession | null,
    private readonly auth: Auth,
    private readonly headers?: Headers
  ) {
    // Create plugin wrappers using the registry
    const registry = createPluginRegistry(auth);
    const plugins = registry.getAll(headers ?? new Headers());
    this._adminUtils = plugins.admin;
    this._orgUtils = plugins.organization;
  }

  /**
   * Access admin plugin utilities with auto-injected headers
   */
  get admin(): AdminPluginWrapper {
    return this._adminUtils;
  }

  /**
   * Access organization plugin utilities with auto-injected headers
   */
  get org(): OrganizationPluginWrapper {
    return this._orgUtils;
  }
}
```

### Usage in ORPC Context

```typescript
// In ORPC handler (after middleware has validated access)
const auth = assertAuthenticated(context.auth);

// Admin operations (use adminMiddlewares.requireRole() for access control)
await auth.admin.createUser({ ... });
await auth.admin.setRole(userId, 'admin');

// Organization operations (use organizationMiddlewares.requireRole() for access control)
await auth.org.createOrganization({ ... });
await auth.org.addMember({ ... });
```

---

## Usage Examples

### Example 1: Admin Operations in ORPC

```typescript
import { implement } from '@orpc/server';
import { assertAuthenticated } from '@/core/modules/auth/orpc/types';
import { adminMiddlewares, requireAuth } from '@/core/modules/auth/plugin-utils';

export const adminRouter = implement(adminContract, {
  createUser: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // Headers auto-injected via registry
      const result = await auth.admin.createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role: input.role,
      });
      
      return result;
    },
  },
  
  // Using middleware for role-based access control
  banUser: implement(contract)
    .use(requireAuth())
    .use(adminMiddlewares.requireRole(['admin', 'superAdmin']))
    .handler(async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      await auth.admin.banUser(input.userId, input.reason);
      return { success: true };
    }),
});
```

### Example 2: Organization Operations in ORPC

```typescript
import { implement } from '@orpc/server';
import { organizationMiddlewares, requireAuth } from '@/core/modules/auth/plugin-utils';

export const organizationRouter = implement(organizationContract, {
  createOrganization: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      const org = await auth.org.createOrganization({
        name: input.name,
        slug: input.slug,
        userId: auth.user.id,
      });
      
      return org;
    },
  },
  
  // Using role-based organization access control
  addMember: implement(contract)
    .use(requireAuth())
    .use(organizationMiddlewares.requireRole(['owner', 'admin']))
    .handler(async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      const member = await auth.org.addMember({
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
      });
      
      return member;
    }),
});
```

### Example 3: Combined Admin & Organization Operations

```typescript
export const userManagementRouter = implement(contract, {
  promoteToOrgAdmin: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // Check platform admin role
      const userRole = auth.user.role;
      if (!['admin', 'superAdmin'].includes(userRole)) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only platform admins can perform this action",
        });
      }
      
      // Update organization member role
      await auth.org.updateMemberRole({
        organizationId: input.organizationId,
        memberId: input.userId,
        role: 'admin',
      });
      
      return { success: true };
    },
  },
});
```

---

## API Reference

### PluginWrapperRegistry

```typescript
class PluginWrapperRegistry<TAuth, TRegistry = {}> {
  constructor(auth: TAuth);
  
  // Register a plugin wrapper factory (returns NEW typed registry)
  register<K extends string, T>(
    name: K,
    factory: (auth: TAuth, headers: Headers) => T
  ): PluginWrapperRegistry<TAuth, TRegistry & { [key in K]: T }>;
  
  // Create single plugin instance
  create<K extends keyof TRegistry>(name: K, headers: Headers): TRegistry[K];
  
  // Get all plugins at once (typed record)
  getAll(headers: Headers): Readonly<TRegistry>;
}
```

### AdminPermissionsPlugin

```typescript
class AdminPermissionsPlugin<TPermissionBuilder, TAuth> {
  constructor(options: { auth: TAuth; headers: Headers; permissionBuilder: TPermissionBuilder });
  
  createUser(data: CreateUserData): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  setRole(userId: string, role: string): Promise<User>;
  banUser(userId: string, reason?: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  listUsers(options?: ListOptions): Promise<User[]>;
}
```

### OrganizationsPermissionsPlugin

```typescript
class OrganizationsPermissionsPlugin<TPermissionBuilder, TAuth> {
  constructor(options: { auth: TAuth; headers: Headers; permissionBuilder: TPermissionBuilder });
  
  createOrganization(data: CreateOrgData): Promise<Organization>;
  updateOrganization(id: string, data: UpdateOrgData): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  getOrganization(id: string): Promise<Organization>;
  addMember(data: AddMemberData): Promise<Member>;
  removeMember(data: RemoveMemberData): Promise<void>;
  updateMemberRole(data: UpdateMemberRoleData): Promise<Member>;
  listMembers(organizationId: string): Promise<Member[]>;
}
```

### Factory Functions

```typescript
// Create configured plugin registry
function createPluginRegistry(auth: Auth): AppPluginRegistry;

// Create decorators for a plugin
function createPluginDecorators(plugin: PluginMetadata): {
  RequireAccess: (options?: PluginDecoratorOptions) => CustomDecorator;
  metadataKey: string;
};

// Create middlewares for a plugin
function createPluginMiddlewares(plugin: PluginMetadata): {
  requireRole: (roles: string[], options?: PluginMiddlewareOptions) => ORPCMiddleware;
  requireAllRoles: (roles: string[]) => ORPCMiddleware;
  requirePermission: (permission: PermissionRequirement) => ORPCMiddleware;
};
```

---

## Benefits

### 1. Type-Safe Plugin Access

```typescript
const plugins = registry.getAll(headers);
// plugins.admin: AdminPermissionsPlugin<typeof platformBuilder, Auth>
// plugins.organization: OrganizationsPermissionsPlugin<typeof organizationBuilder, Auth>
```

### 2. Multiple Auth Instance Support

```typescript
// Each registry is bound to its auth instance
const registry1 = createPluginRegistry(auth1);
const registry2 = createPluginRegistry(auth2);
```

### 3. Builder Pattern for Extensibility

```typescript
const registry = new PluginWrapperRegistry(auth)
  .register('admin', createAdminWrapper)
  .register('organization', createOrgWrapper)
  .register('customPlugin', createCustomWrapper);  // Easy to extend
```

### 4. Consistent Header Injection

All plugin methods automatically use the headers provided to `getAll()` or `create()`.

---

## Related Documentation

- [Better Auth Integration Pattern](../core-concepts/07-BETTER-AUTH-INTEGRATION.md)
- [ORPC Implementation Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- [Permission System](../../packages/utils/auth/src/permissions/docs/README.md)

---

## Troubleshooting

### Type Errors with Plugin Wrappers

**Symptom:** TypeScript errors when accessing plugin methods.

**Solution:** Ensure you're using the correct type exports:

```typescript
import type { AdminPluginWrapper, OrganizationPluginWrapper } from '@/core/modules/auth/plugin-utils';
```

### Plugin Not Found in Registry

**Symptom:** `Cannot read property 'admin' of undefined`.

**Solution:** Ensure the registry is properly configured:

```typescript
const registry = createPluginRegistry(auth);
const plugins = registry.getAll(headers);  // Don't forget headers!
```

### Headers Not Being Used

**Symptom:** Authentication errors despite valid session.

**Solution:** Ensure headers are passed when getting plugins:

```typescript
// ✅ Correct
const plugins = registry.getAll(context.request.headers);

// ❌ Wrong - empty headers
const plugins = registry.getAll(new Headers());
```
