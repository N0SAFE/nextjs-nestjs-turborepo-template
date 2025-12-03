import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthUtils, AuthUtilsEmpty } from './auth-utils';
import type { UserSession } from './auth-utils';
import { ORPCError } from '@orpc/client';

// Mock only validatePermission to avoid dependency on actual permission config
vi.mock('@repo/auth/permissions', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@repo/auth/permissions')>();
  
  // Override only validatePermission to always return true
  actual.PermissionChecker.validatePermission = vi.fn().mockReturnValue(true);
  
  return actual;
});

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
    it('should return session when authenticated', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = utils.requireAuth();

      expect(result).toBe(mockSession);
    });

    it('should throw UNAUTHORIZED error when not authenticated', () => {
      const utils = new AuthUtils(null, mockAuth);

      expect(() => utils.requireAuth()).toThrow(ORPCError);
      expect(() => utils.requireAuth()).toThrow('Authentication required');
    });
  });

  describe('requireRole', () => {
    it('should return session when user has required role', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = utils.requireRole('admin');

      expect(result).toBe(mockSession);
    });

    it('should return session when user has any of the required roles', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = utils.requireRole('manager', 'admin');

      expect(result).toBe(mockSession);
    });

    it('should throw UNAUTHORIZED when not authenticated', () => {
      const utils = new AuthUtils(null, mockAuth);

      expect(() => utils.requireRole('admin')).toThrow(ORPCError);
      expect(() => utils.requireRole('admin')).toThrow('Authentication required');
    });

    it('should throw FORBIDDEN when user has no role', () => {
      const sessionWithoutRole = { ...mockSession, user: { ...mockSession.user, role: null } };
      const utils = new AuthUtils(sessionWithoutRole, mockAuth);

      expect(() => utils.requireRole('admin')).toThrow(ORPCError);
      expect(() => utils.requireRole('admin')).toThrow('No role assigned to user');
    });

    it('should throw FORBIDDEN when user lacks required role', () => {
      const sessionWithUserRole = { ...mockSession, user: { ...mockSession.user, role: 'user' } };
      const utils = new AuthUtils(sessionWithUserRole, mockAuth);

      expect(() => utils.requireRole('admin')).toThrow(ORPCError);
      expect(() => utils.requireRole('admin')).toThrow('Access denied');
    });
  });

  describe('requireAllRoles', () => {
    it('should return session when user has all required roles', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = utils.requireAllRoles('admin');

      expect(result).toBe(mockSession);
    });

    it('should throw FORBIDDEN when user lacks one of the required roles', () => {
      const sessionWithUserRole = { ...mockSession, user: { ...mockSession.user, role: 'user' } };
      const utils = new AuthUtils(sessionWithUserRole, mockAuth);

      expect(() => utils.requireAllRoles('user', 'admin')).toThrow(ORPCError);
      expect(() => utils.requireAllRoles('user', 'admin')).toThrow('Access denied');
    });
  });

  describe('requirePermissions', () => {
    it('should return session when user has required permissions', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.requirePermissions({ project: ['read'] });

      expect(result).toBe(mockSession);
      expect(mockAuth.api.userHasPermission).toHaveBeenCalledWith({
        body: {
          userId: 'user-123',
          permissions: { project: ['read'] },
        },
      });
    });

    it('should throw FORBIDDEN when user lacks required permissions', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: false });
      const utils = new AuthUtils(mockSession, mockAuth);

      await expect(utils.requirePermissions({ project: ['delete'] })).rejects.toThrow(ORPCError);
      await expect(utils.requirePermissions({ project: ['delete'] })).rejects.toThrow('Access denied');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const utils = new AuthUtils(null, mockAuth);

      await expect(utils.requirePermissions({ project: ['read'] })).rejects.toThrow(ORPCError);
      await expect(utils.requirePermissions({ project: ['read'] })).rejects.toThrow('Authentication required');
    });
  });

  describe('access', () => {
    it('should return true when user has required roles', async () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.access({ roles: ['admin'] });

      expect(result).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      const utils = new AuthUtils(null, mockAuth);

      const result = await utils.access({ roles: ['admin'] });

      expect(result).toBe(false);
    });

    it('should return true when user has any of the required roles', async () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.access({ roles: ['manager', 'admin'] });

      expect(result).toBe(true);
    });

    it('should return false when user lacks required roles', async () => {
      const sessionWithUserRole = { ...mockSession, user: { ...mockSession.user, role: 'user' } };
      const utils = new AuthUtils(sessionWithUserRole, mockAuth);

      const result = await utils.access({ roles: ['admin'] });

      expect(result).toBe(false);
    });

    it('should return true when user has all required roles', async () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.access({ allRoles: ['admin'] });

      expect(result).toBe(true);
    });

    it('should return false when user lacks one of all required roles', async () => {
      const sessionWithUserRole = { ...mockSession, user: { ...mockSession.user, role: 'user' } };
      const utils = new AuthUtils(sessionWithUserRole, mockAuth);

      const result = await utils.access({ allRoles: ['user', 'admin'] });

      expect(result).toBe(false);
    });

    it('should return true when user has required permissions', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.access({ permissions: { project: ['read'] } });

      expect(result).toBe(true);
    });

    it('should return false when user lacks required permissions', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: false });
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.access({ permissions: { project: ['delete'] } });

      expect(result).toBe(false);
    });

    it('should check both roles and permissions', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.access({
        roles: ['admin'],
        permissions: { project: ['read'] },
      });

      expect(result).toBe(true);
    });
  });

  describe('getRoles', () => {
    it('should return array of roles when user has role', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const roles = utils.getRoles();

      expect(roles).toContain('admin');
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should return empty array when user has no role', () => {
      const sessionWithoutRole = { ...mockSession, user: { ...mockSession.user, role: null } };
      const utils = new AuthUtils(sessionWithoutRole, mockAuth);

      const roles = utils.getRoles();

      expect(roles).toEqual([]);
    });

    it('should return empty array when not authenticated', () => {
      const utils = new AuthUtils(null, mockAuth);

      const roles = utils.getRoles();

      expect(roles).toEqual([]);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', () => {
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = utils.hasRole('admin');

      expect(result).toBe(true);
    });

    it('should return false when user lacks role', () => {
      const sessionWithUserRole = { ...mockSession, user: { ...mockSession.user, role: 'user' } };
      const utils = new AuthUtils(sessionWithUserRole, mockAuth);

      const result = utils.hasRole('admin');

      expect(result).toBe(false);
    });

    it('should return false when not authenticated', () => {
      const utils = new AuthUtils(null, mockAuth);

      const result = utils.hasRole('admin');

      expect(result).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.hasPermission({ project: ['read'] });

      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      mockAuth.api.userHasPermission.mockResolvedValue({ success: false });
      const utils = new AuthUtils(mockSession, mockAuth);

      const result = await utils.hasPermission({ project: ['delete'] });

      expect(result).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      const utils = new AuthUtils(null, mockAuth);

      const result = await utils.hasPermission({ project: ['read'] });

      expect(result).toBe(false);
    });
  });
});

describe('AuthUtilsEmpty', () => {
  let utils: AuthUtilsEmpty;

  beforeEach(() => {
    utils = new AuthUtilsEmpty();
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

  it('should throw UNAUTHORIZED on requireRole', () => {
    expect(() => utils.requireRole('admin')).toThrow(ORPCError);
  });

  it('should throw UNAUTHORIZED on requireAllRoles', () => {
    expect(() => utils.requireAllRoles('admin')).toThrow(ORPCError);
  });

  it('should throw UNAUTHORIZED on requirePermissions', () => {
    // requirePermissions throws synchronously in AuthUtilsEmpty (not returning a rejected promise)
    expect(() => utils.requirePermissions({ project: ['read'] })).toThrow(ORPCError);
  });

  it('should return false on access', async () => {
    const result = await utils.access({ roles: ['admin'] });
    expect(result).toBe(false);
  });

  it('should return empty array on getRoles', () => {
    const roles = utils.getRoles();
    expect(roles).toEqual([]);
  });

  it('should return false on hasRole', () => {
    const result = utils.hasRole('admin');
    expect(result).toBe(false);
  });

  it('should return false on hasPermission', async () => {
    const result = await utils.hasPermission({ project: ['read'] });
    expect(result).toBe(false);
  });
});
