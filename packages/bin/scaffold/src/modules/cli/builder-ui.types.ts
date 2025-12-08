/**
 * Builder UI Integration Types
 *
 * These types mirror the builder-ui app's types for seamless integration.
 * Keep in sync with: apps/builder-ui/src/types.ts
 */

/**
 * Plugin category from builder-ui
 */
export type BuilderPluginCategory =
  | "core"
  | "feature"
  | "infrastructure"
  | "ui"
  | "integration";

/**
 * Plugin definition from builder-ui
 * @see apps/builder-ui/src/types.ts
 */
export interface BuilderPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of what the plugin provides */
  description: string;
  /** Plugin category for grouping */
  category: BuilderPluginCategory;
  /** Required dependencies (other plugin IDs) */
  dependencies: string[];
  /** Optional dependencies */
  optionalDependencies?: string[];
  /** Conflicting plugins (cannot be used together) */
  conflicts?: string[];
  /** Only available in development mode */
  devOnly?: boolean;
  /** Tags for filtering */
  tags?: string[];
  /** Documentation URL */
  docsUrl?: string;
  /** Whether included by default */
  default?: boolean;
}

/**
 * Plugin configuration values
 */
export interface BuilderPluginConfig {
  [key: string]: string | number | boolean | string[];
}

/**
 * Project configuration output from builder-ui
 * @see apps/builder-ui/src/types.ts
 */
export interface BuilderProjectConfig {
  /** Project name */
  projectName: string;
  /** Project description */
  description: string;
  /** Author name */
  author: string;
  /** License type */
  license: string;
  /** Package manager to use */
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  /** Template preset name */
  template: string;
  /** Selected feature/plugin IDs */
  features: string[];
  /** Plugin-specific configurations */
  pluginConfigs: Record<string, BuilderPluginConfig>;
  /** API server port */
  apiPort: number;
  /** Web app port */
  webPort: number;
}

/**
 * Step definition for multi-step wizard
 */
export interface BuilderStep {
  id: number;
  title: string;
  description: string;
}

/**
 * Mapping from builder-ui plugin IDs to scaffold generator IDs
 * Some plugins don't have direct generators (they're informational)
 * Some plugins map to the same generator with different configs
 */
export const BUILDER_TO_SCAFFOLD_PLUGIN_MAP: Record<string, string | null> = {
  // Core plugins
  base: null, // No generator - handled by project structure
  typescript: "typescript",
  turborepo: "turborepo",
  "bun-runtime": null, // Handled by package manager config
  "env-validation": "zod", // Uses zod for env validation

  // Feature plugins - API
  orpc: "orpc",
  "orpc-better-auth": "better-auth", // Part of better-auth generator
  "orpc-contracts": "orpc", // Part of orpc generator
  "orpc-streaming": "orpc", // Config option for orpc

  // Feature plugins - Auth
  "better-auth": "better-auth",
  "better-auth-admin": "better-auth", // Config option
  "better-auth-master-token": "better-auth", // Config option
  "better-auth-login-as": "better-auth", // Config option
  "better-auth-invite": "better-auth", // Config option
  "better-auth-organization": "better-auth", // Config option
  "permission-system": "better-auth", // Part of better-auth
  "better-auth-oauth-google": "better-auth", // Config option
  "better-auth-oauth-github": "better-auth", // Config option
  "better-auth-2fa": "better-auth", // Config option
  "better-auth-passkey": "better-auth", // Config option
  "api-keys": "better-auth", // Config option

  // Feature plugins - Database
  database: "drizzle",
  "database-seeder": "drizzle", // Config option
  "drizzle-studio": "drizzle", // Config option

  // Feature plugins - Cache/Queue
  redis: "redis",
  "job-queue": "redis", // Config option
  "event-system": null, // No direct generator yet
  "event-processing-strategies": null,
  "push-notifications": null,
  "push-device-management": null,
  "sse-streaming": "orpc", // Config option

  // Feature plugins - File/Email
  "file-upload": null,
  "file-storage-s3": null,
  "file-storage-local": null,
  email: null,
  "email-resend": null,
  "email-templates": null,
  webhooks: null,
  "webhook-signatures": null,

  // Feature plugins - Search/i18n
  search: null,
  "search-meilisearch": null,
  "search-algolia": null,
  i18n: null,
  "i18n-next-intl": null,
  nuqs: null,

  // Infrastructure plugins
  docker: "docker",
  "docker-compose": "docker",
  "docker-builder": "docker", // Config option
  "ci-cd": "github-actions",
  "ci-cd-render": "github-actions", // Config option
  "ci-cd-vercel": "github-actions", // Config option
  monitoring: null,
  "monitoring-sentry": null,
  "logging-pino": null,
  testing: "vitest",
  "testing-playwright": "vitest", // Config option
  "testing-msw": "vitest", // Config option
  "nest-commander": null, // Part of base NestJS
  "cli-commands-db": null,
  "cli-commands-admin": null,
  "rate-limiting": null,
  "cors-configuration": null,
  "helmet-security": null,

  // UI plugins
  "shadcn-ui": "shadcn-ui",
  "shadcn-form": "shadcn-ui", // Config option
  "shadcn-data-table": "shadcn-ui", // Config option
  tailwind: "tailwindcss",
  "tailwind-animate": "tailwindcss", // Config option
  "tailwind-typography": "tailwindcss", // Config option
  theme: "next-themes",
  "toast-sonner": null, // Part of shadcn-ui
  "declarative-routing": null, // Part of nextjs generator
  pwa: null,
  "pwa-install-prompt": null,
  "pwa-offline-page": null,
  "skeleton-loading": "shadcn-ui", // Part of shadcn-ui
  "loading-spinners": null,
  "framer-motion": null,
  "lucide-icons": null, // Part of shadcn-ui
  "react-icons": null,

  // Integration plugins
  "tanstack-devtools": "react-query", // Part of react-query
  "tanstack-devtools-query": "react-query",
  "tanstack-devtools-routes": null,
  "tanstack-devtools-auth": null,
  "tanstack-devtools-drizzle": null,
  "tanstack-devtools-api": null,
  stripe: null,
  "stripe-billing-portal": null,
  "stripe-elements": null,
  analytics: null,
  "analytics-posthog": null,
  "analytics-plausible": null,
  seo: null,
  "seo-json-ld": null,
  "seo-opengraph": null,
  fumadocs: null,
  openapi: "orpc", // Config option
  "openapi-scalar": "orpc", // Config option
  uploadthing: null,
  clerk: null,
  supabase: null,
};

/**
 * Get the scaffold generator ID for a builder-ui plugin
 * Returns null if no direct generator exists
 */
export function getScaffoldGeneratorId(
  builderPluginId: string
): string | null {
  return BUILDER_TO_SCAFFOLD_PLUGIN_MAP[builderPluginId] ?? null;
}

/**
 * Get all unique scaffold generator IDs from a list of builder-ui plugins
 */
export function getScaffoldGeneratorIds(
  builderPluginIds: string[]
): string[] {
  const generatorIds = new Set<string>();

  for (const pluginId of builderPluginIds) {
    const generatorId = getScaffoldGeneratorId(pluginId);
    if (generatorId) {
      generatorIds.add(generatorId);
    }
  }

  return Array.from(generatorIds);
}

/**
 * Check if a builder-ui plugin has a corresponding scaffold generator
 */
export function hasScaffoldGenerator(builderPluginId: string): boolean {
  const generatorId = getScaffoldGeneratorId(builderPluginId);
  return generatorId !== null;
}

/**
 * Get builder-ui plugins that map to a specific scaffold generator
 */
export function getBuilderPluginsForGenerator(
  generatorId: string
): string[] {
  const plugins: string[] = [];

  for (const [pluginId, mappedGeneratorId] of Object.entries(
    BUILDER_TO_SCAFFOLD_PLUGIN_MAP
  )) {
    if (mappedGeneratorId === generatorId) {
      plugins.push(pluginId);
    }
  }

  return plugins;
}
