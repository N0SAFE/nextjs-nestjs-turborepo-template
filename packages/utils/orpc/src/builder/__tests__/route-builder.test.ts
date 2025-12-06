import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { RouteBuilder } from '../route-builder';
import { oc } from '../base-config';

describe('RouteBuilder', () => {
  describe('Basic Route Creation', () => {
    it('should create a simple route with input and output', () => {
      const route = oc.route({
        input: z.object({ name: z.string() }),
        output: z.object({ message: z.string() }),
      });
      
      expect(route).toBeDefined();
      expect(route.InputSchema).toBeDefined();
      expect(route.OutputSchema).toBeDefined();
    });

    it('should create route with only output', () => {
      const route = oc.route({
        output: z.object({ data: z.string() }),
      });
      
      expect(route).toBeDefined();
      expect(route.OutputSchema).toBeDefined();
    });

    it('should create route with description', () => {
      const route = oc.route({
        input: z.object({ id: z.string() }),
        output: z.object({ user: z.object({ name: z.string() }) }),
        description: 'Get user by ID',
      });
      
      expect(route).toBeDefined();
    });
  });

  describe('Route Builder with InputBuilder', () => {
    it('should use inputBuilder to transform input schema', () => {
      const route = oc.route({
        input: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        output: z.object({ success: z.boolean() }),
        inputBuilder: (builder) => builder.pick(['id', 'name']),
      });
      
      expect(route).toBeDefined();
      // The input should only have id and name
      const inputParsed = route.InputSchema?.parse({ id: '123', name: 'John' });
      expect(inputParsed).toEqual({ id: '123', name: 'John' });
    });

    it('should chain multiple inputBuilder transformations', () => {
      const route = oc.route({
        input: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          age: z.number(),
        }),
        output: z.object({ success: z.boolean() }),
        inputBuilder: (builder) => 
          builder
            .omit(['age'])
            .extend({ role: z.string().default('user') }),
      });
      
      expect(route).toBeDefined();
      const inputParsed = route.InputSchema?.parse({ 
        id: '123', 
        name: 'John', 
        email: 'john@example.com' 
      });
      expect(inputParsed).toHaveProperty('role', 'user');
      expect(inputParsed).not.toHaveProperty('age');
    });
  });

  describe('Route Builder with OutputBuilder', () => {
    it('should use outputBuilder to transform output schema', () => {
      const route = oc.route({
        input: z.object({ id: z.string() }),
        output: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          password: z.string(),
        }),
        outputBuilder: (builder) => builder.omit(['password']),
      });
      
      expect(route).toBeDefined();
      const outputParsed = route.OutputSchema?.parse({ 
        id: '123', 
        name: 'John', 
        email: 'john@example.com',
        password: 'secret' // This should be omitted
      });
      expect(outputParsed).not.toHaveProperty('password');
    });

    it('should chain multiple outputBuilder transformations', () => {
      const route = oc.route({
        input: z.object({ id: z.string() }),
        output: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        outputBuilder: (builder) => 
          builder
            .extend({ timestamp: z.number() })
            .partial(['email']),
      });
      
      expect(route).toBeDefined();
      const outputParsed = route.OutputSchema?.parse({ 
        id: '123', 
        name: 'John',
        timestamp: Date.now()
      });
      expect(outputParsed).toHaveProperty('timestamp');
      expect(outputParsed).not.toHaveProperty('email');
    });
  });

  describe('Route Builder with Both Input and Output Builders', () => {
    it('should apply both inputBuilder and outputBuilder', () => {
      const route = oc.route({
        input: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }),
        output: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          password: z.string(),
        }),
        inputBuilder: (builder) => builder.pick(['id']),
        outputBuilder: (builder) => builder.omit(['password']),
      });
      
      expect(route).toBeDefined();
      
      const inputParsed = route.InputSchema?.parse({ id: '123' });
      expect(inputParsed).toEqual({ id: '123' });
      
      const outputParsed = route.OutputSchema?.parse({ 
        id: '123', 
        name: 'John', 
        email: 'john@example.com',
        password: 'secret'
      });
      expect(outputParsed).not.toHaveProperty('password');
    });
  });

  describe('Route with Metadata', () => {
    it('should create route with custom metadata', () => {
      const route = oc.route({
        input: z.object({ id: z.string() }),
        output: z.object({ user: z.any() }),
        description: 'Fetch user by ID',
      });
      
      expect(route).toBeDefined();
    });

    it('should handle route without input', () => {
      const route = oc.route({
        output: z.object({ data: z.array(z.any()) }),
        description: 'List all items',
      });
      
      expect(route).toBeDefined();
      expect(route.InputSchema).toBeUndefined();
    });
  });

  describe('Complex Route Scenarios', () => {
    it('should handle nested schemas with builders', () => {
      const route = oc.route({
        input: z.object({
          user: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
          }),
          metadata: z.object({
            source: z.string(),
            timestamp: z.number(),
          }),
        }),
        output: z.object({
          success: z.boolean(),
          user: z.object({
            id: z.string(),
            name: z.string(),
          }),
        }),
        inputBuilder: (builder) => 
          builder.custom((schema) => 
            schema.extend({ processed: z.boolean().default(false) })
          ),
      });
      
      expect(route).toBeDefined();
      const inputParsed = route.InputSchema?.parse({
        user: { id: '123', name: 'John', email: 'john@example.com' },
        metadata: { source: 'api', timestamp: Date.now() },
      });
      expect(inputParsed).toHaveProperty('processed', false);
    });

    it('should handle routes with partial and defaults', () => {
      const route = oc.route({
        input: z.object({
          name: z.string(),
          email: z.string(),
          role: z.string(),
        }),
        output: z.object({ created: z.boolean() }),
        inputBuilder: (builder) => 
          builder
            .partial(['email'])
            .addDefaults({ role: 'user' }),
      });
      
      expect(route).toBeDefined();
      const inputParsed = route.InputSchema?.parse({ name: 'John' });
      expect(inputParsed).toHaveProperty('role', 'user');
      expect(inputParsed).not.toHaveProperty('email');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input schema', () => {
      const route = oc.route({
        input: z.object({}),
        output: z.object({ data: z.any() }),
      });
      
      expect(route).toBeDefined();
      const inputParsed = route.InputSchema?.parse({});
      expect(inputParsed).toEqual({});
    });

    it('should handle empty output schema', () => {
      const route = oc.route({
        input: z.object({ id: z.string() }),
        output: z.object({}),
      });
      
      expect(route).toBeDefined();
      const outputParsed = route.OutputSchema?.parse({});
      expect(outputParsed).toEqual({});
    });

    it('should handle route without builders', () => {
      const route = oc.route({
        input: z.object({ id: z.string() }),
        output: z.object({ name: z.string() }),
      });
      
      expect(route).toBeDefined();
      const inputParsed = route.InputSchema?.parse({ id: '123' });
      expect(inputParsed).toEqual({ id: '123' });
    });
  });

  describe('Type Safety Validation', () => {
    it('should maintain type safety through transformations', () => {
      const route = oc.route({
        input: z.object({
          id: z.string(),
          name: z.string(),
        }),
        output: z.object({
          id: z.string(),
          name: z.string(),
          createdAt: z.string(),
        }),
        inputBuilder: (builder) => builder.extend({ active: z.boolean() }),
        outputBuilder: (builder) => builder.omit(['createdAt']),
      });
      
      expect(route).toBeDefined();
      
      // Input should include active field
      const inputParsed = route.InputSchema?.parse({ 
        id: '123', 
        name: 'John', 
        active: true 
      });
      expect(inputParsed).toHaveProperty('active');
      
      // Output should not include createdAt
      const outputParsed = route.OutputSchema?.parse({ 
        id: '123', 
        name: 'John',
        createdAt: '2024-01-01'
      });
      expect(outputParsed).not.toHaveProperty('createdAt');
    });
  });
});
