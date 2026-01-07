# ORPC Auth Context Examples

> ⚠️ **DEPRECATED**: This documentation uses legacy `accessControl()` patterns.
> 
> **Use plugin-based middlewares instead:**
> - `adminMiddlewares.requireRole(['admin'])` - Role-based access
> - `adminMiddlewares.requirePermission({ resource: ['action'] })` - Permission-based access
> - `organizationMiddlewares.requireRole(['owner', 'admin', 'member'])` - Organization role-based access
> 
> See `plugin-factory.ts` and `test.controller.ts` for examples of the new implementation.

This document provides practical examples of using the ORPC auth context layer for common authentication and authorization scenarios.

## Table of Contents

1. [Basic Authentication](#basic-authentication)
2. [Role-Based Access Control](#role-based-access-control)
3. [Permission-Based Access Control](#permission-based-access-control)
4. [Mixed Access Control](#mixed-access-control)
5. [Optional Authentication](#optional-authentication)
6. [Dynamic Authorization](#dynamic-authorization)
7. [Resource Ownership](#resource-ownership)
8. [Multi-Tenant Access](#multi-tenant-access)

---

## Basic Authentication

### Example 1: Simple Authenticated Endpoint

```typescript
import { Implement, implement } from "@orpc/nest";
import { requireAuth } from "@/core/modules/orpc-auth";
import { userContract } from "@repo/api-contracts";

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Implement(userContract.getProfile)
  getProfile() {
    return implement(userContract.getProfile)
      .use(requireAuth())
      .handler(async ({ context }) => {
        // User is guaranteed to be authenticated
        const userId = context.auth.user!.id;
        const profile = await this.userService.getProfile(userId);
        
        return profile;
      });
  }
}
```

### Example 2: Check Authentication Without Requiring It

```typescript
@Implement(contentContract.list)
listContent() {
  return implement(contentContract.list)
    .use(publicAccess())
    .handler(async ({ input, context }) => {
      let content = await this.contentService.getPublicContent();
      
      // Add personalized content if user is logged in
      if (context.auth.isLoggedIn) {
        const userId = context.auth.user!.id;
        const personalizedContent = await this.contentService.getPersonalizedContent(userId);
        content = [...content, ...personalizedContent];
      }
      
      return { content };
    });
}
```

---

## Role-Based Access Control

### Example 3: Single Role Requirement

```typescript
import { accessControl } from "@/core/modules/orpc-auth";

@Implement(adminContract.listUsers)
listUsers() {
  return implement(adminContract.listUsers)
    .use(accessControl({ roles: ['admin'] }))
    .handler(async ({ input, context }) => {
      // Only admin role can access
      const users = await this.userService.listAll(input.pagination);
      return { users };
    });
}
```

### Example 4: Multiple Role Options (OR Logic)

```typescript
@Implement(projectContract.create)
createProject() {
  return implement(projectContract.create)
    .use(accessControl({ roles: ['admin', 'manager', 'editor'] }))
    .handler(async ({ input, context }) => {
      // User must have admin OR manager OR editor role
      const userId = context.auth.user!.id;
      const project = await this.projectService.create(input, userId);
      
      return project;
    });
}
```

### Example 5: Multiple Role Requirements (AND Logic)

```typescript
@Implement(systemContract.reset)
resetSystem() {
  return implement(systemContract.reset)
    .use(accessControl({ allRoles: ['admin', 'superuser'] }))
    .handler(async ({ context }) => {
      // User must have BOTH admin AND superuser roles
      await this.systemService.performReset();
      
      return { success: true };
    });
}
```

---

## Permission-Based Access Control

### Example 6: Single Permission Check

```typescript
@Implement(projectContract.delete)
deleteProject() {
  return implement(projectContract.delete)
    .use(accessControl({
      permissions: {
        project: ['delete']
      }
    }))
    .handler(async ({ input, context }) => {
      // User must have project:delete permission
      await this.projectService.delete(input.id);
      
      return { success: true };
    });
}
```

### Example 7: Multiple Permissions

```typescript
@Implement(projectContract.deploy)
deployProject() {
  return implement(projectContract.deploy)
    .use(accessControl({
      permissions: {
        project: ['read', 'deploy'],
        deployment: ['create'],
        infrastructure: ['access']
      }
    }))
    .handler(async ({ input, context }) => {
      // User must have all specified permissions
      const result = await this.deploymentService.deploy(input.projectId);
      
      return result;
    });
}
```

---

## Mixed Access Control

### Example 8: Roles AND Permissions

```typescript
@Implement(organizationContract.manageBilling)
manageBilling() {
  return implement(organizationContract.manageBilling)
    .use(accessControl({
      roles: ['admin', 'billing-manager'],
      permissions: {
        organization: ['manage-billing'],
        billing: ['access', 'modify']
      }
    }))
    .handler(async ({ input, context }) => {
      // User must have (admin OR billing-manager role)
      // AND all specified permissions
      await this.billingService.update(input);
      
      return { success: true };
    });
}
```

### Example 9: All Roles AND Permissions

```typescript
@Implement(securityContract.accessAuditLogs)
accessAuditLogs() {
  return implement(securityContract.accessAuditLogs)
    .use(accessControl({
      allRoles: ['admin', 'security-officer'],
      permissions: {
        audit: ['read', 'export'],
        security: ['access-logs']
      }
    }))
    .handler(async ({ input, context }) => {
      // User must have (admin AND security-officer roles)
      // AND all specified permissions
      const logs = await this.auditService.getLogs(input.filters);
      
      return { logs };
    });
}
```

---

## Optional Authentication

### Example 10: Public With Enhanced Features for Authenticated Users

```typescript
@Implement(articleContract.get)
getArticle() {
  return implement(articleContract.get)
    .use(publicAccess())
    .handler(async ({ input, context }) => {
      const article = await this.articleService.getById(input.id);
      
      // Public article data
      const response = {
        title: article.title,
        content: article.publicContent,
        author: article.author,
      };
      
      // Add premium content if user is authenticated with premium access
      if (context.auth.isLoggedIn) {
        const hasPremium = await context.auth.hasPermission({
          subscription: ['premium']
        });
        
        if (hasPremium) {
          response.content = article.fullContent;
          response.premium = true;
        }
      }
      
      return response;
    });
}
```

### Example 11: Graceful Feature Degradation

```typescript
@Implement(analyticsContract.getStats)
getStats() {
  return implement(analyticsContract.getStats)
    .use(publicAccess())
    .handler(async ({ input, context }) => {
      // Basic stats for everyone
      const stats = {
        views: await this.analyticsService.getViews(input.resourceId),
      };
      
      // Add detailed stats for authenticated users
      if (context.auth.isLoggedIn) {
        stats.detailedMetrics = await this.analyticsService.getDetailedMetrics(
          input.resourceId,
          context.auth.user!.id
        );
      }
      
      // Add admin-only insights
      if (context.auth.hasRole('admin')) {
        stats.adminInsights = await this.analyticsService.getAdminInsights(
          input.resourceId
        );
      }
      
      return stats;
    });
}
```

---

## Dynamic Authorization

### Example 12: Input-Based Authorization

```typescript
@Implement(resourceContract.update)
updateResource() {
  return implement(resourceContract.update)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      // Check permissions based on input action
      if (input.action === 'delete') {
        await context.auth.requirePermissions({
          resource: ['delete']
        });
      } else if (input.action === 'publish') {
        await context.auth.requirePermissions({
          resource: ['publish']
        });
      } else if (input.action === 'edit') {
        await context.auth.requirePermissions({
          resource: ['update']
        });
      }
      
      await this.resourceService.performAction(input.id, input.action);
      
      return { success: true };
    });
}
```

### Example 13: Conditional Role Requirements

```typescript
@Implement(settingsContract.update)
updateSettings() {
  return implement(settingsContract.update)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      // Different role requirements for different settings
      if (input.section === 'security') {
        context.auth.requireRole('admin', 'security-officer');
      } else if (input.section === 'billing') {
        context.auth.requireRole('admin', 'billing-manager');
      } else {
        // Any authenticated user for basic settings
      }
      
      await this.settingsService.update(input.section, input.values);
      
      return { success: true };
    });
}
```

---

## Resource Ownership

### Example 14: Owner OR Admin Access

```typescript
@Implement(documentContract.delete)
deleteDocument() {
  return implement(documentContract.delete)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      const document = await this.documentService.getById(input.id);
      
      if (!document) {
        throw new NotFoundException('Document not found');
      }
      
      // Check if user is owner OR admin
      const isOwner = document.userId === context.auth.user!.id;
      const isAdmin = context.auth.hasRole('admin');
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'You can only delete your own documents unless you are an admin'
        );
      }
      
      await this.documentService.delete(input.id);
      
      return { success: true };
    });
}
```

### Example 15: Resource Owner Verification

```typescript
@Implement(profileContract.update)
updateProfile() {
  return implement(profileContract.update)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      const currentUserId = context.auth.user!.id;
      
      // Users can only update their own profile
      if (input.userId !== currentUserId) {
        // Unless they're an admin
        if (!context.auth.hasRole('admin')) {
          throw new ForbiddenException('You can only update your own profile');
        }
      }
      
      await this.userService.updateProfile(input.userId, input.data);
      
      return { success: true };
    });
}
```

---

## Multi-Tenant Access

### Example 16: Organization Membership Check

```typescript
@Implement(organizationContract.getSettings)
getOrganizationSettings() {
  return implement(organizationContract.getSettings)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      const userId = context.auth.user!.id;
      
      // Verify user is member of organization
      const isMember = await this.organizationService.isMember(
        input.organizationId,
        userId
      );
      
      if (!isMember) {
        throw new ForbiddenException(
          'You are not a member of this organization'
        );
      }
      
      const settings = await this.organizationService.getSettings(
        input.organizationId
      );
      
      return settings;
    });
}
```

### Example 17: Organization Role-Based Access

```typescript
@Implement(organizationContract.updateSettings)
updateOrganizationSettings() {
  return implement(organizationContract.updateSettings)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      const userId = context.auth.user!.id;
      
      // Get user's role in organization
      const memberRole = await this.organizationService.getMemberRole(
        input.organizationId,
        userId
      );
      
      if (!memberRole) {
        throw new ForbiddenException(
          'You are not a member of this organization'
        );
      }
      
      // Only admins and owners can update settings
      if (!['admin', 'owner'].includes(memberRole)) {
        throw new ForbiddenException(
          'Only organization admins and owners can update settings'
        );
      }
      
      await this.organizationService.updateSettings(
        input.organizationId,
        input.settings
      );
      
      return { success: true };
    });
}
```

### Example 18: Tenant Isolation

```typescript
@Implement(dataContract.list)
listTenantData() {
  return implement(dataContract.list)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      // Get user's tenant ID
      const tenantId = context.auth.user!.tenantId;
      
      if (!tenantId) {
        throw new ForbiddenException('User is not associated with a tenant');
      }
      
      // Ensure data is filtered by tenant
      const data = await this.dataService.listForTenant(
        tenantId,
        input.filters
      );
      
      return { data };
    });
}
```

---

## Advanced Patterns

### Example 19: Audit Logging with Auth Context

```typescript
@Implement(criticalContract.performAction)
performCriticalAction() {
  return implement(criticalContract.performAction)
    .use(accessControl({
      roles: ['admin'],
      permissions: { critical: ['execute'] }
    }))
    .handler(async ({ input, context }) => {
      const userId = context.auth.user!.id;
      const roles = context.auth.getRoles();
      
      // Log the action with full auth context
      await this.auditService.log({
        action: 'critical_action_performed',
        userId,
        userRoles: roles,
        timestamp: new Date(),
        input: input,
        ipAddress: context.request.headers['x-forwarded-for'],
      });
      
      // Perform the action
      const result = await this.criticalService.performAction(input);
      
      // Log completion
      await this.auditService.log({
        action: 'critical_action_completed',
        userId,
        result,
        timestamp: new Date(),
      });
      
      return result;
    });
}
```

### Example 20: Rate Limiting Per User

```typescript
@Implement(apiContract.expensiveOperation)
expensiveOperation() {
  return implement(apiContract.expensiveOperation)
    .use(requireAuth())
    .handler(async ({ input, context }) => {
      const userId = context.auth.user!.id;
      
      // Check rate limit
      const isAllowed = await this.rateLimitService.checkLimit(
        `expensive-op:${userId}`,
        10, // max 10 requests
        3600 // per hour
      );
      
      if (!isAllowed) {
        throw new TooManyRequestsException(
          'Rate limit exceeded. Try again later.'
        );
      }
      
      // Perform operation
      const result = await this.expensiveService.process(input);
      
      return result;
    });
}
```

### Example 21: Chained Authorization

```typescript
@Implement(projectContract.archive)
archiveProject() {
  return implement(projectContract.archive)
    .use(requireAuth())
    .use(accessControl({ roles: ['manager', 'admin'] }))
    .handler(async ({ input, context }) => {
      // First check: user must be manager or admin (handled by middleware)
      
      // Second check: verify project ownership or admin
      const project = await this.projectService.getById(input.projectId);
      const isOwner = project.ownerId === context.auth.user!.id;
      const isAdmin = context.auth.hasRole('admin');
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'Only project owner or admin can archive projects'
        );
      }
      
      // Third check: ensure project has no active tasks
      const hasActiveTasks = await this.projectService.hasActiveTasks(
        input.projectId
      );
      
      if (hasActiveTasks) {
        // Only admins can force archive with active tasks
        if (!isAdmin) {
          throw new BadRequestException(
            'Cannot archive project with active tasks'
          );
        }
      }
      
      await this.projectService.archive(input.projectId);
      
      return { success: true };
    });
}
```

---

## Testing Examples

### Example 22: Mocking Auth Context

```typescript
describe('ProjectController', () => {
  let controller: ProjectController;
  let service: ProjectService;
  
  beforeEach(() => {
    // Setup
  });
  
  describe('createProject', () => {
    it('should allow admin to create project', async () => {
      const mockAuth = {
        isLoggedIn: true,
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          role: 'admin',
        },
        session: { /* ... */ },
        requireAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
        requireRole: jest.fn(() => ({ user: { id: 'user-1' } })),
        hasRole: jest.fn((role) => role === 'admin'),
        getRoles: jest.fn(() => ['admin']),
        access: jest.fn(() => Promise.resolve(true)),
      };
      
      const context = {
        request: {} as Request,
        auth: mockAuth as any,
      };
      
      const result = await controller.createProject().handler({
        input: { name: 'Test Project' },
        context,
      } as any);
      
      expect(result).toBeDefined();
      expect(mockAuth.requireRole).toHaveBeenCalledWith('admin');
    });
    
    it('should deny non-admin users', async () => {
      const mockAuth = {
        isLoggedIn: true,
        user: { id: 'user-2', role: 'user' },
        requireRole: jest.fn(() => {
          throw new ForbiddenException('Access denied');
        }),
      };
      
      const context = {
        request: {} as Request,
        auth: mockAuth as any,
      };
      
      await expect(
        controller.createProject().handler({
          input: { name: 'Test Project' },
          context,
        } as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
```

---

## Summary

These examples demonstrate the flexibility and power of the ORPC auth context layer:

- **Simple authentication** with `requireAuth()`
- **Role-based access** with `accessControl({ roles: [...] })`
- **Permission-based access** with `accessControl({ permissions: {...} })`
- **Dynamic authorization** with programmatic checks in handlers
- **Resource ownership** verification
- **Multi-tenant** access control
- **Audit logging** and rate limiting

Choose the pattern that best fits your use case and combine them as needed for complex authorization scenarios.
