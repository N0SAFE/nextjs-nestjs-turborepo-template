import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import type {
  StandardHandlerPlugin,
  StandardHandlerOptions,
} from "@orpc/server/standard";
import type { Auth } from "@/auth";
import { AuthUtils } from "../auth-utils";
import type { ORPCAuthContext, UserSession } from "../types";

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
 * Context type for the auth plugin
 * This will be merged into the ORPC context
 */
export interface AuthPluginContext {
  auth: ORPCAuthContext;
  request: Request;
}

/**
 * Options for creating the auth plugin
 */
export interface AuthPluginOptions {
  /** The Better Auth instance */
  auth: Auth;
}

/**
 * Auth plugin for ORPC that automatically populates the auth context
 * with session data from Better Auth
 *
 * @example
 * ```ts
 * import { AuthPlugin } from '@/core/modules/auth/orpc/plugins/auth.plugin';
 *
 * ORPCModule.forRootAsync({
 *   useFactory: (request: Request, authService: AuthService) => {
 *     const authPlugin = new AuthPlugin({ auth: authService.instance as Auth });
 *     return {
 *       context: { request, auth: new AuthUtilsEmpty() },
 *       plugins: [authPlugin],
 *     };
 *   },
 *   inject: [REQUEST, AuthService],
 * })
 * ```
 */
export class AuthPlugin<TContext extends AuthPluginContext>
  implements StandardHandlerPlugin<TContext>
{
  readonly order = -100; // Run early to ensure auth context is available to other plugins/middlewares

  private readonly auth: Auth;

  constructor(options: AuthPluginOptions) {
    this.auth = options.auth;
  }

  init(options: StandardHandlerOptions<TContext>): void {
    const auth = this.auth;

    options.rootInterceptors ??= [];

    options.rootInterceptors.push(async (interceptorOptions) => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { context, request, next } = interceptorOptions;

      // Extract session from request headers
      let session: UserSession | null = null;

      try {
        // Get headers from the ORPC request object
        const headers = request.headers;
        const webHeaders = toWebHeaders(headers);
        
        console.log("Auth Plugin: Extracting session with headers:", Object.fromEntries(webHeaders.entries()));
        
        const sessionData = await auth.api.getSession({
          headers: webHeaders,
          asResponse: false,
        });
        
        console.log("Auth Plugin: Retrieved session data:", sessionData);
        
        // Better Auth's toAuthEndpoints wraps response in { response: Response }
        // We need to extract the actual session data from the Response body
        if (sessionData && typeof sessionData === 'object') {
          // Check if it's wrapped in { response: Response }
          if ('response' in sessionData && sessionData.response instanceof Response) {
            const response = sessionData.response as Response;
            if (response.ok) {
              const body = await response.json().catch(() => null);
              session = body as UserSession | null;
            }
          } 
          // Direct Response object
          else if (sessionData instanceof Response) {
            if (sessionData.ok) {
              const body = await sessionData.json().catch(() => null);
              session = body as UserSession | null;
            }
          }
          // Raw session data (ideal case)
          else if ('session' in sessionData && 'user' in sessionData) {
            session = sessionData as UserSession;
          }
        }
      } catch (error) {
        console.error("Auth Plugin: Error extracting session:", error);
        // Continue with null session - allow unauthenticated access
      }
      
      console.log("Auth Plugin: Final session object:", session);

      // Create auth utilities with session
      const authUtils = new AuthUtils(session, auth);

      // Continue with enriched context
      return next({
        ...interceptorOptions,
        context: {
          ...context,
          auth: authUtils,
        },
      });
    });
  }
}
