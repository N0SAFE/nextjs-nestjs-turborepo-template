import type { ExecutionContext } from "@nestjs/common";
import { APIError } from "better-auth/api";
import type { Auth } from "@/core/modules/auth/types/auth";
import type { Session } from "@repo/auth";
import {
  type Permission,
  type RoleName,
  PermissionChecker,
  AccessControl,
  AccessDeniedError,
  AuthenticationRequiredError,
  type AccessControlUser,
  type RoleCheckOptions,
  type AccessControlResult,
} from "@repo/auth/permissions";

/**
 * Type for request with session
 */
export type RequestWithSession = Request & {
  session: Session | null;
  user?: Session["user"];
};

// Re-export types from the auth package for convenience
export type { RoleCheckOptions, AccessControlResult, AccessControlUser };

/**
 * Options for permission checking (extends base options)
 */
export interface PermissionCheckOptions extends RoleCheckOptions {
  /**
   * Validate permission structure before checking
   * @default true
   */
  validateStructure?: boolean;
}

/**
 * NestJS-specific Access Control that extends the framework-agnostic AccessControl class.
 * Provides ExecutionContext-based user extraction and Better Auth API integration.
 * 
 * @example
 * ```typescript
 * // Static usage with context
 * const user = NestAccessControl.getUserFromContext(context);
 * const ac = new NestAccessControl(user);
 * ac.allowRoles(['admin', 'manager']);
 * 
 * // Or use the standalone functions
 * allowRoles(context, ['admin', 'manager']);
 * ```
 */
export class NestAccessControl extends AccessControl {
  /**
   * Create NestAccessControl from ExecutionContext
   */
  static fromContext(context: ExecutionContext): NestAccessControl {
    const user = NestAccessControl.getUserFromContext(context);
    return new NestAccessControl(user);
  }

  /**
   * Get user from execution context
   */
  static getUserFromContext(
    context: ExecutionContext
  ): Auth["$Infer"]["Session"]["user"] | undefined {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    return request.session?.user;
  }

  /**
   * Get user role from execution context
   */
  static getUserRoleFromContext(context: ExecutionContext): string | undefined {
    const user = this.getUserFromContext(context);
    return user?.role ?? undefined;
  }

  /**
   * Get user roles array from execution context
   */
  static getUserRolesFromContext(context: ExecutionContext): RoleName[] {
    const userRole = this.getUserRoleFromContext(context);
    if (!userRole) return [];
    return PermissionChecker.getUserRoles(userRole);
  }

  /**
   * Check if user is authenticated from context
   */
  static isAuthenticatedFromContext(context: ExecutionContext): boolean {
    const user = this.getUserFromContext(context);
    return !!user;
  }

  /**
   * Require authentication from context and throw APIError if not authenticated
   */
  static requireAuthFromContext(
    context: ExecutionContext,
    errorMessage?: string
  ): Auth["$Infer"]["Session"]["user"] {
    const user = this.getUserFromContext(context);
    if (!user) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? "Authentication required",
      });
    }
    return user;
  }
}

/**
 * Convert AccessControl errors to Better Auth APIError format.
 * Use this to wrap AccessControl checks in NestJS handlers.
 */
export function convertToAPIError(error: unknown): never {
  if (error instanceof AuthenticationRequiredError) {
    throw new APIError(401, {
      code: error.code,
      message: error.message,
    });
  }
  if (error instanceof AccessDeniedError) {
    // Cast statusCode to valid HTTP status - AccessDeniedError always uses 403
    throw new APIError(403, {
      code: error.code,
      message: error.message,
    });
  }
  throw error;
}

/**
 * Run an access control check and convert errors to APIError.
 * @param check - Function that performs the access control check
 * @returns The result of the check
 * @throws APIError if access is denied
 */
export function runAccessCheck<T>(check: () => T): T {
  try {
    return check();
  } catch (error) {
    convertToAPIError(error);
  }
}

// ============================================================================
// STANDALONE FUNCTIONS - NestJS-specific wrappers using AccessControl from package
// ============================================================================

/**
 * Check if user has ANY of the specified roles
 *
 * @param context - Execution context
 * @param roles - Roles to check (user needs at least one)
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = allowRoles(context, ['admin', 'manager']);
 * if (!result.allowed) {
 *   // Handle unauthorized access
 * }
 * ```
 */
export function allowRoles(
  context: ExecutionContext,
  roles: RoleName[],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const user = NestAccessControl.getUserFromContext(context);
  return runAccessCheck(() => AccessControl.allowRoles(user, roles, options));
}

/**
 * Check if user has ALL of the specified roles
 *
 * @param context - Execution context
 * @param roles - Roles to check (user needs all of them)
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = allowAllRoles(context, ['admin', 'superuser']);
 * if (!result.allowed) {
 *   // User doesn't have all required roles
 * }
 * ```
 */
export function allowAllRoles(
  context: ExecutionContext,
  roles: RoleName[],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const user = NestAccessControl.getUserFromContext(context);
  return runAccessCheck(() => AccessControl.allowAllRoles(user, roles, options));
}

/**
 * Check if user DOES NOT have any of the specified roles (inverse check)
 *
 * @param context - Execution context
 * @param roles - Roles to check against (user should not have any of these)
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = denyRoles(context, ['banned', 'suspended']);
 * if (!result.allowed) {
 *   // User has a forbidden role
 * }
 * ```
 */
export function denyRoles(
  context: ExecutionContext,
  roles: RoleName[],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const user = NestAccessControl.getUserFromContext(context);
  return runAccessCheck(() => AccessControl.denyRoles(user, roles, options));
}

/**
 * Check if user has the required permissions using Better Auth API
 *
 * @param context - Execution context
 * @param auth - Better Auth instance
 * @param permissions - Permissions to check
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = await allowPermissions(context, auth, {
 *   project: ['create', 'update'],
 *   user: ['list']
 * });
 * if (!result.allowed) {
 *   // User lacks required permissions
 * }
 * ```
 */
export async function allowPermissions(
  context: ExecutionContext,
  auth: Auth,
  permissions: Permission,
  options: PermissionCheckOptions = {}
): Promise<AccessControlResult> {
  const {
    throwOnFail = true,
    errorMessage,
    errorCode = "FORBIDDEN",
    validateStructure = true,
  } = options;

  const user = NestAccessControl.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (throwOnFail) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  // Validate permission structure
  if (validateStructure && !PermissionChecker.validatePermission(permissions)) {
    const reason = "Invalid permission structure";
    if (throwOnFail) {
      throw new APIError(500, {
        code: "INTERNAL_SERVER_ERROR",
        message: reason,
      });
    }
    return { allowed: false, reason };
  }

  try {
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: user.id,
        permissions,
      },
    });

    if (!hasPermission.success) {
      const reason = `User lacks required permissions: ${JSON.stringify(permissions)}`;
      if (throwOnFail) {
        throw new APIError(403, {
          code: errorCode,
          message: errorMessage ?? reason,
        });
      }
      return { allowed: false, reason };
    }

    return { allowed: true };
  } catch (error) {
    if (error instanceof APIError && !throwOnFail) {
      return { allowed: false, reason: error.message };
    }
    throw error;
  }
}

/**
 * Check if user has ANY of the specified permissions (at least one resource-action pair)
 *
 * @param context - Execution context
 * @param auth - Better Auth instance
 * @param permissions - Array of permission objects to check
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = await allowAnyPermissions(context, auth, [
 *   { project: ['create'] },
 *   { organization: ['manage-members'] }
 * ]);
 * // User needs either project:create OR organization:manage-members
 * ```
 */
export async function allowAnyPermissions(
  context: ExecutionContext,
  auth: Auth,
  permissions: Permission[],
  options: PermissionCheckOptions = {}
): Promise<AccessControlResult> {
  const {
    throwOnFail = true,
    errorMessage,
    errorCode = "FORBIDDEN",
    validateStructure = true,
  } = options;

  const user = NestAccessControl.getUserFromContext(context);

  if (!user) {
    const reason = "User not authenticated";
    if (throwOnFail) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: errorMessage ?? reason,
      });
    }
    return { allowed: false, reason };
  }

  // Check each permission set, return true if any passes
  for (const permission of permissions) {
    if (validateStructure && !PermissionChecker.validatePermission(permission)) {
      continue;
    }

    try {
      const hasPermission = await auth.api.userHasPermission({
        body: {
          userId: user.id,
          permissions: permission,
        },
      });

      if (hasPermission.success) {
        return { allowed: true };
      }
    } catch {
      // Continue to next permission check
      continue;
    }
  }

  const reason = `User lacks any of the required permission sets: ${JSON.stringify(permissions)}`;
  if (throwOnFail) {
    throw new APIError(403, {
      code: errorCode,
      message: errorMessage ?? reason,
    });
  }
  return { allowed: false, reason };
}

/**
 * Combined check: user needs specified roles AND permissions
 *
 * @param context - Execution context
 * @param auth - Better Auth instance
 * @param roles - Required roles (user needs at least one)
 * @param permissions - Required permissions
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = await allowRolesAndPermissions(
 *   context,
 *   auth,
 *   ['manager', 'admin'],
 *   { project: ['delete'] }
 * );
 * // User needs (manager OR admin) AND project:delete permission
 * ```
 */
export async function allowRolesAndPermissions(
  context: ExecutionContext,
  auth: Auth,
  roles: RoleName[],
  permissions: Permission,
  options: PermissionCheckOptions = {}
): Promise<AccessControlResult> {
  // Check roles first using package AccessControl
  const user = NestAccessControl.getUserFromContext(context);
  const roleResult = AccessControl.allowRoles(user, roles, {
    ...options,
    throwOnFail: false,
  });

  if (!roleResult.allowed) {
    if (options.throwOnFail !== false) {
      throw new APIError(403, {
        code: options.errorCode ?? "FORBIDDEN",
        message:
          options.errorMessage ?? roleResult.reason ?? "Role check failed",
      });
    }
    return roleResult;
  }

  // Then check permissions via Better Auth API
  const permResult = await allowPermissions(context, auth, permissions, options);
  return permResult;
}

/**
 * Combined check: user needs specified roles OR permissions (flexible access)
 *
 * @param context - Execution context
 * @param auth - Better Auth instance
 * @param roles - Allowed roles (user needs at least one)
 * @param permissions - Allowed permissions
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = await allowRolesOrPermissions(
 *   context,
 *   auth,
 *   ['admin'],
 *   { project: ['update'] }
 * );
 * // User needs admin role OR project:update permission
 * ```
 */
export async function allowRolesOrPermissions(
  context: ExecutionContext,
  auth: Auth,
  roles: RoleName[],
  permissions: Permission,
  options: PermissionCheckOptions = {}
): Promise<AccessControlResult> {
  // Try roles first using package AccessControl (don't throw)
  const user = NestAccessControl.getUserFromContext(context);
  const roleResult = AccessControl.allowRoles(user, roles, {
    ...options,
    throwOnFail: false,
  });

  if (roleResult.allowed) {
    return roleResult;
  }

  // If roles failed, try permissions via Better Auth API
  const permResult = await allowPermissions(context, auth, permissions, {
    ...options,
    throwOnFail: false,
  });

  if (permResult.allowed) {
    return permResult;
  }

  // Both failed
  const reason = `User needs either roles (${roles.join(", ")}) or permissions (${JSON.stringify(permissions)})`;
  if (options.throwOnFail !== false) {
    throw new APIError(403, {
      code: options.errorCode ?? "FORBIDDEN",
      message: options.errorMessage ?? reason,
    });
  }
  return { allowed: false, reason };
}

/**
 * Check if user is the resource owner or has admin access
 *
 * @param context - Execution context
 * @param resourceOwnerId - ID of the resource owner
 * @param adminRoles - Roles that have admin access (default: ['admin'])
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = allowOwnerOrAdmin(context, post.authorId);
 * if (!result.allowed) {
 *   // User is neither owner nor admin
 * }
 * ```
 */
export function allowOwnerOrAdmin(
  context: ExecutionContext,
  resourceOwnerId: string,
  adminRoles: RoleName[] = ["admin"],
  options: RoleCheckOptions = {}
): AccessControlResult {
  const user = NestAccessControl.getUserFromContext(context);
  return runAccessCheck(() =>
    AccessControl.allowOwnerOrRoles(user, resourceOwnerId, adminRoles, options)
  );
}

/**
 * Custom access control with a predicate function
 *
 * @param context - Execution context
 * @param predicate - Function that returns true if access should be allowed
 * @param options - Check options
 * @returns AccessControlResult with allowed status and details
 *
 * @example
 * ```typescript
 * const result = customAccess(context, (user) => {
 *   return user.email.endsWith('@company.com');
 * }, { errorMessage: 'Only company emails allowed' });
 * ```
 */
export function customAccess(
  context: ExecutionContext,
  predicate: (user: Auth["$Infer"]["Session"]["user"]) => boolean,
  options: RoleCheckOptions = {}
): AccessControlResult {
  const user = NestAccessControl.getUserFromContext(context);
  return runAccessCheck(() =>
    AccessControl.customAccess(user, predicate, options)
  );
}

