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
 * - Query key registry for manual cache operations
 * 
 * IMPORTANT: Only contracts created via RouteBuilder will generate hooks.
 * Hand-made ORPC contracts (without RouteBuilder metadata) are NOT supported.
 * 
 * UNIFIED HOOK PATTERN:
 * This generator creates hooks that follow the same pattern as Better Auth hooks
 * (useAdmin, useOrganization), providing consistency across the codebase:
 * 
 * - Generated hooks: `hooks.use{ProcedureName}()` - TanStack Query hooks
 * - Query keys: `hooks.queryKeys.{procedureName}(input)` - Key factories for cache operations
 * - Base key: `hooks.queryKeys.all` - Root key for invalidating all queries
 * 
 * This allows Better Auth style invalidation in mutations:
 * ```ts
 * useMutation({
 *   onSuccess: () => {
 *     // Invalidate specific query
 *     queryClient.invalidateQueries({ queryKey: hooks.queryKeys.findById({ id }) })
 *     // Invalidate all list queries
 *     queryClient.invalidateQueries({ queryKey: hooks.queryKeys.list() })
 *   }
 * })
 * ```
 * 
 * TYPE-LEVEL ENFORCEMENT:
 * Since TanStack Query's `createTanstackQueryUtils()` wraps contracts into `ProcedureUtils`
 * types that lose the `~orpc` metadata, you must pass the RAW CONTRACT TYPE as a generic
 * parameter to enable type-level hook discrimination:
 * 
 * @example Basic Usage
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
 *   useQueryClient,
 *   baseKey: 'user' // Optional: customize base key (default: 'orpc')
 * });
 * 
 * // Use generated hooks - only procedures with RouteBuilder metadata get hooks
 * const { data } = userHooks.useList({ limit: 20 });
 * const createMutation = userHooks.useCreate();
 * 
 * // Export query keys for manual operations
 * export const userQueryKeys = userHooks.queryKeys;
 * 
 * // Use in other hooks (Better Auth style)
 * function useUpdateUserMutation() {
 *   const queryClient = useQueryClient();
 *   return useMutation({
 *     mutationFn: async (data) => { ... },
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
 *       queryClient.invalidateQueries({ queryKey: userQueryKeys.findById({ id: data.id }) })
 *     }
 *   });
 * }
 * ```
 * 
 * @see apps/web/src/hooks/useUser.orpc-hooks.ts for ORPC usage example
 * @see apps/web/src/hooks/useAdmin.ts for Better Auth pattern reference
 * @see apps/web/src/hooks/useOrganization.ts for Better Auth pattern reference
 */

import type {
  QueryClient,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { AnySchema, InferSchemaInput, InferSchemaOutput } from '@orpc/contract';
import { getEventIteratorSchemaDetails } from '@orpc/contract';
import {
  ExtractRouteMethod,
  HasRouteMethodMeta,
  hasRouteMethodMeta,
  getRouteMethod,
} from '../builder/mount-method';
import { isContractProcedure, type InferInputSchema, type InferOutputSchema, type AnyContractProcedureOrBuilder } from '../utils/type-helpers';

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

/**
 * Unified invalidation configuration for both ORPC and custom hooks.
 * 
 * Supports two patterns:
 * 1. ORPC mutations: Map mutation name to queries to invalidate
 * 2. Custom hooks: Map custom hook name to queries to invalidate
 * 
 * @example
 * ```ts
 * const invalidations = defineInvalidations({
 *   contract: appContract.user,
 *   custom: authCustomHooks
 * }, {
 *   // ORPC mutations
 *   create: () => ['list', 'count'],
 *   update: (input) => ({ list: undefined, findById: { id: input.id } }),
 *   
 *   // Custom hook invalidations (type-safe!)
 *   useSignInEmail: () => ['*'], // Invalidate all
 *   useSignOut: () => ['*'],
 * })
 * ```
 */
/**
 * Extract the keys type from custom hooks (if defined).
 * The keys are expected to be on `TCustom['keys']`.
 */
export type ExtractCustomHooksKeys<TCustom extends Record<string, unknown>> = 
  TCustom extends { keys: infer TKeys } ? TKeys : Record<string, never>;

// ============================================================================
// CUSTOM HOOK TYPE EXTRACTION UTILITIES
// ============================================================================

/**
 * Extract the input (variables) type from a UseMutationResult.
 * For mutations, TVariables represents the input passed to mutate().
 * 
 * Uses `any` in the pattern to be permissive in matching, then infer
 * extracts the actual type.
 * 
 * @example
 * ```ts
 * // Given: UseMutationResult<User, Error, { email: string }>
 * // Extracts: { email: string }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMutationVariables<T> = T extends UseMutationResult<any, any, infer TVariables, any>
  ? TVariables 
  : never;

/**
 * Extract the data (result) type from a UseMutationResult.
 * 
 * @example
 * ```ts
 * // Given: UseMutationResult<User, Error, { email: string }>
 * // Extracts: User
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMutationData<T> = T extends UseMutationResult<infer TData, any, any, any>
  ? TData 
  : never;

/**
 * Extract the data type from a UseQueryResult.
 * For queries, TData represents the query result.
 * 
 * @example
 * ```ts
 * // Given: UseQueryResult<User[]>
 * // Extracts: User[]
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractQueryData<T> = T extends UseQueryResult<infer TData, any>
  ? TData 
  : never;

/**
 * Check if a type is a UseMutationResult.
 * Uses `any` for permissive pattern matching.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsMutationResult<T> = T extends UseMutationResult<any, any, any, any> 
  ? true 
  : false;

/**
 * Check if a type is a UseQueryResult.
 * Uses `any` for permissive pattern matching.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsQueryResult<T> = T extends UseQueryResult<any, any> 
  ? true 
  : false;

/**
 * Extract the return type of a custom hook function.
 * Custom hooks are functions that return UseQueryResult or UseMutationResult.
 * 
 * Uses `any` for the args pattern to be permissive in matching.
 * 
 * @example
 * ```ts
 * // Given: () => UseMutationResult<User, Error, { email: string }>
 * // Extracts: UseMutationResult<User, Error, { email: string }>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractHookReturnType<T> = T extends (...args: any[]) => infer TReturn 
  ? TReturn 
  : never;

/**
 * Extract the input type from a custom hook.
 * 
 * For mutation hooks: Returns the TVariables type (input to mutate())
 * For query hooks: Returns the parameters of the hook function itself
 * 
 * This allows invalidation callbacks to receive the input that was used:
 * ```ts
 * useUpdateUser: ({ keys, input }) => [keys.findById({ id: input.id })]
 * ```
 * 
 * @example Mutation Hook
 * ```ts
 * // Hook: useSignInEmail: () => useMutation<User, Error, { email: string; password: string }>()
 * // ExtractCustomHookInput: { email: string; password: string }
 * ```
 * 
 * @example Query Hook  
 * ```ts
 * // Hook: useUser: (id: string) => useQuery<User>()
 * // ExtractCustomHookInput: string (first parameter)
 * ```
 */
export type ExtractCustomHookInput<T> = 
  ExtractHookReturnType<T> extends infer TReturn
    ? IsMutationResult<TReturn> extends true
      ? ExtractMutationVariables<TReturn>
      : IsQueryResult<TReturn> extends true
        // For queries, extract input from the hook's parameters
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? T extends (input: infer TInput, ...args: any[]) => any
          ? TInput
          : never
        : never
    : never;

/**
 * Extract the result/output type from a custom hook.
 * 
 * For mutation hooks: Returns the TData type (mutation result)
 * For query hooks: Returns the TData type (query data)
 * 
 * This allows invalidation callbacks to access the result:
 * ```ts
 * useCreateUser: ({ keys, result }) => [keys.findById({ id: result.id })]
 * ```
 * 
 * @example Mutation Hook
 * ```ts
 * // Hook: useCreateUser: () => useMutation<User, Error, CreateUserInput>()
 * // ExtractCustomHookOutput: User
 * ```
 * 
 * @example Query Hook
 * ```ts
 * // Hook: useUsers: () => useQuery<User[]>()
 * // ExtractCustomHookOutput: User[]
 * ```
 */
export type ExtractCustomHookOutput<T> =
  ExtractHookReturnType<T> extends infer TReturn
    ? IsMutationResult<TReturn> extends true
      ? ExtractMutationData<TReturn>
      : IsQueryResult<TReturn> extends true
        ? ExtractQueryData<TReturn>
        : never
    : never;

// ============================================================================
// CUSTOM INVALIDATION CONTEXT
// ============================================================================

/**
 * Context passed to custom hook invalidation callbacks.
 * Provides type-safe access to query keys, hook input, and result data.
 * 
 * @template TKeys - The query key factories from the custom hooks
 * @template TInput - The input type for this specific hook (mutation variables or query input)
 * @template TOutput - The output type for this specific hook (mutation/query result data)
 * 
 * @example Basic usage with keys only
 * ```ts
 * useSignOut: ({ keys }) => [keys.all()]
 * ```
 * 
 * @example With input for conditional invalidation
 * ```ts
 * useUpdateUser: ({ keys, input }) => [
 *   keys.list(),
 *   keys.findById({ id: input.id }),
 * ]
 * ```
 * 
 * @example With result for post-mutation invalidation
 * ```ts
 * useCreateUser: ({ keys, result }) => [
 *   keys.list(),
 *   keys.findById({ id: result.id }),
 * ]
 * ```
 */
export type CustomInvalidationContext<
  TKeys,
  TInput = unknown,
  TOutput = unknown
> = {
  /**
   * Type-safe query key factories from custom hooks.
   * Each key is a function returning a readonly query key tuple.
   * 
   * @example
   * ```ts
   * useSignInEmail: ({ keys }) => [keys.session()]
   * ```
   */
  keys: TKeys;
  
  /**
   * The input passed to the hook/mutation.
   * 
   * For mutations: The variables passed to mutate()
   * For queries: The input parameters passed to the hook
   * 
   * @example
   * ```ts
   * useUpdateUser: ({ keys, input }) => [
   *   keys.findById({ id: input.id }),
   * ]
   * ```
   */
  input: TInput;
  
  /**
   * The result data from the hook operation.
   * 
   * For mutations: The data returned by the mutation (available in onSuccess)
   * For queries: The query data
   * 
   * Note: This is optional in the context because it may not be available
   * at all invalidation points (e.g., before mutation completes).
   * 
   * @example
   * ```ts
   * useCreateUser: ({ keys, result }) => [
   *   keys.findById({ id: result.id }),
   * ]
   * ```
   */
  result: TOutput;
};

/**
 * Custom hook invalidation config - only applies when TCustom has actual keys
 * Uses the presence of 'keys' property to detect custom hooks.
 * 
 * Each hook gets its own typed context with:
 * - keys: The shared query key factories
 * - input: The specific input type for that hook
 * - result: The specific output type for that hook
 */
type CustomInvalidationPart<
  TContract extends object,
  TRouter extends object,
  TCustom extends Record<string, unknown>
> = TCustom extends { keys: infer TKeys } 
  ? Partial<{
      [K in Exclude<keyof TCustom, 'keys'>]: 
        | readonly (QueryProcedureNames<TContract, TRouter> | keyof TCustom | '*')[]
        | ((
            /**
             * Context providing type-safe access to query keys, input, and result.
             * Types are inferred from the custom hook definition.
             */
            context: CustomInvalidationContext<
              TKeys,
              ExtractCustomHookInput<TCustom[K]>,
              ExtractCustomHookOutput<TCustom[K]>
            >
          ) => readonly QueryKey[])
    }>
  : object;

export type InvalidationConfig<
  TContract extends object, 
  TRouter extends object = TContract,
  TCustom extends Record<string, unknown> = Record<string, never>
> = Partial<{
  // ORPC mutation invalidations
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
}> & CustomInvalidationPart<TContract, TRouter, TCustom>;

/**
 * Extract input type from ORPC contract via schema inference.
 * 
 * Strategy:
 * 1. Extract inputSchema from contract using InferInputSchema
 * 2. Use ORPC's InferSchemaInput to infer the TypeScript type
 * 3. If no schema, use undefined (procedures without input)
 */
export type ExtractContractInput<T extends AnyContractProcedureOrBuilder> = 
  InferInputSchema<T> extends infer TInputSchema
    ? [TInputSchema] extends [undefined]
      ? undefined
      : TInputSchema extends AnySchema
        ? InferSchemaInput<TInputSchema>
        : undefined
    : undefined;

/**
 * Extract output type from ORPC contract via schema inference.
 * 
 * Strategy:
 * 1. Extract outputSchema from contract using InferOutputSchema
 * 2. Use ORPC's InferSchemaOutput to infer the TypeScript type
 * 3. If no schema, use unknown
 */
export type ExtractContractOutput<T extends AnyContractProcedureOrBuilder> = 
  InferOutputSchema<T> extends infer TOutputSchema
    ? [TOutputSchema] extends [undefined]
      ? unknown
      : TOutputSchema extends AnySchema
        ? InferSchemaOutput<TOutputSchema>
        : unknown
    : unknown;

/**
 * Extract input type from ORPC procedure (for runtime extraction).
 * Uses the contract type when available, falls back to runtime methods.
 */
export type ExtractInput<T> = 
  T extends { call: (input: infer Input) => unknown }
    ? Input
    : undefined;

/**
 * Extract output type from ORPC procedure (for runtime extraction).
 * Uses the contract type when available, falls back to runtime methods.
 */
export type ExtractOutput<T> = 
  T extends { call: (...args: unknown[]) => Promise<infer Output> }
    ? Output
    : unknown;

/**
 * Extract mutation input type from ORPC procedure.
 */
export type ExtractMutationInput<T> = ExtractInput<T>;

/**
 * Extract mutation output type from ORPC procedure.
 */
export type ExtractMutationOutput<T> = ExtractOutput<T>;

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
   * Base key for query key registry (default: 'orpc')
   * Used as the root key for all generated query keys
   * 
   * @example
   * baseKey: 'user' → queryKeys.all = ['user']
   * baseKey: 'org' → queryKeys.all = ['org']
   */
  baseKey?: string;
  
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
export type GeneratedQueryHook<
  TContract extends AnyContractProcedureOrBuilder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TProcedure extends { queryOptions: unknown; queryKey: unknown }
> = (
  input?: ExtractContractInput<TContract>,
  options?: Omit<
    UseQueryOptions<ExtractContractOutput<TContract>, Error, ExtractContractOutput<TContract>>,
    'queryKey' | 'queryFn'
  >
) => UseQueryResult<ExtractContractOutput<TContract>>;

export type GeneratedMutationHook<
  TContract extends AnyContractProcedureOrBuilder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TProcedure extends { mutationOptions: unknown; queryKey?: unknown }
> = (
  options?: Omit<
    UseMutationOptions<
      ExtractContractOutput<TContract>,
      Error,
      ExtractContractInput<TContract>
    >,
    'mutationFn'
  >
) => UseMutationResult<
  ExtractContractOutput<TContract>,
  Error,
  ExtractContractInput<TContract>
>;

export type GeneratedLiveQueryHook<
  TContract extends AnyContractProcedureOrBuilder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TProcedure extends {
    experimental_liveOptions?: unknown;
    queryOptions?: unknown;
    queryKey?: unknown;
  }
> = (
  input?: ExtractContractInput<TContract>,
  options?: LiveQueryOptions &
    Omit<
      UseQueryOptions<ExtractContractOutput<TContract>, Error, ExtractContractOutput<TContract>>,
      'queryKey' | 'queryFn'
    >
) => UseQueryResult<ExtractContractOutput<TContract>>;

export type GeneratedStreamedQueryHook<
  TContract extends AnyContractProcedureOrBuilder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TProcedure extends {
    experimental_streamedOptions?: unknown;
    queryOptions?: unknown;
    queryKey?: unknown;
  }
> = (
  input?: ExtractContractInput<TContract>,
  options?: StreamedQueryOptions &
    Omit<
      UseQueryOptions<ExtractContractOutput<TContract>[], Error, ExtractContractOutput<TContract>[]>,
      'queryKey' | 'queryFn'
    >
) => UseQueryResult<ExtractContractOutput<TContract>[]>;

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
  // Discriminate using TContract (has ~orpc), extract types from TContract (has schemas)
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
        ? GeneratedMutationHook<Extract<TContract[K], AnyContractProcedureOrBuilder>, TRouter[K] & { mutationOptions: unknown; queryKey?: unknown }>
        : never
      : IsGetMethod<TContract[K]> extends true
        ? TRouter[K] extends { queryOptions?: unknown }
          ? GeneratedQueryHook<Extract<TContract[K], AnyContractProcedureOrBuilder>, TRouter[K] & { queryOptions: unknown; queryKey: unknown }>
          : never
        : never
    : never;
} & {
  // Streaming hooks (useLive*/useStreamed*)
  // Discriminate using TContract, extract types from TContract (has schemas)
  [K in keyof TContract as K extends string
    ? K extends keyof TRouter
      ? IsStreamingProcedure<TContract[K], TRouter[K]> extends true
        ? `useLive${Capitalize<K>}`
        : never
      : never
    : never
  ]: K extends keyof TRouter
    ? GeneratedLiveQueryHook<Extract<TContract[K], AnyContractProcedureOrBuilder>, TRouter[K] & {
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
    ? GeneratedStreamedQueryHook<Extract<TContract[K], AnyContractProcedureOrBuilder>, TRouter[K] & {
        experimental_streamedOptions?: unknown;
        queryOptions?: unknown;
        queryKey?: unknown;
      }>
    : never;
} & {
  /**
   * Query key registry for manual cache operations
   * 
   * Contains factory functions for generating query keys for each procedure.
   * Use these for manual prefetching, invalidation, or other cache operations.
   * 
   * @example
   * ```ts
   * const hooks = createRouterHooks(orpc.user, { ... });
   * 
   * // All procedures
   * queryClient.invalidateQueries({ queryKey: hooks.queryKeys.all });
   * 
   * // Specific procedure with input
   * queryClient.prefetchQuery({
   *   queryKey: hooks.queryKeys.list({ limit: 20 }),
   *   queryFn: ...
   * });
   * ```
   */
  queryKeys: {
    /** Base key for all query keys */
    all: readonly [string];
  } & {
    [K in keyof TContract as K extends string
      ? K extends keyof TRouter
        ? IsGetMethod<TContract[K]> extends true
          ? TRouter[K] extends { queryOptions?: unknown }
            ? K
            : never
          : IsStreamingProcedure<TContract[K], TRouter[K]> extends true
            ? TRouter[K] extends { queryOptions?: unknown }
              ? K
              : never
            : never
        : never
      : never
    ]: (input?: ExtractContractInput<Extract<TContract[K], AnyContractProcedureOrBuilder>>) => readonly unknown[];
  };
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
  
  // Build query key registry
  const queryKeys: Record<string, unknown> = {
    all: [options.baseKey ?? 'orpc'] as const,
  };
  
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
  
  // Generate query hooks and query key factories
  queries.forEach(name => {
    const hookName = options.hookNaming?.(name) ?? `use${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const procedure = (router as Record<string, unknown>)[name] as { queryOptions: unknown; queryKey: unknown };
    hooks[hookName] = createQueryHook(procedure);
    
    // Add query key factory
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
  
  // Add queryKeys to the hooks object
  hooks.queryKeys = queryKeys;
  
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
 * Helper to create a unified typed invalidation config for both ORPC and custom hooks.
 * 
 * NEW UNIFIED PATTERN: Pass both ORPC contract and custom hooks in a sources object,
 * then define all invalidation rules (ORPC + custom) in one config for type safety.
 * 
 * @example With both ORPC and custom hooks
 * ```ts
 * import { appContract } from '@repo/api-contracts'
 * 
 * const authCustomHooks = defineCustomHooks({
 *   useSignInEmail: () => useMutation({ mutationFn: authClient.signIn.email }),
 *   useSignOut: () => useMutation({ mutationFn: signOut }),
 * })
 * 
 * const invalidations = defineInvalidations({
 *   contract: appContract.user,  // ORPC contract
 *   custom: authCustomHooks,     // Custom hooks
 * }, {
 *   // ORPC mutations (type-safe from contract)
 *   create: ['list', 'count'],
 *   update: (input) => ({ list: undefined, findById: { id: input.id } }),
 *   
 *   // Custom hook invalidations (type-safe from authCustomHooks!)
 *   useSignInEmail: () => ['*'], // Special key to invalidate all
 *   useSignOut: () => ['*'],
 * })
 * ```
 * 
 * @example ORPC only (backwards compatible)
 * ```ts
 * const invalidations = defineInvalidations(orpc.user, {
 *   create: ['list', 'count'],
 *   update: (input) => ({ list: undefined, findById: { id: input.id } })
 * })
 * ```
 * 
 * @typeParam TContract - The raw contract type (from @repo/api-contracts) with ~orpc metadata
 * @typeParam TRouter - The TanStack utils type (inferred from sources parameter)
 * @typeParam TCustom - Custom hooks type for custom invalidations
 */
export function defineInvalidations<
  TContract extends object, 
  TRouter extends object = TContract,
  TCustom extends Record<string, unknown> = Record<string, never>
>(
  sourcesOrRouter: TRouter | { contract?: TRouter; custom?: TCustom },
  config: InvalidationConfig<TContract, TRouter, TCustom>
): InvalidationConfig<TContract, TRouter, TCustom> {
  // Type guard to detect new unified pattern vs legacy pattern
  // New pattern: { contract, custom }
  // Legacy pattern: router object directly
  return config;
}
