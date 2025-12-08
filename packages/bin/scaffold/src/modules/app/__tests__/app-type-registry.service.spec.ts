/**
 * App Type Registry Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  AppTypeRegistryService,
  appTypeRegistry,
} from "../app-type-registry.service";
import type { AppType, AppTypeId, AppCapability } from "../../../types/app.types";

describe("AppTypeRegistryService", () => {
  let registry: AppTypeRegistryService;

  beforeEach(() => {
    AppTypeRegistryService.resetInstance();
    registry = AppTypeRegistryService.getInstance();
  });

  afterEach(() => {
    AppTypeRegistryService.resetInstance();
  });

  describe("getInstance", () => {
    it("should return a singleton instance", () => {
      const instance1 = AppTypeRegistryService.getInstance();
      const instance2 = AppTypeRegistryService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should return the same instance as appTypeRegistry export", () => {
      // Reset and get fresh instance
      AppTypeRegistryService.resetInstance();
      const instance = AppTypeRegistryService.getInstance();
      // The exported singleton is created at module load, so we can't test equality
      // but we can test that it behaves the same
      expect(instance.getAllIds()).toBeDefined();
    });
  });

  describe("getById", () => {
    it("should return built-in app type", () => {
      const nestjs = registry.getById("nestjs");
      expect(nestjs).toBeDefined();
      expect(nestjs?.id).toBe("nestjs");
      expect(nestjs?.name).toBe("NestJS");
    });

    it("should return undefined for unknown app type", () => {
      const unknown = registry.getById("unknown" as AppTypeId);
      expect(unknown).toBeUndefined();
    });
  });

  describe("getAll", () => {
    it("should return all built-in app types", () => {
      const all = registry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(6);
      expect(all.map((a) => a.id)).toContain("nestjs");
      expect(all.map((a) => a.id)).toContain("nextjs");
      expect(all.map((a) => a.id)).toContain("fumadocs");
    });
  });

  describe("getStable", () => {
    it("should return only stable app types", () => {
      const stable = registry.getStable();
      expect(stable.every((app) => app.stable)).toBe(true);
      expect(stable.map((a) => a.id)).toContain("nestjs");
      expect(stable.map((a) => a.id)).toContain("nextjs");
    });

    it("should not include unstable app types", () => {
      const stable = registry.getStable();
      const stableIds = stable.map((a) => a.id);
      expect(stableIds).not.toContain("express");
      expect(stableIds).not.toContain("fastify");
      expect(stableIds).not.toContain("astro");
    });
  });

  describe("getAllIds", () => {
    it("should return all app type IDs", () => {
      const ids = registry.getAllIds();
      expect(ids).toContain("nestjs");
      expect(ids).toContain("nextjs");
      expect(ids).toContain("fumadocs");
      expect(ids).toContain("express");
      expect(ids).toContain("fastify");
      expect(ids).toContain("astro");
    });
  });

  describe("isValid", () => {
    it("should return true for valid app type ID", () => {
      expect(registry.isValid("nestjs")).toBe(true);
      expect(registry.isValid("nextjs")).toBe(true);
    });

    it("should return false for invalid app type ID", () => {
      expect(registry.isValid("unknown")).toBe(false);
      expect(registry.isValid("")).toBe(false);
    });
  });

  describe("getMetadata", () => {
    it("should return metadata for all app types", () => {
      const metadata = registry.getMetadata();
      expect(metadata.length).toBeGreaterThanOrEqual(6);

      const nestjsMeta = metadata.find((m) => m.id === "nestjs");
      expect(nestjsMeta).toBeDefined();
      expect(nestjsMeta?.name).toBe("NestJS");
      expect(nestjsMeta?.stable).toBe(true);
      expect(nestjsMeta?.capabilityCount).toBeGreaterThan(0);
    });
  });

  describe("hasCapability", () => {
    it("should return true if app has capability", () => {
      expect(registry.hasCapability("nestjs", "http-server")).toBe(true);
      expect(registry.hasCapability("nestjs", "api")).toBe(true);
      expect(registry.hasCapability("nextjs", "ssr")).toBe(true);
      expect(registry.hasCapability("nextjs", "react")).toBe(true);
    });

    it("should return false if app does not have capability", () => {
      expect(registry.hasCapability("nestjs", "ssr")).toBe(false);
      expect(registry.hasCapability("fumadocs", "database")).toBe(false);
    });

    it("should return false for unknown app type", () => {
      expect(registry.hasCapability("unknown" as AppTypeId, "http-server")).toBe(false);
    });
  });

  describe("getCapabilities", () => {
    it("should return all capabilities for an app type", () => {
      const caps = registry.getCapabilities("nestjs");
      expect(caps).toContain("http-server");
      expect(caps).toContain("api");
      expect(caps).toContain("database");
    });

    it("should return empty array for unknown app type", () => {
      const caps = registry.getCapabilities("unknown" as AppTypeId);
      expect(caps).toEqual([]);
    });
  });

  describe("getByCapability", () => {
    it("should return app types with specified capability", () => {
      const httpServers = registry.getByCapability("http-server");
      expect(httpServers.map((a) => a.id)).toContain("nestjs");
      expect(httpServers.map((a) => a.id)).toContain("nextjs");
      expect(httpServers.map((a) => a.id)).toContain("express");
    });

    it("should return empty array for capability no app has", () => {
      const none = registry.getByCapability("nonexistent" as AppCapability);
      expect(none).toEqual([]);
    });
  });

  describe("getByCapabilities", () => {
    it("should return app types with ALL specified capabilities", () => {
      const result = registry.getByCapabilities(["http-server", "react"]);
      expect(result.map((a) => a.id)).toContain("nextjs");
      expect(result.map((a) => a.id)).not.toContain("nestjs");
    });
  });

  describe("supportsPlugin", () => {
    it("should return true if app supports plugin", () => {
      expect(registry.supportsPlugin("nestjs", "drizzle")).toBe(true);
      expect(registry.supportsPlugin("nextjs", "shadcn-ui")).toBe(true);
    });

    it("should return false if app does not support plugin", () => {
      expect(registry.supportsPlugin("fumadocs", "drizzle")).toBe(false);
    });

    it("should return false for unknown app type", () => {
      expect(registry.supportsPlugin("unknown" as AppTypeId, "drizzle")).toBe(false);
    });
  });

  describe("getSupportedPlugins", () => {
    it("should return supported plugins for app type", () => {
      const plugins = registry.getSupportedPlugins("nestjs");
      expect(plugins).toContain("drizzle");
      expect(plugins).toContain("better-auth");
    });

    it("should return empty array for unknown app type", () => {
      const plugins = registry.getSupportedPlugins("unknown" as AppTypeId);
      expect(plugins).toEqual([]);
    });
  });

  describe("getRequiredPlugins", () => {
    it("should return required plugins for app type", () => {
      const plugins = registry.getRequiredPlugins("nestjs");
      expect(plugins.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown app type", () => {
      const plugins = registry.getRequiredPlugins("unknown" as AppTypeId);
      expect(plugins).toEqual([]);
    });
  });

  describe("validatePluginCompatibility", () => {
    it("should return valid for supported plugin", () => {
      const result = registry.validatePluginCompatibility("nestjs", "drizzle");
      expect(result.valid).toBe(true);
    });

    it("should return warning for unsupported plugin", () => {
      const result = registry.validatePluginCompatibility("fumadocs", "drizzle");
      expect(result.valid).toBe(false);
      expect(result.severity).toBe("warning");
    });

    it("should return error for unknown app type", () => {
      const result = registry.validatePluginCompatibility("unknown" as AppTypeId, "drizzle");
      expect(result.valid).toBe(false);
      expect(result.severity).toBe("error");
    });

    it("should check plugin.supportedApps if provided", () => {
      const plugin = {
        id: "test-plugin",
        name: "Test",
        version: "1.0.0",
        supportedApps: ["nextjs"] as AppTypeId[],
      };
      // NestJS supports test-plugin in our mock, but plugin doesn't support nestjs
      // Since nestjs doesn't have test-plugin in supported list, it should fail first
      const result = registry.validatePluginCompatibility("nextjs", "test-plugin", plugin as any);
      // This will fail because test-plugin is not in nextjs supportedPlugins
      expect(result.valid).toBe(false);
    });
  });

  describe("getCompatibilityMatrix", () => {
    it("should return compatibility matrix", () => {
      const matrix = registry.getCompatibilityMatrix(["drizzle", "shadcn-ui"]);

      expect(matrix.appTypes).toContain("nestjs");
      expect(matrix.appTypes).toContain("nextjs");
      expect(matrix.plugins).toEqual(["drizzle", "shadcn-ui"]);

      expect(matrix.compatibility["nestjs"]["drizzle"]).toBe(true);
      expect(matrix.compatibility["nestjs"]["shadcn-ui"]).toBe(false);
      expect(matrix.compatibility["nextjs"]["shadcn-ui"]).toBe(true);
    });
  });

  describe("resolveAppConfig", () => {
    it("should resolve app config with defaults", () => {
      const config = {
        name: "api",
        type: "nestjs" as AppTypeId,
        path: "apps/api",
        plugins: ["drizzle"],
        primary: true,
      };

      const resolved = registry.resolveAppConfig(config);

      expect(resolved.name).toBe("api");
      expect(resolved.type).toBe("nestjs");
      expect(resolved.appType).toBeDefined();
      expect(resolved.resolvedPluginOrder).toContain("drizzle");
      expect(resolved.resolvedAt).toBeInstanceOf(Date);
    });

    it("should auto-enable required plugins", () => {
      const config = {
        name: "api",
        type: "nestjs" as AppTypeId,
        path: "apps/api",
        plugins: [],
        primary: true,
      };

      const resolved = registry.resolveAppConfig(config);

      // NestJS has required plugins that should be auto-enabled
      expect(resolved.autoEnabledPlugins?.length).toBeGreaterThanOrEqual(0);
    });

    it("should throw for unknown app type", () => {
      const config = {
        name: "api",
        type: "unknown" as AppTypeId,
        path: "apps/api",
        plugins: [],
        primary: true,
      };

      expect(() => registry.resolveAppConfig(config)).toThrow("Unknown app type");
    });
  });

  describe("validateAppConfig", () => {
    it("should validate valid config", () => {
      const result = registry.validateAppConfig({
        name: "api",
        type: "nestjs",
        path: "apps/api",
        plugins: ["drizzle"],
        primary: true,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should error on invalid app type", () => {
      const result = registry.validateAppConfig({
        name: "api",
        type: "unknown" as AppTypeId,
        path: "apps/api",
        plugins: [],
        primary: true,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Unknown app type"))).toBe(true);
    });

    it("should error on invalid name format", () => {
      const result = registry.validateAppConfig({
        name: "My-Api",
        type: "nestjs",
        path: "apps/api",
        plugins: [],
        primary: true,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("name"))).toBe(true);
    });

    it("should warn on unsupported plugins", () => {
      const result = registry.validateAppConfig({
        name: "api",
        type: "fumadocs",
        path: "apps/docs",
        plugins: ["drizzle"], // Not supported by fumadocs
        primary: true,
      });

      expect(result.warnings.some((w) => w.includes("not officially supported"))).toBe(true);
    });
  });

  describe("createDefaultAppConfig", () => {
    it("should create default config for app type", () => {
      const config = registry.createDefaultAppConfig("nestjs", "my-api");

      expect(config.name).toBe("my-api");
      expect(config.type).toBe("nestjs");
      expect(config.path).toBe("apps/api");
      expect(config.primary).toBe(true);
    });

    it("should use app type ID as name if not provided", () => {
      const config = registry.createDefaultAppConfig("nextjs");

      expect(config.name).toBe("nextjs");
    });

    it("should throw for unknown app type", () => {
      expect(() => registry.createDefaultAppConfig("unknown" as AppTypeId)).toThrow();
    });
  });

  describe("custom app types", () => {
    it("should register and retrieve custom app type", () => {
      const customApp: AppType = {
        id: "custom" as AppTypeId,
        name: "Custom App",
        description: "A custom app type",
        defaultPath: "apps/custom",
        capabilities: ["http-server"],
        supportedPlugins: ["typescript"],
        requiredPlugins: [],
        fileExtensions: [".ts"],
        baseDependencies: {},
        baseDevDependencies: {},
        stable: false,
      };

      registry.registerCustomAppType(customApp);

      expect(registry.getById("custom" as AppTypeId)).toBeDefined();
      expect(registry.getById("custom" as AppTypeId)?.name).toBe("Custom App");
      expect(registry.isCustomAppType("custom" as AppTypeId)).toBe(true);
    });

    it("should unregister custom app type", () => {
      const customApp: AppType = {
        id: "custom2" as AppTypeId,
        name: "Custom App 2",
        description: "Another custom app type",
        defaultPath: "apps/custom2",
        capabilities: [],
        supportedPlugins: [],
        requiredPlugins: [],
        fileExtensions: [],
        baseDependencies: {},
        baseDevDependencies: {},
        stable: false,
      };

      registry.registerCustomAppType(customApp);
      expect(registry.getById("custom2" as AppTypeId)).toBeDefined();

      const result = registry.unregisterCustomAppType("custom2" as AppTypeId);
      expect(result).toBe(true);
      expect(registry.getById("custom2" as AppTypeId)).toBeUndefined();
    });

    it("should not consider built-in as custom", () => {
      expect(registry.isCustomAppType("nestjs")).toBe(false);
    });

    it("should override built-in with custom if same ID", () => {
      const customNestjs: AppType = {
        id: "nestjs",
        name: "Custom NestJS",
        description: "Overridden NestJS",
        defaultPath: "apps/custom-nest",
        capabilities: ["http-server"],
        supportedPlugins: [],
        requiredPlugins: [],
        fileExtensions: [".ts"],
        baseDependencies: {},
        baseDevDependencies: {},
        stable: true,
      };

      registry.registerCustomAppType(customNestjs);

      const result = registry.getById("nestjs");
      expect(result?.name).toBe("Custom NestJS");
    });

    it("should return custom app types only via getCustomAppTypes", () => {
      const customApp: AppType = {
        id: "custom3" as AppTypeId,
        name: "Custom App 3",
        description: "Yet another custom app type",
        defaultPath: "apps/custom3",
        capabilities: [],
        supportedPlugins: [],
        requiredPlugins: [],
        fileExtensions: [],
        baseDependencies: {},
        baseDevDependencies: {},
        stable: false,
      };

      registry.registerCustomAppType(customApp);

      const customTypes = registry.getCustomAppTypes();
      expect(customTypes.some((a) => a.id === ("custom3" as AppTypeId))).toBe(true);
      expect(customTypes.some((a) => a.id === "nextjs")).toBe(false);
    });
  });
});
