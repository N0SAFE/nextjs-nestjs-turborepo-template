/**
 * Template Service
 *
 * Main service for rendering Handlebars templates.
 */
import { Injectable } from "@nestjs/common";
import Handlebars from "handlebars";
import * as fs from "fs-extra";
import * as path from "path";
import { TemplateHelpersService } from "./template-helpers.service";
import { TemplateRegistryService, type TemplateDefinition } from "./template-registry.service";

export interface TemplateContext {
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Author name */
  author?: string;
  /** License */
  license?: string;
  /** Package manager */
  packageManager?: string;
  /** Selected plugins */
  plugins?: string[];
  /** Database provider */
  database?: string;
  /** Docker enabled */
  docker?: { enabled: boolean; [key: string]: unknown };
  /** Git config */
  git?: { enabled: boolean; [key: string]: unknown };
  /** CI config */
  ci?: { enabled: boolean; [key: string]: unknown };
  /** Port configurations */
  ports?: Record<string, number>;
  /** Custom data */
  [key: string]: unknown;
}

export interface RenderResult {
  /** Output path (resolved) */
  path: string;
  /** Rendered content */
  content: string;
  /** Whether file was skipped */
  skipped: boolean;
  /** Skip reason if skipped */
  skipReason?: string;
  /** File mode if specified */
  mode?: number;
}

export interface RenderOptions {
  /** Base output directory */
  outputDir: string;
  /** Dry run (don't write files) */
  dryRun?: boolean;
  /** Overwrite existing files */
  overwrite?: boolean;
  /** Additional context data */
  context?: Record<string, unknown>;
}

@Injectable()
export class TemplateService {
  private _handlebars: typeof Handlebars | null = null;

  constructor(
    private readonly helpers: TemplateHelpersService,
    private readonly registry: TemplateRegistryService,
  ) {
    // Lazy initialization - don't call helpers in constructor
  }

  /**
   * Get the Handlebars instance (lazy initialization)
   */
  private get handlebars(): typeof Handlebars {
    if (!this._handlebars) {
      this._handlebars = this.helpers.createInstance();
    }
    return this._handlebars;
  }

  /**
   * Render a template string with context
   */
  render(template: string, context: TemplateContext): string {
    const compiled = this.handlebars.compile(template, {
      noEscape: true, // Don't escape HTML entities
      strict: false,
    });
    
    return compiled(context);
  }

  /**
   * Render a template by ID
   */
  renderById(id: string, context: TemplateContext): string {
    const template = this.registry.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }
    
    return this.render(template.content, context);
  }

  /**
   * Render output path (which can contain template expressions)
   */
  renderPath(pathTemplate: string, context: TemplateContext): string {
    return this.render(pathTemplate, context);
  }

  /**
   * Check if a template condition is met
   */
  evaluateCondition(condition: string, context: TemplateContext): boolean {
    if (!condition) return true;
    
    // Simple condition evaluation
    // Supports: pluginId, !pluginId, plugins.includes('x')
    const trimmed = condition.trim();
    
    // Negation
    if (trimmed.startsWith("!")) {
      return !this.evaluateCondition(trimmed.slice(1), context);
    }
    
    // Array includes
    if (trimmed.includes(".includes(")) {
      const match = trimmed.match(/(\w+)\.includes\(['"](.+)['"]\)/);
      if (match) {
        const arrayName = match[1];
        const value = match[2];
        if (arrayName && value) {
          const arr = context[arrayName];
          return Array.isArray(arr) && arr.includes(value);
        }
      }
    }
    
    // Boolean context value
    const value = this.getNestedValue(context, trimmed);
    return Boolean(value);
  }

  /**
   * Render a template definition to a result
   */
  async renderTemplate(
    template: TemplateDefinition,
    context: TemplateContext,
    options: RenderOptions,
  ): Promise<RenderResult> {
    // Check condition
    if (template.condition && !this.evaluateCondition(template.condition, context)) {
      return {
        path: "",
        content: "",
        skipped: true,
        skipReason: `Condition not met: ${template.condition}`,
      };
    }

    // Render output path
    const outputPath = this.renderPath(template.outputPath, context);
    const fullPath = path.join(options.outputDir, outputPath);

    // Check if file exists
    if (!options.overwrite && await fs.pathExists(fullPath)) {
      if (template.skipIfExists) {
        return {
          path: fullPath,
          content: "",
          skipped: true,
          skipReason: "File already exists",
        };
      }
    }

    // Merge context with additional data
    const fullContext: TemplateContext = {
      ...context,
      ...options.context,
      _template: {
        id: template.id,
        name: template.name,
        category: template.category,
      },
      _output: {
        path: outputPath,
        fullPath,
        dir: path.dirname(fullPath),
        filename: path.basename(fullPath),
        ext: path.extname(fullPath),
      },
    };

    // Render content
    const content = this.render(template.content, fullContext);

    // Write file if not dry run
    if (!options.dryRun) {
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, "utf-8");
      
      // Set file mode if specified
      if (template.mode) {
        await fs.chmod(fullPath, template.mode);
      }
    }

    return {
      path: fullPath,
      content,
      skipped: false,
      mode: template.mode,
    };
  }

  /**
   * Render multiple templates
   */
  async renderTemplates(
    templates: TemplateDefinition[],
    context: TemplateContext,
    options: RenderOptions,
  ): Promise<RenderResult[]> {
    const results: RenderResult[] = [];
    
    for (const template of templates) {
      const result = await this.renderTemplate(template, context, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Render all templates for given plugin IDs
   */
  async renderForPlugins(
    pluginIds: string[],
    context: TemplateContext,
    options: RenderOptions,
  ): Promise<RenderResult[]> {
    const templates = pluginIds.flatMap(
      (id) => this.registry.getByPlugin(id)
    );
    
    return this.renderTemplates(templates, context, options);
  }

  /**
   * Render all templates in a category
   */
  async renderCategory(
    category: TemplateDefinition["category"],
    context: TemplateContext,
    options: RenderOptions,
  ): Promise<RenderResult[]> {
    const templates = this.registry.getByCategory(category);
    return this.renderTemplates(templates, context, options);
  }

  /**
   * Compile a template to a function (for performance when rendering multiple times)
   */
  compile(template: string): Handlebars.TemplateDelegate<TemplateContext> {
    return this.handlebars.compile<TemplateContext>(template, {
      noEscape: true,
      strict: false,
    });
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, content: string): void {
    this.handlebars.registerPartial(name, content);
  }

  /**
   * Register partials from a directory
   */
  async registerPartialsFromDir(dir: string): Promise<number> {
    if (!await fs.pathExists(dir)) {
      return 0;
    }

    const files = await fs.readdir(dir);
    let count = 0;

    for (const file of files) {
      if (file.endsWith(".hbs")) {
        const name = file.replace(/\.hbs$/, "");
        const content = await fs.readFile(path.join(dir, file), "utf-8");
        this.registerPartial(name, content);
        count++;
      }
    }

    return count;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current, key) => {
      if (current && typeof current === "object") {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  /**
   * Create a context object from project config
   */
  createContext(config: Record<string, unknown>): TemplateContext {
    // Support both object-style plugins and legacy array format
    const pluginsConfig = config.plugins;
    const pluginIds = Array.isArray(pluginsConfig)
      ? pluginsConfig
      : typeof pluginsConfig === 'object' && pluginsConfig !== null
        ? Object.keys(pluginsConfig)
        : undefined;
    
    return {
      name: String(config.name ?? "project"),
      description: config.description as string | undefined,
      author: config.author as string | undefined,
      license: config.license as string | undefined,
      packageManager: config.packageManager as string | undefined,
      plugins: pluginIds,
      database: config.database as string | undefined,
      docker: config.docker as { enabled: boolean } | undefined,
      git: config.git as { enabled: boolean } | undefined,
      ci: config.ci as { enabled: boolean } | undefined,
      ports: config.ports as Record<string, number> | undefined,
      ...config,
    };
  }
}
