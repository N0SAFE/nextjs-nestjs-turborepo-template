import type { statement, roles } from './statements';
import type {createAccessControl} from 'better-auth/plugins/access'

/**
 * Core type definitions for the Better Auth admin access control system
 */

/**
 * Generic type for permission statements structure
 * Defines the shape of resource-action mappings
 */
export type PermissionStatement = Record<string, readonly string[]>;

/**
 * Access control roles type using Better Auth's actual types
 * This extracts the correct type from Better Auth's createAccessControl system
 */
export type AccessControlRoles = Record<string, ReturnType<ReturnType<typeof createAccessControl>['newRole']>>;

/**
 * Extract all available resources from the statement
 */
export type Resource = keyof typeof statement;

/**
 * Extract all available actions for each resource
 */
export type ResourceActions = {
  [K in Resource]: (typeof statement)[K][number];
};

/**
 * Create a union type of all possible actions for a specific resource
 */
export type ActionsForResource<T extends Resource> = (typeof statement)[T][number];

/**
 * Type for permission objects used in guards and decorators
 */
export type Permission<T extends Resource = Resource> = {
  [K in T]?: ActionsForResource<K>[];
};

/**
 * Type for all available role names
 */
export type RoleName = keyof typeof roles;

/**
 * User type with authentication context
 */
export type AuthenticatedUserType = {
  id: string;
  email: string;
  role?: string;
  permissions?: Record<string, string[]>;
};

/**
 * Common permission pattern type for reusable permission sets
 */
export type CommonPermissionPattern<T extends Resource = Resource> = Permission<T>;

/**
 * Utility types for permission checking
 */
export type StrictPermission<T extends Resource> = {
  [K in T]: ActionsForResource<K>[];
};

/**
 * Role level type for hierarchy checking
 */
export type RoleLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Union type of all role names for type safety
 */
export type AllRoleNames = keyof typeof roles;

/**
 * Permission types utility
 */
export type PermissionTypes = {
  Resource: Resource;
  Permission: Permission;
  RoleName: RoleName;
  Statement: typeof statement;
  Roles: typeof roles;
};

/**
 * Access control instance type
 */
export type AccessControlInstance = ReturnType<typeof createAccessControl>;

/**
 * Role permissions type for extracting permissions from roles
 */
export type RolePermissions<T extends RoleName> = Parameters<typeof roles[T]['authorize']>[0];