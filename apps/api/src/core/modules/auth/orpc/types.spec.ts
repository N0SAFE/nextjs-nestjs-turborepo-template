import { describe, it, expect, beforeEach } from 'vitest';
import { assertAuthenticated, type ORPCAuthContext, type ORPCAuthenticatedContext } from './types';

describe('ORPC Auth Types', () => {
  let mockAuthenticatedContext: ORPCAuthContext;
  let mockUnauthenticatedContext: ORPCAuthContext;

  beforeEach(() => {
    mockAuthenticatedContext = {
      isLoggedIn: true,
      session: {
        id: 'session-123',
        userId: 'user-123',
        expiresAt: new Date('2025-12-31'),
        token: 'token-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        banned: false,
      },
      requireAuth: () => ({ session: {} as any, user: {} as any }),
      admin: {} as any,
      org: {} as any,
    };

    mockUnauthenticatedContext = {
      isLoggedIn: false,
      session: null,
      user: null,
      requireAuth: () => ({ session: {} as any, user: {} as any }),
      admin: {} as any,
      org: {} as any,
    };
  });

  describe('assertAuthenticated', () => {
    it('should return authenticated context when user is logged in', () => {
      const result = assertAuthenticated(mockAuthenticatedContext);

      expect(result).toBe(mockAuthenticatedContext);
      expect(result.isLoggedIn).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should narrow type to ORPCAuthenticatedContext', () => {
      const result: ORPCAuthenticatedContext = assertAuthenticated(mockAuthenticatedContext);

      // TypeScript should know these are non-null
      expect(result.session.id).toBe('session-123');
      expect(result.user.id).toBe('user-123');
      expect(result.isLoggedIn).toBe(true);
    });

    it('should throw error when user is not logged in', () => {
      expect(() => assertAuthenticated(mockUnauthenticatedContext))
        .toThrow('Auth context is not authenticated');
    });

    it('should throw error when session is null', () => {
      const partialContext = {
        ...mockAuthenticatedContext,
        session: null,
      };

      expect(() => assertAuthenticated(partialContext))
        .toThrow('Auth context is not authenticated');
    });

    it('should throw error when user is null', () => {
      const partialContext = {
        ...mockAuthenticatedContext,
        user: null,
      };

      expect(() => assertAuthenticated(partialContext))
        .toThrow('Auth context is not authenticated');
    });

    it('should throw error when isLoggedIn is false', () => {
      const partialContext = {
        ...mockAuthenticatedContext,
        isLoggedIn: false,
      };

      expect(() => assertAuthenticated(partialContext))
        .toThrow('Auth context is not authenticated');
    });
  });

  describe('Type guards', () => {
    it('should properly type-narrow authenticated context', () => {
      // Before assertion, types might be nullable
      const auth: ORPCAuthContext = mockAuthenticatedContext;
      
      // After assertion, types are non-null
      const authenticatedAuth = assertAuthenticated(auth);
      
      // TypeScript should allow these without null checks
      const sessionId: string = authenticatedAuth.session.id;
      const userId: string = authenticatedAuth.user.id;
      const isLoggedIn: true = authenticatedAuth.isLoggedIn;

      expect(sessionId).toBe('session-123');
      expect(userId).toBe('user-123');
      expect(isLoggedIn).toBe(true);
    });
  });
});
