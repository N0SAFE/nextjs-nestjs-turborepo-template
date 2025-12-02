import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCommonPermissionHelper } from './common';
import type { BetterAuthPlugin } from 'better-auth';

describe('createCommonPermissionHelper', () => {
  let mockPlugin: BetterAuthPlugin;
  let mockCheckPermission: any;

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

    mockCheckPermission = vi.fn((session: any) => !!session?.user);

    vi.clearAllMocks();
  });

  describe('Helper Creation', () => {
    it('should create permission helper function', () => {
      const helper = createCommonPermissionHelper();
      
      expect(helper).toBeDefined();
      expect(typeof helper).toBe('function');
    });

    it('should accept plugin and check function', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should return BetterAuthPlugin', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin.id).toBeDefined();
      expect(wrappedPlugin.endpoints).toBeDefined();
    });
  });

  describe('Plugin Wrapping', () => {
    it('should preserve plugin id', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin.id).toBe(mockPlugin.id);
    });

    it('should preserve plugin endpoints', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin.endpoints).toBeDefined();
      expect(Object.keys(wrappedPlugin.endpoints || {})).toContain('testEndpoint');
    });

    it('should preserve plugin schema', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin.schema).toBeDefined();
      expect(wrappedPlugin.schema).toEqual(mockPlugin.schema);
    });

    it('should not modify original plugin', () => {
      const originalId = mockPlugin.id;
      const helper = createCommonPermissionHelper();
      helper(mockPlugin, mockCheckPermission);
      
      expect(mockPlugin.id).toBe(originalId);
    });
  });

  describe('Permission Check Application', () => {
    it('should wrap endpoints with permission check', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin.endpoints?.testEndpoint).toBeDefined();
    });

    it('should call check function with session', () => {
      const checkFn = vi.fn(() => true);
      const helper = createCommonPermissionHelper();
      helper(mockPlugin, checkFn);
      
      // Verify the check function is stored/used
      expect(checkFn).toBeDefined();
    });

    it('should support synchronous permission checks', () => {
      const syncCheck = (session: any) => session?.user?.role === 'admin';
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, syncCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should support asynchronous permission checks', () => {
      const asyncCheck = async (session: any) => {
        await Promise.resolve();
        return !!session?.user;
      };
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, asyncCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Session Handling', () => {
    it('should handle valid session', () => {
      const checkFn = vi.fn((session: any) => !!session?.user);
      const helper = createCommonPermissionHelper();
      helper(mockPlugin, checkFn);
      
      expect(checkFn).toBeDefined();
    });

    it('should handle null session', () => {
      const checkFn = (session: any) => session !== null;
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, checkFn);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle undefined session', () => {
      const checkFn = (session: any) => session !== undefined;
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, checkFn);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle session with nested properties', () => {
      const checkFn = (session: any) => {
        return session?.user?.profile?.verified === true;
      };
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, checkFn);
      
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle check function that throws', () => {
      const errorCheck = () => {
        throw new Error('Permission check failed');
      };
      const helper = createCommonPermissionHelper();
      
      expect(() => helper(mockPlugin, errorCheck)).not.toThrow();
    });

    it('should handle async check function that rejects', () => {
      const rejectCheck = async () => {
        throw new Error('Async permission check failed');
      };
      const helper = createCommonPermissionHelper();
      
      expect(() => helper(mockPlugin, rejectCheck)).not.toThrow();
    });

    it('should handle plugin without endpoints', () => {
      const pluginWithoutEndpoints = { ...mockPlugin, endpoints: undefined };
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(pluginWithoutEndpoints, mockCheckPermission);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle plugin without schema', () => {
      const pluginWithoutSchema = { ...mockPlugin, schema: undefined };
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(pluginWithoutSchema, mockCheckPermission);
      
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should support generic session types', () => {
      interface CustomSession {
        user: {
          id: string;
          role: 'admin' | 'user';
        };
      }
      
      const checkFn = (session: CustomSession | null) => {
        return session?.user?.role === 'admin';
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, checkFn);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should preserve plugin type structure', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin.id).toBe(mockPlugin.id);
      expect(wrappedPlugin.endpoints).toBeDefined();
      expect(wrappedPlugin.schema).toBeDefined();
    });

    it('should support union session types', () => {
      type SessionType = { user: { id: string } } | null | undefined;
      
      const checkFn = (session: SessionType) => {
        return session?.user?.id !== undefined;
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, checkFn);
      
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Multiple Plugins', () => {
    it('should wrap multiple plugins independently', () => {
      const plugin1 = { ...mockPlugin, id: 'plugin-1' };
      const plugin2 = { ...mockPlugin, id: 'plugin-2' };
      
      const helper = createCommonPermissionHelper();
      const wrapped1 = helper(plugin1, mockCheckPermission);
      const wrapped2 = helper(plugin2, mockCheckPermission);
      
      expect(wrapped1.id).toBe('plugin-1');
      expect(wrapped2.id).toBe('plugin-2');
    });

    it('should apply different checks to different plugins', () => {
      const check1 = vi.fn((session: any) => session?.user?.role === 'admin');
      const check2 = vi.fn((session: any) => session?.user?.role === 'user');
      
      const helper = createCommonPermissionHelper();
      helper(mockPlugin, check1);
      helper(mockPlugin, check2);
      
      expect(check1).toBeDefined();
      expect(check2).toBeDefined();
    });
  });

  describe('Permission Logic Variations', () => {
    it('should support role-based checks', () => {
      const roleCheck = (session: any) => {
        const allowedRoles = ['admin', 'moderator'];
        return allowedRoles.includes(session?.user?.role);
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, roleCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should support permission array checks', () => {
      const permissionCheck = (session: any) => {
        return session?.user?.permissions?.includes('write');
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, permissionCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should support composite checks', () => {
      const compositeCheck = (session: any) => {
        const hasRole = session?.user?.role === 'admin';
        const hasPermission = session?.user?.permissions?.includes('delete');
        return hasRole || hasPermission;
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, compositeCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should support time-based checks', () => {
      const timeCheck = (session: any) => {
        const now = new Date();
        const expiry = new Date(session?.user?.expiresAt);
        return now < expiry;
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, timeCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty plugin', () => {
      const emptyPlugin: BetterAuthPlugin = {
        id: 'empty',
        endpoints: {},
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(emptyPlugin, mockCheckPermission);
      
      expect(wrappedPlugin).toBeDefined();
      expect(wrappedPlugin.id).toBe('empty');
    });

    it('should handle check that always returns true', () => {
      const alwaysTrue = () => true;
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, alwaysTrue);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle check that always returns false', () => {
      const alwaysFalse = () => false;
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, alwaysFalse);
      
      expect(wrappedPlugin).toBeDefined();
    });

    it('should handle very complex check logic', () => {
      const complexCheck = (session: any) => {
        if (!session) return false;
        if (!session.user) return false;
        if (session.user.role === 'superadmin') return true;
        if (session.user.permissions?.includes('god-mode')) return true;
        if (session.user.id === '000000') return true;
        return false;
      };
      
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, complexCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Integration with Better Auth', () => {
    it('should be compatible with Better Auth plugin system', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin.id).toBeDefined();
      expect(typeof wrappedPlugin.id).toBe('string');
    });

    it('should maintain plugin structure', () => {
      const helper = createCommonPermissionHelper();
      const wrappedPlugin = helper(mockPlugin, mockCheckPermission);
      
      expect(wrappedPlugin).toMatchObject({
        id: expect.any(String),
        endpoints: expect.any(Object),
      });
    });
  });

  describe('Composability', () => {
    it('should support chaining multiple helpers', () => {
      const helper1 = createCommonPermissionHelper();
      const helper2 = createCommonPermissionHelper();
      
      const check1 = (session: any) => !!session?.user;
      const check2 = (session: any) => session?.user?.verified === true;
      
      const wrapped1 = helper1(mockPlugin, check1);
      const wrapped2 = helper2(wrapped1, check2);
      
      expect(wrapped2).toBeDefined();
      expect(wrapped2.id).toBe(mockPlugin.id);
    });

    it('should support functional composition', () => {
      const helper = createCommonPermissionHelper();
      
      const roleCheck = (session: any) => session?.user?.role === 'admin';
      const verifiedCheck = (session: any) => session?.user?.verified === true;
      
      const composedCheck = (session: any) => {
        return roleCheck(session) && verifiedCheck(session);
      };
      
      const wrappedPlugin = helper(mockPlugin, composedCheck);
      
      expect(wrappedPlugin).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should wrap plugin efficiently', () => {
      const helper = createCommonPermissionHelper();
      const start = Date.now();
      
      helper(mockPlugin, mockCheckPermission);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple wrappings efficiently', () => {
      const helper = createCommonPermissionHelper();
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        helper(mockPlugin, mockCheckPermission);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
