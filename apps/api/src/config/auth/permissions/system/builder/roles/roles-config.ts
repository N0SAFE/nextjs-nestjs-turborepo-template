import { BaseConfig } from '../shared/base-config';
import { RoleConfig } from './single-role-config';
import { RoleConfigCollection } from './role-config-collection';

/**
 * RolesConfig - Manages all roles in the permission system
 * Provides methods to manipulate and query the entire role collection
 */
export class RolesConfig<TRoles extends Record<string, any>> extends BaseConfig<TRoles> {
  constructor(roles: TRoles) {
    super(roles);
  }

  /**
   * Get a specific role as a RoleConfig instance
   * This enables chained operations on individual roles
   */
  get<K extends keyof TRoles>(key: K): RoleConfig<TRoles[K]> {
    return new RoleConfig(this._roles[key]);
  }

  /**
   * Get all roles as a RoleConfigCollection for batch operations
   * Enables type-safe filtering across all roles
   * 
   * @example
   * // Get all roles with 'delete' action
   * rolesConfig.getAll().withAction('delete')
   * 
   * // Get all roles with access to 'project' resource
   * rolesConfig.getAll().withResource('project')
   */
  getAll(): RoleConfigCollection<TRoles> {
    return new RoleConfigCollection(this._roles);
  }

  /**
   * Get multiple roles as a RoleConfig instances (legacy method)
   * For batch operations, use getMany().getAll() with RoleConfigCollection
   */
  getMany<K extends keyof TRoles>(keys: K[]): Record<K, RoleConfig<TRoles[K]>>;
  
  /**
   * Get multiple roles as a RoleConfigCollection for batch operations
   * 
   * @example
   * // Get admin and manager roles as collection
   * rolesConfig.getMany(['admin', 'manager'] as const)
   *   .withAction('delete')
   */
  getMany<K extends keyof TRoles>(
    keys: K[],
    asCollection: true
  ): RoleConfigCollection<Pick<TRoles, K>>;

  getMany<K extends keyof TRoles>(
    keys: K[],
    asCollection?: boolean
  ): Record<K, RoleConfig<TRoles[K]>> | RoleConfigCollection<Pick<TRoles, K>> {
    if (asCollection) {
      const picked = {} as Pick<TRoles, K>;
      for (const key of keys) {
        if (key in this._roles) {
          picked[key] = this._roles[key];
        }
      }
      return new RoleConfigCollection(picked);
    }

    // Legacy behavior: return Record of RoleConfigs
    const result = {} as Record<K, RoleConfig<TRoles[K]>>;
    for (const key of keys) {
      result[key] = new RoleConfig(this._roles[key]);
    }
    return result;
  }

  /**
   * Get all role keys
   */
  keys(): (keyof TRoles)[] {
    return Object.keys(this._roles) as (keyof TRoles)[];
  }

  /**
   * Get all roles as RoleConfig instances
   */
  values(): RoleConfig<TRoles[keyof TRoles]>[] {
    return Object.values(this._roles).map(role => new RoleConfig(role));
  }

  /**
   * Get entries as [key, RoleConfig] pairs
   */
  entries(): [keyof TRoles, RoleConfig<TRoles[keyof TRoles]>][] {
    return Object.entries(this._roles).map(([key, role]) => [
      key as keyof TRoles,
      new RoleConfig(role as TRoles[keyof TRoles])
    ]);
  }

  /**
   * Add a new role
   */
  add<K extends string>(key: K, role: any): RolesConfig<TRoles & Record<K, any>> {
    return new RolesConfig({
      ...this._roles,
      [key]: role
    } as TRoles & Record<K, any>);
  }

  /**
   * Add multiple roles
   */
  addMany<T extends Record<string, any>>(roles: T): RolesConfig<TRoles & T> {
    return new RolesConfig({
      ...this._roles,
      ...roles
    } as TRoles & T);
  }

  /**
   * Check if a role exists
   */
  has(key: keyof TRoles): boolean {
    return key in this._roles;
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(roleKey: keyof TRoles, resource: string, action?: string): boolean {
    if (!this.has(roleKey)) {
      return false;
    }
    return this.get(roleKey).has(resource, action);
  }

  /**
   * Omit specific roles
   */
  omit<K extends keyof TRoles>(...keys: K[]): RolesConfig<Omit<TRoles, K>> {
    const filtered = { ...this._roles };
    for (const key of keys) {
      delete filtered[key];
    }
    return new RolesConfig(filtered as Omit<TRoles, K>);
  }

  /**
   * Pick specific roles
   */
  pick<K extends keyof TRoles>(...keys: K[]): RolesConfig<Pick<TRoles, K>> {
    const picked = {} as Pick<TRoles, K>;
    for (const key of keys) {
      if (key in this._roles) {
        picked[key] = this._roles[key];
      }
    }
    return new RolesConfig(picked);
  }

  /**
   * Filter roles based on predicate
   */
  filter(predicate: (key: keyof TRoles, role: TRoles[keyof TRoles]) => boolean): RolesConfig<Partial<TRoles>> {
    const filtered = {} as Partial<TRoles>;
    for (const [key, role] of Object.entries(this._roles)) {
      if (predicate(key as keyof TRoles, role as TRoles[keyof TRoles])) {
        filtered[key as keyof TRoles] = role as TRoles[keyof TRoles];
      }
    }
    return new RolesConfig(filtered);
  }

  /**
   * Map roles to new values
   */
  map<U>(mapper: (key: keyof TRoles, role: TRoles[keyof TRoles]) => U): U[] {
    return Object.entries(this._roles).map(([key, role]) =>
      mapper(key as keyof TRoles, role as TRoles[keyof TRoles])
    );
  }

  /**
   * Update a specific role
   */
  update<K extends keyof TRoles>(key: K, updater: (role: TRoles[K]) => TRoles[K]): RolesConfig<TRoles> {
    return new RolesConfig({
      ...this._roles,
      [key]: updater(this._roles[key])
    } as TRoles);
  }

  /**
   * Merge with another RolesConfig
   */
  merge<T extends Record<string, any>>(other: RolesConfig<T>): RolesConfig<TRoles & T> {
    return new RolesConfig({
      ...this._roles,
      ...other.build()
    } as TRoles & T);
  }

  /**
   * Check if roles are empty
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
   * Find role by predicate
   */
  find(predicate: (key: keyof TRoles, role: TRoles[keyof TRoles]) => boolean): [keyof TRoles, RoleConfig<TRoles[keyof TRoles]>] | undefined {
    for (const [key, role] of Object.entries(this._roles)) {
      if (predicate(key as keyof TRoles, role as TRoles[keyof TRoles])) {
        return [key as keyof TRoles, new RoleConfig(role as TRoles[keyof TRoles])];
      }
    }
    return undefined;
  }

  /**
   * Check if every role satisfies predicate
   */
  every(predicate: (key: keyof TRoles, role: TRoles[keyof TRoles]) => boolean): boolean {
    return Object.entries(this._roles).every(([key, role]) =>
      predicate(key as keyof TRoles, role as TRoles[keyof TRoles])
    );
  }

  /**
   * Check if some role satisfies predicate
   */
  some(predicate: (key: keyof TRoles, role: TRoles[keyof TRoles]) => boolean): boolean {
    return Object.entries(this._roles).some(([key, role]) =>
      predicate(key as keyof TRoles, role as TRoles[keyof TRoles])
    );
  }

  /**
   * Convert to plain object
   */
  toObject(): TRoles {
    return { ...this._roles };
  }

  /**
   * Get all roles that can perform action on resource
   */
  getRolesWithPermission(resource: string, action: string): (keyof TRoles)[] {
    return this.keys().filter(key => 
      this.get(key).has(resource, action)
    );
  }

  /**
   * Get roles that have read-only access
   */
  getReadOnlyRoles(): (keyof TRoles)[] {
    return this.keys().filter(key => {
      const roleConfig = this.get(key);
      const resources = roleConfig.getResources();
      return resources.every(resource => {
        const permissions = roleConfig.getPermissions(resource);
        return permissions && permissions.length === 1 && permissions[0] === 'read';
      });
    });
  }

  /**
   * Get roles that have write access
   */
  getWriteRoles(): (keyof TRoles)[] {
    return this.keys().filter(key => {
      const roleConfig = this.get(key);
      const resources = roleConfig.getResources();
      return resources.some(resource => {
        const permissions = roleConfig.getPermissions(resource);
        return permissions && permissions.some(p => ['create', 'update', 'delete'].includes(p as string));
      });
    });
  }

  /**
   * Clone the roles config
   */
  clone(): RolesConfig<TRoles> {
    return new RolesConfig({ ...this._roles });
  }

  /**
   * Verify roles structure
   */
  verify(): boolean {
    if (typeof this._roles !== 'object' || this._roles === null) {
      return false;
    }
    
    return Object.values(this._roles).every(role => 
      typeof role === 'object' && role !== null
    );
  }

  /**
   * Build and return the final roles object
   */
  build(): TRoles {
    return this._roles;
  }

  private get _roles(): TRoles {
    return this._value;
  }
}
