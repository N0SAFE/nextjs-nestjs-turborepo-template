import { os } from '@orpc/server';

/**
 * Generic ORPC context type
 */
export interface ORPCContext {
  request: Request;
  [key: string]: unknown;
}

/**
 * Options for creating a custom middleware
 */
export interface MiddlewareOptions<TContext extends ORPCContext> {
  /**
   * Function to execute before the handler
   * Can modify context or throw errors to prevent handler execution
   */
  before?: (context: TContext, input: unknown) => Promise<void> | void;
  
  /**
   * Function to execute after the handler
   * Can modify the output or throw errors
   */
  after?: (context: TContext, input: unknown, output: unknown) => Promise<void> | void;
  
  /**
   * Function to handle errors
   */
  onError?: (error: Error, context: TContext, input: unknown) => Promise<void> | void;
}

/**
 * Generic utility service for creating ORPC middleware
 * This service provides helper functions to create custom ORPC middleware
 * following common patterns
 */
export class ORPCUtils {
  /**
   * Creates a middleware that executes functions before and after the handler
   * 
   * @example
   * ```ts
   * const loggingMiddleware = ORPCUtils.createMiddleware({
   *   before: (context, input) => {
   *     console.log('Before handler', input);
   *   },
   *   after: (context, input, output) => {
   *     console.log('After handler', output);
   *   }
   * });
   * 
   * implement(contract)
   *   .use(loggingMiddleware)
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  static createMiddleware<TContext extends ORPCContext = ORPCContext>(
    options: MiddlewareOptions<TContext>
  ) {
    return os
      .$context<TContext>()
      .middleware(async ({ context, input, next }) => {
        try {
          // Execute before hook
          if (options.before) {
            await options.before(context, input);
          }
          
          // Execute handler
          const result = await next({ context });
          
          // Execute after hook
          if (options.after) {
            await options.after(context, input, result);
          }
          
          return result;
        } catch (error) {
          // Execute error handler if provided
          if (options.onError) {
            await options.onError(error as Error, context, input);
          }
          throw error;
        }
      });
  }

  /**
   * Creates a conditional middleware that only executes if a condition is met
   * 
   * @example
   * ```ts
   * const conditionalAuth = ORPCUtils.conditionalMiddleware(
   *   (context, input) => input.requireAuth === true,
   *   requireAuth()
   * );
   * 
   * implement(contract)
   *   .use(conditionalAuth)
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  static conditionalMiddleware<TContext extends ORPCContext = ORPCContext>(
    condition: (context: TContext, input: unknown) => boolean | Promise<boolean>,
    middleware: ReturnType<typeof os.$context>
  ) {
    return os
      .$context<TContext>()
      .middleware(async ({ context, input, next }) => {
        const shouldApply = await condition(context, input);
        
        if (shouldApply) {
          // Apply the middleware
          return middleware.middleware(({ context: ctx, input: inp, next: nxt }) => {
            return nxt({ context: ctx as any });
          })({ context, input, next });
        }
        
        // Skip the middleware
        return next({ context });
      });
  }

  /**
   * Creates a middleware that transforms the context
   * 
   * @example
   * ```ts
   * const addTimestamp = ORPCUtils.transformContext((context) => ({
   *   ...context,
   *   timestamp: Date.now()
   * }));
   * 
   * implement(contract)
   *   .use(addTimestamp)
   *   .handler(async ({ context }) => {
   *     console.log(context.timestamp);
   *   });
   * ```
   */
  static transformContext<
    TContext extends ORPCContext = ORPCContext,
    TNewContext extends TContext = TContext
  >(
    transformer: (context: TContext) => TNewContext | Promise<TNewContext>
  ) {
    return os
      .$context<TContext>()
      .middleware(async ({ context, next }) => {
        const newContext = await transformer(context);
        return next({ context: newContext });
      });
  }

  /**
   * Creates a middleware that validates input with a custom validator
   * 
   * @example
   * ```ts
   * const validateInput = ORPCUtils.validateInput((input) => {
   *   if (!input.email.includes('@')) {
   *     throw new Error('Invalid email');
   *   }
   * });
   * 
   * implement(contract)
   *   .use(validateInput)
   *   .handler(async ({ input }) => {
   *     // Input is validated
   *   });
   * ```
   */
  static validateInput<TContext extends ORPCContext = ORPCContext>(
    validator: (input: unknown, context: TContext) => void | Promise<void>
  ) {
    return os
      .$context<TContext>()
      .middleware(async ({ context, input, next }) => {
        await validator(input, context);
        return next({ context });
      });
  }

  /**
   * Creates a middleware that caches results based on a cache key
   * Note: This is a simple in-memory cache. For production use, consider Redis or similar
   * 
   * @example
   * ```ts
   * const cache = new Map();
   * const cachedMiddleware = ORPCUtils.cacheResults(
   *   cache,
   *   (input) => JSON.stringify(input),
   *   60000 // 1 minute TTL
   * );
   * 
   * implement(contract)
   *   .use(cachedMiddleware)
   *   .handler(async ({ input }) => {
   *     // Expensive operation
   *   });
   * ```
   */
  static cacheResults<TContext extends ORPCContext = ORPCContext>(
    cache: Map<string, { value: unknown; expiresAt: number }>,
    keyGenerator: (input: unknown, context: TContext) => string,
    ttl: number = 60000
  ) {
    return os
      .$context<TContext>()
      .middleware(async ({ context, input, next }) => {
        const key = keyGenerator(input, context);
        const cached = cache.get(key);
        
        // Check if cached and not expired
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value;
        }
        
        // Execute handler and cache result
        const result = await next({ context });
        cache.set(key, {
          value: result,
          expiresAt: Date.now() + ttl,
        });
        
        return result;
      });
  }

  /**
   * Creates a middleware that logs requests and responses
   * 
   * @example
   * ```ts
   * const logger = ORPCUtils.loggingMiddleware({
   *   logInput: true,
   *   logOutput: true,
   *   logDuration: true
   * });
   * 
   * implement(contract)
   *   .use(logger)
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  static loggingMiddleware<TContext extends ORPCContext = ORPCContext>(options: {
    logInput?: boolean;
    logOutput?: boolean;
    logDuration?: boolean;
    logger?: (message: string, data?: unknown) => void;
  } = {}) {
    const logger = options.logger || console.log;
    
    return os
      .$context<TContext>()
      .middleware(async ({ context, input, next }) => {
        const startTime = Date.now();
        
        if (options.logInput) {
          logger('Request input:', input);
        }
        
        const result = await next({ context });
        
        if (options.logOutput) {
          logger('Response output:', result);
        }
        
        if (options.logDuration) {
          logger(`Request duration: ${Date.now() - startTime}ms`);
        }
        
        return result;
      });
  }

  /**
   * Composes multiple middleware into a single middleware
   * Middleware are executed in order
   * 
   * @example
   * ```ts
   * const combined = ORPCUtils.composeMiddleware(
   *   requireAuth(),
   *   rateLimitMiddleware(arcjet, { ... }),
   *   loggingMiddleware()
   * );
   * 
   * implement(contract)
   *   .use(combined)
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  static composeMiddleware<TContext extends ORPCContext = ORPCContext>(
    ...middlewares: ReturnType<typeof os.$context>[]
  ) {
    return os
      .$context<TContext>()
      .middleware(async ({ context, input, next }) => {
        let currentNext = next;
        
        // Build middleware chain from right to left
        for (let i = middlewares.length - 1; i >= 0; i--) {
          const middleware = middlewares[i];
          const previousNext = currentNext;
          
          currentNext = (opts: { context: TContext }) =>
            middleware.middleware(({ context: ctx, input: inp, next: nxt }) => {
              return previousNext(opts);
            })({ context: opts.context, input, next: previousNext });
        }
        
        return currentNext({ context });
      });
  }
}

// Export convenience functions
export const {
  createMiddleware,
  conditionalMiddleware,
  transformContext,
  validateInput,
  cacheResults,
  loggingMiddleware,
  composeMiddleware,
} = ORPCUtils;
