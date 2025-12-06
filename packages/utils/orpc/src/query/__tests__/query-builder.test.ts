import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createQueryBuilder, createListQuery, createSearchQuery, createAdvancedQuery } from '../query-builder';

describe('QueryBuilder', () => {
  describe('createQueryBuilder', () => {
    it('should create query with pagination only', () => {
      const schema = createQueryBuilder({
        pagination: { defaultLimit: 10, maxLimit: 100 },
      });
      
      const result = schema.parse({});
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should create query with sorting only', () => {
      const schema = createQueryBuilder({
        sorting: { fields: ['name', 'createdAt'], defaultField: 'createdAt' },
      });
      
      const result = schema.parse({});
      expect(result.sortBy).toBe('createdAt');
    });

    it('should create query with filtering only', () => {
      const schema = createQueryBuilder({
        filtering: {
          fields: {
            name: z.string(),
            age: z.number(),
          },
        },
      });
      
      const result = schema.parse({ name: 'John', age: 30 });
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should create query with search only', () => {
      const schema = createQueryBuilder({
        search: { searchFields: ['name', 'email'] },
      });
      
      const result = schema.parse({ q: 'test' });
      expect(result.q).toBe('test');
    });

    it('should combine pagination and sorting', () => {
      const schema = createQueryBuilder({
        pagination: { defaultLimit: 20 },
        sorting: { fields: ['name', 'email'], defaultField: 'name' },
      });
      
      const result = schema.parse({ limit: 50, sortBy: 'email' });
      expect(result.limit).toBe(50);
      expect(result.sortBy).toBe('email');
    });

    it('should combine pagination, sorting, and filtering', () => {
      const schema = createQueryBuilder({
        pagination: { defaultLimit: 10 },
        sorting: { fields: ['name', 'createdAt'] },
        filtering: {
          fields: {
            name: { schema: z.string(), operators: ['like'] },
            active: z.boolean(),
          },
        },
      });
      
      const result = schema.parse({
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
      const schema = createQueryBuilder({
        pagination: { defaultLimit: 10, maxLimit: 100 },
        sorting: { fields: ['name', 'createdAt'], defaultField: 'createdAt' },
        filtering: {
          fields: {
            age: { schema: z.number(), operators: ['gt', 'lt'] },
            status: z.enum(['active', 'inactive']),
          },
        },
        search: { searchFields: ['name', 'email'] },
      });
      
      const result = schema.parse({
        limit: 25,
        offset: 50,
        sortBy: 'name',
        sortDirection: 'asc',
        age_gt: 18,
        age_lt: 65,
        status: 'active',
        q: 'john',
      });
      
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(50);
      expect(result.sortBy).toBe('name');
      expect(result.age_gt).toBe(18);
      expect(result.age_lt).toBe(65);
      expect(result.status).toBe('active');
      expect(result.q).toBe('john');
    });
  });

  describe('createListQuery', () => {
    it('should create list query with default pagination', () => {
      const schema = createListQuery(['name', 'createdAt']);
      const result = schema.parse({});
      
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should create list query with custom pagination config', () => {
      const schema = createListQuery(['name'], {
        paginationConfig: { defaultLimit: 25, maxLimit: 50 },
      });
      
      const result = schema.parse({});
      expect(result.limit).toBe(25);
      
      expect(() => schema.parse({ limit: 100 })).toThrow();
    });

    it('should create list query with sorting', () => {
      const schema = createListQuery(['name', 'email', 'createdAt']);
      
      const result = schema.parse({ sortBy: 'email', sortDirection: 'desc' });
      expect(result.sortBy).toBe('email');
      expect(result.sortDirection).toBe('desc');
    });

    it('should create list query with default sort', () => {
      const schema = createListQuery(['name', 'createdAt'], {
        sortConfig: { defaultField: 'createdAt', defaultDirection: 'desc' },
      });
      
      const result = schema.parse({});
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortDirection).toBe('desc');
    });
  });

  describe('createSearchQuery', () => {
    it('should create search query with default config', () => {
      const schema = createSearchQuery(['name', 'email']);
      
      const result = schema.parse({ q: 'test' });
      expect(result.q).toBe('test');
      expect(result.limit).toBe(10);
    });

    it('should create search query with custom pagination', () => {
      const schema = createSearchQuery(['name'], {
        paginationConfig: { defaultLimit: 20 },
      });
      
      const result = schema.parse({ q: 'test' });
      expect(result.limit).toBe(20);
    });

    it('should create search query with field selection', () => {
      const schema = createSearchQuery(['name', 'email', 'description'], {
        searchConfig: { defaultFields: ['name', 'email'] },
      });
      
      const result = schema.parse({ q: 'test' });
      expect(result.searchFields).toEqual(['name', 'email']);
    });

    it('should allow overriding search fields', () => {
      const schema = createSearchQuery(['name', 'email', 'description']);
      
      const result = schema.parse({ 
        q: 'test',
        searchFields: ['description']
      });
      
      expect(result.searchFields).toEqual(['description']);
    });
  });

  describe('createAdvancedQuery', () => {
    it('should create advanced query with all features', () => {
      const schema = createAdvancedQuery({
        sortFields: ['name', 'createdAt'],
        searchFields: ['name', 'email'],
        filterFields: {
          age: { schema: z.number(), operators: ['gt', 'lt'] },
          active: z.boolean(),
        },
      });
      
      const result = schema.parse({
        q: 'john',
        limit: 20,
        sortBy: 'name',
        age_gt: 18,
        active: true,
      });
      
      expect(result.q).toBe('john');
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('name');
      expect(result.age_gt).toBe(18);
      expect(result.active).toBe(true);
    });

    it('should create advanced query with custom configs', () => {
      const schema = createAdvancedQuery({
        sortFields: ['name'],
        searchFields: ['name'],
        filterFields: { status: z.string() },
        paginationConfig: { defaultLimit: 50 },
        sortConfig: { defaultField: 'name' },
      });
      
      const result = schema.parse({});
      expect(result.limit).toBe(50);
      expect(result.sortBy).toBe('name');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configuration', () => {
      const schema = createQueryBuilder({});
      const result = schema.parse({});
      
      expect(result).toEqual({});
    });

    it('should handle partial query parameters', () => {
      const schema = createQueryBuilder({
        pagination: { defaultLimit: 10 },
        sorting: { fields: ['name', 'email'] },
      });
      
      const result = schema.parse({ limit: 20 });
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBeUndefined();
    });

    it('should validate all parameters when provided', () => {
      const schema = createQueryBuilder({
        pagination: { maxLimit: 50 },
        sorting: { fields: ['name'] },
      });
      
      expect(() => schema.parse({ 
        limit: 100,
        sortBy: 'invalid'
      })).toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety across all query parts', () => {
      const schema = createQueryBuilder({
        pagination: { defaultLimit: 10 },
        sorting: { fields: ['name', 'email'] },
        filtering: {
          fields: {
            age: { schema: z.number(), operators: ['gt'] },
          },
        },
      });
      
      const result = schema.parse({
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
