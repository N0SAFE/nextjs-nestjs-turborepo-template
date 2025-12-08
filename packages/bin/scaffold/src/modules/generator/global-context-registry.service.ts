/**
 * Global Context Registry Service
 *
 * Provides a central registry for inter-generator communication.
 * Generators can register routes, plugins, features, and hooks.
 * Other generators can subscribe to changes to auto-generate code.
 *
 * @example
 * // Health generator registers its routes
 * globalContext.registerRoutes('health', [
 *   { path: '/health', method: 'GET', handler: 'healthCheck', contract: 'healthContract' }
 * ]);
 *
 * // Entity hooks generator subscribes to route changes
 * globalContext.subscribeToRoutes((routes, added, removed) => {
 *   // Auto-generate hooks for new routes
 *   generateHooksForRoutes(added);
 * });
 */
import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import type {
  RouteRegistration,
  PluginRegistration,
  FeatureRegistration,
  HookRegistration,
  ContextSubscriptionCallback,
  SubscriptionOptions,
  ContextSubscription,
  ContextRegistrySnapshot,
  ContextRegistryEvent,
  PluginType,
  HttpMethod,
} from "../../types/generator.types";

/**
 * Internal subscription record
 */
interface SubscriptionRecord<T> {
  id: string;
  subscriberPluginId: string;
  callback: ContextSubscriptionCallback<T>;
  options?: SubscriptionOptions;
}

@Injectable()
export class GlobalContextRegistryService {
  private readonly logger = new Logger(GlobalContextRegistryService.name);

  // ============================================================================
  // Internal State
  // ============================================================================

  /** Registered routes by plugin */
  private readonly routes = new Map<string, RouteRegistration[]>();

  /** Registered plugins */
  private readonly plugins = new Map<string, PluginRegistration>();

  /** Registered features by plugin */
  private readonly features = new Map<string, FeatureRegistration[]>();

  /** Registered hooks by plugin */
  private readonly hooks = new Map<string, HookRegistration[]>();

  /** Route subscriptions */
  private readonly routeSubscriptions = new Map<string, SubscriptionRecord<RouteRegistration>>();

  /** Plugin subscriptions */
  private readonly pluginSubscriptions = new Map<string, SubscriptionRecord<PluginRegistration>>();

  /** Feature subscriptions */
  private readonly featureSubscriptions = new Map<string, SubscriptionRecord<FeatureRegistration>>();

  /** Hook subscriptions */
  private readonly hookSubscriptions = new Map<string, SubscriptionRecord<HookRegistration>>();

  /** Event log for debugging */
  private readonly eventLog: ContextRegistryEvent[] = [];

  // ============================================================================
  // Route Registration
  // ============================================================================

  /**
   * Register routes from a generator
   */
  registerRoutes(pluginId: string, routes: Omit<RouteRegistration, "pluginId">[]): void {
    const existingRoutes = this.routes.get(pluginId) || [];
    const newRoutes: RouteRegistration[] = routes.map((route) => ({
      ...route,
      pluginId,
    }));

    this.routes.set(pluginId, [...existingRoutes, ...newRoutes]);
    this.logger.debug(`Registered ${newRoutes.length} routes for plugin: ${pluginId}`);

    // Log events
    for (const route of newRoutes) {
      this.logEvent({ type: "route-added", route });
    }

    // Notify subscribers
    this.notifyRouteSubscribers(newRoutes, []);
  }

  /**
   * Register a single route
   */
  registerRoute(pluginId: string, route: Omit<RouteRegistration, "pluginId">): void {
    this.registerRoutes(pluginId, [route]);
  }

  /**
   * Unregister routes for a plugin
   */
  unregisterRoutes(pluginId: string, paths?: string[]): void {
    const existingRoutes = this.routes.get(pluginId) || [];
    
    if (paths) {
      // Remove specific routes
      const remaining = existingRoutes.filter((r) => !paths.includes(r.path));
      const removed = existingRoutes.filter((r) => paths.includes(r.path));
      this.routes.set(pluginId, remaining);
      
      for (const route of removed) {
        this.logEvent({ type: "route-removed", route });
      }
      
      this.notifyRouteSubscribers([], removed);
    } else {
      // Remove all routes for plugin
      this.routes.delete(pluginId);
      
      for (const route of existingRoutes) {
        this.logEvent({ type: "route-removed", route });
      }
      
      this.notifyRouteSubscribers([], existingRoutes);
    }
  }

  /**
   * Get all registered routes
   */
  getAllRoutes(): RouteRegistration[] {
    const allRoutes: RouteRegistration[] = [];
    for (const routes of this.routes.values()) {
      allRoutes.push(...routes);
    }
    return allRoutes;
  }

  /**
   * Get routes by plugin ID
   */
  getRoutesByPlugin(pluginId: string): RouteRegistration[] {
    return this.routes.get(pluginId) || [];
  }

  /**
   * Get routes by entity
   */
  getRoutesByEntity(entity: string): RouteRegistration[] {
    return this.getAllRoutes().filter((r) => r.entity === entity);
  }

  /**
   * Get routes by tag
   */
  getRoutesByTag(tag: string): RouteRegistration[] {
    return this.getAllRoutes().filter((r) => r.tags?.includes(tag));
  }

  /**
   * Check if route exists
   */
  hasRoute(path: string, method?: HttpMethod): boolean {
    return this.getAllRoutes().some(
      (r) => r.path === path && (!method || r.method === method)
    );
  }

  // ============================================================================
  // Plugin Registration
  // ============================================================================

  /**
   * Register a plugin
   */
  registerPlugin(
    pluginId: string,
    options: {
      version: string;
      type: PluginType;
      provides: string[];
      requires?: string[];
      config?: Record<string, unknown>;
    }
  ): void {
    const registration: PluginRegistration = {
      pluginId,
      version: options.version,
      type: options.type,
      provides: options.provides,
      requires: options.requires,
      config: options.config,
      registeredAt: new Date(),
    };

    this.plugins.set(pluginId, registration);
    this.logger.debug(`Registered plugin: ${pluginId} (${options.type})`);

    this.logEvent({ type: "plugin-added", plugin: registration });
    this.notifyPluginSubscribers([registration], []);
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.plugins.delete(pluginId);
      this.logEvent({ type: "plugin-removed", plugin });
      this.notifyPluginSubscribers([], [plugin]);
    }
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginRegistration[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): PluginRegistration | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Check if plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Check if a feature is provided by any plugin
   */
  hasFeatureProvider(feature: string): boolean {
    return Array.from(this.plugins.values()).some((p) => p.provides.includes(feature));
  }

  /**
   * Get plugins by type
   */
  getPluginsByType(type: PluginType): PluginRegistration[] {
    return Array.from(this.plugins.values()).filter((p) => p.type === type);
  }

  // ============================================================================
  // Feature Registration
  // ============================================================================

  /**
   * Register features from a generator
   */
  registerFeatures(pluginId: string, features: Omit<FeatureRegistration, "pluginId">[]): void {
    const existingFeatures = this.features.get(pluginId) || [];
    const newFeatures: FeatureRegistration[] = features.map((feature) => ({
      ...feature,
      pluginId,
    }));

    this.features.set(pluginId, [...existingFeatures, ...newFeatures]);
    this.logger.debug(`Registered ${newFeatures.length} features for plugin: ${pluginId}`);

    for (const feature of newFeatures) {
      this.logEvent({ type: "feature-added", feature });
    }

    this.notifyFeatureSubscribers(newFeatures, []);
  }

  /**
   * Register a single feature
   */
  registerFeature(pluginId: string, feature: Omit<FeatureRegistration, "pluginId">): void {
    this.registerFeatures(pluginId, [feature]);
  }

  /**
   * Unregister features for a plugin
   */
  unregisterFeatures(pluginId: string, featureIds?: string[]): void {
    const existingFeatures = this.features.get(pluginId) || [];
    
    if (featureIds) {
      const remaining = existingFeatures.filter((f) => !featureIds.includes(f.featureId));
      const removed = existingFeatures.filter((f) => featureIds.includes(f.featureId));
      this.features.set(pluginId, remaining);
      
      for (const feature of removed) {
        this.logEvent({ type: "feature-removed", feature });
      }
      
      this.notifyFeatureSubscribers([], removed);
    } else {
      this.features.delete(pluginId);
      
      for (const feature of existingFeatures) {
        this.logEvent({ type: "feature-removed", feature });
      }
      
      this.notifyFeatureSubscribers([], existingFeatures);
    }
  }

  /**
   * Get all registered features
   */
  getAllFeatures(): FeatureRegistration[] {
    const allFeatures: FeatureRegistration[] = [];
    for (const features of this.features.values()) {
      allFeatures.push(...features);
    }
    return allFeatures;
  }

  /**
   * Get features by plugin
   */
  getFeaturesByPlugin(pluginId: string): FeatureRegistration[] {
    return this.features.get(pluginId) || [];
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: string): FeatureRegistration[] {
    return this.getAllFeatures().filter((f) => f.category === category);
  }

  // ============================================================================
  // Hook Registration
  // ============================================================================

  /**
   * Register hooks from a generator
   */
  registerHooks(pluginId: string, hooks: Omit<HookRegistration, "pluginId">[]): void {
    const existingHooks = this.hooks.get(pluginId) || [];
    const newHooks: HookRegistration[] = hooks.map((hook) => ({
      ...hook,
      pluginId,
    }));

    this.hooks.set(pluginId, [...existingHooks, ...newHooks]);
    this.logger.debug(`Registered ${newHooks.length} hooks for plugin: ${pluginId}`);

    for (const hook of newHooks) {
      this.logEvent({ type: "hook-added", hook });
    }

    this.notifyHookSubscribers(newHooks, []);
  }

  /**
   * Register a single hook
   */
  registerHook(pluginId: string, hook: Omit<HookRegistration, "pluginId">): void {
    this.registerHooks(pluginId, [hook]);
  }

  /**
   * Unregister hooks for a plugin
   */
  unregisterHooks(pluginId: string, hookNames?: string[]): void {
    const existingHooks = this.hooks.get(pluginId) || [];
    
    if (hookNames) {
      const remaining = existingHooks.filter((h) => !hookNames.includes(h.name));
      const removed = existingHooks.filter((h) => hookNames.includes(h.name));
      this.hooks.set(pluginId, remaining);
      
      for (const hook of removed) {
        this.logEvent({ type: "hook-removed", hook });
      }
      
      this.notifyHookSubscribers([], removed);
    } else {
      this.hooks.delete(pluginId);
      
      for (const hook of existingHooks) {
        this.logEvent({ type: "hook-removed", hook });
      }
      
      this.notifyHookSubscribers([], existingHooks);
    }
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): HookRegistration[] {
    const allHooks: HookRegistration[] = [];
    for (const hooks of this.hooks.values()) {
      allHooks.push(...hooks);
    }
    return allHooks;
  }

  /**
   * Get hooks by plugin
   */
  getHooksByPlugin(pluginId: string): HookRegistration[] {
    return this.hooks.get(pluginId) || [];
  }

  /**
   * Get hooks by entity
   */
  getHooksByEntity(entity: string): HookRegistration[] {
    return this.getAllHooks().filter((h) => h.entity === entity);
  }

  /**
   * Get hooks by type
   */
  getHooksByType(type: string): HookRegistration[] {
    return this.getAllHooks().filter((h) => h.type === type);
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  /**
   * Subscribe to route changes
   */
  subscribeToRoutes(
    subscriberPluginId: string,
    callback: ContextSubscriptionCallback<RouteRegistration>,
    options?: SubscriptionOptions
  ): ContextSubscription {
    const id = uuidv4();
    const record: SubscriptionRecord<RouteRegistration> = {
      id,
      subscriberPluginId,
      callback,
      options,
    };

    this.routeSubscriptions.set(id, record);
    this.logger.debug(`Plugin ${subscriberPluginId} subscribed to route changes (${id})`);

    // Send initial state if requested
    if (options?.receiveInitial) {
      const routes = this.getFilteredRoutes(options);
      callback(routes, routes, []);
    }

    return {
      id,
      subscriberPluginId,
      type: "routes",
      unsubscribe: () => {
        this.routeSubscriptions.delete(id);
        this.logger.debug(`Plugin ${subscriberPluginId} unsubscribed from routes (${id})`);
      },
    };
  }

  /**
   * Subscribe to plugin changes
   */
  subscribeToPlugins(
    subscriberPluginId: string,
    callback: ContextSubscriptionCallback<PluginRegistration>,
    options?: SubscriptionOptions
  ): ContextSubscription {
    const id = uuidv4();
    const record: SubscriptionRecord<PluginRegistration> = {
      id,
      subscriberPluginId,
      callback,
      options,
    };

    this.pluginSubscriptions.set(id, record);
    this.logger.debug(`Plugin ${subscriberPluginId} subscribed to plugin changes (${id})`);

    if (options?.receiveInitial) {
      const plugins = this.getAllPlugins();
      callback(plugins, plugins, []);
    }

    return {
      id,
      subscriberPluginId,
      type: "plugins",
      unsubscribe: () => {
        this.pluginSubscriptions.delete(id);
        this.logger.debug(`Plugin ${subscriberPluginId} unsubscribed from plugins (${id})`);
      },
    };
  }

  /**
   * Subscribe to feature changes
   */
  subscribeToFeatures(
    subscriberPluginId: string,
    callback: ContextSubscriptionCallback<FeatureRegistration>,
    options?: SubscriptionOptions
  ): ContextSubscription {
    const id = uuidv4();
    const record: SubscriptionRecord<FeatureRegistration> = {
      id,
      subscriberPluginId,
      callback,
      options,
    };

    this.featureSubscriptions.set(id, record);
    this.logger.debug(`Plugin ${subscriberPluginId} subscribed to feature changes (${id})`);

    if (options?.receiveInitial) {
      const features = this.getFilteredFeatures(options);
      callback(features, features, []);
    }

    return {
      id,
      subscriberPluginId,
      type: "features",
      unsubscribe: () => {
        this.featureSubscriptions.delete(id);
        this.logger.debug(`Plugin ${subscriberPluginId} unsubscribed from features (${id})`);
      },
    };
  }

  /**
   * Subscribe to hook changes
   */
  subscribeToHooks(
    subscriberPluginId: string,
    callback: ContextSubscriptionCallback<HookRegistration>,
    options?: SubscriptionOptions
  ): ContextSubscription {
    const id = uuidv4();
    const record: SubscriptionRecord<HookRegistration> = {
      id,
      subscriberPluginId,
      callback,
      options,
    };

    this.hookSubscriptions.set(id, record);
    this.logger.debug(`Plugin ${subscriberPluginId} subscribed to hook changes (${id})`);

    if (options?.receiveInitial) {
      const hooks = this.getAllHooks();
      callback(hooks, hooks, []);
    }

    return {
      id,
      subscriberPluginId,
      type: "hooks",
      unsubscribe: () => {
        this.hookSubscriptions.delete(id);
        this.logger.debug(`Plugin ${subscriberPluginId} unsubscribed from hooks (${id})`);
      },
    };
  }

  // ============================================================================
  // Snapshot & Reset
  // ============================================================================

  /**
   * Get a complete snapshot of the registry
   */
  getSnapshot(): ContextRegistrySnapshot {
    return {
      routes: this.getAllRoutes(),
      plugins: this.getAllPlugins(),
      features: this.getAllFeatures(),
      hooks: this.getAllHooks(),
      timestamp: new Date(),
    };
  }

  /**
   * Reset the registry to a clean state
   */
  reset(): void {
    const snapshot = this.getSnapshot();

    this.routes.clear();
    this.plugins.clear();
    this.features.clear();
    this.hooks.clear();
    this.eventLog.length = 0;

    this.logEvent({ type: "snapshot-reset", snapshot });
    this.logger.debug("Context registry reset");
  }

  /**
   * Get event log for debugging
   */
  getEventLog(): ContextRegistryEvent[] {
    return [...this.eventLog];
  }

  /**
   * Get subscription counts for debugging
   */
  getSubscriptionCounts(): Record<string, number> {
    return {
      routes: this.routeSubscriptions.size,
      plugins: this.pluginSubscriptions.size,
      features: this.featureSubscriptions.size,
      hooks: this.hookSubscriptions.size,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private logEvent(event: ContextRegistryEvent): void {
    this.eventLog.push(event);
    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog.shift();
    }
  }

  private getFilteredRoutes(options?: SubscriptionOptions): RouteRegistration[] {
    let routes = this.getAllRoutes();

    if (options?.filterByPlugin) {
      const plugins = Array.isArray(options.filterByPlugin)
        ? options.filterByPlugin
        : [options.filterByPlugin];
      routes = routes.filter((r) => plugins.includes(r.pluginId));
    }

    if (options?.filterByTags?.length) {
      routes = routes.filter((r) =>
        r.tags?.some((t) => options.filterByTags?.includes(t))
      );
    }

    return routes;
  }

  private getFilteredFeatures(options?: SubscriptionOptions): FeatureRegistration[] {
    let features = this.getAllFeatures();

    if (options?.filterByPlugin) {
      const plugins = Array.isArray(options.filterByPlugin)
        ? options.filterByPlugin
        : [options.filterByPlugin];
      features = features.filter((f) => plugins.includes(f.pluginId));
    }

    if (options?.filterByCategory) {
      features = features.filter((f) => f.category === options.filterByCategory);
    }

    return features;
  }

  private notifyRouteSubscribers(
    added: RouteRegistration[],
    removed: RouteRegistration[]
  ): void {
    for (const record of this.routeSubscriptions.values()) {
      try {
        const filteredRoutes = this.getFilteredRoutes(record.options);
        const filteredAdded = this.filterRoutesByOptions(added, record.options);
        const filteredRemoved = this.filterRoutesByOptions(removed, record.options);

        if (filteredAdded.length > 0 || filteredRemoved.length > 0) {
          record.callback(filteredRoutes, filteredAdded, filteredRemoved);
        }
      } catch (error) {
        this.logger.error(
          `Error notifying route subscriber ${record.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private notifyPluginSubscribers(
    added: PluginRegistration[],
    removed: PluginRegistration[]
  ): void {
    for (const record of this.pluginSubscriptions.values()) {
      try {
        const allPlugins = this.getAllPlugins();
        record.callback(allPlugins, added, removed);
      } catch (error) {
        this.logger.error(
          `Error notifying plugin subscriber ${record.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private notifyFeatureSubscribers(
    added: FeatureRegistration[],
    removed: FeatureRegistration[]
  ): void {
    for (const record of this.featureSubscriptions.values()) {
      try {
        const filteredFeatures = this.getFilteredFeatures(record.options);
        const filteredAdded = this.filterFeaturesByOptions(added, record.options);
        const filteredRemoved = this.filterFeaturesByOptions(removed, record.options);

        if (filteredAdded.length > 0 || filteredRemoved.length > 0) {
          record.callback(filteredFeatures, filteredAdded, filteredRemoved);
        }
      } catch (error) {
        this.logger.error(
          `Error notifying feature subscriber ${record.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private notifyHookSubscribers(
    added: HookRegistration[],
    removed: HookRegistration[]
  ): void {
    for (const record of this.hookSubscriptions.values()) {
      try {
        const allHooks = this.getAllHooks();
        record.callback(allHooks, added, removed);
      } catch (error) {
        this.logger.error(
          `Error notifying hook subscriber ${record.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private filterRoutesByOptions(
    routes: RouteRegistration[],
    options?: SubscriptionOptions
  ): RouteRegistration[] {
    if (!options) return routes;

    let filtered = routes;

    if (options.filterByPlugin) {
      const plugins = Array.isArray(options.filterByPlugin)
        ? options.filterByPlugin
        : [options.filterByPlugin];
      filtered = filtered.filter((r) => plugins.includes(r.pluginId));
    }

    if (options.filterByTags?.length) {
      filtered = filtered.filter((r) =>
        r.tags?.some((t) => options.filterByTags?.includes(t))
      );
    }

    return filtered;
  }

  private filterFeaturesByOptions(
    features: FeatureRegistration[],
    options?: SubscriptionOptions
  ): FeatureRegistration[] {
    if (!options) return features;

    let filtered = features;

    if (options.filterByPlugin) {
      const plugins = Array.isArray(options.filterByPlugin)
        ? options.filterByPlugin
        : [options.filterByPlugin];
      filtered = filtered.filter((f) => plugins.includes(f.pluginId));
    }

    if (options.filterByCategory) {
      filtered = filtered.filter((f) => f.category === options.filterByCategory);
    }

    return filtered;
  }
}
