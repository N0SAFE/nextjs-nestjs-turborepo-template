# Getting Started with Better Auth Permissions

This guide will help you understand and use the Better Auth permission system in this project.

## Folder Structure

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
    ├── GETTING-STARTED.md     # This file
    ├── BUILDER-EXAMPLES.md    # Builder pattern examples
    ├── COLLECTION-API-EXAMPLES.md  # Collection API examples
    └── REFACTORING-REPORT.md  # Refactoring documentation
```

## Quick Start

### 1. Import What You Need

```typescript
// Import from main entry point
import {
  // Built configuration
  statement,        // Statement definitions
  ac,              // Access control instance
  roles,           // Role definitions
  
  // Common permissions
  commonPermissions,
  
  // System classes (if building custom permissions)
  PermissionBuilder,
  StatementsConfig,
  StatementConfigCollection,
  RolesConfig,
  RoleConfigCollection,
} from '@/config/auth/permissions';

// Or import directly from system
import { 
  PermissionBuilder,
  RoleConfigCollection 
} from '@/config/auth/permissions/system';
```

### 2. Use Pre-Built Configuration

The system comes with a pre-built configuration exported from `index.ts`:

```typescript
import { statement, ac, roles } from '@/config/auth/permissions';

// Use in Better Auth configuration
betterAuth({
  plugins: [
    admin({
      ac: {
        statement,
        ac,
        roles,
      },
    }),
  ],
});
```

### 3. Use Common Permissions

Pre-defined permission patterns are available:

```typescript
import { commonPermissions } from '@/config/auth/permissions';

// Use in decorators
@RequireCommonPermission('projectFullAccess')
createProject() { ... }

// Or access directly
const permissions = commonPermissions.projectFullAccess;
// { project: ['create', 'read', 'update', 'delete', 'share'] }
```

## Core Concepts

### 1. Statements

Statements define what resources exist and what actions can be performed on them:

```typescript
const statement = {
  user: ['create', 'read', 'update', 'delete', 'ban'],
  project: ['create', 'read', 'update', 'delete', 'share'],
  organization: ['create', 'read', 'manage-members'],
};
```

### 2. Roles

Roles define what permissions a user has:

```typescript
const roles = {
  admin: ac.newRole({
    user: ['*'],        // All user actions
    project: ['*'],     // All project actions
    organization: ['*'], // All organization actions
  }),
  
  editor: ac.newRole({
    project: ['create', 'read', 'update'],
    organization: ['read'],
  }),
  
  viewer: ac.newRole({
    project: ['read'],
    organization: ['read'],
  }),
};
```

### 3. Access Control

The `ac` (access control) object is used to create roles and check permissions:

```typescript
// Create a role
const role = ac.newRole({
  project: ['create', 'read'],
});

// Check permissions (done by Better Auth)
const hasPermission = await auth.api.userHasPermission({
  userId: user.id,
  permissions: { project: ['create'] },
});
```

## Building Custom Permissions

### Using PermissionBuilder

The builder provides a fluent API for creating permissions:

```typescript
import { PermissionBuilder } from '@/config/auth/permissions/system';
import { defaultStatements } from 'better-auth/plugins/admin';

const { statement, ac, roles } = PermissionBuilder
  .withDefaults(defaultStatements)
  
  // Define resources and their actions
  .resources({
    project: ['create', 'read', 'update', 'delete', 'share'],
    organization: ['create', 'read', 'manage-members'],
  })
  
  // Define roles
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

export { statement, ac, roles };
```

**Key Points:**
- Always start with `.withDefaults()` to include Better Auth's built-in resources
- Use `.resources()` for batch resource definition
- Use `.roles()` to define all roles at once
- Call `.build()` to get the final configuration

### Type Safety Features

The system provides **compile-time type safety**:

```typescript
// ✅ Valid - 'read' exists in statements
statementsConfig.getAll().pick(['read'] as const);

// ❌ Type Error - 'invalid' doesn't exist
statementsConfig.getAll().pick(['invalid'] as const);
// TypeScript error: Type '"invalid"' is not assignable to type AllActions<TStatement>
```

**Benefits:**
- Catch typos at compile time
- IDE auto-completion for valid actions
- Refactoring safety
- Zero runtime overhead

## Using the Collection API

### Statement Collections

The statement collection API allows batch operations on multiple resources:

```typescript
import { statementsConfig } from '@/config/auth/permissions';

// Get all resources with only 'read' action
const readOnly = statementsConfig.getAll().readOnly();
// Returns: { user: ['read'], project: ['read'], ... }

// Get all resources with CRUD actions
const crud = statementsConfig.getAll().crudOnly();
// Returns: { user: ['create', 'read', 'update', 'delete'], ... }

// Get specific resources
const userProject = statementsConfig
  .getMany(['user', 'project'])
  .all();

// Filter by action
const withCreate = statementsConfig
  .getAll()
  .withAction('create');
// Returns only resources that have 'create' action
```

**Key Methods for Statements:**
- `.all()` - Get all actions for all resources
- `.readOnly()` - Only 'read' action
- `.writeOnly()` - Only write actions (create, update, delete)
- `.crudOnly()` - Only CRUD actions
- `.pick(actions)` - Include only specified actions
- `.omit(actions)` - Exclude specified actions
- `.withAction(action)` - Filter by single action
- `.withAllActions(actions)` - Filter by all actions
- `.withAnyAction(actions)` - Filter by any action

### Role Collections

The role collection API allows batch operations on multiple roles with type-safe filtering:

```typescript
import { rolesConfig } from '@/config/auth/permissions';

// Get all roles as a collection
const allRoles = rolesConfig.getAll();

// Filter roles with 'delete' permission
const deleteCapableRoles = allRoles.withAction('delete');
// Returns only roles that have 'delete' action on any resource

// Filter roles with access to specific resource
const projectRoles = allRoles.withResource('project');
// Returns only roles that have access to 'project' resource

// Filter roles that can create projects
const projectCreators = allRoles.withActionOnResource('project', 'create');
// Returns only roles that can create projects

// Get only read-only roles
const readOnlyRoles = allRoles.readOnly();
// Returns roles with only 'read' permissions

// Get only write roles
const writeRoles = allRoles.writeOnly();
// Returns roles with write permissions (create, update, delete)

// Get specific roles as collection
const adminManager = rolesConfig.getMany(['admin', 'manager'] as const, true);
const withDelete = adminManager.withAction('delete');
// Returns only admin/manager roles that have 'delete' permission
```

**Key Methods for Roles:**
- `.withResource(resource)` - Filter roles with specific resource access
- `.withAction(action)` - Filter roles with action on any resource
- `.withActionOnResource(resource, action)` - Filter roles with action on specific resource
- `.withAllActionsOnResource(resource, actions)` - Filter roles with all specified actions
- `.withAnyActionOnResource(resource, actions)` - Filter roles with any specified action
- `.withoutAction(action)` - Exclude roles with action
- `.withoutResource(resource)` - Exclude roles with resource access
- `.readOnly()` - Only roles with read permissions
- `.writeOnly()` - Only roles with write permissions

### Type Safety in Collections

Both statement and role collections provide compile-time type safety:

```typescript
// ✅ Valid - 'create' exists in statements
statementsConfig.getAll().withAction('create');

// ❌ Type Error - 'invalid' doesn't exist
statementsConfig.getAll().withAction('invalid');
// TypeScript error: Type '"invalid"' is not assignable to AllActions<TStatement>

// ✅ Valid - 'project' resource exists
rolesConfig.getAll().withResource('project');

// ❌ Type Error - 'invalid' resource doesn't exist
rolesConfig.getAll().withResource('invalid');
// TypeScript error: Type '"invalid"' is not assignable to AllRoleResources<TRoles>
```

## Using in Controllers

### Protect Routes with Decorators

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/core/modules/auth/guards/auth.guard';
import { RoleGuard } from '@/core/modules/auth/guards/role.guard';
import { RequireRole, RequirePermissions } from '@/core/modules/auth/decorators';

@Controller('projects')
@UseGuards(AuthGuard, RoleGuard)
export class ProjectsController {
  
  // Require specific role
  @Get()
  @RequireRole('admin', 'manager')
  findAll() {
    return { message: 'List of projects' };
  }
  
  // Require specific permissions
  @Post()
  @RequirePermissions({
    project: ['create'],
    organization: ['read'],
  })
  create() {
    return { message: 'Project created' };
  }
  
  // Use common permission pattern
  @Post('/admin')
  @RequireCommonPermission('projectFullAccess')
  adminCreate() {
    return { message: 'Admin project created' };
  }
}
```

### Get User Information

```typescript
import { UserRoles, AuthenticatedUser } from '@/core/modules/auth/decorators';

@Get('/me')
getUserInfo(
  @UserRoles() roles: RoleName[],
  @AuthenticatedUser() user: AuthenticatedUserType,
) {
  return {
    userId: user.id,
    userRoles: roles,
  };
}
```

## Common Patterns

### 1. Hierarchical Roles

Create roles with different permission levels:

```typescript
.roles((ac) => ({
  superAdmin: ac.newRole({
    user: ['*'],
    project: ['*'],
    organization: ['*'],
    system: ['*'],
  }),
  
  admin: ac.newRole({
    user: ['create', 'read', 'update'],
    project: ['*'],
    organization: ['*'],
  }),
  
  manager: ac.newRole({
    project: ['create', 'read', 'update', 'delete'],
    organization: ['read', 'manage-members'],
  }),
  
  editor: ac.newRole({
    project: ['create', 'read', 'update'],
  }),
  
  viewer: ac.newRole({
    project: ['read'],
    organization: ['read'],
  }),
}))
```

### 2. Feature-Based Roles

Create roles based on features:

```typescript
.roles((ac) => ({
  // Content management
  contentAdmin: ac.newRole({
    project: ['*'],
    document: ['*'],
  }),
  
  // User management
  userManager: ac.newRole({
    user: ['*'],
    session: ['list', 'revoke'],
  }),
  
  // Billing management
  billingManager: ac.newRole({
    billing: ['*'],
    invoice: ['*'],
    subscription: ['*'],
  }),
  
  // Analytics access
  analyst: ac.newRole({
    analytics: ['*'],
    report: ['*'],
  }),
}))
```

### 3. Conditional Permissions

Create permissions based on context:

```typescript
@Get('/projects/:id')
async getProject(
  @Param('id') id: string,
  @AuthenticatedUser() user: AuthenticatedUserType,
) {
  const userRoles = RoleGuard.getUserRoles(user.role);
  
  if (userRoles.includes('admin')) {
    return this.getFullProjectData(id);
  } else if (userRoles.includes('manager')) {
    return this.getManagerProjectData(id);
  } else {
    return this.getBasicProjectData(id);
  }
}
```

## Next Steps

- **Read the full documentation**: [README.md](./README.md)
- **See builder examples**: [BUILDER-EXAMPLES.md](./BUILDER-EXAMPLES.md)
- **Learn collection API**: [COLLECTION-API-EXAMPLES.md](./COLLECTION-API-EXAMPLES.md)
- **Understand type safety**: [TYPE_SAFETY.md](../system/TYPE_SAFETY.md)

## Troubleshooting

### Type Errors with Actions

**Problem:** TypeScript complains about action parameters.

**Solution:** Make sure to use `as const` for action arrays:

```typescript
// ❌ Bad
collection.pick(['read', 'create'])

// ✅ Good
collection.pick(['read', 'create'] as const)
```

### Permission Not Working

**Problem:** Permission decorator doesn't seem to work.

**Solution:** Make sure guards are applied in correct order:

```typescript
// ❌ Wrong order
@UseGuards(RoleGuard, AuthGuard)

// ✅ Correct order
@UseGuards(AuthGuard, RoleGuard)
```

### Role Not Found

**Problem:** User role not recognized.

**Solution:** Check that the role is defined in the `roles` object and assigned to the user via Better Auth API:

```typescript
// Set role
await authClient.admin.setRole({
  userId: user.id,
  role: 'admin',
});
```

## Support

For questions or issues:
1. Check the documentation files in `docs/`
2. Review the type safety guide in `system/TYPE_SAFETY.md`
3. Look at real-world examples in `BUILDER-EXAMPLES.md`
4. Review the collection API guide in `COLLECTION-API-EXAMPLES.md`
