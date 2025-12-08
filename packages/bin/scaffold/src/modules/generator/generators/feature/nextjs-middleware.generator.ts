/**
 * Next.js Middleware Generator
 * Version: 1.0.0
 *
 * Generates a composable middleware factory chain pattern for Next.js.
 * This approach allows combining multiple middleware functions in a
 * type-safe and maintainable way.
 *
 * Features:
 * - Middleware factory pattern for composition
 * - Type-safe middleware chain
 * - Built-in middleware utilities (auth, rate-limit, cors)
 * - Request/response helpers
 * - Conditional middleware execution
 * - Path-based middleware routing
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  DependencySpec,
  FileSpec,
  GeneratorContext,
} from "../../../../types/generator.types";

@Injectable()
export class NextjsMiddlewareGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "nextjs-middleware",
    priority: 22,
    version: "1.0.0",
    description:
      "Composable middleware factory chain pattern for Next.js - includes type-safe composition, utilities, and path routing",
    contributesTo: [
      "middleware.ts",
      "lib/middleware/",
    ],
    dependsOn: ["nextjs"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    if (!this.hasPlugin(context, "nextjs")) {
      return [];
    }

    const files: FileSpec[] = [];
    const hasBetterAuth = this.hasPlugin(context, "better-auth");

    // Core middleware types
    files.push(
      this.file(
        "apps/web/src/lib/middleware/types.ts",
        this.getMiddlewareTypes(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Middleware factory and chain
    files.push(
      this.file(
        "apps/web/src/lib/middleware/factory.ts",
        this.getMiddlewareFactory(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Middleware utilities
    files.push(
      this.file(
        "apps/web/src/lib/middleware/utils.ts",
        this.getMiddlewareUtils(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Path matcher utility
    files.push(
      this.file(
        "apps/web/src/lib/middleware/path-matcher.ts",
        this.getPathMatcher(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Built-in middleware: Auth guard
    files.push(
      this.file(
        "apps/web/src/lib/middleware/middlewares/auth-guard.ts",
        this.getAuthGuardMiddleware(hasBetterAuth),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Built-in middleware: Rate limit
    files.push(
      this.file(
        "apps/web/src/lib/middleware/middlewares/rate-limit.ts",
        this.getRateLimitMiddleware(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Built-in middleware: CORS
    files.push(
      this.file(
        "apps/web/src/lib/middleware/middlewares/cors.ts",
        this.getCorsMiddleware(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Built-in middleware: Logging
    files.push(
      this.file(
        "apps/web/src/lib/middleware/middlewares/logging.ts",
        this.getLoggingMiddleware(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Built-in middleware: Headers
    files.push(
      this.file(
        "apps/web/src/lib/middleware/middlewares/headers.ts",
        this.getHeadersMiddleware(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Middleware barrel export
    files.push(
      this.file(
        "apps/web/src/lib/middleware/index.ts",
        this.getMiddlewareIndex(),
        { mergeStrategy: "replace", priority: 22 },
      ),
    );

    // Example middleware.ts
    files.push(
      this.file(
        "apps/web/src/middleware.example.ts",
        this.getExampleMiddleware(hasBetterAuth),
        { mergeStrategy: "replace", priority: 22, skipIfExists: true },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // No additional dependencies needed - uses Next.js built-in types
    return [];
  }

  private getMiddlewareTypes(): string {
    return `/**
 * Middleware Types
 *
 * Type definitions for the composable middleware pattern.
 */
import type { NextRequest, NextResponse } from "next/server";

/**
 * Context passed through the middleware chain
 */
export interface MiddlewareContext {
  /** The incoming request */
  request: NextRequest;
  /** Custom data that can be passed between middleware */
  data: Record<string, unknown>;
  /** Response headers to be set */
  headers: Headers;
  /** Whether to skip remaining middleware */
  skip: boolean;
}

/**
 * Result from a middleware function
 */
export type MiddlewareResult =
  | NextResponse
  | Response
  | void
  | null
  | undefined;

/**
 * A middleware function that can be composed
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<MiddlewareResult>,
) => Promise<MiddlewareResult> | MiddlewareResult;

/**
 * Configuration for middleware
 */
export interface MiddlewareConfig {
  /** Paths to include (glob patterns) */
  include?: string[];
  /** Paths to exclude (glob patterns) */
  exclude?: string[];
  /** Whether this middleware is enabled */
  enabled?: boolean;
}

/**
 * A configured middleware with optional path matching
 */
export interface ConfiguredMiddleware {
  /** The middleware function */
  handler: MiddlewareFunction;
  /** Configuration for this middleware */
  config?: MiddlewareConfig;
}

/**
 * Options for creating a middleware chain
 */
export interface ChainOptions {
  /** Default response if no middleware returns a response */
  defaultResponse?: () => NextResponse;
  /** Error handler for middleware errors */
  onError?: (error: Error, context: MiddlewareContext) => NextResponse;
}
`;
  }

  private getMiddlewareFactory(): string {
    return `/**
 * Middleware Factory
 *
 * Factory functions for creating and composing middleware.
 */
import { NextResponse, type NextRequest } from "next/server";
import type {
  MiddlewareFunction,
  MiddlewareContext,
  MiddlewareResult,
  ConfiguredMiddleware,
  ChainOptions,
  MiddlewareConfig,
} from "./types";
import { matchPath } from "./path-matcher";

/**
 * Create a middleware context from a request
 */
function createContext(request: NextRequest): MiddlewareContext {
  return {
    request,
    data: {},
    headers: new Headers(),
    skip: false,
  };
}

/**
 * Apply context headers to response
 */
function applyHeaders(response: NextResponse, context: MiddlewareContext): NextResponse {
  context.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a middleware chain that executes middleware in order
 *
 * @example
 * \`\`\`typescript
 * import { createMiddlewareChain } from "@/lib/middleware";
 *
 * const middleware = createMiddlewareChain([
 *   loggingMiddleware,
 *   authGuardMiddleware,
 *   rateLimitMiddleware,
 * ]);
 *
 * export default middleware;
 * \`\`\`
 */
export function createMiddlewareChain(
  middlewares: (MiddlewareFunction | ConfiguredMiddleware)[],
  options: ChainOptions = {},
): (request: NextRequest) => Promise<NextResponse> {
  const {
    defaultResponse = () => NextResponse.next(),
    onError = (error) => {
      console.error("[Middleware Error]", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    },
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const context = createContext(request);
    const pathname = request.nextUrl.pathname;

    // Normalize middleware to ConfiguredMiddleware
    const normalizedMiddlewares: ConfiguredMiddleware[] = middlewares.map((m) =>
      typeof m === "function" ? { handler: m } : m,
    );

    // Execute middleware chain
    let index = 0;

    const next = async (): Promise<MiddlewareResult> => {
      // Skip remaining middleware if flagged
      if (context.skip) {
        return undefined;
      }

      // End of chain
      if (index >= normalizedMiddlewares.length) {
        return undefined;
      }

      const current = normalizedMiddlewares[index++];
      const { handler, config } = current;

      // Check if middleware should run for this path
      if (config) {
        const { include, exclude, enabled = true } = config;

        if (!enabled) {
          return next();
        }

        if (exclude && exclude.some((pattern) => matchPath(pathname, pattern))) {
          return next();
        }

        if (include && !include.some((pattern) => matchPath(pathname, pattern))) {
          return next();
        }
      }

      try {
        return await handler(context, next);
      } catch (error) {
        return onError(error as Error, context);
      }
    };

    const result = await next();

    // Return the result or default response
    if (result instanceof NextResponse || result instanceof Response) {
      return applyHeaders(result as NextResponse, context);
    }

    return applyHeaders(defaultResponse(), context);
  };
}

/**
 * Create a middleware with configuration
 *
 * @example
 * \`\`\`typescript
 * const authMiddleware = withConfig(authGuard, {
 *   include: ["/dashboard/*", "/api/*"],
 *   exclude: ["/api/public/*"],
 * });
 * \`\`\`
 */
export function withConfig(
  handler: MiddlewareFunction,
  config: MiddlewareConfig,
): ConfiguredMiddleware {
  return { handler, config };
}

/**
 * Conditionally execute middleware based on a predicate
 *
 * @example
 * \`\`\`typescript
 * const middleware = conditional(
 *   (ctx) => ctx.request.headers.get("x-api-key") !== null,
 *   apiKeyValidation,
 * );
 * \`\`\`
 */
export function conditional(
  predicate: (context: MiddlewareContext) => boolean | Promise<boolean>,
  handler: MiddlewareFunction,
): MiddlewareFunction {
  return async (context, next) => {
    const shouldRun = await predicate(context);
    if (shouldRun) {
      return handler(context, next);
    }
    return next();
  };
}

/**
 * Compose multiple middleware into a single middleware
 *
 * @example
 * \`\`\`typescript
 * const securityMiddleware = compose([
 *   corsMiddleware,
 *   headersMiddleware,
 *   rateLimitMiddleware,
 * ]);
 * \`\`\`
 */
export function compose(
  middlewares: MiddlewareFunction[],
): MiddlewareFunction {
  return async (context, next) => {
    let index = 0;

    const runNext = async (): Promise<MiddlewareResult> => {
      if (index >= middlewares.length) {
        return next();
      }
      const current = middlewares[index++];
      return current(context, runNext);
    };

    return runNext();
  };
}

/**
 * Create a middleware that runs in parallel
 * All middleware must complete, first response wins
 *
 * @example
 * \`\`\`typescript
 * const validationMiddleware = parallel([
 *   validateApiKey,
 *   validateJwt,
 * ]);
 * \`\`\`
 */
export function parallel(
  middlewares: MiddlewareFunction[],
): MiddlewareFunction {
  return async (context, next) => {
    const results = await Promise.all(
      middlewares.map((m) => m(context, async () => undefined)),
    );

    // Return first non-null result
    for (const result of results) {
      if (result) return result;
    }

    return next();
  };
}
`;
  }

  private getMiddlewareUtils(): string {
    return `/**
 * Middleware Utilities
 *
 * Helper functions for common middleware operations.
 */
import { NextResponse } from "next/server";
import type { MiddlewareContext } from "./types";

/**
 * Redirect to a URL
 */
export function redirect(url: string, status: 307 | 308 = 307): NextResponse {
  return NextResponse.redirect(url, status);
}

/**
 * Redirect to a path (relative to current origin)
 */
export function redirectToPath(
  context: MiddlewareContext,
  path: string,
  status: 307 | 308 = 307,
): NextResponse {
  const url = new URL(path, context.request.url);
  return NextResponse.redirect(url, status);
}

/**
 * Rewrite to a different URL (internal routing)
 */
export function rewrite(url: string): NextResponse {
  return NextResponse.rewrite(url);
}

/**
 * Rewrite to a path (relative to current origin)
 */
export function rewriteToPath(
  context: MiddlewareContext,
  path: string,
): NextResponse {
  const url = new URL(path, context.request.url);
  return NextResponse.rewrite(url);
}

/**
 * Return a JSON response
 */
export function json<T>(
  data: T,
  init?: ResponseInit,
): NextResponse {
  return NextResponse.json(data, init);
}

/**
 * Return an error response
 */
export function error(
  message: string,
  status: number = 500,
): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Return an unauthorized response
 */
export function unauthorized(message = "Unauthorized"): NextResponse {
  return error(message, 401);
}

/**
 * Return a forbidden response
 */
export function forbidden(message = "Forbidden"): NextResponse {
  return error(message, 403);
}

/**
 * Return a not found response
 */
export function notFound(message = "Not Found"): NextResponse {
  return error(message, 404);
}

/**
 * Return a rate limited response
 */
export function rateLimited(
  retryAfter?: number,
  message = "Too Many Requests",
): NextResponse {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }
  return new NextResponse(JSON.stringify({ error: message }), {
    status: 429,
    headers,
  });
}

/**
 * Set a header in the context (will be applied to response)
 */
export function setHeader(
  context: MiddlewareContext,
  name: string,
  value: string,
): void {
  context.headers.set(name, value);
}

/**
 * Set multiple headers in the context
 */
export function setHeaders(
  context: MiddlewareContext,
  headers: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(headers)) {
    context.headers.set(name, value);
  }
}

/**
 * Get a cookie value from the request
 */
export function getCookie(
  context: MiddlewareContext,
  name: string,
): string | undefined {
  return context.request.cookies.get(name)?.value;
}

/**
 * Set context data for downstream middleware
 */
export function setContextData<T>(
  context: MiddlewareContext,
  key: string,
  value: T,
): void {
  context.data[key] = value;
}

/**
 * Get context data from upstream middleware
 */
export function getContextData<T>(
  context: MiddlewareContext,
  key: string,
): T | undefined {
  return context.data[key] as T | undefined;
}

/**
 * Check if request is an API request
 */
export function isApiRequest(context: MiddlewareContext): boolean {
  return context.request.nextUrl.pathname.startsWith("/api");
}

/**
 * Check if request is a static file request
 */
export function isStaticRequest(context: MiddlewareContext): boolean {
  const pathname = context.request.nextUrl.pathname;
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  );
}

/**
 * Get client IP address
 */
export function getClientIp(context: MiddlewareContext): string {
  return (
    context.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    context.request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Get request method
 */
export function getMethod(context: MiddlewareContext): string {
  return context.request.method;
}

/**
 * Get request pathname
 */
export function getPathname(context: MiddlewareContext): string {
  return context.request.nextUrl.pathname;
}

/**
 * Get search params
 */
export function getSearchParams(
  context: MiddlewareContext,
): URLSearchParams {
  return context.request.nextUrl.searchParams;
}
`;
  }

  private getPathMatcher(): string {
    // Using array join to avoid escaping complexities
    const lines = [
      '/**',
      ' * Path Matcher',
      ' *',
      ' * Utilities for matching URL paths against patterns.',
      ' */',
      '',
      '/**',
      ' * Simple glob-to-regex converter',
      ' */',
      'function globToRegex(pattern: string): RegExp {',
      '  // Simple conversion: * -> [^/]*, ** -> .*, ? -> .',
      '  let result = pattern;',
      '',
      '  // Escape regex special chars first (except * and ?)',
      '  result = result.replace(/[.+^${}()|[\\]]/g, "\\\\$&");',
      '',
      '  // Handle ** (must come before *)',
      '  result = result.replace(/\\*\\*/g, ".*");',
      '',
      '  // Handle *',
      '  result = result.replace(/\\*/g, "[^/]*");',
      '',
      '  // Handle ?',
      '  result = result.replace(/\\?/g, ".");',
      '',
      '  return new RegExp(`^${result}$`);',
      '}',
      '',
      '/**',
      ' * Check if a path matches a pattern',
      ' */',
      'export function matchPath(path: string, pattern: string): boolean {',
      '  // Handle Next.js dynamic route syntax [param]',
      '  const normalizedPattern = pattern.replace(/\\[([^\\]]+)\\]/g, "[^/]+");',
      '  const regex = globToRegex(normalizedPattern);',
      '  return regex.test(path);',
      '}',
      '',
      '/**',
      ' * Check if a path matches any of the patterns',
      ' */',
      'export function matchPaths(path: string, patterns: string[]): boolean {',
      '  return patterns.some((pattern) => matchPath(path, pattern));',
      '}',
      '',
      '/**',
      ' * Create a path matcher function',
      ' */',
      'export function createPathMatcher(',
      '  patterns: string[],',
      '): (path: string) => boolean {',
      '  return (path: string) => matchPaths(path, patterns);',
      '}',
      '',
      '/**',
      ' * Extract path parameters from a pattern',
      ' */',
      'export function extractParams(',
      '  path: string,',
      '  pattern: string,',
      '): Record<string, string> | null {',
      '  const paramNames: string[] = [];',
      '  const regexPattern = pattern.replace(/\\[([^\\]]+)\\]/g, (_, name) => {',
      '    paramNames.push(name);',
      '    return "([^/]+)";',
      '  });',
      '',
      '  const regex = new RegExp(`^${regexPattern}$`);',
      '  const match = path.match(regex);',
      '',
      '  if (!match) return null;',
      '',
      '  const params: Record<string, string> = {};',
      '  paramNames.forEach((name, index) => {',
      '    params[name] = match[index + 1];',
      '  });',
      '',
      '  return params;',
      '}',
    ];
    return lines.join('\n');
  }

  private getAuthGuardMiddleware(hasBetterAuth: boolean): string {
    const authCheck = hasBetterAuth
      ? `
  // Check for Better Auth session cookie
  const sessionToken = getCookie(context, "better-auth.session_token");
  const isAuthenticated = !!sessionToken;`
      : `
  // Check for authentication (customize this for your auth system)
  const authToken = context.request.headers.get("authorization");
  const isAuthenticated = !!authToken;`;

    return `/**
 * Auth Guard Middleware
 *
 * Protects routes by requiring authentication.
 */
import type { MiddlewareFunction } from "../types";
import { redirectToPath, getCookie, setContextData } from "../utils";

export interface AuthGuardOptions {
  /** Path to redirect to when not authenticated */
  loginPath?: string;
  /** Paths that don't require authentication */
  publicPaths?: string[];
  /** Custom authentication check */
  isAuthenticated?: (context: Parameters<MiddlewareFunction>[0]) => boolean | Promise<boolean>;
}

/**
 * Create an auth guard middleware
 *
 * @example
 * \`\`\`typescript
 * import { createAuthGuard } from "@/lib/middleware";
 *
 * const authGuard = createAuthGuard({
 *   loginPath: "/auth/login",
 *   publicPaths: ["/", "/about", "/api/public/*"],
 * });
 * \`\`\`
 */
export function createAuthGuard(
  options: AuthGuardOptions = {},
): MiddlewareFunction {
  const {
    loginPath = "/auth/login",
    publicPaths = [],
    isAuthenticated: customCheck,
  } = options;

  return async (context, next) => {
    const pathname = context.request.nextUrl.pathname;

    // Skip auth check for public paths
    if (publicPaths.some((path) => {
      if (path.includes("*")) {
        const pattern = path.replace(/\\*/g, ".*");
        return new RegExp(\`^\${pattern}$\`).test(pathname);
      }
      return pathname === path || pathname.startsWith(path + "/");
    })) {
      return next();
    }

    // Check authentication
    let isAuthenticated: boolean;

    if (customCheck) {
      isAuthenticated = await customCheck(context);
    } else {${authCheck}
    }

    if (!isAuthenticated) {
      // Store the original URL for redirect after login
      const callbackUrl = encodeURIComponent(context.request.url);
      return redirectToPath(context, \`\${loginPath}?callbackUrl=\${callbackUrl}\`);
    }

    // Set auth status in context for downstream middleware
    setContextData(context, "isAuthenticated", true);

    return next();
  };
}

/**
 * Simple auth guard that redirects to login
 */
export const authGuard = createAuthGuard();

export default authGuard;
`;
  }

  private getRateLimitMiddleware(): string {
    return `/**
 * Rate Limit Middleware
 *
 * Simple in-memory rate limiting for middleware.
 * For production, consider using Redis or a dedicated rate limiter.
 */
import type { MiddlewareFunction } from "../types";
import { rateLimited, getClientIp, setHeader } from "../utils";

export interface RateLimitOptions {
  /** Maximum requests per window */
  limit?: number;
  /** Time window in seconds */
  windowSeconds?: number;
  /** Key generator function */
  keyGenerator?: (context: Parameters<MiddlewareFunction>[0]) => string;
  /** Skip rate limiting for certain requests */
  skip?: (context: Parameters<MiddlewareFunction>[0]) => boolean;
}

// In-memory store (replace with Redis for production)
const store = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000);

/**
 * Create a rate limit middleware
 *
 * @example
 * \`\`\`typescript
 * import { createRateLimit } from "@/lib/middleware";
 *
 * const rateLimit = createRateLimit({
 *   limit: 100,
 *   windowSeconds: 60,
 * });
 * \`\`\`
 */
export function createRateLimit(
  options: RateLimitOptions = {},
): MiddlewareFunction {
  const {
    limit = 100,
    windowSeconds = 60,
    keyGenerator = (ctx) => getClientIp(ctx),
    skip,
  } = options;

  return async (context, next) => {
    // Check if rate limiting should be skipped
    if (skip && skip(context)) {
      return next();
    }

    const key = keyGenerator(context);
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let record = store.get(key);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      store.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    const remaining = Math.max(0, limit - record.count);
    const reset = Math.ceil((record.resetTime - now) / 1000);

    setHeader(context, "X-RateLimit-Limit", String(limit));
    setHeader(context, "X-RateLimit-Remaining", String(remaining));
    setHeader(context, "X-RateLimit-Reset", String(reset));

    if (record.count > limit) {
      return rateLimited(reset);
    }

    return next();
  };
}

/**
 * Default rate limit middleware (100 requests per minute)
 */
export const rateLimit = createRateLimit();

export default rateLimit;
`;
  }

  private getCorsMiddleware(): string {
    return `/**
 * CORS Middleware
 *
 * Handle Cross-Origin Resource Sharing headers.
 */
import { NextResponse } from "next/server";
import type { MiddlewareFunction } from "../types";
import { setHeaders, getMethod } from "../utils";

export interface CorsOptions {
  /** Allowed origins (default: "*") */
  origins?: string[] | "*";
  /** Allowed methods */
  methods?: string[];
  /** Allowed headers */
  allowedHeaders?: string[];
  /** Exposed headers */
  exposedHeaders?: string[];
  /** Allow credentials */
  credentials?: boolean;
  /** Max age for preflight cache */
  maxAge?: number;
}

/**
 * Create a CORS middleware
 *
 * @example
 * \`\`\`typescript
 * import { createCors } from "@/lib/middleware";
 *
 * const cors = createCors({
 *   origins: ["https://example.com"],
 *   credentials: true,
 * });
 * \`\`\`
 */
export function createCors(options: CorsOptions = {}): MiddlewareFunction {
  const {
    origins = "*",
    methods = ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options;

  return async (context, next) => {
    const requestOrigin = context.request.headers.get("origin");

    // Determine allowed origin
    let allowedOrigin: string | null = null;

    if (origins === "*") {
      allowedOrigin = "*";
    } else if (requestOrigin && origins.includes(requestOrigin)) {
      allowedOrigin = requestOrigin;
    }

    // Set CORS headers
    if (allowedOrigin) {
      setHeaders(context, {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": methods.join(", "),
        "Access-Control-Allow-Headers": allowedHeaders.join(", "),
      });

      if (exposedHeaders.length > 0) {
        setHeaders(context, {
          "Access-Control-Expose-Headers": exposedHeaders.join(", "),
        });
      }

      if (credentials && allowedOrigin !== "*") {
        setHeaders(context, {
          "Access-Control-Allow-Credentials": "true",
        });
      }

      if (maxAge > 0) {
        setHeaders(context, {
          "Access-Control-Max-Age": String(maxAge),
        });
      }
    }

    // Handle preflight requests
    if (getMethod(context) === "OPTIONS") {
      return new NextResponse(null, { status: 204 });
    }

    return next();
  };
}

/**
 * Default CORS middleware (allows all origins)
 */
export const cors = createCors();

export default cors;
`;
  }

  private getLoggingMiddleware(): string {
    return `/**
 * Logging Middleware
 *
 * Log requests and responses for debugging and monitoring.
 */
import type { MiddlewareFunction } from "../types";
import { getMethod, getPathname, getClientIp } from "../utils";

export interface LoggingOptions {
  /** Log level */
  level?: "debug" | "info" | "warn" | "error";
  /** Include request headers */
  includeHeaders?: boolean;
  /** Include timing information */
  includeTiming?: boolean;
  /** Custom logger function */
  logger?: (message: string, data: Record<string, unknown>) => void;
  /** Skip logging for certain requests */
  skip?: (context: Parameters<MiddlewareFunction>[0]) => boolean;
}

/**
 * Create a logging middleware
 *
 * @example
 * \`\`\`typescript
 * import { createLogging } from "@/lib/middleware";
 *
 * const logging = createLogging({
 *   level: "info",
 *   includeTiming: true,
 * });
 * \`\`\`
 */
export function createLogging(options: LoggingOptions = {}): MiddlewareFunction {
  const {
    level = "info",
    includeHeaders = false,
    includeTiming = true,
    logger = (message, data) => {
      const logFn = console[level] || console.log;
      logFn(\`[Middleware] \${message}\`, data);
    },
    skip,
  } = options;

  return async (context, next) => {
    // Check if logging should be skipped
    if (skip && skip(context)) {
      return next();
    }

    const startTime = Date.now();
    const method = getMethod(context);
    const pathname = getPathname(context);
    const clientIp = getClientIp(context);

    // Log request
    const requestData: Record<string, unknown> = {
      method,
      pathname,
      clientIp,
    };

    if (includeHeaders) {
      requestData.headers = Object.fromEntries(context.request.headers);
    }

    logger(\`\${method} \${pathname}\`, requestData);

    // Execute middleware chain
    const result = await next();

    // Log response timing
    if (includeTiming) {
      const duration = Date.now() - startTime;
      logger(\`\${method} \${pathname} completed\`, {
        duration: \`\${duration}ms\`,
      });
    }

    return result;
  };
}

/**
 * Default logging middleware
 */
export const logging = createLogging();

export default logging;
`;
  }

  private getHeadersMiddleware(): string {
    return `/**
 * Headers Middleware
 *
 * Add security and custom headers to responses.
 */
import type { MiddlewareFunction } from "../types";
import { setHeaders } from "../utils";

export interface SecurityHeadersOptions {
  /** Content Security Policy */
  contentSecurityPolicy?: string | false;
  /** X-Frame-Options */
  frameOptions?: "DENY" | "SAMEORIGIN" | false;
  /** X-Content-Type-Options */
  contentTypeOptions?: "nosniff" | false;
  /** Referrer-Policy */
  referrerPolicy?: string | false;
  /** Strict-Transport-Security */
  strictTransportSecurity?: string | false;
  /** X-XSS-Protection */
  xssProtection?: string | false;
  /** Permissions-Policy */
  permissionsPolicy?: string | false;
  /** Custom headers */
  customHeaders?: Record<string, string>;
}

const defaultSecurityHeaders: Required<Omit<SecurityHeadersOptions, "customHeaders">> = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  frameOptions: "DENY",
  contentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
  xssProtection: "1; mode=block",
  permissionsPolicy: "camera=(), microphone=(), geolocation=()",
};

/**
 * Create a security headers middleware
 *
 * @example
 * \`\`\`typescript
 * import { createSecurityHeaders } from "@/lib/middleware";
 *
 * const securityHeaders = createSecurityHeaders({
 *   contentSecurityPolicy: "default-src 'self'",
 *   customHeaders: {
 *     "X-Custom-Header": "value",
 *   },
 * });
 * \`\`\`
 */
export function createSecurityHeaders(
  options: SecurityHeadersOptions = {},
): MiddlewareFunction {
  const config = { ...defaultSecurityHeaders, ...options };

  return async (context, next) => {
    const headers: Record<string, string> = {};

    if (config.contentSecurityPolicy) {
      headers["Content-Security-Policy"] = config.contentSecurityPolicy;
    }

    if (config.frameOptions) {
      headers["X-Frame-Options"] = config.frameOptions;
    }

    if (config.contentTypeOptions) {
      headers["X-Content-Type-Options"] = config.contentTypeOptions;
    }

    if (config.referrerPolicy) {
      headers["Referrer-Policy"] = config.referrerPolicy;
    }

    if (config.strictTransportSecurity) {
      headers["Strict-Transport-Security"] = config.strictTransportSecurity;
    }

    if (config.xssProtection) {
      headers["X-XSS-Protection"] = config.xssProtection;
    }

    if (config.permissionsPolicy) {
      headers["Permissions-Policy"] = config.permissionsPolicy;
    }

    // Add custom headers
    if (options.customHeaders) {
      Object.assign(headers, options.customHeaders);
    }

    setHeaders(context, headers);

    return next();
  };
}

/**
 * Default security headers middleware
 */
export const securityHeaders = createSecurityHeaders();

export default securityHeaders;
`;
  }

  private getMiddlewareIndex(): string {
    return `/**
 * Middleware Module Exports
 *
 * Re-exports all middleware utilities, types, and built-in middleware.
 */

// Types
export * from "./types";

// Factory and composition
export {
  createMiddlewareChain,
  withConfig,
  conditional,
  compose,
  parallel,
} from "./factory";

// Utilities
export * from "./utils";

// Path matching
export {
  matchPath,
  matchPaths,
  createPathMatcher,
  extractParams,
} from "./path-matcher";

// Built-in middleware
export { createAuthGuard, authGuard } from "./middlewares/auth-guard";
export { createRateLimit, rateLimit } from "./middlewares/rate-limit";
export { createCors, cors } from "./middlewares/cors";
export { createLogging, logging } from "./middlewares/logging";
export { createSecurityHeaders, securityHeaders } from "./middlewares/headers";
`;
  }

  private getExampleMiddleware(hasBetterAuth: boolean): string {
    const authImport = hasBetterAuth
      ? `// Auth guard with Better Auth
import { createAuthGuard } from "@/lib/middleware";

const authGuard = createAuthGuard({
  loginPath: "/auth/login",
  publicPaths: [
    "/",
    "/about",
    "/auth/*",
    "/api/auth/*",
    "/api/public/*",
  ],
});`
      : `// Auth guard
import { createAuthGuard } from "@/lib/middleware";

const authGuard = createAuthGuard({
  loginPath: "/auth/login",
  publicPaths: ["/", "/about", "/auth/*"],
});`;

    return `/**
 * Example Middleware Configuration
 *
 * This file demonstrates how to set up the middleware chain.
 * Copy this to \`middleware.ts\` in your project root and customize.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createMiddlewareChain,
  withConfig,
  createLogging,
  createSecurityHeaders,
  createRateLimit,
} from "@/lib/middleware";

${authImport}

// Logging middleware (only in development)
const logging = createLogging({
  level: "info",
  includeTiming: true,
  skip: () => process.env.NODE_ENV === "production",
});

// Security headers
const securityHeaders = createSecurityHeaders({
  contentSecurityPolicy: process.env.NODE_ENV === "production"
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    : false, // Disable CSP in development for easier debugging
});

// Rate limiting for API routes
const apiRateLimit = withConfig(
  createRateLimit({
    limit: 100,
    windowSeconds: 60,
  }),
  {
    include: ["/api/*"],
    exclude: ["/api/auth/*", "/api/public/*"],
  },
);

// Create the middleware chain
const middlewareChain = createMiddlewareChain(
  [
    logging,
    securityHeaders,
    apiRateLimit,
    authGuard,
  ],
  {
    onError: (error, _context) => {
      console.error("[Middleware Error]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    },
  },
);

/**
 * Next.js Middleware
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  return middlewareChain(request);
}

/**
 * Middleware configuration
 *
 * Define which paths the middleware should run on.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
`;
  }
}
