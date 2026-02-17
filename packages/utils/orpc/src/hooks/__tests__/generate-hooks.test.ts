import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ROUTE_METHOD_META_KEY } from '../../shared/route-method-meta';
import type { HTTPMethod } from '@orpc/contract';

const reactQueryMocks = vi.hoisted(() => {
  return {
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

vi.mock('@tanstack/react-query', () => reactQueryMocks);

import { createRouterHooks, defineInvalidations } from '../generate-hooks';

/**
 * Helper to create a mock procedure with RouteBuilder metadata.
 * This simulates what RouteBuilder.build() produces.
 * 
 * The generic <M extends HTTPMethod> is critical - it preserves the literal
 * type of the method ('GET', 'POST', etc.) so that our type guards can
 * distinguish between query and mutation procedures.
 */
function createMockProcedure<M extends HTTPMethod>(
  method: M,
  options: {
    queryKey?: string[];
    queryOptions?: (opts: unknown) => unknown;
    mutationOptions?: (opts: unknown) => unknown;
  } = {}
) {
  return {
    '~orpc': {
      route: { method },
      // RouteBuilder injects this metadata via oc.$meta()
      meta: {
        [ROUTE_METHOD_META_KEY]: { method },
      },
    },
    ...(options.queryKey && { queryKey: options.queryKey }),
    ...(options.queryOptions && { queryOptions: options.queryOptions }),
    ...(options.mutationOptions && { mutationOptions: options.mutationOptions }),
  };
}

describe('generate-hooks', () => {
  beforeEach(() => {
    reactQueryMocks.useQuery.mockReset();
    reactQueryMocks.useMutation.mockReset();
  });

  it('passes TanStack onSuccess args to invalidation resolver', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries };

    const router = {
      list: createMockProcedure('GET', {
        queryKey: ['user.list'],
        // In real ORPC this returns UseQueryOptions; for this test it just returns what it was given.
        queryOptions: (opts: unknown) => opts,
      }),
      create: createMockProcedure('POST', {
        mutationOptions: (opts: unknown) => opts,
      }),
    } as const;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resolver = vi.fn((_data: unknown, _variables: unknown, _context: unknown) => ({
      list: undefined,
    }));

    const invalidations = defineInvalidations(router, {
      create: resolver,
    } as any);

    // Make useMutation return the received options so we can trigger onSuccess manually.
    reactQueryMocks.useMutation.mockImplementation((opts: any) => ({ options: opts }));

    const hooks = createRouterHooks<typeof router>(router, {
      invalidations,
      useQueryClient: () => queryClient as any,
    });

    hooks.useCreate();

    expect(reactQueryMocks.useMutation).toHaveBeenCalledTimes(1);
    expect(reactQueryMocks.useQuery).toHaveBeenCalledTimes(0);

    const passedOptions = reactQueryMocks.useMutation.mock.calls[0]?.[0];
    expect(passedOptions).toBeTruthy();

    const data = { id: 'new' };
    const variables = { name: 'Alice' };
    const context = { from: 'onMutate' };

    passedOptions.onSuccess?.(data, variables, context);

    expect(resolver).toHaveBeenCalledTimes(1);
    expect(resolver).toHaveBeenCalledWith(data, variables, context);

    // list: undefined => invalidate all variants => broad key
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user.list'] });
  });

  it('prefers contract method: POST procedure generates mutation hook', () => {
    const queryClient = { invalidateQueries: vi.fn() };

    const router = {
      // This procedure is intentionally given BOTH options to ensure we still treat it as a mutation
      // when the contract route method is non-GET.
      doThing: createMockProcedure('POST', {
        queryKey: ['doThing.query'],
        queryOptions: (opts: unknown) => opts,
        mutationOptions: (opts: unknown) => opts,
      }),
    } as const;

    reactQueryMocks.useMutation.mockImplementation((opts: any) => ({ options: opts }));

    const hooks = createRouterHooks<typeof router>(router, {
      useQueryClient: () => queryClient as any,
    });

    hooks.useDoThing();

    expect(reactQueryMocks.useMutation).toHaveBeenCalledTimes(1);
    expect(reactQueryMocks.useQuery).toHaveBeenCalledTimes(0);
  });

  it('skips procedures without RouteBuilder metadata (hand-made contracts)', () => {
    const queryClient = { invalidateQueries: vi.fn() };

    // A hand-made contract without RouteBuilder metadata
    const router = {
      handMade: {
        '~orpc': { route: { method: 'GET' } },
        queryKey: ['handMade'],
        queryOptions: (opts: unknown) => opts,
      },
      // A proper RouteBuilder contract
      properContract: createMockProcedure('GET', {
        queryKey: ['proper'],
        queryOptions: (opts: unknown) => opts,
      }),
    } as const;

    reactQueryMocks.useQuery.mockImplementation((opts: any) => ({ options: opts }));

    const hooks = createRouterHooks(router, {
      useQueryClient: () => queryClient as any,
    });

    // Hand-made contract should NOT generate a hook
    expect(hooks).not.toHaveProperty('useHandMade');
    
    // Proper RouteBuilder contract SHOULD generate a hook
    expect(hooks).toHaveProperty('useProperContract');
  });
});
