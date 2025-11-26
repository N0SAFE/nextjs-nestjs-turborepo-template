# Collection API Examples

This document demonstrates the power of the collection API for batch operations with **full type safety** for both statements and roles.

## Table of Contents

- [Part 1: Statement Collections](#part-1-statement-collections)
- [Part 2: Role Collections](#part-2-role-collections)
- [Comparison: Statements vs Roles](#comparison-statements-vs-roles)

---

## Part 1: Statement Collections

## Type Safety Overview

The collection API now provides **compile-time action validation**:

```typescript
// ✅ Valid actions only
statementsConfig.getAll().pick(['read', 'create'] as const)

// ❌ Compile-time error for invalid actions
statementsConfig.getAll().pick(['read', 'invalid-action'] as const)
// TypeScript error: Type '"invalid-action"' is not assignable to type AllActions<TStatement>

// ✅ Valid single action
statementsConfig.getAll().withAction('create')

// ❌ Compile-time error for non-existent action
statementsConfig.getAll().withAction('fake-action')
// TypeScript error: Argument of type '"fake-action"' is not assignable to AllActions<TStatement>
```

**Benefits:**
- **Catch typos** at compile time, not runtime
- **IDE auto-completion** for valid actions only
- **Refactoring safety** - removing actions causes type errors
- **Zero runtime overhead** - all validation at compile time

## Architecture Overview

We now have a **three-level architecture**:

```typescript
// Level 1: Manage ALL resources
StatementsConfig<TStatement>
  ├── .get('user') → StatementConfig (Level 2A: single resource)
  ├── .getAll() → StatementConfigCollection (Level 2B: all resources) 
  └── .getMany(['user', 'project']) → StatementConfigCollection (Level 2B: selected resources)

// Level 2A: Single resource operations
StatementConfig<TActions>
  └── .all(), .pick(), .omit(), .has(), .readOnly(), etc.

// Level 2B: Multiple resource operations (NEW!)
StatementConfigCollection<TStatement>
  └── .all(), .pick(), .omit(), .readOnly(), .withAction(), etc.
      (Smart filtering - excludes resources without matching actions)
```

## Smart Filtering Behavior

The collection API automatically **excludes resources** that don't match the filter criteria:

```typescript
// Assume statements have:
// { user: ['create', 'read', 'update'], project: ['read', 'delete'], session: ['list'] }

statementsConfig.getAll().pick(['read'])
// Returns: { user: ['read'], project: ['read'] }
// Note: session excluded (no 'read' action)

statementsConfig.getAll().readOnly()
// Returns: { user: ['read'], project: ['read'] }
// Note: Only 'read' action included, session excluded

statementsConfig.getAll().crudOnly()
// Returns: { user: ['create', 'read', 'update'], project: ['read', 'delete'] }
// Note: Only CRUD actions included
```

## Before vs After Comparison

### Example 1: Super Admin Access

**Before (verbose):**
```typescript
superAdminAccess: permissionConfig.createPermission(({ statementsConfig }) => ({
  user: statementsConfig.get("user").all(),
  session: statementsConfig.get("session").all(),
  project: statementsConfig.get("project").all(),
  organization: statementsConfig.get("organization").all(),
  billing: statementsConfig.get("billing").all(),
  analytics: statementsConfig.get("analytics").all(),
  system: statementsConfig.get("system").all(),
}))
```

**After (concise):**
```typescript
superAdminAccess: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getAll().all()
)
```

### Example 2: Read-Only Access

**Before (manual listing):**
```typescript
readOnlyAccess: permissionConfig.createPermission(({ statementsConfig }) => ({
  user: statementsConfig.get("user").pick(["list", "get"]),
  session: ["list"] as const,
  project: ["read"] as const,
  organization: ["read"] as const,
  billing: ["read"] as const,
  analytics: ["read"] as const,
}))
```

**After (automatic filtering):**
```typescript
readOnlyAccess: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getAll().readOnly()
)
```

## Collection API Methods

### Type-Safe Action Parameters

All methods that accept action parameters are constrained to only accept valid actions:

```typescript
// Extract all possible actions from the collection
type AllActions<TStatement> = TStatement[keyof TStatement][number];

// Method signatures use this constraint:
pick<TActions extends readonly AllActions<TStatement>[]>(actions: TActions)
omit<TActions extends readonly AllActions<TStatement>[]>(actions: TActions)
withAction<TAction extends AllActions<TStatement>>(action: TAction)
withAllActions<TActions extends readonly AllActions<TStatement>[]>(actions: TActions)
withAnyAction<TActions extends readonly AllActions<TStatement>[]>(actions: TActions)
withoutAction<TAction extends AllActions<TStatement>>(action: TAction)
```

**Examples:**

```typescript
// Assume statements: { user: ['create', 'read'], project: ['read', 'delete'] }

// ✅ Valid - 'read' exists in statements
const r1 = collection.pick(['read'] as const);

// ✅ Valid - 'create' and 'delete' exist
const r2 = collection.withAnyAction(['create', 'delete'] as const);

// ❌ Compile error - 'update' doesn't exist
const r3 = collection.pick(['update'] as const);

// ❌ Compile error - 'publish' doesn't exist  
const r4 = collection.withAction('publish');

// ✅ Valid - omit existing action
const r5 = collection.omit(['delete'] as const);

// ❌ Compile error - can't omit non-existent action
const r6 = collection.omit(['archive'] as const);
```

### Core Methods
- **`all()`** - Returns complete statement object with all resources and all actions
- **`pick(actions)`** - Returns only resources that have at least one of the specified actions
- **`omit(actions)`** - Removes specified actions from all resources, excludes resources with no remaining actions

### Domain-Specific Methods
- **`readOnly()`** - Returns only resources with 'read' action (only the 'read' action)
- **`writeOnly()`** - Returns only resources with create/update/delete actions
- **`crudOnly()`** - Returns only resources with CRUD operations (create, read, update, delete)

### Action-Based Filters
- **`withAction(action)`** - Returns only resources that have the specified action
- **`withAllActions(actions)`** - Returns only resources that have ALL specified actions
- **`withAnyAction(actions)`** - Returns only resources that have at least one of the specified actions
- **`withoutAction(action)`** - Returns only resources that DON'T have the specified action

### Utility Methods
- **`resources()`** - Get array of resource names
- **`isEmpty`** - Check if collection is empty
- **`size`** - Get number of resources
- **`toObject()`** - Get raw statement object
- **`getResource(key)`** - Get actions for specific resource
- **`filter(predicate)`** - Filter resources by custom predicate
- **`map(mapper)`** - Map resources to new values
- **`transform(transformer)`** - Transform entire statement structure
- **`merge(other)`** - Merge with another collection
- **`compact()`** - Remove resources with empty action arrays

## Real-World Examples

### 1. All Resources, All Actions
```typescript
superAdminAccess: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getAll().all()
)
// Result: { user: ['create', 'read', ...], project: ['create', 'read', ...], ... }
```

### 2. Only CRUD Operations
```typescript
crudAccess: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getAll().crudOnly()
)
// Result: Only resources with create/read/update/delete actions
```

### 3. Only Write Operations
```typescript
writeAccess: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getAll().writeOnly()
)
// Result: Only resources with create/update/delete actions
```

### 4. Pick Specific Actions Across All Resources
```typescript
listAndReadAccess: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getAll().pick(["list", "read"])
)
// Result: Only resources that have 'list' or 'read' actions
```

### 5. Specific Resources Only
```typescript
userProjectManagement: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getMany(["user", "project"]).all()
)
// Result: { user: [...all actions], project: [...all actions] }
```

### 6. Omit Dangerous Actions
```typescript
safeModeAccess: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getAll().omit(["delete"])
)
// Result: All resources with all actions except 'delete'
```

### 7. Specific Resources with Filters
```typescript
analyticsAndBillingRead: permissionConfig.createPermission(({ statementsConfig }) => 
  statementsConfig.getMany(["analytics", "billing"]).readOnly()
)
// Result: { analytics: ['read'], billing: ['read'] }
```

## Combining with getMany()

The `getMany()` method also returns a collection, allowing you to apply batch operations on selected resources:

```typescript
// Get only user and project resources, then apply filters
statementsConfig.getMany(['user', 'project']).readOnly()
// Returns: { user: ['read'], project: ['read'] }

statementsConfig.getMany(['user', 'project', 'session']).crudOnly()
// Returns only user/project/session with CRUD actions

statementsConfig.getMany(['billing', 'analytics']).withAction('export')
// Returns only billing/analytics that have 'export' action
```

## Advanced Functional Operations

### Custom Filtering
```typescript
// Get resources with more than 3 actions
statementsConfig.getAll().filter((resource, actions) => actions.length > 3)

// Get resources that start with 'user'
statementsConfig.getAll().filter((resource) => resource.startsWith('user'))
```

### Mapping
```typescript
// Get resource names
const resourceNames = statementsConfig.getAll().resources()

// Transform to different structure
const transformed = statementsConfig.getAll().transform((statements) => {
  // Custom transformation logic
  return Object.entries(statements).map(([resource, actions]) => ({
    resourceName: resource,
    actionCount: actions.length,
    actions: actions
  }))
})
```

### Merging Collections
```typescript
const userProjects = statementsConfig.getMany(['user', 'project'])
const billingAnalytics = statementsConfig.getMany(['billing', 'analytics'])

// Merge them
const merged = userProjects.merge(billingAnalytics)
// Returns collection with all four resources
```

## Benefits

1. **Less Code**: One line instead of 7+ lines for "all resources" scenarios
2. **Type Safety**: Full TypeScript inference maintained
3. **Smart Filtering**: Automatically excludes resources that don't match criteria
4. **Composable**: Chain multiple operations together
5. **Flexible**: Works with `.getAll()` (all resources) or `.getMany()` (selected resources)
6. **Readable**: Intent is clear from the method names
7. **Maintainable**: Adding new resources automatically includes them in `.getAll()` calls

## Implementation Details

The `StatementConfigCollection` class includes smart filtering in all methods:

```typescript
pick<TActions extends readonly string[]>(actions: TActions): Partial<TStatement> {
  const result: any = {};
  for (const [resource, resourceActions] of Object.entries(this._statements)) {
    const filtered = resourceActions.filter(a => actions.includes(a as any));
    if (filtered.length > 0) {  // Only include if has matches
      result[resource] = filtered;
    }
  }
  return result;
}
```

This ensures that when you `.pick(['read'])`, resources without a 'read' action are completely excluded from the result, not just returned with an empty array.

---

## Part 2: Role Collections

The `RoleConfigCollection` provides parallel type-safe operations for filtering and managing roles based on their permissions.

### Type Safety Overview for Roles

The role collection API provides **compile-time validation** for resources and actions:

```typescript
// ✅ Valid - 'project' resource exists
rolesConfig.getAll().withResource('project')

// ❌ Compile-time error for invalid resource
rolesConfig.getAll().withResource('invalid')
// TypeScript error: Type '"invalid"' is not assignable to AllRoleResources<TRoles>

// ✅ Valid - 'delete' action exists
rolesConfig.getAll().withAction('delete')

// ❌ Compile-time error for non-existent action
rolesConfig.getAll().withAction('fake-action')
// TypeScript error: Argument of type '"fake-action"' is not assignable to AllRoleActions<TRoles>
```

**Benefits:**
- **Catch typos** at compile time for both resources and actions
- **IDE auto-completion** for valid resources and actions only
- **Refactoring safety** - removing permissions causes type errors
- **Zero runtime overhead** - all validation at compile time

### Architecture Overview for Roles

```typescript
// Level 1: Manage ALL roles
RolesConfig<TRoles>
  ├── .get('admin') → RoleConfig (Level 2A: single role)
  ├── .getAll() → RoleConfigCollection (Level 2B: all roles)
  └── .getMany(['admin', 'manager'], true) → RoleConfigCollection (Level 2B: selected roles)

// Level 2A: Single role operations
RoleConfig<TActions>
  └── .get(resource), .all(), .has(), etc.

// Level 2B: Multiple role operations (NEW!)
RoleConfigCollection<TRoles>
  └── .withResource(), .withAction(), .withActionOnResource(), etc.
      (Smart filtering - excludes roles without matching permissions)
```

### Smart Filtering Behavior for Roles

The collection API automatically **excludes roles** that don't match the filter criteria:

```typescript
// Assume roles:
// admin: { user: ['*'], project: ['*'] }
// editor: { project: ['create', 'read', 'update'] }
// viewer: { project: ['read'], user: ['read'] }

rolesConfig.getAll().withAction('delete')
// Returns: { admin: {...} }
// Note: Only admin has 'delete' permission

rolesConfig.getAll().withResource('project')
// Returns: { admin: {...}, editor: {...}, viewer: {...} }
// All roles have 'project' resource

rolesConfig.getAll().withActionOnResource('project', 'create')
// Returns: { admin: {...}, editor: {...} }
// Note: viewer excluded (no 'create' on project)
```

### Type-Safe Parameters for Roles

All methods that accept resources or actions are constrained to only accept valid values:

```typescript
// Extract all possible actions from all roles
type AllRoleActions<TRoles> = TRoles[keyof TRoles][keyof TRoles[keyof TRoles]][number];

// Extract all possible resources from all roles
type AllRoleResources<TRoles> = keyof TRoles[keyof TRoles];

// Method signatures use these constraints:
withResource<TResource extends AllRoleResources<TRoles>>(resource: TResource)
withAction<TAction extends AllRoleActions<TRoles>>(action: TAction)
withActionOnResource<TResource, TAction>(resource: TResource, action: TAction)
withAllActionsOnResource<TResource, TActions>(resource: TResource, actions: TActions)
withAnyActionOnResource<TResource, TActions>(resource: TResource, actions: TActions)
withoutAction<TAction extends AllRoleActions<TRoles>>(action: TAction)
withoutResource<TResource extends AllRoleResources<TRoles>>(resource: TResource)
```

**Examples:**

```typescript
// Assume roles have:
// admin: { user: ['create', 'read', 'delete'], project: ['*'] }
// editor: { project: ['create', 'read', 'update'] }
// viewer: { project: ['read'], user: ['read'] }

// ✅ Valid - 'user' resource exists
const r1 = rolesConfig.getAll().withResource('user');
// Returns: { admin: {...}, viewer: {...} }

// ✅ Valid - 'create' action exists
const r2 = rolesConfig.getAll().withAction('create');
// Returns: { admin: {...}, editor: {...} }

// ❌ Compile error - 'invalid' resource doesn't exist
const r3 = rolesConfig.getAll().withResource('invalid');

// ❌ Compile error - 'archive' action doesn't exist
const r4 = rolesConfig.getAll().withAction('archive');

// ✅ Valid - filter by action on resource
const r5 = rolesConfig.getAll().withActionOnResource('project', 'delete');
// Returns: { admin: {...} }

// ❌ Compile error - invalid combination
const r6 = rolesConfig.getAll().withActionOnResource('invalid', 'create');
```

### Role Collection Methods

#### Resource-Based Filters
- **`withResource(resource)`** - Returns only roles that have access to the specified resource
- **`withoutResource(resource)`** - Returns only roles that DON'T have access to the resource

#### Action-Based Filters
- **`withAction(action)`** - Returns only roles that have the specified action on ANY resource
- **`withoutAction(action)`** - Returns only roles that DON'T have the specified action anywhere

#### Combined Filters
- **`withActionOnResource(resource, action)`** - Returns only roles with the action on the specific resource
- **`withAllActionsOnResource(resource, actions)`** - Returns only roles that have ALL specified actions on the resource
- **`withAnyActionOnResource(resource, actions)`** - Returns only roles that have at least one of the specified actions on the resource

#### Permission Level Filters
- **`readOnly()`** - Returns only roles with only 'read' permissions
- **`writeOnly()`** - Returns only roles with write permissions (create, update, delete)

#### Utility Methods
- **`roles()`** - Get array of role names in the collection
- **`isEmpty`** - Check if collection is empty
- **`size`** - Get number of roles
- **`toObject()`** - Get raw roles object
- **`getRole(key)`** - Get permissions for specific role
- **`filter(predicate)`** - Filter roles by custom predicate
- **`merge(other)`** - Merge with another role collection

### Real-World Examples for Roles

#### 1. All Roles with Delete Permission
```typescript
const deleteCapableRoles = rolesConfig.getAll().withAction('delete');
// Returns only roles that can delete anything
// Result: { admin: { user: ['*'], project: ['*'] } }
```

#### 2. All Roles with Project Access
```typescript
const projectRoles = rolesConfig.getAll().withResource('project');
// Returns all roles that can access projects
// Result: { admin: {...}, editor: {...}, viewer: {...} }
```

#### 3. Roles That Can Create Projects
```typescript
const projectCreators = rolesConfig.getAll().withActionOnResource('project', 'create');
// Result: { admin: {...}, editor: {...} }
```

#### 4. Roles with Full User Management
```typescript
const userManagers = rolesConfig
  .getAll()
  .withAllActionsOnResource('user', ['create', 'read', 'update', 'delete'] as const);
// Returns only roles with complete user management permissions
// Result: { admin: {...} }
```

#### 5. Roles with Any Write Permission on Projects
```typescript
const projectWriters = rolesConfig
  .getAll()
  .withAnyActionOnResource('project', ['create', 'update', 'delete'] as const);
// Returns roles that can modify projects in any way
// Result: { admin: {...}, editor: {...} }
```

#### 6. Read-Only Roles
```typescript
const readOnlyRoles = rolesConfig.getAll().readOnly();
// Returns roles with only read permissions
// Result: { viewer: { project: ['read'], user: ['read'] } }
```

#### 7. Selected Roles with Filtering
```typescript
const adminEditorWithDelete = rolesConfig
  .getMany(['admin', 'editor'] as const, true)
  .withAction('delete');
// Returns only admin (editor doesn't have delete)
// Result: { admin: {...} }
```

#### 8. Exclude Roles with Dangerous Permissions
```typescript
const safeRoles = rolesConfig.getAll().withoutAction('delete');
// Returns roles without delete permission
// Result: { editor: {...}, viewer: {...} }
```

#### 9. Exclude Roles Without User Access
```typescript
const nonUserRoles = rolesConfig.getAll().withoutResource('user');
// Returns roles that don't have user resource
// Result: { editor: {...} }
```

### Combining Role Filters

You can chain multiple filters for complex queries:

```typescript
// Get roles that can manage projects but not delete users
const projectManagersOnly = rolesConfig
  .getAll()
  .withActionOnResource('project', 'create')
  .withoutActionOnResource('user', 'delete');

// Get roles with read access but no write permissions
const readOnlyViewers = rolesConfig
  .getAll()
  .withResource('project')
  .readOnly();

// Get specific roles with specific permissions
const adminOrManager = rolesConfig
  .getMany(['admin', 'manager'] as const, true)
  .withAnyActionOnResource('project', ['create', 'delete'] as const);
```

### Custom Role Filtering

```typescript
// Get roles with more than 2 resources
const multiResourceRoles = rolesConfig
  .getAll()
  .filter((roleName, rolePermissions) => {
    return Object.keys(rolePermissions).length > 2;
  });

// Get roles starting with 'admin'
const adminRoles = rolesConfig
  .getAll()
  .filter((roleName) => roleName.startsWith('admin'));
```

### Merging Role Collections

```typescript
const adminEditor = rolesConfig.getMany(['admin', 'editor'] as const, true);
const managerViewer = rolesConfig.getMany(['manager', 'viewer'] as const, true);

// Merge them
const merged = adminEditor.merge(managerViewer);
// Returns collection with all four roles
```

---

## Comparison: Statements vs Roles

### Statement Collections
**Purpose:** Filter resources by actions  
**Use Case:** Determine what actions can be performed on each resource

```typescript
// Get all resources with 'delete' action
statementsConfig.getAll().withAction('delete')
// Returns: { user: ['delete'], project: ['delete'], ... }

// Get resources with CRUD operations
statementsConfig.getAll().crudOnly()
// Returns: { user: ['create', 'read', 'update', 'delete'], ... }
```

### Role Collections
**Purpose:** Filter roles by permissions  
**Use Case:** Determine which roles have specific permissions

```typescript
// Get all roles with 'delete' permission
rolesConfig.getAll().withAction('delete')
// Returns: { admin: {...}, ... }

// Get roles that can create projects
rolesConfig.getAll().withActionOnResource('project', 'create')
// Returns: { admin: {...}, editor: {...} }
```

### Parallel APIs

| Statement Collection | Role Collection | Purpose |
|---------------------|----------------|---------|
| `.withAction('delete')` | `.withAction('delete')` | Filter by action |
| `.readOnly()` | `.readOnly()` | Only read permissions |
| `.writeOnly()` | `.writeOnly()` | Only write permissions |
| `.pick(['read', 'create'])` | `.withAnyActionOnResource(resource, actions)` | Multiple actions |
| `.omit(['delete'])` | `.withoutAction('delete')` | Exclude action |
| N/A | `.withResource('project')` | Filter by resource (role-specific) |
| N/A | `.withActionOnResource('project', 'create')` | Filter by resource + action (role-specific) |

### Benefits of Both Systems

1. **Type Safety**: Both provide compile-time validation
2. **Smart Filtering**: Both exclude non-matching items automatically
3. **Composable**: Both support chaining operations
4. **Zero Runtime Cost**: Both use TypeScript's type system
5. **IDE Support**: Both provide full IntelliSense

### Use Cases

**Statement Collections:**
- Building permission presets
- Defining common permission patterns
- Determining available actions for UI

**Role Collections:**
- Finding users with specific permissions
- Auditing role capabilities
- Building role-based UI components
- Role management interfaces
