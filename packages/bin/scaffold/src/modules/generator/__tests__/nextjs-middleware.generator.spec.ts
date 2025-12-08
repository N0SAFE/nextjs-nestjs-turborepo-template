/**
 * NextJS Middleware Generator Tests
 *
 * Tests for the nextjs-middleware generator that creates a composable
 * middleware factory chain pattern for Next.js applications.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextjsMiddlewareGenerator } from "../generators/feature/nextjs-middleware.generator";
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
    description: "Test project for middleware generator",
    author: "Test Author",
    authorEmail: "test@example.com",
    license: "MIT",
    packageManager: "bun",
    plugins: { "bun-runtime": true, turborepo: true, typescript: true, nextjs: true },
    pluginIds: ["bun-runtime", "turborepo", "typescript", "nextjs"],
    pluginConfigs: {},
    ports: { api: 3001, web: 3000 },
    docker: { enabled: true },
    git: { init: true },
    ci: { enabled: true, provider: "github-actions" },
    metadata: {},
    resolvedPluginOrder: ["bun-runtime", "typescript", "nextjs"],
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

describe("NextjsMiddlewareGenerator", () => {
  let generator: NextjsMiddlewareGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new NextjsMiddlewareGenerator(mockFs as any, mockTemplate as any);
  });

  describe("metadata", () => {
    it("should have correct plugin ID", () => {
      expect(generator.getMetadata().pluginId).toBe("nextjs-middleware");
    });

    it("should have version 1.0.0", () => {
      expect(generator.getMetadata().version).toBe("1.0.0");
    });

    it("should depend on nextjs", () => {
      expect(generator.getMetadata().dependsOn).toContain("nextjs");
    });

    it("should have priority 22", () => {
      expect(generator.getMetadata().priority).toBe(22);
    });

    it("should contribute to middleware files", () => {
      const metadata = generator.getMetadata();
      expect(metadata.contributesTo).toContain("middleware.ts");
      expect(metadata.contributesTo).toContain("lib/middleware/");
    });
  });

  describe("generate()", () => {
    it("should generate middleware files when nextjs is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files!.length).toBeGreaterThan(0);
    });

    it("should return empty files when nextjs is not present", async () => {
      const context = createTestContext({
        enabledPlugins: ["nestjs", "typescript"],
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files).toEqual([]);
    });

    it("should generate core middleware files", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      // Core middleware files
      expect(filePaths).toContain("apps/web/src/lib/middleware/types.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/factory.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/utils.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/path-matcher.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/index.ts");
    });

    it("should generate built-in middleware utilities", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      // Built-in middlewares
      expect(filePaths).toContain("apps/web/src/lib/middleware/middlewares/auth-guard.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/middlewares/rate-limit.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/middlewares/cors.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/middlewares/logging.ts");
      expect(filePaths).toContain("apps/web/src/lib/middleware/middlewares/headers.ts");
    });

    it("should generate example middleware file", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const filePaths = result.files!.map((f: FileSpec) => f.path);

      expect(filePaths).toContain("apps/web/src/middleware.example.ts");
    });

    it("should generate 11 files total", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);

      expect(result.files!.length).toBe(11);
    });
  });

  describe("conditional generation based on plugins", () => {
    it("should adjust auth guard middleware when better-auth is present", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript", "better-auth"],
      });

      const result = await generator.generate(context);
      const authGuardFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/middleware/middlewares/auth-guard.ts"
      );

      expect(authGuardFile).toBeDefined();
      // With better-auth, the file should include better-auth integration
      expect(authGuardFile!.content).toBeDefined();
    });

    it("should generate basic auth guard when better-auth is not present", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const authGuardFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/middleware/middlewares/auth-guard.ts"
      );

      expect(authGuardFile).toBeDefined();
      expect(authGuardFile!.content).toBeDefined();
    });
  });

  describe("file structure", () => {
    it("should use replace merge strategy for all files", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);

      result.files!.forEach((file: FileSpec) => {
        expect(file.mergeStrategy).toBe("replace");
      });
    });

    it("should have correct priority for all files", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);

      result.files!.forEach((file: FileSpec) => {
        expect(file.priority).toBe(22);
      });
    });

    it("should mark example middleware as skipIfExists", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const exampleFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/middleware.example.ts"
      );

      expect(exampleFile?.skipIfExists).toBe(true);
    });
  });

  describe("dependencies", () => {
    it("should return no additional dependencies", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);

      expect(result.dependencies).toEqual([]);
    });
  });

  describe("dry run mode", () => {
    it("should work correctly in dry run mode", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
        dryRun: true,
      });

      const result = await generator.generate(context);

      expect(result.success).toBe(true);
      expect(result.files!.length).toBe(11);
    });
  });

  describe("file content validation", () => {
    it("should generate valid TypeScript in types file", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const typesFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/middleware/types.ts"
      );

      expect(typesFile?.content).toContain("MiddlewareContext");
      expect(typesFile?.content).toContain("MiddlewareFunction");
      expect(typesFile?.content).toContain("MiddlewareResult");
    });

    it("should generate valid factory pattern", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const factoryFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/middleware/factory.ts"
      );

      expect(factoryFile?.content).toContain("createMiddlewareChain");
      expect(factoryFile?.content).toContain("withConfig");
    });

    it("should generate path matcher utility", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const pathMatcherFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/middleware/path-matcher.ts"
      );

      expect(pathMatcherFile?.content).toContain("matchPath");
      expect(pathMatcherFile?.content).toContain("createPathMatcher");
    });

    it("should generate barrel export file", async () => {
      const context = createTestContext({
        enabledPlugins: ["nextjs", "typescript"],
      });

      const result = await generator.generate(context);
      const indexFile = result.files!.find(
        (f: FileSpec) => f.path === "apps/web/src/lib/middleware/index.ts"
      );

      expect(indexFile?.content).toContain("export");
      expect(indexFile?.content).toContain("from");
    });
  });
});
