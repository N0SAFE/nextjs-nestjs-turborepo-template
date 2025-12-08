import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  DependencySpec,
  FileSpec,
  GeneratorContext,
} from "../../../../types/generator.types";

/**
 * Debug Utils Generator
 *
 * Sets up scoped debug logging utilities with zero production overhead.
 * Inspired by the npm 'debug' package pattern but with TypeScript support.
 *
 * Features:
 * - Scoped debug namespaces (e.g., "app:auth", "app:api:users")
 * - Colored output in development
 * - Zero overhead in production (tree-shaken)
 * - Type-safe factory functions
 * - Browser and Node.js compatible
 * - Configurable via DEBUG environment variable
 */
@Injectable()
export class DebugUtilsGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "debug-utils",
    priority: 15,
    version: "1.0.0",
    description:
      "Scoped debug logging utilities with zero production overhead - namespaced logs, colored output, environment configuration",
    contributesTo: ["lib/debug.ts"],
    dependsOn: [],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];
    const hasNextjs = this.hasPlugin(context, "nextjs");
    const hasNestjs = this.hasPlugin(context, "nestjs");

    // Core debug utilities (shared)
    files.push(
      this.file(
        "packages/utils/debug/index.ts",
        this.getDebugCore(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // Debug configuration
    files.push(
      this.file(
        "packages/utils/debug/config.ts",
        this.getDebugConfig(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // Debug types
    files.push(
      this.file(
        "packages/utils/debug/types.ts",
        this.getDebugTypes(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // Package.json for the debug package
    files.push(
      this.file(
        "packages/utils/debug/package.json",
        this.getPackageJson(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // Debug factory (the main implementation)
    files.push(
      this.file(
        "packages/utils/debug/factory.ts",
        this.getDebugFactory(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // Next.js specific debug utilities
    if (hasNextjs) {
      files.push(
        this.file(
          "apps/web/src/lib/debug.ts",
          this.getNextjsDebug(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );
    }

    // NestJS specific debug utilities
    if (hasNestjs) {
      files.push(
        this.file(
          "apps/api/src/common/debug/index.ts",
          this.getNestjsDebug(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );
      files.push(
        this.file(
          "apps/api/src/common/debug/debug.decorator.ts",
          this.getDebugDecorator(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );
    }

    // Example usage
    files.push(
      this.file(
        "packages/utils/debug/debug.example.ts",
        this.getDebugExample(hasNextjs, hasNestjs),
        { mergeStrategy: "replace", priority: 15, skipIfExists: true },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // No external dependencies needed - pure TypeScript implementation
    return [];
  }

  private getDebugTypes(): string {
    return `/**
 * Debug Types
 *
 * Type definitions for the debug logging system.
 */

/**
 * Log levels supported by the debug system
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Debug configuration options
 */
export interface DebugOptions {
  /** Namespace for this debug instance */
  namespace: string;
  /** Whether to include timestamps */
  timestamp?: boolean;
  /** Color to use in terminal (node.js) */
  color?: string;
  /** Minimum log level */
  level?: LogLevel;
}

/**
 * Debug function interface
 */
export interface DebugFunction {
  /** Log a debug message */
  (...args: unknown[]): void;
  /** Check if this namespace is enabled */
  enabled: boolean;
  /** The namespace of this debug instance */
  namespace: string;
  /** Create a sub-namespace */
  extend: (subNamespace: string) => DebugFunction;
  /** Log with specific level */
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Pattern matcher for debug namespaces
 */
export interface DebugMatcher {
  /** Test if a namespace matches */
  test: (namespace: string) => boolean;
  /** Original pattern string */
  pattern: string;
}

/**
 * Debug factory options
 */
export interface DebugFactoryOptions {
  /** Enable all debug output */
  enableAll?: boolean;
  /** Default log level */
  defaultLevel?: LogLevel;
  /** Custom log function */
  log?: (...args: unknown[]) => void;
}
`;
  }

  private getDebugConfig(): string {
    return `/**
 * Debug Configuration
 *
 * Environment-based configuration for debug logging.
 */
import type { DebugMatcher, LogLevel } from "./types";

/**
 * Get the DEBUG environment variable
 */
function getDebugEnv(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.DEBUG || "";
  }
  if (typeof window !== "undefined" && (window as unknown as Record<string, string>).DEBUG) {
    return (window as unknown as Record<string, string>).DEBUG;
  }
  return "";
}

/**
 * Parse DEBUG environment variable into matchers
 */
function parseDebugPatterns(debug: string): DebugMatcher[] {
  if (!debug) return [];

  return debug
    .split(/[\\s,]+/)
    .filter(Boolean)
    .map((pattern) => {
      const isNegated = pattern.startsWith("-");
      const actualPattern = isNegated ? pattern.slice(1) : pattern;

      // Convert glob pattern to regex
      const regexStr = actualPattern
        .replace(/\\*/g, ".*")
        .replace(/\\?/g, ".");

      const regex = new RegExp(\`^\${regexStr}$\`);

      return {
        pattern,
        test: (namespace: string) => {
          const matches = regex.test(namespace);
          return isNegated ? !matches : matches;
        },
      };
    });
}

/**
 * Check if a namespace is enabled based on DEBUG env
 */
export function isNamespaceEnabled(namespace: string): boolean {
  const debug = getDebugEnv();

  // In production, nothing is enabled unless explicitly set
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    if (!debug) return false;
  }

  // If DEBUG is set to '*', enable everything
  if (debug === "*") return true;

  // Check patterns
  const matchers = parseDebugPatterns(debug);
  if (matchers.length === 0) return false;

  // Last matching pattern wins
  let enabled = false;
  for (const matcher of matchers) {
    if (matcher.pattern.startsWith("-")) {
      if (matcher.test(namespace)) {
        enabled = false;
      }
    } else if (matcher.test(namespace)) {
      enabled = true;
    }
  }

  return enabled;
}

/**
 * Get the minimum log level from environment
 */
export function getMinLogLevel(): LogLevel {
  if (typeof process !== "undefined" && process.env.DEBUG_LEVEL) {
    const level = process.env.DEBUG_LEVEL.toLowerCase();
    if (["debug", "info", "warn", "error"].includes(level)) {
      return level as LogLevel;
    }
  }
  return "debug";
}

/**
 * Log level priority (higher = more severe)
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Terminal colors for different namespaces
 */
export const TERMINAL_COLORS = [
  "\\x1b[36m", // cyan
  "\\x1b[33m", // yellow
  "\\x1b[32m", // green
  "\\x1b[35m", // magenta
  "\\x1b[34m", // blue
  "\\x1b[31m", // red
];

/**
 * Get a consistent color for a namespace
 */
export function getNamespaceColor(namespace: string): string {
  let hash = 0;
  for (let i = 0; i < namespace.length; i++) {
    hash = (hash << 5) - hash + namespace.charCodeAt(i);
    hash |= 0;
  }
  return TERMINAL_COLORS[Math.abs(hash) % TERMINAL_COLORS.length];
}

/**
 * Reset terminal color
 */
export const RESET_COLOR = "\\x1b[0m";
`;
  }

  private getDebugCore(): string {
    return `/**
 * Debug Utilities
 *
 * Scoped debug logging with zero production overhead.
 *
 * Usage:
 *   const debug = createDebug("app:auth");
 *   debug("user logged in", { userId: 123 });
 *
 * Enable via environment:
 *   DEBUG=app:* bun run dev        # Enable all app namespaces
 *   DEBUG=app:auth,app:api bun run dev  # Enable specific namespaces
 *   DEBUG=* bun run dev            # Enable all debug output
 */
export { createDebug, debug } from "./factory";
export type { DebugFunction, DebugOptions, LogLevel } from "./types";
`;
  }

  private getPackageJson(): string {
    return `{
  "name": "@repo/debug",
  "version": "1.0.0",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./config": "./config.ts",
    "./types": "./types.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
`;
  }

  private getDebugFactory(): string {
    return `/**
 * Debug Factory
 *
 * Creates scoped debug instances with namespace support.
 */
import type { DebugFunction, LogLevel } from "./types";
import {
  isNamespaceEnabled,
  getMinLogLevel,
  LOG_LEVEL_PRIORITY,
  getNamespaceColor,
  RESET_COLOR,
} from "./config";

/**
 * Format a log message with namespace and timestamp
 */
function formatMessage(
  namespace: string,
  level: LogLevel,
  args: unknown[],
): string[] {
  const timestamp = new Date().toISOString();
  const color = getNamespaceColor(namespace);
  const isBrowser = typeof window !== "undefined";

  if (isBrowser) {
    // Browser formatting (no ANSI colors)
    return [\`[\${timestamp}] \${namespace} [\${level.toUpperCase()}]\`, ...args];
  }

  // Node.js formatting with colors
  const levelColors: Record<LogLevel, string> = {
    debug: "\\x1b[90m", // gray
    info: "\\x1b[36m",  // cyan
    warn: "\\x1b[33m",  // yellow
    error: "\\x1b[31m", // red
  };

  const prefix = \`\${color}\${namespace}\${RESET_COLOR} \${levelColors[level]}[\${level.toUpperCase()}]\${RESET_COLOR}\`;
  return [prefix, ...args];
}

/**
 * Create a debug function for a namespace
 */
export function createDebug(namespace: string): DebugFunction {
  const minLevel = getMinLogLevel();

  const shouldLog = (level: LogLevel): boolean => {
    if (!isNamespaceEnabled(namespace)) return false;
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
  };

  const log = (level: LogLevel, ...args: unknown[]): void => {
    if (!shouldLog(level)) return;

    const formatted = formatMessage(namespace, level, args);

    switch (level) {
      case "error":
        console.error(...formatted);
        break;
      case "warn":
        console.warn(...formatted);
        break;
      case "info":
        console.info(...formatted);
        break;
      default:
        console.log(...formatted);
    }
  };

  // Create the debug function
  const debugFn = (...args: unknown[]): void => {
    log("debug", ...args);
  };

  // Add properties and methods
  Object.defineProperty(debugFn, "enabled", {
    get: () => isNamespaceEnabled(namespace),
  });

  Object.defineProperty(debugFn, "namespace", {
    value: namespace,
  });

  // Add level-specific methods
  (debugFn as DebugFunction).info = (...args: unknown[]) => log("info", ...args);
  (debugFn as DebugFunction).warn = (...args: unknown[]) => log("warn", ...args);
  (debugFn as DebugFunction).error = (...args: unknown[]) => log("error", ...args);

  // Add extend method for sub-namespaces
  (debugFn as DebugFunction).extend = (subNamespace: string): DebugFunction => {
    return createDebug(\`\${namespace}:\${subNamespace}\`);
  };

  return debugFn as DebugFunction;
}

/**
 * Default debug instance for quick usage
 */
export const debug = createDebug("app");
`;
  }

  private getNextjsDebug(): string {
    return `/**
 * Next.js Debug Utilities
 *
 * Pre-configured debug namespaces for Next.js application areas.
 */
import { createDebug } from "@repo/debug";

// Core application areas
export const debugApp = createDebug("web:app");
export const debugAuth = createDebug("web:auth");
export const debugApi = createDebug("web:api");
export const debugRouter = createDebug("web:router");
export const debugMiddleware = createDebug("web:middleware");
export const debugCache = createDebug("web:cache");

// Feature-specific debuggers
export const debugQuery = createDebug("web:query");
export const debugMutation = createDebug("web:mutation");
export const debugForm = createDebug("web:form");
export const debugState = createDebug("web:state");

// UI/Component debuggers
export const debugUI = createDebug("web:ui");
export const debugRender = createDebug("web:render");

/**
 * Create a debug instance for a specific component
 */
export function debugComponent(componentName: string) {
  return createDebug(\`web:component:\${componentName}\`);
}

/**
 * Create a debug instance for a specific page
 */
export function debugPage(pagePath: string) {
  const normalizedPath = pagePath.replace(/\\//g, ":");
  return createDebug(\`web:page:\${normalizedPath}\`);
}

/**
 * Create a debug instance for a specific hook
 */
export function debugHook(hookName: string) {
  return createDebug(\`web:hook:\${hookName}\`);
}

// Re-export factory for custom namespaces
export { createDebug };
`;
  }

  private getNestjsDebug(): string {
    return `/**
 * NestJS Debug Utilities
 *
 * Pre-configured debug namespaces for NestJS application areas.
 */
import { createDebug } from "@repo/debug";

// Core application areas
export const debugApp = createDebug("api:app");
export const debugAuth = createDebug("api:auth");
export const debugDatabase = createDebug("api:db");
export const debugCache = createDebug("api:cache");
export const debugQueue = createDebug("api:queue");

// Request/Response debugging
export const debugRequest = createDebug("api:request");
export const debugResponse = createDebug("api:response");

// Module-specific debuggers
export const debugController = createDebug("api:controller");
export const debugService = createDebug("api:service");
export const debugRepository = createDebug("api:repository");
export const debugGuard = createDebug("api:guard");
export const debugInterceptor = createDebug("api:interceptor");
export const debugPipe = createDebug("api:pipe");

/**
 * Create a debug instance for a specific module
 */
export function debugModule(moduleName: string) {
  return createDebug(\`api:module:\${moduleName}\`);
}

/**
 * Create a debug instance for a specific controller
 */
export function debugCtrl(controllerName: string) {
  return createDebug(\`api:ctrl:\${controllerName}\`);
}

/**
 * Create a debug instance for a specific service
 */
export function debugSvc(serviceName: string) {
  return createDebug(\`api:svc:\${serviceName}\`);
}

// Re-export factory for custom namespaces
export { createDebug };
`;
  }

  private getDebugDecorator(): string {
    return `/**
 * Debug Decorator
 *
 * Method decorator for automatic debug logging in NestJS.
 */
import { createDebug } from "@repo/debug";

/**
 * Log method entry, exit, and errors
 *
 * @example
 * class UserService {
 *   @Debug("UserService")
 *   async findById(id: string) {
 *     return this.repo.findById(id);
 *   }
 * }
 */
export function Debug(namespace: string) {
  const debug = createDebug(\`api:debug:\${namespace}\`);

  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const methodDebug = debug.extend(propertyKey);

      methodDebug("called with:", args);
      const start = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        methodDebug("completed in %dms", duration);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        methodDebug.error("failed after %dms:", duration, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Log class instantiation
 */
export function DebugClass(namespace: string) {
  return function <T extends new (...args: unknown[]) => object>(
    constructor: T,
  ) {
    const debug = createDebug(\`api:class:\${namespace}\`);

    return class extends constructor {
      constructor(...args: unknown[]) {
        debug("instantiating %s", constructor.name);
        super(...args);
        debug("instantiated %s", constructor.name);
      }
    };
  };
}

/**
 * Measure and log method execution time
 */
export function Timed(namespace: string) {
  const debug = createDebug(\`api:timing:\${namespace}\`);

  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const start = process.hrtime.bigint();

      try {
        return await originalMethod.apply(this, args);
      } finally {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        debug("%s took %.2fms", propertyKey, durationMs);
      }
    };

    return descriptor;
  };
}
`;
  }

  private getDebugExample(hasNextjs: boolean, hasNestjs: boolean): string {
    const nextjsExample = hasNextjs
      ? `
// Next.js example usage
import { debugAuth, debugApi, debugComponent } from "@/lib/debug";

// In a component
const debug = debugComponent("UserProfile");

export function UserProfile({ userId }: { userId: string }) {
  debug("rendering for user", userId);

  // ... component logic

  debug("rendered successfully");
}

// In an API handler
export async function fetchUser(userId: string) {
  debugApi("fetching user", userId);

  const response = await fetch(\`/api/users/\${userId}\`);
  const data = await response.json();

  debugApi("fetched user", data);
  return data;
}

// For authentication
export function useAuth() {
  debugAuth("initializing auth hook");

  // ... auth logic
}
`
      : "";

    const nestjsExample = hasNestjs
      ? `
// NestJS example usage
import { debugService, debugRepository, debugModule } from "@/common/debug";
import { Debug, Timed } from "@/common/debug/debug.decorator";

// In a service
export class UserService {
  private readonly debug = debugModule("UserService");

  @Debug("UserService")
  @Timed("UserService")
  async findById(id: string) {
    this.debug("finding user by id", id);

    const user = await this.userRepository.findById(id);

    this.debug("found user", user?.email);
    return user;
  }
}

// In a repository
export class UserRepository {
  private readonly debug = debugRepository.extend("User");

  async findById(id: string) {
    this.debug("querying database for user", id);

    // ... database query

    this.debug("query completed");
  }
}
`
      : "";

    return `/**
 * Debug Utilities - Example Usage
 *
 * This file demonstrates how to use the debug utilities.
 *
 * Enable debug output:
 *   DEBUG=* bun run dev           # All debug output
 *   DEBUG=web:* bun run dev       # All Next.js debug
 *   DEBUG=api:* bun run dev       # All NestJS debug
 *   DEBUG=web:auth,api:db bun run dev  # Specific namespaces
 *
 * Log levels:
 *   DEBUG_LEVEL=warn bun run dev  # Only warn and error
 */
import { createDebug } from "@repo/debug";

// Basic usage
const debug = createDebug("myapp:feature");

// Log messages
debug("Starting feature initialization");
debug("Config loaded:", { timeout: 5000 });
debug.info("Feature ready");
debug.warn("Deprecated method used");
debug.error("Feature failed to load");

// Create sub-namespaces
const subDebug = debug.extend("sub");
subDebug("This is myapp:feature:sub namespace");

// Check if enabled
if (debug.enabled) {
  // Expensive debugging operation
  const debugData = JSON.stringify(complexObject, null, 2);
  debug("Complex data:", debugData);
}
${nextjsExample}${nestjsExample}
/**
 * Best Practices:
 *
 * 1. Use consistent namespace hierarchy:
 *    - "app:module:component" pattern
 *    - e.g., "web:auth:login", "api:users:repository"
 *
 * 2. Use debug.extend() for sub-namespaces instead of creating new instances
 *
 * 3. Check debug.enabled before expensive operations
 *
 * 4. Use appropriate log levels:
 *    - debug: detailed tracing
 *    - info: general information
 *    - warn: potential issues
 *    - error: actual errors
 *
 * 5. Include context in messages:
 *    debug("user action", { userId, action, timestamp });
 */
`;
  }
}
