/**
 * Extract all possible actions from all roles
 */
type AllRoleActions<TRoles extends Record<string, Record<string, readonly string[]>>> = 
  TRoles[keyof TRoles][keyof TRoles[keyof TRoles]][number];

/**
 * Extract all possible resources from all roles (string-constrained)
 */
type AllRoleResources<TRoles extends Record<string, Record<string, readonly string[]>>> = 
  Extract<keyof TRoles[keyof TRoles], string>;

/**
 * Helper type to check if a role has a specific resource
 */
type HasResource<
  TRole extends Record<string, readonly string[]>,
  TResource extends string
> = TResource extends keyof TRole ? true : false;

/**
 * Helper type to check if a role has a specific action on any resource
 */
type HasAction<
  TRole extends Record<string, readonly string[]>,
  TAction extends string
> = {
  [K in keyof TRole]: TAction extends TRole[K][number] ? true : never
}[keyof TRole] extends never ? false : true;

/**
 * Helper type to check if a role has a specific action on a specific resource
 */
type HasActionOnResource<
  TRole extends Record<string, readonly string[]>,
  TResource extends string,
  TAction extends string
> = TResource extends keyof TRole
  ? TAction extends TRole[TResource][number]
    ? true
    : false
  : false;

/**
 * Helper type to check if a role has all specified actions on a resource
 */
type HasAllActionsOnResource<
  TRole extends Record<string, readonly string[]>,
  TResource extends string,
  TActions extends readonly string[]
> = TResource extends keyof TRole
  ? TActions[number] extends TRole[TResource][number]
    ? true
    : false
  : false;

/**
 * Helper type to check if a role has any of the specified actions on a resource
 */
type HasAnyActionOnResource<
  TRole extends Record<string, readonly string[]>,
  TResource extends string,
  TActions extends readonly string[]
> = TResource extends keyof TRole
  ? Extract<TRole[TResource][number], TActions[number]> extends never
    ? false
    : true
  : false;

/**
 * Filter roles that have access to a specific resource
 */
type WithResource<
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TResource extends AllRoleResources<TRoles>
> = {
  [K in keyof TRoles as HasResource<TRoles[K], TResource> extends true
    ? K
    : never]: TRoles[K];
};

/**
 * Filter roles that have a specific action (on any resource)
 */
type WithAction<
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TAction extends AllRoleActions<TRoles>
> = {
  [K in keyof TRoles as HasAction<TRoles[K], TAction> extends true
    ? K
    : never]: TRoles[K];
};

/**
 * Filter roles that have a specific action on a specific resource
 */
type WithActionOnResource<
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TResource extends AllRoleResources<TRoles>,
  TAction extends AllRoleActions<TRoles>
> = {
  [K in keyof TRoles as HasActionOnResource<TRoles[K], TResource, TAction> extends true
    ? K
    : never]: TRoles[K];
};

/**
 * Filter roles that have all specified actions on a resource
 */
type WithAllActionsOnResource<
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TResource extends AllRoleResources<TRoles>,
  TActions extends readonly AllRoleActions<TRoles>[]
> = {
  [K in keyof TRoles as HasAllActionsOnResource<TRoles[K], TResource, TActions> extends true
    ? K
    : never]: TRoles[K];
};

/**
 * Filter roles that have any of the specified actions on a resource
 */
type WithAnyActionOnResource<
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TResource extends AllRoleResources<TRoles>,
  TActions extends readonly AllRoleActions<TRoles>[]
> = {
  [K in keyof TRoles as HasAnyActionOnResource<TRoles[K], TResource, TActions> extends true
    ? K
    : never]: TRoles[K];
};

/**
 * Filter roles that don't have a specific action (on any resource)
 */
type WithoutAction<
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TAction extends AllRoleActions<TRoles>
> = {
  [K in keyof TRoles as HasAction<TRoles[K], TAction> extends false
    ? K
    : never]: TRoles[K];
};

/**
 * Filter roles that don't have access to a specific resource
 */
type WithoutResource<
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TResource extends AllRoleResources<TRoles>
> = {
  [K in keyof TRoles as HasResource<TRoles[K], TResource> extends false
    ? K
    : never]: TRoles[K];
};

/**
 * Filter roles to only include read-only roles
 */
export type ReadOnlyRoles<TRoles extends Record<string, Record<string, readonly string[]>>> = {
  [K in keyof TRoles as {
    [R in keyof TRoles[K]]: TRoles[K][R] extends readonly ['read'] ? true : false
  }[keyof TRoles[K]] extends false ? never : K]: TRoles[K];
};

/**
 * Filter roles to only include write roles (have create/update/delete)
 */
export type WriteRoles<TRoles extends Record<string, Record<string, readonly string[]>>> = {
  [K in keyof TRoles as {
    [R in keyof TRoles[K]]: Extract<TRoles[K][R][number], 'create' | 'update' | 'delete'> extends never ? false : true
  }[keyof TRoles[K]] extends true ? K : never]: TRoles[K];
};

import { RoleConfig } from './single-role-config';

/**
 * RoleConfigCollection - Provides batch operations on multiple roles with type safety
 * 
 * This class enables filtering and manipulating role collections with:
 * - Type-safe action and resource parameters (compile-time validation)
 * - Precise return types (TypeScript knows exactly which roles are in results)
 * - Smart filtering (automatically excludes roles that don't match criteria)
 * 
 * Similar to StatementConfigCollection but for roles instead of statements
 */
export class RoleConfigCollection<TRoles extends Record<string, Record<string, readonly string[]>>> {
  constructor(private readonly _roles: TRoles) {}

  /**
   * Get all roles
   */
  all(): TRoles {
    return this._roles;
  }

  /**
   * Get specific role by key
   */
  getRole<K extends keyof TRoles>(key: K): RoleConfig<TRoles[K]> | undefined {
    const role = this._roles[key];
     
    return role !== undefined ? new RoleConfig(role) : undefined;
  }

  /**
   * Filter roles that have access to a specific resource
   * 
   * @example
   * // Only returns roles that have 'project' resource, with only that resource
   * collection.withResource('project')
   */
  withResource<TResource extends AllRoleResources<TRoles>>(
    resource: TResource
  ): RoleConfigCollection<WithResource<TRoles, TResource>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      if (resource in rolePerms) {
        const resourceActions = rolePerms[resource];
        if (resourceActions) {
          // Only include the specified resource in the result
          result[roleName] = { [resource]: resourceActions };
        }
      }
    }
    return new RoleConfigCollection(result as unknown as WithResource<TRoles, TResource>);
  }

  /**
   * Filter roles that have a specific action (on any resource)
   * 
   * @example
   * // Only returns roles that have 'delete' action somewhere
   * collection.withAction('delete')
   */
  withAction<TAction extends AllRoleActions<TRoles>>(
    action: TAction
  ): RoleConfigCollection<WithAction<TRoles, TAction>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const hasAction = Object.values(rolePerms).some((actions: readonly string[]) =>
        Array.isArray(actions) && actions.includes(action)
      );
      if (hasAction) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result as WithAction<TRoles, TAction>);
  }

  /**
   * Filter roles that have a specific action on a specific resource
   * 
   * @example
   * // Only returns roles that can 'delete' on 'project'
   * collection.withActionOnResource('project', 'delete')
   */
  withActionOnResource<
    TResource extends AllRoleResources<TRoles>,
    TAction extends AllRoleActions<TRoles>
  >(
    resource: TResource,
    action: TAction
  ): RoleConfigCollection<WithActionOnResource<TRoles, TResource, TAction>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const resourceActions = rolePerms[resource];
      if (Array.isArray(resourceActions) && resourceActions.includes(action)) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result as unknown as WithActionOnResource<TRoles, TResource, TAction>);
  }

  /**
   * Filter roles that DON'T have a specific action on a specific resource
   * Inverse of withActionOnResource
   * 
   * @example
   * // Returns roles that can access 'code' but cannot 'delete' on 'project'
   * collection.withResource('code').withoutActionOnResource('project', 'delete')
   */
  withoutActionOnResource<
     
    TResource extends AllRoleResources<TRoles>,
     
    TAction extends AllRoleActions<TRoles>
  >(
    resource: TResource,
    action: TAction
  ): RoleConfigCollection<Record<string, Record<string, readonly string[]>>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const resourceActions = rolePerms[resource];
      // Include role if:
      // 1. Resource doesn't exist in role, OR
      // 2. Resource exists but doesn't include the action
      if (!Array.isArray(resourceActions) || !resourceActions.includes(action)) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result);
  }

  /**
   * Filter roles that have all specified actions on a resource
   * 
   * @example
   * // Only returns roles that have both 'create' AND 'delete' on 'project'
   * collection.withAllActionsOnResource('project', ['create', 'delete'] as const)
   */
  withAllActionsOnResource<
    TResource extends AllRoleResources<TRoles>,
    TActions extends readonly AllRoleActions<TRoles>[]
  >(
    resource: TResource,
    actions: TActions
  ): RoleConfigCollection<WithAllActionsOnResource<TRoles, TResource, TActions>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const resourceActions = rolePerms[resource];
      if (Array.isArray(resourceActions)) {
        const hasAllActions = actions.every(action => resourceActions.includes(action));
        if (hasAllActions) {
          result[roleName] = rolePerms;
        }
      }
    }
    return new RoleConfigCollection(result as WithAllActionsOnResource<TRoles, TResource, TActions>);
  }

  /**
   * Filter roles that have any of the specified actions on a resource
   * 
   * @example
   * // Returns roles that have 'create' OR 'delete' on 'project'
   * collection.withAnyActionOnResource('project', ['create', 'delete'] as const)
   */
  withAnyActionOnResource<
    TResource extends AllRoleResources<TRoles>,
    TActions extends readonly AllRoleActions<TRoles>[]
  >(
    resource: TResource,
    actions: TActions
  ): RoleConfigCollection<WithAnyActionOnResource<TRoles, TResource, TActions>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const resourceActions = rolePerms[resource];
      if (Array.isArray(resourceActions)) {
        const hasAnyAction = actions.some(action => resourceActions.includes(action));
        if (hasAnyAction) {
          result[roleName] = rolePerms;
        }
      }
    }
    return new RoleConfigCollection(result as WithAnyActionOnResource<TRoles, TResource, TActions>);
  }

  /**
   * Filter roles that don't have a specific action (on any resource)
   * 
   * @example
   * // Returns roles that don't have 'delete' anywhere
   * collection.withoutAction('delete')
   */
  withoutAction<TAction extends AllRoleActions<TRoles>>(
    action: TAction
  ): RoleConfigCollection<WithoutAction<TRoles, TAction>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const hasAction = Object.values(rolePerms).some((actions) =>
        Array.isArray(actions) && actions.includes(action)
      );
      if (!hasAction) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result as WithoutAction<TRoles, TAction>);
  }

  /**
   * Filter roles that don't have access to a specific resource
   * 
   * @example
   * // Returns roles that don't have 'system' resource
   * collection.withoutResource('system')
   */
  withoutResource<TResource extends AllRoleResources<TRoles>>(
    resource: TResource
  ): RoleConfigCollection<WithoutResource<TRoles, TResource>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      if (!(resource in rolePerms)) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result as WithoutResource<TRoles, TResource>);
  }

  /**
   * Get only read-only roles (roles where all resources only have 'read' action)
   * 
   * @example
   * // Returns roles like { viewer: { project: ['read'], user: ['read'] } }
   * collection.readOnly()
   */
  readOnly(): RoleConfigCollection<Record<string, Record<string, readonly string[]>>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const isReadOnly = Object.values(rolePerms).every((actions) =>
        Array.isArray(actions) && actions.length === 1 && actions[0] === 'read'
      );
      if (isReadOnly) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result);
  }

  /**
   * Get only write roles (roles that have create/update/delete actions)
   * 
   * @example
   * // Returns roles that have write permissions
   * collection.writeOnly()
   */
  writeOnly(): RoleConfigCollection<Record<string, Record<string, readonly string[]>>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    const writeActions = ['create', 'update', 'delete'];
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      const hasWrite = Object.values(rolePerms).some((actions: readonly string[]) =>
        Array.isArray(actions) && actions.some(a => writeActions.includes(a as string))
      );
      if (hasWrite) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result);
  }

  /**
   * Get role names
   */
  roleNames(): (keyof TRoles)[] {
    return Object.keys(this._roles) as (keyof TRoles)[];
  }

  /**
   * Check if collection is empty
   */
  get isEmpty(): boolean {
    return Object.keys(this._roles).length === 0;
  }

  /**
   * Get number of roles
   */
  get size(): number {
    return Object.keys(this._roles).length;
  }

  /**
   * Convert to plain object
   */
  toObject(): TRoles {
    return { ...this._roles };
  }

  /**
   * Filter roles by custom predicate
   */
  filter(predicate: (roleName: keyof TRoles, roleConfig: RoleConfig) => boolean): RoleConfigCollection<Record<string, Record<string, readonly string[]>>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      if (predicate(roleName as keyof TRoles, new RoleConfig(rolePerms))) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result);
  }

  /**
   * Map roles to new values
   */
  map<U>(mapper: (roleName: keyof TRoles, roleConfig: RoleConfig) => U): U[] {
    return Object.entries(this._roles).map(([roleName, rolePerms]) =>
      mapper(roleName as keyof TRoles, new RoleConfig(rolePerms))
    );
  }

  /**
   * Transform roles structure
   */
  transform<U>(transformer: (roleName: string, roleConfig: RoleConfig) => U): Record<string, U> {
    const result: Record<string, U> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      result[roleName] = transformer(roleName, new RoleConfig(rolePerms));
    }
    return result;
  }

  /**
   * Merge with another collection
   */
  merge<TOther extends Record<string, Record<string, readonly string[]>>>(
    other: RoleConfigCollection<TOther>
  ): RoleConfigCollection<TRoles & TOther> {
    return new RoleConfigCollection({
      ...this._roles,
      ...other.toObject()
    });
  }

  /**
   * Remove roles with empty permissions
   */
  compact(): RoleConfigCollection<Record<string, Record<string, readonly string[]>>> {
    const result: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, rolePerms] of Object.entries(this._roles)) {
      if (Object.keys(rolePerms).length > 0) {
        result[roleName] = rolePerms;
      }
    }
    return new RoleConfigCollection(result);
  }
}
