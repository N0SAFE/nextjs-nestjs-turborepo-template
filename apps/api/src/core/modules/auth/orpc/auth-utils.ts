import { PermissionChecker, type Permission, type RoleName } from "@repo/auth/permissions";
import type { Auth } from "@/auth";
import type { AccessOptions, ORPCAuthContext, UserSession } from "./types";
import { ORPCError } from "@orpc/client";

/**
 * Auth utilities class that provides authentication and authorization helpers
 * for ORPC handlers through the context.auth object
 */
export class AuthUtils implements ORPCAuthContext {
  constructor(
    private readonly _session: UserSession | null,
    private readonly auth: Auth,
  ) {}

  get isLoggedIn(): boolean {
    return this._session !== null;
  }

  get session(): Auth["$Infer"]["Session"]["session"] | null {
    return this._session?.session ?? null;
  }

  get user(): UserSession["user"] | null {
    return this._session?.user ?? null;
  }

  requireAuth(): UserSession {
    if (!this._session) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }
    return this._session;
  }

  requireRole(...roles: RoleName[]): UserSession {
    const session = this.requireAuth();

    const userRole = session.user.role;
    if (!userRole) {
      throw new ORPCError("FORBIDDEN", {
        message: "No role assigned to user",
      });
    }

    const hasRequiredRole = roles.some((role) =>
      PermissionChecker.hasRole(userRole, role)
    );

    if (!hasRequiredRole) {
      const userRoles = PermissionChecker.getUserRoles(userRole);
      throw new ORPCError("FORBIDDEN", {
        message: `Access denied. Required roles: ${roles.join(", ")}. User roles: ${userRoles.join(", ")}`,
      });
    }

    return session;
  }

  requireAllRoles(...roles: RoleName[]): UserSession {
    const session = this.requireAuth();

    const userRole = session.user.role;
    if (!userRole) {
      throw new ORPCError("FORBIDDEN", {
        message: "No role assigned to user",
      });
    }

    const hasAllRequiredRoles = roles.every((role) =>
      PermissionChecker.hasRole(userRole, role)
    );

    if (!hasAllRequiredRoles) {
      const userRoles = PermissionChecker.getUserRoles(userRole);
      throw new ORPCError("FORBIDDEN", {
        message: `Access denied. All required roles: ${roles.join(", ")}. User roles: ${userRoles.join(", ")}`,
      });
    }

    return session;
  }

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
          PermissionChecker.hasRole(userRole, role)
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
          PermissionChecker.hasRole(userRole, role)
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

  getRoles(): RoleName[] {
    if (!this._session?.user.role) {
      return [];
    }
    return PermissionChecker.getUserRoles(this._session.user.role);
  }

  hasRole(role: RoleName): boolean {
    if (!this._session?.user.role) {
      return false;
    }
    return PermissionChecker.hasRole(this._session.user.role, role);
  }

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

export class AuthUtilsEmpty implements ORPCAuthContext {
  readonly isLoggedIn = false;
  readonly session = null;
  readonly user = null;
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
  hasPermission(_permission: Permission): Promise<boolean> {
    return Promise.resolve(false);
  }
}