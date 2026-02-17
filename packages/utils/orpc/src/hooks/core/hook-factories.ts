import type {
  QueryClient,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';

/**
 * Extract input type from ORPC procedure (for runtime extraction).
 */
export type ExtractInput<T> =
  T extends { call: (input: infer Input) => unknown }
    ? Input
    : undefined;

/**
 * Extract output type from ORPC procedure (for runtime extraction).
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
 * Extract TanStack mutation context type (returned by onMutate).
 */
export type ExtractMutationContext<T> = T extends { mutationOptions: (...args: unknown[]) => unknown }
  ? ReturnType<T['mutationOptions']> extends UseMutationOptions<unknown, unknown, unknown, infer TContext>
    ? TContext
    : unknown
  : unknown;

/**
 * Options for streamed query hooks.
 */
export type StreamedQueryOptions = {
  refetchMode?: 'append' | 'reset';
  maxChunks?: number;
  retry?: boolean;
};

/**
 * Options for live query hooks.
 */
export type LiveQueryOptions = {
  retry?: boolean;
};

/**
 * Generate query hook for an ORPC procedure.
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
 * Generate streamed query hook for ORPC procedures with EventIterator output.
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
 * Generate live query hook for ORPC procedures with EventIterator output.
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

    if (procedure.experimental_liveOptions) {
      return useQuery((procedure.experimental_liveOptions as (opts: Record<string, unknown>) => UseQueryOptions<ExtractOutput<TProcedure>, Error, ExtractOutput<TProcedure>>)({
        input,
        retry,
        ...queryOptions,
      }));
    }

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
 * Generate mutation hook with automatic cache invalidation.
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

        if (options?.onSuccess) {
          (options.onSuccess as (data: TData, variables: TVariables, context: unknown) => void)(data, variables, context);
        }
      }
    }));
  };
}
