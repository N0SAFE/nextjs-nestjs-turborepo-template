/**
 * Template Registry Service Tests
 *
 * Tests for template management with registration, retrieval, and storage.
 * The service uses fs-extra and glob for filesystem operations.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  TemplateRegistryService,
  type TemplateDefinition,
  type TemplateCategory,
} from "../template-registry.service";

// Mock fs-extra
vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    ensureDir: vi.fn(),
  },
  pathExists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  ensureDir: vi.fn(),
}));

// Mock glob
vi.mock("glob", () => ({
  glob: vi.fn(),
}));

import * as fs from "fs-extra";
import { glob } from "glob";

describe("TemplateRegistryService", () => {
  let service: TemplateRegistryService;

  beforeEach(() => {
    service = new TemplateRegistryService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with empty registry", () => {
      expect(service).toBeDefined();
      const templates = service.getAll();
      expect(templates).toEqual([]);
    });

    it("should set default template directory", () => {
      const dir = service.getTemplateDir();
      expect(dir).toContain("templates");
    });
  });

  describe("register", () => {
    it("should register a new template", () => {
      const template: TemplateDefinition = {
        id: "test-template",
        name: "Test Template",
        description: "A test template",
        category: "component",
        outputPath: "components/{{name}}.tsx",
        content: "const {{name}} = () => {}",
      };

      service.register(template);

      const retrieved = service.get("test-template");
      expect(retrieved).toEqual(template);
    });

    it("should overwrite existing template with same ID", () => {
      const template1: TemplateDefinition = {
        id: "test-template",
        name: "Test Template v1",
        description: "Version 1",
        category: "component",
        outputPath: "v1.tsx",
        content: "v1 content",
      };

      const template2: TemplateDefinition = {
        id: "test-template",
        name: "Test Template v2",
        description: "Version 2",
        category: "component",
        outputPath: "v2.tsx",
        content: "v2 content",
      };

      service.register(template1);
      service.register(template2);

      const retrieved = service.get("test-template");
      expect(retrieved?.name).toBe("Test Template v2");
      expect(retrieved?.content).toBe("v2 content");
    });

    it("should register template with all optional properties", () => {
      const template: TemplateDefinition = {
        id: "full-template",
        name: "Full Template",
        description: "A complete template",
        category: "config",
        outputPath: "config.json",
        content: "content here",
        pluginId: "my-plugin",
        condition: "config.useTypeScript",
        skipIfExists: true,
        mode: 0o755,
      };

      service.register(template);

      const retrieved = service.get("full-template");
      expect(retrieved?.pluginId).toBe("my-plugin");
      expect(retrieved?.condition).toBe("config.useTypeScript");
      expect(retrieved?.skipIfExists).toBe(true);
      expect(retrieved?.mode).toBe(0o755);
    });
  });

  describe("registerMany", () => {
    it("should register multiple templates at once", () => {
      const templates: TemplateDefinition[] = [
        {
          id: "t1",
          name: "T1",
          category: "component",
          outputPath: "t1.tsx",
          content: "",
        },
        {
          id: "t2",
          name: "T2",
          category: "config",
          outputPath: "t2.json",
          content: "",
        },
        {
          id: "t3",
          name: "T3",
          category: "docker",
          outputPath: "t3.yml",
          content: "",
        },
      ];

      service.registerMany(templates);

      expect(service.getAll()).toHaveLength(3);
      expect(service.has("t1")).toBe(true);
      expect(service.has("t2")).toBe(true);
      expect(service.has("t3")).toBe(true);
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent template", () => {
      const result = service.get("non-existent");
      expect(result).toBeUndefined();
    });

    it("should return registered template", () => {
      const template: TemplateDefinition = {
        id: "my-template",
        name: "My Template",
        description: "Test",
        category: "component",
        outputPath: "output.tsx",
        content: "content",
      };

      service.register(template);
      const result = service.get("my-template");
      expect(result).toEqual(template);
    });
  });

  describe("getAll", () => {
    it("should return empty array when no templates", () => {
      const result = service.getAll();
      expect(result).toEqual([]);
    });

    it("should return all registered templates", () => {
      const templates: TemplateDefinition[] = [
        {
          id: "t1",
          name: "T1",
          category: "component",
          outputPath: "t1.tsx",
          content: "",
        },
        {
          id: "t2",
          name: "T2",
          category: "config",
          outputPath: "t2.json",
          content: "",
        },
        {
          id: "t3",
          name: "T3",
          category: "docker",
          outputPath: "t3.yml",
          content: "",
        },
      ];

      templates.forEach((t) => service.register(t));

      const result = service.getAll();
      expect(result).toHaveLength(3);
    });
  });

  describe("getByCategory", () => {
    beforeEach(() => {
      const templates: TemplateDefinition[] = [
        {
          id: "comp1",
          name: "Component 1",
          category: "component",
          outputPath: "c1.tsx",
          content: "",
        },
        {
          id: "comp2",
          name: "Component 2",
          category: "component",
          outputPath: "c2.tsx",
          content: "",
        },
        {
          id: "config1",
          name: "Config 1",
          category: "config",
          outputPath: "config.json",
          content: "",
        },
        {
          id: "docker1",
          name: "Docker 1",
          category: "docker",
          outputPath: "docker.yml",
          content: "",
        },
      ];
      templates.forEach((t) => service.register(t));
    });

    it("should return templates by category", () => {
      const components = service.getByCategory("component");
      expect(components).toHaveLength(2);
      expect(components.every((t) => t.category === "component")).toBe(true);
    });

    it("should return empty array for category with no templates", () => {
      const result = service.getByCategory("migration");
      expect(result).toEqual([]);
    });

    it("should filter correctly for different categories", () => {
      expect(service.getByCategory("config")).toHaveLength(1);
      expect(service.getByCategory("docker")).toHaveLength(1);
    });
  });

  describe("getByPlugin", () => {
    beforeEach(() => {
      const templates: TemplateDefinition[] = [
        {
          id: "t1",
          name: "T1",
          category: "component",
          outputPath: "t1.tsx",
          content: "",
          pluginId: "plugin-a",
        },
        {
          id: "t2",
          name: "T2",
          category: "component",
          outputPath: "t2.tsx",
          content: "",
          pluginId: "plugin-a",
        },
        {
          id: "t3",
          name: "T3",
          category: "config",
          outputPath: "t3.json",
          content: "",
          pluginId: "plugin-b",
        },
        {
          id: "t4",
          name: "T4",
          category: "config",
          outputPath: "t4.json",
          content: "",
        }, // No plugin
      ];
      templates.forEach((t) => service.register(t));
    });

    it("should return templates by plugin ID", () => {
      const result = service.getByPlugin("plugin-a");
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.pluginId === "plugin-a")).toBe(true);
    });

    it("should return empty array for unknown plugin", () => {
      const result = service.getByPlugin("unknown-plugin");
      expect(result).toEqual([]);
    });
  });

  describe("has", () => {
    it("should return true for existing template", () => {
      const template: TemplateDefinition = {
        id: "exists",
        name: "Exists",
        category: "component",
        outputPath: "exists.tsx",
        content: "",
      };

      service.register(template);
      expect(service.has("exists")).toBe(true);
    });

    it("should return false for non-existent template", () => {
      expect(service.has("non-existent")).toBe(false);
    });
  });

  describe("remove", () => {
    it("should remove existing template", () => {
      const template: TemplateDefinition = {
        id: "to-remove",
        name: "To Remove",
        category: "component",
        outputPath: "remove.tsx",
        content: "",
      };

      service.register(template);
      expect(service.get("to-remove")).toBeDefined();

      const removed = service.remove("to-remove");
      expect(removed).toBe(true);
      expect(service.get("to-remove")).toBeUndefined();
    });

    it("should return false for non-existent template", () => {
      const removed = service.remove("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all templates", () => {
      const templates: TemplateDefinition[] = [
        {
          id: "t1",
          name: "T1",
          category: "component",
          outputPath: "t1.tsx",
          content: "",
        },
        {
          id: "t2",
          name: "T2",
          category: "config",
          outputPath: "t2.json",
          content: "",
        },
      ];
      templates.forEach((t) => service.register(t));

      expect(service.getAll()).toHaveLength(2);

      service.clear();

      expect(service.getAll()).toEqual([]);
    });
  });

  describe("setTemplateDir / getTemplateDir", () => {
    it("should set and get template directory", () => {
      service.setTemplateDir("/custom/templates");
      expect(service.getTemplateDir()).toBe("/custom/templates");
    });
  });

  describe("loadFromDirectory", () => {
    it("should return 0 if directory does not exist", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);

      const count = await service.loadFromDirectory("/non-existent");

      expect(count).toBe(0);
      expect(fs.pathExists).toHaveBeenCalledWith("/non-existent");
    });

    it("should load templates from directory using glob", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["component.hbs", "config/eslint.hbs"]);
      (vi.mocked(fs.readFile) as ReturnType<typeof vi.fn>).mockImplementation(async (filePath: string) => {
        if (filePath.toString().includes("component")) {
          return `---
id: component-template
name: Component Template
description: A component
outputPath: {{name}}.tsx
---
export const {{name}} = () => {}`;
        }
        return `---
id: eslint-template
name: ESLint Template
---
module.exports = {}`;
      });

      const count = await service.loadFromDirectory("/templates");

      expect(count).toBe(2);
      expect(glob).toHaveBeenCalledWith("**/*.hbs", { cwd: "/templates" });
    });

    it("should use default template directory if not provided", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue([]);

      await service.loadFromDirectory();

      expect(fs.pathExists).toHaveBeenCalledWith(service.getTemplateDir());
    });

    it("should generate ID from file path if not in frontmatter", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["components/button.hbs"]);
      vi.mocked(fs.readFile).mockResolvedValue(
        `---
name: Button
---
<button>{{label}}</button>` as unknown as void
      );

      await service.loadFromDirectory("/templates");

      // ID should be generated from path: "components/button" -> "components-button"
      expect(service.has("components-button")).toBe(true);
    });

    it("should parse frontmatter correctly", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["test.hbs"]);
      vi.mocked(fs.readFile).mockResolvedValue(
        `---
id: my-template
name: My Template
description: "A description"
outputPath: output.txt
pluginId: test-plugin
condition: config.enabled
skipIfExists: true
mode: 493
---
Template content here` as unknown as void
      );

      await service.loadFromDirectory("/templates");

      const template = service.get("my-template");
      expect(template).toBeDefined();
      expect(template?.name).toBe("My Template");
      expect(template?.description).toBe("A description");
      expect(template?.outputPath).toBe("output.txt");
      expect(template?.pluginId).toBe("test-plugin");
      expect(template?.condition).toBe("config.enabled");
      expect(template?.skipIfExists).toBe(true);
      expect(template?.mode).toBe(493); // 0o755 in decimal
      expect(template?.content).toBe("Template content here");
    });

    it("should handle templates without frontmatter", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["simple.hbs"]);
      vi.mocked(fs.readFile).mockResolvedValue("Just plain content" as unknown as void);

      await service.loadFromDirectory("/templates");

      const template = service.get("simple");
      expect(template).toBeDefined();
      expect(template?.content).toBe("Just plain content");
    });

    it("should determine category from file path", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue([
        "config/eslint.hbs",
        "docker/compose.hbs",
        "ci/github.hbs",
        "apps/web.hbs",
        "packages/ui.hbs",
        "components/button.hbs",
        "tests/unit.hbs",
        "migrations/001.hbs",
        "scripts/build.hbs",
        "random/other.hbs",
      ]);
      vi.mocked(fs.readFile).mockResolvedValue("content" as unknown as void);

      await service.loadFromDirectory("/templates");

      expect(service.get("config-eslint")?.category).toBe("config");
      expect(service.get("docker-compose")?.category).toBe("docker");
      expect(service.get("ci-github")?.category).toBe("ci");
      expect(service.get("apps-web")?.category).toBe("app");
      expect(service.get("packages-ui")?.category).toBe("package");
      expect(service.get("components-button")?.category).toBe("component");
      expect(service.get("tests-unit")?.category).toBe("test");
      expect(service.get("migrations-001")?.category).toBe("migration");
      expect(service.get("scripts-build")?.category).toBe("script");
      expect(service.get("random-other")?.category).toBe("other");
    });
  });

  describe("saveToFile", () => {
    it("should throw for non-existent template", async () => {
      await expect(service.saveToFile("non-existent")).rejects.toThrow(
        "Template not found: non-existent"
      );
    });

    it("should save template with frontmatter", async () => {
      const template: TemplateDefinition = {
        id: "to-save",
        name: "To Save",
        description: "Template to save",
        category: "component",
        outputPath: "{{name}}.tsx",
        content: "<div>{{name}}</div>",
        skipIfExists: true,
      };

      service.register(template);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const filePath = await service.saveToFile("to-save");

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(filePath).toContain("to/save.hbs");

      // Check the content written
      const writeCall = vi.mocked(fs.writeFile).mock.calls[0]!;
      const content = writeCall[1] as string;
      expect(content).toContain("---");
      expect(content).toContain('id: "to-save"');
      expect(content).toContain('name: "To Save"');
      expect(content).toContain("<div>{{name}}</div>");
    });

    it("should use custom directory if provided", async () => {
      const template: TemplateDefinition = {
        id: "custom-dir",
        name: "Custom Dir",
        category: "config",
        outputPath: "config.json",
        content: "{}",
      };

      service.register(template);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const filePath = await service.saveToFile("custom-dir", "/custom/path");

      expect(filePath).toContain("/custom/path");
    });
  });

  describe("getStats", () => {
    it("should return empty stats when no templates", () => {
      const stats = service.getStats();

      expect(stats.total).toBe(0);
      expect(stats.byCategory.component).toBe(0);
      expect(stats.byCategory.config).toBe(0);
      expect(Object.keys(stats.byPlugin)).toHaveLength(0);
    });

    it("should count templates by category", () => {
      const templates: TemplateDefinition[] = [
        {
          id: "c1",
          name: "C1",
          category: "component",
          outputPath: "c1.tsx",
          content: "",
        },
        {
          id: "c2",
          name: "C2",
          category: "component",
          outputPath: "c2.tsx",
          content: "",
        },
        {
          id: "conf1",
          name: "Conf1",
          category: "config",
          outputPath: "conf.json",
          content: "",
        },
        {
          id: "d1",
          name: "D1",
          category: "docker",
          outputPath: "docker.yml",
          content: "",
        },
      ];
      templates.forEach((t) => service.register(t));

      const stats = service.getStats();

      expect(stats.total).toBe(4);
      expect(stats.byCategory.component).toBe(2);
      expect(stats.byCategory.config).toBe(1);
      expect(stats.byCategory.docker).toBe(1);
      expect(stats.byCategory.ci).toBe(0);
    });

    it("should count templates by plugin", () => {
      const templates: TemplateDefinition[] = [
        {
          id: "t1",
          name: "T1",
          category: "component",
          outputPath: "t1.tsx",
          content: "",
          pluginId: "plugin-a",
        },
        {
          id: "t2",
          name: "T2",
          category: "component",
          outputPath: "t2.tsx",
          content: "",
          pluginId: "plugin-a",
        },
        {
          id: "t3",
          name: "T3",
          category: "config",
          outputPath: "t3.json",
          content: "",
          pluginId: "plugin-b",
        },
        {
          id: "t4",
          name: "T4",
          category: "config",
          outputPath: "t4.json",
          content: "",
        }, // No plugin
      ];
      templates.forEach((t) => service.register(t));

      const stats = service.getStats();

      expect(stats.byPlugin["plugin-a"]).toBe(2);
      expect(stats.byPlugin["plugin-b"]).toBe(1);
      expect(Object.keys(stats.byPlugin)).toHaveLength(2);
    });
  });

  describe("categories", () => {
    const allCategories: TemplateCategory[] = [
      "root",
      "config",
      "docker",
      "ci",
      "app",
      "package",
      "component",
      "test",
      "migration",
      "script",
      "other",
    ];

    it("should support all predefined categories", () => {
      allCategories.forEach((category, index) => {
        const template: TemplateDefinition = {
          id: `${category}-template-${index}`,
          name: `${category} Template`,
          category,
          outputPath: `${category}.txt`,
          content: "",
        };

        service.register(template);
      });

      allCategories.forEach((category, index) => {
        const result = service.getByCategory(category);
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.some((t) => t.category === category)).toBe(true);
      });
    });
  });

  describe("frontmatter parsing edge cases", () => {
    it("should parse boolean true", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["test.hbs"]);
      vi.mocked(fs.readFile).mockResolvedValue(
        `---
id: bool-test
name: Bool Test
skipIfExists: true
---
content`
      );

      await service.loadFromDirectory("/templates");

      const template = service.get("bool-test");
      expect(template?.skipIfExists).toBe(true);
    });

    it("should parse boolean false", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["test.hbs"]);
      vi.mocked(fs.readFile).mockResolvedValue(
        `---
id: bool-false-test
name: Bool False Test
skipIfExists: false
---
content`
      );

      await service.loadFromDirectory("/templates");

      const template = service.get("bool-false-test");
      expect(template?.skipIfExists).toBe(false);
    });

    it("should parse numeric values", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["test.hbs"]);
      vi.mocked(fs.readFile).mockResolvedValue(
        `---
id: num-test
name: Num Test
mode: 755
---
content`
      );

      await service.loadFromDirectory("/templates");

      const template = service.get("num-test");
      expect(template?.mode).toBe(755);
    });

    it("should parse quoted strings", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(glob).mockResolvedValue(["test.hbs"]);
      vi.mocked(fs.readFile).mockResolvedValue(
        `---
id: quoted-test
name: "Quoted Name"
description: "A description with: colons"
---
content`
      );

      await service.loadFromDirectory("/templates");

      const template = service.get("quoted-test");
      expect(template?.name).toBe("Quoted Name");
      expect(template?.description).toBe("A description with: colons");
    });
  });
});
