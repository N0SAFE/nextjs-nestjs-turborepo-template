/**
 * RoleConfig - Manages a single role's permissions
 * Provides utility methods to manipulate and query role permissions
 */
export class RoleConfig<TRole = Record<string, readonly string[]>> {
  constructor(private readonly _role: TRole) {}

  /**
   * Get the role object
   */
  all(): TRole {
    return this._role;
  }

  /**
   * Build and return the role
   */
  build(): TRole {
    return this._role;
  }

  /**
   * Get raw role object
   */
  get raw(): TRole {
    return this._role;
  }

  /**
   * Check if role has specific permission
   * (Implementation depends on role structure)
   */
  has(resource: keyof TRole, action?: string): boolean {
    if (typeof this._role !== 'object' || this._role === null) {
      return false;
    }
    
    const roleObj = this._role;
    if (!(resource in roleObj)) {
      return false;
    }
    
    // If no action parameter provided (not undefined explicitly), check if resource exists
    // Using arguments.length to distinguish between has('resource') and has('resource', undefined)
    if (arguments.length === 1) {
      return true;
    }
    
    // If action is not a string or is explicitly undefined, return false
    if (typeof action !== 'string') {
      return false;
    }
    
    const actions = roleObj[resource];
    return Array.isArray(actions) && actions.includes(action);
  }

  /**
   * Check if role has all specified permissions
   */
  hasAll(permissions: { resource: keyof TRole; action: string }[]): boolean {
    return permissions.every(({ resource, action }) =>
      this.has(resource, action)
    );
  }

  /**
   * Check if role has any of the specified permissions
   */
  hasAny(permissions: { resource: keyof TRole; action: string }[]): boolean {
    return permissions.some(({ resource, action }) =>
      this.has(resource, action)
    );
  }

  /**
   * Get permissions for a specific resource
   */
  getPermissions<R extends keyof TRole>(resource: R): TRole[R] {
    if (typeof this._role !== 'object' || this._role === null) {
      return [] as TRole[R];
    }
    
    const roleObj: TRole = this._role;
    return roleObj[resource] ?? [] as TRole[R];
  }

  /**
   * Get all resources this role has permissions for
   */
  getResources(): string[] {
    if (typeof this._role !== 'object' || this._role === null) {
      return [];
    }
    
    return Object.keys(this._role);
  }

  /**
   * Check if role is empty (no permissions)
   */
  get isEmpty(): boolean {
    if (typeof this._role !== 'object' || this._role === null) {
      return true;
    }
    
    return Object.keys(this._role).length === 0;
  }

  /**
   * Get number of resources with permissions
   */
  get size(): number {
    if (typeof this._role !== 'object' || this._role === null) {
      return 0;
    }
    
    return Object.keys(this._role).length;
  }

  /**
   * Convert to plain object
   */
  toObject(): TRole {
    return this._role;
  }

  /**
   * Check if role equals another role
   */
  equals(other: RoleConfig<TRole>): boolean {
    return JSON.stringify(this._role) === JSON.stringify(other._role);
  }

  /**
   * Filter resources based on predicate
   */
  filter<R extends keyof TRole>(predicate: (resource: R, actions: readonly string[]) => boolean): RoleConfig<Pick<TRole, R>> {
    if (typeof this._role !== 'object' || this._role === null) {
      return new RoleConfig({} as Pick<TRole, R>);
    }
    
    const result: Partial<Pick<TRole, R>> = {};
    const roleObj = this._role;
    
    for (const [resource, actions] of Object.entries(roleObj)) {
      if (Array.isArray(actions) && predicate(resource as R, actions)) {
        result[resource as R] = actions as TRole[R];
      }
    }
    
    return new RoleConfig(result as Pick<TRole, R>);
  }

  /**
   * Map role permissions
   */
  map<U>(mapper: (resource: string, actions: readonly string[]) => U): U[] {
    if (typeof this._role !== 'object' || this._role === null) {
      return [];
    }
    
    const roleObj = this._role;
    return Object.entries(roleObj)
      .filter(([, actions]) => Array.isArray(actions))
      .map(([resource, actions]) => mapper(resource, actions as readonly string[]));
  }

  /**
   * Get only read permissions
   */
  readOnly(): RoleConfig<Pick<TRole, keyof TRole>> {
    return this.filter((_, actions) => 
      actions.length === 1 && actions[0] === 'read'
    );
  }

  /**
   * Get write permissions (create, update, delete)
   */
  writeOnly(): RoleConfig<Pick<TRole, keyof TRole>> {
    return this.filter((_, actions) =>
      actions.some(a => ['create', 'update', 'delete'].includes(a))
    );
  }

  /**
   * Check if role can perform action on resource
   */
  can(resource: keyof TRole, action: string): boolean {
    return this.has(resource, action);
  }

  /**
   * Check if role cannot perform action on resource
   */
  cannot(resource: keyof TRole, action: string): boolean {
    return !this.has(resource, action);
  }
}
