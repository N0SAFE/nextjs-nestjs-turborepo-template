/**
 * Env Validation Generator Tests
 *
 * Tests for the environment validation generator implementation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EnvValidationGenerator } from "../generators/core/env-validation.generator";
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
    plugins: { "env-validation": true, typescript: true, nextjs: true, nestjs: true },
    pluginIds: ["env-validation", "typescript", "nextjs", "nestjs"],
    pluginConfigs: {},
    ports: { api: 3001, web: 3000 },
    docker: { enabled: true },
    git: { init: true },
    ci: { enabled: true, provider: "github-actions" },
    metadata: {},
    resolvedPluginOrder: ["env-validation", "typescript", "nextjs", "nestjs"],
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
    enabledPlugins: ["env-validation", "typescript", "nextjs", "nestjs"],
    dryRun: false,
    skipPrompts: true,
    verbose: false,
    ...overrides,
  };
}

describe("EnvValidationGenerator", () => {
  let generator: EnvValidationGenerator;
  let context: GeneratorContext;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new EnvValidationGenerator(mockFs as any, mockTemplate as any);
    context = createTestContext();
  });

  describe("metadata", () => {
    it("should have correct pluginId", () => {
      const metadata = generator.getMetadata();
      expect(metadata.pluginId).toBe("env-validation");
    });

    it("should have priority 5 (runs early but after typescript)", () => {
      const metadata = generator.getMetadata();
      expect(metadata.priority).toBe(5);
    });

    it("should have version", () => {
      const metadata = generator.getMetadata();
      expect(metadata.version).toBeDefined();
    });

    it("should have description", () => {
      const metadata = generator.getMetadata();
      expect(metadata.description).toBeDefined();
    });
  });

  describe("generate()", () => {
    it("should return success true", async () => {
      const result = await generator.generate(context);
      expect(result.success).toBe(true);
    });

    it("should return correct pluginId", async () => {
      const result = await generator.generate(context);
      expect(result.pluginId).toBe("env-validation");
    });

    it("should generate env.ts files", async () => {
      const result = await generator.generate(context);
      
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths.some((p) => p.includes("env.ts"))).toBe(true);
    });

    it("should generate .env.example files", async () => {
      const result = await generator.generate(context);
      
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths.some((p) => p.includes(".env.example"))).toBe(true);
    });
  });

  describe("dependencies", () => {
    it("should add @t3-oss/env-nextjs for web with nextjs plugin", async () => {
      const nextjsContext = createTestContext({
        enabledPlugins: ["env-validation", "nextjs"],
      });
      
      const result = await generator.generate(nextjsContext);
      
      expect(result.dependencies).toBeDefined();
      const t3EnvNextjs = result.dependencies?.find(
        (d) => d.name === "@t3-oss/env-nextjs"
      );
      expect(t3EnvNextjs).toBeDefined();
    });

    it("should add @t3-oss/env-core for api with nestjs plugin", async () => {
      const nestjsContext = createTestContext({
        enabledPlugins: ["env-validation", "nestjs"],
      });
      
      const result = await generator.generate(nestjsContext);
      
      expect(result.dependencies).toBeDefined();
      const t3EnvCore = result.dependencies?.find(
        (d) => d.name === "@t3-oss/env-core"
      );
      expect(t3EnvCore).toBeDefined();
    });
  });

  describe("conditional generation", () => {
    it("should include database env vars when drizzle plugin enabled", async () => {
      const drizzleContext = createTestContext({
        enabledPlugins: ["env-validation", "drizzle"],
      });
      
      const result = await generator.generate(drizzleContext);
      
      // Check if any file contains DATABASE_URL reference
      const hasDbEnv = result.files.some(
        (f) => f.content?.includes("DATABASE") || f.content?.includes("database")
      );
      expect(hasDbEnv).toBe(true);
    });

    it("should include redis env vars when redis plugin enabled", async () => {
      const redisContext = createTestContext({
        enabledPlugins: ["env-validation", "redis"],
      });
      
      const result = await generator.generate(redisContext);
      
      // Check if any file contains REDIS reference
      const hasRedisEnv = result.files.some(
        (f) => f.content?.includes("REDIS") || f.content?.includes("redis")
      );
      expect(hasRedisEnv).toBe(true);
    });

    it("should generate env files when better-auth plugin enabled", async () => {
      const authContext = createTestContext({
        enabledPlugins: ["env-validation", "better-auth"],
      });
      
      const result = await generator.generate(authContext);
      
      // Should generate env files for auth configuration
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });
  });

  describe("file structure", () => {
    it("should generate files for web app when nextjs enabled", async () => {
      const nextjsContext = createTestContext({
        enabledPlugins: ["env-validation", "nextjs"],
      });
      
      const result = await generator.generate(nextjsContext);
      
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths.some((p) => p.includes("apps/web"))).toBe(true);
    });

    it("should generate files for api when nestjs enabled", async () => {
      const nestjsContext = createTestContext({
        enabledPlugins: ["env-validation", "nestjs"],
      });
      
      const result = await generator.generate(nestjsContext);
      
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths.some((p) => p.includes("apps/api"))).toBe(true);
    });

    it("should generate shared types package env file", async () => {
      const result = await generator.generate(context);
      
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths.some((p) => p.includes("packages/types"))).toBe(true);
    });
  });

  describe("dry run mode", () => {
    it("should work in dry run mode", async () => {
      const dryRunContext = createTestContext({ dryRun: true });
      const result = await generator.generate(dryRunContext);
      
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("should throw GeneratorError on file write failures", async () => {
      const errorGenerator = new EnvValidationGenerator(
        { ...mockFs, writeFile: vi.fn().mockRejectedValue(new Error("Write failed")) } as any,
        mockTemplate as any
      );
      
      // Generator should throw a GeneratorError when file operations fail
      await expect(errorGenerator.generate(context)).rejects.toThrow();
    });
  });
});

describe("EnvValidationGenerator with minimal plugins", () => {
  let generator: EnvValidationGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new EnvValidationGenerator(mockFs as any, mockTemplate as any);
  });

  it("should generate basic env validation even with minimal plugins", async () => {
    const minimalContext = createTestContext({
      enabledPlugins: ["env-validation", "typescript"],
      projectConfig: createResolvedConfig({
        plugins: { "env-validation": true, typescript: true },
        pluginIds: ["env-validation", "typescript"],
      }),
    });
    
    const result = await generator.generate(minimalContext);
    expect(result.success).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);
  });

  it("should handle empty plugins gracefully", async () => {
    const emptyContext = createTestContext({
      enabledPlugins: ["env-validation"],
      projectConfig: createResolvedConfig({
        plugins: { "env-validation": true },
        pluginIds: ["env-validation"],
      }),
    });
    
    const result = await generator.generate(emptyContext);
    expect(result.success).toBe(true);
  });
});
