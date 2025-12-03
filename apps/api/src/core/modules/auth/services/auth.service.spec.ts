import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { MODULE_OPTIONS_TOKEN } from '../definitions/auth-module-definition';
import type { UserSession } from '../utils/auth-utils';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: any;
  let mockSession: UserSession;

  beforeEach(async () => {
    mockAuth = {
      api: {
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        userHasPermission: vi.fn(),
      },
      handler: vi.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: {
            auth: mockAuth,
            disableTrustedOriginsCors: false,
            disableBodyParser: false,
            disableGlobalAuthGuard: false,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('api getter', () => {
    it('should return auth api instance', () => {
      const api = service.api;
      
      expect(api).toBe(mockAuth.api);
      expect(api).toHaveProperty('signUp');
      expect(api).toHaveProperty('signIn');
      expect(api).toHaveProperty('signOut');
      expect(api).toHaveProperty('getSession');
    });
  });

  describe('instance getter', () => {
    it('should return complete auth instance', () => {
      const instance = service.instance;
      
      expect(instance).toBe(mockAuth);
      expect(instance).toHaveProperty('api');
      expect(instance).toHaveProperty('handler');
    });
  });

  describe('createOrpcAuthMiddleware', () => {
    it('should create ORPC auth middleware', () => {
      const middleware = service.createOrpcAuthMiddleware();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createEmptyAuthUtils', () => {
    it('should create empty auth utils', () => {
      const emptyUtils = service.createEmptyAuthUtils();
      
      expect(emptyUtils).toBeDefined();
      expect(emptyUtils.isLoggedIn).toBe(false);
      expect(emptyUtils.session).toBeNull();
      expect(emptyUtils.user).toBeNull();
    });
  });

  describe('Auth utility methods', () => {
    describe('hasAccess', () => {
      it('should return true when user has access', async () => {
        const result = await service.hasAccess(mockSession, { roles: ['admin'] });
        
        expect(result).toBe(true);
      });

      it('should return false when user lacks access', async () => {
        const sessionWithUserRole = {
          ...mockSession,
          user: { ...mockSession.user, role: 'user' },
        };
        
        const result = await service.hasAccess(sessionWithUserRole, { roles: ['admin'] });
        
        expect(result).toBe(false);
      });

      it('should return false when session is null', async () => {
        const result = await service.hasAccess(null, { roles: ['admin'] });
        
        expect(result).toBe(false);
      });
    });

    describe('hasRole', () => {
      it('should return true when user has role', () => {
        const result = service.hasRole(mockSession, 'admin');
        
        expect(result).toBe(true);
      });

      it('should return false when user lacks role', () => {
        const sessionWithUserRole = {
          ...mockSession,
          user: { ...mockSession.user, role: 'user' },
        };
        
        const result = service.hasRole(sessionWithUserRole, 'admin');
        
        expect(result).toBe(false);
      });

      it('should return false when session is null', () => {
        const result = service.hasRole(null, 'admin');
        
        expect(result).toBe(false);
      });
    });

    describe('hasPermission', () => {
      it('should return true when user has permission', async () => {
        mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
        
        const result = await service.hasPermission(mockSession, { project: ['read'] });
        
        expect(result).toBe(true);
      });

      it('should return false when user lacks permission', async () => {
        mockAuth.api.userHasPermission.mockResolvedValue({ success: false });
        
        const result = await service.hasPermission(mockSession, { project: ['delete'] });
        
        expect(result).toBe(false);
      });

      it('should return false when session is null', async () => {
        const result = await service.hasPermission(null, { project: ['read'] });
        
        expect(result).toBe(false);
      });
    });

    describe('getRoles', () => {
      it('should return array of roles', () => {
        const roles = service.getRoles(mockSession);
        
        expect(Array.isArray(roles)).toBe(true);
        expect(roles).toContain('admin');
      });

      it('should return empty array when session is null', () => {
        const roles = service.getRoles(null);
        
        expect(roles).toEqual([]);
      });
    });

    describe('requireAuth', () => {
      it('should return session when authenticated', () => {
        const result = service.requireAuth(mockSession);
        
        expect(result).toBe(mockSession);
      });

      it('should throw when session is null', () => {
        expect(() => service.requireAuth(null)).toThrow();
      });
    });

    describe('requireRole', () => {
      it('should return session when user has role', () => {
        const result = service.requireRole(mockSession, 'admin');
        
        expect(result).toBe(mockSession);
      });

      it('should throw when user lacks role', () => {
        const sessionWithUserRole = {
          ...mockSession,
          user: { ...mockSession.user, role: 'user' },
        };
        
        expect(() => service.requireRole(sessionWithUserRole, 'admin')).toThrow();
      });
    });

    describe('requireAllRoles', () => {
      it('should return session when user has all roles', () => {
        const result = service.requireAllRoles(mockSession, 'admin');
        
        expect(result).toBe(mockSession);
      });

      it('should throw when user lacks one role', () => {
        const sessionWithUserRole = {
          ...mockSession,
          user: { ...mockSession.user, role: 'user' },
        };
        
        expect(() => service.requireAllRoles(sessionWithUserRole, 'user', 'admin')).toThrow();
      });
    });

    describe('requirePermissions', () => {
      it('should return session when user has permissions', async () => {
        mockAuth.api.userHasPermission.mockResolvedValue({ success: true });
        
        const result = await service.requirePermissions(mockSession, { project: ['read'] });
        
        expect(result).toBe(mockSession);
      });

      it('should throw when user lacks permissions', async () => {
        mockAuth.api.userHasPermission.mockResolvedValue({ success: false });
        
        await expect(
          service.requirePermissions(mockSession, { project: ['delete'] })
        ).rejects.toThrow();
      });
    });
  });
});