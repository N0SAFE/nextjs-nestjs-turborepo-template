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
import type { UserSession, AccessOptions } from "../utils/auth-utils";
import type { Permission, RoleName } from "@repo/auth/permissions";

/**
 * NestJS service that provides access to the Better Auth instance
 * Use generics to support auth instances extended by plugins
 * 
 * This service also provides utility methods for authentication and authorization
 * that can be used via dependency injection in any NestJS service
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

	// ============================================================================
	// Auth Utility Methods
	// These methods can be used via dependency injection in any NestJS service
	// ============================================================================

	/**
	 * Check if user has access based on options
	 * 
	 * @example
	 * ```ts
	 * private readonly authService = inject(AuthService);
	 * 
	 * const hasAccess = await this.authService.hasAccess(session, {
	 *   roles: ['admin'],
	 *   permissions: { project: ['delete'] }
	 * });
	 * ```
	 */
	async hasAccess(session: UserSession | null, options: AccessOptions): Promise<boolean> {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.access(options);
	}

	/**
	 * Check if user has specific role
	 * 
	 * @example
	 * ```ts
	 * const isAdmin = this.authService.hasRole(session, 'admin');
	 * ```
	 */
	hasRole(session: UserSession | null, role: RoleName): boolean {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.hasRole(role);
	}

	/**
	 * Check if user has specific permission
	 * 
	 * @example
	 * ```ts
	 * const canDelete = await this.authService.hasPermission(session, {
	 *   project: ['delete']
	 * });
	 * ```
	 */
	async hasPermission(session: UserSession | null, permission: Permission): Promise<boolean> {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.hasPermission(permission);
	}

	/**
	 * Get user roles as array
	 * 
	 * @example
	 * ```ts
	 * const roles = this.authService.getRoles(session);
	 * // Returns: ['user', 'admin']
	 * ```
	 */
	getRoles(session: UserSession | null): RoleName[] {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.getRoles();
	}

	/**
	 * Require user to be authenticated
	 * 
	 * @throws ORPCError with UNAUTHORIZED code if not authenticated
	 * @example
	 * ```ts
	 * const authenticatedSession = this.authService.requireAuth(session);
	 * ```
	 */
	requireAuth(session: UserSession | null): UserSession {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.requireAuth();
	}

	/**
	 * Require user to have specific role(s)
	 * 
	 * @param session - User session
	 * @param roles - User must have ANY of these roles
	 * @throws ORPCError with UNAUTHORIZED/FORBIDDEN code
	 * @example
	 * ```ts
	 * const authenticatedSession = this.authService.requireRole(session, 'admin', 'manager');
	 * ```
	 */
	requireRole(session: UserSession | null, ...roles: RoleName[]): UserSession {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.requireRole(...roles);
	}

	/**
	 * Require user to have ALL specified roles
	 * 
	 * @param session - User session
	 * @param roles - User must have ALL of these roles
	 * @throws ORPCError with UNAUTHORIZED/FORBIDDEN code
	 * @example
	 * ```ts
	 * const authenticatedSession = this.authService.requireAllRoles(session, 'admin', 'superuser');
	 * ```
	 */
	requireAllRoles(session: UserSession | null, ...roles: RoleName[]): UserSession {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.requireAllRoles(...roles);
	}

	/**
	 * Require user to have specific permissions
	 * 
	 * @param session - User session
	 * @param permissions - Required permission object
	 * @throws ORPCError with UNAUTHORIZED/FORBIDDEN code
	 * @example
	 * ```ts
	 * const authenticatedSession = await this.authService.requirePermissions(session, {
	 *   project: ['delete']
	 * });
	 * ```
	 */
	async requirePermissions(session: UserSession | null, permissions: Permission): Promise<UserSession> {
		const auth = this.options.auth as any as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.requirePermissions(permissions);
	}
}
