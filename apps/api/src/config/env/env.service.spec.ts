import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { EnvService } from './env.service';

describe('EnvService', () => {
  let envService: EnvService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Reset env for clean tests
    process.env = {
      NODE_ENV: 'test',
      DEV_AUTH_KEY: 'test-dev-key',
      BETTER_AUTH_SECRET: 'test-auth-secret',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      TRUSTED_ORIGINS: 'http://example.com, http://test.com',
      AUTH_BASE_DOMAIN: 'localhost',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
      AUTH_SECRET: 'test-auth-secret',
      API_PORT: '3001',
    };
    
    envService = new EnvService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('get() method', () => {
    it('should have a get() method', () => {
      expect(typeof envService.get).toBe('function');
    });

    it('should retrieve environment variables via get()', () => {
      expect(envService.get('NODE_ENV')).toBe('test');
      expect(envService.get('BETTER_AUTH_SECRET')).toBe('test-auth-secret');
      expect(envService.get('DATABASE_URL')).toBe('postgresql://test:test@localhost:5432/testdb');
    });

    it('should return undefined for missing variables', () => {
    // @ts-expect-error - Testing missing variable
      expect(envService.get('NON_EXISTENT_VAR')).toBeUndefined();
    });

    it('should work with optional variables', () => {
      expect(envService.get('DEV_AUTH_KEY')).toBe('test-dev-key');
    });
  });

  describe('setSchema() method', () => {
    it('should have a setSchema() method', () => {
      expect(typeof envService.use).toBe('function');
    });

    it('should allow setting a new schema', () => {
      const newSchema = z.object({
        CUSTOM_VAR: z.string(),
      });
      
      process.env.CUSTOM_VAR = 'custom-value';
      
      expect(() => {
        envService.use(newSchema);
      }).not.toThrow();
    });

    it('should work with valid schema', () => {
      const validSchema = z.object({
        NODE_ENV: z.string(),
        DATABASE_URL: z.string(),
      });
      
      expect(() => {
        envService.use(validSchema);
      }).not.toThrow();
      
      expect(envService.get('NODE_ENV')).toBe('test');
      expect(envService.get('DATABASE_URL')).toBe('postgresql://test:test@localhost:5432/testdb');
    });
  });

  describe('Schema integration', () => {
    it('should work with defined schema', () => {
      const service = new EnvService();
      
      expect(service.get('NODE_ENV')).toBe('test');
      expect(service.get('BETTER_AUTH_SECRET')).toBe('test-auth-secret');
    });

    it('should support optional schema fields', () => {
      const service = new EnvService();
      
      expect(service.get('DEV_AUTH_KEY')).toBe('test-dev-key');
      expect(service.get('AUTH_BASE_DOMAIN')).toBe('localhost');
    });

    it('should return correct types', () => {
      const service = new EnvService();
      
      const nodeEnv = service.get('NODE_ENV');
      const port = service.get('API_PORT');
      
      expect(typeof nodeEnv).toBe('string');
      expect(typeof port).toBe('number');
    });
  });

  describe('Service instantiation', () => {
    it('should create new instance each time', () => {
      const service1 = new EnvService();
      const service2 = new EnvService();
      
      expect(service1).not.toBe(service2);
    });

    it('should reflect environment changes in new instances', () => {
      const service1 = new EnvService();
      expect(service1.get('DEV_AUTH_KEY')).toBe('test-dev-key');
      
      process.env.DEV_AUTH_KEY = 'updated-key';
      const service2 = new EnvService();
      expect(service2.get('DEV_AUTH_KEY')).toBe('updated-key');
    });
  });
});
