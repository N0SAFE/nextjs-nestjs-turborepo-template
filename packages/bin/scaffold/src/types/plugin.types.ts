/**
 * Plugin Type Definitions
 *
 * These types define the structure of plugins and their configurations.
 * They mirror the builder-ui plugin definitions.
 *
 * @see ARCHITECTURE.md - Plugin System section
 */

import type { AppTypeId } from "./app.types";
import type { PluginSymbol } from "./plugin-symbols";

/**
 * Plugin categories for organization
 */
export type PluginCategory =
  | "core"
  | "feature"
  | "infrastructure"
  | "ui"
  | "integration";

/**
 * Plugin dependency definition with Symbol support
 * Supports both string-based (legacy) and symbol-based (preferred) references
 */
export interface PluginDependency {
  /** Plugin symbol (preferred) or string ID (legacy) */
  plugin: PluginSymbol | string;
  /** Whether this dependency is optional */
  optional?: boolean;
  /** Minimum version required (semver) */
  minVersion?: string;
  /** Reason for dependency */
  reason?: string;
}

/**
 * Plugin definition
 * Represents a single plugin that can be selected for project scaffolding
 */
export interface Plugin {
  /** Unique identifier for the plugin */
  id: string;
  /** Unique symbol for type-safe references */
  symbol?: PluginSymbol;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Category for organization */
  category: PluginCategory;
  /**
   * App types this plugin supports
   * - '*' = supports all app types
   * - Array of AppTypeIds = supports only listed types
   */
  supportedApps: AppTypeId[] | "*";
  /** Plugin IDs that must be enabled (legacy string-based) */
  dependencies?: string[];
  /** Plugin dependencies with full metadata */
  pluginDependencies?: PluginDependency[];
  /** Plugin IDs that are enhanced when enabled */
  optionalDependencies?: string[];
  /** Plugin IDs that cannot be enabled together */
  conflicts?: string[];
  /** Whether this plugin is only for development */
  devOnly?: boolean;
  /** Whether this plugin is enabled by default */
  default?: boolean;
  /** Tags for filtering/searching */
  tags?: string[];
  /** URL to plugin documentation */
  docsUrl?: string;
  /**
   * Three-tier plugin strategy classification
   * @see ARCHITECTURE.md - Three-Tier Plugin Strategy
   */
  tier?: "core" | "app-type" | "enhancement";
  /** Whether this plugin is stable (vs experimental) */
  stable?: boolean;
}

/**
 * Plugin configuration options
 * Additional settings for a specific plugin
 */
export interface PluginConfig {
  /** Plugin ID */
  pluginId: string;
  /** Plugin symbol (preferred for type-safety) */
  pluginSymbol?: PluginSymbol;
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Plugin-specific options */
  options?: Record<string, unknown>;
}

/**
 * Plugin registry entry with metadata
 */
export interface PluginRegistryEntry extends Plugin {
  /** Generator class or factory */
  generator?: string;
  /** Template directory path */
  templatePath?: string;
  /** Version of the plugin generator */
  version?: string;
}

/**
 * Plugin resolution result
 */
export interface PluginResolutionResult {
  /** Ordered list of plugins to enable (topologically sorted) */
  resolved: string[];
  /** Plugin symbols for resolved plugins */
  resolvedSymbols?: PluginSymbol[];
  /** Plugins that were auto-enabled due to dependencies */
  autoEnabled: string[];
  /** Plugins that could not be resolved */
  unresolved: string[];
  /** Conflict errors encountered */
  conflicts: PluginConflict[];
  /** Missing dependency errors */
  missingDependencies: MissingDependency[];
  /** App type compatibility warnings */
  appTypeWarnings?: AppTypeWarning[];
}

/**
 * Plugin conflict information
 */
export interface PluginConflict {
  /** Plugin that has the conflict */
  pluginId: string;
  /** Plugin symbol */
  pluginSymbol?: PluginSymbol;
  /** Plugin it conflicts with */
  conflictsWith: string;
  /** Human-readable reason */
  reason?: string;
}

/**
 * Missing dependency information
 */
export interface MissingDependency {
  /** Plugin that needs the dependency */
  pluginId: string;
  /** Missing dependency plugin ID */
  dependencyId: string;
  /** Missing dependency symbol */
  dependencySymbol?: PluginSymbol;
  /** Whether this is an optional dependency */
  optional: boolean;
}

/**
 * App type compatibility warning
 */
export interface AppTypeWarning {
  /** Plugin ID */
  pluginId: string;
  /** App type that is incompatible */
  appTypeId: AppTypeId;
  /** Warning message */
  message: string;
}

/**
 * Plugin category metadata
 */
export interface PluginCategoryInfo {
  /** Category ID */
  id: PluginCategory;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Icon name */
  icon?: string;
  /** Sort order */
  order: number;
}

/**
 * All plugin categories with metadata
 */
export const PLUGIN_CATEGORIES: Record<PluginCategory, PluginCategoryInfo> = {
  core: {
    id: "core",
    name: "Core",
    description: "Essential project infrastructure",
    icon: "Package",
    order: 0,
  },
  feature: {
    id: "feature",
    name: "Features",
    description: "Application features and functionality",
    icon: "Zap",
    order: 1,
  },
  infrastructure: {
    id: "infrastructure",
    name: "Infrastructure",
    description: "Infrastructure and deployment tools",
    icon: "Server",
    order: 2,
  },
  ui: {
    id: "ui",
    name: "UI",
    description: "User interface components and styling",
    icon: "Palette",
    order: 3,
  },
  integration: {
    id: "integration",
    name: "Integrations",
    description: "Third-party service integrations",
    icon: "Plug",
    order: 4,
  },
};
