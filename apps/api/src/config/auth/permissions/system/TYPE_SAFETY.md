# StatementConfigCollection Type Safety

# Type Safety Documentation

## Overview

The permission system provides **comprehensive type safety** at multiple levels:

1. **Statement Collections** - Type-safe operations on resources and actions
2. **Role Collections** - Type-safe operations on roles and their permissions

Both systems ensure that **invalid operations cause compile-time errors** and **TypeScript knows exactly what's in filtered results**.

---

## Part 1: StatementConfigCollection Type Safety

The `StatementConfigCollection` class provides type safety for resource and action operations.

### Action Parameter Constraints

### `AllActions<TStatement>` Type Utility

This utility extracts all possible actions from the entire statement collection:

```typescript
// Extract all actions from all resources
type AllActions<TStatement extends Record<string, readonly string[]>> = 
  TStatement[keyof TStatement][number];

// Example:
type Statements = {
  user: readonly ['create', 'read', 'update'];
  project: readonly ['read', 'delete'];
  session: readonly ['list'];
};

// AllActions<Statements> = 'create' | 'read' | 'update' | 'delete' | 'list'
```

### Constrained Method Signatures

All methods that accept actions use `AllActions<TStatement>` to constrain parameters:

```typescript
class StatementConfigCollection<TStatement> {
  // Single action parameter
  withAction<TAction extends AllActions<TStatement>>(
    action: TAction
  ): WithAction<TStatement, TAction>
  
  withoutAction<TAction extends AllActions<TStatement>>(
    action: TAction
  ): WithoutAction<TStatement, TAction>
  
  // Multiple action parameters
  pick<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions
  ): FilteredStatement<TStatement, TActions>
  
  omit<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions
  ): OmittedStatement<TStatement, TActions>
  
  withAllActions<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions
  ): WithAllActions<TStatement, TActions>
  
  withAnyAction<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions
  ): WithAnyAction<TStatement, TActions>
}
```

### Compile-Time Validation Examples

```typescript
type Statements = {
  user: readonly ['create', 'read', 'update', 'delete'];
  project: readonly ['read', 'delete'];
};

const collection = new StatementConfigCollection(statements);

// ✅ VALID - 'read' exists in statements
collection.withAction('read');

// ❌ TYPE ERROR - 'publish' doesn't exist
collection.withAction('publish');
// Error: Argument of type '"publish"' is not assignable to parameter of type 'create' | 'read' | 'update' | 'delete'

// ✅ VALID - all actions exist
collection.pick(['read', 'create', 'delete'] as const);

// ❌ TYPE ERROR - 'archive' doesn't exist
collection.pick(['read', 'archive'] as const);
// Error: Type '"archive"' is not assignable to type 'create' | 'read' | 'update' | 'delete'

// ✅ VALID - existing actions
collection.withAnyAction(['create', 'update'] as const);

// ❌ TYPE ERROR - mixing valid and invalid
collection.withAnyAction(['create', 'fake-action'] as const);
// Error: Type '"fake-action"' is not assignable to type AllActions<Statements>
```

## Return Type Utilities

### 1. `FilteredStatement<TStatement, TActions>`
Used by: `pick()`, `readOnly()`, `writeOnly()`, `crudOnly()`

**Purpose**: Filters resources to only include those that have at least one of the specified actions, and filters the action arrays to only include the specified actions.

**Example:**
```typescript
type TestStatements = {
  user: readonly ['create', 'read', 'update', 'delete'];
  project: readonly ['create', 'read', 'list'];
  organization: readonly ['read', 'list'];
};

// pick(['read', 'create'] as const) returns:
type Result = {
  user: readonly ('read' | 'create')[];        // Has both read and create
  project: readonly ('read' | 'create')[];     // Has both read and create
  organization: readonly ('read')[];            // Only has read
};
```

### 2. `OmittedStatement<TStatement, TActions>`
Used by: `omit()`

**Purpose**: Removes specified actions from all resources and excludes resources that would have no remaining actions.

**Example:**
```typescript
// omit(['delete', 'update'] as const) returns:
type Result = {
  user: readonly ('create' | 'read')[];        // delete and update removed
  project: readonly ('create' | 'read' | 'list')[]; // No delete/update to remove
  organization: readonly ('read' | 'list')[];   // No delete/update to remove
};
```

### 3. `WithAction<TStatement, TAction>`
Used by: `withAction()`

**Purpose**: Filters resources to only include those that have a specific action, preserving all their actions.

**Example:**
```typescript
// withAction('create') returns:
type Result = {
  user: readonly ['create', 'read', 'update', 'delete'];
  project: readonly ['create', 'read', 'list'];
  // organization excluded (no 'create' action)
};
```

### 4. `WithAllActions<TStatement, TActions>`
Used by: `withAllActions()`

**Purpose**: Filters resources to only include those that have ALL specified actions.

**Example:**
```typescript
// withAllActions(['read', 'create'] as const) returns:
type Result = {
  user: readonly ['create', 'read', 'update', 'delete'];
  project: readonly ['create', 'read', 'list'];
  // organization excluded (no 'create' action)
};
```

### 5. `WithAnyAction<TStatement, TActions>`
Used by: `withAnyAction()`

**Purpose**: Filters resources to only include those that have ANY of the specified actions.

**Example:**
```typescript
// withAnyAction(['archive', 'list'] as const) returns:
type Result = {
  project: readonly ['create', 'read', 'list'];     // Has 'list'
  organization: readonly ['read', 'list'];          // Has 'list'
  // user excluded (no 'archive' or 'list')
};
```

### 6. `WithoutAction<TStatement, TAction>`
Used by: `withoutAction()`

**Purpose**: Filters resources to only include those that DON'T have a specific action.

**Example:**
```typescript
// withoutAction('delete') returns:
type Result = {
  project: readonly ['create', 'read', 'list'];
  organization: readonly ['read', 'list'];
  // user excluded (has 'delete' action)
};
```

## Benefits

### 1. **Compile-Time Validation**
TypeScript catches errors at compile time:
```typescript
const result = collection.pick(['read', 'create'] as const);
// TypeScript knows exactly which resources are in the result
// and what actions they have

// This would be a compile error if 'user' wasn't in the result:
result.user // ✅ OK - user has read and create
result.analytics // ❌ Type error - analytics only has read, not create
```

### 2. **IntelliSense Support**
Your IDE shows exactly what's available:
```typescript
const result = collection.withAction('create');
result. // IntelliSense shows only resources with 'create' action
```

### 3. **Refactoring Safety**
When you change statement definitions, TypeScript catches all affected code:
```typescript
// If you remove 'create' from 'project':
type Statements = {
  user: readonly ['create', 'read'];
  project: readonly ['read', 'list']; // removed 'create'
};

// This now causes a type error:
const result = collection.withAction('create');
result.project // ❌ Type error - project no longer in result
```

### 4. **No Runtime Surprises**
The type system matches runtime behavior exactly. If TypeScript says a resource is in the result, it will be there at runtime.

## Usage Guidelines

### Always Use `as const` for Action Arrays

```typescript
// ❌ BAD - loses type information
collection.pick(['read', 'create'])

// ✅ GOOD - preserves exact types
collection.pick(['read', 'create'] as const)
```

### Type Assertions for Complex Cases

For very complex scenarios, you can use type assertions, but prefer letting TypeScript infer:

```typescript
// Prefer inference
const result = collection.pick(['read', 'create'] as const);

// Only use assertions if necessary
const result = collection.pick(['read', 'create'] as const) as {
  user: readonly ['read', 'create'];
};
```

## Implementation Notes

- All types are **distributive** - they work correctly with union types
- Types are **computed** - no runtime overhead
- **Zero cost abstraction** - types are erased at compile time
- **Backwards compatible** - old code continues to work

## Complete Type Safety Architecture

The system provides **end-to-end type safety** at three levels:

### 1. Input Validation (Action Parameters)
```typescript
// ✅ Only valid actions accepted
collection.withAction('create')

// ❌ Invalid actions rejected at compile time
collection.withAction('invalid')
```

### 2. Processing (Type Transformations)
```typescript
// Types are computed during filtering
type Result = FilteredStatement<TStatement, ['read']>
// Result only includes resources with 'read' action
```

### 3. Output Precision (Return Types)
```typescript
// TypeScript knows exactly what's in the result
const result = collection.readOnly();
result.user // ✅ Type: ['read']
result.project // ✅ Type: ['read']
```

### Combined Benefits

```typescript
// Define statements
type Statements = {
  user: readonly ['create', 'read', 'update', 'delete'];
  project: readonly ['read', 'delete'];
  session: readonly ['list'];
};

const collection = new StatementConfigCollection<Statements>(statements);

// Type-safe action parameter
const result = collection.withAction('create');
//                                    ^ Only 'create' | 'read' | 'update' | 'delete' | 'list' allowed

// Precise return type
result
// Type: { user: readonly ['create', 'read', 'update', 'delete'] }
// Note: project and session excluded (no 'create' action)

// IntelliSense support
result.user // ✅ Available
result.project // ❌ Type error - not in result
```

## Summary

The type system provides:

- ✅ **Input validation** via `AllActions<TStatement>` constraints
- ✅ **Output precision** via computed return types (`FilteredStatement`, `WithAction`, etc.)
- ✅ **Compile-time safety** - invalid actions cause TypeScript errors
- ✅ **IntelliSense support** - IDE shows only valid actions and resources
- ✅ **Refactoring confidence** - removing actions causes errors where used
- ✅ **Zero runtime cost** - all type checking at compile time
- ✅ **Documentation** - types serve as living documentation

This creates a **type-safe permission system** where mistakes are caught during development, not in production.

---

## Part 2: RoleConfigCollection Type Safety

The `RoleConfigCollection` class provides the same level of type safety for role operations, enabling compile-time validation when filtering roles based on their permissions.

### Type Utilities for Roles

#### `AllRoleActions<TRoles>` - Extract All Actions from Roles

Extracts all possible actions from all roles:

```typescript
type AllRoleActions<TRoles extends Record<string, Record<string, readonly string[]>>> = 
  TRoles[keyof TRoles][keyof TRoles[keyof TRoles]][number];

// Example:
type Roles = {
  admin: {
    user: readonly ['create', 'read', 'update', 'delete'];
    project: readonly ['create', 'read'];
  };
  viewer: {
    user: readonly ['read'];
    project: readonly ['read'];
  };
};

// AllRoleActions<Roles> = 'create' | 'read' | 'update' | 'delete'
```

#### `AllRoleResources<TRoles>` - Extract All Resources from Roles

Extracts all possible resources from all roles:

```typescript
type AllRoleResources<TRoles> = keyof TRoles[keyof TRoles];

// AllRoleResources<Roles> = 'user' | 'project'
```

### Constrained Method Signatures for Roles

All methods that accept actions or resources use type constraints:

```typescript
class RoleConfigCollection<TRoles> {
  // Filter by resource
  withResource<TResource extends AllRoleResources<TRoles>>(
    resource: TResource
  ): WithResource<TRoles, TResource>
  
  // Filter by action (any resource)
  withAction<TAction extends AllRoleActions<TRoles>>(
    action: TAction
  ): WithAction<TRoles, TAction>
  
  // Filter by action on specific resource
  withActionOnResource<
    TResource extends AllRoleResources<TRoles>,
    TAction extends AllRoleActions<TRoles>
  >(
    resource: TResource,
    action: TAction
  ): WithActionOnResource<TRoles, TResource, TAction>
  
  // Filter by all actions on resource
  withAllActionsOnResource<
    TResource extends AllRoleResources<TRoles>,
    TActions extends readonly AllRoleActions<TRoles>[]
  >(
    resource: TResource,
    actions: TActions
  ): WithAllActionsOnResource<TRoles, TResource, TActions>
  
  // Filter by any action on resource
  withAnyActionOnResource<
    TResource extends AllRoleResources<TRoles>,
    TActions extends readonly AllRoleActions<TRoles>[]
  >(
    resource: TResource,
    actions: TActions
  ): WithAnyActionOnResource<TRoles, TResource, TActions>
  
  // Exclude roles with action
  withoutAction<TAction extends AllRoleActions<TRoles>>(
    action: TAction
  ): WithoutAction<TRoles, TAction>
  
  // Exclude roles with resource
  withoutResource<TResource extends AllRoleResources<TRoles>>(
    resource: TResource
  ): WithoutResource<TRoles, TResource>
}
```

### Compile-Time Validation Examples for Roles

```typescript
type Roles = {
  admin: {
    user: readonly ['create', 'read', 'update', 'delete'];
    project: readonly ['create', 'read', 'delete'];
  };
  editor: {
    project: readonly ['create', 'read', 'update'];
  };
  viewer: {
    project: readonly ['read'];
    user: readonly ['read'];
  };
};

const collection = new RoleConfigCollection(roles);

// ✅ VALID - 'project' resource exists
collection.withResource('project');
// Returns: { admin: {...}, editor: {...}, viewer: {...} }

// ❌ TYPE ERROR - 'organization' resource doesn't exist
collection.withResource('organization');
// Error: Argument of type '"organization"' is not assignable to 'user' | 'project'

// ✅ VALID - 'delete' action exists
collection.withAction('delete');
// Returns: { admin: {...} } - only admin has 'delete'

// ❌ TYPE ERROR - 'archive' action doesn't exist
collection.withAction('archive');
// Error: Argument of type '"archive"' is not assignable to AllRoleActions<Roles>

// ✅ VALID - filter by action on specific resource
collection.withActionOnResource('project', 'delete');
// Returns: { admin: {...} } - only admin can delete projects

// ❌ TYPE ERROR - invalid action for resource
collection.withActionOnResource('project', 'ban');
// Error: Type '"ban"' is not assignable to AllRoleActions<Roles>

// ✅ VALID - multiple actions
collection.withAllActionsOnResource('project', ['create', 'delete'] as const);
// Returns: { admin: {...} } - only admin has both actions

// ❌ TYPE ERROR - mixing valid and invalid actions
collection.withAnyActionOnResource('project', ['create', 'invalid'] as const);
// Error: Type '"invalid"' is not assignable to AllRoleActions<Roles>
```

### Return Type Utilities for Roles

#### `WithResource<TRoles, TResource>`

Filters roles to only include those with access to a specific resource:

```typescript
type Result = WithResource<Roles, 'project'>;
// Result: { admin: {...}, editor: {...}, viewer: {...} }
// All roles have 'project' resource
```

#### `WithAction<TRoles, TAction>`

Filters roles to only include those with a specific action (on any resource):

```typescript
type Result = WithAction<Roles, 'delete'>;
// Result: { admin: {...} }
// Only admin has 'delete' action
```

#### `WithActionOnResource<TRoles, TResource, TAction>`

Filters roles with specific action on specific resource:

```typescript
type Result = WithActionOnResource<Roles, 'project', 'create'>;
// Result: { admin: {...}, editor: {...} }
// Admin and editor can create projects
```

#### `WithAllActionsOnResource<TRoles, TResource, TActions>`

Filters roles that have ALL specified actions on a resource:

```typescript
type Result = WithAllActionsOnResource<Roles, 'project', ['create', 'delete']>;
// Result: { admin: {...} }
// Only admin has both 'create' AND 'delete'
```

#### `WithAnyActionOnResource<TRoles, TResource, TActions>`

Filters roles that have ANY of the specified actions on a resource:

```typescript
type Result = WithAnyActionOnResource<Roles, 'project', ['update', 'delete']>;
// Result: { admin: {...}, editor: {...} }
// Admin has delete, editor has update
```

#### `WithoutAction<TRoles, TAction>`

Filters roles that don't have a specific action anywhere:

```typescript
type Result = WithoutAction<Roles, 'delete'>;
// Result: { editor: {...}, viewer: {...} }
// Editor and viewer don't have 'delete'
```

#### `WithoutResource<TRoles, TResource>`

Filters roles that don't have access to a resource:

```typescript
type Result = WithoutResource<Roles, 'user'>;
// Result: { editor: {...} }
// Only editor doesn't have 'user' resource
```

### Complete Role Type Safety Architecture

```typescript
// Define roles
type Roles = {
  admin: {
    user: readonly ['create', 'read', 'update', 'delete'];
    project: readonly ['create', 'read', 'update', 'delete'];
  };
  editor: {
    project: readonly ['create', 'read', 'update'];
  };
  viewer: {
    project: readonly ['read'];
    user: readonly ['read'];
  };
};

const rolesConfig = new RolesConfig(roles);

// Get collection for batch operations
const collection = rolesConfig.getAll();

// Type-safe resource filtering
const projectRoles = collection.withResource('project');
// Type: { admin: {...}, editor: {...}, viewer: {...} }

// Type-safe action filtering
const deleteRoles = collection.withAction('delete');
// Type: { admin: {...} }

// Type-safe combined filtering
const canDeleteProjects = collection.withActionOnResource('project', 'delete');
// Type: { admin: {...} }

// IntelliSense support
canDeleteProjects.admin // ✅ Available
canDeleteProjects.editor // ❌ Type error - editor can't delete projects
```

### Usage with RolesConfig

```typescript
import { rolesConfig } from '@/config/auth/permissions';

// Get all roles as collection
const allRoles = rolesConfig.getAll();

// Filter roles with 'delete' permission
const deleteCapableRoles = allRoles.withAction('delete');
// Type-safe result with only roles that have 'delete'

// Filter roles with access to 'project'
const projectRoles = allRoles.withResource('project');

// Filter roles that can create projects
const projectCreators = allRoles.withActionOnResource('project', 'create');

// Get only read-only roles
const readOnlyRoles = allRoles.readOnly();

// Get only write roles
const writeRoles = allRoles.writeOnly();

// Get selected roles as collection
const adminManager = rolesConfig.getMany(['admin', 'manager'] as const, true);
const withDelete = adminManager.withAction('delete');
```

### Benefits for Role Collections

- ✅ **Input validation** via `AllRoleActions<TRoles>` and `AllRoleResources<TRoles>` constraints
- ✅ **Output precision** via computed return types (`WithResource`, `WithAction`, etc.)
- ✅ **Compile-time safety** - invalid actions/resources cause TypeScript errors
- ✅ **IntelliSense support** - IDE shows only valid actions and resources
- ✅ **Refactoring confidence** - removing permissions causes errors where used
- ✅ **Zero runtime cost** - all type checking at compile time
- ✅ **Documentation** - types serve as living documentation

---

## Complete System Summary

The permission system provides **end-to-end type safety** for both statements and roles:

### Statement Collections
- Filter resources by actions
- Type-safe action parameters
- Precise return types showing filtered resources

### Role Collections
- Filter roles by resources and actions
- Type-safe resource and action parameters
- Precise return types showing filtered roles

### Combined Benefits

```typescript
// Statements: Filter resources
const readResources = statementsConfig.getAll().readOnly();
// Type: { user: ['read'], project: ['read'], ... }

// Roles: Filter roles
const readRoles = rolesConfig.getAll().readOnly();
// Type: { viewer: {...}, ... }

// Both use the same type safety principles
// Both catch errors at compile time
// Both provide IntelliSense support
// Both have zero runtime overhead
```

This creates a **fully type-safe permission system** where mistakes are caught during development, not in production.
