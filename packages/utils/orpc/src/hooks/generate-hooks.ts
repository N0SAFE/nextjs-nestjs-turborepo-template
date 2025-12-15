/**
 * @fileoverview Auto-generate TanStack Query hooks from ORPC routers
 * 
 * This system provides automatic hook generation with:
 * - Full type inference from ORPC contracts
 * - Contract-based operation detection (reads route metadata for HTTP method)
 * - EventIterator output detection for streaming/live queries
 * - Automatic cache invalidation based on operation semantics
 * - Smart dependency detection between queries and mutations
 * - Composable utility hooks for common patterns
 * 
 * IMPORTANT: Only contracts created via RouteBuilder will generate hooks.
 * Hand-made ORPC contracts (without RouteBuilder metadata) are NOT supported.
 * 
 * TYPE-LEVEL ENFORCEMENT:
 * Since TanStack Query's `createTanstackQueryUtils()` wraps contracts into `ProcedureUtils`
 * types that lose the `~orpc` metadata, you must pass the RAW CONTRACT TYPE as a generic
 * parameter to enable type-level hook discrimination:
 * 
 * @example
 * ```ts
 * import { appContract } from '@repo/api-contracts'
 * 
 * // Auto-generate all hooks for a router
 * // Note: Pass the raw contract type as generic for proper type discrimination
 * const invalidations = defineInvalidations(orpc.user, {
 *   // list form: invalidate all variants of these queries
 *   create: ['list', 'count'],
 *
 *   // resolver form: map mutation input -> specific query inputs (or `undefined` for "all")
 *   update: (input) => ({
 *     list: undefined,
 *     findById: { id: input.id },
 *   }),
 * });
 *
 * const userHooks = createRouterHooks<typeof appContract.user>(orpc.user, { 
 *   invalidations, 
 *   useQueryClient 
 * });
 * 
 * // Use generated hooks - only procedures with RouteBuilder metadata get hooks
 * const { data } = userHooks.useList({ limit: 20 });
 * const createMutation = userHooks.useCreate();
 * ```
 */

import type {
  QueryClient,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { AnySchema } from '@orpc/contract';
import { getEventIteratorSchemaDetails } from '@orpc/contract';
import {
  ExtractRouteMethod,
  HasRouteMethodMeta,
  hasRouteMethodMeta,
  getRouteMethod,
} from '../builder/mount-method';
import { isContractProcedure } from '../utils/type-helpers';

/**
 * Extract the HTTP method from RouteBuilder contract metadata.
 * Returns `never` if the contract doesn't have RouteBuilder metadata.
 * 
 * This replaces the old ProcedureRouteMethod type which read from route.method.
 * Now we ONLY support contracts with RouteBuilder metadata.
 * @internal Used by IsGetMethod and IsNonGetMethod types
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ProcedureRouteMethod<T> = ExtractRouteMethod<T>;

/**
 * Check if a procedure is a GET method (for query operations).
 * Only returns true if the contract has RouteBuilder metadata AND method is GET.
 * 
 * Hand-made contracts without RouteBuilder metadata will return false.
 * @public Exported for debugging and advanced use cases.
 */
export type IsGetMethod<T> = HasRouteMethodMeta<T> extends true
  ? ExtractRouteMethod<T> extends string
    ? Uppercase<ExtractRouteMethod<T>> extends 'GET'
      ? true
      : false
    : false
  : false;

/**
 * Check if a procedure is a non-GET method (for mutation operations).
 * Only returns true if the contract has RouteBuilder metadata AND method is NOT GET.
 * 
 * Hand-made contracts without RouteBuilder metadata will return false.
 * @public Exported for debugging and advanced use cases.
 */
export type IsNonGetMethod<T> = HasRouteMethodMeta<T> extends true
  ? ExtractRouteMethod<T> extends string
    ? Uppercase<ExtractRouteMethod<T>> extends 'GET'
      ? false
      : true
    : false
  : false;

/**
 * Configuration for automatic cache invalidation.
 *
 * For each mutation, you can provide either:
 * - a list of query procedure names to invalidate (broad; invalidates all variants), OR
 * - a resolver mapping mutation input -> query inputs to invalidate (precise).
 * 
 * IMPORTANT: Only procedures with RouteBuilder metadata are included.
 * Hand-made ORPC contracts are excluded.
 * 
 * TYPE-LEVEL DISCRIMINATION:
 * TContract: The raw contract type (from @repo/api-contracts) - has ~orpc metadata for discrimination
 * TRouter: The TanStack utils type (from createTanstackQueryUtils) - has runtime methods for type extraction
 * 
 * When TRouter is omitted, TContract is used for both (backwards compatible with raw contracts).
 */
/**
 * Extract procedure names that should be treated as queries (GET methods)
 * 
 * IMPORTANT: ORPC's createTanstackQueryUtils adds BOTH queryOptions AND mutationOptions
 * to ALL procedures regardless of HTTP method. Therefore, we CANNOT use the presence
 * of queryOptions/mutationOptions to discriminate - we MUST use the contract metadata.
 * 
 * The discrimination is based solely on the HTTP method from TContract's RouteBuilder metadata:
 * - GET methods → queries
 * - POST, PUT, DELETE, PATCH methods → mutations
 * 
 * IMPLEMENTATION NOTE: We use `keyof { [K in ... as FilteredK]: unknown }` pattern
 * because TypeScript's `{ [K in ...]: ... }[keyof T]` pattern doesn't properly distribute
 * over all keys when the mapped type contains complex conditionals.
 */
export type QueryProcedureNames<TContract extends object, TRouter extends object = TContract> = keyof {
  [K in keyof TContract as K extends string
    ? K extends keyof TRouter
      ? IsGetMethod<TContract[K]> extends true
        ? K
        : never
      : never
    : never
  ]: unknown;
} & string;

/**
 * Extract procedure names that should be treated as mutations (non-GET methods)
 * 
 * See QueryProcedureNames for explanation of why we use contract metadata only.
 * 
 * IMPLEMENTATION NOTE: We use `keyof { [K in ... as FilteredK]: unknown }` pattern
 * because TypeScript's `{ [K in ...]: ... }[keyof T]` pattern doesn't properly distribute
 * over all keys when the mapped type contains complex conditionals.
 */
export type MutationProcedureNames<TContract extends object, TRouter extends object = TContract> = keyof {
  [K in keyof TContract as K extends string
    ? K extends keyof TRouter
      ? IsNonGetMethod<TContract[K]> extends true
        ? K
        : never
      : never
    : never
  ]: unknown;
} & string;

type ResolverResult<TContract extends object, TRouter extends object = TContract> = Partial<{
  [Q in QueryProcedureNames<TContract, TRouter>]: Q extends keyof TRouter 
    ? ExtractInput<TRouter[Q]> | undefined 
    : never;
}>;

export type InvalidationConfig<TContract extends object, TRouter extends object = TContract> = Partial<{
  [M in MutationProcedureNames<TContract, TRouter>]: M extends keyof TRouter
    ? | readonly QueryProcedureNames<TContract, TRouter>[]
      | ((
          /**
           * The input variables that were passed to the mutation.
           * Most invalidation logic is based on the input (e.g., which ID was updated).
           */
          input: ExtractMutationInput<TRouter[M]>,
          /**
           * The output data returned by the mutation.
           * Useful when you need to invalidate based on the result.
           */
          output: ExtractMutationOutput<TRouter[M]>,
          /**
           * The context returned from onMutate (for optimistic updates).
           */
          context: ExtractMutationContext<TRouter[M]>
        ) => ResolverResult<TContract, TRouter>)
    : never;
}>;

/**
 * Extract input type from ORPC procedure
 */
export type ExtractInput<T> = T extends { queryOptions: (opts: infer Opts) => unknown }
  ? Opts extends { input: infer Input }
    ? Input
    : never
  : never;

/**
 * Extract output type from ORPC procedure
 */
export type ExtractOutput<T> = T extends { queryOptions: (...args: unknown[]) => unknown }
  ? ReturnType<T['queryOptions']> extends UseQueryOptions<infer Data>
    ? Data
    : never
  : never;

/**
 * Extract mutation input type from ORPC TanStack procedure utils.
 * 
 * ORPC's createTanstackQueryUtils wraps procedures with a `call(input)` method,
 * so we extract the input type from there (not from mutationOptions).
 */
export type ExtractMutationInput<T> = T extends { call: (input: infer Input) => unknown }
  ? Input
  : never;

/**
 * Extract mutation output type from ORPC TanStack procedure utils.
 * 
 * ORPC's `call(input)` returns a Promise<Output>, so we unwrap that.
 */
export type ExtractMutationOutput<T> = T extends { call: (input: unknown) => Promise<infer Output> }
  ? Output
  : T extends { call: (input: unknown) => infer Output }
    ? Output
    : never;

/**
 * Extract TanStack mutation context type (returned by onMutate)
 */
export type ExtractMutationContext<T> = T extends { mutationOptions: (...args: unknown[]) => unknown }
  ? ReturnType<T['mutationOptions']> extends UseMutationOptions<unknown, unknown, unknown, infer TContext>
    ? TContext
    : unknown
  : unknown;

/**
 * Extended operation type supporting all ORPC operation types
 * - 'query': Standard query for GET operations with regular output
 * - 'mutation': For non-GET operations (POST, PUT, DELETE, PATCH)
 * - 'streaming': For EventIterator outputs - generates BOTH live and streamed hooks
 * - 'unsupported': For procedures without RouteBuilder metadata (hand-made contracts)
 */
export type OperationType = 'query' | 'mutation' | 'streaming' | 'unsupported';

/**
 * Contract procedure metadata structure
 * Represents the internal '~orpc' property on contract procedures
 */
export type ContractProcedureMetadata = {
  route?: {
    method?: string;
    path?: string;
  };
  meta?: Record<string, unknown>;
  outputSchema?: AnySchema;
  inputSchema?: AnySchema;
};

/**
 * Check if a schema represents an EventIterator output (streaming)
 * Uses ORPC's built-in detection utility
 * 
 * @param outputSchema - The procedure's output schema
 * @returns true if the output is an EventIterator type
 */
export function isEventIteratorOutput(outputSchema: AnySchema | undefined): boolean {
  if (!outputSchema) return false;
  return getEventIteratorSchemaDetails(outputSchema) !== undefined;
}

/**
 * Detect operation type from RouteBuilder contract metadata.
 * 
 * IMPORTANT: Only contracts created via RouteBuilder will return a valid operation type.
 * Hand-made contracts (without RouteBuilder metadata) will return 'unsupported'.
 * 
 * Detection priority:
 * 1. Check if procedure has RouteBuilder metadata (required!)
 * 2. Check for EventIterator output → 'streaming' (generates BOTH live and streamed hooks)
 * 3. Read HTTP method from RouteBuilder metadata
 * 4. GET method → 'query'
 * 5. Non-GET method (POST, PUT, DELETE, PATCH) → 'mutation'
 * 
 * @param procedure - The ORPC procedure with potential contract metadata
 * @param name - Procedure name (unused, kept for backwards compat)
 * @returns The detected operation type, or 'unsupported' for non-RouteBuilder contracts
 */
export function detectOperationType(
  procedure: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _procedureName?: string
): OperationType {
  // First check if this is a valid contract procedure or builder
  if (!isContractProcedure(procedure)) {
    return 'unsupported';
  }
  
  // CRITICAL: Check for RouteBuilder metadata first
  // Only RouteBuilder-created contracts should generate hooks
  if (!hasRouteMethodMeta(procedure)) {
    return 'unsupported';
  }
  
  // Try to access contract metadata via the internal '~orpc' property
  const def = (procedure as { '~orpc'?: ContractProcedureMetadata })['~orpc'];
  
  // Check for EventIterator output (streaming) - will generate BOTH live and streamed hooks
  if (def?.outputSchema && isEventIteratorOutput(def.outputSchema)) {
    return 'streaming';
  }
  
  // Read method from RouteBuilder metadata (guaranteed to exist at this point)
  const method = getRouteMethod(procedure);
  
  // Determine operation type based on HTTP method
  if (method) {
    return method.toUpperCase() === 'GET' ? 'query' : 'mutation';
  }
  
  // This should never happen since hasRouteMethodMeta ensures method exists
  return 'unsupported';
}

/**
 * Legacy name-based detection for backwards compatibility
 * @deprecated Use detectOperationType with procedure object instead
 */
export function detectOperationTypeByName(name: string): 'query' | 'mutation' {
  const mutationVerbs = ['create', 'update', 'delete', 'remove', 'add', 'set', 'toggle', 'check', 'verify', 'send'];
  const lowerName = name.toLowerCase();
  
  return mutationVerbs.some(verb => lowerName.includes(verb)) ? 'mutation' : 'query';
}

/**
 * Auto-detect which queries should be invalidated by a mutation
 * Based on semantic naming conventions
 */
export function inferInvalidations(mutationName: string, availableQueries: string[]): string[] {
  const invalidations = new Set<string>();
  const lowerMutation = mutationName.toLowerCase();
  
  // Always invalidate list and count queries
  if (lowerMutation.includes('create') || lowerMutation.includes('delete') || lowerMutation.includes('update')) {
    availableQueries.forEach(query => {
      if (query.toLowerCase().includes('list') || query.toLowerCase().includes('count')) {
        invalidations.add(query);
      }
    });
  }
  
  // Update/Delete should invalidate specific item queries (findById, get, etc.)
  if (lowerMutation.includes('update') || lowerMutation.includes('delete')) {
    availableQueries.forEach(query => {
      if (query.toLowerCase().includes('findbyid') || query.toLowerCase().includes('get')) {
        invalidations.add(query);
      }
    });
  }
  
  return Array.from(invalidations);
}

/**
 * Generate query hook for an ORPC procedure
 */
export function createQueryHook<TProcedure extends { queryOptions: unknown; queryKey: unknown }>(
  procedure: TProcedure
) {
  return function useGeneratedQuery(
    input?: ExtractInput<TProcedure>,
    options?: Omit<
      UseQueryOptions<ExtractOutput<TProcedure>, Error, ExtractOutput<TProcedure>>,
      'queryKey' | 'queryFn'
    >
  ): UseQueryResult<ExtractOutput<TProcedure>> {
    return useQuery(
      (procedure.queryOptions as (
        opts: Record<string, unknown>
      ) => UseQueryOptions<ExtractOutput<TProcedure>, Error, ExtractOutput<TProcedure>>)(
        {
          input,
          ...options,
        }
      )
    );
  };
}

/**
 * Options for streamed query hooks
 * Streaming queries accumulate EventIterator chunks into an array
 */
export type StreamedQueryOptions = {
  /** How to handle refetches - 'append' adds to existing, 'reset' clears first */
  refetchMode?: 'append' | 'reset';
  /** Maximum number of chunks to accumulate (default: unlimited) */
  maxChunks?: number;
  /** Whether to retry on error */
  retry?: boolean;
};

/**
 * Options for live query hooks
 * Live queries replace data with the latest EventIterator value
 */
export type LiveQueryOptions = {
  /** Whether to retry on error */
  retry?: boolean;
};

/**
 * Generate streamed query hook for ORPC procedures with EventIterator output
 * Uses experimental_streamedOptions to accumulate chunks from the EventIterator
 * 
 * @param procedure - The ORPC procedure with experimental_streamedOptions
 * @param name - Procedure name for debugging
 */
export function createStreamedQueryHook<TProcedure extends { 
  experimental_streamedOptions?: unknown;
  queryOptions?: unknown;
  queryKey?: unknown;
}>(
  procedure: TProcedure
) {
  return function useGeneratedStreamedQuery(
    input?: ExtractInput<TProcedure>,
    options?: StreamedQueryOptions & 
      Omit<UseQueryOptions<ExtractOutput<TProcedure>[]>, 'queryKey' | 'queryFn'>
  ): UseQueryResult<ExtractOutput<TProcedure>[]> {
    const { refetchMode = 'reset', maxChunks, retry = true, ...queryOptions } = options ?? {};
    
    // Use experimental_streamedOptions if available, fallback to regular queryOptions
    if (procedure.experimental_streamedOptions) {
      return useQuery((procedure.experimental_streamedOptions as (opts: Record<string, unknown>) => UseQueryOptions<ExtractOutput<TProcedure>[], Error, ExtractOutput<TProcedure>[]>)({
        input,
        queryFnOptions: {
          refetchMode,
          ...(maxChunks !== undefined && { maxChunks }),
        },
        retry,
        ...queryOptions,
      }));
    }
    
    // Fallback to regular query if streaming not available
    // This should not happen as streaming procedures should have experimental_streamedOptions
    const queryOpts = procedure.queryOptions as ((opts: Record<string, unknown>) => UseQueryOptions<ExtractOutput<TProcedure>[], Error, ExtractOutput<TProcedure>[]>) | undefined;
    if (!queryOpts) {
      throw new Error('Streaming procedure missing queryOptions fallback');
    }
    return useQuery(queryOpts({
      input,
      ...queryOptions,
    }));
  };
}

/**
 * Generate live query hook for ORPC procedures with EventIterator output
 * Uses experimental_liveOptions to replace data with the latest EventIterator value
 * 
 * @param procedure - The ORPC procedure with experimental_liveOptions
 * @param name - Procedure name for debugging
 */
export function createLiveQueryHook<TProcedure extends { 
  experimental_liveOptions?: unknown;
  queryOptions?: unknown;
  queryKey?: unknown;
}>(
  procedure: TProcedure
) {
  return function useGeneratedLiveQuery(
    input?: ExtractInput<TProcedure>,
    options?: LiveQueryOptions & 
      Omit<UseQueryOptions<ExtractOutput<TProcedure>>, 'queryKey' | 'queryFn'>
  ): UseQueryResult<ExtractOutput<TProcedure>> {
    const { retry = true, ...queryOptions } = options ?? {};
    
    // Use experimental_liveOptions if available, fallback to regular queryOptions
    if (procedure.experimental_liveOptions) {
      return useQuery((procedure.experimental_liveOptions as (opts: Record<string, unknown>) => UseQueryOptions<ExtractOutput<TProcedure>, Error, ExtractOutput<TProcedure>>)({
        input,
        retry,
        ...queryOptions,
      }));
    }
    
    // Fallback to regular query if live not available
    // This should not happen as live procedures should have experimental_liveOptions
    const queryOpts = procedure.queryOptions as ((opts: Record<string, unknown>) => UseQueryOptions<ExtractOutput<TProcedure>, Error, ExtractOutput<TProcedure>>) | undefined;
    if (!queryOpts) {
      throw new Error('Live procedure missing queryOptions fallback');
    }
    return useQuery(queryOpts({
      input,
      ...queryOptions,
    }));
  };
}

/**
 * Generate mutation hook with automatic cache invalidation
 * Note: queryClient must be passed as a parameter since useQueryClient may not be available
 */
export function createMutationHook<TProcedure extends { mutationOptions: unknown; queryKey?: unknown }>(
  procedure: TProcedure,
  _name: string,
  getInvalidateQueries: (
    data: ExtractMutationOutput<TProcedure>,
    variables: ExtractMutationInput<TProcedure>,
    context: ExtractMutationContext<TProcedure>
  ) => { queryKey: unknown; input?: unknown; scope?: 'all' | 'exact' }[],
  useQueryClient: () => QueryClient
) {
  return function useGeneratedMutation(
    options?: Omit<UseMutationOptions<
      ExtractMutationOutput<TProcedure>,
      Error,
      ExtractMutationInput<TProcedure>
    >, 'mutationFn'>
  ): UseMutationResult<
    ExtractMutationOutput<TProcedure>,
    Error,
    ExtractMutationInput<TProcedure>
  > {
    const queryClient = useQueryClient();

    type TData = ExtractMutationOutput<TProcedure>;
    type TVariables = ExtractMutationInput<TProcedure>;
    
    return useMutation((procedure.mutationOptions as (opts: Record<string, unknown>) => UseMutationOptions<TData, Error, TVariables>)({
      ...options,
      onSuccess: (data: TData, variables: TVariables, context: unknown) => {
        // Invalidate related queries
        const toBroadQueryKey = (key: unknown[]) => {
          if (key.length === 0) {
            return key;
          }

          const head = key[0];
          if (Array.isArray(head) && head.length > 0 && typeof head[0] === 'string') {
            return [head[0]];
          }

          return [head];
        };

        getInvalidateQueries(data, variables, context as ExtractMutationContext<TProcedure>).forEach(({ queryKey, input, scope }) => {
          const resolvedKey = typeof queryKey === 'function'
            ? (queryKey as (opts: Record<string, unknown>) => unknown[])({ input: input ?? {} })
            : (queryKey as unknown[]);

          void queryClient.invalidateQueries({
            queryKey: scope === 'all' ? toBroadQueryKey(resolvedKey) : resolvedKey,
          });
        });
        
        // Call user's onSuccess if provided
        if (options?.onSuccess) {
          (options.onSuccess as (data: TData, variables: TVariables, context: unknown) => void)(data, variables, context);
        }
      }
    }));
  };
}

/**
 * Options for router hook generation
 * 
 * TYPE-LEVEL DISCRIMINATION:
 * TContract: The raw contract type (from @repo/api-contracts) - has ~orpc metadata for discrimination
 * TRouter: The TanStack utils type (from createTanstackQueryUtils) - has runtime methods for type extraction
 */
export type RouterHooksOptions<TContract extends object, TRouter extends object = TContract> = {
  /**
   * Lazy QueryClient provider (typically TanStack Query's `useQueryClient`).
   * Required for mutation hooks to invalidate queries.
   */
  useQueryClient: () => QueryClient;
  
  /**
   * Explicit invalidation configuration
   * If not provided, will auto-detect based on naming conventions
   */
  invalidations?: InvalidationConfig<TContract, TRouter>;
  
  /**
   * Custom naming for hooks (default: use{ProcedureName})
   * For streaming procedures, the name will be prefixed with 'live' or 'streamed'
   */
  hookNaming?: (procedureName: string) => string;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
};

/**
 * Explicit hook types.
 *
 * We intentionally spell these out instead of using `ReturnType<typeof createXHook<...>>`.
 * Some tooling (notably type-aware ESLint rules) can degrade to `error`/`any` when
 * consuming deeply-instantiated mapped types built from instantiation expressions.
 */
export type GeneratedQueryHook<TProcedure extends { queryOptions: unknown; queryKey: unknown }> = (
  input?: ExtractInput<TProcedure>,
  options?: Omit<
    UseQueryOptions<ExtractOutput<TProcedure>, Error, ExtractOutput<TProcedure>>,
    'queryKey' | 'queryFn'
  >
) => UseQueryResult<ExtractOutput<TProcedure>>;

export type GeneratedMutationHook<TProcedure extends { mutationOptions: unknown; queryKey?: unknown }> = (
  options?: Omit<
    UseMutationOptions<
      ExtractMutationOutput<TProcedure>,
      Error,
      ExtractMutationInput<TProcedure>
    >,
    'mutationFn'
  >
) => UseMutationResult<
  ExtractMutationOutput<TProcedure>,
  Error,
  ExtractMutationInput<TProcedure>
>;

export type GeneratedLiveQueryHook<TProcedure extends {
  experimental_liveOptions?: unknown;
  queryOptions?: unknown;
  queryKey?: unknown;
}> = (
  input?: ExtractInput<TProcedure>,
  options?: LiveQueryOptions &
    Omit<
      UseQueryOptions<ExtractOutput<TProcedure>, Error, ExtractOutput<TProcedure>>,
      'queryKey' | 'queryFn'
    >
) => UseQueryResult<ExtractOutput<TProcedure>>;

export type GeneratedStreamedQueryHook<TProcedure extends {
  experimental_streamedOptions?: unknown;
  queryOptions?: unknown;
  queryKey?: unknown;
}> = (
  input?: ExtractInput<TProcedure>,
  options?: StreamedQueryOptions &
    Omit<
      UseQueryOptions<ExtractOutput<TProcedure>[], Error, ExtractOutput<TProcedure>[]>,
      'queryKey' | 'queryFn'
    >
) => UseQueryResult<ExtractOutput<TProcedure>[]>;

type IsStreamingProcedure<TContractProc, TRouterProc = TContractProc> =
  // Only RouteBuilder contracts can generate streaming hooks.
  // Check for metadata on TContractProc first, then verify streaming output type using TRouterProc.
  HasRouteMethodMeta<TContractProc> extends true
    ? // Streaming detection is based on the *output type* (EventIterator / AsyncIterable),
      // not on the presence of TanStack helper properties.
      TRouterProc extends { queryOptions: unknown }
        ? ExtractOutput<TRouterProc> extends AsyncIterable<unknown>
          ? true
          : false
        : false
    : false;

/**
 * Type-safe router hooks result
 * Auto-generates properly typed hooks for all procedures
 * 
 * TYPE-LEVEL DISCRIMINATION:
 * TContract: The raw contract type (from @repo/api-contracts) - has ~orpc metadata for discrimination
 * TRouter: The TanStack utils type (from createTanstackQueryUtils) - has runtime methods for type extraction
 * 
 * When TRouter is omitted, TContract is used for both (backwards compatible with raw contracts).
 * 
 * Note: Uses `Record<string, unknown>` for type safety in the output type,
 * but the function accepts any object type for flexibility with ORPC's
 * ProcedureUtils types which don't have explicit index signatures
 */
export type RouterHooks<TContract extends object, TRouter extends object = TContract> = {
  // Standard query/mutation hooks
  // ONLY procedures with RouteBuilder metadata generate hooks.
  // Discriminate using TContract (has ~orpc), extract types from TRouter (has runtime methods)
  // Note: We use optional property checks ({prop?: unknown}) to handle both required and optional properties
  [K in keyof TContract as K extends string
    ? IsNonGetMethod<TContract[K]> extends true
      // Non-GET with metadata → mutation hook (verify K exists in TRouter with mutationOptions)
      ? K extends keyof TRouter
        ? TRouter[K] extends { mutationOptions?: unknown }
          ? `use${Capitalize<K>}`
          : never
        : never
      : IsGetMethod<TContract[K]> extends true
        // GET with metadata → query hook (verify K exists in TRouter with queryOptions)
        ? K extends keyof TRouter
          ? TRouter[K] extends { queryOptions?: unknown }
            ? `use${Capitalize<K>}`
            : never
          : never
        // No RouteBuilder metadata → no hook (never)
        : never
    : never
  ]: K extends keyof TRouter
    ? IsNonGetMethod<TContract[K]> extends true
      ? TRouter[K] extends { mutationOptions?: unknown }
        ? GeneratedMutationHook<TRouter[K] & { mutationOptions: unknown; queryKey?: unknown }>
        : never
      : IsGetMethod<TContract[K]> extends true
        ? TRouter[K] extends { queryOptions?: unknown }
          ? GeneratedQueryHook<TRouter[K] & { queryOptions: unknown; queryKey: unknown }>
          : never
        : never
    : never;
} & {
  // Streaming hooks (useLive*/useStreamed*)
  // Discriminate using TContract, extract types from TRouter
  [K in keyof TContract as K extends string
    ? K extends keyof TRouter
      ? IsStreamingProcedure<TContract[K], TRouter[K]> extends true
        ? `useLive${Capitalize<K>}`
        : never
      : never
    : never
  ]: K extends keyof TRouter
    ? GeneratedLiveQueryHook<TRouter[K] & {
        experimental_liveOptions?: unknown;
        queryOptions?: unknown;
        queryKey?: unknown;
      }>
    : never;
} & {
  [K in keyof TContract as K extends string
    ? K extends keyof TRouter
      ? IsStreamingProcedure<TContract[K], TRouter[K]> extends true
        ? `useStreamed${Capitalize<K>}`
        : never
      : never
    : never
  ]: K extends keyof TRouter
    ? GeneratedStreamedQueryHook<TRouter[K] & {
        experimental_streamedOptions?: unknown;
        queryOptions?: unknown;
        queryKey?: unknown;
      }>
    : never;
};

/**
 * Generate all hooks for an ORPC router with automatic cache invalidation
 * 
 * For EventIterator outputs (streaming operations), generates BOTH:
 * - `useLive{Name}()` - for real-time data replacement mode
 * - `useStreamed{Name}()` - for accumulated chunks mode
 * 
 * TYPE-LEVEL DISCRIMINATION:
 * Since TanStack Query's `createTanstackQueryUtils()` wraps contracts into `ProcedureUtils`
 * types that lose the `~orpc` metadata, you must pass the RAW CONTRACT TYPE as the first
 * generic parameter (`TContract`) to enable type-level hook discrimination.
 * 
 * @typeParam TContract - The raw contract type (from @repo/api-contracts) with ~orpc metadata
 * @typeParam TRouter - The TanStack utils type (inferred from router parameter)
 * @param router - ORPC TanStack utils instance (e.g., orpc.user from createTanstackQueryUtils)
 * @param options - Configuration for hook generation and cache invalidation
 * 
 * @example
 * ```ts
 * import { appContract } from '@repo/api-contracts'
 * 
 * // Note: Pass the raw contract type as generic for proper type discrimination
 * const userHooks = createRouterHooks<typeof appContract.user>(orpc.user, {
 *   invalidations: {
 *     create: ['list', 'count'],
 *     update: ['list', 'findById'],
 *     delete: ['list', 'count', 'findById']
 *   },
 *   useQueryClient
 * });
 * 
 * // Use generated hooks - only procedures with RouteBuilder metadata get hooks
 * function UserList() {
 *   const { data } = userHooks.useList({ limit: 20 });
 *   const create = userHooks.useCreate();
 *   
 *   // For streaming operations, BOTH hooks are generated:
 *   const live = userHooks.useLiveStreamingList({ limit: 20 }); // replaces data
 *   const streamed = userHooks.useStreamedStreamingList({ limit: 20 }); // accumulates
 * }
 * ```
 */
export function createRouterHooks<TContract extends object, TRouter extends object = TContract>(
  router: TRouter,
  options: RouterHooksOptions<TContract, TRouter>
): RouterHooks<TContract, TRouter> {
  const hooks: Record<string, unknown> = {};
  type RouterKey = Extract<keyof TRouter, string>;
  const procedureNames = Object.keys(router) as RouterKey[];
  
  // Separate queries, mutations, and streaming procedures using contract-based detection
  const queries: RouterKey[] = [];
  const mutations: RouterKey[] = [];
  const streamingProcedures: RouterKey[] = []; // EventIterator outputs - get BOTH hooks
  const skippedProcedures: RouterKey[] = []; // Procedures without RouteBuilder metadata
  
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
        // EventIterator output detected.
        // We generate BOTH streaming hooks (useLive*/useStreamed*) and also a standard
        // query hook (useX) when queryOptions is available.
        if (typedProcedure.queryOptions) {
          queries.push(name);
        }
        if (typedProcedure.experimental_streamedOptions || typedProcedure.experimental_liveOptions || typedProcedure.queryOptions) {
          streamingProcedures.push(name);
        }
        break;
      case 'unsupported':
        // Procedure without RouteBuilder metadata - skip hook generation
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
  
  // Generate query hooks
  queries.forEach(name => {
    const hookName = options.hookNaming?.(name) ?? `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    hooks[hookName] = createQueryHook((router as Record<string, unknown>)[name] as { queryOptions: unknown; queryKey: unknown });
    
    if (options.debug) {
      console.log(`Generated query hook: ${hookName}`);
    }
  });
  
  // Generate BOTH streaming hooks for EventIterator outputs
  // Each streaming procedure gets two hooks: useLive{Name} and useStreamed{Name}
  streamingProcedures.forEach(name => {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Generate LIVE hook (replaces data with latest value)
    const liveHookName = options.hookNaming?.(`live${capitalizedName}`) ?? `useLive${capitalizedName}`;
    hooks[liveHookName] = createLiveQueryHook((router as Record<string, unknown>)[name] as { experimental_liveOptions?: unknown; queryOptions?: unknown; queryKey?: unknown });
    
    // Generate STREAMED hook (accumulates chunks)
    const streamedHookName = options.hookNaming?.(`streamed${capitalizedName}`) ?? `useStreamed${capitalizedName}`;
    hooks[streamedHookName] = createStreamedQueryHook((router as Record<string, unknown>)[name] as { experimental_streamedOptions?: unknown; queryOptions?: unknown; queryKey?: unknown });
    
    if (options.debug) {
      console.log(`Generated streaming hooks for "${name}":`);
      console.log(`  - ${liveHookName} (live mode - replaces data)`);
      console.log(`  - ${streamedHookName} (streamed mode - accumulates chunks)`);
    }
  });
  
  // Generate mutation hooks with automatic invalidation
  mutations.forEach(name => {
    const hookName = options.hookNaming?.(name) ?? `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    
    // Determine which queries to invalidate
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

    hooks[hookName] = createMutationHook(
      (router as Record<string, unknown>)[name] as { mutationOptions: unknown; queryKey?: unknown },
      name,
      getInvalidateQueries as unknown as (
        data: never,
        variables: never,
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
  
  return hooks as RouterHooks<TContract, TRouter>;
}

/**
 * Utility type to extract all hook names from a router
 * 
 * @typeParam TContract - The raw contract type (from @repo/api-contracts) with ~orpc metadata
 * @typeParam TRouter - The TanStack utils type (from createTanstackQueryUtils)
 */
export type HookNames<TContract extends object, TRouter extends object = TContract> = keyof RouterHooks<TContract, TRouter>;

/**
 * Helper to create a typed invalidation config
 * 
 * USAGE: When using with TanStack Query utils (ProcedureUtils), pass the raw contract type
 * as the first generic parameter for proper type-level discrimination:
 * 
 * @example
 * ```ts
 * import { appContract } from '@repo/api-contracts'
 * 
 * const invalidations = defineInvalidations<typeof appContract.user>(orpc.user, {
 *   create: ['list', 'count'],
 *   update: (data, input) => ({
 *     list: undefined,
 *     findById: { id: input.id }
 *   })
 * });
 * ```
 * 
 * @typeParam TContract - The raw contract type (from @repo/api-contracts) with ~orpc metadata
 * @typeParam TRouter - The TanStack utils type (inferred from _router parameter)
 */
export function defineInvalidations<TContract extends object, TRouter extends object = TContract>(
  _router: TRouter,
  config: InvalidationConfig<TContract, TRouter>
): InvalidationConfig<TContract, TRouter> {
  return config;
}
