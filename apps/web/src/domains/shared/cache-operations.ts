/**
 * Type-Safe Cache Operations for ORPC Endpoints
 *
 * Provides type-safe cache manipulation methods for any ORPC endpoint:
 * - cache.get(queryClient, input) - Get cached data with full type safety
 * - cache.set(queryClient, input, data) - Set cached data with full type safety
 * - cache.invalidate(queryClient, input) - Invalidate specific query
 * - cache.remove(queryClient, input) - Remove query from cache completely
 * - cache.reset(queryClient, input) - Reset query to initial/loading state
 *
 * Usage:
 * ```typescript
 * // Get typed cache data
 * const cachedUser = userEndpoints.findById.cache.get(queryClient, { id: '123' })
 * // cachedUser is typed as User | undefined
 *
 * // Set cache optimistically
 * userEndpoints.findById.cache.set(queryClient, { id: '123' }, updatedUser)
 *
 * // Invalidate to refetch
 * await userEndpoints.findById.cache.invalidate(queryClient, { id: '123' })
 *
 * // Remove from cache (no refetch)
 * userEndpoints.findById.cache.remove(queryClient, { id: '123' })
 * ```
 */

import type { QueryClient } from "@tanstack/react-query";
import type { Client, ClientContext } from "@orpc/client";

// ============================================================================
// TYPE EXTRACTION
// ============================================================================

/**
 * Extract input type from an ORPC endpoint's ProcedureUtils generic parameters
 *
 * ProcedureUtils has the signature:
 * interface ProcedureUtils<TClientContext, TInput, TOutput, TError>
 * 
 * We extract TInput directly from the interface's generic parameters.
 */
export type ExtractQueryInput<TEndpoint> = 
  // Extract from ProcedureUtils generic parameters (ORPC structure)
  TEndpoint extends {
    call: Client<ClientContext, infer TInput, unknown, unknown>;
  }
    ? TInput
  // Fallback: try to extract from queryOptions method signature
  : TEndpoint extends {
      queryOptions: (options: infer Opts) => unknown;
    }
    ? Opts extends { input: infer I }
      ? I
      : Opts extends { input?: infer I }
        ? I
        : never
  // Fallback: try from queryKey parameter
  : TEndpoint extends {
      queryKey: (options: { input: infer I }) => unknown;
    }
    ? I
    : TEndpoint extends {
        queryKey: (options: { input?: infer I }) => unknown;
      }
      ? I
  // No input required
  : never;

/**
 * Extract output type from an ORPC endpoint's call method (ProcedureUtils.call)
 *
 * ProcedureUtils has: call: Client<TClientContext, TInput, TOutput, TError>
 * We extract TOutput from the Client's generic parameters.
 */
export type ExtractQueryOutput<TEndpoint> = 
  // Extract from Client generic parameters (ORPC structure)
  TEndpoint extends {
    call: Client<ClientContext, unknown, infer TOutput, unknown>;
  }
    ? TOutput
  // Fallback: try Promise return type
  : TEndpoint extends {
      call: (...args: never[]) => Promise<infer O>;
    }
    ? O
    : never;

/**
 * Extract query key type from an ORPC endpoint's queryKey method
 */
export type ExtractQueryKey<TEndpoint> = TEndpoint extends {
  queryKey: (...args: never[]) => infer K;
}
  ? K
  : never;

// ============================================================================
// CACHE OPERATION TYPES
// ============================================================================

/**
 * Cache operations for an endpoint WITH input
 */
export interface CacheOperationsWithInput<TInput, TOutput, TQueryKey> {
  /**
   * Get cached data for this query
   *
   * @param queryClient - TanStack Query client
   * @param input - Query input parameters
   * @returns Cached data or undefined if not in cache
   *
   * @example
   * ```typescript
   * const cachedUser = userEndpoints.findById.cache.get(queryClient, { id: '123' })
   * if (cachedUser) {
   *   console.log('Cache hit:', cachedUser.name)
   * }
   * ```
   */
  get(queryClient: QueryClient, input: TInput): TOutput | undefined;

  /**
   * Set cached data for this query
   *
   * Used for optimistic updates or manual cache population.
   * Does NOT trigger a refetch.
   *
   * @param queryClient - TanStack Query client
   * @param input - Query input parameters
   * @param data - Data to cache (or updater function)
   *
   * @example
   * ```typescript
   * // Set data directly
   * userEndpoints.findById.cache.set(queryClient, { id: '123' }, updatedUser)
   *
   * // Update existing data
   * userEndpoints.findById.cache.set(queryClient, { id: '123' }, (old) => ({
   *   ...old,
   *   name: 'New Name'
   * }))
   * ```
   */
  set(
    queryClient: QueryClient,
    input: TInput,
    data: TOutput | ((old: TOutput | undefined) => TOutput),
  ): void;

  /**
   * Invalidate query to trigger refetch
   *
   * Marks the query as stale and refetches if components are subscribed.
   * This is the standard way to refresh data after mutations.
   *
   * @param queryClient - TanStack Query client
   * @param input - Query input parameters
   * @returns Promise that resolves when invalidation is complete
   *
   * @example
   * ```typescript
   * await userEndpoints.findById.cache.invalidate(queryClient, { id: '123' })
   * ```
   */
  invalidate(queryClient: QueryClient, input: TInput): Promise<void>;

  /**
   * Remove query from cache completely
   *
   * Unlike invalidate, this removes the query entirely and does NOT trigger refetch.
   * Useful for cleanup or when data is no longer relevant.
   *
   * @param queryClient - TanStack Query client
   * @param input - Query input parameters
   *
   * @example
   * ```typescript
   * userEndpoints.findById.cache.remove(queryClient, { id: '123' })
   * ```
   */
  remove(queryClient: QueryClient, input: TInput): void;

  /**
   * Reset query to initial/loading state
   *
   * Resets the query without refetching. The query will enter loading state
   * and refetch when next accessed by a component.
   *
   * @param queryClient - TanStack Query client
   * @param input - Query input parameters
   * @returns Promise that resolves when reset is complete
   *
   * @example
   * ```typescript
   * await userEndpoints.findById.cache.reset(queryClient, { id: '123' })
   * ```
   */
  reset(queryClient: QueryClient, input: TInput): Promise<void>;

  /**
   * Get the query key for this input
   *
   * Useful for advanced cache operations or debugging.
   *
   * @param input - Query input parameters
   * @returns The query key array
   *
   * @example
   * ```typescript
   * const key = userEndpoints.findById.cache.getKey({ id: '123' })
   * console.log('Query key:', key) // ['user', 'findById', { id: '123' }]
   * ```
   */
  getKey(input: TInput): TQueryKey;
};

/**
 * Cache operations for an endpoint WITHOUT input
 */
export interface CacheOperationsWithoutInput<TOutput, TQueryKey> {
  /**
   * Get cached data for this query
   */
  get(queryClient: QueryClient): TOutput | undefined;

  /**
   * Set cached data for this query
   */
  set(
    queryClient: QueryClient,
    data: TOutput | ((old: TOutput | undefined) => TOutput),
  ): void;

  /**
   * Invalidate query to trigger refetch
   */
  invalidate(queryClient: QueryClient): Promise<void>;

  /**
   * Remove query from cache completely
   */
  remove(queryClient: QueryClient): void;

  /**
   * Reset query to initial/loading state
   */
  reset(queryClient: QueryClient): Promise<void>;

  /**
   * Get the query key
   */
  getKey(): TQueryKey;
};

/**
 * Cache operations - handles both with and without input
 */
export type CacheOperations<TEndpoint> =
  ExtractQueryInput<TEndpoint> extends never
    ? CacheOperationsWithoutInput<
        ExtractQueryOutput<TEndpoint>,
        ExtractQueryKey<TEndpoint>
      >
    : CacheOperationsWithInput<
        ExtractQueryInput<TEndpoint>,
        ExtractQueryOutput<TEndpoint>,
        ExtractQueryKey<TEndpoint>
      >;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Create cache operations for an ORPC endpoint
 *
 * @param endpoint - ORPC endpoint with queryKey and queryOptions methods
 * @returns Cache operations object
 *
 * @example
 * ```typescript
 * const userWithCache = {
 *   ...userEndpoints.findById,
 *   cache: createCacheOperations(userEndpoints.findById)
 * }
 * ```
 */
export function createCacheOperations<TEndpoint>(
  endpoint: TEndpoint,
): CacheOperations<TEndpoint> {
  // Check if endpoint has queryKey method (required for queries)
  if (
    !endpoint ||
    typeof endpoint !== "object" ||
    !("queryKey" in endpoint) ||
    typeof endpoint.queryKey !== "function"
  ) {
    throw new Error(
      "Endpoint must have a queryKey method to create cache operations",
    );
  }

  // Check if endpoint requires input by checking the queryKey signature
  const queryKeyFn = endpoint.queryKey as (...args: unknown[]) => unknown;
  const queryKeyLength = queryKeyFn.length;

  // If queryKey.length > 0, it requires input (options object)
  const requiresInput = queryKeyLength > 0;

  if (requiresInput) {
    // Create operations that require input
    return {
      get: (queryClient: QueryClient, input: unknown) => {
        const queryKey = queryKeyFn({ input });
        return queryClient.getQueryData(queryKey as never);
      },

      set: (
        queryClient: QueryClient,
        input: unknown,
        data: unknown,
      ) => {
        const queryKey = queryKeyFn({ input });
        queryClient.setQueryData(queryKey as never, data as never);
      },

      invalidate: async (queryClient: QueryClient, input: unknown) => {
        const queryKey = queryKeyFn({ input });
        await queryClient.invalidateQueries({ queryKey: queryKey as never });
      },

      remove: (queryClient: QueryClient, input: unknown) => {
        const queryKey = queryKeyFn({ input });
        queryClient.removeQueries({ queryKey: queryKey as never });
      },

      reset: async (queryClient: QueryClient, input: unknown) => {
        const queryKey = queryKeyFn({ input });
        await queryClient.resetQueries({ queryKey: queryKey as never });
      },

      getKey: (input: unknown) => {
        return queryKeyFn({ input });
      },
    } as CacheOperations<TEndpoint>;
  } else {
    // Create operations that don't require input
    return {
      get: (queryClient: QueryClient) => {
        const queryKey = queryKeyFn();
        // @ts-expect-error - queryKey type is complex, but runtime behavior is correct
        return queryClient.getQueryData(queryKey);
      },

      set: (
        queryClient: QueryClient,
        data: unknown,
      ) => {
        const queryKey = queryKeyFn();
        queryClient.setQueryData(queryKey as never, data as never);
      },

      invalidate: async (queryClient: QueryClient) => {
        const queryKey = queryKeyFn();
        await queryClient.invalidateQueries({ queryKey: queryKey as never });
      },

      remove: (queryClient: QueryClient) => {
        const queryKey = queryKeyFn();
        queryClient.removeQueries({ queryKey: queryKey as never });
      },

      reset: async (queryClient: QueryClient) => {
        const queryKey = queryKeyFn();
        await queryClient.resetQueries({ queryKey: queryKey as never });
      },

      getKey: () => {
        return queryKeyFn();
      },
    } as CacheOperations<TEndpoint>;
  }
}

/**
 * Enhance an endpoint with cache operations
 *
 * @param endpoint - ORPC endpoint
 * @returns Endpoint with cache property
 */
export type EndpointWithCache<TEndpoint> = TEndpoint & {
  cache: CacheOperations<TEndpoint>;
};

/**
 * Recursively enhance all endpoints in a router with cache operations
 *
 * Handles both flat and nested ORPC router structures:
 * - Flat: { endpoint1, endpoint2 }
 * - Nested: { domain1: { endpoint1, endpoint2 }, domain2: { endpoint3 } }
 *
 * @param router - ORPC router or endpoints record
 * @returns Router with each query endpoint enhanced with cache operations
 *
 * @example
 * ```typescript
 * // Flat endpoints
 * const enhancedAuth = addCacheOperations(authEndpoints)
 * // Now: enhancedAuth.session.cache.get(queryClient)
 *
 * // Nested router (from createTanstackQueryUtils)
 * const enhancedOrpc = addCacheOperations(orpc)
 * // Now: enhancedOrpc.auth.session.cache.get(queryClient)
 * ```
 */
export function addCacheOperations<TRouter>(
  router: TRouter,
): AddCacheToRouter<TRouter> {
  // Use a Proxy to intercept property access and add cache operations on-the-fly
  // This preserves the original object structure without copying
  return new Proxy(router as object, {
    get(target: object, prop: string | symbol, receiver: unknown): unknown {
      const value = Reflect.get(target, prop, receiver) as unknown;
      
      // If not an object or null, return as-is
      if (!value || typeof value !== "object") {
        return value;
      }
      
      // If it's a query endpoint (has queryKey method), add cache operations
      if ("queryKey" in value && typeof value.queryKey === "function") {
        // Check if we've already enhanced this endpoint (cached)
        if ("cache" in value) {
          return value;
        }
        
        // Create enhanced endpoint with cache operations
        return new Proxy(value as object, {
          get(endpointTarget: object, endpointProp: string | symbol): unknown {
            if (endpointProp === "cache") {
              return createCacheOperations(value);
            }
            return Reflect.get(endpointTarget, endpointProp);
          },
          has(endpointTarget: object, endpointProp: string | symbol): boolean {
            if (endpointProp === "cache") {
              return true;
            }
            return Reflect.has(endpointTarget, endpointProp);
          },
        });
      }
      
      // For nested routers (objects that are not endpoints), recursively enhance
      if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        return addCacheOperations(value);
      }
      
      // Return everything else as-is
      return value;
    },
    
    has(target: object, prop: string | symbol): boolean {
      return Reflect.has(target, prop);
    },
    
    ownKeys(target: object): (string | symbol)[] {
      return Reflect.ownKeys(target);
    },
    
    getOwnPropertyDescriptor(target: object, prop: string | symbol): PropertyDescriptor | undefined {
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  }) as AddCacheToRouter<TRouter>;
}

/**
 * Type helper to recursively add cache operations to router structure
 * 
 * This handles the nested structure of ORPC routers:
 * - Endpoints with queryKey get cache operations
 * - Nested routers get recursively processed
 * - Mutations and other methods pass through unchanged
 */
type AddCacheToRouter<TRouter> = TRouter extends infer R
  ? {
      [K in keyof R]: R[K] extends { queryKey: (...args: never[]) => unknown }
        ? EndpointWithCache<R[K]>
        : R[K] extends (...args: never[]) => unknown
          ? R[K] // Keep functions as-is (mutations, etc.)
          : R[K] extends object
            ? AddCacheToRouter<R[K]> // Recursively process nested routers
            : R[K]; // Keep primitives as-is
    }
  : never;

/**
 * Enhance a single endpoint with cache operations
 *
 * @param endpoint - ORPC endpoint
 * @returns Endpoint with cache property
 *
 * @example
 * ```typescript
 * const session = enhanceSingleEndpoint(customEndpoint)
 * // Now: session.cache.get(queryClient)
 * ```
 */
export function enhanceSingleEndpoint<TEndpoint>(
  endpoint: TEndpoint,
): EndpointWithCache<TEndpoint> {
  return {
    ...(endpoint as object),
    cache: createCacheOperations(endpoint),
  } as EndpointWithCache<TEndpoint>;
}
