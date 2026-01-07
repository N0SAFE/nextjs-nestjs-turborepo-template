/**
 * ORPC Middleware Proxy
 *
 * This module provides a Proxy-based wrapper that automatically converts
 * any middleware definition method into an ORPC middleware.
 *
 * Instead of manually wrapping each method with `createOrpcMiddleware()`,
 * this proxy intercepts method calls and automatically applies the wrapper.
 *
 * **Two Usage Patterns**:
 * 
 * 1. **Static values** - Direct call with static values:
 *    ```typescript
 *    .use(middleware.org.isMemberOf('org-123'))
 *    ```
 *
 * 2. **Dynamic with ORPC mapInput** (RECOMMENDED) - Uses ORPC's native type inference:
 *    ```typescript
 *    // Call with no args to get middleware expecting the resolved type (e.g., string)
 *    // Then use mapInput to extract from input - input is AUTO-TYPED by ORPC!
 *    .use(middleware.org.isMemberOf(), input => input.organizationId)
 *    ```
 *
 * The mapInput pattern leverages ORPC's `.use()` second argument which receives
 * `InferSchemaOutput<TInputSchema>` - providing full type inference without generics.
 *
 * @example
 * ```typescript
 * const middlewares = createPluginMiddlewares(auth, registry);
 * const adminOrpc = createOrpcMiddlewareProxy(middlewares.admin);
 *
 * // Static value - resolved immediately
 * const staticMiddleware = adminOrpc.hasPermission({ user: ['create'] });
 *
 * // Dynamic with mapInput - input is AUTO-TYPED!
 * procedure
 *   .input(z.object({ organizationId: z.string() }))
 *   .use(adminOrpc.org.isMemberOf(), input => input.organizationId)
 *   //                                ^^^^^ automatically typed as { organizationId: string }
 * ```
 */

import { os, type DecoratedMiddleware } from '@orpc/server';
import type { MiddlewareCheck, ValueOrResolver } from './middleware-check';
import {
  createOrpcMiddleware,
  createCompositeOrpcMiddleware,
  type OrpcMiddlewareOptions,
} from './middleware-converter';
import type { ORPCContextWithAuthOnly } from '@/core/modules/auth/orpc';

// ============================================================================
// Types
// ============================================================================

/**
 * Type constraint for objects that can be proxied.
 * Uses object instead of Record to avoid requiring index signatures.
 */
export type MiddlewareDefinitionLike = object;

/**
 * Extract method names that return MiddlewareCheck from a definition.
 */
type MiddlewareMethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => MiddlewareCheck ? K : never;
}[keyof T];

/**
 * Extract the inner value type from ValueOrResolver<T>.
 * 
 * ValueOrResolver<T> = T | ContextResolver<T, TContext>
 * This extracts just the T, excluding the resolver function type.
 */
type UnwrapValueOrResolver<T> = T extends ValueOrResolver<infer V> ? V : T;

/**
 * Extract the expected input type from a method's first parameter.
 * Unwraps ValueOrResolver to get the actual value type.
 * 
 * For example:
 * - `isMemberOf(orgId: ValueOrResolver<string>)` → string
 * - `hasRole(roles: ValueOrResolver<string[]>)` → string[]
 */
type ExtractFirstParamType<TMethod> = TMethod extends (arg: infer T, ...rest: never[]) => MiddlewareCheck
  ? UnwrapValueOrResolver<T>
  : never;

/**
 * Transform a method to return an ORPC middleware.
 * 
 * **Context Type Preservation:**
 * These middlewares run after requireAuth() in the chain, so they expect
 * ORPCContextWithAuthOnly<true> as their input context and preserve it as output.
 * This ensures context.auth is properly typed in subsequent handlers.
 * 
 * **Why `any` for TInput/TOutput?**
 * ORPC's `.use()` overloads require middleware TInput/TOutput to match:
 * - Without mapInput: TInput = InferSchemaOutput<TInputSchema>, TOutput = InferSchemaInput<TOutputSchema>
 * - With mapInput: TInput = UInput (mapped type), TOutput = InferSchemaInput<TOutputSchema>
 * 
 * Since our middleware is generic and can be used with any procedure, we use `any` for input/output:
 * - `any` is bivariant and assignable to any type (unlike `unknown`)
 * - This allows the same middleware to work across procedures with different schemas
 * - Type safety is still enforced by ORPC at the procedure level
 * 
 * **Two patterns:**
 * 1. Static call: `middleware.admin.hasRole(['admin'])` → use with any procedure
 * 2. Dynamic with mapInput: `middleware.org.isMemberOf.forInput()` + `input => input.orgId`
 * 
 * @template TMethod - The original method type
 */
type OrpcWrappedMethod<TMethod> = TMethod extends (...args: infer TArgs) => MiddlewareCheck
  ? {
      // Static call: pass all args, returns middleware compatible with any procedure
      // Context types preserve ORPCContextWithAuthOnly<true> for proper typing
      // Using `any` for input/output to match any procedure's schema
      (...args: TArgs): DecoratedMiddleware<ORPCContextWithAuthOnly<true>, ORPCContextWithAuthOnly<true>, any, any, any, any>;
      
      // Dynamic method: returns middleware expecting the first arg's type for mapInput
      // TInput is typed for use with mapInput callback
      // Context types preserve ORPCContextWithAuthOnly<true>
      forInput(): DecoratedMiddleware<ORPCContextWithAuthOnly<true>, ORPCContextWithAuthOnly<true>, ExtractFirstParamType<TMethod>, any, any, any>;
    }
  : never;

/**
 * Transform all middleware methods in a definition to ORPC middlewares.
 * This is the type of the proxied object.
 */
export type OrpcMiddlewareProxy<T> = {
  [K in MiddlewareMethodNames<T>]: OrpcWrappedMethod<T[K]>;
} & {
  /** Create composite middleware from multiple checks */
  composite(checks: MiddlewareCheck[]): ReturnType<typeof createCompositeOrpcMiddleware>;
};

// ============================================================================
// Proxy Factory
// ============================================================================

/**
 * Build MiddlewareContext from input for check execution.
 */
function buildMiddlewareContext(
  input: unknown
): { headers: Headers; params: Record<string, string>; query: Record<string, string>; body: unknown } {
  const inputObj = input as Record<string, unknown> | undefined;

  const params: Record<string, string> = {};
  if (inputObj) {
    for (const [key, value] of Object.entries(inputObj)) {
      if (typeof value === 'string') {
        params[key] = value;
      }
    }
  }

  return {
    headers: new Headers(),
    params,
    query: {},
    body: inputObj,
  };
}

/**
 * Create an ORPC error from a check failure.
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
 * Map middleware error code to ORPC error code.
 */
function mapToOrpcErrorCode(code: string): string {
  switch (code) {
    case 'PERMISSION_DENIED':
      return 'FORBIDDEN';
    case 'MISSING_SESSION':
    case 'INVALID_SESSION':
      return 'UNAUTHORIZED';
    default:
      return code;
  }
}

/**
 * Create error from check failure.
 */
function createOrpcError(check: MiddlewareCheck, error: unknown): OrpcError {
  const errorCode = mapToOrpcErrorCode(check.getErrorCode());
  const errorMessage = error instanceof Error ? error.message : check.getErrorMessage();
  return new OrpcError(errorCode, errorMessage);
}

/**
 * Create a proxy that wraps all middleware definition methods with ORPC middleware.
 *
 * **Two Usage Patterns**:
 *
 * 1. **Static** - Pass values directly:
 *    ```typescript
 *    .use(middleware.org.isMemberOf('org-123'))
 *    ```
 *
 * 2. **Dynamic with mapInput** - Use `.forInput()` + ORPC's mapInput:
 *    ```typescript
 *    .use(middleware.org.isMemberOf.forInput(), input => input.organizationId)
 *    //                                         ^^^^^ AUTO-TYPED by ORPC!
 *    ```
 *
 * @param middlewareDefinition - The source middleware definition (e.g., AdminMiddlewareDefinition)
 * @param options - Optional ORPC middleware options applied to all created middlewares
 * @returns A proxy that transforms all method calls to return ORPC middlewares
 *
 * @example
 * ```typescript
 * const middlewares = createPluginMiddlewares(auth, registry);
 * const orgOrpc = createOrpcMiddlewareProxy(middlewares.org);
 *
 * // Static value - resolved immediately
 * procedure.use(orgOrpc.isMemberOf('org-123'))
 *
 * // Dynamic with mapInput - input is AUTO-TYPED!
 * procedure
 *   .input(z.object({ organizationId: z.string() }))
 *   .use(orgOrpc.isMemberOf.forInput(), input => input.organizationId)
 *   //                                  ^^^^^ TypeScript knows this is { organizationId: string }
 * ```
 */
export function createOrpcMiddlewareProxy<T extends MiddlewareDefinitionLike>(
  middlewareDefinition: T,
  options: OrpcMiddlewareOptions = {}
): OrpcMiddlewareProxy<T> {
  const proxy = new Proxy(middlewareDefinition, {
    get(target, prop, receiver) {
      // Handle special 'composite' method
      if (prop === 'composite') {
        return (checks: MiddlewareCheck[]) => createCompositeOrpcMiddleware(checks, options);
      }

      const originalValue = Reflect.get(target, prop, receiver);

      // If it's a function, wrap it to return ORPC middleware with .forInput() method
      if (typeof originalValue === 'function') {
        // Static case: call original method with args and wrap with createOrpcMiddleware
        const wrappedFn = (...args: unknown[]) => {
          const check = originalValue.apply(target, args) as MiddlewareCheck;
          return createOrpcMiddleware(check, options);
        };

        // Attach .forInput() method for dynamic mapInput pattern
        // Returns middleware that expects input to BE the first argument value directly
        // Using Object.assign to properly combine the function with the forInput method
        const withForInput = Object.assign(wrappedFn, {
          forInput: () => {
            return os.$context<ORPCContextWithAuthOnly<true>>().middleware(
              async ({ context, next }, input: unknown) => {
                // Input IS the value directly (e.g., organizationId string)
                // ORPC's mapInput already extracted it from the procedure's input
                const check = originalValue.call(target, input) as MiddlewareCheck;
                const middlewareContext = buildMiddlewareContext({ value: input });

                try {
                  await check.check(middlewareContext);
                  return await next({ context });
                } catch (error) {
                  throw createOrpcError(check, error);
                }
              }
            );
          },
        });

        return withForInput;
      }

      // For non-function properties, return as-is
      return originalValue;
    },
  }) as unknown as OrpcMiddlewareProxy<T>;

  return proxy;
}

// ============================================================================
// Composite Middleware Factory
// ============================================================================

/**
 * Create an ORPC middleware from multiple checks.
 *
 * This is a re-export/wrapper around createCompositeOrpcMiddleware
 * for consistency with the proxy pattern API.
 *
 * @param checks - Array of MiddlewareCheck objects
 * @param options - Optional ORPC middleware options
 * @returns A single ORPC middleware that runs all checks in sequence
 *
 * @example
 * ```typescript
 * const middlewares = createPluginMiddlewares(auth, registry);
 *
 * const checks = [
 *   middlewares.admin.requireSession(),
 *   middlewares.admin.hasRole(['admin']),
 * ];
 *
 * const compositeMiddleware = createCompositeOrpcMiddlewareFromChecks(checks);
 * ```
 */
export function createCompositeOrpcMiddlewareFromChecks(
  checks: MiddlewareCheck[],
  options: OrpcMiddlewareOptions = {}
) {
  return createCompositeOrpcMiddleware(checks, options);
}
