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
        const sessionData = await auth.api.getSession({
          headers: fromNodeHeaders(headers as unknown as IncomingHttpHeaders),
        });
        session = sessionData as UserSession | null;
      } catch (error) {
        console.error("Auth Plugin: Error extracting session:", error);
        // Continue with null session - allow unauthenticated access
      }

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
