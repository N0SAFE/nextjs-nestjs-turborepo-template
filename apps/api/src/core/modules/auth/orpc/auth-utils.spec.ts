import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthUtils, AuthUtilsEmpty } from './auth-utils';
import type { ORPCAuthContext } from './types';

describe('ORPC AuthUtils', () => {
  let mockAuth: any;
  let mockSession: any;

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
      },
    };
  });

  describe('AuthUtils', () => {
    it('should implement ORPCAuthContext interface', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      // Check that all required methods and properties exist
      expect(utils).toHaveProperty('isLoggedIn');
      expect(utils).toHaveProperty('session');
      expect(utils).toHaveProperty('user');
      expect(utils).toHaveProperty('requireAuth');
      expect(utils).toHaveProperty('requireRole');
      expect(utils).toHaveProperty('requireAllRoles');
      expect(utils).toHaveProperty('requirePermissions');
      expect(utils).toHaveProperty('access');
      expect(utils).toHaveProperty('getRoles');
      expect(utils).toHaveProperty('hasRole');
      expect(utils).toHaveProperty('hasPermission');
    });

    it('should extend GlobalAuthUtils', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      // Should have same behavior as GlobalAuthUtils
      expect(utils.isLoggedIn).toBe(true);
      expect(utils.session).toBe(mockSession.session);
      expect(utils.user).toBe(mockSession.user);
    });

    it('should work as ORPCAuthContext type', () => {
      const utils: ORPCAuthContext = new AuthUtils(mockSession, mockAuth);

      expect(utils.isLoggedIn).toBe(true);
      expect(utils.user?.id).toBe('user-123');
    });
  });

  describe('AuthUtilsEmpty', () => {
    it('should implement ORPCAuthContext interface', () => {
      const utils = new AuthUtilsEmpty();

      // Check that all required methods and properties exist
      expect(utils).toHaveProperty('isLoggedIn');
      expect(utils).toHaveProperty('session');
      expect(utils).toHaveProperty('user');
      expect(utils).toHaveProperty('requireAuth');
      expect(utils).toHaveProperty('requireRole');
      expect(utils).toHaveProperty('requireAllRoles');
      expect(utils).toHaveProperty('requirePermissions');
      expect(utils).toHaveProperty('access');
      expect(utils).toHaveProperty('getRoles');
      expect(utils).toHaveProperty('hasRole');
      expect(utils).toHaveProperty('hasPermission');
    });

    it('should extend GlobalAuthUtilsEmpty', () => {
      const utils = new AuthUtilsEmpty();

      // Should have same behavior as GlobalAuthUtilsEmpty
      expect(utils.isLoggedIn).toBe(false);
      expect(utils.session).toBeNull();
      expect(utils.user).toBeNull();
    });

    it('should work as ORPCAuthContext type', () => {
      const utils: ORPCAuthContext = new AuthUtilsEmpty();

      expect(utils.isLoggedIn).toBe(false);
      expect(utils.user).toBeNull();
    });
  });
});
