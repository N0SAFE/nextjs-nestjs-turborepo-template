/**
 * Generator Orchestrator Service
 *
 * Coordinates the file generation process across all generators.
 * Supports guards, CLI commands, and multi-plugin file contributions.
 */
import { Injectable } from "@nestjs/common";
import { FileSystemService } from "../io/file-system.service";
import { LoggerService } from "../io/logger.service";
import { SpinnerService } from "../io/spinner.service";
import { TemplateService } from "./template.service";
import { PluginResolverService } from "../plugin/plugin-resolver.service";
import { GuardService } from "../guard";
import { CLICommandRunnerService } from "../cli";
import { FileMergerService } from "./file-merger.service";
import type {
  GeneratorContext,
  GeneratorResult,
  ScaffoldResult,
  FileSpec,
  DependencySpec,
  ScriptSpec,
  TemplateData,
  FileContribution,
  GuardSpec,
  GuardResult,
  CLICommandSpec,
  CLICommandResult,
} from "../../types/generator.types";
import type { ResolvedProjectConfig } from "../../types/config.types";
import { GeneratorError } from "../../types/errors.types";
import { getGeneratorByPluginId } from "./generators/generator-collection";
import { BaseGenerator } from "./base/base.generator";

// Cache for instantiated generators
const generatorCache = new Map<string, BaseGenerator>();

/**
 * Options for scaffold execution
 */
export interface ScaffoldOptions {
  /** Output directory path */
  outputPath: string;
  /** Whether this is a dry run (no files written) */
  dryRun?: boolean;
  /** Whether to skip confirmation prompts */
  skipPrompts?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
}

@Injectable()
export class GeneratorOrchestratorService {
  constructor(
    private readonly fs: FileSystemService,
    private readonly logger: LoggerService,
    private readonly spinner: SpinnerService,
    private readonly template: TemplateService,
    private readonly pluginResolver: PluginResolverService,
    private readonly guardService: GuardService,
    private readonly cliRunner: CLICommandRunnerService,
    private readonly fileMerger: FileMergerService,
  ) {}

  /**
   * Execute full project scaffolding
   */
  async scaffold(
    config: ResolvedProjectConfig,
    options: ScaffoldOptions,
  ): Promise<ScaffoldResult> {
    const startTime = Date.now();
    const outputPath = options.outputPath;
    const dryRun = options.dryRun ?? false;
    const overwrite = options.overwrite ?? false;

    // Resolve plugins using the pre-computed pluginIds array
    // This already includes explicitly enabled plugins from config
    const allRequestedPlugins = [
      ...(config.pluginIds ?? []),
      ...(config.autoEnabledPlugins ?? []),
    ];
    const resolution = this.pluginResolver.autoResolve(allRequestedPlugins);
    if (!this.pluginResolver.isValid(resolution)) {
      const errorDetails = resolution.missingDependencies
        ?.map((d) => `${d.pluginId} requires ${d.dependencyId}`)
        .join(", ");
      throw new GeneratorError(
        "plugin-resolution",
        `Failed to resolve plugins: ${errorDetails ?? "unknown error"}`,
      );
    }

    // Get resolved plugin IDs (includes auto-enabled dependencies from plugin graph)
    const enabledPluginIds = [...resolution.resolved, ...resolution.autoEnabled];

    // Create generator context with contribution tracking
    const context: GeneratorContext = {
      projectConfig: config,
      enabledPlugins: enabledPluginIds,
      outputPath,
      dryRun,
      skipPrompts: options.skipPrompts ?? false,
      verbose: options.verbose ?? false,
      existingContributions: new Map(),
      guardResults: [],
    };

    // Initialize result with new fields
    const result: ScaffoldResult = {
      success: true,
      outputPath,
      projectName: config.name,
      results: [],
      filesCreated: 0,
      filesModified: 0,
      filesSkipped: 0,
      allDependencies: [],
      allScripts: [],
      postCommands: [],
      warnings: [],
      totalDuration: 0,
      completedAt: new Date(),
      cliCommandResults: [],
      guardResults: [],
    };

    // Collect all contributions for later merging
    const allContributions: FileContribution[] = [];
    const allCLICommands: CLICommandSpec[] = [];
    const allGuards: GuardSpec[] = [];

    try {
      // Create output directory
      if (!dryRun) {
        await this.fs.ensureDir(outputPath);
      }

      // Phase 1: Run pre-scaffold guards (before any generation)
      this.spinner.start("Running pre-scaffold checks...");
      const preGuards = this.getPreScaffoldGuards(config);
      if (preGuards.length > 0) {
        const preGuardCheckResult = await this.guardService.runGuards(preGuards, {
          projectPath: outputPath,
          enabledPlugins: enabledPluginIds,
          packageManager: config.packageManager,
        });
        result.guardResults?.push(...preGuardCheckResult.results);
        context.guardResults?.push(...preGuardCheckResult.results);

        if (!preGuardCheckResult.passed && preGuardCheckResult.hasBlocking) {
          const failedRequired = preGuardCheckResult.results.filter(
            (g) => !g.passed && !g.optional
          );
          const failedMsg = failedRequired
            .map((g) => `${g.id}: ${g.message}`)
            .join("; ");
          throw new GeneratorError("guard-failed", `Pre-scaffold guards failed: ${failedMsg}`);
        }
      }
      this.spinner.succeed("Pre-scaffold checks passed");

      // Phase 2: Collect contributions from all plugins
      for (const pluginId of enabledPluginIds) {
        this.spinner.start(`Collecting ${pluginId} contributions...`);

        const pluginResult = await this.collectPluginContributions(pluginId, context);
        result.results.push(pluginResult);

        // Collect contributions, CLI commands, guards
        if (pluginResult.contributions) {
          allContributions.push(...pluginResult.contributions);
          // Update context so later plugins can see existing contributions
          for (const contrib of pluginResult.contributions) {
            const existing = context.existingContributions?.get(contrib.path) || [];
            existing.push(contrib);
            context.existingContributions?.set(contrib.path, existing);
          }
        }
        if (pluginResult.cliCommands) {
          allCLICommands.push(...pluginResult.cliCommands);
        }
        if (pluginResult.guards) {
          allGuards.push(...pluginResult.guards);
        }

        // Collect dependencies, scripts, commands
        if (pluginResult.dependencies) {
          result.allDependencies.push(...pluginResult.dependencies);
        }
        if (pluginResult.scripts) {
          result.allScripts.push(...pluginResult.scripts);
        }
        if (pluginResult.postCommands) {
          result.postCommands.push(...pluginResult.postCommands);
        }
        if (pluginResult.warnings) {
          result.warnings.push(...pluginResult.warnings);
        }

        this.spinner.succeed(`${pluginId} contributions collected`);
      }

      // Phase 3: Run plugin guards
      if (allGuards.length > 0) {
        this.spinner.start("Running plugin guards...");
        const pluginGuardCheckResult = await this.guardService.runGuards(allGuards, {
          projectPath: outputPath,
          enabledPlugins: enabledPluginIds,
          packageManager: config.packageManager,
        });
        result.guardResults?.push(...pluginGuardCheckResult.results);

        if (!pluginGuardCheckResult.passed && pluginGuardCheckResult.hasBlocking) {
          const failedRequired = pluginGuardCheckResult.results.filter(
            (g) => !g.passed && !g.optional
          );
          const failedMsg = failedRequired
            .map((g) => `${g.id}: ${g.message}`)
            .join("; ");
          throw new GeneratorError("guard-failed", `Plugin guards failed: ${failedMsg}`);
        }
        this.spinner.succeed("Plugin guards passed");
      }

      // Phase 4: Execute CLI commands (shadcn init, etc.)
      if (allCLICommands.length > 0 && !dryRun) {
        this.spinner.start("Running scaffolding commands...");
        const cliResults = await this.cliRunner.runCommands(allCLICommands, {
          cwd: outputPath,
          env: process.env,
          packageManager: config.packageManager,
        });
        result.cliCommandResults?.push(...cliResults);

        const failedRequired = cliResults.filter((c) => !c.success && !c.skipped);
        if (failedRequired.length > 0) {
          const failedMsg = failedRequired
            .map((c) => `${c.command}: ${c.error}`)
            .join("; ");
          result.warnings.push(`Some CLI commands failed: ${failedMsg}`);
        }
        this.spinner.succeed("Scaffolding commands completed");
      }

      // Phase 5: Merge and write file contributions
      this.spinner.start("Merging file contributions...");
      const grouped = this.fileMerger.groupByPath(allContributions);

      for (const [filePath, contributions] of grouped) {
        const fullPath = this.fs.join(outputPath, filePath);
        const exists = await this.fs.exists(fullPath);
        const existingContent = exists ? await this.fs.readFile(fullPath) : undefined;

        // Merge contributions
        const mergeResult = await this.fileMerger.mergeContributions(
          contributions,
          existingContent
        );

        if (!mergeResult.success) {
          result.warnings.push(
            `Merge issues for ${filePath}: ${mergeResult.errors?.join(", ")}`
          );
        }

        // Write file
        if (!dryRun) {
          await this.fs.writeFile(fullPath, mergeResult.content);
        }

        // Track file operation
        const operation = exists ? "modify" : "create";
        if (operation === "create") {
          result.filesCreated += 1;
        } else {
          result.filesModified += 1;
        }
      }
      this.spinner.succeed("File contributions merged");

      // Phase 6: Generate core project files
      this.spinner.start("Generating core project files...");
      const coreResult = await this.generateCoreFiles(context, overwrite);
      result.results.push(coreResult);

      result.filesCreated += coreResult.files.filter(
        (f) => f.operation === "create",
      ).length;
      result.filesModified += coreResult.files.filter(
        (f) => f.operation === "modify",
      ).length;
      result.filesSkipped += coreResult.files.filter(
        (f) => f.operation === "skip",
      ).length;

      if (coreResult.dependencies) {
        result.allDependencies.push(...coreResult.dependencies);
      }
      if (coreResult.scripts) {
        result.allScripts.push(...coreResult.scripts);
      }
      this.spinner.succeed("Core project files generated");

      // Phase 7: Generate package.json
      if (!dryRun) {
        this.spinner.start("Generating package.json...");
        await this.generatePackageJson(context, result.allDependencies, result.allScripts);
        result.filesCreated += 1;
        this.spinner.succeed("package.json generated");
      }

      result.totalDuration = Date.now() - startTime;
      result.completedAt = new Date();
    } catch (error) {
      result.success = false;
      result.warnings.push(
        error instanceof Error ? error.message : String(error),
      );
      this.spinner.fail("Generation failed");
    }

    return result;
  }

  /**
   * Collect contributions from a specific plugin (without writing files)
   */
  private async collectPluginContributions(
    pluginId: string,
    context: GeneratorContext,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const result: GeneratorResult = {
      pluginId,
      success: true,
      files: [],
      dependencies: [],
      scripts: [],
      postCommands: [],
      warnings: [],
      contributions: [],
      cliCommands: [],
      guards: [],
    };

    try {
      // Get plugin generator (would be loaded dynamically in full implementation)
      const fileSpecs = this.getPluginFiles(pluginId, context);
      const deps = this.getPluginDependencies(pluginId, context);
      const scripts = this.getPluginScripts(pluginId, context);
      const cliCommands = this.getPluginCLICommands(pluginId, context);
      const guards = this.getPluginGuards(pluginId, context);

      // Convert file specs to contributions
      for (const file of fileSpecs) {
        const content = file.template
          ? this.template.render(file.template, this.createTemplateData(context))
          : file.content ?? "";

        const contribution: FileContribution = {
          pluginId,
          path: file.path,
          content,
          mergeStrategy: file.mergeStrategy || this.fileMerger.getDefaultMergeStrategy(file.path),
          priority: file.priority ?? this.getPluginPriority(pluginId),
          marker: file.marker,
          section: file.section,
          astTransform: file.astTransform,
          condition: file.condition,
          skipIfExists: file.skipIfExists,
        };

        // Check condition if specified
        if (contribution.condition) {
          const conditionMet = this.evaluateCondition(contribution.condition, context);
          if (!conditionMet) {
            continue;
          }
        }

        result.contributions?.push(contribution);
        result.files.push({
          ...file,
          operation: "pending", // Will be determined during merge phase
        });
      }

      result.dependencies = deps;
      result.scripts = scripts;
      result.cliCommands = cliCommands;
      result.guards = guards;
      result.duration = Date.now() - startTime;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Get pre-scaffold guards (runs before any generation)
   */
  private getPreScaffoldGuards(_config: ResolvedProjectConfig): GuardSpec[] {
    // These run before scaffolding starts
    const commonGuards = this.guardService.createCommonGuards();
    const nodeGuard = commonGuards.nodeVersion;
    if (!nodeGuard) {
      return [];
    }
    return [
      {
        id: "pre-scaffold-node-version",
        type: nodeGuard.type,
        name: nodeGuard.name,
        description: nodeGuard.description,
        config: nodeGuard.config,
        blocking: nodeGuard.blocking,
      },
    ];
  }

  /**
   * Get CLI commands for a plugin
   */
  private getPluginCLICommands(pluginId: string, context: GeneratorContext): CLICommandSpec[] {
    const commands: CLICommandSpec[] = [];

    // Example: shadcn init for UI plugins
    if (pluginId === "shadcn" && context.enabledPlugins.includes("nextjs")) {
      commands.push(
        this.cliRunner.createShadcnCommand("init", {
          style: "default",
          baseColor: "slate",
          cssVariables: true,
        })
      );
    }

    // Example: prisma init for prisma plugin
    if (pluginId === "prisma") {
      commands.push(
        this.cliRunner.createPrismaCommand("init", {
          provider: "postgresql",
        })
      );
    }

    // Example: drizzle-kit for drizzle plugin
    if (pluginId === "drizzle") {
      commands.push(
        this.cliRunner.createDrizzleCommand("generate", {
          config: "./drizzle.config.ts",
        })
      );
    }

    return commands;
  }

  /**
   * Get guards for a plugin
   */
  private getPluginGuards(pluginId: string, _context: GeneratorContext): GuardSpec[] {
    const guards: GuardSpec[] = [];

    // Example guards for specific plugins
    if (pluginId === "nextjs") {
      guards.push({
        id: `${pluginId}-node-version`,
        type: "version",
        name: "Node.js Version Check",
        config: {
          type: "version",
          tool: "node",
          minVersion: "20.0.0",
        },
        message: "Next.js requires Node.js 20+",
        optional: false,
      });
    }

    if (pluginId === "docker") {
      guards.push({
        id: `${pluginId}-docker-available`,
        type: "command",
        name: "Docker Availability Check",
        config: {
          type: "command",
          command: "docker",
          args: ["--version"],
        },
        message: "Docker is required for docker plugin",
        optional: true, // Optional - can scaffold without docker installed
      });
    }

    return guards;
  }

  /**
   * Get plugin priority (lower = processed first)
   */
  private getPluginPriority(pluginId: string): number {
    const priorities: Record<string, number> = {
      // Core plugins first
      typescript: 10,
      eslint: 20,
      prettier: 30,

      // Framework plugins
      nextjs: 100,
      nestjs: 100,
      react: 110,

      // Database plugins
      drizzle: 200,
      prisma: 200,
      postgresql: 210,

      // Feature plugins
      "better-auth": 300,
      orpc: 310,
      "tanstack-query": 320,

      // UI plugins
      tailwindcss: 400,
      shadcn: 410,

      // Infrastructure plugins
      docker: 500,
      "github-actions": 510,

      // Documentation
      fumadocs: 600,
    };

    return priorities[pluginId] ?? 1000;
  }

  /**
   * Evaluate a condition string
   */
  private evaluateCondition(condition: string, context: GeneratorContext): boolean {
    // Simple condition evaluation
    // Format: "has:pluginId" or "!has:pluginId"
    if (condition.startsWith("has:")) {
      const pluginId = condition.slice(4);
      return context.enabledPlugins.includes(pluginId);
    }
    if (condition.startsWith("!has:")) {
      const pluginId = condition.slice(5);
      return !context.enabledPlugins.includes(pluginId);
    }

    // Default: true
    return true;
  }

  /**
   * Generate files for a specific plugin
   */
  private async generateForPlugin(
    pluginId: string,
    context: GeneratorContext,
    overwrite: boolean,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const result: GeneratorResult = {
      pluginId,
      success: true,
      files: [],
      dependencies: [],
      scripts: [],
      postCommands: [],
      warnings: [],
    };

    try {
      // Get plugin generator (would be loaded dynamically in full implementation)
      const fileSpecs = this.getPluginFiles(pluginId, context);
      const deps = this.getPluginDependencies(pluginId, context);
      const scripts = this.getPluginScripts(pluginId, context);

      // Process files
      for (const file of fileSpecs) {
        const filePath = this.fs.join(context.outputPath, file.path);
        const exists = await this.fs.exists(filePath);

        if (exists && !overwrite && file.operation !== "modify") {
          result.files.push({
            ...file,
            operation: "skip",
            skipReason: "File exists and overwrite is disabled",
          });
          continue;
        }

        if (!context.dryRun) {
          const content = file.template
            ? this.template.render(file.template, this.createTemplateData(context))
            : file.content ?? "";

          await this.fs.writeFile(filePath, content);
        }

        result.files.push({
          ...file,
          operation: exists ? "modify" : "create",
        });
      }

      result.dependencies = deps;
      result.scripts = scripts;
      result.duration = Date.now() - startTime;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Generate core project files (not plugin-specific)
   */
  private async generateCoreFiles(
    context: GeneratorContext,
    overwrite: boolean,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const result: GeneratorResult = {
      pluginId: "core",
      success: true,
      files: [],
      dependencies: [],
      scripts: [],
      warnings: [],
    };

    const coreFileSpecs: Array<{ path: string; template?: string; content?: string }> = [
      {
        path: ".gitignore",
        content: this.getGitignoreContent(),
      },
      {
        path: "README.md",
        template: this.getReadmeTemplate(),
      },
      {
        path: ".env.example",
        template: this.getEnvExampleTemplate(),
      },
    ];

    try {
      for (const spec of coreFileSpecs) {
        const filePath = this.fs.join(context.outputPath, spec.path);
        const exists = await this.fs.exists(filePath);

        if (exists && !overwrite) {
          result.files.push({
            path: spec.path,
            operation: "skip",
            skipReason: "File exists and overwrite is disabled",
          });
          continue;
        }

        if (!context.dryRun) {
          const content = spec.template
            ? this.template.render(spec.template, this.createTemplateData(context))
            : spec.content ?? "";

          await this.fs.writeFile(filePath, content);
        }

        result.files.push({
          path: spec.path,
          operation: exists ? "modify" : "create",
          content: spec.content,
          template: spec.template,
        });
      }

      result.duration = Date.now() - startTime;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Generate package.json file
   */
  private async generatePackageJson(
    context: GeneratorContext,
    dependencies: DependencySpec[],
    scripts: ScriptSpec[],
  ): Promise<void> {
    const deps: Record<string, string> = {};
    const devDeps: Record<string, string> = {};
    const peerDeps: Record<string, string> = {};

    for (const dep of dependencies) {
      switch (dep.type) {
        case "prod":
          deps[dep.name] = dep.version;
          break;
        case "dev":
          devDeps[dep.name] = dep.version;
          break;
        case "peer":
          peerDeps[dep.name] = dep.version;
          break;
      }
    }

    const projectConfig = context.projectConfig;
    const packageJson = {
      name: projectConfig.name,
      version: "0.1.0",
      private: true,
      scripts: Object.fromEntries(scripts.map((s) => [s.name, s.command])),
      dependencies: deps,
      devDependencies: devDeps,
      ...(Object.keys(peerDeps).length > 0 && { peerDependencies: peerDeps }),
    };

    const filePath = this.fs.join(context.outputPath, "package.json");
    await this.fs.writeJson(filePath, packageJson, { spaces: 2 });
  }

  /**
   * Create template data from context
   */
  private createTemplateData(context: GeneratorContext): TemplateData {
    const projectConfig = context.projectConfig;
    return {
      project: projectConfig,
      enabledPlugins: context.enabledPlugins,
      has: {
        auth: context.enabledPlugins.includes("better-auth"),
        database: context.enabledPlugins.some((p) =>
          ["postgresql", "mysql", "sqlite", "mongodb", "drizzle"].includes(p),
        ),
        redis: context.enabledPlugins.includes("redis"),
        docker: context.enabledPlugins.includes("docker"),
        testing: context.enabledPlugins.some((p) =>
          ["vitest", "jest", "playwright"].includes(p),
        ),
        ci: context.enabledPlugins.includes("github-actions"),
        docs: context.enabledPlugins.includes("fumadocs"),
        api: context.enabledPlugins.includes("nestjs"),
        web: context.enabledPlugins.includes("nextjs"),
      },
      versions: this.getVersions(context.enabledPlugins),
    };
  }

  /**
   * Get version map for enabled plugins
   */
  private getVersions(enabledPlugins: string[]): Record<string, string> {
    const versionMap: Record<string, string> = {
      typescript: "^5.0.0",
      eslint: "^9.0.0",
      prettier: "^3.0.0",
      vitest: "^2.0.0",
      zod: "^3.23.0",
      tailwindcss: "^4.0.0",
      nextjs: "^15.0.0",
      nestjs: "^10.0.0",
      react: "^19.0.0",
      drizzle: "^0.40.0",
      "better-auth": "^1.3.0",
      orpc: "^1.7.0",
      "tanstack-query": "^5.0.0",
    };

    const versions: Record<string, string> = {};
    for (const plugin of enabledPlugins) {
      if (versionMap[plugin]) {
        versions[plugin] = versionMap[plugin];
      }
    }
    return versions;
  }

  /**
   * Get plugin files using actual generator implementations
   */
  private getPluginFiles(pluginId: string, context: GeneratorContext): FileSpec[] {
    // Get the generator class for this plugin
    const GeneratorClass = getGeneratorByPluginId(pluginId);
    if (!GeneratorClass) {
      // Plugin doesn't have a generator - return empty (e.g., some plugins only add deps)
      return [];
    }

    // Check cache first
    let generator = generatorCache.get(pluginId);
    if (!generator) {
      // Instantiate generator with dependencies
      // Note: In production, this should use proper DI, but for now we manually wire
      generator = new (GeneratorClass as new (fs: FileSystemService, template: TemplateService) => BaseGenerator)(
        this.fs,
        this.template,
      );
      generatorCache.set(pluginId, generator);
    }

    // Call the generator's getFiles method
    // Access protected method via type assertion
    const getFilesMethod = (generator as unknown as { getFiles(ctx: GeneratorContext): FileSpec[] }).getFiles;
    if (typeof getFilesMethod === 'function') {
      return getFilesMethod.call(generator, context);
    }

    return [];
  }

  /**
   * Get plugin dependencies using actual generator implementations
   */
  private getPluginDependencies(pluginId: string, context?: GeneratorContext): DependencySpec[] {
    // Get the generator class for this plugin
    const GeneratorClass = getGeneratorByPluginId(pluginId);
    if (!GeneratorClass) {
      // Fallback to hardcoded map for plugins without generators
      const depMap: Record<string, DependencySpec[]> = {
        typescript: [
          { name: "typescript", version: "^5.0.0", type: "dev" },
          { name: "@types/node", version: "^20.0.0", type: "dev" },
        ],
        eslint: [
          { name: "eslint", version: "^9.0.0", type: "dev" },
          { name: "@eslint/js", version: "^9.0.0", type: "dev" },
        ],
        prettier: [{ name: "prettier", version: "^3.0.0", type: "dev" }],
        vitest: [
          { name: "vitest", version: "^2.0.0", type: "dev" },
          { name: "@vitest/coverage-v8", version: "^2.0.0", type: "dev" },
        ],
        zod: [{ name: "zod", version: "^3.23.0", type: "prod" }],
        tailwindcss: [{ name: "tailwindcss", version: "^4.0.0", type: "dev" }],
      };
      return depMap[pluginId] ?? [];
    }

    // Get cached generator
    let generator = generatorCache.get(pluginId);
    if (!generator) {
      generator = new (GeneratorClass as new (fs: FileSystemService, template: TemplateService) => BaseGenerator)(
        this.fs,
        this.template,
      );
      generatorCache.set(pluginId, generator);
    }

    // Call the generator's getDependencies method if context provided
    if (context) {
      const getDepsMethod = (generator as unknown as { getDependencies(ctx: GeneratorContext): DependencySpec[] }).getDependencies;
      if (typeof getDepsMethod === 'function') {
        return getDepsMethod.call(generator, context);
      }
    }

    return [];
  }

  /**
   * Get plugin scripts using actual generator implementations
   */
  private getPluginScripts(pluginId: string, context?: GeneratorContext): ScriptSpec[] {
    // Get the generator class for this plugin
    const GeneratorClass = getGeneratorByPluginId(pluginId);
    if (!GeneratorClass) {
      // Fallback to hardcoded map for plugins without generators
      const scriptMap: Record<string, ScriptSpec[]> = {
        typescript: [{ name: "type-check", command: "tsc --noEmit" }],
        eslint: [
          { name: "lint", command: "eslint ." },
          { name: "lint:fix", command: "eslint . --fix" },
        ],
        prettier: [
          { name: "format", command: "prettier --write ." },
          { name: "format:check", command: "prettier --check ." },
        ],
        vitest: [
          { name: "test", command: "vitest" },
          { name: "test:coverage", command: "vitest --coverage" },
        ],
      };
      return scriptMap[pluginId] ?? [];
    }

    // Get cached generator
    let generator = generatorCache.get(pluginId);
    if (!generator) {
      generator = new (GeneratorClass as new (fs: FileSystemService, template: TemplateService) => BaseGenerator)(
        this.fs,
        this.template,
      );
      generatorCache.set(pluginId, generator);
    }

    // Call the generator's getScripts method if context provided
    if (context) {
      const getScriptsMethod = (generator as unknown as { getScripts(ctx: GeneratorContext): ScriptSpec[] }).getScripts;
      if (typeof getScriptsMethod === 'function') {
        return getScriptsMethod.call(generator, context);
      }
    }

    return [];
  }

  /**
   * Get .gitignore content
   */
  private getGitignoreContent(): string {
    return `# Dependencies
node_modules/
.pnp/
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Turbo
.turbo/

# Docker
.docker/
`;
  }

  /**
   * Get README template
   */
  private getReadmeTemplate(): string {
    return `# {{project.name}}

{{#if project.description}}
{{project.description}}
{{/if}}

## Getting Started

### Prerequisites

- Node.js 20+
- {{project.packageManager}} (package manager)

### Installation

\`\`\`bash
{{#eq project.packageManager "npm"}}npm install{{/eq}}
{{#eq project.packageManager "yarn"}}yarn{{/eq}}
{{#eq project.packageManager "pnpm"}}pnpm install{{/eq}}
{{#eq project.packageManager "bun"}}bun install{{/eq}}
\`\`\`

### Development

\`\`\`bash
{{#eq project.packageManager "npm"}}npm run dev{{/eq}}
{{#eq project.packageManager "yarn"}}yarn dev{{/eq}}
{{#eq project.packageManager "pnpm"}}pnpm dev{{/eq}}
{{#eq project.packageManager "bun"}}bun run dev{{/eq}}
\`\`\`

## Project Structure

\`\`\`
{{project.name}}/
├── apps/           # Applications
├── packages/       # Shared packages
└── ...
\`\`\`

## License

{{#if project.license}}{{project.license}}{{else}}MIT{{/if}}
`;
  }

  /**
   * Get .env.example template
   */
  private getEnvExampleTemplate(): string {
    return `# {{project.name}} Environment Variables

# Application
NODE_ENV=development

{{#if has.database}}
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:{{project.ports.db}}/{{kebabCase project.name}}
{{/if}}

{{#if has.redis}}
# Redis
REDIS_URL=redis://localhost:{{project.ports.redis}}
{{/if}}

{{#if project.ports.api}}
# API
API_PORT={{project.ports.api}}
{{/if}}

{{#if project.ports.web}}
# Web
WEB_PORT={{project.ports.web}}
{{/if}}
`;
  }
}
