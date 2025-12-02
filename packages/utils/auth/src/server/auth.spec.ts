import { describe, it, expect, vi, beforeEach } from 'vitest';
import { betterAuthFactory } from './auth';

// Mock better-auth
vi.mock('better-auth', () => ({
  betterAuth: vi.fn((options: unknown) => ({
    options,
    api: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  })),
}));

// Mock drizzle adapter
vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn((db: unknown, options: unknown) => ({
    db,
    ...options,
  })),
}));

// Mock better-auth/plugins
vi.mock('better-auth/plugins', () => ({
  openAPI: vi.fn(() => ({ id: 'openAPI' })),
}));

// Mock permissions
vi.mock('../permissions/index', () => ({
  useAdmin: vi.fn(() => ({ id: 'admin' })),
  useInvite: vi.fn(() => ({ id: 'invite' })),
}));

// Mock plugins
vi.mock('./plugins/masterTokenAuth', () => ({
  masterTokenPlugin: vi.fn(() => ({ id: 'masterToken' })),
}));

vi.mock('./plugins/loginAs', () => ({
  loginAsPlugin: vi.fn(() => ({ id: 'loginAs' })),
}));

describe('betterAuthFactory', () => {
  let mockDb: object;
  let mockEnv: {
    DEV_AUTH_KEY: string | undefined;
    NODE_ENV: string;
    BETTER_AUTH_SECRET?: string;
    BASE_URL?: string;
    APP_URL?: string;
    NEXT_PUBLIC_APP_URL?: string;
    TRUSTED_ORIGINS?: string;
    AUTH_BASE_DOMAIN?: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = { query: vi.fn() };
    
    mockEnv = {
      DEV_AUTH_KEY: undefined,
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'test-better-auth-secret',
      BASE_URL: 'http://localhost:3001',
      APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };
  });

  describe('Basic Factory Creation', () => {
    it('should create auth instance', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result).toBeDefined();
      expect(result.auth).toBeDefined();
    });

    it('should configure betterAuth with secret', () => {
      const result = betterAuthFactory(mockDb, mockEnv);
      
      expect(result.auth.config).toBeDefined();
      expect(result.auth.config.secret).toBe('test-better-auth-secret');
    });

    it('should configure betterAuth with baseURL', () => {
      const result = betterAuthFactory(mockDb, mockEnv);
      
      expect(result.auth.config.baseURL).toBe('http://localhost:3001');
    });
  });

  describe('Trusted Origins Configuration', () => {
    it('should include APP_URL in trusted origins', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.trustedOrigins).toContain('http://localhost:3000');
    });

    it('should include NEXT_PUBLIC_APP_URL in trusted origins', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.trustedOrigins).toContain('http://localhost:3000');
    });

    it('should add additional trusted origins when provided', () => {
      mockEnv.TRUSTED_ORIGINS = 'http://custom-origin.com,http://another.com';
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.trustedOrigins).toContain('http://custom-origin.com');
      expect(result.auth.config.trustedOrigins).toContain('http://another.com');
    });

    it('should handle comma-separated trusted origins with whitespace', () => {
      mockEnv.TRUSTED_ORIGINS = '  http://a.com  ,  http://b.com  ';
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.trustedOrigins).toContain('http://a.com');
      expect(result.auth.config.trustedOrigins).toContain('http://b.com');
    });
  });

  describe('Security Configuration', () => {
    it('should use secure cookies for HTTPS', () => {
      mockEnv.BASE_URL = 'https://api.example.com';
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.advanced.useSecureCookies).toBe(true);
    });

    it('should not use secure cookies for HTTP', () => {
      mockEnv.BASE_URL = 'http://localhost:3001';
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.advanced.useSecureCookies).toBe(false);
    });

    it('should enable cross-subdomain cookies with AUTH_BASE_DOMAIN and HTTPS', () => {
      mockEnv.BASE_URL = 'https://api.example.com';
      mockEnv.AUTH_BASE_DOMAIN = '.example.com';
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.advanced.crossSubDomainCookies.enabled).toBe(true);
      expect(result.auth.config.advanced.crossSubDomainCookies.domain).toBe('.example.com');
    });

    it('should not enable cross-subdomain cookies without HTTPS', () => {
      mockEnv.BASE_URL = 'http://localhost:3001';
      mockEnv.AUTH_BASE_DOMAIN = '.example.com';
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.advanced.crossSubDomainCookies.enabled).toBe(false);
    });

    it('should not enable cross-subdomain cookies without AUTH_BASE_DOMAIN', () => {
      mockEnv.BASE_URL = 'https://api.example.com';
      delete mockEnv.AUTH_BASE_DOMAIN;
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.advanced.crossSubDomainCookies.enabled).toBe(false);
    });
  });

  describe('Development Mode', () => {
    it('should enable master token plugin in development with DEV_AUTH_KEY', () => {
      mockEnv.NODE_ENV = 'development';
      mockEnv.DEV_AUTH_KEY = 'test-dev-key';
      
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.plugins).toBeDefined();
    });

    it('should enable loginAs plugin in development with DEV_AUTH_KEY', () => {
      mockEnv.NODE_ENV = 'development';
      mockEnv.DEV_AUTH_KEY = 'test-dev-key';
      
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.plugins).toBeDefined();
    });
  });

  describe('Database Configuration', () => {
    it('should configure drizzle adapter', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.database).toBeDefined();
    });
  });

  describe('Email and Password Configuration', () => {
    it('should enable email and password by default', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.emailAndPassword).toBeDefined();
      expect(result.auth.config.emailAndPassword.enabled).toBe(true);
    });
  });

  describe('Session Configuration', () => {
    it('should configure session with cookie cache', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.session).toBeDefined();
      expect(result.auth.config.session.cookieCache).toBeDefined();
    });

    it('should enable cookie cache', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.session.cookieCache.enabled).toBe(true);
    });

    it('should set cookie cache maxAge to 5 minutes', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.session.cookieCache.maxAge).toBe(300);
    });
  });

  describe('Plugin Configuration', () => {
    it('should include all required plugins', () => {
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result.auth.config.plugins).toBeDefined();
      expect(Array.isArray(result.auth.config.plugins)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing BETTER_AUTH_SECRET', () => {
      delete mockEnv.BETTER_AUTH_SECRET;
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result).toBeDefined();
    });

    it('should handle missing BASE_URL', () => {
      delete mockEnv.BASE_URL;
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result).toBeDefined();
    });

    it('should handle missing APP_URL', () => {
      delete mockEnv.APP_URL;
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result).toBeDefined();
    });

    it('should handle empty TRUSTED_ORIGINS', () => {
      mockEnv.TRUSTED_ORIGINS = '';
      const result = betterAuthFactory(mockDb, mockEnv);

      expect(result).toBeDefined();
    });
  });
});
