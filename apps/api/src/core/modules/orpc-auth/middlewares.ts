import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import type { Auth } from "@/auth";
import { AuthUtils } from "./auth-utils";
import type { AccessOptions, ORPCAuthContext, UserSession } from "./types";
import { os } from "@orpc/server";

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
    return os.$context<{
        request: Request;
    }>().middleware(async (opts) => {
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
    })
}

/**
 * Middleware factory for access control
 * Use this to require authentication, roles, or permissions on specific procedures
 *
 * After this middleware, use assertAuthenticated() helper to get proper types without null assertions.
 *
 * @example
 * ```ts
 * import { assertAuthenticated } from '@/core/modules/orpc-auth';
 *
 * implement(contract)
 *   .use(accessControl({ roles: ['admin'] }))
 *   .handler(({ context }) => {
 *     const auth = assertAuthenticated(context.auth);
 *     const userId = auth.user.id; // No ! needed
 *   })
 * ```
 */
export function accessControl(options: AccessOptions & { requireAuth?: boolean } = {}) {
    return async function accessControlMiddleware<TContext extends ORPCContextWithAuth>(opts: { context: TContext; input: unknown; next: (opts: { context: TContext }) => Promise<unknown> }) {
        const { auth } = opts.context;

        // Check if authentication is required
        if (options.requireAuth !== false) {
            // By default, require auth if any access options are specified
            const requiresAuth = options.requireAuth === true || Boolean(options.roles?.length) || Boolean(options.allRoles?.length) || Boolean(options.permissions);

            if (requiresAuth) {
                auth.requireAuth();
            }
        }

        // Enforce access requirements directly using require methods
        if (options.roles) {
            auth.requireRole(...options.roles);
        }
        if (options.allRoles) {
            auth.requireAllRoles(...options.allRoles);
        }
        if (options.permissions) {
            await auth.requirePermissions(options.permissions);
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
    return async function publicAccessMiddleware<TContext extends ORPCContextWithAuth>(opts: { context: TContext; input: unknown; next: (opts: { context: TContext }) => Promise<unknown> }) {
        // Simply pass through without any checks
        return opts.next(opts);
    };
}

/**
 * Middleware to require authentication but allow any authenticated user
 *
 * After this middleware, use assertAuthenticated() helper to get proper types without null assertions.
 *
 * @example
 * ```ts
 * import { assertAuthenticated } from '@/core/modules/orpc-auth';
 *
 * implement(contract)
 *   .use(requireAuth())
 *   .handler(({ context }) => {
 *     const auth = assertAuthenticated(context.auth);
 *     const userId = auth.user.id; // No ! needed
 *   })
 * ```
 */
export function requireAuth() {
    return os
        .$context<{
            auth: ORPCAuthContext;
        }>()
        .middleware(({ context, next }) => {
            return next({
                context: {
                    ...context,
                    auth: { ...context.auth, ...context.auth.requireAuth() },
                },
            });
        });
}
