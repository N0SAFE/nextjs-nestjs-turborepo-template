/**
 * Builder UI Adapter Service Tests
 *
 * Tests for converting builder-ui configs to scaffold CLI format.
 * Plugin IDs must match exactly what's defined in apps/builder-ui/src/data/plugins.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { BuilderUiAdapterService } from "../builder-ui-adapter.service";
import type { BuilderProjectConfig } from "../builder-ui.types";

describe("BuilderUiAdapterService", () => {
  let service: BuilderUiAdapterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuilderUiAdapterService],
    }).compile();

    service = module.get<BuilderUiAdapterService>(BuilderUiAdapterService);
  });

  describe("toScaffoldConfig", () => {
    it("should convert basic builder config to scaffold config", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "my-project",
        description: "Test project",
        author: "Test Author",
        license: "MIT",
        packageManager: "bun",
        template: "full-stack",
        features: ["base", "typescript", "better-auth", "orpc"],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);

      expect(result.name).toBe("my-project");
      expect(result.description).toBe("Test project");
      expect(result.author).toBe("Test Author");
      expect(result.license).toBe("MIT");
      expect(result.packageManager).toBe("bun");
      expect(result.ports).toEqual({ api: 3001, web: 3000 });
    });

    it("should map builder features to scaffold plugins", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: [
          "better-auth",
          "better-auth-admin",
          "better-auth-2fa",
          "orpc",
          "orpc-streaming",
          "database",
        ],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);

      // Should deduplicate mapped generators
      expect(result.plugins).toContain("better-auth");
      expect(result.plugins).toContain("orpc");
      expect(result.plugins).toContain("drizzle");
      // Should not have duplicates
      expect(result.plugins?.filter((p) => p === "better-auth")).toHaveLength(
        1
      );
    });

    it("should merge plugin configs for same generator", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: ["better-auth", "better-auth-admin", "better-auth-2fa"],
        pluginConfigs: {
          "better-auth": { someOption: true },
          "better-auth-admin": { adminPath: "/admin" },
        },
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);

      expect(result.pluginConfigs?.["better-auth"]).toMatchObject({
        someOption: true,
        enableAdmin: true,
      });
    });

    it("should apply default ports when not specified", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: [],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);

      expect(result.ports).toEqual({ api: 3001, web: 3000 });
    });

    it("should transform specific plugin configs correctly", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: [
          "testing",
          "testing-playwright",
          "testing-msw",
          "docker",
          "docker-compose",
        ],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);

      expect(result.pluginConfigs?.["vitest"]).toMatchObject({
        enableE2E: true,
        enableMsw: true,
      });
      expect(result.pluginConfigs?.["docker"]).toMatchObject({
        enableCompose: true,
      });
    });
  });

  describe("generateCommand", () => {
    const baseConfig: BuilderProjectConfig = {
      projectName: "my-app",
      description: "My test app",
      author: "John Doe",
      license: "MIT",
      packageManager: "bun",
      template: "full-stack",
      features: ["better-auth", "orpc", "database"],
      pluginConfigs: {},
      apiPort: 3001,
      webPort: 3000,
    };

    it("should generate basic CLI command", () => {
      const result = service.generateCommand(baseConfig);

      expect(result.command).toContain("scaffold create");
      expect(result.command).toContain("--name my-app");
      expect(result.args).toContain("--name");
      expect(result.args).toContain("my-app");
    });

    it("should include description and author", () => {
      const result = service.generateCommand(baseConfig);

      expect(result.command).toContain('--description "My test app"');
      expect(result.command).toContain('--author "John Doe"');
    });

    it("should skip default values in non-verbose mode", () => {
      const result = service.generateCommand(baseConfig, { verbose: false });

      // MIT is default, should be skipped
      expect(result.command).not.toContain("--license");
      // bun is default, should be skipped
      expect(result.command).not.toContain("--package-manager");
      // Default ports should be skipped
      expect(result.command).not.toContain("--api-port");
      expect(result.command).not.toContain("--web-port");
    });

    it("should include all values in verbose mode", () => {
      const result = service.generateCommand(baseConfig, { verbose: true });

      expect(result.command).toContain("--license MIT");
      expect(result.command).toContain("--package-manager bun");
      expect(result.command).toContain("--api-port 3001");
      expect(result.command).toContain("--web-port 3000");
    });

    it("should use short options when requested", () => {
      const result = service.generateCommand(baseConfig, {
        longOptions: false,
      });

      expect(result.command).toContain("-n my-app");
      expect(result.command).toContain("-d");
      expect(result.command).toContain("-a");
    });

    it("should include plugins list", () => {
      const result = service.generateCommand(baseConfig);

      expect(result.command).toContain("--plugins");
      expect(result.command).toContain("better-auth");
      expect(result.command).toContain("orpc");
      expect(result.command).toContain("drizzle");
    });

    it("should warn about unsupported features", () => {
      const configWithUnsupported: BuilderProjectConfig = {
        ...baseConfig,
        features: ["better-auth", "some-unsupported-plugin"],
      };

      const result = service.generateCommand(configWithUnsupported);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("some-unsupported-plugin");
    });

    it("should include JSON config when useJson is true", () => {
      const configWithPluginConfig: BuilderProjectConfig = {
        ...baseConfig,
        pluginConfigs: {
          "better-auth": { customOption: true },
        },
      };

      const result = service.generateCommand(configWithPluginConfig, {
        useJson: true,
      });

      expect(result.command).toContain("--plugin-config");
    });

    it("should generate proper description", () => {
      const result = service.generateCommand(baseConfig);

      expect(result.description).toContain("my-app");
      expect(result.description).toContain("3 generators");
    });
  });

  describe("parseBuilderJson", () => {
    it("should parse valid JSON config", () => {
      const json = JSON.stringify({
        projectName: "test-project",
        description: "A test",
        features: ["better-auth"],
      });

      const result = service.parseBuilderJson(json);

      expect(result.projectName).toBe("test-project");
      expect(result.description).toBe("A test");
      expect(result.features).toEqual(["better-auth"]);
    });

    it("should apply defaults for missing optional fields", () => {
      const json = JSON.stringify({
        projectName: "minimal",
      });

      const result = service.parseBuilderJson(json);

      expect(result.projectName).toBe("minimal");
      expect(result.description).toBe("");
      expect(result.license).toBe("MIT");
      expect(result.packageManager).toBe("bun");
      expect(result.features).toEqual([]);
      expect(result.apiPort).toBe(3001);
      expect(result.webPort).toBe(3000);
    });

    it("should throw on invalid JSON", () => {
      expect(() => service.parseBuilderJson("not valid json")).toThrow(
        "Failed to parse builder-ui config"
      );
    });

    it("should throw on missing projectName", () => {
      const json = JSON.stringify({ description: "no name" });

      expect(() => service.parseBuilderJson(json)).toThrow(
        "Missing or invalid projectName"
      );
    });
  });

  describe("generateConfigFile", () => {
    const config: BuilderProjectConfig = {
      projectName: "config-test",
      description: "Test config generation",
      author: "Tester",
      license: "MIT",
      packageManager: "bun",
      template: "full-stack",
      features: ["better-auth", "orpc"],
      pluginConfigs: {},
      apiPort: 3001,
      webPort: 3000,
    };

    it("should generate valid JSON config", () => {
      const result = service.generateConfigFile(config, "json");
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe("1.0");
      expect(parsed.project.name).toBe("config-test");
      expect(parsed.project.plugins).toContain("better-auth");
    });

    it("should generate YAML config", () => {
      const result = service.generateConfigFile(config, "yaml");

      expect(result).toContain("version: 1.0");
      expect(result).toContain("name: config-test");
      expect(result).toContain("better-auth");
    });
  });

  describe("getMappingStats", () => {
    it("should calculate correct stats for all supported features", () => {
      const features = ["better-auth", "orpc", "database"];

      const stats = service.getMappingStats(features);

      expect(stats.totalFeatures).toBe(3);
      expect(stats.supportedFeatures).toBe(3);
      expect(stats.unsupportedFeatures).toHaveLength(0);
      expect(stats.coverage).toBe(100);
    });

    it("should identify unsupported features", () => {
      const features = ["better-auth", "unknown-feature", "another-unknown"];

      const stats = service.getMappingStats(features);

      expect(stats.totalFeatures).toBe(3);
      expect(stats.supportedFeatures).toBe(1);
      expect(stats.unsupportedFeatures).toEqual([
        "unknown-feature",
        "another-unknown",
      ]);
      expect(stats.coverage).toBe(33);
    });

    it("should deduplicate generators in uniqueGenerators", () => {
      const features = [
        "better-auth",
        "better-auth-admin",
        "better-auth-2fa",
        "orpc",
      ];

      const stats = service.getMappingStats(features);

      expect(stats.uniqueGenerators).toEqual(["better-auth", "orpc"]);
    });

    it("should handle empty features array", () => {
      const stats = service.getMappingStats([]);

      expect(stats.totalFeatures).toBe(0);
      expect(stats.supportedFeatures).toBe(0);
      expect(stats.coverage).toBe(100);
    });
  });

  describe("plugin config transformations", () => {
    it("should transform better-auth plugins correctly", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: [
          "better-auth",
          "better-auth-admin",
          "better-auth-master-token",
          "better-auth-login-as",
          "better-auth-invite",
          "better-auth-organization",
          "better-auth-oauth-google",
          "better-auth-oauth-github",
          "better-auth-2fa",
          "better-auth-passkey",
        ],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);
      const authConfig = result.pluginConfigs?.["better-auth"] as Record<
        string,
        unknown
      >;

      expect(authConfig.enableAdmin).toBe(true);
      expect(authConfig.enableMasterToken).toBe(true);
      expect(authConfig.enableLoginAs).toBe(true);
      expect(authConfig.enableInvite).toBe(true);
      expect(authConfig.enableOrganization).toBe(true);
      expect(authConfig.enableGoogleOAuth).toBe(true);
      expect(authConfig.enableGithubOAuth).toBe(true);
      expect(authConfig.enable2FA).toBe(true);
      expect(authConfig.enablePasskey).toBe(true);
    });

    it("should transform database plugins correctly", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: ["database", "database-seeder", "drizzle-studio"],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);
      const dbConfig = result.pluginConfigs?.["drizzle"] as Record<
        string,
        unknown
      >;

      expect(dbConfig.enableSeeder).toBe(true);
      expect(dbConfig.enableStudio).toBe(true);
    });

    it("should transform CI/CD plugins correctly", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: ["ci-cd", "ci-cd-render"],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);
      const ciConfig = result.pluginConfigs?.["github-actions"] as Record<
        string,
        unknown
      >;

      expect(ciConfig.deployTarget).toBe("render");
    });

    it("should transform shadcn plugins correctly", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: ["shadcn-ui", "shadcn-form", "shadcn-data-table"],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);
      const shadcnConfig = result.pluginConfigs?.["shadcn-ui"] as Record<
        string,
        unknown
      >;

      expect(shadcnConfig.components).toContain("form");
      expect(shadcnConfig.components).toContain("data-table");
    });

    it("should transform tailwind plugins correctly", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: ["tailwind", "tailwind-animate", "tailwind-typography"],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);
      const tailwindConfig = result.pluginConfigs?.["tailwindcss"] as Record<
        string,
        unknown
      >;

      expect(tailwindConfig.enableAnimations).toBe(true);
      expect(tailwindConfig.enableTypography).toBe(true);
    });

    it("should transform orpc plugins correctly", () => {
      const builderConfig: BuilderProjectConfig = {
        projectName: "test",
        description: "",
        author: "",
        license: "MIT",
        packageManager: "bun",
        template: "",
        features: ["orpc", "orpc-streaming"],
        pluginConfigs: {},
        apiPort: 3001,
        webPort: 3000,
      };

      const result = service.toScaffoldConfig(builderConfig);
      const orpcConfig = result.pluginConfigs?.["orpc"] as Record<
        string,
        unknown
      >;

      expect(orpcConfig.enableStreaming).toBe(true);
    });
  });
});
