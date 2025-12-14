import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod/v4';
import { 
  createQueryBuilder, 
  createPaginationConfigSchema,
  createSortingConfigSchema,
  createFilteringConfigSchema,
  createSearchConfigSchema
} from '../query-builder';

describe('Zod-based Configuration', () => {
  describe('QueryBuilder with Zod config schemas', () => {
    it('should accept pagination config as Zod schema with embedded config', () => {
      const paginationConfigSchema = createPaginationConfigSchema({
        defaultLimit: 20,
        maxLimit: 100,
        includeOffset: true,
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

    it('should accept sorting config as Zod schema with embedded config', () => {
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

    it('should accept filtering config as Zod schema with embedded config', () => {
      const filteringConfigSchema = createFilteringConfigSchema({
        name: { schema: z.string(), operators: ['eq', 'like'] as const },
        age: { schema: z.number(), operators: ['gt', 'lt'] as const },
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

    it('should handle complete query config with all Zod config schemas', () => {
      const paginationConfigSchema = createPaginationConfigSchema({
        defaultLimit: 20,
        maxLimit: 100,
        includeOffset: true,
        includePage: true,
      });

      const sortingConfigSchema = createSortingConfigSchema(['name', 'createdAt'] as const);

      const filteringConfigSchema = createFilteringConfigSchema({
        name: { schema: z.string(), operators: ['eq', 'like'] as const },
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
      const paginationConfigSchema = createPaginationConfigSchema({
        defaultLimit: 20,
        maxLimit: 100,
        includeOffset: true,
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

  describe('Type inference with Zod config schemas', () => {
    it('should infer correct input types', () => {
      const paginationConfigSchema = createPaginationConfigSchema({
        defaultLimit: 20,
        maxLimit: 100,
        includeOffset: true,
      });

      const sortingConfigSchema = createSortingConfigSchema(['name', 'email'] as const);

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
        sorting: sortingConfigSchema,
      });

      const _inputSchema = queryBuilder.buildInputSchema();
      expect(_inputSchema).toBeDefined();

      // Type assertions
      type InputType = z.infer<typeof _inputSchema>;
      
      // Should have pagination fields
      expectTypeOf<InputType>().toHaveProperty('limit');
      expectTypeOf<InputType>().toHaveProperty('offset');
      
      // Should have sorting fields
      expectTypeOf<InputType>().toHaveProperty('sortBy');
      expectTypeOf<InputType>().toHaveProperty('sortDirection');
    });

    it('should infer correct output types', () => {
      const paginationConfigSchema = createPaginationConfigSchema({
        defaultLimit: 20,
        maxLimit: 100,
        includeOffset: true,
        includePage: true,
      });

      const queryBuilder = createQueryBuilder({
        pagination: paginationConfigSchema,
      });

      const dataSchema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const _outputSchema = queryBuilder.buildOutputSchema(dataSchema);
      expect(_outputSchema).toBeDefined();

      type OutputType = z.infer<typeof _outputSchema>;

      // Should have data array
      expectTypeOf<OutputType>().toHaveProperty('data');
      expectTypeOf<OutputType['data']>().toEqualTypeOf<{ id: string; name: string }[]>();

      // Should have meta with pagination fields
      expectTypeOf<OutputType>().toHaveProperty('meta');
      expectTypeOf<OutputType['meta']>().toExtend<{
        total: number;
        limit: number;
        hasMore: boolean;
        offset: number;
        page?: number | undefined;
        totalPages?: number | undefined;
        nextCursor?: string | null | undefined;
        prevCursor?: string | null | undefined;
      }>();
    });
  });

  describe('Config schema factory functions', () => {
    it('should create pagination config schema with defaults', () => {
      const configSchema = createPaginationConfigSchema({
        defaultLimit: 20,
        maxLimit: 100,
      });
      
      expect(configSchema).toBeDefined();
      // Config schema should be usable with QueryBuilder
      const queryBuilder = createQueryBuilder({ pagination: configSchema });
      const inputSchema = queryBuilder.buildInputSchema();
      
      // Should have limit field
      const result = inputSchema.parse({});
      expect(result).toHaveProperty('limit');
    });

    it('should create sorting config schema with fields', () => {
      const configSchema = createSortingConfigSchema(['name', 'email', 'createdAt'] as const, {
        defaultField: 'createdAt',
        defaultDirection: 'desc',
      });
      
      expect(configSchema).toBeDefined();
      const queryBuilder = createQueryBuilder({ sorting: configSchema });
      const inputSchema = queryBuilder.buildInputSchema();
      
      // Should accept valid sort fields
      const result = inputSchema.parse({ sortBy: 'name', sortDirection: 'asc' });
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should create filtering config schema with operators', () => {
      const configSchema = createFilteringConfigSchema({
        name: { schema: z.string(), operators: ['eq', 'like', 'ilike'] as const },
        age: { schema: z.number(), operators: ['gt', 'gte', 'lt', 'lte'] as const },
        active: z.boolean(),
      });
      
      expect(configSchema).toBeDefined();
      const queryBuilder = createQueryBuilder({ filtering: configSchema });
      const inputSchema = queryBuilder.buildInputSchema();
      
      // Should accept filter fields
      const result = inputSchema.parse({ name: 'John', age_gt: 18 });
      expect(result.name).toBe('John');
      expect(result.age_gt).toBe(18);
    });

    it('should create search config schema with searchable fields', () => {
      const configSchema = createSearchConfigSchema(['title', 'description', 'content'] as const, {
        minQueryLength: 2,
        maxQueryLength: 100,
        allowFieldSelection: true,
      });
      
      expect(configSchema).toBeDefined();
      const queryBuilder = createQueryBuilder({ search: configSchema });
      const inputSchema = queryBuilder.buildInputSchema();
      
      // Should accept search query
      const result = inputSchema.parse({ query: 'test search' });
      expect(result.query).toBe('test search');
    });
  });

  describe('Combined config schemas', () => {
    it('should combine multiple config schemas in one query builder', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 50 });
      const sortingConfig = createSortingConfigSchema(['name', 'date'] as const);
      const filteringConfig = createFilteringConfigSchema({
        status: { schema: z.enum(['active', 'inactive']), operators: ['eq'] as const },
      });
      const searchConfig = createSearchConfigSchema(['name', 'description'] as const);
      
      const queryBuilder = createQueryBuilder({
        pagination: paginationConfig,
        sorting: sortingConfig,
        filtering: filteringConfig,
        search: searchConfig,
      });
      
      const inputSchema = queryBuilder.buildInputSchema();
      
      // Should parse a complete query
      const result = inputSchema.parse({
        limit: 20,
        sortBy: 'name',
        sortDirection: 'asc',
        status: 'active',
        query: 'test',
      });
      
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('name');
      expect(result.status).toBe('active');
      expect(result.query).toBe('test');
    });
  });
});
