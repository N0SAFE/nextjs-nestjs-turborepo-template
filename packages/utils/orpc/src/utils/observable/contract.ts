import { eventIterator } from "@orpc/contract";
import type { Schema } from "@orpc/contract";
import type {
  Observable as RxObservable,
  Observer as RxObserver,
  Subscription as RxSubscription,
} from "rxjs";

export const OBSERVABLE_DETAILS_SYMBOL = Symbol("ORPC_OBSERVABLE_DETAILS");

export type Observable<TValue> = RxObservable<TValue>;
export type ObservableObserver<TValue> = RxObserver<TValue>;
export type ObservableSubscription = RxSubscription;

export type ObservableSchemaDetails<TIn, TOut> = {
  in: Schema<TIn, TOut>;
  out?: Schema<unknown, unknown>;
};

function isObservableLike(value: unknown): value is Observable<unknown> {
  return typeof value === "object" && value !== null && "subscribe" in value && typeof (value as { subscribe?: unknown }).subscribe === "function";
}

function isAsyncIteratorObject(value: unknown): value is AsyncIteratorObject<unknown, unknown, void> {
  return typeof value === "object" && value !== null && Symbol.asyncIterator in value;
}

function toAsyncIteratorFromObservable<TValue>(source$: Observable<TValue>): AsyncIterable<TValue> {
  const queue: TValue[] = [];
  let completed = false;
  let pendingError: unknown = null;
  let wake: (() => void) | null = null;

  const subscription = source$.subscribe({
    next(value: TValue) {
      queue.push(value);
      if (wake) {
        wake();
        wake = null;
      }
    },
    error(error: unknown) {
      pendingError = error;
      if (wake) {
        wake();
        wake = null;
      }
    },
    complete() {
      completed = true;
      if (wake) {
        wake();
        wake = null;
      }
    },
  });

  const iterator: AsyncIterator<TValue> & AsyncIterable<TValue> = {
    async next() {
      while (queue.length === 0 && !completed && pendingError === null) {
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }

      if (pendingError !== null) {
        subscription.unsubscribe();
        throw pendingError instanceof Error ? pendingError : new Error("Observable stream error");
      }

      const value = queue.shift();
      if (value === undefined) {
        subscription.unsubscribe();
        return { value: undefined, done: true };
      }

      return { value, done: false };
    },
    return() {
      subscription.unsubscribe();
      return Promise.resolve({ value: undefined, done: true } as const);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };

  return iterator;
}

/**
 * Contract helper alias for EventIterator transport with observable-first typing.
 *
 * Use this when you want observable naming at contract level:
 * - input(observable(chunkSchema))
 * - output(observable(chunkSchema))
 *
 * Under the hood this uses EventIterator schema transport,
 * so existing ORPC streamed/live options continue to work.
 */
export function observable<TYieldIn, TYieldOut>(
  yields: Schema<TYieldIn, TYieldOut>,
  returns?: Schema<unknown, unknown>,
): Schema<Observable<TYieldIn>, Observable<TYieldOut>> {
  const baseSchema = eventIterator(yields, returns);

  const details: ObservableSchemaDetails<TYieldIn, TYieldOut> = {
    in: yields,
    ...(returns ? { out: returns as unknown as Schema<unknown, unknown> } : {}),
  };

  const standard = ((baseSchema as unknown as { "~standard": Record<PropertyKey, unknown> })["~standard"]) as {
    validate: (value: unknown) => unknown;
    [key: PropertyKey]: unknown;
  };

  const baseValidate = standard.validate;
  standard[OBSERVABLE_DETAILS_SYMBOL] = details;
  standard.validate = (value: unknown) => {
    if (isObservableLike(value)) {
      return baseValidate(toAsyncIteratorFromObservable(value));
    }

    if (isAsyncIteratorObject(value)) {
      return baseValidate(value);
    }

    return {
      issues: [{ message: "Expect observable", path: [] }],
    };
  };

  return baseSchema as unknown as Schema<Observable<TYieldIn>, Observable<TYieldOut>>;
}

export function getObservableSchemaDetails(schema: unknown): ObservableSchemaDetails<unknown, unknown> | undefined {
  if (typeof schema !== "object" || schema === null || !("~standard" in schema)) {
    return undefined;
  }

  const standard = (schema as { "~standard"?: Record<PropertyKey, unknown> })["~standard"];
  if (!standard || typeof standard !== "object") {
    return undefined;
  }

  const details = standard[OBSERVABLE_DETAILS_SYMBOL];
  if (!details || typeof details !== "object") {
    return undefined;
  }

  return details as ObservableSchemaDetails<unknown, unknown>;
}
