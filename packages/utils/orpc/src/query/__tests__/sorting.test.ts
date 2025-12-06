import { describe, it, expect } from 'vitest';
import { createSortingSchema } from '../sorting';

describe('Sorting', () => {
  describe('createSortingSchema', () => {
    it('should create sorting schema with single field', () => {
      const schema = createSortingSchema({ fields: ['name'] });
      const result = schema.parse({ sortBy: { field: 'name', direction: 'asc' } });
      
      expect(result.sortBy).toBeDefined();
    });

    it('should create sorting schema with multiple fields', () => {
      const schema = createSortingSchema({ fields: ['name', 'createdAt', 'email'] });
      
      const result1 = schema.parse({ sortBy: { field: 'name', direction: 'desc' } });
      expect(result1.sortBy).toBeDefined();
      
      const result2 = schema.parse({ sortBy: { field: 'createdAt', direction: 'asc' } });
      expect(result2.sortBy).toBeDefined();
    });

    it('should use default field and direction', () => {
      const schema = createSortingSchema({ 
        fields: ['name', 'createdAt'],
        defaultField: 'createdAt',
        defaultDirection: 'desc',
      });
      
      const result = schema.parse({});
      expect(result.sortBy).toBeDefined();
    });

    it('should reject invalid field', () => {
      const schema = createSortingSchema({ fields: ['name', 'email'] });
      
      expect(() => schema.parse({ sortBy: { field: 'invalid', direction: 'asc' } })).toThrow();
    });

    it('should reject invalid direction', () => {
      const schema = createSortingSchema({ fields: ['name'] });
      
      expect(() => schema.parse({ sortBy: { field: 'name', direction: 'invalid' } })).toThrow();
    });

    it('should make sorting optional when no defaults provided', () => {
      const schema = createSortingSchema({ fields: ['name', 'email'] });
      
      const result = schema.parse({});
      expect(result.sortBy).toBeUndefined();
    });

    it('should support nulls handling', () => {
      const schema = createSortingSchema({ 
        fields: ['name'],
        allowNullsHandling: true,
      });
      
      const result1 = schema.parse({ sortBy: { field: 'name', direction: 'asc', nulls: 'first' } });
      expect(result1.sortBy).toBeDefined();
    });

    it('should support multi-field sorting', () => {
      const schema = createSortingSchema({ 
        fields: ['name', 'email', 'createdAt'],
        allowMultiple: true,
      });
      
      const result = schema.parse({ 
        sortBy: [
          { field: 'name', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' }
        ]
      });
      
      expect(Array.isArray(result.sortBy)).toBe(true);
      expect(result.sortBy).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single element field array', () => {
      const schema = createSortingSchema({ fields: ['name'] });
      const result = schema.parse({ sortBy: { field: 'name', direction: 'asc' } });
      
      expect(result.sortBy).toBeDefined();
    });

    it('should handle large number of fields', () => {
      const fields = Array.from({ length: 100 }, (_, i) => `field${i}`);
      const schema = createSortingSchema({ fields });
      
      const result = schema.parse({ sortBy: { field: 'field50', direction: 'desc' } });
      expect(result.sortBy).toBeDefined();
    });

    it('should handle fields with special characters', () => {
      const schema = createSortingSchema({ fields: ['user_name', 'created_at'] });
      const result = schema.parse({ sortBy: { field: 'user_name', direction: 'asc' } });
      
      expect(result.sortBy).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce field type safety', () => {
      const schema = createSortingSchema({ fields: ['name', 'email'] as const });
      
      const result = schema.parse({ sortBy: { field: 'name', direction: 'asc' } });
      expect(result.sortBy).toBeDefined();
    });

    it('should enforce direction type safety', () => {
      const schema = createSortingSchema({ fields: ['name'] });
      
      const result = schema.parse({ sortBy: { field: 'name', direction: 'asc' } });
      expect(result.sortBy).toBeDefined();
    });
  });
});
