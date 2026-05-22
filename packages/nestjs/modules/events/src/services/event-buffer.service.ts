import type { Logger } from '@nestjs/common';
import type { EventLogPersistenceAdapter, PersistedEventLog } from './base-event.service';

export type BufferedEventRecord = {
  eventName: string;
  eventKey: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  sequence: number;
  emittedAt: string;
}

export type EventBufferServiceOptions = {
  namespace: string;
  logger: Logger;
  persistenceAdapter?: EventLogPersistenceAdapter;
  durableReplayLimit: number;
  pendingFlushBatchSize: number;
  flushIntervalMs: number;
}

export class EventBufferService {
  private readonly durableEmissionsByKey = new Map<string, BufferedEventRecord[]>();
  private readonly durableEmissionsByEventName = new Map<string, BufferedEventRecord[]>();
  private readonly sequenceByEventKey = new Map<string, number>();
  private readonly pendingPersistence: PersistedEventLog[] = [];
  private isFlushing = false;
  private flushTicker?: ReturnType<typeof setInterval>;

  constructor(private readonly options: EventBufferServiceOptions) {}

  append(input: {
    eventName: string;
    eventKey: string;
    eventInput: Record<string, unknown>;
    eventOutput: Record<string, unknown>;
  }): BufferedEventRecord {
    const sequence = (this.sequenceByEventKey.get(input.eventKey) ?? 0) + 1;
    this.sequenceByEventKey.set(input.eventKey, sequence);

    const record: BufferedEventRecord = {
      eventName: input.eventName,
      eventKey: input.eventKey,
      input: input.eventInput,
      output: input.eventOutput,
      sequence,
      emittedAt: new Date().toISOString(),
    };

    this.appendBufferedRecord(this.durableEmissionsByKey, input.eventKey, record);
    this.appendBufferedRecord(this.durableEmissionsByEventName, input.eventName, record);

    this.pendingPersistence.push({
      namespace: this.options.namespace,
      eventName: input.eventName,
      eventKey: input.eventKey,
      sequence,
      input: input.eventInput,
      output: input.eventOutput,
      emittedAt: new Date(record.emittedAt),
    });

    if (this.pendingPersistence.length >= this.options.pendingFlushBatchSize) {
      void this.flushPendingToPersistence();
    }

    return record;
  }

  async replayByEventKey(input: {
    eventName: string;
    eventKey: string;
    replayLimit: number;
    includePersisted: boolean;
    afterSequence?: number;
  }): Promise<{ input: Record<string, unknown>; output: Record<string, unknown>; sequence: number }[]> {
    const afterSequence = input.afterSequence;

    const persisted =
      input.includePersisted && this.options.persistenceAdapter
        ? await this.options.persistenceAdapter.findRecentByEventKey({
            namespace: this.options.namespace,
            eventName: input.eventName,
            eventKey: input.eventKey,
            limit: input.replayLimit,
          })
        : [];

    const buffered = this.durableEmissionsByKey.get(input.eventKey) ?? [];
    const replayBuffered =
      afterSequence != null
        ? buffered.filter((item) => item.sequence > afterSequence)
        : buffered.slice(-input.replayLimit);

    const merged = this.mergeReplayRecords(
      persisted.map((item) => ({ input: item.input, output: item.output, sequence: item.sequence })),
      replayBuffered.map((item) => ({ input: item.input, output: item.output, sequence: item.sequence })),
      input.replayLimit,
      afterSequence,
    );

    return merged;
  }

  async replayByEventName(input: {
    eventName: string;
    replayLimit: number;
    includePersisted: boolean;
  }): Promise<{ input: Record<string, unknown>; output: Record<string, unknown>; sequence: number }[]> {
    const persisted =
      input.includePersisted && this.options.persistenceAdapter
        ? await this.options.persistenceAdapter.findRecentByEventName({
            namespace: this.options.namespace,
            eventName: input.eventName,
            limit: input.replayLimit,
          })
        : [];

    const buffered = this.durableEmissionsByEventName.get(input.eventName) ?? [];
    const replayBuffered = buffered.slice(-input.replayLimit);

    return this.mergeReplayRecords(
      persisted.map((item) => ({ input: item.input, output: item.output, sequence: item.sequence })),
      replayBuffered.map((item) => ({ input: item.input, output: item.output, sequence: item.sequence })),
      input.replayLimit,
      undefined,
    );
  }

  getLastSequence(eventKey: string): number {
    return this.sequenceByEventKey.get(eventKey) ?? 0;
  }

  startTicker(): void {
    if (this.flushTicker) {
      return;
    }

    this.flushTicker = setInterval(() => {
      void this.flushPendingToPersistence();
    }, this.options.flushIntervalMs);

    this.options.logger.log('EventBufferService flush ticker started');
  }

  async stopTickerAndFlush(): Promise<void> {
    if (this.flushTicker) {
      clearInterval(this.flushTicker);
      this.flushTicker = undefined;
    }

    await this.flushPendingToPersistence();
  }

  clear(): void {
    this.durableEmissionsByKey.clear();
    this.durableEmissionsByEventName.clear();
    this.sequenceByEventKey.clear();
    this.pendingPersistence.length = 0;
    this.isFlushing = false;
  }

  private appendBufferedRecord(
    target: Map<string, BufferedEventRecord[]>,
    key: string,
    record: BufferedEventRecord,
  ): void {
    let buffer = target.get(key);
    if (!buffer) {
      buffer = [];
      target.set(key, buffer);
    }

    buffer.push(record);
    if (buffer.length > this.options.durableReplayLimit) {
      buffer.shift();
    }
  }

  private mergeReplayRecords(
    persisted: { input: Record<string, unknown>; output: Record<string, unknown>; sequence: number }[],
    buffered: { input: Record<string, unknown>; output: Record<string, unknown>; sequence: number }[],
    replayLimit: number,
    afterSequence?: number,
  ): { input: Record<string, unknown>; output: Record<string, unknown>; sequence: number }[] {
    const mergedMap = new Map<number, { input: Record<string, unknown>; output: Record<string, unknown>; sequence: number }>();

    for (const row of persisted) {
      if (afterSequence != null && row.sequence <= afterSequence) {
        continue;
      }
      mergedMap.set(row.sequence, row);
    }

    for (const row of buffered) {
      if (afterSequence != null && row.sequence <= afterSequence) {
        continue;
      }
      if (!mergedMap.has(row.sequence)) {
        mergedMap.set(row.sequence, row);
      }
    }

    const ordered = Array.from(mergedMap.values()).sort((a, b) => a.sequence - b.sequence);
    return afterSequence != null ? ordered : ordered.slice(-replayLimit);
  }

  private async flushPendingToPersistence(): Promise<void> {
    if (
      this.isFlushing ||
      this.pendingPersistence.length === 0 ||
      !this.options.persistenceAdapter
    ) {
      return;
    }

    this.isFlushing = true;
    try {
      const batch = this.pendingPersistence.splice(0, this.options.pendingFlushBatchSize);
      await this.options.persistenceAdapter.insertMany(batch);
    } catch (error) {
      this.options.logger.error('Failed to persist event logs', error as Error);
    } finally {
      this.isFlushing = false;
    }
  }
}