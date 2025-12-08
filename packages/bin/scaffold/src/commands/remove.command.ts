/**
 * Remove Command
 *
 * Command for removing plugins from an existing project.
 * Handles dependency checking, file cleanup, and configuration updates.
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

interface RemoveCommandOptions {
  keepFiles?: boolean;
  force?: boolean;
  dryRun?: boolean;
  yes?: boolean;
}

@Command({
  name: "remove",
  description: "Remove a plugin from an existing project",
  arguments: "<plugin-id>",
})
export class RemoveCommand extends CommandRunner {
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

  async run(passedParams: string[], options: RemoveCommandOptions): Promise<void> {
    const pluginId = passedParams[0];

    if (!pluginId) {
      this.logger.error("Plugin ID is required");
      this.logger.info("Usage: scaffold remove <plugin-id>");
      this.logger.info("Run 'scaffold list plugins --installed' to see installed plugins");
      process.exit(1);
    }

    this.logger.box(`🗑️  Removing Plugin: ${pluginId}`, { title: "Scaffold CLI" });
    this.logger.newline();

    try {
      // 1. Detect project root and configuration
      const projectRoot = await this.detectProjectRoot();
      if (!projectRoot) {
        this.logger.error("Could not detect project root");
        this.logger.info(
          "Make sure you're in a scaffold project directory"
        );
        process.exit(1);
      }
      this.logger.keyValue("Project root", projectRoot);

      // 2. Load existing configuration
      const existingConfig = await this.loadProjectConfig(projectRoot);
      if (!existingConfig) {
        this.logger.error("Could not load project configuration");
        process.exit(1);
      }

      // 3. Check if plugin is installed (handle both object and array formats)
      const pluginsConfig = existingConfig.plugins || {};
      const installedPlugins = Array.isArray(pluginsConfig) 
        ? pluginsConfig 
        : Object.keys(pluginsConfig).filter(id => {
            const cfg = pluginsConfig[id as keyof typeof pluginsConfig];
            return cfg === true || (typeof cfg === 'object' && (cfg as {enabled?: boolean}).enabled !== false);
          });
      if (!installedPlugins.includes(pluginId)) {
        this.logger.error(`Plugin '${pluginId}' is not installed`);
        this.logger.info("Installed plugins: " + (installedPlugins.join(", ") || "none"));
        process.exit(1);
      }

      // 4. Check for dependents (other plugins that depend on this one)
      const dependents = this.findDependents(pluginId, installedPlugins);
      if (dependents.length > 0) {
        this.logger.error(
          `Cannot remove '${pluginId}' - the following plugins depend on it:`
        );
        for (const dep of dependents) {
          this.logger.info(`  • ${dep}`);
        }
        if (!options.force) {
          this.logger.info("Use --force to remove anyway (may break dependencies)");
          process.exit(1);
        }
        this.logger.warn("Proceeding anyway due to --force flag");
      }

      // 5. Get files to remove
      this.spinner.start("Analyzing plugin files...");
      const filesToRemove = await this.getPluginFiles(pluginId, projectRoot);
      this.spinner.stop();

      // 6. Get dependencies to potentially remove
      const depsToRemove = await this.getPluginDependencies(pluginId, installedPlugins);

      // 7. Show summary and confirm
      this.logger.newline();
      this.logger.header("Changes to be made:");
      this.logger.newline();

      if (!options.keepFiles && filesToRemove.length > 0) {
        this.logger.info("Files to remove:");
        for (const file of filesToRemove.slice(0, 10)) {
          this.logger.info(`  ${file}`);
        }
        if (filesToRemove.length > 10) {
          this.logger.info(`  ... and ${filesToRemove.length - 10} more`);
        }
      } else if (options.keepFiles) {
        this.logger.info("Files: (keeping files due to --keep-files)");
      } else {
        this.logger.info("Files: none to remove");
      }

      this.logger.newline();
      this.logger.info("Configuration changes:");
      this.logger.info(`  • Remove '${pluginId}' from plugins list`);

      if (depsToRemove.length > 0) {
        this.logger.newline();
        this.logger.info("Dependencies that may be unused:");
        for (const dep of depsToRemove) {
          this.logger.info(`  ${dep}`);
        }
        this.logger.info("  (run 'bun/npm prune' to remove unused packages)");
      }

      // Dry run - stop here
      if (options.dryRun) {
        this.logger.newline();
        this.logger.header("Dry run - no changes made");
        return;
      }

      // 8. Confirm with user
      if (!options.yes) {
        this.logger.newline();
        const proceed = await this.prompt.confirm(
          "Proceed with removal?",
          { initial: false }
        );
        if (!proceed) {
          this.logger.info("Aborted");
          return;
        }
      }

      // 9. Remove files (unless --keep-files)
      let filesRemoved = 0;
      if (!options.keepFiles && filesToRemove.length > 0) {
        this.spinner.start("Removing files...");
        for (const file of filesToRemove) {
          const fullPath = path.join(projectRoot, file);
          try {
            if (fs.existsSync(fullPath)) {
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory()) {
                fs.rmSync(fullPath, { recursive: true, force: true });
              } else {
                fs.unlinkSync(fullPath);
              }
              filesRemoved++;
            }
          } catch (error) {
            this.logger.warn(`Failed to remove ${file}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        this.spinner.stop();
      }

      // 10. Clean up empty directories
      if (filesRemoved > 0) {
        await this.cleanupEmptyDirectories(projectRoot, filesToRemove);
      }

      // 11. Update project configuration
      this.spinner.start("Updating configuration...");
      await this.updateProjectConfig(projectRoot, pluginId);
      this.spinner.stop();

      // 12. Show summary
      this.logger.newline();
      this.logger.success(`✨ Plugin '${pluginId}' removed successfully!`);
      this.logger.newline();
      this.logger.keyValue("Files removed", String(filesRemoved));
      this.logger.keyValue("Plugin removed", pluginId);

      // Post-removal notes
      this.logger.newline();
      this.logger.header("Next steps:");
      if (depsToRemove.length > 0) {
        this.logger.info("  • Run 'bun install' to update your lock file");
      }
      this.logger.info("  • Review any manual changes needed in your code");
      this.logger.info("  • Run tests to verify everything works correctly");
    } catch (error) {
      this.logger.error(
        `Failed to remove plugin: ${error instanceof Error ? error.message : String(error)}`
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
  ): Promise<Record<string, unknown> | null> {
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
        };
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Find plugins that depend on the given plugin
   */
  private findDependents(pluginId: string, installedPlugins: string[]): string[] {
    const dependents: string[] = [];

    for (const installed of installedPlugins) {
      if (installed === pluginId) continue;

      const pluginDef = this.pluginRegistry.get(installed);
      if (pluginDef?.dependencies?.includes(pluginId)) {
        dependents.push(installed);
      }
    }

    return dependents;
  }

  /**
   * Get list of files created by a plugin
   */
  private async getPluginFiles(
    pluginId: string,
    projectRoot: string
  ): Promise<string[]> {
    // Try to get files from generator metadata
    const GeneratorClass = getGeneratorByPluginId(pluginId);
    if (GeneratorClass) {
      // Check if generator has a getFiles or getManagedPaths method
      const generator = new (GeneratorClass as any)();
      if (typeof generator.getManagedPaths === "function") {
        return generator.getManagedPaths();
      }
    }

    // Fall back to known patterns based on plugin ID
    return this.getKnownPluginFiles(pluginId, projectRoot);
  }

  /**
   * Get known file patterns for common plugins
   */
  private getKnownPluginFiles(
    pluginId: string,
    projectRoot: string
  ): string[] {
    const patterns: Record<string, string[]> = {
      // Core plugins
      turbo: ["turbo.json"],
      "workspace-config": ["pnpm-workspace.yaml", "bun.workspace.json"],
      bun: ["bunfig.toml"],
      "env-validation": ["env.ts", "apps/*/env.ts", "packages/*/env.ts"],
      typescript: ["tsconfig.json", "tsconfig.*.json"],
      eslint: ["eslint.config.ts", "eslint.config.js", ".eslintrc*"],
      prettier: [".prettierrc*", "prettier.config.*"],
      
      // Feature plugins
      docker: ["Dockerfile*", "docker-compose*.yml", "docker/"],
      vitest: ["vitest.config.*", "vitest.setup.*"],
      "better-auth": ["src/auth/", "apps/api/src/auth/"],
      drizzle: ["drizzle.config.ts", "src/db/", "apps/api/src/db/"],
      orpc: ["src/rpc/", "packages/contracts/"],
      
      // App-specific
      nextjs: ["next.config.*", "next-env.d.ts"],
      nestjs: ["nest-cli.json", "src/main.ts", "apps/api/"],
    };

    const files: string[] = [];
    const pluginPatterns = patterns[pluginId] || [];

    for (const pattern of pluginPatterns) {
      if (pattern.includes("*")) {
        // Would need glob here, for now just return the pattern
        files.push(pattern);
      } else {
        const fullPath = path.join(projectRoot, pattern);
        if (fs.existsSync(fullPath)) {
          files.push(pattern);
        }
      }
    }

    return files;
  }

  /**
   * Get dependencies that might be removable
   */
  private async getPluginDependencies(
    pluginId: string,
    installedPlugins: string[]
  ): Promise<string[]> {
    const pluginDef = this.pluginRegistry.get(pluginId);
    if (!pluginDef) return [];

    // Get dependencies from generator if available
    const GeneratorClass = getGeneratorByPluginId(pluginId);
    if (GeneratorClass) {
      const generator = new (GeneratorClass as any)();
      if (typeof generator.getDependencies === "function") {
        const deps = await generator.getDependencies();
        return deps.map((d: { name: string }) => d.name);
      }
    }

    return [];
  }

  /**
   * Clean up empty directories after file removal
   */
  private async cleanupEmptyDirectories(
    projectRoot: string,
    removedFiles: string[]
  ): Promise<void> {
    // Get unique parent directories
    const dirs = new Set<string>();
    for (const file of removedFiles) {
      let dir = path.dirname(file);
      while (dir && dir !== "." && dir !== "/") {
        dirs.add(dir);
        dir = path.dirname(dir);
      }
    }

    // Sort by depth (deepest first) and try to remove empty ones
    const sortedDirs = Array.from(dirs).sort(
      (a, b) => b.split("/").length - a.split("/").length
    );

    for (const dir of sortedDirs) {
      const fullPath = path.join(projectRoot, dir);
      try {
        if (fs.existsSync(fullPath)) {
          const contents = fs.readdirSync(fullPath);
          if (contents.length === 0) {
            fs.rmdirSync(fullPath);
          }
        }
      } catch {
        // Directory not empty or can't be removed, skip
      }
    }
  }

  /**
   * Update project scaffold.json config to remove plugin
   */
  private async updateProjectConfig(
    projectRoot: string,
    pluginId: string
  ): Promise<void> {
    const scaffoldConfig = path.join(projectRoot, "scaffold.json");
    
    if (fs.existsSync(scaffoldConfig)) {
      try {
        const config = JSON.parse(fs.readFileSync(scaffoldConfig, "utf-8"));
        
        // Handle both object and array formats
        if (Array.isArray(config.plugins)) {
          config.plugins = config.plugins.filter((p: string) => p !== pluginId);
        } else if (typeof config.plugins === 'object' && config.plugins !== null) {
          // Remove from object format
          delete config.plugins[pluginId];
        }
        config.updatedAt = new Date().toISOString();
        
        await this.fileSystem.writeFile(
          scaffoldConfig,
          JSON.stringify(config, null, 2)
        );
      } catch (error) {
        this.logger.warn(`Failed to update scaffold.json: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Also update package.json if it has scaffold config
    const packageJsonPath = path.join(projectRoot, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (pkg.scaffold?.plugins) {
          // Handle both formats in package.json
          if (Array.isArray(pkg.scaffold.plugins)) {
            pkg.scaffold.plugins = pkg.scaffold.plugins.filter((p: string) => p !== pluginId);
          } else if (typeof pkg.scaffold.plugins === 'object') {
            delete pkg.scaffold.plugins[pluginId];
          }
          await this.fileSystem.writeFile(
            packageJsonPath,
            JSON.stringify(pkg, null, 2)
          );
        }
      } catch (error) {
        this.logger.warn(`Failed to update package.json: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  @Option({
    flags: "--keep-files",
    description: "Keep generated files (only update configuration)",
  })
  parseKeepFiles(): boolean {
    return true;
  }

  @Option({
    flags: "-f, --force",
    description: "Force removal even if other plugins depend on this one",
  })
  parseForce(): boolean {
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
    flags: "-y, --yes",
    description: "Skip confirmation prompts",
  })
  parseYes(): boolean {
    return true;
  }
}
