import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { SchemaBuilder } from '../schema-builder';

describe('SchemaBuilder', () => {
  const baseSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    age: z.number(),
    active: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });

  describe('Basic Operations', () => {
    it('should create a schema builder with initial schema', () => {
      const builder = new SchemaBuilder(baseSchema);
      const schema = builder.build();
      
      expect(schema).toBeDefined();
      expect(schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })).toBeDefined();
    });

    it('should build and return the schema', () => {
      const builder = new SchemaBuilder(baseSchema);
      const schema = builder.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.id).toBe('123');
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
    });

    it('should allow custom schema modification', () => {
      const builder = new SchemaBuilder(baseSchema);
      const modified = builder.custom((schema) => 
        schema.extend({ role: z.string().default('user') })
      );
      
      const schema = modified.build();
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.role).toBe('user');
    });
  });

  describe('Pick Operations', () => {
    it('should pick specific fields', () => {
      const builder = new SchemaBuilder(baseSchema);
      const picked = builder.pick(['name', 'email']);
      const schema = picked.build();
      
      const result = schema.parse({
        name: 'John',
        email: 'john@example.com',
      });
      
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect('id' in result).toBe(false);
    });

    it('should pick single field', () => {
      const builder = new SchemaBuilder(baseSchema);
      const picked = builder.pick(['name']);
      const schema = picked.build();
      
      const result = schema.parse({ name: 'John' });
      expect(result.name).toBe('John');
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('Omit Operations', () => {
    it('should omit specific fields', () => {
      const builder = new SchemaBuilder(baseSchema);
      const omitted = builder.omit(['createdAt', 'updatedAt']);
      const schema = omitted.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
      });
      
      expect(result.id).toBe('123');
      expect('createdAt' in result).toBe(false);
      expect('updatedAt' in result).toBe(false);
    });

    it('should omit single field', () => {
      const builder = new SchemaBuilder(baseSchema);
      const omitted = builder.omit(['id']);
      const schema = omitted.build();
      
      const result = schema.parse({
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect('id' in result).toBe(false);
      expect(result.name).toBe('John');
    });
  });

  describe('Extend Operations', () => {
    it('should extend schema with new fields', () => {
      const builder = new SchemaBuilder(baseSchema);
      const extended = builder.extend({
        role: z.string(),
        department: z.string(),
      });
      const schema = extended.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        role: 'admin',
        department: 'IT',
      });
      
      expect(result.role).toBe('admin');
      expect(result.department).toBe('IT');
    });

    it('should override existing fields with extend', () => {
      const builder = new SchemaBuilder(baseSchema);
      const extended = builder.extend({
        age: z.number().min(18),
      });
      const schema = extended.build();
      
      expect(() => schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 15,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })).toThrow();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 25,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.age).toBe(25);
    });
  });

  describe('Merge Operations', () => {
    it('should merge with another schema', () => {
      const builder = new SchemaBuilder(baseSchema);
      const otherSchema = z.object({
        role: z.string(),
        permissions: z.array(z.string()),
      });
      
      const merged = builder.merge(otherSchema);
      const schema = merged.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        role: 'admin',
        permissions: ['read', 'write'],
      });
      
      expect(result.role).toBe('admin');
      expect(result.permissions).toEqual(['read', 'write']);
    });
  });

  describe('Partial Operations', () => {
    it('should make all fields optional', () => {
      const builder = new SchemaBuilder(baseSchema);
      const partial = builder.partial();
      const schema = partial.build();
      
      const result = schema.parse({ name: 'John' });
      expect(result.name).toBe('John');
      expect(result.id).toBeUndefined();
    });

    it('should make specific fields optional', () => {
      const builder = new SchemaBuilder(baseSchema);
      const partial = builder.partial(['age', 'active']);
      const schema = partial.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.name).toBe('John');
      expect(result.age).toBeUndefined();
      expect(result.active).toBeUndefined();
    });

    it('should still require non-partial fields when using partial with keys', () => {
      const builder = new SchemaBuilder(baseSchema);
      const partial = builder.partial(['age', 'active']);
      const schema = partial.build();
      
      // Should throw because 'name' is still required
      expect(() => schema.parse({
        id: '123',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })).toThrow();
    });

    it('should allow partial fields to have values when provided', () => {
      const builder = new SchemaBuilder(baseSchema);
      const partial = builder.partial(['age', 'active']);
      const schema = partial.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 25,
        active: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.age).toBe(25);
      expect(result.active).toBe(false);
    });

    it('should handle partial with single field', () => {
      const builder = new SchemaBuilder(baseSchema);
      const partial = builder.partial(['email']);
      const schema = partial.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.email).toBeUndefined();
      expect(result.name).toBe('John');
    });

    it('should handle partial with empty array (all fields remain required)', () => {
      const builder = new SchemaBuilder(baseSchema);
      const partial = builder.partial([]);
      const schema = partial.build();
      
      // With empty array, no fields become optional - all remain required
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.name).toBe('John');
    });
  });

  describe('Required Operations', () => {
    it('should make all optional fields required', () => {
      const optionalSchema = z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      });
      
      const builder = new SchemaBuilder(optionalSchema);
      const required = builder.required();
      const schema = required.build();
      
      expect(() => schema.parse({ name: 'John' })).toThrow();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
      });
      
      expect(result.id).toBe('123');
    });

    it('should make specific fields required', () => {
      const optionalSchema = z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      });
      
      const builder = new SchemaBuilder(optionalSchema);
      const required = builder.required(['id', 'name']);
      const schema = required.build();
      
      expect(() => schema.parse({ id: '123' })).toThrow();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
      });
      
      expect(result.id).toBe('123');
      expect(result.name).toBe('John');
    });

    it('should keep non-specified fields optional when using required with keys', () => {
      const optionalSchema = z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      });
      
      const builder = new SchemaBuilder(optionalSchema);
      const required = builder.required(['id', 'name']);
      const schema = required.build();
      
      // email and phone should remain optional
      const result = schema.parse({
        id: '123',
        name: 'John',
      });
      
      expect(result.id).toBe('123');
      expect(result.name).toBe('John');
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });

    it('should handle required with nullable fields', () => {
      const nullableSchema = z.object({
        id: z.string().nullable(),
        name: z.string().nullable(),
      });
      
      const builder = new SchemaBuilder(nullableSchema);
      const required = builder.required(['id']);
      const schema = required.build();
      
      // id should no longer accept null
      expect(() => schema.parse({ id: null, name: 'John' })).toThrow();
      
      // name should still accept null
      const result = schema.parse({
        id: '123',
        name: null,
      });
      
      expect(result.id).toBe('123');
      expect(result.name).toBeNull();
    });

    it('should handle required with single field', () => {
      const optionalSchema = z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      });
      
      const builder = new SchemaBuilder(optionalSchema);
      const required = builder.required(['email']);
      const schema = required.build();
      
      // email is required, others are still optional
      expect(() => schema.parse({ id: '123', name: 'John' })).toThrow();
      
      const result = schema.parse({
        email: 'john@example.com',
      });
      
      expect(result.email).toBe('john@example.com');
      expect(result.id).toBeUndefined();
    });

    it('should handle required with empty array (uses native required)', () => {
      const optionalSchema = z.object({
        id: z.string().optional(),
        name: z.string().optional(),
      });
      
      const builder = new SchemaBuilder(optionalSchema);
      const required = builder.required([]);
      const schema = required.build();
      
      // With empty array, no specific fields to make required, 
      // but the native required() is called which makes all fields required
      const result = schema.parse({
        id: '123',
        name: 'John',
      });
      expect(result.id).toBe('123');
      expect(result.name).toBe('John');
    });
  });

  describe('Default Operations', () => {
    it('should add default values to fields', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          role: z.string(),
        })
      );
      
      const withDefaults = builder.addDefaults({
        role: 'user',
      });
      const schema = withDefaults.build();
      
      const result = schema.parse({ name: 'John' });
      expect(result.name).toBe('John');
      expect(result.role).toBe('user');
    });

    it('should not override provided values', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          role: z.string(),
        })
      );
      
      const withDefaults = builder.addDefaults({
        role: 'user',
      });
      const schema = withDefaults.build();
      
      const result = schema.parse({ name: 'John', role: 'admin' });
      expect(result.role).toBe('admin');
    });

    it('should add multiple default values', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          role: z.string(),
          status: z.string(),
          priority: z.number(),
        })
      );
      
      const withDefaults = builder.addDefaults({
        role: 'user',
        status: 'active',
        priority: 1,
      });
      const schema = withDefaults.build();
      
      const result = schema.parse({ name: 'John' });
      expect(result.name).toBe('John');
      expect(result.role).toBe('user');
      expect(result.status).toBe('active');
      expect(result.priority).toBe(1);
    });

    it('should work with boolean default values', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          active: z.boolean(),
          verified: z.boolean(),
        })
      );
      
      const withDefaults = builder.addDefaults({
        active: true,
        verified: false,
      });
      const schema = withDefaults.build();
      
      const result = schema.parse({ name: 'John' });
      expect(result.active).toBe(true);
      expect(result.verified).toBe(false);
    });

    it('should work with array default values', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          tags: z.array(z.string()),
        })
      );
      
      const withDefaults = builder.addDefaults({
        tags: ['default'],
      });
      const schema = withDefaults.build();
      
      const result = schema.parse({ name: 'John' });
      expect(result.tags).toEqual(['default']);
    });

    it('should work with object default values', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          settings: z.object({
            theme: z.string(),
            notifications: z.boolean(),
          }),
        })
      );
      
      const withDefaults = builder.addDefaults({
        settings: { theme: 'dark', notifications: true },
      });
      const schema = withDefaults.build();
      
      const result = schema.parse({ name: 'John' });
      expect(result.settings).toEqual({ theme: 'dark', notifications: true });
    });

    it('should preserve fields without defaults', () => {
      const builder = new SchemaBuilder(
        z.object({
          id: z.string(),
          name: z.string(),
          role: z.string(),
        })
      );
      
      const withDefaults = builder.addDefaults({
        role: 'user',
      });
      const schema = withDefaults.build();
      
      // id and name are still required
      expect(() => schema.parse({ name: 'John' })).toThrow();
      
      const result = schema.parse({ id: '123', name: 'John' });
      expect(result.id).toBe('123');
      expect(result.name).toBe('John');
      expect(result.role).toBe('user');
    });

    it('should chain addDefaults with other operations', () => {
      const builder = new SchemaBuilder(baseSchema);
      const schema = builder
        .pick(['name', 'email', 'active'])
        .addDefaults({ active: true })
        .build();
      
      const result = schema.parse({
        name: 'John',
        email: 'john@example.com',
      });
      
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.active).toBe(true);
    });
  });

  describe('Nullish Operations', () => {
    it('should make fields accept null and undefined', () => {
      const builder = new SchemaBuilder(baseSchema);
      const nullish = builder.nullish(['age', 'active']);
      const schema = nullish.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: null,
        active: undefined,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(result.age).toBeNull();
      expect(result.active).toBeUndefined();
    });

    it('should keep non-nullish fields required', () => {
      const builder = new SchemaBuilder(
        z.object({
          id: z.string(),
          name: z.string(),
          nickname: z.string(),
        })
      );
      
      const nullishSchema = builder.nullish(['nickname']);
      const schema = nullishSchema.build();
      
      // id and name are still required
      expect(() => schema.parse({ nickname: null })).toThrow();
      expect(() => schema.parse({ name: 'John', nickname: null })).toThrow();
      
      // Valid with all required fields
      const result = schema.parse({ id: '123', name: 'John', nickname: null });
      expect(result.id).toBe('123');
      expect(result.name).toBe('John');
      expect(result.nickname).toBeNull();
    });

    it('should still accept normal values for nullish fields', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          nickname: z.string(),
        })
      );
      
      const nullishSchema = builder.nullish(['nickname']);
      const schema = nullishSchema.build();
      
      const result = schema.parse({ name: 'John', nickname: 'Johnny' });
      expect(result.nickname).toBe('Johnny');
    });

    it('should handle multiple nullish fields', () => {
      const builder = new SchemaBuilder(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          phone: z.string(),
        })
      );
      
      const nullishSchema = builder.nullish(['email', 'phone']);
      const schema = nullishSchema.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: null,
        // phone not provided - will be undefined
      });
      
      expect(result.id).toBe('123');
      expect(result.name).toBe('John');
      expect(result.email).toBeNull();
      expect(result.phone).toBeUndefined();
    });

    it('should handle nullish with single field', () => {
      const builder = new SchemaBuilder(
        z.object({
          id: z.string(),
          description: z.string(),
        })
      );
      
      const nullishSchema = builder.nullish(['description']);
      const schema = nullishSchema.build();
      
      // All variants should work
      expect(schema.parse({ id: '1', description: 'Hello' }).description).toBe('Hello');
      expect(schema.parse({ id: '1', description: null }).description).toBeNull();
      expect(schema.parse({ id: '1', description: undefined }).description).toBeUndefined();
      expect(schema.parse({ id: '1' }).description).toBeUndefined();
    });

    it('should work with already optional fields', () => {
      const builder = new SchemaBuilder(
        z.object({
          name: z.string(),
          nickname: z.string().optional(),
        })
      );
      
      const nullishSchema = builder.nullish(['nickname']);
      const schema = nullishSchema.build();
      
      // Should now also accept null
      const result = schema.parse({ name: 'John', nickname: null });
      expect(result.nickname).toBeNull();
    });

    it('should chain nullish with other operations', () => {
      const builder = new SchemaBuilder(baseSchema);
      const schema = builder
        .pick(['name', 'email', 'active'])
        .nullish(['email'])
        .build();
      
      // Valid cases
      const result1 = schema.parse({
        name: 'John',
        email: null,
        active: true,
      });
      expect(result1.email).toBeNull();
      
      const result2 = schema.parse({
        name: 'John',
        active: false,
      });
      expect(result2.email).toBeUndefined();
    });

    it('should work with different field types', () => {
      const builder = new SchemaBuilder(
        z.object({
          id: z.string(),
          count: z.number(),
          active: z.boolean(),
          tags: z.array(z.string()),
        })
      );
      
      const nullishSchema = builder.nullish(['count', 'active', 'tags']);
      const schema = nullishSchema.build();
      
      const result = schema.parse({
        id: '123',
        count: null,
        active: null,
        tags: null,
      });
      
      expect(result.id).toBe('123');
      expect(result.count).toBeNull();
      expect(result.active).toBeNull();
      expect(result.tags).toBeNull();
    });
  });

  describe('Chaining Operations', () => {
    it('should chain multiple operations', () => {
      const builder = new SchemaBuilder(baseSchema);
      const chained = builder
        .omit(['id', 'createdAt', 'updatedAt'])
        .extend({ role: z.string() })
        .partial(['age', 'active'])
        .addDefaults({ role: 'user', active: true });
      
      const schema = chained.build();
      
      const result = schema.parse({
        name: 'John',
        email: 'john@example.com',
      });
      
      expect(result.name).toBe('John');
      expect(result.role).toBe('user');
      expect(result.active).toBe(true);
      expect(result.age).toBeUndefined();
      expect('id' in result).toBe(false);
    });

    it('should chain pick, extend, and custom', () => {
      const builder = new SchemaBuilder(baseSchema);
      const chained = builder
        .pick(['name', 'email'])
        .extend({ verified: z.boolean() })
        .custom((schema) => schema.extend({ timestamp: z.number().default(Date.now) }));
      
      const schema = chained.build();
      
      const result = schema.parse({
        name: 'John',
        email: 'john@example.com',
        verified: true,
      });
      
      expect(result.name).toBe('John');
      expect(result.verified).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pick', () => {
      const builder = new SchemaBuilder(baseSchema);
      const picked = builder.pick([]);
      const schema = picked.build();
      
      const result = schema.parse({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle empty omit (returns all)', () => {
      const builder = new SchemaBuilder(baseSchema);
      const omitted = builder.omit([]);
      const schema = omitted.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(Object.keys(result)).toHaveLength(7);
    });

    it('should handle empty extend', () => {
      const builder = new SchemaBuilder(baseSchema);
      const extended = builder.extend({});
      const schema = extended.build();
      
      const result = schema.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      
      expect(Object.keys(result)).toHaveLength(7);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety after transformations', () => {
      const builder = new SchemaBuilder(baseSchema);
      const transformed = builder
        .pick(['name', 'email'])
        .extend({ role: z.string() });
      
      const schema = transformed.build();
      
      // Should parse correctly with proper types
      const result = schema.parse({
        name: 'John',
        email: 'john@example.com',
        role: 'admin',
      });
      
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result).not.toHaveProperty('id');
    });
  });
});
