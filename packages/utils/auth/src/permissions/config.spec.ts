import { describe, it, expect, vi } from 'vitest';
import { createPermissionConfig } from './config';
import type { BetterAuthPlugin } from 'better-auth';

describe('createPermissionConfig', () => {
  describe('Configuration Creation', () => {
    it('should create permission configuration object', () => {
      const config = createPermissionConfig({
        checkPermission: () => true,
      });
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should accept checkPermission function', () => {
      const checkFn = vi.fn(() => true);
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission).toBe(checkFn);
    });

    it('should accept custom error message', () => {
      const config = createPermissionConfig({
        checkPermission: () => true,
        errorMessage: 'Custom error',
      });
      
      expect(config.errorMessage).toBe('Custom error');
    });

    it('should have default error message if not provided', () => {
      const config = createPermissionConfig({
        checkPermission: () => true,
      });
      
      expect(config.errorMessage).toBeDefined();
      expect(typeof config.errorMessage).toBe('string');
    });
  });

  describe('Permission Check Function', () => {
    it('should support synchronous permission check', () => {
      const checkFn = (session: any) => session?.user?.role === 'admin';
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission).toBe(checkFn);
      expect(config.checkPermission({ user: { role: 'admin' } })).toBe(true);
    });

    it('should support asynchronous permission check', async () => {
      const checkFn = async (session: any) => {
        await Promise.resolve();
        return session?.user?.role === 'admin';
      };
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission).toBe(checkFn);
      const result = await config.checkPermission({ user: { role: 'admin' } });
      expect(result).toBe(true);
    });

    it('should accept session parameter', () => {
      const checkFn = vi.fn((session: any) => !!session);
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      const session = { user: { id: '1' } };
      config.checkPermission(session);
      
      expect(checkFn).toHaveBeenCalledWith(session);
    });

    it('should handle null session', () => {
      const checkFn = (session: any) => session !== null;
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission(null)).toBe(false);
    });

    it('should handle undefined session', () => {
      const checkFn = (session: any) => session !== undefined;
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission(undefined)).toBe(false);
    });
  });

  describe('Error Message Configuration', () => {
    it('should use custom error message', () => {
      const customMessage = 'You do not have permission to access this resource';
      const config = createPermissionConfig({
        checkPermission: () => false,
        errorMessage: customMessage,
      });
      
      expect(config.errorMessage).toBe(customMessage);
    });

    it('should accept empty error message', () => {
      const config = createPermissionConfig({
        checkPermission: () => false,
        errorMessage: '',
      });
      
      expect(config.errorMessage).toBe('');
    });

    it('should accept multi-line error message', () => {
      const multiLineMessage = 'Error:\nInsufficient permissions';
      const config = createPermissionConfig({
        checkPermission: () => false,
        errorMessage: multiLineMessage,
      });
      
      expect(config.errorMessage).toBe(multiLineMessage);
    });
  });

  describe('Type Safety', () => {
    it('should accept generic session types', () => {
      interface CustomSession {
        user: {
          id: string;
          role: 'admin' | 'user';
        };
      }
      
      const checkFn = (session: CustomSession | null) => {
        return session?.user?.role === 'admin';
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission).toBe(checkFn);
    });

    it('should support nested session properties', () => {
      const checkFn = (session: any) => {
        return session?.user?.profile?.permissions?.includes('write');
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      const result = config.checkPermission({
        user: {
          profile: {
            permissions: ['read', 'write'],
          },
        },
      });
      
      expect(result).toBe(true);
    });

    it('should handle complex return types', async () => {
      const checkFn = async (session: any): Promise<boolean> => {
        return Promise.resolve(!!session);
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      const result = await config.checkPermission({ user: { id: '1' } });
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Validation', () => {
    it('should validate checkPermission is a function', () => {
      const config = createPermissionConfig({
        checkPermission: () => true,
      });
      
      expect(typeof config.checkPermission).toBe('function');
    });

    it('should validate errorMessage is a string', () => {
      const config = createPermissionConfig({
        checkPermission: () => true,
        errorMessage: 'Error',
      });
      
      expect(typeof config.errorMessage).toBe('string');
    });
  });

  describe('Permission Logic Variations', () => {
    it('should support role-based checks', () => {
      const checkFn = (session: any) => {
        const allowedRoles = ['admin', 'moderator'];
        return allowedRoles.includes(session?.user?.role);
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission({ user: { role: 'admin' } })).toBe(true);
      expect(config.checkPermission({ user: { role: 'user' } })).toBe(false);
    });

    it('should support permission array checks', () => {
      const checkFn = (session: any) => {
        return session?.user?.permissions?.includes('delete');
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission({
        user: { permissions: ['read', 'write', 'delete'] },
      })).toBe(true);
    });

    it('should support composite permission checks', () => {
      const checkFn = (session: any) => {
        const isAdmin = session?.user?.role === 'admin';
        const hasPermission = session?.user?.permissions?.includes('write');
        return isAdmin || hasPermission;
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission({
        user: { role: 'user', permissions: ['write'] },
      })).toBe(true);
    });

    it('should support async permission checks with external validation', async () => {
      const checkFn = async (session: any) => {
        // Simulate async permission check (e.g., database query)
        await new Promise(resolve => setTimeout(resolve, 10));
        return session?.user?.id === '123';
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      const result = await config.checkPermission({ user: { id: '123' } });
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle permission check that always returns true', () => {
      const config = createPermissionConfig({
        checkPermission: () => true,
      });
      
      expect(config.checkPermission(null)).toBe(true);
      expect(config.checkPermission(undefined)).toBe(true);
      expect(config.checkPermission({ user: { role: 'guest' } })).toBe(true);
    });

    it('should handle permission check that always returns false', () => {
      const config = createPermissionConfig({
        checkPermission: () => false,
      });
      
      expect(config.checkPermission({ user: { role: 'admin' } })).toBe(false);
    });

    it('should handle permission check with complex conditions', () => {
      const checkFn = (session: any) => {
        if (!session) return false;
        if (!session.user) return false;
        if (session.user.role === 'admin') return true;
        if (session.user.permissions?.includes('special')) return true;
        if (session.user.id === '999') return true;
        return false;
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission({ user: { id: '999' } })).toBe(true);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const config = createPermissionConfig({
        checkPermission: () => false,
        errorMessage: longMessage,
      });
      
      expect(config.errorMessage).toBe(longMessage);
      expect(config.errorMessage.length).toBe(1000);
    });
  });

  describe('Integration with Better Auth', () => {
    it('should create config compatible with Better Auth plugins', () => {
      const config = createPermissionConfig({
        checkPermission: (session: any) => session?.user?.role === 'admin',
        errorMessage: 'Admin access required',
      });
      
      // Simulate plugin usage
      const mockPlugin: Partial<BetterAuthPlugin> = {
        id: 'test-plugin',
        endpoints: {},
      };
      
      expect(config).toBeDefined();
      expect(typeof config.checkPermission).toBe('function');
    });

    it('should support session types from Better Auth', () => {
      type BetterAuthSession = {
        user: {
          id: string;
          email: string;
          role: string;
        };
        session: {
          id: string;
          expiresAt: Date;
        };
      };
      
      const checkFn = (session: BetterAuthSession | null) => {
        return session?.user?.role === 'admin';
      };
      
      const config = createPermissionConfig({
        checkPermission: checkFn,
      });
      
      expect(config.checkPermission).toBe(checkFn);
    });
  });

  describe('Composability', () => {
    it('should support composing multiple permission configs', () => {
      const config1 = createPermissionConfig({
        checkPermission: (session: any) => session?.user?.role === 'admin',
      });
      
      const config2 = createPermissionConfig({
        checkPermission: (session: any) => session?.user?.permissions?.includes('write'),
      });
      
      const composedCheck = (session: any) => {
        return config1.checkPermission(session) || config2.checkPermission(session);
      };
      
      expect(composedCheck({ user: { role: 'admin' } })).toBe(true);
      expect(composedCheck({ user: { permissions: ['write'] } })).toBe(true);
    });

    it('should support AND composition', () => {
      const config1 = createPermissionConfig({
        checkPermission: (session: any) => session?.user?.role === 'admin',
      });
      
      const config2 = createPermissionConfig({
        checkPermission: (session: any) => session?.user?.verified === true,
      });
      
      const composedCheck = (session: any) => {
        return config1.checkPermission(session) && config2.checkPermission(session);
      };
      
      expect(composedCheck({ user: { role: 'admin', verified: true } })).toBe(true);
      expect(composedCheck({ user: { role: 'admin', verified: false } })).toBe(false);
    });
  });
});
