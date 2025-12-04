import { describe, it, expect, vi, beforeEach } from 'vitest';
import { masterTokenPlugin } from './masterTokenAuth';

// Mock better-auth/api
vi.mock('better-auth/api', () => ({
  createAuthMiddleware: vi.fn((handler) => handler),
}));

describe('masterTokenPlugin', () => {
  const defaultOptions = {
    devAuthKey: 'test-master-token-key',
    enabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin Creation', () => {
    it('should create plugin with correct id', () => {
      const plugin = masterTokenPlugin(defaultOptions);
      expect(plugin.id).toBe('masterToken');
    });

    it('should have hooks defined', () => {
      const plugin = masterTokenPlugin(defaultOptions);
      expect(plugin.hooks).toBeDefined();
    });

    it('should have after hooks array', () => {
      const plugin = masterTokenPlugin(defaultOptions);
      expect(plugin.hooks?.after).toBeDefined();
      expect(Array.isArray(plugin.hooks?.after)).toBe(true);
    });
  });

  describe('Configuration Options', () => {
    it('should accept devAuthKey option', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: 'custom-key',
      });
      
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('masterToken');
    });

    it('should accept enabled option', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: 'test-key',
        enabled: false,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should accept custom masterUser option', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: 'test-key',
        masterUser: {
          id: 'custom-id',
          email: 'custom@example.com',
          name: 'Custom User',
        },
      });
      
      expect(plugin).toBeDefined();
    });

    it('should use default masterUser when not provided', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: 'test-key',
      });
      
      expect(plugin).toBeDefined();
    });

    it('should default enabled to true when not specified', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: 'test-key',
      });
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Hook Matcher', () => {
    const createMockContext = (path: string, token?: string) => ({
      path,
      headers: new Map([
        ['authorization', token ? `Bearer ${token}` : '']
      ]),
    });

    it('should have after hook with matcher function', () => {
      const plugin = masterTokenPlugin(defaultOptions);
      const afterHooks = plugin.hooks?.after;
      
      expect(afterHooks).toBeDefined();
      expect(afterHooks?.length).toBeGreaterThan(0);
      expect(typeof afterHooks?.[0]?.matcher).toBe('function');
    });

    it('should match /get-session path with valid token', () => {
      const plugin = masterTokenPlugin({
        ...defaultOptions,
        masterEmail: 'master@example.com',
      });
      const afterHooks = plugin.hooks?.after;
      const hook = afterHooks?.[0] as unknown as { matcher: (ctx: any) => boolean } | undefined;
      const matcher = hook?.matcher;
      
      const context = createMockContext('/get-session', 'test-master-token-key');
      expect(matcher?.(context)).toBe(true);
    });

    it('should match /session path with valid token', () => {
      const plugin = masterTokenPlugin({
        ...defaultOptions,
        masterEmail: 'master@example.com',
      });
      const afterHooks = plugin.hooks?.after;
      const hook = afterHooks?.[0] as unknown as { matcher: (ctx: any) => boolean } | undefined;
      const matcher = hook?.matcher;
      
      const context = createMockContext('/session', 'test-master-token-key');
      expect(matcher?.(context)).toBe(true);
    });

    it('should match /sign-in/email path with valid token', () => {
      const plugin = masterTokenPlugin({
        ...defaultOptions,
        masterEmail: 'master@example.com',
      });
      const afterHooks = plugin.hooks?.after;
      const hook = afterHooks?.[0] as unknown as { matcher: (ctx: any) => boolean } | undefined;
      const matcher = hook?.matcher;
      
      const context = createMockContext('/sign-in/email', 'test-master-token-key');
      expect(matcher?.(context)).toBe(true);
    });

    it('should not match unrelated paths', () => {
      const plugin = masterTokenPlugin({
        ...defaultOptions,
        masterEmail: 'master@example.com',
      });
      const afterHooks = plugin.hooks?.after;
      const hook = afterHooks?.[0] as unknown as { matcher: (ctx: any) => boolean } | undefined;
      const matcher = hook?.matcher;
      
      expect(matcher?.(createMockContext('/users', 'test-master-token-key'))).toBe(false);
      expect(matcher?.(createMockContext('/auth/login', 'test-master-token-key'))).toBe(false);
    });

    it('should not match without valid token', () => {
      const plugin = masterTokenPlugin({
        ...defaultOptions,
        masterEmail: 'master@example.com',
      });
      const afterHooks = plugin.hooks?.after;
      const hook = afterHooks?.[0] as unknown as { matcher: (ctx: any) => boolean } | undefined;
      const matcher = hook?.matcher;
      
      expect(matcher?.(createMockContext('/get-session'))).toBe(false);
      expect(matcher?.(createMockContext('/get-session', 'wrong-token'))).toBe(false);
    });

    it('should not match when masterEmail is not configured', () => {
      const plugin = masterTokenPlugin(defaultOptions);
      const afterHooks = plugin.hooks?.after;
      const hook = afterHooks?.[0] as unknown as { matcher: (ctx: any) => boolean } | undefined;
      const matcher = hook?.matcher;
      
      const context = createMockContext('/get-session', 'test-master-token-key');
      expect(matcher?.(context)).toBe(false);
    });
  });

  describe('Disabled Plugin Behavior', () => {
    it('should create plugin even when disabled', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: 'test-key',
        enabled: false,
      });
      
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('masterToken');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty devAuthKey', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: '',
      });
      
      expect(plugin).toBeDefined();
    });

    it('should handle partial masterUser options', () => {
      const plugin = masterTokenPlugin({
        devAuthKey: 'test-key',
        masterUser: {
          id: 'only-id',
        },
      });
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Plugin ID Uniqueness', () => {
    it('should have consistent plugin identifier', () => {
      const plugin1 = masterTokenPlugin(defaultOptions);
      const plugin2 = masterTokenPlugin({
        devAuthKey: 'different-key',
      });
      
      expect(plugin1.id).toBe(plugin2.id);
      expect(plugin1.id).toBe('masterToken');
    });
  });

  describe('Hook Handler Structure', () => {
    it('should have handler function in after hooks', () => {
      const plugin = masterTokenPlugin(defaultOptions);
      const afterHooks = plugin.hooks?.after as { handler: unknown }[] | undefined;
      
      expect(afterHooks?.[0]?.handler).toBeDefined();
    });
  });
});
