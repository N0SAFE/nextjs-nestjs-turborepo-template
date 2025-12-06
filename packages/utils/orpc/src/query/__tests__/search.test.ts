import { describe, it, expect } from 'vitest';
import { createSearchSchema } from '../search';

describe('Search', () => {
  describe('createSearchSchema', () => {
    it('should create basic search schema', () => {
      const schema = createSearchSchema();
      const result = schema.parse({ query: 'test query' });
      
      expect(result.query).toBe('test query');
    });

    it('should require search query', () => {
      const schema = createSearchSchema();
      
      expect(() => schema.parse({})).toThrow();
    });

    it('should support searchableFields configuration', () => {
      const schema = createSearchSchema({
        searchableFields: ['name', 'email', 'description'],
        allowFieldSelection: true,
      });
      
      const result = schema.parse({ 
        query: 'test',
        fields: ['name', 'email']
      });
      
      expect(result.query).toBe('test');
      expect(result.fields).toEqual(['name', 'email']);
    });

    it('should validate fields are from allowed list', () => {
      const schema = createSearchSchema({
        searchableFields: ['name', 'email'],
        allowFieldSelection: true,
      });
      
      expect(() => schema.parse({ 
        query: 'test',
        fields: ['name', 'invalid']
      })).toThrow();
    });

    it('should support case sensitivity option', () => {
      const schema = createSearchSchema({
        caseSensitive: true,
      });
      
      const result = schema.parse({ query: 'Test' });
      expect(result.query).toBe('Test');
    });

    it('should support regex search', () => {
      const schema = createSearchSchema({
        allowRegex: true,
      });
      
      const result = schema.parse({ 
        query: '^test.*',
      });
      
      expect(result.query).toBe('^test.*');
    });

    it('should enforce minimum query length', () => {
      const schema = createSearchSchema({
        minQueryLength: 3,
      });
      
      expect(() => schema.parse({ query: 'ab' })).toThrow();
      
      const result = schema.parse({ query: 'abc' });
      expect(result.query).toBe('abc');
    });

    it('should enforce maximum query length', () => {
      const schema = createSearchSchema({
        maxQueryLength: 10,
      });
      
      expect(() => schema.parse({ query: 'a'.repeat(11) })).toThrow();
      
      const result = schema.parse({ query: 'a'.repeat(10) });
      expect(result.query).toBe('a'.repeat(10));
    });

    it('should handle search with special characters', () => {
      const schema = createSearchSchema();
      const result = schema.parse({ query: 'test@example.com' });
      
      expect(result.query).toBe('test@example.com');
    });
  });

  describe('Field Selection', () => {
    it('should allow searching in single field', () => {
      const schema = createSearchSchema({
        searchableFields: ['name', 'email', 'description'],
        allowFieldSelection: true,
      });
      
      const result = schema.parse({ 
        query: 'test',
        fields: ['name']
      });
      
      expect(result.fields).toEqual(['name']);
    });

    it('should allow searching in all configured fields', () => {
      const schema = createSearchSchema({
        searchableFields: ['name', 'email', 'description'],
        allowFieldSelection: true,
      });
      
      const result = schema.parse({ 
        query: 'test',
        fields: ['name', 'email', 'description']
      });
      
      expect(result.fields).toEqual(['name', 'email', 'description']);
    });

    it('should not allow fields without allowFieldSelection', () => {
      const schema = createSearchSchema({
        searchableFields: ['name', 'email'],
      });
      
      const result = schema.parse({ query: 'test' });
      expect(result.fields).toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce string type for query', () => {
      const schema = createSearchSchema();
      
      expect(() => schema.parse({ query: 123 })).toThrow();
      expect(() => schema.parse({ query: true })).toThrow();
    });

    it('should enforce array type for fields', () => {
      const schema = createSearchSchema({
        searchableFields: ['name', 'email'],
        allowFieldSelection: true,
      });
      
      expect(() => schema.parse({ 
        query: 'test',
        fields: 'name'
      })).toThrow();
    });
  });
});
