# Permission Builder Examples

This document demonstrates practical usage of the modular permission builder API.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Type Safety Features](#type-safety-features)
- [Advanced Patterns](#advanced-patterns)
- [Real-World Examples](#real-world-examples)
- [Migration Guide](#migration-guide)

## Type Safety Features

### Action Parameter Constraints

The builder enforces type-safe action parameters. Invalid actions are caught at compile time:

```typescript
import { PermissionBuilder } from './builder';
import { defaultStatements } from 'better-auth/plugins/admin';

// Define your statements
const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resource('project')
    .actions(['create', 'read', 'update', 'delete']);

// ✅ Valid - using defined actions
builder.resource('project')
  .actions(['create', 'read'] as const);

// ❌ Type Error - 'publish' action doesn't exist
builder.resource('project')
  .actions(['create', 'publish'] as const);
// TypeScript error: Type '"publish"' is not assignable to valid actions
```

### Compile-Time Action Validation

When using the collection API, all action parameters are validated:

```typescript
const { statement, ac } = PermissionBuilder.withDefaults(defaultStatements)
  .resources({
    project: ['create', 'read', 'update', 'delete'],
    organization: ['read', 'manage-members'],
  })
  .build();

// ✅ Valid - 'read' exists in the statements
const readOnly = statementsConfig.getAll().pick(['read'] as const);

// ❌ Type Error - 'publish' doesn't exist in any resource
const invalid = statementsConfig.getAll().pick(['publish'] as const);
// TypeScript error: Type '"publish"' is not assignable to type AllActions<TStatement>

// ✅ Valid - filtering by existing action
const withCreate = statementsConfig.getAll().withAction('create');
// Returns: { project: ['create', 'read', 'update', 'delete'] }
// Note: organization excluded (doesn't have 'create')

// ❌ Type Error - 'fake' action doesn't exist
const invalid2 = statementsConfig.getAll().withAction('fake');
// TypeScript error: Argument of type '"fake"' is not assignable to AllActions<TStatement>
```

### Precise Return Types

Collection methods return precisely typed results based on the filtering operation:

```typescript
// TypeScript knows exactly what's in the result
const readAccess = statementsConfig.getAll().readOnly();
// Type: { project: ['read'], organization: ['read'] }

// Safe access to known resources
readAccess.project // ✅ ['read']
readAccess.organization // ✅ ['read']

// Resources without 'read' are excluded from the type
// readAccess.user // Would be type error if user doesn't have 'read'
```

**Key Benefits:**
- **Typo prevention**: Invalid action names cause compile errors
- **IntelliSense**: IDE auto-completes only valid actions
- **Refactoring safety**: Removing an action causes errors where used
- **Documentation**: Types serve as documentation

## Basic Usage

### Simple Role with Full Permissions

```typescript
import { PermissionBuilder } from './builder';
import { defaultStatements } from 'better-auth/plugins/admin';

const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resource('project')
    .actions(['create', 'read', 'update', 'delete'])
  .role('admin')
    .allPermissions()
  .build();

const { statement, ac, roles } = builder;
```

### Role with Specific Permissions

```typescript
const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resource('project')
    .actions(['create', 'read', 'update', 'delete', 'share'])
  .resource('organization')
    .actions(['create', 'read', 'manage-members'])
  .role('user')
    .permissions({
      project: ['read'],
      organization: ['read'],
    })
  .build();
```

### Multiple Resources at Once

```typescript
const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resources({
    project: ['create', 'read', 'update', 'delete', 'share'],
    organization: ['create', 'read', 'manage-members', 'delete'],
    billing: ['read', 'manage'],
  })
  .role('admin')
    .allPermissions()
  .build();
```

### Multiple Roles at Once

```typescript
const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resource('project')
    .actions(['create', 'read', 'update', 'delete'])
  .roles((ac) => ({
    admin: ac.newRole({
      project: ['*'], // All permissions
    }),
    editor: ac.newRole({
      project: ['create', 'read', 'update'],
    }),
    viewer: ac.newRole({
      project: ['read'],
    }),
  }))
  .build();
```

## Advanced Patterns

### Hierarchical Roles

```typescript
const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resources({
    project: ['create', 'read', 'update', 'delete', 'share'],
    organization: ['create', 'read', 'manage-members', 'delete'],
    billing: ['read', 'manage'],
    analytics: ['view', 'export'],
    system: ['configure', 'logs'],
  })
  .roles((ac) => ({
    // Super admin - all permissions
    superAdmin: ac.newRole({
      project: ['*'],
      organization: ['*'],
      billing: ['*'],
      analytics: ['*'],
      system: ['*'],
    }),
    
    // Admin - most permissions except system
    admin: ac.newRole({
      project: ['*'],
      organization: ['*'],
      billing: ['read', 'manage'],
      analytics: ['view', 'export'],
    }),
    
    // Manager - organization and project management
    manager: ac.newRole({
      project: ['create', 'read', 'update', 'delete'],
      organization: ['read', 'manage-members'],
      analytics: ['view'],
    }),
    
    // Editor - content management
    editor: ac.newRole({
      project: ['create', 'read', 'update'],
    }),
    
    // Viewer - read-only access
    viewer: ac.newRole({
      project: ['read'],
      organization: ['read'],
    }),
  }))
  .build();
```

### Conditional Permissions

```typescript
const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resources({
    project: ['create', 'read', 'update', 'delete', 'share'],
    organization: ['create', 'read', 'manage-members'],
  })
  .role('projectManager')
    .permissions({
      project: ['create', 'read', 'update', 'delete', 'share'],
      organization: ['read'], // Can only read, not manage
    })
  .role('organizationManager')
    .permissions({
      project: ['read'], // Can only read projects
      organization: ['create', 'read', 'manage-members'], // Full org permissions
    })
  .build();
```

### Feature-Based Permissions

```typescript
const builder = PermissionBuilder.withDefaults(defaultStatements)
  .resources({
    // User management
    user: ['create', 'read', 'update', 'delete', 'impersonate'],
    
    // Content management
    project: ['create', 'read', 'update', 'delete', 'publish', 'archive'],
    
    // Collaboration
    comment: ['create', 'read', 'update', 'delete', 'moderate'],
    
    // Organization
    organization: ['create', 'read', 'update', 'delete', 'manage-members', 'manage-roles'],
    
    // Billing & subscription
    billing: ['read', 'manage', 'view-invoices', 'download-invoices'],
    
    // Analytics & reporting
    analytics: ['view', 'export', 'create-reports'],
    
    // System administration
    system: ['configure', 'logs', 'backup', 'restore'],
  })
  .roles((ac) => ({
    // Feature: Full platform access
    superAdmin: ac.newRole({
      user: ['*'],
      project: ['*'],
      comment: ['*'],
      organization: ['*'],
      billing: ['*'],
      analytics: ['*'],
      system: ['*'],
    }),
    
    // Feature: User & content management
    contentAdmin: ac.newRole({
      user: ['create', 'read', 'update'],
      project: ['*'],
      comment: ['moderate', 'delete'],
    }),
    
    // Feature: Organization management
    organizationAdmin: ac.newRole({
      organization: ['*'],
      user: ['read'],
      project: ['read'],
    }),
    
    // Feature: Billing management
    billingManager: ac.newRole({
      billing: ['*'],
      organization: ['read'],
    }),
    
    // Feature: Analytics access
    analyst: ac.newRole({
      analytics: ['*'],
      project: ['read'],
      user: ['read'],
    }),
  }))
  .build();
```

## Real-World Examples

### SaaS Platform Permissions

```typescript
import { PermissionBuilder } from './builder';
import { defaultStatements } from 'better-auth/plugins/admin';

export const createSaaSPermissions = () => {
  return PermissionBuilder.withDefaults(defaultStatements)
    // Define all resources
    .resources({
      // Core resources
      workspace: ['create', 'read', 'update', 'delete', 'transfer'],
      project: ['create', 'read', 'update', 'delete', 'share', 'publish'],
      document: ['create', 'read', 'update', 'delete', 'share', 'version'],
      
      // Team management
      team: ['create', 'read', 'update', 'delete', 'manage-members', 'manage-roles'],
      invitation: ['create', 'read', 'revoke', 'resend'],
      
      // Billing
      subscription: ['read', 'update', 'cancel'],
      invoice: ['read', 'download'],
      payment: ['read', 'manage'],
      
      // Integration
      integration: ['create', 'read', 'update', 'delete', 'configure'],
      webhook: ['create', 'read', 'update', 'delete', 'test'],
      apiKey: ['create', 'read', 'revoke'],
      
      // Analytics
      analytics: ['view-dashboard', 'view-reports', 'export-data'],
      
      // System
      audit: ['read', 'export'],
      system: ['configure', 'backup', 'restore'],
    })
    // Define roles
    .roles((ac) => ({
      // Owner - Full control
      owner: ac.newRole({
        workspace: ['*'],
        project: ['*'],
        document: ['*'],
        team: ['*'],
        invitation: ['*'],
        subscription: ['*'],
        invoice: ['*'],
        payment: ['*'],
        integration: ['*'],
        webhook: ['*'],
        apiKey: ['*'],
        analytics: ['*'],
        audit: ['*'],
      }),
      
      // Admin - Full operational control
      admin: ac.newRole({
        workspace: ['read', 'update'],
        project: ['*'],
        document: ['*'],
        team: ['read', 'manage-members', 'manage-roles'],
        invitation: ['*'],
        subscription: ['read'],
        invoice: ['read', 'download'],
        integration: ['*'],
        webhook: ['*'],
        apiKey: ['*'],
        analytics: ['*'],
        audit: ['read'],
      }),
      
      // Project Manager - Project-level control
      projectManager: ac.newRole({
        workspace: ['read'],
        project: ['create', 'read', 'update', 'delete', 'share', 'publish'],
        document: ['*'],
        team: ['read'],
        analytics: ['view-dashboard', 'view-reports'],
      }),
      
      // Editor - Content creation and editing
      editor: ac.newRole({
        workspace: ['read'],
        project: ['read', 'update'],
        document: ['create', 'read', 'update', 'delete', 'share'],
        team: ['read'],
      }),
      
      // Viewer - Read-only access
      viewer: ac.newRole({
        workspace: ['read'],
        project: ['read'],
        document: ['read'],
        team: ['read'],
      }),
      
      // Billing Manager - Billing operations
      billingManager: ac.newRole({
        workspace: ['read'],
        subscription: ['*'],
        invoice: ['*'],
        payment: ['*'],
      }),
      
      // Developer - API and integration access
      developer: ac.newRole({
        workspace: ['read'],
        project: ['read'],
        integration: ['*'],
        webhook: ['*'],
        apiKey: ['*'],
      }),
    }))
    .build();
};

// Usage
const { statement, ac, roles } = createSaaSPermissions();

export { statement, ac, roles };
```

### Multi-Tenant Application

```typescript
export const createMultiTenantPermissions = () => {
  return PermissionBuilder.withDefaults(defaultStatements)
    .resources({
      // Tenant management
      tenant: ['create', 'read', 'update', 'delete', 'configure'],
      tenantUser: ['create', 'read', 'update', 'delete', 'invite'],
      
      // Per-tenant resources
      data: ['create', 'read', 'update', 'delete', 'export', 'import'],
      report: ['create', 'read', 'update', 'delete', 'schedule'],
      
      // Global resources
      globalSettings: ['read', 'update'],
      systemLogs: ['read'],
    })
    .roles((ac) => ({
      // Platform admin - Cross-tenant access
      platformAdmin: ac.newRole({
        tenant: ['*'],
        tenantUser: ['*'],
        data: ['*'],
        report: ['*'],
        globalSettings: ['*'],
        systemLogs: ['*'],
      }),
      
      // Tenant owner - Full control within tenant
      tenantOwner: ac.newRole({
        tenant: ['read', 'update', 'configure'],
        tenantUser: ['*'],
        data: ['*'],
        report: ['*'],
      }),
      
      // Tenant admin - Operational control
      tenantAdmin: ac.newRole({
        tenant: ['read'],
        tenantUser: ['create', 'read', 'update', 'invite'],
        data: ['*'],
        report: ['*'],
      }),
      
      // Tenant user - Standard access
      tenantUser: ac.newRole({
        tenant: ['read'],
        tenantUser: ['read'],
        data: ['create', 'read', 'update'],
        report: ['create', 'read'],
      }),
    }))
    .build();
};
```

### E-Commerce Platform

```typescript
export const createEcommercePermissions = () => {
  return PermissionBuilder.withDefaults(defaultStatements)
    .resources({
      // Product management
      product: ['create', 'read', 'update', 'delete', 'publish', 'unpublish'],
      category: ['create', 'read', 'update', 'delete', 'reorder'],
      inventory: ['read', 'update', 'adjust'],
      
      // Order management
      order: ['create', 'read', 'update', 'cancel', 'refund', 'fulfill'],
      shipment: ['create', 'read', 'update', 'track'],
      
      // Customer management
      customer: ['create', 'read', 'update', 'delete', 'merge'],
      review: ['read', 'moderate', 'respond', 'delete'],
      
      // Marketing
      promotion: ['create', 'read', 'update', 'delete', 'activate'],
      coupon: ['create', 'read', 'update', 'delete'],
      
      // Financial
      payment: ['read', 'process', 'refund'],
      invoice: ['create', 'read', 'download'],
      
      // Store settings
      storefront: ['read', 'update', 'publish'],
      settings: ['read', 'update'],
    })
    .roles((ac) => ({
      // Store Owner
      storeOwner: ac.newRole({
        product: ['*'],
        category: ['*'],
        inventory: ['*'],
        order: ['*'],
        shipment: ['*'],
        customer: ['*'],
        review: ['*'],
        promotion: ['*'],
        coupon: ['*'],
        payment: ['*'],
        invoice: ['*'],
        storefront: ['*'],
        settings: ['*'],
      }),
      
      // Store Manager
      storeManager: ac.newRole({
        product: ['*'],
        category: ['*'],
        inventory: ['*'],
        order: ['*'],
        shipment: ['*'],
        customer: ['read', 'update'],
        review: ['*'],
        promotion: ['*'],
        coupon: ['*'],
        payment: ['read', 'process'],
        invoice: ['read', 'download'],
        storefront: ['read', 'update'],
      }),
      
      // Product Manager
      productManager: ac.newRole({
        product: ['*'],
        category: ['*'],
        inventory: ['read', 'update'],
        order: ['read'],
        customer: ['read'],
      }),
      
      // Order Fulfillment
      fulfillment: ac.newRole({
        order: ['read', 'update', 'fulfill'],
        shipment: ['*'],
        inventory: ['read', 'adjust'],
      }),
      
      // Customer Service
      customerService: ac.newRole({
        order: ['read', 'update', 'cancel', 'refund'],
        customer: ['read', 'update'],
        review: ['read', 'moderate', 'respond'],
        payment: ['read'],
        invoice: ['read', 'download'],
      }),
      
      // Marketing Manager
      marketing: ac.newRole({
        promotion: ['*'],
        coupon: ['*'],
        customer: ['read'],
        review: ['read'],
      }),
    }))
    .build();
};
```

## Migration Guide

### From Statement-Based to Builder

**Before (Statement-Based):**
```typescript
import { createAccessControl, defaultStatements } from 'better-auth/plugins/admin';

const statement = {
  ...defaultStatements,
  project: ['create', 'read', 'update', 'delete'],
  organization: ['create', 'read', 'manage-members'],
};

const ac = createAccessControl(statement);

export const roles = {
  admin: ac.newRole({
    project: ['*'],
    organization: ['*'],
  }),
  user: ac.newRole({
    project: ['read'],
    organization: ['read'],
  }),
};
```

**After (Builder API):**
```typescript
import { PermissionBuilder } from './builder';
import { defaultStatements } from 'better-auth/plugins/admin';

const { statement, ac, roles } = PermissionBuilder.withDefaults(defaultStatements)
  .resources({
    project: ['create', 'read', 'update', 'delete'],
    organization: ['create', 'read', 'manage-members'],
  })
  .roles((ac) => ({
    admin: ac.newRole({
      project: ['*'],
      organization: ['*'],
    }),
    user: ac.newRole({
      project: ['read'],
      organization: ['read'],
    }),
  }))
  .build();

export { statement, ac, roles };
```

### Benefits of Migration

1. **Type Safety**: Full autocomplete and type checking
2. **Fluent API**: More intuitive method chaining
3. **Validation**: Compile-time checks prevent errors
4. **Flexibility**: Mix single and batch operations
5. **Maintainability**: Clearer intent and structure

### Migration Steps

1. Import the builder:
   ```typescript
   import { PermissionBuilder } from './builder';
   ```

2. Replace statement creation with builder:
   ```typescript
   const builder = PermissionBuilder.withDefaults(defaultStatements);
   ```

3. Add resources using `.resource()` or `.resources()`:
   ```typescript
   .resources({
     project: ['create', 'read', 'update', 'delete'],
     // ... other resources
   })
   ```

4. Add roles using `.role()` or `.roles()`:
   ```typescript
   .roles((ac) => ({
     admin: ac.newRole({ /* permissions */ }),
     user: ac.newRole({ /* permissions */ }),
   }))
   ```

5. Call `.build()` to get statement, ac, and roles:
   ```typescript
   const { statement, ac, roles } = builder.build();
   ```

6. Export as before:
   ```typescript
   export { statement, ac, roles };
   ```

## Tips and Best Practices

1. **Start with defaults**: Always use `.withDefaults()` to include Better Auth's built-in resources
2. **Group related resources**: Use `.resources()` for multiple related resources
3. **Use descriptive role names**: Clear names make permissions easier to understand
4. **Document complex permissions**: Add comments for non-obvious permission decisions
5. **Keep roles focused**: Each role should have a clear purpose
6. **Test permissions**: Verify that roles have the expected permissions
7. **Use TypeScript**: Take full advantage of autocomplete and type checking
8. **Always use `as const`**: Preserve exact types for action arrays
   ```typescript
   // ❌ Bad - loses type information
   .pick(['read', 'create'])
   
   // ✅ Good - preserves exact types
   .pick(['read', 'create'] as const)
   ```
9. **Leverage compile-time validation**: Let TypeScript catch errors early
   ```typescript
   // TypeScript will error if action doesn't exist
   statementsConfig.getAll().withAction('invalid-action')
   ```
10. **Use IntelliSense**: Take advantage of IDE auto-completion for valid actions
    ```typescript
    // Type '.' to see all valid actions
    statementsConfig.getAll().withAction('...')
    ```
