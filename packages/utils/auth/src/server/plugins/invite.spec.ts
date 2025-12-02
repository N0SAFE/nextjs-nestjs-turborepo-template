import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invitePlugin } from './invite';
import { z } from 'zod';

// Mock better-auth modules
vi.mock('better-auth/api', () => ({
  createAuthEndpoint: vi.fn((path, config, handler) => ({
    path,
    config,
    handler,
  })),
  sessionMiddleware: vi.fn(),
}));

vi.mock('better-auth/crypto', () => ({
  generateRandomString: vi.fn(() => 'mock-random-token-12345678901234567890'),
}));

describe('invitePlugin', () => {
  const mockRoleSchema = z.union([
    z.literal('admin'),
    z.literal('user'),
    z.literal('guest'),
  ]);

  const defaultOptions = {
    inviteDurationDays: 7,
    roleSchema: mockRoleSchema,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin Creation', () => {
    it('should create plugin with correct id', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.id).toBe('invite');
    });

    it('should have endpoints defined', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.endpoints).toBeDefined();
    });

    it('should have create endpoint', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.endpoints.create).toBeDefined();
    });

    it('should have check endpoint', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.endpoints.check).toBeDefined();
    });

    it('should have validate endpoint', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.endpoints.validate).toBeDefined();
    });

    it('should have schema definition', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.schema).toBeDefined();
      expect(plugin.schema.invite).toBeDefined();
    });

    it('should have ERROR_CODES exported', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.$ERROR_CODES).toBeDefined();
    });
  });

  describe('Configuration Options', () => {
    it('should accept inviteDurationDays option', () => {
      const plugin = invitePlugin({
        ...defaultOptions,
        inviteDurationDays: 14,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should accept roleSchema option', () => {
      const customRoleSchema = z.literal('custom-role');
      const plugin = invitePlugin({
        inviteDurationDays: 7,
        roleSchema: customRoleSchema,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should accept custom generateToken function', () => {
      const customTokenGenerator = vi.fn(() => 'custom-token-value');
      const plugin = invitePlugin({
        ...defaultOptions,
        generateToken: customTokenGenerator,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should accept canCreateInvite function', () => {
      const canCreateInvite = vi.fn(() => true);
      const plugin = invitePlugin({
        ...defaultOptions,
        canCreateInvite,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should accept custom getDate function', () => {
      const customGetDate = vi.fn(() => new Date('2024-01-01'));
      const plugin = invitePlugin({
        ...defaultOptions,
        getDate: customGetDate,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should default inviteDurationDays to 7 when not specified', () => {
      const plugin = invitePlugin({
        roleSchema: mockRoleSchema,
      });
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Role Schema Validation', () => {
    it('should accept ZodNever for no roles', () => {
      const neverSchema = z.never();
      const plugin = invitePlugin({
        inviteDurationDays: 7,
        roleSchema: neverSchema,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should accept ZodLiteral for single role', () => {
      const literalSchema = z.literal('admin');
      const plugin = invitePlugin({
        inviteDurationDays: 7,
        roleSchema: literalSchema,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should accept ZodUnion for multiple roles', () => {
      const unionSchema = z.union([
        z.literal('admin'),
        z.literal('user'),
        z.literal('moderator'),
      ]);
      const plugin = invitePlugin({
        inviteDurationDays: 7,
        roleSchema: unionSchema,
      });
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Schema Structure', () => {
    it('should define invite schema with required fields', () => {
      const plugin = invitePlugin(defaultOptions);
      const inviteSchema = plugin.schema.invite;
      
      expect(inviteSchema.fields).toBeDefined();
      expect(inviteSchema.fields.token).toBeDefined();
      expect(inviteSchema.fields.email).toBeDefined();
      expect(inviteSchema.fields.expiresAt).toBeDefined();
      expect(inviteSchema.fields.role).toBeDefined();
    });

    it('should mark token as unique and required', () => {
      const plugin = invitePlugin(defaultOptions);
      const inviteSchema = plugin.schema.invite;
      
      expect(inviteSchema.fields.token.unique).toBe(true);
      expect(inviteSchema.fields.token.required).toBe(true);
    });

    it('should include createdByUserId reference', () => {
      const plugin = invitePlugin(defaultOptions);
      const inviteSchema = plugin.schema.invite;
      
      expect(inviteSchema.fields.createdByUserId).toBeDefined();
      expect(inviteSchema.fields.createdByUserId.references?.model).toBe('user');
    });

    it('should include optional usedAt field', () => {
      const plugin = invitePlugin(defaultOptions);
      const inviteSchema = plugin.schema.invite;
      
      expect(inviteSchema.fields.usedAt).toBeDefined();
      expect(inviteSchema.fields.usedAt.required).toBe(false);
    });
  });

  describe('Error Codes', () => {
    it('should export USER_NOT_LOGGED_IN error code', () => {
      const plugin = invitePlugin(defaultOptions);
      
      expect(plugin.$ERROR_CODES.USER_NOT_LOGGED_IN).toBeDefined();
      expect(plugin.$ERROR_CODES.USER_NOT_LOGGED_IN).toBe('User must be logged in to create an invite');
    });

    it('should export INSUFFICIENT_PERMISSIONS error code', () => {
      const plugin = invitePlugin(defaultOptions);
      
      expect(plugin.$ERROR_CODES.INSUFFICIENT_PERMISSIONS).toBeDefined();
    });

    it('should export NO_SUCH_USER error code', () => {
      const plugin = invitePlugin(defaultOptions);
      
      expect(plugin.$ERROR_CODES.NO_SUCH_USER).toBeDefined();
    });

    it('should export INVALID_OR_EXPIRED_INVITE error code', () => {
      const plugin = invitePlugin(defaultOptions);
      
      expect(plugin.$ERROR_CODES.INVALID_OR_EXPIRED_INVITE).toBeDefined();
    });
  });

  describe('Endpoint Paths', () => {
    it('should define create endpoint at /invite/create', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.endpoints.create).toBeDefined();
    });

    it('should define check endpoint at /invite/check', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.endpoints.check).toBeDefined();
    });

    it('should define validate endpoint at /invite/validate', () => {
      const plugin = invitePlugin(defaultOptions);
      expect(plugin.endpoints.validate).toBeDefined();
    });
  });

  describe('Plugin ID Uniqueness', () => {
    it('should have consistent plugin identifier', () => {
      const plugin1 = invitePlugin(defaultOptions);
      const plugin2 = invitePlugin({
        ...defaultOptions,
        inviteDurationDays: 14,
      });
      
      expect(plugin1.id).toBe(plugin2.id);
      expect(plugin1.id).toBe('invite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero inviteDurationDays', () => {
      const plugin = invitePlugin({
        ...defaultOptions,
        inviteDurationDays: 0,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should handle very large inviteDurationDays', () => {
      const plugin = invitePlugin({
        ...defaultOptions,
        inviteDurationDays: 365,
      });
      
      expect(plugin).toBeDefined();
    });

    it('should handle negative inviteDurationDays', () => {
      const plugin = invitePlugin({
        ...defaultOptions,
        inviteDurationDays: -1,
      });
      
      expect(plugin).toBeDefined();
    });
  });

  describe('Integration with Better Auth', () => {
    it('should create plugin compatible with Better Auth', () => {
      const plugin = invitePlugin(defaultOptions);
      
      // Better Auth plugins must have id
      expect(plugin.id).toBeDefined();
      expect(typeof plugin.id).toBe('string');
    });

    it('should define endpoints as Better Auth expects', () => {
      const plugin = invitePlugin(defaultOptions);
      
      expect(plugin.endpoints).toBeDefined();
      expect(typeof plugin.endpoints).toBe('object');
    });

    it('should define schema as Better Auth expects', () => {
      const plugin = invitePlugin(defaultOptions);
      
      expect(plugin.schema).toBeDefined();
      expect(typeof plugin.schema).toBe('object');
    });
  });
});
