import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import type { Auth } from "@/auth";
import { AuthUtils } from "./auth-utils";
import type { AccessOptions, ORPCAuthContext, UserSession } from "./types";

/**
 * ORPC context with auth utilities
 */
export interface ORPCContextWithAuth {
  request: Request;
  auth: ORPCAuthContext;
}

/**
 * Creates an auth middleware that populates context.auth with authentication utilities
 * This middleware should be added globally in the ORPC module configuration
 */
export function createAuthMiddleware(auth: Auth) {
  return async function authMiddleware<TContext extends { request: Request }>(
    opts: {
      context: TContext;
      input: unknown;
      next: (opts: { context: TContext & { auth: ORPCAuthContext } }) => Promise<unknown>;
    }
  ) {
    // Extract session from request headers
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(opts.context.request.headers as unknown as IncomingHttpHeaders),
    });

    // Create auth utilities with session
    const authUtils = new AuthUtils(session as UserSession | null, auth);

    // Pass context with auth to next middleware/handler
    return opts.next({
      context: {
        ...opts.context,
        auth: authUtils,
      },
    });
  };
}

/**
 * Middleware factory for access control
 * Use this to require authentication, roles, or permissions on specific procedures
 * 
 * @example
 * ```ts
 * implement(contract)
 *   .use(accessControl({ roles: ['admin'] }))
 *   .handler(({ context }) => {
 *     // User is guaranteed to have admin role here
 *   })
 * ```
 */
export function accessControl(options: AccessOptions & { requireAuth?: boolean } = {}) {
  return async function accessControlMiddleware<TContext extends ORPCContextWithAuth>(
    opts: {
      context: TContext;
      input: unknown;
      next: (opts: { context: TContext }) => Promise<unknown>;
    }
  ) {
    const { auth } = opts.context;

    // Check if authentication is required
    if (options.requireAuth !== false) {
      // By default, require auth if any access options are specified
      const requiresAuth = 
        options.requireAuth === true ||
        Boolean(options.roles?.length) ||
        Boolean(options.allRoles?.length) ||
        Boolean(options.permissions);

      if (requiresAuth) {
        auth.requireAuth();
      }
    }

    // Check access if any options are provided
    if (options.roles || options.allRoles || options.permissions) {
      const hasAccess = await auth.access({
        roles: options.roles,
        allRoles: options.allRoles,
        permissions: options.permissions,
      });

      if (!hasAccess) {
        // Let the auth.access method throw appropriate errors
        // This is a fallback in case it returns false without throwing
        if (options.roles) {
          auth.requireRole(...options.roles);
        }
        if (options.allRoles) {
          auth.requireAllRoles(...options.allRoles);
        }
        if (options.permissions) {
          await auth.requirePermissions(options.permissions);
        }
      }
    }

    return opts.next(opts);
  };
}

/**
 * Middleware to mark a procedure as public (no authentication required)
 * This is useful when you want to explicitly allow unauthenticated access
 * 
 * @example
 * ```ts
 * implement(contract)
 *   .use(publicAccess())
 *   .handler(({ context }) => {
 *     // context.auth.isLoggedIn can be false here
 *   })
 * ```
 */
export function publicAccess() {
  return async function publicAccessMiddleware<TContext extends ORPCContextWithAuth>(
    opts: {
      context: TContext;
      input: unknown;
      next: (opts: { context: TContext }) => Promise<unknown>;
    }
  ) {
    // Simply pass through without any checks
    return opts.next(opts);
  };
}

/**
 * Middleware to require authentication but allow any authenticated user
 * 
 * @example
 * ```ts
 * implement(contract)
 *   .use(requireAuth())
 *   .handler(({ context }) => {
 *     // User is guaranteed to be authenticated
 *     const userId = context.auth.user!.id;
 *   })
 * ```
 */
export function requireAuth() {
  return async function requireAuthMiddleware<TContext extends ORPCContextWithAuth>(
    opts: {
      context: TContext;
      input: unknown;
      next: (opts: { context: TContext }) => Promise<unknown>;
    }
  ) {
    opts.context.auth.requireAuth();
    return opts.next(opts);
  };
}
