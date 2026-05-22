# `@repo/nestjs-events`

Service-first event primitives for NestJS apps in this monorepo.

## What this package contains

- `EventsModule` and `EventsModule.forRoot(...)`
- `BaseEventService` (typed contracts, replay, buffering, lifecycle-safe flushing)
- `CoreEventSyncService` (stream orchestration/query helpers)
- Event contracts builder (`contractBuilder`)
- DI tokens (`EVENT_PERSISTENCE_ADAPTER`, `CORE_EVENT_STREAM_REPOSITORY`)
- **Type-only** repository port (`CoreEventStreamRepositoryPort`)

## What this package intentionally does NOT contain

- No concrete DB repositories
- No app-specific `@/` imports
- No app runtime modules (database/outbox/etc.)

Consuming applications must provide repository/persistence implementations via DI.

## Consumer wiring example

```ts
import { Module } from '@nestjs/common';
import {
  EventsModule,
  EVENT_PERSISTENCE_ADAPTER,
  CORE_EVENT_STREAM_REPOSITORY,
} from '@repo/nestjs-events';

@Module({
  imports: [
    EventsModule.forRoot({
      persistenceAdapterProvider: {
        provide: EVENT_PERSISTENCE_ADAPTER,
        useClass: AppEventLogRepository,
      },
      coreEventStreamRepositoryProvider: {
        provide: CORE_EVENT_STREAM_REPOSITORY,
        useClass: AppCoreEventStreamRepository,
      },
    }),
  ],
})
export class AppEventsIntegrationModule {}
```

## Folder semantics

- `src/services/*` → runtime services/classes
- `src/contracts/*` → contract typing + builder
- `src/types/*` → type-only ports/interfaces for consumer implementations
- `src/utils/*` → framework-agnostic helpers
