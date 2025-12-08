/**
 * Template Registry Service
 *
 * Manages template definitions and storage.
 */
import { Injectable } from "@nestjs/common";
import * as fs from "fs-extra";
import * as path from "path";
import { glob } from "glob";

export interface TemplateDefinition {
  /** Template ID */
  id: string;
  /** Display name */
  name: string;
  /** Template category */
  category: TemplateCategory;
  /** Output filename (can be a template string) */
  outputPath: string;
  /** Template content (Handlebars) */
  content: string;
  /** Description */
  description?: string;
  /** Plugin ID that provides this template */
  pluginId?: string;
  /** Condition for when to use this template */
  condition?: string;
  /** Whether to skip if output already exists */
  skipIfExists?: boolean;
  /** File permissions (Unix octal) */
  mode?: number;
}

export type TemplateCategory =
  | "root"
  | "config"
  | "docker"
  | "ci"
  | "app"
  | "package"
  | "component"
  | "test"
  | "migration"
  | "script"
  | "other";

@Injectable()
export class TemplateRegistryService {
  private templates: Map<string, TemplateDefinition> = new Map();
  private templateDir: string;

  constructor() {
    // Default template directory (relative to package)
    this.templateDir = path.resolve(__dirname, "../../templates");
  }

  /**
   * Register a template definition
   */
  register(template: TemplateDefinition): void {
    this.templates.set(template.id, template);
  }

  /**
   * Register multiple templates
   */
  registerMany(templates: TemplateDefinition[]): void {
    for (const template of templates) {
      this.register(template);
    }
  }

  /**
   * Get a template by ID
   */
  get(id: string): TemplateDefinition | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAll(): TemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getByCategory(category: TemplateCategory): TemplateDefinition[] {
    return this.getAll().filter((t) => t.category === category);
  }

  /**
   * Get templates by plugin ID
   */
  getByPlugin(pluginId: string): TemplateDefinition[] {
    return this.getAll().filter((t) => t.pluginId === pluginId);
  }

  /**
   * Check if a template exists
   */
  has(id: string): boolean {
    return this.templates.has(id);
  }

  /**
   * Remove a template
   */
  remove(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
  }

  /**
   * Load templates from the filesystem
   */
  async loadFromDirectory(dir?: string): Promise<number> {
    const templateDir = dir ?? this.templateDir;
    
    if (!await fs.pathExists(templateDir)) {
      return 0;
    }

    const files = await glob("**/*.hbs", { cwd: templateDir });
    let count = 0;

    for (const file of files) {
      const filePath = path.join(templateDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      
      // Parse template metadata from frontmatter
      const { metadata, body } = this.parseFrontmatter(content);
      
      // Generate ID from file path if not provided
      const id = (metadata.id as string | undefined) ?? file.replace(/\.hbs$/, "").replace(/\//g, "-");
      
      // Determine category from directory structure
      const category = this.categoryFromPath(file);
      
      // Determine output path
      const outputPath = (metadata.outputPath as string | undefined) ?? file.replace(/\.hbs$/, "");

      this.register({
        id,
        name: (metadata.name as string | undefined) ?? id,
        category,
        outputPath,
        content: body,
        description: metadata.description as string | undefined,
        pluginId: metadata.pluginId as string | undefined,
        condition: metadata.condition as string | undefined,
        skipIfExists: metadata.skipIfExists as boolean | undefined,
        mode: metadata.mode as number | undefined,
      });

      count++;
    }

    return count;
  }

  /**
   * Save a template to the filesystem
   */
  async saveToFile(id: string, dir?: string): Promise<string> {
    const template = this.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    const templateDir = dir ?? this.templateDir;
    const filePath = path.join(templateDir, `${id.replace(/-/g, "/")}.hbs`);
    
    // Create frontmatter
    const frontmatter = this.createFrontmatter({
      id: template.id,
      name: template.name,
      description: template.description,
      outputPath: template.outputPath,
      pluginId: template.pluginId,
      condition: template.condition,
      skipIfExists: template.skipIfExists,
      mode: template.mode,
    });

    const content = `${frontmatter}\n${template.content}`;
    
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, "utf-8");

    return filePath;
  }

  /**
   * Set the template directory
   */
  setTemplateDir(dir: string): void {
    this.templateDir = dir;
  }

  /**
   * Get the template directory
   */
  getTemplateDir(): string {
    return this.templateDir;
  }

  /**
   * Parse YAML frontmatter from template content
   */
  private parseFrontmatter(content: string): {
    metadata: Record<string, unknown>;
    body: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { metadata: {}, body: content };
    }

    const yamlContent = match[1] ?? "";
    const bodyContent = match[2] ?? "";
    const metadata: Record<string, unknown> = {};

    // Simple YAML parsing (key: value)
    for (const line of yamlContent.split("\n")) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: unknown = line.slice(colonIndex + 1).trim();
        
        // Parse common types
        if (value === "true") value = true;
        else if (value === "false") value = false;
        else if (!isNaN(Number(value)) && value !== "") value = Number(value);
        else if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        metadata[key] = value;
      }
    }

    return { metadata, body: bodyContent };
  }

  /**
   * Create YAML frontmatter from metadata
   */
  private createFrontmatter(metadata: Record<string, unknown>): string {
    const lines: string[] = ["---"];
    
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        if (typeof value === "string") {
          lines.push(`${key}: "${value}"`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
    }
    
    lines.push("---");
    return lines.join("\n");
  }

  /**
   * Determine category from file path
   */
  private categoryFromPath(filePath: string): TemplateCategory {
    const dir = path.dirname(filePath);
    const categoryMap: Record<string, TemplateCategory> = {
      root: "root",
      config: "config",
      docker: "docker",
      ci: "ci",
      apps: "app",
      packages: "package",
      components: "component",
      tests: "test",
      migrations: "migration",
      scripts: "script",
    };

    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (dir.startsWith(prefix) || dir === prefix) {
        return category;
      }
    }

    return "other";
  }

  /**
   * Get template statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<TemplateCategory, number>;
    byPlugin: Record<string, number>;
  } {
    const byCategory: Record<TemplateCategory, number> = {
      root: 0,
      config: 0,
      docker: 0,
      ci: 0,
      app: 0,
      package: 0,
      component: 0,
      test: 0,
      migration: 0,
      script: 0,
      other: 0,
    };

    const byPlugin: Record<string, number> = {};

    for (const template of this.templates.values()) {
      byCategory[template.category]++;
      
      if (template.pluginId) {
        byPlugin[template.pluginId] = (byPlugin[template.pluginId] ?? 0) + 1;
      }
    }

    return {
      total: this.templates.size,
      byCategory,
      byPlugin,
    };
  }
}
