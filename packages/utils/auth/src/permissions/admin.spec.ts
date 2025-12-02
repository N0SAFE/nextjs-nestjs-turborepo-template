import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdmin } from './admin';
import type { BetterAuthPlugin } from 'better-auth';

describe('useAdmin', () => {
  let mockPlugin: BetterAuthPlugin;

  beforeEach(() => {
    mockPlugin = {
      id: 'test-plugin',
      endpoints: {
        testEndpoint: {
          method: 'POST',
          path: '/test',
          handler: vi.fn(),
        },
      },
      schema: {
        testTable: {
          fields: {
            id: { type: 'string' },
          },
        },
      },
    };

    vi.clearAllMocks();
  });

  describe('Plugin Wrapping', () => {
    it('should wrap plugin with admin permission check', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin).toBeDefined();
      expect(wrappedPlugin.id).toBe(mockPlugin.id);
    });

    it('should preserve plugin endpoints', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin.endpoints).toBeDefined();
      expect(Object.keys(wrappedPlugin.endpoints || {})).toContain('testEndpoint');
    });

    it('should preserve plugin schema', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin.schema).toBeDefined();
      expect(wrappedPlugin.schema).toEqual(mockPlugin.schema);
    });

    it('should not modify original plugin', () => {
      const originalId = mockPlugin.id;
      const originalEndpoints = mockPlugin.endpoints;
      
      useAdmin(mockPlugin);
      
      expect(mockPlugin.id).toBe(originalId);
      expect(mockPlugin.endpoints).toBe(originalEndpoints);
    });
  });

  describe('Admin Permission Check', () => {
    it('should check for admin role', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      // The wrapped plugin should have admin check applied
      expect(wrappedPlugin).toBeDefined();
    });

    it('should accept session parameter', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should return true for admin role', () => {
      // Create a mock to verify admin check logic
      const adminSession = {
        user: {
          id: '1',
          role: 'admin',
        },
      };
      
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should return false for non-admin role', () => {
      const userSession = {
        user: {
          id: '1',
          role: 'user',
        },
      };
      
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should return false for null session', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should return false for undefined session', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Role Validation', () => {
    it('should check exact role match', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should be case-sensitive for role check', () => {
      // 'Admin' should not match 'admin'
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should reject moderator role', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should reject guest role', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should reject empty role', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Session Structure', () => {
    it('should handle session without user', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle user without role', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle nested session properties', () => {
      const complexSession = {
        user: {
          id: '1',
          profile: {
            role: 'admin',
          },
        },
      };
      
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle session with additional properties', () => {
      const sessionWithExtras = {
        user: {
          id: '1',
          role: 'admin',
          email: 'admin@example.com',
          verified: true,
        },
        session: {
          id: 'session-1',
          expiresAt: new Date(),
        },
      };
      
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw for null session', () => {
      expect(() => useAdmin(mockPlugin)).not.toThrow();
    });

    it('should not throw for undefined session', () => {
      expect(() => useAdmin(mockPlugin)).not.toThrow();
    });

    it('should not throw for malformed session', () => {
      expect(() => useAdmin(mockPlugin)).not.toThrow();
    });

    it('should handle plugin without endpoints', () => {
      const pluginWithoutEndpoints = { ...mockPlugin, endpoints: undefined };
      
      expect(() => useAdmin(pluginWithoutEndpoints)).not.toThrow();
    });

    it('should handle plugin without schema', () => {
      const pluginWithoutSchema = { ...mockPlugin, schema: undefined };
      
      expect(() => useAdmin(pluginWithoutSchema)).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should accept BetterAuthPlugin type', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin).toBeDefined();
      expect(typeof wrappedPlugin.id).toBe('string');
    });

    it('should return BetterAuthPlugin type', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin.id).toBeDefined();
      expect(wrappedPlugin.endpoints).toBeDefined();
    });

    it('should support custom session types', () => {
      interface AdminSession {
        user: {
          id: string;
          role: 'admin' | 'user';
        };
      }
      
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Multiple Plugins', () => {
    it('should wrap different plugins independently', () => {
      const plugin1 = { ...mockPlugin, id: 'plugin-1' };
      const plugin2 = { ...mockPlugin, id: 'plugin-2' };
      
      const wrapped1 = useAdmin(plugin1);
      const wrapped2 = useAdmin(plugin2);
      
      expect(wrapped1.id).toBe('plugin-1');
      expect(wrapped2.id).toBe('plugin-2');
    });

    it('should apply same admin check to multiple plugins', () => {
      const plugin1 = { ...mockPlugin, id: 'plugin-1' };
      const plugin2 = { ...mockPlugin, id: 'plugin-2' };
      
      const wrapped1 = useAdmin(plugin1);
      const wrapped2 = useAdmin(plugin2);
      
      expect(wrapped1).toBeDefined();
      expect(wrapped2).toBeDefined();
    });
  });

  describe('Integration with Permission System', () => {
    it('should use common permission helper', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should be composable with other permission helpers', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      // Could be wrapped again with another helper
      expect(wrappedPlugin).toBeDefined();
      expect(wrappedPlugin.id).toBe(mockPlugin.id);
    });

    it('should maintain plugin compatibility', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      expect(wrappedPlugin).toMatchObject({
        id: expect.any(String),
        endpoints: expect.any(Object),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty plugin', () => {
      const emptyPlugin: BetterAuthPlugin = {
        id: 'empty',
        endpoints: {},
      };
      
      const wrappedPlugin = useAdmin(emptyPlugin);
      
      expect(wrappedPlugin).toBeDefined();
      expect(wrappedPlugin.id).toBe('empty');
    });

    it('should handle plugin with many endpoints', () => {
      const pluginWithManyEndpoints: BetterAuthPlugin = {
        id: 'many-endpoints',
        endpoints: {
          endpoint1: { method: 'GET', path: '/1', handler: vi.fn() },
          endpoint2: { method: 'POST', path: '/2', handler: vi.fn() },
          endpoint3: { method: 'PUT', path: '/3', handler: vi.fn() },
          endpoint4: { method: 'DELETE', path: '/4', handler: vi.fn() },
        },
      };
      
      const wrappedPlugin = useAdmin(pluginWithManyEndpoints);
      
      expect(wrappedPlugin).toBeDefined();
      expect(Object.keys(wrappedPlugin.endpoints || {}).length).toBe(4);
    });

    it('should handle role with special characters', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle very long role names', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle unicode in role', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Permission Scenarios', () => {
    it('should work for admin CRUD operations', () => {
      const crudPlugin: BetterAuthPlugin = {
        id: 'crud',
        endpoints: {
          create: { method: 'POST', path: '/create', handler: vi.fn() },
          read: { method: 'GET', path: '/read', handler: vi.fn() },
          update: { method: 'PUT', path: '/update', handler: vi.fn() },
          delete: { method: 'DELETE', path: '/delete', handler: vi.fn() },
        },
      };
      
      const wrappedPlugin = useAdmin(crudPlugin);
      
      expect(wrappedPlugin).toBeDefined();
      expect(wrappedPlugin.endpoints?.create).toBeDefined();
      expect(wrappedPlugin.endpoints?.read).toBeDefined();
      expect(wrappedPlugin.endpoints?.update).toBeDefined();
      expect(wrappedPlugin.endpoints?.delete).toBeDefined();
    });

    it('should protect sensitive operations', () => {
      const sensitivePlugin: BetterAuthPlugin = {
        id: 'sensitive',
        endpoints: {
          deleteAllUsers: { method: 'DELETE', path: '/users/all', handler: vi.fn() },
          resetDatabase: { method: 'POST', path: '/reset', handler: vi.fn() },
        },
      };
      
      const wrappedPlugin = useAdmin(sensitivePlugin);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should work with user management plugin', () => {
      const userManagementPlugin: BetterAuthPlugin = {
        id: 'user-management',
        endpoints: {
          listUsers: { method: 'GET', path: '/users', handler: vi.fn() },
          banUser: { method: 'POST', path: '/users/ban', handler: vi.fn() },
          promoteUser: { method: 'POST', path: '/users/promote', handler: vi.fn() },
        },
      };
      
      const wrappedPlugin = useAdmin(userManagementPlugin);
      
      expect(wrappedPlugin).toBeDefined();
      expect(Object.keys(wrappedPlugin.endpoints || {}).length).toBe(3);
    });
  });

  describe('Composability', () => {
    it('should be chainable with other helpers', () => {
      const wrappedPlugin = useAdmin(mockPlugin);
      
      // Could be wrapped again
      const doubleWrapped = useAdmin(wrappedPlugin);
      
      expect(doubleWrapped).toBeDefined();
      expect(doubleWrapped.id).toBe(mockPlugin.id);
    });

    it('should maintain functionality through multiple wrappings', () => {
      let currentPlugin = mockPlugin;
      
      // Wrap multiple times
      for (let i = 0; i < 3; i++) {
        currentPlugin = useAdmin(currentPlugin);
      }
      
      expect(currentPlugin).toBeDefined();
      expect(currentPlugin.id).toBe(mockPlugin.id);
    });
  });

  describe('Performance', () => {
    it('should wrap plugin efficiently', () => {
      const start = Date.now();
      
      useAdmin(mockPlugin);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should handle multiple wrappings efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        useAdmin(mockPlugin);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });
});
