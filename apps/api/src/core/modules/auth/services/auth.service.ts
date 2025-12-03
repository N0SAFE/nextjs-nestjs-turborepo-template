import { Inject, Injectable } from "@nestjs/common";
import type { Auth } from "@/auth";
import {
	type AuthModuleOptions,
	MODULE_OPTIONS_TOKEN,
} from "../definitions/auth-module-definition"
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import { os } from "@orpc/server";
import { AuthUtils, AuthUtilsEmpty } from "../orpc/auth-utils";
import type { UserSession } from "../orpc/types";

/**
 * NestJS service that provides access to the Better Auth instance
 * Use generics to support auth instances extended by plugins
 */
@Injectable()
export class AuthService<T extends { api: T["api"] } = Auth> {
	constructor(
		@Inject(MODULE_OPTIONS_TOKEN)
		private readonly options: AuthModuleOptions<T>,
	) {}

	/**
	 * Returns the API endpoints provided by the auth instance
	 */
	get api(): T["api"] {
		return this.options.auth.api;
	}

	/**
	 * Returns the complete auth instance
	 * Access this for plugin-specific functionality
	 */
	get instance(): T {
		return this.options.auth;
	}

	/**
	 * Creates ORPC auth middleware that populates context.auth with authentication utilities
	 * This middleware should be added globally in the ORPC module configuration
	 * 
	 * @example
	 * ```ts
	 * ORPCModule.forRootAsync({
	 *   useFactory: (request: Request, authService: AuthService) => {
	 *     const authMiddleware = authService.createOrpcAuthMiddleware();
	 *     return {
	 *       context: { request },
	 *       middlewares: [authMiddleware],
	 *     };
	 *   },
	 *   inject: [REQUEST, AuthService],
	 * })
	 * ```
	 */
	createOrpcAuthMiddleware() {
		const auth = this.options.auth as any as Auth;
		
		return os.$context<{
			request: Request;
		}>().middleware(async (opts) => {
			console.log("Auth Middleware: Extracting session from request");
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
		});
	}

	/**
	 * Creates an empty auth utilities instance for initial ORPC context
	 * This is used when setting up the ORPC module before middleware runs
	 * 
	 * @example
	 * ```ts
	 * ORPCModule.forRootAsync({
	 *   useFactory: (request: Request, authService: AuthService) => {
	 *     const emptyAuthUtils = authService.createEmptyAuthUtils();
	 *     return {
	 *       context: { request, auth: emptyAuthUtils },
	 *     };
	 *   },
	 *   inject: [REQUEST, AuthService],
	 * })
	 * ```
	 */
	createEmptyAuthUtils() {
		return new AuthUtilsEmpty();
	}
}
