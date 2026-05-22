import { Observable, type Subscriber, type Subscription } from "rxjs";

export type EventIteratorProtocolVersion = "event-iterator/1";

export type EventIteratorFrameKind = "next" | "error" | "complete";

export type EventIteratorFrame<TPayload = unknown> = {
  protocol: EventIteratorProtocolVersion;
  kind: EventIteratorFrameKind;
  emittedAt: string;
  payload?: TPayload;
  error?: {
    message: string;
  };
}

export type DirectObserver<TValue> = {
  next(value: TValue): void;
  error(error: unknown): void;
  complete(): void;
}

export type DirectSubscription = Subscription;

export type DirectObservable<TValue> = Observable<TValue>;

export type EventSerializer<TInput, TOutput> = (value: TInput) => TOutput;
export type EventDeserializer<TInput, TOutput> = (value: TInput) => TOutput;

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown observable error");
}

export function createDirectObservable<TValue>(
  producer: (observer: DirectObserver<TValue>) => (() => void) | undefined,
): DirectObservable<TValue> {
  return new Observable<TValue>((subscriber: Subscriber<TValue>) => {
    const safeObserver: DirectObserver<TValue> = {
      next(value) {
        if (!subscriber.closed) {
          subscriber.next(value);
        }
      },
      error(error) {
        if (!subscriber.closed) {
          subscriber.error(normalizeError(error));
        }
      },
      complete() {
        if (!subscriber.closed) {
          subscriber.complete();
        }
      },
    };

    const cleanup = producer(safeObserver) ?? (() => undefined);

    return () => {
      cleanup();
    };
  });
}

export function createEventIteratorFrame<TPayload>(
  kind: EventIteratorFrameKind,
  payload?: TPayload,
): EventIteratorFrame<TPayload> {
  return {
    protocol: "event-iterator/1",
    kind,
    emittedAt: new Date().toISOString(),
    ...(payload === undefined ? {} : { payload }),
  };
}

export function isEventIteratorFrame(value: unknown): value is EventIteratorFrame {
  return (
    typeof value === "object" &&
    value !== null &&
    "protocol" in value &&
    (value as { protocol?: unknown }).protocol === "event-iterator/1" &&
    "kind" in value
  );
}

export function serializeEventIteratorFrame<TPayload>(frame: EventIteratorFrame<TPayload>): string {
  return JSON.stringify(frame);
}

export function deserializeEventIteratorFrame<TPayload = unknown>(
  raw: string,
): EventIteratorFrame<TPayload> {
  const parsed = JSON.parse(raw) as unknown;
  if (!isEventIteratorFrame(parsed)) {
    throw new Error("Invalid EventIterator frame payload");
  }

  return parsed as EventIteratorFrame<TPayload>;
}

export function deconstructObservableToEventIterator<TValue, TSerialized = TValue>(
  source$: DirectObservable<TValue>,
  serialize: EventSerializer<TValue, TSerialized> = ((value: TValue) =>
    value as unknown as TSerialized),
): AsyncIterable<EventIteratorFrame<TSerialized>> {
  const queue: EventIteratorFrame<TSerialized>[] = [];
  let done = false;
  let thrownError: unknown = null;
  let wake: (() => void) | null = null;

  const subscription = source$.subscribe({
    next(value) {
      queue.push(createEventIteratorFrame("next", serialize(value)));
      if (wake) {
        wake();
        wake = null;
      }
    },
    error(error: unknown) {
      thrownError = error;
      if (wake) {
        wake();
        wake = null;
      }
    },
    complete() {
      queue.push(createEventIteratorFrame("complete"));
      done = true;
      if (wake) {
        wake();
        wake = null;
      }
    },
  });

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (queue.length === 0 && !done && thrownError === null) {
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
          }

          if (thrownError !== null) {
            subscription.unsubscribe();
            throw normalizeError(thrownError);
          }

          const value = queue.shift();
          if (!value) {
            subscription.unsubscribe();
            return { value: undefined, done: true };
          }

          if (value.kind === "complete") {
            subscription.unsubscribe();
            return { value, done: true };
          }

          return { value, done: false };
        },
        return() {
          subscription.unsubscribe();
          return Promise.resolve({ value: undefined, done: true } as const);
        },
        throw(error: unknown) {
          subscription.unsubscribe();
          return Promise.reject(normalizeError(error));
        },
      };
    },
  };
}

export function reconstructObservableFromEventIterator<TSerialized, TValue = TSerialized>(
  source: AsyncIterable<EventIteratorFrame<TSerialized> | string | TValue>,
  deserialize: EventDeserializer<TSerialized, TValue> = ((value: TSerialized) =>
    value as unknown as TValue),
): DirectObservable<TValue> {
  return createDirectObservable<TValue>((observer) => {
    let iterator: AsyncIterator<EventIteratorFrame<TSerialized> | string | TValue> | null = null;

    void (async () => {
      try {
        iterator = source[Symbol.asyncIterator]();

        for (;;) {
          const nextItem = await iterator.next();

          if (nextItem.done) {
            observer.complete();
            return;
          }

          const item = nextItem.value;
          const frame =
            typeof item === "string"
              ? deserializeEventIteratorFrame<TSerialized>(item)
              : isEventIteratorFrame(item)
                ? (item)
                : createEventIteratorFrame("next", item as unknown as TSerialized);

          if (frame.kind === "next") {
            observer.next(deserialize(frame.payload as TSerialized));
            continue;
          }

          if (frame.kind === "error") {
            observer.error(new Error(frame.error?.message ?? "Event iterator stream error"));
            return;
          }

          observer.complete();
          return;
        }
      } catch (error) {
        observer.error(normalizeError(error));
      }
    })();

    return () => {
      void iterator?.return?.();
    };
  });
}
