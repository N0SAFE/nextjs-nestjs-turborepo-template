# Notification Examples

This directory contains example components demonstrating the use of ORPC event iterators for real-time notifications.

## Components

### NotificationListener

A simple component that listens for notifications and displays them as toast messages.

**Usage:**
```tsx
import { NotificationListener } from '@/components/examples/notifications/NotificationListener'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <NotificationListener />
    </>
  )
}
```

### NotificationCenter

A full-featured notification center UI with:
- Real-time notification streaming
- Send test notifications
- Filter and clear notifications
- Connection status indicator
- Type-based icons and badges

**Usage:**
```tsx
import { NotificationCenter } from '@/components/examples/notifications/NotificationCenter'

export default function NotificationsPage() {
  return (
    <div className="container py-8">
      <NotificationCenter />
    </div>
  )
}
```

## Features Demonstrated

1. **Event Iterator Streaming**: Server-Sent Events (SSE) for real-time updates
2. **Contract-First Approach**: Type-safe contracts between frontend and backend
3. **Custom Hooks Pattern**: Reusable hooks following the ORPC client hooks pattern
4. **Automatic Reconnection**: Handles connection loss with last event ID
5. **Error Handling**: Graceful error display and recovery
6. **React Query Integration**: Mutations for publishing notifications

## API Endpoints

### Stream Notifications (GET)
- **Path**: `/notifications/stream`
- **Type**: Event Iterator (SSE)
- **Input**: `{ types?: Array<'info' | 'warning' | 'error' | 'success'> }`
- **Output**: Stream of notification events

### Publish Notification (POST)
- **Path**: `/notifications/publish`
- **Input**: `{ type, message, title?, userId? }`
- **Output**: Published notification event

## Testing

To test the notifications:

1. Add `<NotificationListener />` to your app layout
2. Open the browser console
3. Use the NotificationCenter to send test notifications
4. Open multiple browser tabs to see cross-tab notifications

## Implementation Details

- Server-side uses async generators for event streaming
- Client-side uses `for await...of` to consume events
- Automatic reconnection with `lastEventId` for resuming
- Memory-efficient with configurable notification limits
- Type-safe end-to-end with Zod schemas
