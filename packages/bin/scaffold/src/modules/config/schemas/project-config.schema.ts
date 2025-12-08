/**
 * Project Config Schema
 *
 * Zod schemas for validating project configuration.
 */
import { z } from "zod";

/**
 * Package manager enum
 */
export const PackageManagerSchema = z.enum(["bun", "npm", "yarn", "pnpm"]);

/**
 * Database provider enum
 */
export const DatabaseProviderSchema = z.enum([
  "postgresql",
  "mysql",
  "sqlite",
  "mongodb",
  "none",
]);

/**
 * Port configuration schema
 */
export const PortConfigSchema = z.object({
  api: z.number().int().min(1024).max(65535).default(3001),
  web: z.number().int().min(1024).max(65535).default(3000),
  db: z.number().int().min(1024).max(65535).default(5432),
  redis: z.number().int().min(1024).max(65535).default(6379),
});

/**
 * Docker configuration schema
 */
export const DockerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  composeVersion: z.string().default("3.8"),
  useSwarm: z.boolean().default(false),
});

/**
 * Git configuration schema
 */
export const GitConfigSchema = z.object({
  init: z.boolean().default(true),
  initialBranch: z.string().default("main"),
  createReadme: z.boolean().default(true),
  createGitignore: z.boolean().default(true),
});

/**
 * CI configuration schema
 */
export const CiConfigSchema = z.object({
  enabled: z.boolean().default(true),
  provider: z.enum(["github", "gitlab", "none"]).default("github"),
  setupDependabot: z.boolean().default(true),
});

/**
 * Plugin options schema - per-plugin configuration
 */
export const PluginOptionsSchema = z.object({
  enabled: z.boolean().optional(),
}).passthrough(); // Allow additional plugin-specific options

/**
 * Plugins configuration schema - supports both new object format and legacy array
 * New format: { typescript: { strict: true }, eslint: {}, docker: true }
 * Legacy format: ["typescript", "eslint", "docker"]
 */
export const PluginsConfigSchema = z.union([
  // New object format: { pluginId: options | boolean }
  z.record(z.string(), z.union([PluginOptionsSchema, z.boolean()])),
  // Legacy array format (for backwards compatibility)
  z.array(z.string()),
]).default({});

/**
 * Main project configuration schema
 */
export const ProjectConfigSchema = z.object({
  // Project Identity
  name: z
    .string()
    .min(1, "Project name is required")
    .max(214, "Project name too long")
    .regex(
      /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
      "Invalid project name format",
    ),
  description: z.string().default(""),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+(-[\w.]+)?$/, "Invalid version format")
    .default("0.1.0"),
  author: z.string().optional(),
  license: z.string().default("MIT"),
  repository: z.string().url().optional(),

  // Note: targetDir is no longer in config - uses CWD or --cwd option

  // Project Template
  template: z
    .enum(["fullstack", "api-only", "web-only", "minimal"])
    .default("fullstack"),

  // Package Manager
  packageManager: PackageManagerSchema.default("bun"),

  // Database
  database: DatabaseProviderSchema.default("postgresql"),

  // Plugins - supports both object format and legacy array
  plugins: PluginsConfigSchema,

  // Ports
  ports: PortConfigSchema.optional(),

  // Docker
  docker: DockerConfigSchema.optional(),

  // Git
  git: GitConfigSchema.optional(),

  // CI/CD
  ci: CiConfigSchema.optional(),

  // Additional options
  skipInstall: z.boolean().default(false),
  verbose: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

/**
 * Partial project config schema (for updates)
 */
export const PartialProjectConfigSchema = ProjectConfigSchema.partial();

/**
 * Scaffold config file schema (.scaffoldrc)
 */
export const ScaffoldConfigFileSchema = z.object({
  defaultTemplate: z.enum(["fullstack", "api-only", "web-only", "minimal"]).optional(),
  defaultPackageManager: PackageManagerSchema.optional(),
  defaultPlugins: z.array(z.string()).optional(),
  customTemplatesPath: z.string().optional(),
  customPluginsPath: z.string().optional(),
  telemetry: z.boolean().default(true),
  analytics: z.boolean().default(false),
});

/**
 * Plugin config in scaffold file
 */
export const PluginEntrySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Inferred types from schemas
 */
export type ProjectConfigInput = z.input<typeof ProjectConfigSchema>;
export type ProjectConfigOutput = z.output<typeof ProjectConfigSchema>;
export type PartialProjectConfig = z.infer<typeof PartialProjectConfigSchema>;
export type ScaffoldConfigFile = z.infer<typeof ScaffoldConfigFileSchema>;
export type PluginEntry = z.infer<typeof PluginEntrySchema>;
