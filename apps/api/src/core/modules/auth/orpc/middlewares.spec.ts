import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth, publicAccess } from './middlewares';
import { AuthUtils, AuthUtilsEmpty } from './auth-utils';
import type { MiddlewareOptions, MiddlewareOutputFn } from '@orpc/server';

// Mock only validatePermission to avoid dependency on actual permission config
vi.mock('@repo/auth/permissions', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@repo/auth/permissions')>();
  
  // Override only validatePermission to always return true
  actual.PermissionChecker.validatePermission = vi.fn().mockReturnValue(true);
  
  return actual;
});

/**
 * Helper to create middleware options with proper ORPC signature
 */
function createMiddlewareOptions(
  context: any,
  nextFn: any
): MiddlewareOptions<any, any, any, any> {
  return {
    context,
    path: [],
    procedure: {} as any,
    signal: undefined,
    lastEventId: undefined,
    next: nextFn,
    errors: {},
  };
}

/**
 * Helper to create the output function
 */
function createOutputFn(): MiddlewareOutputFn<any> {
  return vi.fn((output) => ({ output, context: {} }));
}

describe('ORPC Auth Middlewares', () => {
  let mockAuth: any;
  let mockSession: any;
  let mockContext: any;

  beforeEach(() => {
    mockAuth = {
      api: {
        userHasPermission: vi.fn(),
      },
    };

    mockSession = {
      session: {
        id: 'session-123',
        userId: 'user-123',
        expiresAt: new Date('2025-12-31'),
        token: 'token-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        banned: false,
      },
    };

    mockContext = {
      request: {} as Request,
      auth: new AuthUtils(mockSession, mockAuth),
    };
  });

  describe('requireAuth', () => {
    it('should return ORPC middleware function', () => {
      const middleware = requireAuth();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  // NOTE: accessControl has been removed in favor of plugin-based middlewares
  // Use adminMiddlewares.requireRole() or adminMiddlewares.requireAccess() instead
  // See plugin-factory.ts for the new implementation

  describe('publicAccess', () => {
    it('should always pass for authenticated users', async () => {
      const middleware = publicAccess();
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success', context: {} }));

      const options = createMiddlewareOptions(mockContext, nextFn);
      await middleware(options, {}, createOutputFn());

      expect(nextFn).toHaveBeenCalled();
    });

    it('should always pass for unauthenticated users', async () => {
      const unauthContext = {
        ...mockContext,
        auth: new AuthUtilsEmpty(mockAuth),
      };
      const middleware = publicAccess();
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success', context: {} }));

      const options = createMiddlewareOptions(unauthContext, nextFn);
      await middleware(options, {}, createOutputFn());

      expect(nextFn).toHaveBeenCalled();
    });

    it('should do nothing and just pass through', async () => {
      const middleware = publicAccess();
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'test-output', context: {} }));

      const options = createMiddlewareOptions(mockContext, nextFn);
      await middleware(options, { test: 'data' }, createOutputFn());

      expect(nextFn).toHaveBeenCalled();
    });
  });
});
