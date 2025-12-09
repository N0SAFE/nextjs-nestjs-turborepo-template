import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createQueryBuilder, createListQuery, createSearchQuery, createAdvancedQuery } from '../query-builder';

describe('QueryBuilder', () => {
  describe('createQueryBuilder', () => {
    it('should create query with pagination only', () => {
      const builder = createQueryBuilder({
        pagination: { defaultLimit: 10, maxLimit: 100 },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should create query with sorting only', () => {
      const builder = createQueryBuilder({
        sorting: { fields: ['name', 'createdAt'], defaultField: 'createdAt' },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.sortBy).toBe('createdAt');
    });

    it('should create query with filtering only', () => {
      const builder = createQueryBuilder({
        filtering: {
          fields: {
            name: z.string(),
            age: z.number(),
          },
        },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ name: 'John', age: 30 });
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should create query with search only', () => {
      const builder = createQueryBuilder({
        search: { searchableFields: ['name', 'email'] },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ query: 'test' });
      expect(result.query).toBe('test');
    });

    it('should combine pagination and sorting', () => {
      const builder = createQueryBuilder({
        pagination: { defaultLimit: 20 },
        sorting: { fields: ['name', 'email'], defaultField: 'name' },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ limit: 50, sortBy: 'email' });
      expect(result.limit).toBe(50);
      expect(result.sortBy).toBe('email');
    });

    it('should combine pagination, sorting, and filtering', () => {
      const builder = createQueryBuilder({
        pagination: { defaultLimit: 10 },
        sorting: { fields: ['name', 'createdAt'] },
        filtering: {
          fields: {
            name: { schema: z.string(), operators: ['like'] },
            active: z.boolean(),
          },
        },
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
      const builder = createQueryBuilder({
        pagination: { defaultLimit: 10, maxLimit: 100 },
        sorting: { fields: ['name', 'createdAt'], defaultField: 'createdAt' },
        filtering: {
          fields: {
            age: { schema: z.number(), operators: ['gt', 'lt'] },
            status: z.enum(['active', 'inactive']),
          },
        },
        search: { searchableFields: ['name', 'email'] },
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

    it('should create list query with default sort', () => {
      const builder = createListQuery(['name', 'createdAt']);
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      expect(result.sortBy).toBeDefined();
    });
  });

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
      const result = inputSchema.parse({});
      expect(result.limit).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configuration', () => {
      const builder = createQueryBuilder({});
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({});
      
      expect(result).toEqual({});
    });

    it('should handle partial query parameters', () => {
      const builder = createQueryBuilder({
        pagination: { defaultLimit: 10 },
        sorting: { fields: ['name', 'email'] },
      });
      
      const inputSchema = builder.buildInputSchema();
      const result = inputSchema.parse({ limit: 20 });
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety across all query parts', () => {
      const builder = createQueryBuilder({
        pagination: { defaultLimit: 10 },
        sorting: { fields: ['name', 'email'] },
        filtering: {
          fields: {
            age: { schema: z.number(), operators: ['gt'] },
          },
        },
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
  });
});
