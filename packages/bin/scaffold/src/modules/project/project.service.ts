/**
 * Project Service
 *
 * Main service for project creation and management operations.
 */
import { Injectable } from "@nestjs/common";
import { FileSystemService } from "../io/file-system.service";
import { LoggerService } from "../io/logger.service";
import { SpinnerService } from "../io/spinner.service";
import { ConfigParserService } from "../config/config-parser.service";
import { ConfigValidatorService } from "../config/config-validator.service";
import { GeneratorOrchestratorService } from "../generator/generator-orchestrator.service";
import { DependencyService } from "./dependency.service";
import { CommandExecutorService } from "./command-executor.service";
import type { ProjectConfig, ResolvedProjectConfig } from "../../types/config.types";
import type { ScaffoldResult } from "../../types/generator.types";
import { ProjectExistsError, ConfigValidationError } from "../../types/errors.types";

export interface CreateProjectOptions {
  /** Project configuration */
  config: ProjectConfig;
  /** Output directory (defaults to ./<name>) */
  outputPath?: string;
  /** Dry run - don't write files */
  dryRun?: boolean;
  /** Overwrite existing files */
  overwrite?: boolean;
  /** Skip dependency installation */
  skipInstall?: boolean;
  /** Skip git initialization */
  skipGit?: boolean;
  /** Interactive mode */
  interactive?: boolean;
}

export interface CreateProjectResult extends ScaffoldResult {
  /** Path to the created project */
  projectPath: string;
  /** Whether dependencies were installed */
  dependenciesInstalled: boolean;
  /** Whether git was initialized */
  gitInitialized: boolean;
}

@Injectable()
export class ProjectService {
  constructor(
    private readonly fs: FileSystemService,
    private readonly logger: LoggerService,
    private readonly spinner: SpinnerService,
    private readonly configParser: ConfigParserService,
    private readonly configValidator: ConfigValidatorService,
    private readonly generator: GeneratorOrchestratorService,
    private readonly dependencies: DependencyService,
    private readonly executor: CommandExecutorService,
  ) {}

  /**
   * Create a new project
   */
  async create(options: CreateProjectOptions): Promise<CreateProjectResult> {
    const { config, outputPath, dryRun = false, overwrite = false } = options;

    // Validate configuration
    const validationResult = await this.configValidator.validateAsync(config);
    if (!validationResult.valid) {
      throw new ConfigValidationError(validationResult.errors);
    }

    // Resolve output path
    const projectName = config.name ?? config.projectName ?? "my-project";
    const projectPath = outputPath ?? `./${projectName}`;

    // Check if project exists
    if (!dryRun && !overwrite) {
      const exists = await this.fs.exists(projectPath);
      if (exists) {
        throw new ProjectExistsError(projectPath, projectName);
      }
    }

    // Resolve configuration with defaults
    const resolvedConfig = await this.configParser.resolveConfig(config) as ResolvedProjectConfig;

    // Log project info
    this.logger.header(`Creating project: ${projectName}`);
    this.logger.newline();
    this.logger.keyValue("Location", projectPath);
    this.logger.keyValue("Package Manager", resolvedConfig.packageManager);
    this.logger.keyValue("Plugins", (resolvedConfig.pluginIds ?? []).join(", ") || "none");
    this.logger.newline();

    // Generate project files
    const scaffoldResult = await this.generator.scaffold(resolvedConfig, {
      outputPath: projectPath,
      dryRun,
      overwrite,
      skipPrompts: !options.interactive,
      verbose: false,
    });

    if (!scaffoldResult.success) {
      return {
        ...scaffoldResult,
        projectPath,
        dependenciesInstalled: false,
        gitInitialized: false,
      };
    }

    let dependenciesInstalled = false;
    let gitInitialized = false;

    // Install dependencies
    if (!dryRun && !options.skipInstall) {
      this.spinner.start("Installing dependencies...");
      try {
        await this.dependencies.install({
          cwd: projectPath,
          packageManager: resolvedConfig.packageManager,
        });
        this.spinner.succeed("Dependencies installed");
        dependenciesInstalled = true;
      } catch (error) {
        this.spinner.warn(
          `Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Initialize git
    if (!dryRun && !options.skipGit && resolvedConfig.git?.enabled !== false) {
      this.spinner.start("Initializing git repository...");
      try {
        await this.initializeGit(projectPath, resolvedConfig);
        this.spinner.succeed("Git repository initialized");
        gitInitialized = true;
      } catch (error) {
        this.spinner.warn(
          `Failed to initialize git: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Run post commands
    if (!dryRun && scaffoldResult.postCommands.length > 0) {
      this.spinner.start("Running post-generation commands...");
      for (const cmd of scaffoldResult.postCommands) {
        try {
          await this.executor.run(cmd.command, cmd.args ?? [], {
            cwd: projectPath,
          });
        } catch (error) {
          this.logger.warn(
            `Post command failed: ${cmd.command} - ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      this.spinner.succeed("Post-generation commands completed");
    }

    return {
      ...scaffoldResult,
      projectPath,
      dependenciesInstalled,
      gitInitialized,
    };
  }

  /**
   * Validate project configuration
   */
  async validate(config: ProjectConfig): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = await this.configValidator.validateAsync(config);
    const warnings: string[] = [];

    // Additional validation checks
    // Support both object-style plugins and legacy array format
    const pluginsConfig = config.plugins ?? {};
    const pluginIds = Array.isArray(pluginsConfig) 
      ? pluginsConfig 
      : Object.keys(pluginsConfig).filter(id => {
          const cfg = pluginsConfig[id as keyof typeof pluginsConfig];
          return cfg === true || (typeof cfg === 'object' && (cfg as {enabled?: boolean}).enabled !== false);
        });
    
    if (pluginIds.includes("drizzle") && !config.database) {
      warnings.push(
        "Drizzle plugin selected but no database configured - defaulting to PostgreSQL",
      );
    }

    if (pluginIds.includes("docker") && config.docker?.enabled === false) {
      warnings.push("Docker plugin selected but Docker is disabled in configuration");
    }

    return {
      valid: result.valid,
      errors: result.errors,
      warnings,
    };
  }

  /**
   * Get project info from existing project
   */
  async getInfo(projectPath: string): Promise<ProjectConfig | null> {
    const configPath = this.fs.join(projectPath, "scaffold.config.json");

    if (await this.fs.exists(configPath)) {
      const config = await this.configParser.loadFromFile(configPath);
      return config as ProjectConfig;
    }

    // Try to infer from package.json
    const packageJsonPath = this.fs.join(projectPath, "package.json");
    if (await this.fs.exists(packageJsonPath)) {
      const pkg = await this.fs.readJson<Record<string, unknown>>(packageJsonPath);
      return {
        name: pkg.name as string,
        description: pkg.description as string,
      };
    }

    return null;
  }

  /**
   * Check if a path is a valid project
   */
  async isProject(projectPath: string): Promise<boolean> {
    const packageJsonPath = this.fs.join(projectPath, "package.json");
    return this.fs.exists(packageJsonPath);
  }

  /**
   * Initialize git repository
   */
  private async initializeGit(
    projectPath: string,
    config: ResolvedProjectConfig,
  ): Promise<void> {
    // Initialize repository
    await this.executor.run("git", ["init"], { cwd: projectPath });

    // Set default branch
    const defaultBranch = config.git?.defaultBranch ?? "main";
    await this.executor.run("git", ["branch", "-M", defaultBranch], {
      cwd: projectPath,
    });

    // Initial commit
    await this.executor.run("git", ["add", "-A"], { cwd: projectPath });
    await this.executor.run(
      "git",
      ["commit", "-m", "Initial commit from scaffold"],
      { cwd: projectPath },
    );
  }
}
