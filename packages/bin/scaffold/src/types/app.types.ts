/**
 * App Type Definitions
 *
 * These types define the multi-app type system for scaffolding different
 * application frameworks (NestJS, Next.js, Fumadocs, Express, Fastify, etc.).
 *
 * @see ARCHITECTURE.md - Multi-App Type System section
 */

import type { PluginsConfig } from "./config.types";

// ============================================================================
// App Type Identifiers
// ============================================================================

/**
 * Supported application type identifiers
 * Each represents a distinct framework/technology stack
 */
export type AppTypeId =
  | "nestjs" // NestJS API application
  | "nextjs" // Next.js web application
  | "fumadocs" // Fumadocs documentation site
  | "express" // Express.js microservice
  | "fastify" // Fastify microservice
  | "astro"; // Astro static/hybrid site

/**
 * All supported app type IDs as a constant array
 * Useful for validation and iteration
 */
export const APP_TYPE_IDS: readonly AppTypeId[] = [
  "nestjs",
  "nextjs",
  "fumadocs",
  "express",
  "fastify",
  "astro",
] as const;

// ============================================================================
// App Capabilities
// ============================================================================

/**
 * Capabilities that an app type can provide
 * Used for plugin compatibility checking
 */
export type AppCapability =
  | "http-server" // Can serve HTTP requests
  | "ssr" // Server-side rendering
  | "ssg" // Static site generation
  | "api" // REST/RPC API endpoints
  | "websocket" // WebSocket support
  | "database" // Database connectivity
  | "auth" // Authentication support
  | "react" // React rendering
  | "vue" // Vue rendering
  | "edge-runtime" // Edge runtime compatible
  | "middleware" // Middleware support
  | "dependency-injection" // DI container support
  | "decorators" // Decorator-based APIs
  | "file-routing" // File-based routing
  | "streaming"; // Response streaming

/**
 * All app capabilities as a constant array
 */
export const APP_CAPABILITIES: readonly AppCapability[] = [
  "http-server",
  "ssr",
  "ssg",
  "api",
  "websocket",
  "database",
  "auth",
  "react",
  "vue",
  "edge-runtime",
  "middleware",
  "dependency-injection",
  "decorators",
  "file-routing",
  "streaming",
] as const;

// ============================================================================
// App Type Definition
// ============================================================================

/**
 * App type definition
 * Describes a complete application framework type
 */
export interface AppType {
  /** Unique identifier for this app type */
  id: AppTypeId;
  /** Display name */
  name: string;
  /** Description of this app type */
  description: string;
  /** Default output path relative to monorepo root */
  defaultPath: string;
  /** Capabilities this app type provides */
  capabilities: AppCapability[];
  /** Plugin IDs that are supported by this app type */
  supportedPlugins: string[];
  /** Plugin IDs that are required for this app type */
  requiredPlugins: string[];
  /** File extensions this app type typically uses */
  fileExtensions: string[];
  /** Package.json dependencies required */
  baseDependencies: Record<string, string>;
  /** Package.json devDependencies required */
  baseDevDependencies: Record<string, string>;
  /** Icon name for UI */
  icon?: string;
  /** Documentation URL */
  docsUrl?: string;
  /** Whether this app type is stable/production-ready */
  stable: boolean;
}

/**
 * App type metadata for registry
 */
export interface AppTypeMetadata {
  /** App type ID */
  id: AppTypeId;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Default path */
  defaultPath: string;
  /** Icon */
  icon?: string;
  /** Whether stable */
  stable: boolean;
  /** Supported capabilities count */
  capabilityCount: number;
}

// ============================================================================
// App Configuration
// ============================================================================

/**
 * Configuration for a single app instance in the monorepo
 */
export interface AppConfig {
  /** Unique name for this app instance (e.g., "api", "web", "admin") */
  name: string;
  /** App type (framework) */
  type: AppTypeId;
  /** Output path relative to monorepo root (e.g., "apps/api", "services/auth") */
  path: string;
  /** 
   * Plugins configuration for this specific app
   * Can be object format: { typescript: { strict: true }, eslint: {} }
   * Or legacy array format: ["typescript", "eslint"] 
   */
  plugins: PluginsConfig | string[];
  /** Port configuration for this app */
  port?: number;
  /** Whether this app is the primary of its type */
  primary?: boolean;
  /** App-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Resolved app configuration with defaults applied
 */
export interface ResolvedAppConfig extends AppConfig {
  /** Resolved plugin order (topologically sorted) */
  resolvedPluginOrder: string[];
  /** Auto-enabled plugins for this app (may be empty) */
  autoEnabledPlugins?: string[];
  /** App type definition */
  appType: AppType;
  /** Resolved timestamp */
  resolvedAt: Date;
}

// ============================================================================
// App Type Registry
// ============================================================================

/**
 * Built-in app type definitions
 */
export const APP_TYPES: Record<AppTypeId, AppType> = {
  nestjs: {
    id: "nestjs",
    name: "NestJS",
    description: "NestJS API with modules, guards, decorators, and dependency injection",
    defaultPath: "apps/api",
    capabilities: [
      "http-server",
      "api",
      "websocket",
      "database",
      "auth",
      "middleware",
      "dependency-injection",
      "decorators",
    ],
    supportedPlugins: [
      "typescript",
      "eslint",
      "prettier",
      "vitest",
      "drizzle",
      "better-auth",
      "orpc",
      "zod",
      "redis",
      "postgresql",
      "docker",
      "env-management",
      "health-check",
      "rate-limiting",
      "swagger",
      "logging",
    ],
    requiredPlugins: ["typescript"],
    fileExtensions: [".ts", ".js", ".json"],
    baseDependencies: {
      "@nestjs/common": "^10.0.0",
      "@nestjs/core": "^10.0.0",
      "@nestjs/platform-express": "^10.0.0",
      "reflect-metadata": "^0.2.0",
      rxjs: "^7.8.1",
    },
    baseDevDependencies: {
      "@nestjs/cli": "^10.0.0",
      "@nestjs/schematics": "^10.0.0",
      "@nestjs/testing": "^10.0.0",
    },
    icon: "Server",
    docsUrl: "https://nestjs.com/",
    stable: true,
  },

  nextjs: {
    id: "nextjs",
    name: "Next.js",
    description: "Next.js 15+ web application with App Router and React 19",
    defaultPath: "apps/web",
    capabilities: [
      "http-server",
      "ssr",
      "ssg",
      "api",
      "react",
      "edge-runtime",
      "middleware",
      "file-routing",
      "streaming",
    ],
    supportedPlugins: [
      "typescript",
      "eslint",
      "prettier",
      "vitest",
      "tailwindcss",
      "shadcn-ui",
      "react-query",
      "zustand",
      "zod",
      "better-auth",
      "orpc",
      "next-themes",
      "docker",
      "env-management",
      "seo",
      "analytics",
    ],
    requiredPlugins: ["typescript"],
    fileExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    baseDependencies: {
      next: "^15.0.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
    baseDevDependencies: {
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
    },
    icon: "Globe",
    docsUrl: "https://nextjs.org/",
    stable: true,
  },

  fumadocs: {
    id: "fumadocs",
    name: "Fumadocs",
    description: "Fumadocs documentation site with MDX support",
    defaultPath: "apps/docs",
    capabilities: ["http-server", "ssg", "react", "file-routing", "middleware"],
    supportedPlugins: [
      "typescript",
      "eslint",
      "prettier",
      "tailwindcss",
      "docker",
      "env-management",
      "seo",
    ],
    requiredPlugins: ["typescript"],
    fileExtensions: [".ts", ".tsx", ".mdx", ".md", ".json"],
    baseDependencies: {
      next: "^15.0.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      fumadocs: "^14.0.0",
      "fumadocs-ui": "^14.0.0",
      "fumadocs-mdx": "^10.0.0",
    },
    baseDevDependencies: {
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
    },
    icon: "Book",
    docsUrl: "https://fumadocs.vercel.app/",
    stable: true,
  },

  express: {
    id: "express",
    name: "Express",
    description: "Express.js lightweight microservice",
    defaultPath: "services/express",
    capabilities: ["http-server", "api", "middleware", "websocket"],
    supportedPlugins: [
      "typescript",
      "eslint",
      "prettier",
      "vitest",
      "zod",
      "docker",
      "env-management",
      "logging",
      "rate-limiting",
    ],
    requiredPlugins: ["typescript"],
    fileExtensions: [".ts", ".js", ".json"],
    baseDependencies: {
      express: "^4.18.0",
    },
    baseDevDependencies: {
      "@types/express": "^4.17.0",
    },
    icon: "Zap",
    docsUrl: "https://expressjs.com/",
    stable: false, // Planned, not yet implemented
  },

  fastify: {
    id: "fastify",
    name: "Fastify",
    description: "Fastify high-performance microservice",
    defaultPath: "services/fastify",
    capabilities: ["http-server", "api", "middleware", "websocket", "streaming"],
    supportedPlugins: [
      "typescript",
      "eslint",
      "prettier",
      "vitest",
      "zod",
      "docker",
      "env-management",
      "logging",
      "rate-limiting",
    ],
    requiredPlugins: ["typescript"],
    fileExtensions: [".ts", ".js", ".json"],
    baseDependencies: {
      fastify: "^4.24.0",
    },
    baseDevDependencies: {},
    icon: "Rocket",
    docsUrl: "https://fastify.dev/",
    stable: false, // Planned, not yet implemented
  },

  astro: {
    id: "astro",
    name: "Astro",
    description: "Astro static/hybrid site with island architecture",
    defaultPath: "apps/landing",
    capabilities: ["http-server", "ssg", "ssr", "react", "vue", "edge-runtime", "file-routing"],
    supportedPlugins: [
      "typescript",
      "eslint",
      "prettier",
      "tailwindcss",
      "docker",
      "env-management",
      "seo",
      "analytics",
    ],
    requiredPlugins: ["typescript"],
    fileExtensions: [".astro", ".ts", ".tsx", ".js", ".jsx", ".json"],
    baseDependencies: {
      astro: "^4.0.0",
    },
    baseDevDependencies: {},
    icon: "Star",
    docsUrl: "https://astro.build/",
    stable: false, // Planned, not yet implemented
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if an app type ID is valid
 */
export function isValidAppTypeId(id: string): id is AppTypeId {
  return APP_TYPE_IDS.includes(id as AppTypeId);
}

/**
 * Get app type by ID
 */
export function getAppType(id: AppTypeId): AppType | undefined {
  return APP_TYPES[id];
}

/**
 * Get all stable app types
 */
export function getStableAppTypes(): AppType[] {
  return Object.values(APP_TYPES).filter((app) => app.stable);
}

/**
 * Get all app types (including unstable)
 */
export function getAllAppTypes(): AppType[] {
  return Object.values(APP_TYPES);
}

/**
 * Check if an app type supports a specific capability
 */
export function appTypeHasCapability(appTypeId: AppTypeId, capability: AppCapability): boolean {
  const appType = APP_TYPES[appTypeId];
  return appType?.capabilities.includes(capability) ?? false;
}

/**
 * Check if an app type supports a specific plugin
 */
export function appTypeSupportsPlugin(appTypeId: AppTypeId, pluginId: string): boolean {
  const appType = APP_TYPES[appTypeId];
  return appType?.supportedPlugins.includes(pluginId) ?? false;
}

/**
 * Get app types that support a specific capability
 */
export function getAppTypesWithCapability(capability: AppCapability): AppType[] {
  return Object.values(APP_TYPES).filter((app) => app.capabilities.includes(capability));
}

/**
 * Get app types that support a specific plugin
 */
export function getAppTypesSupportingPlugin(pluginId: string): AppType[] {
  return Object.values(APP_TYPES).filter((app) => app.supportedPlugins.includes(pluginId));
}

/**
 * Get app type metadata for UI display
 */
export function getAppTypeMetadata(): AppTypeMetadata[] {
  return Object.values(APP_TYPES).map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description,
    defaultPath: app.defaultPath,
    icon: app.icon,
    stable: app.stable,
    capabilityCount: app.capabilities.length,
  }));
}
