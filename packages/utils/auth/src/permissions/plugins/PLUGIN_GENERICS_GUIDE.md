# Plugin Generic Typing Guide

## Overview

The plugin system has been redesigned to be heavily typed with generics, allowing each plugin instance to maintain type safety with its own `PermissionBuilder`.

## Plugin Generic Structure

### AdminPermissionsPlugin

```typescript
export class AdminPermissionsPlugin<
  TStatement extends Record<string, readonly string[]> = Record<string, never>,
  TRoles extends Record<string, Record<string, readonly string[]>> = Record<string, never>,
  TPermissionBuilder extends PermissionBuilder<TStatement, TRoles> = PermissionBuilder<TStatement, TRoles>
> implements PluginWrapper {
  private readonly permissionBuilder: TPermissionBuilder | undefined;
  
  constructor(options: PluginWrapperOptions<TPermissionBuilder>) {
    this.permissionBuilder = options.permissionBuilder;
  }
  
  // setRole can now access typed roles from TPermissionBuilder
  async setRole(userId: string, role: keyof TPermissionBuilder['roles']) {
    // Type-safe role parameter
  }
}
```

### OrganizationsPermissionsPlugin

```typescript
export class OrganizationsPermissionsPlugin<
  TStatement extends Record<string, readonly string[]> = Record<string, never>,
  TRoles extends Record<string, Record<string, readonly string[]>> = Record<string, never>,
  TPermissionBuilder extends PermissionBuilder<TStatement, TRoles> = PermissionBuilder<TStatement, TRoles>
> implements PluginWrapper {
  private readonly permissionBuilder: TPermissionBuilder | undefined;
  
  constructor(options: PluginWrapperOptions<TPermissionBuilder>) {
    this.permissionBuilder = options.permissionBuilder;
  }
  
  // addMember and updateMemberRole can use typed roles
  async addMember(
    organizationId: string,
    userId: string,
    role: keyof TPermissionBuilder['roles']
  ) {
    // Type-safe role parameter
  }
  
  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: keyof TPermissionBuilder['roles']
  ) {
    // Type-safe role parameter
  }
}
```

## Generic Parameter Breakdown

### TStatement
- **Type**: `Record<string, readonly string[]>`
- **Purpose**: Maps resource names to action arrays
- **Example**: `{ user: ['read', 'create'], org: ['list', 'manage'] }`

### TRoles
- **Type**: `Record<string, Record<string, readonly string[]>>`
- **Purpose**: Maps role names to their permissions (resource → actions)
- **Example**: `{ admin: { user: ['read', 'create'], org: ['manage'] }, member: { user: ['read'] } }`

### TPermissionBuilder
- **Type**: `PermissionBuilder<TStatement, TRoles>`
- **Purpose**: The actual permission builder instance with type information
- **Constraint**: Must extend PermissionBuilder class for type safety

## PluginWrapperOptions

The options interface is also generic:

```typescript
export interface PluginWrapperOptions<TPermissionBuilder = unknown> {
  auth: Auth;
  headers: Headers;
  permissionBuilder?: TPermissionBuilder;
}
```

## Registry Integration

The `PluginWrapperRegistry` maintains builder types through the creation chain:

```typescript
const registry = new PluginWrapperRegistry()
  .register('admin', (options) => new AdminPermissionsPlugin(options))
  .register('organization', (options) => new OrganizationsPermissionsPlugin(options));

// Create with typed PermissionBuilder
const adminPlugin = registry.create('admin', {
  auth,
  headers,
  permissionBuilder: platformBuilder  // Type is preserved!
});

// adminPlugin.setRole() now has typed role parameter
await adminPlugin.setRole(userId, 'admin');  // ✅ Type safe
```

## Using Typed Roles

### From PermissionBuilder

When you have a `PermissionBuilder` instance, access its roles:

```typescript
const builder = new PermissionBuilder()
  .resources(({ actions }) => ({
    user: actions(['read', 'create']),
    org: actions(['list'])
  }))
  .roles(({ permissions }) => ({
    admin: permissions({
      user: ['read', 'create'],
      org: ['list']
    }),
    member: permissions({
      user: ['read']
    })
  }));

const built = builder.build();

// Type of roles: { admin: {...}, member: {...} }
type Roles = keyof typeof built.roles;  // 'admin' | 'member'

// Now plugin role parameters are typed
type ValidRole = keyof typeof built.roles;
```

### In Plugin Methods

The plugin methods can now enforce role types:

```typescript
// Before (type unsafe)
async setRole(userId: string, role: any) { }

// After (type safe)
async setRole<TBuilder extends PermissionBuilder<any, any>>(
  userId: string, 
  role: keyof TBuilder['roles']
) { }
```

## No Enforced hasAccess() Interface

The `PluginWrapper` interface no longer requires `hasAccess()`:

```typescript
export interface PluginWrapper {
  // Base marker interface - plugins extend this and add their own methods
  // No enforced hasAccess method - plugins define their own access logic
}
```

Each plugin defines its own access control logic in its implementation:

```typescript
export class AdminPermissionsPlugin { ... } implements PluginWrapper {
  async hasAccess(): Promise<boolean> {
    // Admin-specific access control
  }
}

export class OrganizationsPermissionsPlugin { ... } implements PluginWrapper {
  async hasAccess(): Promise<boolean> {
    // Organization-specific access control
  }
}
```

## Type Flow Example

```typescript
// 1. Create builder with specific types
const platformBuilder = new PermissionBuilder()
  .resources(({ actions }) => ({ ... }))
  .roles(({ permissions }) => ({ ... }));

const platformBuilt = platformBuilder.build();

// 2. Type is inferred in registry.create()
const adminPlugin = registry.create('admin', {
  auth,
  headers,
  permissionBuilder: platformBuilt  // Type: { roles: { admin, superAdmin, user } }
});

// 3. Plugin method receives typed role parameter
// TypeScript knows: role: 'admin' | 'superAdmin' | 'user'
await adminPlugin.setRole(userId, 'admin');

// 4. Invalid roles are caught at compile time
// @ts-expect-error - 'invalid' is not a valid role
await adminPlugin.setRole(userId, 'invalid');
```

## Migration from Non-Generic Plugins

If updating existing code:

```typescript
// Before
const plugin = new AdminPermissionsPlugin({ auth, headers });
await plugin.setRole(userId, 'admin');  // role: any

// After (with proper types)
const plugin = new AdminPermissionsPlugin<
  typeof platformStatement,
  typeof platformRoles,
  typeof platformBuilder
>({ auth, headers, permissionBuilder: platformBuilder });
await plugin.setRole(userId, 'admin');  // role: 'admin' | 'superAdmin' | 'user'
```

## Benefits

✅ **Type Safety**: Role parameters are typed to match builder's defined roles
✅ **Auto-completion**: IDE knows all valid roles for each builder
✅ **Compile-time Errors**: Invalid roles caught before runtime
✅ **Flexibility**: Each plugin can have different builders
✅ **Composability**: Plugins can be combined with different builders
✅ **Documentation**: Types serve as self-documenting role contracts

## Files Updated

- `/packages/utils/auth/src/permissions/plugins/admin.permissions.plugin.ts` - Generic AdminPermissionsPlugin
- `/packages/utils/auth/src/permissions/plugins/organizations.permissions.plugin.ts` - Generic OrganizationsPermissionsPlugin
- `/packages/utils/auth/src/permissions/plugins/system/registry.ts` - Already supports generic TPermissionBuilder

## Next Steps

1. Update role parameter calls to use typed values from `keyof TPermissionBuilder['roles']`
2. Add integration tests verifying type safety
3. Update config.ts to ensure builders are properly typed when passed to plugins
4. Document role parameter type extraction patterns
