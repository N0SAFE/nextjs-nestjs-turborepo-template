import type { z } from 'zod/v4';

/**
 * Processing strategies for handling concurrent operations on the same event
 */
export enum ProcessingStrategy {
  /**
   * Allow multiple parallel operations on the same event ID
   * Each subscriber gets their own stream
   */
  PARALLEL = 'parallel',

  /**
   * Queue operations - wait for previous to complete before starting next
   * All subscribers see the same stream
   */
  QUEUE = 'queue',

  /**
   * Abort previous operation when new one starts
   * Only the latest operation runs
   */
  ABORT = 'abort',

  /**
   * Ignore new requests while one is already processing
   * First operation wins
   */
  IGNORE = 'ignore',
}

/**
 * Abort callback context provided when strategy is ABORT
 */
export interface AbortContext {
  signal: AbortSignal;
  abortController: AbortController;
}

/**
 * Event contract options
 */
export interface EventContractOptions<TInput = unknown> {
  /**
   * Processing strategy for handling concurrent operations
   * @default ProcessingStrategy.PARALLEL
   */
  strategy?: ProcessingStrategy;

  /**
   * Callback to handle abort controller when strategy is ABORT
   * Called when a new request comes in and previous needs to be aborted
   */
  onAbort?: (input: TInput, context: AbortContext) => void;

  /**
   * Callback when operation is queued (strategy: QUEUE)
   */
  onQueue?: (input: TInput, position: number) => void;

  /**
   * Callback when operation is ignored (strategy: IGNORE)
   */
  onIgnore?: (input: TInput) => void;
}

/**
 * Event contract definition
 * Each event has an input schema (for event parameters) and output schema (for yielded data)
 */
export interface EventContract<TInput = unknown, TOutput = unknown> {
  input: z.ZodType<TInput>;
  output: z.ZodType<TOutput>;
  options?: EventContractOptions<TInput>;
}

/**
 * Event contracts definition map
 * Maps event names to their contracts
 */
export type EventContracts = Record<string, EventContract<any, any>>;

/**
 * Extract input type from event contract
 */
export type EventInput<T extends EventContract> = z.infer<T['input']>;

/**
 * Extract output type from event contract
 */
export type EventOutput<T extends EventContract> = z.infer<T['output']>;

/**
 * Event contract builder
 * Provides fluent API for building type-safe event contracts
 */
class EventContractBuilder<TInput = never, TOutput = never> {
  private _input?: z.ZodType<TInput>;
  private _output?: z.ZodType<TOutput>;
  private _options?: EventContractOptions<TInput>;

  /**
   * Set input schema
   */
  input<T>(schema: z.ZodType<T>): EventContractBuilder<T, TOutput> {
    const builder = this as unknown as EventContractBuilder<T, TOutput>;
    builder._input = schema;
    return builder;
  }

  /**
   * Set output schema
   */
  output<T>(schema: z.ZodType<T>): EventContractBuilder<TInput, T> {
    const builder = this as unknown as EventContractBuilder<TInput, T>;
    builder._output = schema;
    return builder;
  }

  /**
   * Set processing strategy with options
   */
  strategy(
    strategyType: ProcessingStrategy.PARALLEL
  ): EventContractBuilder<TInput, TOutput>;
  strategy(
    strategyType: ProcessingStrategy.QUEUE,
    options: { onQueue?: (input: TInput, position: number) => void }
  ): EventContractBuilder<TInput, TOutput>;
  strategy(
    strategyType: ProcessingStrategy.ABORT,
    options: { onAbort?: (input: TInput, context: AbortContext) => void }
  ): EventContractBuilder<TInput, TOutput>;
  strategy(
    strategyType: ProcessingStrategy.IGNORE,
    options: { onIgnore?: (input: TInput) => void }
  ): EventContractBuilder<TInput, TOutput>;
  strategy(
    strategyType: ProcessingStrategy,
    options?: Partial<EventContractOptions<TInput>>
  ): this {
    this._options = {
      ...this._options,
      strategy: strategyType,
      ...options,
    };
    return this;
  }

  /**
   * Build the final contract
   */
  build(): EventContract<TInput, TOutput> {
    if (!this._input) {
      throw new Error('Input schema is required. Call .input() before .build()');
    }
    if (!this._output) {
      throw new Error('Output schema is required. Call .output() before .build()');
    }

    return {
      input: this._input,
      output: this._output,
      options: this._options,
    };
  }
}

/**
 * Create a new event contract builder
 * 
 * @example
 * ```typescript
 * const contracts = {
 *   processing: contractBuilder()
 *     .input(z.object({ videoId: z.string() }))
 *     .output(z.object({ progress: z.number(), status: z.string() }))
 *     .strategy(ProcessingStrategy.ABORT, {
 *       onAbort: (input, { signal }) => {
 *         console.log(`Aborting processing for ${input.videoId}`);
 *       }
 *     })
 *     .build()
 * };
 * ```
 */
export function contractBuilder(): EventContractBuilder {
  return new EventContractBuilder();
}
