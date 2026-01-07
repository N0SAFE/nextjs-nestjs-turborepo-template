import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthUtils, AuthUtilsEmpty } from './auth-utils';
import type { UserSession } from './auth-utils';
import { ORPCError } from '@orpc/client';

describe('AuthUtils', () => {
  let mockAuth: any;
  let mockSession: UserSession;

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
  });

  describe('constructor and getters', () => {
    it('should create instance with authenticated session', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      expect(utils.isLoggedIn).toBe(true);
      expect(utils.session).toBe(mockSession.session);
      expect(utils.user).toBe(mockSession.user);
    });

    it('should create instance with null session', () => {
      const utils = new AuthUtils(null, mockAuth);

      expect(utils.isLoggedIn).toBe(false);
      expect(utils.session).toBeNull();
      expect(utils.user).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return session and user when authenticated', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = utils.requireAuth();

      expect(result.session).toBe(mockSession.session);
      expect(result.user).toBe(mockSession.user);
    });

    it('should throw UNAUTHORIZED error when not authenticated', () => {
      const utils = new AuthUtils(null, mockAuth);

      expect(() => utils.requireAuth()).toThrow(ORPCError);
      expect(() => utils.requireAuth()).toThrow('Authentication required');
    });
  });

  describe('admin plugin access', () => {
    it('should provide admin plugin wrapper', () => {
      const utils = new AuthUtils(mockSession, mockAuth);
      
      // admin is a getter that returns AdminPluginWrapper
      expect(utils.admin).toBeDefined();
    });
  });

  describe('org plugin access', () => {
    it('should provide org plugin wrapper', () => {
      const utils = new AuthUtils(mockSession, mockAuth);
      
      // org is a getter that returns OrganizationPluginWrapper
      expect(utils.org).toBeDefined();
    });
  });
});

describe('AuthUtilsEmpty', () => {
  let utils: AuthUtilsEmpty;
  let mockAuth: any;

  beforeEach(() => {
    mockAuth = {
      api: {
        getSession: vi.fn(),
      },
    };
    utils = new AuthUtilsEmpty(mockAuth);
  });

  it('should have isLoggedIn as false', () => {
    expect(utils.isLoggedIn).toBe(false);
  });

  it('should have session as null', () => {
    expect(utils.session).toBeNull();
  });

  it('should have user as null', () => {
    expect(utils.user).toBeNull();
  });

  it('should throw UNAUTHORIZED on requireAuth', () => {
    expect(() => utils.requireAuth()).toThrow(ORPCError);
    expect(() => utils.requireAuth()).toThrow('Authentication required');
  });

  describe('admin plugin access', () => {
    it('should provide admin plugin wrapper', () => {
      // admin is a getter that returns AdminPluginWrapper
      expect(utils.admin).toBeDefined();
    });
  });

  describe('org plugin access', () => {
    it('should provide org plugin wrapper', () => {
      // org is a getter that returns OrganizationPluginWrapper
      expect(utils.org).toBeDefined();
    });
  });
});
