/**
 * TemplateService Tests
 *
 * Tests for the template service which handles Handlebars template rendering.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TemplateService, type TemplateContext, type RenderOptions } from "../template.service";
import { TemplateHelpersService } from "../template-helpers.service";
import { TemplateRegistryService, type TemplateDefinition } from "../template-registry.service";

// Mock fs-extra
vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(),
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    chmod: vi.fn(),
  },
  pathExists: vi.fn(),
  ensureDir: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn(),
  chmod: vi.fn(),
}));

import * as fs from "fs-extra";

describe("TemplateService", () => {
  let service: TemplateService;
  let mockHelpers: TemplateHelpersService;
  let mockRegistry: TemplateRegistryService;
  
  const createContext = (overrides: Partial<TemplateContext> = {}): TemplateContext => ({
    name: "test-project",
    description: "A test project",
    author: "Test Author",
    license: "MIT",
    packageManager: "bun",
    plugins: ["typescript", "eslint", "prettier"],
    database: "postgresql",
    docker: { enabled: true },
    git: { enabled: true },
    ci: { enabled: true },
    ports: { api: 3001, web: 3000 },
    ...overrides,
  });

  const createTemplate = (overrides: Partial<TemplateDefinition> = {}): TemplateDefinition => ({
    id: "test-template",
    name: "Test Template",
    description: "A test template",
    content: "Hello {{name}}!",
    outputPath: "output/{{name}}.txt",
    pluginId: "typescript",
    category: "config",
    ...overrides,
  });

  beforeEach(() => {
    // Create real TemplateHelpersService (we want to test Handlebars integration)
    mockHelpers = new TemplateHelpersService();
    
    // Create mock registry
    mockRegistry = {
      get: vi.fn(),
      getByPlugin: vi.fn(),
      getByCategory: vi.fn(),
      register: vi.fn(),
      getAll: vi.fn(),
    } as unknown as TemplateRegistryService;
    
    service = new TemplateService(mockHelpers, mockRegistry);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("render", () => {
    it("should render simple template with context", () => {
      const template = "Project: {{name}}, Author: {{author}}";
      const context = createContext();
      
      const result = service.render(template, context);
      
      expect(result).toBe("Project: test-project, Author: Test Author");
    });

    it("should render nested object properties", () => {
      const template = "Docker: {{docker.enabled}}, Port: {{ports.api}}";
      const context = createContext();
      
      const result = service.render(template, context);
      
      expect(result).toBe("Docker: true, Port: 3001");
    });

    it("should render arrays with each helper", () => {
      const template = "{{#each plugins}}{{this}},{{/each}}";
      const context = createContext();
      
      const result = service.render(template, context);
      
      expect(result).toBe("typescript,eslint,prettier,");
    });

    it("should handle conditionals with if helper", () => {
      const template = "{{#if docker.enabled}}Docker enabled{{else}}No Docker{{/if}}";
      const context = createContext();
      
      const result = service.render(template, context);
      
      expect(result).toBe("Docker enabled");
    });

    it("should handle missing properties gracefully", () => {
      const template = "Missing: {{nonexistent}}";
      const context = createContext();
      
      const result = service.render(template, context);
      
      expect(result).toBe("Missing: ");
    });

    it("should not escape HTML entities (noEscape mode)", () => {
      const template = "{{name}}";
      const context = createContext({ name: "<script>alert('xss')</script>" });
      
      const result = service.render(template, context);
      
      expect(result).toBe("<script>alert('xss')</script>");
    });
  });

  describe("renderById", () => {
    it("should render template by ID from registry", () => {
      const template = createTemplate({ content: "Hello {{name}}" });
      vi.mocked(mockRegistry.get).mockReturnValue(template);
      
      const result = service.renderById("test-template", createContext());
      
      expect(mockRegistry.get).toHaveBeenCalledWith("test-template");
      expect(result).toBe("Hello test-project");
    });

    it("should throw error when template not found", () => {
      vi.mocked(mockRegistry.get).mockReturnValue(undefined);
      
      expect(() => service.renderById("unknown-template", createContext()))
        .toThrow("Template not found: unknown-template");
    });
  });

  describe("renderPath", () => {
    it("should render template expressions in paths", () => {
      const pathTemplate = "src/{{name}}/index.ts";
      const context = createContext();
      
      const result = service.renderPath(pathTemplate, context);
      
      expect(result).toBe("src/test-project/index.ts");
    });

    it("should handle nested expressions in paths", () => {
      const pathTemplate = "{{name}}/{{database}}/config.ts";
      const context = createContext();
      
      const result = service.renderPath(pathTemplate, context);
      
      expect(result).toBe("test-project/postgresql/config.ts");
    });
  });

  describe("evaluateCondition", () => {
    it("should return true for empty condition", () => {
      const result = service.evaluateCondition("", createContext());
      expect(result).toBe(true);
    });

    it("should evaluate boolean context values", () => {
      const context = createContext();
      
      expect(service.evaluateCondition("docker.enabled", context)).toBe(true);
      expect(service.evaluateCondition("git.enabled", context)).toBe(true);
    });

    it("should evaluate negation", () => {
      const context = createContext({ docker: { enabled: false } });
      
      expect(service.evaluateCondition("!docker.enabled", context)).toBe(true);
    });

    it("should evaluate array includes", () => {
      const context = createContext();
      
      expect(service.evaluateCondition("plugins.includes('typescript')", context)).toBe(true);
      expect(service.evaluateCondition("plugins.includes('graphql')", context)).toBe(false);
    });

    it("should return false for undefined values", () => {
      const context = createContext();
      
      expect(service.evaluateCondition("nonexistent.value", context)).toBe(false);
    });
  });

  describe("renderTemplate", () => {
    const createOptions = (overrides: Partial<RenderOptions> = {}): RenderOptions => ({
      outputDir: "/output",
      dryRun: false,
      overwrite: false,
      ...overrides,
    });

    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as unknown as void);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it("should render template and write file", async () => {
      const template = createTemplate();
      const context = createContext();
      const options = createOptions();
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.skipped).toBe(false);
      expect(result.content).toBe("Hello test-project!");
      expect(result.path).toBe("/output/output/test-project.txt");
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it("should skip rendering when condition not met", async () => {
      const template = createTemplate({ condition: "plugins.includes('graphql')" });
      const context = createContext();
      const options = createOptions();
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toContain("Condition not met");
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it("should skip when file exists and skipIfExists is true", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as unknown as void);
      
      const template = createTemplate({ skipIfExists: true });
      const context = createContext();
      const options = createOptions({ overwrite: false });
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe("File already exists");
    });

    it("should not write file in dry run mode", async () => {
      const template = createTemplate();
      const context = createContext();
      const options = createOptions({ dryRun: true });
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.skipped).toBe(false);
      expect(result.content).toBe("Hello test-project!");
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it("should set file mode when specified", async () => {
      vi.mocked(fs.chmod).mockResolvedValue(undefined);
      
      const template = createTemplate({ mode: 0o755 });
      const context = createContext();
      const options = createOptions();
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.mode).toBe(0o755);
      expect(fs.chmod).toHaveBeenCalledWith(expect.any(String), 0o755);
    });

    it("should merge additional context from options", async () => {
      const template = createTemplate({ content: "{{name}} by {{customAuthor}}" });
      const context = createContext();
      const options = createOptions({ 
        context: { customAuthor: "Custom Author" } 
      });
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.content).toBe("test-project by Custom Author");
    });

    it("should include template metadata in context", async () => {
      const template = createTemplate({ 
        content: "Template ID: {{_template.id}}" 
      });
      const context = createContext();
      const options = createOptions();
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.content).toBe("Template ID: test-template");
    });

    it("should include output metadata in context", async () => {
      const template = createTemplate({ 
        content: "Filename: {{_output.filename}}" 
      });
      const context = createContext();
      const options = createOptions();
      
      const result = await service.renderTemplate(template, context, options);
      
      expect(result.content).toContain("test-project.txt");
    });
  });

  describe("renderTemplates", () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as unknown as void);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it("should render multiple templates", async () => {
      const templates = [
        createTemplate({ id: "t1", content: "Template 1: {{name}}" }),
        createTemplate({ id: "t2", content: "Template 2: {{name}}" }),
      ];
      const context = createContext();
      const options: RenderOptions = { outputDir: "/output" };
      
      const results = await service.renderTemplates(templates, context, options);
      
      expect(results).toHaveLength(2);
      expect(results[0]!.content).toBe("Template 1: test-project");
      expect(results[1]!.content).toBe("Template 2: test-project");
    });

    it("should handle mixed skipped and rendered templates", async () => {
      const templates = [
        createTemplate({ id: "t1", content: "Rendered" }),
        createTemplate({ id: "t2", content: "Skipped", condition: "nonexistent" }),
      ];
      const context = createContext();
      const options: RenderOptions = { outputDir: "/output" };
      
      const results = await service.renderTemplates(templates, context, options);
      
      expect(results[0]!.skipped).toBe(false);
      expect(results[1]!.skipped).toBe(true);
    });
  });

  describe("renderForPlugins", () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as unknown as void);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it("should render templates for specified plugins", async () => {
      vi.mocked(mockRegistry.getByPlugin).mockImplementation((id) => {
        if (id === "typescript") {
          return [createTemplate({ id: "ts", content: "TS: {{name}}", pluginId: "typescript" })];
        }
        if (id === "eslint") {
          return [createTemplate({ id: "eslint", content: "ESLint: {{name}}", pluginId: "eslint" })];
        }
        return [];
      });
      
      const context = createContext();
      const options: RenderOptions = { outputDir: "/output" };
      
      const results = await service.renderForPlugins(["typescript", "eslint"], context, options);
      
      expect(mockRegistry.getByPlugin).toHaveBeenCalledWith("typescript");
      expect(mockRegistry.getByPlugin).toHaveBeenCalledWith("eslint");
      expect(results).toHaveLength(2);
    });
  });

  describe("renderCategory", () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as unknown as void);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it("should render all templates in a category", async () => {
      vi.mocked(mockRegistry.getByCategory).mockReturnValue([
        createTemplate({ id: "t1", category: "config" }),
        createTemplate({ id: "t2", category: "config" }),
      ]);
      
      const context = createContext();
      const options: RenderOptions = { outputDir: "/output" };
      
      const results = await service.renderCategory("config", context, options);
      
      expect(mockRegistry.getByCategory).toHaveBeenCalledWith("config");
      expect(results).toHaveLength(2);
    });
  });

  describe("compile", () => {
    it("should compile template to reusable function", () => {
      const compiled = service.compile("Hello {{name}}!");
      
      const result1 = compiled({ name: "World" } as TemplateContext);
      const result2 = compiled({ name: "Universe" } as TemplateContext);
      
      expect(result1).toBe("Hello World!");
      expect(result2).toBe("Hello Universe!");
    });
  });

  describe("registerPartial", () => {
    it("should register partial template", () => {
      service.registerPartial("header", "<header>{{title}}</header>");
      
      const template = "{{> header title=\"Test\"}}";
      const result = service.render(template, createContext());
      
      expect(result).toBe("<header>Test</header>");
    });
  });

  describe("registerPartialsFromDir", () => {
    it("should register all .hbs files from directory", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as unknown as void);
      vi.mocked(fs.readdir).mockResolvedValue(["header.hbs", "footer.hbs", "other.txt"] as any);
      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes("header")) return Promise.resolve("<header/>");
        if (path.includes("footer")) return Promise.resolve("<footer/>");
        return Promise.resolve("");
      });
      
      const count = await service.registerPartialsFromDir("/templates/partials");
      
      expect(count).toBe(2);
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it("should return 0 if directory does not exist", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as unknown as void);
      
      const count = await service.registerPartialsFromDir("/nonexistent");
      
      expect(count).toBe(0);
    });
  });

  describe("createContext", () => {
    it("should create context from config object", () => {
      const config = {
        name: "my-project",
        description: "My description",
        author: "Me",
        plugins: ["typescript"],
        custom: "value",
      };
      
      const context = service.createContext(config);
      
      expect(context.name).toBe("my-project");
      expect(context.description).toBe("My description");
      expect(context.author).toBe("Me");
      expect(context.plugins).toEqual(["typescript"]);
      expect(context.custom).toBe("value");
    });

    it("should use name field directly if provided", () => {
      const config = {
        name: "direct-name",
      };
      
      const context = service.createContext(config);
      
      expect(context.name).toBe("direct-name");
    });

    it("should default to 'project' if no name provided", () => {
      const context = service.createContext({});
      
      expect(context.name).toBe("project");
    });
  });
});
