# Better Auth Admin Access Control System

This implementation provides a comprehensive role and permission-based access control system for the NestJS API using the Better Auth admin plugin.

## Overview

The system consists of:

1. **Permission Configuration** (`config/auth/permissions.ts`) - Defines roles, permissions, and access control rules
2. **Role Guard** (`core/modules/auth/guards/role.guard.ts`) - NestJS guard for enforcing access control
3. **Permission Decorators** (`core/modules/auth/decorators/decorators.ts`) - Type-safe decorators for route protection
4. **Auth Configuration** (`config/auth/auth.ts`) - Better Auth setup with admin plugin

## Features

### ✅ **Type-Safe Permissions**
- Full TypeScript support with IntelliSense
- Compile-time validation of permission structures
- Auto-completion for roles and resource actions

### ✅ **Flexible Role System**
- Hierarchical roles: `superAdmin` > `admin` > `manager` > `editor` > `viewer` > `user`
- Multiple roles per user (comma-separated string storage)
- Easy role checking utilities

### ✅ **Fine-Grained Permissions**
- Resource-based permissions (project, user, organization, etc.)
- Action-based permissions (create, read, update, delete, etc.)
- Custom permission combinations

### ✅ **Multiple Access Control Patterns**
- Role-based access (ANY role from list)
- Strict role requirements (ALL roles required)
- Permission-based access (specific resource permissions)
- Combined role + permission requirements
- Common permission patterns

### ✅ **Comprehensive Testing**
- Unit tests for guards and decorators
- Mock-friendly architecture
- Edge case coverage

## Quick Start

### 1. Basic Role Protection

```typescript
@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
  
  @Get('/dashboard')
  @RequireRole('admin', 'manager')
  getDashboard() {
    // Only admins and managers can access
    return { message: 'Admin dashboard' };
  }
}
```

### 2. Permission-Based Protection

```typescript
@Post('/projects')
@RequirePermissions({
  project: ['create'],
  organization: ['read']
})
createProject() {
  // Requires project:create AND organization:read permissions
  return { message: 'Project created' };
}
```

### 3. Combined Requirements

```typescript
@Delete('/system/reset')
@RequireRoleAndPermissions('admin', {
  system: ['maintenance', 'backup']
})
resetSystem() {
  // Requires admin role AND system permissions
  return { message: 'System reset' };
}
```

### 4. Parameter Injection

```typescript
@Get('/profile')
getUserProfile(
  @UserRoles() roles: RoleName[],
  @AuthenticatedUser() user: AuthenticatedUserType,
  @Session() session: UserSession
) {
  return {
    userId: user.id,
    userRoles: roles,
    sessionId: session.session.id
  };
}
```

## Available Roles

| Role | Level | Description |
|------|-------|-------------|
| `superAdmin` | 5 | Full system access including maintenance |
| `admin` | 4 | Full admin access, limited system operations |
| `manager` | 3 | Project and organization management |
| `editor` | 2 | Content creation and editing |
| `viewer` | 1 | Read-only access |
| `user` | 0 | Basic user permissions |

## Available Permissions

### Resources and Actions

| Resource | Actions | Description |
|----------|---------|-------------|
| `user` | `create`, `list`, `set-role`, `ban`, `impersonate`, `delete`, `set-password` | User management |
| `session` | `list`, `revoke`, `delete` | Session management |
| `project` | `create`, `read`, `update`, `delete`, `share` | Project operations |
| `organization` | `create`, `read`, `update`, `delete`, `manage-members` | Organization management |
| `billing` | `read`, `update`, `manage-subscriptions` | Billing operations |
| `analytics` | `read`, `export` | Analytics access |
| `system` | `maintenance`, `backup`, `restore`, `monitor` | System administration |

### Common Permission Patterns

```typescript
import { commonPermissions } from '@/config/auth/permissions';

// Pre-defined permission sets
@RequireCommonPermission('projectFullAccess')     // Full project CRUD
@RequireCommonPermission('userManagement')        // User admin permissions
@RequireCommonPermission('organizationAdmin')     // Organization management
@RequireCommonPermission('billingAccess')         // Billing operations
@RequireCommonPermission('systemAdmin')           // System administration
```

## Decorators Reference

### Role-Based Decorators

#### `@RequireRole(...roles)`
User must have ANY of the specified roles.

```typescript
@RequireRole('admin', 'manager')
// User needs admin OR manager role
```

#### `@RequireAllRoles(...roles)`
User must have ALL of the specified roles.

```typescript
@RequireAllRoles('admin', 'superAdmin')
// User needs admin AND superAdmin roles
```

### Permission-Based Decorators

#### `@RequirePermissions(permissions)`
User must have specific resource permissions.

```typescript
@RequirePermissions({
  project: ['create', 'update'],
  user: ['list']
})
// User needs project:create, project:update, AND user:list
```

#### `@RequireCommonPermission(key)`
Use pre-defined permission patterns.

```typescript
@RequireCommonPermission('projectFullAccess')
// Uses predefined project permissions
```

#### `@RequireRoleAndPermissions(role, permissions)`
Combined role and permission requirements.

```typescript
@RequireRoleAndPermissions('manager', {
  project: ['delete']
})
// User must be manager AND have project:delete permission
```

### Parameter Decorators

#### `@UserRoles()`
Extracts user roles as array.

```typescript
getUserData(@UserRoles() roles: RoleName[]) {
  // roles = ['admin', 'manager']
}
```

#### `@AuthenticatedUser()`
Extracts user with role information.

```typescript
getUserData(@AuthenticatedUser() user: AuthenticatedUserType) {
  // user = { id, email, name, role: 'admin,manager', roles: ['admin', 'manager'] }
}
```

## Role Assignment

### Via Better Auth Admin API

```typescript
// Set single role
await authClient.admin.setRole({
  userId: 'user-id',
  role: 'admin'
});

// Set multiple roles
await authClient.admin.setRole({
  userId: 'user-id', 
  role: ['admin', 'manager']
});
```

### Multiple Roles Storage
Roles are stored as comma-separated strings in the database:
- `"admin"` - Single role
- `"admin,manager"` - Multiple roles
- `"admin,manager,editor"` - Multiple roles

## Permission Checking

### Server-Side (in controllers/services)

```typescript
import { RoleGuard } from '@/core/modules/auth/guards/role.guard';

// Check if user has role
const isAdmin = RoleGuard.hasRole(user.role, 'admin');

// Get user roles array
const roles = RoleGuard.getUserRoles(user.role);

// Check permissions via Better Auth API
const hasPermission = await this.auth.api.userHasPermission({
  body: {
    userId: user.id,
    permissions: { project: ['create'] }
  }
});
```

### Client-Side (via Better Auth client)

```typescript
// Check permissions
const { data: hasPermission } = await authClient.admin.hasPermission({
  permissions: { project: ['create'] }
});

// Check role permissions
const canCreate = authClient.admin.checkRolePermission({
  role: 'manager',
  permissions: { project: ['create'] }
});
```

## Error Responses

The system returns structured API errors:

### Authentication Required (401)
```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### Missing Role (403)
```json
{
  "code": "FORBIDDEN", 
  "message": "Access denied. Required roles: admin, manager. User roles: user"
}
```

### Missing Permissions (403)
```json
{
  "code": "FORBIDDEN",
  "message": "Access denied. Missing required permissions: {\"project\":[\"create\"]}"
}
```

## Testing

### Unit Tests
All guards and decorators have comprehensive unit tests:

```bash
# Run specific tests
bun run test role.guard.spec.ts
bun run test decorators.spec.ts

# Run all auth tests
bun run test --filter="auth"
```

### Integration Testing
Example test patterns:

```typescript
describe('Protected Endpoint', () => {
  it('should allow admin access', async () => {
    const session = createMockSession({ role: 'admin' });
    const response = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', session.token)
      .expect(200);
  });

  it('should deny user access', async () => {
    const session = createMockSession({ role: 'user' });
    await request(app)
      .get('/admin/dashboard')
      .set('Authorization', session.token)
      .expect(403);
  });
});
```

## Migration Guide

### From Basic Role Checking

**Before:**
```typescript
@Get('/admin')
@Roles('admin')
getAdminData() { ... }
```

**After:**
```typescript
@Get('/admin')
@RequireRole('admin')
getAdminData() { ... }
```

### Adding Permission Checking

**Before:**
```typescript
@Post('/projects')
@Roles('admin', 'manager')
createProject() { ... }
```

**After:**
```typescript
@Post('/projects')
@RequirePermissions({ project: ['create'] })
createProject() { ... }
```

## Best Practices

### 1. **Guard Order**
Always apply guards in the correct order:
```typescript
@UseGuards(AuthGuard, RoleGuard)
```

### 2. **Least Privilege**
Grant minimum required permissions:
```typescript
// ✅ Good - specific permissions
@RequirePermissions({ project: ['read'] })

// ❌ Avoid - overly broad
@RequireRole('admin')
```

### 3. **Common Patterns**
Use predefined permission patterns when possible:
```typescript
// ✅ Good - reusable pattern
@RequireCommonPermission('projectFullAccess')

// ❌ Verbose - duplicate definition
@RequirePermissions({ project: ['create', 'read', 'update', 'delete', 'share'] })
```

### 4. **Error Handling**
Provide helpful error messages:
```typescript
try {
  await protectedOperation();
} catch (error) {
  if (error.status === 403) {
    throw new APIError(403, {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You need project management permissions to perform this action'
    });
  }
  throw error;
}
```

### 5. **Type Safety**
Leverage TypeScript features:
```typescript
// ✅ Type-safe permission definition
const permissions: Permission = {
  project: ['create', 'update'] // Auto-completed and validated
};

// ✅ Type-safe role checking
const roles: RoleName[] = PermissionChecker.getUserRoles(user.role);
```

## Troubleshooting

### Common Issues

#### 1. **Permission Check Fails**
- Verify user has correct role assigned
- Check permission spelling and case sensitivity
- Ensure Better Auth admin plugin is configured correctly

#### 2. **Type Errors**
- Use exact permission action names from the schema
- Import types from `@/config/auth/permissions`
- Use proper type annotations for permission objects

#### 3. **Guard Not Working**
- Ensure guards are applied in correct order: `AuthGuard`, then `RoleGuard`
- Verify user session contains role information
- Check that decorators are applied to the right methods

#### 4. **Role Assignment Issues**
- Use Better Auth admin API for role management
- Remember roles are stored as comma-separated strings
- Verify database schema includes role field

### Debug Commands

```bash
# Check user role in database
SELECT id, email, role FROM user WHERE id = 'user-id';

# Test permission endpoint
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/admin/has-permission \
     -d '{"permissions": {"project": ["create"]}}'

# View compiled permissions
console.log(JSON.stringify(commonPermissions, null, 2));
```

## Advanced Usage

### Custom Permission Validation

```typescript
import { PermissionChecker, createPermission } from '@/config/auth/permissions';

// Create custom permission set
const customPermission = createPermission({
  project: ['create', 'share'],
  analytics: ['export']
});

// Validate permission structure
const isValid = PermissionChecker.validatePermission(customPermission);
```

### Dynamic Role Checking

```typescript
export class ProjectService {
  async getProject(projectId: string, user: any) {
    const userRoles = RoleGuard.getUserRoles(user.role);
    
    if (userRoles.includes('admin')) {
      return this.getFullProjectData(projectId);
    } else if (userRoles.includes('manager')) {
      return this.getManagerProjectData(projectId);
    } else {
      return this.getBasicProjectData(projectId);
    }
  }
}
```

### Permission-Based UI

```typescript
// In your frontend components
const { data: permissions } = await authClient.admin.hasPermission({
  permissions: { 
    project: ['create'],
    user: ['list'] 
  }
});

return (
  <div>
    {permissions && <CreateProjectButton />}
    {userRoles.includes('admin') && <AdminPanel />}
  </div>
);
```

This completes the comprehensive Better Auth admin access control system implementation! 🎉