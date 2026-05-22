import { DynamicModule, Global, Module, type Provider } from '@nestjs/common';
import {
  EVENT_PERSISTENCE_ADAPTER,
  CORE_EVENT_STREAM_REPOSITORY,
} from './events.tokens';
import { CoreEventSyncService } from './services/core-event-sync.service';
import { EventRegistry } from './services/event-registry.service';

/**
 * Global Events Module
 *
 * This module provides the base event infrastructure.
 * Feature-specific event services should be registered in their respective modules.
 */
@Global()
@Module({
  providers: [EventRegistry, CoreEventSyncService],
  exports: [EventRegistry, CoreEventSyncService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class EventsModule {
  static forRoot(options?: {
    persistenceAdapterProvider: Provider;
    coreEventStreamRepositoryProvider: Provider;
    extraProviders?: Provider[];
  }): DynamicModule {
    const providers: Provider[] = [
      options?.persistenceAdapterProvider,
      options?.coreEventStreamRepositoryProvider,
    ].filter(Boolean) as Provider[];
    const exports: (Provider | string | symbol | ((...args: unknown[]) => unknown))[] = [];

    if (options?.persistenceAdapterProvider) {
      exports.push(EVENT_PERSISTENCE_ADAPTER);
    }

    if (options?.coreEventStreamRepositoryProvider) {
      exports.push(CORE_EVENT_STREAM_REPOSITORY);
    }

    if (options?.extraProviders?.length) {
      providers.push(...options.extraProviders);
      exports.push(...options.extraProviders);
    }

    return {
      module: EventsModule,
      global: true,
      providers,
      exports,
    };
  }
}
