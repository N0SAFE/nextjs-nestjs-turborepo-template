# ORPC Advanced Patterns: Event Iterators, WebSockets, and Durable Iterators

> **Status**: Contract-first implementation guide for streaming and real-time features  
> **Last Updated**: 2025-12-03

## Overview

This guide demonstrates how to implement advanced ORPC patterns using the contract-first approach with seamless integration into the existing NestJS + Next.js architecture. All patterns maintain the use of the `@Implement` decorator on the backend and custom client hooks on the frontend.

## Table of Contents

1. [Event Iterator (SSE)](#event-iterator-sse)
2. [WebSocket Integration](#websocket-integration)
3. [Durable Iterator](#durable-iterator)
4. [Contract-First Implementation](#contract-first-implementation)

---

## Event Iterator (SSE)

Event Iterators enable Server-Sent Events (SSE) for real-time streaming from server to client. Perfect for live updates, AI chat responses, progress indicators, and notifications.

### Key Features

- Built-in SSE support without extra configuration
- Automatic reconnection with last event ID
- Type-safe event validation
- Cleanup on connection close
- Integration with React Query hooks

### Contract Definition

Define event iterator contracts using the `eventIterator` helper:

**File**: `packages/contracts/api/modules/notifications/stream.ts`

```typescript
import { oc, type as ocType, eventIterator } from '@orpc/contract'
import { z } from 'zod/v4'

// Define the event shape
export const notificationEventSchema = z.object({
  id: z.string(),
  type: z.enum(['info', 'warning', 'error', 'success']),
  message: z.string(),
  timestamp: z.string().datetime(),
})

// Define the contract with event iterator output
export const notificationStreamContract = oc
  .route({
    method: 'GET',
    path: '/stream',
    summary: 'Stream notifications',
    description: 'Real-time notification stream using Server-Sent Events',
  })
  .input(
    z.object({
      userId: z.string().optional(),
      types: z.array(z.enum(['info', 'warning', 'error', 'success'])).optional(),
    })
  )
  .output(eventIterator(notificationEventSchema))
```

**File**: `packages/contracts/api/modules/notifications/index.ts`

```typescript
import { oc } from '@orpc/contract'
import { notificationStreamContract } from './stream'

export const notificationContract = oc
  .tag('Notifications')
  .prefix('/notifications')
  .router({
    stream: notificationStreamContract,
  })

export * from './stream'
```

### Server Implementation (NestJS)

Implement the contract using the `@Implement` decorator with async generator:

**File**: `apps/api/src/modules/notifications/controllers/notification.controller.ts`

```typescript
import { Controller } from '@nestjs/common'
import { Implement, implement } from '@orpc/nest'
import { notificationContract } from '@repo/api-contracts'
import { NotificationService } from '../services/notification.service'
import { withEventMeta } from '@orpc/server'

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Implement(notificationContract.stream)
  stream() {
    return implement(notificationContract.stream).handler(
      async function* ({ input, signal, lastEventId }) {
        // If lastEventId is provided, resume from that point
        const startFrom = lastEventId ? parseInt(lastEventId) : 0

        try {
          // Subscribe to notification service
          const eventEmitter = this.notificationService.getEventEmitter()
          
          // Create async iterator from event emitter
          const iterator = this.notificationService.createNotificationIterator(
            input.userId,
            input.types,
            startFrom
          )

          let eventId = startFrom

          // Stream notifications
          for await (const notification of iterator) {
            // Check if client disconnected
            if (signal?.aborted) {
              break
            }

            eventId++

            // Yield notification with event metadata
            yield withEventMeta(notification, {
              id: eventId.toString(),
              retry: 5000, // Client should retry after 5 seconds
            })
          }
        } finally {
          // Cleanup: unsubscribe from event emitter
          console.log('Client disconnected, cleaning up notification stream')
        }
      }.bind(this)
    )
  }
}
```

**File**: `apps/api/src/modules/notifications/services/notification.service.ts`

```typescript
import { Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: string
}

@Injectable()
export class NotificationService {
  private eventEmitter = new EventEmitter()
  private notifications: Notification[] = []

  getEventEmitter() {
    return this.eventEmitter
  }

  async *createNotificationIterator(
    userId?: string,
    types?: string[],
    startFrom: number = 0
  ): AsyncGenerator<Notification> {
    // Emit any missed events since startFrom
    const missedEvents = this.notifications.slice(startFrom)
    for (const event of missedEvents) {
      if (this.shouldIncludeNotification(event, userId, types)) {
        yield event
      }
    }

    // Create queue for new events
    const queue: Notification[] = []
    let resolve: (() => void) | null = null

    const listener = (notification: Notification) => {
      if (this.shouldIncludeNotification(notification, userId, types)) {
        queue.push(notification)
        if (resolve) {
          resolve()
          resolve = null
        }
      }
    }

    this.eventEmitter.on('notification', listener)

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!
        } else {
          // Wait for next notification
          await new Promise<void>((res) => {
            resolve = res
          })
        }
      }
    } finally {
      this.eventEmitter.off('notification', listener)
    }
  }

  private shouldIncludeNotification(
    notification: Notification,
    userId?: string,
    types?: string[]
  ): boolean {
    if (types && types.length > 0 && !types.includes(notification.type)) {
      return false
    }
    // Add user filtering logic if needed
    return true
  }

  // Method to publish notifications
  publishNotification(notification: Notification) {
    this.notifications.push(notification)
    this.eventEmitter.emit('notification', notification)
  }
}
```

### Client Implementation (React Hooks)

Create custom hooks that wrap the ORPC event iterator:

**File**: `apps/web/src/hooks/useNotifications.ts`

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'
import { orpc } from '@/lib/orpc'
import { consumeEventIterator } from '@orpc/client'
import type { notificationEventSchema } from '@repo/api-contracts'
import type { z } from 'zod/v4'

type NotificationEvent = z.infer<typeof notificationEventSchema>

interface UseNotificationStreamOptions {
  userId?: string
  types?: Array<'info' | 'warning' | 'error' | 'success'>
  onNotification?: (notification: NotificationEvent) => void
  enabled?: boolean
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { userId, types, onNotification, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    let cancel: (() => Promise<void>) | undefined

    const startStream = async () => {
      try {
        setIsConnected(true)
        setError(null)

        // Get the event iterator from ORPC
        const iterator = await orpc.notifications.stream({
          input: { userId, types },
          signal: controller.signal,
        })

        // Consume the iterator
        cancel = consumeEventIterator(iterator, {
          onEvent: (notification) => {
            setNotifications((prev) => [...prev, notification])
            onNotification?.(notification)
          },
          onError: (err) => {
            console.error('Notification stream error:', err)
            setError(err as Error)
            setIsConnected(false)
          },
          onSuccess: () => {
            console.log('Notification stream completed')
            setIsConnected(false)
          },
        })
      } catch (err) {
        console.error('Failed to start notification stream:', err)
        setError(err as Error)
        setIsConnected(false)
      }
    }

    startStream()

    return () => {
      controller.abort()
      cancel?.()
      setIsConnected(false)
    }
  }, [userId, types?.join(','), enabled, onNotification])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    isConnected,
    error,
    clearNotifications,
  }
}

// Alternative hook for manual control
export function useNotificationStreamManual() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [cancel, setCancel] = useState<(() => Promise<void>) | null>(null)

  const connect = useCallback(
    async (options: { userId?: string; types?: string[] }) => {
      if (isConnected) {
        await disconnect()
      }

      try {
        setIsConnected(true)
        setError(null)

        const iterator = await orpc.notifications.stream({
          input: options,
        })

        const cancelFn = consumeEventIterator(iterator, {
          onEvent: (notification) => {
            setNotifications((prev) => [...prev, notification])
          },
          onError: (err) => {
            setError(err as Error)
            setIsConnected(false)
          },
          onSuccess: () => {
            setIsConnected(false)
          },
        })

        setCancel(() => cancelFn)
      } catch (err) {
        setError(err as Error)
        setIsConnected(false)
      }
    },
    [isConnected]
  )

  const disconnect = useCallback(async () => {
    if (cancel) {
      await cancel()
      setCancel(null)
      setIsConnected(false)
    }
  }, [cancel])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    isConnected,
    error,
    connect,
    disconnect,
    clearNotifications,
  }
}
```

**Usage in Components**:

```tsx
'use client'

import { useNotificationStream } from '@/hooks/useNotifications'
import { toast } from 'sonner'

export function NotificationListener() {
  const { notifications, isConnected, error } = useNotificationStream({
    enabled: true,
    onNotification: (notification) => {
      // Show toast for each notification
      toast[notification.type](notification.message)
    },
  })

  return (
    <div>
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-500">Error: {error.message}</div>
      )}

      <div className="mt-4 space-y-2">
        <h3 className="font-semibold">Recent Notifications</h3>
        {notifications.slice(-5).map((notification) => (
          <div key={notification.id} className="rounded border p-2">
            <span className="font-medium">{notification.type}:</span>{' '}
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## WebSocket Integration

WebSockets provide full-duplex communication for real-time, bidirectional data exchange. Ideal for chat applications, collaborative editing, and live dashboards.

### Key Features

- Low-latency bidirectional RPC
- Built-in support for multiple server adapters
- Contract-first approach
- Automatic reconnection support
- Type-safe method calls

### Contract Definition

**File**: `packages/contracts/api/modules/chat/index.ts`

```typescript
import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  username: z.string(),
  message: z.string(),
  timestamp: z.string().datetime(),
})

// WebSocket procedures for chat
export const chatContract = oc.tag('Chat').prefix('/chat').router({
  // Join a chat room
  join: oc
    .route({
      method: 'POST',
      path: '/join',
      summary: 'Join a chat room',
    })
    .input(
      z.object({
        roomId: z.string(),
        username: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        roomId: z.string(),
      })
    ),

  // Send a message
  sendMessage: oc
    .route({
      method: 'POST',
      path: '/send',
      summary: 'Send a chat message',
    })
    .input(
      z.object({
        roomId: z.string(),
        message: z.string(),
      })
    )
    .output(chatMessageSchema),

  // Leave a room
  leave: oc
    .route({
      method: 'POST',
      path: '/leave',
      summary: 'Leave a chat room',
    })
    .input(
      z.object({
        roomId: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    ),
})

export type ChatContract = typeof chatContract
export * from './stream'
```

### WebSocket Setup

**Note**: WebSocket support in NestJS with ORPC requires additional configuration. For this stack, we recommend using HTTP-based event iterators (SSE) for server-to-client streaming, and regular HTTP endpoints for client-to-server communication. WebSockets are better suited for specific use cases like real-time gaming or collaborative editing.

However, if you need true WebSocket support, you can:

1. Use a separate WebSocket server with ORPC WebSocket adapters
2. Integrate with NestJS WebSocket Gateway
3. Use event iterators (SSE) + regular endpoints as a simpler alternative

### Alternative: SSE + HTTP Pattern

For most use cases, combining SSE (server-to-client) with HTTP POST (client-to-server) provides similar functionality with better compatibility:

**File**: `packages/contracts/api/modules/chat/stream.ts`

```typescript
import { oc, eventIterator } from '@orpc/contract'
import { z } from 'zod/v4'
import { chatMessageSchema } from './index'

// Stream of chat messages (server to client)
export const chatStreamContract = oc
  .route({
    method: 'GET',
    path: '/stream',
    summary: 'Stream chat messages',
  })
  .input(
    z.object({
      roomId: z.string(),
    })
  )
  .output(eventIterator(chatMessageSchema))
```

**Server Implementation**:

```typescript
import { Controller } from '@nestjs/common'
import { Implement, implement } from '@orpc/nest'
import { chatContract } from '@repo/api-contracts'
import { ChatService } from '../services/chat.service'
import { withEventMeta } from '@orpc/server'

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Implement(chatContract.stream)
  stream() {
    return implement(chatContract.stream).handler(
      async function* ({ input, signal, lastEventId }) {
        const { roomId } = input

        try {
          const iterator = this.chatService.createRoomIterator(roomId, lastEventId)

          for await (const message of iterator) {
            if (signal?.aborted) break

            yield withEventMeta(message, {
              id: message.id,
              retry: 3000,
            })
          }
        } finally {
          console.log(`Client disconnected from room ${roomId}`)
        }
      }.bind(this)
    )
  }

  @Implement(chatContract.sendMessage)
  sendMessage() {
    return implement(chatContract.sendMessage).handler(async ({ input, context }) => {
      const userId = context.session?.user?.id
      if (!userId) {
        throw new Error('Unauthorized')
      }

      return await this.chatService.sendMessage({
        roomId: input.roomId,
        userId,
        message: input.message,
      })
    })
  }
}
```

**Client Hook**:

```typescript
'use client'

import { useNotificationStreamManual } from './useNotifications'
import { orpc } from '@/lib/orpc'

export function useChatRoom(roomId: string) {
  const {
    notifications: messages,
    isConnected,
    connect,
    disconnect,
  } = useNotificationStreamManual()

  // Connect to room stream
  useEffect(() => {
    if (roomId) {
      connect({ roomId })
    }
    return () => {
      disconnect()
    }
  }, [roomId, connect, disconnect])

  // Send message function
  const sendMessage = async (message: string) => {
    return await orpc.chat.sendMessage({
      input: { roomId, message },
    })
  }

  return {
    messages,
    isConnected,
    sendMessage,
  }
}
```

---

## Durable Iterator

Durable Iterators extend Event Iterators with automatic reconnection and event recovery through Cloudflare Durable Objects. This pattern is currently specific to Cloudflare Workers and may not be directly applicable to the current NestJS + Docker stack.

### When to Use Durable Iterators

- Running on Cloudflare Workers with Durable Objects
- Need guaranteed event delivery with recovery
- Require distributed state management
- Building chat rooms, collaborative editing, or gaming features

### Alternative for Current Stack

For the current Docker-based NestJS stack, consider these alternatives:

1. **Redis Pub/Sub** with Event Iterators for message persistence
2. **PostgreSQL LISTEN/NOTIFY** for database-driven events
3. **RabbitMQ/Apache Kafka** for enterprise message queuing

**Example with Redis**:

```typescript
// Service using Redis pub/sub
@Injectable()
export class RedisEventService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async *createEventStream(channel: string, lastEventId?: string) {
    const subscriber = this.redis.duplicate()
    await subscriber.connect()
    
    const queue: any[] = []
    let resolve: (() => void) | null = null

    await subscriber.subscribe(channel, (message) => {
      queue.push(JSON.parse(message))
      if (resolve) {
        resolve()
        resolve = null
      }
    })

    try {
      // Replay missed events from Redis list if lastEventId provided
      if (lastEventId) {
        const missed = await this.redis.lrange(
          `events:${channel}`,
          parseInt(lastEventId),
          -1
        )
        for (const event of missed) {
          yield JSON.parse(event)
        }
      }

      while (true) {
        if (queue.length > 0) {
          yield queue.shift()
        } else {
          await new Promise<void>((res) => { resolve = res })
        }
      }
    } finally {
      await subscriber.unsubscribe(channel)
      await subscriber.quit()
    }
  }

  async publishEvent(channel: string, event: any) {
    // Store in list for replay
    await this.redis.rpush(`events:${channel}`, JSON.stringify(event))
    // Trim to keep only recent events
    await this.redis.ltrim(`events:${channel}`, -1000, -1)
    // Publish to subscribers
    await this.redis.publish(channel, JSON.stringify(event))
  }
}
```

---

## Contract-First Implementation Checklist

When implementing any of these patterns, follow this workflow:

### 1. Define the Contract

- [ ] Create contract file in `packages/contracts/api/modules/[feature]/`
- [ ] Define input/output schemas with Zod
- [ ] Use `eventIterator()` for streaming responses
- [ ] Add route metadata (method, path, summary, description)
- [ ] Export contract and types

### 2. Implement Server Side

- [ ] Create controller in `apps/api/src/modules/[feature]/controllers/`
- [ ] Use `@Implement(contract)` decorator
- [ ] Use `implement(contract).handler()` for implementation
- [ ] Return async generator function for event iterators
- [ ] Handle `signal` for cancellation
- [ ] Use `lastEventId` for resumption
- [ ] Add cleanup in `finally` block
- [ ] Create service layer for business logic

### 3. Implement Client Side

- [ ] Create custom hook in `apps/web/src/hooks/`
- [ ] Use `consumeEventIterator()` for event handling
- [ ] Manage connection state
- [ ] Handle errors gracefully
- [ ] Provide cleanup on unmount
- [ ] Export types for components

### 4. Test and Document

- [ ] Test server-side with manual requests
- [ ] Test client-side in components
- [ ] Verify reconnection behavior
- [ ] Document usage examples
- [ ] Add to project documentation

---

## Best Practices

### Performance

1. **Limit Event Frequency**: Throttle or debounce high-frequency events
2. **Batch Events**: Group multiple events when possible
3. **Set Reasonable Retry Intervals**: Don't overwhelm the server
4. **Clean Up Resources**: Always cleanup in `finally` blocks
5. **Use Signal for Cancellation**: Respect AbortController signals

### Security

1. **Validate Input**: Always validate client input with Zod schemas
2. **Authenticate**: Check user authentication before streaming
3. **Authorize**: Verify user has access to requested resources
4. **Rate Limit**: Implement rate limiting for event streams
5. **Sanitize Output**: Never expose sensitive data in events

### Error Handling

1. **Try/Catch in Handlers**: Wrap async operations
2. **Client-Side Error States**: Show connection errors to users
3. **Retry Logic**: Implement exponential backoff
4. **Graceful Degradation**: Provide fallback UI when streaming fails
5. **Logging**: Log errors for debugging

### Type Safety

1. **Use Zod Schemas**: Define all data shapes with Zod
2. **Export Types**: Export inferred types from contracts
3. **Type Components**: Use types in React components
4. **Avoid `any`**: Never use `any` type
5. **Validate at Boundaries**: Validate data at system boundaries

---

## Examples

For complete working examples, see:

- `apps/api/src/modules/notifications/` - Notification streaming
- `apps/web/src/hooks/useNotifications.ts` - Client hooks
- `apps/web/src/components/NotificationListener.tsx` - React components

---

## Troubleshooting

### Stream Disconnects Immediately

**Cause**: Handler returns too quickly or throws error
**Solution**: Ensure async generator yields events and doesn't exit early

### Events Not Received on Client

**Cause**: CORS headers missing or incorrect URL
**Solution**: Configure CORS to expose SSE headers, verify API URLs

### Memory Leak on Server

**Cause**: Event listeners not cleaned up
**Solution**: Always cleanup in `finally` block, remove listeners

### Client Doesn't Reconnect

**Cause**: No retry logic or incorrect lastEventId handling
**Solution**: Implement retry logic, handle lastEventId properly

---

## References

- [ORPC Event Iterator Documentation](/tmp/orpc/apps/content/docs/event-iterator.md)
- [ORPC Client Event Iterator](/tmp/orpc/apps/content/docs/client/event-iterator.md)
- [ORPC WebSocket Adapter](/tmp/orpc/apps/content/docs/adapters/websocket.md)
- [ORPC Durable Iterator](/tmp/orpc/apps/content/docs/integrations/durable-iterator.md)
- [MDN Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
