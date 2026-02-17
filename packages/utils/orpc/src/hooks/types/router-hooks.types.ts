import type {
  QueryClient,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import type { AnySchema, InferSchemaInput, InferSchemaOutput } from '@orpc/contract';
import type {
  AnyContractProcedureOrBuilder,
  InferInputSchema,
  InferOutputSchema,
} from '../../utils/type-helpers';
import type {
  ExtractOutput,
  LiveQueryOptions,
  StreamedQueryOptions,
} from '../core/hook-factories';
import type { InvalidationConfig } from './invalidation.types';
import type {
  IsGetMethod,
  IsNonGetMethod,
} from './route-method.types';

type IsStreamingProcedure<TContractProc, TRouterProc = TContractProc> =
  TRouterProc extends { queryOptions: unknown }
    ? ExtractOutput<TRouterProc> extends AsyncIterable<unknown>
      ? true
      : false
    : false;

export type ExtractContractInput<T extends AnyContractProcedureOrBuilder> =
  InferInputSchema<T> extends infer TInputSchema
    ? [TInputSchema] extends [undefined]
      ? undefined
      : TInputSchema extends AnySchema
        ? InferSchemaInput<TInputSchema>
        : undefined
    : undefined;

export type ExtractContractOutput<T extends AnyContractProcedureOrBuilder> =
  InferOutputSchema<T> extends infer TOutputSchema
    ? [TOutputSchema] extends [undefined]
      ? unknown
      : TOutputSchema extends AnySchema
        ? InferSchemaOutput<TOutputSchema>
        : unknown
    : unknown;

export type RouterHooksOptions<TContract extends object, TRouter extends object = TContract> = {
  useQueryClient: () => QueryClient;
  invalidations?: InvalidationConfig<TContract, TRouter>;
  hookNaming?: (procedureName: string) => string;
  baseKey?: string;
  debug?: boolean;
};

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

export type RouterHooks<TContract extends object, TRouter extends object = TContract> = {
  [K in keyof TContract as K extends string
    ? IsNonGetMethod<TContract[K]> extends true
      ? K extends keyof TRouter
        ? TRouter[K] extends { mutationOptions?: unknown }
          ? `use${Capitalize<K>}`
          : never
        : never
      : IsGetMethod<TContract[K]> extends true
        ? K extends keyof TRouter
          ? TRouter[K] extends { queryOptions?: unknown }
            ? `use${Capitalize<K>}`
            : never
          : never
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
  queryKeys: {
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

export type HookNames<TContract extends object, TRouter extends object = TContract> = keyof RouterHooks<TContract, TRouter>;