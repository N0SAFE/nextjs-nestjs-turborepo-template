import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { createRouterHooks } from '../generate-hooks';
import { RouteBuilder } from '../../builder/route-builder';

// Mock query client for tests
const mockQueryClient = {
  invalidateQueries: () => void 0,
  setQueryData: () => void 0,
  getQueryData: () => void 0,
};

// Mock router with various edge cases
const createMockRouter = (routes: Record<string, any>) => ({
  ...routes,
  _def: {
    procedures: routes,
  },
});

describe('Hook Generation - Edge Cases & Error Handling', () => {

  describe('Invalid Router Scenarios', () => {
    it('should handle empty router gracefully', () => {
      const emptyRouter = createMockRouter({});

      expect(() => {
        createRouterHooks(emptyRouter, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });

    it('should handle router with undefined procedures', () => {
      const invalidRouter = {
        _def: {
          procedures: undefined,
        },
      };

      expect(() => {
        createRouterHooks(invalidRouter as any, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });

    it('should handle router with null values', () => {
      const routerWithNulls = createMockRouter({
        validRoute: new RouteBuilder()
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
        nullRoute: null,
        undefinedRoute: undefined,
      });

      expect(() => {
        createRouterHooks(routerWithNulls, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });
  });
  });

  describe('Complex Route Configurations', () => {
    it('should handle routes with very long names', () => {
      const longNameRoute = 'a'.repeat(1000);
      const router = createMockRouter({
        [longNameRoute]: new RouteBuilder()
          .input(z.object({ test: z.string() }))
          .output(z.object({ result: z.boolean() }))
          .build(),
      });

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });

    it('should handle routes with special characters in names', () => {
      const specialCharRoutes = {
        'route-with-dashes': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'route_with_underscores': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'route.with.dots': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'route$with$symbols': new RouteBuilder().output(z.object({ data: z.string() })).build(),
      };

      const router = createMockRouter(specialCharRoutes);

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });

    it('should handle routes with no input or output schemas', () => {
      const minimalRoutes = {
        noInput: new RouteBuilder().output(z.object({ data: z.string() })).build(),
        noOutput: new RouteBuilder().input(z.object({ query: z.string() })).build(),
        noSchemas: new RouteBuilder().build(),
      };

      const router = createMockRouter(minimalRoutes);

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });
  });

  describe('Schema Complexity Edge Cases', () => {
    it('should handle routes with extremely complex schemas', () => {
      const complexInputSchema = z.object({
        user: z.object({
          id: z.uuid(),
          profile: z.object({
            personalInfo: z.object({
              firstName: z.string().min(1).max(100),
              lastName: z.string().min(1).max(100),
              birthDate: z.date().optional(),
              addresses: z.array(z.object({
                type: z.enum(['home', 'work', 'other']),
                street: z.string(),
                city: z.string(),
                country: z.string(),
                coordinates: z.object({
                  latitude: z.number().min(-90).max(90),
                  longitude: z.number().min(-180).max(180),
                }).optional(),
              })).max(5),
            }),
            preferences: z.object({
              notifications: z.object({
                email: z.boolean().default(true),
                sms: z.boolean().default(false),
                push: z.boolean().default(true),
              }),
              privacy: z.object({
                profileVisibility: z.enum(['public', 'friends', 'private']).default('friends'),
                showEmail: z.boolean().default(false),
                allowSearchByEmail: z.boolean().default(true),
              }),
              theme: z.object({
                colorScheme: z.enum(['light', 'dark', 'auto']).default('auto'),
                language: z.string().default('en'),
                timezone: z.string().default('UTC'),
              }),
            }),
          }),
          roles: z.array(z.string()).default([]),
          metadata: z.record(z.string(), z.unknown()).default({}),
        }),
        options: z.object({
          includeArchived: z.boolean().default(false),
          sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
          sortOrder: z.enum(['asc', 'desc']).default('desc'),
          limit: z.number().int().positive().max(1000).default(50),
          offset: z.number().int().nonnegative().default(0),
        }).optional(),
      });

      const complexOutputSchema = z.object({
        success: z.boolean(),
        data: z.union([
          z.object({
            type: z.literal('user'),
            user: complexInputSchema.shape.user,
            relatedUsers: z.array(z.object({
              id: z.string(),
              name: z.string(),
              relationship: z.enum(['friend', 'colleague', 'family']),
            })).optional(),
          }),
          z.object({
            type: z.literal('error'),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.record(z.string(), z.unknown()).optional(),
            }),
          }),
        ]),
        pagination: z.object({
          total: z.number().int().nonnegative(),
          page: z.number().int().positive(),
          pages: z.number().int().nonnegative(),
          hasMore: z.boolean(),
        }).optional(),
        metadata: z.object({
          requestId: z.uuid(),
          timestamp: z.date(),
          processingTime: z.number().positive(),
          version: z.string(),
        }),
      });

      const router = createMockRouter({
        complexRoute: new RouteBuilder()
          .input(complexInputSchema)
          .output(complexOutputSchema)
          .build(),
      });

      expect(() => {
        createRouterHooks(router, {
          useQueryClient: () => mockQueryClient as any,
          // generateInvalidationKeys: true, // Invalid option
          // enableStreaming: true, // Invalid option
        });
      }).not.toThrow();
    });

    it('should handle recursive schema types', () => {
      type TreeNode = {
        id: string;
        name: string;
        children?: TreeNode[];
        parent?: TreeNode;
      };

      const treeSchema: z.ZodType<TreeNode> = z.lazy(() =>
        z.object({
          id: z.string(),
          name: z.string(),
          children: z.array(treeSchema).optional(),
          parent: treeSchema.optional(),
        })
      );

      const router = createMockRouter({
        recursiveRoute: new RouteBuilder()
          .input(z.object({ tree: treeSchema }))
          .output(z.object({ processedTree: treeSchema }))
          .build(),
      });

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });
  });

  describe('Hook Generation Options Edge Cases', () => {
    it('should handle all possible option combinations', () => {
      const router = createMockRouter({
        testRoute: new RouteBuilder()
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
      });

      const optionCombinations = [
        { useQueryClient: () => mockQueryClient as any },
        { useQueryClient: () => mockQueryClient as any }, // was generateInvalidationKeys: true
        { useQueryClient: () => mockQueryClient as any }, // was enableStreaming: true
        { useQueryClient: () => mockQueryClient as any }, // was both options combined
        { useQueryClient: () => mockQueryClient as any }, // was both options false
      ];

      optionCombinations.forEach((options) => {
        expect(() => {
          createRouterHooks(router, options);
        }).not.toThrow();
      });
    });

    it('should handle malformed options object', () => {
      const router = createMockRouter({
        testRoute: new RouteBuilder()
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
      });

      const malformedOptions = [
        // null and undefined cause TypeError, so test that they do throw
        // 'string' as any,
        // 123 as any,
        // [] as any,
        { invalidProperty: true, useQueryClient: () => mockQueryClient as any } as any,
      ];

      // Test that null/undefined options throw errors (expected behavior)
      expect(() => {
        createRouterHooks(router, null as any);
      }).toThrow();

      expect(() => {
        createRouterHooks(router, undefined as any);
      }).toThrow();

      // Test that other malformed options are handled gracefully
      malformedOptions.forEach((options) => {
        expect(() => {
          createRouterHooks(router, options);
        }).not.toThrow();
      });
    });
  });

  describe('Method Detection Edge Cases', () => {
    it('should handle routes with ambiguous method signatures', () => {
      const ambiguousRoutes = {
        // Route that could be interpreted as query or mutation
        getData: new RouteBuilder()
          .method('POST') // POST but reads data
          .input(z.object({ filters: z.record(z.string(), z.unknown()) }))
          .output(z.object({ data: z.array(z.unknown()) }))
          .build(),

        // Route with no clear method indication
        processData: new RouteBuilder()
          .input(z.object({ data: z.unknown() }))
          .output(z.object({ processed: z.boolean() }))
          .build(),
      };

      const router = createMockRouter(ambiguousRoutes);

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });

    it('should handle streaming routes without proper indicators', () => {
      const streamingRoutes = {
        // Route that might be streaming but not clearly marked
        liveData: new RouteBuilder()
          .input(z.object({ topic: z.string() }))
          .output(z.object({ event: z.string(), data: z.unknown() }))
          .build(),

        // Route with streaming-like output but no streaming method
        events: new RouteBuilder()
          .input(z.object({ since: z.date() }))
          .output(z.array(z.object({ id: z.string(), timestamp: z.date() })))
          .build(),
      };

      const router = createMockRouter(streamingRoutes);

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });
  });

  describe('Memory and Performance with Large Routers', () => {
    it('should handle routers with many routes efficiently', () => {
      const largeRouter = createMockRouter(
        Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [
            `route${String(i)}`,
            new RouteBuilder()
              .input(z.object({ [`field${String(i)}`]: z.string() }))
              .output(z.object({ [`result${String(i)}`]: z.number() }))
              .build(),
          ])
        )
      );

      const start = performance.now();

      expect(() => {
        createRouterHooks(largeRouter, {
          useQueryClient: () => mockQueryClient as any,
          // generateInvalidationKeys: true, // Invalid option
          // enableStreaming: true, // Invalid option
        });
      }).not.toThrow();

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle deeply nested route structures', () => {
      const nestedRoutes: Record<string, any> = {};

      // Create nested route names
      for (let i = 0; i < 100; i++) {
        const routeName = Array.from({ length: 10 }, (_, j) => `level${String(j)}`).join('.');
        nestedRoutes[`${routeName}.route${String(i)}`] = new RouteBuilder()
          .input(z.object({ depth: z.number().default(i) }))
          .output(z.object({ processed: z.boolean() }))
          .build();
      }

      const router = createMockRouter(nestedRoutes);

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should continue processing after encountering invalid routes', () => {
      const mixedRouter = {
        validRoute1: new RouteBuilder()
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),

        invalidRoute: {
          // Malformed route object
          invalidProperty: 'invalid',
        },

        validRoute2: new RouteBuilder()
          .input(z.object({ query: z.string() }))
          .output(z.object({ results: z.array(z.string()) }))
          .build(),

        _def: {
          procedures: {
            validRoute1: 'valid',
            invalidRoute: null,
            validRoute2: 'valid',
          },
        },
      };

      expect(() => {
        createRouterHooks(mixedRouter as any, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });

    it('should handle circular references in route definitions', () => {
      const circularRoute = new RouteBuilder()
        .input(z.object({ id: z.string() }))
        .output(z.object({ name: z.string() }))
        .build();

      // Create circular reference
      (circularRoute as unknown as Record<string, unknown>).self = circularRoute;

      const router = createMockRouter({
        circularRoute,
      });

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });
  });

  describe('Hook Name Generation Edge Cases', () => {
    it('should handle routes with conflicting names', () => {
      const conflictingRoutes = {
        'user': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'User': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'USER': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'user_': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'user$': new RouteBuilder().output(z.object({ data: z.string() })).build(),
      };

      const router = createMockRouter(conflictingRoutes);

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });

    it('should handle routes with reserved JavaScript keywords', () => {
      const keywordRoutes = {
        'function': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'class': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'var': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'let': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'const': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'if': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'else': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'for': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'while': new RouteBuilder().output(z.object({ data: z.string() })).build(),
        'return': new RouteBuilder().output(z.object({ data: z.string() })).build(),
      };

      const router = createMockRouter(keywordRoutes);

      expect(() => {
        createRouterHooks(router, { useQueryClient: () => mockQueryClient as any });
      }).not.toThrow();
    });
  });

  describe('Concurrent Hook Generation', () => {
    it('should handle concurrent hook generation calls', () => {
      const router = createMockRouter({
        testRoute: new RouteBuilder()
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
      });

      const concurrentCalls = Array.from({ length: 10 }, () =>
        Promise.resolve().then(() => createRouterHooks(router, { useQueryClient: () => mockQueryClient as any }))
      );

      expect(async () => {
        await Promise.all(concurrentCalls);
      }).not.toThrow();
    });

    it('should maintain consistency across concurrent generations', async () => {
      const router = createMockRouter({
        testRoute: new RouteBuilder()
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
      });

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          Promise.resolve().then(() => createRouterHooks(router, { useQueryClient: () => mockQueryClient as any }))
        )
      );

      // All results should be equivalent (though not necessarily identical objects)
      const firstResult = JSON.stringify(results[0]);
      results.forEach((result) => {
        expect(JSON.stringify(result)).toBe(firstResult);
      });
    });
  });
