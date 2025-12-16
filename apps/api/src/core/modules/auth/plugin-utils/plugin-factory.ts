/**
 * Plugin Factory for Better Auth
 * 
 * This module provides factory functions to generate type-safe NestJS decorators
 * and ORPC middlewares from Better Auth plugins. It uses type inference from the
 * Better Auth configuration to maintain full type safety.
 * 
 * The factory approach allows for:
 * - Automatic generation of decorators/middlewares for any Better Auth plugin
 * - Full type inference based on plugin configuration
 * - Consistent patterns across all plugins
 * - Easy extension for future plugins
 */

import { SetMetadata } from "@nestjs/common";
import type { CustomDecorator } from "@nestjs/common";
import { ORPCError } from "@orpc/client";
import type { Auth } from "@/auth";
import type { ORPCContextWithAuth } from "../orpc/middlewares";

/**
 * Plugin metadata structure
 * Contains information about a Better Auth plugin for factory generation
 */
export interface PluginMetadata {
  /** Plugin name (e.g., 'admin', 'organization') */
  name: string;
  /** Plugin type identifier */
  type: string;
  /** Scope accessor name in context.auth (e.g., 'admin', 'org') */
  scopeAccessor: string;
}

/**
 * Options for generating plugin decorators
 */
export interface PluginDecoratorOptions {
  /** Custom error message for access denied */
  errorMessage?: string;
  /** Whether to throw error or return false */
  throwOnDeny?: boolean;
}

/**
 * Options for generating plugin middlewares
 */
export interface PluginMiddlewareOptions {
  /** Custom error message for access denied */
  errorMessage?: string;
  /** ORPC error code to use */
  errorCode?: "UNAUTHORIZED" | "FORBIDDEN";
}

// ============================================================================
// NestJS Decorator Factory
// ============================================================================

/**
 * Factory function to create NestJS decorators for a Better Auth plugin
 * 
 * This generates decorators that can be used with NestJS guards to enforce
 * plugin-specific access control.
 * 
 * @param plugin - Plugin metadata
 * @returns Object containing generated decorators
 * 
 * @example
 * ```typescript
 * const adminDecorators = createPluginDecorators({
 *   name: 'admin',
 *   type: 'admin',
 *   scopeAccessor: 'admin'
 * });
 * 
 * // Use in controller
 * @adminDecorators.RequireAccess()
 * @Get('/users')
 * listUsers() { ... }
 * ```
 */
export function createPluginDecorators(plugin: PluginMetadata) {
  const metadataKey = `REQUIRE_${plugin.type.toUpperCase()}_ACCESS`;
  
  return {
    /**
     * Decorator that requires access to the plugin
     * This will be checked by a corresponding guard
     */
    RequireAccess: (options: PluginDecoratorOptions = {}): CustomDecorator => {
      return SetMetadata(metadataKey, {
        plugin: plugin.name,
        scopeAccessor: plugin.scopeAccessor,
        ...options,
      });
    },
    
    /**
     * Metadata key used by the guard
     */
    metadataKey,
  };
}

// ============================================================================
// ORPC Middleware Factory
// ============================================================================

/**
 * Factory function to create ORPC middlewares for a Better Auth plugin
 * 
 * This generates middlewares that can be used in ORPC procedures to enforce
 * plugin-specific access control.
 * 
 * @param plugin - Plugin metadata
 * @returns Object containing generated middlewares
 * 
 * @example
 * ```typescript
 * const adminMiddlewares = createPluginMiddlewares({
 *   name: 'admin',
 *   type: 'admin',
 *   scopeAccessor: 'admin'
 * });
 * 
 * // Use in ORPC procedure
 * implement(contract)
 *   .use(adminMiddlewares.requireAccess())
 *   .handler(({ context }) => { ... })
 * ```
 */
export function createPluginMiddlewares(plugin: PluginMetadata) {
  return {
    /**
     * Middleware that requires access to the plugin
     * Uses the scope's hasAccess() method under the hood
     */
    requireAccess: (options: PluginMiddlewareOptions = {}) => {
      return async (opts: {
        context: ORPCContextWithAuth;
        input: unknown;
        next: (opts: { context: ORPCContextWithAuth }) => Promise<unknown>;
      }) => {
        const { context } = opts;
        const { auth } = context;

        // Ensure user is authenticated first
        if (!auth.isLoggedIn) {
          throw new ORPCError(options.errorCode ?? "UNAUTHORIZED", {
            message: options.errorMessage ?? "Authentication required",
          });
        }

        // Access the plugin scope (e.g., auth.admin or auth.org)
        const scope = auth[plugin.scopeAccessor as keyof typeof auth] as any;
        
        if (!scope || typeof scope.hasAccess !== 'function') {
          throw new Error(`Plugin scope '${plugin.scopeAccessor}' does not have hasAccess() method`);
        }

        // Check access using the scope's hasAccess() method
        const hasAccess = await scope.hasAccess();
        
        if (!hasAccess) {
          throw new ORPCError(options.errorCode ?? "FORBIDDEN", {
            message: options.errorMessage ?? `Access to ${plugin.name} plugin denied`,
          });
        }

        return opts.next(opts);
      };
    },

    /**
     * Middleware that requires access to a specific resource within the plugin
     * For organization plugin, this checks access to a specific organization
     */
    requireResourceAccess: (
      getResourceId: (input: unknown) => string,
      options: PluginMiddlewareOptions = {}
    ) => {
      return async (opts: {
        context: ORPCContextWithAuth;
        input: unknown;
        next: (opts: { context: ORPCContextWithAuth }) => Promise<unknown>;
      }) => {
        const { context, input } = opts;
        const { auth } = context;

        // Ensure user is authenticated first
        if (!auth.isLoggedIn) {
          throw new ORPCError(options.errorCode ?? "UNAUTHORIZED", {
            message: options.errorMessage ?? "Authentication required",
          });
        }

        // Access the plugin scope
        const scope = auth[plugin.scopeAccessor as keyof typeof auth] as any;
        
        if (!scope || typeof scope.hasAccess !== 'function') {
          throw new Error(`Plugin scope '${plugin.scopeAccessor}' does not have hasAccess() method`);
        }

        // Get resource ID from input
        const resourceId = getResourceId(input);

        // Check access to the specific resource
        const hasAccess = await scope.hasAccess(resourceId);
        
        if (!hasAccess) {
          throw new ORPCError(options.errorCode ?? "FORBIDDEN", {
            message: options.errorMessage ?? `Access to resource '${resourceId}' denied`,
          });
        }

        return opts.next(opts);
      };
    },
  };
}

// ============================================================================
// Pre-configured Plugin Factories
// ============================================================================

/**
 * Admin plugin decorators
 * 
 * @example
 * ```typescript
 * import { adminDecorators } from '@/core/modules/auth/plugin-utils';
 * 
 * @adminDecorators.RequireAccess()
 * @Get('/admin/users')
 * listUsers() { ... }
 * ```
 */
export const adminDecorators = createPluginDecorators({
  name: 'admin',
  type: 'admin',
  scopeAccessor: 'admin',
});

/**
 * Organization plugin decorators
 * 
 * @example
 * ```typescript
 * import { organizationDecorators } from '@/core/modules/auth/plugin-utils';
 * 
 * @organizationDecorators.RequireAccess()
 * @Get('/organizations')
 * listOrganizations() { ... }
 * ```
 */
export const organizationDecorators = createPluginDecorators({
  name: 'organization',
  type: 'organization',
  scopeAccessor: 'org',
});

/**
 * Admin plugin middlewares
 * 
 * @example
 * ```typescript
 * import { adminMiddlewares } from '@/core/modules/auth/plugin-utils';
 * 
 * implement(contract)
 *   .use(adminMiddlewares.requireAccess())
 *   .handler(({ context }) => { ... })
 * ```
 */
export const adminMiddlewares = createPluginMiddlewares({
  name: 'admin',
  type: 'admin',
  scopeAccessor: 'admin',
});

/**
 * Organization plugin middlewares
 * 
 * @example
 * ```typescript
 * import { organizationMiddlewares } from '@/core/modules/auth/plugin-utils';
 * 
 * implement(contract)
 *   .use(organizationMiddlewares.requireAccess())
 *   .handler(({ context }) => { ... })
 * 
 * // Or check access to specific organization
 * implement(contract)
 *   .use(organizationMiddlewares.requireResourceAccess(
 *     (input: any) => input.organizationId
 *   ))
 *   .handler(({ context, input }) => { ... })
 * ```
 */
export const organizationMiddlewares = createPluginMiddlewares({
  name: 'organization',
  type: 'organization',
  scopeAccessor: 'org',
});
