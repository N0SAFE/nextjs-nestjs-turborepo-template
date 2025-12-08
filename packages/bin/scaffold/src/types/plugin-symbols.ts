/**
 * Plugin Symbol Definitions
 *
 * This module defines unique symbols for all plugins in the scaffold system.
 * Using symbols instead of strings provides:
 * - Compile-time safety (no typos in dependency references)
 * - Refactoring safety (rename detection via IDE)
 * - Uniqueness guarantee (symbols are guaranteed unique)
 * - Import tracking (clear dependency graph via imports)
 *
 * @see ARCHITECTURE.md - Plugin Symbol System section
 */

import type { AppTypeId } from "../types/app.types";

// ============================================================================
// Plugin Symbol Type
// ============================================================================

/**
 * Plugin symbol type for type-safe plugin references
 */
export type PluginSymbol = symbol;

/**
 * Plugin symbol with associated metadata
 */
export interface PluginSymbolDefinition {
  /** The unique symbol */
  symbol: PluginSymbol;
  /** Plugin ID string (for compatibility with string-based systems) */
  id: string;
  /** Display name */
  name: string;
  /** Supported app types (* = all) */
  supportedApps: AppTypeId[] | "*";
  /** Plugin category */
  category: "core" | "feature" | "infrastructure" | "ui" | "integration";
}

// ============================================================================
// Core Plugin Symbols
// ============================================================================

/** TypeScript support */
export const TYPESCRIPT = Symbol.for("plugin:typescript");
export type TypescriptSymbol = typeof TYPESCRIPT;

/** ESLint code linting */
export const ESLINT = Symbol.for("plugin:eslint");
export type EslintSymbol = typeof ESLINT;

/** Prettier code formatting */
export const PRETTIER = Symbol.for("plugin:prettier");
export type PrettierSymbol = typeof PRETTIER;

/** Zod schema validation */
export const ZOD = Symbol.for("plugin:zod");
export type ZodSymbol = typeof ZOD;

/** Vitest testing framework */
export const VITEST = Symbol.for("plugin:vitest");
export type VitestSymbol = typeof VITEST;

/** Bun runtime support */
export const BUN_RUNTIME = Symbol.for("plugin:bun-runtime");
export type BunRuntimeSymbol = typeof BUN_RUNTIME;

/** Turborepo monorepo management */
export const TURBOREPO = Symbol.for("plugin:turborepo");
export type TurborepoSymbol = typeof TURBOREPO;

/** Husky git hooks */
export const HUSKY = Symbol.for("plugin:husky");
export type HuskySymbol = typeof HUSKY;

/** Environment management */
export const ENV_MANAGEMENT = Symbol.for("plugin:env-management");
export type EnvManagementSymbol = typeof ENV_MANAGEMENT;

// ============================================================================
// App Type Symbols
// ============================================================================

/** NestJS application */
export const NESTJS = Symbol.for("plugin:nestjs");
export type NestjsSymbol = typeof NESTJS;

/** Next.js application */
export const NEXTJS = Symbol.for("plugin:nextjs");
export type NextjsSymbol = typeof NEXTJS;

/** Fumadocs documentation */
export const FUMADOCS = Symbol.for("plugin:fumadocs");
export type FumadocsSymbol = typeof FUMADOCS;

/** Express application */
export const EXPRESS = Symbol.for("plugin:express");
export type ExpressSymbol = typeof EXPRESS;

/** Fastify application */
export const FASTIFY = Symbol.for("plugin:fastify");
export type FastifySymbol = typeof FASTIFY;

/** Astro application */
export const ASTRO = Symbol.for("plugin:astro");
export type AstroSymbol = typeof ASTRO;

// ============================================================================
// Database Plugin Symbols
// ============================================================================

/** Drizzle ORM */
export const DRIZZLE = Symbol.for("plugin:drizzle");
export type DrizzleSymbol = typeof DRIZZLE;

/** Database seeder */
export const DATABASE_SEEDER = Symbol.for("plugin:database-seeder");
export type DatabaseSeederSymbol = typeof DATABASE_SEEDER;

/** PostgreSQL database */
export const POSTGRESQL = Symbol.for("plugin:postgresql");
export type PostgresqlSymbol = typeof POSTGRESQL;

/** Redis cache */
export const REDIS = Symbol.for("plugin:redis");
export type RedisSymbol = typeof REDIS;

// ============================================================================
// Authentication Plugin Symbols
// ============================================================================

/** Better Auth authentication */
export const BETTER_AUTH = Symbol.for("plugin:better-auth");
export type BetterAuthSymbol = typeof BETTER_AUTH;

/** API Key authentication */
export const API_KEY_AUTH = Symbol.for("plugin:api-key-auth");
export type ApiKeyAuthSymbol = typeof API_KEY_AUTH;

/** Permission system */
export const PERMISSION_SYSTEM = Symbol.for("plugin:permission-system");
export type PermissionSystemSymbol = typeof PERMISSION_SYSTEM;

/** Better Auth admin plugin */
export const BETTER_AUTH_ADMIN = Symbol.for("plugin:better-auth-admin");
export type BetterAuthAdminSymbol = typeof BETTER_AUTH_ADMIN;

/** Better Auth Google OAuth */
export const BETTER_AUTH_OAUTH_GOOGLE = Symbol.for("plugin:better-auth-oauth-google");
export type BetterAuthOAuthGoogleSymbol = typeof BETTER_AUTH_OAUTH_GOOGLE;

/** Better Auth GitHub OAuth */
export const BETTER_AUTH_OAUTH_GITHUB = Symbol.for("plugin:better-auth-oauth-github");
export type BetterAuthOAuthGithubSymbol = typeof BETTER_AUTH_OAUTH_GITHUB;

/** Better Auth Discord OAuth */
export const BETTER_AUTH_OAUTH_DISCORD = Symbol.for("plugin:better-auth-oauth-discord");
export type BetterAuthOAuthDiscordSymbol = typeof BETTER_AUTH_OAUTH_DISCORD;

/** Better Auth Bearer token */
export const BETTER_AUTH_BEARER = Symbol.for("plugin:better-auth-bearer");
export type BetterAuthBearerSymbol = typeof BETTER_AUTH_BEARER;

/** Better Auth Two-Factor */
export const BETTER_AUTH_TWO_FACTOR = Symbol.for("plugin:better-auth-two-factor");
export type BetterAuthTwoFactorSymbol = typeof BETTER_AUTH_TWO_FACTOR;

// ============================================================================
// API/RPC Plugin Symbols
// ============================================================================

/** oRPC API layer */
export const ORPC = Symbol.for("plugin:orpc");
export type OrpcSymbol = typeof ORPC;

/** oRPC contracts package */
export const ORPC_CONTRACTS = Symbol.for("plugin:orpc-contracts");
export type OrpcContractsSymbol = typeof ORPC_CONTRACTS;

/** oRPC streaming support */
export const ORPC_STREAMING = Symbol.for("plugin:orpc-streaming");
export type OrpcStreamingSymbol = typeof ORPC_STREAMING;

/** oRPC Better Auth integration */
export const ORPC_BETTER_AUTH = Symbol.for("plugin:orpc-better-auth");
export type OrpcBetterAuthSymbol = typeof ORPC_BETTER_AUTH;

/** oRPC React Query integration */
export const ORPC_REACT_QUERY = Symbol.for("plugin:orpc-react-query");
export type OrpcReactQuerySymbol = typeof ORPC_REACT_QUERY;

/** Health check endpoints */
export const HEALTH_CHECK = Symbol.for("plugin:health-check");
export type HealthCheckSymbol = typeof HEALTH_CHECK;

/** Swagger/OpenAPI documentation */
export const SWAGGER = Symbol.for("plugin:swagger");
export type SwaggerSymbol = typeof SWAGGER;

// ============================================================================
// State Management Plugin Symbols
// ============================================================================

/** TanStack React Query */
export const REACT_QUERY = Symbol.for("plugin:react-query");
export type ReactQuerySymbol = typeof REACT_QUERY;

/** Zustand state management */
export const ZUSTAND = Symbol.for("plugin:zustand");
export type ZustandSymbol = typeof ZUSTAND;

// ============================================================================
// UI Plugin Symbols
// ============================================================================

/** Tailwind CSS */
export const TAILWINDCSS = Symbol.for("plugin:tailwindcss");
export type TailwindcssSymbol = typeof TAILWINDCSS;

/** Shadcn UI components */
export const SHADCN_UI = Symbol.for("plugin:shadcn-ui");
export type ShadcnUiSymbol = typeof SHADCN_UI;

/** Next.js themes (dark mode) */
export const NEXT_THEMES = Symbol.for("plugin:next-themes");
export type NextThemesSymbol = typeof NEXT_THEMES;

// ============================================================================
// Infrastructure Plugin Symbols
// ============================================================================

/** Docker support */
export const DOCKER = Symbol.for("plugin:docker");
export type DockerSymbol = typeof DOCKER;

/** GitHub Actions CI/CD */
export const GITHUB_ACTIONS = Symbol.for("plugin:github-actions");
export type GithubActionsSymbol = typeof GITHUB_ACTIONS;

/** GitLab CI/CD */
export const GITLAB_CI = Symbol.for("plugin:gitlab-ci");
export type GitlabCiSymbol = typeof GITLAB_CI;

/** Rate limiting */
export const RATE_LIMITING = Symbol.for("plugin:rate-limiting");
export type RateLimitingSymbol = typeof RATE_LIMITING;

/** Logging */
export const LOGGING = Symbol.for("plugin:logging");
export type LoggingSymbol = typeof LOGGING;

// ============================================================================
// Integration Plugin Symbols
// ============================================================================

/** Stripe payments */
export const STRIPE = Symbol.for("plugin:stripe");
export type StripeSymbol = typeof STRIPE;

/** Sentry error tracking */
export const SENTRY = Symbol.for("plugin:sentry");
export type SentrySymbol = typeof SENTRY;

/** Analytics */
export const ANALYTICS = Symbol.for("plugin:analytics");
export type AnalyticsSymbol = typeof ANALYTICS;

/** SEO optimization */
export const SEO = Symbol.for("plugin:seo");
export type SeoSymbol = typeof SEO;

// ============================================================================
// Symbol Registry
// ============================================================================

/**
 * All plugin symbols mapped to their string IDs
 * Used for converting between symbol and string representations
 */
export const PLUGIN_SYMBOL_REGISTRY: Map<PluginSymbol, string> = new Map([
  // Core
  [TYPESCRIPT, "typescript"],
  [ESLINT, "eslint"],
  [PRETTIER, "prettier"],
  [ZOD, "zod"],
  [VITEST, "vitest"],
  [BUN_RUNTIME, "bun-runtime"],
  [TURBOREPO, "turborepo"],
  [HUSKY, "husky"],
  [ENV_MANAGEMENT, "env-management"],

  // App Types
  [NESTJS, "nestjs"],
  [NEXTJS, "nextjs"],
  [FUMADOCS, "fumadocs"],
  [EXPRESS, "express"],
  [FASTIFY, "fastify"],
  [ASTRO, "astro"],

  // Database
  [DRIZZLE, "drizzle"],
  [DATABASE_SEEDER, "database-seeder"],
  [POSTGRESQL, "postgresql"],
  [REDIS, "redis"],

  // Authentication
  [BETTER_AUTH, "better-auth"],
  [API_KEY_AUTH, "api-key-auth"],
  [PERMISSION_SYSTEM, "permission-system"],
  [BETTER_AUTH_ADMIN, "better-auth-admin"],
  [BETTER_AUTH_OAUTH_GOOGLE, "better-auth-oauth-google"],
  [BETTER_AUTH_OAUTH_GITHUB, "better-auth-oauth-github"],
  [BETTER_AUTH_OAUTH_DISCORD, "better-auth-oauth-discord"],
  [BETTER_AUTH_BEARER, "better-auth-bearer"],
  [BETTER_AUTH_TWO_FACTOR, "better-auth-two-factor"],

  // API/RPC
  [ORPC, "orpc"],
  [ORPC_CONTRACTS, "orpc-contracts"],
  [ORPC_STREAMING, "orpc-streaming"],
  [ORPC_BETTER_AUTH, "orpc-better-auth"],
  [ORPC_REACT_QUERY, "orpc-react-query"],
  [HEALTH_CHECK, "health-check"],
  [SWAGGER, "swagger"],

  // State Management
  [REACT_QUERY, "react-query"],
  [ZUSTAND, "zustand"],

  // UI
  [TAILWINDCSS, "tailwindcss"],
  [SHADCN_UI, "shadcn-ui"],
  [NEXT_THEMES, "next-themes"],

  // Infrastructure
  [DOCKER, "docker"],
  [GITHUB_ACTIONS, "github-actions"],
  [GITLAB_CI, "gitlab-ci"],
  [RATE_LIMITING, "rate-limiting"],
  [LOGGING, "logging"],

  // Integration
  [STRIPE, "stripe"],
  [SENTRY, "sentry"],
  [ANALYTICS, "analytics"],
  [SEO, "seo"],
]);

/**
 * Reverse mapping: string ID to symbol
 */
export const PLUGIN_ID_TO_SYMBOL: Map<string, PluginSymbol> = new Map(
  Array.from(PLUGIN_SYMBOL_REGISTRY.entries()).map(([symbol, id]) => [id, symbol])
);

// ============================================================================
// Plugin Symbol Definitions with Metadata
// ============================================================================

/**
 * Complete plugin symbol definitions with metadata
 */
export const PLUGIN_SYMBOLS: Record<string, PluginSymbolDefinition> = {
  // Core Plugins (support all apps)
  typescript: {
    symbol: TYPESCRIPT,
    id: "typescript",
    name: "TypeScript",
    supportedApps: "*",
    category: "core",
  },
  eslint: {
    symbol: ESLINT,
    id: "eslint",
    name: "ESLint",
    supportedApps: "*",
    category: "core",
  },
  prettier: {
    symbol: PRETTIER,
    id: "prettier",
    name: "Prettier",
    supportedApps: "*",
    category: "core",
  },
  zod: {
    symbol: ZOD,
    id: "zod",
    name: "Zod",
    supportedApps: "*",
    category: "core",
  },
  vitest: {
    symbol: VITEST,
    id: "vitest",
    name: "Vitest",
    supportedApps: "*",
    category: "core",
  },
  "bun-runtime": {
    symbol: BUN_RUNTIME,
    id: "bun-runtime",
    name: "Bun Runtime",
    supportedApps: "*",
    category: "core",
  },
  turborepo: {
    symbol: TURBOREPO,
    id: "turborepo",
    name: "Turborepo",
    supportedApps: "*",
    category: "core",
  },
  husky: {
    symbol: HUSKY,
    id: "husky",
    name: "Husky",
    supportedApps: "*",
    category: "core",
  },
  "env-management": {
    symbol: ENV_MANAGEMENT,
    id: "env-management",
    name: "Environment Management",
    supportedApps: "*",
    category: "core",
  },

  // Database Plugins
  drizzle: {
    symbol: DRIZZLE,
    id: "drizzle",
    name: "Drizzle ORM",
    supportedApps: ["nestjs", "nextjs", "express", "fastify"],
    category: "feature",
  },
  "database-seeder": {
    symbol: DATABASE_SEEDER,
    id: "database-seeder",
    name: "Database Seeder",
    supportedApps: ["nestjs", "express", "fastify"],
    category: "feature",
  },
  postgresql: {
    symbol: POSTGRESQL,
    id: "postgresql",
    name: "PostgreSQL",
    supportedApps: ["nestjs", "nextjs", "express", "fastify"],
    category: "infrastructure",
  },
  redis: {
    symbol: REDIS,
    id: "redis",
    name: "Redis",
    supportedApps: ["nestjs", "nextjs", "express", "fastify"],
    category: "infrastructure",
  },

  // Authentication Plugins
  "better-auth": {
    symbol: BETTER_AUTH,
    id: "better-auth",
    name: "Better Auth",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "api-key-auth": {
    symbol: API_KEY_AUTH,
    id: "api-key-auth",
    name: "API Key Auth",
    supportedApps: ["nestjs", "express", "fastify"],
    category: "feature",
  },
  "permission-system": {
    symbol: PERMISSION_SYSTEM,
    id: "permission-system",
    name: "Permission System",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "better-auth-admin": {
    symbol: BETTER_AUTH_ADMIN,
    id: "better-auth-admin",
    name: "Better Auth Admin",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "better-auth-oauth-google": {
    symbol: BETTER_AUTH_OAUTH_GOOGLE,
    id: "better-auth-oauth-google",
    name: "Google OAuth",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "better-auth-oauth-github": {
    symbol: BETTER_AUTH_OAUTH_GITHUB,
    id: "better-auth-oauth-github",
    name: "GitHub OAuth",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "better-auth-oauth-discord": {
    symbol: BETTER_AUTH_OAUTH_DISCORD,
    id: "better-auth-oauth-discord",
    name: "Discord OAuth",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "better-auth-bearer": {
    symbol: BETTER_AUTH_BEARER,
    id: "better-auth-bearer",
    name: "Bearer Token Auth",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "better-auth-two-factor": {
    symbol: BETTER_AUTH_TWO_FACTOR,
    id: "better-auth-two-factor",
    name: "Two-Factor Auth",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },

  // API/RPC Plugins
  orpc: {
    symbol: ORPC,
    id: "orpc",
    name: "oRPC",
    supportedApps: ["nestjs"],
    category: "feature",
  },
  "orpc-contracts": {
    symbol: ORPC_CONTRACTS,
    id: "orpc-contracts",
    name: "oRPC Contracts",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "orpc-streaming": {
    symbol: ORPC_STREAMING,
    id: "orpc-streaming",
    name: "oRPC Streaming",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "orpc-better-auth": {
    symbol: ORPC_BETTER_AUTH,
    id: "orpc-better-auth",
    name: "oRPC Better Auth",
    supportedApps: ["nestjs", "nextjs"],
    category: "feature",
  },
  "orpc-react-query": {
    symbol: ORPC_REACT_QUERY,
    id: "orpc-react-query",
    name: "oRPC React Query",
    supportedApps: ["nextjs"],
    category: "feature",
  },
  "health-check": {
    symbol: HEALTH_CHECK,
    id: "health-check",
    name: "Health Check",
    supportedApps: ["nestjs", "express", "fastify"],
    category: "feature",
  },
  swagger: {
    symbol: SWAGGER,
    id: "swagger",
    name: "Swagger/OpenAPI",
    supportedApps: ["nestjs", "express", "fastify"],
    category: "feature",
  },

  // State Management Plugins
  "react-query": {
    symbol: REACT_QUERY,
    id: "react-query",
    name: "TanStack Query",
    supportedApps: ["nextjs", "astro"],
    category: "feature",
  },
  zustand: {
    symbol: ZUSTAND,
    id: "zustand",
    name: "Zustand",
    supportedApps: ["nextjs", "astro"],
    category: "feature",
  },

  // UI Plugins
  tailwindcss: {
    symbol: TAILWINDCSS,
    id: "tailwindcss",
    name: "Tailwind CSS",
    supportedApps: ["nextjs", "fumadocs", "astro"],
    category: "ui",
  },
  "shadcn-ui": {
    symbol: SHADCN_UI,
    id: "shadcn-ui",
    name: "shadcn/ui",
    supportedApps: ["nextjs"],
    category: "ui",
  },
  "next-themes": {
    symbol: NEXT_THEMES,
    id: "next-themes",
    name: "Next Themes",
    supportedApps: ["nextjs", "fumadocs"],
    category: "ui",
  },

  // Infrastructure Plugins
  docker: {
    symbol: DOCKER,
    id: "docker",
    name: "Docker",
    supportedApps: "*",
    category: "infrastructure",
  },
  "github-actions": {
    symbol: GITHUB_ACTIONS,
    id: "github-actions",
    name: "GitHub Actions",
    supportedApps: "*",
    category: "infrastructure",
  },
  "gitlab-ci": {
    symbol: GITLAB_CI,
    id: "gitlab-ci",
    name: "GitLab CI",
    supportedApps: "*",
    category: "infrastructure",
  },
  "rate-limiting": {
    symbol: RATE_LIMITING,
    id: "rate-limiting",
    name: "Rate Limiting",
    supportedApps: ["nestjs", "express", "fastify"],
    category: "infrastructure",
  },
  logging: {
    symbol: LOGGING,
    id: "logging",
    name: "Logging",
    supportedApps: ["nestjs", "nextjs", "express", "fastify"],
    category: "infrastructure",
  },

  // Integration Plugins
  stripe: {
    symbol: STRIPE,
    id: "stripe",
    name: "Stripe",
    supportedApps: ["nestjs", "nextjs"],
    category: "integration",
  },
  sentry: {
    symbol: SENTRY,
    id: "sentry",
    name: "Sentry",
    supportedApps: "*",
    category: "integration",
  },
  analytics: {
    symbol: ANALYTICS,
    id: "analytics",
    name: "Analytics",
    supportedApps: ["nextjs", "fumadocs", "astro"],
    category: "integration",
  },
  seo: {
    symbol: SEO,
    id: "seo",
    name: "SEO",
    supportedApps: ["nextjs", "fumadocs", "astro"],
    category: "integration",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get plugin ID from symbol
 */
export function getPluginId(symbol: PluginSymbol): string | undefined {
  return PLUGIN_SYMBOL_REGISTRY.get(symbol);
}

/**
 * Get symbol from plugin ID
 */
export function getPluginSymbol(id: string): PluginSymbol | undefined {
  return PLUGIN_ID_TO_SYMBOL.get(id);
}

/**
 * Check if a plugin symbol is valid
 */
export function isValidPluginSymbol(symbol: PluginSymbol): boolean {
  return PLUGIN_SYMBOL_REGISTRY.has(symbol);
}

/**
 * Check if a plugin ID is valid
 */
export function isValidPluginId(id: string): boolean {
  return PLUGIN_ID_TO_SYMBOL.has(id);
}

/**
 * Get plugin definition by symbol
 */
export function getPluginDefinition(symbol: PluginSymbol): PluginSymbolDefinition | undefined {
  const id = getPluginId(symbol);
  return id ? PLUGIN_SYMBOLS[id] : undefined;
}

/**
 * Get plugin definition by ID
 */
export function getPluginDefinitionById(id: string): PluginSymbolDefinition | undefined {
  return PLUGIN_SYMBOLS[id];
}

/**
 * Check if a plugin supports a specific app type
 */
export function pluginSupportsApp(pluginId: string, appTypeId: AppTypeId): boolean {
  const def = PLUGIN_SYMBOLS[pluginId];
  if (!def) return false;
  if (def.supportedApps === "*") return true;
  return def.supportedApps.includes(appTypeId);
}

/**
 * Get all plugins that support a specific app type
 */
export function getPluginsForAppType(appTypeId: AppTypeId): PluginSymbolDefinition[] {
  return Object.values(PLUGIN_SYMBOLS).filter((def) => {
    if (def.supportedApps === "*") return true;
    return def.supportedApps.includes(appTypeId);
  });
}

/**
 * Get all plugins in a specific category
 */
export function getPluginsByCategory(
  category: PluginSymbolDefinition["category"]
): PluginSymbolDefinition[] {
  return Object.values(PLUGIN_SYMBOLS).filter((def) => def.category === category);
}

/**
 * Convert array of plugin symbols to IDs
 */
export function symbolsToIds(symbols: PluginSymbol[]): string[] {
  return symbols.map((s) => getPluginId(s)).filter((id): id is string => id !== undefined);
}

/**
 * Convert array of plugin IDs to symbols
 */
export function idsToSymbols(ids: string[]): PluginSymbol[] {
  return ids.map((id) => getPluginSymbol(id)).filter((s): s is PluginSymbol => s !== undefined);
}

/**
 * Get all plugin symbols as an array
 */
export function getAllPluginSymbols(): PluginSymbol[] {
  return Array.from(PLUGIN_SYMBOL_REGISTRY.keys());
}

/**
 * Get all plugin IDs as an array
 */
export function getAllPluginIds(): string[] {
  return Array.from(PLUGIN_SYMBOL_REGISTRY.values());
}
