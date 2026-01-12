import type { Auth } from "@/auth";
import type { AdminPluginWrapper, OrganizationPluginWrapper } from "../plugin-utils/plugin-wrapper-factory";

/**
 * Brand symbol for authenticated context
 */
declare const AuthenticatedBrand: unique symbol;

/**
 * Auth context available in ORPC handlers
 * 
 * For access control, use plugin-based middlewares:
 * - `adminMiddlewares.requireRole(roles)` - Require specific admin role(s)
 * - `adminMiddlewares.requirePermission(permission)` - Require specific permission
 * - `organizationMiddlewares.requireRole(roles)` - Require organization role(s)
 * 
 * @template TLoggedIn - Whether user is logged in (boolean by default, true for authenticated contexts)
 */
export interface ORPCAuthContext<TLoggedIn extends boolean = boolean> {
  /** Whether user is authenticated */
  readonly isLoggedIn: TLoggedIn;

  /** User session (null if not authenticated) */
  readonly session: TLoggedIn extends true 
    ? Auth["$Infer"]["Session"]["session"] 
    : TLoggedIn extends false 
      ? null 
      : Auth["$Infer"]["Session"]["session"] | null;

  /** User object (null if not authenticated) */
  readonly user: TLoggedIn extends true 
    ? Auth["$Infer"]["Session"]["user"] 
    : TLoggedIn extends false 
      ? null 
      : Auth["$Infer"]["Session"]["user"] | null;

  /**
   * Admin plugin utilities with auto-injected headers
   * Provides platform-level user management operations
   */
  readonly admin: AdminPluginWrapper;

  /**
   * Organization plugin utilities with auto-injected headers
   * Provides organization-level operations
   */
  readonly org: OrganizationPluginWrapper;

  /**
   * Require authentication - throws if user is not logged in
   * 
   * Use this for programmatic auth checks in handlers when you need to
   * ensure authentication after some business logic.
   * 
   * @throws ORPCError with UNAUTHORIZED code if not authenticated
   * @returns Object with non-null session and user
   */
  requireAuth(): { 
    session: NonNullable<ORPCAuthContext<true>['session']>; 
    user: NonNullable<ORPCAuthContext<true>['user']>;
  };
  
  /** Internal brand for type narrowing (not accessible at runtime) */
  [AuthenticatedBrand]?: TLoggedIn extends true ? true : boolean;
}

/**
 * Authenticated auth context type (guaranteed non-null user and session)
 * This is the type after requireAuth() middleware has been applied
 */
export interface ORPCAuthenticatedContext extends ORPCAuthContext<true> {
  /** Internal brand for type narrowing */
  [AuthenticatedBrand]: true;
}

/**
 * Type assertion helper for authenticated context
 * Use this after requireAuth() middleware or when you need to manually narrow the type
 * 
 * @example
 * ```ts
 * // With requireAuth() middleware (recommended)
 * implement(contract)
 *   .use(requireAuth())
 *   .handler(({ context }) => {
 *     // After middleware, call assertAuthenticated to narrow types
 *     const auth = assertAuthenticated(context.auth);
 *     const userId = auth.user.id; // No ! needed
 *   })
 * 
 * // Without middleware (manual check)
 * implement(contract)
 *   .handler(({ context }) => {
 *     const auth = assertAuthenticated(context.auth); // throws if not authenticated
 *     const userId = auth.user.id;
 *   })
 * ```
 */
export function assertAuthenticated(auth: ORPCAuthContext): ORPCAuthenticatedContext {
  if (!auth.isLoggedIn || !auth.session || !auth.user) {
    throw new Error('Auth context is not authenticated');
  }
  return auth as ORPCAuthenticatedContext;
}
