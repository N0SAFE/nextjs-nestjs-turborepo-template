import { ac, roles, statement } from "./statements";
import type { Resource, Permission, RoleName } from "./types";

/**
 * Better Auth Permissions System
 *
 * This module provides a complete role-based access control (RBAC) system
 * built on top of Better Auth's admin plugin. It includes:
 *
 * - Type-safe permission statements
 * - Role definitions with hierarchical permissions
 * - NestJS guards and decorators for route protection
 * - Utility functions for permission checking
 *
 * @example Basic Usage
 * ```typescript
 * // In your controller
 * @RequireRole('admin')
 * @Get('/admin-only')
 * adminOnlyRoute() {
 *   return 'Admin access granted';
 * }
 *
 * @RequirePermissions({ project: ['create'] })
 * @Post('/projects')
 * createProject() {
 *   return 'Project created';
 * }
 * ```
 *
 * @example Check permissions programmatically
 * ```typescript
 * import { PermissionChecker } from './permissions';
 *
 * const checker = new PermissionChecker();
 * const hasAccess = await checker.userHasRole(userId, 'admin');
 * const canCreate = await checker.userHasPermissions(userId, { project: ['create'] });
 * ```
 *
 * @example Define custom permissions
 * ```typescript
 * // In statements.ts
 * export const statement = {
 *   ...defaultStatements,
 *   project: ["create", "read", "update", "delete", "share"],
 *   organization: ["create", "read", "update", "delete", "manage-members"],
 * } as const satisfies PermissionStatement;
 * ```
 *
 * @example Define custom roles
 * ```typescript
 * // In statements.ts
 * export const roles = {
 *   admin: ac.newRole({
 *     ...statement, // All permissions
 *   }),
 *   user: ac.newRole({
 *     project: ["read"], // Read-only access
 *   }),
 * } as const satisfies AccessControlRoles;
 * ```
 */

import { admin, organization } from "better-auth/plugins";

// Export all types
export * from "./types";

// Export statements and roles (to be customized by the developer)
export { statement, roles, ac } from "./statements";

/**
 * Create and configure the Better Auth admin plugin with the defined access control and roles.
 *
 * This function returns the admin plugin configured with the access control instance (ac)
 * and roles defined in the statements file, plus any additional options you provide.
 *
 * @param options - Additional admin plugin options (excluding ac and roles which are auto-provided)
 * @example
 * ```typescript
 * import { useAdmin } from './permissions';
 * import { betterAuth } from 'better-auth';
 *
 * export const auth = betterAuth({
 *   // ... other config
 *   plugins: [
 *     useAdmin({
 *       // Any admin plugin options except ac and roles
 *       requireEmailVerification: true,
 *       disableSignup: false,
 *     }),
 *     // ... other plugins
 *   ],
 * });
 * ```
 *
 * @returns The configured Better Auth admin plugin
 */
export function useAdmin(
  options: Omit<Parameters<typeof admin>[0], "ac" | "roles"> = {}
) {
  return admin({
    ac,
    roles,
    ...options,
  });
}

/**
 * Create and configure the Better Auth organization plugin with the defined access control and roles.
 *
 * This function returns the organization plugin configured with the access control instance (ac)
 * and roles defined in the statements file, plus any additional options you provide.
 *
 * @param options - Additional organization plugin options (excluding ac and roles which are auto-provided)
 * @example
 * ```typescript
 * import { useOrganization } from './permissions';
 * import { betterAuth } from 'better-auth';
 *
 * export const auth = betterAuth({
 *   // ... other config
 *   plugins: [
 *     useOrganization({
 *       // Any organization plugin options except ac and roles
 *       allowUserToCreateOrganization: true,
 *       organizationLimit: 5,
 *     }),
 *     // ... other plugins
 *   ],
 * });
 * ```
 *
 * @returns The configured Better Auth organization plugin
 */
export function useOrganization(
  options: Omit<Parameters<typeof organization>[0], "ac" | "roles"> = {}
) {
  const { ac, roles } = require("./statements");

  return organization({
    ac,
    roles,
    ...options,
  });
}

// Permission checking utilities
export class PermissionChecker {
  /**
   * Validates if a permission object has valid structure
   */
  static validatePermission<T extends Resource>(
    permissions: Permission<T>
  ): boolean {
    for (const [resource, actions] of Object.entries(permissions)) {
      if (!(resource in statement)) {
        return false;
      }

      const validActions = statement[resource];
      for (const action of actions as string[]) {
        if (!validActions.includes(action as never)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Helper to check if a user role string contains a specific role
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
   * Helper to extract roles from a user role string
   */
  static extractRoles(userRoles: string): RoleName[] {
    const { roles } = require("./statements");
    return userRoles
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r in roles) as RoleName[];
  }

  /**
   * Check if any of the user's roles satisfy the required permissions
   * This will be used by the guard with Better Auth's userHasPermission API
   */
  static getUserRoles(userRoleString: string): RoleName[] {
    return this.extractRoles(userRoleString);
  }

  /**
   * Type guard to check if a string is a valid role name
   */
  static isValidRoleName(role: string): role is RoleName {
    const { roles } = require("./statements");
    return Object.prototype.hasOwnProperty.call(roles, role);
  }

  /**
   * Type guard to check if a string is a valid resource name
   */
  static isValidResource(resource: string): resource is Resource {
    const { statement } = require("./statements");
    return Object.prototype.hasOwnProperty.call(statement, resource);
  }

  /**
   * Type guard to check if an action is valid for a resource
   */
  static isValidActionForResource(resource: string, action: string): boolean {
    if (!this.isValidResource(resource)) return false;
    const { statement } = require("./statements");
    const resourceActions = statement[resource];
    return resourceActions.includes(action as never);
  }

  /**
   * Get all valid actions for a specific resource
   */
  static getActionsForResource(resource: string): readonly string[] {
    if (!this.isValidResource(resource)) return [];
    const { statement } = require("./statements");
    return statement[resource];
  }

  /**
   * Get all available resources
   */
  static getAllResources(): Resource[] {
    const { statement } = require("./statements");
    return Object.keys(statement) as Resource[];
  }

  /**
   * Get all available role names
   */
  static getAllRoles(): RoleName[] {
    const { roles } = require("./statements");
    return Object.keys(roles) as RoleName[];
  }

  /**
   * Check if a role has a higher privilege level than another
   */
  static hasHigherPrivilege(
    _userRole: RoleName,
    _requiredRole: RoleName
  ): boolean {
    // This would need to be implemented based on your role hierarchy
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Get the privilege level of a role
   */
  static getRoleLevel(_role: RoleName): number {
    // This would need to be implemented based on your role hierarchy
    // For now, return 0 as a placeholder
    return 0;
  }

  /**
   * Instance methods (implement based on your auth system)
   */

  /**
   * Check if a user has a specific role
   * @param userId - The user ID to check
   * @param role - The role name to verify
   * @returns Promise<boolean>
   */
  async userHasRole(_userId: string, _role: string): Promise<boolean> {
    // Implementation depends on your auth setup
    // This is a placeholder - implement based on your needs
    throw new Error("Implement userHasRole based on your auth system");
  }

  /**
   * Check if a user has specific permissions
   * @param userId - The user ID to check
   * @param permissions - The permissions to verify
   * @returns Promise<boolean>
   */
  async userHasPermissions(
    _userId: string,
    _permissions: Record<string, string[]>
  ): Promise<boolean> {
    // Implementation depends on your auth setup
    // This is a placeholder - implement based on your needs
    throw new Error("Implement userHasPermissions based on your auth system");
  }
}

/**
 * Utility function to create type-safe permission objects
 */
export function createPermission<T extends Resource>(
  permissions: Permission<T>
): Permission<T> {
  // Validate the permission structure
  if (!PermissionChecker.validatePermission(permissions)) {
    throw new Error("Invalid permission structure provided");
  }
  return permissions;
}

/**
 * Common permission patterns for easy reuse
 * These are placeholder examples - customize based on your actual permissions
 */
export const commonPermissions = {
  // Full CRUD access to projects (example)
  projectFullAccess: createPermission({
    user: ["create", "list", "set-role", "ban", "delete", "set-password"],
    // project: ["create", "read", "update", "delete", "share"], // Uncomment when you add project permissions
  }),

  // Read-only access (example)
  readOnly: createPermission({
    user: ["list"],
    session: ["list"],
  }),

  // User management permissions
  userManagement: createPermission({
    user: ["create", "list", "set-role", "ban", "delete", "set-password"],
    session: ["list", "revoke", "delete"],
  }),

  // Session management permissions
  sessionManagement: createPermission({
    session: ["list", "revoke", "delete"],
  }),
} as const;

/**
 * Helper type to extract permission keys from common permissions
 */
export type CommonPermissionKeys = keyof typeof commonPermissions;

/**
 * Helper type to extract permission types from common permissions
 */
export type CommonPermission<T extends CommonPermissionKeys> =
  (typeof commonPermissions)[T];
