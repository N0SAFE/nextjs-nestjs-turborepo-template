import type { Resource, Permission } from "./system/types";
import { permissionConfig, schemas, ROLE_NAMES, RESOURCE_NAMES, type RoleName, type ResourceName, type ActionsForResource } from "./config";

const statement = permissionConfig.statement;
const roles = permissionConfig.roles;

/**
 * Error thrown when an invalid role name is accessed
 */
export class InvalidRoleError extends Error {
  constructor(roleName: string) {
    const validRoles = ROLE_NAMES.join(', ');
    super(`Invalid role "${roleName}". Valid roles are: ${validRoles}`);
    this.name = 'InvalidRoleError';
  }
}

/**
 * Type-safe role accessor interface
 */
interface RolesAccessor {
  /**
   * Get a role by name with runtime validation.
   * Throws InvalidRoleError if the role doesn't exist.
   * @param roleName - The role name to validate and return
   * @throws InvalidRoleError if the role doesn't exist
   */
  get<T extends string>(roleName: T): T;
  
  /**
   * Check if a role exists without throwing.
   * @param roleName - The role name to check
   */
  exists(roleName: string): roleName is RoleName;
  
  /**
   * Get all valid role names.
   */
  all(): RoleName[];
  
  /**
   * Validate a role name using Zod schema.
   * Returns the role name if valid, throws if invalid.
   * @param roleName - The role name to validate
   * @throws Error if validation fails
   */
  parse<T extends string>(roleName: T): T;
  
  /**
   * Safely validate a role name using Zod schema.
   * Returns { success: true, data: roleName } if valid, { success: false, error } if invalid.
   * @param roleName - The role name to validate
   */
  safeParse(roleName: string): { success: true; data: RoleName } | { success: false; error: Error };
}

/**
 * Create the Roles accessor object with dynamic properties for each role
 */
function createRolesAccessor(): RolesAccessor & { [K in RoleName]: K } {
  const roleKeys = [...ROLE_NAMES];
  
  const accessor: RolesAccessor = {
    get<T extends string>(roleName: T): T {
      if (!Object.prototype.hasOwnProperty.call(roles, roleName)) {
        throw new InvalidRoleError(roleName);
      }
      return roleName;
    },
    
    exists(roleName: string): roleName is RoleName {
      return Object.prototype.hasOwnProperty.call(roles, roleName);
    },
    
    all(): RoleName[] {
      return [...roleKeys];
    },
    
    parse<T extends string>(roleName: T): T {
      const result = schemas.roleNames.safeParse(roleName);
      if (!result.success) {
        throw new InvalidRoleError(roleName);
      }
      return roleName;
    },
    
    safeParse(roleName: string): { success: true; data: RoleName } | { success: false; error: Error } {
      const result = schemas.roleNames.safeParse(roleName);
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: new InvalidRoleError(roleName) };
    },
  };
  
  // Add property accessors for each role
  for (const roleKey of roleKeys) {
    Object.defineProperty(accessor, roleKey, {
      get() {
        return roleKey;
      },
      enumerable: true,
      configurable: false,
    });
  }
  
  return accessor as RolesAccessor & { [K in RoleName]: K };
}

/**
 * Type-safe role accessor object.
 * 
 * Provides compile-time and runtime safety for role names:
 * - Direct property access for known roles (e.g., `Roles.admin`)
 * - `Roles.get(name)` for dynamic access with runtime validation
 * - `Roles.exists(name)` for checking without throwing
 * - `Roles.all()` to get all valid role names
 * - `Roles.parse(name)` for Zod schema validation
 * - `Roles.safeParse(name)` for safe Zod validation
 * 
 * @example
 * ```typescript
 * // Type-safe direct access
 * const role = Roles.admin; // 'admin' (literal type)
 * 
 * // Dynamic access with validation
 * const dynamicRole = Roles.get(userInput); // Throws if invalid
 * 
 * // Check existence
 * if (Roles.exists(userInput)) {
 *   // userInput is now typed as a valid role
 * }
 * 
 * // Get all roles
 * const allRoles = Roles.all(); // ['admin', 'user', ...]
 * ```
 */
export const Roles = createRolesAccessor();

/**
 * Error thrown when an invalid resource name is accessed
 */
export class InvalidResourceError extends Error {
  constructor(resourceName: string) {
    const validResources = RESOURCE_NAMES.join(', ');
    super(`Invalid resource "${resourceName}". Valid resources are: ${validResources}`);
    this.name = 'InvalidResourceError';
  }
}

/**
 * Error thrown when an invalid action for a resource is accessed
 */
export class InvalidActionError extends Error {
  constructor(resourceName: string, actionName: string, validActions: readonly string[]) {
    super(`Invalid action "${actionName}" for resource "${resourceName}". Valid actions are: ${validActions.join(', ')}`);
    this.name = 'InvalidActionError';
  }
}

/**
 * Permission object returned by Resources accessor
 */
export interface ResourcePermission<R extends ResourceName = ResourceName, A extends string = string> {
  readonly resource: R;
  readonly action: A;
}

/**
 * Type representing a resource accessor with its actions
 */
type ResourceActionsAccessor<R extends ResourceName> = {
  /** The resource name */
  readonly name: R;
  /** Get all valid actions for this resource */
  readonly actions: readonly ActionsForResource<R>[];
} & {
  /** Direct access to action names as properties - returns ResourcePermission object */
  readonly [K in ActionsForResource<R>]: ResourcePermission<R, K>;
};

/**
 * Type-safe resources accessor interface
 */
interface ResourcesAccessor {
  /**
   * Get a resource by name with runtime validation.
   * Throws InvalidResourceError if the resource doesn't exist.
   * @param resourceName - The resource name to validate and return
   * @throws InvalidResourceError if the resource doesn't exist
   */
  get<T extends string>(resourceName: T): T;
  
  /**
   * Check if a resource exists without throwing.
   * @param resourceName - The resource name to check
   */
  exists(resourceName: string): resourceName is ResourceName;
  
  /**
   * Get all valid resource names.
   */
  all(): ResourceName[];
  
  /**
   * Get all actions for a specific resource.
   * @param resourceName - The resource to get actions for
   * @throws InvalidResourceError if the resource doesn't exist
   */
  actionsFor<R extends ResourceName>(resourceName: R): readonly ActionsForResource<R>[];
  
  /**
   * Check if an action is valid for a resource.
   * @param resourceName - The resource to check
   * @param actionName - The action to validate
   */
  hasAction(resourceName: ResourceName, actionName: string): boolean;
  
  /**
   * Validate a resource and action combination.
   * @param resourceName - The resource to validate
   * @param actionName - The action to validate
   * @throws InvalidResourceError if the resource doesn't exist
   * @throws InvalidActionError if the action doesn't exist for the resource
   */
  validateAction(resourceName: string, actionName: string): ResourcePermission;
}

/**
 * Create resource accessor for a specific resource
 */
function createResourceActionsAccessor<R extends ResourceName>(resourceName: R): ResourceActionsAccessor<R> {
  const resourceActions = statement[resourceName] as readonly ActionsForResource<R>[];
  
  const accessor = {
    name: resourceName,
    actions: resourceActions,
  } as ResourceActionsAccessor<R>;
  
  // Add property accessors for each action - returns { resource, action } object
  for (const action of resourceActions) {
    Object.defineProperty(accessor, action, {
      get(): ResourcePermission<R> {
        return { resource: resourceName, action } as ResourcePermission<R>;
      },
      enumerable: true,
      configurable: false,
    });
  }
  
  return accessor;
}

/**
 * Create the Resources accessor object with dynamic properties for each resource
 */
function createResourcesAccessor(): ResourcesAccessor & { [K in ResourceName]: ResourceActionsAccessor<K> } {
  const resourceKeys = [...RESOURCE_NAMES];
  
  const accessor: ResourcesAccessor = {
    get<T extends string>(resourceName: T): T {
      if (!Object.prototype.hasOwnProperty.call(statement, resourceName)) {
        throw new InvalidResourceError(resourceName);
      }
      return resourceName;
    },
    
    exists(resourceName: string): resourceName is ResourceName {
      return Object.prototype.hasOwnProperty.call(statement, resourceName);
    },
    
    all(): ResourceName[] {
      return [...resourceKeys];
    },
    
    actionsFor<R extends ResourceName>(resourceName: R): readonly ActionsForResource<R>[] {
      if (!Object.prototype.hasOwnProperty.call(statement, resourceName)) {
        throw new InvalidResourceError(resourceName);
      }
      return statement[resourceName] as readonly ActionsForResource<R>[];
    },
    
    hasAction(resourceName: ResourceName, actionName: string): boolean {
      if (!Object.prototype.hasOwnProperty.call(statement, resourceName)) {
        return false;
      }
      const actions = statement[resourceName];
      return actions.includes(actionName as never);
    },
    
    validateAction(resourceName: ResourceName, actionName: string): ResourcePermission {
      if (!Object.prototype.hasOwnProperty.call(statement, resourceName)) {
        throw new InvalidResourceError(resourceName);
      }
      const validResource = resourceName;
      const actions = statement[validResource];
      if (!actions.includes(actionName as never)) {
        throw new InvalidActionError(resourceName, actionName, actions);
      }
      return { resource: validResource, action: actionName };
    },
  };
  
  // Add property accessors for each resource
  for (const resourceKey of resourceKeys) {
    Object.defineProperty(accessor, resourceKey, {
      get() {
        return createResourceActionsAccessor(resourceKey);
      },
      enumerable: true,
      configurable: false,
    });
  }
  
  return accessor as ResourcesAccessor & { [K in ResourceName]: ResourceActionsAccessor<K> };
}

/**
 * Type-safe resources accessor object.
 * 
 * Provides compile-time and runtime safety for resource names and actions:
 * - Direct property access for known resources (e.g., `Resources.capsule`)
 * - Each resource has direct property access for its actions (e.g., `Resources.capsule.read`)
 * - `Resources.get(name)` for dynamic access with runtime validation
 * - `Resources.exists(name)` for checking without throwing
 * - `Resources.all()` to get all valid resource names
 * - `Resources.actionsFor(resource)` to get all actions for a resource
 * - `Resources.hasAction(resource, action)` to check if an action is valid
 * - `Resources.validateAction(resource, action)` to validate and get typed result
 * 
 * @example
 * ```typescript
 * // Type-safe direct access to resource
 * const resource = Resources.capsule; // { name: 'capsule', actions: [...], read: {...}, ... }
 * 
 * // Type-safe direct access to action - returns ResourcePermission object!
 * const perm = Resources.capsule.read; // { resource: 'capsule', action: 'read' }
 * 
 * // Use with hasPermission (recommended usage)
 * hasPermission(user, Resources.capsule.read); // Check if user can read capsules
 * hasPermission(user, Resources.capsule.delete); // Check if user can delete capsules
 * 
 * // Check if user has any permission on a resource
 * hasPermission(user, Resources.capsule); // true if user has any capsule permission
 * 
 * // Get all actions for a resource
 * const actions = Resources.capsule.actions; // ['list', 'read', 'create', 'update', 'delete']
 * 
 * // Dynamic access with validation
 * const dynamicResource = Resources.get(userInput); // Throws if invalid
 * 
 * // Check existence
 * if (Resources.exists(userInput)) {
 *   // userInput is now typed as a valid resource
 * }
 * ```
 */
export const Resources = createResourcesAccessor();

/**
 * User type for permission checking
 */
interface UserWithRole {
  role?: string | null;
}

/**
 * Permission requirement type
 * Can be:
 * - A ResourcePermission object from Resources accessor (e.g., Resources.capsule.read)
 * - A ResourceActionsAccessor to check if user has any permission on resource (e.g., Resources.capsule)
 * - An explicit { resource, action } object
 * - A string action (checks if user has this action on any resource)
 */
type PermissionRequirement = 
  | ResourcePermission
  | string 
  | { resource: ResourceName; action: string }
  | { name: ResourceName; actions: readonly string[] };

/**
 * Check if a user has permission to perform an action.
 * 
 * @param user - The user to check permissions for (must have a `role` property)
 * @param requirement - The permission requirement to check
 * @returns true if the user has the permission, false otherwise
 * 
 * @example
 * ```typescript
 * // Check using Resources accessor (recommended)
 * hasPermission(user, Resources.capsule.read);  // Returns { resource: 'capsule', action: 'read' }
 * hasPermission(user, Resources.capsule.delete);
 * 
 * // Check using explicit resource/action
 * hasPermission(user, { resource: 'capsule', action: 'read' });
 * 
 * // Check if user can perform any action on a resource
 * hasPermission(user, Resources.capsule); // Checks if user has any permission on capsule
 * ```
 */
export function hasPermission(user: UserWithRole, requirement: PermissionRequirement): boolean {
  const userRole = user.role;
  
  if (!userRole) {
    return false;
  }
  
  // Check if the role exists (handles dynamic role names)
  if (!Object.prototype.hasOwnProperty.call(roles, userRole)) {
    return false;
  }
  
  // Get the role object from Better Auth roles (cast is safe after hasOwnProperty check)
  const roleObj = roles[userRole as RoleName];
  
  // Get the role's statements (permissions)
  const roleStatements = 'statements' in roleObj 
    ? (roleObj as { statements: Record<string, readonly string[]> }).statements
    : roleObj as unknown as Record<string, readonly string[]>;
  
  // Handle string action - need a resource context, default to checking all resources
  if (typeof requirement === 'string') {
    // When just an action string is provided, check if any resource allows this action
    for (const [, actions] of Object.entries(roleStatements)) {
      if (Array.isArray(actions) && actions.includes(requirement)) {
        return true;
      }
    }
    return false;
  }
  
  // Handle ResourceActionsAccessor (when passing Resources.capsule directly)
  if ('name' in requirement && 'actions' in requirement) {
    const resourcePerms = roleStatements[requirement.name];
    if (!resourcePerms || !Array.isArray(resourcePerms)) {
      return false;
    }
    // User has permission if they have at least one action on this resource
    return resourcePerms.length > 0;
  }
  
  // Handle ResourcePermission or { resource, action } object
  if ('resource' in requirement && 'action' in requirement) {
    const resourcePerms = roleStatements[requirement.resource];
    if (!resourcePerms || !Array.isArray(resourcePerms)) {
      return false;
    }
    return resourcePerms.includes(requirement.action);
  }
  
  return false;
}

/**
 * Check if a user has permission to perform a specific action on a resource.
 * 
 * @param user - The user to check permissions for (must have a `role` property)
 * @param resource - The resource name
 * @param action - The action to check
 * @returns true if the user has the permission, false otherwise
 * 
 * @example
 * ```typescript
 * hasResourcePermission(user, 'capsule', 'read');
 * hasResourcePermission(user, Resources.capsule.name, Resources.capsule.read);
 * ```
 */
export function hasResourcePermission(
  user: UserWithRole, 
  resource: ResourceName, 
  action: string
): boolean {
  return hasPermission(user, { resource, action });
}

/**
 * Check if a user has all the specified permissions.
 * 
 * @param user - The user to check permissions for
 * @param requirements - Array of permission requirements
 * @returns true if the user has all permissions, false otherwise
 */
export function hasAllPermissions(
  user: UserWithRole, 
  requirements: PermissionRequirement[]
): boolean {
  return requirements.every(req => hasPermission(user, req));
}

/**
 * Check if a user has any of the specified permissions.
 * 
 * @param user - The user to check permissions for
 * @param requirements - Array of permission requirements
 * @returns true if the user has at least one permission, false otherwise
 */
export function hasAnyPermission(
  user: UserWithRole, 
  requirements: PermissionRequirement[]
): boolean {
  return requirements.some(req => hasPermission(user, req));
}

/**
 * Permission checker class with both static and instance methods.
 * 
 * Supports two usage patterns:
 * 
 * 1. **Static methods** - Pass user as first argument:
 * ```typescript
 * PermissionChecker.checkPermission(user, Resources.capsule.read);
 * PermissionChecker.hasRole(user.role, 'admin');
 * ```
 * 
 * 2. **Instance methods** - Create instance with user, then call methods:
 * ```typescript
 * const checker = new PermissionChecker(user);
 * checker.checkPermission(Resources.capsule.read);
 * checker.hasRole('admin');
 * ```
 * 
 * @example
 * ```typescript
 * // Static usage
 * if (PermissionChecker.checkPermission(user, Resources.capsule.read)) {
 *   // User can read capsules
 * }
 * 
 * // Instance usage
 * const checker = new PermissionChecker(session.user);
 * if (checker.checkPermission(Resources.capsule.delete)) {
 *   // User can delete capsules
 * }
 * 
 * // Chained checks with instance
 * const checker = new PermissionChecker(user);
 * const canRead = checker.checkPermission(Resources.capsule.read);
 * const canWrite = checker.checkPermission(Resources.capsule.update);
 * const isAdmin = checker.hasRole('admin');
 * ```
 */
export class PermissionChecker {
  private readonly _user: UserWithRole | null;

  /**
   * Create a new PermissionChecker instance.
   * @param user - User object with role property (optional for static-only usage)
   */
  constructor(user?: UserWithRole | null) {
    this._user = user ?? null;
  }

  /**
   * Get the user associated with this checker instance.
   * @returns The user object or null if not set
   */
  get user(): UserWithRole | null {
    return this._user;
  }

  // ============================================================================
  // STATIC METHODS - Utility methods that don't require a user
  // ============================================================================

  /**
   * Validate a permission object structure.
   * Checks that all resources and actions are valid.
   * @param permissions - Permission object to validate
   * @returns true if valid, false otherwise
   */
  static validatePermission<T extends Resource>(
    permissions: Permission<T>
  ): boolean {
    for (const [resource, actions] of Object.entries(permissions)) {
      if (!Resources.exists(resource)) {
        return false;
      }

      for (const action of actions as string[]) {
        if (!Resources.hasAction(resource, action)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if a string is a valid role name.
   * @param role - String to check
   * @returns Type guard for RoleName
   */
  static isValidRoleName(role: string): role is RoleName {
    return Roles.exists(role);
  }

  /**
   * Check if a string is a valid resource name.
   * @param resource - String to check
   * @returns Type guard for ResourceName
   */
  static isValidResource(resource: string): resource is ResourceName {
    return Resources.exists(resource);
  }

  /**
   * Check if an action is valid for a specific resource.
   * @param resource - Resource name
   * @param action - Action to check
   * @returns true if action is valid for resource
   */
  static isValidActionForResource(resource: ResourceName, action: string): boolean {
    return Resources.hasAction(resource, action);
  }

  /**
   * Get all valid actions for a resource.
   * @param resource - Resource name
   * @returns Array of valid actions
   */
  static getActionsForResource<R extends ResourceName>(resource: R): readonly ActionsForResource<R>[] {
    if (!Resources.exists(resource)) return [];
    return Resources.actionsFor(resource);
  }

  /**
   * Get all valid resource names.
   * @returns Array of resource names
   */
  static getAllResources(): ResourceName[] {
    return Resources.all();
  }

  /**
   * Get all valid role names.
   * @returns Array of role names
   */
  static getAllRoles(): RoleName[] {
    return Roles.all();
  }

  /**
   * Extract valid roles from a comma-separated role string.
   * @param userRoles - Comma-separated role string
   * @returns Array of valid RoleName values
   */
  static extractRoles(userRoles: string): RoleName[] {
    return userRoles
      .split(",")
      .map((r) => r.trim())
      .filter((r): r is RoleName => Roles.exists(r));
  }

  /**
   * Get user roles from a role string.
   * Alias for extractRoles.
   * @param userRoleString - Comma-separated role string
   * @returns Array of valid RoleName values
   */
  static getUserRoles(userRoleString: string): RoleName[] {
    return PermissionChecker.extractRoles(userRoleString);
  }

  // ============================================================================
  // STATIC METHODS - User-based operations (pass user as first argument)
  // ============================================================================

  /**
   * Check if a user has a specific role (static version).
   * Supports comma-separated role strings or arrays.
   * @param userRoles - User's role(s) as string or array
   * @param roleName - Role to check for
   * @returns true if user has the role
   */
  static hasRole(userRoles: string | string[], roleName: string): boolean {
    if (typeof userRoles === "string") {
      return userRoles
        .split(",")
        .map((r) => r.trim())
        .includes(roleName);
    }
    return userRoles.includes(roleName);
  }

  /**
   * Check if a user has a specific permission (static version).
   * @param user - User object with role property
   * @param permission - Permission to check (from Resources accessor or explicit)
   * @returns true if user has permission
   * 
   * @example
   * ```typescript
   * PermissionChecker.checkPermission({ role: 'admin' }, Resources.capsule.read);
   * PermissionChecker.checkPermission({ role: 'admin' }, { resource: 'capsule', action: 'read' });
   * ```
   */
  static checkPermission(user: UserWithRole, permission: PermissionRequirement): boolean {
    return hasPermission(user, permission);
  }

  /**
   * Check if a user has all specified permissions (static version).
   * @param user - User object with role property
   * @param permissions - Array of permissions to check
   * @returns true if user has all permissions
   */
  static checkAllPermissions(user: UserWithRole, permissions: PermissionRequirement[]): boolean {
    return hasAllPermissions(user, permissions);
  }

  /**
   * Check if a user has any of the specified permissions (static version).
   * @param user - User object with role property
   * @param permissions - Array of permissions to check
   * @returns true if user has at least one permission
   */
  static checkAnyPermission(user: UserWithRole, permissions: PermissionRequirement[]): boolean {
    return hasAnyPermission(user, permissions);
  }

  /**
   * Check if a user has permission on a specific resource action (static version).
   * @param user - User object with role property
   * @param resource - Resource name
   * @param action - Action name
   * @returns true if user has permission
   */
  static checkResourcePermission(user: UserWithRole, resource: ResourceName, action: string): boolean {
    return hasResourcePermission(user, resource, action);
  }

  /**
   * Get roles for a user (static version).
   * @param user - User object with role property
   * @returns Array of valid RoleName values
   */
  static getRoles(user: UserWithRole): RoleName[] {
    if (!user.role) return [];
    return PermissionChecker.extractRoles(user.role);
  }

  /**
   * Check if a user role has higher privilege than required role.
   * Note: This is a placeholder - implement based on your role hierarchy.
   */
  static hasHigherPrivilege(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole: RoleName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _requiredRole: RoleName
  ): boolean {
    return true;
  }

  /**
   * Get the privilege level of a role.
   * Note: This is a placeholder - implement based on your role hierarchy.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getRoleLevel(_role: RoleName): number {
    return 0;
  }

  // ============================================================================
  // INSTANCE METHODS - User-based operations (use user from constructor)
  // ============================================================================

  /**
   * Ensure this instance has a user set.
   * @throws Error if no user is set
   */
  private requireUser(): UserWithRole {
    if (!this._user) {
      throw new Error("PermissionChecker: No user set. Create instance with a user or use static methods.");
    }
    return this._user;
  }

  /**
   * Check if the instance user has a specific role.
   * @param roleName - Role to check for
   * @returns true if user has the role
   * 
   * @example
   * ```typescript
   * const checker = new PermissionChecker(user);
   * if (checker.hasRole('admin')) {
   *   // User is admin
   * }
   * ```
   */
  hasRole(roleName: string): boolean {
    const user = this.requireUser();
    if (!user.role) return false;
    return PermissionChecker.hasRole(user.role, roleName);
  }

  /**
   * Check if the instance user has a specific permission.
   * @param permission - Permission to check (from Resources accessor or explicit)
   * @returns true if user has permission
   * 
   * @example
   * ```typescript
   * const checker = new PermissionChecker(user);
   * if (checker.checkPermission(Resources.capsule.read)) {
   *   // User can read capsules
   * }
   * ```
   */
  checkPermission(permission: PermissionRequirement): boolean {
    return hasPermission(this.requireUser(), permission);
  }

  /**
   * Check if the instance user has all specified permissions.
   * @param permissions - Array of permissions to check
   * @returns true if user has all permissions
   * 
   * @example
   * ```typescript
   * const checker = new PermissionChecker(user);
   * if (checker.checkAllPermissions([Resources.capsule.read, Resources.capsule.update])) {
   *   // User can read and update capsules
   * }
   * ```
   */
  checkAllPermissions(permissions: PermissionRequirement[]): boolean {
    return hasAllPermissions(this.requireUser(), permissions);
  }

  /**
   * Check if the instance user has any of the specified permissions.
   * @param permissions - Array of permissions to check
   * @returns true if user has at least one permission
   * 
   * @example
   * ```typescript
   * const checker = new PermissionChecker(user);
   * if (checker.checkAnyPermission([Resources.capsule.delete, Resources.user.delete])) {
   *   // User can delete something
   * }
   * ```
   */
  checkAnyPermission(permissions: PermissionRequirement[]): boolean {
    return hasAnyPermission(this.requireUser(), permissions);
  }

  /**
   * Check if the instance user has permission on a specific resource action.
   * @param resource - Resource name
   * @param action - Action name
   * @returns true if user has permission
   * 
   * @example
   * ```typescript
   * const checker = new PermissionChecker(user);
   * if (checker.checkResourcePermission('capsule', 'read')) {
   *   // User can read capsules
   * }
   * ```
   */
  checkResourcePermission(resource: ResourceName, action: string): boolean {
    return hasResourcePermission(this.requireUser(), resource, action);
  }

  /**
   * Get roles for the instance user.
   * @returns Array of valid RoleName values
   * 
   * @example
   * ```typescript
   * const checker = new PermissionChecker(user);
   * const roles = checker.getRoles(); // ['admin', 'user']
   * ```
   */
  getRoles(): RoleName[] {
    const user = this.requireUser();
    if (!user.role) return [];
    return PermissionChecker.extractRoles(user.role);
  }

  /**
   * Check if the instance user has higher privilege than required role.
   * @param requiredRole - Role to compare against
   * @returns true if user has higher privilege
   */
  hasHigherPrivilege(requiredRole: RoleName): boolean {
    const user = this.requireUser();
    if (!user.role) return false;
    const userRoles = this.getRoles();
    return userRoles.some(role => PermissionChecker.hasHigherPrivilege(role, requiredRole));
  }

  /**
   * Get the highest privilege level of the instance user.
   * @returns Privilege level number
   */
  getHighestRoleLevel(): number {
    const roles = this.getRoles();
    if (roles.length === 0) return -1;
    return Math.max(...roles.map(role => PermissionChecker.getRoleLevel(role)));
  }
}

export function createPermission<T extends Resource>(
  permissions: Permission<T>
): Permission<T> {
  if (!PermissionChecker.validatePermission(permissions)) {
    throw new Error("Invalid permission structure provided");
  }
  return permissions;
}
