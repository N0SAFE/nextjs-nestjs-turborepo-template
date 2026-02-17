import type { QueryKey } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type {
  ExtractInput,
  ExtractMutationContext,
  ExtractMutationInput,
  ExtractMutationOutput,
} from '../core/hook-factories';
import type {
  MutationProcedureNames,
  QueryProcedureNames,
} from './route-method.types';

type ResolverResult<TContract extends object, TRouter extends object = TContract> = Partial<{
  [Q in QueryProcedureNames<TContract, TRouter>]: Q extends keyof TRouter
    ? ExtractInput<TRouter[Q]> | undefined
    : never;
}>;

export type ExtractCustomHooksKeys<TCustom extends Record<string, unknown>> =
  TCustom extends { keys: infer TKeys } ? TKeys : Record<string, never>;

type ExtractMutationVariables<T> = T extends UseMutationResult<unknown, unknown, infer TVariables>
  ? TVariables
  : never;

type ExtractMutationData<T> = T extends UseMutationResult<infer TData, unknown>
  ? TData
  : never;

type ExtractQueryData<T> = T extends UseQueryResult<infer TData, unknown>
  ? TData
  : never;

type IsMutationResult<T> = T extends UseMutationResult<unknown, unknown>
  ? true
  : false;

type IsQueryResult<T> = T extends UseQueryResult<unknown, unknown>
  ? true
  : false;

type ExtractHookReturnType<T> = T extends (...args: readonly unknown[]) => infer TReturn
  ? TReturn
  : never;

export type ExtractCustomHookInput<T> =
  ExtractHookReturnType<T> extends infer TReturn
    ? IsMutationResult<TReturn> extends true
      ? ExtractMutationVariables<TReturn>
      : IsQueryResult<TReturn> extends true
        ? T extends (input: infer TInput, ...args: readonly unknown[]) => unknown
          ? TInput
          : never
        : never
    : never;

export type ExtractCustomHookOutput<T> =
  ExtractHookReturnType<T> extends infer TReturn
    ? IsMutationResult<TReturn> extends true
      ? ExtractMutationData<TReturn>
      : IsQueryResult<TReturn> extends true
        ? ExtractQueryData<TReturn>
        : never
    : never;

export type CustomInvalidationContext<
  TKeys,
  TInput = unknown,
  TOutput = unknown
> = {
  keys: TKeys;
  input: TInput;
  result: TOutput;
};

type CustomInvalidationPart<
  TContract extends object,
  TRouter extends object,
  TCustom extends Record<string, unknown>
> = TCustom extends { keys: infer TKeys }
  ? Partial<{
      [K in Exclude<keyof TCustom, 'keys'>]:
        | readonly (QueryProcedureNames<TContract, TRouter> | keyof TCustom | '*')[]
        | ((
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
  [M in MutationProcedureNames<TContract, TRouter>]: M extends keyof TRouter
    ? | readonly QueryProcedureNames<TContract, TRouter>[]
      | ((
          input: ExtractMutationInput<TRouter[M]>,
          output: ExtractMutationOutput<TRouter[M]>,
          context: ExtractMutationContext<TRouter[M]>
        ) => ResolverResult<TContract, TRouter>)
    : never;
}> & CustomInvalidationPart<TContract, TRouter, TCustom>;