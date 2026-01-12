/**
 * Plugin Wrapper Registry with Builder Pattern
 * 
 * Provides a heavily typed, builder-style registry for Better Auth plugin wrappers.
 * Each register() call returns a NEW registry with accumulated types.
 * Auth is provided once at registry creation, then only headers (and optional session) are needed per-request.
 */

import type { InferSessionFromAuth } from "./base-plugin-wrapper";
import type { Auth as BetterAuthInstance } from 'better-auth';

/**
 * Base interface for plugin wrapper classes
 * Note: Each plugin implements its own access control logic
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginWrapper {}

/**
 * Factory function type for creating plugin wrappers
 * Takes auth, headers, and optional session, returns a plugin wrapper instance
 * 
 * Session type is inferred from TAuth.$Infer.Session
 * 
 * @template TAuth - Auth instance type
 * @template TPlugin - Plugin wrapper type
 */
export type PluginWrapperFactory<
  TAuth extends { $Infer: BetterAuthInstance['$Infer'] },
  TPlugin extends PluginWrapper,
> = (auth: TAuth, headers: Headers, session?: InferSessionFromAuth<TAuth> | null) => TPlugin;

/**
 * Extract plugin type from registry
 */
type ExtractPluginType<TRegistry, TName extends keyof TRegistry> = 
  TRegistry[TName] extends PluginWrapper ? TRegistry[TName] : never;

/**
 * Type-safe Plugin Wrapper Registry with Builder Pattern
 * 
 * Key features:
 * - Auth is provided once at registry creation
 * - Each register() returns a NEW typed registry with accumulated plugins
 * - getAll(headers, session?) creates all plugins and returns a typed record
 * - create(name, headers, session?) creates a single typed plugin
 * - Session can be passed to avoid redundant getSession() calls in plugins
 * 
 * Session type is automatically inferred from TAuth.$Infer.Session
 * 
 * @template TAuth - Auth instance type (provided at construction)
 * @template TRegistry - Accumulated plugin types (grows with each register)
 * 
 * @example
 * ```typescript
 * const registry = new PluginWrapperRegistry(auth)
 *   .register('admin', (auth, headers, session) => new AdminPlugin({ auth, headers, session }))
 *   .register('organization', (auth, headers, session) => new OrgPlugin({ auth, headers, session }));
 * 
 * // Get all plugins with session - typed as { admin: AdminPlugin, organization: OrgPlugin }
 * const plugins = registry.getAll(headers, session);
 * plugins.admin.createUser(...);
 * plugins.organization.createOrganization(...);
 * 
 * // Or get single plugin with session
 * const admin = registry.create('admin', headers, session);
 * ```
 */
export class PluginWrapperRegistry<
  TAuth extends { $Infer: BetterAuthInstance['$Infer'] },
  TRegistry extends Record<string, PluginWrapper> = Record<string, PluginWrapper>
> {
  private readonly auth: TAuth;
  private readonly factories: Map<string, PluginWrapperFactory<TAuth, PluginWrapper>>;

  /**
   * Create a new plugin wrapper registry
   * 
   * @param auth - Better Auth instance to use for all plugins
   * @param existingFactories - Internal: factories from parent registry (for chaining)
   */
  constructor(
    auth: TAuth,
    existingFactories?: Map<string, PluginWrapperFactory<TAuth, PluginWrapper>>
  ) {
    this.auth = auth;
    this.factories = existingFactories 
      ? new Map(existingFactories) 
      : new Map<string, PluginWrapperFactory<TAuth, PluginWrapper>>();
  }

  /**
   * Register a plugin wrapper factory
   * 
   * Returns a NEW registry with the plugin type added to TRegistry.
   * This enables full type inference through the builder chain.
   * 
   * @param pluginName - Name of the plugin (e.g., 'admin', 'organization')
   * @param factory - Factory function: (auth, headers, session?) => PluginWrapper
   * @returns New registry instance with accumulated types
   * 
   * @example
   * ```typescript
   * const registry = new PluginWrapperRegistry(auth)
   *   .register('admin', (auth, headers, session) => new AdminPlugin({ auth, headers, session }))
   *   .register('org', (auth, headers, session) => new OrgPlugin({ auth, headers, session }));
   * // registry type: PluginWrapperRegistry<Auth, { admin: AdminPlugin, org: OrgPlugin }>
   * ```
   */
  register<TName extends string, TPlugin extends PluginWrapper>(
    pluginName: TName,
    factory: PluginWrapperFactory<TAuth, TPlugin>
  ): PluginWrapperRegistry<TAuth, TRegistry & Record<TName, TPlugin>> {
    // Create new Map with existing factories
    const newFactories = new Map(this.factories);
    newFactories.set(pluginName, factory as PluginWrapperFactory<TAuth, PluginWrapper>);
    
    // Return NEW registry with accumulated types
    return new PluginWrapperRegistry<TAuth, TRegistry & Record<TName, TPlugin>>(
      this.auth,
      newFactories
    );
  }

  /**
   * Create a single plugin wrapper instance
   * 
   * @param pluginName - Name of the registered plugin
   * @param headers - Request headers for API calls
   * @param session - Optional pre-fetched session to avoid redundant getSession() calls
   * @returns Typed plugin wrapper instance
   * @throws Error if plugin is not registered
   * 
   * @example
   * ```typescript
   * const admin = registry.create('admin', headers, session);
   * await admin.createUser({ ... });
   * ```
   */
  create<TName extends keyof TRegistry & string>(
    pluginName: TName,
    headers: Headers,
    session?: InferSessionFromAuth<TAuth> | null
  ): ExtractPluginType<TRegistry, TName> {
    const factory = this.factories.get(pluginName);
    if (!factory) {
      throw new Error(`Plugin not registered: ${pluginName}`);
    }
    return factory(this.auth, headers, session) as ExtractPluginType<TRegistry, TName>;
  }

  /**
   * Create all registered plugins at once
   * 
   * Returns a typed record where each key is a plugin name
   * and each value is the corresponding plugin instance.
   * 
   * @param headers - Request headers for API calls
   * @param session - Optional pre-fetched session to avoid redundant getSession() calls
   * @returns Typed record of all plugin instances
   * 
   * @example
   * ```typescript
   * const plugins = registry.getAll(headers, session);
   * // plugins: { admin: AdminPlugin, organization: OrgPlugin }
   * 
   * await plugins.admin.createUser({ ... });
   * await plugins.organization.createOrganization({ ... });
   * ```
   */
  getAll(headers: Headers, session?: InferSessionFromAuth<TAuth> | null): Readonly<TRegistry> {
    const result: Record<string, PluginWrapper> = {};
    for (const [name, factory] of this.factories) {
      result[name] = factory(this.auth, headers, session);
    }
    return Object.freeze(result) as Readonly<TRegistry>;
  }

  /**
   * Check if a plugin is registered
   * 
   * @param pluginName - Name of the plugin
   * @returns true if plugin is registered
   */
  has<TName extends string>(pluginName: TName): pluginName is TName & keyof TRegistry {
    return this.factories.has(pluginName);
  }

  /**
   * Get all registered plugin names
   * 
   * @returns Array of registered plugin names
   */
  getPluginNames(): (keyof TRegistry & string)[] {
    return Array.from(this.factories.keys()) as (keyof TRegistry & string)[];
  }

  /**
   * Get the auth instance
   * 
   * @returns The auth instance used by this registry
   */
  getAuth(): TAuth {
    return this.auth;
  }

  /**
   * Get total count of registered plugins
   * 
   * @returns Number of registered plugins
   */
  size(): number {
    return this.factories.size;
  }

  /**
   * Create a new registry with the same auth but no plugins
   * Useful for creating isolated plugin sets
   * 
   * @returns New empty registry with same auth
   */
  fork(): PluginWrapperRegistry<TAuth> {
    return new PluginWrapperRegistry(this.auth);
  }
}
