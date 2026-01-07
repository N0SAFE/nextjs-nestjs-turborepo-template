/**
 * Access Control Utilities
 * 
 * Framework-agnostic access control functions that can be used in any context.
 * These utilities work with user objects and provide role/permission checking.
 */

import { 
  type PlatformRole as RoleName, 
  type PlatformResource as ResourceName,
} from "./config";
import { 
  PermissionChecker, 
  hasPermission, 
  hasAllPermissions, 
  hasAnyPermission,
  type ResourcePermission,
} from "./utils";

/**
 * User type for access control - must have a role property
 */
export interface AccessControlUser {
  id: string;
  role?: string | null;
  [key: string]: unknown;
}

/**
 * Options for role checking
 */
export interface RoleCheckOptions {
  /**
   * Whether to throw an error if check fails
   * @default true
   */
  throwOnFail?: boolean;
  /**
   * Custom error message
   */
  errorMessage?: string;
  /**
   * Error code to use
   * @default "FORBIDDEN"
   */
  errorCode?: string;
}

/**
 * Options for permission checking
 */
export interface PermissionCheckOptions extends RoleCheckOptions {
  /**
   * Validate permission structure before checking
   * @default true
   */
  validateStructure?: boolean;
}

/**
 * Result type for access control checks
 */
export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  userRoles?: RoleName[];
}

/**
 * Access denied error for throwing in access control functions
 */
export class AccessDeniedError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code = "FORBIDDEN",
    statusCode = 403
  ) {
    super(message);
    this.name = "AccessDeniedError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Authentication required error
 */
export class AuthenticationRequiredError extends AccessDeniedError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthenticationRequiredError";
  }
}

/**
 * Access Control class with both static and instance methods.
 * 
 * Provides flexible access control for role and permission checking.
 * Can be used statically or as an instance with a user bound.
 * 
 * @example
 * ```typescript
 * // Static usage
 * AccessControl.allowRoles(user, ['admin', 'manager']);
 * 
 * // Instance usage
 * const ac = new AccessControl(user);
 * ac.allowRoles(['admin', 'manager']);
 * ```
 */
export class AccessControl {
  private readonly _user: AccessControlUser | null;
  private readonly _permissionChecker: PermissionChecker;

  /**
   * Create a new AccessControl instance.
   * @param user - User object (optional for static-only usage)
   */
  constructor(user?: AccessControlUser | null) {
    this._user = user ?? null;
    this._permissionChecker = new PermissionChecker(this._user);
  }

  /**
   * Get the user associated with this instance.
   */
  get user(): AccessControlUser | null {
    return this._user;
  }

  /**
   * Get the PermissionChecker instance for advanced operations.
   */
  get permissionChecker(): PermissionChecker {
    return this._permissionChecker;
  }

  // ============================================================================
  // STATIC HELPER METHODS
  // ============================================================================

  /**
   * Create an AccessDeniedError (can be caught and transformed by framework)
   */
  private static createForbiddenError(
    message: string,
    code = "FORBIDDEN"
  ): AccessDeniedError {
    return new AccessDeniedError(message, code, 403);
  }

  /**
   * Create an AuthenticationRequiredError
   */
  private static createUnauthorizedError(
    message?: string
  ): AuthenticationRequiredError {
    return new AuthenticationRequiredError(message);
  }

  // ============================================================================
  // STATIC METHODS - Role checks with user passed as argument
  // ============================================================================

  /**
   * Check if user has ANY of the specified roles (static version).
   * 
   * @param user - User object to check
   * @param roles - Roles to check (user needs at least one)
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowRoles(
    user: AccessControlUser | null | undefined,
    roles: RoleName[],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    const userRole = user.role;
    if (!userRole) {
      const reason = "User has no role assigned";
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason };
    }

    const userRoles = PermissionChecker.getUserRoles(userRole);
    const hasAnyRole = roles.some(role => PermissionChecker.hasRole(userRole, role));

    if (!hasAnyRole) {
      const reason = `User lacks required roles. Required: ${roles.join(", ")}. User has: ${userRoles.join(", ")}`;
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason, userRoles };
    }

    return { allowed: true, userRoles };
  }

  /**
   * Check if user has ALL of the specified roles (static version).
   * 
   * @param user - User object to check
   * @param roles - Roles to check (user needs all of them)
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowAllRoles(
    user: AccessControlUser | null | undefined,
    roles: RoleName[],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    const userRole = user.role;
    if (!userRole) {
      const reason = "User has no role assigned";
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason };
    }

    const userRoles = PermissionChecker.getUserRoles(userRole);
    const hasAllRoles = roles.every(role => PermissionChecker.hasRole(userRole, role));

    if (!hasAllRoles) {
      const reason = `User must have all roles. Required: ${roles.join(", ")}. User has: ${userRoles.join(", ")}`;
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason, userRoles };
    }

    return { allowed: true, userRoles };
  }

  /**
   * Check if user DOES NOT have any of the specified roles (static version).
   * 
   * @param user - User object to check
   * @param roles - Roles to check against (user should not have any of these)
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static denyRoles(
    user: AccessControlUser | null | undefined,
    roles: RoleName[],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    const userRole = user.role;
    if (!userRole) {
      // If user has no role, they can't have a denied role
      return { allowed: true };
    }

    const userRoles = PermissionChecker.getUserRoles(userRole);
    const hasDeniedRole = roles.some(role => PermissionChecker.hasRole(userRole, role));

    if (hasDeniedRole) {
      const reason = `User has forbidden roles. Forbidden: ${roles.join(", ")}. User has: ${userRoles.join(", ")}`;
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason, userRoles };
    }

    return { allowed: true, userRoles };
  }

  // ============================================================================
  // STATIC METHODS - Permission checks with user passed as argument
  // ============================================================================

  /**
   * Check if user has the required permission (static version).
   * Uses local role-based permission checking.
   * 
   * @param user - User object to check
   * @param permission - Permission to check (ResourcePermission or { resource, action })
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowPermission(
    user: AccessControlUser | null | undefined,
    permission: ResourcePermission | { resource: ResourceName; action: string },
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    const userRole = user.role;
    if (!userRole) {
      const reason = "User has no role assigned";
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason };
    }

    const hasRequiredPermission = hasPermission(user, permission);

    if (!hasRequiredPermission) {
      const permStr = 'resource' in permission 
        ? `${permission.resource}:${permission.action}` 
        : JSON.stringify(permission);
      const reason = `User lacks required permission: ${permStr}`;
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      const userRoles = PermissionChecker.getUserRoles(userRole);
      return { allowed: false, reason, userRoles };
    }

    const userRoles = PermissionChecker.getUserRoles(userRole);
    return { allowed: true, userRoles };
  }

  /**
   * Check if user has ALL the required permissions (static version).
   * 
   * @param user - User object to check
   * @param permissions - Array of permissions to check
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowAllPermissions(
    user: AccessControlUser | null | undefined,
    permissions: (ResourcePermission | { resource: ResourceName; action: string })[],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    const userRole = user.role;
    if (!userRole) {
      const reason = "User has no role assigned";
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason };
    }

    const hasAllRequiredPermissions = hasAllPermissions(user, permissions);

    if (!hasAllRequiredPermissions) {
      const reason = `User lacks some required permissions`;
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      const userRoles = PermissionChecker.getUserRoles(userRole);
      return { allowed: false, reason, userRoles };
    }

    const userRoles = PermissionChecker.getUserRoles(userRole);
    return { allowed: true, userRoles };
  }

  /**
   * Check if user has ANY of the required permissions (static version).
   * 
   * @param user - User object to check
   * @param permissions - Array of permissions to check
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowAnyPermission(
    user: AccessControlUser | null | undefined,
    permissions: (ResourcePermission | { resource: ResourceName; action: string })[],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    const userRole = user.role;
    if (!userRole) {
      const reason = "User has no role assigned";
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason };
    }

    const hasAnyRequiredPermission = hasAnyPermission(user, permissions);

    if (!hasAnyRequiredPermission) {
      const reason = `User lacks any of the required permissions`;
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      const userRoles = PermissionChecker.getUserRoles(userRole);
      return { allowed: false, reason, userRoles };
    }

    const userRoles = PermissionChecker.getUserRoles(userRole);
    return { allowed: true, userRoles };
  }

  // ============================================================================
  // STATIC METHODS - Combined checks
  // ============================================================================

  /**
   * Check if user is the resource owner or has admin access (static version).
   * 
   * @param user - User object to check
   * @param resourceOwnerId - ID of the resource owner
   * @param adminRoles - Roles that have admin access (default: ['admin'])
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowOwnerOrRoles(
    user: AccessControlUser | null | undefined,
    resourceOwnerId: string,
    adminRoles: RoleName[] = ['admin'],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    // Check if user is the owner
    if (user.id === resourceOwnerId) {
      return { allowed: true };
    }

    // Check if user has admin role
    return AccessControl.allowRoles(user, adminRoles, options);
  }

  /**
   * Combined check: user needs specified roles AND permission (static version).
   * 
   * @param user - User object to check
   * @param roles - Required roles (user needs at least one)
   * @param permission - Required permission
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowRolesAndPermission(
    user: AccessControlUser | null | undefined,
    roles: RoleName[],
    permission: ResourcePermission | { resource: ResourceName; action: string },
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    // Check roles first (don't throw yet)
    const roleResult = AccessControl.allowRoles(user, roles, { ...options, throwOnFail: false });
    if (!roleResult.allowed) {
      if (options.throwOnFail !== false) {
        throw AccessControl.createForbiddenError(
          options.errorMessage ?? roleResult.reason ?? "Role check failed",
          options.errorCode ?? "FORBIDDEN"
        );
      }
      return roleResult;
    }

    // Then check permission
    return AccessControl.allowPermission(user, permission, options);
  }

  /**
   * Combined check: user needs specified roles OR permission (static version).
   * 
   * @param user - User object to check
   * @param roles - Allowed roles (user needs at least one)
   * @param permission - Allowed permission
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static allowRolesOrPermission(
    user: AccessControlUser | null | undefined,
    roles: RoleName[],
    permission: ResourcePermission | { resource: ResourceName; action: string },
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    // Try roles first (don't throw)
    const roleResult = AccessControl.allowRoles(user, roles, { ...options, throwOnFail: false });
    if (roleResult.allowed) {
      return roleResult;
    }

    // If roles failed, try permission
    const permResult = AccessControl.allowPermission(user, permission, {
      ...options,
      throwOnFail: false
    });
    
    if (permResult.allowed) {
      return permResult;
    }

    // Both failed
    const permStr = 'resource' in permission 
      ? `${permission.resource}:${permission.action}` 
      : JSON.stringify(permission);
    const reason = `User needs either roles (${roles.join(", ")}) or permission (${permStr})`;
    if (options.throwOnFail !== false) {
      throw AccessControl.createForbiddenError(
        options.errorMessage ?? reason,
        options.errorCode ?? "FORBIDDEN"
      );
    }
    return { allowed: false, reason };
  }

  /**
   * Custom access control with a predicate function (static version).
   * 
   * @param user - User object to check
   * @param predicate - Function that returns true if access should be allowed
   * @param options - Check options
   * @returns AccessControlResult with allowed status and details
   */
  static customAccess<T extends AccessControlUser>(
    user: T | null | undefined,
    predicate: (user: T) => boolean,
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    const { throwOnFail = true, errorMessage, errorCode = "FORBIDDEN" } = options;

    if (!user) {
      const reason = "User not authenticated";
      if (throwOnFail) {
        throw AccessControl.createUnauthorizedError(errorMessage ?? reason);
      }
      return { allowed: false, reason };
    }

    const allowed = predicate(user);
    
    if (!allowed) {
      const reason = "Custom access check failed";
      if (throwOnFail) {
        throw AccessControl.createForbiddenError(errorMessage ?? reason, errorCode);
      }
      return { allowed: false, reason };
    }

    return { allowed: true };
  }

  /**
   * Require authentication (static version).
   * @throws AuthenticationRequiredError if not authenticated
   */
  static requireAuth<T extends AccessControlUser>(
    user: T | null | undefined,
    errorMessage?: string
  ): T {
    if (!user) {
      throw AccessControl.createUnauthorizedError(errorMessage);
    }
    return user;
  }

  /**
   * Check if user is authenticated (static version).
   */
  static isAuthenticated(user: AccessControlUser | null | undefined): user is AccessControlUser {
    return !!user;
  }

  // ============================================================================
  // INSTANCE METHODS - Use user from constructor
  // ============================================================================

  /**
   * Ensure this instance has a user set.
   * @throws Error if no user is set
   */
  private requireUser(): AccessControlUser {
    if (!this._user) {
      throw new Error("AccessControl: No user set. Create instance with a user or use static methods.");
    }
    return this._user;
  }

  /**
   * Check if user has ANY of the specified roles.
   */
  allowRoles(roles: RoleName[], options: RoleCheckOptions = {}): AccessControlResult {
    return AccessControl.allowRoles(this._user, roles, options);
  }

  /**
   * Check if user has ALL of the specified roles.
   */
  allowAllRoles(roles: RoleName[], options: RoleCheckOptions = {}): AccessControlResult {
    return AccessControl.allowAllRoles(this._user, roles, options);
  }

  /**
   * Check if user DOES NOT have any of the specified roles.
   */
  denyRoles(roles: RoleName[], options: RoleCheckOptions = {}): AccessControlResult {
    return AccessControl.denyRoles(this._user, roles, options);
  }

  /**
   * Check if user has the required permission.
   */
  allowPermission(
    permission: ResourcePermission | { resource: ResourceName; action: string },
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    return AccessControl.allowPermission(this._user, permission, options);
  }

  /**
   * Check if user has ALL the required permissions.
   */
  allowAllPermissions(
    permissions: (ResourcePermission | { resource: ResourceName; action: string })[],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    return AccessControl.allowAllPermissions(this._user, permissions, options);
  }

  /**
   * Check if user has ANY of the required permissions.
   */
  allowAnyPermission(
    permissions: (ResourcePermission | { resource: ResourceName; action: string })[],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    return AccessControl.allowAnyPermission(this._user, permissions, options);
  }

  /**
   * Check if user is the resource owner or has admin roles.
   */
  allowOwnerOrRoles(
    resourceOwnerId: string,
    adminRoles: RoleName[] = ['admin'],
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    return AccessControl.allowOwnerOrRoles(this._user, resourceOwnerId, adminRoles, options);
  }

  /**
   * Combined check: user needs specified roles AND permission.
   */
  allowRolesAndPermission(
    roles: RoleName[],
    permission: ResourcePermission | { resource: ResourceName; action: string },
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    return AccessControl.allowRolesAndPermission(this._user, roles, permission, options);
  }

  /**
   * Combined check: user needs specified roles OR permission.
   */
  allowRolesOrPermission(
    roles: RoleName[],
    permission: ResourcePermission | { resource: ResourceName; action: string },
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    return AccessControl.allowRolesOrPermission(this._user, roles, permission, options);
  }

  /**
   * Custom access control with a predicate function.
   */
  customAccess(
    predicate: (user: AccessControlUser) => boolean,
    options: RoleCheckOptions = {}
  ): AccessControlResult {
    return AccessControl.customAccess(this._user, predicate, options);
  }

  /**
   * Require authentication.
   * @throws AuthenticationRequiredError if not authenticated
   */
  requireAuth(errorMessage?: string): AccessControlUser {
    return AccessControl.requireAuth(this._user, errorMessage);
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    return AccessControl.isAuthenticated(this._user);
  }

  /**
   * Get user roles.
   */
  getUserRoles(): RoleName[] {
    if (!this._user?.role) return [];
    return PermissionChecker.getUserRoles(this._user.role);
  }
}

// ============================================================================
// STANDALONE FUNCTIONS (for convenience - wrappers around static methods)
// ============================================================================

/**
 * Check if user has ANY of the specified roles.
 * @see AccessControl.allowRoles
 */
export function allowRoles(
  user: AccessControlUser | null | undefined,
  roles: RoleName[],
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.allowRoles(user, roles, options);
}

/**
 * Check if user has ALL of the specified roles.
 * @see AccessControl.allowAllRoles
 */
export function allowAllRoles(
  user: AccessControlUser | null | undefined,
  roles: RoleName[],
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.allowAllRoles(user, roles, options);
}

/**
 * Check if user DOES NOT have any of the specified roles.
 * @see AccessControl.denyRoles
 */
export function denyRoles(
  user: AccessControlUser | null | undefined,
  roles: RoleName[],
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.denyRoles(user, roles, options);
}

/**
 * Check if user has the required permission.
 * @see AccessControl.allowPermission
 */
export function allowPermission(
  user: AccessControlUser | null | undefined,
  permission: ResourcePermission | { resource: ResourceName; action: string },
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.allowPermission(user, permission, options);
}

/**
 * Check if user has ALL the required permissions.
 * @see AccessControl.allowAllPermissions
 */
export function allowAllPermissions(
  user: AccessControlUser | null | undefined,
  permissions: (ResourcePermission | { resource: ResourceName; action: string })[],
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.allowAllPermissions(user, permissions, options);
}

/**
 * Check if user has ANY of the required permissions.
 * @see AccessControl.allowAnyPermission
 */
export function allowAnyPermission(
  user: AccessControlUser | null | undefined,
  permissions: (ResourcePermission | { resource: ResourceName; action: string })[],
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.allowAnyPermission(user, permissions, options);
}

/**
 * Check if user is the resource owner or has admin roles.
 * @see AccessControl.allowOwnerOrRoles
 */
export function allowOwnerOrRoles(
  user: AccessControlUser | null | undefined,
  resourceOwnerId: string,
  adminRoles?: RoleName[],
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.allowOwnerOrRoles(user, resourceOwnerId, adminRoles, options);
}

/**
 * Custom access control with a predicate function.
 * @see AccessControl.customAccess
 */
export function customAccess<T extends AccessControlUser>(
  user: T | null | undefined,
  predicate: (user: T) => boolean,
  options?: RoleCheckOptions
): AccessControlResult {
  return AccessControl.customAccess(user, predicate, options);
}

/**
 * Require authentication.
 * @see AccessControl.requireAuth
 */
export function requireAuth<T extends AccessControlUser>(
  user: T | null | undefined,
  errorMessage?: string
): T {
  return AccessControl.requireAuth(user, errorMessage);
}

/**
 * Check if user is authenticated.
 * @see AccessControl.isAuthenticated
 */
export function isAuthenticated(
  user: AccessControlUser | null | undefined
): user is AccessControlUser {
  return AccessControl.isAuthenticated(user);
}
