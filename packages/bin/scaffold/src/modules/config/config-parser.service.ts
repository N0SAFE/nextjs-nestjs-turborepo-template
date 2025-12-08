/**
 * Config Parser Service
 *
 * Handles parsing configuration from various sources.
 * Integrates with AppTypeRegistryService and PluginAppIntegrationService
 * for multi-app resolution and plugin compatibility validation.
 */
import { Injectable } from "@nestjs/common";
import * as path from "node:path";
import * as os from "node:os";
import { FileSystemService } from "../io/file-system.service";
import { ConfigValidatorService } from "./config-validator.service";
import {
  type ProjectConfigInput,
  type ProjectConfigOutput,
  type ScaffoldConfigFile,
  ScaffoldConfigFileSchema,
} from "./schemas/project-config.schema";
import type { ProjectConfig, ResolvedProjectConfig, PluginsConfig } from "../../types/config.types";
import type { AppConfig, ResolvedAppConfig } from "../../types/app.types";
import { ConfigValidationError } from "../../types/errors.types";
import { appTypeRegistry } from "../app";
import { pluginAppIntegration } from "../integration";

/** Config file names to search for */
const CONFIG_FILE_NAMES = [
  ".scaffoldrc",
  ".scaffoldrc.json",
  ".scaffoldrc.yaml",
  ".scaffoldrc.yml",
  "scaffold.config.json",
  "scaffold.config.js",
];

@Injectable()
export class ConfigParserService {
  constructor(
    private readonly fs: FileSystemService,
    private readonly validator: ConfigValidatorService,
  ) {}

  /**
   * Load configuration from a file path
   */
  async loadFromFile(filePath: string): Promise<Partial<ProjectConfig>> {
    const ext = path.extname(filePath).toLowerCase();

    if (!(await this.fs.exists(filePath))) {
      throw new ConfigValidationError([], `Config file not found: ${filePath}`);
    }

    let config: unknown;

    if (ext === ".json" || filePath.endsWith(".scaffoldrc")) {
      config = await this.fs.readJson(filePath);
    } else if (ext === ".yaml" || ext === ".yml") {
      // YAML support can be added later with js-yaml
      const content = await this.fs.readFile(filePath);
      config = this.parseYaml(content);
    } else if (ext === ".js" || ext === ".mjs") {
      // Dynamic import for JS config files
      const imported = await import(filePath);
      config = imported.default ?? imported;
    } else {
      throw new ConfigValidationError([], `Unsupported config file format: ${ext}`);
    }

    return config as Partial<ProjectConfig>;
  }

  /**
   * Find and load config file from directory tree
   */
  async findAndLoadConfig(startDir: string): Promise<ScaffoldConfigFile | null> {
    let currentDir = startDir;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      for (const fileName of CONFIG_FILE_NAMES) {
        const configPath = path.join(currentDir, fileName);
        if (await this.fs.exists(configPath)) {
          try {
            const rawConfig = await this.loadFromFile(configPath);
            const result = ScaffoldConfigFileSchema.safeParse(rawConfig);
            if (result.success) {
              return result.data;
            }
          } catch {
            // Continue searching
          }
        }
      }
      currentDir = path.dirname(currentDir);
    }

    // Check home directory
    const homeConfigPath = path.join(os.homedir(), ".scaffoldrc");
    if (await this.fs.exists(homeConfigPath)) {
      try {
        const rawConfig = await this.loadFromFile(homeConfigPath);
        const result = ScaffoldConfigFileSchema.safeParse(rawConfig);
        if (result.success) {
          return result.data;
        }
      } catch {
        // No config found
      }
    }

    return null;
  }

  /**
   * Merge multiple configurations
   */
  mergeConfigs(
    ...configs: Array<Partial<ProjectConfigInput> | undefined>
  ): Partial<ProjectConfigInput> {
    const result: Partial<ProjectConfigInput> = {};

    for (const config of configs) {
      if (!config) continue;

      for (const [key, value] of Object.entries(config)) {
        if (value === undefined) continue;

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Deep merge objects
          const existing = result[key as keyof ProjectConfigInput];
          if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
            (result as Record<string, unknown>)[key] = {
              ...existing,
              ...value,
            };
          } else {
            (result as Record<string, unknown>)[key] = { ...value };
          }
        } else {
          // Override primitives and arrays
          (result as Record<string, unknown>)[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Apply defaults from scaffold config file
   */
  applyDefaults(
    config: Partial<ProjectConfigInput>,
    scaffoldConfig: ScaffoldConfigFile | null,
  ): Partial<ProjectConfigInput> {
    if (!scaffoldConfig) return config;

    const defaults: Partial<ProjectConfigInput> = {};

    if (scaffoldConfig.defaultTemplate) {
      defaults.template = scaffoldConfig.defaultTemplate;
    }

    if (scaffoldConfig.defaultPackageManager) {
      defaults.packageManager = scaffoldConfig.defaultPackageManager;
    }

    if (scaffoldConfig.defaultPlugins) {
      defaults.plugins = scaffoldConfig.defaultPlugins;
    }

    return this.mergeConfigs(defaults, config);
  }

  /**
   * Validate and transform config to resolved format
   * Integrates with registry services for multi-app resolution
   */
  async resolveConfig(
    input: Partial<ProjectConfigInput> | ProjectConfig,
  ): Promise<ResolvedProjectConfig> {
    // First validate and get defaults applied
    const validated = this.validator.validate(input as Partial<ProjectConfigInput>);

    // Resolve apps if present
    const resolvedApps = this.resolveApps((input as ProjectConfig).apps ?? []);

    // Normalize plugins to object format and extract plugin IDs
    const normalizedPlugins = this.normalizePluginsConfig(validated.plugins);
    const pluginIds = Object.keys(normalizedPlugins).filter(id => {
      const config = normalizedPlugins[id];
      // Plugin is enabled if value is true or an object without enabled: false
      return config === true || (typeof config === 'object' && config.enabled !== false);
    });

    // Compute auto-enabled plugins from app requirements
    const autoEnabledPlugins = this.computeAutoEnabledPlugins(
      pluginIds,
      resolvedApps
    );

    // Merge all plugins in proper order (explicit + auto-enabled)
    const allPluginIds = [...new Set([...autoEnabledPlugins, ...pluginIds])];

    // Build the resolved config with all required fields
    const resolved: ResolvedProjectConfig = {
      name: validated.name,
      description: validated.description ?? "",
      author: validated.author ?? "",
      authorEmail: "",
      license: validated.license ?? "MIT",
      packageManager: validated.packageManager ?? "bun",
      template: validated.template,
      plugins: normalizedPlugins,
      pluginIds: allPluginIds,
      pluginConfigs: {},
      ports: {
        api: validated.ports?.api ?? 3001,
        web: validated.ports?.web ?? 3000,
        db: validated.ports?.db ?? 5432,
        redis: validated.ports?.redis ?? 6379,
      },
      docker: {
        enabled: validated.docker?.enabled ?? true,
        composeVersion: validated.docker?.composeVersion ?? "3.8",
      },
      git: {
        init: validated.git?.init ?? true,
        defaultBranch: validated.git?.initialBranch ?? "main",
        gitignore: validated.git?.createGitignore ?? true,
      },
      ci: {
        enabled: validated.ci?.enabled ?? true,
        provider: validated.ci?.provider === "github" ? "github-actions" : 
                  validated.ci?.provider === "gitlab" ? "gitlab-ci" : "none",
      },
      database: validated.database === "none" ? undefined : validated.database,
      metadata: {},
      resolvedPluginOrder: allPluginIds,
      autoEnabledPlugins,
      apps: resolvedApps.length > 0 ? resolvedApps : undefined,
      resolvedAt: new Date(),
    };

    return resolved;
  }

  /**
   * Normalize plugins configuration to object format
   * Handles both legacy array format and new object format
   */
  private normalizePluginsConfig(plugins: unknown): PluginsConfig {
    if (!plugins) {
      return {};
    }
    
    // Handle legacy array format: ["typescript", "eslint"] => { typescript: true, eslint: true }
    if (Array.isArray(plugins)) {
      return Object.fromEntries(plugins.map(p => [p, true]));
    }
    
    // Already object format
    if (typeof plugins === 'object') {
      return plugins as PluginsConfig;
    }
    
    return {};
  }

  /**
   * Resolve app configurations using the registry services
   */
  private resolveApps(apps: AppConfig[]): ResolvedAppConfig[] {
    if (apps.length === 0) {
      return [];
    }

    // Validate multi-app configuration
    const validationResult = pluginAppIntegration.validateMultiAppConfig(apps);
    
    if (!validationResult.valid) {
      // Collect all errors from global issues and app-specific errors
      const allErrors = [
        ...validationResult.globalIssues,
        ...validationResult.apps.flatMap(app => app.errors)
      ];
      throw new ConfigValidationError(
        allErrors,
        `Invalid app configuration: ${allErrors.join(", ")}`
      );
    }

    // Resolve each app using the registry
    const resolvedApps: ResolvedAppConfig[] = [];
    
    for (const appConfig of apps) {
      // Validate individual app
      const appValidation = appTypeRegistry.validateAppConfig(appConfig);
      
      if (!appValidation.valid) {
        throw new ConfigValidationError(
          appValidation.errors,
          `Invalid app '${appConfig.name}': ${appValidation.errors.join(", ")}`
        );
      }

      // Resolve the app config (adds appType, autoEnabledPlugins, etc.)
      const resolved = appTypeRegistry.resolveAppConfig(appConfig);
      resolvedApps.push(resolved);
    }

    return resolvedApps;
  }

  /**
   * Compute auto-enabled plugins from all sources:
   * - Required plugins from each app type
   * - Plugin dependencies (transitive)
   */
  private computeAutoEnabledPlugins(
    explicitPlugins: string[],
    apps: ResolvedAppConfig[]
  ): string[] {
    const autoEnabled = new Set<string>();

    // Collect auto-enabled plugins from all apps
    for (const app of apps) {
      const appAutoEnabled = app.autoEnabledPlugins ?? [];
      for (const plugin of appAutoEnabled) {
        if (!explicitPlugins.includes(plugin)) {
          autoEnabled.add(plugin);
        }
      }
    }

    // Also get required plugins from plugin-app integration service
    // (returns Plugin[] objects, so we extract the id)
    for (const app of apps) {
      const required = pluginAppIntegration.getRequiredPlugins(app.type);
      for (const plugin of required) {
        if (!explicitPlugins.includes(plugin.id)) {
          autoEnabled.add(plugin.id);
        }
      }
    }

    return Array.from(autoEnabled);
  }

  /**
   * Parse YAML content (basic implementation)
   */
  private parseYaml(content: string): unknown {
    // Basic YAML parsing - for full support, add js-yaml dependency
    // This handles simple key: value pairs
    const lines = content.split("\n");
    const result: Record<string, unknown> = {};
    let currentKey: string | null = null;
    let currentIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const indent = line.search(/\S/);
      const colonIndex = trimmed.indexOf(":");

      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();

        if (value) {
          // Simple key: value
          result[key] = this.parseYamlValue(value);
        } else {
          // Key with nested values
          currentKey = key;
          currentIndent = indent;
          result[key] = {};
        }
      }
    }

    return result;
  }

  /**
   * Parse a YAML value
   */
  private parseYamlValue(value: string): unknown {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Booleans
    if (value === "true") return true;
    if (value === "false") return false;

    // Null
    if (value === "null" || value === "~") return null;

    // Numbers
    const num = Number(value);
    if (!Number.isNaN(num)) return num;

    // Arrays (simple inline)
    if (value.startsWith("[") && value.endsWith("]")) {
      const items = value.slice(1, -1).split(",").map(s => s.trim());
      return items.map(item => this.parseYamlValue(item));
    }

    return value;
  }
}
