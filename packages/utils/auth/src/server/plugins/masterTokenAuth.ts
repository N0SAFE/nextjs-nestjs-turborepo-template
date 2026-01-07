// plugins/master-token/index.ts
import type { BetterAuthPlugin, HookEndpointContext } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { parseCookie } from 'cookie'
import type { Session, User } from "../../types";

interface MasterTokenOptions {
    /**
     * The secret key that must be passed in the Authorization header or cookie.
     * Requests with `Bearer <devAuthKey>` header or `dev-auth-key=<devAuthKey>` cookie
     * will be authenticated as the master user.
     */
    devAuthKey: string;
    /**
     * Whether the master token authentication is enabled.
     * Should only be true in development environments.
     * @default true
     */
    enabled?: boolean;
    /**
     * The email of the user to impersonate when using the master token.
     * This user MUST exist in the database. If the user is not found,
     * the master token authentication will fail silently (no session injected).
     */
    masterEmail: string;
    /**
     * The name of the cookie to check for the dev auth key.
     * @default "dev-auth-key"
     */
    cookieName?: string;
}

// Cache for the master user to avoid repeated database queries
interface CachedUser {
    user: User | null;
    cachedAt: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Extract dev auth key from Authorization header or cookie
 */
function extractDevAuthKey(context: HookEndpointContext, cookieName: string): string | null {
    const headers = context.headers;
    if (!headers) {
        return null;
    }

    // Check Authorization header first (Bearer token)
    const authHeader = headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        return token;
    }
    
    const cookies = context.headers?.get("cookie")
    if (cookies) {
        const cookiesParsed = parseCookie(cookies);
        const cookieValue = cookiesParsed[cookieName];
        if (cookieValue) {
            return cookieValue;
        }
    }

    return null;
}

/**
 * Look up the master user from database with caching
 */
async function getMasterUser(adapter: { findOne: (opts: { model: string; where: { field: string; value: string }[] }) => Promise<unknown> }, masterEmail: string): Promise<User | null> {
    const now = Date.now();
    const cached = userCache.get(masterEmail);

    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
        return cached.user;
    }

    try {
        const result = await adapter.findOne({
            model: "user",
            where: [{ field: "email", value: masterEmail }],
        });

        const user = result as User | null;
        userCache.set(masterEmail, { user, cachedAt: now });

        if (!user) {
            console.warn(`[masterTokenPlugin] User with email "${masterEmail}" not found in database`);
        }

        return user;
    } catch (error) {
        console.error("[masterTokenPlugin] Error querying database for user:", error);
        return null;
    }
}

/**
 * Create a synthetic session object for the master user
 */
function createMasterSession(user: User, userAgent: string | null) {
    return {
        session: {
            id: `master-session-${String(Date.now())}`,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            userAgent: userAgent ?? "master-token",
            createdAt: new Date(),
            updatedAt: new Date(),
            token: `master-token-${String(Date.now())}`,
            ipAddress: null,
        },
        user,
    } satisfies Session
}

export const masterTokenPlugin = (options: MasterTokenOptions): BetterAuthPlugin => {
    const { devAuthKey, enabled = true, masterEmail, cookieName = "dev-auth-key" } = options;;

    /**
     * Matcher that validates all preconditions for master token auth:
     * - Plugin is enabled
     * - masterEmail is configured
     * - Valid dev auth key is present in Authorization header or cookie
     */
    const masterTokenMatcher = (context: HookEndpointContext): boolean => {
        // Check if plugin is enabled
        if (!enabled) {
            return false;
        }

        // Check if masterEmail is configured
        if (!masterEmail) {
            return false;
        }

        // Headers must exist to extract token
        if (!context.headers) {
            return false;
        }

        // Extract and validate dev auth key from header or cookie
        const token = extractDevAuthKey(context, cookieName);
        if (!token) {
            return false;
        }

        if (token !== devAuthKey) {
            return false;
        }

        return true;
    };

    return {
        id: "masterToken",
        hooks: {
            before: [
                {
                    // Match ALL endpoints when master token is present
                    // This injects an authenticated session for any endpoint that needs it
                    matcher: masterTokenMatcher,
                    handler: createAuthMiddleware(async (ctx) => {
                        // Get master user from database (with caching)
                        const user = await getMasterUser(ctx.context.adapter, masterEmail);

                        if (!user) {
                            console.warn(`[masterTokenPlugin] Cannot inject session: master user "${masterEmail}" not found`);
                            return;
                        }

                        // Create master session
                        const masterSession = createMasterSession(user, ctx.headers?.get("user-agent") ?? null);

                        // Inject the session into context so ALL endpoints see an authenticated user
                        // This allows admin operations, organization operations, etc. to proceed
                        return {
                            context: {
                                ...ctx,
                                context: {
                                    ...ctx.context,
                                    session: masterSession,
                                },
                            },
                        };
                    }),
                },
            ],
            after: [
                {
                    // Match session endpoints to return the master session as the response
                    // This is needed because session endpoints return the session to the client
                    matcher: (context: HookEndpointContext) => {
                        const sessionEndpoints = ['/get-session', '/session', '/sign-in/email', '/sign-up/email'];
                        const matchesEndpoint = sessionEndpoints.some(endpoint => context.path === endpoint);
                        
                        if (!matchesEndpoint) {
                            return false;
                        }

                        return masterTokenMatcher(context);
                    },
                    handler: createAuthMiddleware(async (ctx) => {
                        // Get master user from database (with caching)
                        const user = await getMasterUser(ctx.context.adapter, masterEmail);

                        if (!user) {
                            return;
                        }

                        // Create master session
                        const masterSession = createMasterSession(user, ctx.headers?.get("user-agent") ?? null);

                        // Return the response in the format Better Auth expects: { session, user }
                        return ctx.json({
                            session: masterSession.session,
                            user: masterSession.user
                        });
                    }),
                },
            ],
        },
    } satisfies BetterAuthPlugin;
};
