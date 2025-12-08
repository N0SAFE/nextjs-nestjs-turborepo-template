/**
 * Info Command
 *
 * Display information about the scaffold CLI and project.
 */
import { Command, CommandRunner, SubCommand, Option } from "nest-commander";
import { LoggerService } from "../modules/io/logger.service";
import { FileSystemService } from "../modules/io/file-system.service";
import { PluginRegistryService } from "../modules/plugin/plugin-registry.service";
import * as path from "node:path";
import * as os from "node:os";

// Package version - would be injected from package.json in real build
const CLI_VERSION = "1.0.0";

interface InfoOptions {
  json?: boolean;
}

@SubCommand({
  name: "version",
  description: "Show CLI version",
})
export class InfoVersionSubCommand extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  async run(_passedParams: string[], options: InfoOptions): Promise<void> {
    if (options.json) {
      console.log(JSON.stringify({ version: CLI_VERSION }));
      return;
    }

    this.logger.info(`scaffold-cli v${CLI_VERSION}`);
  }

  @Option({
    flags: "--json",
    description: "Output as JSON",
  })
  parseJson(): boolean {
    return true;
  }
}

@SubCommand({
  name: "env",
  description: "Show environment information",
})
export class InfoEnvSubCommand extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  async run(_passedParams: string[], options: InfoOptions): Promise<void> {
    const envInfo = {
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      },
      node: {
        version: process.version,
        execPath: process.execPath,
      },
      user: {
        home: os.homedir(),
        cwd: process.cwd(),
      },
      cli: {
        version: CLI_VERSION,
      },
    };

    if (options.json) {
      console.log(JSON.stringify(envInfo, null, 2));
      return;
    }

    this.logger.box("🔧 Environment Information", { title: "Environment" });
    this.logger.newline();

    this.logger.header("Operating System");
    this.logger.keyValue("Platform", envInfo.os.platform);
    this.logger.keyValue("Release", envInfo.os.release);
    this.logger.keyValue("Architecture", envInfo.os.arch);
    this.logger.keyValue("CPUs", envInfo.os.cpus);
    this.logger.keyValue("Memory", envInfo.os.memory);

    this.logger.header("Node.js");
    this.logger.keyValue("Version", envInfo.node.version);
    this.logger.keyValue("Executable", envInfo.node.execPath);

    this.logger.header("Paths");
    this.logger.keyValue("Home", envInfo.user.home);
    this.logger.keyValue("Current Directory", envInfo.user.cwd);

    this.logger.header("CLI");
    this.logger.keyValue("Version", envInfo.cli.version);
  }

  @Option({
    flags: "--json",
    description: "Output as JSON",
  })
  parseJson(): boolean {
    return true;
  }
}

@SubCommand({
  name: "project",
  description: "Show current project information",
})
export class InfoProjectSubCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly fs: FileSystemService,
  ) {
    super();
  }

  async run(_passedParams: string[], options: InfoOptions): Promise<void> {
    const cwd = process.cwd();

    // Check for scaffold config
    const configFiles = [
      "scaffold.config.json",
      ".scaffoldrc",
      ".scaffoldrc.json",
    ];

    let configPath: string | null = null;
    let config: Record<string, unknown> | null = null;

    for (const file of configFiles) {
      const filePath = path.join(cwd, file);
      if (await this.fs.exists(filePath)) {
        configPath = filePath;
        try {
          config = await this.fs.readJson(filePath) as Record<string, unknown>;
        } catch {
          // Invalid JSON
        }
        break;
      }
    }

    // Check for package.json
    const packageJsonPath = path.join(cwd, "package.json");
    let packageJson: Record<string, unknown> | null = null;
    if (await this.fs.exists(packageJsonPath)) {
      try {
        packageJson = await this.fs.readJson(packageJsonPath) as Record<string, unknown>;
      } catch {
        // Invalid JSON
      }
    }

    const projectInfo = {
      cwd,
      hasScaffoldConfig: configPath !== null,
      scaffoldConfigPath: configPath,
      scaffoldConfig: config,
      hasPackageJson: packageJson !== null,
      packageName: packageJson?.name as string | undefined,
      packageVersion: packageJson?.version as string | undefined,
      isMonorepo: await this.detectMonorepo(cwd),
    };

    if (options.json) {
      console.log(JSON.stringify(projectInfo, null, 2));
      return;
    }

    this.logger.box("📁 Project Information", { title: "Project" });
    this.logger.newline();

    this.logger.keyValue("Directory", cwd);
    this.logger.newline();

    if (packageJson) {
      this.logger.header("Package");
      this.logger.keyValue("Name", packageJson.name as string || "N/A");
      this.logger.keyValue("Version", packageJson.version as string || "N/A");
      this.logger.keyValue("Description", packageJson.description as string || "N/A");
    } else {
      this.logger.warn("No package.json found");
    }

    if (config) {
      this.logger.header("Scaffold Config");
      this.logger.keyValue("File", configPath || "N/A");
      this.logger.keyValue("Template", config.template as string || "N/A");
      this.logger.keyValue("Package Manager", config.packageManager as string || "N/A");

      // Handle both object and array formats for plugins
      const pluginsConfig = config.plugins;
      const pluginIds = Array.isArray(pluginsConfig)
        ? pluginsConfig
        : typeof pluginsConfig === 'object' && pluginsConfig !== null
          ? Object.keys(pluginsConfig as Record<string, unknown>)
          : [];
      if (pluginIds.length) {
        this.logger.keyValue("Plugins", pluginIds.join(", "));
      }
    } else {
      this.logger.info("No scaffold config found");
      this.logger.info("Run 'scaffold create' to create a new project");
    }

    if (projectInfo.isMonorepo) {
      this.logger.header("Monorepo");
      this.logger.success("This appears to be a monorepo project");
    }
  }

  private async detectMonorepo(dir: string): Promise<boolean> {
    // Check for common monorepo indicators
    const indicators = [
      "turbo.json",
      "pnpm-workspace.yaml",
      "lerna.json",
      path.join("packages", "package.json"),
      path.join("apps", "package.json"),
    ];

    for (const indicator of indicators) {
      if (await this.fs.exists(path.join(dir, indicator))) {
        return true;
      }
    }

    // Check package.json workspaces field
    const packageJsonPath = path.join(dir, "package.json");
    if (await this.fs.exists(packageJsonPath)) {
      try {
        const pkg = await this.fs.readJson(packageJsonPath) as Record<string, unknown>;
        if (pkg.workspaces) return true;
      } catch {
        // Invalid JSON
      }
    }

    return false;
  }

  @Option({
    flags: "--json",
    description: "Output as JSON",
  })
  parseJson(): boolean {
    return true;
  }
}

@SubCommand({
  name: "stats",
  description: "Show plugin statistics",
})
export class InfoStatsSubCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly pluginRegistry: PluginRegistryService,
  ) {
    super();
  }

  async run(_passedParams: string[], options: InfoOptions): Promise<void> {
    const plugins = this.pluginRegistry.getAll();

    // Group by category
    const byCategory = new Map<string, number>();
    for (const plugin of plugins) {
      const category = plugin.category || "other";
      byCategory.set(category, (byCategory.get(category) || 0) + 1);
    }

    const stats = {
      totalPlugins: plugins.length,
      categories: Object.fromEntries(byCategory),
      mostDependencies: plugins
        .filter(p => (p.dependencies?.length ?? 0) > 0)
        .sort((a, b) => (b.dependencies?.length ?? 0) - (a.dependencies?.length ?? 0))
        .slice(0, 5)
        .map(p => ({ id: p.id, dependencies: p.dependencies?.length ?? 0 })),
    };

    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
      return;
    }

    this.logger.box("📊 Plugin Statistics", { title: "Statistics" });
    this.logger.newline();

    this.logger.keyValue("Total Plugins", stats.totalPlugins);
    this.logger.newline();

    this.logger.header("Plugins by Category");
    for (const [category, count] of byCategory) {
      this.logger.info(`  ${category.padEnd(20)} ${count}`);
    }

    if (stats.mostDependencies.length > 0) {
      this.logger.header("Most Dependencies");
      for (const item of stats.mostDependencies) {
        this.logger.info(`  ${item.id.padEnd(20)} ${item.dependencies} dependencies`);
      }
    }
  }

  @Option({
    flags: "--json",
    description: "Output as JSON",
  })
  parseJson(): boolean {
    return true;
  }
}

@Command({
  name: "info",
  description: "Show CLI and project information",
  subCommands: [
    InfoVersionSubCommand,
    InfoEnvSubCommand,
    InfoProjectSubCommand,
    InfoStatsSubCommand,
  ],
})
export class InfoCommand extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.info("Use one of the subcommands:");
    this.logger.info("  scaffold info version  - Show CLI version");
    this.logger.info("  scaffold info env      - Show environment information");
    this.logger.info("  scaffold info project  - Show current project information");
    this.logger.info("  scaffold info stats    - Show plugin statistics");
  }
}
