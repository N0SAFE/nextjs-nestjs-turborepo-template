import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { 
  createQueryBuilder, 
  createListQuery, 
  createSearchQuery, 
  createAdvancedQuery,
  QueryBuilder,
} from '../query-builder';
import { createPaginationConfigSchema } from '../pagination';
import { createSortingConfigSchema } from '../sorting';
import { createFilteringConfigSchema } from '../filtering';
import { createSearchConfigSchema } from '../search';

describe('QueryBuilder', () => {
  // ============================================
  // createQueryBuilder Tests
  // ============================================
  describe('createQueryBuilder', () => {
    it('should create query with pagination only', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 100 });
      const builder = createQueryBuilder({
        pagination: paginationConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should create query with sorting only', () => {
      const sortingConfig = createSortingConfigSchema(['name', 'createdAt'], { defaultField: 'createdAt' });
      const builder = createQueryBuilder({
        sorting: sortingConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.sortBy).toBe('createdAt');
    });

    it('should create query with filtering only', () => {
      const filteringConfig = createFilteringConfigSchema({
        name: z.string(),
        age: z.number(),
      });
      const builder = createQueryBuilder({
        filtering: filteringConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ name: 'John', age: 30 });
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should create query with search only', () => {
      const searchConfig = createSearchConfigSchema(['name', 'email']);
      const builder = createQueryBuilder({
        search: searchConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ query: 'test' });
      expect(result.query).toBe('test');
    });

    it('should combine pagination and sorting', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 20 });
      const sortingConfig = createSortingConfigSchema(['name', 'email'], { defaultField: 'name' });
      const builder = createQueryBuilder({
        pagination: paginationConfig,
        sorting: sortingConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ limit: 50, sortBy: 'email' });
      expect(result.limit).toBe(50);
      expect(result.sortBy).toBe('email');
    });

    it('should combine pagination, sorting, and filtering', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10 });
      const sortingConfig = createSortingConfigSchema(['name', 'createdAt']);
      const filteringConfig = createFilteringConfigSchema({
        name: { schema: z.string(), operators: ['like'] },
        active: z.boolean(),
      });
      const builder = createQueryBuilder({
        pagination: paginationConfig,
        sorting: sortingConfig,
        filtering: filteringConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({
        limit: 20,
        offset: 40,
        sortBy: 'name',
        sortDirection: 'desc',
        name_like: 'John',
        active: true,
      });
      
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('desc');
      expect(result.name_like).toBe('John');
      expect(result.active).toBe(true);
    });

    it('should combine all query features', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 100 });
      const sortingConfig = createSortingConfigSchema(['name', 'createdAt'], { defaultField: 'createdAt' });
      const filteringConfig = createFilteringConfigSchema({
        age: { schema: z.number(), operators: ['gt', 'lt'] },
        status: z.enum(['active', 'inactive']),
      });
      const searchConfig = createSearchConfigSchema(['name', 'email']);
      const builder = createQueryBuilder({
        pagination: paginationConfig,
        sorting: sortingConfig,
        filtering: filteringConfig,
        search: searchConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({
        limit: 25,
        offset: 50,
        sortBy: 'name',
        sortDirection: 'asc',
        age_gt: 18,
        age_lt: 65,
        status: 'active',
        query: 'john',
      });
      
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(50);
      expect(result.sortBy).toBe('name');
      expect(result.age_gt).toBe(18);
      expect(result.age_lt).toBe(65);
      expect(result.status).toBe('active');
      expect(result.query).toBe('john');
    });
  });

  // ============================================
  // createListQuery Tests
  // ============================================
  describe('createListQuery', () => {
    it('should create list query with default pagination', () => {
      const builder = createListQuery(['name', 'createdAt']);
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should create list query with custom pagination config', () => {
      const builder = createListQuery(['name'], { defaultLimit: 25, maxLimit: 50 });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.limit).toBe(25);
      
      expect(() => inputSchema.parse({ limit: 100 })).toThrow();
    });

    it('should create list query with sorting', () => {
      const builder = createListQuery(['name', 'email', 'createdAt']);
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ sortBy: 'email', sortDirection: 'desc' });
      expect(result.sortBy).toBe('email');
      expect(result.sortDirection).toBe('desc');
    });

    it('should create list query with default sort direction', () => {
      const builder = createListQuery(['name', 'createdAt']);
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.sortDirection).toBe('asc');
    });
  });

  // ============================================
  // createSearchQuery Tests
  // ============================================
  describe('createSearchQuery', () => {
    it('should create search query with default config', () => {
      const builder = createSearchQuery(['name', 'email']);
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ query: 'test' });
      expect(result.query).toBe('test');
      expect(result.limit).toBe(20);
    });

    it('should create search query with custom pagination', () => {
      const builder = createSearchQuery(['name'], { defaultLimit: 30 });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ query: 'test' });
      expect(result.limit).toBe(30);
    });

    it('should create search query with field selection', () => {
      const builder = createSearchQuery(['name', 'email', 'description']);
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ query: 'test', fields: ['name', 'email'] });
      expect(result.fields).toEqual(['name', 'email']);
    });

    it('should allow overriding search fields', () => {
      const builder = createSearchQuery(['name', 'email', 'description']);
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ 
        query: 'test',
        fields: ['description']
      });
      
      expect(result.fields).toEqual(['description']);
    });
  });

  // ============================================
  // createAdvancedQuery Tests
  // ============================================
  describe('createAdvancedQuery', () => {
    it('should create advanced query with all features', () => {
      const builder = createAdvancedQuery({
        sortableFields: ['name', 'createdAt'],
        searchableFields: ['name', 'email'],
        filterableFields: {
          age: { schema: z.number(), operators: ['gt', 'lt'] },
          active: z.boolean(),
        },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({
        query: 'john',
        limit: 20,
        sortBy: 'name',
        age_gt: 18,
        active: true,
      });
      
      expect(result.query).toBe('john');
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('name');
      expect(result.age_gt).toBe(18);
      expect(result.active).toBe(true);
    });

    it('should create advanced query with custom configs', () => {
      const builder = createAdvancedQuery({
        sortableFields: ['name'],
        searchableFields: ['name'],
        filterableFields: { status: z.string() },
        pagination: { defaultLimit: 50 },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ query: 'test' });
      expect(result.limit).toBe(50);
    });

    it('should create advanced query without search', () => {
      const builder = createAdvancedQuery({
        sortableFields: ['name', 'createdAt'],
        filterableFields: {
          status: z.enum(['active', 'inactive']),
        },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({
        sortBy: 'name',
        status: 'active',
      });
      
      expect(result.sortBy).toBe('name');
      expect(result.status).toBe('active');
    });
  });

  // ============================================
  // QueryBuilder Class Methods Tests
  // ============================================
  describe('QueryBuilder Class', () => {
    it('should build output schema with data and meta', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10 });
      const builder = new QueryBuilder({ pagination: paginationConfig });
      
      const itemSchema = z.object({ id: z.string(), name: z.string() });
      const outputSchema = builder.buildOutputSchema(itemSchema);
      
      const result = outputSchema.parse({
        data: [{ id: '1', name: 'Test' }],
        meta: { total: 1, limit: 10, hasMore: false, offset: 0 },
      });
      
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should build meta schema with pagination info', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10 });
      const builder = new QueryBuilder({ pagination: paginationConfig });
      
      const metaSchema = builder.buildMetaSchema();
      const result = metaSchema.parse({
        total: 100,
        limit: 10,
        hasMore: true,
        offset: 0,
      });
      
      expect(result.total).toBe(100);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(true);
    });

    it('should build meta schema with sorting info', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10 });
      const sortingConfig = createSortingConfigSchema(['name', 'createdAt']);
      const builder = new QueryBuilder({ 
        pagination: paginationConfig,
        sorting: sortingConfig,
      });
      
      const metaSchema = builder.buildMetaSchema();
      const result = metaSchema.parse({
        total: 100,
        limit: 10,
        hasMore: true,
        offset: 0,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should use withPagination to add pagination', () => {
      const builder = new QueryBuilder({});
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 15 });
      const newBuilder = builder.withPagination(paginationConfig);
      
      const inputSchema = newBuilder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.limit).toBe(15);
    });

    it('should use withSorting to add sorting', () => {
      const builder = new QueryBuilder({});
      const sortingConfig = createSortingConfigSchema(['name', 'email'], { defaultField: 'name' });
      const newBuilder = builder.withSorting(sortingConfig);
      
      const inputSchema = newBuilder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.sortBy).toBe('name');
    });

    it('should use withFiltering to add filtering', () => {
      const builder = new QueryBuilder({});
      const filteringConfig = createFilteringConfigSchema({ status: z.string() });
      const newBuilder = builder.withFiltering(filteringConfig);
      
      const inputSchema = newBuilder.buildInputSchema();
      const result = inputSchema.parse({ status: 'active' });
      expect(result.status).toBe('active');
    });

    it('should use withSearch to add search', () => {
      const builder = new QueryBuilder({});
      const searchConfig = createSearchConfigSchema(['name', 'email']);
      const newBuilder = builder.withSearch(searchConfig);
      
      const inputSchema = newBuilder.buildInputSchema();
      const result = inputSchema.parse({ query: 'test' });
      expect(result.query).toBe('test');
    });

    it('should use withCustomFields to add custom fields', () => {
      const builder = new QueryBuilder({});
      const newBuilder = builder.withCustomFields({
        includeDeleted: z.boolean().default(false),
        category: z.enum(['A', 'B', 'C']),
      });
      
      const inputSchema = newBuilder.buildInputSchema();
      const result = inputSchema.parse({ category: 'B' });
      expect(result.includeDeleted).toBe(false);
      expect(result.category).toBe('B');
    });

    it('should chain multiple with* methods', () => {
      const builder = new QueryBuilder({})
        .withPagination(createPaginationConfigSchema({ defaultLimit: 10 }))
        .withSorting(createSortingConfigSchema(['name']))
        .withCustomFields({ active: z.boolean().default(true) });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.limit).toBe(10);
      expect(result.active).toBe(true);
    });
  });

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('should handle empty configuration', () => {
      const builder = createQueryBuilder({});
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      
      expect(result).toEqual({});
    });

    it('should handle partial query parameters', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10 });
      const sortingConfig = createSortingConfigSchema(['name', 'email']);
      const builder = createQueryBuilder({
        pagination: paginationConfig,
        sorting: sortingConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ limit: 20 });
      expect(result.limit).toBe(20);
      // sortBy should have default or be undefined depending on config
    });

    it('should throw error when building pagination schema without config', () => {
      const builder = new QueryBuilder({});
      expect(() => builder.buildPaginationSchema()).toThrow("Pagination configuration not provided");
    });

    it('should throw error when building sorting schema without config', () => {
      const builder = new QueryBuilder({});
      expect(() => builder.buildSortingSchema()).toThrow("Sorting configuration not provided");
    });

    it('should throw error when building filtering schema without config', () => {
      const builder = new QueryBuilder({});
      expect(() => builder.buildFilteringSchema()).toThrow("Filtering configuration not provided");
    });

    it('should throw error when building search schema without config', () => {
      const builder = new QueryBuilder({});
      expect(() => builder.buildSearchSchema()).toThrow("Search configuration not provided");
    });
  });

  // ============================================
  // Type Safety Tests
  // ============================================
  describe('Type Safety', () => {
    it('should maintain type safety across all query parts', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10 });
      const sortingConfig = createSortingConfigSchema(['name', 'email']);
      const filteringConfig = createFilteringConfigSchema({
        age: { schema: z.number(), operators: ['gt'] },
      });
      const builder = createQueryBuilder({
        pagination: paginationConfig,
        sorting: sortingConfig,
        filtering: filteringConfig,
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({
        limit: 20,
        sortBy: 'name',
        age_gt: 18,
      });
      
      expect(typeof result.limit).toBe('number');
      expect(typeof result.sortBy).toBe('string');
      expect(typeof result.age_gt).toBe('number');
    });

    it('should enforce valid sorting field values', () => {
      const sortingConfig = createSortingConfigSchema(['name', 'email']);
      const builder = createQueryBuilder({ sorting: sortingConfig });
      const inputSchema = builder.buildInputSchema();
      
      expect(() => inputSchema.parse({ sortBy: 'invalid' })).toThrow();
    });

    it('should enforce valid filtering operator suffixes', () => {
      const filteringConfig = createFilteringConfigSchema({
        age: { schema: z.number(), operators: ['gt', 'lt'] },
      });
      const builder = createQueryBuilder({ filtering: filteringConfig });
      const inputSchema = builder.buildInputSchema();
      
      const result = inputSchema.parse({ age_gt: 18 });
      expect(result.age_gt).toBe(18);
    });

    it('should enforce pagination limits', () => {
      const paginationConfig = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 50 });
      const builder = createQueryBuilder({ pagination: paginationConfig });
      const inputSchema = builder.buildInputSchema();
      
      expect(() => inputSchema.parse({ limit: 100 })).toThrow();
    });
  });
});
