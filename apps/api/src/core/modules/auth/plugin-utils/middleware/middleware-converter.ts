/**
 * Middleware Converter
 *
 * Converts abstract MiddlewareCheck objects to framework-specific formats:
 * - NestJS Guards (CanActivate interface)
 * - ORPC Middleware (native DecoratedMiddleware type)
 *
 * This allows the same middleware definitions to be used across different
 * frameworks while maintaining type safety and consistent behavior.
 *
 * @module middleware-converter
 */

import type { CanActivate, ExecutionContext, Type } from '@nestjs/common';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { os } from '@orpc/server';
import type { MiddlewareCheck, MiddlewareContext, MiddlewareErrorCode } from './middleware-check';
import type { ORPCContextWithAuthOnly } from '@/core/modules/auth/orpc';

// ============================================================================
// Error Mapping
// ============================================================================

/**
 * Map middleware error codes to NestJS HTTP exceptions.
 */
function createNestException(code: MiddlewareErrorCode, message: string): Error {
  switch (code) {
    case 'UNAUTHORIZED':
      return new UnauthorizedException(message);
    case 'FORBIDDEN':
      return new ForbiddenException(message);
    case 'BAD_REQUEST':
      return new BadRequestException(message);
    case 'NOT_FOUND':
      return new BadRequestException(message); // Map NOT_FOUND to BadRequest for API
    default:
      return new InternalServerErrorException(message);
  }
}

/**
 * Map middleware error codes to ORPC error codes.
 * Uses standard HTTP-like error codes for consistency.
 */
function mapToOrpcErrorCode(code: MiddlewareErrorCode): string {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'UNAUTHORIZED';
    case 'FORBIDDEN':
      return 'FORBIDDEN';
    case 'BAD_REQUEST':
      return 'BAD_REQUEST';
    case 'NOT_FOUND':
      return 'NOT_FOUND';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

// ============================================================================
// NestJS Guard Converter
// ============================================================================

/**
 * Options for creating NestJS guards from middleware checks.
 */
interface NestGuardOptions {
  /**
   * Custom context extractor to build MiddlewareContext from ExecutionContext.
   * If not provided, uses default HTTP request extraction.
   */
  contextExtractor?: (executionContext: ExecutionContext) => MiddlewareContext;

  /**
   * Whether to log errors (useful for debugging).
   * @default false
   */
  logErrors?: boolean;
}

/**
 * Default context extractor for HTTP requests.
 * Extracts params, query, body, and headers from the request.
 */
function defaultContextExtractor(executionContext: ExecutionContext): MiddlewareContext {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const request = executionContext.switchToHttp().getRequest();

  // Extract and safely type the request properties
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const params = (request.params ?? {}) as Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const query = (request.query ?? {}) as Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const body = request.body as unknown;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const headers = request.headers as Headers;

  return {
    params,
    query,
    body,
    headers,
  };
}

/**
 * Create a NestJS Guard class from a MiddlewareCheck.
 *
 * The returned guard class can be used with @UseGuards() decorator
 * or registered globally.
 *
 * @param check - The middleware check to convert
 * @param options - Optional configuration
 * @returns A NestJS Guard class
 *
 * @example
 * ```typescript
 * // Create guard from middleware check
 * const AdminGuard = createNestGuard(adminMiddleware.hasPermission({ user: ['manage'] }));
 *
 * // Use in controller
 * @UseGuards(AdminGuard)
 * @Get('admin/users')
 * getUsers() { ... }
 * ```
 */
export function createNestGuard(
  check: MiddlewareCheck,
  options: NestGuardOptions = {}
): Type<CanActivate> {
  const { contextExtractor = defaultContextExtractor, logErrors = false } = options;

  @Injectable()
  class MiddlewareGuard implements CanActivate {
    async canActivate(executionContext: ExecutionContext): Promise<boolean> {
      const context = contextExtractor(executionContext);

      try {
        await check.check(context);
        return true;
      } catch (error) {
        if (logErrors) {
          console.error(`[MiddlewareGuard] ${check.name} failed:`, error);
        }

        const errorCode = check.getErrorCode();
        const errorMessage =
          error instanceof Error ? error.message : check.getErrorMessage();

        throw createNestException(errorCode, errorMessage);
      }
    }
  }

  // Set a meaningful name for debugging
  Object.defineProperty(MiddlewareGuard, 'name', {
    value: `${check.name}Guard`,
    writable: false,
  });

  return MiddlewareGuard;
}

/**
 * Create a NestJS Guard that runs multiple checks in sequence.
 *
 * All checks must pass for the guard to allow access.
 * Checks are executed in order - first failure stops execution.
 *
 * @param checks - Array of middleware checks to run
 * @param options - Optional configuration
 * @returns A NestJS Guard class
 *
 * @example
 * ```typescript
 * const CompositeGuard = createCompositeNestGuard([
 *   adminMiddleware.requireSession(),
 *   adminMiddleware.hasPermission({ user: ['read'] }),
 * ]);
 *
 * @UseGuards(CompositeGuard)
 * @Get('protected')
 * getProtectedResource() { ... }
 * ```
 */
export function createCompositeNestGuard(
  checks: MiddlewareCheck[],
  options: NestGuardOptions = {}
): Type<CanActivate> {
  const { contextExtractor = defaultContextExtractor, logErrors = false } = options;

  @Injectable()
  class CompositeMiddlewareGuard implements CanActivate {
    async canActivate(executionContext: ExecutionContext): Promise<boolean> {
      const context = contextExtractor(executionContext);

      for (const check of checks) {
        try {
          await check.check(context);
        } catch (error) {
          if (logErrors) {
            console.error(`[CompositeGuard] ${check.name} failed:`, error);
          }

          const errorCode = check.getErrorCode();
          const errorMessage =
            error instanceof Error ? error.message : check.getErrorMessage();

          throw createNestException(errorCode, errorMessage);
        }
      }

      return true;
    }
  }

  // Set a meaningful name showing all check names
  const checkNames = checks.map((c) => c.name).join('+');
  Object.defineProperty(CompositeMiddlewareGuard, 'name', {
    value: `CompositeGuard[${checkNames}]`,
    writable: false,
  });

  return CompositeMiddlewareGuard;
}

// ============================================================================
// Dynamic NestJS Guard Types & Converter
// ============================================================================

/**
 * Context available to NestJS guard resolver functions.
 * Contains the typed HTTP request parts for dynamic value resolution.
 * 
 * @template TInput - Shape of expected request data
 * 
 * @example
 * ```typescript
 * // Define expected request structure
 * interface MyRequest {
 *   params: { organizationId: string };
 *   query: { filter?: string };
 *   body: { name: string };
 * }
 * 
 * // Create typed resolver
 * const getOrgId = (ctx: NestGuardOptionsContext<MyRequest>) => ctx.params.organizationId;
 * ```
 */
interface NestGuardOptionsContext<TInput = unknown> {
  /** Route parameters (e.g., /org/:organizationId) */
  params: TInput extends { params: infer P } ? P : Record<string, string>;
  /** Query parameters (e.g., ?filter=active) */
  query: TInput extends { query: infer Q } ? Q : Record<string, string>;
  /** Request body (for POST/PUT/PATCH) */
  body: TInput extends { body: infer B } ? B : unknown;
  /** Request headers */
  headers: Headers;
}

/**
 * Resolver function that extracts a value from typed NestJS guard context.
 * Use this for type-safe access to HTTP request parts in guards.
 * 
 * @template T - The type of value being resolved
 * @template TInput - The expected request shape
 * 
 * @example
 * ```typescript
 * // Type-safe params resolver
 * const getOrgId: NestInputResolver<string, { params: { organizationId: string } }> = 
 *   (ctx) => ctx.params.organizationId;
 * 
 * // Type-safe body resolver
 * const getResourceName: NestInputResolver<string, { body: { name: string } }> = 
 *   (ctx) => ctx.body.name;
 * ```
 */
type NestInputResolver<T, TInput = unknown> = (
  context: NestGuardOptionsContext<TInput>
) => T | Promise<T>;

/**
 * Either a static value or a resolver function for NestJS guard context.
 * 
 * @template T - The type of value
 * @template TInput - The expected request shape
 * 
 * @example
 * ```typescript
 * // Static value (no type parameter needed)
 * const orgId: NestValueOrResolver<string> = 'org_123';
 * 
 * // Dynamic resolver from params
 * const orgId: NestValueOrResolver<string, { params: { organizationId: string } }> = 
 *   (ctx) => ctx.params.organizationId;
 * 
 * // Dynamic resolver from body
 * const permission: NestValueOrResolver<string[], { body: { permissions: string[] } }> = 
 *   (ctx) => ctx.body.permissions;
 * ```
 */
type NestValueOrResolver<T, TInput = unknown> = T | NestInputResolver<T, TInput>;

/**
 * Resolve a value from NestValueOrResolver.
 * If it's a function, call it with context. Otherwise return the static value.
 */
async function resolveNestValue<T, TInput = unknown>(
  valueOrResolver: NestValueOrResolver<T, TInput>,
  context: NestGuardOptionsContext<TInput>
): Promise<T> {
  if (typeof valueOrResolver === 'function') {
    return (valueOrResolver as NestInputResolver<T, TInput>)(context);
  }
  return valueOrResolver;
}

/**
 * Build NestGuardOptionsContext from NestJS ExecutionContext.
 */
function buildNestGuardContext<TInput = unknown>(
  executionContext: ExecutionContext
): NestGuardOptionsContext<TInput> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const request = executionContext.switchToHttp().getRequest();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const params = (request.params ?? {}) as NestGuardOptionsContext<TInput>['params'];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const query = (request.query ?? {}) as NestGuardOptionsContext<TInput>['query'];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const body = request.body as NestGuardOptionsContext<TInput>['body'];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const headers = request.headers as Headers;

  return { params, query, body, headers };
}

/**
 * Create a dynamic NestJS Guard that resolves values from HTTP request at runtime.
 * 
 * This allows type-safe access to route params, query strings, and body data
 * for determining authorization requirements dynamically.
 *
 * @template TInput - The expected shape of the request data
 * @param checkFactory - Factory function that creates a MiddlewareCheck from resolved values
 * @param options - Optional configuration
 * @returns A NestJS Guard class
 *
 * @example
 * ```typescript
 * // Guard that checks organization membership from route param
 * const OrgMemberGuard = createDynamicNestGuard<{ params: { orgId: string } }>(
 *   async (ctx) => middlewares.organization.isMemberOf(ctx.params.orgId)
 * );
 * 
 * // Use in controller
 * @UseGuards(OrgMemberGuard)
 * @Get('org/:orgId/projects')
 * getProjects(@Param('orgId') orgId: string) { ... }
 * 
 * // Guard with multiple resolved values
 * const RoleGuard = createDynamicNestGuard<{ params: { orgId: string }; query: { role: string } }>(
 *   async (ctx) => middlewares.organization.hasOrganizationRole(ctx.params.orgId, [ctx.query.role])
 * );
 * ```
 */
export function createDynamicNestGuard<TInput = unknown>(
  checkFactory: (context: NestGuardOptionsContext<TInput>) => MiddlewareCheck | Promise<MiddlewareCheck>,
  options: NestGuardOptions = {}
): Type<CanActivate> {
  const { logErrors = false } = options;

  @Injectable()
  class DynamicMiddlewareGuard implements CanActivate {
    async canActivate(executionContext: ExecutionContext): Promise<boolean> {
      // Build typed context from HTTP request
      const nestContext = buildNestGuardContext<TInput>(executionContext);
      
      // Create the check using the factory
      const check = await checkFactory(nestContext);
      
      // Build MiddlewareContext for check execution
      const middlewareContext = defaultContextExtractor(executionContext);

      try {
        await check.check(middlewareContext);
        return true;
      } catch (error) {
        if (logErrors) {
          console.error(`[DynamicGuard] ${check.name} failed:`, error);
        }

        const errorCode = check.getErrorCode();
        const errorMessage =
          error instanceof Error ? error.message : check.getErrorMessage();

        throw createNestException(errorCode, errorMessage);
      }
    }
  }

  // Set a dynamic name for debugging
  Object.defineProperty(DynamicMiddlewareGuard, 'name', {
    value: 'DynamicGuard',
    writable: false,
  });

  return DynamicMiddlewareGuard;
}

/**
 * Helper to create a dynamic guard with a single resolver.
 * Provides a more ergonomic API for common cases.
 *
 * @template T - The type of the resolved value
 * @template TInput - The expected shape of the request data
 * @param checkCreator - Function that creates a MiddlewareCheck from the resolved value
 * @param resolver - Resolver function or static value
 * @param options - Optional configuration
 * @returns A NestJS Guard class
 *
 * @example
 * ```typescript
 * // Guard that resolves organizationId from route params
 * const OrgMemberGuard = createDynamicNestGuardWithResolver<
 *   string, 
 *   { params: { organizationId: string } }
 * >(
 *   (orgId) => middlewares.organization.isMemberOf(orgId),
 *   (ctx) => ctx.params.organizationId
 * );
 * ```
 */
export function createDynamicNestGuardWithResolver<T, TInput = unknown>(
  checkCreator: (value: T) => MiddlewareCheck,
  resolver: NestValueOrResolver<T, TInput>,
  options: NestGuardOptions = {}
): Type<CanActivate> {
  return createDynamicNestGuard<TInput>(
    async (ctx) => {
      const value = await resolveNestValue(resolver, ctx);
      return checkCreator(value);
    },
    options
  );
}

// ============================================================================
// ORPC Middleware Converter
// ============================================================================

/**
 * ORPC middleware options context - what's available inside middleware.
 * This is used by resolver functions to access input and context.
 * 
 * @template TInput - The typed input for this procedure
 * @template TContext - The accumulated context from previous middlewares
 * @template TMeta - Metadata type
 */
interface OrpcMiddlewareOptionsContext<
  TInput = unknown,
  TContext = unknown,
  TMeta = unknown
> {
  /** The typed input from the procedure */
  input: TInput;
  /** Accumulated context from previous middlewares (e.g., auth, request) */
  context: TContext;
  /** Procedure metadata */
  meta: TMeta;
  /** Procedure path */
  path: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Resolver function that extracts a value from typed ORPC context.
 * Use this for type-safe access to procedure input and accumulated context in middleware.
 * 
 * @template T - The type of value being resolved
 * @template TInput - The typed input object from the ORPC procedure
 * @template TContext - The accumulated context from previous middlewares
 * 
 * @example
 * ```typescript
 * // Type-safe input resolver
 * const getOrgId: OrpcInputResolver<string, { organizationId: string }> = 
 *   (ctx) => ctx.input.organizationId;
 * 
 * // Type-safe context resolver (access accumulated context)
 * const getUserId: OrpcInputResolver<string, unknown, { auth: { user: { id: string } } }> = 
 *   (ctx) => ctx.context.auth.user.id;
 * ```
 */
type OrpcInputResolver<T, TInput = unknown, TContext = unknown> = (
  context: OrpcMiddlewareOptionsContext<TInput, TContext>
) => T | Promise<T>;

/**
 * Either a static value or a resolver function for ORPC input/context.
 * 
 * @template T - The type of value
 * @template TInput - The typed input from ORPC procedure (defaults to unknown)
 * @template TContext - The accumulated context from previous middlewares (defaults to unknown)
 * 
 * @example
 * ```typescript
 * // Static value
 * const orgId: OrpcValueOrResolver<string> = 'org_123';
 * 
 * // Typed resolver from input
 * const orgId: OrpcValueOrResolver<string, { organizationId: string }> = 
 *   (ctx) => ctx.input.organizationId;
 * 
 * // Typed resolver from context
 * const userId: OrpcValueOrResolver<string, unknown, { auth: { user: { id: string } } }> = 
 *   (ctx) => ctx.context.auth.user.id;
 * ```
 */
type OrpcValueOrResolver<T, TInput = unknown, TContext = unknown> = 
  T | OrpcInputResolver<T, TInput, TContext>;

/**
 * Resolve a value from OrpcValueOrResolver.
 * Handles both static values and resolver functions.
 */
async function resolveOrpcValue<T, TInput, TContext = unknown>(
  valueOrResolver: OrpcValueOrResolver<T, TInput, TContext>,
  context: OrpcMiddlewareOptionsContext<TInput, TContext>
): Promise<T> {
  if (typeof valueOrResolver === 'function') {
    return (valueOrResolver as OrpcInputResolver<T, TInput, TContext>)(context);
  }
  return valueOrResolver;
}

/**
 * ORPC error class for throwing typed errors.
 */
class OrpcError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ORPCError';
    this.code = code;
    this.status = codeToStatus(code);
  }
}

/**
 * Map error code to HTTP status.
 */
function codeToStatus(code: string): number {
  switch (code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'BAD_REQUEST':
      return 400;
    case 'NOT_FOUND':
      return 404;
    default:
      return 500;
  }
}

/**
 * Options for creating ORPC middleware from middleware checks.
 * 
 * These middlewares are designed to run after requireAuth() in the chain,
 * so the context type is fixed to ORPCContextWithAuthOnly<true> which provides
 * properly typed auth context (ORPCAuthContext<true>).
 */
interface OrpcMiddlewareOptions {
  /**
   * Custom context builder to create MiddlewareContext from ORPC context.
   * If not provided, uses a default that extracts input as params.
   */
  contextBuilder?: (
    orpcContext: ORPCContextWithAuthOnly<true>
  ) => MiddlewareContext;

  /**
   * Whether to log errors (useful for debugging).
   * @default false
   */
  logErrors?: boolean;

  /**
   * Headers to use for the middleware context.
   * Can be a function that receives the ORPC context.
   */
  headers?: Headers | ((ctx: ORPCContextWithAuthOnly<true>) => Headers);
}

/**
 * Default context builder for ORPC middleware.
 * Maps ORPC context to MiddlewareContext format.
 */
function defaultOrpcContextBuilder(
  orpcContext: ORPCContextWithAuthOnly<true>
): MiddlewareContext {
  // Try to extract input from various locations
  const input = (orpcContext as Record<string, unknown>).input as Record<string, unknown> | undefined;

  // Convert input to string params (for route-like access)
  const params: Record<string, string> = {};
  if (input) {
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        params[key] = value;
      }
    }
  }

  return {
    params,
    query: {},
    body: input,
    headers: new Headers(), // Default empty headers, can be overridden via options
  };
}

/**
 * Create an ORPC middleware from a MiddlewareCheck.
 *
 * The returned middleware uses native ORPC types (DecoratedMiddleware) and can be
 * used directly with ORPC's `.use()` method. 
 * 
 * This middleware is designed to run after requireAuth() in the chain, so it
 * declares ORPCContextWithAuthOnly<true> as its context dependency. This ensures
 * that context.auth is properly typed as ORPCAuthContext<true>, not `any`.
 *
 * @param check - The middleware check to convert
 * @param options - Optional configuration
 * @returns A native ORPC DecoratedMiddleware with properly typed context
 *
 * @example
 * ```typescript
 * // Create ORPC middleware from check
 * const requireAdmin = createOrpcMiddleware(
 *   adminMiddleware.hasPermission({ user: ['manage'] })
 * );
 *
 * // Use in ORPC procedure - context.auth is ORPCAuthContext<true>
 * const adminProcedure = baseProcedure
 *   .use(requireAuth())  // context.auth: ORPCAuthContext<true>
 *   .use(requireAdmin);   // context.auth still typed correctly
 * ```
 */
export function createOrpcMiddleware(
  check: MiddlewareCheck,
  options: OrpcMiddlewareOptions = {}
) {
  const { contextBuilder = defaultOrpcContextBuilder, logErrors = false } = options;

  // Use os.$context<ORPCContextWithAuthOnly<true>>() to declare the expected input context type.
  // This middleware runs after requireAuth() which provides auth: ORPCAuthContext<true>.
  // By declaring the specific context type, we preserve type information through the chain.
  return os.$context<ORPCContextWithAuthOnly<true>>().middleware(async ({ context, next }) => {
    const middlewareContext = contextBuilder(context);

    // Add headers if provided
    if (options.headers) {
      middlewareContext.headers =
        typeof options.headers === 'function'
          ? options.headers(context)
          : options.headers;
    }

    try {
      await check.check(middlewareContext);
      // Pass context through to next middleware unchanged - type is preserved
      return await next({ context });
    } catch (error) {
      if (logErrors) {
        console.error(`[OrpcMiddleware] ${check.name} failed:`, error);
      }

      const errorCode = mapToOrpcErrorCode(check.getErrorCode());
      const errorMessage =
        error instanceof Error ? error.message : check.getErrorMessage();

      throw new OrpcError(errorCode, errorMessage);
    }
  });
}

/**
 * Create an ORPC middleware that runs multiple checks in sequence.
 *
 * All checks must pass before proceeding to the next middleware/handler.
 * Checks are executed in order - first failure stops execution.
 * 
 * This middleware is designed to run after requireAuth() in the chain, so it
 * declares ORPCContextWithAuthOnly<true> as its context dependency. This ensures
 * that context.auth is properly typed as ORPCAuthContext<true>, not `any`.
 *
 * @param checks - Array of middleware checks to run
 * @param options - Optional configuration
 * @returns A native ORPC DecoratedMiddleware with properly typed context
 *
 * @example
 * ```typescript
 * const requireAdminWithPermissions = createCompositeOrpcMiddleware([
 *   adminMiddleware.requireSession(),
 *   adminMiddleware.hasRole(['admin', 'superadmin']),
 *   adminMiddleware.hasPermission({ settings: ['write'] }),
 * ]);
 *
 * const adminSettingsProcedure = baseProcedure.use(requireAdminWithPermissions);
 * ```
 */
export function createCompositeOrpcMiddleware(
  checks: MiddlewareCheck[],
  options: OrpcMiddlewareOptions = {}
) {
  const { contextBuilder = defaultOrpcContextBuilder, logErrors = false } = options;

  // Use os.$context<ORPCContextWithAuthOnly<true>>() to declare the expected input context type.
  // This middleware runs after requireAuth() which provides auth: ORPCAuthContext<true>.
  return os.$context<ORPCContextWithAuthOnly<true>>().middleware(async ({ context, next }) => {
    const middlewareContext = contextBuilder(context);

    // Add headers if provided
    if (options.headers) {
      middlewareContext.headers =
        typeof options.headers === 'function'
          ? options.headers(context)
          : options.headers;
    }

    for (const check of checks) {
      try {
        await check.check(middlewareContext);
      } catch (error) {
        if (logErrors) {
          console.error(`[CompositeOrpcMiddleware] ${check.name} failed:`, error);
        }

        const errorCode = mapToOrpcErrorCode(check.getErrorCode());
        const errorMessage =
          error instanceof Error ? error.message : check.getErrorMessage();

        throw new OrpcError(errorCode, errorMessage);
      }
    }

    // Pass context through to next middleware unchanged - type is preserved
    return next({ context });
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a middleware check array from a middleware definition's method calls.
 *
 * This is a convenience function to collect multiple checks into an array
 * for use with composite guards/middleware.
 *
 * @param checks - Spread of middleware checks
 * @returns Array of middleware checks
 *
 * @example
 * ```typescript
 * const checks = collect(
 *   middlewares.requireSession(),
 *   middlewares.hasPermission({ user: ['read'] }),
 *   middlewares.hasRole(['admin'])
 * );
 *
 * const guard = createCompositeNestGuard(checks);
 * ```
 */
export function collect(...checks: MiddlewareCheck[]): MiddlewareCheck[] {
  return checks;
}

/**
 * Extract metadata from a middleware check for documentation/introspection.
 *
 * @param check - The middleware check
 * @returns Metadata object describing the check
 */
export function extractCheckMetadata(check: MiddlewareCheck): {
  name: string;
  description: string;
  errorCode: MiddlewareErrorCode;
  errorMessage: string;
  permissions?: Record<string, string[]>;
  roles?: readonly string[];
} {
  return {
    name: check.name,
    description: check.description,
    errorCode: check.getErrorCode(),
    errorMessage: check.getErrorMessage(),
    permissions: 'permissions' in check ? (check.permissions as Record<string, string[]>) : undefined,
    roles: 'requiredRoles' in check ? (check.requiredRoles as readonly string[]) : undefined,
  };
}

/**
 * Extract metadata from multiple checks for API documentation.
 *
 * @param checks - Array of middleware checks
 * @returns Array of metadata objects
 */
export function extractChecksMetadata(checks: MiddlewareCheck[]): ReturnType<typeof extractCheckMetadata>[] {
  return checks.map(extractCheckMetadata);
}

// ============================================================================
// Re-exports
// ============================================================================

export { OrpcError, resolveOrpcValue, resolveNestValue };
export type {
  OrpcMiddlewareOptionsContext,
  OrpcInputResolver,
  OrpcValueOrResolver,
  NestGuardOptions,
  NestGuardOptionsContext,
  NestInputResolver,
  NestValueOrResolver,
  OrpcMiddlewareOptions,
};

// Re-export native ORPC types for convenience
export type { DecoratedMiddleware, Context as ORPCContext, Meta } from '@orpc/server';
