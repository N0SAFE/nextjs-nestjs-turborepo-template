import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth, accessControl, publicAccess } from './middlewares';
import { AuthUtils, AuthUtilsEmpty } from './auth-utils';
import { ORPCError } from '@orpc/client';

// Mock only validatePermission to avoid dependency on actual permission config
vi.mock('@repo/auth/permissions', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@repo/auth/permissions')>();
  
  // Override only validatePermission to always return true
  actual.PermissionChecker.validatePermission = vi.fn().mockReturnValue(true);
  
  return actual;
});

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

  describe('accessControl', () => {
    it('should pass when user has required role', async () => {
      const middleware = accessControl({ roles: ['admin'] });
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success' }));

      await middleware({
        context: mockContext,
        input: {},
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when user lacks required role', async () => {
      const sessionWithUserRole = {
        ...mockSession,
        user: { ...mockSession.user, role: 'user' },
      };
      const userContext = {
        ...mockContext,
        auth: new AuthUtils(sessionWithUserRole, mockAuth),
      };

      const middleware = accessControl({ roles: ['admin'] });

      await expect(
        middleware({
          context: userContext,
          input: {},
          next: vi.fn(),
        })
      ).rejects.toThrow(ORPCError);
    });

    it('should pass when user has any of the required roles', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const middleware = accessControl({ roles: ['manager', 'admin'] });
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success' }));

      await middleware({
        context: mockContext,
        input: {},
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });

    it('should pass when user has all required roles', async () => {
      const middleware = accessControl({ allRoles: ['admin'] });
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success' }));

      await middleware({
        context: mockContext,
        input: {},
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when user lacks one of all required roles', async () => {
      const sessionWithUserRole = {
        ...mockSession,
        user: { ...mockSession.user, role: 'user' },
      };
      const userContext = {
        ...mockContext,
        auth: new AuthUtils(sessionWithUserRole, mockAuth),
      };

      const middleware = accessControl({ allRoles: ['user', 'admin'] });

      await expect(
        middleware({
          context: userContext,
          input: {},
          next: vi.fn(),
        })
      ).rejects.toThrow(ORPCError);
    });

    it('should pass when user has required permissions', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
      const middleware = accessControl({ permissions: { project: ['read'] } });
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success' }));

      await middleware({
        context: mockContext,
        input: {},
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when user lacks required permissions', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: false });
      const middleware = accessControl({ permissions: { project: ['delete'] } });

      await expect(
        middleware({
          context: mockContext,
          input: {},
          next: vi.fn(),
        })
      ).rejects.toThrow(ORPCError);
    });

    it('should check roles and permissions together', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
      const middleware = accessControl({
        roles: ['admin'],
        permissions: { project: ['read'] },
      });
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success' }));

      await middleware({
        context: mockContext,
        input: {},
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const unauthContext = {
        ...mockContext,
        auth: new AuthUtilsEmpty(),
      };
      const middleware = accessControl({ roles: ['admin'] });

      await expect(
        middleware({
          context: unauthContext,
          input: {},
          next: vi.fn(),
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe('publicAccess', () => {
    it('should always pass for authenticated users', async () => {
      const middleware = publicAccess();
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success' }));

      await middleware({
        context: mockContext,
        input: {},
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });

    it('should always pass for unauthenticated users', async () => {
      const unauthContext = {
        ...mockContext,
        auth: new AuthUtilsEmpty(),
      };
      const middleware = publicAccess();
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'success' }));

      await middleware({
        context: unauthContext,
        input: {},
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });

    it('should do nothing and just pass through', async () => {
      const middleware = publicAccess();
      const nextFn = vi.fn().mockImplementation(() => Promise.resolve({ output: 'test-output' }));

      await middleware({
        context: mockContext,
        input: { test: 'data' },
        next: nextFn,
      });

      expect(nextFn).toHaveBeenCalled();
    });
  });
});
