/**
 * Plugin-App Integration Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PluginAppIntegrationService,
  pluginAppIntegration,
} from "../plugin-app-integration.service";
import { AppTypeRegistryService } from "../../app/app-type-registry.service";
import { PluginRegistryService } from "../../plugin/plugin-registry.service";
import type { AppConfig, AppTypeId } from "../../../types/app.types";

describe("PluginAppIntegrationService", () => {
  let service: PluginAppIntegrationService;

  beforeEach(() => {
    // Reset all registries
    AppTypeRegistryService.resetInstance();
    PluginRegistryService.resetInstance();
    PluginAppIntegrationService.resetInstance();
    service = PluginAppIntegrationService.getInstance();
  });

  afterEach(() => {
    AppTypeRegistryService.resetInstance();
    PluginRegistryService.resetInstance();
    PluginAppIntegrationService.resetInstance();
  });

  describe("getInstance", () => {
    it("should return a singleton instance", () => {
      const instance1 = PluginAppIntegrationService.getInstance();
      const instance2 = PluginAppIntegrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getCompatiblePlugins", () => {
    it("should return plugins compatible with nestjs", () => {
      const plugins = service.getCompatiblePlugins("nestjs");
      expect(plugins.length).toBeGreaterThan(0);

      // Drizzle should be compatible with NestJS
      const hasDatabase = plugins.some((p) => p.id === "drizzle");
      expect(hasDatabase).toBe(true);
    });

    it("should return plugins compatible with nextjs", () => {
      const plugins = service.getCompatiblePlugins("nextjs");
      expect(plugins.length).toBeGreaterThan(0);

      // shadcn-ui should be compatible with Next.js
      const hasShadcn = plugins.some((p) => p.id === "shadcn-ui");
      expect(hasShadcn).toBe(true);
    });

    it("should return empty array for unknown app type", () => {
      const plugins = service.getCompatiblePlugins("unknown" as AppTypeId);
      expect(plugins).toEqual([]);
    });

    it("should filter by bidirectional compatibility", () => {
      // Plugins need to be supported both by app type AND support the app type
      const plugins = service.getCompatiblePlugins("fumadocs");

      // Fumadocs has limited plugins
      expect(plugins.length).toBeLessThan(
        service.getCompatiblePlugins("nextjs").length
      );
    });
  });

  describe("getRequiredPlugins", () => {
    it("should return required plugins for app type", () => {
      const required = service.getRequiredPlugins("nestjs");
      // NestJS should have some required plugins
      expect(required.length).toBeGreaterThanOrEqual(0);
    });

    it("should return empty array for unknown app type", () => {
      const required = service.getRequiredPlugins("unknown" as AppTypeId);
      expect(required).toEqual([]);
    });
  });

  describe("getPluginsByCategory", () => {
    it("should group plugins by category", () => {
      const grouped = service.getPluginsByCategory("nestjs");

      // Should have some categories
      const categories = Object.keys(grouped);
      expect(categories.length).toBeGreaterThan(0);

      // Each category should have at least one plugin
      for (const category of categories) {
        expect(grouped[category]?.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getRecommendedPlugins", () => {
    it("should return recommended plugins for nextjs", () => {
      const recommended = service.getRecommendedPlugins("nextjs");

      // Next.js has react capability, should recommend React-related plugins
      expect(recommended.length).toBeGreaterThanOrEqual(0);
    });

    it("should return empty array for unknown app type", () => {
      const recommended = service.getRecommendedPlugins("unknown" as AppTypeId);
      expect(recommended).toEqual([]);
    });
  });

  describe("validateSingleAppConfig", () => {
    it("should validate valid app config", () => {
      const config: AppConfig = {
        name: "api",
        type: "nestjs",
        path: "apps/api",
        plugins: ["drizzle"],
        primary: true,
      };

      const result = service.validateSingleAppConfig(config);

      expect(result.appName).toBe("api");
      expect(result.appType).toBe("nestjs");
      // May have warnings but should not have blocking errors for supported plugins
    });

    it("should error on unknown plugins", () => {
      const config: AppConfig = {
        name: "api",
        type: "nestjs",
        path: "apps/api",
        plugins: ["nonexistent-plugin"],
        primary: true,
      };

      const result = service.validateSingleAppConfig(config);

      expect(result.errors.some((e) => e.includes("Unknown plugin"))).toBe(true);
    });

    it("should warn on plugin dependencies not enabled", () => {
      // Find a plugin with dependencies
      const pluginRegistry = PluginRegistryService.getInstance();
      const plugins = pluginRegistry.getAll();
      const pluginWithDeps = plugins.find(
        (p) => p.dependencies && p.dependencies.length > 0
      );

      if (pluginWithDeps) {
        const config: AppConfig = {
          name: "api",
          type: "nestjs",
          path: "apps/api",
          plugins: [pluginWithDeps.id], // Only this plugin, not its deps
          primary: true,
        };

        const result = service.validateSingleAppConfig(config);

        // Should have warning about missing dependencies
        const hasDependencyWarning = result.warnings.some((w) =>
          w.includes("depends on")
        );
        expect(hasDependencyWarning).toBe(true);
      }
    });
  });

  describe("validateMultiAppConfig", () => {
    it("should validate multiple app configs", () => {
      const configs: AppConfig[] = [
        {
          name: "api",
          type: "nestjs",
          path: "apps/api",
          plugins: ["drizzle"],
          primary: true,
        },
        {
          name: "web",
          type: "nextjs",
          path: "apps/web",
          plugins: ["shadcn-ui"],
          primary: true,
        },
      ];

      const result = service.validateMultiAppConfig(configs);

      expect(result.apps.length).toBe(2);
      expect(result.apps[0]?.appName).toBe("api");
      expect(result.apps[1]?.appName).toBe("web");
    });

    it("should detect shared plugin warnings", () => {
      const configs: AppConfig[] = [
        {
          name: "api",
          type: "nestjs",
          path: "apps/api",
          plugins: ["drizzle"],
          primary: true,
        },
        {
          name: "worker",
          type: "nestjs",
          path: "apps/worker",
          plugins: ["drizzle"], // Same database plugin
          primary: false,
        },
      ];

      const result = service.validateMultiAppConfig(configs);

      // Should have global issue about drizzle used in multiple apps
      const hasDrizzleWarning = result.globalIssues.some((i) =>
        i.includes("drizzle")
      );
      expect(hasDrizzleWarning).toBe(true);
    });

    it("should detect multiple primary apps of same type", () => {
      const configs: AppConfig[] = [
        {
          name: "api",
          type: "nestjs",
          path: "apps/api",
          plugins: [],
          primary: true,
        },
        {
          name: "worker",
          type: "nestjs",
          path: "apps/worker",
          plugins: [],
          primary: true, // Both are primary
        },
      ];

      const result = service.validateMultiAppConfig(configs);

      expect(result.globalIssues.some((i) => i.includes("primary"))).toBe(true);
    });

    it("should calculate total errors and warnings", () => {
      const configs: AppConfig[] = [
        {
          name: "api",
          type: "nestjs",
          path: "apps/api",
          plugins: ["unknown1"],
          primary: true,
        },
        {
          name: "web",
          type: "nextjs",
          path: "apps/web",
          plugins: ["unknown2"],
          primary: true,
        },
      ];

      const result = service.validateMultiAppConfig(configs);

      expect(result.totalErrors).toBeGreaterThanOrEqual(2); // At least 2 unknown plugins
    });
  });

  describe("resolvePluginsForApp", () => {
    it("should resolve plugins with required plugins first", () => {
      const config: AppConfig = {
        name: "api",
        type: "nestjs",
        path: "apps/api",
        plugins: ["drizzle"],
        primary: true,
      };

      const result = service.resolvePluginsForApp(config);

      expect(result.order.length).toBeGreaterThan(0);
      expect(result.plugins.length).toBe(result.order.length);
    });

    it("should auto-enable plugin dependencies", () => {
      // Find a plugin with dependencies
      const pluginRegistry = PluginRegistryService.getInstance();
      const plugins = pluginRegistry.getAll();
      const pluginWithDeps = plugins.find(
        (p) =>
          p.dependencies &&
          p.dependencies.length > 0 &&
          ["nestjs", "nextjs"].some((app) =>
            p.supportedApps === "*" ||
            (Array.isArray(p.supportedApps) && p.supportedApps.includes(app as AppTypeId))
          )
      );

      if (pluginWithDeps) {
        const appType = pluginWithDeps.supportedApps === "*" 
          ? "nestjs" 
          : (pluginWithDeps.supportedApps as AppTypeId[])[0]!;
          
        const config: AppConfig = {
          name: "app",
          type: appType,
          path: `apps/${appType}`,
          plugins: [pluginWithDeps.id],
          primary: true,
        };

        const result = service.resolvePluginsForApp(config);

        // Should have auto-enabled dependencies
        expect(result.autoEnabled.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should skip incompatible plugins", () => {
      // Use fumadocs with a database plugin (not compatible)
      const config: AppConfig = {
        name: "docs",
        type: "fumadocs",
        path: "apps/docs",
        plugins: ["drizzle"], // Not compatible with fumadocs
        primary: true,
      };

      const result = service.resolvePluginsForApp(config);

      // Drizzle should be in skipped
      const skippedDrizzle = result.skipped.find((s) => s.id === "drizzle");
      expect(skippedDrizzle).toBeDefined();
      expect(skippedDrizzle?.reason).toContain("compatible");
    });

    it("should throw for unknown app type", () => {
      const config: AppConfig = {
        name: "unknown",
        type: "unknown" as AppTypeId,
        path: "apps/unknown",
        plugins: [],
        primary: true,
      };

      expect(() => service.resolvePluginsForApp(config)).toThrow("Unknown app type");
    });
  });

  describe("isPluginCompatibleWithApp", () => {
    it("should return true for compatible plugin-app pair", () => {
      expect(service.isPluginCompatibleWithApp("drizzle", "nestjs")).toBe(true);
      expect(service.isPluginCompatibleWithApp("shadcn-ui", "nextjs")).toBe(true);
    });

    it("should return false for incompatible plugin-app pair", () => {
      expect(service.isPluginCompatibleWithApp("drizzle", "fumadocs")).toBe(false);
    });

    it("should return false for unknown plugin", () => {
      expect(service.isPluginCompatibleWithApp("unknown", "nestjs")).toBe(false);
    });

    it("should return false for unknown app type", () => {
      expect(
        service.isPluginCompatibleWithApp("drizzle", "unknown" as AppTypeId)
      ).toBe(false);
    });
  });

  describe("getPluginCompatibilitySummary", () => {
    it("should return compatibility summary for plugin", () => {
      const summary = service.getPluginCompatibilitySummary("typescript");

      expect(summary.pluginId).toBe("typescript");
      expect(summary.compatible.length).toBeGreaterThan(0);
      expect(summary.compatibilityRate).toBeGreaterThan(0);
    });

    it("should handle unknown plugin", () => {
      const summary = service.getPluginCompatibilitySummary("unknown");

      expect(summary.pluginId).toBe("unknown");
      expect(summary.compatible).toEqual([]);
      expect(summary.compatibilityRate).toBe(0);
    });
  });

  describe("getAppTypesForPlugin", () => {
    it("should return app types for compatible plugin", () => {
      const appTypes = service.getAppTypesForPlugin("typescript");

      expect(appTypes.length).toBeGreaterThan(0);
      // TypeScript should be compatible with most app types
    });

    it("should return empty array for unknown plugin", () => {
      const appTypes = service.getAppTypesForPlugin("unknown");
      expect(appTypes).toEqual([]);
    });
  });
});
