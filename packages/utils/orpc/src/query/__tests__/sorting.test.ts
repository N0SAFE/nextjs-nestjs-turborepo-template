import { describe, it, expect } from 'vitest';
import {
  createSortingConfigSchema,
  createSortingSchema,
  createSimpleSortSchema,
  createMultiSortSchema,
  CONFIG_SYMBOL,
  isZodSchemaWithConfig,
  sortDirection,
  nullsHandling,
} from '../sorting';

describe('Sorting', () => {
  describe('createSortingConfigSchema', () => {
    it('should create config schema with fields', () => {
      const config = createSortingConfigSchema(['name', 'email'] as const);
      const result = config.parse({});
      
      expect(result.fields).toEqual(['name', 'email']);
      expect(result.defaultDirection).toBe('asc');
      expect(result.allowMultiple).toBe(false);
      expect(result.allowNullsHandling).toBe(false);
    });

    it('should accept default field and direction', () => {
      const config = createSortingConfigSchema(['name', 'createdAt'] as const, {
        defaultField: 'createdAt',
        defaultDirection: 'desc',
      });
      const result = config.parse({});
      
      expect(result.defaultField).toBe('createdAt');
      expect(result.defaultDirection).toBe('desc');
    });

    it('should allow configuring multiple sort fields', () => {
      const config = createSortingConfigSchema(['name', 'email'] as const, {
        allowMultiple: true,
      });
      const result = config.parse({});
      
      expect(result.allowMultiple).toBe(true);
    });

    it('should allow configuring nulls handling', () => {
      const config = createSortingConfigSchema(['name'] as const, {
        allowNullsHandling: true,
      });
      const result = config.parse({});
      
      expect(result.allowNullsHandling).toBe(true);
    });

    it('should have CONFIG_SYMBOL attached', () => {
      const config = createSortingConfigSchema(['name'] as const);
      
      expect(CONFIG_SYMBOL in config).toBe(true);
      expect(config[CONFIG_SYMBOL]).toBeDefined();
      expect(config[CONFIG_SYMBOL].fields).toEqual(['name']);
    });
  });

  describe('createSortingSchema', () => {
    it('should create sorting schema with single field', () => {
      const config = createSortingConfigSchema(['name'] as const);
      const schema = createSortingSchema(config);
      const result = schema.parse({ sortBy: 'name', sortDirection: 'asc' });
      
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should create sorting schema with multiple fields', () => {
      const config = createSortingConfigSchema(['name', 'createdAt', 'email'] as const);
      const schema = createSortingSchema(config);
      
      const result1 = schema.parse({ sortBy: 'name', sortDirection: 'desc' });
      expect(result1.sortBy).toBe('name');
      
      const result2 = schema.parse({ sortBy: 'createdAt', sortDirection: 'asc' });
      expect(result2.sortBy).toBe('createdAt');
    });

    it('should use default field and direction', () => {
      const config = createSortingConfigSchema(['name', 'createdAt'] as const, {
        defaultField: 'createdAt',
        defaultDirection: 'desc',
      });
      const schema = createSortingSchema(config);
      
      const result = schema.parse({});
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortDirection).toBe('desc');
    });

    it('should reject invalid field', () => {
      const config = createSortingConfigSchema(['name', 'email'] as const);
      const schema = createSortingSchema(config);
      
      expect(() => schema.parse({ sortBy: 'invalid', sortDirection: 'asc' })).toThrow();
    });

    it('should reject invalid direction', () => {
      const config = createSortingConfigSchema(['name'] as const);
      const schema = createSortingSchema(config);
      
      expect(() => schema.parse({ sortBy: 'name', sortDirection: 'invalid' })).toThrow();
    });

    it('should make sorting optional when no defaults provided', () => {
      const config = createSortingConfigSchema(['name', 'email'] as const);
      const schema = createSortingSchema(config);
      
      const result = schema.parse({});
      expect(result.sortBy).toBeUndefined();
      expect(result.sortDirection).toBe('asc'); // Default direction still applies
    });

    it('should support nulls handling', () => {
      const config = createSortingConfigSchema(['name'] as const, {
        allowNullsHandling: true,
      });
      const schema = createSortingSchema(config);
      
      const result = schema.parse({ sortBy: 'name', sortDirection: 'asc', nullsHandling: 'first' });
      expect(result.sortBy).toBe('name');
      expect(result.nullsHandling).toBe('first');
    });

    it('should support multi-field sorting', () => {
      const config = createSortingConfigSchema(['name', 'email', 'createdAt'] as const, {
        allowMultiple: true,
      });
      const schema = createSortingSchema(config);
      
      const result = schema.parse({ 
        sortBy: [
          { field: 'name', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' }
        ]
      });
      
      expect(Array.isArray(result.sortBy)).toBe(true);
      expect(result.sortBy).toHaveLength(2);
    });

    it('should throw error for empty fields array', () => {
      const config = createSortingConfigSchema([] as const);
      
      expect(() => createSortingSchema(config)).toThrow('At least one sortable field must be provided');
    });
  });

  describe('Helper Functions', () => {
    it('createSimpleSortSchema should create a simple sort schema', () => {
      const schema = createSimpleSortSchema(['name', 'createdAt'] as const, 'name');
      const result = schema.parse({});
      
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('createMultiSortSchema should create a multi-sort schema', () => {
      const schema = createMultiSortSchema(['name', 'price', 'createdAt'] as const);
      const result = schema.parse({
        sortBy: [{ field: 'name', direction: 'asc' }]
      });
      
      expect(Array.isArray(result.sortBy)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single element field array', () => {
      const config = createSortingConfigSchema(['name'] as const);
      const schema = createSortingSchema(config);
      const result = schema.parse({ sortBy: 'name', sortDirection: 'asc' });
      
      expect(result.sortBy).toBe('name');
    });

    it('should handle large number of fields', () => {
      const fields = Array.from({ length: 100 }, (_, i) => `field${String(i)}`);
      const config = createSortingConfigSchema(fields);
      const schema = createSortingSchema(config);
      
      const result = schema.parse({ sortBy: 'field50', sortDirection: 'desc' });
      expect(result.sortBy).toBe('field50');
    });

    it('should handle fields with special characters', () => {
      const config = createSortingConfigSchema(['user_name', 'created_at'] as const);
      const schema = createSortingSchema(config);
      const result = schema.parse({ sortBy: 'user_name', sortDirection: 'asc' });
      
      expect(result.sortBy).toBe('user_name');
    });
  });

  describe('Type Safety', () => {
    it('should enforce field type safety', () => {
      const config = createSortingConfigSchema(['name', 'email'] as const);
      const schema = createSortingSchema(config);
      
      const result = schema.parse({ sortBy: 'name', sortDirection: 'asc' });
      expect(result.sortBy).toBe('name');
    });

    it('should enforce direction type safety', () => {
      const config = createSortingConfigSchema(['name'] as const);
      const schema = createSortingSchema(config);
      
      const result = schema.parse({ sortBy: 'name', sortDirection: 'asc' });
      expect(result.sortDirection).toBe('asc');
    });
  });

  describe('Utility Functions', () => {
    it('isZodSchemaWithConfig should return true for config schemas', () => {
      const config = createSortingConfigSchema(['name'] as const);
      expect(isZodSchemaWithConfig(config)).toBe(true);
    });

    it('isZodSchemaWithConfig should return false for regular values', () => {
      expect(isZodSchemaWithConfig({})).toBe(false);
      expect(isZodSchemaWithConfig(null)).toBe(false);
      expect(isZodSchemaWithConfig('string')).toBe(false);
    });

    it('CONFIG_SYMBOL should return the config from a config schema', () => {
      const config = createSortingConfigSchema(['name', 'email'] as const, {
        defaultField: 'name',
        defaultDirection: 'desc',
      });
      const extracted = config[CONFIG_SYMBOL];
      
      expect(extracted.fields).toEqual(['name', 'email']);
      expect(extracted.defaultField).toBe('name');
      expect(extracted.defaultDirection).toBe('desc');
    });
  });

  describe('Standalone Schemas', () => {
    it('sortDirection should validate direction', () => {
      expect(sortDirection.parse('asc')).toBe('asc');
      expect(sortDirection.parse('desc')).toBe('desc');
      expect(sortDirection.parse(undefined)).toBe('asc'); // default
      expect(() => sortDirection.parse('invalid')).toThrow();
    });

    it('nullsHandling should validate nulls handling', () => {
      expect(nullsHandling.parse('first')).toBe('first');
      expect(nullsHandling.parse('last')).toBe('last');
      expect(nullsHandling.parse(undefined)).toBeUndefined();
      expect(() => nullsHandling.parse('invalid')).toThrow();
    });
  });
});
