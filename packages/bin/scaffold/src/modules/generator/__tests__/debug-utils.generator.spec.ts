/**
 * Debug Utils Generator Tests
 *
 * Tests for the debug-utils generator that creates scoped debug logging
 * utilities with zero production overhead.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DebugUtilsGenerator } from "../generators/feature/debug-utils.generator";
import type { GeneratorContext, FileSpec } from "../../../types/generator.types";
import type { ResolvedProjectConfig } from "../../../types/config.types";

// Mock services
const mockFs = {
  join: vi.fn((...args: string[]) => args.join("/")),
  dirname: vi.fn((p: string) => p.split("/").slice(0, -1).join("/")),
  exists: vi.fn().mockResolvedValue(false),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
};

const mockTemplate = {
  render: vi.fn((content: string) => content),
};

/**
 * Creates a resolved config for testing
 */
function createResolvedConfig(
  overrides: Partial<ResolvedProjectConfig> = {},
): ResolvedProjectConfig {
  return {
    name: "test-project",
    description: "Test project for debug utils generator",
    author: "Test Author",
    authorEmail: "test@example.com",
    license: "MIT",
    packageManager: "bun",
    plugins: { "bun-runtime": true, turborepo: true, typescript: true },
    pluginIds: ["bun-runtime", "turborepo", "typescript"],
    pluginConfigs: {},
    ports: { api: 3001, web: 3000 },
    docker: { enabled: true },
    git: { init: true },
    ci: { enabled: true, provider: "github-actions" },
    metadata: {},
    resolvedPluginOrder: ["bun-runtime", "typescript"],
    autoEnabledPlugins: [],
    resolvedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a generator context for testing
 */
function createTestContext(
  overrides: Partial<GeneratorContext> = {},
): GeneratorContext {
  const config = overrides.projectConfig || createResolvedConfig();
  const enabledPlugins = overrides.enabledPlugins || config.pluginIds;
  return {
    projectConfig: config,
    outputPath: "/test/output",
    dryRun: false,
    verbose: false,
    skipPrompts: true,
    enabledPlugins,
    ...overrides,
  };
}

describe("DebugUtilsGenerator", () => {
  let generator: DebugUtilsGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new DebugUtilsGenerator(mockFs as any, mockTemplate as any);
  });

  describe("metadata", () => {
    it("should have correct plugin ID", () => {
      expect(generator.getMetadata().pluginId).toBe("debug-utils");
    });

    it("should have version 1.0.0", () => {
      expect(generator.getMetadata().version).toBe("1.0.0");
    });

    it("should have no dependencies", () => {
      expect(generator.getMetadata().dependsOn).toEqual([]);
    });

    it("should have priority 15", () => {
      expect(generator.getMetadata().priority).toBe(15);
    });

    it("should contribute to debug lib", () => {
      const metadata = generator.getMetadata();
      expect(metadata.contributesTo).toContain("lib/debug.ts");
    });
  });

  describe("generate()", () => {
    it("should always generate core debug utilities", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files!.length).toBeGreaterThan(0);
    });

    it("should generate core debug package files", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      // Core debug package
      expect(filePaths).toContain("packages/utils/debug/index.ts");
      expect(filePaths).toContain("packages/utils/debug/config.ts");
      expect(filePaths).toContain("packages/utils/debug/types.ts");
      expect(filePaths).toContain("packages/utils/debug/factory.ts");
      expect(filePaths).toContain("packages/utils/debug/package.json");
    });
  });

  describe("conditional generation based on plugins", () => {
    it("should generate Next.js debug utilities when nextjs is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      expect(filePaths).toContain("apps/web/src/lib/debug.ts");
    });

    it("should NOT generate Next.js debug utilities when nextjs is absent", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      expect(filePaths).not.toContain("apps/web/src/lib/debug.ts");
    });

    it("should generate NestJS debug utilities when nestjs is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nestjs"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      expect(filePaths).toContain("apps/api/src/common/debug/index.ts");
    });

    it("should NOT generate NestJS debug utilities when nestjs is absent", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      expect(filePaths).not.toContain("apps/api/src/common/debug/index.ts");
    });

    it("should generate both when both frameworks are present", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs", "nestjs"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      // Core files
      expect(filePaths).toContain("packages/utils/debug/index.ts");
      // Framework-specific files
      expect(filePaths).toContain("apps/web/src/lib/debug.ts");
      expect(filePaths).toContain("apps/api/src/common/debug/index.ts");
    });
  });

  describe("file count verification", () => {
    it("should generate 6 files when no frameworks present", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      expect(result.files!.length).toBe(6); // Core debug package only (index, config, types, factory, package.json, example)
    });

    it("should generate 7 files when nextjs is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs"],
      });

      const result = await generator.generate(context);
      expect(result.files!.length).toBe(7); // Core (6) + Next.js debug (1)
    });

    it("should generate 8 files when nestjs is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nestjs"],
      });

      const result = await generator.generate(context);
      expect(result.files!.length).toBe(8); // Core (6) + NestJS (2: index + decorator)
    });

    it("should generate 9 files when both frameworks present", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs", "nestjs"],
      });

      const result = await generator.generate(context);
      expect(result.files!.length).toBe(9); // Core (6) + Next.js (1) + NestJS (2)
    });
  });

  describe("file structure", () => {
    it("should use replace merge strategy for all files", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs", "nestjs"],
      });

      const result = await generator.generate(context);

      result.files!.forEach((file: FileSpec) => {
        expect(file.mergeStrategy).toBe("replace");
      });
    });

    it("should have correct priority for all files", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs", "nestjs"],
      });

      const result = await generator.generate(context);

      result.files!.forEach((file: FileSpec) => {
        expect(file.priority).toBe(15);
      });
    });
  });

  describe("dependencies", () => {
    it("should return no additional dependencies", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs"],
      });

      const result = await generator.generate(context);

      expect(result.dependencies).toEqual([]);
    });
  });

  describe("dry run mode", () => {
    it("should work correctly in dry run mode", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs", "nestjs"],
        dryRun: true,
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files!.length).toBe(9); // Core (6) + Next.js (1) + NestJS (2)
    });
  });

  describe("file content validation", () => {
    it("should generate valid debug types", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      const typesFile = result.files!.find(
        (f: FileSpec) => f.path === "packages/utils/debug/types.ts"
      );

      expect(typesFile?.content).toBeDefined();
    });

    it("should generate valid debug factory", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      const factoryFile = result.files!.find(
        (f: FileSpec) => f.path === "packages/utils/debug/factory.ts"
      );

      expect(factoryFile?.content).toBeDefined();
      expect(factoryFile?.content).toContain("createDebug");
    });

    it("should generate valid debug config", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      const configFile = result.files!.find(
        (f: FileSpec) => f.path === "packages/utils/debug/config.ts"
      );

      expect(configFile?.content).toBeDefined();
    });

    it("should generate valid package.json", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript"],
      });

      const result = await generator.generate(context);
      const packageFile = result.files!.find(
        (f: FileSpec) => f.path === "packages/utils/debug/package.json"
      );

      expect(packageFile?.content).toBeDefined();
      const parsed = JSON.parse(packageFile!.content as string);
      expect(parsed.name).toBeDefined();
    });

    it("should generate Next.js scoped debug with proper namespace", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nextjs"],
      });

      const result = await generator.generate(context);
      const nextjsFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/debug.ts"
      );

      expect(nextjsFile?.content).toBeDefined();
    });

    it("should generate NestJS scoped debug with proper namespace", async () => {
      const context = createTestContext({
        enabledPlugins: ["typescript", "nestjs"],
      });

      const result = await generator.generate(context);
      const nestjsFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/api/src/common/debug/index.ts"
      );

      expect(nestjsFile?.content).toBeDefined();
    });
  });
});
