import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import type { Auth } from "@/auth";
import { AuthUtils } from "./auth-utils";
import type { ORPCAuthContext } from "./types";
import { os, ORPCError } from "@orpc/server";

/**
 * Converts headers to web standard Headers.
 * Handles both Node.js IncomingHttpHeaders and web standard Headers.
 */
function toWebHeaders(headers: Headers | IncomingHttpHeaders | Record<string, string | string[] | undefined>): Headers {
  // If already a Headers object, return it directly
  if (headers instanceof Headers) {
    return headers;
  }
  // Otherwise, convert from Node.js style headers
  return fromNodeHeaders(headers as IncomingHttpHeaders);
}

/**
 * Minimal ORPC context requiring only auth utilities
 * Use this for middlewares that only need auth context (most access control)
 * 
 * Note: Index signatures (both string and symbol) allow compatibility with ORPC's
 * MergedInitialContext types which require full index signature compatibility.
 */
export interface ORPCContextWithAuthOnly<TLoggedIn extends boolean = boolean> {
    auth: ORPCAuthContext<TLoggedIn>;
    [key: string]: unknown;
    [key: symbol]: unknown;
}

/**
 * Full ORPC context with request and auth utilities
 * Use this for middlewares that need access to the raw request
 * 
 * Note: Index signature inherited from ORPCContextWithAuthOnly allows compatibility
 * with Record<string, unknown> constraints in middleware generics
 */
export interface ORPCContextWithAuth<TLoggedIn extends boolean = boolean> extends ORPCContextWithAuthOnly<TLoggedIn> {
    request: Request;
}

/**
 * Creates an auth middleware that populates context.auth with authentication utilities
 * This middleware should be added globally in the ORPC module configuration
 */
export function createAuthMiddleware(auth: Auth) {
    console.log('Creating auth middleware');
    return os.$context<{
        request: Request;
    }>().middleware(async (opts) => {
        // Extract session from request headers
        // ORPC provides headers as web standard Headers, not Node.js IncomingHttpHeaders
        const headers = opts.context.request.headers;
        const webHeaders = toWebHeaders(headers);
        const session = await auth.api.getSession({
            headers: webHeaders,
        });
        
        // Create auth utilities with session AND headers for plugin utilities
        const authUtils = new AuthUtils(session, auth, webHeaders);

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
    return os
        .$context<ORPCContextWithAuthOnly>()
        .middleware(({ context, next }) => {
            // Simply pass through without any checks
            return next({ context });
        });
}

/**
 * Middleware to require authentication but allow any authenticated user
 *
 * This middleware:
 * 1. Ensures user is logged in (throws UNAUTHORIZED if not)
 * 2. Narrows context type to ORPCContextWithAuth<true> so subsequent middlewares
 *    can require authenticated context at the type level
 *
 * @example
 * ```ts
 * implement(contract)
 *   .use(requireAuth())  // After this, context.auth is typed as ORPCAuthContext<true>
 *   .use(adminMiddlewares.requireAccess({ roles: ['admin'] }))  // Requires auth<true>
 *   .handler(({ context }) => {
 *     const userId = context.auth.user.id; // No null check needed
 *   })
 * ```
 */
export function requireAuth() {
    return os
        .$context<ORPCContextWithAuthOnly>()
        .middleware(({ context, next }) => {
            // This throws if not authenticated
            const authResult = context.auth.requireAuth();
            
            // Return narrowed context - auth is now ORPCAuthContext<true>
            return next({
                context: {
                    ...context,
                    auth: { 
                        ...context.auth, 
                        ...authResult,
                        isLoggedIn: true as const,
                    } as ORPCAuthContext<true>,
                },
            });
        });
}

/**
 * Middleware to require specific platform role(s)
 *
 * This middleware:
 * 1. Requires authenticated context (must be used after requireAuth())
 * 2. Checks if user has one of the allowed roles
 * 3. Throws FORBIDDEN if user doesn't have required role
 *
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 *
 * @example
 * ```ts
 * implement(contract)
 *   .use(requireAuth())  // Must be authenticated first
 *   .use(requirePlatformRole(['admin', 'superAdmin']))
 *   .handler(({ context }) => {
 *     // Only admins and superAdmins can access this
 *   })
 * ```
 */
export function requirePlatformRole(allowedRoles: string[]) {
    return os
        .$context<ORPCContextWithAuthOnly<true>>()  // Requires authenticated context
        .middleware(({ context, next }) => {
            const userRole = context.auth.user.role;
            
            if (!userRole || !allowedRoles.includes(userRole)) {
                throw new ORPCError('FORBIDDEN', {
                    message: 'Insufficient permissions. Required role: ' + allowedRoles.join(', '),
                });
            }
            
            return next({ context });
        });
}
