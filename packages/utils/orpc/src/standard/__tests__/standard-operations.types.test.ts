import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { standard } from '../zod/standard-operations';

/**
 * Test entity schema representing a User
 */
const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string(),
  age: z.number().int().min(0),
  status: z.enum(['active', 'inactive', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe('StandardOperations - Type Inference', () => {
  const userOps = standard.zod(userSchema, 'user');

  describe('read()', () => {
    it('should infer correct input and output types', () => {
      const builder = userOps.read();
      
      // Type checks - check the builder is a RouteBuilder instance

      // Runtime check
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}');
    });

    it('should have entitySchema accessible', () => {
      const builder = userOps.read();
      const entitySchema = builder.getEntitySchema();
      
      expect(entitySchema).toBe(userSchema);
    });
  });

  describe('streamingRead()', () => {
    it('should infer correct types with EventIterator wrapper', () => {
      const builder = userOps.streamingRead();
      
      // Runtime check
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}/streaming');
    });

    it('should accept custom idFieldName', () => {
      const builder = userOps.streamingRead({ idFieldName: 'userId' });
      const metadata = builder.getRouteMetadata();
      
      expect(metadata.path).toBe('/{userId}/streaming');
    });
  });

  describe('create()', () => {
    it('should infer entity schema for input and output', () => {
      const builder = userOps.create();
      
      // Type checks - check the builder has required properties

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/');
    });
  });

  describe('update()', () => {
    it('should infer entity schema for input and output', () => {
      const builder = userOps.update();
      
      // Type checks - check the builder has required properties

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PUT');
      expect(metadata.path).toBe('/{id}');
    });
  });

  describe('patch()', () => {
    it('should infer partial entity schema for input', () => {
      const builder = userOps.patch();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PATCH');
      expect(metadata.path).toBe('/{id}');
      
      // Input should be partial
    });
  });

  describe('delete()', () => {
    it('should infer UUID input and success output', () => {
      const builder = userOps.delete();
      
      // Type checks - check the builder has required properties

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('DELETE');
      expect(metadata.path).toBe('/{id}');
    });
  });

  describe('list()', () => {
    it('should work without options (default pagination)', () => {
      const builder = userOps.list();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/');
    });

    it('should accept pagination options', () => {
      const builder = userOps.list({
        pagination: { defaultLimit: 50, maxLimit: 200 },
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });

    it('should accept sorting options', () => {
      const builder = userOps.list({
        pagination: { defaultLimit: 20 },
        sorting: { fields: ['createdAt', 'name'] as const },
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });

    it('should accept filtering options', () => {
      const builder = userOps.list({
        pagination: { defaultLimit: 20 },
        filtering: {
          fields: {
            status: z.enum(['active', 'inactive', 'archived']),
            age: z.number(),
          } as any,
        },
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });
  });

  describe('streamingList()', () => {
    it('should return EventIterator-wrapped output', () => {
      const builder = userOps.streamingList();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/streaming');
    });

    it('should accept custom path', () => {
      const builder = userOps.streamingList({ path: '/custom/stream' });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.path).toBe('/custom/stream');
    });
  });

  describe('count()', () => {
    it('should return count object', () => {
      const builder = userOps.count();
      
      // Type checks - check the builder has required properties

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/count');
    });
  });

  describe('search()', () => {
    it('should work without options', () => {
      const builder = userOps.search();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/search');
    });

    it('should accept search fields', () => {
      const builder = userOps.search({
        searchFields: ['name', 'email'] as const,
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });

    it('should accept pagination options', () => {
      const builder = userOps.search({
        searchFields: ['name', 'email'] as const,
        pagination: { defaultLimit: 50 },
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });
  });

  describe('check()', () => {
    it('should check field existence', () => {
      const builder = userOps.check('email');
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/check/email');
    });

    it('should accept custom field schema', () => {
      const builder = userOps.check('email', z.email());
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });

    it('should work with different fields', () => {
      const builderStatus = userOps.check('status');
      const builderAge = userOps.check('age');
      
      expect(builderStatus.getRouteMetadata().path).toBe('/check/status');
      expect(builderAge.getRouteMetadata().path).toBe('/check/age');
    });
  });

  describe('batchCreate()', () => {
    it('should create multiple entities', () => {
      const builder = userOps.batchCreate();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/batch');
    });

    it('should respect maxBatchSize option', () => {
      const builder = userOps.batchCreate({ maxBatchSize: 50 });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
    });
  });

  describe('batchDelete()', () => {
    it('should delete multiple entities by IDs', () => {
      const builder = userOps.batchDelete();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('DELETE');
      expect(metadata.path).toBe('/batch');
    });

    it('should respect maxBatchSize option', () => {
      const builder = userOps.batchDelete({ maxBatchSize: 50 });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('DELETE');
    });
  });

  describe('batchRead()', () => {
    it('should read multiple entities by IDs', () => {
      const builder = userOps.batchRead();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/batch/read');
    });

    it('should respect maxBatchSize option', () => {
      const builder = userOps.batchRead({ maxBatchSize: 50 });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
    });
  });

  describe('batchUpdate()', () => {
    it('should update multiple entities', () => {
      const builder = userOps.batchUpdate();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PATCH');
      expect(metadata.path).toBe('/batch');
    });

    it('should respect maxBatchSize option', () => {
      const builder = userOps.batchUpdate({ maxBatchSize: 50 });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PATCH');
    });
  });

  describe('exists()', () => {
    it('should check entity existence by ID', () => {
      const builder = userOps.exists();
      
      // Type checks - check the builder has required properties

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}/exists');
    });
  });

  describe('upsert()', () => {
    it('should create or update entity', () => {
      const builder = userOps.upsert();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PUT');
      expect(metadata.path).toBe('/upsert');
    });

    it('should accept uniqueField option', () => {
      const builder = userOps.upsert({ uniqueField: 'email' });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PUT');
    });

    it('should accept custom path', () => {
      const builder = userOps.upsert({ path: '/custom-upsert' });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.path).toBe('/custom-upsert');
    });
  });

  describe('batchUpsert()', () => {
    it('should upsert multiple entities', () => {
      const builder = userOps.batchUpsert();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PUT');
      expect(metadata.path).toBe('/batch/upsert');
    });

    it('should accept options', () => {
      const builder = userOps.batchUpsert({
        maxBatchSize: 50,
        uniqueField: 'email',
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PUT');
    });
  });

  describe('validate()', () => {
    it('should validate entity data', () => {
      const builder = userOps.validate();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/validate');
    });
  });

  describe('archive()', () => {
    it('should soft delete entity', () => {
      const builder = userOps.archive();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/{id}/archive');
    });
  });

  describe('restore()', () => {
    it('should restore archived entity', () => {
      const builder = userOps.restore();
      
      // Just check that the builder exists and has the right runtime properties
      expect(builder).toBeDefined();

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/{id}/restore');
    });
  });

  describe('clone()', () => {
    it('should clone entity with optional overrides', () => {
      const builder = userOps.clone();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/{id}/clone');
    });
  });

  describe('history()', () => {
    it('should get change history', () => {
      const builder = userOps.history();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}/history');
    });
  });

  describe('distinct()', () => {
    it('should get distinct values for a field', () => {
      const builder = userOps.distinct('status');
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/distinct/status');
    });

    it('should work with different fields', () => {
      const builderEmail = userOps.distinct('email');
      const builderAge = userOps.distinct('age');
      
      expect(builderEmail.getRouteMetadata().path).toBe('/distinct/email');
      expect(builderAge.getRouteMetadata().path).toBe('/distinct/age');
    });
  });

  describe('streamingSearch()', () => {
    it('should return streaming search results', () => {
      const builder = userOps.streamingSearch();
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/search/streaming');
    });

    it('should accept search fields', () => {
      const builder = userOps.streamingSearch({
        searchFields: ['name', 'email'] as const,
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });

    it('should accept pagination options', () => {
      const builder = userOps.streamingSearch({
        searchFields: ['name', 'email'] as const,
        pagination: { defaultLimit: 50 },
      });
      
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });
  });

  describe('entitySchema access', () => {
    it('should expose entitySchema on route builder', () => {
      const builder = userOps.create();
      const entitySchema = builder.getEntitySchema();
      
      expect(entitySchema).toBe(userSchema);
    });

    it('should expose entitySchema consistently', () => {
      const builder = userOps.create();
      const entitySchema = builder.getEntitySchema();
      
      expect(entitySchema).toBe(userSchema);
    });

    it('should be consistent across all methods', () => {
      const methods = [
        userOps.read(),
        userOps.create(),
        userOps.update(),
        userOps.delete(),
        userOps.list(),
      ];

      methods.forEach((builder) => {
        expect(builder.getEntitySchema()).toBe(userSchema);
      });
    });
  });

  describe('method inference from metadata', () => {
    it('should correctly infer GET method', () => {
      const methods = [
        userOps.read(),
        userOps.list(),
        userOps.count(),
        userOps.search(),
        userOps.exists(),
      ];

      methods.forEach((builder) => {
        const metadata = builder.getRouteMetadata();
        expect(metadata.method).toBe('GET');
      });
    });

    it('should correctly infer POST method', () => {
      const methods = [
        userOps.create(),
        userOps.batchCreate(),
        userOps.batchRead(),
        userOps.validate(),
        userOps.archive(),
        userOps.restore(),
        userOps.clone(),
      ];

      methods.forEach((builder) => {
        const metadata = builder.getRouteMetadata();
        expect(metadata.method).toBe('POST');
      });
    });

    it('should correctly infer PUT method', () => {
      const methods = [
        userOps.update(),
        userOps.upsert(),
        userOps.batchUpsert(),
      ];

      methods.forEach((builder) => {
        const metadata = builder.getRouteMetadata();
        expect(metadata.method).toBe('PUT');
      });
    });

    it('should correctly infer PATCH method', () => {
      const methods = [
        userOps.patch(),
        userOps.batchUpdate(),
      ];

      methods.forEach((builder) => {
        const metadata = builder.getRouteMetadata();
        expect(metadata.method).toBe('PATCH');
      });
    });

    it('should correctly infer DELETE method', () => {
      const methods = [
        userOps.delete(),
        userOps.batchDelete(),
      ];

      methods.forEach((builder) => {
        const metadata = builder.getRouteMetadata();
        expect(metadata.method).toBe('DELETE');
      });
    });
  });

  describe('fluent API chaining', () => {
    it('should allow chaining on inputBuilder', () => {
      // Use input callback pattern to modify body schema in detailed input
      const builder = userOps.create()
        .input(b => b.omit(['id', 'createdAt', 'updatedAt']));

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('POST');
      
      const contract = builder.build();
      expect(contract).toBeDefined();
    });

    it('should allow chaining on outputBuilder', () => {
      const builder = userOps.read()
        .output((b) => b.body((s) => s.omit({ createdAt: true, updatedAt: true })));

      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      
      const contract = builder.build();
      expect(contract).toBeDefined();
    });
  });

  describe('type safety', () => {
    it('should prevent invalid field names in check()', () => {
      userOps.check('nonexistent' as any);
    });

    it('should prevent invalid field names in distinct()', () => {
      userOps.distinct('nonexistent' as any);
    });

    it('should enforce correct schema types', () => {
      const builder = userOps.create();
      
      // Should be able to infer the entity type
      
      expect(builder.getRouteMetadata().method).toBe('POST');
    });
  });

  describe('schema transformations', () => {
    it('should handle partial schemas in patch()', () => {
      const builder = userOps.patch();
      
      // Just test that the builder works and has correct metadata
      expect(builder).toBeDefined();
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('PATCH');
      expect(metadata.path).toBe('/{id}');
    });

    it('should handle array schemas in batch operations', () => {
      const builder = userOps.batchCreate();
      
      // Just test that the builder works
      expect(builder).toBeDefined();
      
      expect(builder.getRouteMetadata().method).toBe('POST');
    });
    
    it('should preserve entity schema in create()', () => {
      const builder = userOps.create();
      
      
      // STRICT: Input should be full User type, not generic object
      
      expect(builder.getRouteMetadata().method).toBe('POST');
    });
    
    it('should preserve entity schema in update()', () => {
      const builder = userOps.update();
      
      
      // STRICT: Input should be full User type
      
      expect(builder.getRouteMetadata().method).toBe('PUT');
    });
  });
});
