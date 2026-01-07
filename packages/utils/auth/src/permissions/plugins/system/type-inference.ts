/**
 * Type Inference Utilities for Better Auth API
 * 
 * Automatically infer types from Better Auth API method parameters
 * by analyzing the actual function signatures at runtime and compile-time.
 */

import type { PermissionBuilder } from '../../system/builder/builder';

// ============================================================================
// Permission Builder Type Constraints
// ============================================================================

/**
 * Permissive constraint for PermissionBuilder generic parameters.
 * Use this instead of `extends PermissionBuilder` to allow specific builder types
 * to be assignable without defaulting to Record<string, never>.
 * 
 * @example
 * ```typescript
 * // Instead of:
 * type MyType<T extends PermissionBuilder> = ...
 * 
 * // Use:
 * type MyType<T extends AnyPermissionBuilder> = ...
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPermissionBuilder = PermissionBuilder<any, any>;

// ============================================================================
// Permission Builder Type Inference
// ============================================================================

/**
 * Extract TStatement and TRoles from PermissionBuilder type.
 * Returns an object with both inferred types.
 * 
 * @template T - PermissionBuilder type to infer from
 * @returns Object with TStatement and TRoles properties
 * 
 * @example
 * ```typescript
 * type Builder = PermissionBuilder<{ user: ['read'] }, { admin: { user: ['read'] } }>;
 * type Inferred = InferAllFromBuilder<Builder>;
 * // { TStatement: { user: ['read'] }, TRoles: { admin: { user: ['read'] } } }
 * ```
 */
export type InferAllFromBuilder<T extends AnyPermissionBuilder> = T extends PermissionBuilder<infer S, infer R> ? {
    TStatement: S;
    TRoles: R;
} : never;

/**
 * Extract TStatement from a PermissionBuilder type.
 * 
 * @template T - PermissionBuilder type to infer from
 * @returns The statement type (first generic parameter)
 * 
 * @example
 * ```typescript
 * type Builder = PermissionBuilder<{ user: ['read'] }, {}>;
 * type Statement = InferStatementFromBuilder<Builder>;
 * // { user: ['read'] }
 * ```
 */
export type InferStatementFromBuilder<T extends AnyPermissionBuilder> = InferAllFromBuilder<T>['TStatement'];

/**
 * Extract TRoles from a PermissionBuilder type.
 * 
 * @template T - PermissionBuilder type to infer from
 * @returns The roles type (second generic parameter) - the full role definitions record
 * 
 * @example
 * ```typescript
 * type Builder = PermissionBuilder<{}, { admin: { user: ['read'] } }>;
 * type Roles = InferRolesFromBuilder<Builder>;
 * // { admin: { user: ['read'] } }
 * ```
 */
export type InferRolesFromBuilder<T extends AnyPermissionBuilder> = InferAllFromBuilder<T>['TRoles'];

/**
 * Extract role names (keys) from a PermissionBuilder type.
 * 
 * @template T - PermissionBuilder type to infer from
 * @returns Union of role name strings (keys of the TRoles record)
 * 
 * @example
 * ```typescript
 * type Builder = PermissionBuilder<{}, { admin: { user: ['read'] }, member: { user: ['read'] } }>;
 * type RoleNames = InferRoleNamesFromBuilder<Builder>;
 * // 'admin' | 'member'
 * ```
 */
export type InferRoleNamesFromBuilder<T extends AnyPermissionBuilder> = keyof InferAllFromBuilder<T>['TRoles'];

/**
 * Utility to infer parameters from Better Auth API method calls
 * Uses typeof to get the actual method signature and extracts parameter types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferParams<T> = T extends (...args: infer P) => any ? P[0] : never;

/**
 * Helper to extract just the body portion from inferred types
 * Handles the case where Better Auth methods might return union with undefined
 */
export type ExtractBody<T> = T extends { body: infer B }
  ? B
  : T extends { body?: infer B }
    ? B
    : never;

/**
 * Helper to extract just the query portion from inferred types
 * Handles the case where Better Auth methods might return union with undefined
 */
export type ExtractQuery<T> = T extends { query: infer Q }
  ? Q
  : T extends { query?: infer Q }
    ? Q
    : never;
