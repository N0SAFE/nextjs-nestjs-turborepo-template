import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { firstValueFrom } from 'rxjs';
import { BaseEventService } from './base-event.service';
import { contractBuilder } from '../contracts/event-contract.builder';

const testContracts = {
  changed: contractBuilder()
    .input(z.object({ id: z.string() }))
    .output(z.object({ value: z.string() }))
    .build(),
} as const;

class TestEventService extends BaseEventService<typeof testContracts> {
  constructor() {
    super('test', testContracts);
  }

  protected buildEventKey(
    _eventName: string,
    input: Record<string, unknown>,
  ): string {
    return String(input.id);
  }
}

describe('BaseEventService (RxJS internals)', () => {
  it('should emit to rxjs subscription stream', async () => {
    const service = new TestEventService();
    const pending = firstValueFrom(service.subscribe$('changed', { id: 'abc' }));

    service.emit('changed', { id: 'abc' }, { value: 'hello' });

    await expect(pending).resolves.toEqual({ value: 'hello' });
  });

  it('should track subscriber count and cleanup on unsubscribe', () => {
    const service = new TestEventService();

    const subscription = service.subscribe$('changed', { id: 'abc' }).subscribe(() => undefined);
    expect(service.getSubscriberCount('changed', { id: 'abc' })).toBe(1);
    expect(service.hasSubscribers('changed', { id: 'abc' })).toBe(true);

    subscription.unsubscribe();

    expect(service.getSubscriberCount('changed', { id: 'abc' })).toBe(0);
    expect(service.hasSubscribers('changed', { id: 'abc' })).toBe(false);
  });

  it('should complete stream when removeAllSubscribers is called', async () => {
    const service = new TestEventService();

    let completed = false;
    const subscription = service
      .subscribe$('changed', { id: 'abc' })
      .subscribe({ complete: () => (completed = true) });

    service.removeAllSubscribers('changed', { id: 'abc' });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(completed).toBe(true);
    subscription.unsubscribe();
  });

  it('should clear all active events', () => {
    const service = new TestEventService();

    const subA = service.subscribe$('changed', { id: 'a' }).subscribe(() => undefined);
    const subB = service.subscribe$('changed', { id: 'b' }).subscribe(() => undefined);

    expect(service.getActiveEvents()).toHaveLength(2);

    service.clearAll();

    expect(service.getActiveEvents()).toHaveLength(0);

    subA.unsubscribe();
    subB.unsubscribe();
  });

  it('should replay and filter events using queryByInput$ fuzzy search', async () => {
    const service = new TestEventService();

    service.emit('changed', { id: 'abc' }, { value: 'first' });
    service.emit('changed', { id: 'def' }, { value: 'second' });

    const received: { input: { id: string }; output: { value: string } }[] = [];
    const subscription = service
      .queryByInput$('changed', {
        includePersisted: false,
        fuzzy: 'abc',
        replayLimit: 20,
      })
      .subscribe((event) => {
        received.push(event as { input: { id: string }; output: { value: string } });
      });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(received).toEqual([
      {
        input: { id: 'abc' },
        output: { value: 'first' },
      },
    ]);

    subscription.unsubscribe();
  });
});
