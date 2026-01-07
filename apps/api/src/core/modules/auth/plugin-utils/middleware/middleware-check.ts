/**
 * Middleware Check Interface
 *
 * Represents an individual middleware check that can be:
 * - Executed directly via check() (throws on failure)
 * - Executed as boolean via checkBoolean() (returns success status)
 * - Converted to NestJS decorators or ORPC middlewares
 *
 * Each middleware definition method returns a MiddlewareCheck object
 * that encapsulates the check logic with its metadata.
 */

import {
  PermissionAssertionError,
  RoleAssertionError,
} from '@repo/auth/permissions/plugins';
import type { InferSessionFromAuth } from '@repo/auth';
import type { Auth as BetterAuthInstance } from 'better-auth';

/**
 * Permission object for error context
 */
export type PermissionObject = Record<string, string[]>;

// ============================================================================
// Types
// ============================================================================

/**
 * Default Auth type constraint for Better Auth instances.
 * All auth instances must have the $Infer pattern.
 */
export interface AuthConstraint { $Infer: BetterAuthInstance['$Infer'] }

/**
 * Default params type for route parameters.
 */
export type DefaultParams = Record<string, string | undefined>;

/**
 * Default query type for query parameters.
 */
export type DefaultQuery = Record<string, string | string[] | undefined>;

/**
 * Default body type for request body.
 */
export type DefaultBody = unknown;

/**
 * Context available to middleware checks.
 * Contains request information and resolved parameters.
 * 
 * The session type is automatically inferred from the TAuth generic,
 * providing full type safety for session.user and session.session properties.
 * 
 * @template TAuth - Better Auth instance type (for session inference)
 * @template TParams - Route parameters type
 * @template TQuery - Query parameters type
 * @template TBody - Request body type
 * 
 * @example
 * ```typescript
 * // Default usage (flexible types)
 * const ctx: MiddlewareContext = { headers: new Headers() };
 * 
 * // Typed usage with your auth instance
 * type MyContext = MiddlewareContext<typeof auth, { organizationId: string }>;
 * const ctx: MyContext = {
 *   headers: new Headers(),
 *   session: { user: { id: '...', email: '...' }, session: { id: '...' } },
 *   params: { organizationId: 'org_123' },
 * };
 * // ctx.session?.user is fully typed based on your auth config!
 * ```
 */
export interface MiddlewareContext<
  TAuth extends AuthConstraint = AuthConstraint,
  TParams extends DefaultParams = DefaultParams,
  TQuery extends DefaultQuery = DefaultQuery,
  TBody = DefaultBody,
> {
  /** Request headers containing authentication info */
  headers: Headers;
  /** Pre-resolved session (typed from TAuth via InferSessionFromAuth) */
  session?: InferSessionFromAuth<TAuth> | null;
  /** Route parameters (e.g., { organizationId: 'org_123' }) */
  params?: TParams;
  /** Query parameters */
  query?: TQuery;
  /** Request body (if applicable) */
  body?: TBody;
  /** Additional metadata (framework-specific) */
  meta?: Record<string, unknown>;
}

/**
 * Shorthand for MiddlewareContext with all defaults.
 * Use this when you don't need specific typing.
 */
export type AnyMiddlewareContext = MiddlewareContext;

/**
 * Function type for resolving dynamic values from context.
 * 
 * @template T - The type of value to resolve
 * @template TContext - The context type (defaults to AnyMiddlewareContext)
 */
export type ContextResolver<
  T,
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> = (context: TContext) => T | Promise<T>;

/**
 * Either a static value or a resolver function.
 * 
 * @template T - The type of value
 * @template TContext - The context type for resolver (defaults to AnyMiddlewareContext)
 */
export type ValueOrResolver<
  T,
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> = T | ContextResolver<T, TContext>;

/**
 * Error codes for middleware failures
 */
export type MiddlewareErrorCode =
  | 'UNAUTHORIZED' // No valid session
  | 'FORBIDDEN' // Valid session but no permission
  | 'NOT_FOUND' // Resource not found (e.g., organization)
  | 'BAD_REQUEST'; // Invalid parameters

/**
 * Result of a boolean check
 */
export interface CheckResult {
  success: boolean;
  error?: string;
  code?: MiddlewareErrorCode;
}

// ============================================================================
// Base MiddlewareCheck Interface
// ============================================================================

/**
 * Base middleware check interface.
 * All middleware checks implement this interface.
 * 
 * @template TContext - Context type for this check (defaults to AnyMiddlewareContext)
 */
export interface MiddlewareCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> {
  /** Unique name for this check type */
  readonly name: string;

  /** Human-readable description of what this check does */
  readonly description: string;

  /**
   * Execute the check, throwing an error if it fails.
   * Used by ORPC middlewares and NestJS guards.
   *
   * @param context - Request context with headers, params, etc.
   * @throws PermissionAssertionError, RoleAssertionError, or Error
   */
  check(context: TContext): Promise<void>;

  /**
   * Execute the check and return a boolean result.
   * Useful when you need to check without throwing.
   *
   * @param context - Request context with headers, params, etc.
   * @returns Promise resolving to CheckResult with success status
   */
  checkBoolean(context: TContext): Promise<CheckResult>;

  /**
   * Get the error code for this check type.
   * Used for mapping to HTTP status codes.
   */
  getErrorCode(): MiddlewareErrorCode;

  /**
   * Get the default error message for this check type.
   */
  getErrorMessage(): string;
}

// ============================================================================
// Specialized Check Types
// ============================================================================

/**
 * Session-based middleware check.
 * Requires a valid authenticated session.
 */
export interface SessionCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> extends MiddlewareCheck<TContext> {
  readonly name: 'requireSession';
}

/**
 * Permission-based middleware check.
 * Checks if user has specific permissions.
 */
export interface PermissionCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> extends MiddlewareCheck<TContext> {
  readonly name: 'hasPermission' | 'hasPermissionByRole';
  /** The permissions being checked */
  readonly permissions: PermissionObject;
  /** Optional role context (for hasPermissionByRole) */
  readonly role?: string;
}

/**
 * Role-based middleware check.
 * Checks if user has one of the specified roles.
 */
export interface RoleCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> extends MiddlewareCheck<TContext> {
  readonly name: 'hasRole' | 'requireAdminRole';
  /** Required roles (user must have at least one) */
  readonly requiredRoles: readonly string[];
  /** Match mode: 'any' (default) or 'all' */
  readonly matchMode: 'any' | 'all';
}

/**
 * Organization membership check.
 * Checks if user is a member of the organization.
 */
export interface MembershipCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> extends MiddlewareCheck<TContext> {
  readonly name: 'requireMembership' | 'requireActiveMember';
  /** Organization ID (static or resolved) */
  readonly organizationId?: string;
  /** Whether this checks active organization from session */
  readonly requiresActive: boolean;
}

/**
 * Organization role check.
 * Checks if user has a specific role in the organization.
 */
export interface OrganizationRoleCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> extends MiddlewareCheck<TContext> {
  readonly name: 'requireRole';
  /** Organization ID (static or resolved) */
  readonly organizationId: string;
  /** Required roles in the organization */
  readonly requiredRoles: readonly string[];
}

/**
 * Organization permission check.
 * Checks if user has permissions within the organization context.
 */
export interface OrganizationPermissionCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> extends MiddlewareCheck<TContext> {
  readonly name: 'hasOrgPermission';
  /** Organization ID (static or resolved) */
  readonly organizationId: string;
  /** The permissions being checked */
  readonly permissions: PermissionObject;
}

// ============================================================================
// Abstract Base Implementation
// ============================================================================

/**
 * Abstract base class for middleware checks.
 * Provides common functionality and enforces the interface contract.
 * 
 * @template TContext - Context type for this check (defaults to AnyMiddlewareContext)
 */
export abstract class BaseMiddlewareCheck<
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
> implements MiddlewareCheck<TContext>
{
  abstract readonly name: string;
  abstract readonly description: string;

  /**
   * Implement the actual check logic in subclasses.
   * Should return void on success or throw an appropriate error.
   */
  abstract check(context: TContext): Promise<void>;

  /**
   * Default implementation wraps check() in a try-catch.
   * Can be overridden for custom boolean handling.
   */
  async checkBoolean(context: TContext): Promise<CheckResult> {
    try {
      await this.check(context);
      return { success: true };
    } catch (error) {
      if (
        error instanceof PermissionAssertionError ||
        error instanceof RoleAssertionError
      ) {
        return {
          success: false,
          error: error.message,
          code: error.code,
        };
      }
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
          code: this.getErrorCode(),
        };
      }
      return {
        success: false,
        error: 'Unknown error',
        code: this.getErrorCode(),
      };
    }
  }

  abstract getErrorCode(): MiddlewareErrorCode;
  abstract getErrorMessage(): string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolve a value that may be static or a context resolver.
 *
 * @template T - Type of value to resolve
 * @template TContext - Context type for resolution
 * @param valueOrResolver - Static value or resolver function
 * @param context - Middleware context for resolution
 * @returns Resolved value
 */
export async function resolveValue<
  T,
  TContext extends AnyMiddlewareContext = AnyMiddlewareContext,
>(valueOrResolver: ValueOrResolver<T, TContext>, context: TContext): Promise<T> {
  if (typeof valueOrResolver === 'function') {
    return (valueOrResolver as ContextResolver<T, TContext>)(context);
  }
  return valueOrResolver;
}

/**
 * Create an authentication error (no valid session).
 */
export function createAuthError(message?: string): Error {
  const error = new Error(
    message ?? 'Authentication required. Please log in.'
  );
  (error as Error & { code: string }).code = 'UNAUTHORIZED';
  return error;
}

/**
 * Create a permission assertion error.
 */
export function createPermissionError(
  permissions: PermissionObject,
  message?: string
): PermissionAssertionError {
  return new PermissionAssertionError({
    message: message ?? 'You do not have the required permissions.',
    permissions,
    code: 'FORBIDDEN',
  });
}

/**
 * Create a role assertion error.
 */
export function createRoleError(
  requiredRoles: readonly string[],
  actualRole?: string | null,
  message?: string
): RoleAssertionError {
  return new RoleAssertionError({
    message: message ?? `Required role: ${requiredRoles.join(' or ')}`,
    requiredRoles,
    actualRole,
    code: 'FORBIDDEN',
  });
}
