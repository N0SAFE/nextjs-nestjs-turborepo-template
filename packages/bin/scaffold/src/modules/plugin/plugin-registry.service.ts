/**
 * Plugin Registry Service
 *
 * Manages the registry of available plugins, their metadata, and configuration.
 * Enhanced with Symbol-based plugin references and AppType filtering.
 *
 * @see ARCHITECTURE.md - Plugin Registry section
 */
import { Injectable, type OnModuleInit } from "@nestjs/common";
import type {
  Plugin,
  PluginCategory,
  PluginRegistryEntry,
  AppTypeWarning,
} from "../../types/plugin.types";
import type { AppTypeId } from "../../types/app.types";
import { PluginNotFoundError } from "../../types/errors.types";
import {
  type PluginSymbol,
  PLUGIN_SYMBOL_REGISTRY,
  PLUGIN_ID_TO_SYMBOL,
  PLUGIN_SYMBOLS,
  getPluginId,
  pluginSupportsApp,
} from "../../types/plugin-symbols";

/**
 * Built-in plugin definitions with supportedApps for app-type filtering
 */
const BUILTIN_PLUGINS: Plugin[] = [
  // ===== CORE PLUGINS (support all apps) =====
  {
    id: "typescript",
    name: "TypeScript",
    description: "TypeScript configuration and compiler setup",
    category: "core",
    dependencies: [],
    conflicts: [],
    default: true,
    tags: ["typescript", "compiler", "types"],
    supportedApps: "*", // Supports all app types
  },
  {
    id: "eslint",
    name: "ESLint",
    description: "ESLint configuration with TypeScript support",
    category: "core",
    dependencies: ["typescript"],
    conflicts: [],
    default: true,
    tags: ["eslint", "linting", "code-quality"],
    supportedApps: "*",
  },
  {
    id: "prettier",
    name: "Prettier",
    description: "Code formatting with Prettier",
    category: "core",
    dependencies: [],
    conflicts: [],
    default: true,
    tags: ["prettier", "formatting"],
    supportedApps: "*",
  },
  {
    id: "vitest",
    name: "Vitest",
    description: "Unit testing with Vitest",
    category: "core",
    dependencies: ["typescript"],
    conflicts: ["jest"],
    default: true,
    tags: ["vitest", "testing", "unit-tests"],
    supportedApps: "*",
  },
  {
    id: "turborepo",
    name: "Turborepo",
    description: "Monorepo build system",
    category: "core",
    dependencies: [],
    conflicts: [],
    default: true,
    tags: ["turborepo", "monorepo", "build"],
    supportedApps: "*",
  },
  {
    id: "zod",
    name: "Zod",
    description: "Schema validation with Zod",
    category: "core",
    dependencies: ["typescript"],
    conflicts: [],
    default: true,
    tags: ["zod", "validation", "schema"],
    supportedApps: "*",
  },

  // ===== FEATURE PLUGINS =====
  {
    id: "better-auth",
    name: "Better Auth",
    description: "Authentication with Better Auth",
    category: "feature",
    dependencies: ["drizzle"],
    conflicts: ["next-auth"],
    tags: ["auth", "authentication", "better-auth"],
    supportedApps: ["nestjs", "nextjs"], // Only backend + Next.js
  },
  {
    id: "orpc",
    name: "ORPC",
    description: "Type-safe RPC with ORPC",
    category: "feature",
    dependencies: ["typescript", "zod"],
    conflicts: ["trpc"],
    tags: ["orpc", "rpc", "api", "type-safe"],
    supportedApps: ["nestjs"], // NestJS only for server-side
  },
  {
    id: "drizzle",
    name: "Drizzle ORM",
    description: "Type-safe database ORM",
    category: "feature",
    dependencies: ["typescript"],
    conflicts: ["prisma", "typeorm"],
    tags: ["drizzle", "orm", "database"],
    supportedApps: ["nestjs", "nextjs", "express", "fastify"],
  },
  {
    id: "react-query",
    name: "React Query",
    description: "Server state management with TanStack Query",
    category: "feature",
    dependencies: [],
    conflicts: ["swr"],
    tags: ["react-query", "tanstack", "state"],
    supportedApps: ["nextjs", "astro"], // React-based frontends
  },
  {
    id: "zustand",
    name: "Zustand",
    description: "Client state management with Zustand",
    category: "feature",
    dependencies: [],
    conflicts: ["redux", "jotai"],
    tags: ["zustand", "state", "client-state"],
    supportedApps: ["nextjs", "astro"], // React-based frontends
  },
  {
    id: "declarative-routing",
    name: "Declarative Routing",
    description: "Type-safe declarative routing for Next.js",
    category: "feature",
    dependencies: ["typescript"],
    conflicts: [],
    tags: ["routing", "next.js", "type-safe"],
    supportedApps: ["nextjs"], // Next.js only
  },

  // ===== INFRASTRUCTURE PLUGINS =====
  {
    id: "docker",
    name: "Docker",
    description: "Docker configuration and compose files",
    category: "infrastructure",
    dependencies: [],
    conflicts: [],
    default: true,
    tags: ["docker", "containers", "devops"],
    supportedApps: "*",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "PostgreSQL database setup",
    category: "infrastructure",
    dependencies: ["docker"],
    conflicts: ["mysql", "mongodb"],
    tags: ["postgresql", "database", "sql"],
    supportedApps: ["nestjs", "nextjs", "express", "fastify"],
  },
  {
    id: "redis",
    name: "Redis",
    description: "Redis cache setup",
    category: "infrastructure",
    dependencies: ["docker"],
    conflicts: [],
    tags: ["redis", "cache", "key-value"],
    supportedApps: ["nestjs", "nextjs", "express", "fastify"],
  },
  {
    id: "github-actions",
    name: "GitHub Actions",
    description: "CI/CD with GitHub Actions",
    category: "infrastructure",
    dependencies: [],
    conflicts: ["gitlab-ci"],
    tags: ["github", "ci", "cd", "actions"],
    supportedApps: "*",
  },

  // ===== UI PLUGINS =====
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    description: "Utility-first CSS framework",
    category: "ui",
    dependencies: [],
    conflicts: [],
    default: true,
    tags: ["tailwind", "css", "styling"],
    supportedApps: ["nextjs", "fumadocs", "astro"], // Frontend apps
  },
  {
    id: "shadcn-ui",
    name: "shadcn/ui",
    description: "Beautifully designed components",
    category: "ui",
    dependencies: ["tailwindcss"],
    conflicts: [],
    tags: ["shadcn", "ui", "components"],
    supportedApps: ["nextjs"], // Next.js only (React)
  },
  {
    id: "radix-ui",
    name: "Radix UI",
    description: "Unstyled accessible components",
    category: "ui",
    dependencies: [],
    conflicts: [],
    tags: ["radix", "ui", "accessibility"],
    supportedApps: ["nextjs"], // Next.js only (React)
  },
  {
    id: "next-themes",
    name: "Next Themes",
    description: "Theme switching for Next.js",
    category: "ui",
    dependencies: [],
    conflicts: [],
    tags: ["themes", "dark-mode", "next.js"],
    supportedApps: ["nextjs", "fumadocs"], // Next.js based
  },

  // ===== INTEGRATION PLUGINS =====
  {
    id: "fumadocs",
    name: "Fumadocs",
    description: "Documentation with Fumadocs",
    category: "integration",
    dependencies: ["tailwindcss"],
    conflicts: ["nextra"],
    tags: ["docs", "documentation", "fumadocs"],
    supportedApps: ["fumadocs"], // Fumadocs app type only
  },
  {
    id: "swagger",
    name: "Swagger/OpenAPI",
    description: "API documentation with Swagger",
    category: "integration",
    dependencies: [],
    conflicts: [],
    tags: ["swagger", "openapi", "api-docs"],
    supportedApps: ["nestjs", "express", "fastify"], // API apps
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Error tracking with Sentry",
    category: "integration",
    dependencies: [],
    conflicts: [],
    tags: ["sentry", "monitoring", "errors"],
    supportedApps: "*", // Any app type
  },
];

@Injectable()
export class PluginRegistryService implements OnModuleInit {
  private static instance: PluginRegistryService | null = null;
  private plugins: Map<string, PluginRegistryEntry> = new Map();
  private categories: Map<PluginCategory, string[]> = new Map();
  private initialized = false;

  /**
   * Get singleton instance (for standalone/testing use)
   */
  static getInstance(): PluginRegistryService {
    if (!PluginRegistryService.instance) {
      PluginRegistryService.instance = new PluginRegistryService();
      PluginRegistryService.instance.onModuleInit();
    }
    return PluginRegistryService.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    PluginRegistryService.instance = null;
  }

  onModuleInit() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Register built-in plugins
    for (const plugin of BUILTIN_PLUGINS) {
      this.register(plugin);
    }
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin, options?: { generator?: string; templatePath?: string; version?: string }): void {
    const entry: PluginRegistryEntry = {
      ...plugin,
      generator: options?.generator,
      templatePath: options?.templatePath,
      version: options?.version,
    };

    this.plugins.set(plugin.id, entry);

    // Update category index
    const categoryPlugins = this.categories.get(plugin.category) ?? [];
    if (!categoryPlugins.includes(plugin.id)) {
      categoryPlugins.push(plugin.id);
      this.categories.set(plugin.category, categoryPlugins);
    }
  }

  /**
   * Get a plugin by ID
   */
  get(id: string): Plugin {
    const entry = this.plugins.get(id);
    if (!entry) {
      throw new PluginNotFoundError(id, this.getSuggestions(id));
    }
    return entry;
  }

  /**
   * Get a plugin by ID (returns undefined if not found)
   */
  getById(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get a plugin entry by ID
   */
  getEntry(id: string): PluginRegistryEntry | undefined {
    return this.plugins.get(id);
  }

  /**
   * Check if a plugin exists
   */
  has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get all plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all plugin entries
   */
  getAllEntries(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by category
   */
  getByCategory(category: PluginCategory): Plugin[] {
    const ids = this.categories.get(category) ?? [];
    return ids.map((id) => this.get(id));
  }

  /**
   * Get all categories
   */
  getCategories(): PluginCategory[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get plugin count
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * Get plugin count by category
   */
  countByCategory(): Map<PluginCategory, number> {
    const counts = new Map<PluginCategory, number>();
    for (const [category, ids] of this.categories) {
      counts.set(category, ids.length);
    }
    return counts;
  }

  /**
   * Search plugins by name or description
   */
  search(query: string): Plugin[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (plugin) =>
        plugin.id.toLowerCase().includes(lowerQuery) ||
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description.toLowerCase().includes(lowerQuery),
    );
  }

  // ===== SYMBOL-BASED LOOKUP METHODS =====

  /**
   * Get a plugin by its Symbol
   * @param symbol - The PluginSymbol to look up
   * @returns Plugin if found
   * @throws PluginNotFoundError if not found
   */
  getBySymbol(symbol: PluginSymbol): Plugin {
    const pluginId = getPluginId(symbol);
    if (!pluginId) {
      throw new PluginNotFoundError(`Symbol: ${symbol.description ?? "unknown"}`, []);
    }
    return this.get(pluginId);
  }

  /**
   * Check if a plugin exists by Symbol
   */
  hasBySymbol(symbol: PluginSymbol): boolean {
    const pluginId = getPluginId(symbol);
    return pluginId !== undefined && this.has(pluginId);
  }

  // ===== APP-TYPE FILTERING METHODS =====

  /**
   * Get all plugins that support a specific app type
   * @param appTypeId - The app type to filter by
   * @returns Array of plugins that support the app type
   */
  getForAppType(appTypeId: AppTypeId): Plugin[] {
    return this.getAll().filter((plugin) => {
      // "*" means supports all app types
      if (plugin.supportedApps === "*") {
        return true;
      }
      // Check if the app type is in the supportedApps array
      return plugin.supportedApps.includes(appTypeId);
    });
  }

  /**
   * Get plugins by category that support a specific app type
   */
  getByCategoryForAppType(category: PluginCategory, appTypeId: AppTypeId): Plugin[] {
    return this.getByCategory(category).filter((plugin) => {
      if (plugin.supportedApps === "*") {
        return true;
      }
      return plugin.supportedApps.includes(appTypeId);
    });
  }

  /**
   * Check if a plugin supports a specific app type
   * @param pluginId - Plugin ID to check
   * @param appTypeId - App type to check support for
   * @returns true if supported, false otherwise
   */
  pluginSupportsAppType(pluginId: string, appTypeId: AppTypeId): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }
    if (plugin.supportedApps === "*") {
      return true;
    }
    return plugin.supportedApps.includes(appTypeId);
  }

  /**
   * Validate a plugin for an app type with detailed warning
   * @param pluginId - Plugin ID to validate
   * @param appTypeId - Target app type
   * @returns AppTypeWarning or null if valid
   */
  validatePluginForApp(pluginId: string, appTypeId: AppTypeId): AppTypeWarning | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return {
        pluginId,
        appTypeId,
        message: `Plugin "${pluginId}" not found`,
      };
    }

    // "*" supports everything
    if (plugin.supportedApps === "*") {
      return null;
    }

    // Check if supported
    if (!plugin.supportedApps.includes(appTypeId)) {
      return {
        pluginId,
        appTypeId,
        message: `Plugin "${plugin.name}" is not compatible with "${appTypeId}" apps. Supported: ${plugin.supportedApps.join(", ")}`,
      };
    }

    return null;
  }

  /**
   * Validate multiple plugins for an app type
   * @returns Array of warnings for incompatible plugins
   */
  validatePluginsForApp(pluginIds: string[], appTypeId: AppTypeId): AppTypeWarning[] {
    const warnings: AppTypeWarning[] = [];
    for (const pluginId of pluginIds) {
      const warning = this.validatePluginForApp(pluginId, appTypeId);
      if (warning) {
        warnings.push(warning);
      }
    }
    return warnings;
  }

  /**
   * Get default plugins for an app type (plugins marked as default that support the app type)
   */
  getDefaultsForAppType(appTypeId: AppTypeId): Plugin[] {
    return this.getAll().filter((plugin) => {
      if (!plugin.default) {
        return false;
      }
      if (plugin.supportedApps === "*") {
        return true;
      }
      return plugin.supportedApps.includes(appTypeId);
    });
  }

  /**
   * Get plugin IDs by their Symbols for a specific app type
   * @param symbols - Array of PluginSymbols
   * @param appTypeId - Target app type for filtering
   * @returns Array of plugin IDs that are valid for the app type
   */
  resolveSymbolsForAppType(symbols: PluginSymbol[], appTypeId: AppTypeId): string[] {
    const pluginIds: string[] = [];

    for (const symbol of symbols) {
      const pluginId = getPluginId(symbol);
      if (pluginId && this.pluginSupportsAppType(pluginId, appTypeId)) {
        pluginIds.push(pluginId);
      }
    }

    return pluginIds;
  }

  /**
   * Get similar plugin suggestions (for error messages)
   */
  private getSuggestions(id: string): string[] {
    const allIds = Array.from(this.plugins.keys());
    const lowerInput = id.toLowerCase();

    return allIds
      .map((pluginId) => ({
        id: pluginId,
        score: this.similarity(lowerInput, pluginId.toLowerCase()),
      }))
      .filter((item) => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.id);
  }

  /**
   * Calculate string similarity (Dice coefficient)
   */
  private similarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;

    const bigrams1 = new Set<string>();
    for (let i = 0; i < s1.length - 1; i++) {
      bigrams1.add(s1.slice(i, i + 2));
    }

    let intersectionSize = 0;
    for (let i = 0; i < s2.length - 1; i++) {
      if (bigrams1.has(s2.slice(i, i + 2))) {
        intersectionSize++;
      }
    }

    return (2 * intersectionSize) / (s1.length + s2.length - 2);
  }
}
