import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RoleGuard } from './role.guard';
import { AUTH_INSTANCE_KEY } from '../types/symbols';
import { APIError } from 'better-auth/api';
import { PermissionChecker } from '@/config/auth/permissions';

// Mock the permissions module
vi.mock('@/config/auth/permissions', () => ({
  PermissionChecker: {
    hasRole: vi.fn(),
    getUserRoles: vi.fn(),
    validatePermission: vi.fn(),
  }
}));

// Mock the statements module to provide test roles and permissions
vi.mock('@/config/auth/permissions/statements', () => ({
  statement: {
    user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
    session: ['list', 'revoke', 'delete'],
    project: ['create', 'read', 'update', 'delete', 'share'],
    system: ['maintenance', 'backup', 'restore', 'monitor']
  },
  roles: {
    admin: { authorize: vi.fn() },
    manager: { authorize: vi.fn() },
    editor: { authorize: vi.fn() },
    user: { authorize: vi.fn() },
    superAdmin: { authorize: vi.fn() }
  }
}));

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;
  let mockAuth: any;
  let mockContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(async () => {
    mockAuth = {
      api: {
        userHasPermission: vi.fn(),
      },
    };

    mockRequest = {
      session: null,
      user: null,
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
        {
          provide: AUTH_INSTANCE_KEY,
          useValue: mockAuth,
        },
      ],
    }).compile();

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get<Reflector>(Reflector);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('canActivate', () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'admin',
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000),
      },
    };

    beforeEach(() => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
      vi.mocked(PermissionChecker.validatePermission).mockReturnValue(true);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should pass if no guards are required', async () => {
      mockRequest.session = mockSession;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('REQUIRED_ROLES', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    describe('Role-based access control', () => {
      beforeEach(() => {
        mockRequest.session = mockSession;
      });

      it('should allow access if user has required role', async () => {
        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(['admin', 'manager']) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(undefined); // REQUIRED_PERMISSIONS

        vi.mocked(PermissionChecker.hasRole).mockReturnValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(PermissionChecker.hasRole).toHaveBeenCalledWith('admin', 'admin');
      });

      it('should deny access if user lacks required role', async () => {
        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(['manager', 'editor']) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce(undefined);

        vi.mocked(PermissionChecker.hasRole).mockReturnValue(false);
        // @ts-expect-error - Testing with mocked types
        vi.mocked(PermissionChecker.getUserRoles).mockReturnValue(['admin']);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          expect.objectContaining({
            status: 403,
            body: expect.objectContaining({
              code: 'FORBIDDEN',
              message: expect.stringContaining('Required roles: manager, editor'),
            }),
          })
        );
      });

      it('should allow access if user has all required roles', async () => {
        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(undefined) // REQUIRED_ROLES
          .mockReturnValueOnce(['admin', 'manager']) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(undefined); // REQUIRED_PERMISSIONS

        vi.mocked(PermissionChecker.hasRole)
          .mockReturnValueOnce(true) // has admin
          .mockReturnValueOnce(true); // has manager

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(PermissionChecker.hasRole).toHaveBeenCalledWith('admin', 'admin');
        expect(PermissionChecker.hasRole).toHaveBeenCalledWith('admin', 'manager');
      });

      it('should deny access if user lacks one of the required all roles', async () => {
        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(undefined) // REQUIRED_ROLES
          .mockReturnValueOnce(['admin', 'superuser']) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(undefined); // REQUIRED_PERMISSIONS

        vi.mocked(PermissionChecker.hasRole)
          .mockReturnValueOnce(true) // has admin
          .mockReturnValueOnce(false); // lacks superuser

        // @ts-expect-error - Testing with mocked types
        vi.mocked(PermissionChecker.getUserRoles).mockReturnValue(['admin']);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          expect.objectContaining({
            status: 403,
            body: expect.objectContaining({
              code: 'FORBIDDEN',
              message: expect.stringContaining('All required roles: admin, superuser'),
            }),
          })
        );
      });
    });

    describe('Permission-based access control', () => {
      beforeEach(() => {
        mockRequest.session = mockSession;
      });

      it('should allow access if user has required permissions', async () => {
        const requiredPermissions = {
          project: ['create', 'update'],
          user: ['list'],
        };

        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(undefined) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(requiredPermissions); // REQUIRED_PERMISSIONS

        vi.mocked(mockAuth.api.userHasPermission).mockResolvedValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(mockAuth.api.userHasPermission).toHaveBeenCalledWith({
          body: {
            userId: 'user-1',
            permissions: requiredPermissions,
          },
        });
      });

      it('should deny access if user lacks required permissions', async () => {
        const requiredPermissions = {
          project: ['delete'],
          system: ['backup'],
        };

        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(undefined) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(requiredPermissions); // REQUIRED_PERMISSIONS

        vi.mocked(mockAuth.api.userHasPermission).mockResolvedValue(false);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          expect.objectContaining({
            status: 403,
            body: expect.objectContaining({
              code: 'FORBIDDEN',
              message: expect.stringContaining('Missing required permissions'),
            }),
          })
        );
      });

      it('should throw INTERNAL_SERVER_ERROR for invalid permission structure', async () => {
        const invalidPermissions = {
          invalidResource: ['invalidAction'],
        };

        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(undefined) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(invalidPermissions); // REQUIRED_PERMISSIONS

        vi.mocked(PermissionChecker.validatePermission).mockReturnValue(false);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          expect.objectContaining({
            status: 500,
            body: expect.objectContaining({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Invalid permission configuration',
            }),
          })
        );
      });

      it('should handle permission check API errors', async () => {
        const requiredPermissions = {
          project: ['create'],
        };

        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(undefined) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(requiredPermissions); // REQUIRED_PERMISSIONS

        const apiError = new APIError(403, {
          code: 'FORBIDDEN',
          message: 'User does not have required permissions',
        });

        vi.mocked(mockAuth.api.userHasPermission).mockRejectedValue(apiError);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(apiError);
      });

      it('should handle unexpected permission check errors', async () => {
        const requiredPermissions = {
          project: ['create'],
        };

        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(undefined) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(requiredPermissions); // REQUIRED_PERMISSIONS

        vi.mocked(mockAuth.api.userHasPermission).mockRejectedValue(new Error('Database error'));

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          expect.objectContaining({
            status: 500,
            body: expect.objectContaining({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Permission validation failed',
            }),
          })
        );
      });
    });

    describe('Combined role and permission checks', () => {
      beforeEach(() => {
        mockRequest.session = mockSession;
      });

      it('should check roles before permissions', async () => {
        const requiredPermissions = {
          project: ['create'],
        };

        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(['manager']) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(requiredPermissions); // REQUIRED_PERMISSIONS

        vi.mocked(PermissionChecker.hasRole).mockReturnValue(false);
        // @ts-expect-error - Testing with mocked types
        vi.mocked(PermissionChecker.getUserRoles).mockReturnValue(['admin']);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          expect.objectContaining({
            status: 403,
            body: expect.objectContaining({
              code: 'FORBIDDEN',
              message: expect.stringContaining('Required roles: manager'),
            }),
          })
        );

        // Permission check should not be called since role check failed
        expect(mockAuth.api.userHasPermission).not.toHaveBeenCalled();
      });

      it('should check both roles and permissions when both pass', async () => {
        const requiredPermissions = {
          project: ['create'],
        };

        vi.mocked(reflector.getAllAndOverride)
          .mockReturnValueOnce(['admin']) // REQUIRED_ROLES
          .mockReturnValueOnce(undefined) // REQUIRED_ALL_ROLES
          .mockReturnValueOnce(requiredPermissions); // REQUIRED_PERMISSIONS

        vi.mocked(PermissionChecker.hasRole).mockReturnValue(true);
        vi.mocked(mockAuth.api.userHasPermission).mockResolvedValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(PermissionChecker.hasRole).toHaveBeenCalledWith('admin', 'admin');
        expect(mockAuth.api.userHasPermission).toHaveBeenCalledWith({
          body: {
            userId: 'user-1',
            permissions: requiredPermissions,
          },
        });
      });
    });
  });

  describe('Static helper methods', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should check role using PermissionChecker.hasRole', () => {
      vi.mocked(PermissionChecker.hasRole).mockReturnValue(true);

      // @ts-expect-error - Testing with mocked types
      const result = RoleGuard.hasRole('admin,manager', 'admin');

      expect(result).toBe(true);
      expect(PermissionChecker.hasRole).toHaveBeenCalledWith('admin,manager', 'admin');
    });

    it('should get user roles using PermissionChecker.getUserRoles', () => {
      // @ts-expect-error - Testing with mocked types
      vi.mocked(PermissionChecker.getUserRoles).mockReturnValue(['admin', 'manager']);

      const result = RoleGuard.getUserRoles('admin,manager');

      expect(result).toEqual(['admin', 'manager']);
      expect(PermissionChecker.getUserRoles).toHaveBeenCalledWith('admin,manager');
    });
  });
});