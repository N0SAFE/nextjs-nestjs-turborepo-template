import { describe, it, expect } from 'vitest';
import { createPaginationSchema } from '../pagination';

describe('Pagination', () => {
  describe('createPaginationSchema', () => {
    describe('Offset-based Pagination', () => {
      it('should create offset-based pagination schema with defaults', () => {
        const schema = createPaginationSchema();
        const result = schema.parse({});
        
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(0);
      });

      it('should allow custom limit and offset', () => {
        const schema = createPaginationSchema();
        const result = schema.parse({ limit: 20, offset: 40 });
        
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(40);
      });

      it('should enforce max limit', () => {
        const schema = createPaginationSchema({ maxLimit: 50 });
        
        expect(() => schema.parse({ limit: 100 })).toThrow();
        
        const result = schema.parse({ limit: 30 });
        expect(result.limit).toBe(30);
      });

      it('should enforce min limit', () => {
        const schema = createPaginationSchema({ minLimit: 5 });
        
        expect(() => schema.parse({ limit: 2 })).toThrow();
        
        const result = schema.parse({ limit: 10 });
        expect(result.limit).toBe(10);
      });

      it('should use custom default limit', () => {
        const schema = createPaginationSchema({ defaultLimit: 25 });
        const result = schema.parse({});
        
        expect(result.limit).toBe(25);
      });

      it('should reject negative offset', () => {
        const schema = createPaginationSchema();
        
        expect(() => schema.parse({ offset: -1 })).toThrow();
      });

      it('should reject negative limit', () => {
        const schema = createPaginationSchema();
        
        expect(() => schema.parse({ limit: -5 })).toThrow();
      });
    });

    describe('Page-based Pagination', () => {
      it('should create page-based pagination schema', () => {
        const schema = createPaginationSchema({ mode: 'page' });
        const result = schema.parse({});
        
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
      });

      it('should allow custom page and limit', () => {
        const schema = createPaginationSchema({ mode: 'page' });
        const result = schema.parse({ page: 3, limit: 25 });
        
        expect(result.page).toBe(3);
        expect(result.limit).toBe(25);
      });

      it('should reject page less than 1', () => {
        const schema = createPaginationSchema({ mode: 'page' });
        
        expect(() => schema.parse({ page: 0 })).toThrow();
        expect(() => schema.parse({ page: -1 })).toThrow();
      });

      it('should enforce max limit in page mode', () => {
        const schema = createPaginationSchema({ mode: 'page', maxLimit: 100 });
        
        expect(() => schema.parse({ limit: 150 })).toThrow();
      });

      it('should use custom default page', () => {
        const schema = createPaginationSchema({ mode: 'page', defaultPage: 2 });
        const result = schema.parse({});
        
        expect(result.page).toBe(2);
      });
    });

    describe('Cursor-based Pagination', () => {
      it('should create cursor-based pagination schema', () => {
        const schema = createPaginationSchema({ mode: 'cursor' });
        const result = schema.parse({});
        
        expect(result.limit).toBe(10);
        expect(result.cursor).toBeUndefined();
      });

      it('should allow custom cursor', () => {
        const schema = createPaginationSchema({ mode: 'cursor' });
        const result = schema.parse({ cursor: 'abc123', limit: 20 });
        
        expect(result.cursor).toBe('abc123');
        expect(result.limit).toBe(20);
      });

      it('should enforce max limit in cursor mode', () => {
        const schema = createPaginationSchema({ mode: 'cursor', maxLimit: 50 });
        
        expect(() => schema.parse({ limit: 100 })).toThrow();
      });

      it('should handle optional cursor', () => {
        const schema = createPaginationSchema({ mode: 'cursor' });
        const result = schema.parse({ limit: 15 });
        
        expect(result.cursor).toBeUndefined();
        expect(result.limit).toBe(15);
      });
    });

    describe('Configuration Options', () => {
      it('should respect all configuration options together', () => {
        const schema = createPaginationSchema({
          defaultLimit: 20,
          maxLimit: 100,
          minLimit: 5,
        });
        
        const result = schema.parse({});
        expect(result.limit).toBe(20);
        
        expect(() => schema.parse({ limit: 3 })).toThrow();
        expect(() => schema.parse({ limit: 150 })).toThrow();
        
        const validResult = schema.parse({ limit: 50 });
        expect(validResult.limit).toBe(50);
      });

      it('should allow limit equal to maxLimit', () => {
        const schema = createPaginationSchema({ maxLimit: 100 });
        const result = schema.parse({ limit: 100 });
        
        expect(result.limit).toBe(100);
      });

      it('should allow limit equal to minLimit', () => {
        const schema = createPaginationSchema({ minLimit: 5 });
        const result = schema.parse({ limit: 5 });
        
        expect(result.limit).toBe(5);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very large offset values', () => {
        const schema = createPaginationSchema();
        const result = schema.parse({ offset: 1000000 });
        
        expect(result.offset).toBe(1000000);
      });

      it('should handle very large page numbers', () => {
        const schema = createPaginationSchema({ mode: 'page' });
        const result = schema.parse({ page: 10000 });
        
        expect(result.page).toBe(10000);
      });

      it('should handle long cursor strings', () => {
        const schema = createPaginationSchema({ mode: 'cursor' });
        const longCursor = 'a'.repeat(1000);
        const result = schema.parse({ cursor: longCursor });
        
        expect(result.cursor).toBe(longCursor);
      });

      it('should handle empty cursor string', () => {
        const schema = createPaginationSchema({ mode: 'cursor' });
        const result = schema.parse({ cursor: '' });
        
        expect(result.cursor).toBe('');
      });

      it('should handle zero limit when allowed', () => {
        const schema = createPaginationSchema({ minLimit: 0 });
        const result = schema.parse({ limit: 0 });
        
        expect(result.limit).toBe(0);
      });
    });

    describe('Type Safety', () => {
      it('should parse integers correctly', () => {
        const schema = createPaginationSchema();
        const result = schema.parse({ limit: 10, offset: 20 });
        
        expect(Number.isInteger(result.limit)).toBe(true);
        expect(Number.isInteger(result.offset)).toBe(true);
      });

      it('should reject non-integer values', () => {
        const schema = createPaginationSchema();
        
        expect(() => schema.parse({ limit: 10.5 })).toThrow();
        expect(() => schema.parse({ offset: 20.3 })).toThrow();
      });

      it('should reject string values for numbers', () => {
        const schema = createPaginationSchema();
        
        expect(() => schema.parse({ limit: '10' })).toThrow();
        expect(() => schema.parse({ offset: '20' })).toThrow();
      });
    });

    describe('Multiple Modes', () => {
      it('should handle switching between modes', () => {
        const offsetSchema = createPaginationSchema();
        const pageSchema = createPaginationSchema({ mode: 'page' });
        const cursorSchema = createPaginationSchema({ mode: 'cursor' });
        
        const offsetResult = offsetSchema.parse({ limit: 10, offset: 0 });
        expect(offsetResult).toHaveProperty('offset');
        
        const pageResult = pageSchema.parse({ limit: 10, page: 1 });
        expect(pageResult).toHaveProperty('page');
        
        const cursorResult = cursorSchema.parse({ limit: 10 });
        expect(cursorResult).toHaveProperty('limit');
      });
    });
  });
});
