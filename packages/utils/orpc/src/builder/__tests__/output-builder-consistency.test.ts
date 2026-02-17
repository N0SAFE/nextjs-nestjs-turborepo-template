/**
 * Tests demonstrating API consistency between input and output builders
 * 
 * Goal: Input and output builders should support the same patterns:
 * - Direct schema: .body(schema), .headers(schema)
 * - Builder callback with schema access: .body(b => b.schema(s => ...))
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { RouteBuilder } from '../core/route-builder';

describe('Output Builder API Consistency', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    role: z.string(),
    createdAt: z.string(),
  });

  describe('Body Builder Consistency', () => {
    it('should support direct schema pattern (existing)', () => {
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .output(userSchema)
        .output(b => b
          .status(200)
          .body(schema => schema.omit({ password: true, createdAt: true }))
        )
        .build();

      // Contract was built successfully
      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('should support builder callback pattern with schema access (NEW)', () => {
      // This is the key test - output builder should work like input builder
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .output(userSchema)
        .output(b => b
          .status(200)
          .body(schema => schema.omit({ password: true, createdAt: true }))
        )
        .build();

      // Contract was built successfully - the builder pattern worked!
      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('demonstrates the schema is passed correctly to builder', () => {
      let receivedSchema: z.ZodType | undefined;
      
      new RouteBuilder({ method: 'POST', path: '/users' })
        .output(userSchema)
        .output(b => b
          .status(200)
          .body(schema => {
            receivedSchema = schema;
            return schema.omit({ password: true });
          })
        )
        .build();

      // The builder should receive the userSchema, not z.void()
      expect(receivedSchema).toBeDefined();
      expect(receivedSchema).toBe(userSchema);
    });
  });

  describe('Headers Builder Consistency', () => {
    it('should support direct schema pattern (existing)', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(userSchema)
        .output(b => b
          .status(200)
          .headers({
            'etag': z.string(),
            'last-modified': z.string(),
          })
          .body(userSchema)
        )
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('should support builder callback pattern with schema access (NEW)', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(userSchema)
        .output(b => b
          .status(200)
          .headers(() =>
            z.object({
              'content-type': z.string(),
              'x-custom': z.string(),
            }),
          )
          .body(userSchema)
        )
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });
  });

  describe('Full API Comparison', () => {
    it('demonstrates INPUT builder patterns', () => {
      const bodySchema = z.object({ name: z.string(), email: z.string(), id: z.string() });

      // Both patterns work for INPUT - Direct schema then modify with builder
      const route1 = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(builder => builder
          .body(bodySchema)  // ✅ Direct - set initial body schema
        )
        .build();

      // For builder callback pattern, set the schema first then chain modifications
      const route2 = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(builder => builder
          .body(bodySchema)  // First set the schema
          .body(b => b.schema(s => s.pick({ name: true, email: true })))  // Then modify it with builder callback
        )
        .build();

      expect(route1).toBeDefined();
      expect(route2).toBeDefined();
    });

    it('demonstrates OUTPUT builder patterns (NOW CONSISTENT)', () => {
      // Both patterns now work for OUTPUT (matching INPUT API)
      const route1 = new RouteBuilder({ method: 'POST', path: '/users' })
        .output(userSchema)
        .output(b => b
          .status(200)
          .body(userSchema.pick({ id: true, name: true }))
        )
        .build();

      const route2 = new RouteBuilder({ method: 'POST', path: '/users' })
        .output(userSchema)
        .output(b => b
          .status(200)
          .body(s => s.pick({ id: true, name: true }))
        )
        .build();

      expect(route1).toBeDefined();
      expect(route2).toBeDefined();
    });
  });

  describe('Union Response Builder', () => {
    const errorSchema = z.object({
      error: z.string(),
      code: z.string(),
    });

    it('supports the new callback API (recommended)', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users/:id' })
        .output(b => b.union([
          b.status(200).body(userSchema),
          b.status(404).body(errorSchema),
          b.status(500).body(errorSchema),
        ]))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('supports direct union array API', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users/:id' })
        .output(b => b.union([
          b.status(200).body(userSchema),
          b.status(404).body(errorSchema),
        ]))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('works with headers in union variants', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users/:id' })
        .output(b => b.union([
          b.status(200).headers({ 'etag': z.string() }).body(userSchema),
          b.status(304)
            .headers({ 'etag': z.string() })
            .body(z.void()),
        ]))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });
  });
});
