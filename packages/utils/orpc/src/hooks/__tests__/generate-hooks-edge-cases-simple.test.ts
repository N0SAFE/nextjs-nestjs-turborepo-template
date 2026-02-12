import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { createRouterHooks } from '../generate-hooks';
import { RouteBuilder } from '../../builder/route-builder';

describe('Hook Generation - Edge Cases & Error Handling', () => {
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

  describe('Router Hook Creation', () => {
    it('should handle empty router gracefully', () => {
      const emptyRouter = createMockRouter({});

      expect(() => {
        createRouterHooks(emptyRouter, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });

    it('should handle router with simple routes', () => {
      const router = createMockRouter({
        getUser: new RouteBuilder()
          .method('GET')
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string(), email: z.string() }))
          .build(),
      });

      expect(() => {
        createRouterHooks(router, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });

    it('should handle router with complex schemas', () => {
      const complexSchema = z.object({
        user: z.object({
          id: z.string(),
          profile: z.object({
            name: z.string(),
            settings: z.object({
              theme: z.enum(['light', 'dark']),
              notifications: z.boolean(),
            }),
          }),
          roles: z.array(z.string()),
        }),
        metadata: z.record(z.string(), z.unknown()),
      });

      const router = createMockRouter({
        complexRoute: new RouteBuilder()
          .method('POST')
          .input(complexSchema)
          .output(complexSchema.extend({ id: z.string() }))
          .build(),
      });

      expect(() => {
        createRouterHooks(router, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });

    it('should handle routes with special characters in names', () => {
      const specialCharRoutes = {
        'route-with-dashes': new RouteBuilder()
          .method('GET')
          .output(z.object({ data: z.string() }))
          .build(),
        'route_with_underscores': new RouteBuilder()
          .method('GET')
          .output(z.object({ data: z.string() }))
          .build(),
      };

      const router = createMockRouter(specialCharRoutes);

      expect(() => {
        createRouterHooks(router, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });

    it('should handle routes with no input or output schemas', () => {
      const minimalRoutes = {
        noInput: new RouteBuilder()
          .method('GET')
          .output(z.object({ data: z.string() }))
          .build(),
        noOutput: new RouteBuilder()
          .method('POST')
          .input(z.object({ query: z.string() }))
          .build(),
        minimal: new RouteBuilder()
          .method('GET')
          .build(),
      };

      const router = createMockRouter(minimalRoutes);

      expect(() => {
        createRouterHooks(router, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });
  });

  describe('Performance with Large Routers', () => {
    it('should handle routers with many routes efficiently', () => {
      const largeRouter = createMockRouter(
        Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [
            `route${String(i)}`,
            new RouteBuilder()
              .method('GET')
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
        });
      }).not.toThrow();

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle recursive schema types', () => {
      type TreeNode = {
        id: string;
        name: string;
        children?: TreeNode[];
      };

      const treeSchema: z.ZodType<TreeNode> = z.lazy(() =>
        z.object({
          id: z.string(),
          name: z.string(),
          children: z.array(treeSchema).optional(),
        })
      );

      const router = createMockRouter({
        recursiveRoute: new RouteBuilder()
          .method('GET')
          .input(z.object({ tree: treeSchema }))
          .output(z.object({ processedTree: treeSchema }))
          .build(),
      });

      expect(() => {
        createRouterHooks(router, {
          useQueryClient: () => mockQueryClient as any,
        });
      }).not.toThrow();
    });
  });

  describe('Hook Generation Options', () => {
    it('should handle different option combinations', () => {
      const router = createMockRouter({
        testRoute: new RouteBuilder()
          .method('GET')
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
      });

      const optionCombinations = [
        { useQueryClient: () => mockQueryClient as any },
        { 
          useQueryClient: () => mockQueryClient as any,
        },
        { 
          useQueryClient: () => mockQueryClient as any,
        },
      ];

      optionCombinations.forEach((options) => {
        expect(() => {
          createRouterHooks(router, options);
        }).not.toThrow();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle routes with mixed valid and invalid configurations', () => {
      const mixedRouter = {
        validRoute1: new RouteBuilder()
          .method('GET')
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
        
        validRoute2: new RouteBuilder()
          .method('POST')
          .input(z.object({ query: z.string() }))
          .output(z.object({ results: z.array(z.string()) }))
          .build(),
        
        _def: {
          procedures: {
            validRoute1: 'valid',
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
  });

  describe('Concurrent Hook Generation', () => {
    it('should handle concurrent hook generation calls', async () => {
      const router = createMockRouter({
        testRoute: new RouteBuilder()
          .method('GET')
          .input(z.object({ id: z.string() }))
          .output(z.object({ name: z.string() }))
          .build(),
      });

      const concurrentCalls = Array.from({ length: 5 }, () =>
        Promise.resolve().then(() => 
          createRouterHooks(router, {
            useQueryClient: () => mockQueryClient as any,
          })
        )
      );

      await expect(Promise.all(concurrentCalls)).resolves.toBeDefined();
    });
  });
});