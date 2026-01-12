/**
 * Plugin Wrapper Factory for Better Auth - NestJS Integration
 * 
 * This module sets up the typed plugin registry using the generic permission plugins
 * from @repo/auth. It provides type-safe wrappers for admin and organization plugins
 * with automatic header injection and optional session caching.
 * 
 * Architecture:
 * - Uses PluginWrapperRegistry from @repo/auth for plugin management
 * - Registers AdminPermissionsPlugin and OrganizationsPermissionsPlugin
 * - Auth is provided once when creating the registry
 * - Session can be passed to avoid redundant getSession() calls
 * - Exports typed aliases and factory function for use throughout the app
 */

import {
  PluginWrapperRegistry,
  AdminPermissionsPlugin,
  OrganizationsPermissionsPlugin,
  // Import builders for type inference
  platformBuilder,
  organizationBuilder,
  type InferSessionFromAuth,
  type ApiMethodsWithAdminPlugin,
  type ApiMethodsWithOrganizationPlugin,
} from "@repo/auth/permissions";
import { AdminMiddlewareDefinition } from "./middleware/admin.middleware-definition";
import { OrganizationMiddlewareDefinition } from "./middleware/organization.middleware-definition";

// ============================================================================
// Type Exports for Plugin Wrappers
// ============================================================================

// ============================================================================
// Permission Builder Types - Used for type constraints
// ============================================================================

/** Platform permission builder type */
export type PlatformBuilder = typeof platformBuilder;

/** Organization permission builder type */
export type OrganizationBuilder = typeof organizationBuilder;

/**
 * Typed AdminPermissionsPlugin configured with our platform permissions
 * Use this type when you need to annotate admin plugin parameters or returns
 */
export type AdminPluginWrapper<TAuth extends ApiMethodsWithAdminPlugin<PlatformBuilder> = ApiMethodsWithAdminPlugin<PlatformBuilder>> = AdminPermissionsPlugin<
  PlatformBuilder,
  TAuth
>;

/**
 * Typed OrganizationsPermissionsPlugin configured with our organization permissions
 * Use this type when you need to annotate organization plugin parameters or returns
 */
export type OrganizationPluginWrapper<TAuth extends ApiMethodsWithOrganizationPlugin<OrganizationBuilder> = ApiMethodsWithOrganizationPlugin<OrganizationBuilder>> = OrganizationsPermissionsPlugin<
  OrganizationBuilder,
  TAuth
>;

/**
 * Plugin registry interface - the record of all available plugins
 * Returned by getAll() method
 */
export interface PluginRegistry {
  admin: AdminPluginWrapper;
  organization: OrganizationPluginWrapper;
}

// ============================================================================
// Registry Factory
// ============================================================================

/**
 * Create a typed plugin wrapper registry for a given auth instance
 * 
 * This factory provides type-safe creation of plugin wrappers with:
 * - Auth bound at registry creation (supports multiple auth instances)
 * - Automatic header injection per-request
 * - Full type inference from Better Auth and permission builders
 * 
 * @param auth - Better Auth instance to bind to this registry
 * @returns Typed plugin wrapper registry
 * 
 * @example
 * ```typescript
 * // Create registry bound to auth instance
 * const registry = createPluginRegistry(auth);
 * 
 * // Get all plugins at once (typed as PluginRegistry)
 * const plugins = registry.getAll(headers);
 * await plugins.admin.createUser({ ... });
 * await plugins.organization.createOrganization({ ... });
 * 
 * // Or get single plugin
 * const admin = registry.create('admin', headers);
 * await admin.setRole(userId, 'admin');
 * ```
 */
export function createPluginRegistry<TAuth extends ApiMethodsWithAdminPlugin<PlatformBuilder> & ApiMethodsWithOrganizationPlugin<OrganizationBuilder>>(auth: TAuth) {
  return new PluginWrapperRegistry<TAuth>(auth)
    .register(
      'admin',
      createAdminWrapper
    )
    .register(
      'organization',
      createOrganizationWrapper
    );
}

/**
 * Type of our configured registry
 * Useful for type annotations
 */
export type AppPluginRegistry = ReturnType<typeof createPluginRegistry>;

export type InferPluginsFromRegistry<TPluginRegistry extends PluginWrapperRegistry<any, any>> = ReturnType<TPluginRegistry['getAll']>

// ============================================================================
// Factory Helper Functions
// ============================================================================

/**
 * Create an AdminPluginWrapper instance directly
 * Convenience function for when you don't need the full registry
 * 
 * @param auth - Better Auth instance
 * @param headers - Request headers for API calls
 * @param session - Optional cached session to avoid redundant getSession() calls
 * @returns Typed AdminPluginWrapper
 * 
 * @example
 * ```typescript
 * const adminPlugin = createAdminWrapper(auth, context.headers, session);
 * await adminPlugin.createUser({ ... });
 * ```
 */
export function createAdminWrapper<TAuth extends ApiMethodsWithAdminPlugin<PlatformBuilder>>(
  auth: TAuth,
  headers: Headers,
  session?: InferSessionFromAuth<TAuth> | null
) {
  return new AdminPermissionsPlugin({
    auth,
    headers,
    permissionBuilder: platformBuilder,
    session: session ?? undefined,
  });
}

/**
 * Create an OrganizationPluginWrapper instance directly
 * Convenience function for when you don't need the full registry
 * 
 * @param auth - Better Auth instance
 * @param headers - Request headers for API calls
 * @param session - Optional cached session to avoid redundant getSession() calls
 * @returns Typed OrganizationPluginWrapper
 * 
 * @example
 * ```typescript
 * const orgPlugin = createOrganizationWrapper(auth, context.headers, session);
 * await orgPlugin.createOrganization({ ... });
 * ```
 */
export function createOrganizationWrapper<TAuth extends ApiMethodsWithOrganizationPlugin<OrganizationBuilder>>(
  auth: TAuth,
  headers: Headers,
  session?: InferSessionFromAuth<TAuth> | null
) {
  return new OrganizationsPermissionsPlugin({
    auth,
    headers,
    permissionBuilder: organizationBuilder,
    session: session ?? undefined,
  });
}

/**
 * Creates middleware definitions with lazy plugin instantiation.
 * 
 * The plugin is NOT created upfront. Instead, a factory function is provided
 * to the middleware definitions that creates the plugin when checks execute,
 * using the runtime context (headers AND session) available at that time.
 * 
 * @param auth - The Better Auth instance
 * @param registry - The plugin registry for creating plugin instances
 * @returns Middleware definitions for admin and organization plugins
 * 
 * @example
 * ```typescript
 * const registry = createPluginRegistry(auth);
 * const middlewares = createPluginMiddlewares(auth, registry);
 * 
 * // Use in ORPC
 * const check = middlewares.admin.hasPermission({ user: ['read'] });
 * const orpcMiddleware = createOrpcMiddleware(check);
 * 
 * // Use in NestJS
 * const nestGuard = createNestGuard(check);
 * ```
 */
export function createPluginMiddlewares<
  TAuth extends ApiMethodsWithAdminPlugin<PlatformBuilder> & ApiMethodsWithOrganizationPlugin<OrganizationBuilder>
>(auth: TAuth, registry: ReturnType<typeof createPluginRegistry<TAuth>>) {
  return {
    admin: new AdminMiddlewareDefinition<typeof platformBuilder, TAuth>(
      (context) => registry.create(
        'admin',
        context.headers,
        context.session
      )
    ),
    organization: new OrganizationMiddlewareDefinition<typeof organizationBuilder, TAuth>(
      (context) => registry.create(
        'organization',
        context.headers,
        context.session
      )
    ),
  };
}