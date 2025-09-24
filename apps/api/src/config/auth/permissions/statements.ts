import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import type { PermissionStatement, AccessControlRoles } from './types';

/**
 * Extended access control statements that include default admin permissions
 * plus your custom application-specific permissions.
 * 
 * This object defines all available resources and their corresponding actions
 * that can be used for role-based access control throughout the application.
 * 
 * Default permissions from Better Auth include:
 * - user: create, list, set-role, ban, impersonate, delete, set-password
 * - session: list, revoke, delete
 * 
 * To add custom permissions, extend this object with your own resources:
 * 
 * @example
 * ```typescript
 * export const statement = {
 *   ...defaultStatements,
 *   // Add your custom resources here
 *   project: ["create", "read", "update", "delete", "share"],
 *   organization: ["create", "read", "update", "delete", "manage-members"],
 *   billing: ["read", "update", "manage-subscriptions"],
 *   analytics: ["read", "export"],
 *   system: ["maintenance", "backup", "restore", "monitor"],
 * } as const satisfies PermissionStatement;
 * ```
 * 
 * @example
 * ```typescript
 * // Check if user has permission
 * const hasPermission = await auth.api.userHasPermission({
 *   body: {
 *     userId: 'user-id',
 *     permissions: { project: ['create'] }
 *   }
 * });
 * ```
 */
export const statement = {
  ...defaultStatements,
  // Custom resources for the application
  project: ["create", "read", "update", "delete", "share"] as const,
  organization: ["create", "read", "update", "delete", "manage-members"] as const,
  billing: ["read", "update", "manage-subscriptions"] as const,
  analytics: ["read", "export"] as const,
  system: ["maintenance", "backup", "restore", "monitor"] as const,
} as const satisfies PermissionStatement;

/**
 * Create the access control instance with our statement
 */
export const ac = createAccessControl(statement);

/**
 * Define roles with their specific permissions using Better Auth access control.
 * 
 * This object contains all available roles in your application with their corresponding
 * permission sets. Each role is created using the Better Auth access control system
 * and can authorize specific resource-action combinations.
 * 
 * To create roles, use the access control instance and define permissions for each role:
 * 
 * @example
 * ```typescript
 * export const roles = {
 *   // Super admin with full access
 *   superAdmin: ac.newRole({
 *     ...defaultStatements, // Include all default admin permissions
 *     project: ["create", "read", "update", "delete", "share"],
 *     organization: ["create", "read", "update", "delete", "manage-members"],
 *     billing: ["read", "update", "manage-subscriptions"],
 *     system: ["maintenance", "backup", "restore", "monitor"],
 *   }),
 * 
 *   // Regular admin with most permissions but limited system access
 *   admin: ac.newRole({
 *     ...defaultStatements,
 *     project: ["create", "read", "update", "delete", "share"],
 *     organization: ["read", "update", "manage-members"],
 *     billing: ["read"],
 *   }),
 * 
 *   // Manager with project and organization management
 *   manager: ac.newRole({
 *     user: ["list"], // Can only list users
 *     session: ["list"], // Can only list sessions
 *     project: ["create", "read", "update", "delete", "share"],
 *     organization: ["read", "update"],
 *   }),
 * 
 *   // Editor with content creation permissions
 *   editor: ac.newRole({
 *     project: ["create", "read", "update", "share"],
 *     organization: ["read"],
 *   }),
 * 
 *   // Viewer with read-only access
 *   viewer: ac.newRole({
 *     project: ["read"],
 *     organization: ["read"],
 *   }),
 * 
 *   // Basic user with minimal permissions
 *   user: ac.newRole({
 *     project: ["read"], // Can only read assigned projects
 *   }),
 * } as const satisfies AccessControlRoles;
 * ```
 * 
 * @example
 * ```typescript
 * // Check if a role can perform an action
 * const result = roles.admin.authorize({ project: ['create'] });
 * if (result.success && result.authorized) {
 *   // Admin can create projects
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Use with role guard decorator
 * @RequireRole('admin', 'manager')
 * @Get('/dashboard')
 * getDashboard() { ... }
 * ```
 */
export const roles = {
  // Super admin with full access to all resources
  superAdmin: ac.newRole({ ...statement } as any), // Type assertion to bypass readonly

  // Regular admin with most permissions but limited system access
  admin: ac.newRole({
    user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"],
    session: ["list", "revoke", "delete"],
    project: ["create", "read", "update", "delete", "share"],
    organization: ["read", "update", "manage-members"],
    billing: ["read"],
    analytics: ["read"],
  } as any),

  // Manager with project and organization management
  manager: ac.newRole({
    user: ["list"],
    session: ["list"],
    project: ["create", "read", "update", "delete", "share"],
    organization: ["read", "update"],
    billing: ["read"],
  } as any),

  // Editor with content creation permissions
  editor: ac.newRole({
    project: ["create", "read", "update", "share"],
    organization: ["read"],
    analytics: ["read"],
  } as any),

  // Viewer with read-only access
  viewer: ac.newRole({
    project: ["read"],
    organization: ["read"],
    analytics: ["read"],
  } as any),

  // Basic user with minimal permissions
  user: ac.newRole({
    project: ["read"],
    organization: ["read"],
  } as any),
} as const satisfies AccessControlRoles;