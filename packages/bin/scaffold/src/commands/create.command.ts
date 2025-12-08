/**
 * Create Command
 *
 * Main command for creating new projects with scaffold CLI.
 */
import {
  Command,
  CommandRunner,
  Option,
  InquirerService,
} from "nest-commander";
import { LoggerService } from "../modules/io/logger.service";
import { PromptService } from "../modules/io/prompt.service";
import { SpinnerService } from "../modules/io/spinner.service";
import { ConfigParserService } from "../modules/config/config-parser.service";
import { ConfigValidatorService } from "../modules/config/config-validator.service";
import { PluginRegistryService } from "../modules/plugin/plugin-registry.service";
import { ProjectService } from "../modules/project/project.service";
import { AppTypeRegistryService } from "../modules/app/app-type-registry.service";
import type { ProjectConfig, PluginsConfig } from "../types/config.types";
import type { AppConfig, AppTypeId } from "../types/app.types";

interface CreateCommandOptions {
  name?: string;
  template?: string;
  config?: string;
  plugins?: string[];
  packageManager?: "bun" | "npm" | "yarn" | "pnpm";
  skipInstall?: boolean;
  skipGit?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
  yes?: boolean;
  cwd?: string;
}

@Command({
  name: "create",
  description: "Create a new project",
  arguments: "[project-name]",
})
export class CreateCommand extends CommandRunner {
  private readonly appTypeRegistry: AppTypeRegistryService;

  constructor(
    private readonly logger: LoggerService,
    private readonly prompt: PromptService,
    private readonly spinner: SpinnerService,
    private readonly configParser: ConfigParserService,
    private readonly configValidator: ConfigValidatorService,
    private readonly pluginRegistry: PluginRegistryService,
    private readonly projectService: ProjectService,
    private readonly inquirerService: InquirerService,
  ) {
    super();
    this.appTypeRegistry = AppTypeRegistryService.getInstance();
  }

  async run(
    passedParams: string[],
    options: CreateCommandOptions,
  ): Promise<void> {
    const projectName = passedParams[0] || options.name;

    this.logger.box("🚀 Scaffold CLI - Create Project", { title: "Welcome" });
    this.logger.newline();

    try {
      // Load config from file if provided
      let config: Partial<ProjectConfig> = {};
      if (options.config) {
        this.logger.info(`Loading configuration from ${options.config}...`);
        config = await this.configParser.loadFromFile(options.config);
      }

      // Interactive mode if not skipped and no config file
      if (!options.yes && !options.config) {
        config = await this.runInteractiveSetup(config, projectName);
      } else {
        // Apply CLI options to config
        config = this.applyCliOptions(config, options, projectName);
      }

      // Ensure name is set
      if (!config.name && !config.projectName) {
        config.name = await this.promptProjectName();
      }

      // Validate configuration
      const validationResult = await this.configValidator.validateAsync(
        config as ProjectConfig
      );
      if (!validationResult.valid) {
        this.logger.error("Configuration validation failed:");
        for (const error of validationResult.errors) {
          this.logger.error(`  - ${error}`);
        }
        process.exit(1);
      }

      // Create project
      const result = await this.projectService.create({
        config: config as ProjectConfig,
        dryRun: options.dryRun,
        overwrite: options.overwrite,
        skipInstall: options.skipInstall,
        skipGit: options.skipGit,
        interactive: !options.yes,
      });

      // Show results
      this.logger.newline();
      if (result.success) {
        this.logger.success("✨ Project created successfully!");
        this.logger.newline();
        this.logger.keyValue("Location", result.projectPath);
        this.logger.keyValue("Files created", String(result.filesCreated));
        this.logger.keyValue(
          "Dependencies installed",
          result.dependenciesInstalled ? "Yes" : "No",
        );
        this.logger.keyValue(
          "Git initialized",
          result.gitInitialized ? "Yes" : "No",
        );

        // Show next steps
        this.logger.newline();
        this.logger.header("Next steps:");
        this.logger.info(`cd ${result.projectPath}`);
        if (!result.dependenciesInstalled) {
          this.logger.info("bun install");
        }
        this.logger.info("bun run dev");
      } else {
        this.logger.error("Project creation failed");
        for (const warning of result.warnings) {
          this.logger.warn(warning);
        }
        process.exit(1);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create project: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  }

  /**
   * Run interactive setup wizard
   */
  private async runInteractiveSetup(
    config: Partial<ProjectConfig>,
    initialName?: string,
  ): Promise<Partial<ProjectConfig>> {
    const result: Partial<ProjectConfig> = { ...config };

    // Project name
    if (!result.name && !result.projectName) {
      result.name = await this.promptProjectName(initialName);
    }

    // Description
    if (!result.description) {
      result.description = await this.prompt.text("Project description:", {
        initial: "A new scaffold project",
      });
    }

    // Package manager
    if (!result.packageManager) {
      result.packageManager = (await this.prompt.select(
        "Package manager:",
        [
          { title: "Bun (recommended)", value: "bun" },
          { title: "pnpm", value: "pnpm" },
          { title: "npm", value: "npm" },
          { title: "yarn", value: "yarn" },
        ],
        { initial: 0 },
      )) as "bun" | "npm" | "yarn" | "pnpm";
    }

    // Ask if user wants multi-app or single-app setup
    const setupMode = await this.prompt.select(
      "Project structure:",
      [
        { title: "Multi-app (monorepo with multiple apps)", value: "multi" },
        { title: "Single-app (simple project structure)", value: "single" },
      ],
      { initial: 0 },
    );

    if (setupMode === "multi") {
      // Multi-app configuration with per-app plugins
      result.apps = await this.promptForApps();
      
      // Collect unique plugins from all apps for project-level reference
      const allPluginsSet = new Set<string>();
      for (const app of result.apps) {
        // Support both array and object plugin formats during collection
        const appPlugins = Array.isArray(app.plugins) 
          ? app.plugins 
          : Object.keys(app.plugins);
        for (const plugin of appPlugins) {
          allPluginsSet.add(plugin);
        }
      }
      // Convert to object format { pluginId: true }
      result.plugins = Object.fromEntries(
        Array.from(allPluginsSet).map(p => [p, true])
      );
    } else {
      // Single-app mode - legacy behavior with project-level plugins
      const availablePlugins = this.pluginRegistry.getAll();
      const pluginChoices = availablePlugins.map((p) => ({
        title: `${p.name} - ${p.description}`,
        value: p.id,
        selected: p.id === "base-template" || p.id === "typescript",
      }));

      const selectedPlugins = await this.prompt.multiselect(
        "Select features to enable:",
        pluginChoices,
      );

      // Convert plugins array to object format { pluginId: true }
      result.plugins = Object.fromEntries(
        selectedPlugins.map(p => [p, true])
      );
    }

    // Database selection if relevant plugin selected
    // Check if any db-related plugins are enabled (plugins are now object format)
    const dbPlugins = ["drizzle", "postgresql", "mysql"];
    const projectPluginKeys = result.plugins ? Object.keys(result.plugins) : [];
    const hasDbPlugin = projectPluginKeys.some(p => dbPlugins.includes(p)) || 
      result.apps?.some(app => {
        const appPluginKeys = Array.isArray(app.plugins) 
          ? app.plugins 
          : Object.keys(app.plugins);
        return appPluginKeys.some(p => dbPlugins.includes(p));
      });
    
    if (hasDbPlugin) {
      result.database = (await this.prompt.select(
        "Database:",
        [
          { title: "PostgreSQL", value: "postgresql" },
          { title: "MySQL", value: "mysql" },
          { title: "SQLite", value: "sqlite" },
          { title: "None", value: undefined },
        ],
        { initial: 0 },
      )) as "postgresql" | "mysql" | "sqlite" | undefined;
    }

    // Docker
    const enableDocker = await this.prompt.confirm("Enable Docker support?", { initial: true });
    result.docker = { enabled: enableDocker };

    // Git
    const enableGit = await this.prompt.confirm("Initialize Git repository?", { initial: true });
    result.git = {
      enabled: enableGit,
      init: enableGit,
      defaultBranch: "main",
    };

    // CI/CD
    if (enableGit) {
      const enableCI = await this.prompt.confirm("Add GitHub Actions CI?", { initial: true });
      result.ci = {
        enabled: enableCI,
        provider: "github-actions",
      };
    }

    return result;
  }

  /**
   * Prompt for apps to create in multi-app setup
   */
  private async promptForApps(): Promise<AppConfig[]> {
    const apps: AppConfig[] = [];
    const appTypes = this.appTypeRegistry.getStable();

    // Show available app types
    this.logger.newline();
    this.logger.header("Available app types:");
    for (const appType of appTypes) {
      this.logger.info(`  • ${appType.name} - ${appType.description}`);
    }
    this.logger.newline();

    // Select which app types to create
    const appTypeChoices = appTypes.map((appType) => ({
      title: `${appType.name} - ${appType.description}`,
      value: appType.id,
      selected: appType.id === "nestjs" || appType.id === "nextjs",
    }));

    const selectedAppTypes = await this.prompt.multiselect(
      "Select app types to create:",
      appTypeChoices,
    );

    if (selectedAppTypes.length === 0) {
      this.logger.warn("No app types selected. Using default NestJS + Next.js setup.");
      selectedAppTypes.push("nestjs", "nextjs");
    }

    // Determine primary app (first selected, or ask if multiple)
    let primaryAppType: AppTypeId | undefined;
    if (selectedAppTypes.length === 1) {
      primaryAppType = selectedAppTypes[0] as AppTypeId;
    } else {
      const primaryChoices = selectedAppTypes.map((appTypeId) => {
        const appType = this.appTypeRegistry.getById(appTypeId as AppTypeId);
        return {
          title: appType?.name || appTypeId,
          value: appTypeId,
        };
      });

      primaryAppType = (await this.prompt.select(
        "Which app should be the primary app?",
        primaryChoices,
        { initial: 0 },
      )) as AppTypeId;
    }

    // Configure each selected app
    for (const appTypeId of selectedAppTypes) {
      const appConfig = await this.promptForAppConfig(
        appTypeId as AppTypeId,
        appTypeId === primaryAppType,
        apps,
      );
      apps.push(appConfig);
    }

    return apps;
  }

  /**
   * Prompt for individual app configuration
   */
  private async promptForAppConfig(
    appTypeId: AppTypeId,
    isPrimary: boolean,
    existingApps: AppConfig[],
  ): Promise<AppConfig> {
    const appType = this.appTypeRegistry.getById(appTypeId);
    if (!appType) {
      throw new Error(`Unknown app type: ${appTypeId}`);
    }

    this.logger.newline();
    this.logger.header(`Configure ${appType.name} app:`);

    // App name
    const existingNames = existingApps.map((a) => a.name);
    const defaultName = this.generateDefaultAppName(appTypeId, existingNames);
    
    const name = await this.prompt.text(`App name:`, {
      initial: defaultName,
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return "App name is required";
        }
        if (!/^[a-z][a-z0-9-]*$/.test(value)) {
          return "App name must start with a letter and contain only lowercase letters, numbers, and hyphens";
        }
        if (existingNames.includes(value)) {
          return `An app named "${value}" already exists`;
        }
        return true;
      },
    });

    // App path
    const defaultPath = appType.defaultPath || `apps/${name}`;
    const path = await this.prompt.text(`App path:`, {
      initial: defaultPath,
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return "App path is required";
        }
        return true;
      },
    });

    // Port (optional, for apps with http-server capability)
    let port: number | undefined;
    if (appType.capabilities.includes("http-server")) {
      const defaultPort = this.getDefaultPort(appTypeId, existingApps);
      const portInput = await this.prompt.text(`Port (optional):`, {
        initial: String(defaultPort),
        validate: (value: string) => {
          if (!value || value.trim().length === 0) {
            return true; // Optional
          }
          const num = parseInt(value, 10);
          if (isNaN(num) || num < 1024 || num > 65535) {
            return "Port must be between 1024 and 65535";
          }
          const existingPorts = existingApps.map((a) => a.port).filter(Boolean);
          if (existingPorts.includes(num)) {
            return `Port ${num} is already used by another app`;
          }
          return true;
        },
      });
      port = portInput ? parseInt(portInput, 10) : undefined;
    }

    // Plugins for this app type
    const supportedPlugins = appType.supportedPlugins;
    const requiredPlugins = appType.requiredPlugins || [];
    const availablePlugins = this.pluginRegistry.getAll();

    // Filter to only supported plugins
    const pluginChoices = availablePlugins
      .filter((p) => supportedPlugins.includes(p.id))
      .map((p) => ({
        title: `${p.name} - ${p.description}`,
        value: p.id,
        selected: requiredPlugins.includes(p.id) || this.isRecommendedPlugin(p.id, appTypeId),
      }));

    this.logger.newline();
    const selectedPlugins = await this.prompt.multiselect(
      `Select plugins for ${appType.name}:`,
      pluginChoices,
    );

    // Ensure required plugins are included
    const finalPlugins = [...new Set([...requiredPlugins, ...selectedPlugins])];

    // Convert plugins array to object format { pluginId: true }
    const pluginsConfig: PluginsConfig = Object.fromEntries(
      finalPlugins.map(p => [p, true])
    );

    return {
      name,
      type: appTypeId,
      path,
      plugins: pluginsConfig,
      port,
      primary: isPrimary,
    };
  }

  /**
   * Generate a default app name based on type
   */
  private generateDefaultAppName(appTypeId: AppTypeId, existingNames: string[]): string {
    const baseNames: Record<AppTypeId, string> = {
      nestjs: "api",
      nextjs: "web",
      fumadocs: "docs",
      express: "server",
      fastify: "api",
      astro: "site",
    };

    let baseName = baseNames[appTypeId] || appTypeId;
    let name = baseName;
    let counter = 1;

    while (existingNames.includes(name)) {
      name = `${baseName}-${counter}`;
      counter++;
    }

    return name;
  }

  /**
   * Get default port for an app type
   */
  private getDefaultPort(appTypeId: AppTypeId, existingApps: AppConfig[]): number {
    const defaultPorts: Record<AppTypeId, number> = {
      nestjs: 3001,
      nextjs: 3000,
      fumadocs: 3002,
      express: 3003,
      fastify: 3004,
      astro: 4321,
    };

    let port = defaultPorts[appTypeId] || 3000;
    const usedPorts = existingApps.map((a) => a.port).filter(Boolean) as number[];

    while (usedPorts.includes(port)) {
      port++;
    }

    return port;
  }

  /**
   * Check if a plugin is recommended for an app type
   */
  private isRecommendedPlugin(pluginId: string, appTypeId: AppTypeId): boolean {
    const recommendations: Record<AppTypeId, string[]> = {
      nestjs: ["typescript", "eslint", "prettier", "vitest", "drizzle", "orpc"],
      nextjs: ["typescript", "eslint", "prettier", "vitest", "tailwindcss", "shadcn-ui", "react-query"],
      fumadocs: ["typescript", "eslint", "prettier", "tailwindcss"],
      express: ["typescript", "eslint", "prettier", "vitest"],
      fastify: ["typescript", "eslint", "prettier", "vitest"],
      astro: ["typescript", "eslint", "prettier", "tailwindcss"],
    };

    return recommendations[appTypeId]?.includes(pluginId) ?? false;
  }

  /**
   * Apply CLI options to config
   */
  private applyCliOptions(
    config: Partial<ProjectConfig>,
    options: CreateCommandOptions,
    cliArg?: string,
  ): Partial<ProjectConfig> {
    const result = { ...config };

    // CLI argument is the project name
    if (cliArg && !result.name && !result.projectName) {
      result.name = cliArg;
    }

    if (options.packageManager) {
      result.packageManager = options.packageManager;
    }

    // Convert CLI plugins array to plugins object format
    if (options.plugins && options.plugins.length > 0) {
      const pluginsObj: PluginsConfig = result.plugins || {};
      for (const pluginId of options.plugins) {
        pluginsObj[pluginId] = true;
      }
      result.plugins = pluginsObj;
    }

    return result;
  }

  /**
   * Prompt for project name
   */
  private async promptProjectName(initial?: string): Promise<string> {
    return this.prompt.text("Project name:", {
      initial: initial || "my-project",
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return "Project name is required";
        }
        if (!/^[a-z0-9-_]+$/i.test(value)) {
          return "Project name can only contain letters, numbers, hyphens, and underscores";
        }
        return true;
      },
    });
  }

  @Option({
    flags: "--cwd <path>",
    description: "Target directory (defaults to current working directory)",
  })
  parseCwd(val: string): string {
    return val;
  }

  @Option({
    flags: "-n, --name <name>",
    description: "Project name",
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: "-t, --template <template>",
    description: "Template to use (e.g., nestjs-api, nextjs-web, fullstack)",
  })
  parseTemplate(val: string): string {
    return val;
  }

  @Option({
    flags: "-c, --config <path>",
    description: "Path to configuration file",
  })
  parseConfig(val: string): string {
    return val;
  }

  @Option({
    flags: "-p, --plugins <plugins...>",
    description: "Plugins to enable",
  })
  parsePlugins(val: string, previous: string[] = []): string[] {
    return [...previous, val];
  }

  @Option({
    flags: "--package-manager <pm>",
    description: "Package manager to use (bun, npm, yarn, pnpm)",
    defaultValue: "bun",
  })
  parsePackageManager(val: string): string {
    return val;
  }

  @Option({
    flags: "--skip-install",
    description: "Skip dependency installation",
  })
  parseSkipInstall(): boolean {
    return true;
  }

  @Option({
    flags: "--skip-git",
    description: "Skip git initialization",
  })
  parseSkipGit(): boolean {
    return true;
  }

  @Option({
    flags: "-d, --dry-run",
    description: "Run without making changes",
  })
  parseDryRun(): boolean {
    return true;
  }

  @Option({
    flags: "--overwrite",
    description: "Overwrite existing files",
  })
  parseOverwrite(): boolean {
    return true;
  }

  @Option({
    flags: "-y, --yes",
    description: "Skip interactive prompts",
  })
  parseYes(): boolean {
    return true;
  }
}
