import type { ArcjetDecision } from 'arcjet';
import { os } from '@orpc/server';
import { ArcjetService, type ArcjetRequestContext } from './arcjet.service';

/**
 * ORPC context with request information
 */
export interface ORPCContextWithRequest {
  request: Request;
  [key: string]: unknown;
}

/**
 * Options for Arcjet middleware
 */
export interface ArcjetMiddlewareOptions {
  /**
   * Custom function to extract request context from ORPC context
   * Use this to add custom characteristics like userId, email, etc.
   */
  extractContext?: (context: ORPCContextWithRequest) => Partial<ArcjetRequestContext>;
  
  /**
   * Custom function to handle denied requests
   * If not provided, will throw an error with the Arcjet decision
   */
  onDenied?: (decision: ArcjetDecision, context: ORPCContextWithRequest) => void | Promise<void>;
  
  /**
   * Custom function to handle errors during Arcjet checks
   * If not provided, will re-throw the error
   */
  onError?: (error: Error, context: ORPCContextWithRequest) => void | Promise<void>;
}

/**
 * Error thrown when Arcjet denies a request
 */
export class ArcjetDeniedError extends Error {
  constructor(
    public readonly decision: ArcjetDecision,
    message?: string
  ) {
    super(message || `Request denied by Arcjet: ${decision.conclusion}`);
    this.name = 'ArcjetDeniedError';
  }
}

/**
 * Creates an ORPC middleware that uses Arcjet rules for protection
 * 
 * @example
 * ```ts
 * import { createArcjetMiddleware, ArcjetService } from '@repo/arcjet';
 * 
 * // In your controller
 * @Implement(contract)
 * handler() {
 *   return implement(contract)
 *     .use(createArcjetMiddleware(arcjetService, [
 *       ArcjetService.rateLimit({
 *         refillRate: 10,
 *         interval: '1m',
 *         capacity: 100
 *       })
 *     ]))
 *     .handler(async ({ input }) => {
 *       // Your handler logic
 *     });
 * }
 * ```
 */
export function createArcjetMiddleware(
  arcjetService: ArcjetService,
  rules: any[],
  options?: ArcjetMiddlewareOptions
) {
  return os
    .$context<ORPCContextWithRequest>()
    .middleware(async ({ context, next }) => {
      try {
        // Extract request context
        const requestContext = extractRequestContext(context, options?.extractContext);
        
        // Create Arcjet client with rules
        const client = arcjetService.withRules(...rules);
        
        // Protect the request
        const decision = await client.protect(requestContext as any);
        
        // Handle the decision
        if (decision.isDenied()) {
          if (options?.onDenied) {
            await options.onDenied(decision, context);
          } else {
            throw new ArcjetDeniedError(decision);
          }
        }
        
        // Request is allowed, continue to next middleware/handler
        return next({ context });
      } catch (error) {
        if (options?.onError && !(error instanceof ArcjetDeniedError)) {
          await options.onError(error as Error, context);
          // Continue despite error if custom handler is provided
          return next({ context });
        }
        throw error;
      }
    });
}

/**
 * Helper function to extract request context from ORPC context
 */
function extractRequestContext(
  context: ORPCContextWithRequest,
  customExtractor?: (context: ORPCContextWithRequest) => Partial<ArcjetRequestContext>
): ArcjetRequestContext {
  const request = context.request;
  
  // Extract basic request information
  const url = new URL(request.url);
  const baseContext: ArcjetRequestContext = {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
        request.headers.get('x-real-ip') || 
        'unknown',
    method: request.method,
    protocol: url.protocol.replace(':', ''),
    host: url.host,
    path: url.pathname,
    headers: request.headers,
  };
  
  // Apply custom extractor if provided
  if (customExtractor) {
    return {
      ...baseContext,
      ...customExtractor(context),
    };
  }
  
  return baseContext;
}

/**
 * Convenience function to create a rate limiting middleware
 * 
 * @example
 * ```ts
 * implement(contract)
 *   .use(rateLimitMiddleware(arcjetService, {
 *     refillRate: 10,
 *     interval: '1m',
 *     capacity: 100
 *   }))
 *   .handler(async ({ input }) => {
 *     // Handler logic
 *   });
 * ```
 */
export function rateLimitMiddleware(
  arcjetService: ArcjetService,
  options: {
    mode?: 'LIVE' | 'DRY_RUN';
    match?: string;
    characteristics?: string[];
    refillRate: number;
    interval: number | string;
    capacity: number;
  },
  middlewareOptions?: ArcjetMiddlewareOptions
) {
  const rule = ArcjetService.rateLimit(options);
  return createArcjetMiddleware(arcjetService, [rule], middlewareOptions);
}

/**
 * Convenience function to create a bot protection middleware
 * 
 * @example
 * ```ts
 * implement(contract)
 *   .use(botProtectionMiddleware(arcjetService))
 *   .handler(async ({ input }) => {
 *     // Handler logic
 *   });
 * ```
 */
export function botProtectionMiddleware(
  arcjetService: ArcjetService,
  options?: {
    mode?: 'LIVE' | 'DRY_RUN';
    allow?: string[];
    deny?: string[];
  },
  middlewareOptions?: ArcjetMiddlewareOptions
) {
  const rule = ArcjetService.botProtection(options);
  return createArcjetMiddleware(arcjetService, [rule], middlewareOptions);
}

/**
 * Convenience function to create a shield protection middleware
 * 
 * @example
 * ```ts
 * implement(contract)
 *   .use(shieldMiddleware(arcjetService))
 *   .handler(async ({ input }) => {
 *     // Handler logic
 *   });
 * ```
 */
export function shieldMiddleware(
  arcjetService: ArcjetService,
  options?: {
    mode?: 'LIVE' | 'DRY_RUN';
  },
  middlewareOptions?: ArcjetMiddlewareOptions
) {
  const rule = ArcjetService.shieldProtection(options);
  return createArcjetMiddleware(arcjetService, [rule], middlewareOptions);
}

// ArcjetService is already imported and available
