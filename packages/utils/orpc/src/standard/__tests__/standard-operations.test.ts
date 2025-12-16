import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { StandardOperations, standard } from '../standard-operations';
import { RouteBuilder } from '../../builder/route-builder';
import { createPaginationConfigSchema } from '../../query/pagination';

describe('StandardOperations', () => {
  const userSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    age: z.number(),
    active: z.boolean(),
    status: z.enum(['active', 'inactive', 'pending']),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });

  describe('read', () => {
    it('should create read operation with id input', () => {
      const ops = standard(userSchema, 'user');
      const readOp = ops.read();
      const route = readOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('streamingRead', () => {
    it('should create streaming read operation', () => {
      const ops = standard(userSchema, 'user');
      const streamingReadOp = ops.streamingRead();
      const route = streamingReadOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create streaming read with custom path', () => {
      const ops = standard(userSchema, 'user');
      const streamingReadOp = ops.streamingRead({ path: '/{id}/live' });
      const route = streamingReadOp.build();
      
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
  });

  describe('update', () => {
    it('should create update operation', () => {
      const ops = standard(userSchema, 'user');
      const updateOp = ops.update();
      const route = updateOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('patch', () => {
    it('should create patch operation', () => {
      const ops = standard(userSchema, 'user');
      const patchOp = ops.patch();
      const route = patchOp.build();
      
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
        sorting: { fields: ['name', 'createdAt', 'email'] },
      });
      const route = listOp.build();
      
      expect(route).toBeDefined();
    });

    it('should support filtering configuration', () => {
      const ops = standard(userSchema, 'user');
      const listOp = ops.list({
        filtering: {
          fields: {
            name: z.string(),
            age: z.number(),
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
        sorting: { fields: ['name', 'createdAt'] },
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

  describe('listFrom', () => {
    it('should work without a RouteBuilder (schema-first API)', () => {
      const pagination = createPaginationConfigSchema({ includeCursor: true });

      const listFrom = StandardOperations.listFromSchemas(
        {
          method: 'GET',
          path: '/orgs/{orgId}/users',
        },
        z.object({ orgId: z.string() }),
        userSchema,
        { pagination }
      );

      const inputSchema = listFrom.getInputSchema();
      expect(inputSchema.safeParse({ orgId: 'acme', limit: 10 }).success).toBe(true);
      expect(inputSchema.safeParse({ limit: 10 }).success).toBe(false);

      const outputSchema = listFrom.getOutputSchema();
      expect(
        outputSchema.safeParse({
          data: [],
          meta: {
            total: 0,
            limit: 10,
            hasMore: false,
            offset: 0,
            nextCursor: null,
            prevCursor: null,
          },
        }).success
      ).toBe(true);
    });

    it('should merge base input and query input (QueryConfig / config schema)', () => {
      const base = new RouteBuilder(
        {
          method: 'GET',
          path: '/orgs/{orgId}/users',
        },
        z.object({ orgId: z.string() }),
        userSchema
      );

      const pagination = createPaginationConfigSchema({ includeCursor: true });
      const listFrom = StandardOperations.listFrom(base, { pagination });

      // Input should require orgId + limit (pagination input)
      const inputSchema = listFrom.getInputSchema();
      expect(inputSchema.safeParse({ orgId: 'acme', limit: 10 }).success).toBe(true);
      expect(inputSchema.safeParse({ limit: 10 }).success).toBe(false);

      // Output meta should include nextCursor/prevCursor when cursor pagination is enabled
      const outputSchema = listFrom.getOutputSchema();
      expect(
        outputSchema.safeParse({
          data: [],
          meta: {
            total: 0,
            limit: 10,
            hasMore: false,
            offset: 0,
            nextCursor: null,
            prevCursor: null,
          },
        }).success
      ).toBe(true);

      expect(
        outputSchema.safeParse({
          data: [],
          meta: {
            total: 0,
            limit: 10,
            hasMore: false,
            offset: 0,
          },
        }).success
      ).toBe(false);
    });

    it('should support legacy plain options (no embedded config symbol)', () => {
      const base = new RouteBuilder(
        {
          method: 'GET',
          path: '/orgs/{orgId}/users',
        },
        z.object({ orgId: z.string() }),
        userSchema
      );

      const listFrom = StandardOperations.listFrom(base, {
        pagination: { includeCursor: true, defaultLimit: 10, maxLimit: 100 },
      });

      const inputSchema = listFrom.getInputSchema();
      expect(inputSchema.safeParse({ orgId: 'acme', limit: 10 }).success).toBe(true);

      const outputSchema = listFrom.getOutputSchema();
      expect(
        outputSchema.safeParse({
          data: [],
          meta: {
            total: 0,
            limit: 10,
            hasMore: false,
            offset: 0,
            nextCursor: null,
            prevCursor: null,
          },
        }).success
      ).toBe(true);
    });
  });

  describe('streamingList', () => {
    it('should create streaming list operation', () => {
      const ops = standard(userSchema, 'user');
      const streamingListOp = ops.streamingList();
      const route = streamingListOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create streaming list with options', () => {
      const ops = standard(userSchema, 'user');
      const streamingListOp = ops.streamingList({
        pagination: { defaultLimit: 50 },
        sorting: { fields: ['name', 'createdAt'] },
      });
      const route = streamingListOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create streaming list with custom path', () => {
      const ops = standard(userSchema, 'user');
      const streamingListOp = ops.streamingList({ path: '/live' });
      const route = streamingListOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create streaming list with filtering', () => {
      const ops = standard(userSchema, 'user');
      const streamingListOp = ops.streamingList({
        filtering: {
          fields: {
            active: z.boolean(),
            status: z.string(),
          },
        },
      });
      const route = streamingListOp.build();
      
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
  });

  describe('search', () => {
    it('should create search operation', () => {
      const ops = standard(userSchema, 'user');
      const searchOp = ops.search();
      const route = searchOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create search with specific fields', () => {
      const ops = standard(userSchema, 'user');
      const searchOp = ops.search({ searchFields: ['name', 'email'] });
      const route = searchOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create search with pagination', () => {
      const ops = standard(userSchema, 'user');
      const searchOp = ops.search({ pagination: { defaultLimit: 50 } });
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

    it('should create check with custom schema', () => {
      const ops = standard(userSchema, 'user');
      const checkOp = ops.check('name', z.string().min(3));
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

    it('should create batchCreate with custom max size', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchCreate({ maxBatchSize: 50 });
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

    it('should create batchDelete with custom max size', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchDelete({ maxBatchSize: 25 });
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('batchRead', () => {
    it('should create batchRead operation', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchRead();
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create batchRead with custom max size', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchRead({ maxBatchSize: 200 });
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('batchUpdate', () => {
    it('should create batchUpdate operation', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchUpdate();
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create batchUpdate with custom max size', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchUpdate({ maxBatchSize: 30 });
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('exists', () => {
    it('should create exists operation', () => {
      const ops = standard(userSchema, 'user');
      const existsOp = ops.exists();
      const route = existsOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('upsert', () => {
    it('should create upsert operation', () => {
      const ops = standard(userSchema, 'user');
      const upsertOp = ops.upsert();
      const route = upsertOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create upsert with unique field', () => {
      const ops = standard(userSchema, 'user');
      const upsertOp = ops.upsert({ uniqueField: 'email' });
      const route = upsertOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create upsert with custom path', () => {
      const ops = standard(userSchema, 'user');
      const upsertOp = ops.upsert({ path: '/create-or-update' });
      const route = upsertOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('batchUpsert', () => {
    it('should create batchUpsert operation', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchUpsert();
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create batchUpsert with options', () => {
      const ops = standard(userSchema, 'user');
      const batchOp = ops.batchUpsert({
        maxBatchSize: 50,
        uniqueField: 'email',
      });
      const route = batchOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should create validate operation', () => {
      const ops = standard(userSchema, 'user');
      const validateOp = ops.validate();
      const route = validateOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('archive', () => {
    it('should create archive operation', () => {
      const ops = standard(userSchema, 'user');
      const archiveOp = ops.archive();
      const route = archiveOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('restore', () => {
    it('should create restore operation', () => {
      const ops = standard(userSchema, 'user');
      const restoreOp = ops.restore();
      const route = restoreOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('clone', () => {
    it('should create clone operation', () => {
      const ops = standard(userSchema, 'user');
      const cloneOp = ops.clone();
      const route = cloneOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('history', () => {
    it('should create history operation', () => {
      const ops = standard(userSchema, 'user');
      const historyOp = ops.history();
      const route = historyOp.build();
      
      expect(route).toBeDefined();
    });
  });

  describe('distinct', () => {
    it('should create distinct operation', () => {
      const ops = standard(userSchema, 'user');
      const distinctOp = ops.distinct('status');
      const route = distinctOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create distinct for different fields', () => {
      const ops = standard(userSchema, 'user');
      
      const distinctName = ops.distinct('name').build();
      const distinctActive = ops.distinct('active').build();
      
      expect(distinctName).toBeDefined();
      expect(distinctActive).toBeDefined();
    });
  });

  describe('streamingSearch', () => {
    it('should create streaming search operation', () => {
      const ops = standard(userSchema, 'user');
      const streamingSearchOp = ops.streamingSearch();
      const route = streamingSearchOp.build();
      
      expect(route).toBeDefined();
    });

    it('should create streaming search with options', () => {
      const ops = standard(userSchema, 'user');
      const streamingSearchOp = ops.streamingSearch({
        searchFields: ['name', 'email'],
        pagination: { defaultLimit: 30 },
      });
      const route = streamingSearchOp.build();
      
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

    it('should allow using input and output builders', () => {
      const ops = standard(userSchema, 'user');
      const createRoute = ops.create()
        .inputBuilder.omit(['id', 'createdAt', 'updatedAt'])
        .build();
      
      expect(createRoute).toBeDefined();
    });

    it('should allow using output builder', () => {
      const ops = standard(userSchema, 'user');
      const readRoute = ops.read()
        .outputBuilder.omit(['createdAt', 'updatedAt'])
        .build();
      
      expect(readRoute).toBeDefined();
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

    it('should maintain type safety through batch operations', () => {
      const ops = standard(userSchema, 'user');
      
      const batchRead = ops.batchRead().build();
      const batchCreate = ops.batchCreate().build();
      const batchUpdate = ops.batchUpdate().build();
      const batchDelete = ops.batchDelete().build();
      const batchUpsert = ops.batchUpsert().build();
      
      expect(batchRead).toBeDefined();
      expect(batchCreate).toBeDefined();
      expect(batchUpdate).toBeDefined();
      expect(batchDelete).toBeDefined();
      expect(batchUpsert).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle schema with minimal fields', () => {
      const minimalSchema = z.object({
        id: z.uuid(),
        name: z.string(),
      });
      
      const ops = standard(minimalSchema, 'minimal');
      
      expect(ops.read().build()).toBeDefined();
      expect(ops.create().build()).toBeDefined();
      expect(ops.update().build()).toBeDefined();
      expect(ops.delete().build()).toBeDefined();
      expect(ops.list().build()).toBeDefined();
    });

    it('should handle schema with many fields', () => {
      const largeSchema = z.object({
        id: z.uuid(),
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

    it('should handle all streaming operations', () => {
      const ops = standard(userSchema, 'user');
      
      expect(ops.streamingRead().build()).toBeDefined();
      expect(ops.streamingList().build()).toBeDefined();
      expect(ops.streamingSearch().build()).toBeDefined();
    });

    it('should handle all lifecycle operations', () => {
      const ops = standard(userSchema, 'user');
      
      expect(ops.archive().build()).toBeDefined();
      expect(ops.restore().build()).toBeDefined();
      expect(ops.clone().build()).toBeDefined();
      expect(ops.history().build()).toBeDefined();
    });
  });

  describe('Complete API Coverage', () => {
    it('should have all CRUD operations', () => {
      const ops = standard(userSchema, 'user');
      
      // Basic CRUD
      expect(typeof ops.read).toBe('function');
      expect(typeof ops.create).toBe('function');
      expect(typeof ops.update).toBe('function');
      expect(typeof ops.patch).toBe('function');
      expect(typeof ops.delete).toBe('function');
    });

    it('should have all query operations', () => {
      const ops = standard(userSchema, 'user');
      
      expect(typeof ops.list).toBe('function');
      expect(typeof ops.count).toBe('function');
      expect(typeof ops.search).toBe('function');
      expect(typeof ops.check).toBe('function');
      expect(typeof ops.exists).toBe('function');
      expect(typeof ops.distinct).toBe('function');
    });

    it('should have all batch operations', () => {
      const ops = standard(userSchema, 'user');
      
      expect(typeof ops.batchRead).toBe('function');
      expect(typeof ops.batchCreate).toBe('function');
      expect(typeof ops.batchUpdate).toBe('function');
      expect(typeof ops.batchDelete).toBe('function');
      expect(typeof ops.batchUpsert).toBe('function');
    });

    it('should have all streaming operations', () => {
      const ops = standard(userSchema, 'user');
      
      expect(typeof ops.streamingRead).toBe('function');
      expect(typeof ops.streamingList).toBe('function');
      expect(typeof ops.streamingSearch).toBe('function');
    });

    it('should have all lifecycle operations', () => {
      const ops = standard(userSchema, 'user');
      
      expect(typeof ops.upsert).toBe('function');
      expect(typeof ops.validate).toBe('function');
      expect(typeof ops.archive).toBe('function');
      expect(typeof ops.restore).toBe('function');
      expect(typeof ops.clone).toBe('function');
      expect(typeof ops.history).toBe('function');
    });
  });
});
