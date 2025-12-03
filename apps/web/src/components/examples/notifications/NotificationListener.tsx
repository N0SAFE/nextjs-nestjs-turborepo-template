"use client";

import { useNotificationStream } from "@/hooks/useNotifications";
import { toast } from "sonner";

/**
 * Simple notification listener that shows toasts for incoming notifications
 * 
 * This component demonstrates the basic usage of useNotificationStream.
 * It automatically displays toast notifications for each event received.
 */
export function NotificationListener() {
  const { notifications, isConnected, error } = useNotificationStream({
    enabled: true,
    onNotification: (notification) => {
      // Show toast notification based on type
      const toastFn = toast[notification.type] || toast;
      toastFn(notification.message, {
        description: notification.title,
      });
    },
  });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Listening for notifications" : "Disconnected"}
          </span>
        </div>

        {error && (
          <div className="mt-2 text-sm text-destructive">
            Error: {error.message}
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          Received: {notifications.length} notifications
        </div>
      </div>
    </div>
  );
}
