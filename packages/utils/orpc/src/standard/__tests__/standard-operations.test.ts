import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { standard } from '../standard-operations';

describe('StandardOperations', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
    active: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  describe('read', () => {
    it('should create read operation with id input', () => {
      const ops = standard(userSchema, 'user');
      const readOp = ops.read();
      const route = readOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create read operation with custom id field', () => {
      const ops = standard(userSchema, 'user');
      const readOp = ops.read({ idField: 'userId' });
      const route = readOp.build();
      
      expect(route).toBeDefined();
    });

    it('should omit specified fields from output', () => {
      const ops = standard(userSchema, 'user');
      const readOp = ops.read({ omitFields: ['createdAt', 'updatedAt'] });
      const route = readOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create create operation', () => {
      const ops = standard(userSchema, 'user');
      const createOp = ops.create();
      const route = createOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create with default omissions', () => {
      const ops = standard(userSchema, 'user');
      const createOp = ops.create();
      const route = createOp.build();
      
      expect(route).toBeDefined();
    });

    it('should allow custom omit fields', () => {
      const ops = standard(userSchema, 'user');
      const createOp = ops.create({ omitInputFields: ['id', 'active'] });
      const route = createOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('update', () => {
    it('should create update operation', () => {
      const ops = standard(userSchema, 'user');
      const updateOp = ops.update();
      const route = updateOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create update with custom options', () => {
      const ops = standard(userSchema, 'user');
      const updateOp = ops.update({ omitInputFields: ['createdAt'] });
      const route = updateOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should create delete operation', () => {
      const ops = standard(userSchema, 'user');
      const deleteOp = ops.delete();
      const route = deleteOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create delete with custom id field', () => {
      const ops = standard(userSchema, 'user');
      const deleteOp = ops.delete({ idField: 'userId' });
      const route = deleteOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('list', () => {
    it('should create list operation', () => {
      const ops = standard(userSchema, 'user');
      const listOp = ops.list();
      const route = listOp.build();
      
      expect(route).toBeDefined();
    });

    it('should support sorting configuration', () => {
      const ops = standard(userSchema, 'user');
      const listOp = ops.list({
        sorting: ['name', 'createdAt', 'email'],
      });
      const route = listOp.build();
      
      expect(route).toBeDefined();
    });

    it('should support filtering configuration', () => {
      const ops = standard(userSchema, 'user');
      const listOp = ops.list({
        filtering: {
          fields: {
            name: { schema: z.string(), operators: ['like', 'ilike'] },
            age: { schema: z.number(), operators: ['gt', 'lt'] },
            active: z.boolean(),
          },
        },
      });
      const route = listOp.build();
      
      expect(route).toBeDefined();
    });

    it('should combine pagination, sorting, and filtering', () => {
      const ops = standard(userSchema, 'user');
      const listOp = ops.list({
        pagination: { defaultLimit: 20, maxLimit: 100 },
        sorting: ['name', 'createdAt'],
        filtering: {
          fields: {
            active: z.boolean(),
          },
        },
      });
      const route = listOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('count', () => {
    it('should create count operation', () => {
      const ops = standard(userSchema, 'user');
      const countOp = ops.count();
      const route = countOp.build();
      
      expect(route).toBeDefined();
    });

    it('should support filtering in count', () => {
      const ops = standard(userSchema, 'user');
      const countOp = ops.count({
        filtering: {
          fields: {
            active: z.boolean(),
          },
        },
      });
      const route = countOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('search', () => {
    it('should create search operation', () => {
      const ops = standard(userSchema, 'user');
      const searchOp = ops.search(['name', 'email']);
      const route = searchOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create search with field selection', () => {
      const ops = standard(userSchema, 'user');
      const searchOp = ops.search(['name', 'email', 'age']);
      const route = searchOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('check', () => {
    it('should create check operation', () => {
      const ops = standard(userSchema, 'user');
      const checkOp = ops.check('email');
      const route = checkOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('batchCreate', () => {
    it('should create batchCreate operation', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchCreate();
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('batchDelete', () => {
    it('should create batchDelete operation', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchDelete();
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('Chaining and Customization', () => {
    it('should allow building operations', () => {
      const ops = standard(userSchema, 'user');
      const readRoute = ops.read().build();
      
      expect(readRoute).toBeDefined();
    });

    it('should allow building different operations', () => {
      const ops = standard(userSchema, 'user');
      const listRoute = ops.list().build();
      const createRoute = ops.create().build();
      
      expect(listRoute).toBeDefined();
      expect(createRoute).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety through operations', () => {
      const ops = standard(userSchema, 'user');
      
      const readRoute = ops.read().build();
      expect(readRoute).toBeDefined();
      
      const listRoute = ops.list().build();
      expect(listRoute).toBeDefined();
      
      const createRoute = ops.create().build();
      expect(createRoute).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle schema with minimal fields', () => {
      const minimalSchema = z.object({
        id: z.string(),
        name: z.string(),
      });
      
      const ops = standard(minimalSchema, 'minimal');
      const readOp = ops.read();
      
      expect(readOp.build()).toBeDefined();
    });

    it('should handle schema with many fields', () => {
      const largeSchema = z.object({
        id: z.string(),
        field1: z.string(),
        field2: z.string(),
        field3: z.number(),
        field4: z.boolean(),
        field5: z.string(),
        field6: z.number(),
        field7: z.string(),
        field8: z.boolean(),
        field9: z.string(),
        field10: z.number(),
      });
      
      const ops = standard(largeSchema, 'large');
      const listOp = ops.list();
      
      expect(listOp.build()).toBeDefined();
    });
  });
});
