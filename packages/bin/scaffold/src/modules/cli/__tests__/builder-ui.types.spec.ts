/**
 * Builder UI Types Tests
 *
 * Tests for the builder-ui plugin mapping to scaffold generators.
 * Plugin IDs must match exactly what's defined in apps/builder-ui/src/data/plugins.ts
 */

import { describe, it, expect } from "vitest";
import {
  BUILDER_TO_SCAFFOLD_PLUGIN_MAP,
  getScaffoldGeneratorId,
  getScaffoldGeneratorIds,
  hasScaffoldGenerator,
  getBuilderPluginsForGenerator,
} from "../builder-ui.types";

describe("Builder UI Types", () => {
  describe("BUILDER_TO_SCAFFOLD_PLUGIN_MAP", () => {
    it("should contain all expected core plugins", () => {
      // Core plugins from builder-ui
      expect(BUILDER_TO_SCAFFOLD_PLUGIN_MAP["base"]).toBeNull(); // No direct generator
      expect(BUILDER_TO_SCAFFOLD_PLUGIN_MAP["typescript"]).toBe("typescript");
      expect(BUILDER_TO_SCAFFOLD_PLUGIN_MAP["turborepo"]).toBe("turborepo");
      expect(BUILDER_TO_SCAFFOLD_PLUGIN_MAP["bun-runtime"]).toBeNull(); // Handled by package manager config
      expect(BUILDER_TO_SCAFFOLD_PLUGIN_MAP["env-validation"]).toBe("zod");
    });

    it("should map all better-auth plugins to better-auth generator", () => {
      // Actual better-auth plugins from builder-ui/src/data/plugins.ts
      const betterAuthPlugins = [
        "better-auth",
        "better-auth-admin",
        "better-auth-master-token",
        "better-auth-login-as",
        "better-auth-invite",
        "better-auth-organization",
        "permission-system",
        "better-auth-oauth-google",
        "better-auth-oauth-github",
        "better-auth-2fa",
        "better-auth-passkey",
        "api-keys",
        "orpc-better-auth", // Part of better-auth integration
      ];

      betterAuthPlugins.forEach((plugin) => {
        expect(
          BUILDER_TO_SCAFFOLD_PLUGIN_MAP[plugin],
          `Plugin "${plugin}" should map to better-auth`
        ).toBe("better-auth");
      });
    });

    it("should map all orpc plugins to orpc generator", () => {
      // Actual ORPC plugins from builder-ui
      const orpcPlugins = [
        "orpc",
        "orpc-contracts",
        "orpc-streaming",
        "openapi",
        "openapi-scalar",
        "sse-streaming",
      ];

      orpcPlugins.forEach((plugin) => {
        expect(
          BUILDER_TO_SCAFFOLD_PLUGIN_MAP[plugin],
          `Plugin "${plugin}" should map to orpc`
        ).toBe("orpc");
      });
    });

    it("should have null for plugins without generators", () => {
      // Actual plugins from builder-ui that don't have scaffold generators
      const nullPlugins = [
        "pwa",
        "pwa-install-prompt",
        "pwa-offline-page",
        // skeleton-loading maps to shadcn-ui (skeleton components)
        "loading-spinners",
        "lucide-icons",
        "react-icons",
        "framer-motion",
        "tanstack-devtools-routes",
        "tanstack-devtools-auth",
        "tanstack-devtools-drizzle",
        "tanstack-devtools-api",
        "stripe",
        "stripe-billing-portal",
        "stripe-elements",
        "analytics",
        "analytics-posthog",
        "analytics-plausible",
        "seo",
        "seo-json-ld",
        "seo-opengraph",
        "fumadocs",
        "email",
        "email-resend",
        "email-templates",
        "file-upload",
        "file-storage-s3",
        "file-storage-local",
        "event-system",
        "event-processing-strategies",
        "push-notifications",
        "push-device-management",
      ];

      nullPlugins.forEach((plugin) => {
        expect(
          BUILDER_TO_SCAFFOLD_PLUGIN_MAP[plugin],
          `Plugin "${plugin}" should map to null`
        ).toBeNull();
      });
    });

    it("should have at least 90 entries", () => {
      const entries = Object.keys(BUILDER_TO_SCAFFOLD_PLUGIN_MAP);
      expect(entries.length).toBeGreaterThanOrEqual(90);
    });
  });

  describe("getScaffoldGeneratorId", () => {
    it("should return correct generator ID for mapped plugins", () => {
      expect(getScaffoldGeneratorId("better-auth")).toBe("better-auth");
      expect(getScaffoldGeneratorId("better-auth-admin")).toBe("better-auth");
      expect(getScaffoldGeneratorId("orpc")).toBe("orpc");
      expect(getScaffoldGeneratorId("database")).toBe("drizzle");
      expect(getScaffoldGeneratorId("docker")).toBe("docker");
      expect(getScaffoldGeneratorId("testing")).toBe("vitest");
    });

    it("should return null for unmapped plugins", () => {
      expect(getScaffoldGeneratorId("pwa")).toBeNull();
      expect(getScaffoldGeneratorId("framer-motion")).toBeNull();
      expect(getScaffoldGeneratorId("stripe")).toBeNull();
    });

    it("should return null for unknown plugins", () => {
      expect(getScaffoldGeneratorId("unknown-plugin")).toBeNull();
      expect(getScaffoldGeneratorId("")).toBeNull();
    });
  });

  describe("getScaffoldGeneratorIds", () => {
    it("should return unique generator IDs", () => {
      const result = getScaffoldGeneratorIds([
        "better-auth",
        "better-auth-admin",
        "better-auth-2fa",
        "orpc",
        "orpc-streaming",
      ]);

      expect(result).toEqual(["better-auth", "orpc"]);
    });

    it("should filter out null mappings", () => {
      const result = getScaffoldGeneratorIds([
        "better-auth",
        "pwa",
        "orpc",
        "framer-motion",
      ]);

      expect(result).toEqual(["better-auth", "orpc"]);
      expect(result).not.toContain(null);
    });

    it("should return empty array for empty input", () => {
      expect(getScaffoldGeneratorIds([])).toEqual([]);
    });

    it("should return empty array when all plugins have no generators", () => {
      const result = getScaffoldGeneratorIds(["pwa", "framer-motion", "stripe"]);
      expect(result).toEqual([]);
    });

    it("should maintain order of first occurrence", () => {
      const result = getScaffoldGeneratorIds([
        "orpc",
        "better-auth",
        "orpc-streaming",
        "database",
      ]);

      expect(result).toEqual(["orpc", "better-auth", "drizzle"]);
    });
  });

  describe("hasScaffoldGenerator", () => {
    it("should return true for plugins with generators", () => {
      expect(hasScaffoldGenerator("better-auth")).toBe(true);
      expect(hasScaffoldGenerator("orpc")).toBe(true);
      expect(hasScaffoldGenerator("database")).toBe(true);
      expect(hasScaffoldGenerator("docker")).toBe(true);
      expect(hasScaffoldGenerator("testing")).toBe(true);
    });

    it("should return false for plugins without generators", () => {
      expect(hasScaffoldGenerator("pwa")).toBe(false);
      expect(hasScaffoldGenerator("framer-motion")).toBe(false);
      expect(hasScaffoldGenerator("stripe")).toBe(false);
      expect(hasScaffoldGenerator("base")).toBe(false);
    });

    it("should return false for unknown plugins", () => {
      expect(hasScaffoldGenerator("unknown")).toBe(false);
    });
  });

  describe("getBuilderPluginsForGenerator", () => {
    it("should return all builder plugins for better-auth generator", () => {
      const result = getBuilderPluginsForGenerator("better-auth");

      expect(result).toContain("better-auth");
      expect(result).toContain("better-auth-admin");
      expect(result).toContain("better-auth-2fa");
      expect(result).toContain("better-auth-passkey");
      expect(result).toContain("orpc-better-auth");
      expect(result).toContain("permission-system");
      expect(result).toContain("api-keys");
      expect(result.length).toBeGreaterThanOrEqual(12);
    });

    it("should return all builder plugins for orpc generator", () => {
      const result = getBuilderPluginsForGenerator("orpc");

      expect(result).toContain("orpc");
      expect(result).toContain("orpc-contracts");
      expect(result).toContain("orpc-streaming");
      expect(result).toContain("openapi");
      expect(result).toContain("sse-streaming");
    });

    it("should return all builder plugins for drizzle generator", () => {
      const result = getBuilderPluginsForGenerator("drizzle");

      expect(result).toContain("database");
      expect(result).toContain("database-seeder");
      expect(result).toContain("drizzle-studio");
    });

    it("should return empty array for unknown generator", () => {
      expect(getBuilderPluginsForGenerator("unknown")).toEqual([]);
    });

    it("should return empty array for generator with no explicit plugins", () => {
      const result = getBuilderPluginsForGenerator("nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("Generator Coverage", () => {
    it("should have mappings for scaffold generators", () => {
      // Generators that should be in the mapping
      const expectedGenerators = [
        "typescript",
        "turborepo",
        "zod",
        "better-auth",
        "orpc",
        "drizzle",
        "redis",
        "docker",
        "github-actions",
        "vitest",
        "shadcn-ui",
        "tailwindcss",
        "next-themes",
        "react-query",
      ];

      const mappedGenerators = new Set(
        Object.values(BUILDER_TO_SCAFFOLD_PLUGIN_MAP).filter((v) => v !== null)
      );

      expectedGenerators.forEach((gen) => {
        expect(
          mappedGenerators.has(gen),
          `Generator "${gen}" should be in the mapping`
        ).toBe(true);
      });
    });

    it("should count builder plugins correctly per generator", () => {
      const generatorCounts: Record<string, number> = {};

      for (const [, generatorId] of Object.entries(
        BUILDER_TO_SCAFFOLD_PLUGIN_MAP
      )) {
        if (generatorId !== null) {
          generatorCounts[generatorId] =
            (generatorCounts[generatorId] || 0) + 1;
        }
      }

      // better-auth should have the most plugins (13+)
      expect(generatorCounts["better-auth"]).toBeGreaterThanOrEqual(13);

      // orpc should have 6+ plugins
      expect(generatorCounts["orpc"]).toBeGreaterThanOrEqual(5);

      // drizzle should have 3 plugins
      expect(generatorCounts["drizzle"]).toBe(3);
    });
  });

  describe("Type Safety", () => {
    it("should type check plugin IDs", () => {
      const validPluginId = "better-auth";
      const result = getScaffoldGeneratorId(validPluginId);
      expect(typeof result).toBe("string");
    });

    it("should handle edge cases gracefully", () => {
      // Empty string
      expect(getScaffoldGeneratorId("")).toBeNull();

      // Whitespace
      expect(getScaffoldGeneratorId("  ")).toBeNull();

      // Case sensitivity
      expect(getScaffoldGeneratorId("Better-Auth")).toBeNull();
      expect(getScaffoldGeneratorId("BETTER-AUTH")).toBeNull();
    });
  });
});
