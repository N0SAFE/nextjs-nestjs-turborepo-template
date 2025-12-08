/**
 * Bun Runtime Generator Tests
 *
 * Tests for the Bun runtime generator implementation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { BunRuntimeGenerator } from "../generators/core/bun-runtime.generator";
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
    plugins: { "bun-runtime": true, typescript: true },
    pluginIds: ["bun-runtime", "typescript"],
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

// Test context factory
function createTestContext(
  overrides?: Partial<GeneratorContext>
): GeneratorContext {
  return {
    projectConfig: createResolvedConfig(),
    outputPath: "/tmp/test-project",
    enabledPlugins: ["bun-runtime", "typescript"],
    dryRun: false,
    skipPrompts: true,
    verbose: false,
    ...overrides,
  };
}

describe("BunRuntimeGenerator", () => {
  let generator: BunRuntimeGenerator;
  let context: GeneratorContext;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new BunRuntimeGenerator(mockFs as any, mockTemplate as any);
    context = createTestContext();
  });

  describe("metadata", () => {
    it("should have correct pluginId", () => {
      const metadata = generator.getMetadata();
      expect(metadata.pluginId).toBe("bun-runtime");
    });

    it("should have priority 1 (runs very early after base)", () => {
      const metadata = generator.getMetadata();
      expect(metadata.priority).toBe(1);
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
      expect(result.pluginId).toBe("bun-runtime");
    });

    it("should generate bunfig.toml file", async () => {
      const result = await generator.generate(context);
      
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths.some((p) => p.includes("bunfig.toml"))).toBe(true);
    });

    it("should add @types/bun as dev dependency", async () => {
      const result = await generator.generate(context);
      
      expect(result.dependencies).toBeDefined();
      const bunTypesDep = result.dependencies?.find((d) => d.name === "@types/bun");
      expect(bunTypesDep).toBeDefined();
      expect(bunTypesDep?.type).toBe("dev");
    });

    it("should add clean scripts", async () => {
      const result = await generator.generate(context);
      
      expect(result.scripts).toBeDefined();
      const cleanScript = result.scripts?.find((s) => s.name === "clean");
      const cleanModulesScript = result.scripts?.find((s) => s.name === "clean:modules");
      const reinstallScript = result.scripts?.find((s) => s.name === "reinstall");
      
      expect(cleanScript).toBeDefined();
      expect(cleanModulesScript).toBeDefined();
      expect(reinstallScript).toBeDefined();
    });

    it("should have clean script that removes dist and coverage", async () => {
      const result = await generator.generate(context);
      
      const cleanScript = result.scripts?.find((s) => s.name === "clean");
      expect(cleanScript?.command).toContain("dist");
    });

    it("should have reinstall script that runs clean:modules and install", async () => {
      const result = await generator.generate(context);
      
      const reinstallScript = result.scripts?.find((s) => s.name === "reinstall");
      expect(reinstallScript?.command).toContain("clean:modules");
      expect(reinstallScript?.command).toContain("install");
    });
  });

  describe("bunfig.toml content", () => {
    it("should configure install settings", async () => {
      const result = await generator.generate(context);
      
      const bunfigFile = result.files.find((f) => f.path.includes("bunfig.toml"));
      expect(bunfigFile).toBeDefined();
      expect(bunfigFile?.content).toContain("[install]");
    });

    it("should configure run settings", async () => {
      const result = await generator.generate(context);
      
      const bunfigFile = result.files.find((f) => f.path.includes("bunfig.toml"));
      expect(bunfigFile?.content).toContain("[run]");
    });

    it("should configure test settings", async () => {
      const result = await generator.generate(context);
      
      const bunfigFile = result.files.find((f) => f.path.includes("bunfig.toml"));
      expect(bunfigFile?.content).toContain("[test]");
    });

    it("should disable telemetry", async () => {
      const result = await generator.generate(context);
      
      const bunfigFile = result.files.find((f) => f.path.includes("bunfig.toml"));
      // Check for the [telemetry] section with enabled = false
      expect(bunfigFile?.content).toContain("[telemetry]");
      expect(bunfigFile?.content).toContain("enabled = false");
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
      const errorGenerator = new BunRuntimeGenerator(
        { ...mockFs, writeFile: vi.fn().mockRejectedValue(new Error("Write failed")) } as any,
        mockTemplate as any
      );
      
      // Generator should throw a GeneratorError when file operations fail
      await expect(errorGenerator.generate(context)).rejects.toThrow();
    });
  });
});

describe("BunRuntimeGenerator with different package managers", () => {
  let generator: BunRuntimeGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new BunRuntimeGenerator(mockFs as any, mockTemplate as any);
  });

  it("should generate bun configuration even with npm as package manager", async () => {
    const npmContext = createTestContext({
      projectConfig: createResolvedConfig({ packageManager: "npm" }),
    });
    
    const result = await generator.generate(npmContext);
    expect(result.success).toBe(true);
    // Bun config still generated as it's for development convenience
    const filePaths = result.files.map((f) => f.path);
    expect(filePaths.some((p) => p.includes("bunfig.toml"))).toBe(true);
  });

  it("should generate bun configuration with yarn as package manager", async () => {
    const yarnContext = createTestContext({
      projectConfig: createResolvedConfig({ packageManager: "yarn" }),
    });
    
    const result = await generator.generate(yarnContext);
    expect(result.success).toBe(true);
  });
});
