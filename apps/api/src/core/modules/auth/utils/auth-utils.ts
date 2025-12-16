import { PermissionChecker, type Permission, type RoleName, type ResourcePermission } from "@repo/auth/permissions";
import type { Auth } from "@/auth";
import { ORPCError } from "@orpc/client";
import { AdminPluginUtils, OrganizationPluginUtils } from "../plugin-utils";

/**
 * User session type from Better Auth
 */
export interface UserSession {
  session: Auth["$Infer"]["Session"]["session"];
  user: Auth["$Infer"]["Session"]["user"];
}

/**
 * Access control options for programmatic auth checks
 */
export interface AccessOptions {
  /** Required roles - user must have ANY of these */
  roles?: RoleName[];
  /** Required roles - user must have ALL of these */
  allRoles?: RoleName[];
  /** Required permissions */
  permissions?: Permission;
}

/**
 * Permission requirement type - can be:
 * - A ResourcePermission object from Resources accessor (e.g., Resources.capsule.read)
 */
export type PermissionRequirement = ResourcePermission 

/**
 * Global auth utilities class that provides authentication and authorization helpers
 * Can be used in both ORPC handlers (via context.auth) and regular NestJS services
 * 
 * Uses PermissionChecker internally for consistent permission validation.
 * 
 * @example
 * ```ts
 * // In ORPC handler
 * const auth = assertAuthenticated(context.auth);
 * if (await auth.hasPermission(permission)) {
 *   // ...
 * }
 * 
 * // In NestJS service
 * const utils = new AuthUtils(session, auth);
 * if (await utils.hasPermission(permission)) {
 *   // ...
 * }
 * 
 * // Via AuthService dependency injection
 * private readonly authService = inject(AuthService);
 * if (await this.authService.hasPermission(session, permission)) {
 *   // ...
 * }
 * 
 * // Using Resources accessor for type-safe permissions
 * import { Resources } from "@repo/auth/permissions";
 * if (utils.checkPermission(Resources.capsule.read)) {
 *   // User can read capsules
 * }
 * ```
 */
export class AuthUtils {
  private readonly _permissionChecker: PermissionChecker;
  private readonly _adminUtils: AdminPluginUtils;
  private readonly _orgUtils: OrganizationPluginUtils;

  constructor(
    private readonly _session: UserSession | null,
    private readonly auth: Auth,
    private readonly headers?: Headers
  ) {
    console.log(_session)
    this._permissionChecker = new PermissionChecker(this._session?.user ?? null);
    
    // Initialize plugin utilities with headers
    this._adminUtils = new AdminPluginUtils(auth, headers ?? new Headers());
    this._orgUtils = new OrganizationPluginUtils(auth, headers ?? new Headers());
  }

  get isLoggedIn(): boolean {
    return this._session !== null;
  }

  get session(): Auth["$Infer"]["Session"]["session"] | null {
    return this._session?.session ?? null;
  }

  get user(): UserSession["user"] | null {
    return this._session?.user ?? null;
  }

  /**
   * Get the PermissionChecker instance for advanced permission operations
   */
  get permissionChecker(): PermissionChecker {
    return this._permissionChecker;
  }

  /**
   * Access admin plugin utilities with auto-injected headers
   * 
   * @example
   * ```typescript
   * // In ORPC handler
   * const auth = assertAuthenticated(context.auth);
   * const user = await auth.admin.createUser({
   *   email: 'user@example.com',
   *   password: 'secure123',
   *   name: 'John Doe',
   *   role: 'user'
   * });
   * ```
   */
  get admin(): AdminPluginUtils {
    return this._adminUtils;
  }

  /**
   * Access organization plugin utilities with auto-injected headers
   * 
   * @example
   * ```typescript
   * // In ORPC handler
   * const auth = assertAuthenticated(context.auth);
   * const org = await auth.org.createOrganization({
   *   name: 'Acme Corp',
   *   slug: 'acme-corp',
   *   userId: auth.user.id
   * });
   * ```
   */
  get org(): OrganizationPluginUtils {
    return this._orgUtils;
  }

  /**
   * Require user to be authenticated
   * @throws ORPCError with UNAUTHORIZED code if not authenticated
   * @returns UserSession
   */
  requireAuth(): UserSession {
    if (!this._session) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }
    return this._session;
  }

  /**
   * Require user to have specific role(s)
   * @param roles - User must have ANY of these roles
   * @throws ORPCError with UNAUTHORIZED code if not authenticated
   * @throws ORPCError with FORBIDDEN code if missing required roles
   * @returns UserSession
   */
  requireRole(...roles: RoleName[]): UserSession {
    const session = this.requireAuth();

    const userRole = session.user.role;
    if (!userRole) {
      throw new ORPCError("FORBIDDEN", {
        message: "No role assigned to user",
      });
    }

    const hasRequiredRole = roles.some((role) =>
      this._permissionChecker.hasRole(role)
    );

    if (!hasRequiredRole) {
      const userRoles = this._permissionChecker.getRoles();
      throw new ORPCError("FORBIDDEN", {
        message: `Access denied. Required roles: ${roles.join(", ")}. User roles: ${userRoles.join(", ")}`,
      });
    }

    return session;
  }

  /**
   * Require user to have ALL specified roles
   * @param roles - User must have ALL of these roles
   * @throws ORPCError with UNAUTHORIZED code if not authenticated
   * @throws ORPCError with FORBIDDEN code if missing required roles
   * @returns UserSession
   */
  requireAllRoles(...roles: RoleName[]): UserSession {
    const session = this.requireAuth();

    const userRole = session.user.role;
    if (!userRole) {
      throw new ORPCError("FORBIDDEN", {
        message: "No role assigned to user",
      });
    }

    const hasAllRequiredRoles = roles.every((role) =>
      this._permissionChecker.hasRole(role)
    );

    if (!hasAllRequiredRoles) {
      const userRoles = this._permissionChecker.getRoles();
      throw new ORPCError("FORBIDDEN", {
        message: `Access denied. All required roles: ${roles.join(", ")}. User roles: ${userRoles.join(", ")}`,
      });
    }

    return session;
  }

  /**
   * Require user to have specific permissions
   * @param permissions - Required permission object
   * @throws ORPCError with UNAUTHORIZED code if not authenticated
   * @throws ORPCError with FORBIDDEN code if missing required permissions
   * @returns UserSession
   */
  async requirePermissions(permissions: Permission): Promise<UserSession> {
    const session = this.requireAuth();

    // Validate permission structure
    if (!PermissionChecker.validatePermission(permissions)) {
      throw new Error("Invalid permission configuration");
    }

    try {
      const hasPermission = await this.auth.api.userHasPermission({
        body: {
          userId: session.user.id,
          permissions,
        },
      });

      if (!hasPermission.success) {
        throw new ORPCError("FORBIDDEN", {
          message: `Access denied. Missing required permissions: ${JSON.stringify(permissions)}`,
        });
      }

      return session;
    } catch (error) {
      if (error instanceof ORPCError && (error.code === "FORBIDDEN" || error.code === "UNAUTHORIZED")) {
        throw error;
      }

      console.error("Permission check failed:", error);
      throw new Error("Permission validation failed");
    }
  }

  /**
   * Check if user has access based on options
   * @param options - Access control options (roles, allRoles, permissions)
   * @returns true if user has access, false otherwise
   */
  async access(options: AccessOptions): Promise<boolean> {
    try {
      // Check if user is authenticated (required for all access checks)
      if (!this._session) {
        return false;
      }

      // Check roles (user needs ANY of these)
      if (options.roles && options.roles.length > 0) {
        const userRole = this._session.user.role;
        if (!userRole) {
          return false;
        }

        const hasAnyRole = options.roles.some((role) =>
          this._permissionChecker.hasRole(role)
        );

        if (!hasAnyRole) {
          return false;
        }
      }

      // Check all roles (user needs ALL of these)
      if (options.allRoles && options.allRoles.length > 0) {
        const userRole = this._session.user.role;
        if (!userRole) {
          return false;
        }

        const hasAllRoles = options.allRoles.every((role) =>
          this._permissionChecker.hasRole(role)
        );

        if (!hasAllRoles) {
          return false;
        }
      }

      // Check permissions
      if (options.permissions) {
        if (!PermissionChecker.validatePermission(options.permissions)) {
          return false;
        }

        const hasPermission = await this.auth.api.userHasPermission({
          body: {
            userId: this._session.user.id,
            permissions: options.permissions,
          },
        });

        if (!hasPermission.success) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Access check failed:", error);
      return false;
    }
  }

  /**
   * Get user roles as array
   * @returns Array of role names (empty if not authenticated or no role)
   */
  getRoles(): RoleName[] {
    if (!this._session?.user.role) {
      return [];
    }
    return this._permissionChecker.getRoles();
  }

  /**
   * Check if user has specific role
   * @param role - Role to check
   * @returns true if user has role, false otherwise
   */
  hasRole(role: RoleName): boolean {
    if (!this._session?.user.role) {
      return false;
    }
    return this._permissionChecker.hasRole(role);
  }

  /**
   * Check if user has specific permission using Resources accessor.
   * Uses the instance PermissionChecker for local role-based check.
   * 
   * @param permission - Permission to check (use Resources accessor)
   * @returns true if user has permission, false otherwise
   * 
   * @example
   * ```typescript
   * import { Resources } from "@repo/auth/permissions";
   * 
   * if (utils.checkPermission(Resources.capsule.read)) {
   *   // User can read capsules
   * }
   * ```
   */
  checkPermission(permission: PermissionRequirement): boolean {
    if (!this._session) {
      return false;
    }
    return this._permissionChecker.checkPermission(permission);
  }

  /**
   * Check if user has all specified permissions using Resources accessor.
   * @param permissions - Array of permissions to check
   * @returns true if user has all permissions, false otherwise
   */
  checkAllPermissions(permissions: PermissionRequirement[]): boolean {
    if (!this._session) {
      return false;
    }
    return this._permissionChecker.checkAllPermissions(permissions);
  }

  /**
   * Check if user has any of the specified permissions using Resources accessor.
   * @param permissions - Array of permissions to check
   * @returns true if user has at least one permission, false otherwise
   */
  checkAnyPermission(permissions: PermissionRequirement[]): boolean {
    if (!this._session) {
      return false;
    }
    return this._permissionChecker.checkAnyPermission(permissions);
  }

  /**
   * Check if user has specific permission (via Better Auth API).
   * This method calls Better Auth's userHasPermission API for server-side validation.
   * 
   * @param permission - Permission to check (Better Auth format)
   * @returns true if user has permission, false otherwise
   */
  async hasPermission(permission: Permission): Promise<boolean> {
    if (!this._session) {
      return false;
    }

    if (!PermissionChecker.validatePermission(permission)) {
      return false;
    }

    try {
      const result = await this.auth.api.userHasPermission({
        body: {
          userId: this._session.user.id,
          permissions: permission,
        },
      });

      return result.success;
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  }
}

/**
 * Empty auth utilities for unauthenticated contexts
 * Used as placeholder before authentication middleware runs
 */
export class AuthUtilsEmpty {
  readonly isLoggedIn = false;
  readonly session = null;
  readonly user = null;
  readonly permissionChecker = new PermissionChecker(null);
  
  requireAuth(): UserSession {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Authentication required",
    });
  }
  
  requireRole(..._roles: RoleName[]): UserSession {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Authentication required",
    });
  }
  
  requireAllRoles(..._roles: RoleName[]): UserSession {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Authentication required",
    });
  }
  
  requirePermissions(_permissions: Permission): Promise<UserSession> {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Authentication required",
    });
  }
  
  access(_options: AccessOptions): Promise<boolean> {
    return Promise.resolve(false);
  }
  
  getRoles(): RoleName[] {
    return [];
  }
  
  hasRole(_role: RoleName): boolean {
    return false;
  }

  checkPermission(_permission: PermissionRequirement): boolean {
    return false;
  }

  checkAllPermissions(_permissions: PermissionRequirement[]): boolean {
    return false;
  }

  checkAnyPermission(_permissions: PermissionRequirement[]): boolean {
    return false;
  }
  
  hasPermission(_permission: Permission): Promise<boolean> {
    return Promise.resolve(false);
  }
}
