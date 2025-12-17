import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createArcjetMiddleware,
  rateLimitMiddleware,
  botProtectionMiddleware,
  shieldMiddleware,
  ArcjetDeniedError,
} from './orpc-middleware';
import { ArcjetService } from './arcjet.service';
import type { ArcjetDecision } from 'arcjet';

// Mock Arcjet SDK
vi.mock('arcjet', () => ({
  default: vi.fn((options: any) => ({
    options,
    protect: vi.fn(),
  })),
  shield: vi.fn((options: any) => ({ type: 'SHIELD', ...options })),
  tokenBucket: vi.fn((options: any) => ({ type: 'RATE_LIMIT', ...options })),
  fixedWindow: vi.fn((options: any) => ({ type: 'FIXED_WINDOW', ...options })),
  slidingWindow: vi.fn((options: any) => ({ type: 'SLIDING_WINDOW', ...options })),
  detectBot: vi.fn((options: any) => ({ type: 'BOT_DETECTION', ...options })),
  validateEmail: vi.fn((options: any) => ({ type: 'EMAIL_VALIDATION', ...options })),
}));

describe('Arcjet ORPC Middleware', () => {
  let mockArcjetService: ArcjetService;
  let mockContext: any;
  let mockDecision: ArcjetDecision;

  beforeEach(() => {
    // Create mock Arcjet service
    mockArcjetService = new ArcjetService('test-key');

    // Create mock context
    mockContext = {
      request: {
        url: 'http://localhost:3000/api/test',
        method: 'POST',
        headers: new Headers({
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-agent',
        }),
      },
    };

    // Create mock decision
    mockDecision = {
      id: 'test-decision-id',
      conclusion: 'ALLOW',
      reason: 'NONE',
      isDenied: () => false,
      isAllowed: () => true,
      isErrored: () => false,
    } as ArcjetDecision;
  });

  describe('createArcjetMiddleware', () => {
    it('should create middleware function', () => {
      const rules = [ArcjetService.shieldProtection()];
      const middleware = createArcjetMiddleware(mockArcjetService, rules);

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create middleware with options', () => {
      const rules = [ArcjetService.shieldProtection()];
      const onDenied = vi.fn();
      const middleware = createArcjetMiddleware(mockArcjetService, rules, { onDenied });

      expect(middleware).toBeDefined();
    });
  });

  describe('rateLimitMiddleware', () => {
    it('should create rate limiting middleware', () => {
      const middleware = rateLimitMiddleware(mockArcjetService, {
        refillRate: 10,
        interval: '1m',
        capacity: 100,
      });

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create middleware with custom options', () => {
      const middleware = rateLimitMiddleware(
        mockArcjetService,
        {
          refillRate: 5,
          interval: '30s',
          capacity: 50,
          mode: 'DRY_RUN',
        },
        {
          onDenied: (decision) => {
            console.log('Denied:', decision);
          },
        }
      );

      expect(middleware).toBeDefined();
    });
  });

  describe('botProtectionMiddleware', () => {
    it('should create bot protection middleware', () => {
      const middleware = botProtectionMiddleware(mockArcjetService);

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create middleware with options', () => {
      const middleware = botProtectionMiddleware(mockArcjetService, {
        mode: 'LIVE',
        deny: ['AUTOMATED'],
      });

      expect(middleware).toBeDefined();
    });
  });

  describe('shieldMiddleware', () => {
    it('should create shield middleware', () => {
      const middleware = shieldMiddleware(mockArcjetService);

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should create middleware in DRY_RUN mode', () => {
      const middleware = shieldMiddleware(mockArcjetService, {
        mode: 'DRY_RUN',
      });

      expect(middleware).toBeDefined();
    });
  });

  describe('ArcjetDeniedError', () => {
    it('should create error with decision', () => {
      const error = new ArcjetDeniedError(mockDecision);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ArcjetDeniedError');
      expect(error.decision).toBe(mockDecision);
    });

    it('should use default message', () => {
      const error = new ArcjetDeniedError(mockDecision);
      expect(error.message).toContain('Request denied by Arcjet');
      expect(error.message).toContain('ALLOW');
    });

    it('should use custom message', () => {
      const customMessage = 'Custom denial message';
      const error = new ArcjetDeniedError(mockDecision, customMessage);

      expect(error.message).toBe(customMessage);
    });
  });

  describe('ArcjetService static methods', () => {
    it('should create rate limit rule', () => {
      const rule = ArcjetService.rateLimit({
        refillRate: 10,
        interval: '1m',
        capacity: 100,
      });

      expect(rule).toBeDefined();
      expect(rule).toHaveProperty('type', 'RATE_LIMIT');
    });

    it('should create bot protection rule', () => {
      const rule = ArcjetService.botProtection();

      expect(rule).toBeDefined();
      expect(rule).toHaveProperty('type', 'BOT_DETECTION');
    });

    it('should create shield rule', () => {
      const rule = ArcjetService.shieldProtection();

      expect(rule).toBeDefined();
      expect(rule).toHaveProperty('type', 'SHIELD');
    });
  });
});
