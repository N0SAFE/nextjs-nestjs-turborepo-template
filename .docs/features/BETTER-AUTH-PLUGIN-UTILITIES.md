# Better Auth Plugin Utilities

> **Type**: Feature Documentation - Advanced Auth Integration  
> **Priority**: 🟡 IMPORTANT  
> **Last Updated**: 2025-12-16

## Overview

This document describes the comprehensive utilities system for Better Auth plugins that enables seamless integration between Better Auth's admin and organization plugins with both NestJS controllers and ORPC procedures.

## Table of Contents

1. [Access Control Registration](#access-control-registration)
2. [Plugin-Based Decorator Generation](#plugin-based-decorator-generation)
3. [Plugin-Based Middleware Generation](#plugin-based-middleware-generation)
4. [Context-Aware Plugin Utilities](#context-aware-plugin-utilities)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)

---

## Access Control Registration

Better Auth plugins (admin, organization) support custom access control (AC) configurations that define roles and permissions for different contexts.

### Registering AC with Plugins

The project provides pre-configured plugins with access control already registered:

```typescript
// packages/utils/auth/src/server/plugins/index.ts

import { admin, organization } from "better-auth/plugins";
import { ac, organizationAc, organizationRoles, roles } from "../../permissions/config";

// Admin plugin with platform-level AC
export function useAdmin(options = {}) {
  return admin({
    ac,           // Platform access control
    roles,        // Platform roles (admin, user, guest, etc.)
    ...options,
  });
}

// Organization plugin with organization-level AC
export function useOrganization(options = {}) {
  return organization({
    ac: organizationAc,              // Organization access control
    roles: organizationRoles,        // Organization roles (owner, admin, member, etc.)
    teams: {
      enabled: true,
      allowRemovingAllTeams: true,
    },
    ...options,
  });
}
```

### How AC Works with Plugins

1. **Platform-Level AC (Admin Plugin)**
   - Controls platform-wide permissions (user management, system settings)
   - Uses `ac` and `roles` from `@repo/auth/permissions`
   - Example roles: `admin`, `user`, `guest`
   - Example resources: `user`, `project`, `capsule`

2. **Organization-Level AC (Organization Plugin)**
   - Controls organization-specific permissions (member management, org resources)
   - Uses `organizationAc` and `organizationRoles`
   - Example roles: `owner`, `admin`, `member`, `viewer`
   - Example resources: `organization`, `member`, `team`

### AC Configuration Structure

```typescript
// From @repo/auth/permissions

export const ac = {
  newRole: (permissions: Permission) => permissions,
};

export const roles = {
  admin: {
    user: ['*'],         // All user permissions
    project: ['*'],      // All project permissions
    capsule: ['*'],      // All capsule permissions
  },
  user: {
    project: ['create', 'read', 'update'],
    capsule: ['create', 'read'],
  },
  guest: {
    project: ['read'],
    capsule: ['read'],
  },
};

export const organizationAc = {
  newRole: (permissions: Permission) => permissions,
};

export const organizationRoles = {
  owner: {
    organization: ['*'],
    member: ['*'],
    team: ['*'],
  },
  admin: {
    member: ['create', 'read', 'update', 'delete'],
    team: ['create', 'read', 'update'],
  },
  member: {
    member: ['read'],
    team: ['read'],
  },
};
```

---

## Plugin-Based Decorator Generation

The system provides factories to automatically generate NestJS decorators from Better Auth plugins, maintaining type safety and reducing boilerplate.

### Decorator Factory Interface

```typescript
// apps/api/src/core/modules/auth/plugin-utils/decorator-factory.ts

import type { Auth } from "@/auth";

export interface PluginDecoratorFactory {
  /**
   * Generate decorators for a Better Auth plugin
   */
  createPluginDecorators<TPlugin>(
    plugin: TPlugin,
    pluginName: string
  ): PluginDecorators;
}

export interface PluginDecorators {
  /**
   * Require specific plugin role(s)
   */
  RequirePluginRole: (...roles: string[]) => CustomDecorator;
  
  /**
   * Require all specified plugin roles
   */
  RequireAllPluginRoles: (...roles: string[]) => CustomDecorator;
  
  /**
   * Require specific plugin permissions
   */
  RequirePluginPermissions: (permissions: any) => CustomDecorator;
  
  /**
   * Extract plugin context from request
   */
  PluginContext: () => ParameterDecorator;
}
```

### Usage Example

```typescript
import { createPluginDecorators } from '@/core/modules/auth/plugin-utils';
import { useAdmin, useOrganization } from '@repo/auth/server/plugins';

// Generate admin plugin decorators
const adminPlugin = useAdmin();
const adminDecorators = createPluginDecorators(adminPlugin, 'admin');

// Use in controllers
@Controller('admin')
export class AdminController {
  @adminDecorators.RequirePluginRole('admin')
  @Get('/users')
  listUsers() {
    return { users: [] };
  }
  
  @adminDecorators.RequirePluginPermissions({ user: ['delete'] })
  @Delete('/users/:id')
  deleteUser() {
    return { deleted: true };
  }
}

// Generate organization plugin decorators
const orgPlugin = useOrganization();
const orgDecorators = createPluginDecorators(orgPlugin, 'organization');

@Controller('organizations')
export class OrganizationController {
  @orgDecorators.RequirePluginRole('owner', 'admin')
  @Post('/:orgId/members')
  addMember() {
    return { added: true };
  }
}
```

---

## Plugin-Based Middleware Generation

Similar to decorator generation, the system provides factories for creating ORPC middlewares from Better Auth plugins.

### Middleware Factory Interface

```typescript
// apps/api/src/core/modules/auth/plugin-utils/middleware-factory.ts

import type { Auth } from "@/auth";

export interface PluginMiddlewareFactory {
  /**
   * Generate ORPC middlewares for a Better Auth plugin
   */
  createPluginMiddlewares<TPlugin>(
    auth: Auth,
    plugin: TPlugin,
    pluginName: string
  ): PluginMiddlewares;
}

export interface PluginMiddlewares {
  /**
   * Middleware to require specific plugin role(s)
   */
  requirePluginRole: (...roles: string[]) => ORPCMiddleware;
  
  /**
   * Middleware to require all specified plugin roles
   */
  requireAllPluginRoles: (...roles: string[]) => ORPCMiddleware;
  
  /**
   * Middleware to require specific plugin permissions
   */
  requirePluginPermissions: (permissions: any) => ORPCMiddleware;
  
  /**
   * Middleware to check plugin access with custom logic
   */
  requirePluginAccess: (
    checkFn: (context: ORPCAuthContext) => Promise<boolean>
  ) => ORPCMiddleware;
}
```

### Usage Example

```typescript
import { createPluginMiddlewares } from '@/core/modules/auth/plugin-utils';
import { useAdmin } from '@repo/auth/server/plugins';
import { auth } from '@/auth';

// Generate admin plugin middlewares
const adminPlugin = useAdmin();
const adminMiddlewares = createPluginMiddlewares(auth, adminPlugin, 'admin');

// Use in ORPC procedures
import { implement } from '@orpc/server';
import { userContract } from '@repo/contracts/api/modules/user';

export const userRouter = implement(userContract, {
  list: {
    // Require admin role via plugin middleware
    middleware: [adminMiddlewares.requirePluginRole('admin')],
    handler: async ({ context }) => {
      const users = await fetchUsers();
      return users;
    },
  },
  
  delete: {
    // Require delete permission via plugin middleware
    middleware: [
      adminMiddlewares.requirePluginPermissions({ user: ['delete'] })
    ],
    handler: async ({ context, input }) => {
      await deleteUser(input.id);
      return { success: true };
    },
  },
});
```

---

## Context-Aware Plugin Utilities

The most powerful feature: utilities that automatically inject headers from the ORPC context, eliminating the need to manually pass headers to every plugin method call.

### Overview

Better Auth plugin methods require headers for authentication:

```typescript
// ❌ Manual header passing (repetitive and error-prone)
await auth.api.organization.addMember({
  headers: context.request.headers,  // Manual header passing
  body: { organizationId, userId, role }
});

// ✅ With context-aware utilities (automatic header injection)
await context.auth.org.addMember({ organizationId, userId, role });
```

### Implementation Structure

```typescript
// apps/api/src/core/modules/auth/plugin-utils/context-aware-plugins.ts

import type { Auth } from "@/auth";
import type { ORPCAuthContext } from "../orpc/types";

/**
 * Context-aware wrapper for Better Auth admin plugin
 */
export class AdminPluginUtils {
  constructor(
    private readonly auth: Auth,
    private readonly headers: Headers
  ) {}
  
  /**
   * Check if user has admin access
   */
  async hasAccess(): Promise<boolean> {
    const session = await this.auth.api.getSession({
      headers: this.headers,
    });
    
    if (!session) return false;
    
    // Check admin role via plugin
    return await this.auth.api.userHasRole({
      headers: this.headers,
      body: {
        userId: session.user.id,
        role: 'admin',
      },
    });
  }
  
  /**
   * Create user (admin-only operation)
   * Headers are automatically injected
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    return await this.auth.api.createUser({
      headers: this.headers,  // Auto-injected
      body: data,
    });
  }
  
  /**
   * Set user role (admin-only operation)
   */
  async setRole(userId: string, role: string) {
    return await this.auth.api.setRole({
      headers: this.headers,  // Auto-injected
      body: { userId, role },
    });
  }
  
  /**
   * Delete user (admin-only operation)
   */
  async deleteUser(userId: string) {
    return await this.auth.api.deleteUser({
      headers: this.headers,  // Auto-injected
      body: { userId },
    });
  }
  
  /**
   * Ban user (admin-only operation)
   */
  async banUser(userId: string, reason?: string) {
    return await this.auth.api.banUser({
      headers: this.headers,  // Auto-injected
      body: { userId, reason },
    });
  }
  
  /**
   * Unban user (admin-only operation)
   */
  async unbanUser(userId: string) {
    return await this.auth.api.unbanUser({
      headers: this.headers,  // Auto-injected
      body: { userId },
    });
  }
}

/**
 * Context-aware wrapper for Better Auth organization plugin
 */
export class OrganizationPluginUtils {
  constructor(
    private readonly auth: Auth,
    private readonly headers: Headers
  ) {}
  
  /**
   * Check if user has access to organization
   */
  async hasAccess(organizationId: string): Promise<boolean> {
    const session = await this.auth.api.getSession({
      headers: this.headers,
    });
    
    if (!session) return false;
    
    try {
      const member = await this.auth.api.organization.getMember({
        headers: this.headers,
        query: {
          organizationId,
          userId: session.user.id,
        },
      });
      
      return !!member;
    } catch {
      return false;
    }
  }
  
  /**
   * Create organization
   */
  async createOrganization(data: {
    name: string;
    slug: string;
    userId: string;
  }) {
    return await this.auth.api.organization.create({
      headers: this.headers,  // Auto-injected
      body: data,
    });
  }
  
  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    data: { name?: string; slug?: string }
  ) {
    return await this.auth.api.organization.update({
      headers: this.headers,  // Auto-injected
      body: { organizationId, ...data },
    });
  }
  
  /**
   * Delete organization
   */
  async deleteOrganization(organizationId: string) {
    return await this.auth.api.organization.delete({
      headers: this.headers,  // Auto-injected
      body: { organizationId },
    });
  }
  
  /**
   * Add member to organization
   */
  async addMember(data: {
    organizationId: string;
    userId: string;
    role: string;
  }) {
    return await this.auth.api.organization.addMember({
      headers: this.headers,  // Auto-injected
      body: data,
    });
  }
  
  /**
   * Remove member from organization
   */
  async removeMember(data: {
    organizationId: string;
    userId: string;
  }) {
    return await this.auth.api.organization.removeMember({
      headers: this.headers,  // Auto-injected
      body: data,
    });
  }
  
  /**
   * Update member role
   */
  async updateMemberRole(data: {
    organizationId: string;
    userId: string;
    role: string;
  }) {
    return await this.auth.api.organization.updateMemberRole({
      headers: this.headers,  // Auto-injected
      body: data,
    });
  }
  
  /**
   * List organization members
   */
  async listMembers(organizationId: string) {
    return await this.auth.api.organization.listMembers({
      headers: this.headers,  // Auto-injected
      query: { organizationId },
    });
  }
  
  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string) {
    return await this.auth.api.organization.get({
      headers: this.headers,  // Auto-injected
      query: { organizationId },
    });
  }
}
```

### Integration with AuthUtils

Update the existing `AuthUtils` class to include these utilities:

```typescript
// apps/api/src/core/modules/auth/utils/auth-utils.ts

import { AdminPluginUtils, OrganizationPluginUtils } from '../plugin-utils/context-aware-plugins';

export class AuthUtils {
  private readonly _adminUtils: AdminPluginUtils;
  private readonly _orgUtils: OrganizationPluginUtils;
  
  constructor(
    private readonly _session: UserSession | null,
    private readonly auth: Auth,
    private readonly headers?: Headers
  ) {
    // Initialize plugin utilities with headers
    this._adminUtils = new AdminPluginUtils(auth, headers ?? new Headers());
    this._orgUtils = new OrganizationPluginUtils(auth, headers ?? new Headers());
  }
  
  /**
   * Access admin plugin utilities with auto-injected headers
   */
  get admin(): AdminPluginUtils {
    return this._adminUtils;
  }
  
  /**
   * Access organization plugin utilities with auto-injected headers
   */
  get org(): OrganizationPluginUtils {
    return this._orgUtils;
  }
  
  // ... existing methods ...
}
```

### Update Auth Plugin to Pass Headers

```typescript
// apps/api/src/core/modules/auth/orpc/plugins/auth.plugin.ts

export class AuthPlugin<TContext extends AuthPluginContext>
  implements StandardHandlerPlugin<TContext>
{
  // ... existing code ...
  
  init(options: StandardHandlerOptions<TContext>): void {
    const auth = this.auth;

    options.rootInterceptors ??= [];

    options.rootInterceptors.push(async (interceptorOptions) => {
      const { context, request, next } = interceptorOptions;

      // Extract session from request headers
      let session: UserSession | null = null;

      try {
        const headers = request.headers;
        const webHeaders = toWebHeaders(headers);
        
        const sessionData = await auth.api.getSession({
          headers: webHeaders,
          asResponse: false,
        });
        
        // ... session extraction logic ...
      } catch (error) {
        console.error("Auth Plugin: Error extracting session:", error);
      }

      // Create auth utilities with session AND headers
      const authUtils = new AuthUtils(session, auth, webHeaders);

      // Continue with enriched context
      return next({
        ...interceptorOptions,
        context: {
          ...context,
          auth: authUtils,
        },
      });
    });
  }
}
```

---

## Usage Examples

### Example 1: Admin Operations in ORPC

```typescript
import { implement } from '@orpc/server';
import { adminContract } from '@repo/contracts/api/modules/admin';
import { assertAuthenticated } from '@/core/modules/auth/orpc/types';

export const adminRouter = implement(adminContract, {
  createUser: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // ✅ No need to pass headers manually
      const result = await auth.admin.createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role: input.role,
      });
      
      return result;
    },
  },
  
  banUser: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // ✅ Headers auto-injected
      await auth.admin.banUser(input.userId, input.reason);
      
      return { success: true };
    },
  },
  
  checkAdminAccess: {
    handler: async ({ context }) => {
      // ✅ Check admin access easily
      const hasAccess = await context.auth.admin.hasAccess();
      
      return { hasAccess };
    },
  },
});
```

### Example 2: Organization Operations in ORPC

```typescript
import { implement } from '@orpc/server';
import { organizationContract } from '@repo/contracts/api/modules/organization';

export const organizationRouter = implement(organizationContract, {
  createOrganization: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // ✅ Auto-injected headers
      const org = await auth.org.createOrganization({
        name: input.name,
        slug: input.slug,
        userId: auth.user.id,
      });
      
      return org;
    },
  },
  
  addMember: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // ✅ Check access first
      const hasAccess = await auth.org.hasAccess(input.organizationId);
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this organization",
        });
      }
      
      // ✅ Add member with auto-injected headers
      const member = await auth.org.addMember({
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
      });
      
      return member;
    },
  },
  
  listMembers: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // ✅ Simple method call
      const members = await auth.org.listMembers(input.organizationId);
      
      return members;
    },
  },
});
```

### Example 3: Combined Admin & Organization Operations

```typescript
export const userManagementRouter = implement(userManagementContract, {
  promoteToOrgAdmin: {
    handler: async ({ context, input }) => {
      const auth = assertAuthenticated(context.auth);
      
      // ✅ Check platform admin access
      const isAdmin = await auth.admin.hasAccess();
      if (!isAdmin) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only platform admins can perform this action",
        });
      }
      
      // ✅ Update organization member role
      await auth.org.updateMemberRole({
        organizationId: input.organizationId,
        userId: input.userId,
        role: 'admin',
      });
      
      return { success: true };
    },
  },
});
```

### Example 4: Using in NestJS Services

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
    data: {
      email: string;
      password: string;
      name: string;
      orgName: string;
    }
  ) {
    // Create AuthUtils with session and headers
    const authUtils = new AuthUtils(session, this.authService.instance, headers);
    
    // ✅ Create user via admin utilities
    const user = await authUtils.admin.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'user',
    });
    
    // ✅ Create organization for user
    const org = await authUtils.org.createOrganization({
      name: data.orgName,
      slug: data.orgName.toLowerCase().replace(/\s+/g, '-'),
      userId: user.id,
    });
    
    return { user, organization: org };
  }
}
```

---

## API Reference

### AdminPluginUtils

```typescript
class AdminPluginUtils {
  // Access Control
  hasAccess(): Promise<boolean>
  
  // User Management
  createUser(data: CreateUserData): Promise<User>
  deleteUser(userId: string): Promise<void>
  setRole(userId: string, role: string): Promise<User>
  
  // Ban Management
  banUser(userId: string, reason?: string): Promise<void>
  unbanUser(userId: string): Promise<void>
}
```

### OrganizationPluginUtils

```typescript
class OrganizationPluginUtils {
  // Access Control
  hasAccess(organizationId: string): Promise<boolean>
  
  // Organization Management
  createOrganization(data: CreateOrgData): Promise<Organization>
  updateOrganization(id: string, data: UpdateOrgData): Promise<Organization>
  deleteOrganization(id: string): Promise<void>
  getOrganization(id: string): Promise<Organization>
  
  // Member Management
  addMember(data: AddMemberData): Promise<Member>
  removeMember(data: RemoveMemberData): Promise<void>
  updateMemberRole(data: UpdateMemberRoleData): Promise<Member>
  listMembers(organizationId: string): Promise<Member[]>
}
```

### Factory Functions

```typescript
// Decorator Factory
createPluginDecorators<TPlugin>(
  plugin: TPlugin,
  pluginName: string
): PluginDecorators

// Middleware Factory
createPluginMiddlewares<TPlugin>(
  auth: Auth,
  plugin: TPlugin,
  pluginName: string
): PluginMiddlewares
```

---

## Benefits

### 1. Reduced Boilerplate

**Before:**
```typescript
await auth.api.organization.addMember({
  headers: {
    authorization: request.headers.get('authorization'),
    cookie: request.headers.get('cookie'),
  },
  body: { organizationId, userId, role }
});
```

**After:**
```typescript
await context.auth.org.addMember({ organizationId, userId, role });
```

### 2. Type Safety

All plugin utilities are fully typed with TypeScript, providing:
- Autocomplete in IDEs
- Compile-time error checking
- Parameter validation

### 3. Consistency

Same pattern across all plugin operations:
- `auth.admin.*` for admin operations
- `auth.org.*` for organization operations
- Automatic header injection

### 4. Testability

Easy to mock for testing:
```typescript
const mockAuthUtils = {
  admin: {
    hasAccess: vi.fn().mockResolvedValue(true),
    createUser: vi.fn().mockResolvedValue({ id: '123' }),
  },
  org: {
    hasAccess: vi.fn().mockResolvedValue(true),
    addMember: vi.fn().mockResolvedValue({ id: '456' }),
  },
};
```

---

## Migration Guide

### For Existing Code

If you have existing code using manual header passing:

**Before:**
```typescript
const result = await auth.api.organization.addMember({
  headers: context.request.headers,
  body: { organizationId, userId, role }
});
```

**After:**
```typescript
const result = await context.auth.org.addMember({
  organizationId,
  userId,
  role
});
```

### Steps

1. Replace direct `auth.api.*` calls with `context.auth.admin.*` or `context.auth.org.*`
2. Remove manual header passing
3. Update parameter destructuring to remove `headers` field
4. Test thoroughly to ensure authentication still works

---

## Related Documentation

- [Better Auth Integration Pattern](./../core-concepts/07-BETTER-AUTH-INTEGRATION.md)
- [ORPC Implementation Pattern](./../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- [Access Control Configuration](../../apps/api/src/config/auth/permissions/docs/README.md)

---

## Troubleshooting

### Headers Not Being Passed

**Symptom:** Getting authentication errors even though user is logged in.

**Solution:** Ensure the `AuthPlugin` is properly configured to pass headers to `AuthUtils`:

```typescript
const authUtils = new AuthUtils(session, auth, webHeaders);
```

### Plugin Methods Not Available

**Symptom:** TypeScript errors when accessing `auth.admin.*` or `auth.org.*`.

**Solution:** Ensure your `AuthUtils` class has been updated with the plugin utility getters.

### Type Errors with Plugin Utilities

**Symptom:** TypeScript can't infer types for plugin method returns.

**Solution:** Import types from Better Auth:

```typescript
import type { User, Organization, Member } from 'better-auth';
```

---

## Future Enhancements

- [ ] Support for custom plugins beyond admin and organization
- [ ] Automatic plugin detection and utility generation
- [ ] GraphQL resolver utilities for plugin operations
- [ ] Plugin utilities for client-side operations
- [ ] Caching layer for plugin operations
- [ ] Batch operation utilities for bulk updates
