import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod/v4';
import { createQueryBuilder, createSortingConfigSchema } from '../query-builder';
import type { PaginationConfig, SortingConfig, FilteringConfig } from '../query-builder';

describe('Zod-based Configuration', () => {
  describe('QueryBuilder with Zod schemas', () => {
    it('should accept pagination config as Zod schema', () => {
      const paginationConfigSchema = z.object({
        defaultLimit: z.number().default(20),
        maxLimit: z.number().default(100),
        includeOffset: z.boolean().default(true),
      });

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
      });

      const inputSchema = queryBuilder.buildInputSchema();
      const metaSchema = queryBuilder.buildMetaSchema();

      // Test that schemas are generated
      expect(inputSchema).toBeDefined();
      expect(metaSchema).toBeDefined();

      // Test input schema structure
      const parsedInput = inputSchema.parse({ limit: 10, offset: 0 });
      expect(parsedInput.limit).toBe(10);
      expect(parsedInput.offset).toBe(0);

      // Test meta schema includes pagination fields
      const sampleMeta = metaSchema.parse({
        total: 100,
        limit: 20,
        offset: 0,
        hasMore: true,
      });
      expect(sampleMeta.total).toBe(100);
      expect(sampleMeta.limit).toBe(20);
    });

    it('should accept sorting config as Zod schema', () => {
      const sortingFields = ['name', 'createdAt', 'updatedAt'] as const;
      const sortingConfigSchema = createSortingConfigSchema(sortingFields);

      const queryBuilder = createQueryBuilder({
        sorting: sortingConfigSchema,
      });

      const inputSchema = queryBuilder.buildInputSchema();

      // Test sorting schema
      const parsedInput = inputSchema.parse({
        sortBy: 'name',
        sortDirection: 'asc',
      });
      expect(parsedInput.sortBy).toBe('name');
      expect(parsedInput.sortDirection).toBe('asc');
    });

    it('should accept filtering config as Zod schema', () => {
      const filteringConfigSchema = z.object({
        fields: z.object({
          name: z.object({
            schema: z.string(),
            operators: z.array(z.enum(['eq', 'like'])),
          }),
          age: z.object({
            schema: z.number(),
            operators: z.array(z.enum(['gt', 'lt'])),
          }),
        }),
      });

      const queryBuilder = createQueryBuilder({
        filtering: filteringConfigSchema,
      });

      const inputSchema = queryBuilder.buildInputSchema();
      expect(inputSchema).toBeDefined();

      // Should be able to parse filter queries
      const parsedInput = inputSchema.parse({
        name: 'John',
        age_gt: 18,
      });
      expect(parsedInput.name).toBe('John');
      expect(parsedInput.age_gt).toBe(18);
    });

    it('should handle complete query config with all Zod schemas', () => {
      const paginationConfigSchema = z.object({
        defaultLimit: z.number().default(20),
        maxLimit: z.number().default(100),
        includeOffset: z.boolean().default(true),
        includePage: z.boolean().default(true),
      });

      const sortingConfigSchema = createSortingConfigSchema(['name', 'createdAt'] as const);

      const filteringConfigSchema = z.object({
        fields: z.object({
          name: z.object({
            schema: z.string(),
            operators: z.array(z.enum(['eq', 'like'])),
          }),
        }),
      });

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
        sorting: sortingConfigSchema,
        filtering: filteringConfigSchema,
      });

      const inputSchema = queryBuilder.buildInputSchema();
      const metaSchema = queryBuilder.buildMetaSchema();

      // Test complete input
      const parsedInput = inputSchema.parse({
        limit: 25,
        offset: 50,
        page: 3,
        sortBy: 'name',
        sortDirection: 'desc',
        name: 'Test',
      });

      expect(parsedInput.limit).toBe(25);
      expect(parsedInput.offset).toBe(50);
      expect(parsedInput.page).toBe(3);
      expect(parsedInput.sortBy).toBe('name');
      expect(parsedInput.sortDirection).toBe('desc');
      expect(parsedInput.name).toBe('Test');

      // Test complete meta
      const parsedMeta = metaSchema.parse({
        total: 200,
        limit: 25,
        offset: 50,
        page: 3,
        totalPages: 8,
        hasMore: true,
        sortBy: 'name',
        sortDirection: 'desc',
        appliedFilters: { name: 'Test' },
        filterCount: 1,
      });

      expect(parsedMeta.total).toBe(200);
      expect(parsedMeta.page).toBe(3);
      expect(parsedMeta.totalPages).toBe(8);
      expect(parsedMeta.sortBy).toBe('name');
      expect(parsedMeta.filterCount).toBe(1);
    });

    it('should generate proper output schema with data and meta', () => {
      const paginationConfigSchema = z.object({
        defaultLimit: z.number().default(20),
        maxLimit: z.number().default(100),
        includeOffset: z.boolean().default(true),
      });

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
      });

      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      });

      const outputSchema = queryBuilder.buildOutputSchema(userSchema);

      // Test output structure
      const sampleOutput = outputSchema.parse({
        data: [
          { id: '1', name: 'John', email: 'john@example.com' },
          { id: '2', name: 'Jane', email: 'jane@example.com' },
        ],
        meta: {
          total: 2,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });

      expect(sampleOutput.data).toHaveLength(2);
      expect(sampleOutput.meta.total).toBe(2);
      expect(sampleOutput.meta.limit).toBe(20);
    });
  });

  describe('Type inference with Zod schemas', () => {
    it('should infer correct input types', () => {
      const paginationConfigSchema = z.object({
        defaultLimit: z.number().default(20),
        maxLimit: z.number().default(100),
        includeOffset: z.boolean().default(true),
      });

      const sortingConfigSchema = createSortingConfigSchema(['name', 'email'] as const);

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
        sorting: sortingConfigSchema,
      });

      const inputSchema = queryBuilder.buildInputSchema();

      // Type assertions
      type InputType = z.infer<typeof inputSchema>;
      
      // Should have pagination fields
      expectTypeOf<InputType>().toHaveProperty('limit');
      expectTypeOf<InputType>().toHaveProperty('offset');
      
      // Should have sorting fields
      expectTypeOf<InputType>().toHaveProperty('sortBy');
      expectTypeOf<InputType>().toHaveProperty('sortDirection');
    });

    it('should infer correct output types', () => {
      const paginationConfigSchema = z.object({
        defaultLimit: z.number().default(20),
        maxLimit: z.number().default(100),
        includeOffset: z.boolean().default(true),
        includePage: z.boolean().default(true),
      });

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
      });

      const dataSchema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const outputSchema = queryBuilder.buildOutputSchema(dataSchema);

      type OutputType = z.infer<typeof outputSchema>;

      // Should have data array
      expectTypeOf<OutputType>().toHaveProperty('data');
      expectTypeOf<OutputType['data']>().toEqualTypeOf<Array<{ id: string; name: string }>>();

      // Should have meta with pagination fields
      expectTypeOf<OutputType>().toHaveProperty('meta');
      expectTypeOf<OutputType['meta']>().toExtend<{
        total: number;
        limit: number;
        offset: number;
        page: number;
        totalPages: number;
        hasMore: boolean;
      }>();
    });
  });

  describe('Backward compatibility', () => {
    it('should still accept plain config objects', () => {
      const queryBuilder = createQueryBuilder({
        pagination: {
          defaultLimit: 20,
          maxLimit: 100,
          includeOffset: true,
        },
        sorting: {
          fields: ['name', 'createdAt'],
          defaultDirection: 'asc',
        },
      });

      const inputSchema = queryBuilder.buildInputSchema();
      expect(inputSchema).toBeDefined();

      const parsedInput = inputSchema.parse({ limit: 10, offset: 0 });
      expect(parsedInput.limit).toBe(10);
    });

    it('should accept mixed Zod schemas and plain configs', () => {
      const paginationConfigSchema = z.object({
        defaultLimit: z.number().default(20),
        maxLimit: z.number().default(100),
      });

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
        sorting: {
          fields: ['name', 'email'],
          defaultDirection: 'asc',
        },
      });

      const inputSchema = queryBuilder.buildInputSchema();
      expect(inputSchema).toBeDefined();

      const parsedInput = inputSchema.parse({
        limit: 15,
        sortBy: 'name',
        sortDirection: 'desc',
      });

      expect(parsedInput.limit).toBe(15);
      expect(parsedInput.sortBy).toBe('name');
    });
  });
});
