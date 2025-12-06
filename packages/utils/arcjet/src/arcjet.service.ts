import arcjet, {
  type ArcjetDecision,
  shield,
  tokenBucket,
  fixedWindow,
  slidingWindow,
  detectBot,
  validateEmail,
} from 'arcjet';

/**
 * Type for Arcjet request context
 */
export interface ArcjetRequestContext {
  ip?: string;
  method?: string;
  protocol?: string;
  host?: string;
  path?: string;
  headers?: Headers | Record<string, string | string[] | undefined>;
  email?: string;
  [key: string]: unknown;
}

/**
 * Service for managing Arcjet protection rules
 * This service wraps the Arcjet SDK and provides methods for creating
 * protection rules that can be used with ORPC middleware
 */
export class ArcjetService {
  private readonly key: string;

  constructor(key: string) {
    this.key = key;
  }

  /**
   * Create a new Arcjet instance with specific rules
   * @param rules - Array of Arcjet rules to apply
   * @returns New Arcjet client with the specified rules
   */
  withRules(...rules: any[]) {
    return arcjet({
      key: this.key,
      rules,
    });
  }

  /**
   * Helper to create a rate limiting rule using token bucket algorithm
   * @param options - Rate limit configuration
   */
  static rateLimit(options: {
    mode?: 'LIVE' | 'DRY_RUN';
    match?: string;
    characteristics?: string[];
    refillRate: number;
    interval: number | string;
    capacity: number;
  }) {
    return tokenBucket(options);
  }

  /**
   * Helper to create a fixed window rate limit
   * @param options - Fixed window configuration
   */
  static fixedWindowRateLimit(options: {
    mode?: 'LIVE' | 'DRY_RUN';
    match?: string;
    characteristics?: string[];
    max: number;
    window: string;
  }) {
    return fixedWindow(options);
  }

  /**
   * Helper to create a sliding window rate limit
   * @param options - Sliding window configuration
   */
  static slidingWindowRateLimit(options: {
    mode?: 'LIVE' | 'DRY_RUN';
    match?: string;
    characteristics?: string[];
    max: number;
    interval: number | string;
  }) {
    return slidingWindow(options);
  }

  /**
   * Helper to create a bot detection rule
   * @param options - Bot detection configuration
   */
  static botProtection(options?: {
    mode?: 'LIVE' | 'DRY_RUN';
  }) {
    return detectBot(options as any);
  }

  /**
   * Helper to create an email validation rule
   * @param options - Email validation configuration
   */
  static emailValidation(options?: {
    mode?: 'LIVE' | 'DRY_RUN';
    requireTopLevelDomain?: boolean;
    allowDomainLiteral?: boolean;
  }) {
    return validateEmail(options as any);
  }

  /**
   * Helper to create a shield rule (general attack protection)
   * @param options - Shield configuration
   */
  static shieldProtection(options?: {
    mode?: 'LIVE' | 'DRY_RUN';
  }) {
    return shield(options as any);
  }
}

/**
 * Factory function to create an Arcjet service instance
 * @param key - Arcjet API key
 */
export function createArcjetService(key: string): ArcjetService {
  return new ArcjetService(key);
}

// Re-export commonly used types and functions from Arcjet
export {
  shield,
  tokenBucket,
  fixedWindow,
  slidingWindow,
  detectBot,
  validateEmail,
  type ArcjetDecision,
};
