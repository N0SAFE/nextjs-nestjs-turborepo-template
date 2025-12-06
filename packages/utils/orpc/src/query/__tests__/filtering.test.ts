import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  createFilteringSchema,
  createStringFilter,
  createNumberFilter,
  createDateFilter,
  createBooleanFilter,
  createEnumFilter,
} from '../filtering';

describe('Filtering', () => {
  describe('createFilteringSchema', () => {
    it('should create filtering schema with single field', () => {
      const schema = createFilteringSchema({
        fields: {
          name: z.string(),
        },
      });
      
      const result = schema.parse({ name: 'John' });
      expect(result.name).toBe('John');
    });

    it('should create filtering schema with multiple fields', () => {
      const schema = createFilteringSchema({
        fields: {
          name: z.string(),
          age: z.number(),
          active: z.boolean(),
        },
      });
      
      const result = schema.parse({ 
        name: 'John', 
        age: 30, 
        active: true 
      });
      
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
    });

    it('should support field with specific operators', () => {
      const schema = createFilteringSchema({
        fields: {
          name: { 
            schema: z.string(), 
            operators: ['eq', 'like', 'ilike'] 
          },
        },
      });
      
      const result = schema.parse({ 
        name: 'John',
        name_like: 'Jo',
        name_ilike: 'JOHN',
      });
      
      expect(result.name).toBe('John');
      expect(result.name_like).toBe('Jo');
      expect(result.name_ilike).toBe('JOHN');
    });

    it('should support number comparison operators', () => {
      const schema = createFilteringSchema({
        fields: {
          age: { 
            schema: z.number(), 
            operators: ['eq', 'gt', 'gte', 'lt', 'lte'] 
          },
        },
      });
      
      const result = schema.parse({ 
        age_gt: 18,
        age_lte: 65,
      });
      
      expect(result.age_gt).toBe(18);
      expect(result.age_lte).toBe(65);
    });

    it('should support in and nin operators with arrays', () => {
      const schema = createFilteringSchema({
        fields: {
          status: { 
            schema: z.string(), 
            operators: ['in', 'nin'] 
          },
        },
      });
      
      const result = schema.parse({ 
        status_in: ['active', 'pending'],
        status_nin: ['deleted'],
      });
      
      expect(result.status_in).toEqual(['active', 'pending']);
      expect(result.status_nin).toEqual(['deleted']);
    });

    it('should support between operator', () => {
      const schema = createFilteringSchema({
        fields: {
          age: { 
            schema: z.number(), 
            operators: ['between'] 
          },
        },
      });
      
      const result = schema.parse({ 
        age_between: [18, 65],
      });
      
      expect(result.age_between).toEqual([18, 65]);
    });

    it('should support exists operator', () => {
      const schema = createFilteringSchema({
        fields: {
          email: { 
            schema: z.string(), 
            operators: ['exists'] 
          },
        },
      });
      
      const result = schema.parse({ 
        email_exists: true,
      });
      
      expect(result.email_exists).toBe(true);
    });

    it('should make all filter fields optional', () => {
      const schema = createFilteringSchema({
        fields: {
          name: z.string(),
          age: z.number(),
        },
      });
      
      const result1 = schema.parse({});
      expect(result1).toEqual({});
      
      const result2 = schema.parse({ name: 'John' });
      expect(result2.name).toBe('John');
      expect(result2.age).toBeUndefined();
    });
  });

  describe('createStringFilter', () => {
    it('should create string filter with all operators', () => {
      const filter = createStringFilter(['eq', 'ne', 'like', 'ilike', 'startsWith', 'endsWith', 'contains']);
      const schema = z.object(filter);
      
      const result = schema.parse({
        value: 'test',
        value_like: '%test%',
        value_ilike: '%TEST%',
        value_startsWith: 'te',
        value_endsWith: 'st',
        value_contains: 'es',
      });
      
      expect(result.value).toBe('test');
      expect(result.value_like).toBe('%test%');
      expect(result.value_contains).toBe('es');
    });

    it('should create string filter with selected operators', () => {
      const filter = createStringFilter(['eq', 'like']);
      const schema = z.object(filter);
      
      const result = schema.parse({
        value: 'test',
        value_like: '%test%',
      });
      
      expect(result.value).toBe('test');
      expect(result.value_like).toBe('%test%');
    });

    it('should make all operators optional', () => {
      const filter = createStringFilter(['eq', 'like', 'ilike']);
      const schema = z.object(filter);
      
      const result = schema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('createNumberFilter', () => {
    it('should create number filter with comparison operators', () => {
      const filter = createNumberFilter(['eq', 'ne', 'gt', 'gte', 'lt', 'lte']);
      const schema = z.object(filter);
      
      const result = schema.parse({
        value: 10,
        value_gt: 5,
        value_lte: 20,
      });
      
      expect(result.value).toBe(10);
      expect(result.value_gt).toBe(5);
      expect(result.value_lte).toBe(20);
    });

    it('should support in and nin operators with number arrays', () => {
      const filter = createNumberFilter(['in', 'nin']);
      const schema = z.object(filter);
      
      const result = schema.parse({
        value_in: [1, 2, 3],
        value_nin: [4, 5],
      });
      
      expect(result.value_in).toEqual([1, 2, 3]);
      expect(result.value_nin).toEqual([4, 5]);
    });

    it('should support between operator', () => {
      const filter = createNumberFilter(['between']);
      const schema = z.object(filter);
      
      const result = schema.parse({
        value_between: [10, 20],
      });
      
      expect(result.value_between).toEqual([10, 20]);
    });

    it('should reject non-number values', () => {
      const filter = createNumberFilter(['eq', 'gt']);
      const schema = z.object(filter);
      
      expect(() => schema.parse({ value: 'not a number' })).toThrow();
      expect(() => schema.parse({ value_gt: '10' })).toThrow();
    });
  });

  describe('createDateFilter', () => {
    it('should create date filter with comparison operators', () => {
      const filter = createDateFilter(['eq', 'gt', 'gte', 'lt', 'lte']);
      const schema = z.object(filter);
      
      const result = schema.parse({
        value: '2024-01-01T00:00:00Z',
        value_gt: '2024-01-01T00:00:00Z',
        value_lte: '2024-12-31T23:59:59Z',
      });
      
      expect(result.value).toBe('2024-01-01T00:00:00Z');
      expect(result.value_gt).toBe('2024-01-01T00:00:00Z');
      expect(result.value_lte).toBe('2024-12-31T23:59:59Z');
    });

    it('should support between operator for dates', () => {
      const filter = createDateFilter(['between']);
      const schema = z.object(filter);
      
      const result = schema.parse({
        value_between: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z'],
      });
      
      expect(result.value_between).toEqual(['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']);
    });

    it('should reject invalid date strings', () => {
      const filter = createDateFilter(['eq']);
      const schema = z.object(filter);
      
      expect(() => schema.parse({ value: 'not a date' })).toThrow();
      expect(() => schema.parse({ value: '2024-13-01' })).toThrow();
    });
  });

  describe('createBooleanFilter', () => {
    it('should create boolean filter', () => {
      const filter = createBooleanFilter();
      const schema = z.object(filter);
      
      const result = schema.parse({ value: true });
      expect(result.value).toBe(true);
    });

    it('should accept both true and false', () => {
      const filter = createBooleanFilter();
      const schema = z.object(filter);
      
      const result1 = schema.parse({ value: true });
      expect(result1.value).toBe(true);
      
      const result2 = schema.parse({ value: false });
      expect(result2.value).toBe(false);
    });

    it('should reject non-boolean values', () => {
      const filter = createBooleanFilter();
      const schema = z.object(filter);
      
      expect(() => schema.parse({ value: 'true' })).toThrow();
      expect(() => schema.parse({ value: 1 })).toThrow();
    });

    it('should be optional', () => {
      const filter = createBooleanFilter();
      const schema = z.object(filter);
      
      const result = schema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('createEnumFilter', () => {
    it('should create enum filter with specific values', () => {
      const filter = createEnumFilter(['active', 'inactive', 'pending']);
      const schema = z.object(filter);
      
      const result = schema.parse({ value: 'active' });
      expect(result.value).toBe('active');
    });

    it('should reject values not in enum', () => {
      const filter = createEnumFilter(['active', 'inactive']);
      const schema = z.object(filter);
      
      expect(() => schema.parse({ value: 'unknown' })).toThrow();
    });

    it('should support in operator with enum values', () => {
      const filter = createEnumFilter(['active', 'inactive', 'pending'], ['in', 'nin']);
      const schema = z.object(filter);
      
      const result = schema.parse({ 
        value_in: ['active', 'pending'],
      });
      
      expect(result.value_in).toEqual(['active', 'pending']);
    });

    it('should reject invalid enum values in array operators', () => {
      const filter = createEnumFilter(['active', 'inactive'], ['in']);
      const schema = z.object(filter);
      
      expect(() => schema.parse({ value_in: ['active', 'unknown'] })).toThrow();
    });
  });

  describe('Complex Filtering Scenarios', () => {
    it('should combine multiple field types', () => {
      const schema = createFilteringSchema({
        fields: {
          name: { schema: z.string(), operators: ['eq', 'like'] },
          age: { schema: z.number(), operators: ['gt', 'lt'] },
          active: z.boolean(),
          status: { schema: z.enum(['active', 'inactive']), operators: ['eq', 'in'] },
        },
      });
      
      const result = schema.parse({
        name_like: 'John',
        age_gt: 18,
        age_lt: 65,
        active: true,
        status_in: ['active'],
      });
      
      expect(result.name_like).toBe('John');
      expect(result.age_gt).toBe(18);
      expect(result.age_lt).toBe(65);
      expect(result.active).toBe(true);
      expect(result.status_in).toEqual(['active']);
    });

    it('should handle partial filters', () => {
      const schema = createFilteringSchema({
        fields: {
          name: z.string(),
          age: z.number(),
          email: z.string(),
        },
      });
      
      const result = schema.parse({ name: 'John' });
      expect(result).toEqual({ name: 'John' });
    });

    it('should handle no filters', () => {
      const schema = createFilteringSchema({
        fields: {
          name: z.string(),
          age: z.number(),
        },
      });
      
      const result = schema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const schema = createFilteringSchema({
        fields: {
          name: { schema: z.string(), operators: ['eq'] },
        },
      });
      
      const result = schema.parse({ name: '' });
      expect(result.name).toBe('');
    });

    it('should handle zero values for numbers', () => {
      const schema = createFilteringSchema({
        fields: {
          count: { schema: z.number(), operators: ['eq'] },
        },
      });
      
      const result = schema.parse({ count: 0 });
      expect(result.count).toBe(0);
    });

    it('should handle very large numbers', () => {
      const schema = createFilteringSchema({
        fields: {
          value: { schema: z.number(), operators: ['gt'] },
        },
      });
      
      const result = schema.parse({ value_gt: 999999999 });
      expect(result.value_gt).toBe(999999999);
    });

    it('should handle special characters in strings', () => {
      const schema = createFilteringSchema({
        fields: {
          name: { schema: z.string(), operators: ['like'] },
        },
      });
      
      const result = schema.parse({ name_like: '%John@Doe.com%' });
      expect(result.name_like).toBe('%John@Doe.com%');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for operators', () => {
      const schema = createFilteringSchema({
        fields: {
          age: { schema: z.number(), operators: ['gt', 'lt'] },
        },
      });
      
      const result = schema.parse({ age_gt: 18, age_lt: 65 });
      
      expect(typeof result.age_gt).toBe('number');
      expect(typeof result.age_lt).toBe('number');
    });

    it('should reject mismatched types', () => {
      const schema = createFilteringSchema({
        fields: {
          age: { schema: z.number(), operators: ['gt'] },
        },
      });
      
      expect(() => schema.parse({ age_gt: '18' })).toThrow();
    });
  });
});
