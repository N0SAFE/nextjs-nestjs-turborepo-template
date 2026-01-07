/**
 * Middleware Module
 *
 * Provides framework-agnostic middleware definitions for authentication
 * and authorization that can be converted to NestJS Guards or ORPC middlewares.
 *
 * ## Architecture
 *
 * The middleware system consists of three layers:
 *
 * 1. **Check Interface** (`middleware-check.ts`)
 *    - Core interfaces: MiddlewareCheck, MiddlewareContext
 *    - Base implementation: BaseMiddlewareCheck
 *    - Utility functions: resolveValue, createAuthError, etc.
 *
 * 2. **Middleware Definitions** (`*-middleware-definition.ts`)
 *    - Plugin-specific middleware factories
 *    - BaseMiddlewareDefinition: Session checks
 *    - AdminMiddlewareDefinition: Admin permission/role checks
 *    - OrganizationMiddlewareDefinition: Organization-scoped checks
 *
 * 3. **Converters** (`middleware-converter.ts`)
 *    - Convert checks to NestJS Guards
 *    - Convert checks to ORPC middlewares
 *
 * ## Usage Example
 *
 * ```typescript
 * import {
 *   AdminMiddlewareDefinition,
 *   OrganizationMiddlewareDefinition,
 *   createNestGuard,
 *   createOrpcMiddleware,
 * } from './middleware';
 *
 * // Create middleware definitions from plugin wrappers
 * const adminMiddleware = new AdminMiddlewareDefinition(adminPlugin);
 * const orgMiddleware = new OrganizationMiddlewareDefinition(orgPlugin);
 *
 * // Create NestJS guards
 * const AdminGuard = createNestGuard(
 *   adminMiddleware.hasPermission({ user: ['manage'] })
 * );
 *
 * // Create ORPC middleware
 * const requireOrgMember = createOrpcMiddleware(
 *   orgMiddleware.isMemberOf({ organizationId: (ctx) => ctx.params.orgId })
 * );
 * ```
 *
 * @module middleware
 */

// ============================================================================
// Core Types and Interfaces
// ============================================================================

export type {
  // Context types
  MiddlewareContext,
  MiddlewareErrorCode,
  CheckResult,

  // Value resolution
  ValueOrResolver,
  ContextResolver,
  PermissionObject,

  // Check interfaces
  MiddlewareCheck,
  SessionCheck,
  PermissionCheck,
  RoleCheck,
  MembershipCheck,
  OrganizationRoleCheck,
  OrganizationPermissionCheck,
} from './middleware-check';

export {
  // Base class
  BaseMiddlewareCheck,

  // Utility functions
  resolveValue,
  createAuthError,
  createPermissionError,
  createRoleError,
} from './middleware-check';

// ============================================================================
// Middleware Definitions
// ============================================================================

// Base definition (session checks)
export type { AuthWithSessionAPI, BaseAuthConstraint } from './base.middleware-definition';
export {
  BaseMiddlewareDefinition,
  SessionRequiredCheck,
} from './base.middleware-definition';

// Admin plugin definition
export type { AdminAuthConstraint } from './admin.middleware-definition';
export {
  AdminMiddlewareDefinition,
  HasPermissionCheck,
  HasPermissionByRoleCheck,
  HasRoleCheck,
  RequireAdminRoleCheck,
} from './admin.middleware-definition';

// Organization plugin definition
export type { OrganizationAuthConstraint } from './organization.middleware-definition';
export {
  OrganizationMiddlewareDefinition,
  HasOrganizationPermissionCheck,
  IsMemberOfCheck,
  HasOrganizationRoleCheck,
  IsOrganizationOwnerCheck,
} from './organization.middleware-definition';

// ============================================================================
// Framework Converters
// ============================================================================

export type {
  // NestJS types
  NestGuardOptions,

  // NestJS dynamic guard types
  NestGuardOptionsContext,
  NestInputResolver,
  NestValueOrResolver,

  // ORPC types (native types re-exported for convenience)
  DecoratedMiddleware,
  ORPCContext,
  Meta,

  // ORPC middleware options context
  OrpcMiddlewareOptionsContext,
  OrpcMiddlewareOptions,

  // ORPC type-safe input resolver types
  OrpcInputResolver,
  OrpcValueOrResolver,
} from './middleware-converter';

export {
  // NestJS converters
  createNestGuard,
  createCompositeNestGuard,

  // NestJS dynamic converters
  createDynamicNestGuard,
  createDynamicNestGuardWithResolver,
  resolveNestValue,

  // ORPC converters
  createOrpcMiddleware,
  createCompositeOrpcMiddleware,
  OrpcError,
  resolveOrpcValue,

  // Utilities
  collect,
  extractCheckMetadata,
  extractChecksMetadata,
} from './middleware-converter';

// ============================================================================
// Convenience Factory Functions
// ============================================================================

import type {
  AnyPermissionBuilder,
  AdminPermissionsPlugin,
  OrganizationsPermissionsPlugin,
  InferRolesFromBuilder,
} from '@repo/auth/permissions/plugins';
import type { AdminAuthConstraint } from './admin.middleware-definition';
import type { OrganizationAuthConstraint } from './organization.middleware-definition';
import { AdminMiddlewareDefinition } from './admin.middleware-definition';
import { OrganizationMiddlewareDefinition } from './organization.middleware-definition';

/**
 * Options for creating admin middleware definition.
 */
export interface CreateAdminMiddlewareOptions<TPermissionBuilder extends AnyPermissionBuilder> {
  /**
   * Roles considered as admin roles for requireAdminRole() check.
   * @default ['admin']
   */
  adminRoles?: readonly InferRolesFromBuilder<TPermissionBuilder>[];
}

/**
 * Create an AdminMiddlewareDefinition from an admin plugin instance.
 *
 * Convenience factory function that provides a simpler API than
 * directly instantiating AdminMiddlewareDefinition.
 *
 * @template TPermissionBuilder - Permission builder type
 * @template TAuth - Auth constraint type
 * @param plugin - Admin plugin instance
 * @param options - Optional configuration
 * @returns AdminMiddlewareDefinition bound to the plugin
 *
 * @example
 * ```typescript
 * // Simple usage
 * const adminPlugin = registry.create('admin', { auth, headers, permissionBuilder });
 * const middleware = createAdminMiddleware(adminPlugin);
 *
 * // With custom admin roles
 * const middleware = createAdminMiddleware(adminPlugin, {
 *   adminRoles: ['admin', 'superuser']
 * });
 *
 * // Use middleware checks
 * const guard = createNestGuard(middleware.hasPermission({ user: ['manage'] }));
 * ```
 */
export function createAdminMiddleware<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AdminAuthConstraint<TPermissionBuilder>,
>(
  plugin: AdminPermissionsPlugin<TPermissionBuilder, TAuth>,
  options?: CreateAdminMiddlewareOptions<TPermissionBuilder>
): AdminMiddlewareDefinition<TPermissionBuilder, TAuth> {
  // Wrap the plugin instance in a factory function
  // This allows using a pre-created plugin with the new factory-based API
  const pluginFactory = () => plugin;
  return new AdminMiddlewareDefinition(pluginFactory, options);
}

/**
 * Create an OrganizationMiddlewareDefinition from an organizations plugin instance.
 *
 * Convenience factory function that provides a simpler API than
 * directly instantiating OrganizationMiddlewareDefinition.
 *
 * @template TPermissionBuilder - Permission builder type
 * @template TAuth - Auth constraint type
 * @param plugin - Organizations plugin instance
 * @returns OrganizationMiddlewareDefinition bound to the plugin
 *
 * @example
 * ```typescript
 * // Simple usage
 * const orgPlugin = registry.create('organization', { auth, headers, permissionBuilder });
 * const middleware = createOrganizationMiddleware(orgPlugin);
 *
 * // Use middleware checks
 * const guard = createNestGuard(middleware.isMemberOf((ctx) => ctx.params.orgId));
 * ```
 */
export function createOrganizationMiddleware<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends OrganizationAuthConstraint<TPermissionBuilder>,
>(
  plugin: OrganizationsPermissionsPlugin<TPermissionBuilder, TAuth>
): OrganizationMiddlewareDefinition<TPermissionBuilder, TAuth> {
  // Wrap the plugin instance in a factory function
  // This allows using a pre-created plugin with the new factory-based API
  const pluginFactory = () => plugin;
  return new OrganizationMiddlewareDefinition(pluginFactory);
}

// ============================================================================
// ORPC Middleware Proxy
// ============================================================================

export {
  createOrpcMiddlewareProxy,
  createCompositeOrpcMiddlewareFromChecks,
  type MiddlewareDefinitionLike,
  type OrpcMiddlewareProxy,
} from './orpc-middleware-proxy';
