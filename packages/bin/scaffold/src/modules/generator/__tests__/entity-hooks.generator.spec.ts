/**
 * Entity Hooks Generator Tests
 *
 * Tests for the entity-hooks generator that auto-generates React Query hooks
 * from ORPC contracts following the project's core patterns.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EntityHooksGenerator } from "../generators/feature/entity-hooks.generator";
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
    description: "Test project for entity hooks generator",
    author: "Test Author",
    authorEmail: "test@example.com",
    license: "MIT",
    packageManager: "bun",
    plugins: { "bun-runtime": true, turborepo: true, typescript: true, nextjs: true, "react-query": true, orpc: true },
    pluginIds: ["bun-runtime", "turborepo", "typescript", "nextjs", "react-query", "orpc"],
    pluginConfigs: {},
    ports: { api: 3001, web: 3000 },
    docker: { enabled: true },
    git: { init: true },
    ci: { enabled: true, provider: "github-actions" },
    metadata: {},
    resolvedPluginOrder: ["bun-runtime", "typescript", "nextjs", "react-query", "orpc"],
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

describe("EntityHooksGenerator", () => {
  let generator: EntityHooksGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new EntityHooksGenerator(mockFs as any, mockTemplate as any);
  });

  describe("metadata", () => {
    it("should have correct plugin ID", () => {
      expect(generator.getMetadata().pluginId).toBe("entity-hooks");
    });

    it("should have version 1.0.0", () => {
      expect(generator.getMetadata().version).toBe("1.0.0");
    });

    it("should depend on nextjs, react-query, and orpc", () => {
      const deps = generator.getMetadata().dependsOn;
      expect(deps).toContain("nextjs");
      expect(deps).toContain("react-query");
      expect(deps).toContain("orpc");
    });

    it("should have priority 30", () => {
      expect(generator.getMetadata().priority).toBe(30);
    });

    it("should contribute to hooks files", () => {
      const metadata = generator.getMetadata();
      expect(metadata.contributesTo).toContain("hooks/*.ts");
    });
  });

  describe("generate()", () => {
    it("should generate hook files when all dependencies present", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files!.length).toBeGreaterThan(0);
    });

    it("should return empty files when dependencies missing", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"], // Missing react-query and orpc
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files).toEqual([]);
    });

    it("should generate core hook utilities", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      // Core hook utilities
      expect(filePaths).toContain("apps/web/src/lib/hooks/generator.ts");
      expect(filePaths).toContain("apps/web/src/lib/hooks/types.ts");
      expect(filePaths).toContain("apps/web/src/lib/hooks/factory.ts");
      expect(filePaths).toContain("apps/web/src/lib/hooks/cache.ts");
      expect(filePaths).toContain("apps/web/src/lib/hooks/index.ts");
    });

    it("should generate example user hooks", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      expect(filePaths).toContain("apps/web/src/hooks/useUsers.ts");
    });

    it("should generate 7 files total", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);

      // generator.ts, types.ts, factory.ts, cache.ts, index.ts, useUsers.ts, README.md
      expect(result.files!.length).toBe(7);
    });
  });

  describe("file structure", () => {
    it("should use replace merge strategy for all files", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);

      result.files!.forEach((file: FileSpec) => {
        expect(file.mergeStrategy).toBe("replace");
      });
    });

    it("should have correct priority for all files", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);

      result.files!.forEach((file: FileSpec) => {
        expect(file.priority).toBe(30);
      });
    });

    it("should mark example hooks as skipIfExists", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const exampleFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/hooks/useUsers.ts"
      );

      expect(exampleFile?.skipIfExists).toBe(true);
    });
  });

  describe("dependencies", () => {
    it("should return no additional dependencies", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);

      expect(result.dependencies).toEqual([]);
    });
  });

  describe("dry run mode", () => {
    it("should work correctly in dry run mode", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
        dryRun: true,
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files!.length).toBe(7);
    });
  });

  describe("file content validation", () => {
    it("should generate valid hook types", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const typesFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/hooks/types.ts"
      );

      expect(typesFile?.content).toBeDefined();
    });

    it("should generate valid hook factory", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const factoryFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/hooks/factory.ts"
      );

      expect(factoryFile?.content).toBeDefined();
    });

    it("should generate valid cache utilities", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const cacheFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/hooks/cache.ts"
      );

      expect(cacheFile?.content).toBeDefined();
      expect(cacheFile?.content).toContain("invalidate");
    });

    it("should generate valid barrel export", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const indexFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/hooks/index.ts"
      );

      expect(indexFile?.content).toContain("export");
    });

    it("should generate example user hooks with correct patterns", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const userHooksFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/hooks/useUsers.ts"
      );

      expect(userHooksFile?.content).toBeDefined();
      expect(userHooksFile?.content).toContain("useQuery");
    });

    it("should generate hook generator with ORPC integration", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      const generatorFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/hooks/generator.ts"
      );

      expect(generatorFile?.content).toBeDefined();
    });
  });

  describe("missing individual dependencies", () => {
    it("should return empty when only nextjs is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      expect(result.files).toEqual([]);
    });

    it("should return empty when only react-query is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["react-query", "typescript"],
      });

      const result = await generator.generate(context);
      expect(result.files).toEqual([]);
    });

    it("should return empty when only orpc is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["orpc", "typescript"],
      });

      const result = await generator.generate(context);
      expect(result.files).toEqual([]);
    });

    it("should return empty when nextjs and react-query but no orpc", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "react-query", "typescript"],
      });

      const result = await generator.generate(context);
      expect(result.files).toEqual([]);
    });

    it("should return empty when nextjs and orpc but no react-query", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      expect(result.files).toEqual([]);
    });

    it("should return empty when react-query and orpc but no nextjs", async () => {
      const context = createTestContext({
        enabledPlugins: ["react-query", "orpc", "typescript"],
      });

      const result = await generator.generate(context);
      expect(result.files).toEqual([]);
    });
  });
});
