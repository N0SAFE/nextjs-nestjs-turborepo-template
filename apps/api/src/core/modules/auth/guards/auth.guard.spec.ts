import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AUTH_INSTANCE_KEY } from '../types/symbols';
import { APIError } from 'better-auth/api';

// Mock better-auth/node
vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn((headers) => headers),
}));

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let mockAuth: any;
  let mockContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(async () => {
    mockAuth = {
      api: {
        getSession: vi.fn(),
      },
    };

    mockRequest = {
      headers: {
        authorization: 'Bearer token',
      },
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
        AuthGuard,
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

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
      },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000),
      },
    };

    beforeEach(() => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false);
    });

    it('should return true for public routes', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
      vi.mocked(mockAuth.api.getSession).mockResolvedValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('PUBLIC', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should return true for optional auth routes with no session', async () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(false) // PUBLIC
        .mockReturnValueOnce(true); // OPTIONAL
      vi.mocked(mockAuth.api.getSession).mockResolvedValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('OPTIONAL', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should return true for authenticated requests', async () => {
      vi.mocked(mockAuth.api.getSession).mockResolvedValue(mockSession);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.session).toBe(mockSession);
      expect(mockRequest.user).toBe(mockSession.user);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: mockRequest.headers,
      });
    });

    it('should throw APIError for unauthenticated requests on protected routes', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(false);
      vi.mocked(mockAuth.api.getSession).mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(APIError);
      expect(mockRequest.session).toBeNull();
      expect(mockRequest.user).toBeNull();
    });

    it('should set user to null when session exists but no user', async () => {
      const sessionWithoutUser = {
        session: {
          id: 'session-1',
          userId: '1',
          expiresAt: new Date(Date.now() + 3600000),
        },
      };
      vi.mocked(mockAuth.api.getSession).mockResolvedValue(sessionWithoutUser);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.session).toBe(sessionWithoutUser);
      expect(mockRequest.user).toBeNull();
    });

    it('should handle auth session check errors', async () => {
      vi.mocked(mockAuth.api.getSession).mockRejectedValue(new Error('Session check failed'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Session check failed');
    });

    it('should check both handler and class metadata for PUBLIC', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
      vi.mocked(mockAuth.api.getSession).mockResolvedValue(null);

      await guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('PUBLIC', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should check both handler and class metadata for OPTIONAL', async () => {
      vi.mocked(reflector.getAllAndOverride)
        .mockReturnValueOnce(false) // PUBLIC
        .mockReturnValueOnce(true); // OPTIONAL
      vi.mocked(mockAuth.api.getSession).mockResolvedValue(null);

      await guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenNthCalledWith(2, 'OPTIONAL', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });
  });
});