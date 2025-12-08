/**
 * Plugin-App Integration Service
 *
 * Provides unified validation and resolution for plugins
 * in the context of app types. Bridges the gap between
 * PluginRegistryService and AppTypeRegistryService.
 *
 * @see ARCHITECTURE.md - Plugin System Integration section
 */

import type {
  AppTypeId,
  AppConfig,
  ResolvedAppConfig,
  AppCapability,
} from "../../types/app.types";
import type { Plugin } from "../../types/plugin.types";
import {
  AppTypeRegistryService,
  type AppPluginValidationResult,
} from "../app/app-type-registry.service";
import { PluginRegistryService } from "../plugin/plugin-registry.service";

// ============================================================================
// Service Class
// ============================================================================

/**
 * Plugin-App Integration Service
 *
 * Provides cross-validation between plugins and app types,
 * dependency resolution, and conflict detection in a multi-app context.
 */
export class PluginAppIntegrationService {
  private static instance: PluginAppIntegrationService;

  private constructor(
    private readonly appRegistry: AppTypeRegistryService,
    private readonly pluginRegistry: PluginRegistryService
  ) {}

  /**
   * Get singleton instance
   */
  static getInstance(): PluginAppIntegrationService {
    if (!PluginAppIntegrationService.instance) {
      PluginAppIntegrationService.instance = new PluginAppIntegrationService(
        AppTypeRegistryService.getInstance(),
        PluginRegistryService.getInstance()
      );
    }
    return PluginAppIntegrationService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    PluginAppIntegrationService.instance = undefined as unknown as PluginAppIntegrationService;
  }

  // ==========================================================================
  // Plugin Discovery for App Types
  // ==========================================================================

  /**
   * Get all plugins that are compatible with an app type
   * Checks both directions: app supports plugin AND plugin supports app
   */
  getCompatiblePlugins(appTypeId: AppTypeId): Plugin[] {
    const appType = this.appRegistry.getById(appTypeId);
    if (!appType) return [];

    const allPlugins = this.pluginRegistry.getAll();

    return allPlugins.filter((plugin) => {
      // Check if app type supports this plugin
      const appSupportsPlugin = appType.supportedPlugins.includes(plugin.id);

      // Check if plugin supports this app type
      const pluginSupportsApp =
        plugin.supportedApps === "*" ||
        (Array.isArray(plugin.supportedApps) && plugin.supportedApps.includes(appTypeId));

      return appSupportsPlugin && pluginSupportsApp;
    });
  }

  /**
   * Get plugins that are required by an app type
   */
  getRequiredPlugins(appTypeId: AppTypeId): Plugin[] {
    const appType = this.appRegistry.getById(appTypeId);
    if (!appType) return [];

    return appType.requiredPlugins
      .map((id) => this.pluginRegistry.getById(id))
      .filter((p): p is Plugin => p !== undefined);
  }

  /**
   * Get plugins grouped by category for an app type
   */
  getPluginsByCategory(appTypeId: AppTypeId): Record<string, Plugin[]> {
    const compatible = this.getCompatiblePlugins(appTypeId);
    const grouped: Record<string, Plugin[]> = {};

    for (const plugin of compatible) {
      const category = plugin.category ?? "other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(plugin);
    }

    return grouped;
  }

  /**
   * Get recommended plugins for an app type based on capabilities
   */
  getRecommendedPlugins(appTypeId: AppTypeId): Plugin[] {
    const appType = this.appRegistry.getById(appTypeId);
    if (!appType) return [];

    const compatible = this.getCompatiblePlugins(appTypeId);
    const recommendations: Plugin[] = [];

    // Recommend plugins based on capabilities
    const capabilityRecommendations: Record<AppCapability, string[]> = {
      "http-server": ["env-validation", "cors"],
      database: ["drizzle", "prisma"],
      auth: ["better-auth"],
      react: ["tailwindcss", "shadcn-ui", "react-query"],
      api: ["orpc", "rest"],
      ssr: ["next-themes"],
      ssg: [],
      websocket: [],
      vue: [],
      "edge-runtime": [],
      middleware: [],
      "dependency-injection": [],
      decorators: [],
      "file-routing": [],
      streaming: [],
    };

    for (const capability of appType.capabilities) {
      const recommended = capabilityRecommendations[capability] ?? [];
      for (const pluginId of recommended) {
        const plugin = compatible.find((p) => p.id === pluginId);
        if (plugin && !recommendations.includes(plugin)) {
          recommendations.push(plugin);
        }
      }
    }

    return recommendations;
  }

  // ==========================================================================
  // Multi-App Validation
  // ==========================================================================

  /**
   * Validate multiple apps' plugin configurations
   */
  validateMultiAppConfig(apps: AppConfig[]): MultiAppValidationResult {
    const results: AppValidationResult[] = [];
    const globalIssues: string[] = [];

    // Validate each app individually
    for (const app of apps) {
      const appResult = this.validateSingleAppConfig(app);
      results.push(appResult);
    }

    // Check for cross-app conflicts
    const pluginUsage = new Map<string, string[]>(); // pluginId -> appNames

    for (const app of apps) {
      for (const pluginId of app.plugins) {
        if (!pluginUsage.has(pluginId)) {
          pluginUsage.set(pluginId, []);
        }
        pluginUsage.get(pluginId)!.push(app.name);
      }
    }

    // Check for plugins that might conflict across apps
    // (e.g., database plugins with different configurations)
    const conflictPotentialPlugins = ["drizzle", "prisma", "postgresql", "redis"];

    for (const pluginId of conflictPotentialPlugins) {
      const usage = pluginUsage.get(pluginId);
      if (usage && usage.length > 1) {
        globalIssues.push(
          `Plugin '${pluginId}' is used in multiple apps (${usage.join(", ")}). ` +
            `Ensure configurations are compatible.`
        );
      }
    }

    // Check for primary app conflicts
    const primaryByType = new Map<AppTypeId, string[]>();
    for (const app of apps) {
      if (app.primary) {
        if (!primaryByType.has(app.type)) {
          primaryByType.set(app.type, []);
        }
        primaryByType.get(app.type)!.push(app.name);
      }
    }

    for (const [type, primaryApps] of primaryByType) {
      if (primaryApps.length > 1) {
        globalIssues.push(
          `Multiple apps marked as primary for type '${type}': ${primaryApps.join(", ")}. ` +
            `Only one should be primary.`
        );
      }
    }

    return {
      valid: results.every((r) => r.valid) && globalIssues.length === 0,
      apps: results,
      globalIssues,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0) + globalIssues.length,
    };
  }

  /**
   * Validate a single app's plugin configuration
   */
  validateSingleAppConfig(app: AppConfig): AppValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const pluginValidations: AppPluginValidationResult[] = [];

    // First validate the app config itself
    const configValidation = this.appRegistry.validateAppConfig(app);
    errors.push(...configValidation.errors);
    warnings.push(...configValidation.warnings);

    // Then validate each plugin
    for (const pluginId of app.plugins) {
      const plugin = this.pluginRegistry.getById(pluginId);

      if (!plugin) {
        errors.push(`Unknown plugin: ${pluginId}`);
        continue;
      }

      // Check compatibility
      const compatibility = this.appRegistry.validatePluginCompatibility(
        app.type,
        pluginId,
        plugin
      );

      pluginValidations.push(compatibility);

      if (!compatibility.valid) {
        if (compatibility.severity === "error") {
          errors.push(compatibility.reason!);
        } else {
          warnings.push(compatibility.reason!);
        }
      }

      // Check if plugin dependencies are satisfied
      for (const depId of plugin.dependencies ?? []) {
        if (!app.plugins.includes(depId)) {
          warnings.push(
            `Plugin '${pluginId}' depends on '${depId}' which is not enabled`
          );
        }
      }
    }

    return {
      appName: app.name,
      appType: app.type,
      valid: errors.length === 0,
      errors,
      warnings,
      pluginValidations,
    };
  }

  // ==========================================================================
  // Plugin Resolution
  // ==========================================================================

  /**
   * Resolve plugins for an app with proper ordering
   */
  resolvePluginsForApp(app: AppConfig): ResolvedPluginList {
    const appType = this.appRegistry.getById(app.type);
    if (!appType) {
      throw new Error(`Unknown app type: ${app.type}`);
    }

    const plugins: Plugin[] = [];
    const order: string[] = [];
    const autoEnabled: string[] = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    // Start with required plugins
    for (const requiredId of appType.requiredPlugins) {
      const plugin = this.pluginRegistry.getById(requiredId);
      if (plugin) {
        plugins.push(plugin);
        order.push(requiredId);
        if (!app.plugins.includes(requiredId)) {
          autoEnabled.push(requiredId);
        }
      }
    }

    // Add explicitly requested plugins
    for (const pluginId of app.plugins) {
      if (order.includes(pluginId)) continue; // Already added

      const plugin = this.pluginRegistry.getById(pluginId);
      if (!plugin) {
        skipped.push({ id: pluginId, reason: "Plugin not found" });
        continue;
      }

      // Check compatibility
      const compatible = this.isPluginCompatibleWithApp(pluginId, app.type);
      if (!compatible) {
        skipped.push({
          id: pluginId,
          reason: `Not compatible with app type '${app.type}'`,
        });
        continue;
      }

      // Add plugin dependencies first
      for (const depId of plugin.dependencies ?? []) {
        if (!order.includes(depId)) {
          const depPlugin = this.pluginRegistry.getById(depId);
          if (depPlugin) {
            plugins.push(depPlugin);
            order.push(depId);
            autoEnabled.push(depId);
          }
        }
      }

      plugins.push(plugin);
      order.push(pluginId);
    }

    return {
      plugins,
      order,
      autoEnabled,
      skipped,
    };
  }

  /**
   * Check if a plugin is compatible with an app type (bidirectional check)
   */
  isPluginCompatibleWithApp(pluginId: string, appTypeId: AppTypeId): boolean {
    const appType = this.appRegistry.getById(appTypeId);
    const plugin = this.pluginRegistry.getById(pluginId);

    if (!appType || !plugin) return false;

    // Check if app supports this plugin
    const appSupports = appType.supportedPlugins.includes(pluginId);

    // Check if plugin supports this app
    const pluginSupports =
      plugin.supportedApps === "*" ||
      (Array.isArray(plugin.supportedApps) && plugin.supportedApps.includes(appTypeId));

    return appSupports && pluginSupports;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get a summary of plugin compatibility across all app types
   */
  getPluginCompatibilitySummary(pluginId: string): PluginCompatibilitySummary {
    const plugin = this.pluginRegistry.getById(pluginId);
    const allAppTypes = this.appRegistry.getAll();

    const compatible: AppTypeId[] = [];
    const incompatible: AppTypeId[] = [];

    for (const appType of allAppTypes) {
      if (this.isPluginCompatibleWithApp(pluginId, appType.id)) {
        compatible.push(appType.id);
      } else {
        incompatible.push(appType.id);
      }
    }

    return {
      pluginId,
      pluginName: plugin?.name ?? pluginId,
      compatible,
      incompatible,
      compatibilityRate: compatible.length / allAppTypes.length,
    };
  }

  /**
   * Get app types that a plugin is compatible with
   */
  getAppTypesForPlugin(pluginId: string): AppTypeId[] {
    return this.appRegistry
      .getAll()
      .filter((app) => this.isPluginCompatibleWithApp(pluginId, app.id))
      .map((app) => app.id);
  }
}

// ============================================================================
// Types
// ============================================================================

/**
 * Result of single app validation
 */
export interface AppValidationResult {
  /** App name */
  appName: string;
  /** App type */
  appType: AppTypeId;
  /** Whether the app config is valid */
  valid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Individual plugin validations */
  pluginValidations: AppPluginValidationResult[];
}

/**
 * Result of multi-app validation
 */
export interface MultiAppValidationResult {
  /** Whether all app configs are valid */
  valid: boolean;
  /** Individual app results */
  apps: AppValidationResult[];
  /** Global issues (cross-app) */
  globalIssues: string[];
  /** Total error count */
  totalErrors: number;
  /** Total warning count */
  totalWarnings: number;
}

/**
 * Resolved plugin list for an app
 */
export interface ResolvedPluginList {
  /** Plugins in resolved order */
  plugins: Plugin[];
  /** Plugin IDs in dependency order */
  order: string[];
  /** Plugins that were auto-enabled (dependencies or required) */
  autoEnabled: string[];
  /** Plugins that were skipped with reasons */
  skipped: Array<{ id: string; reason: string }>;
}

/**
 * Plugin compatibility summary
 */
export interface PluginCompatibilitySummary {
  /** Plugin ID */
  pluginId: string;
  /** Plugin name */
  pluginName: string;
  /** App types this plugin is compatible with */
  compatible: AppTypeId[];
  /** App types this plugin is incompatible with */
  incompatible: AppTypeId[];
  /** Compatibility rate (0-1) */
  compatibilityRate: number;
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Default export: singleton instance
 */
export const pluginAppIntegration = PluginAppIntegrationService.getInstance();
