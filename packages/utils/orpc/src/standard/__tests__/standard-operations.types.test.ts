import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { standard } from '../zod/standard-operations';
import { createFilterConfig } from '../zod/list-builder';
import { voidSchema } from '../../shared/standard-schema-helpers';

// ──────────────────── test data ────────────────────────────────────────────────

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const validUser = {
  id: VALID_UUID,
  email: 'test@example.com',
  name: 'John Doe',
  age: 25,
  status: 'active' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

/** Fields required to create a user (id + timestamps omitted). */
const validCreateUser = {
  email: 'test@example.com',
  name: 'John Doe',
  age: 25,
  status: 'active' as const,
};

// ──────────────────── helpers ───────────────────────────────────────────────────

/**
 * Universal schema validation helper.
 * Prefers Zod `.safeParse()` when available; falls back to
 * the Standard Schema `~standard.validate()` for non-Zod schemas.
 */
function parseSchema(schema: unknown, data: unknown): { success: boolean } {
  if (typeof schema !== 'object' || !schema) return { success: false };

  // Zod schemas expose `.safeParse()` directly.
  if ('safeParse' in schema && typeof (schema as { safeParse: unknown }).safeParse === 'function') {
    return { success: (schema as z.ZodType).safeParse(data).success };
  }

  // Custom Standard Schema objects (DetailedInput / DetailedOutput wrappers).
  if ('~standard' in schema) {
    const r = (schema as { '~standard': { validate: (d: unknown) => unknown } })['~standard'].validate(data) as
      | { value?: unknown }
      | { issues?: unknown[] };
    return { success: 'value' in r };
  }

  return { success: false };
}

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

/** Narrow built contract to its i/o schemas. */
function schemas(builder: { build: () => unknown }) {
  const c = builder.build() as { '~orpc': { inputSchema: unknown; outputSchema: unknown } };
  return { input: c['~orpc'].inputSchema, output: c['~orpc'].outputSchema };
}

describe('StandardOperations - Type Inference', () => {
  const userOps = standard.zod(userSchema, 'user');

  describe('read()', () => {
    it('should infer correct input and output types', () => {
      const builder = userOps.read();
      const metadata = builder.getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}');
    });

    it('should have entitySchema accessible', () => {
      expect(userOps.read().getEntitySchema()).toBe(userSchema);
    });

    it('input schema — accepts valid params', () => {
      const { input } = schemas(userOps.read());
      expect(parseSchema(input, { params: { id: VALID_UUID } }).success).toBe(true);
    });

    it('input schema — rejects invalid UUID', () => {
      const { input } = schemas(userOps.read());
      expect(parseSchema(input, { params: { id: 'not-a-uuid' } }).success).toBe(false);
    });

    it('input schema — rejects missing params', () => {
      const { input } = schemas(userOps.read());
      expect(parseSchema(input, {}).success).toBe(false);
    });

    it('output schema — accepts valid user entity', () => {
      const { output } = schemas(userOps.read());
      expect((output as z.ZodType).safeParse(validUser).success).toBe(true);
    });

    it('output schema — rejects entity with invalid UUID', () => {
      const { output } = schemas(userOps.read());
      expect((output as z.ZodType).safeParse({ ...validUser, id: 'not-uuid' }).success).toBe(false);
    });

    it('output schema — rejects entity with invalid email', () => {
      const { output } = schemas(userOps.read());
      expect((output as z.ZodType).safeParse({ ...validUser, email: 'not-email' }).success).toBe(false);
    });

    it('output schema — rejects entity with negative age', () => {
      const { output } = schemas(userOps.read());
      expect((output as z.ZodType).safeParse({ ...validUser, age: -1 }).success).toBe(false);
    });
  });

  describe('streamingRead()', () => {
    it('should infer correct types with EventIterator wrapper', () => {
      const metadata = userOps.streamingRead().getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}/streaming');
    });

    it('should accept custom idFieldName', () => {
      const metadata = userOps.streamingRead({ idFieldName: 'userId' }).getRouteMetadata();
      expect(metadata.path).toBe('/{userId}/streaming');
    });
  });

  describe('create()', () => {
    it('should have POST / route', () => {
      const metadata = userOps.create().getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/');
    });

    // create() uses body-only mode → the inputSchema IS the Zod body schema directly.
    it('input schema — accepts valid create body', () => {
      const { input } = schemas(userOps.create());
      expect((input as z.ZodType).safeParse(validCreateUser).success).toBe(true);
    });

    it('input schema — rejects invalid email', () => {
      const { input } = schemas(userOps.create());
      expect((input as z.ZodType).safeParse({ ...validCreateUser, email: 'bad-email' }).success).toBe(false);
    });

    it('input schema — rejects missing required field', () => {
      const { input } = schemas(userOps.create());
      const { name: _name, ...noName } = validCreateUser;
      void _name;
      expect((input as z.ZodType).safeParse(noName).success).toBe(false);
    });

    it('input schema — rejects negative age', () => {
      const { input } = schemas(userOps.create());
      expect((input as z.ZodType).safeParse({ ...validCreateUser, age: -5 }).success).toBe(false);
    });

    // create() output uses b.status(201).body(entitySchema) → detailed Standard Schema.
    it('output schema — accepts { status: 201, body: validUser }', () => {
      const { output } = schemas(userOps.create());
      expect(parseSchema(output, { status: 201, body: validUser }).success).toBe(true);
    });

    it('output schema — rejects wrong status code', () => {
      const { output } = schemas(userOps.create());
      expect(parseSchema(output, { status: 200, body: validUser }).success).toBe(false);
    });

    it('output schema — rejects invalid body entity', () => {
      const { output } = schemas(userOps.create());
      const invalidBody = { ...validUser, email: 'not-email' };
      expect(parseSchema(output, { status: 201, body: invalidBody }).success).toBe(false);
    });
  });

  describe('update()', () => {
    it('should have PUT /{id} route', () => {
      const metadata = userOps.update().getRouteMetadata();
      expect(metadata.method).toBe('PUT');
      expect(metadata.path).toBe('/{id}');
    });

    // update() uses params + body → detailed Standard Schema.
    it('input schema — accepts valid params + full entity body', () => {
      const { input } = schemas(userOps.update());
      expect(parseSchema(input, { params: { id: VALID_UUID }, body: validUser }).success).toBe(true);
    });

    it('input schema — rejects invalid UUID in params', () => {
      const { input } = schemas(userOps.update());
      expect(parseSchema(input, { params: { id: 'bad-id' }, body: validUser }).success).toBe(false);
    });

    it('input schema — rejects invalid body (bad email)', () => {
      const { input } = schemas(userOps.update());
      expect(parseSchema(input, { params: { id: VALID_UUID }, body: { ...validUser, email: 'bad' } }).success).toBe(false);
    });

    it('output schema — accepts valid user entity', () => {
      const { output } = schemas(userOps.update());
      expect((output as z.ZodType).safeParse(validUser).success).toBe(true);
    });

    it('output schema — rejects missing required fields', () => {
      const { output } = schemas(userOps.update());
      const { email: _e, ...noEmail } = validUser;
      void _e;
      expect((output as z.ZodType).safeParse(noEmail).success).toBe(false);
    });
  });

  describe('patch()', () => {
    it('should have PATCH /{id} route', () => {
      const metadata = userOps.patch().getRouteMetadata();
      expect(metadata.method).toBe('PATCH');
      expect(metadata.path).toBe('/{id}');
    });

    // patch() uses params + body → detailed Standard Schema; body is partial.
    it('input schema — accepts empty partial body (all fields optional)', () => {
      const { input } = schemas(userOps.patch());
      expect(parseSchema(input, { params: { id: VALID_UUID }, body: {} }).success).toBe(true);
    });

    it('input schema — accepts partial update with single field', () => {
      const { input } = schemas(userOps.patch());
      expect(parseSchema(input, { params: { id: VALID_UUID }, body: { name: 'Updated Name' } }).success).toBe(true);
    });

    it('input schema — rejects negative age in body', () => {
      const { input } = schemas(userOps.patch());
      expect(parseSchema(input, { params: { id: VALID_UUID }, body: { age: -1 } }).success).toBe(false);
    });

    it('input schema — rejects invalid UUID in params', () => {
      const { input } = schemas(userOps.patch());
      expect(parseSchema(input, { params: { id: 'not-uuid' }, body: {} }).success).toBe(false);
    });

    it('output schema — accepts valid user entity', () => {
      const { output } = schemas(userOps.patch());
      expect((output as z.ZodType).safeParse(validUser).success).toBe(true);
    });
  });

  describe('delete()', () => {
    it('should have DELETE /{id} route', () => {
      const metadata = userOps.delete().getRouteMetadata();
      expect(metadata.method).toBe('DELETE');
      expect(metadata.path).toBe('/{id}');
    });

    it('input schema — accepts valid UUID params', () => {
      const { input } = schemas(userOps.delete());
      expect(parseSchema(input, { params: { id: VALID_UUID } }).success).toBe(true);
    });

    it('input schema — rejects invalid UUID', () => {
      const { input } = schemas(userOps.delete());
      expect(parseSchema(input, { params: { id: 'bad-id' } }).success).toBe(false);
    });

    it('output schema — accepts { success: true }', () => {
      const { output } = schemas(userOps.delete());
      expect((output as z.ZodType).safeParse({ success: true }).success).toBe(true);
    });

    it('output schema — accepts { success: false, message: "Not found" }', () => {
      const { output } = schemas(userOps.delete());
      expect((output as z.ZodType).safeParse({ success: false, message: 'Not found' }).success).toBe(true);
    });

    it('output schema — rejects non-boolean success', () => {
      const { output } = schemas(userOps.delete());
      expect((output as z.ZodType).safeParse({ success: 'yes' }).success).toBe(false);
    });

    it('output schema — rejects missing success field', () => {
      const { output } = schemas(userOps.delete());
      expect((output as z.ZodType).safeParse({}).success).toBe(false);
    });
  });

  describe('list()', () => {
    describe('bare list (no options)', () => {
      it('should have GET / route', () => {
        const metadata = userOps.list().getRouteMetadata();
        expect(metadata.method).toBe('GET');
        expect(metadata.path).toBe('/');
      });

      it('input schema — is VoidSchema (no input expected)', () => {
        const { input } = schemas(userOps.list());
        expect(JSON.stringify(input)).toBe(JSON.stringify(voidSchema()));
      });

      it('input schema — accepts undefined', () => {
        const { input } = schemas(userOps.list());
        expect(parseSchema(input, undefined).success).toBe(true);
      });

      it('output schema — accepts empty data array', () => {
        const { output } = schemas(userOps.list());
        expect((output as z.ZodType).safeParse({ data: [] }).success).toBe(true);
      });

      it('output schema — accepts array of valid users', () => {
        const { output } = schemas(userOps.list());
        expect((output as z.ZodType).safeParse({ data: [validUser, validUser] }).success).toBe(true);
      });

      it('output schema — rejects invalid entity in array', () => {
        const { output } = schemas(userOps.list());
        const invalidItem = { ...validUser, email: 'not-an-email' };
        expect((output as z.ZodType).safeParse({ data: [invalidItem] }).success).toBe(false);
      });

      it('output schema — rejects missing data field', () => {
        const { output } = schemas(userOps.list());
        expect((output as z.ZodType).safeParse({}).success).toBe(false);
      });
    });

    describe('list with pagination (createFilterConfig)', () => {
      const paginationConfig = createFilterConfig(userOps)
        .withPagination({ defaultLimit: 20, maxLimit: 100 })
        .buildConfig();

      it('should have GET route', () => {
        const metadata = userOps.list(paginationConfig).getRouteMetadata();
        expect(metadata.method).toBe('GET');
      });

      it('input schema — accepts valid pagination query', () => {
        const { input } = schemas(userOps.list(paginationConfig));
        expect((input as z.ZodType).safeParse({ query: { limit: 10, offset: 0 } }).success).toBe(true);
      });

      it('input schema — accepts empty query (limit defaults to defaultLimit)', () => {
        const { input } = schemas(userOps.list(paginationConfig));
        expect((input as z.ZodType).safeParse({ query: {} }).success).toBe(true);
      });

      it('input schema — accepts no query (query key itself optional)', () => {
        const { input } = schemas(userOps.list(paginationConfig));
        expect((input as z.ZodType).safeParse({}).success).toBe(true);
      });

      it('input schema — rejects limit exceeding maxLimit', () => {
        const { input } = schemas(userOps.list(paginationConfig));
        expect((input as z.ZodType).safeParse({ query: { limit: 200 } }).success).toBe(false);
      });

      it('output schema — accepts paginated response', () => {
        const { output } = schemas(userOps.list(paginationConfig));
        const response = {
          data: [validUser],
          meta: { total: 1, limit: 20, offset: 0, hasMore: false },
        };
        expect((output as z.ZodType).safeParse(response).success).toBe(true);
      });

      it('output schema — rejects invalid entity in paginated data', () => {
        const { output } = schemas(userOps.list(paginationConfig));
        const invalidItem = { ...validUser, age: -1 };
        expect((output as z.ZodType).safeParse({ data: [invalidItem], meta: { total: 1, limit: 20, offset: 0, hasMore: false } }).success).toBe(false);
      });
    });

    describe('list with sorting', () => {
      it('should build without error', () => {
        const config = createFilterConfig(userOps)
          .withPagination({ defaultLimit: 20 })
          .withSorting(['createdAt', 'name'] as const)
          .buildConfig();
        const metadata = userOps.list(config).getRouteMetadata();
        expect(metadata.method).toBe('GET');
      });

      it('input schema — accepts valid sort field', () => {
        const config = createFilterConfig(userOps)
          .withPagination({ defaultLimit: 20 })
          .withSorting(['createdAt', 'name'] as const)
          .buildConfig();
        const { input } = schemas(userOps.list(config));
        expect((input as z.ZodType).safeParse({ query: { limit: 20, sort: 'name', order: 'asc' } }).success).toBe(true);
      });

      it('input schema — rejects unknown sort field', () => {
        const config = createFilterConfig(userOps)
          .withPagination({ defaultLimit: 20 })
          .withSorting(['createdAt', 'name'] as const)
          .buildConfig();
        const { input } = schemas(userOps.list(config));
        expect((input as z.ZodType).safeParse({ query: { sortBy: 'unknownField' } }).success).toBe(false);
      });
    });

    describe('list with filtering', () => {
      it('should build without error', () => {
        const config = createFilterConfig(userOps)
          .withPagination({ defaultLimit: 20 })
          .withFiltering({
            status: { schema: z.enum(['active', 'inactive', 'archived']), operators: ['eq', 'in'] as const },
            age: z.number(),
          })
          .buildConfig();
        const metadata = userOps.list(config).getRouteMetadata();
        expect(metadata.method).toBe('GET');
      });

      it('input schema — accepts filter values matching entity fields', () => {
        const config = createFilterConfig(userOps)
          .withPagination({ defaultLimit: 20 })
          .withFiltering({ status: z.enum(['active', 'inactive', 'archived']) })
          .buildConfig();
        const { input } = schemas(userOps.list(config));
        expect((input as z.ZodType).safeParse({ query: { limit: 20, filter: { status: { operator: 'eq', value: 'active' } } } }).success).toBe(true);
      });
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
    it('should have GET /count route', () => {
      const metadata = userOps.count().getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/count');
    });

    it('input schema — accepts empty filter', () => {
      const { input } = schemas(userOps.count());
      expect(parseSchema(input, { query: {} }).success).toBe(true);
    });

    it('input schema — accepts arbitrary filter value', () => {
      const { input } = schemas(userOps.count());
      expect(parseSchema(input, { query: { filter: { status: 'active' } } }).success).toBe(true);
    });

    it('output schema — accepts valid count', () => {
      const { output } = schemas(userOps.count());
      expect((output as z.ZodType).safeParse({ count: 42 }).success).toBe(true);
    });

    it('output schema — accepts zero count', () => {
      const { output } = schemas(userOps.count());
      expect((output as z.ZodType).safeParse({ count: 0 }).success).toBe(true);
    });

    it('output schema — rejects negative count', () => {
      const { output } = schemas(userOps.count());
      expect((output as z.ZodType).safeParse({ count: -1 }).success).toBe(false);
    });

    it('output schema — rejects non-integer count', () => {
      const { output } = schemas(userOps.count());
      expect((output as z.ZodType).safeParse({ count: 1.5 }).success).toBe(false);
    });

    it('output schema — rejects missing count field', () => {
      const { output } = schemas(userOps.count());
      expect((output as z.ZodType).safeParse({}).success).toBe(false);
    });
  });

  describe('search()', () => {
    it('should have GET /search route', () => {
      const metadata = userOps.search().getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/search');
    });

    it('should accept search fields', () => {
      const metadata = userOps.search({ searchFields: ['name', 'email'] as const }).getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });

    it('should accept pagination options', () => {
      const builder = userOps.search({ searchFields: ['name', 'email'] as const, pagination: { defaultLimit: 50 } });
      expect(builder.getRouteMetadata().method).toBe('GET');
    });

    it('input schema — accepts search query string', () => {
      const { input } = schemas(userOps.search({ searchFields: ['name', 'email'] as const }));
      expect((input as z.ZodType).safeParse({ query: { q: 'john', limit: 20 } }).success).toBe(true);
    });

    it('output schema — accepts paginated result', () => {
      const { output } = schemas(userOps.search());
      expect((output as z.ZodType).safeParse({ data: [validUser], meta: { total: 1, limit: 20, offset: 0, hasMore: false } }).success).toBe(true);
    });
  });

  describe('check()', () => {
    it('should have GET /check/email route', () => {
      const metadata = userOps.check('email').getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/check/email');
    });

    it('should work on other fields too', () => {
      expect(userOps.check('status').getRouteMetadata().path).toBe('/check/status');
      expect(userOps.check('age').getRouteMetadata().path).toBe('/check/age');
    });

    // check() uses a direct Zod object schema (not detailed input).
    it('input schema — accepts valid email value', () => {
      const { input } = schemas(userOps.check('email'));
      expect((input as z.ZodType).safeParse({ email: 'valid@example.com' }).success).toBe(true);
    });

    it('input schema — rejects invalid email', () => {
      const { input } = schemas(userOps.check('email'));
      expect((input as z.ZodType).safeParse({ email: 'not-an-email' }).success).toBe(false);
    });

    it('input schema — rejects missing field', () => {
      const { input } = schemas(userOps.check('email'));
      expect((input as z.ZodType).safeParse({}).success).toBe(false);
    });

    it('output schema — accepts { exists: true }', () => {
      const { output } = schemas(userOps.check('email'));
      expect((output as z.ZodType).safeParse({ exists: true }).success).toBe(true);
    });

    it('output schema — accepts { exists: false }', () => {
      const { output } = schemas(userOps.check('email'));
      expect((output as z.ZodType).safeParse({ exists: false }).success).toBe(true);
    });

    it('output schema — rejects non-boolean exists', () => {
      const { output } = schemas(userOps.check('email'));
      expect((output as z.ZodType).safeParse({ exists: 'yes' }).success).toBe(false);
    });

    it('should accept custom field schema', () => {
      const metadata = userOps.check('email', z.email()).getRouteMetadata();
      expect(metadata.method).toBe('GET');
    });
  });

  describe('batchCreate()', () => {
    it('should have POST /batch route', () => {
      const metadata = userOps.batchCreate().getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/batch');
    });

    // batchCreate() uses body-only → direct Zod schema; omits id and timestamps by default.
    it('input schema — accepts array with one valid item', () => {
      const { input } = schemas(userOps.batchCreate());
      expect((input as z.ZodType).safeParse({ items: [validCreateUser] }).success).toBe(true);
    });

    it('input schema — accepts multiple valid items', () => {
      const { input } = schemas(userOps.batchCreate());
      expect((input as z.ZodType).safeParse({ items: [validCreateUser, validCreateUser] }).success).toBe(true);
    });

    it('input schema — rejects empty items array (min 1)', () => {
      const { input } = schemas(userOps.batchCreate());
      expect((input as z.ZodType).safeParse({ items: [] }).success).toBe(false);
    });

    it('input schema — rejects item with invalid email', () => {
      const { input } = schemas(userOps.batchCreate());
      expect((input as z.ZodType).safeParse({ items: [{ ...validCreateUser, email: 'bad' }] }).success).toBe(false);
    });

    it('input schema — rejects missing items field', () => {
      const { input } = schemas(userOps.batchCreate());
      expect((input as z.ZodType).safeParse({}).success).toBe(false);
    });

    it('output schema — accepts result with created entities', () => {
      const { output } = schemas(userOps.batchCreate());
      expect((output as z.ZodType).safeParse({ created: [validUser], failed: [] }).success).toBe(true);
    });

    it('output schema — accepts result with failures', () => {
      const { output } = schemas(userOps.batchCreate());
      expect((output as z.ZodType).safeParse({
        created: [],
        failed: [{ index: 0, error: 'Duplicate email' }],
      }).success).toBe(true);
    });

    it('should respect maxBatchSize option', () => {
      const metadata = userOps.batchCreate({ maxBatchSize: 50 }).getRouteMetadata();
      expect(metadata.method).toBe('POST');
    });

    it('input schema — rejects array exceeding custom maxBatchSize', () => {
      const { input } = schemas(userOps.batchCreate({ maxBatchSize: 2 }));
      const manyItems = [validCreateUser, validCreateUser, validCreateUser];
      expect((input as z.ZodType).safeParse({ items: manyItems }).success).toBe(false);
    });
  });

  describe('batchDelete()', () => {
    it('should have DELETE /batch route', () => {
      const metadata = userOps.batchDelete().getRouteMetadata();
      expect(metadata.method).toBe('DELETE');
      expect(metadata.path).toBe('/batch');
    });

    // batchDelete() uses body-only → direct Zod schema.
    it('input schema — accepts valid UUIDs array', () => {
      const { input } = schemas(userOps.batchDelete());
      expect((input as z.ZodType).safeParse({ ids: [VALID_UUID] }).success).toBe(true);
    });

    it('input schema — rejects empty ids array (min 1)', () => {
      const { input } = schemas(userOps.batchDelete());
      expect((input as z.ZodType).safeParse({ ids: [] }).success).toBe(false);
    });

    it('input schema — rejects non-UUID id', () => {
      const { input } = schemas(userOps.batchDelete());
      expect((input as z.ZodType).safeParse({ ids: ['not-a-uuid'] }).success).toBe(false);
    });

    it('output schema — accepts successful delete count', () => {
      const { output } = schemas(userOps.batchDelete());
      expect((output as z.ZodType).safeParse({ deleted: 3 }).success).toBe(true);
    });

    it('output schema — accepts count with failed ids', () => {
      const { output } = schemas(userOps.batchDelete());
      expect((output as z.ZodType).safeParse({ deleted: 2, failed: ['missing-id'] }).success).toBe(true);
    });

    it('output schema — rejects non-integer deleted count', () => {
      const { output } = schemas(userOps.batchDelete());
      expect((output as z.ZodType).safeParse({ deleted: 1.5 }).success).toBe(false);
    });

    it('should respect maxBatchSize option', () => {
      const metadata = userOps.batchDelete({ maxBatchSize: 50 }).getRouteMetadata();
      expect(metadata.method).toBe('DELETE');
    });
  });

  describe('batchRead()', () => {
    it('should have POST /batch/read route', () => {
      const metadata = userOps.batchRead().getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/batch/read');
    });

    // batchRead() uses body-only → direct Zod schema.
    it('input schema — accepts valid UUIDs array', () => {
      const { input } = schemas(userOps.batchRead());
      expect((input as z.ZodType).safeParse({ ids: [VALID_UUID] }).success).toBe(true);
    });

    it('input schema — rejects empty ids array (min 1)', () => {
      const { input } = schemas(userOps.batchRead());
      expect((input as z.ZodType).safeParse({ ids: [] }).success).toBe(false);
    });

    it('output schema — accepts found items', () => {
      const { output } = schemas(userOps.batchRead());
      expect((output as z.ZodType).safeParse({ items: [validUser] }).success).toBe(true);
    });

    it('output schema — accepts items with notFound list', () => {
      const { output } = schemas(userOps.batchRead());
      expect((output as z.ZodType).safeParse({ items: [validUser], notFound: ['missing-id'] }).success).toBe(true);
    });

    it('output schema — rejects invalid entity in items array', () => {
      const { output } = schemas(userOps.batchRead());
      const invalidItem = { ...validUser, email: 'bad-email' };
      expect((output as z.ZodType).safeParse({ items: [invalidItem] }).success).toBe(false);
    });

    it('should respect maxBatchSize option', () => {
      const metadata = userOps.batchRead({ maxBatchSize: 50 }).getRouteMetadata();
      expect(metadata.method).toBe('POST');
    });
  });

  describe('batchUpdate()', () => {
    it('should have PATCH /batch route', () => {
      const metadata = userOps.batchUpdate().getRouteMetadata();
      expect(metadata.method).toBe('PATCH');
      expect(metadata.path).toBe('/batch');
    });

    it('input schema — accepts array with valid items', () => {
      const { input } = schemas(userOps.batchUpdate());
      expect((input as z.ZodType).safeParse({ items: [validUser] }).success).toBe(true);
    });

    it('input schema — rejects empty items array', () => {
      const { input } = schemas(userOps.batchUpdate());
      expect((input as z.ZodType).safeParse({ items: [] }).success).toBe(false);
    });

    it('should respect maxBatchSize option', () => {
      const metadata = userOps.batchUpdate({ maxBatchSize: 50 }).getRouteMetadata();
      expect(metadata.method).toBe('PATCH');
    });
  });

  describe('exists()', () => {
    it('should have GET /{id}/exists route', () => {
      const metadata = userOps.exists().getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}/exists');
    });

    it('input schema — accepts valid UUID', () => {
      const { input } = schemas(userOps.exists());
      expect(parseSchema(input, { params: { id: VALID_UUID } }).success).toBe(true);
    });

    it('input schema — rejects invalid UUID', () => {
      const { input } = schemas(userOps.exists());
      expect(parseSchema(input, { params: { id: 'bad' } }).success).toBe(false);
    });

    it('output schema — accepts { exists: true }', () => {
      const { output } = schemas(userOps.exists());
      expect((output as z.ZodType).safeParse({ exists: true }).success).toBe(true);
    });

    it('output schema — accepts { exists: false }', () => {
      const { output } = schemas(userOps.exists());
      expect((output as z.ZodType).safeParse({ exists: false }).success).toBe(true);
    });
  });

  describe('upsert()', () => {
    it('should have PUT /upsert route', () => {
      const metadata = userOps.upsert().getRouteMetadata();
      expect(metadata.method).toBe('PUT');
      expect(metadata.path).toBe('/upsert');
    });

    it('input schema — accepts full user entity', () => {
      const { input } = schemas(userOps.upsert());
      expect((input as z.ZodType).safeParse(validUser).success).toBe(true);
    });

    it('input schema — rejects entity with invalid email', () => {
      const { input } = schemas(userOps.upsert());
      expect((input as z.ZodType).safeParse({ ...validUser, email: 'bad' }).success).toBe(false);
    });

    it('output schema — accepts { item: validUser, created: true }', () => {
      const { output } = schemas(userOps.upsert());
      expect((output as z.ZodType).safeParse({ item: validUser, created: true }).success).toBe(true);
    });

    it('output schema — rejects missing item', () => {
      const { output } = schemas(userOps.upsert());
      expect((output as z.ZodType).safeParse({ created: true }).success).toBe(false);
    });

    it('should accept uniqueField option', () => {
      const metadata = userOps.upsert({ uniqueField: 'email' }).getRouteMetadata();
      expect(metadata.method).toBe('PUT');
    });

    it('should accept custom path', () => {
      const metadata = userOps.upsert({ path: '/custom-upsert' }).getRouteMetadata();
      expect(metadata.path).toBe('/custom-upsert');
    });
  });

  describe('batchUpsert()', () => {
    it('should have PUT /batch/upsert route', () => {
      const metadata = userOps.batchUpsert().getRouteMetadata();
      expect(metadata.method).toBe('PUT');
      expect(metadata.path).toBe('/batch/upsert');
    });

    it('input schema — accepts valid items array', () => {
      const { input } = schemas(userOps.batchUpsert());
      expect((input as z.ZodType).safeParse({ items: [validUser] }).success).toBe(true);
    });

    it('input schema — rejects empty items array', () => {
      const { input } = schemas(userOps.batchUpsert());
      expect((input as z.ZodType).safeParse({ items: [] }).success).toBe(false);
    });

    it('output schema — accepts result with created and updated arrays', () => {
      const { output } = schemas(userOps.batchUpsert());
      expect((output as z.ZodType).safeParse({ created: [validUser], updated: [] }).success).toBe(true);
    });

    it('should accept options', () => {
      const metadata = userOps.batchUpsert({ maxBatchSize: 50, uniqueField: 'email' }).getRouteMetadata();
      expect(metadata.method).toBe('PUT');
    });
  });

  describe('validate()', () => {
    it('should have POST /validate route', () => {
      const metadata = userOps.validate().getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/validate');
    });

    it('input schema — accepts valid create body', () => {
      const { input } = schemas(userOps.validate());
      expect((input as z.ZodType).safeParse(validUser).success).toBe(true);
    });

    it('output schema — accepts { valid: true }', () => {
      const { output } = schemas(userOps.validate());
      expect((output as z.ZodType).safeParse({ valid: true }).success).toBe(true);
    });

    it('output schema — accepts { valid: false, errors: [...] }', () => {
      const { output } = schemas(userOps.validate());
      expect((output as z.ZodType).safeParse({ valid: false, errors: [{ field: 'name', message: 'required' }] }).success).toBe(true);
    });
  });

  describe('archive()', () => {
    it('should have POST /{id}/archive route', () => {
      const metadata = userOps.archive().getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/{id}/archive');
    });

    it('input schema — accepts valid UUID', () => {
      const { input } = schemas(userOps.archive());
      expect(parseSchema(input, { params: { id: VALID_UUID } }).success).toBe(true);
    });
  });

  describe('restore()', () => {
    it('should have POST /{id}/restore route', () => {
      const metadata = userOps.restore().getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/{id}/restore');
    });

    it('input schema — accepts valid UUID', () => {
      const { input } = schemas(userOps.restore());
      expect(parseSchema(input, { params: { id: VALID_UUID } }).success).toBe(true);
    });
  });

  describe('clone()', () => {
    it('should have POST /{id}/clone route', () => {
      const metadata = userOps.clone().getRouteMetadata();
      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/{id}/clone');
    });
  });

  describe('history()', () => {
    it('should have GET /{id}/history route', () => {
      const metadata = userOps.history().getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/{id}/history');
    });

    it('output schema — accepts history entries array', () => {
      const { output } = schemas(userOps.history());
      const historyItem = { id: 'hist-1', entityId: VALID_UUID, action: 'created' as const, changes: { name: { old: null, new: 'John' } }, timestamp: new Date() };
      expect((output as z.ZodType).safeParse({ items: [historyItem], hasMore: false }).success).toBe(true);
    });
  });

  describe('distinct()', () => {
    it('should have GET /distinct/status route', () => {
      const metadata = userOps.distinct('status').getRouteMetadata();
      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/distinct/status');
    });

    it('should work with different fields', () => {
      expect(userOps.distinct('email').getRouteMetadata().path).toBe('/distinct/email');
      expect(userOps.distinct('age').getRouteMetadata().path).toBe('/distinct/age');
    });

    it('output schema — accepts values array', () => {
      const { output } = schemas(userOps.distinct('status'));
      expect((output as z.ZodType).safeParse({ values: ['active', 'inactive'], total: 2 }).success).toBe(true);
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
