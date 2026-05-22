import { Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventBufferService } from './event-buffer.service';
import { EventRegistry } from './event-registry.service';
import type {
  EventContracts,
  EventContract,
  EventInput,
  EventOutput,
} from '../contracts/event-contract.builder';

export type AnyEventEmission<T extends EventContract> = {
  input: EventInput<T>;
  output: EventOutput<T>;
}

export type PersistedEventLog = {
  namespace: string;
  eventName: string;
  eventKey: string;
  sequence: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  emittedAt: Date;
}

export type EventLogPersistenceAdapter = {
  insertMany(logs: PersistedEventLog[]): Promise<void>;
  findRecentByEventKey(input: {
    namespace: string;
    eventName: string;
    eventKey: string;
    limit: number;
  }): Promise<PersistedEventLog[]>;
  findRecentByEventName(input: {
    namespace: string;
    eventName: string;
    limit: number;
  }): Promise<PersistedEventLog[]>;
}

type ReplayOptions = {
  replayLimit?: number;
  includePersisted?: boolean;
  /**
   * If set, only buffered events with sequence > afterSequence are replayed.
   * Used for cursor-based reconnect: subscribers pass back the last sequence they observed.
   */
  afterSequence?: number;
}

type QueryByInputOptions<TInput> = ReplayOptions & {
  fuzzy?: string;
  predicate?: (input: TInput) => boolean;
}

/**
 * Base Event Service
 * 
 * Generic base class for feature-specific event services.
 * Provides type-safe event subscription and durable emission buffering with automatic validation.
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
export abstract class BaseEventService<
  TContracts extends EventContracts = EventContracts,
  TNamespace extends string = string,
> implements OnModuleInit, OnModuleDestroy {
  protected readonly logger: Logger;
  protected readonly eventPrefix: TNamespace;
  private readonly registry: EventRegistry;
  private readonly buffer: EventBufferService;

  protected readonly durableReplayLimit = 2_000;
  protected readonly pendingFlushBatchSize = 200;
  protected readonly flushIntervalMs = 3 * 60 * 1000;

  constructor(
    eventPrefix: TNamespace,
    protected readonly contracts: TContracts,
    options?: {
      persistenceAdapter?: EventLogPersistenceAdapter;
      eventRegistry?: EventRegistry;
      durableReplayLimit?: number;
      pendingFlushBatchSize?: number;
      flushIntervalMs?: number;
    },
  ) {
    this.eventPrefix = eventPrefix;
    this.logger = new Logger(`${eventPrefix}EventService`);
    this.registry = options?.eventRegistry ?? new EventRegistry();
    this.buffer = new EventBufferService({
      namespace: eventPrefix,
      logger: this.logger,
      persistenceAdapter: options?.persistenceAdapter,
      durableReplayLimit: options?.durableReplayLimit ?? this.durableReplayLimit,
      pendingFlushBatchSize: options?.pendingFlushBatchSize ?? this.pendingFlushBatchSize,
      flushIntervalMs: options?.flushIntervalMs ?? this.flushIntervalMs,
    });
  }

  get namespace(): TNamespace {
    return this.eventPrefix;
  }

  onModuleInit(): void {
    this.buffer.startTicker();
  }

  async onModuleDestroy(): Promise<void> {
    await this.buffer.stopTickerAndFlush();
    this.clearAll();
  }

  subscribe$<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>,
    options?: ReplayOptions,
  ): Observable<EventOutput<TContracts[K]>> {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }

    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);

    const stream = this.registry.retainScoped<EventOutput<TContracts[K]>>(fullEventName);

    const replayLimit = options?.replayLimit ?? this.durableReplayLimit;
    const includePersisted = options?.includePersisted ?? true;
    const afterSequence = options?.afterSequence;

    return new Observable<EventOutput<TContracts[K]>>((subscriber) => {
      const liveBuffer: EventOutput<TContracts[K]>[] = [];
      let replayCompleted = false;

      const internalSubscription = stream.asObservable().subscribe({
        next: (value) => {
          if (!replayCompleted) {
            liveBuffer.push(value);
            return;
          }

          subscriber.next(value);
        },
        error: (error) => {subscriber.error(error)},
        complete: () => {subscriber.complete()},
      });

      void this
        .buildReplayOutputsByKey(eventName, fullEventName, {
          replayLimit,
          includePersisted,
          afterSequence,
        })
        .then((items) => {
          for (const item of items) {
            subscriber.next(item);
          }

          replayCompleted = true;
          for (const item of liveBuffer) {
            subscriber.next(item);
          }
          liveBuffer.length = 0;
        })
        .catch((error: unknown) => {
          subscriber.error(error);
        });

      return () => {
        internalSubscription.unsubscribe();
        this.registry.releaseScoped(fullEventName);
      };
    });
  }

  subscribeAny$<K extends keyof TContracts>(
    eventName: K,
  ): Observable<AnyEventEmission<TContracts[K]>> {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }

    const eventKey = String(eventName);
    const stream = this.registry.retainAny<AnyEventEmission<TContracts[K]>>(eventKey);

    return new Observable<AnyEventEmission<TContracts[K]>>((subscriber) => {
      const internalSubscription = stream.subscribe(subscriber);
      return () => {
        internalSubscription.unsubscribe();
        this.registry.releaseAny(eventKey);
      };
    });
  }

  queryByInput$<K extends keyof TContracts>(
    eventName: K,
    options?: QueryByInputOptions<EventInput<TContracts[K]>>,
  ): Observable<AnyEventEmission<TContracts[K]>> {
    const contract = this.contracts[eventName];
    if (!contract) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }

    const replayLimit = options?.replayLimit ?? this.durableReplayLimit;
    const includePersisted = options?.includePersisted ?? true;

    return new Observable<AnyEventEmission<TContracts[K]>>((subscriber) => {
      const liveBuffer: AnyEventEmission<TContracts[K]>[] = [];
      let replayCompleted = false;

      const subscription = this.subscribeAny$(eventName).subscribe((event) => {
        if (!replayCompleted) {
          liveBuffer.push(event);
          return;
        }

        if (!this.matchesInput(event.input as EventInput<TContracts[K]>, options)) {
          return;
        }
        subscriber.next(event);
      });

      void this
        .buildReplayEmissionsByEventName(eventName, {
          replayLimit,
          includePersisted,
        })
        .then((items) => {
          for (const item of items) {
            if (!this.matchesInput(item.input as EventInput<TContracts[K]>, options)) {
              continue;
            }
            subscriber.next(item);
          }

          replayCompleted = true;
          for (const event of liveBuffer) {
            if (!this.matchesInput(event.input as EventInput<TContracts[K]>, options)) {
              continue;
            }
            subscriber.next(event);
          }
          liveBuffer.length = 0;
        })
        .catch((error: unknown) => {
          subscriber.error(error);
        });

      return () => {
        subscription.unsubscribe();
      };
    });
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
    this.buffer.append({
      eventName: String(eventName),
      eventKey: fullEventName,
      eventInput: validatedInput as Record<string, unknown>,
      eventOutput: validatedOutput as Record<string, unknown>,
    });

    this.registry.emitScoped(fullEventName, validatedOutput);
    this.registry.emitAny(String(eventName), {
      input: validatedInput,
      output: validatedOutput,
    } satisfies AnyEventEmission<TContracts[K]>);
  }

  /**
   * Start a processing operation and expose an emit bridge tied to the event input.
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

    const emit = (output: EventOutput<TContracts[K]>): void => {
      this.emit(eventName, validatedInput, output);
    };

    await Promise.resolve(handler({ input: validatedInput, emit }));
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

    return this.registry.scopedSubscriberCount(fullEventName) > 0;
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

    return this.registry.scopedSubscriberCount(fullEventName);
  }

  /**
   * Check if an event is currently processing
   * 
   * @param eventName - Name of the event to check
   * @param input - Input parameters for the event
   */
  isProcessing<K extends keyof TContracts>(
    eventName: K,
    // input: EventInput<TContracts[K]>
  ): boolean {
    if (!this.contracts[eventName]) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    this.logger.warn(`isProcessing() is not implemented for '${String(eventName)}'.`);
    return false;
  }

  /**
   * Get queue length for an event
   * 
   * @param eventName - Name of the event to check
   * @param input - Input parameters for the event
   */
  getQueueLength<K extends keyof TContracts>(
    eventName: K,
    // input: EventInput<TContracts[K]>
  ): number {
    if (!this.contracts[eventName]) {
      throw new Error(`Contract not found for event: ${String(eventName)}`);
    }
    this.logger.warn(`getQueueLength() is not implemented for '${String(eventName)}'.`);
    return 0;
  }

  /**
   * Build full event name from prefix, event name, and input
   * Override this method to customize event naming strategy
   * 
   * @param eventName - Base event name
   * @param input - Validated input data
   */
  protected abstract buildEventKey(
    eventName: string,
    input: Record<string, unknown>
  ): string;

  protected buildFullEventName(
    eventName: string,
    input: Record<string, unknown>
  ): string {
    return `${this.eventPrefix}:${eventName}:${this.buildEventKey(eventName, input)}`;
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

    this.registry.clearScoped(fullEventName);
  }

  /**
   * Get all active event names
   */
  getActiveEvents(): string[] {
    return this.registry.activeScopedKeys();
  }

  /**
   * Clear all events and subscriptions
   */
  clearAll(): void {
    this.registry.clearAll();
    this.buffer.clear();

    this.logger.log('All events cleared');
  }

  protected buildInputReplayFuzzy<TInput extends Record<string, unknown>>(input: TInput): string {
    return JSON.stringify(input).toLowerCase();
  }

  /**
   * Returns the highest sequence number buffered for the given event key.
   * Callers use this as the cursor value to pass back on reconnect via `afterSequence`.
   */
  getLastSequence<K extends keyof TContracts>(
    eventName: K,
    input: EventInput<TContracts[K]>,
  ): number {
    const contract = this.contracts[eventName];
    if (!contract) {
      return 0;
    }
    const validatedInput = contract.input.parse(input) as EventInput<TContracts[K]>;
    const fullEventName = this.buildFullEventName(String(eventName), validatedInput as Record<string, unknown>);
    return this.buffer.getLastSequence(fullEventName);
  }

  private matchesInput<TInput extends Record<string, unknown>>(
    input: TInput,
    options?: QueryByInputOptions<TInput>,
  ): boolean {
    if (options?.predicate && !options.predicate(input)) {
      return false;
    }

    if (options?.fuzzy) {
      const haystack = this.buildInputReplayFuzzy(input);
      return haystack.includes(options.fuzzy.trim().toLowerCase());
    }

    return true;
  }

  private async buildReplayOutputsByKey<K extends keyof TContracts>(
    eventName: K,
    fullEventName: string,
    options: {
      replayLimit: number;
      includePersisted: boolean;
      afterSequence?: number;
    },
  ): Promise<EventOutput<TContracts[K]>[]> {
    const contract = this.contracts[eventName];
    if (!contract) {
      return [];
    }
    try {
      const rows = await this.buffer.replayByEventKey({
        eventName: String(eventName),
        eventKey: fullEventName,
        replayLimit: options.replayLimit,
        includePersisted: options.includePersisted,
        afterSequence: options.afterSequence,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return rows.map((row) => contract.output.parse(row.output) as EventOutput<TContracts[K]>);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Skipping persisted replay for '${String(eventName)}': ${message}`);
      return [];
    }
  }

  private async buildReplayEmissionsByEventName<K extends keyof TContracts>(
    eventName: K,
    options: {
      replayLimit: number;
      includePersisted: boolean;
    },
  ): Promise<AnyEventEmission<TContracts[K]>[]> {
    const contract = this.contracts[eventName];
    if (!contract) {
      return [];
    }

    try {
      const rows = await this.buffer.replayByEventName({
        eventName: String(eventName),
        replayLimit: options.replayLimit,
        includePersisted: options.includePersisted,
      });

      return rows.map((row) => ({
        input: contract.input.parse(row.input) as EventInput<TContracts[K]>,
        output: contract.output.parse(row.output) as EventOutput<TContracts[K]>,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Skipping persisted query replay for '${String(eventName)}': ${message}`);
      return [];
    }
  }
}
