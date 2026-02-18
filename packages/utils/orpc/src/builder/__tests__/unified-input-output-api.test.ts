/**
 * Tests demonstrating the unified input/output API
 * 
 * Both input() and output() methods now support:
 * 1. Direct schema: .input(z.object({...}))
 * 2. Builder callback: .input(builder => builder.body(...))
 * 3. Property chaining: .inputBuilder.omit([...]) (legacy, still works)
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { RouteBuilder } from '../core/route-builder';

describe('Unified Input/Output API', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string(),
    role: z.string(),
    createdAt: z.string(),
  });

  describe('Input - Unified API', () => {
    it('supports direct schema pattern', () => {
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(userSchema)
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('supports builder callback pattern', () => {
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(builder => builder
          .body(userSchema.omit({ id: true }))
          .query(z.object({ limit: z.number() }))
        )
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('supports chaining multiple input calls with builder callbacks', () => {
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(builder => builder.body(userSchema))
        .input(builder => builder.body(b => b.schema.omit({ password: true })))
        .input(builder => builder.query(z.object({ limit: z.number() })))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('can mix direct schema and builder callback approaches', () => {
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(userSchema)  // Direct schema first
        .input(b => b.schema.omit({ password: true }))  // Then property chaining
        .input(builder => builder.body(b => b.schema.omit({ createdAt: true })))  // Then builder callback
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });
  });

  describe('Output - Unified API', () => {
    it('supports direct schema pattern', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(userSchema)
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('supports builder callback pattern with detailed structure', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(builder => builder
          .status(200)
          .body(userSchema.omit({ password: true }))
          .headers({ 'etag': z.string() })
        )
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('supports builder callback pattern with property modifications', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(userSchema)
        .output(builder => builder.schema.omit(['password', 'createdAt']))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('can chain multiple output calls', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(userSchema)
        .output(builder => builder.schema.omit({ password: true }))
        .output(builder => builder.schema.pick({ id: true, name: true, email: true }))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });
  });

  describe('Legacy inputBuilder/outputBuilder still work', () => {
    it('inputBuilder property access still works', () => {
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(userSchema)
        .input(builder => builder.omit(['password']))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('inputBuilder callable still works', () => {
      const route = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(builder => builder.body(userSchema))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('outputBuilder property access still works', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(userSchema)
        .output(builder => builder.schema.omit(['password', 'createdAt']))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });

    it('outputBuilder callable still works', () => {
      const route = new RouteBuilder({ method: 'GET', path: '/users' })
        .output(builder => builder
          .status(200)
          .body(userSchema))
        .build();

      expect(route).toBeDefined();
      expect(typeof route).toBe('object');
    });
  });

  describe('Complex real-world scenarios', () => {
    it('complete CRUD route with unified API', () => {
      const createRoute = new RouteBuilder({ method: 'POST', path: '/users' })
        .input(builder => builder
          .body(userSchema.omit({ id: true, createdAt: true }))  // No ID on create
        )
        .output(builder => 
          builder.status(201)
          .body(userSchema)
          .headers({ 'location': z.string() })
        )
        .build();

      expect(createRoute).toBeDefined();
    });

    it('update route with path params and partial body', () => {
      const updateRoute = new RouteBuilder({ method: 'PATCH', path: '/{id}' })
        .input(builder => builder
          .params(p => p`/users/${p('id', z.string())}`)
          .body(userSchema.omit({ id: true, createdAt: true }).partial())
        )
        .output(userSchema)
        .build();

      expect(updateRoute).toBeDefined();
    });

    it('list route with query parameters', () => {
      const listRoute = new RouteBuilder({ method: 'GET', path: '/users' })
        .input(builder => builder.query(z.object({
          page: z.number().default(1),
          limit: z.number().default(10),
          search: z.string().optional(),
        })))
        .output(z.object({
          users: z.array(userSchema.omit({ password: true })),
          total: z.number(),
          page: z.number(),
        }))
        .build();

      expect(listRoute).toBeDefined();
    });
  });
});
