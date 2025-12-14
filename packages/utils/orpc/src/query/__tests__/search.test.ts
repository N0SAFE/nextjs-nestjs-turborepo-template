import { describe, it, expect } from 'vitest';
import { 
  createSearchConfigSchema,
  createSearchSchema,
  createSimpleSearchSchema,
  createFullTextSearchSchema,
  baseSearchSchema,
  searchWithHighlightSchema,
} from '../search';

describe('Search', () => {
  // ============================================
  // createSearchConfigSchema Tests
  // ============================================
  describe('createSearchConfigSchema', () => {
    it('should create a config schema without searchable fields', () => {
      const config = createSearchConfigSchema();
      
      expect(config).toBeDefined();
      const parsed = config.parse({
        searchableFields: [],
        minQueryLength: 1,
        maxQueryLength: 1000,
        caseSensitive: false,
        allowRegex: false,
        allowFieldSelection: false,
      });
      expect(parsed).toBeDefined();
    });

    it('should create a config schema with searchable fields', () => {
      const config = createSearchConfigSchema(['name', 'email', 'description']);
      
      expect(config).toBeDefined();
    });

    it('should accept configuration options', () => {
      const config = createSearchConfigSchema(['name', 'email'], {
        minQueryLength: 3,
        maxQueryLength: 100,
        caseSensitive: true,
        allowRegex: true,
        allowFieldSelection: true,
      });
      
      expect(config).toBeDefined();
    });
  });

  // ============================================
  // createSearchSchema (2-step API) Tests
  // ============================================
  describe('createSearchSchema', () => {
    it('should create basic search schema', () => {
      const config = createSearchConfigSchema();
      const schema = createSearchSchema(config);
      const result = schema.parse({ query: 'test query' });
      
      expect(result.query).toBe('test query');
    });

    it('should require search query', () => {
      const config = createSearchConfigSchema();
      const schema = createSearchSchema(config);
      
      expect(() => schema.parse({})).toThrow();
    });

    it('should support searchableFields with allowFieldSelection', () => {
      const config = createSearchConfigSchema(
        ['name', 'email', 'description'],
        { allowFieldSelection: true }
      );
      const schema = createSearchSchema(config);
      
      const result = schema.parse({ 
        query: 'test',
        fields: ['name', 'email']
      });
      
      expect(result.query).toBe('test');
      expect(result.fields).toEqual(['name', 'email']);
    });

    it('should validate fields are from allowed list', () => {
      const config = createSearchConfigSchema(
        ['name', 'email'],
        { allowFieldSelection: true }
      );
      const schema = createSearchSchema(config);
      
      expect(() => schema.parse({ 
        query: 'test',
        fields: ['name', 'invalid']
      })).toThrow();
    });

    it('should support case sensitivity option', () => {
      const config = createSearchConfigSchema(undefined, { caseSensitive: false });
      const schema = createSearchSchema(config);
      
      // When caseSensitive is false in config, the schema allows setting caseSensitive
      const result = schema.parse({ query: 'Test', caseSensitive: true });
      expect(result.query).toBe('Test');
      expect(result.caseSensitive).toBe(true);
    });

    it('should support regex search when allowed', () => {
      const config = createSearchConfigSchema(undefined, { allowRegex: true });
      const schema = createSearchSchema(config);
      
      const result = schema.parse({ 
        query: '^test.*',
        useRegex: true,
      });
      
      expect(result.query).toBe('^test.*');
      expect(result.useRegex).toBe(true);
    });

    it('should enforce minimum query length', () => {
      const config = createSearchConfigSchema(undefined, { minQueryLength: 3 });
      const schema = createSearchSchema(config);
      
      expect(() => schema.parse({ query: 'ab' })).toThrow();
      
      const result = schema.parse({ query: 'abc' });
      expect(result.query).toBe('abc');
    });

    it('should enforce maximum query length', () => {
      const config = createSearchConfigSchema(undefined, { maxQueryLength: 10 });
      const schema = createSearchSchema(config);
      
      expect(() => schema.parse({ query: 'a'.repeat(11) })).toThrow();
      
      const result = schema.parse({ query: 'a'.repeat(10) });
      expect(result.query).toBe('a'.repeat(10));
    });

    it('should handle search with special characters', () => {
      const config = createSearchConfigSchema();
      const schema = createSearchSchema(config);
      const result = schema.parse({ query: 'test@example.com' });
      
      expect(result.query).toBe('test@example.com');
    });

    it('should support search mode', () => {
      const config = createSearchConfigSchema();
      const schema = createSearchSchema(config);
      
      const result = schema.parse({ query: 'test', mode: 'startsWith' });
      expect(result.mode).toBe('startsWith');
    });
  });

  // ============================================
  // Field Selection Tests
  // ============================================
  describe('Field Selection', () => {
    it('should allow searching in single field', () => {
      const config = createSearchConfigSchema(
        ['name', 'email', 'description'],
        { allowFieldSelection: true }
      );
      const schema = createSearchSchema(config);
      
      const result = schema.parse({ 
        query: 'test',
        fields: ['name']
      });
      
      expect(result.fields).toEqual(['name']);
    });

    it('should allow searching in all configured fields', () => {
      const config = createSearchConfigSchema(
        ['name', 'email', 'description'],
        { allowFieldSelection: true }
      );
      const schema = createSearchSchema(config);
      
      const result = schema.parse({ 
        query: 'test',
        fields: ['name', 'email', 'description']
      });
      
      expect(result.fields).toEqual(['name', 'email', 'description']);
    });

    it('should not include fields schema without allowFieldSelection', () => {
      const config = createSearchConfigSchema(['name', 'email']);
      const schema = createSearchSchema(config);
      
      const result = schema.parse({ query: 'test' });
      // When allowFieldSelection is false, fields are not part of schema
      expect(result.fields).toBeUndefined();
    });
  });

  // ============================================
  // Helper Functions Tests
  // ============================================
  describe('createSimpleSearchSchema', () => {
    it('should create simple search schema with default minLength', () => {
      const schema = createSimpleSearchSchema();
      
      const result = schema.parse({ query: 'a' });
      expect(result.query).toBe('a');
    });

    it('should create simple search schema with custom minLength', () => {
      const schema = createSimpleSearchSchema(3);
      
      expect(() => schema.parse({ query: 'ab' })).toThrow();
      
      const result = schema.parse({ query: 'abc' });
      expect(result.query).toBe('abc');
    });
  });

  describe('createFullTextSearchSchema', () => {
    it('should create full-text search schema with fields', () => {
      const schema = createFullTextSearchSchema(['title', 'content', 'tags']);
      
      const result = schema.parse({
        query: 'test',
        fields: ['title', 'content'],
        operator: 'and',
        highlight: true,
      });
      
      expect(result.query).toBe('test');
      expect(result.fields).toEqual(['title', 'content']);
      expect(result.operator).toBe('and');
      expect(result.highlight).toBe(true);
    });

    it('should support useRegex in full-text search', () => {
      const schema = createFullTextSearchSchema(['title', 'content']);
      
      const result = schema.parse({
        query: '^test.*',
        useRegex: true,
      });
      
      expect(result.useRegex).toBe(true);
    });
  });

  // ============================================
  // Pre-built Schemas Tests
  // ============================================
  describe('Pre-built Schemas', () => {
    describe('baseSearchSchema', () => {
      it('should be a valid search schema', () => {
        const result = baseSearchSchema.parse({ query: 'test' });
        expect(result.query).toBe('test');
      });

      it('should include mode option', () => {
        const result = baseSearchSchema.parse({ query: 'test', mode: 'exact' });
        expect(result.mode).toBe('exact');
      });
    });

    describe('searchWithHighlightSchema', () => {
      it('should support highlight option', () => {
        const result = searchWithHighlightSchema.parse({
          query: 'test',
          highlight: true,
        });
        
        expect(result.highlight).toBe(true);
      });

      it('should support highlightTag option', () => {
        const result = searchWithHighlightSchema.parse({
          query: 'test',
          highlight: true,
          highlightTag: 'em',
        });
        
        expect(result.highlightTag).toBe('em');
      });

      it('should have default highlightTag', () => {
        const result = searchWithHighlightSchema.parse({
          query: 'test',
        });
        
        expect(result.highlightTag).toBe('mark');
      });
    });
  });

  // ============================================
  // Type Safety Tests
  // ============================================
  describe('Type Safety', () => {
    it('should enforce string type for query', () => {
      const config = createSearchConfigSchema();
      const schema = createSearchSchema(config);
      
      expect(() => schema.parse({ query: 123 })).toThrow();
      expect(() => schema.parse({ query: true })).toThrow();
    });

    it('should enforce array type for fields', () => {
      const config = createSearchConfigSchema(
        ['name', 'email'],
        { allowFieldSelection: true }
      );
      const schema = createSearchSchema(config);
      
      expect(() => schema.parse({ 
        query: 'test',
        fields: 'name'
      })).toThrow();
    });
  });
});
