import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { RouteBuilder } from '../route-builder';

describe('InputBuilder - Body Schema', () => {
  describe('Simple body schemas', () => {
    it('should create route with object body', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({ name: z.string(), email: z.email() }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should create route with array body', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.array(z.object({ id: z.string() })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Body in detailed input', () => {
    it('should add body to detailed input builder', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b.body(z.object({ name: z.string() })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should combine body with params', () => {
      const route = new RouteBuilder({ method: 'PUT' })
        .input(b => b
          .params(p => p`/users/${p('id', z.uuid())}`)
          .body(z.object({ name: z.string() }))
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should combine body with query', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b
          .body(z.object({ items: z.array(z.string()) }))
          .query(z.object({ validate: z.boolean().default(true) }))
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Body schema transformations', () => {
    const userSchema = z.object({
      id: z.uuid(),
      name: z.string(),
      email: z.email(),
      password: z.string(),
      role: z.enum(['admin', 'user']),
      createdAt: z.date(),
    });

    it('should omit fields from body schema', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b.body(userSchema.omit({ id: true, createdAt: true })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should pick fields for body schema', () => {
      const route = new RouteBuilder({ method: 'PATCH' })
        .input(b => b.body(userSchema.pick({ name: true, email: true })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should make body fields partial', () => {
      const route = new RouteBuilder({ method: 'PATCH' })
        .input(b => b.body(userSchema.omit({ id: true, createdAt: true }).partial()))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should extend body with additional fields', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b.body(
          userSchema
            .omit({ id: true, createdAt: true })
            .extend({ confirmPassword: z.string() })
        ))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });
});

describe('InputBuilder - Query Schema', () => {
  describe('Simple query schemas', () => {
    it('should create query with string param', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.query(z.object({ search: z.string().optional() })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should create query with multiple params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.query(z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(10),
          sort: z.enum(['asc', 'desc']).default('asc'),
        })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Query with coercion', () => {
    it('should coerce string to number', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.query(z.object({
          id: z.coerce.number(),
        })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should coerce string to boolean', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.query(z.object({
          active: z.coerce.boolean().optional(),
        })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should coerce string to date', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.query(z.object({
          since: z.coerce.date().optional(),
        })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Query with arrays', () => {
    it('should handle array query params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.query(z.object({
          ids: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
        })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Query with enums', () => {
    it('should handle enum query params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b.query(z.object({
          status: z.enum(['pending', 'active', 'completed', 'archived']).optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
        })))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });
});

describe('InputBuilder - Headers Schema', () => {
  describe('Request headers', () => {
    it('should define custom request headers', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b.headers({
          'x-api-key': z.string(),
          'x-request-id': z.uuid().optional(),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should combine headers with body', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b
          .headers({ 'x-idempotency-key': z.uuid() })
          .body(z.object({ data: z.any() }))
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should combine headers with params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b
          .params(p => p`/resources/${p('id', z.uuid())}`)
          .headers({ 'accept-language': z.string().default('en') })
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });
});

describe('InputBuilder - Complex Combinations', () => {
  describe('Full detailed input', () => {
    it('should combine params, query, body, and headers', () => {
      const route = new RouteBuilder({ method: 'PUT' })
        .input(b => b
          .params(p => p`/orgs/${p('orgId', z.uuid())}/users/${p('userId', z.uuid())}`)
          .query(z.object({
            notify: z.coerce.boolean().default(true),
          }))
          .body(z.object({
            name: z.string(),
            role: z.enum(['member', 'admin']),
          }))
          .headers({
            'x-audit-reason': z.string().optional(),
          })
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Order independence', () => {
    it('should allow headers before params', () => {
      const route = new RouteBuilder({ method: 'GET' })
        .input(b => b
          .headers({ 'x-tenant': z.string() })
          .params(p => p`/data/${p('id', z.uuid())}`)
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should allow query before body', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b
          .query(z.object({ async: z.coerce.boolean().default(false) }))
          .body(z.object({ payload: z.any() }))
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should allow body before params', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(b => b
          .body(z.object({ content: z.string() }))
          .params(p => p`/posts/${p('postId', z.uuid())}/comments`)
        )
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });
});

describe('InputBuilder - Validation', () => {
  describe('String validations', () => {
    it('should handle min/max length', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          username: z.string().min(3).max(20),
          bio: z.string().max(500).optional(),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle regex patterns', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          slug: z.string().regex(/^[a-z0-9-]+$/),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle email and url', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          email: z.email(),
          website: z.url().optional(),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Number validations', () => {
    it('should handle min/max values', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          age: z.number().int().min(0).max(150),
          price: z.number().positive(),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle integer constraint', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          quantity: z.number().int().nonnegative(),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Array validations', () => {
    it('should handle min/max items', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          tags: z.array(z.string()).min(1).max(10),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle nonempty', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          items: z.array(z.any()).nonempty(),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });

  describe('Custom refinements', () => {
    it('should handle refine', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          password: z.string().min(8),
          confirmPassword: z.string(),
        }).refine(data => data.password === data.confirmPassword, {
          message: 'Passwords must match',
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle superRefine', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          startDate: z.date(),
          endDate: z.date(),
        }).superRefine((data, ctx) => {
          if (data.endDate <= data.startDate) {
            ctx.addIssue({
              code: "custom",
              message: 'End date must be after start date',
              path: ['endDate'],
            });
          }
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });
});

describe('InputBuilder - Default Values', () => {
  describe('Field defaults', () => {
    it('should handle string defaults', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          role: z.string().default('user'),
          status: z.string().default('active'),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle number defaults', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          quantity: z.number().default(1),
          priority: z.number().default(0),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle boolean defaults', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          active: z.boolean().default(true),
          public: z.boolean().default(false),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });

    it('should handle complex defaults', () => {
      const route = new RouteBuilder({ method: 'POST' })
        .input(z.object({
          settings: z.object({
            notifications: z.boolean(),
            theme: z.string(),
          }).default({ notifications: true, theme: 'light' }),
        }))
        .build();
      
      expect(route['~orpc'].inputSchema).toBeDefined();
    });
  });
});
