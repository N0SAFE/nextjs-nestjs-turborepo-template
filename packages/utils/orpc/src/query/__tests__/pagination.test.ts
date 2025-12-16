import { describe, it, expect } from 'vitest';
import {
  createPaginationConfigSchema,
  createPaginationSchema,
  createPaginationMetaSchema,
  createPaginatedResponseSchema,
  offsetPagination,
  pagePagination,
  cursorPagination,
  fullPagination,
} from '../pagination';
import { z } from 'zod/v4';

describe('Pagination', () => {
  describe('createPaginationConfigSchema', () => {
    it('should create config schema with defaults', () => {
      const config = createPaginationConfigSchema();
      const result = config.parse({});
      
      expect(result.defaultLimit).toBe(10);
      expect(result.maxLimit).toBe(100);
      expect(result.minLimit).toBe(1);
      expect(result.includeOffset).toBe(true);
      expect(result.includeCursor).toBe(false);
      expect(result.includePage).toBe(false);
    });

    it('should accept custom configuration options', () => {
      const config = createPaginationConfigSchema({
        defaultLimit: 25,
        maxLimit: 50,
        minLimit: 5,
        includeOffset: false,
        includeCursor: true,
        includePage: true,
      });
      const result = config.parse({});
      
      expect(result.defaultLimit).toBe(25);
      expect(result.maxLimit).toBe(50);
      expect(result.minLimit).toBe(5);
      expect(result.includeOffset).toBe(false);
      expect(result.includeCursor).toBe(true);
      expect(result.includePage).toBe(true);
    });
  });

  describe('createPaginationSchema', () => {
    describe('Offset-based Pagination', () => {
      it('should create offset-based pagination schema with defaults', () => {
        const config = createPaginationConfigSchema({ includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({});
        
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(0);
      });

      it('should allow custom limit and offset', () => {
        const config = createPaginationConfigSchema({ includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ limit: 20, offset: 40 });
        
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(40);
      });

      it('should enforce max limit', () => {
        const config = createPaginationConfigSchema({ maxLimit: 50, includeOffset: true });
        const schema = createPaginationSchema(config);
        
        expect(() => schema.parse({ limit: 100 })).toThrow();
        
        const result = schema.parse({ limit: 30 });
        expect(result.limit).toBe(30);
      });

      it('should enforce min limit', () => {
        const config = createPaginationConfigSchema({ minLimit: 5, includeOffset: true });
        const schema = createPaginationSchema(config);
        
        expect(() => schema.parse({ limit: 2 })).toThrow();
        
        const result = schema.parse({ limit: 10 });
        expect(result.limit).toBe(10);
      });

      it('should use custom default limit', () => {
        const config = createPaginationConfigSchema({ defaultLimit: 25, includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({});
        
        expect(result.limit).toBe(25);
      });

      it('should reject negative offset', () => {
        const config = createPaginationConfigSchema({ includeOffset: true });
        const schema = createPaginationSchema(config);
        
        expect(() => schema.parse({ offset: -1 })).toThrow();
      });

      it('should reject negative limit', () => {
        const config = createPaginationConfigSchema({ includeOffset: true });
        const schema = createPaginationSchema(config);
        
        expect(() => schema.parse({ limit: -5 })).toThrow();
      });
    });

    describe('Page-based Pagination', () => {
      it('should create page-based pagination schema', () => {
        const config = createPaginationConfigSchema({ includePage: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const result = schema.parse({});
        
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
      });

      it('should allow custom page and limit', () => {
        const config = createPaginationConfigSchema({ includePage: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ page: 3, limit: 25 });
        
        expect(result.page).toBe(3);
        expect(result.limit).toBe(25);
      });

      it('should reject page less than 1', () => {
        const config = createPaginationConfigSchema({ includePage: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        
        expect(() => schema.parse({ page: 0 })).toThrow();
        expect(() => schema.parse({ page: -1 })).toThrow();
      });

      it('should enforce max limit in page mode', () => {
        const config = createPaginationConfigSchema({ includePage: true, includeOffset: false, maxLimit: 100 });
        const schema = createPaginationSchema(config);
        
        expect(() => schema.parse({ limit: 150 })).toThrow();
      });
    });

    describe('Cursor-based Pagination', () => {
      it('should create cursor-based pagination schema', () => {
        const config = createPaginationConfigSchema({ includeCursor: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const result = schema.parse({});
        
        expect(result.limit).toBe(10);
        expect(result.cursor).toBeUndefined();
      });

      it('should allow custom cursor', () => {
        const config = createPaginationConfigSchema({ includeCursor: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ cursor: 'abc123', limit: 20 });
        
        expect(result.cursor).toBe('abc123');
        expect(result.limit).toBe(20);
      });

      it('should enforce max limit in cursor mode', () => {
        const config = createPaginationConfigSchema({ includeCursor: true, includeOffset: false, maxLimit: 50 });
        const schema = createPaginationSchema(config);
        
        expect(() => schema.parse({ limit: 100 })).toThrow();
      });

      it('should handle optional cursor', () => {
        const config = createPaginationConfigSchema({ includeCursor: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ limit: 15 });
        
        expect(result.cursor).toBeUndefined();
        expect(result.limit).toBe(15);
      });
    });

    describe('Configuration Options', () => {
      it('should respect all configuration options together', () => {
        const config = createPaginationConfigSchema({
          defaultLimit: 20,
          maxLimit: 100,
          minLimit: 5,
          includeOffset: true,
        });
        const schema = createPaginationSchema(config);
        
        const result = schema.parse({});
        expect(result.limit).toBe(20);
        
        expect(() => schema.parse({ limit: 3 })).toThrow();
        expect(() => schema.parse({ limit: 150 })).toThrow();
        
        const validResult = schema.parse({ limit: 50 });
        expect(validResult.limit).toBe(50);
      });

      it('should allow limit equal to maxLimit', () => {
        const config = createPaginationConfigSchema({ maxLimit: 100, includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ limit: 100 });
        
        expect(result.limit).toBe(100);
      });

      it('should allow limit equal to minLimit', () => {
        const config = createPaginationConfigSchema({ minLimit: 5, includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ limit: 5 });
        
        expect(result.limit).toBe(5);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very large offset values', () => {
        const config = createPaginationConfigSchema({ includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ offset: 1000000 });
        
        expect(result.offset).toBe(1000000);
      });

      it('should handle very large page numbers', () => {
        const config = createPaginationConfigSchema({ includePage: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ page: 10000 });
        
        expect(result.page).toBe(10000);
      });

      it('should handle long cursor strings', () => {
        const config = createPaginationConfigSchema({ includeCursor: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const longCursor = 'a'.repeat(1000);
        const result = schema.parse({ cursor: longCursor });
        
        expect(result.cursor).toBe(longCursor);
      });

      it('should handle empty cursor string', () => {
        const config = createPaginationConfigSchema({ includeCursor: true, includeOffset: false });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ cursor: '' });
        
        expect(result.cursor).toBe('');
      });

      it('should handle zero limit when allowed', () => {
        const config = createPaginationConfigSchema({ minLimit: 0, includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ limit: 0 });
        
        expect(result.limit).toBe(0);
      });
    });

    describe('Type Safety', () => {
      it('should parse integers correctly', () => {
        const config = createPaginationConfigSchema({ includeOffset: true });
        const schema = createPaginationSchema(config);
        const result = schema.parse({ limit: 10, offset: 20 });
        
        expect(Number.isInteger(result.limit)).toBe(true);
        expect(Number.isInteger(result.offset)).toBe(true);
      });

      it('should coerce string values to numbers', () => {
        const config = createPaginationConfigSchema({ includeOffset: true });
        const schema = createPaginationSchema(config);
        
        // The schema uses z.coerce.number() so strings should be coerced
        const result = schema.parse({ limit: '10', offset: '20' });
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(20);
      });
    });

    describe('Multiple Pagination Types', () => {
      it('should handle switching between pagination types', () => {
        const offsetConfig = createPaginationConfigSchema({ includeOffset: true });
        const pageConfig = createPaginationConfigSchema({ includePage: true, includeOffset: false });
        const cursorConfig = createPaginationConfigSchema({ includeCursor: true, includeOffset: false });
        
        const offsetSchema = createPaginationSchema(offsetConfig);
        const pageSchema = createPaginationSchema(pageConfig);
        const cursorSchema = createPaginationSchema(cursorConfig);
        
        const offsetResult = offsetSchema.parse({ limit: 10, offset: 0 });
        expect(offsetResult).toHaveProperty('offset');
        
        const pageResult = pageSchema.parse({ limit: 10, page: 1 });
        expect(pageResult).toHaveProperty('page');
        
        const cursorResult = cursorSchema.parse({ limit: 10 });
        expect(cursorResult).toHaveProperty('limit');
      });
    });
  });

  describe('Pre-built Pagination Schemas', () => {
    it('offsetPagination should include offset', () => {
      const result = offsetPagination.parse({});
      expect(result).toHaveProperty('offset');
      expect(result).toHaveProperty('limit');
    });

    it('pagePagination should include page', () => {
      const result = pagePagination.parse({});
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });

    it('cursorPagination should include cursor option', () => {
      const result = cursorPagination.parse({ cursor: 'test' });
      expect(result).toHaveProperty('cursor');
      expect(result).toHaveProperty('limit');
    });

    it('fullPagination should include all pagination types', () => {
      const result = fullPagination.parse({ offset: 10, page: 2, cursor: 'abc' });
      expect(result).toHaveProperty('offset');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('cursor');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('createPaginationMetaSchema', () => {
    it('should create meta schema for offset pagination', () => {
      const config = createPaginationConfigSchema({ includeOffset: true });
      const metaSchema = createPaginationMetaSchema(config);
      const result = metaSchema.parse({
        total: 100,
        limit: 10,
        hasMore: true,
        offset: 20,
      });
      
      expect(result.total).toBe(100);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(true);
      expect(result.offset).toBe(20);
    });

    it('should create meta schema for page pagination', () => {
      const config = createPaginationConfigSchema({ includePage: true, includeOffset: false });
      const metaSchema = createPaginationMetaSchema(config);
      const result = metaSchema.parse({
        total: 100,
        limit: 10,
        hasMore: true,
        page: 2,
        totalPages: 10,
      });
      
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(10);
    });

    it('should create meta schema for cursor pagination', () => {
      const config = createPaginationConfigSchema({ includeCursor: true, includeOffset: false });
      const metaSchema = createPaginationMetaSchema(config);
      const result = metaSchema.parse({
        total: 100,
        limit: 10,
        hasMore: true,
        nextCursor: 'next123',
        prevCursor: 'prev456',
      });
      
      expect(result.nextCursor).toBe('next123');
      expect(result.prevCursor).toBe('prev456');
    });
  });

  describe('createPaginatedResponseSchema', () => {
    it('should create paginated response schema with data and meta', () => {
      const itemSchema = z.object({
        id: z.string(),
        name: z.string(),
      });
      const config = createPaginationConfigSchema({ includeOffset: true });
      const responseSchema = createPaginatedResponseSchema(itemSchema, config);
      
      const result = responseSchema.parse({
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        meta: {
          total: 100,
          limit: 10,
          hasMore: true,
          offset: 0,
        },
      });
      
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(100);
    });
  });
});
