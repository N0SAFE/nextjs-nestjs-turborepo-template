/**
 * Builder UI Config Adapter Service
 *
 * Converts builder-ui ProjectConfig to scaffold CLI formats.
 * Handles type transformations, plugin mapping, and CLI command generation.
 */

import { Injectable } from "@nestjs/common";
import type { PortConfig } from "../../types/config.types";
import type {
  BuilderProjectConfig,
  BuilderPluginConfig,
} from "./builder-ui.types";
import {
  getScaffoldGeneratorIds,
  getScaffoldGeneratorId,
} from "./builder-ui.types";

/**
 * Simplified project config for builder-ui adapter output
 * Uses Record<string, unknown> for pluginConfigs since builder-ui
 * produces config options, not full PluginConfig objects
 */
export interface BuilderAdapterProjectConfig {
  name: string;
  description?: string;
  author?: string;
  license?: string;
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  template?: string;
  plugins: string[];
  pluginConfigs?: Record<string, Record<string, unknown>>;
  ports?: PortConfig;
}

/**
 * CLI command generation options
 */
export interface CommandGenerationOptions {
  /** Generate create command (default: true) */
  createCommand?: boolean;
  /** Include all options even if default (verbose mode) */
  verbose?: boolean;
  /** Use long option names (--name vs -n) */
  longOptions?: boolean;
  /** Quote string values */
  quoteStrings?: boolean;
  /** Use JSON for complex config */
  useJson?: boolean;
}

/**
 * Generated CLI command result
 */
export interface GeneratedCommand {
  /** The CLI command string */
  command: string;
  /** Command broken into arguments array */
  args: string[];
  /** Human-readable explanation */
  description: string;
  /** Warnings about unsupported features */
  warnings: string[];
}

@Injectable()
export class BuilderUiAdapterService {
  /**
   * Convert builder-ui ProjectConfig to scaffold CLI ProjectConfig
   */
  toScaffoldConfig(builderConfig: BuilderProjectConfig): BuilderAdapterProjectConfig {
    // Map port configuration
    const ports: PortConfig = {
      api: builderConfig.apiPort || 3001,
      web: builderConfig.webPort || 3000,
    };

    // Get scaffold generator IDs from builder features
    const scaffoldPlugins = getScaffoldGeneratorIds(builderConfig.features);

    // Convert plugin configs (only for plugins that have generators)
    const pluginConfigs: Record<string, Record<string, unknown>> = {};
    
    // First, derive configs from feature presence (important for sub-plugins)
    for (const featureId of builderConfig.features) {
      const generatorId = getScaffoldGeneratorId(featureId);
      if (generatorId) {
        // Transform feature to config options
        const derivedConfig = this.transformPluginConfig(featureId, {});
        if (Object.keys(derivedConfig).length > 0) {
          pluginConfigs[generatorId] = this.mergePluginConfigs(
            pluginConfigs[generatorId] || {},
            derivedConfig
          );
        }
      }
    }
    
    // Then, merge explicit plugin configs
    for (const [pluginId, config] of Object.entries(
      builderConfig.pluginConfigs || {}
    )) {
      const generatorId = getScaffoldGeneratorId(pluginId);
      if (generatorId) {
        // Merge configs for plugins that map to the same generator
        pluginConfigs[generatorId] = this.mergePluginConfigs(
          pluginConfigs[generatorId] || {},
          this.transformPluginConfig(pluginId, config)
        );
      }
    }

    return {
      name: builderConfig.projectName,
      description: builderConfig.description,
      author: builderConfig.author,
      license: builderConfig.license,
      packageManager: builderConfig.packageManager,
      template: builderConfig.template,
      plugins: scaffoldPlugins,
      pluginConfigs,
      ports,
    };
  }

  /**
   * Transform builder-ui plugin config to scaffold generator config
   * Handles plugin-specific transformations
   */
  private transformPluginConfig(
    builderPluginId: string,
    config: BuilderPluginConfig
  ): Record<string, unknown> {
    const result: Record<string, unknown> = { ...config };

    // Handle specific plugin config transformations
    switch (builderPluginId) {
      case "better-auth-admin":
        result.enableAdmin = true;
        break;
      case "better-auth-master-token":
        result.enableMasterToken = true;
        break;
      case "better-auth-login-as":
        result.enableLoginAs = true;
        break;
      case "better-auth-invite":
        result.enableInvite = true;
        break;
      case "better-auth-organization":
        result.enableOrganization = true;
        break;
      case "better-auth-oauth-google":
        result.enableGoogleOAuth = true;
        break;
      case "better-auth-oauth-github":
        result.enableGithubOAuth = true;
        break;
      case "better-auth-2fa":
        result.enable2FA = true;
        break;
      case "better-auth-passkey":
        result.enablePasskey = true;
        break;
      case "database-seeder":
        result.enableSeeder = true;
        break;
      case "drizzle-studio":
        result.enableStudio = true;
        break;
      case "docker-compose":
        result.enableCompose = true;
        break;
      case "docker-builder":
        result.enableMultiStage = true;
        break;
      case "ci-cd-render":
        result.deployTarget = "render";
        break;
      case "ci-cd-vercel":
        result.deployTarget = "vercel";
        break;
      case "testing-playwright":
        result.enableE2E = true;
        break;
      case "testing-msw":
        result.enableMsw = true;
        break;
      case "shadcn-form":
        result.components = [
          ...(result.components as string[] || []),
          "form",
        ];
        break;
      case "shadcn-data-table":
        result.components = [
          ...(result.components as string[] || []),
          "data-table",
        ];
        break;
      case "tailwind-animate":
        result.enableAnimations = true;
        break;
      case "tailwind-typography":
        result.enableTypography = true;
        break;
      case "orpc-streaming":
        result.enableStreaming = true;
        break;
      case "openapi":
      case "openapi-scalar":
        result.enableOpenApi = true;
        break;
    }

    return result;
  }

  /**
   * Deep merge plugin configs, concatenating arrays instead of overwriting
   */
  private mergePluginConfigs(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...existing };

    for (const [key, value] of Object.entries(incoming)) {
      if (Array.isArray(value) && Array.isArray(existing[key])) {
        // Concatenate arrays and remove duplicates
        merged[key] = [...new Set([...(existing[key] as unknown[]), ...value])];
      } else if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof existing[key] === "object" &&
        existing[key] !== null &&
        !Array.isArray(existing[key])
      ) {
        // Recursively merge objects
        merged[key] = this.mergePluginConfigs(
          existing[key] as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        // Overwrite primitives
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Generate a CLI command from builder-ui config
   */
  generateCommand(
    builderConfig: BuilderProjectConfig,
    options: CommandGenerationOptions = {}
  ): GeneratedCommand {
    const {
      verbose = false,
      longOptions = true,
      quoteStrings = true,
      useJson = false,
    } = options;

    const args: string[] = ["scaffold", "create"];
    const warnings: string[] = [];

    // Helper to add an argument
    const addArg = (
      short: string,
      long: string,
      value: string | number | boolean
    ) => {
      const optName = longOptions ? `--${long}` : `-${short}`;
      if (typeof value === "boolean") {
        if (value) {
          args.push(optName);
        }
      } else {
        const strValue =
          quoteStrings && typeof value === "string" && value.includes(" ")
            ? `"${value}"`
            : String(value);
        args.push(optName, strValue);
      }
    };

    // Project name (required)
    addArg("n", "name", builderConfig.projectName);

    // Description (optional)
    if (builderConfig.description) {
      addArg("d", "description", builderConfig.description);
    }

    // Author (optional)
    if (builderConfig.author) {
      addArg("a", "author", builderConfig.author);
    }

    // License (optional, skip if default)
    if (builderConfig.license && (verbose || builderConfig.license !== "MIT")) {
      addArg("l", "license", builderConfig.license);
    }

    // Package manager (optional, skip if default)
    if (
      builderConfig.packageManager &&
      (verbose || builderConfig.packageManager !== "bun")
    ) {
      addArg("p", "package-manager", builderConfig.packageManager);
    }

    // Template (optional)
    if (builderConfig.template) {
      addArg("t", "template", builderConfig.template);
    }

    // Ports (optional, skip if default)
    if (builderConfig.apiPort && (verbose || builderConfig.apiPort !== 3001)) {
      args.push("--api-port", String(builderConfig.apiPort));
    }
    if (builderConfig.webPort && (verbose || builderConfig.webPort !== 3000)) {
      args.push("--web-port", String(builderConfig.webPort));
    }

    // Features/plugins
    const scaffoldPlugins = getScaffoldGeneratorIds(builderConfig.features);
    if (scaffoldPlugins.length > 0) {
      args.push("--plugins", scaffoldPlugins.join(","));
    }

    // Check for unsupported features
    const unsupportedFeatures = builderConfig.features.filter(
      (f) => getScaffoldGeneratorId(f) === null
    );
    if (unsupportedFeatures.length > 0) {
      warnings.push(
        `The following features are not yet supported by scaffold CLI: ${unsupportedFeatures.join(", ")}`
      );
    }

    // Plugin configs (if any and useJson)
    const convertedConfig = this.toScaffoldConfig(builderConfig);
    if (
      useJson &&
      Object.keys(convertedConfig.pluginConfigs || {}).length > 0
    ) {
      args.push(
        "--plugin-config",
        JSON.stringify(convertedConfig.pluginConfigs)
      );
    }

    const command = args.join(" ");

    return {
      command,
      args,
      description: `Create a new project "${builderConfig.projectName}" with ${scaffoldPlugins.length} generators`,
      warnings,
    };
  }

  /**
   * Parse a JSON config string from builder-ui clipboard
   */
  parseBuilderJson(jsonString: string): BuilderProjectConfig {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate required fields
      if (!parsed.projectName || typeof parsed.projectName !== "string") {
        throw new Error("Missing or invalid projectName");
      }

      // Apply defaults
      return {
        projectName: parsed.projectName,
        description: parsed.description || "",
        author: parsed.author || "",
        license: parsed.license || "MIT",
        packageManager: parsed.packageManager || "bun",
        template: parsed.template || "",
        features: Array.isArray(parsed.features) ? parsed.features : [],
        pluginConfigs: parsed.pluginConfigs || {},
        apiPort: parsed.apiPort || 3001,
        webPort: parsed.webPort || 3000,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse builder-ui config: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Generate a config file from builder-ui config
   */
  generateConfigFile(
    builderConfig: BuilderProjectConfig,
    format: "json" | "yaml" = "json"
  ): string {
    const scaffoldConfig = this.toScaffoldConfig(builderConfig);

    const configFile = {
      version: "1.0",
      project: scaffoldConfig,
    };

    if (format === "json") {
      return JSON.stringify(configFile, null, 2);
    }

    // Simple YAML generation (for more complex needs, use a library)
    return this.toYaml(configFile);
  }

  /**
   * Simple YAML serialization
   */
  private toYaml(obj: unknown, indent = 0): string {
    const prefix = "  ".repeat(indent);

    if (obj === null || obj === undefined) {
      return "null";
    }

    if (typeof obj === "string") {
      // Quote strings with special characters
      if (obj.includes(":") || obj.includes("#") || obj.includes("\n")) {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }

    if (typeof obj === "number" || typeof obj === "boolean") {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return "[]";
      }
      return obj
        .map((item) => `${prefix}- ${this.toYaml(item, indent + 1).trim()}`)
        .join("\n");
    }

    if (typeof obj === "object") {
      const entries = Object.entries(obj);
      if (entries.length === 0) {
        return "{}";
      }
      return entries
        .map(([key, value]) => {
          const valueStr = this.toYaml(value, indent + 1);
          if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            return `${prefix}${key}:\n${valueStr}`;
          }
          if (Array.isArray(value) && value.length > 0) {
            return `${prefix}${key}:\n${valueStr}`;
          }
          return `${prefix}${key}: ${valueStr}`;
        })
        .join("\n");
    }

    return String(obj);
  }

  /**
   * Get statistics about builder-ui to scaffold mapping
   */
  getMappingStats(builderFeatures: string[]): {
    totalFeatures: number;
    supportedFeatures: number;
    unsupportedFeatures: string[];
    uniqueGenerators: string[];
    coverage: number;
  } {
    const scaffoldGenerators = getScaffoldGeneratorIds(builderFeatures);
    const unsupported = builderFeatures.filter(
      (f) => getScaffoldGeneratorId(f) === null
    );

    return {
      totalFeatures: builderFeatures.length,
      supportedFeatures: builderFeatures.length - unsupported.length,
      unsupportedFeatures: unsupported,
      uniqueGenerators: scaffoldGenerators,
      coverage:
        builderFeatures.length > 0
          ? Math.round(
              ((builderFeatures.length - unsupported.length) /
                builderFeatures.length) *
                100
            )
          : 100,
    };
  }
}
