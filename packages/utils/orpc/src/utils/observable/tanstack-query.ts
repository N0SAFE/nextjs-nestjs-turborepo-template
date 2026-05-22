import type { Client, ClientContext, NestedClient } from "@orpc/client";
import {
  createTanstackQueryUtils,
  type CreateRouterUtilsOptions,
  type RouterUtils,
} from "@orpc/tanstack-query";
import type { QueryFunctionContext, QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { Observable as RxjsObservable } from "rxjs";
import type { MonoTypeOperatorFunction, Observable as RxObservable } from "rxjs";
import { reconstructObservableFromEventIterator } from "./event-iterator";

export type ObservableQueryMode = "observable" | "streamed-observable";

type InputOption<TInput> = undefined extends TInput
  ? { input?: TInput }
  : { input: TInput };

type ContextOption<TContext> = Record<never, never> extends TContext
  ? { context?: TContext }
  : { context: TContext };

type RuntimeProcedureWithCall = {
  call: (...args: unknown[]) => unknown;
};

type TanstackProcedureUtilsLike = {
  call: unknown;
  experimental_liveKey: unknown;
  experimental_streamedKey: unknown;
  experimental_liveOptions: unknown;
  experimental_streamedOptions: unknown;
};

type ExtractProcedureInput<TProcedure> = TProcedure extends {
  call: Client<infer _TContext, infer TInput, infer _TOutput, infer _TError>;
}
  ? TInput
  : never;

type ExtractProcedureOutput<TProcedure> = TProcedure extends {
  call: Client<infer _TContext, infer _TInput, infer TOutput, infer _TError>;
}
  ? TOutput
  : never;

type ExtractProcedureContext<TProcedure> = TProcedure extends {
  call: Client<infer TContext, infer _TInput, infer _TOutput, infer _TError>;
}
  ? TContext
  : Record<never, never>;

type ExtractStreamValue<TOutput> = TOutput extends AsyncIterable<infer TChunk>
  ? TChunk
  : TOutput extends RxObservable<infer TChunk>
    ? TChunk
    : TOutput;

type ExtractProcedureStreamValue<TProcedure> = ExtractStreamValue<ExtractProcedureOutput<TProcedure>>;

type AliasKeyMethod<
  TProcedure,
  TMethodName extends "experimental_liveKey" | "experimental_streamedKey",
  TInput,
> = TProcedure extends Record<TMethodName, infer TMethod>
  ? TMethod
  : (options?: { input?: TInput; queryKey?: QueryKey }) => QueryKey;

export type ObservablePipeInvoker<TValue> = (
  ...operators: MonoTypeOperatorFunction<TValue>[]
) => RxObservable<TValue>;

export type ObservablePipeTransform<TValue> = (
  rxjsPipe: ObservablePipeInvoker<TValue>,
) => RxObservable<TValue>;

export type ObservableQueryFnOptions<TValue> = {
  pipe?: ObservablePipeTransform<TValue>;
}

export type StreamedObservableQueryFnOptions<TValue> = {
  onChunk?: (chunk: TValue, allChunks: readonly TValue[]) => void;
} & ObservableQueryFnOptions<TValue>

export type ObservableOptionsConfig<
  TInput,
  TStreamValue,
  TError = Error,
  TContext = Record<never, never>,
> = InputOption<TInput> &
  ContextOption<TContext> & {
  queryKey?: QueryKey;
  queryFnOptions?: ObservableQueryFnOptions<TStreamValue>;
} & Omit<UseQueryOptions<TStreamValue, TError>, "queryKey" | "queryFn">;

export type StreamedObservableOptionsConfig<
  TInput,
  TStreamValue,
  TError = Error,
  TContext = Record<never, never>,
> = InputOption<TInput> &
  ContextOption<TContext> & {
  queryKey?: QueryKey;
  queryFnOptions?: StreamedObservableQueryFnOptions<TStreamValue>;
} & Omit<UseQueryOptions<TStreamValue[], TError>, "queryKey" | "queryFn">;

type ObservableQueryOptionsResult<TStreamValue, TError> = Omit<
  UseQueryOptions<TStreamValue, TError>,
  "queryKey" | "queryFn"
> & {
  queryKey: QueryKey;
  queryFn: (context: QueryFunctionContext) => Promise<TStreamValue>;
};

type StreamedObservableQueryOptionsResult<TStreamValue, TError> = Omit<
  UseQueryOptions<TStreamValue[], TError>,
  "queryKey" | "queryFn"
> & {
  queryKey: QueryKey;
  queryFn: (context: QueryFunctionContext) => Promise<TStreamValue[]>;
};

export type ObservableProcedureQueryUtils<
  TInput,
  TStreamValue,
  TContext = Record<never, never>,
> = {
  experimental_observableOptions<TError = Error>(
    options: ObservableOptionsConfig<TInput, TStreamValue, TError, TContext>,
  ): ObservableQueryOptionsResult<TStreamValue, TError>;
  experimental_streamedObservableOptions<TError = Error>(
    options: StreamedObservableOptionsConfig<TInput, TStreamValue, TError, TContext>,
  ): StreamedObservableQueryOptionsResult<TStreamValue, TError>;
};

type ObservableRouterQueryUtils<TOrpc> = TOrpc extends TanstackProcedureUtilsLike
  ? TOrpc &
      ObservableProcedureQueryUtils<
        ExtractProcedureInput<TOrpc>,
        ExtractProcedureStreamValue<TOrpc>,
        ExtractProcedureContext<TOrpc>
      > & {
        experimental_observablekey: AliasKeyMethod<
          TOrpc,
          "experimental_liveKey",
          ExtractProcedureInput<TOrpc>
        >;
        experimental_streamedObservableKey: AliasKeyMethod<
          TOrpc,
          "experimental_streamedKey",
          ExtractProcedureInput<TOrpc>
        >;
      }
  : TOrpc extends (...args: unknown[]) => unknown
    ? TOrpc
  : TOrpc extends object
    ? { [K in keyof TOrpc]: ObservableRouterQueryUtils<TOrpc[K]> }
    : TOrpc;

export type ObservableQueryUtils<TInputOrOrpc, TStreamValue = never> = [TStreamValue] extends [never]
  ? ObservableRouterQueryUtils<TInputOrOrpc>
  : ObservableProcedureQueryUtils<TInputOrOrpc, TStreamValue>;

function isObjectLike(value: unknown): value is object {
  return (typeof value === "object" && value !== null) || typeof value === "function";
}

function isProcedureWithCall(value: unknown): value is RuntimeProcedureWithCall {
  return isObjectLike(value) && "call" in value && typeof (value as { call?: unknown }).call === "function";
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === "object" && value !== null && Symbol.asyncIterator in value;
}

function isRxObservable(value: unknown): value is RxObservable<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "subscribe" in value &&
    typeof (value as { subscribe?: unknown }).subscribe === "function"
  );
}

function getBoundMethod(target: object, methodName: string): ((...args: unknown[]) => unknown) | undefined {
  if (!(methodName in target)) {
    return undefined;
  }

  const source = (target as Record<string, unknown>)[methodName];
  if (typeof source !== "function") {
    return undefined;
  }

  const callable = source as (...args: unknown[]) => unknown;
  return (...args: unknown[]) => Reflect.apply(callable, target, args);
}

function isTanstackUtilsLike(value: unknown): value is object {
  return (
    isObjectLike(value) &&
    ("key" in value ||
      ("queryKey" in value && "queryOptions" in value) ||
      isProcedureWithCall(value))
  );
}

function applyPipeTransform<TValue>(source$: RxObservable<TValue>): RxObservable<TValue>;
function applyPipeTransform<TValue>(
  source$: RxObservable<TValue>,
  pipeTransform: ObservablePipeTransform<TValue>,
): RxObservable<TValue>;
function applyPipeTransform<TValue>(
  source$: RxObservable<TValue>,
  pipeTransform?: ObservablePipeTransform<TValue>,
): RxObservable<TValue> {
  if (!pipeTransform) {
    return source$;
  }

  const rxjsPipe: ObservablePipeInvoker<TValue> = (...operators) =>
    operators.reduce((current$, operator) => current$.pipe(operator), source$);

  return pipeTransform(rxjsPipe);
}

function toObservable<TValue>(source: unknown): RxObservable<TValue> {
  if (isRxObservable(source)) {
    return source as RxObservable<TValue>;
  }

  if (isAsyncIterable(source)) {
    return reconstructObservableFromEventIterator(source) as RxObservable<TValue>;
  }

  return new RxjsObservable<TValue>((subscriber) => {
    subscriber.next(source as TValue);
    subscriber.complete();
  });
}

async function collectObservableValues<TValue>(
  context: QueryFunctionContext,
  source$: RxObservable<TValue>,
  onChunk?: (chunk: TValue, allChunks: readonly TValue[]) => void,
): Promise<TValue[]> {
  return await new Promise<TValue[]>((resolve, reject) => {
    const values: TValue[] = [];

    const rejectWith = (reason: unknown) => {
      reject(reason instanceof Error ? reason : new Error("Unknown stream error"));
    };

    const onAbort = () => {
      subscription.unsubscribe();
      rejectWith(context.signal.reason);
    };

    context.client.setQueryData(context.queryKey, []);

    const subscription = source$.subscribe({
      next(value) {
        values.push(value);
        onChunk?.(value, values);
        context.client.setQueryData(context.queryKey, [...values]);
      },
      error(error) {
        context.signal.removeEventListener("abort", onAbort);
        subscription.unsubscribe();
        rejectWith(error);
      },
      complete() {
        context.signal.removeEventListener("abort", onAbort);
        subscription.unsubscribe();
        resolve(values);
      },
    });

    if (context.signal.aborted) {
      onAbort();
      return;
    }

    context.signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function consumeObservableLatestValue<TValue>(
  context: QueryFunctionContext,
  source$: RxObservable<TValue>,
  onChunk?: (chunk: TValue) => void,
): Promise<TValue> {
  return await new Promise<TValue>((resolve, reject) => {
    let hasValue = false;
    let latestValue!: TValue;

    const rejectWith = (reason: unknown) => {
      reject(reason instanceof Error ? reason : new Error("Unknown stream error"));
    };

    const onAbort = () => {
      subscription.unsubscribe();
      rejectWith(context.signal.reason);
    };

    const subscription = source$.subscribe({
      next(value) {
        hasValue = true;
        latestValue = value;
        onChunk?.(value);
        context.client.setQueryData(context.queryKey, value);
      },
      error(error) {
        context.signal.removeEventListener("abort", onAbort);
        subscription.unsubscribe();
        rejectWith(error);
      },
      complete() {
        context.signal.removeEventListener("abort", onAbort);
        subscription.unsubscribe();

        if (!hasValue) {
          reject(new Error("Observable stream completed without emitting any value"));
          return;
        }

        resolve(latestValue);
      },
    });

    if (context.signal.aborted) {
      onAbort();
      return;
    }

    context.signal.addEventListener("abort", onAbort, { once: true });
  });
}

function normalizeQueryKey(baseKey: QueryKey, providedQueryKey?: QueryKey): QueryKey {
  return providedQueryKey ?? baseKey;
}

function resolveProcedureKey(
  procedure: object,
  preferredMethodName: "experimental_liveKey" | "experimental_streamedKey",
  mode: ObservableQueryMode,
  input: unknown,
  providedQueryKey?: QueryKey,
): QueryKey {
  if (providedQueryKey) {
    return providedQueryKey;
  }

  const preferredMethod = getBoundMethod(procedure, preferredMethodName);
  if (preferredMethod) {
    return (input === undefined ? preferredMethod() : preferredMethod({ input })) as QueryKey;
  }

  const keyMethod = getBoundMethod(procedure, "key");
  if (keyMethod) {
    const operationType = mode === "observable" ? "live" : "streamed";
    return (input === undefined
      ? keyMethod({ type: operationType })
      : keyMethod({ type: operationType, input })) as QueryKey;
  }

  const queryKeyMethod = getBoundMethod(procedure, "queryKey");
  if (queryKeyMethod) {
    return (input === undefined ? queryKeyMethod() : queryKeyMethod({ input })) as QueryKey;
  }

  return input === undefined ? [mode] : [mode, input];
}

async function callProcedure(
  procedure: RuntimeProcedureWithCall,
  input: unknown,
  signal: AbortSignal,
  context: unknown,
): Promise<unknown> {
  const callOptions = context === undefined
    ? { signal }
    : { signal, context };

  return await procedure.call(input, callOptions);
}

function enhanceObservableQueryUtils<TOrpc extends object>(orpc: TOrpc): ObservableRouterQueryUtils<TOrpc> {
  const cache = new WeakMap<object, object>();
  const injectedMethodCache = new WeakMap<object, Map<PropertyKey, unknown>>();

  const getInjectedMethod = (
    target: object,
    prop: PropertyKey,
    factory: () => unknown,
  ): unknown => {
    const byTarget = injectedMethodCache.get(target) ?? new Map<PropertyKey, unknown>();
    injectedMethodCache.set(target, byTarget);

    if (byTarget.has(prop)) {
      return byTarget.get(prop);
    }

    const next = factory();
    byTarget.set(prop, next);
    return next;
  };

  const wrap = <TNode>(node: TNode): TNode => {
    if (!isObjectLike(node)) {
      return node;
    }

    const existing = cache.get(node);
    if (existing) {
      return existing as TNode;
    }

    const proxy = new Proxy(node, {
      get(target, prop, receiver) {
        if (prop === "experimental_observablekey" && isProcedureWithCall(target)) {
          return getInjectedMethod(target, prop, () => {
            return (options?: { input?: unknown; queryKey?: QueryKey }): QueryKey => {
              return resolveProcedureKey(
                target,
                "experimental_liveKey",
                "observable",
                options?.input,
                options?.queryKey,
              );
            };
          });
        }

        if (prop === "experimental_streamedObservableKey" && isProcedureWithCall(target)) {
          return getInjectedMethod(target, prop, () => {
            return (options?: { input?: unknown; queryKey?: QueryKey }): QueryKey => {
              return resolveProcedureKey(
                target,
                "experimental_streamedKey",
                "streamed-observable",
                options?.input,
                options?.queryKey,
              );
            };
          });
        }

        if (prop === "experimental_observableOptions" && isProcedureWithCall(target)) {
          return getInjectedMethod(target, prop, () => {
            return <TError = Error>(
              options: ObservableOptionsConfig<unknown, unknown, TError, unknown>,
            ): ObservableQueryOptionsResult<unknown, TError> => {
              const { input, queryKey, queryFnOptions, context, ...rest } = options;
              const key = normalizeQueryKey(
                resolveProcedureKey(target, "experimental_liveKey", "observable", input, queryKey),
                queryKey,
              );

              return {
                ...rest,
                queryKey: key,
                queryFn: async (queryContext) => {
                  const result = await callProcedure(target, input, queryContext.signal, context);
                  const source$ = toObservable<unknown>(result);
                  const transformed$ = queryFnOptions?.pipe
                    ? applyPipeTransform(source$, queryFnOptions.pipe)
                    : source$;

                  return await consumeObservableLatestValue(queryContext, transformed$);
                },
              };
            };
          });
        }

        if (prop === "experimental_streamedObservableOptions" && isProcedureWithCall(target)) {
          return getInjectedMethod(target, prop, () => {
            return <TError = Error>(
              options: StreamedObservableOptionsConfig<unknown, unknown, TError, unknown>,
            ): StreamedObservableQueryOptionsResult<unknown, TError> => {
              const { input, queryKey, queryFnOptions, context, ...rest } = options;
              const key = normalizeQueryKey(
                resolveProcedureKey(target, "experimental_streamedKey", "streamed-observable", input, queryKey),
                queryKey,
              );

              return {
                ...rest,
                queryKey: key,
                queryFn: async (queryContext: QueryFunctionContext) => {
                  const result = await callProcedure(target, input, queryContext.signal, context);
                  const source$ = toObservable<unknown>(result);
                  const transformed$ = queryFnOptions?.pipe
                    ? applyPipeTransform(source$, queryFnOptions.pipe)
                    : source$;

                  return await collectObservableValues(queryContext, transformed$, queryFnOptions?.onChunk);
                },
              };
            };
          });
        }

        const value = Reflect.get(target, prop, receiver);
        return isObjectLike(value) ? wrap(value) : value;
      },
    });

    cache.set(node, proxy);
    return proxy as TNode;
  };

  return wrap(orpc) as ObservableRouterQueryUtils<TOrpc>;
}

export function createObservableQueryUtils<TClient extends NestedClient<ClientContext>>(
  client: TClient,
  options?: CreateRouterUtilsOptions<TClient>,
): ObservableRouterQueryUtils<RouterUtils<TClient>>;
export function createObservableQueryUtils<TOrpc extends object>(
  orpc: TOrpc,
): ObservableRouterQueryUtils<TOrpc>;
export function createObservableQueryUtils(
  orpcOrClient: object,
  options?: CreateRouterUtilsOptions<NestedClient<ClientContext>>,
): ObservableRouterQueryUtils<object> {
  const baseUtils = options !== undefined || !isTanstackUtilsLike(orpcOrClient)
    ? createTanstackQueryUtils(orpcOrClient as NestedClient<ClientContext>, options)
    : orpcOrClient;

  return enhanceObservableQueryUtils(baseUtils);
}
