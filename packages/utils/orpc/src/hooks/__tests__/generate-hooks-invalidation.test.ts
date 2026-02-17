import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod/v4';
import { createRouterHooks } from '../generate-hooks';
import { RouteBuilder } from '../../builder/core/route-builder';

// Mock query client for tests
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
};

const createMockRouter = (routes: Record<string, unknown>) => ({
  ...routes,
  _def: {
    procedures: routes,
  },
});

describe('Hook Generation - Invalidation Logic', () => {
  it('should generate hooks with explicit array invalidations', () => {
    const router = createMockRouter({
      getUser: new RouteBuilder({ method: 'GET' })
        .input(z.object({ id: z.uuid() }))
        .output(z.object({ name: z.string() }))
        .build(),
      getUsers: new RouteBuilder({ method: 'GET' })
        .output(z.array(z.object({ id: z.uuid(), name: z.string() })))
        .build(),
      createUser: new RouteBuilder({ method: 'POST' })
        .input(z.object({ name: z.string() }))
        .output(z.object({ id: z.uuid() }))
        .build(),
    });

    expect(() => {
      createRouterHooks(router, {
        useQueryClient: () => mockQueryClient as never,
        invalidations: {
          createUser: ['getUser', 'getUsers'] as never[],
        },
      });
    }).not.toThrow();
  });

  it('should generate hooks with function-based invalidations', () => {
    const router = createMockRouter({
      getUser: new RouteBuilder({ method: 'GET' })
        .input(z.object({ id: z.uuid() }))
        .output(z.object({ name: z.string() }))
        .build(),
      updateUser: new RouteBuilder({ method: 'PUT' })
        .input(z.object({ id: z.uuid(), name: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .build(),
    });

    expect(() => {
      createRouterHooks(router, {
        useQueryClient: () => mockQueryClient as never,
        invalidations: {
          updateUser: (data: unknown, variables: unknown) => ({
            getUser: { id: (variables as { id: string }).id },
          }),
        } as never,
      });
    }).not.toThrow();
  });

  it('should generate hooks with debug logging enabled', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const router = createMockRouter({
      getTest: new RouteBuilder({ method: 'GET' })
        .output(z.object({ data: z.string() }))
        .build(),
    });

    createRouterHooks(router, {
      useQueryClient: () => mockQueryClient as never,
      debug: true,
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle skipped procedures with debug warnings', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const router = createMockRouter({
      validRoute: new RouteBuilder({ method: 'GET' })
        .output(z.object({ data: z.string() }))
        .build(),
      invalidRoute: { some: 'object' }, // Not a RouteBuilder result
    });

    createRouterHooks(router as never, {
      useQueryClient: () => mockQueryClient as never,
      debug: true,
    });

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should infer invalidations from mutation names', () => {
    const router = createMockRouter({
      getUsers: new RouteBuilder({ method: 'GET' })
        .output(z.array(z.object({ id: z.uuid() })))
        .build(),
      createUser: new RouteBuilder({ method: 'POST' })
        .input(z.object({ name: z.string() }))
        .output(z.object({ id: z.uuid() }))
        .build(),
      updateUser: new RouteBuilder({ method: 'PUT' })
        .input(z.object({ id: z.uuid(), name: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .build(),
      deleteUser: new RouteBuilder({ method: 'DELETE' })
        .input(z.object({ id: z.uuid() }))
        .output(z.object({ success: z.boolean() }))
        .build(),
    });

    // Should automatically infer getUsers invalidation for createUser, updateUser, deleteUser
    expect(() => {
      createRouterHooks(router, {
        useQueryClient: () => mockQueryClient as never,
      });
    }).not.toThrow();
  });

  it('should handle exact vs all scope invalidations', () => {
    const router = createMockRouter({
      getUser: new RouteBuilder({ method: 'GET' })
        .input(z.object({ id: z.uuid() }))
        .output(z.object({ name: z.string() }))
        .build(),
      updateUser: new RouteBuilder({ method: 'PUT' })
        .input(z.object({ id: z.uuid(), name: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .build(),
    });

    expect(() => {
      createRouterHooks(router, {
        useQueryClient: () => mockQueryClient as never,
        invalidations: {
          updateUser: (data: unknown, variables: { id: string }) => ({
            // Exact scope (with input)
            getUser: { id: variables.id },
          }),
        } as never,
      });
    }).not.toThrow();
  });
});
