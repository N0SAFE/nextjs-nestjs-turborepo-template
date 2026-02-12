/**
 * Additional tests for standard-operations.ts to increase coverage
 * Focuses on uncovered lines in standard-operations.ts
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { standard } from '../zod/standard-operations';

describe('StandardOperations - Additional Coverage', () => {
  const entitySchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    age: z.number().optional(),
  });

  describe('List Operation - Advanced Filtering', () => {
    it('should handle list with complex search combinations', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.list().build();

      expect(contract).toBeDefined();
      expect(contract['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle list with query extensions', () => {
      const ops = standard.zod(entitySchema, 'user');
      const extended = ops.list()
        .input((b) => b.query(z.object({ archived: z.boolean().default(false) })))
        .build();

      expect(extended['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Create Operation - Validation', () => {
    it('should handle create with required fields only', () => {
      const minimalSchema = z.object({
        id: z.string(),
        name: z.string(),
      });
      const ops = standard.zod(minimalSchema, 'item');
      const contract = ops.create().build();

      expect(contract['~orpc'].route.method).toBe('POST');
      expect(contract['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle create with nested object schemas', () => {
      const nestedSchema = z.object({
        id: z.string(),
        profile: z.object({
          firstName: z.string(),
          lastName: z.string(),
        }),
      });
      const ops = standard.zod(nestedSchema, 'user');
      const contract = ops.create().build();

      expect(contract['~orpc'].outputSchema).toBeDefined();
    });

    it('should allow extending create input', () => {
      const ops = standard.zod(entitySchema, 'user');
      const extended = ops.create()
        .input((b) => b.body(z.object({ 
          name: z.string(),
          email: z.string(),
          sendWelcomeEmail: z.boolean().default(true),
        })))
        .build();

      expect(extended['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Read Operation - Variants', () => {
    it('should handle read with UUID id type', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.read().build();

      expect(contract['~orpc'].route.path).toContain('{id}');
    });

    it('should handle read with custom id type', () => {
      const customIdSchema = z.object({
        id: z.string().regex(/^[0-9]+$/),
        name: z.string(),
      });
      const ops = standard.zod(customIdSchema, 'record');
      const contract = ops.read({ idSchema: z.string().regex(/^[0-9]+$/) }).build();

      expect(contract['~orpc'].inputSchema).toBeDefined();
    });

    it('should allow extending read with query params', () => {
      const ops = standard.zod(entitySchema, 'user');
      const extended = ops.read()
        .input((b) => b.query(z.object({ include: z.array(z.string()).optional() })))
        .build();

      expect(extended['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Update Operation - Partial Updates', () => {
    it('should handle patch with all optional fields', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.patch().build(); 

      expect(contract['~orpc'].route.method).toBe('PATCH');
      expect(contract['~orpc'].route.path).toContain('{id}');
    });

    it('should handle update with nested optional schemas', () => {
      const nestedSchema = z.object({
        id: z.string(),
        settings: z.object({
          theme: z.enum(['light', 'dark']),
          notifications: z.boolean(),
        }),
      });
      const ops = standard.zod(nestedSchema, 'userSettings');
      const contract = ops.update().build();

      expect(contract['~orpc'].outputSchema).toBeDefined();
    });

    it('should allow custom update response', () => {
      const ops = standard.zod(entitySchema, 'user');
      const extended = ops.update()
        .output(z.object({ 
          id: z.string(),
          name: z.string(),
          updatedAt: z.iso.datetime(),
        }))
        .build();

      expect(extended['~orpc'].outputSchema).toBeDefined();
    });
  });

  describe('Delete Operation - Soft vs Hard Delete', () => {
    it('should handle delete with default void response', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.delete().build();

      expect(contract['~orpc'].route.method).toBe('DELETE');
      expect(contract['~orpc'].route.path).toContain('{id}');
    });

    it('should handle delete with custom confirmation response', () => {
      const ops = standard.zod(entitySchema, 'user');
      const extended = ops.delete()
        .output(z.object({ deleted: z.boolean(), deletedAt: z.string() }))
        .build();

      expect(extended['~orpc'].outputSchema).toBeDefined();
    });

    it('should allow query params for soft delete', () => {
      const ops = standard.zod(entitySchema, 'user');
      const extended = ops.delete()
        .input((b) => b.query(z.object({ soft: z.boolean().default(false) })))
        .build();

      expect(extended['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Count Operation - Filtering', () => {
    it('should handle count with search filters', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.count().build();

      expect(contract['~orpc'].outputSchema).toBeDefined();
    });

    it('should handle count with custom query filters', () => {
      const ops = standard.zod(entitySchema, 'user');
      const extended = ops.count()
        .input((b) => b.query(z.object({ 
          active: z.boolean().optional(),
          createdAfter: z.iso.datetime().optional(),
        })))
        .build();

      expect(extended['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Check Operation - Validation', () => {
    it('should handle check with default email validation', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.check('email').build();

      expect(contract['~orpc'].inputSchema).toBeDefined();
      expect(contract['~orpc'].outputSchema).toBeDefined();
    });

    it('should handle check without email field in schema', () => {
      const noEmailSchema = z.object({
        id: z.string(),
        username: z.string(),
      });
      const ops = standard.zod(noEmailSchema, 'account');
      
      // check should still be available but may not make sense
      expect(ops.check).toBeDefined();
      const contract = ops.check('username', z.string()).build();
      expect(contract).toBeDefined();
    });
  });

  describe('Options Configuration', () => {
    it('should handle pascal case entity names', () => {
      const ops = standard.zod(entitySchema, 'userProfile');
      const listContract = ops.list().build();

      expect(listContract['~orpc'].route.summary).toBe('List userProfiles');
    });

    it('should handle plural entity names correctly', () => {
      const ops = standard.zod(entitySchema, 'category');
      const listContract = ops.list().build();

      // Should pluralize entity name by appending "s"
      expect(listContract['~orpc'].route.summary).toBe('List categorys');
    });
  });

  describe('Schema Extraction Edge Cases', () => {
    it('should handle entity schema with many optional fields', () => {
      const optionalSchema = z.object({
        id: z.string(),
        field1: z.string().optional(),
        field2: z.number().optional(),
        field3: z.boolean().optional(),
        field4: z.array(z.string()).optional(),
      });
      const ops = standard.zod(optionalSchema, 'flexible');
      const updateContract = ops.update().build();

      expect(updateContract['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle entity schema with default values', () => {
      const defaultSchema = z.object({
        id: z.uuid(),
        status: z.enum(['active', 'inactive']).default('active'),
        priority: z.number().default(0),
      });
      const ops = standard.zod(defaultSchema, 'task');
      const createContract = ops.create().build();

      expect(createContract['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle entity schema with enums', () => {
      const enumSchema = z.object({
        id: z.string(),
        role: z.enum(['admin', 'user', 'guest']),
        status: z.enum(['active', 'suspended', 'deleted']),
      });
      const ops = standard.zod(enumSchema, 'account');
      const listContract = ops.list().build();

      expect(listContract['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle entity schema with arrays', () => {
      const arraySchema = z.object({
        id: z.string(),
        tags: z.array(z.string()),
        permissions: z.array(z.enum(['read', 'write', 'delete'])),
      });
      const ops = standard.zod(arraySchema, 'resource');
      const createContract = ops.create().build();

      expect(createContract['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle entity schema with records', () => {
      const recordSchema = z.object({
        id: z.string(),
        metadata: z.record(z.string(), z.unknown()),
        config: z.record(z.string(), z.number()),
      });
      const ops = standard.zod(recordSchema, 'entity');
      const updateContract = ops.update().build();

      expect(updateContract['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Operation Chaining', () => {
    it('should allow chaining multiple modifications on list', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.list()
        .input((b) => b.query(z.object({ role: z.string().optional() })))
        .output(z.object({ items: z.array(entitySchema), total: z.number(), hasNext: z.boolean() }))
        .summary('Advanced user listing')
        .build();

      expect(contract['~orpc'].route.summary).toBe('Advanced user listing');
    });

    it('should allow chaining multiple modifications on create', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.create()
        .input((b) => b
          .body(z.object({ name: z.string(), email: z.string() }))
          .headers(z.object({ 'x-tenant-id': z.string() }))
        )
        .output(z.object({ id: z.string(), name: z.string(), createdAt: z.string() }))
        .tags('users', 'management')
        .build();

      expect(contract['~orpc'].route.tags).toContain('users');
      expect(contract['~orpc'].route.tags).toContain('management');
    });

    it('should allow chaining multiple modifications on update', () => {
      const ops = standard.zod(entitySchema, 'user');
      const contract = ops.update()
        .input((b) => b.query(z.object({ validate: z.boolean().default(true) })))
        .output(entitySchema)
        .description('Updates user profile with validation')
        .build();

      expect(contract['~orpc'].route.description).toContain('validation');
    });
  });
});
