import { Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Auth } from "@/core/modules/auth/types/auth";
import { APIError } from "better-auth/api";
import { AUTH_INSTANCE_KEY } from "../types/symbols";
import {
  type Permission,
  type RoleName,
  PermissionChecker,
} from "@/config/auth/permissions";
import type { UserSession } from "./auth.guard";

/**
 * NestJS guard that handles role and permission-based access control
 * for protected routes using Better Auth admin plugin.
 * 
 * This guard works in conjunction with AuthGuard and should be applied after it.
 * It checks if the authenticated user has the required roles or permissions.
 * 
 * Usage:
 * - @RequireRole('admin', 'manager') - requires user to have any of these roles
 * - @RequirePermissions({ project: ['create', 'update'] }) - requires specific permissions
 * - @RequireAllRoles('admin', 'manager') - requires user to have all of these roles
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(AUTH_INSTANCE_KEY)
    private readonly auth: Auth,
  ) {}

  /**
   * Validates if the current request has the required roles/permissions
   * @param context - The execution context of the current request
   * @returns True if the request is authorized to proceed, throws an error otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Get session from request (should be set by AuthGuard)
    const session = request.session as UserSession | null;
    
    if (!session?.user) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const user = session.user;
    
    // Better Auth stores the role in the user object, but it might be optional
    // We need to access it correctly based on the Better Auth admin plugin schema
    const userRole = (user as any).role;

    if (!userRole) {
      throw new APIError(403, {
        code: "FORBIDDEN",
        message: "No role assigned to user",
      });
    }

    // Check for required roles (user needs ANY of these roles)
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>("REQUIRED_ROLES", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = PermissionChecker.getUserRoles(userRole);
      const hasRequiredRole = requiredRoles.some(role => 
        PermissionChecker.hasRole(userRole, role)
      );

      if (!hasRequiredRole) {
        throw new APIError(403, {
          code: "FORBIDDEN",
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}. User roles: ${userRoles.join(', ')}`,
        });
      }
    }

    // Check for required all roles (user needs ALL of these roles)
    const requiredAllRoles = this.reflector.getAllAndOverride<RoleName[]>("REQUIRED_ALL_ROLES", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredAllRoles && requiredAllRoles.length > 0) {
      const hasAllRequiredRoles = requiredAllRoles.every(role => 
        PermissionChecker.hasRole(userRole, role)
      );

      if (!hasAllRequiredRoles) {
        const userRoles = PermissionChecker.getUserRoles(userRole);
        throw new APIError(403, {
          code: "FORBIDDEN", 
          message: `Access denied. All required roles: ${requiredAllRoles.join(', ')}. User roles: ${userRoles.join(', ')}`,
        });
      }
    }

    // Check for required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<Permission>("REQUIRED_PERMISSIONS", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions) {
      // Validate permission structure
      if (!PermissionChecker.validatePermission(requiredPermissions)) {
        throw new APIError(500, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid permission configuration",
        });
      }

      try {
        // Use Better Auth's userHasPermission API to check permissions
        const hasPermission = await this.auth.api.userHasPermission({
          body: {
            userId: user.id,
            permissions: requiredPermissions,
          },
        });

        if (!hasPermission) {
          throw new APIError(403, {
            code: "FORBIDDEN",
            message: `Access denied. Missing required permissions: ${JSON.stringify(requiredPermissions)}`,
          });
        }
      } catch (error) {
        // If the permission check fails, deny access
        if (error instanceof APIError) {
          throw error;
        }

        console.error('Permission check failed:', error);
        throw new APIError(500, {
          code: "INTERNAL_SERVER_ERROR",
          message: "Permission validation failed",
        });
      }
    }

    return true;
  }

  /**
   * Helper method to check if a user has a specific role
   * Can be used in service methods for additional role checking
   */
  static hasRole(userRole: string, requiredRole: RoleName): boolean {
    return PermissionChecker.hasRole(userRole, requiredRole);
  }

  /**
   * Helper method to extract user roles from role string
   * Can be used in service methods for role inspection
   */
  static getUserRoles(userRole: string): RoleName[] {
    return PermissionChecker.getUserRoles(userRole);
  }
}