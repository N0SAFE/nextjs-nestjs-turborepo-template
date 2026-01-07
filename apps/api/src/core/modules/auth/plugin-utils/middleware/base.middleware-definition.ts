/**
 * Base Middleware Definition
 *
 * Abstract base class for plugin-specific middleware definitions.
 * Uses `TPermissionBuilder extends AnyPermissionBuilder` as generic parameter
 * to preserve type safety throughout the middleware chain.
 *
 * @template TPermissionBuilder - The actual PermissionBuilder type (NOT abstracted)
 * @template TAuth - Auth instance type with required API methods
 */

import type { Auth as BetterAuthInstance } from 'better-auth';
import type {
  BasePluginWrapper,
  AnyPermissionBuilder,
  InferStatementFromBuilder,
  InferRolesFromBuilder,
} from '@repo/auth/permissions/plugins';
import {
  BaseMiddlewareCheck,
  createAuthError,
  type MiddlewareCheck,
  type MiddlewareContext,
  type MiddlewareErrorCode,
} from './middleware-check';

// ============================================================================
// Type Constraints
// ============================================================================

/**
 * Minimum auth constraint for BaseMiddlewareDefinition.
 * Matches BasePluginWrapper's TAuth constraint exactly.
 */
export interface BaseAuthConstraint {
  $Infer: BetterAuthInstance['$Infer'];
}

/**
 * Auth constraint that includes getSession API method.
 * Used for session-requiring middleware checks.
 */
export interface AuthWithSessionAPI extends BaseAuthConstraint {
  api: {
    getSession: (opts: { headers: Headers }) => Promise<unknown>;
  };
}

/**
 * Infer session type from auth instance
 */
export type InferSession<TAuth extends BaseAuthConstraint> = TAuth extends {
  $Infer: { Session: infer S };
}
  ? S
  : never;

// ============================================================================
// Plugin Factory Type
// ============================================================================

/**
 * Factory function that creates a plugin instance from runtime context.
 * This enables lazy plugin instantiation when checks execute, 
 * giving access to runtime headers.
 */
export type PluginFactory<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends BaseAuthConstraint,
> = (context: MiddlewareContext) => BasePluginWrapper<TPermissionBuilder, TAuth>;

// ============================================================================
// Session Check Implementation
// ============================================================================

/**
 * Session requirement check.
 * Ensures the user has a valid authenticated session.
 */
export class SessionRequiredCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AuthWithSessionAPI,
> extends BaseMiddlewareCheck {
  readonly name = 'requireSession' as const;
  readonly description = 'Requires a valid authenticated session';

  private readonly getPlugin: PluginFactory<TPermissionBuilder, TAuth>;

  constructor(getPlugin: PluginFactory<TPermissionBuilder, TAuth>) {
    super();
    this.getPlugin = getPlugin;
  }

  async check(context: MiddlewareContext): Promise<void> {
    const plugin = this.getPlugin(context);
    
    // First check if session was pre-loaded in the plugin
    if (plugin.hasSession()) {
      return; // Session exists and is valid
    }

    // If no cached session, try to get one
    const auth = plugin.getAuth();
    const session = await auth.api.getSession({ headers: context.headers });

    if (!session) {
      throw createAuthError();
    }
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'UNAUTHORIZED';
  }

  getErrorMessage(): string {
    return 'Authentication required. Please log in.';
  }
}

// ============================================================================
// Base Middleware Definition Class
// ============================================================================

/**
 * Abstract base class for middleware definitions with LAZY plugin instantiation.
 *
 * Instead of receiving a plugin instance at construction, this class receives
 * a plugin factory function. The factory is called when checks execute,
 * providing access to runtime context (headers).
 *
 * @template TPermissionBuilder - The actual PermissionBuilder type (NOT abstracted)
 * @template TAuth - Auth instance type (used to infer session type via $Infer)
 *
 * @example
 * ```typescript
 * // Create middleware with lazy plugin factory
 * const middlewares = new AdminMiddlewareDefinition(
 *   (context) => registry.create('admin', { headers: context.headers })
 * );
 * 
 * // When check runs, plugin is created with runtime headers
 * const check = middlewares.hasPermission({ user: ['read'] });
 * await check.check({ headers: request.headers, ... });
 * ```
 */
export abstract class BaseMiddlewareDefinition<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends BaseAuthConstraint,
> {
  /**
   * Factory function to create the plugin with runtime context.
   * Called when checks execute to get the plugin instance.
   */
  protected readonly pluginFactory: PluginFactory<TPermissionBuilder, TAuth>;

  constructor(pluginFactory: PluginFactory<TPermissionBuilder, TAuth>) {
    this.pluginFactory = pluginFactory;
  }

  /**
   * Get the plugin factory.
   * Useful for creating derived checks.
   */
  getPluginFactory(): PluginFactory<TPermissionBuilder, TAuth> {
    return this.pluginFactory;
  }

  // ==========================================================================
  // Base Middleware Methods
  // ==========================================================================

  /**
   * Require the user to have a valid session.
   * Uses: auth.api.getSession({ headers })
   *
   * @returns MiddlewareCheck that verifies session exists
   * @throws Error with code 'UNAUTHORIZED' if no valid session
   *
   * @example
   * ```typescript
   * // In ORPC route
   * const route = implement(contract.route)
   *   .use(middlewares.requireSession().check)
   *   .handler(...);
   *
   * // In NestJS
   * @RequireSession()
   * async myHandler() { ... }
   * ```
   */
  requireSession(): MiddlewareCheck {
    return new SessionRequiredCheck(
      this.pluginFactory as unknown as PluginFactory<TPermissionBuilder, AuthWithSessionAPI>
    );
  }
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Type alias for any middleware definition
 */
export type AnyMiddlewareDefinition = BaseMiddlewareDefinition<
  AnyPermissionBuilder,
  { api: { getSession: (opts: { headers: Headers }) => Promise<unknown> }; $Infer: BetterAuthInstance['$Infer'] }
>;

/**
 * Infer the permission builder type from a middleware definition
 */
export type InferBuilderFromDefinition<T> = T extends BaseMiddlewareDefinition<
  infer TBuilder,
  BaseAuthConstraint
>
  ? TBuilder
  : never;

/**
 * Infer the auth type from a middleware definition
 */
export type InferAuthFromDefinition<T> = T extends BaseMiddlewareDefinition<
  AnyPermissionBuilder,
  infer TAuth
>
  ? TAuth
  : never;

/**
 * Infer statement type from a middleware definition (via its builder)
 */
export type InferStatementFromDefinition<T> = T extends BaseMiddlewareDefinition<
  infer TBuilder,
  BaseAuthConstraint
>
  ? TBuilder extends AnyPermissionBuilder
    ? InferStatementFromBuilder<TBuilder>
    : never
  : never;

/**
 * Infer roles type from a middleware definition (via its builder)
 */
export type InferRolesFromDefinition<T> = T extends BaseMiddlewareDefinition<
  infer TBuilder,
  BaseAuthConstraint
>
  ? TBuilder extends AnyPermissionBuilder
    ? InferRolesFromBuilder<TBuilder>
    : never
  : never;
