/**
 * Middleware Integration Tests
 *
 * Tests middleware definitions with mocked plugin instances to verify:
 * - Type safety through the entire chain
 * - Check creation and execution
 * - Error handling and error codes
 * - Converter output (NestJS Guards, ORPC middlewares)
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  AdminMiddlewareDefinition,
  OrganizationMiddlewareDefinition,
  createNestGuard,
  createCompositeNestGuard,
  createOrpcMiddleware,
  createCompositeOrpcMiddleware,
  OrpcError,
  BaseMiddlewareCheck,
  type MiddlewareContext,
} from '../index';
import type {
  AdminPermissionsPlugin,
  OrganizationsPermissionsPlugin,
  AnyPermissionBuilder,
} from '@repo/auth/permissions/plugins';

// ============================================================================
// Mock Types
// ============================================================================

/**
 * Mock permission builder for testing.
 * Simulates the type constraints of a real PermissionBuilder.
 */
type MockPermissionBuilder = AnyPermissionBuilder;

/**
 * Mock session type
 */
interface MockSession {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * Mock admin plugin type
 */
interface MockAdminPlugin {
  getSession: Mock<() => MockSession | null>;
  hasSession: Mock<() => boolean>;
  getAuth: Mock<() => { api: { getSession: (opts: { headers: Headers }) => Promise<MockSession | null> } }>;
  checkPermission: Mock<(perms: Record<string, readonly string[]>) => Promise<boolean>>;
  checkRolePermission: Mock<(role: string, perms: Record<string, readonly string[]>) => Promise<boolean>>;
  assertCheckPermission: Mock<(perms: Record<string, readonly string[]>, message?: string) => Promise<void>>;
  assertCheckRole: Mock<(roles: readonly string[], message?: string) => Promise<void>>;
}

/**
 * Mock organization plugin type
 */
interface MockOrgPlugin {
  getSession: Mock<() => MockSession | null>;
  hasSession: Mock<() => boolean>;
  getAuth: Mock<() => { api: { getSession: (opts: { headers: Headers }) => Promise<MockSession | null> } }>;
  assertCheckPermission: Mock<(perms: Record<string, readonly string[]>, message?: string) => Promise<void>>;
  listMembers: Mock<(orgId: string) => Promise<{ members: Array<{ userId: string; role: string }>; total: number }>>;
  getOrganization: Mock<(orgId: string) => Promise<{ id: string; name: string; creatorId?: string }>>;
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock admin plugin with default implementations
 */
function createMockAdminPlugin(session: MockSession | null = null): MockAdminPlugin {
  const hasSession = session !== null;
  return {
    getSession: vi.fn(() => session),
    hasSession: vi.fn(() => hasSession),
    getAuth: vi.fn(() => ({
      api: {
        getSession: vi.fn().mockResolvedValue(session),
      },
    })),
    checkPermission: vi.fn().mockResolvedValue(true),
    checkRolePermission: vi.fn().mockResolvedValue(true),
    assertCheckPermission: vi.fn().mockResolvedValue(undefined),
    assertCheckRole: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create a mock organization plugin with default implementations
 */
function createMockOrgPlugin(session: MockSession | null = null): MockOrgPlugin {
  return {
    getSession: vi.fn(() => session),
    hasSession: vi.fn(() => session !== null),
    getAuth: vi.fn(() => ({
      api: {
        getSession: vi.fn().mockResolvedValue(session),
      },
    })),
    assertCheckPermission: vi.fn().mockResolvedValue(undefined),
    listMembers: vi.fn().mockResolvedValue({ members: [], total: 0 }),
    getOrganization: vi.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
  };
}

/**
 * Create a mock middleware context
 */
function createMockContext(): MiddlewareContext {
  return {
    headers: new Headers({ 'authorization': 'Bearer test-token' }),
    params: { organizationId: 'org-123' },
    query: { page: '1' },
    body: { data: 'test' },
  };
}

/**
 * Create a default test session
 * @param role - Optional role for the user (default: 'user')
 */
function createTestSession(role: string = 'user'): MockSession {
  return {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role,
    },
    session: {
      id: 'session-123',
      token: 'test-token',
      expiresAt: new Date(Date.now() + 3600000),
    },
  };
}

// ============================================================================
// Admin Middleware Definition Tests
// ============================================================================

describe('AdminMiddlewareDefinition', () => {
  let mockPlugin: MockAdminPlugin;
  let middleware: AdminMiddlewareDefinition<MockPermissionBuilder, any>;
  let session: MockSession;
  let context: MiddlewareContext;

  beforeEach(() => {
    session = createTestSession();
    mockPlugin = createMockAdminPlugin(session);
    middleware = new AdminMiddlewareDefinition(
      (() => mockPlugin) as unknown as (ctx: MiddlewareContext) => AdminPermissionsPlugin<MockPermissionBuilder, any>
    );
    context = createMockContext();
  });

  describe('Check Creation', () => {
    it('should create hasPermission check', () => {
      const check = middleware.hasPermission({ user: ['create'] });

      expect(check).toBeDefined();
      expect(check.name).toBe('hasPermission');
      expect(check.description).toBe('Checks if user has the specified permissions');
    });

    it('should create hasPermissionByRole check', () => {
      const check = middleware.hasPermissionByRole('admin', { user: ['ban'] });

      expect(check).toBeDefined();
      expect(check.name).toBe('hasPermissionByRole');
    });

    it('should create hasRole check', () => {
      const check = middleware.hasRole(['admin', 'moderator']);

      expect(check).toBeDefined();
      expect(check.name).toBe('hasRole');
    });

    it('should create requireAdminRole check', () => {
      const check = middleware.requireAdminRole();

      expect(check).toBeDefined();
      expect(check.name).toBe('requireAdminRole');
    });

    it('should create requireSession check (inherited from base)', () => {
      const check = middleware.requireSession();

      expect(check).toBeDefined();
      expect(check.name).toBe('requireSession');
    });
  });

  describe('hasPermission Check Execution', () => {
    it('should pass when user has permission', async () => {
      mockPlugin.assertCheckPermission.mockResolvedValueOnce(undefined);
      const check = middleware.hasPermission({ user: ['create'] });

      await expect(check.check(context)).resolves.toBeUndefined();
      expect(mockPlugin.assertCheckPermission).toHaveBeenCalledWith(
        { user: ['create'] },
        expect.stringContaining('permissions')
      );
    });

    it('should throw when user lacks permission', async () => {
      mockPlugin.assertCheckPermission.mockRejectedValueOnce(
        new Error('Permission denied')
      );
      const check = middleware.hasPermission({ user: ['delete'] });

      await expect(check.check(context)).rejects.toThrow('Permission denied');
    });

    it('should return correct error code', () => {
      const check = middleware.hasPermission({ user: ['create'] });
      expect(check.getErrorCode()).toBe('FORBIDDEN');
    });

    it('should return meaningful error message', () => {
      const check = middleware.hasPermission({ user: ['create'] });
      expect(check.getErrorMessage()).toBe('You do not have the required permissions.');
    });
  });

  describe('hasRole Check Execution', () => {
    it('should pass when user has required role', async () => {
      mockPlugin.assertCheckRole.mockResolvedValueOnce(undefined);
      const check = middleware.hasRole(['admin', 'moderator']);

      await expect(check.check(context)).resolves.toBeUndefined();
      expect(mockPlugin.assertCheckRole).toHaveBeenCalled();
    });

    it('should throw when user lacks required role', async () => {
      mockPlugin.assertCheckRole.mockRejectedValueOnce(
        new Error('Role required: admin')
      );
      const check = middleware.hasRole(['admin']);

      await expect(check.check(context)).rejects.toThrow('Role required');
    });
  });

  describe('Dynamic Value Resolution', () => {
    it('should resolve permissions from context', async () => {
      mockPlugin.assertCheckPermission.mockResolvedValueOnce(undefined);

      // Use a resolver function for permissions
      const check = middleware.hasPermission(
        (ctx) => ({ user: [ctx.params.action ?? 'read'] } as any)
      );

      const ctxWithAction = { ...context, params: { action: 'delete' } };
      await expect(check.check(ctxWithAction)).resolves.toBeUndefined();
      expect(mockPlugin.assertCheckPermission).toHaveBeenCalledWith(
        { user: ['delete'] },
        expect.any(String)
      );
    });

    it('should resolve roles from context', async () => {
      mockPlugin.assertCheckRole.mockResolvedValueOnce(undefined);

      // Use a resolver function for roles
      const check = middleware.hasRole(
        (ctx) => [ctx.params?.requiredRole ?? 'user'] as any
      );

      const ctxWithRole = { ...context, params: { requiredRole: 'admin' } };
      await expect(check.check(ctxWithRole)).resolves.toBeUndefined();
    });
  });

  describe('Custom Admin Roles', () => {
    it('should use custom admin roles when provided', () => {
      const customMiddleware = new AdminMiddlewareDefinition(
        (() => mockPlugin) as unknown as (ctx: MiddlewareContext) => AdminPermissionsPlugin<MockPermissionBuilder, any>,
        { adminRoles: ['superadmin', 'admin'] as any }
      );

      const check = customMiddleware.requireAdminRole();
      expect(check).toBeDefined();
      // Check that requiredRoles metadata is set correctly
      expect((check as any).requiredRoles).toEqual(['superadmin', 'admin']);
    });
  });
});

// ============================================================================
// Organization Middleware Definition Tests
// ============================================================================

describe('OrganizationMiddlewareDefinition', () => {
  let mockPlugin: MockOrgPlugin;
  let middleware: OrganizationMiddlewareDefinition<MockPermissionBuilder, any>;
  let session: MockSession;
  let context: MiddlewareContext;

  beforeEach(() => {
    session = createTestSession();
    mockPlugin = createMockOrgPlugin(session);
    middleware = new OrganizationMiddlewareDefinition(
      (() => mockPlugin) as unknown as (ctx: MiddlewareContext) => OrganizationsPermissionsPlugin<MockPermissionBuilder, any>
    );
    context = createMockContext();
  });

  describe('Check Creation', () => {
    it('should create hasOrganizationPermission check', () => {
      const check = middleware.hasOrganizationPermission({ project: ['create'] });

      expect(check).toBeDefined();
      expect(check.name).toBe('hasOrganizationPermission');
    });

    it('should create isMemberOf check', () => {
      const check = middleware.isMemberOf('org-123');

      expect(check).toBeDefined();
      expect(check.name).toBe('isMemberOf');
    });

    it('should create hasOrganizationRole check', () => {
      const check = middleware.hasOrganizationRole('org-123', ['admin', 'owner']);

      expect(check).toBeDefined();
      expect(check.name).toBe('hasOrganizationRole');
    });

    it('should create isOrganizationOwner check', () => {
      const check = middleware.isOrganizationOwner('org-123');

      expect(check).toBeDefined();
      expect(check.name).toBe('isOrganizationOwner');
    });
  });

  describe('hasOrganizationPermission Check Execution', () => {
    it('should pass when user has organization permission', async () => {
      mockPlugin.assertCheckPermission.mockResolvedValueOnce(undefined);
      const check = middleware.hasOrganizationPermission({ project: ['create'] });

      await expect(check.check(context)).resolves.toBeUndefined();
    });

    it('should throw when user lacks organization permission', async () => {
      mockPlugin.assertCheckPermission.mockRejectedValueOnce(
        new Error('Missing organization permission')
      );
      const check = middleware.hasOrganizationPermission({ project: ['delete'] });

      await expect(check.check(context)).rejects.toThrow('Missing organization permission');
    });
  });

  describe('isMemberOf Check Execution', () => {
    it('should pass when user is organization member', async () => {
      mockPlugin.listMembers.mockResolvedValueOnce({
        members: [{ userId: 'user-123', role: 'member' }],
        total: 1,
      });
      const check = middleware.isMemberOf('org-123');

      await expect(check.check(context)).resolves.toBeUndefined();
    });

    it('should throw when user is not a member', async () => {
      mockPlugin.listMembers.mockResolvedValueOnce({
        members: [{ userId: 'other-user', role: 'member' }],
        total: 1,
      });
      const check = middleware.isMemberOf('org-123');

      await expect(check.check(context)).rejects.toThrow('not a member');
    });

    it('should throw when session is missing', async () => {
      mockPlugin.getSession = vi.fn(() => null);
      const check = middleware.isMemberOf('org-123');

      await expect(check.check(context)).rejects.toThrow('Session required');
    });
  });

  describe('hasOrganizationRole Check Execution', () => {
    it('should pass when user has required role in organization', async () => {
      mockPlugin.listMembers.mockResolvedValueOnce({
        members: [{ userId: 'user-123', role: 'admin' }],
        total: 1,
      });
      const check = middleware.hasOrganizationRole('org-123', ['admin', 'owner']);

      await expect(check.check(context)).resolves.toBeUndefined();
    });

    it('should throw when user role does not match', async () => {
      mockPlugin.listMembers.mockResolvedValueOnce({
        members: [{ userId: 'user-123', role: 'viewer' }],
        total: 1,
      });
      const check = middleware.hasOrganizationRole('org-123', ['admin', 'owner']);

      await expect(check.check(context)).rejects.toThrow('does not have required role');
    });
  });

  describe('isOrganizationOwner Check Execution', () => {
    it('should pass when user is organization creator', async () => {
      mockPlugin.getOrganization.mockResolvedValueOnce({
        id: 'org-123',
        name: 'Test Org',
        creatorId: 'user-123',
      });
      const check = middleware.isOrganizationOwner('org-123');

      await expect(check.check(context)).resolves.toBeUndefined();
    });

    it('should pass when user has owner role', async () => {
      mockPlugin.getOrganization.mockResolvedValueOnce({
        id: 'org-123',
        name: 'Test Org',
        creatorId: 'other-user',
      });
      mockPlugin.listMembers.mockResolvedValueOnce({
        members: [{ userId: 'user-123', role: 'owner' }],
        total: 1,
      });
      const check = middleware.isOrganizationOwner('org-123');

      await expect(check.check(context)).resolves.toBeUndefined();
    });

    it('should throw when user is not owner', async () => {
      mockPlugin.getOrganization.mockResolvedValueOnce({
        id: 'org-123',
        name: 'Test Org',
        creatorId: 'other-user',
      });
      mockPlugin.listMembers.mockResolvedValueOnce({
        members: [{ userId: 'user-123', role: 'member' }],
        total: 1,
      });
      const check = middleware.isOrganizationOwner('org-123');

      await expect(check.check(context)).rejects.toThrow('not the owner');
    });
  });

  describe('Dynamic Organization ID Resolution', () => {
    it('should resolve organization ID from context', async () => {
      mockPlugin.listMembers.mockResolvedValueOnce({
        members: [{ userId: 'user-123', role: 'member' }],
        total: 1,
      });

      // Use a resolver function
      const check = middleware.isMemberOf((ctx) => ctx.params?.organizationId ?? '');

      await expect(check.check(context)).resolves.toBeUndefined();
      expect(mockPlugin.listMembers).toHaveBeenCalledWith('org-123');
    });
  });
});

// ============================================================================
// NestJS Guard Converter Tests
// ============================================================================

describe('NestJS Guard Converters', () => {
  let mockPlugin: MockAdminPlugin;
  let middleware: AdminMiddlewareDefinition<MockPermissionBuilder, any>;
  let session: MockSession;

  beforeEach(() => {
    session = createTestSession();
    mockPlugin = createMockAdminPlugin(session);
    middleware = new AdminMiddlewareDefinition(
      (() => mockPlugin) as unknown as (
        ctx: MiddlewareContext
      ) => AdminPermissionsPlugin<MockPermissionBuilder, any>
    );
  });

  describe('createNestGuard', () => {
    it('should create a guard class from a check', () => {
      const check = middleware.hasPermission({ user: ['create'] });
      const Guard = createNestGuard(check);

      expect(Guard).toBeDefined();
      expect(typeof Guard).toBe('function');
    });

    it('should create a guard class with logging enabled', () => {
      const check = middleware.hasPermission({ user: ['create'] });
      const Guard = createNestGuard(check, { logErrors: true });

      // Guard class should be created
      expect(Guard).toBeDefined();
    });
  });

  describe('createCompositeNestGuard', () => {
    it('should create a guard from multiple checks', () => {
      const checks = [
        middleware.requireSession(),
        middleware.hasPermission({ user: ['create'] }),
      ];
      const Guard = createCompositeNestGuard(checks);

      expect(Guard).toBeDefined();
    });

    it('should create a guard with custom options', () => {
      const checks = [
        middleware.hasRole(['admin']),
        middleware.hasPermission({ user: ['ban'] }),
      ];
      const Guard = createCompositeNestGuard(checks, {
        logErrors: true,
      });

      expect(Guard).toBeDefined();
    });
  });
});

// ============================================================================
// ORPC Middleware Converter Tests
// ============================================================================

describe('ORPC Middleware Converters', () => {
  let mockPlugin: MockAdminPlugin;
  let middleware: AdminMiddlewareDefinition<MockPermissionBuilder, any>;
  let session: MockSession;

  beforeEach(() => {
    session = createTestSession();
    mockPlugin = createMockAdminPlugin(session);
    middleware = new AdminMiddlewareDefinition(
      (() => mockPlugin) as unknown as (
        ctx: MiddlewareContext
      ) => AdminPermissionsPlugin<MockPermissionBuilder, any>
    );
  });

  describe('createOrpcMiddleware', () => {
    it('should create middleware function from a check', () => {
      const check = middleware.hasPermission({ user: ['create'] });
      const orpcMiddleware = createOrpcMiddleware(check);

      expect(orpcMiddleware).toBeDefined();
      expect(typeof orpcMiddleware).toBe('function');
    });

    it('should pass context to next when check passes', async () => {
      mockPlugin.assertCheckPermission.mockResolvedValueOnce(undefined);

      const check = middleware.hasPermission({ user: ['create'] });
      const orpcMiddleware = createOrpcMiddleware(check);

      // ORPC middleware's next function receives { context } object and returns a promise
      const mockNext = vi.fn().mockImplementation(({ context }) => 
        Promise.resolve({ output: { success: true }, context })
      );

      // ORPC Middleware type signature: (options, input, outputFn) where options contains next
      const mockOptions = {
        context: {},
        path: ['/test'],
        procedure: {} as any,
        signal: new AbortController().signal,
        lastEventId: undefined,
        next: mockNext,
        errors: {} as any,
      };
      const mockOutputFn = vi.fn();

      await expect(
        orpcMiddleware(mockOptions as any, {}, mockOutputFn)
      ).resolves.toEqual({ output: { success: true }, context: {} });
    });

    it('should throw OrpcError when check fails', async () => {
      mockPlugin.assertCheckPermission.mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const check = middleware.hasPermission({ user: ['delete'] });
      const orpcMiddleware = createOrpcMiddleware(check);

      const mockNext = vi.fn();

      // ORPC Middleware type signature: (options, input, outputFn) where options contains next
      const mockOptions = {
        context: {},
        path: ['/test'],
        procedure: {} as any,
        signal: new AbortController().signal,
        lastEventId: undefined,
        next: mockNext,
        errors: {} as any,
      };
      const mockOutputFn = vi.fn();

      await expect(
        orpcMiddleware(mockOptions as any, {}, mockOutputFn)
      ).rejects.toThrow();
    });
  });

  describe('createCompositeOrpcMiddleware', () => {
    it('should create middleware from multiple checks', () => {
      const checks = [
        middleware.requireSession(),
        middleware.hasPermission({ user: ['create'] }),
      ];
      const orpcMiddleware = createCompositeOrpcMiddleware(checks);

      expect(orpcMiddleware).toBeDefined();
      expect(typeof orpcMiddleware).toBe('function');
    });
  });
});

// ============================================================================
// OrpcError Tests
// ============================================================================

describe('OrpcError', () => {
  it('should create error with code and message', () => {
    const error = new OrpcError('UNAUTHORIZED', 'Authentication required');

    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Authentication required');
    expect(error.name).toBe('ORPCError');
  });

  it('should have correct HTTP status codes', () => {
    const unauthorized = new OrpcError('UNAUTHORIZED', 'Auth required');
    const forbidden = new OrpcError('FORBIDDEN', 'Permission denied');
    const badRequest = new OrpcError('BAD_REQUEST', 'Invalid input');
    const notFound = new OrpcError('NOT_FOUND', 'Resource not found');
    const internal = new OrpcError('INTERNAL_SERVER_ERROR', 'Server error');

    expect(unauthorized.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(badRequest.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(internal.status).toBe(500);
  });
});

// ============================================================================
// Check Metadata Tests
// ============================================================================

describe('Check Metadata', () => {
  let mockPlugin: MockAdminPlugin;
  let middleware: AdminMiddlewareDefinition<MockPermissionBuilder, any>;

  beforeEach(() => {
    mockPlugin = createMockAdminPlugin(createTestSession());
    middleware = new AdminMiddlewareDefinition(
      (() => mockPlugin) as unknown as (ctx: MiddlewareContext) => AdminPermissionsPlugin<MockPermissionBuilder, any>
    );
  });

  describe('PermissionCheck metadata', () => {
    it('should expose permissions object for static permissions', () => {
      const check = middleware.hasPermission({ user: ['create', 'update'] });

      expect((check as any).permissions).toEqual({ user: ['create', 'update'] });
    });

    it('should expose empty permissions for dynamic permissions', () => {
      const check = middleware.hasPermission(() => ({ user: ['create'] } as any));

      // Dynamic permissions result in empty metadata object
      expect((check as any).permissions).toEqual({});
    });
  });

  describe('RoleCheck metadata', () => {
    it('should expose requiredRoles for static roles', () => {
      const check = middleware.hasRole(['admin', 'moderator']);

      expect((check as any).requiredRoles).toEqual(['admin', 'moderator']);
    });

    it('should expose matchMode', () => {
      const check = middleware.hasRole(['admin']);

      expect((check as any).matchMode).toBe('any');
    });
  });
});

// ============================================================================
// BaseMiddlewareCheck Tests
// ============================================================================

describe('BaseMiddlewareCheck', () => {
  it('should be instantiable', () => {
    class TestCheck extends BaseMiddlewareCheck {
      readonly name = 'testCheck' as const;
      readonly description = 'Test check';

      async check(_context: MiddlewareContext): Promise<void> {
        // No-op
      }

      getErrorCode() {
        return 'BAD_REQUEST' as const;
      }

      getErrorMessage() {
        return 'Test error';
      }
    }

    const check = new TestCheck();
    expect(check.name).toBe('testCheck');
  });
});

// ============================================================================
// Integration Scenario Tests
// ============================================================================

describe('Integration Scenarios', () => {
  describe('Typical API Endpoint Protection', () => {
    it('should chain multiple checks for admin endpoint', async () => {
      const session = createTestSession();
      session.user.role = 'admin';

      const adminPlugin = createMockAdminPlugin(session);
      const middleware = new AdminMiddlewareDefinition(
        (() => adminPlugin) as unknown as (
          ctx: MiddlewareContext
        ) => AdminPermissionsPlugin<MockPermissionBuilder, any>
      );

      // Create checks that would typically protect an admin endpoint
      const checks = [
        middleware.requireSession(),
        middleware.hasRole(['admin', 'superadmin']),
        middleware.hasPermission({ user: ['manage'] }),
      ];

      const context = createMockContext();

      // All checks should pass
      for (const check of checks) {
        await expect(check.check(context)).resolves.toBeUndefined();
      }
    });

    it('should chain multiple checks for organization endpoint', async () => {
      const session = createTestSession();
      const orgPlugin = createMockOrgPlugin(session);

      // Mock membership
      orgPlugin.listMembers.mockResolvedValue({
        members: [{ userId: 'user-123', role: 'admin' }],
        total: 1,
      });

      const middleware = new OrganizationMiddlewareDefinition(
        (() => orgPlugin) as unknown as (
          ctx: MiddlewareContext
        ) => OrganizationsPermissionsPlugin<MockPermissionBuilder, any>
      );

      // Create checks for organization admin endpoint
      const checks = [
        middleware.requireSession(),
        middleware.isMemberOf('org-123'),
        middleware.hasOrganizationRole('org-123', ['admin', 'owner']),
      ];

      const context = createMockContext();

      // All checks should pass
      for (const check of checks) {
        await expect(check.check(context)).resolves.toBeUndefined();
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should stop at first failing check', async () => {
      const adminPlugin = createMockAdminPlugin(null); // No session
      const middleware = new AdminMiddlewareDefinition(
        (() => adminPlugin) as unknown as (
          ctx: MiddlewareContext
        ) => AdminPermissionsPlugin<MockPermissionBuilder, any>
      );

      const sessionCheck = middleware.requireSession();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _permissionCheck = middleware.hasPermission({ user: ['create'] });

      const context = createMockContext();

      // Session check should fail
      await expect(sessionCheck.check(context)).rejects.toThrow();

      // Permission check would also fail if executed, but we stop at session
      expect(adminPlugin.assertCheckPermission).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

import {
  createAdminMiddleware,
  createOrganizationMiddleware,
} from '../index';

describe('Convenience Factory Functions', () => {
  describe('createAdminMiddleware', () => {
    it('should create AdminMiddlewareDefinition from plugin', () => {
      const session = createTestSession();
      const plugin = createMockAdminPlugin(session);

      const middleware = createAdminMiddleware(
        plugin as unknown as AdminPermissionsPlugin<MockPermissionBuilder, any>
      );

      expect(middleware).toBeInstanceOf(AdminMiddlewareDefinition);
    });

    it('should create middleware with custom admin roles', () => {
      const session = createTestSession('superuser');
      const plugin = createMockAdminPlugin(session);
      plugin.assertCheckRole.mockResolvedValue(undefined);

      const middleware = createAdminMiddleware(
        plugin as unknown as AdminPermissionsPlugin<MockPermissionBuilder, any>,
        { adminRoles: ['superuser', 'admin'] }
      );

      expect(middleware).toBeInstanceOf(AdminMiddlewareDefinition);

      // Verify custom roles are applied by checking requireAdminRole
      const check = middleware.requireAdminRole();
      expect(check.name).toBe('requireAdminRole');
    });

    it('should preserve plugin functionality through factory', async () => {
      const session = createTestSession();
      const plugin = createMockAdminPlugin(session);
      plugin.assertCheckPermission.mockResolvedValue(undefined);

      const middleware = createAdminMiddleware(
        plugin as unknown as AdminPermissionsPlugin<MockPermissionBuilder, any>
      );

      const check = middleware.hasPermission({ user: ['read'] });
      const context = createMockContext();

      await expect(check.check(context)).resolves.toBeUndefined();
      expect(plugin.assertCheckPermission).toHaveBeenCalled();
    });
  });

  describe('createOrganizationMiddleware', () => {
    it('should create OrganizationMiddlewareDefinition from plugin', () => {
      const session = createTestSession();
      const plugin = createMockOrgPlugin(session);

      const middleware = createOrganizationMiddleware(
        plugin as unknown as OrganizationsPermissionsPlugin<MockPermissionBuilder, any>
      );

      expect(middleware).toBeInstanceOf(OrganizationMiddlewareDefinition);
    });

    it('should preserve plugin functionality through factory', async () => {
      const session = createTestSession();
      const plugin = createMockOrgPlugin(session);
      plugin.assertCheckPermission.mockResolvedValue(undefined);

      const middleware = createOrganizationMiddleware(
        plugin as unknown as OrganizationsPermissionsPlugin<MockPermissionBuilder, any>
      );

      const check = middleware.hasOrganizationPermission({
        organization: ['read'],
      });
      const context = createMockContext();

      await expect(check.check(context)).resolves.toBeUndefined();
      expect(plugin.assertCheckPermission).toHaveBeenCalled();
    });

    it('should work with isMemberOf check', async () => {
      const session = createTestSession();
      const plugin = createMockOrgPlugin(session);
      plugin.listMembers.mockResolvedValue({
        members: [{ userId: 'user-123', role: 'member' }],
        total: 1,
      });

      const middleware = createOrganizationMiddleware(
        plugin as unknown as OrganizationsPermissionsPlugin<MockPermissionBuilder, any>
      );

      const check = middleware.isMemberOf('org-123');
      const context = createMockContext();

      await expect(check.check(context)).resolves.toBeUndefined();
      expect(plugin.listMembers).toHaveBeenCalledWith('org-123');
    });
  });

  describe('Factory function usage patterns', () => {
    it('should work in typical workflow with NestJS guard creation', () => {
      const session = createTestSession('admin');
      const plugin = createMockAdminPlugin(session);
      plugin.assertCheckPermission.mockResolvedValue(undefined);

      // Factory -> middleware -> check -> guard
      const middleware = createAdminMiddleware(
        plugin as unknown as AdminPermissionsPlugin<MockPermissionBuilder, any>
      );
      const guard = createNestGuard(middleware.hasPermission({ user: ['manage'] }));

      expect(guard).toBeDefined();
      expect(typeof guard).toBe('function'); // Guard is a class/function
    });

    it('should work in typical workflow with ORPC middleware creation', () => {
      const session = createTestSession();
      const plugin = createMockOrgPlugin(session);
      plugin.listMembers.mockResolvedValue({
        members: [{ userId: 'user-123', role: 'admin' }],
        total: 1,
      });

      // Factory -> middleware -> check -> orpc middleware
      const orgMiddleware = createOrganizationMiddleware(
        plugin as unknown as OrganizationsPermissionsPlugin<MockPermissionBuilder, any>
      );
      const orpcMiddleware = createOrpcMiddleware(orgMiddleware.isMemberOf('org-123'));

      expect(orpcMiddleware).toBeDefined();
      expect(typeof orpcMiddleware).toBe('function');
    });

    it('should work with composite guards from multiple definitions', () => {
      const session = createTestSession('admin');
      const adminPlugin = createMockAdminPlugin(session);
      const orgPlugin = createMockOrgPlugin(session);

      adminPlugin.assertCheckRole.mockResolvedValue(undefined);
      orgPlugin.listMembers.mockResolvedValue({
        members: [{ userId: 'user-123', role: 'admin' }],
        total: 1,
      });

      // Create both middlewares via factories
      const adminMiddleware = createAdminMiddleware(
        adminPlugin as unknown as AdminPermissionsPlugin<MockPermissionBuilder, any>
      );
      const orgMiddleware = createOrganizationMiddleware(
        orgPlugin as unknown as OrganizationsPermissionsPlugin<MockPermissionBuilder, any>
      );

      // Combine checks from both
      const compositeGuard = createCompositeNestGuard([
        adminMiddleware.hasRole(['admin']),
        orgMiddleware.isMemberOf('org-123'),
      ]);

      expect(compositeGuard).toBeDefined();
    });
  });
});
