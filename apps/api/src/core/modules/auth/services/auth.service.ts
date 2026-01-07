import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import type { Auth } from "@/auth";
import {
	AuthCoreService,
	normalizeHeaders,
	type RequestHeaders,
} from "./auth-core.service";
import type { PluginRegistry } from "../plugin-utils/plugin-wrapper-factory";
import type { AuthWithPlugins } from "../definitions/auth-module-definition";

// ============================================================================
// AuthService Class (REQUEST-SCOPED - Wrapper for HTTP Context)
// ============================================================================

/**
 * Request-scoped authentication service that wraps AuthCoreService.
 * 
 * **Architecture**:
 * - REQUEST-scoped: One instance per HTTP request
 * - Thin wrapper: Delegates all business logic to AuthCoreService
 * - Auto-injects headers: Automatically passes request headers to core methods
 * 
 * This service provides convenience for HTTP handlers:
 * - `plugin()` - Get plugin with auto-injected request headers
 * - All other methods delegate to AuthCoreService
 * 
 * **Why this pattern?**
 * - AuthCoreService (singleton) contains all business logic
 * - AuthService (request-scoped) adds automatic header injection
 * - CLI commands can use AuthCoreService directly with manual headers
 * 
 * @example
 * ```typescript
 * // In an HTTP handler (headers auto-injected)
 * const admin = this.authService.plugin('admin');
 * await admin.createUser({ ... });
 * 
 * // In a CLI command (use AuthCoreService directly)
 * const headers = new Headers({ Authorization: `Bearer ${token}` });
 * const admin = this.authCoreService.plugin('admin', headers);
 * await admin.createUser({ ... });
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class AuthService<T extends AuthWithPlugins = Auth> {

	constructor(
		private readonly core: AuthCoreService<T>,
		@Inject(REQUEST)
		private readonly request: Request,
	) {}

	// ==========================================================================
	// Request-Aware Plugin Access (Auto Headers Injection)
	// ==========================================================================

	/**
	 * Get the request headers, normalized to Web Headers format.
	 * Automatically extracted from the current request context.
	 */
	private getRequestHeaders(): Headers {
		const rawHeaders: unknown = this.request.headers;
		
		if (!rawHeaders || typeof rawHeaders !== 'object') {
			return new Headers();
		}

		return normalizeHeaders(rawHeaders as RequestHeaders);
	}

	/**
	 * Get a plugin by name with automatic header injection from request.
	 * 
	 * This method provides:
	 * - Compile-time type checking for plugin names (only 'admin', 'organization', etc.)
	 * - Full type safety for plugin methods and return types
	 * - Automatic header injection from the request context
	 * - IDE autocomplete for plugin names and methods
	 * 
	 * @template K - Plugin name, strongly typed from PluginRegistry keys
	 * @param name - Name of the plugin to retrieve (e.g., 'admin', 'organization')
	 * @returns The plugin instance with fully typed methods
	 * 
	 * @example
	 * ```typescript
	 * // Strongly typed - only 'admin' and 'organization' are valid
	 * const adminPlugin = this.authService.plugin('admin');
	 * await adminPlugin.createUser({ ... }); // Fully typed
	 * 
	 * const orgPlugin = this.authService.plugin('organization');
	 * await orgPlugin.createOrganization({ ... }); // Fully typed
	 * ```
	 */
	plugin<K extends keyof PluginRegistry>(name: K): PluginRegistry[K] {
		const headers = this.getRequestHeaders();
		return this.core.plugin(name, headers);
	}

	/**
	 * Get all plugins with auto-injected request headers.
	 * 
	 * @returns Object containing all available plugins
	 */
	getPlugins() {
		const headers = this.getRequestHeaders();
		return this.core.getPlugins(headers);
	}

	// ==========================================================================
	// Delegated Core Methods (No Request Context Needed)
	// ==========================================================================

	/**
	 * Returns the API endpoints provided by the auth instance.
	 * Delegated to AuthCoreService.
	 */
	get api(): T["api"] {
		return this.core.api;
	}

	/**
	 * Returns the complete auth instance.
	 * Delegated to AuthCoreService.
	 */
	get instance(): T {
		return this.core.instance;
	}

	/**
	 * Get the plugin registry for direct plugin access with manual headers.
	 * Delegated to AuthCoreService.
	 * 
	 * @example
	 * ```ts
	 * const plugins = this.authService.getPluginRegistry().getAll(headers);
	 * await plugins.admin.createUser({ ... });
	 * ```
	 */
	getPluginRegistry() {
		return this.core.getRegistry();
	}

	/**
	 * ORPC Middleware builder.
	 * Delegated to AuthCoreService.
	 * 
	 * @example
	 * ```typescript
	 * const adminProcedure = baseProcedure.use(
	 *   authService.middleware.admin.hasPermission({ user: ['manage'] })
	 * );
	 * ```
	 */
	get middleware() {
		return this.core.middleware;
	}

	/**
	 * Raw middleware checks builder.
	 * Delegated to AuthCoreService.
	 */
	get checks() {
		return this.core.checks;
	}

	/**
	 * Creates ORPC auth middleware.
	 * Delegated to AuthCoreService.
	 */
	createOrpcAuthMiddleware() {
		return this.core.createOrpcAuthMiddleware();
	}

	/**
	 * Creates an empty auth utilities instance.
	 * Delegated to AuthCoreService.
	 */
	createEmptyAuthUtils() {
		return this.core.createEmptyAuthUtils();
	}

	/**
	 * Require user to be authenticated.
	 * Delegated to AuthCoreService.
	 */
	requireAuth(session: Parameters<AuthCoreService<T>['requireAuth']>[0]) {
		return this.core.requireAuth(session);
	}

	/**
	 * Generate the Better Auth OpenAPI schema.
	 * Delegated to AuthCoreService.
	 */
	async generateAuthOpenAPISchema() {
		return this.core.generateAuthOpenAPISchema();
	}
}
