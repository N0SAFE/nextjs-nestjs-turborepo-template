import { Inject, Injectable } from "@nestjs/common";
import type { Auth } from "@/auth";
import {
	type AuthModuleOptions,
	MODULE_OPTIONS_TOKEN,
} from "../definitions/auth-module-definition";
import type { IncomingHttpHeaders } from "http";
import { os } from "@orpc/server";
import { AuthUtils, AuthUtilsEmpty } from "../orpc/auth-utils";
import type { ORPCContextWithAuthOnly } from "../orpc";
import type { UserSession } from "../utils/auth-utils";
import {
	createPluginRegistry,
	createPluginMiddlewares,
	type PlatformBuilder,
	type OrganizationBuilder,
	type PluginRegistry,
} from "../plugin-utils/plugin-wrapper-factory";
import {
	createOrpcMiddlewareProxy,
	type MiddlewareCheck,
	type ValueOrResolver,
	type PermissionObject,
	type OrpcMiddlewareProxy,
	type OrpcMiddlewareOptionsContext,
	type DecoratedMiddleware,
} from "../plugin-utils/middleware";
import type {
	InferStatementFromBuilder,
	InferRoleNamesFromBuilder,
	ApiMethodsWithAdminPlugin,
	ApiMethodsWithOrganizationPlugin,
} from "@repo/auth/permissions/plugins";

// ============================================================================
// Type Utilities for Headers
// ============================================================================

/** Type for request-scoped headers */
export type RequestHeaders = IncomingHttpHeaders | Record<string, string | string[]> | Headers;

/** Helper to normalize various header formats to Web Headers */
export function normalizeHeaders(headers: RequestHeaders): Headers {
	if (headers instanceof Headers) {
		return headers;
	}

	const result = new Headers();
	for (const [key, value] of Object.entries(headers)) {
		if (Array.isArray(value)) {
			// Join array values with comma as per HTTP spec
			result.set(key, value.join(', '));
		} else if (typeof value === 'string') {
			result.set(key, value);
		}
	}
	return result;
}

// ============================================================================
// Type Aliases for Permission Builder Types
// ============================================================================

/** 
 * Strict permission statement type for admin/platform context
 * Used internally when calling underlying middleware methods
 */
type StrictAdminPermissions = InferStatementFromBuilder<PlatformBuilder>;

/** 
 * Flexible permission type for admin/platform context
 * Accepts both strictly typed permissions AND loose PermissionObject for flexibility
 * Use this in public API methods
 */
type AdminPermissions = StrictAdminPermissions | PermissionObject;

/** Role name type for admin/platform context (string union: 'user' | 'admin' | 'superAdmin') */
type AdminRoles = InferRoleNamesFromBuilder<PlatformBuilder>;

/** 
 * Strict permission statement type for organization context
 * Used internally when calling underlying middleware methods
 */
type StrictOrgPermissions = InferStatementFromBuilder<OrganizationBuilder>;

/** 
 * Flexible permission statement type for organization context 
 * Accepts both strictly typed permissions AND loose PermissionObject for flexibility
 * Use this in public API methods
 */
type OrgPermissions = StrictOrgPermissions | PermissionObject;

/** Role name type for organization context (string union: 'owner' | 'admin' | 'member') */
type OrgRoles = InferRoleNamesFromBuilder<OrganizationBuilder>;

// ============================================================================
// Auth Type Constraint
// ============================================================================

/**
 * Full auth type constraint with both admin and organization plugins
 */
type FullAuthConstraint = 
	ApiMethodsWithAdminPlugin<PlatformBuilder> & 
	ApiMethodsWithOrganizationPlugin<OrganizationBuilder>;

// ============================================================================
// ORPC Middleware Builder (Using Typed Wrappers)
// ============================================================================

/**
 * Type for the admin middleware definition returned by createPluginMiddlewares().admin
 */
type AdminMiddlewareDefinition = ReturnType<typeof createPluginMiddlewares>['admin'];

/**
 * Type for the organization middleware definition returned by createPluginMiddlewares().organization
 */
type OrganizationMiddlewareDefinition = ReturnType<typeof createPluginMiddlewares>['organization'];

/** Internal proxy type for raw admin middleware */
type AdminOrpcProxy = OrpcMiddlewareProxy<AdminMiddlewareDefinition>;

/** Internal proxy type for raw organization middleware */
type OrgOrpcProxy = OrpcMiddlewareProxy<OrganizationMiddlewareDefinition>;

// ============================================================================
// Type Utilities for Widening Permission Parameters
// ============================================================================

/**
 * Widen a strict permission type to accept PermissionObject.
 * Maps StrictAdminPermissions -> AdminPermissions, StrictOrgPermissions -> OrgPermissions
 */
type WidenPermission<T> = 
	T extends StrictAdminPermissions ? AdminPermissions :
	T extends StrictOrgPermissions ? OrgPermissions :
	T;

/**
 * Widen a parameter that could be a value or a resolver function.
 * Handles the union type: T | OrpcValueOrResolver<T, TInput, TContext>
 * 
 * Uses OrpcMiddlewareOptionsContext for proper resolver function typing
 * to ensure ctx.input AND ctx.context are properly typed.
 */
type WidenArg<T, TInput, TContext = unknown> = 
	| WidenPermission<Exclude<T, (...args: never[]) => unknown>>  // Widen the value part
	| ((ctx: OrpcMiddlewareOptionsContext<TInput, TContext>) => WidenPermission<Exclude<T, (...args: never[]) => unknown>>);  // Widen the resolver part

/**
 * Extract the first param type from a method for forInput() return type.
 */
type ExtractFirstParam<T> = T extends (arg: infer P, ...rest: never[]) => unknown ? P : never;

/**
 * Unwrap ValueOrResolver to get the value type (not the resolver function).
 */
type UnwrapValueOrResolver<T> = T extends ((ctx: never) => unknown) | infer V ? V : T;

/**
 * Transform a proxy method to accept widened permission types.
 * 
 * Preserves the `.forInput()` method for the mapInput pattern where ORPC
 * automatically types the input from the procedure's schema.
 * 
 * Context types are preserved as ORPCContextWithAuthOnly<true> since these
 * middlewares run after requireAuth() and need to maintain typed context.auth.
 * 
 * TContext defaults to ORPCContextWithAuthOnly<true> since auth middlewares require authentication.
 */
type WidenedProxyMethod<TMethod> = TMethod extends (...args: infer TArgs) => infer TReturn
	? {
			// Static/resolver call: pass args, resolver gets OrpcMiddlewareOptionsContext<TInput>
			<TInput = unknown, TContext = ORPCContextWithAuthOnly<true>>(
				...args: { [K in keyof TArgs]: WidenArg<TArgs[K], TInput, TContext> }
			): TReturn;
			
			// forInput() method: returns middleware that uses ORPC's mapInput for auto-typed input
			// The middleware expects input to BE the first arg's value type (already extracted by mapInput)
			// Context types preserve ORPCContextWithAuthOnly<true> to maintain typed context.auth
			forInput(): DecoratedMiddleware<ORPCContextWithAuthOnly<true>, ORPCContextWithAuthOnly<true>, UnwrapValueOrResolver<WidenPermission<ExtractFirstParam<TMethod>>>, any, any, any>;
		}
	: TMethod;

/**
 * Transform an entire proxy to accept widened permission types.
 * All methods that accept permissions will now also accept PermissionObject.
 */
type WidenedOrpcProxy<T> = {
	[K in keyof T]: WidenedProxyMethod<T[K]>
};

/** Admin proxy with widened permission types */
type RelaxedAdminProxy = WidenedOrpcProxy<AdminOrpcProxy>;

/** Organization proxy with widened permission types */
type RelaxedOrgProxy = WidenedOrpcProxy<OrgOrpcProxy>;

/**
 * ORPC middleware builder - provides access to admin and organization middlewares
 * 
 * Uses widened type proxies that accept PermissionObject in addition to strict
 * permission types, while maintaining full type safety. Each method supports both
 * static values AND resolver functions for dynamic resolution.
 * 
 * @example
 * ```typescript
 * // Static value - type-safe with flexible permissions
 * const staticMiddleware = builder.admin.hasPermission({ user: ['list'] });
 * 
 * // Dynamic resolver - resolved at runtime from ORPC input
 * const dynamicMiddleware = builder.admin.hasPermission<{ perms: AdminPermissions }>(
 *   ctx => ctx.input.perms
 * );
 * 
 * // Works the same for organization middlewares
 * const orgMiddleware = builder.org.isMemberOf<{ orgId: string }>(ctx => ctx.input.orgId);
 * ```
 */
class OrpcMiddlewareBuilder {
	readonly admin: RelaxedAdminProxy;
	readonly org: RelaxedOrgProxy;

	constructor(
		getMiddlewares: () => ReturnType<typeof createPluginMiddlewares>,
		_getRegistry: () => ReturnType<typeof createPluginRegistry>
	) {
		const adminProxy = createOrpcMiddlewareProxy(getMiddlewares().admin);
		const orgProxy = createOrpcMiddlewareProxy(getMiddlewares().organization);
		
		// Cast to widened types - safe because the widened types accept a superset of the strict types
		this.admin = adminProxy as unknown as RelaxedAdminProxy;
		this.org = orgProxy as unknown as RelaxedOrgProxy;
	}
}

// ============================================================================
// Raw Checks Builder Classes (for advanced usage)
// ============================================================================

/**
 * Admin checks builder - provides raw middleware checks for advanced composition
 */
class AdminChecksBuilder {
	constructor(
		private readonly getMiddlewares: () => ReturnType<typeof createPluginMiddlewares>
	) {}

	requireSession(): MiddlewareCheck {
		return this.getMiddlewares().admin.requireSession();
	}

	hasPermission(permissions: AdminPermissions): MiddlewareCheck {
		return this.getMiddlewares().admin.hasPermission(permissions as StrictAdminPermissions);
	}

	hasRole(roles: readonly AdminRoles[]): MiddlewareCheck {
		return this.getMiddlewares().admin.hasRole(roles);
	}

	requireAdminRole(): MiddlewareCheck {
		return this.getMiddlewares().admin.requireAdminRole();
	}

	hasPermissionByRole(role: AdminRoles, permissions: AdminPermissions): MiddlewareCheck {
		return this.getMiddlewares().admin.hasPermissionByRole(role, permissions as StrictAdminPermissions);
	}
}

/**
 * Organization checks builder - provides raw middleware checks for advanced composition
 */
class OrganizationChecksBuilder {
	constructor(
		private readonly getMiddlewares: () => ReturnType<typeof createPluginMiddlewares>
	) {}

	requireSession(): MiddlewareCheck {
		return this.getMiddlewares().organization.requireSession();
	}

	isMemberOf(organizationId: ValueOrResolver<string>): MiddlewareCheck {
		return this.getMiddlewares().organization.isMemberOf(organizationId);
	}

	hasOrganizationRole(organizationId: ValueOrResolver<string>, roles: readonly OrgRoles[]): MiddlewareCheck {
		return this.getMiddlewares().organization.hasOrganizationRole(organizationId, roles);
	}

	isOrganizationOwner(organizationId: ValueOrResolver<string>): MiddlewareCheck {
		return this.getMiddlewares().organization.isOrganizationOwner(organizationId);
	}

	hasOrganizationPermission(permissions: OrgPermissions): MiddlewareCheck {
		return this.getMiddlewares().organization.hasOrganizationPermission(permissions as StrictOrgPermissions);
	}
}

/**
 * Checks builder - provides access to raw middleware checks
 */
class ChecksBuilder {
	readonly admin: AdminChecksBuilder;
	readonly org: OrganizationChecksBuilder;

	constructor(getMiddlewares: () => ReturnType<typeof createPluginMiddlewares>) {
		this.admin = new AdminChecksBuilder(getMiddlewares);
		this.org = new OrganizationChecksBuilder(getMiddlewares);
	}
}

// ============================================================================
// Static/Shared Registry Cache (Per Auth Configuration)
// ============================================================================

/**
 * Global cache for plugin registries and middlewares.
 * 
 * Uses a WeakMap keyed by the auth options object to ensure:
 * - One registry per auth configuration (shared across all requests)
 * - Proper cleanup when auth config is garbage collected
 * - No rebuilding of expensive registry structures per-request
 * 
 * Structure:
 * {
 *   registry: ReturnType<typeof createPluginRegistry>,
 *   middlewares: ReturnType<typeof createPluginMiddlewares>,
 * }
 */
const registryCache = new WeakMap<
	Record<string, unknown>,
	{
		registry: ReturnType<typeof createPluginRegistry>;
		middlewares: ReturnType<typeof createPluginMiddlewares>;
	}
>();

// ============================================================================
// AuthCoreService Class (SINGLETON - Business Logic Layer)
// ============================================================================

/**
 * Core authentication service containing all business logic.
 * 
 * **Architecture**:
 * - SINGLETON scope: One instance shared across the entire application
 * - Stateless: Takes headers as explicit parameters instead of injecting request
 * - Reusable: Works in both HTTP context (via AuthService) and CLI context
 * 
 * This is the "business logic layer" of authentication:
 * - Plugin registry access with explicit headers
 * - ORPC middleware builders
 * - Auth utilities and checks
 * 
 * **Usage**:
 * - HTTP contexts: Use AuthService which wraps this and auto-injects request headers
 * - CLI contexts: Use this directly with manual header passing
 * 
 * @example
 * ```typescript
 * // CLI usage (direct)
 * const headers = new Headers({ Authorization: `Bearer ${token}` });
 * const admin = this.authCore.plugin('admin', headers);
 * await admin.createUser({ ... });
 * 
 * // HTTP usage (via AuthService wrapper)
 * // Headers auto-injected from request context
 * const admin = this.authService.plugin('admin');
 * await admin.createUser({ ... });
 * ```
 */
@Injectable()
export class AuthCoreService<T extends { api: T["api"] } = Auth> {
	// Builder instances (lazy-initialized, shared across application)
	private _middleware: OrpcMiddlewareBuilder | null = null;
	private _checks: ChecksBuilder | null = null;

	constructor(
		@Inject(MODULE_OPTIONS_TOKEN)
		private readonly options: AuthModuleOptions<T>,
	) {}

	// ==========================================================================
	// Plugin Access (With Explicit Headers Parameter)
	// ==========================================================================

	/**
	 * Get a plugin by name with explicit headers parameter.
	 * 
	 * This is the core method for plugin access. Unlike the request-scoped
	 * AuthService.plugin(), this requires headers to be passed explicitly.
	 * 
	 * @template K - Plugin name, strongly typed from PluginRegistry keys
	 * @param name - Name of the plugin to retrieve (e.g., 'admin', 'organization')
	 * @param headers - HTTP headers to pass to the plugin (for authentication)
	 * @returns The plugin instance with fully typed methods
	 * 
	 * @example
	 * ```typescript
	 * // Create headers with authentication
	 * const headers = new Headers({ Authorization: `Bearer ${token}` });
	 * 
	 * // Get typed plugin
	 * const adminPlugin = authCore.plugin('admin', headers);
	 * await adminPlugin.createUser({ ... }); // Fully typed
	 * 
	 * const orgPlugin = authCore.plugin('organization', headers);
	 * await orgPlugin.createOrganization({ ... }); // Fully typed
	 * ```
	 */
	plugin<K extends keyof PluginRegistry>(name: K, headers: Headers): PluginRegistry[K] {
		const registry = this.getRegistry();
		return registry.create(name, headers) as PluginRegistry[K];
	}

	/**
	 * Get all plugins with explicit headers parameter.
	 * 
	 * @param headers - HTTP headers to pass to plugins (for authentication)
	 * @returns Object containing all available plugins
	 */
	getPlugins(headers: Headers) {
		return this.getRegistry().getAll(headers);
	}

	// ==========================================================================
	// Core Auth Access
	// ==========================================================================

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

	// ==========================================================================
	// Plugin Registry & Middlewares (Lazy Initialization with Caching)
	// ==========================================================================

	/**
	 * Get the plugin registry from the static cache
	 * 
	 * Built once per auth configuration and reused across all instances.
	 * This avoids expensive registry creation on every call.
	 */
	getRegistry(): ReturnType<typeof createPluginRegistry> {
		const authConfig = this.options.auth as unknown as Record<string, unknown>;
		let cached = registryCache.get(authConfig);
		
		if (!cached) {
			const registry = createPluginRegistry(authConfig as unknown as FullAuthConstraint);
			const middlewares = createPluginMiddlewares(
				authConfig as unknown as FullAuthConstraint,
				registry
			);
			cached = { registry, middlewares };
			registryCache.set(authConfig, cached);
		}
		
		return cached.registry;
	}

	/**
	 * Get the middleware definitions from the static cache
	 * 
	 * Built once per auth configuration and reused across all instances.
	 * Depends on the registry, so they're built together.
	 */
	getMiddlewares(): ReturnType<typeof createPluginMiddlewares> {
		const authConfig = this.options.auth as unknown as Record<string, unknown>;
		let cached = registryCache.get(authConfig);
		
		if (!cached) {
			const registry = createPluginRegistry(authConfig as unknown as FullAuthConstraint);
			const middlewares = createPluginMiddlewares(
				authConfig as unknown as FullAuthConstraint,
				registry
			);
			cached = { registry, middlewares };
			registryCache.set(authConfig, cached);
		}
		
		return cached.middlewares;
	}

	// ==========================================================================
	// ORPC Middleware API
	// ==========================================================================

	/**
	 * ORPC Middleware builder
	 * 
	 * Provides fluent API for creating ORPC middlewares:
	 * - `middleware.admin.hasPermission()` - Check admin permissions
	 * - `middleware.admin.hasRole()` - Check admin roles
	 * - `middleware.org.isMemberOf()` - Check organization membership
	 * - `middleware.org.hasOrganizationPermission()` - Check org permissions
	 * 
	 * @example
	 * ```typescript
	 * const adminProcedure = baseProcedure.use(
	 *   authCore.middleware.admin.hasPermission({ user: ['manage'] })
	 * );
	 * ```
	 */
	get middleware(): OrpcMiddlewareBuilder {
		this._middleware ??= new OrpcMiddlewareBuilder(
			() => this.getMiddlewares(), 
			() => this.getRegistry()
		);
		return this._middleware;
	}

	// ==========================================================================
	// Raw Checks API (Advanced Usage)
	// ==========================================================================

	/**
	 * Raw middleware checks builder
	 * 
	 * Provides access to raw `MiddlewareCheck` objects for advanced composition.
	 * Use with `guards.admin.composite()` or `middleware.admin.composite()`.
	 * 
	 * @example
	 * ```typescript
	 * const checks = [
	 *   authCore.checks.admin.requireSession(),
	 *   authCore.checks.admin.hasRole(['admin']),
	 * ];
	 * ```
	 */
	get checks(): ChecksBuilder {
		this._checks ??= new ChecksBuilder(() => this.getMiddlewares());
		return this._checks;
	}

	// ==========================================================================
	// ORPC Context Middleware
	// ==========================================================================

	/**
	 * Creates ORPC auth middleware that populates context.auth with authentication utilities
	 * This middleware should be added globally in the ORPC module configuration
	 * 
	 * @example
	 * ```ts
	 * ORPCModule.forRootAsync({
	 *   useFactory: (request: Request, authCore: AuthCoreService) => {
	 *     const authMiddleware = authCore.createOrpcAuthMiddleware();
	 *     return {
	 *       context: { request },
	 *       middlewares: [authMiddleware],
	 *     };
	 *   },
	 *   inject: [REQUEST, AuthCoreService],
	 * })
	 * ```
	 */
	createOrpcAuthMiddleware() {
		const auth = this.options.auth as unknown as Auth;

		return os.$context<{
			request: Request;
		}>().middleware(async (opts) => {
			// Extract session from request headers
			const session = await auth.api.getSession({
				headers: normalizeHeaders(opts.context.request.headers as unknown as IncomingHttpHeaders),
			});
			
			// Create auth utilities with session
			const authUtils = new AuthUtils(session, auth);

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
	 *   useFactory: (request: Request, authCore: AuthCoreService) => {
	 *     const emptyAuthUtils = authCore.createEmptyAuthUtils();
	 *     return {
	 *       context: { request, auth: emptyAuthUtils },
	 *     };
	 *   },
	 *   inject: [REQUEST, AuthCoreService],
	 * })
	 * ```
	 */
	createEmptyAuthUtils() {
		return new AuthUtilsEmpty(this.options.auth as unknown as Auth);
	}

	// ==========================================================================
	// Utility Methods
	// ==========================================================================

	/**
	 * Require user to be authenticated
	 * 
	 * @throws ORPCError with UNAUTHORIZED code if not authenticated
	 * @example
	 * ```ts
	 * const authenticatedSession = authCore.requireAuth(session);
	 * ```
	 */
	requireAuth(session: UserSession | null): UserSession {
		const auth = this.options.auth as unknown as Auth;
		const utils = new AuthUtils(session, auth);
		return utils.requireAuth();
	}

	/**
	 * Generate the Better Auth OpenAPI schema via the underlying auth API.
	 * This wrapper avoids exposing the raw `api` surface externally and keeps
	 * our public usage consistent with the plugin-centric approach.
	 *
	 * Note: The Better Auth schema is static and does not require request headers.
	 *
	 * @returns OpenAPI schema object compatible with openapi-merge
	 */
	async generateAuthOpenAPISchema() {
		const auth = this.options.auth as unknown as Auth;
		// Delegates to Better Auth's API method
		return auth.api.generateOpenAPISchema({});
	}
}

// Re-export types that consumers might need
export type { AdminPermissions, OrgPermissions, AdminRoles, OrgRoles };
