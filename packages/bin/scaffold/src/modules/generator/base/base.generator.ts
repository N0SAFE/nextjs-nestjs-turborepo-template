/**
 * Base Generator
 *
 * Abstract base class for all generators providing common functionality.
 */
import { Injectable } from "@nestjs/common";
import { FileSystemService } from "../../io/file-system.service";
import { TemplateService } from "../template.service";
import type {
  GeneratorContext,
  GeneratorResult,
  FileSpec,
  DependencySpec,
  ScriptSpec,
  PostCommand,
  GeneratorMetadata,
  TemplateData,
} from "../../../types/generator.types";
import { GeneratorError } from "../../../types/errors.types";

@Injectable()
export class BaseGenerator {
  protected metadata: GeneratorMetadata = {
    pluginId: "base",
    priority: 0,
    version: "1.0.0",
    description: "Base generator providing common functionality",
  };

  constructor(
    protected readonly fs: FileSystemService,
    protected readonly template: TemplateService,
  ) {}

  /**
   * Get generator metadata
   */
  getMetadata(): GeneratorMetadata {
    return this.metadata;
  }

  /**
   * Generate files (to be overridden by subclasses)
   */
  async generate(context: GeneratorContext): Promise<GeneratorResult> {
    const startTime = Date.now();
    const files: FileSpec[] = [];
    const warnings: string[] = [];

    const fileSpecs = this.getFiles(context);

    for (const file of fileSpecs) {
      try {
        const processed = await this.processFile(file, context);
        files.push(processed);
      } catch (error) {
        throw new GeneratorError(
          this.metadata.pluginId,
          `Failed to process file ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return {
      pluginId: this.metadata.pluginId,
      success: true,
      files,
      dependencies: this.getDependencies(context),
      scripts: this.getScripts(context),
      postCommands: this.getPostCommands(context),
      warnings,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Get files to generate (override in subclasses)
   */
  protected getFiles(_context: GeneratorContext): FileSpec[] {
    return [];
  }

  /**
   * Get dependencies to add (override in subclasses)
   */
  protected getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [];
  }

  /**
   * Get scripts to add (override in subclasses)
   */
  protected getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [];
  }

  /**
   * Get post-generation commands (override in subclasses)
   */
  protected getPostCommands(_context: GeneratorContext): PostCommand[] {
    return [];
  }

  /**
   * Process a single file spec
   */
  protected async processFile(
    file: FileSpec,
    context: GeneratorContext,
  ): Promise<FileSpec> {
    const fullPath = this.fs.join(context.outputPath, file.path);
    const exists = await this.fs.exists(fullPath);

    // Determine operation based on existence and overwrite setting
    let operation = file.operation;
    if (exists && operation === "create" && !file.overwrite) {
      return {
        ...file,
        operation: "skip",
        skipReason: "File already exists",
      };
    }

    if (context.dryRun) {
      return {
        ...file,
        operation: exists ? "modify" : "create",
      };
    }

    // Get content
    let content: string;
    if (file.template) {
      const templateData = this.createTemplateData(context, file);
      content = this.template.render(file.template, templateData);
    } else if (file.content !== undefined) {
      content = file.content;
    } else {
      throw new GeneratorError(
        this.metadata.pluginId,
        `File ${file.path} has no content or template`,
      );
    }

    // Ensure directory exists and write file
    await this.fs.ensureDir(this.fs.dirname(fullPath));
    await this.fs.writeFile(fullPath, content);

    // Set permissions if specified
    if (file.permissions !== undefined) {
      // Note: chmod would be called here if needed
    }

    return {
      ...file,
      operation: exists ? "modify" : "create",
    };
  }

  /**
   * Create template data for a file
   */
  protected createTemplateData(
    context: GeneratorContext,
    _file?: FileSpec,
  ): TemplateData {
    const config = context.projectConfig;
    
    return {
      project: config,
      enabledPlugins: context.enabledPlugins,
      has: {
        auth: context.enabledPlugins.includes("better-auth"),
        database: context.enabledPlugins.includes("drizzle") || 
                  context.enabledPlugins.includes("postgres") ||
                  !!config.database,
        redis: context.enabledPlugins.includes("redis"),
        docker: context.enabledPlugins.includes("docker") || !!config.docker?.enabled,
        testing: context.enabledPlugins.includes("vitest"),
        ci: context.enabledPlugins.includes("github-actions") || !!config.ci?.enabled,
        docs: context.enabledPlugins.includes("fumadocs"),
        api: context.enabledPlugins.includes("nestjs"),
        web: context.enabledPlugins.includes("nextjs"),
      },
      versions: {
        node: "20",
        bun: "1.2.14",
        typescript: "5.x",
        nestjs: "10.x",
        nextjs: "15.x",
        react: "19.x",
      },
    };
  }

  /**
   * Check if a plugin is enabled
   */
  protected hasPlugin(context: GeneratorContext, pluginId: string): boolean {
    return context.enabledPlugins.includes(pluginId);
  }

  /**
   * Get plugin configuration value
   */
  protected getPluginConfig<T>(
    context: GeneratorContext,
    pluginId: string,
    key: string,
    defaultValue: T,
  ): T {
    const config = context.pluginConfig;
    if (config && key in config) {
      return config[key] as T;
    }
    return defaultValue;
  }

  /**
   * Add conditional file spec
   */
  protected conditionalFile(
    condition: boolean,
    file: FileSpec,
  ): FileSpec[] {
    return condition ? [file] : [];
  }

  /**
   * Add conditional dependency
   */
  protected conditionalDep(
    condition: boolean,
    dep: DependencySpec,
  ): DependencySpec[] {
    return condition ? [dep] : [];
  }

  /**
   * Create a file spec helper
   */
  protected file(
    path: string,
    content: string,
    options: Partial<FileSpec> = {},
  ): FileSpec {
    return {
      path,
      content,
      operation: "create",
      ...options,
    };
  }

  /**
   * Create a template file spec helper
   */
  protected templateFile(
    path: string,
    template: string,
    options: Partial<FileSpec> = {},
  ): FileSpec {
    return {
      path,
      template,
      operation: "create",
      ...options,
    };
  }

  /**
   * Merge JSON content
   */
  protected mergeJson(
    existing: string,
    newContent: string,
    strategy: "shallow" | "deep" = "deep",
  ): string {
    try {
      const existingObj = JSON.parse(existing);
      const newObj = JSON.parse(newContent);

      const merged =
        strategy === "deep"
          ? this.deepMerge(existingObj, newObj)
          : { ...existingObj, ...newObj };

      return JSON.stringify(merged, null, 2);
    } catch {
      return newContent;
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        this.isPlainObject(sourceValue) &&
        this.isPlainObject(targetValue)
      ) {
        result[key] = this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>,
        );
      } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        result[key] = [...targetValue, ...sourceValue];
      } else {
        result[key] = sourceValue;
      }
    }

    return result;
  }

  /**
   * Check if value is a plain object
   */
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
