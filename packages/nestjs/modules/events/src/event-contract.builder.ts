import type { z } from 'zod/v4';

/**
 * Event contract definition
 * Each event has an input schema (for event parameters) and output schema (for yielded data)
 */
export type EventContract<TInput = unknown, TOutput = unknown> = {
  input: z.ZodType<TInput>;
  output: z.ZodType<TOutput>;
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
 *     .build()
 * };
 * ```
 */
export function contractBuilder(): EventContractBuilder {
  return new EventContractBuilder();
}
