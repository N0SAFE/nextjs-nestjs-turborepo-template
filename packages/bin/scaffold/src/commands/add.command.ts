/**
 * Add Command
 *
 * Command for adding plugins to an existing project.
 * Detects project configuration, validates compatibility, and applies plugin generators.
 */
import { Command, CommandRunner, Option } from "nest-commander";
import * as path from "path";
import * as fs from "fs";
import { LoggerService } from "../modules/io/logger.service";
import { SpinnerService } from "../modules/io/spinner.service";
import { PromptService } from "../modules/io/prompt.service";
import { FileSystemService } from "../modules/io/file-system.service";
import { PluginRegistryService } from "../modules/plugin/plugin-registry.service";
import { PluginResolverService } from "../modules/plugin/plugin-resolver.service";
import { getGeneratorByPluginId } from "../modules/generator/generators/generator-collection";
import type { GeneratorContext, GeneratorResult } from "../types/generator.types";
import type { ResolvedProjectConfig, PluginsConfig, PluginOptionsConfig } from "../types/config.types";

/**
 * Helper to extract plugin IDs from either array or object format
 */
function extractPluginIds(plugins: PluginsConfig | string[] | undefined): string[] {
  if (!plugins) return [];
  if (Array.isArray(plugins)) return plugins;
  return Object.keys(plugins).filter(id => {
    const val = plugins[id];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'object' && val !== null) {
      return (val as PluginOptionsConfig).enabled !== false;
    }
    return true;
  });
}

interface AddCommandOptions {
  config?: Record<string, unknown>;
  skipInstall?: boolean;
  dryRun?: boolean;
  force?: boolean;
  yes?: boolean;
}

@Command({
  name: "add",
  description: "Add a plugin to an existing project",
  arguments: "<plugin-id>",
})
export class AddCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly spinner: SpinnerService,
    private readonly prompt: PromptService,
    private readonly fileSystem: FileSystemService,
    private readonly pluginRegistry: PluginRegistryService,
    private readonly pluginResolver: PluginResolverService,
  ) {
    super();
  }

  async run(passedParams: string[], options: AddCommandOptions): Promise<void> {
    const pluginId = passedParams[0];

    if (!pluginId) {
      this.logger.error("Plugin ID is required");
      this.logger.info("Usage: scaffold add <plugin-id>");
      this.logger.info("Run 'scaffold list plugins' to see available plugins");
      process.exit(1);
    }

    this.logger.box(`🔌 Adding Plugin: ${pluginId}`, { title: "Scaffold CLI" });
    this.logger.newline();

    try {
      // 1. Detect project root and configuration
      const projectRoot = await this.detectProjectRoot();
      if (!projectRoot) {
        this.logger.error("Could not detect project root");
        this.logger.info(
          "Make sure you're in a scaffold project directory or provide --cwd"
        );
        process.exit(1);
      }
      this.logger.keyValue("Project root", projectRoot);

      // 2. Validate plugin exists
      const pluginDef = this.pluginRegistry.get(pluginId);
      if (!pluginDef) {
        this.logger.error(`Plugin '${pluginId}' not found`);
        this.logger.info("Run 'scaffold list plugins' to see available plugins");
        process.exit(1);
      }

      // 3. Check if plugin is already installed
      const existingConfig = await this.loadProjectConfig(projectRoot);
      const installedPlugins = extractPluginIds(existingConfig?.plugins);
      if (installedPlugins.includes(pluginId)) {
        this.logger.warn(`Plugin '${pluginId}' is already installed`);
        if (!options.force) {
          const proceed = await this.prompt.confirm(
            "Do you want to regenerate it?",
            { initial: false }
          );
          if (!proceed) {
            this.logger.info("Aborted");
            return;
          }
        }
      }

      // 4. Resolve dependencies
      this.spinner.start("Resolving dependencies...");
      const dependencies = this.pluginResolver.getAllDependencies(pluginId);
      const missingDeps = dependencies.filter(
        (dep) => !installedPlugins.includes(dep) && dep !== pluginId
      );
      this.spinner.stop();

      if (missingDeps.length > 0) {
        this.logger.warn(`Plugin '${pluginId}' requires: ${missingDeps.join(", ")}`);
        if (!options.yes) {
          const installDeps = await this.prompt.confirm(
            "Install missing dependencies?",
            { initial: true }
          );
          if (!installDeps) {
            this.logger.error("Cannot proceed without dependencies");
            process.exit(1);
          }
        }
      }

      // 5. Check for conflicts
      const conflictCheck = this.pluginResolver.canAdd(
        installedPlugins,
        pluginId
      );
      if (!conflictCheck.canAdd) {
        this.logger.error(`Cannot add plugin '${pluginId}': ${conflictCheck.reason}`);
        if (!options.force) {
          process.exit(1);
        }
        this.logger.warn("Proceeding anyway due to --force flag");
      }

      // 6. Confirm with user
      if (!options.yes && !options.dryRun) {
        const pluginsToInstall = [...missingDeps, pluginId];
        this.logger.newline();
        this.logger.header("Plugins to install:");
        for (const p of pluginsToInstall) {
          const pDef = this.pluginRegistry.get(p);
          this.logger.info(`  • ${p} - ${pDef?.description || "No description"}`);
        }
        this.logger.newline();

        const proceed = await this.prompt.confirm("Proceed with installation?", {
          initial: true,
        });
        if (!proceed) {
          this.logger.info("Aborted");
          return;
        }
      }

      // 7. Build context for generators - combine installed plugins with new ones
      const allPlugins = [...installedPlugins, ...missingDeps, pluginId];
      const context = this.buildGeneratorContext(
        projectRoot,
        existingConfig,
        allPlugins,
        options
      );

      // 8. Run generators for each plugin (dependencies first)
      const pluginsToRun = [...missingDeps, pluginId];
      const results: Array<{ pluginId: string; result: GeneratorResult }> = [];

      for (const pId of pluginsToRun) {
        const GeneratorClass = getGeneratorByPluginId(pId);
        if (!GeneratorClass) {
          this.logger.warn(`No generator found for plugin '${pId}', skipping`);
          continue;
        }

        this.spinner.start(`Generating ${pId}...`);
        try {
          // Instantiate generator with dependencies
          const generator = new (GeneratorClass as any)(
            this.fileSystem,
            null // template service - not needed for most operations
          );
          const result = await generator.generate(context);
          results.push({ pluginId: pId, result });
          this.spinner.stop();
          this.logger.success(`Generated ${pId}`);
        } catch (error) {
          this.spinner.stop();
          this.logger.error(
            `Failed to generate ${pId}: ${error instanceof Error ? error.message : String(error)}`
          );
          if (!options.force) {
            process.exit(1);
          }
        }
      }

      // 9. Apply results (unless dry-run)
      if (options.dryRun) {
        this.logger.newline();
        this.logger.header("Dry run - no changes made");
        this.showDryRunResults(results);
        return;
      }

      // Write files
      let filesWritten = 0;
      for (const { pluginId: pId, result } of results) {
        if (result.files) {
          for (const file of result.files) {
            if (file.content !== undefined) {
              const fullPath = path.join(projectRoot, file.path);
              await this.fileSystem.ensureDir(path.dirname(fullPath));
              await this.fileSystem.writeFile(fullPath, file.content);
              filesWritten++;
            }
          }
        }
      }

      // 10. Update project config
      await this.updateProjectConfig(projectRoot, pluginsToRun);

      // 11. Install dependencies (unless skipped)
      if (!options.skipInstall) {
        const allDeps = results.flatMap((r) => r.result.dependencies || []);
        if (allDeps.length > 0) {
          this.spinner.start("Installing dependencies...");
          try {
            await this.installDependencies(projectRoot, allDeps);
            this.spinner.stop();
            this.logger.success("Dependencies installed");
          } catch (error) {
            this.spinner.stop();
            this.logger.warn(
              `Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`
            );
            this.logger.info("Run 'bun install' manually to install dependencies");
          }
        }
      }

      // 12. Show summary
      this.logger.newline();
      this.logger.success("✨ Plugin(s) added successfully!");
      this.logger.newline();
      this.logger.keyValue("Files created/updated", String(filesWritten));
      this.logger.keyValue("Plugins installed", pluginsToRun.join(", "));

      // Show post-install notes
      const notes = results.flatMap((r) => r.result.notes || []);
      if (notes.length > 0) {
        this.logger.newline();
        this.logger.header("Notes:");
        for (const note of notes) {
          this.logger.info(`  • ${note}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to add plugin: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  /**
   * Detect project root by looking for scaffold markers
   */
  private async detectProjectRoot(): Promise<string | null> {
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      // Check for scaffold config file
      const scaffoldConfig = path.join(currentDir, "scaffold.json");
      if (fs.existsSync(scaffoldConfig)) {
        return currentDir;
      }

      // Check for turbo.json (monorepo marker)
      const turboConfig = path.join(currentDir, "turbo.json");
      if (fs.existsSync(turboConfig)) {
        return currentDir;
      }

      // Check for package.json with scaffold marker
      const packageJson = path.join(currentDir, "package.json");
      if (fs.existsSync(packageJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJson, "utf-8"));
          if (pkg.scaffold || pkg.workspaces) {
            return currentDir;
          }
        } catch {
          // Ignore parse errors
        }
      }

      currentDir = path.dirname(currentDir);
    }

    // Fallback to cwd if it has a package.json
    if (fs.existsSync(path.join(process.cwd(), "package.json"))) {
      return process.cwd();
    }

    return null;
  }

  /**
   * Load existing project configuration
   */
  private async loadProjectConfig(
    projectRoot: string
  ): Promise<Partial<ResolvedProjectConfig> | null> {
    const scaffoldConfig = path.join(projectRoot, "scaffold.json");
    if (fs.existsSync(scaffoldConfig)) {
      try {
        return JSON.parse(fs.readFileSync(scaffoldConfig, "utf-8"));
      } catch {
        return null;
      }
    }

    // Try to infer config from package.json
    const packageJson = path.join(projectRoot, "package.json");
    if (fs.existsSync(packageJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJson, "utf-8"));
        return {
          name: pkg.name,
          plugins: pkg.scaffold?.plugins || [],
          packageManager: this.detectPackageManager(projectRoot),
        };
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Detect package manager from lockfile
   */
  private detectPackageManager(
    projectRoot: string
  ): "bun" | "npm" | "yarn" | "pnpm" {
    if (fs.existsSync(path.join(projectRoot, "bun.lockb"))) return "bun";
    if (fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
    if (fs.existsSync(path.join(projectRoot, "yarn.lock"))) return "yarn";
    return "npm";
  }

  /**
   * Build generator context from project state
   */
  private buildGeneratorContext(
    projectRoot: string,
    existingConfig: Partial<ResolvedProjectConfig> | null,
    pluginIds: string[],
    options: AddCommandOptions
  ): GeneratorContext {
    // Convert plugin IDs to object format for storage
    const plugins: PluginsConfig = Object.fromEntries(
      pluginIds.map(id => [id, true])
    );
    
    const projectConfig: ResolvedProjectConfig = {
      name: existingConfig?.name || path.basename(projectRoot),
      description: existingConfig?.description || "",
      author: existingConfig?.author || "",
      authorEmail: existingConfig?.authorEmail || "",
      license: existingConfig?.license || "MIT",
      packageManager: existingConfig?.packageManager || "bun",
      template: existingConfig?.template,
      apps: existingConfig?.apps,
      plugins,
      pluginIds,
      pluginConfigs: existingConfig?.pluginConfigs || {},
      ports: existingConfig?.ports || {},
      docker: existingConfig?.docker ?? { enabled: true },
      git: existingConfig?.git ?? { enabled: true, init: false, defaultBranch: "main" },
      ci: existingConfig?.ci ?? { enabled: false },
      database: existingConfig?.database,
      metadata: existingConfig?.metadata || {},
      resolvedPluginOrder: existingConfig?.resolvedPluginOrder || pluginIds,
      autoEnabledPlugins: existingConfig?.autoEnabledPlugins || [],
      resolvedAt: new Date(),
    };

    return {
      projectConfig,
      outputPath: projectRoot,
      enabledPlugins: pluginIds,
      dryRun: options.dryRun ?? false,
      skipPrompts: options.yes ?? false,
      verbose: false,
    };
  }

  /**
   * Update project scaffold.json config
   */
  private async updateProjectConfig(
    projectRoot: string,
    newPlugins: string[]
  ): Promise<void> {
    const scaffoldConfig = path.join(projectRoot, "scaffold.json");
    let config: Record<string, unknown> = {};

    if (fs.existsSync(scaffoldConfig)) {
      try {
        config = JSON.parse(fs.readFileSync(scaffoldConfig, "utf-8"));
      } catch {
        // Start fresh
      }
    }

    // Handle both object and array format for plugins
    const existingPlugins = config.plugins || {};
    if (Array.isArray(existingPlugins)) {
      // Convert legacy array to object format
      config.plugins = Object.fromEntries([
        ...existingPlugins.map(p => [p, true]),
        ...newPlugins.map(p => [p, true])
      ]);
    } else {
      // Already object format, add new plugins
      config.plugins = {
        ...existingPlugins,
        ...Object.fromEntries(newPlugins.map(p => [p, true]))
      };
    }
    config.updatedAt = new Date().toISOString();

    await this.fileSystem.writeFile(
      scaffoldConfig,
      JSON.stringify(config, null, 2)
    );
  }

  /**
   * Install dependencies using detected package manager
   */
  private async installDependencies(
    projectRoot: string,
    dependencies: Array<{ name: string; version?: string; type: string; target?: string }>
  ): Promise<void> {
    const pm = this.detectPackageManager(projectRoot);
    const { execSync } = await import("child_process");

    // Group dependencies by type
    const prodDeps = dependencies.filter((d) => d.type === "prod");
    const devDeps = dependencies.filter((d) => d.type === "dev");

    // Install production dependencies
    if (prodDeps.length > 0) {
      const pkgs = prodDeps.map((d) => (d.version ? `${d.name}@${d.version}` : d.name));
      const cmd = this.getInstallCommand(pm, pkgs, false);
      execSync(cmd, { cwd: projectRoot, stdio: "pipe" });
    }

    // Install dev dependencies
    if (devDeps.length > 0) {
      const pkgs = devDeps.map((d) => (d.version ? `${d.name}@${d.version}` : d.name));
      const cmd = this.getInstallCommand(pm, pkgs, true);
      execSync(cmd, { cwd: projectRoot, stdio: "pipe" });
    }
  }

  /**
   * Get install command for package manager
   */
  private getInstallCommand(
    pm: string,
    packages: string[],
    dev: boolean
  ): string {
    const pkgList = packages.join(" ");
    switch (pm) {
      case "bun":
        return `bun add ${dev ? "-d" : ""} ${pkgList}`;
      case "pnpm":
        return `pnpm add ${dev ? "-D" : ""} ${pkgList}`;
      case "yarn":
        return `yarn add ${dev ? "-D" : ""} ${pkgList}`;
      default:
        return `npm install ${dev ? "--save-dev" : ""} ${pkgList}`;
    }
  }

  /**
   * Show dry-run results
   */
  private showDryRunResults(
    results: Array<{ pluginId: string; result: GeneratorResult }>
  ): void {
    for (const { pluginId, result } of results) {
      this.logger.newline();
      this.logger.header(`Plugin: ${pluginId}`);

      if (result.files && result.files.length > 0) {
        this.logger.info("Files to create/update:");
        for (const file of result.files) {
          this.logger.info(`  ${file.path}`);
        }
      }

      if (result.dependencies && result.dependencies.length > 0) {
        this.logger.info("Dependencies to install:");
        for (const dep of result.dependencies) {
          this.logger.info(`  ${dep.name}${dep.version ? `@${dep.version}` : ""} (${dep.type})`);
        }
      }

      if (result.scripts && result.scripts.length > 0) {
        this.logger.info("Scripts to add:");
        for (const script of result.scripts) {
          this.logger.info(`  ${script.name}: ${script.command}`);
        }
      }
    }
  }

  @Option({
    flags: "-c, --config <json>",
    description: "Plugin configuration as JSON",
  })
  parseConfig(val: string): Record<string, unknown> {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }

  @Option({
    flags: "--skip-install",
    description: "Skip dependency installation",
  })
  parseSkipInstall(): boolean {
    return true;
  }

  @Option({
    flags: "-d, --dry-run",
    description: "Show what would be done without making changes",
  })
  parseDryRun(): boolean {
    return true;
  }

  @Option({
    flags: "-f, --force",
    description: "Force installation even if plugin exists or has conflicts",
  })
  parseForce(): boolean {
    return true;
  }

  @Option({
    flags: "-y, --yes",
    description: "Skip confirmation prompts",
  })
  parseYes(): boolean {
    return true;
  }
}
