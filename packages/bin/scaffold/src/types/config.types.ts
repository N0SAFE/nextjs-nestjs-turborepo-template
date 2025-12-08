/**
 * Configuration Type Definitions
 *
 * These types define project configuration structures.
 *
 * @see ARCHITECTURE.md - Configuration System section
 */

import type { AppConfig, AppTypeId, ResolvedAppConfig } from "./app.types";
import type { PluginConfig } from "./plugin.types";
import type { PluginSymbol } from "./plugin-symbols";

/**
 * Per-plugin configuration options
 * Used in the new plugins object structure: { [pluginId]: PluginOptionsConfig }
 */
export interface PluginOptionsConfig {
  /** Whether the plugin is enabled (default: true if present) */
  enabled?: boolean;
  /** Plugin-specific options */
  [key: string]: unknown;
}

/**
 * Plugins configuration - object mapping plugin IDs to their options
 * Example: { typescript: { strict: true }, eslint: { autoFix: true } }
 */
export type PluginsConfig = Record<string, PluginOptionsConfig | boolean>;

/**
 * Supported package managers
 */
export type PackageManager = "bun" | "npm" | "yarn" | "pnpm";

/**
 * Database providers
 */
export type DatabaseProvider = "postgresql" | "mysql" | "sqlite" | "mongodb";

/**
 * Port configuration
 */
export interface PortConfig {
  /** API server port */
  api?: number;
  /** Web app port */
  web?: number;
  /** Documentation app port */
  doc?: number;
  /** Database port */
  db?: number;
  /** Redis port */
  redis?: number;
}

/**
 * Docker configuration options
 */
export interface DockerConfig {
  /** Enable Docker support */
  enabled: boolean;
  /** Docker Compose version */
  composeVersion?: string;
  /** Use BuildKit */
  buildKit?: boolean;
  /** Use multi-stage builds */
  multiStage?: boolean;
}

/**
 * Git configuration options
 */
export interface GitConfig {
  /** Enable git repository initialization */
  enabled?: boolean;
  /** Initialize git repository */
  init: boolean;
  /** Initial branch name */
  defaultBranch?: string;
  /** Add .gitignore */
  gitignore?: boolean;
  /** Add .gitattributes */
  gitattributes?: boolean;
}

/**
 * CI/CD configuration options
 */
export interface CiConfig {
  /** CI provider */
  provider?: "github-actions" | "gitlab-ci" | "none";
  /** Enable CI/CD */
  enabled: boolean;
  /** Enable lint workflow */
  lint?: boolean;
  /** Enable test workflow */
  test?: boolean;
  /** Enable build workflow */
  build?: boolean;
  /** Enable deploy workflow */
  deploy?: boolean;
}

/**
 * Main project configuration
 * This is the primary input for project scaffolding
 *
 * @see ARCHITECTURE.md - Per-App Plugin Registration
 */
export interface ProjectConfig {
  /** Project name (used for directory and package.json) */
  name: string;
  /** Project name alias for backwards compatibility */
  projectName?: string;
  /** Project description */
  description?: string;
  /** Author name */
  author?: string;
  /** Author email */
  authorEmail?: string;
  /** License type */
  license?: string;
  /** Package manager to use */
  packageManager?: PackageManager;
  /** Template to use (optional preset) */
  template?: string;
  /**
   * Application configurations (new multi-app structure)
   * Each app defines its type and plugins
   * @see ARCHITECTURE.md - Per-App Plugin Registration
   */
  apps?: AppConfig[];
  /**
   * Global plugins configuration
   * Object mapping plugin IDs to their configuration options
   * Example: { typescript: { strict: true }, eslint: {}, docker: { composeVersion: "3.8" } }
   * Use `true` as shorthand for `{}` (enabled with defaults)
   */
  plugins?: PluginsConfig;
  /**
   * Selected plugin/feature IDs (legacy array format)
   * @deprecated Use plugins object format instead
   */
  features?: string[];
  /** Plugin-specific configurations (legacy format)
   * @deprecated Use plugins object format instead
   */
  pluginConfigs?: Record<string, PluginConfig>;
  /** Port configurations */
  ports?: PortConfig;
  /** Docker configuration */
  docker?: DockerConfig;
  /** Git configuration */
  git?: GitConfig;
  /** CI/CD configuration */
  ci?: CiConfig;
  /** Database provider (if database feature enabled) */
  database?: DatabaseProvider;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parsed and validated project configuration with defaults applied
 */
export interface ResolvedProjectConfig {
  /** Project name */
  name: string;
  /** Project description */
  description: string;
  /** Author name */
  author: string;
  /** Author email */
  authorEmail: string;
  /** License type */
  license: string;
  /** Package manager to use */
  packageManager: PackageManager;
  /** Original template name if used */
  template?: string;
  /**
   * Resolved application configurations
   * Each app has fully resolved plugins with validation complete
   * Defaults to empty array for backwards compatibility
   */
  apps?: ResolvedAppConfig[];
  /**
   * Resolved plugins configuration
   * Normalized from input (array or object) to consistent object format
   */
  plugins: PluginsConfig;
  /**
   * Ordered list of enabled plugin IDs (for backwards compatibility)
   */
  pluginIds: string[];
  /**
   * Plugin symbols for type-safe references
   */
  pluginSymbols?: PluginSymbol[];
  /** Plugin-specific configurations */
  pluginConfigs: Record<string, PluginConfig>;
  /** Port configurations */
  ports: PortConfig;
  /** Docker configuration */
  docker: DockerConfig;
  /** Git configuration */
  git: GitConfig;
  /** CI/CD configuration */
  ci: CiConfig;
  /** Database provider */
  database?: DatabaseProvider;
  /** Additional metadata */
  metadata: Record<string, unknown>;
  /** Resolved plugin order (topologically sorted, all apps combined) */
  resolvedPluginOrder: string[];
  /** Plugins that were auto-enabled */
  autoEnabledPlugins: string[];
  /** Timestamp of configuration resolution */
  resolvedAt: Date;
}

/**
 * Configuration file format (for JSON/YAML config files)
 */
export interface ConfigFile {
  /** Schema version */
  version: string;
  /** Project configuration */
  project: ProjectConfig;
}

/**
 * Project template preset
 */
export interface ProjectTemplate {
  /** Template ID */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /**
   * App configurations for the template
   * New multi-app structure
   */
  apps?: Array<{
    type: AppTypeId;
    name?: string;
    plugins: string[];
  }>;
  /**
   * Pre-selected features (legacy flat structure)
   * @deprecated Use apps instead
   */
  features: string[];
  /** Pre-configured plugin options */
  pluginConfigs?: Record<string, PluginConfig>;
  /** Default ports */
  ports?: PortConfig;
  /** Icon name */
  icon?: string;
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Built-in project templates
 */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Bare minimum setup with just the essentials",
    features: ["typescript", "eslint", "prettier"],
    icon: "Minimize",
    tags: ["starter", "minimal"],
  },
  {
    id: "standard",
    name: "Standard",
    description: "Standard setup with common features",
    features: [
      "typescript",
      "eslint",
      "prettier",
      "husky",
      "vitest",
      "docker",
      "env-management",
    ],
    icon: "Package",
    tags: ["recommended", "standard"],
  },
  {
    id: "full-stack",
    name: "Full Stack",
    description: "Complete full-stack setup with authentication and database",
    apps: [
      {
        type: "nestjs",
        name: "api",
        plugins: [
          "typescript",
          "eslint",
          "prettier",
          "vitest",
          "drizzle",
          "postgresql",
          "redis",
          "orpc",
          "better-auth",
          "health-check",
        ],
      },
      {
        type: "nextjs",
        name: "web",
        plugins: [
          "typescript",
          "eslint",
          "prettier",
          "vitest",
          "tailwindcss",
          "shadcn-ui",
          "react-query",
          "orpc-react-query",
          "better-auth",
        ],
      },
    ],
    features: [
      "typescript",
      "eslint",
      "prettier",
      "husky",
      "vitest",
      "docker",
      "env-management",
      "better-auth",
      "drizzle",
      "postgresql",
      "redis",
      "orpc",
      "tanstack-query",
    ],
    icon: "Layers",
    tags: ["full-stack", "complete"],
  },
  {
    id: "saas",
    name: "SaaS Starter",
    description: "SaaS-ready setup with payments, multi-tenancy, and more",
    apps: [
      {
        type: "nestjs",
        name: "api",
        plugins: [
          "typescript",
          "eslint",
          "prettier",
          "vitest",
          "drizzle",
          "postgresql",
          "redis",
          "orpc",
          "better-auth",
          "better-auth-admin",
          "permission-system",
          "rate-limiting",
          "health-check",
          "stripe",
          "logging",
        ],
      },
      {
        type: "nextjs",
        name: "web",
        plugins: [
          "typescript",
          "eslint",
          "prettier",
          "vitest",
          "tailwindcss",
          "shadcn-ui",
          "react-query",
          "orpc-react-query",
          "better-auth",
          "stripe",
          "seo",
          "analytics",
        ],
      },
      {
        type: "fumadocs",
        name: "doc",
        plugins: [
          "typescript",
          "eslint",
          "prettier",
          "tailwindcss",
          "seo",
        ],
      },
    ],
    features: [
      "typescript",
      "eslint",
      "prettier",
      "husky",
      "vitest",
      "docker",
      "env-management",
      "better-auth",
      "drizzle",
      "postgresql",
      "redis",
      "orpc",
      "tanstack-query",
      "stripe",
      "multi-tenancy",
      "rate-limiting",
      "feature-flags",
    ],
    icon: "Building",
    tags: ["saas", "enterprise"],
  },
];
