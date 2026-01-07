/**
 * Base Plugin Wrapper for Better Auth
 *
 * Abstract base class providing common infrastructure for plugin wrappers.
 * Subclasses should implement plugin-specific permission checking using
 * Better Auth's native APIs:
 * - Admin plugin: auth.api.userHasPermission()
 * - Organization plugin: auth.api.hasPermission()
 *
 * @template TPermissionBuilder - Permission builder type for type inference
 * @template TAuth - Auth instance type with required API methods
 */

import type { Auth as BetterAuthInstance } from 'better-auth'
import type { AnyPermissionBuilder, InferStatementFromBuilder } from "./type-inference";
import type { InferSessionFromAuth } from "../../../types";

// Re-export for convenience
export type { InferSessionFromAuth } from "../../../types";
export type { InferParams, ExtractBody, ExtractQuery } from "./type-inference";

/**
 * Permission object type - resource to actions mapping
 * Example: { project: ['create', 'read'], user: ['update'] }
 */
export type PermissionObject = Record<string, readonly string[]>;

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  /** Whether the permission check passed */
  success: boolean;
  /** Optional error message if check failed */
  error?: string;
}

/**
 * Error class for permission assertion failures.
 * Thrown by assertCheckPermission when permission check fails.
 * 
 * Can be caught and converted to ORPC/HTTP errors by middleware.
 */
export class PermissionAssertionError extends Error {
  /** The permissions that were checked */
  public readonly permissions: PermissionObject;
  /** Error code for mapping to HTTP/ORPC codes */
  public readonly code: 'FORBIDDEN' | 'UNAUTHORIZED';

  constructor(options: {
    message: string;
    permissions: PermissionObject;
    code?: 'FORBIDDEN' | 'UNAUTHORIZED';
  }) {
    super(options.message);
    this.name = 'PermissionAssertionError';
    this.permissions = options.permissions;
    this.code = options.code ?? 'FORBIDDEN';
  }
}

/**
 * Error class for role assertion failures.
 * Thrown by assertCheckRole when role check fails.
 */
export class RoleAssertionError extends Error {
  /** The roles that were required */
  public readonly requiredRoles: readonly string[];
  /** The user's actual role (if available) */
  public readonly actualRole: string | null;
  /** Error code for mapping to HTTP/ORPC codes */
  public readonly code: 'FORBIDDEN' | 'UNAUTHORIZED';

  constructor(options: {
    message: string;
    requiredRoles: readonly string[];
    actualRole?: string | null;
    code?: 'FORBIDDEN' | 'UNAUTHORIZED';
  }) {
    super(options.message);
    this.name = 'RoleAssertionError';
    this.requiredRoles = options.requiredRoles;
    this.actualRole = options.actualRole ?? null;
    this.code = options.code ?? 'FORBIDDEN';
  }
}

/**
 * Base options interface for plugin wrappers
 * 
 * @template TPermissionBuilder - Permission builder for type inference
 * @template TAuth - Better Auth instance type (used to infer session type)
 */
export interface BasePluginWrapperOptions<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends { $Infer: BetterAuthInstance['$Infer'] }
> {
  /** Better Auth instance */
  auth: TAuth;
  /** Request headers for API calls */
  headers: Headers;
  /** Permission builder for type inference */
  permissionBuilder?: TPermissionBuilder;
  /** 
   * Pre-fetched session to avoid redundant getSession() calls.
   * When provided, plugins will use this instead of calling auth.api.getSession()
   * 
   * Type is inferred from TAuth.$Infer.Session
   */
  session?: InferSessionFromAuth<TAuth> | null;
}

// ============================================================================
// Base Plugin Wrapper Class
// ============================================================================

/**
 * Abstract base class for Better Auth plugin wrappers.
 *
 * Provides:
 * - Common constructor pattern for auth, headers, and permission builder
 * - Protected access to auth instance and headers
 * - Type inference from permission builder
 * - Abstract permission checking method to be implemented by subclasses
 * - Optional session caching to avoid redundant getSession() calls
 *
 * Each subclass implements permission checking using the appropriate
 * Better Auth API:
 * - AdminPermissionsPlugin: Uses auth.api.userHasPermission()
 * - OrganizationsPermissionsPlugin: Uses auth.api.hasPermission()
 *
 * @template TPermissionBuilder - Permission builder for type inference
 * @template TAuth - Auth instance type (used to infer session type via $Infer)
 *
 * @example
 * ```typescript
 * class MyPluginWrapper extends BasePluginWrapper<TBuilder, TAuth> {
 *   async checkPermission(permissions: PermissionObject): Promise<boolean> {
 *     const result = await this.auth.api.myPluginHasPermission({
 *       headers: this.headers,
 *       body: { permissions },
 *     });
 *     return result.success;
 *   }
 * }
 * ```
 */
export abstract class BasePluginWrapper<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends { $Infer: BetterAuthInstance['$Infer'] }
> {
  /** Better Auth instance for API calls */
  protected readonly auth: TAuth;
  
  /** Request headers for authentication */
  protected readonly headers: Headers;
  
  /** Permission builder for type inference (optional) */
  protected readonly permissionBuilder: TPermissionBuilder | undefined;
  
  /** 
   * Pre-fetched session to avoid redundant getSession() calls.
   * When provided, plugins should use this instead of calling auth.api.getSession()
   * 
   * Type is inferred from TAuth.$Infer.Session
   */
  protected readonly session: InferSessionFromAuth<TAuth> | null | undefined;

  constructor(options: BasePluginWrapperOptions<TPermissionBuilder, TAuth>) {
    this.auth = options.auth;
    this.headers = options.headers;
    this.permissionBuilder = options.permissionBuilder;
    this.session = options.session;
  }

  /**
   * Check if the current user/context has the specified permissions.
   *
   * Each plugin wrapper implements this differently:
   * - Admin plugin: Checks user permissions via auth.api.userHasPermission()
   * - Organization plugin: Checks org permissions via auth.api.hasPermission()
   *
   * @param permissions - Resource to actions mapping to check
   * @returns Promise resolving to true if all permissions are granted
   *
   * @example
   * ```typescript
   * const canCreate = await plugin.checkPermission({
   *   project: ['create'],
   *   sale: ['create'],
   * });
   * ```
   */
  abstract checkPermission(
    permissions: InferStatementFromBuilder<TPermissionBuilder> | PermissionObject
  ): Promise<boolean>;

  /**
   * Assert that the current user/context has the specified permissions.
   * Throws PermissionAssertionError if the check fails.
   * 
   * This method is used by middleware factories to enforce permissions.
   * 
   * @param permissions - Resource to actions mapping to check
   * @param errorMessage - Optional custom error message
   * @throws PermissionAssertionError if permission check fails
   * 
   * @example
   * ```typescript
   * // In middleware - will throw if permission check fails
   * await plugin.assertCheckPermission({
   *   project: ['create', 'delete'],
   * });
   * // Code here only executes if permission granted
   * ```
   */
  abstract assertCheckPermission(
    permissions: InferStatementFromBuilder<TPermissionBuilder> | PermissionObject,
    errorMessage?: string
  ): Promise<void>;

  /**
   * Get the underlying auth instance.
   * Useful for advanced use cases where direct API access is needed.
   *
   * @returns The auth instance
   */
  getAuth(): TAuth {
    return this.auth;
  }

  /**
   * Get the request headers.
   * Useful when you need to make additional authenticated requests.
   *
   * @returns The request headers
   */
  getHeaders(): Headers {
    return this.headers;
  }

  /**
   * Get the cached session if available.
   * Useful when you need to access user data without making another API call.
   *
   * @returns The cached session or undefined/null if not provided
   */
  getSession(): InferSessionFromAuth<TAuth> | null | undefined {
    return this.session;
  }

  /**
   * Check if a cached session is available and not null.
   * 
   * @returns true if session was provided to the plugin and is not null
   */
  hasSession(): this is { session: InferSessionFromAuth<TAuth> } {
    return this.session !== undefined && this.session !== null;
  }
}

/**
 * Type alias for any plugin wrapper extending the base
 */
export type AnyPluginWrapper = BasePluginWrapper<AnyPermissionBuilder, BetterAuthInstance>;
