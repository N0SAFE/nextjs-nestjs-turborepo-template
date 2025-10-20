/**
 * RoleConfig - Manages a single role's permissions
 * Provides utility methods to manipulate and query role permissions
 */
export class RoleConfig<TRole = any> {
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
  has(resource: string, action?: string): boolean {
    if (typeof this._role !== 'object' || this._role === null) {
      return false;
    }
    
    const roleObj = this._role as any;
    if (!(resource in roleObj)) {
      return false;
    }
    
    if (action === undefined) {
      return true;
    }
    
    const actions = roleObj[resource];
    return Array.isArray(actions) && actions.includes(action);
  }

  /**
   * Check if role has all specified permissions
   */
  hasAll(permissions: Record<string, string[]>): boolean {
    return Object.entries(permissions).every(([resource, actions]) =>
      actions.every(action => this.has(resource, action))
    );
  }

  /**
   * Check if role has any of the specified permissions
   */
  hasAny(permissions: Record<string, string[]>): boolean {
    return Object.entries(permissions).some(([resource, actions]) =>
      actions.some(action => this.has(resource, action))
    );
  }

  /**
   * Get permissions for a specific resource
   */
  getPermissions(resource: string): readonly string[] | undefined {
    if (typeof this._role !== 'object' || this._role === null) {
      return undefined;
    }
    
    const roleObj = this._role as any;
    return roleObj[resource];
  }

  /**
   * Get all resources this role has permissions for
   */
  getResources(): string[] {
    if (typeof this._role !== 'object' || this._role === null) {
      return [];
    }
    
    return Object.keys(this._role as any);
  }

  /**
   * Check if role is empty (no permissions)
   */
  get isEmpty(): boolean {
    if (typeof this._role !== 'object' || this._role === null) {
      return true;
    }
    
    return Object.keys(this._role as any).length === 0;
  }

  /**
   * Get number of resources with permissions
   */
  get size(): number {
    if (typeof this._role !== 'object' || this._role === null) {
      return 0;
    }
    
    return Object.keys(this._role as any).length;
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
  filter(predicate: (resource: string, actions: readonly string[]) => boolean): Record<string, readonly string[]> {
    if (typeof this._role !== 'object' || this._role === null) {
      return {};
    }
    
    const result: Record<string, readonly string[]> = {};
    const roleObj = this._role as any;
    
    for (const [resource, actions] of Object.entries(roleObj)) {
      if (Array.isArray(actions) && predicate(resource, actions)) {
        result[resource] = actions;
      }
    }
    
    return result;
  }

  /**
   * Map role permissions
   */
  map<U>(mapper: (resource: string, actions: readonly string[]) => U): U[] {
    if (typeof this._role !== 'object' || this._role === null) {
      return [];
    }
    
    const roleObj = this._role as any;
    return Object.entries(roleObj)
      .filter(([, actions]) => Array.isArray(actions))
      .map(([resource, actions]) => mapper(resource, actions as readonly string[]));
  }

  /**
   * Get only read permissions
   */
  readOnly(): Record<string, readonly string[]> {
    return this.filter((_, actions) => 
      actions.length === 1 && actions[0] === 'read'
    );
  }

  /**
   * Get write permissions (create, update, delete)
   */
  writeOnly(): Record<string, readonly string[]> {
    return this.filter((_, actions) =>
      actions.some(a => ['create', 'update', 'delete'].includes(a as string))
    );
  }

  /**
   * Check if role can perform action on resource
   */
  can(resource: string, action: string): boolean {
    return this.has(resource, action);
  }

  /**
   * Check if role cannot perform action on resource
   */
  cannot(resource: string, action: string): boolean {
    return !this.has(resource, action);
  }
}
