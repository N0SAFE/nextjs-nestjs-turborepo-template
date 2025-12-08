/**
 * List Command
 *
 * List available plugins, templates, and configurations.
 */
import { Command, CommandRunner, SubCommand, Option } from "nest-commander";
import { LoggerService } from "../modules/io/logger.service";
import { PluginRegistryService } from "../modules/plugin/plugin-registry.service";

interface ListPluginsOptions {
  category?: string;
  json?: boolean;
}

@SubCommand({
  name: "plugins",
  description: "List available plugins",
})
export class ListPluginsSubCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly pluginRegistry: PluginRegistryService,
  ) {
    super();
  }

  async run(_passedParams: string[], options: ListPluginsOptions): Promise<void> {
    const plugins = this.pluginRegistry.getAll();

    // Filter by category if specified
    const filtered = options.category
      ? plugins.filter((p) => p.category === options.category)
      : plugins;

    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    this.logger.box("📦 Available Plugins", { title: "Plugins" });
    this.logger.newline();

    // Group by category
    const categories = new Map<string, typeof filtered>();
    for (const plugin of filtered) {
      const category = plugin.category || "other";
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(plugin);
    }

    // Display by category
    for (const [category, categoryPlugins] of categories) {
      this.logger.header(this.formatCategory(category));
      for (const plugin of categoryPlugins) {
        const deps =
          (plugin.dependencies?.length ?? 0) > 0
            ? ` (requires: ${plugin.dependencies!.join(", ")})`
            : "";
        this.logger.info(`  ${plugin.id.padEnd(20)} ${plugin.description}${deps}`);
      }
      this.logger.newline();
    }

    this.logger.info(`Total: ${filtered.length} plugins`);
  }

  private formatCategory(category: string): string {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  @Option({
    flags: "-c, --category <category>",
    description: "Filter by category (core, feature, infrastructure, ui, integration)",
  })
  parseCategory(val: string): string {
    return val;
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
  name: "templates",
  description: "List available templates",
})
export class ListTemplatesSubCommand extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.box("📋 Available Templates", { title: "Templates" });
    this.logger.newline();

    const templates = [
      {
        name: "fullstack",
        description: "Full-stack monorepo with NestJS API, Next.js web, and shared packages",
        plugins: ["nestjs", "nextjs", "turborepo", "typescript", "docker"],
      },
      {
        name: "api-only",
        description: "NestJS API with database and authentication",
        plugins: ["nestjs", "drizzle", "better-auth", "docker"],
      },
      {
        name: "web-only",
        description: "Next.js web application with Tailwind and Shadcn",
        plugins: ["nextjs", "tailwind", "shadcn", "typescript"],
      },
      {
        name: "minimal",
        description: "Minimal TypeScript project with Bun runtime",
        plugins: ["typescript", "bun"],
      },
      {
        name: "monorepo",
        description: "Turborepo monorepo structure with shared packages",
        plugins: ["turborepo", "typescript", "bun"],
      },
    ];

    for (const template of templates) {
      this.logger.header(template.name);
      this.logger.info(`  ${template.description}`);
      this.logger.info(`  Plugins: ${template.plugins.join(", ")}`);
      this.logger.newline();
    }
  }
}

@SubCommand({
  name: "categories",
  description: "List plugin categories",
})
export class ListCategoriesSubCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly pluginRegistry: PluginRegistryService,
  ) {
    super();
  }

  async run(): Promise<void> {
    this.logger.box("🏷️ Plugin Categories", { title: "Categories" });
    this.logger.newline();

    const plugins = this.pluginRegistry.getAll();
    const categoryCounts = new Map<string, number>();

    for (const plugin of plugins) {
      const category = plugin.category || "other";
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    const categories = [
      { id: "core", description: "Core framework and runtime components" },
      { id: "feature", description: "Feature plugins (auth, database, etc.)" },
      { id: "infrastructure", description: "Infrastructure plugins (Docker, CI/CD)" },
      { id: "ui", description: "UI frameworks and styling" },
      { id: "integration", description: "Third-party integrations" },
    ];

    for (const cat of categories) {
      const count = categoryCounts.get(cat.id) || 0;
      this.logger.info(`  ${cat.id.padEnd(15)} ${cat.description} (${count} plugins)`);
    }
    this.logger.newline();
  }
}

@Command({
  name: "list",
  description: "List available plugins, templates, or categories",
  subCommands: [ListPluginsSubCommand, ListTemplatesSubCommand, ListCategoriesSubCommand],
})
export class ListCommand extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.info("Use one of the subcommands:");
    this.logger.info("  scaffold list plugins     - List available plugins");
    this.logger.info("  scaffold list templates   - List available templates");
    this.logger.info("  scaffold list categories  - List plugin categories");
  }
}
