/**
 * App Type Registry Service
 *
 * Central registry for managing app types, their capabilities, and plugin compatibility.
 * Integrates with the PluginRegistryService for cross-validation.
 *
 * @see ARCHITECTURE.md - Multi-App Type System section
 */

import {
  type AppType,
  type AppTypeId,
  type AppCapability,
  type AppConfig,
  type ResolvedAppConfig,
  type AppTypeMetadata,
  APP_TYPES,
  APP_TYPE_IDS,
  isValidAppTypeId,
  getAppType,
  getStableAppTypes,
  getAllAppTypes,
  appTypeHasCapability,
  appTypeSupportsPlugin,
  getAppTypesWithCapability,
  getAppTypesSupportingPlugin,
  getAppTypeMetadata,
} from "../../types/app.types";
import type { Plugin } from "../../types/plugin.types";

// ============================================================================
// Service Class
// ============================================================================

/**
 * App Type Registry Service
 *
 * Manages app type definitions and provides validation/querying capabilities
 * for multi-app scaffolding scenarios.
 */
export class AppTypeRegistryService {
  private static instance: AppTypeRegistryService;
  private customAppTypes: Map<AppTypeId, AppType> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AppTypeRegistryService {
    if (!AppTypeRegistryService.instance) {
      AppTypeRegistryService.instance = new AppTypeRegistryService();
    }
    return AppTypeRegistryService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    AppTypeRegistryService.instance = undefined as unknown as AppTypeRegistryService;
  }

  // ==========================================================================
  // App Type Queries
  // ==========================================================================

  /**
   * Get app type by ID
   */
  getById(id: AppTypeId): AppType | undefined {
    return this.customAppTypes.get(id) ?? getAppType(id);
  }

  /**
   * Get all registered app types
   */
  getAll(): AppType[] {
    const builtIn = getAllAppTypes();
    const custom = Array.from(this.customAppTypes.values());

    // Merge, with custom overriding built-in
    const merged = new Map<AppTypeId, AppType>();
    for (const app of builtIn) {
      merged.set(app.id, app);
    }
    for (const app of custom) {
      merged.set(app.id, app);
    }

    return Array.from(merged.values());
  }

  /**
   * Get all stable app types
   */
  getStable(): AppType[] {
    return this.getAll().filter((app) => app.stable);
  }

  /**
   * Get all app type IDs
   */
  getAllIds(): AppTypeId[] {
    const customIds = Array.from(this.customAppTypes.keys());
    return [...new Set([...APP_TYPE_IDS, ...customIds])];
  }

  /**
   * Check if app type ID is valid
   */
  isValid(id: string): id is AppTypeId {
    return isValidAppTypeId(id) || this.customAppTypes.has(id as AppTypeId);
  }

  /**
   * Get app type metadata for UI
   */
  getMetadata(): AppTypeMetadata[] {
    return this.getAll().map((app) => ({
      id: app.id,
      name: app.name,
      description: app.description,
      defaultPath: app.defaultPath,
      icon: app.icon,
      stable: app.stable,
      capabilityCount: app.capabilities.length,
    }));
  }

  // ==========================================================================
  // Capability Queries
  // ==========================================================================

  /**
   * Check if app type has a capability
   */
  hasCapability(appTypeId: AppTypeId, capability: AppCapability): boolean {
    const appType = this.getById(appTypeId);
    return appType?.capabilities.includes(capability) ?? false;
  }

  /**
   * Get all capabilities for an app type
   */
  getCapabilities(appTypeId: AppTypeId): AppCapability[] {
    return this.getById(appTypeId)?.capabilities ?? [];
  }

  /**
   * Get app types that have a specific capability
   */
  getByCapability(capability: AppCapability): AppType[] {
    return this.getAll().filter((app) => app.capabilities.includes(capability));
  }

  /**
   * Get app types that have ALL specified capabilities
   */
  getByCapabilities(capabilities: AppCapability[]): AppType[] {
    return this.getAll().filter((app) =>
      capabilities.every((cap) => app.capabilities.includes(cap))
    );
  }

  // ==========================================================================
  // Plugin Compatibility
  // ==========================================================================

  /**
   * Check if app type supports a plugin
   */
  supportsPlugin(appTypeId: AppTypeId, pluginId: string): boolean {
    const appType = this.getById(appTypeId);
    return appType?.supportedPlugins.includes(pluginId) ?? false;
  }

  /**
   * Get supported plugins for an app type
   */
  getSupportedPlugins(appTypeId: AppTypeId): string[] {
    return this.getById(appTypeId)?.supportedPlugins ?? [];
  }

  /**
   * Get required plugins for an app type
   */
  getRequiredPlugins(appTypeId: AppTypeId): string[] {
    return this.getById(appTypeId)?.requiredPlugins ?? [];
  }

  /**
   * Get app types that support a plugin
   */
  getAppTypesSupportingPlugin(pluginId: string): AppType[] {
    return this.getAll().filter((app) => app.supportedPlugins.includes(pluginId));
  }

  /**
   * Validate plugin compatibility with app type
   * Returns validation result with details
   */
  validatePluginCompatibility(
    appTypeId: AppTypeId,
    pluginId: string,
    plugin?: Plugin
  ): AppPluginValidationResult {
    const appType = this.getById(appTypeId);

    if (!appType) {
      return {
        valid: false,
        appTypeId,
        pluginId,
        reason: `Unknown app type: ${appTypeId}`,
        severity: "error",
      };
    }

    // Check if plugin is in the supported list
    if (!appType.supportedPlugins.includes(pluginId)) {
      return {
        valid: false,
        appTypeId,
        pluginId,
        reason: `Plugin '${pluginId}' is not supported by app type '${appTypeId}'`,
        severity: "warning", // May still work, just not officially supported
        suggestion: `Consider using one of: ${appType.supportedPlugins.slice(0, 5).join(", ")}...`,
      };
    }

    // If we have the plugin definition, also check its supportedApps
    if (plugin?.supportedApps) {
      const supportedApps = plugin.supportedApps;
      if (supportedApps !== "*" && !supportedApps.includes(appTypeId)) {
        return {
          valid: false,
          appTypeId,
          pluginId,
          reason: `Plugin '${pluginId}' does not support app type '${appTypeId}'`,
          severity: "error",
          suggestion: `Plugin supports: ${Array.isArray(supportedApps) ? supportedApps.join(", ") : supportedApps}`,
        };
      }
    }

    return {
      valid: true,
      appTypeId,
      pluginId,
    };
  }

  /**
   * Get compatibility matrix for all app types and plugins
   */
  getCompatibilityMatrix(pluginIds: string[]): AppPluginCompatibilityMatrix {
    const matrix: AppPluginCompatibilityMatrix = {
      appTypes: this.getAllIds(),
      plugins: pluginIds,
      compatibility: {} as Record<AppTypeId, Record<string, boolean>>,
    };

    for (const appTypeId of matrix.appTypes) {
      matrix.compatibility[appTypeId] = {};
      for (const pluginId of pluginIds) {
        matrix.compatibility[appTypeId][pluginId] = this.supportsPlugin(appTypeId, pluginId);
      }
    }

    return matrix;
  }

  // ==========================================================================
  // App Configuration
  // ==========================================================================

  /**
   * Extract plugin IDs from either object or array format
   * Supports both legacy array format and new object format
   */
  private extractPluginIds(plugins: AppConfig['plugins']): string[] {
    if (Array.isArray(plugins)) {
      return plugins;
    }
    if (typeof plugins === 'object' && plugins !== null) {
      return Object.keys(plugins).filter(id => {
        const config = plugins[id];
        // Plugin is enabled if value is true or an object without enabled: false
        return config === true || (typeof config === 'object' && (config as { enabled?: boolean }).enabled !== false);
      });
    }
    return [];
  }

  /**
   * Resolve app configuration with defaults
   */
  resolveAppConfig(config: AppConfig): ResolvedAppConfig {
    const appType = this.getById(config.type);

    if (!appType) {
      throw new Error(`Unknown app type: ${config.type}`);
    }

    // Extract plugin IDs from either format
    const pluginIds = this.extractPluginIds(config.plugins);

    // Get required plugins that aren't explicitly listed
    const autoEnabledPlugins = appType.requiredPlugins.filter(
      (p) => !pluginIds.includes(p)
    );

    // Combine plugins: explicit + auto-enabled
    const allPlugins = [...new Set([...autoEnabledPlugins, ...pluginIds])];

    // TODO: Topologically sort plugins based on dependencies
    const resolvedPluginOrder = allPlugins;

    return {
      ...config,
      resolvedPluginOrder,
      autoEnabledPlugins,
      appType,
      resolvedAt: new Date(),
    };
  }

  /**
   * Validate app configuration
   */
  validateAppConfig(config: AppConfig): AppConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check app type
    if (!this.isValid(config.type)) {
      errors.push(`Unknown app type: ${config.type}`);
    }

    const appType = this.getById(config.type);

    // Extract plugin IDs from either format
    const pluginIds = this.extractPluginIds(config.plugins);

    if (appType) {
      // Check required plugins
      for (const required of appType.requiredPlugins) {
        if (!pluginIds.includes(required)) {
          warnings.push(
            `Required plugin '${required}' not in list - will be auto-enabled`
          );
        }
      }

      // Check plugin compatibility
      for (const pluginId of pluginIds) {
        if (!appType.supportedPlugins.includes(pluginId)) {
          warnings.push(
            `Plugin '${pluginId}' is not officially supported for '${config.type}'`
          );
        }
      }
    }

    // Check name format
    if (!/^[a-z][a-z0-9-]*$/.test(config.name)) {
      errors.push(
        `App name '${config.name}' must start with lowercase letter and contain only lowercase letters, numbers, and hyphens`
      );
    }

    // Check path format
    if (!config.path.match(/^[a-z][a-z0-9-/]*$/)) {
      errors.push(
        `App path '${config.path}' must be a valid directory path with lowercase letters, numbers, hyphens, and slashes`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate default app config for an app type
   */
  createDefaultAppConfig(appTypeId: AppTypeId, name?: string): AppConfig {
    const appType = this.getById(appTypeId);

    if (!appType) {
      throw new Error(`Unknown app type: ${appTypeId}`);
    }

    return {
      name: name ?? appTypeId,
      type: appTypeId,
      path: appType.defaultPath,
      plugins: [...appType.requiredPlugins],
      primary: true,
    };
  }

  // ==========================================================================
  // Custom App Types
  // ==========================================================================

  /**
   * Register a custom app type
   */
  registerCustomAppType(appType: AppType): void {
    this.customAppTypes.set(appType.id, appType);
  }

  /**
   * Unregister a custom app type
   */
  unregisterCustomAppType(id: AppTypeId): boolean {
    return this.customAppTypes.delete(id);
  }

  /**
   * Get custom app types only
   */
  getCustomAppTypes(): AppType[] {
    return Array.from(this.customAppTypes.values());
  }

  /**
   * Check if app type is custom (not built-in)
   */
  isCustomAppType(id: AppTypeId): boolean {
    return this.customAppTypes.has(id) && !APP_TYPE_IDS.includes(id);
  }
}

// ============================================================================
// Types
// ============================================================================

/**
 * Result of plugin compatibility validation
 */
export interface AppPluginValidationResult {
  /** Whether the plugin is compatible */
  valid: boolean;
  /** App type ID checked */
  appTypeId: AppTypeId;
  /** Plugin ID checked */
  pluginId: string;
  /** Reason for incompatibility (if not valid) */
  reason?: string;
  /** Severity of the issue */
  severity?: "error" | "warning" | "info";
  /** Suggested alternative */
  suggestion?: string;
}

/**
 * Compatibility matrix for apps and plugins
 */
export interface AppPluginCompatibilityMatrix {
  /** All app type IDs */
  appTypes: AppTypeId[];
  /** All plugin IDs */
  plugins: string[];
  /** Matrix of compatibility: [appTypeId][pluginId] -> boolean */
  compatibility: Record<AppTypeId, Record<string, boolean>>;
}

/**
 * Result of app config validation
 */
export interface AppConfigValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** Error messages (blocking issues) */
  errors: string[];
  /** Warning messages (non-blocking issues) */
  warnings: string[];
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Default export: singleton instance
 */
export const appTypeRegistry = AppTypeRegistryService.getInstance();
