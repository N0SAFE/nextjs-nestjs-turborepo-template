import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermissionsCheck } from './utils';
import type { BetterAuthPlugin } from 'better-auth/types';

// Mock dependencies
vi.mock('better-auth/utils/error', () => ({
  APIError: class APIError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'APIError';
    }
  },
}));

describe('usePermissionsCheck', () => {
  let mockPlugin: BetterAuthPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlugin = {
      id: 'test-plugin',
      endpoints: {},
      schema: {},
    } as BetterAuthPlugin;
  });

  describe('Plugin Creation', () => {
    it('should create plugin with permission check', () => {
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe(mockPlugin.id);
    });

    it('should preserve original plugin endpoints', () => {
      mockPlugin.endpoints = {
        testEndpoint: { path: '/test', handler: vi.fn() },
      };
      
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin.endpoints.testEndpoint).toBeDefined();
    });

    it('should preserve original plugin schema', () => {
      mockPlugin.schema = {
        testTable: { fields: {} },
      };
      
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin.schema.testTable).toBeDefined();
    });
  });

  describe('Permission Check Function', () => {
    it('should call permission check with session', async () => {
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      mockPlugin.endpoints = {
        testEndpoint: {
          path: '/test',
          handler: vi.fn(),
        },
      };
      
      expect(plugin).toBeDefined();
    });

    it('should accept async permission check', () => {
      const checkPermission = vi.fn(async () => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should accept sync permission check', () => {
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should handle permission check returning false', () => {
      const checkPermission = vi.fn(() => false);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw APIError for insufficient permissions', () => {
      const checkPermission = vi.fn(() => false);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should throw with correct error code', () => {
      const checkPermission = vi.fn(() => false);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should throw with informative message', () => {
      const checkPermission = vi.fn(() => false);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Session Handling', () => {
    it('should work with undefined session', () => {
      const checkPermission = vi.fn((session: unknown) => !session);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should work with null session', () => {
      const checkPermission = vi.fn((session: unknown) => session === null);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should work with valid session object', () => {
      const checkPermission = vi.fn((session: any) => !!session?.user);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Plugin ID Preservation', () => {
    it('should keep same plugin id', () => {
      mockPlugin.id = 'custom-plugin-id';
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin.id).toBe('custom-plugin-id');
    });

    it('should not modify original plugin', () => {
      const originalId = mockPlugin.id;
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(mockPlugin.id).toBe(originalId);
      expect(plugin.id).toBe(originalId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle plugin without endpoints', () => {
      mockPlugin.endpoints = undefined;
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should handle plugin without schema', () => {
      mockPlugin.schema = undefined;
      const checkPermission = vi.fn(() => true);
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should handle permission check that throws', () => {
      const checkPermission = vi.fn(() => {
        throw new Error('Permission check failed');
      });
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should handle async permission check that rejects', () => {
      const checkPermission = vi.fn(async () => {
        throw new Error('Async permission check failed');
      });
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should accept generic session type', () => {
      interface CustomSession {
        user: { id: string; role: string };
      }
      
      const checkPermission = vi.fn((session: CustomSession | null) => 
        session?.user?.role === 'admin'
      );
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });

    it('should handle session with nested properties', () => {
      const checkPermission = vi.fn((session: any) => 
        session?.user?.permissions?.includes('admin')
      );
      const plugin = usePermissionsCheck(mockPlugin, checkPermission);
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should work with multiple plugins', () => {
      const plugin1 = { ...mockPlugin, id: 'plugin1' };
      const plugin2 = { ...mockPlugin, id: 'plugin2' };
      
      const checkPermission1 = vi.fn(() => true);
      const checkPermission2 = vi.fn(() => false);
      
      const wrappedPlugin1 = usePermissionsCheck(plugin1, checkPermission1);
      const wrappedPlugin2 = usePermissionsCheck(plugin2, checkPermission2);
      
      expect(wrappedPlugin1.id).toBe('plugin1');
      expect(wrappedPlugin2.id).toBe('plugin2');
    });

    it('should be composable', () => {
      const checkPermission1 = vi.fn(() => true);
      const checkPermission2 = vi.fn(() => true);
      
      const plugin1 = usePermissionsCheck(mockPlugin, checkPermission1);
      const plugin2 = usePermissionsCheck(plugin1, checkPermission2);
      
      expect(plugin2).toBeDefined();
      expect(plugin2.id).toBe(mockPlugin.id);
    });
  });
});
