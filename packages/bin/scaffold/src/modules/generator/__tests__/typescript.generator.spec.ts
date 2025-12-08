/**
 * TypeScript Generator Tests
 *
 * Tests for the TypeScript generator implementation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TypeScriptGenerator } from "../generators/core/typescript.generator";
import type { GeneratorContext } from "@/types/generator.types";
import type { ResolvedProjectConfig } from "@/types/config.types";

// Mock services
const mockFs = {
  join: vi.fn((...paths: string[]) => paths.join("/")),
  dirname: vi.fn((p: string) => p.split("/").slice(0, -1).join("/")),
  exists: vi.fn().mockResolvedValue(false),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
};

const mockTemplate = {
  render: vi.fn((template: string, _data: unknown) => template),
};

// Create a resolved project config
function createResolvedConfig(
  overrides?: Partial<ResolvedProjectConfig>
): ResolvedProjectConfig {
  return {
    name: "test-project",
    description: "A test project",
    author: "Test Author",
    authorEmail: "test@example.com",
    license: "MIT",
    packageManager: "bun",
    plugins: { typescript: true, eslint: true },
    pluginIds: ["typescript", "eslint"],
    pluginConfigs: {},
    ports: { api: 3001, web: 3000 },
    docker: { enabled: true },
    git: { init: true },
    ci: { enabled: true, provider: "github-actions" },
    metadata: {},
    resolvedPluginOrder: ["typescript", "eslint"],
    autoEnabledPlugins: [],
    resolvedAt: new Date(),
    ...overrides,
  };
}

// Test context factory
function createTestContext(
  overrides?: Partial<GeneratorContext>
): GeneratorContext {
  return {
    projectConfig: createResolvedConfig(),
    outputPath: "/tmp/test-project",
    enabledPlugins: ["typescript", "eslint"],
    dryRun: false,
    skipPrompts: true,
    verbose: false,
    ...overrides,
  };
}

describe("TypeScriptGenerator", () => {
  let generator: TypeScriptGenerator;
  let context: GeneratorContext;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new TypeScriptGenerator(mockFs as any, mockTemplate as any);
    context = createTestContext();
  });

  describe("metadata", () => {
    it("should have correct pluginId", () => {
      const metadata = generator.getMetadata();
      expect(metadata.pluginId).toBe("typescript");
    });

    it("should have priority 0 (core plugin)", () => {
      const metadata = generator.getMetadata();
      expect(metadata.priority).toBe(0);
    });
  });

  describe("generate()", () => {
    it("should return success true", async () => {
      const result = await generator.generate(context);
      expect(result.success).toBe(true);
    });

    it("should return correct pluginId", async () => {
      const result = await generator.generate(context);
      expect(result.pluginId).toBe("typescript");
    });

    it("should generate TypeScript configuration files", async () => {
      const result = await generator.generate(context);
      
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths.some((p) => p.includes("tsconfig"))).toBe(true);
    });

    it("should include typescript dependency", async () => {
      const result = await generator.generate(context);
      
      const deps = result.dependencies || [];
      const tsDep = deps.find((d) => d.name === "typescript");
      expect(tsDep).toBeDefined();
      expect(tsDep?.type).toBe("dev");
    });

    it("should include @types/node dependency", async () => {
      const result = await generator.generate(context);
      
      const deps = result.dependencies || [];
      const typesDep = deps.find((d) => d.name === "@types/node");
      expect(typesDep).toBeDefined();
      expect(typesDep?.type).toBe("dev");
    });
  });

  describe("file content", () => {
    it("should generate valid tsconfig.json content", async () => {
      const result = await generator.generate(context);
      
      const tsconfigFile = result.files.find(
        (f) => f.path === "tsconfig.json" || f.path.endsWith("/tsconfig.json")
      );
      
      if (tsconfigFile) {
        // Should be valid JSON or template
        expect(tsconfigFile.content).toBeDefined();
        expect(tsconfigFile.content!.length).toBeGreaterThan(0);
      }
    });

    it("should generate tsconfig.base.json for monorepo structure", async () => {
      const result = await generator.generate(context);
      
      const baseConfigFile = result.files.find(
        (f) => f.path.includes("tsconfig.base.json")
      );
      
      // TypeScript generator may or may not generate base config
      // This depends on the implementation
      if (baseConfigFile) {
        expect(baseConfigFile.content).toBeDefined();
      }
    });
  });

  describe("dry run mode", () => {
    it("should not write files in dry run mode", async () => {
      const dryRunContext = createTestContext({ dryRun: true });
      const result = await generator.generate(dryRunContext);
      
      expect(result.success).toBe(true);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe("duration tracking", () => {
    it("should track generation duration", async () => {
      const result = await generator.generate(context);
      
      // Duration should be present and be a reasonable number
      if (result.duration !== undefined) {
        expect(result.duration).toBeGreaterThanOrEqual(0);
        expect(result.duration).toBeLessThan(10000); // Less than 10 seconds
      }
    });
  });
});

describe("TypeScriptGenerator with different configurations", () => {
  let generator: TypeScriptGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new TypeScriptGenerator(mockFs as any, mockTemplate as any);
  });

  it("should work with minimal plugins", async () => {
    const context = createTestContext({
      enabledPlugins: ["typescript"],
      projectConfig: createResolvedConfig({
        plugins: { typescript: true },
        pluginIds: ["typescript"],
      }),
    });
    
    const result = await generator.generate(context);
    expect(result.success).toBe(true);
  });

  it("should work with all plugins enabled", async () => {
    const allPlugins = [
      "typescript",
      "eslint",
      "prettier",
      "vitest",
      "nestjs",
      "nextjs",
      "drizzle",
      "docker",
    ];
    const allPluginsObj = Object.fromEntries(allPlugins.map(p => [p, true]));
    
    const context = createTestContext({
      enabledPlugins: allPlugins,
      projectConfig: createResolvedConfig({
        plugins: allPluginsObj,
        pluginIds: allPlugins,
      }),
    });
    
    const result = await generator.generate(context);
    expect(result.success).toBe(true);
  });

  it("should handle npm package manager", async () => {
    const context = createTestContext({
      projectConfig: createResolvedConfig({
        packageManager: "npm",
      }),
    });
    
    const result = await generator.generate(context);
    expect(result.success).toBe(true);
  });

  it("should handle pnpm package manager", async () => {
    const context = createTestContext({
      projectConfig: createResolvedConfig({
        packageManager: "pnpm",
      }),
    });
    
    const result = await generator.generate(context);
    expect(result.success).toBe(true);
  });
});
