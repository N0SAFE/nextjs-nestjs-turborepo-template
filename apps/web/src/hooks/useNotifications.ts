"use client";

import { useCallback, useEffect, useState } from "react";
import { orpc } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import type { NotificationEvent } from "@repo/api-contracts";

/**
 * Options for the notification stream hook
 */
interface UseNotificationStreamOptions {
  /**
   * Filter notifications by type
   */
  types?: Array<"info" | "warning" | "error" | "success">;
  
  /**
   * Callback when a notification is received
   */
  onNotification?: (notification: NotificationEvent) => void;
  
  /**
   * Enable/disable the stream
   * @default true
   */
  enabled?: boolean;

  /**
   * Maximum number of notifications to keep in state
   * @default 50
   */
  maxNotifications?: number;
}

/**
 * Hook for streaming notifications in real-time using Server-Sent Events
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { notifications, isConnected, error } = useNotificationStream({
 *     types: ['info', 'success'],
 *     onNotification: (notification) => {
 *       toast[notification.type](notification.message)
 *     }
 *   })
 * 
 *   return (
 *     <div>
 *       Status: {isConnected ? 'Connected' : 'Disconnected'}
 *       {notifications.map(n => <div key={n.id}>{n.message}</div>)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useNotificationStream(
  options: UseNotificationStreamOptions = {}
) {
  const {
    types,
    onNotification,
    enabled = true,
    maxNotifications = 50,
  } = options;

  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let isActive = true;

    const startStream = async () => {
      try {
        setIsConnected(true);
        setError(null);

        // Get the event iterator from ORPC
        const iterator = await orpc.notifications.stream({
          input: { types },
          context: { signal: controller.signal },
        });

        // Consume the iterator
        for await (const notification of iterator) {
          if (!isActive) break;

          // Add notification to state
          setNotifications((prev) => {
            const updated = [...prev, notification];
            // Keep only the most recent notifications
            return updated.slice(-maxNotifications);
          });

          // Call the callback if provided
          onNotification?.(notification);
        }

        // Stream ended successfully
        setIsConnected(false);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Notification stream error:", err);
          setError(err as Error);
          setIsConnected(false);
        }
      }
    };

    startStream();

    return () => {
      isActive = false;
      controller.abort();
      setIsConnected(false);
    };
  }, [types?.join(","), enabled, onNotification, maxNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    isConnected,
    error,
    clearNotifications,
    removeNotification,
  };
}

/**
 * Hook for manually controlling the notification stream
 * 
 * Useful when you need to dynamically start/stop the stream
 * based on user actions or other conditions.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { notifications, isConnected, connect, disconnect } = 
 *     useNotificationStreamManual()
 * 
 *   return (
 *     <div>
 *       <button onClick={() => connect({ types: ['info'] })}>
 *         Start Stream
 *       </button>
 *       <button onClick={disconnect}>Stop Stream</button>
 *       {notifications.map(n => <div key={n.id}>{n.message}</div>)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useNotificationStreamManual() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const connect = useCallback(
    async (options: { types?: Array<"info" | "warning" | "error" | "success"> }) => {
      // Disconnect if already connected
      if (controller) {
        controller.abort();
      }

      const newController = new AbortController();
      setController(newController);

      try {
        setIsConnected(true);
        setError(null);

        const iterator = await orpc.notifications.stream({
          input: { types: options.types },
          context: { signal: newController.signal },
        });

        for await (const notification of iterator) {
          if (newController.signal.aborted) break;

          setNotifications((prev) => [...prev, notification]);
        }

        setIsConnected(false);
      } catch (err) {
        if (!newController.signal.aborted) {
          setError(err as Error);
          setIsConnected(false);
        }
      }
    },
    [controller]
  );

  const disconnect = useCallback(() => {
    if (controller) {
      controller.abort();
      setController(null);
      setIsConnected(false);
    }
  }, [controller]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    isConnected,
    error,
    connect,
    disconnect,
    clearNotifications,
    removeNotification,
  };
}

/**
 * Hook for publishing notifications
 * 
 * Uses React Query mutation for optimistic updates and error handling.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { publishNotification, isPending } = usePublishNotification()
 * 
 *   const handlePublish = () => {
 *     publishNotification({
 *       type: 'success',
 *       message: 'Operation completed successfully',
 *       title: 'Success'
 *     })
 *   }
 * 
 *   return (
 *     <button onClick={handlePublish} disabled={isPending}>
 *       Publish Notification
 *     </button>
 *   )
 * }
 * ```
 */
export function usePublishNotification() {
  const mutation = useMutation({
    mutationFn: async (
      input: {
        type: "info" | "warning" | "error" | "success";
        message: string;
        title?: string;
        userId?: string;
      }
    ) => {
      return await orpc.notifications.publish({ input });
    },
  });

  return {
    publishNotification: mutation.mutate,
    publishNotificationAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

/**
 * Combined hook for notification management
 * 
 * Provides both streaming and publishing in a single hook.
 * Useful for components that need full notification functionality.
 * 
 * @example
 * ```tsx
 * function NotificationCenter() {
 *   const {
 *     notifications,
 *     isConnected,
 *     publishNotification,
 *     clearNotifications,
 *   } = useNotifications({
 *     types: ['info', 'warning', 'error', 'success']
 *   })
 * 
 *   return (
 *     <div>
 *       <button onClick={() => publishNotification({
 *         type: 'info',
 *         message: 'Test notification'
 *       })}>
 *         Send Test
 *       </button>
 *       <button onClick={clearNotifications}>Clear All</button>
 *       {notifications.map(n => (
 *         <NotificationCard key={n.id} notification={n} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useNotifications(options: UseNotificationStreamOptions = {}) {
  const stream = useNotificationStream(options);
  const publisher = usePublishNotification();

  return {
    // Stream state
    notifications: stream.notifications,
    isConnected: stream.isConnected,
    error: stream.error,
    clearNotifications: stream.clearNotifications,
    removeNotification: stream.removeNotification,

    // Publishing
    publishNotification: publisher.publishNotification,
    publishNotificationAsync: publisher.publishNotificationAsync,
    isPublishing: publisher.isPending,
    publishError: publisher.error,
  };
}
