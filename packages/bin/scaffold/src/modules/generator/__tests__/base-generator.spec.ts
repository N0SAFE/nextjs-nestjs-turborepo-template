/**
 * Base Generator Tests
 *
 * Tests for the BaseGenerator class functionality.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { BaseGenerator } from "../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
  PostCommand,
  GeneratorMetadata,
} from "@/types/generator.types";
import type { ResolvedProjectConfig } from "@/types/config.types";

// Mock the file system and template services
const mockFs = {
  join: vi.fn((...paths: string[]) => paths.join("/")),
  dirname: vi.fn((p: string) => p.split("/").slice(0, -1).join("/")),
  exists: vi.fn().mockResolvedValue(false),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
};

const mockTemplate = {
  render: vi.fn((template: string, _data: unknown) => `rendered:${template}`),
};

// Concrete implementation for testing
class TestGenerator extends BaseGenerator {
  constructor() {
    super(mockFs as any, mockTemplate as any);
    this.metadata = {
      pluginId: "test-plugin",
      priority: 30,
      version: "1.0.0",
      description: "A test plugin for unit testing",
    };
  }

  protected override getFiles(_context: GeneratorContext): FileSpec[] {
    return [
      this.file("test.ts", 'export const test = "hello";'),
      this.file("config.json", JSON.stringify({ enabled: true })),
    ];
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      { name: "test-dep", version: "^1.0.0", type: "prod", pluginId: "test-plugin" },
      { name: "test-dev-dep", version: "^2.0.0", type: "dev", pluginId: "test-plugin" },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "test:run", command: "vitest run", target: "root", pluginId: "test-plugin" },
    ];
  }

  protected override getPostCommands(_context: GeneratorContext): PostCommand[] {
    return [
      {
        command: "echo",
        args: ["Hello from test"],
        description: "Test command",
      },
    ];
  }

  // Expose protected methods for testing
  public testHasPlugin(context: GeneratorContext, pluginId: string): boolean {
    return this.hasPlugin(context, pluginId);
  }

  public testFile(
    path: string,
    content: string,
    options?: Partial<FileSpec>
  ): FileSpec {
    return this.file(path, content, options);
  }
}

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
    plugins: { typescript: true, eslint: true, "test-plugin": true },
    pluginIds: ["typescript", "eslint", "test-plugin"],
    pluginConfigs: {},
    ports: { api: 3001, web: 3000 },
    docker: { enabled: true },
    git: { init: true },
    ci: { enabled: true, provider: "github-actions" },
    metadata: {},
    resolvedPluginOrder: ["typescript", "eslint", "test-plugin"],
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
    enabledPlugins: ["typescript", "eslint", "test-plugin"],
    dryRun: false,
    skipPrompts: true,
    verbose: false,
    ...overrides,
  };
}

describe("BaseGenerator", () => {
  let generator: TestGenerator;
  let context: GeneratorContext;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new TestGenerator();
    context = createTestContext();
  });

  describe("metadata", () => {
    it("should have correct metadata", () => {
      const metadata = generator.getMetadata();
      expect(metadata.pluginId).toBe("test-plugin");
      expect(metadata.priority).toBe(30);
      expect(metadata.version).toBe("1.0.0");
    });
  });

  describe("generate()", () => {
    it("should return files", async () => {
      const result = await generator.generate(context);
      expect(result.files).toHaveLength(2);
      expect(result.files[0]!.path).toBe("test.ts");
      expect(result.files[1]!.path).toBe("config.json");
    });

    it("should return dependencies", async () => {
      const result = await generator.generate(context);
      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies![0]!.name).toBe("test-dep");
      expect(result.dependencies![0]!.type).toBe("prod");
      expect(result.dependencies![1]!.name).toBe("test-dev-dep");
      expect(result.dependencies![1]!.type).toBe("dev");
    });

    it("should return scripts", async () => {
      const result = await generator.generate(context);
      expect(result.scripts).toHaveLength(1);
      expect(result.scripts![0]!.name).toBe("test:run");
      expect(result.scripts![0]!.command).toBe("vitest run");
    });

    it("should return post commands", async () => {
      const result = await generator.generate(context);
      expect(result.postCommands).toHaveLength(1);
      expect(result.postCommands![0]!.command).toBe("echo");
    });

    it("should return success true", async () => {
      const result = await generator.generate(context);
      expect(result.success).toBe(true);
    });

    it("should return pluginId", async () => {
      const result = await generator.generate(context);
      expect(result.pluginId).toBe("test-plugin");
    });
  });

  describe("hasPlugin()", () => {
    it("should return true for enabled plugins", () => {
      expect(generator.testHasPlugin(context, "typescript")).toBe(true);
      expect(generator.testHasPlugin(context, "eslint")).toBe(true);
    });

    it("should return false for disabled plugins", () => {
      expect(generator.testHasPlugin(context, "prettier")).toBe(false);
      expect(generator.testHasPlugin(context, "nonexistent")).toBe(false);
    });
  });

  describe("file() helper", () => {
    it("should create FileSpec with default options", () => {
      const file = generator.testFile("src/index.ts", "export {}");
      expect(file.path).toBe("src/index.ts");
      expect(file.content).toBe("export {}");
      expect(file.operation).toBe("create");
    });

    it("should merge custom options", () => {
      const file = generator.testFile("script.sh", "#!/bin/bash", {
        permissions: 0o755,
        mergeStrategy: "replace",
      });
      expect(file.permissions).toBe(0o755);
      expect(file.mergeStrategy).toBe("replace");
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

  describe("conditional generation", () => {
    it("should allow conditional file generation based on plugins", async () => {
      class ConditionalGenerator extends BaseGenerator {
        constructor() {
          super(mockFs as any, mockTemplate as any);
          this.metadata = {
            pluginId: "conditional",
            priority: 30,
            version: "1.0.0",
            description: "Conditional generator",
          };
        }

        protected override getFiles(ctx: GeneratorContext): FileSpec[] {
          const files: FileSpec[] = [this.file("always.ts", "// always")];
          if (this.hasPlugin(ctx, "typescript")) {
            files.push(this.file("typescript.ts", "// typescript only"));
          }
          if (this.hasPlugin(ctx, "nonexistent")) {
            files.push(this.file("never.ts", "// never"));
          }
          return files;
        }
      }

      const gen = new ConditionalGenerator();
      const result = await gen.generate(context);

      expect(result.files.find((f) => f.path === "always.ts")).toBeDefined();
      expect(result.files.find((f) => f.path === "typescript.ts")).toBeDefined();
      expect(result.files.find((f) => f.path === "never.ts")).toBeUndefined();
    });
  });
});

describe("Generator with empty implementations", () => {
  it("should work with minimal generator", async () => {
    class MinimalGenerator extends BaseGenerator {
      constructor() {
        super(mockFs as any, mockTemplate as any);
        this.metadata = {
          pluginId: "minimal",
          priority: 0,
          version: "1.0.0",
          description: "Minimal generator",
        };
      }
      // No overrides - uses default empty implementations
    }

    const gen = new MinimalGenerator();
    const result = await gen.generate(createTestContext());

    expect(result.files).toHaveLength(0);
    expect(result.dependencies).toHaveLength(0);
    expect(result.scripts).toHaveLength(0);
    expect(result.postCommands).toHaveLength(0);
  });
});
