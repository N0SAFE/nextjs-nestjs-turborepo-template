import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

type ScopedStreamData = {
  subject: Subject<unknown>;
  subscribers: number;
}

@Injectable()
export class EventRegistry {
  private readonly scopedStreams = new Map<string, ScopedStreamData>();
  private readonly anyStreams = new Map<string, ScopedStreamData>();

  retainScoped<T>(key: string): Subject<T> {
    const existing = this.scopedStreams.get(key);
    if (existing) {
      existing.subscribers += 1;
      return existing.subject as Subject<T>;
    }

    const subject = new Subject<T>();
    this.scopedStreams.set(key, {
      subject: subject as Subject<unknown>,
      subscribers: 1,
    });
    return subject;
  }

  releaseScoped(key: string): void {
    const existing = this.scopedStreams.get(key);
    if (!existing) {
      return;
    }

    existing.subscribers = Math.max(0, existing.subscribers - 1);
    if (existing.subscribers === 0) {
      existing.subject.complete();
      this.scopedStreams.delete(key);
    }
  }

  retainAny<T>(eventName: string): Subject<T> {
    const existing = this.anyStreams.get(eventName);
    if (existing) {
      existing.subscribers += 1;
      return existing.subject as Subject<T>;
    }

    const subject = new Subject<T>();
    this.anyStreams.set(eventName, {
      subject: subject as Subject<unknown>,
      subscribers: 1,
    });
    return subject;
  }

  releaseAny(eventName: string): void {
    const existing = this.anyStreams.get(eventName);
    if (!existing) {
      return;
    }

    existing.subscribers = Math.max(0, existing.subscribers - 1);
    if (existing.subscribers === 0) {
      existing.subject.complete();
      this.anyStreams.delete(eventName);
    }
  }

  emitScoped<T>(key: string, payload: T): void {
    const existing = this.scopedStreams.get(key);
    if (!existing) {
      return;
    }

    (existing.subject as Subject<T>).next(payload);
  }

  emitAny<T>(eventName: string, payload: T): void {
    const existing = this.anyStreams.get(eventName);
    if (!existing) {
      return;
    }

    (existing.subject as Subject<T>).next(payload);
  }

  clearScoped(key: string): void {
    const existing = this.scopedStreams.get(key);
    if (!existing) {
      return;
    }

    existing.subject.complete();
    this.scopedStreams.delete(key);
  }

  scopedSubscriberCount(key: string): number {
    return this.scopedStreams.get(key)?.subscribers ?? 0;
  }

  activeScopedKeys(): string[] {
    return Array.from(this.scopedStreams.keys());
  }

  clearAll(): void {
    for (const entry of this.scopedStreams.values()) {
      entry.subject.complete();
    }
    this.scopedStreams.clear();

    for (const entry of this.anyStreams.values()) {
      entry.subject.complete();
    }
    this.anyStreams.clear();
  }
}