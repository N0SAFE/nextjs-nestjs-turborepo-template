import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthUtils, AuthUtilsEmpty } from './auth-utils';
import type { ORPCAuthContext } from './types';

// Mock the plugin-wrapper-factory module
vi.mock('../plugin-utils/plugin-wrapper-factory', () => ({
  createPluginRegistry: vi.fn(() => ({
    getAll: vi.fn(() => ({
      admin: { listUsers: vi.fn(), createUser: vi.fn() },
      organization: { createOrganization: vi.fn() },
    })),
  })),
}));

describe('ORPC AuthUtils', () => {
  let mockAuth: any;
  let mockSession: any;

  beforeEach(() => {
    mockAuth = {
      api: {
        getSession: vi.fn(),
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
      // Core properties
      expect(utils).toHaveProperty('isLoggedIn');
      expect(utils).toHaveProperty('session');
      expect(utils).toHaveProperty('user');
      // Plugin accessors
      expect(utils).toHaveProperty('admin');
      expect(utils).toHaveProperty('org');
      // Auth method
      expect(utils).toHaveProperty('requireAuth');
    });

    it('should return correct session state when authenticated', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      expect(utils.isLoggedIn).toBe(true);
      expect(utils.session).toBe(mockSession.session);
      expect(utils.user).toBe(mockSession.user);
    });

    it('should return correct session state when not authenticated', () => {
      const utils = new AuthUtils(null, mockAuth);

      expect(utils.isLoggedIn).toBe(false);
      expect(utils.session).toBeNull();
      expect(utils.user).toBeNull();
    });

    it('should work as ORPCAuthContext type', () => {
      const utils: ORPCAuthContext = new AuthUtils(mockSession, mockAuth);

      expect(utils.isLoggedIn).toBe(true);
      expect(utils.user?.id).toBe('user-123');
    });

    it('should provide plugin accessors', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      expect(utils.admin).toBeDefined();
      expect(utils.org).toBeDefined();
    });

    describe('requireAuth', () => {
      it('should return session when authenticated', () => {
        const utils = new AuthUtils(mockSession, mockAuth);
        const result = utils.requireAuth();

        expect(result).toBe(mockSession);
      });

      it('should throw UNAUTHORIZED when not authenticated', () => {
        const utils = new AuthUtils(null, mockAuth);

        expect(() => utils.requireAuth()).toThrow('Authentication required');
      });
    });
  });

  describe('AuthUtilsEmpty', () => {
    it('should implement ORPCAuthContext interface', () => {
      const utils = new AuthUtilsEmpty(mockAuth);

      // Check that all required methods and properties exist
      // Core properties
      expect(utils).toHaveProperty('isLoggedIn');
      expect(utils).toHaveProperty('session');
      expect(utils).toHaveProperty('user');
      // Plugin accessors
      expect(utils).toHaveProperty('admin');
      expect(utils).toHaveProperty('org');
      // Auth method
      expect(utils).toHaveProperty('requireAuth');
    });

    it('should always be unauthenticated', () => {
      const utils = new AuthUtilsEmpty(mockAuth);

      expect(utils.isLoggedIn).toBe(false);
      expect(utils.session).toBeNull();
      expect(utils.user).toBeNull();
    });

    it('should work as ORPCAuthContext type', () => {
      const utils: ORPCAuthContext = new AuthUtilsEmpty(mockAuth);

      expect(utils.isLoggedIn).toBe(false);
      expect(utils.user).toBeNull();
    });

    it('should provide plugin accessors', () => {
      const utils = new AuthUtilsEmpty(mockAuth);

      expect(utils.admin).toBeDefined();
      expect(utils.org).toBeDefined();
    });

    describe('requireAuth', () => {
      it('should always throw UNAUTHORIZED', () => {
        const utils = new AuthUtilsEmpty(mockAuth);

        expect(() => utils.requireAuth()).toThrow('Authentication required');
      });
    });
  });
});
