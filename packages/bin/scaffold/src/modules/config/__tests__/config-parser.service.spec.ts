/**
 * Config Parser Service Tests
 *
 * Tests for configuration file loading, parsing, and merging.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ConfigParserService } from "../config-parser.service";
import type { ProjectConfigInput } from "../schemas/project-config.schema";

// Mock FileSystemService
const mockFileSystemService = {
  exists: vi.fn(),
  readFile: vi.fn(),
  readJson: vi.fn(),
  writeFile: vi.fn(),
  writeJson: vi.fn(),
  ensureDir: vi.fn(),
};

// Mock ConfigValidatorService
const mockValidatorService = {
  validate: vi.fn(),
  validatePartial: vi.fn(),
};

describe("ConfigParserService", () => {
  let service: ConfigParserService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create service with mocked dependencies
    service = new ConfigParserService(
      mockFileSystemService as any,
      mockValidatorService as any,
    );
    
    // Default mock implementations
    mockFileSystemService.exists.mockResolvedValue(false);
    mockValidatorService.validate.mockImplementation((input) => ({
      name: input.name || "test-project",
      description: input.description,
      template: input.template || "full",
      packageManager: input.packageManager || "bun",
      ...input,
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with injected dependencies", () => {
      expect(service).toBeDefined();
    });
  });

  describe("loadFromFile", () => {
    describe("JSON files", () => {
      it("should load JSON config file", async () => {
        mockFileSystemService.exists.mockResolvedValue(true);
        mockFileSystemService.readJson.mockResolvedValue({
          name: "test-project",
          template: "full",
          plugins: ["auth", "api"],
        });

        const config = await service.loadFromFile("/path/to/scaffold.config.json");

        expect(config).toEqual({
          name: "test-project",
          template: "full",
          plugins: ["auth", "api"],
        });
        expect(mockFileSystemService.readJson).toHaveBeenCalledWith("/path/to/scaffold.config.json");
      });

      it("should handle .scaffoldrc file as JSON", async () => {
        mockFileSystemService.exists.mockResolvedValue(true);
        mockFileSystemService.readJson.mockResolvedValue({
          defaultTemplate: "minimal",
          plugins: ["plugin-a"],
        });

        const config = await service.loadFromFile("/project/.scaffoldrc") as Record<string, unknown>;

        expect(config.defaultTemplate).toBe("minimal");
        expect(config.plugins).toEqual(["plugin-a"]);
      });

      it("should throw on file not found", async () => {
        mockFileSystemService.exists.mockResolvedValue(false);

        await expect(service.loadFromFile("/path/to/config.json"))
          .rejects.toThrow();
      });
    });

    describe("YAML files", () => {
      it("should load YAML config file", async () => {
        mockFileSystemService.exists.mockResolvedValue(true);
        mockFileSystemService.readFile.mockResolvedValue(`
name: test-project
template: full
debug: true
`);

        const config = await service.loadFromFile("/path/to/scaffold.config.yaml");

        expect(config.name).toBe("test-project");
      });

      it("should load .yml extension", async () => {
        mockFileSystemService.exists.mockResolvedValue(true);
        mockFileSystemService.readFile.mockResolvedValue(`
name: yaml-project
`);

        const config = await service.loadFromFile("/path/to/config.yml");

        expect(config.name).toBe("yaml-project");
      });

      it("should parse YAML boolean values", async () => {
        mockFileSystemService.exists.mockResolvedValue(true);
        mockFileSystemService.readFile.mockResolvedValue(`
enabled: true
disabled: false
`);

        const config = await service.loadFromFile("/path/to/config.yaml") as Record<string, unknown>;

        expect(config.enabled).toBe(true);
        expect(config.disabled).toBe(false);
      });

      it("should parse YAML number values", async () => {
        mockFileSystemService.exists.mockResolvedValue(true);
        mockFileSystemService.readFile.mockResolvedValue(`
port: 3000
timeout: 30
`);

        const config = await service.loadFromFile("/path/to/config.yaml") as Record<string, unknown>;

        expect(config.port).toBe(3000);
        expect(config.timeout).toBe(30);
      });
    });

    describe("unsupported formats", () => {
      it("should throw for unsupported file extension", async () => {
        mockFileSystemService.exists.mockResolvedValue(true);

        await expect(service.loadFromFile("/path/to/config.txt"))
          .rejects.toThrow();
      });
    });
  });

  describe("findAndLoadConfig", () => {
    it("should search for config files in directory", async () => {
      mockFileSystemService.exists.mockImplementation(async (path: string) => {
        return path.endsWith("scaffold.config.json");
      });
      // Use valid schema values - ScaffoldConfigFileSchema expects specific enum values
      mockFileSystemService.readJson.mockResolvedValue({ 
        defaultTemplate: "fullstack",
      });

      const config = await service.findAndLoadConfig("/project");

      expect(config).not.toBeNull();
      expect(mockFileSystemService.exists).toHaveBeenCalled();
    });

    it("should return null if no config file found", async () => {
      mockFileSystemService.exists.mockResolvedValue(false);

      const config = await service.findAndLoadConfig("/project");

      expect(config).toBeNull();
    });

    it("should search parent directories", async () => {
      let callCount = 0;
      mockFileSystemService.exists.mockImplementation(async (path: string) => {
        callCount++;
        // Simulate finding config in parent directory
        return path.includes("/project/") && path.endsWith(".scaffoldrc");
      });
      mockFileSystemService.readJson.mockResolvedValue({ 
        defaultTemplate: "minimal",
      });

      const config = await service.findAndLoadConfig("/project/child/grandchild");

      // Should have searched multiple directories
      expect(mockFileSystemService.exists.mock.calls.length).toBeGreaterThan(1);
    });

    it("should use first found config file in priority order", async () => {
      mockFileSystemService.exists.mockImplementation(async (path: string) => {
        // Both .scaffoldrc and scaffold.config.json exist
        return path.endsWith(".scaffoldrc") || path.endsWith("scaffold.config.json");
      });
      // Use valid schema values - ScaffoldConfigFileSchema expects specific enum values
      mockFileSystemService.readJson.mockResolvedValue({ 
        defaultTemplate: "minimal",
      });

      const config = await service.findAndLoadConfig("/project");

      // Should use the first one in priority order (.scaffoldrc comes first)
      expect(config).not.toBeNull();
    });
  });

  describe("mergeConfigs", () => {
    it("should merge two config objects", () => {
      const base: Partial<ProjectConfigInput> = {
        name: "base-project",
        description: "Base description",
        plugins: ["plugin-a"],
      };

      const override: Partial<ProjectConfigInput> = {
        name: "override-project",
        plugins: ["plugin-b", "plugin-c"],
      };

      const merged = service.mergeConfigs(base, override);

      expect(merged.name).toBe("override-project");
      expect(merged.description).toBe("Base description"); // From base
      expect(merged.plugins).toEqual(["plugin-b", "plugin-c"]); // Arrays replaced
    });

    it("should deep merge nested objects", () => {
      const base: Partial<ProjectConfigInput> = {
        name: "test",
        ports: {
          api: 3001,
          web: 3000,
        },
      };

      const override: Partial<ProjectConfigInput> = {
        ports: {
          api: 4001,
          db: 5432,
        },
      };

      const merged = service.mergeConfigs(base, override);

      expect((merged.ports as any).api).toBe(4001); // Overridden
      expect((merged.ports as any).web).toBe(3000); // From base
      expect((merged.ports as any).db).toBe(5432); // Added
    });

    it("should handle undefined values", () => {
      const base: Partial<ProjectConfigInput> = {
        name: "base",
        description: "Base desc",
      };

      const override: Partial<ProjectConfigInput> = {
        description: undefined,
        template: "minimal",
      };

      const merged = service.mergeConfigs(base, override);

      expect(merged.name).toBe("base");
      expect(merged.description).toBe("Base desc"); // undefined doesn't override
      expect(merged.template).toBe("minimal");
    });

    it("should merge arrays by replacement", () => {
      const base = { plugins: ["a", "b", "c"] } as Partial<ProjectConfigInput>;
      const override = { plugins: ["x", "y"] } as Partial<ProjectConfigInput>;

      const merged = service.mergeConfigs(base, override);

      expect(merged.plugins).toEqual(["x", "y"]); // Replaced, not concatenated
    });

    it("should handle multiple configs", () => {
      const config1: Partial<ProjectConfigInput> = { name: "first" };
      const config2: Partial<ProjectConfigInput> = { description: "second" };
      const config3: Partial<ProjectConfigInput> = { template: "minimal" };

      const merged = service.mergeConfigs(config1, config2, config3);

      expect(merged.name).toBe("first");
      expect(merged.description).toBe("second");
      expect(merged.template).toBe("minimal");
    });

    it("should skip undefined configs", () => {
      const config1: Partial<ProjectConfigInput> = { name: "test" };

      const merged = service.mergeConfigs(config1, undefined, undefined);

      expect(merged.name).toBe("test");
    });
  });

  describe("applyDefaults", () => {
    it("should apply scaffold config defaults", () => {
      const config: Partial<ProjectConfigInput> = {
        name: "my-project",
      };

      const scaffoldConfig = {
        telemetry: false,
        analytics: false,
        defaultTemplate: "fullstack" as const,
        defaultPackageManager: "npm" as const,
        defaultPlugins: ["plugin-a"],
      };

      const result = service.applyDefaults(config, scaffoldConfig);

      expect(result.name).toBe("my-project"); // Not overwritten
      expect(result.template).toBe("fullstack"); // Applied from defaults
      expect(result.packageManager).toBe("npm");
      expect(result.plugins).toEqual(["plugin-a"]);
    });

    it("should not override existing values", () => {
      const config: Partial<ProjectConfigInput> = {
        name: "my-project",
        template: "minimal",
        packageManager: "bun",
      };

      const scaffoldConfig = {
        telemetry: false,
        analytics: false,
        defaultTemplate: "fullstack" as const,
        defaultPackageManager: "npm" as const,
      };

      const result = service.applyDefaults(config, scaffoldConfig);

      expect(result.name).toBe("my-project");
      expect(result.template).toBe("minimal"); // Not overwritten
      expect(result.packageManager).toBe("bun"); // Not overwritten
    });

    it("should handle null scaffold config", () => {
      const config: Partial<ProjectConfigInput> = {
        name: "my-project",
      };

      const result = service.applyDefaults(config, null);

      expect(result).toEqual(config);
    });
  });

  describe("resolveConfig", () => {
    it("should resolve config with validator", async () => {
      const input: Partial<ProjectConfigInput> = {
        name: "test-project",
        template: "fullstack",
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "fullstack",
        packageManager: "bun",
        plugins: [],
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.name).toBe("test-project");
      expect(mockValidatorService.validate).toHaveBeenCalledWith(input);
    });

    it("should apply default ports", async () => {
      const input: Partial<ProjectConfigInput> = {
        name: "test-project",
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.ports.api).toBe(3001);
      expect(resolved.ports.web).toBe(3000);
      expect(resolved.ports.db).toBe(5432);
      expect(resolved.ports.redis).toBe(6379);
    });

    it("should apply default docker config", async () => {
      const input: Partial<ProjectConfigInput> = {
        name: "test-project",
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.docker.enabled).toBe(true);
      expect(resolved.docker.composeVersion).toBe("3.8");
    });

    it("should apply default git config", async () => {
      const input: Partial<ProjectConfigInput> = {
        name: "test-project",
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.git.init).toBe(true);
      expect(resolved.git.defaultBranch).toBe("main");
      expect(resolved.git.gitignore).toBe(true);
    });

    it("should use custom port values when provided", async () => {
      const input: Partial<ProjectConfigInput> = {
        name: "test-project",
        ports: {
          api: 4001,
          web: 4000,
        },
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        ports: {
          api: 4001,
          web: 4000,
        },
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.ports.api).toBe(4001);
      expect(resolved.ports.web).toBe(4000);
    });

    it("should set resolvedAt timestamp", async () => {
      const input: Partial<ProjectConfigInput> = {
        name: "test-project",
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
      });

      const before = new Date();
      const resolved = await service.resolveConfig(input);
      const after = new Date();

      expect(resolved.resolvedAt).toBeInstanceOf(Date);
      expect(resolved.resolvedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(resolved.resolvedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("parseYaml (private method via loadFromFile)", () => {
    it("should parse quoted string values", async () => {
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readFile.mockResolvedValue(`
name: "quoted-value"
other: 'single-quoted'
`);

      const config = await service.loadFromFile("/config.yaml") as Record<string, unknown>;

      expect(config.name).toBe("quoted-value");
      expect(config.other).toBe("single-quoted");
    });

    it("should parse null values", async () => {
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readFile.mockResolvedValue(`
value1: null
value2: ~
`);

      const config = await service.loadFromFile("/config.yaml") as Record<string, unknown>;

      expect(config.value1).toBeNull();
      expect(config.value2).toBeNull();
    });

    it("should parse inline arrays", async () => {
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readFile.mockResolvedValue(`
items: [a, b, c]
numbers: [1, 2, 3]
`);

      const config = await service.loadFromFile("/config.yaml") as Record<string, unknown>;

      expect(config.items).toEqual(["a", "b", "c"]);
      expect(config.numbers).toEqual([1, 2, 3]);
    });

    it("should ignore comments", async () => {
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readFile.mockResolvedValue(`
# This is a comment
name: test
# Another comment
`);

      const config = await service.loadFromFile("/config.yaml");

      expect(config.name).toBe("test");
      expect(Object.keys(config)).not.toContain("#");
    });

    it("should ignore empty lines", async () => {
      mockFileSystemService.exists.mockResolvedValue(true);
      mockFileSystemService.readFile.mockResolvedValue(`
name: test

description: value

`);

      const config = await service.loadFromFile("/config.yaml");

      expect(config.name).toBe("test");
      expect(config.description).toBe("value");
    });
  });

  describe("resolveConfig with apps", () => {
    it("should resolve empty apps array", async () => {
      const input = {
        name: "test-project",
        apps: [],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: [],
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.apps).toBeUndefined();
      expect(resolved.autoEnabledPlugins).toEqual([]);
    });

    it("should resolve a single app configuration", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "nestjs" as const,
            plugins: ["drizzle"],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: ["typescript"],
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.apps).toBeDefined();
      expect(resolved.apps).toHaveLength(1);
      expect(resolved.apps![0]!.name).toBe("api");
      expect(resolved.apps![0]!.type).toBe("nestjs");
      expect(resolved.apps![0]!.appType).toBeDefined();
      expect(resolved.apps![0]!.resolvedAt).toBeInstanceOf(Date);
    });

    it("should resolve multiple app configurations", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "nestjs" as const,
            plugins: [],
          },
          {
            name: "web",
            path: "apps/web",
            type: "nextjs" as const,
            plugins: [],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: [],
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.apps).toBeDefined();
      expect(resolved.apps).toHaveLength(2);
      expect(resolved.apps![0]!.name).toBe("api");
      expect(resolved.apps![0]!.type).toBe("nestjs");
      expect(resolved.apps![1]!.name).toBe("web");
      expect(resolved.apps![1]!.type).toBe("nextjs");
    });

    it("should compute auto-enabled plugins from app types", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "nestjs" as const,
            plugins: [],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: [],
      });

      const resolved = await service.resolveConfig(input);

      // NestJS has required plugins like 'nestjs' and 'typescript'
      expect(resolved.autoEnabledPlugins.length).toBeGreaterThan(0);
      // Check that auto-enabled plugins don't include explicit plugins
      const explicitPluginIds = Object.keys(resolved.plugins || {});
      expect(resolved.autoEnabledPlugins.every(p => 
        !explicitPluginIds.includes(p)
      )).toBe(true);
    });

    it("should not duplicate plugins in autoEnabledPlugins when already explicit", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "nestjs" as const,
            plugins: ["typescript"], // Explicitly included
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: ["typescript", "eslint"], // Explicit project-level plugins
      });

      const resolved = await service.resolveConfig(input);

      // 'typescript' should not be in autoEnabledPlugins since it's explicit
      expect(resolved.autoEnabledPlugins).not.toContain("typescript");
      expect(resolved.autoEnabledPlugins).not.toContain("eslint");
    });

    it("should include appType metadata in resolved app configs", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "web",
            path: "apps/web",
            type: "nextjs" as const,
            plugins: [],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: [],
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.apps![0]!.appType).toBeDefined();
      expect(resolved.apps![0]!.appType.id).toBe("nextjs");
      expect(resolved.apps![0]!.appType.name).toBeDefined();
      expect(resolved.apps![0]!.appType.capabilities).toBeDefined();
    });

    it("should include resolved plugin order in resolved app configs", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "nestjs" as const,
            plugins: ["drizzle", "better-auth"],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: [],
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.apps![0]!.resolvedPluginOrder).toBeDefined();
      expect(resolved.apps![0]!.resolvedPluginOrder!.length).toBeGreaterThan(0);
      // Should include requested plugins
      expect(resolved.apps![0]!.resolvedPluginOrder).toContain("drizzle");
      expect(resolved.apps![0]!.resolvedPluginOrder).toContain("better-auth");
    });

    it("should throw ConfigValidationError for invalid app type", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "invalid-type" as any,
            plugins: [],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: [],
      });

      await expect(service.resolveConfig(input)).rejects.toThrow();
    });

    it("should throw ConfigValidationError for invalid app name format", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "Invalid-Name", // Should be lowercase
            path: "apps/api",
            type: "nestjs" as const,
            plugins: [],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: [],
      });

      await expect(service.resolveConfig(input)).rejects.toThrow();
    });

    it("should merge all plugins into resolvedPluginOrder", async () => {
      const input = {
        name: "test-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "nestjs" as const,
            plugins: ["drizzle"],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "test-project",
        template: "full",
        plugins: ["typescript", "eslint"],
      });

      const resolved = await service.resolveConfig(input);

      // resolvedPluginOrder should include both explicit and auto-enabled
      expect(resolved.resolvedPluginOrder).toContain("typescript");
      expect(resolved.resolvedPluginOrder).toContain("eslint");
      // Should also include auto-enabled from apps
      for (const plugin of resolved.autoEnabledPlugins) {
        expect(resolved.resolvedPluginOrder).toContain(plugin);
      }
    });

    it("should handle apps with different types correctly", async () => {
      const input = {
        name: "fullstack-project",
        apps: [
          {
            name: "api",
            path: "apps/api",
            type: "nestjs" as const,
            plugins: [],
          },
          {
            name: "web",
            path: "apps/web",
            type: "nextjs" as const,
            plugins: [],
          },
          {
            name: "docs",
            path: "apps/docs",
            type: "fumadocs" as const,
            plugins: [],
          },
        ],
      };

      mockValidatorService.validate.mockReturnValue({
        name: "fullstack-project",
        template: "full",
        plugins: [],
      });

      const resolved = await service.resolveConfig(input);

      expect(resolved.apps).toHaveLength(3);
      
      // Each app should have correct type
      expect(resolved.apps![0]!.type).toBe("nestjs");
      expect(resolved.apps![1]!.type).toBe("nextjs");
      expect(resolved.apps![2]!.type).toBe("fumadocs");
      
      // Each app should have its own appType metadata
      expect(resolved.apps![0]!.appType.id).toBe("nestjs");
      expect(resolved.apps![1]!.appType.id).toBe("nextjs");
      expect(resolved.apps![2]!.appType.id).toBe("fumadocs");
    });
  });
});
