/**
 * @fileoverview Auto-generate TanStack Query hooks from ORPC routers
 *
 * Architecture note:
 * - Runtime helpers live in `./core/*`
 * - Type contracts live in `./types/*` (via `./types` barrel)
 * - This file orchestrates generation and preserves the public API surface
 */

import type { QueryKey } from '@tanstack/react-query';
import {
  createLiveQueryHook,
  createMutationHook,
  createQueryHook,
  createStreamedQueryHook,
  type ExtractMutationInput,
  type ExtractMutationOutput,
} from './core/hook-factories';
import {
  detectOperationType,
  inferInvalidations,
} from './core/operation-detection';
import type {
  InvalidationConfig,
  MutationProcedureNames,
  RouterHooks,
  RouterHooksOptions,
} from './types';

// Re-export runtime helpers/types for stable public API
export {
  createQueryHook,
  createMutationHook,
  createStreamedQueryHook,
  createLiveQueryHook,
} from './core/hook-factories';
export type {
  ExtractInput,
  ExtractOutput,
  ExtractMutationInput,
  ExtractMutationOutput,
  StreamedQueryOptions,
  LiveQueryOptions,
} from './core/hook-factories';

export {
  detectOperationType,
  inferInvalidations,
  isEventIteratorOutput,
} from './core/operation-detection';
export type { OperationType } from './core/operation-detection';

// Re-export all generate-hooks public types from dedicated type module
export type {
  HookNames,
  RouterHooks,
  RouterHooksOptions,
  InvalidationConfig,
  QueryProcedureNames,
  MutationProcedureNames,
  IsGetMethod,
  IsNonGetMethod,
  ExtractContractInput,
  ExtractContractOutput,
  GeneratedQueryHook,
  GeneratedMutationHook,
  GeneratedLiveQueryHook,
  GeneratedStreamedQueryHook,
  ExtractCustomHooksKeys,
  ExtractCustomHookInput,
  ExtractCustomHookOutput,
  CustomInvalidationContext,
} from './types';

/**
 * Generate all hooks for an ORPC router with automatic cache invalidation.
 */
export function createRouterHooks<TContract extends object, TRouter extends object = TContract>(
  router: TRouter,
  options: RouterHooksOptions<TContract, TRouter>
): RouterHooks<TContract, TRouter> {
  const hooks: Record<string, unknown> = {};
  type RouterKey = Extract<keyof TRouter, string>;
  const procedureNames = Object.keys(router) as RouterKey[];

  const queryKeys: Record<string, unknown> = {
    all: [options.baseKey ?? 'orpc'] as const,
  };

  const queries: RouterKey[] = [];
  const mutations: RouterKey[] = [];
  const streamingProcedures: RouterKey[] = [];
  const skippedProcedures: RouterKey[] = [];

  procedureNames.forEach(name => {
    const procedure = router[name] as unknown;
    const operationType = detectOperationType(procedure, name);
    const typedProcedure = procedure as Record<string, unknown>;

    switch (operationType) {
      case 'query':
        if (typedProcedure.queryOptions) {
          queries.push(name);
        }
        break;
      case 'mutation':
        if (typedProcedure.mutationOptions) {
          mutations.push(name);
        }
        break;
      case 'streaming':
        if (typedProcedure.queryOptions) {
          queries.push(name);
        }
        if (typedProcedure.experimental_streamedOptions || typedProcedure.experimental_liveOptions || typedProcedure.queryOptions) {
          streamingProcedures.push(name);
        }
        break;
      case 'unsupported':
        skippedProcedures.push(name);
        break;
    }
  });

  if (options.debug) {
    console.log('Generating hooks for router:', {
      queries,
      mutations,
      streamingProcedures,
      skippedProcedures,
      totalProcedures: procedureNames.length
    });

    if (skippedProcedures.length > 0) {
      console.warn(
        `Skipped ${String(skippedProcedures.length)} procedure(s) without RouteBuilder metadata:`,
        skippedProcedures,
        '\nHooks are only generated for contracts created via RouteBuilder.'
      );
    }
  }

  queries.forEach(name => {
    const hookName = options.hookNaming?.(name) ?? `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const procedure = (router as Record<string, unknown>)[name] as { queryOptions: unknown; queryKey: unknown };
    hooks[hookName] = createQueryHook(procedure);

    queryKeys[name] = (input?: unknown) => {
      if (!procedure.queryKey) return [...(queryKeys.all as readonly string[]), name];
      return typeof procedure.queryKey === 'function'
        ? (procedure.queryKey as (opts: { input: unknown }) => QueryKey)({ input })
        : (procedure.queryKey as QueryKey);
    };

    if (options.debug) {
      console.log(`Generated query hook: ${hookName}`);
      console.log(`Generated query key factory: queryKeys.${name}`);
    }
  });

  streamingProcedures.forEach(name => {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

    const liveHookName = options.hookNaming?.(`live${capitalizedName}`) ?? `useLive${capitalizedName}`;
    hooks[liveHookName] = createLiveQueryHook((router as Record<string, unknown>)[name] as { experimental_liveOptions?: unknown; queryOptions?: unknown; queryKey?: unknown });

    const streamedHookName = options.hookNaming?.(`streamed${capitalizedName}`) ?? `useStreamed${capitalizedName}`;
    hooks[streamedHookName] = createStreamedQueryHook((router as Record<string, unknown>)[name] as { experimental_streamedOptions?: unknown; queryOptions?: unknown; queryKey?: unknown });

    if (options.debug) {
      console.log(`Generated streaming hooks for "${name}":`);
      console.log(`  - ${liveHookName} (live mode - replaces data)`);
      console.log(`  - ${streamedHookName} (streamed mode - accumulates chunks)`);
    }
  });

  mutations.forEach(name => {
    const hookName = options.hookNaming?.(name) ?? `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;

    const explicitInvalidations = options.invalidations?.[name as unknown as MutationProcedureNames<TContract, TRouter>];
    const inferredQueryNames = inferInvalidations(name, queries);

    const getInvalidateQueries = (data: unknown, variables: unknown, context: unknown) => {
      const results: { queryKey: unknown; input?: unknown; scope?: 'all' | 'exact' }[] = [];

      const add = (queryName: string, input: unknown, scope: 'all' | 'exact') => {
        const queryProcedure = (router as Record<string, unknown>)[queryName] as Record<string, unknown> | undefined;
        if (!queryProcedure?.queryKey) {
          if (options.debug) {
            console.warn(`Query procedure "${queryName}" not found for invalidation`);
          }
          return;
        }
        results.push({ queryKey: queryProcedure.queryKey, input, scope });
      };

      if (Array.isArray(explicitInvalidations)) {
        explicitInvalidations.forEach((queryName) => {
          add(String(queryName), undefined, 'all');
        });
        return results;
      }

      if (typeof explicitInvalidations === 'function') {
        const mapping = (explicitInvalidations as (data: unknown, variables: unknown, context: unknown) => Record<string, unknown>)(data, variables, context);
        Object.entries(mapping).forEach(([queryName, input]) => {
          add(queryName, input, input === undefined ? 'all' : 'exact');
        });
        return results;
      }

      inferredQueryNames.forEach((queryName) => {
        add(queryName, undefined, 'all');
      });

      return results;
    };

    const mutationProcedure = (router as Record<string, unknown>)[name] as { mutationOptions: unknown; queryKey?: unknown };
    hooks[hookName] = createMutationHook(
      mutationProcedure,
      name,
      getInvalidateQueries as (
        data: ExtractMutationOutput<typeof mutationProcedure>,
        variables: ExtractMutationInput<typeof mutationProcedure>,
        context: unknown
      ) => { queryKey: unknown; input?: unknown; scope?: 'all' | 'exact' }[],
      options.useQueryClient
    );

    if (options.debug) {
      console.log(`Generated mutation hook: ${hookName}`, {
        invalidates: explicitInvalidations ?? inferredQueryNames
      });
    }
  });

  hooks.queryKeys = queryKeys;

  return hooks as RouterHooks<TContract, TRouter>;
}

/**
 * Legacy name-based detection for backwards compatibility.
 * Prefer `detectOperationType` which relies on contract metadata.
 */
export function detectOperationTypeByName(name: string): 'query' | 'mutation' {
  const mutationVerbs = ['create', 'update', 'delete', 'remove', 'add', 'set', 'toggle', 'check', 'verify', 'send'];
  const lowerName = name.toLowerCase();
  return mutationVerbs.some((verb) => lowerName.includes(verb)) ? 'mutation' : 'query';
}

/**
 * Helper to create typed invalidation config for ORPC/custom hooks.
 */
export function defineInvalidations<
  TContract extends object,
  TRouter extends object = TContract,
  TCustom extends Record<string, unknown> = Record<string, never>
>(
  _sourcesOrRouter: TRouter | { contract?: TRouter; custom?: TCustom },
  config: InvalidationConfig<TContract, TRouter, TCustom>
): InvalidationConfig<TContract, TRouter, TCustom> {
  return config;
}
