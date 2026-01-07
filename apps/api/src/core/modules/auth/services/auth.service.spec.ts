import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import type { AuthCoreService } from './auth-core.service';
import type { UserSession } from '../utils/auth-utils';

// Mock the plugin-wrapper-factory module
vi.mock('../plugin-utils/plugin-wrapper-factory', () => ({
  createPluginRegistry: vi.fn(() => ({
    getAll: vi.fn(() => ({
      admin: { listUsers: vi.fn(), createUser: vi.fn() },
      organization: { createOrganization: vi.fn() },
    })),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: any;
  let mockSession: UserSession;
  let mockAuthCoreService: any;
  let mockRequest: any;

  beforeEach(() => {
    mockAuth = {
      api: {
        signUp: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
      },
      handler: vi.fn(),
      generateOpenAPISchema: vi.fn(() => Promise.resolve({ openapi: '3.0.0', info: {} })),
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

    // Mock AuthCoreService methods and getters
    mockAuthCoreService = {
      // Synchronous getters (directly return values, not Promises)
      get api() { return mockAuth.api; },
      get instance() { return mockAuth; },
      // Async methods
      getAuthInstance: vi.fn(() => Promise.resolve(mockAuth)),
      getPluginRegistry: vi.fn(),
      getRegistry: vi.fn(),
      plugin: vi.fn(),
      getAuthUtils: vi.fn(),
      getAuthOrpcMiddleware: vi.fn(),
      getSession: vi.fn(() => Promise.resolve(mockSession)),
      generateAuthOpenAPISchema: vi.fn(() => Promise.resolve({ openapi: '3.0.0', info: {} })),
      // Methods delegated from AuthService
      createOrpcAuthMiddleware: vi.fn(() => ({ use: vi.fn() })),
      createEmptyAuthUtils: vi.fn(() => ({ isLoggedIn: false, session: null, user: null })),
      requireAuth: vi.fn((session: any) => {
        if (!session) {
          throw new Error('Authentication required');
        }
        return session;
      }),
    };

    // Mock Request object
    mockRequest = {
      headers: new Headers({ 'user-agent': 'test-agent' }),
    };

    // Direct instantiation - bypass NestJS DI for REQUEST-scoped service
    service = new AuthService(
      mockAuthCoreService as AuthCoreService,
      mockRequest
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('api getter', () => {
    it('should return auth api instance', () => {
      const api = service.api;
      
      expect(api).toBe(mockAuth.api);
    });
  });

  describe('instance getter', () => {
    it('should return complete auth instance', () => {
      const instance = service.instance;
      
      expect(instance).toBe(mockAuth);
    });
  });

  describe('createOrpcAuthMiddleware', () => {
    it('should create ORPC auth middleware', () => {
      const middleware = service.createOrpcAuthMiddleware();
      
      expect(mockAuthCoreService.createOrpcAuthMiddleware).toHaveBeenCalled();
      expect(middleware).toHaveProperty('use');
    });
  });

  describe('createEmptyAuthUtils', () => {
    it('should create empty auth utils', () => {
      const result = service.createEmptyAuthUtils();
      
      expect(mockAuthCoreService.createEmptyAuthUtils).toHaveBeenCalled();
      expect(result).toEqual({
        isLoggedIn: false,
        session: null,
        user: null,
      });
    });
  });

  describe('requireAuth', () => {
    it('should return session when authenticated', () => {
      const result = service.requireAuth(mockSession);
      
      expect(mockAuthCoreService.requireAuth).toHaveBeenCalledWith(mockSession);
      expect(result).toBe(mockSession);
    });

    it('should throw when session is null', () => {
      expect(() => service.requireAuth(null)).toThrow('Authentication required');
      expect(mockAuthCoreService.requireAuth).toHaveBeenCalledWith(null);
    });
  });
});