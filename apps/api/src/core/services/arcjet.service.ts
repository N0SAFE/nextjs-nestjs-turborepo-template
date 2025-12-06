import { Injectable } from '@nestjs/common';
import { 
  createArcjetService, 
  ArcjetService as BaseArcjetService,
  rateLimitMiddleware as baseRateLimitMiddleware,
  botProtectionMiddleware as baseBotProtectionMiddleware,
  shieldMiddleware as baseShieldMiddleware,
  createArcjetMiddleware as baseCreateArcjetMiddleware,
  type ArcjetMiddlewareOptions,
} from '@repo/arcjet';
import { EnvService } from '@/config/env/env.service';

/**
 * NestJS-injectable Arcjet service
 * Wraps the @repo/arcjet service with dependency injection
 */
@Injectable()
export class ArcjetService {
  private readonly arcjet: BaseArcjetService;

  constructor(private readonly envService: EnvService) {
    // Initialize Arcjet with API key from environment
    // In dev mode, use a test key or skip if not provided
    const arcjetKey = process.env.ARCJET_KEY || 'test_key_dev_mode';
    this.arcjet = createArcjetService(arcjetKey);
  }

  /**
   * Get the underlying Arcjet service instance
   * Use this to access the service methods and create middleware
   */
  getInstance(): BaseArcjetService {
    return this.arcjet;
  }

  /**
   * Create a rate limiting middleware
   * 
   * @example
   * ```ts
   * implement(contract)
   *   .use(this.arcjetService.rateLimitMiddleware({
   *     refillRate: 10,
   *     interval: '1m',
   *     capacity: 100
   *   }))
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  rateLimitMiddleware(
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
    return baseRateLimitMiddleware(this.arcjet, options, middlewareOptions);
  }

  /**
   * Create a bot protection middleware
   * 
   * @example
   * ```ts
   * implement(contract)
   *   .use(this.arcjetService.botProtectionMiddleware())
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  botProtectionMiddleware(
    options?: {
      mode?: 'LIVE' | 'DRY_RUN';
      allow?: string[];
      deny?: string[];
    },
    middlewareOptions?: ArcjetMiddlewareOptions
  ) {
    return baseBotProtectionMiddleware(this.arcjet, options, middlewareOptions);
  }

  /**
   * Create a shield protection middleware
   * 
   * @example
   * ```ts
   * implement(contract)
   *   .use(this.arcjetService.shieldMiddleware())
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  shieldMiddleware(
    options?: {
      mode?: 'LIVE' | 'DRY_RUN';
    },
    middlewareOptions?: ArcjetMiddlewareOptions
  ) {
    return baseShieldMiddleware(this.arcjet, options, middlewareOptions);
  }

  /**
   * Create a custom Arcjet middleware with specific rules
   * 
   * @example
   * ```ts
   * import { ArcjetService as BaseArcjetService } from '@repo/arcjet';
   * 
   * implement(contract)
   *   .use(this.arcjetService.createMiddleware([
   *     BaseArcjetService.rateLimit({ refillRate: 10, interval: '1m', capacity: 100 }),
   *     BaseArcjetService.botProtection()
   *   ]))
   *   .handler(async ({ input }) => {
   *     // Handler logic
   *   });
   * ```
   */
  createMiddleware(
    rules: any[],
    options?: ArcjetMiddlewareOptions
  ) {
    return baseCreateArcjetMiddleware(this.arcjet, rules, options);
  }
}
