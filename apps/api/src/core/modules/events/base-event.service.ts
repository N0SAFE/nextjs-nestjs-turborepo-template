import { Logger } from '@nestjs/common';
import { ProcessingStrategy } from './event-contract.builder';
import type {
  EventContracts,
  EventContract,
  EventInput,
  EventOutput,
  AbortContext,
} from './event-contract.builder';

/**
 * Event subscription result
 * Returns an async iterator of the event output type
 */
export type EventSubscription<T extends EventContract> = AsyncIterableIterator<EventOutput<T>>;

/**
 * Async iterator controller for managing event streams
 */
class AsyncIteratorController<TPayload> {
  private queue: TPayload[] = [];
  private resolvers: ((value: IteratorResult<TPayload>) => void)[] = [];
  private ended = false;

  push(value: TPayload): void {
    if (this.ended) return;

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      if (resolve) {
        resolve({ value, done: false });
      }
    } else {
      this.queue.push(value);
    }
  }

  end(): void {
    this.ended = true;
    while (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      if (resolve) {
        resolve({ value: undefined, done: true });
      }
    }
  }

  async next(): Promise<IteratorResult<TPayload>> {
    if (this.queue.length > 0) {
      const value = this.queue.shift();
      if (value !== undefined) {
        return { value, done: false };
      }
    }

    if (this.ended) {
      return { value: undefined, done: true };
    }

    return new Promise((resolve) => {
      this.resolvers.push(resolve);
    });
  }

  [Symbol.asyncIterator](): AsyncIterator<TPayload> {
    return this;
  }
}

/**
 * Event subscription tracking
 */
interface EventSubscriptionData<T> {
  eventName: string;
  asyncIterators: Set<AsyncIteratorController<T>>;
}

/**
 * Processing state for queue/abort strategies
 */
interface ProcessingState {
  isProcessing: boolean;
  abortController?: AbortController;
  queue: {
    input: unknown;
    handler: () => Promise<void>;
  }[];
}

/**
 * Base Event Service
 * 
 * Generic base class for feature-specific event services.
 * Provides type-safe event subscription and emission with automatic validation.
 * Supports multiple processing strategies: PARALLEL, QUEUE, ABORT, IGNORE
 * 
 * @template TContracts - Map of event names to their contracts
 * 
 * @example
 * ```typescript
 * // Define contracts
 * const videoContracts = {
 *   processing: createContract({
 *     input: z.object({ videoId: z.string() }),
 *     output: z.object({ progress: z.number(), status: z.string() }),
 *     options: {
 *       strategy: ProcessingStrategy.ABORT,
 *       onAbort: (input, { signal }) => {
 *         console.log(`Aborting ${input.videoId}`);
 *       }
 *     }
 *   })
 * } satisfies EventContracts;
 * 
 * // Create event service
 * @Injectable()
 * class VideoEventService extends BaseEventService<typeof videoContracts> {
 *   constructor() {
 *     super('video', videoContracts);
 *   }
 * }
 * ```
 */
export abstract class BaseEventService<TContracts extends EventContracts = EventContracts> {
  protected readonly logger: Logger;
  protected readonly eventPrefix: string;
  private readonly events = new Map<string, EventSubscriptionData<unknown>>();
  private readonly processingStates = new Map<string, ProcessingState>();

  constructor(
    eventPrefix: string,
    protected readonly contracts: TContracts,
  ) {
    this.eventPrefix = eventPrefix;
    this.logger = new Logger(`${eventPrefix}EventService`);
  }

  /**
   * Subscribe to an event
   * 
   * @param eventName - Name of the event to subscribe to
   * @param input - Input parameters for the event (validated against contract)
   * @returns Async iterator yielding event data
   */
  subscribe<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>
  ): EventSubscription<TContracts[K]> {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }

    // Validate input
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;

    // Build full event name using fileId from input
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    // Get or create subscription data
    let subscription = this.events.get(fullEventName);
    if (!subscription) {
      subscription = {
        eventName: fullEventName,
        asyncIterators: new Set(),
      };
      this.events.set(fullEventName, subscription);
    }

    const controller = new AsyncIteratorController<EventOutput<TContracts[K]>>();
    subscription.asyncIterators.add(controller as AsyncIteratorController<unknown>);

    // Create cleanup function that can be called on iteration end
    const cleanup = (): void => {
      const sub = this.events.get(fullEventName);
      if (sub) {
        sub.asyncIterators.delete(controller as AsyncIteratorController<unknown>);
        if (sub.asyncIterators.size === 0) {
          this.events.delete(fullEventName);
        }
      }
    };

    const iterator = {
      async *[Symbol.asyncIterator]() {
        try {
          for await (const value of controller) {
            yield value;
          }
        } finally {
          cleanup();
        }
      }
    };

    return iterator[Symbol.asyncIterator]() as EventSubscription<TContracts[K]>;
  }

  /**
   * Emit an event
   * 
   * @param eventName - Name of the event to emit
   * @param input - Input parameters for the event (used to build event name)
   * @param output - Event data to emit (validated against contract)
   */
  emit<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>,
    output: EventOutput<TContracts[K]>
  ): void {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }

    // Validate input and output
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const validatedOutput = contract.output.parse(output) as EventOutput<TContracts[K]>;

    // Build full event name using fileId from input
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    const subscription = this.events.get(fullEventName);
    if (!subscription) {
      return;
    }

    // Push to all subscribed iterators
    const typedIterators = subscription.asyncIterators as unknown as Set<AsyncIteratorController<EventOutput<TContracts[K]>>>;
    for (const iterator of typedIterators) {
      iterator.push(validatedOutput);
    }
  }

  /**
   * Start a processing operation with strategy handling
   * This method handles queue, abort, and ignore strategies
   * 
   * @param eventName - Name of the event
   * @param input - Input parameters (uses fileId as key)
   * @param handler - Function that performs the processing and emits events
   * @returns Promise that resolves when processing is complete (or queued/ignored)
   */
  async startProcessing<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>,
    handler: (params: {
      abortSignal?: AbortSignal;
      input: EventInput<TContracts[K]>;
      emit: (output: EventOutput<TContracts[K]>) => void;
    }) => void | Promise<void>
  ): Promise<void> {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);
    
    const strategy = contract.options?.strategy ?? ProcessingStrategy.PARALLEL;
    
    // Create emit helper function
    const emit = (output: EventOutput<TContracts[K]>): void => {
      this.emit(eventName, validatedInput, output);
    };
    
    // Get or create processing state for this event
    let state = this.processingStates.get(fullEventName);
    if (!state) {
      state = {
        isProcessing: false,
        queue: [],
      };
      this.processingStates.set(fullEventName, state);
    }

    // PARALLEL: Run immediately without blocking
    if (strategy === ProcessingStrategy.PARALLEL) {
      void Promise.resolve(handler({ input: validatedInput, emit }));
      return;
    }

    // IGNORE: Skip if already processing
    if (strategy === ProcessingStrategy.IGNORE) {
      if (state.isProcessing) {
        contract.options?.onIgnore?.(validatedInput);
        return;
      }
    }

    // ABORT: Kill previous operation and start new one
    if (strategy === ProcessingStrategy.ABORT) {
      if (state.isProcessing && state.abortController) {
        const context: AbortContext = {
          signal: state.abortController.signal,
          abortController: state.abortController,
        };
        contract.options?.onAbort?.(validatedInput, context);
        state.abortController.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      state.abortController = abortController;
      state.isProcessing = true;

      try {
        await Promise.resolve(handler({
          abortSignal: abortController.signal,
          input: validatedInput,
          emit,
        }));
      } finally {
        state.isProcessing = false;
        state.abortController = undefined;
      }
      return;
    }

    // QUEUE: Add to queue and process sequentially
    if (strategy === ProcessingStrategy.QUEUE) {
      const wrappedHandler = async (): Promise<void> => {
        state.isProcessing = true;
        try {
          await Promise.resolve(handler({ input: validatedInput, emit }));
        } finally {
          state.isProcessing = false;
          // Process next in queue
          const next = state.queue.shift();
          if (next) {
            void next.handler();
          }
        }
      };

      if (state.isProcessing) {
        // Add to queue
        const position = state.queue.length + 1;
        contract.options?.onQueue?.(validatedInput, position);
        state.queue.push({
          input: validatedInput,
          handler: wrappedHandler,
        });
      } else {
        // Start immediately
        await wrappedHandler();
      }
      return;
    }
  }

  /**
   * Check if an event has active subscribers
   * 
   * @param eventName - Name of the event to check
   * @param input - Input parameters for the event
   */
  hasSubscribers<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>
  ): boolean {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    const subscription = this.events.get(fullEventName);
    return subscription ? subscription.asyncIterators.size > 0 : false;
  }

  /**
   * Get subscriber count for an event
   * 
   * @param eventName - Name of the event to check
   * @param input - Input parameters for the event
   */
  getSubscriberCount<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>
  ): number {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    const subscription = this.events.get(fullEventName);
    return subscription ? subscription.asyncIterators.size : 0;
  }

  /**
   * Check if an event is currently processing
   * 
   * @param eventName - Name of the event to check
   * @param input - Input parameters for the event
   */
  isProcessing<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>
  ): boolean {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    const state = this.processingStates.get(fullEventName);
    return state?.isProcessing ?? false;
  }

  /**
   * Get queue length for an event
   * 
   * @param eventName - Name of the event to check
   * @param input - Input parameters for the event
   */
  getQueueLength<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>
  ): number {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    const state = this.processingStates.get(fullEventName);
    return state?.queue.length ?? 0;
  }

  /**
   * Build full event name from prefix, event name, and input
   * Override this method to customize event naming strategy
   * 
   * @param eventName - Base event name
   * @param input - Validated input data
   */
  protected buildFullEventName(
    eventName: string,
    input: Record<string, unknown>
  ): string {
    // Default implementation: prefix:eventName:firstInputValue
    const firstValue = Object.values(input)[0];
    return `${this.eventPrefix}:${eventName}:${String(firstValue)}`;
  }

  /**
   * Remove all subscribers for an event (cleanup utility)
   * 
   * @param eventName - Name of the event to clear
   * @param input - Input parameters for the event
   */
  removeAllSubscribers<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>
  ): void {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    const subscription = this.events.get(fullEventName);
    if (subscription) {
      for (const iterator of subscription.asyncIterators) {
        (iterator as AsyncIteratorController<EventOutput<TContracts[K]>>).end();
      }
      this.events.delete(fullEventName);
    }
  }

  /**
   * Get all active event names
   */
  getActiveEvents(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Clear all events and subscriptions
   */
  clearAll(): void {
    // Clear all subscriptions
    for (const subscription of this.events.values()) {
      for (const iterator of subscription.asyncIterators) {
        iterator.end();
      }
    }
    this.events.clear();

    // Abort all active operations
    for (const state of this.processingStates.values()) {
      if (state.abortController) {
        state.abortController.abort();
      }
    }
    this.processingStates.clear();

    this.logger.log('All events cleared');
  }
}
