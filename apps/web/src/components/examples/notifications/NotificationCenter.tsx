"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { X, Bell, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import type { NotificationEvent } from "@repo/api-contracts";

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: NotificationEvent["type"]) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

/**
 * Get badge variant for notification type
 */
function getBadgeVariant(type: NotificationEvent["type"]) {
  switch (type) {
    case "success":
      return "default";
    case "error":
      return "destructive";
    case "warning":
      return "secondary";
    case "info":
    default:
      return "outline";
  }
}

/**
 * Notification Center component
 * 
 * Full-featured notification UI with streaming and publishing capabilities.
 * Demonstrates advanced usage of the useNotifications hook.
 */
export function NotificationCenter() {
  const {
    notifications,
    isConnected,
    error,
    clearNotifications,
    removeNotification,
    publishNotification,
    isPublishing,
  } = useNotifications({
    maxNotifications: 100,
  });

  const handleTestNotification = () => {
    const types: Array<"info" | "warning" | "error" | "success"> = [
      "info",
      "warning",
      "error",
      "success",
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const messages = [
      "System update available",
      "New message received",
      "Task completed successfully",
      "Connection established",
      "Configuration saved",
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];

    publishNotification({
      type,
      message,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Alert`,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Center</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Live" : "Disconnected"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleTestNotification}
            disabled={isPublishing}
            variant="outline"
            size="sm"
          >
            {isPublishing ? "Sending..." : "Send Test Notification"}
          </Button>
          <Button
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            variant="outline"
            size="sm"
          >
            Clear All
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Connection Error</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground">
                Click &quot;Send Test Notification&quot; to try it out
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {notifications.slice().reverse().map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 space-y-1">
                    {notification.title && (
                      <p className="font-medium">{notification.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={getBadgeVariant(notification.type)}>
                        {notification.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
            <span>Total: {notifications.length} notifications</span>
            <div className="flex gap-4">
              <span>
                Info:{" "}
                {notifications.filter((n) => n.type === "info").length}
              </span>
              <span>
                Success:{" "}
                {notifications.filter((n) => n.type === "success").length}
              </span>
              <span>
                Warning:{" "}
                {notifications.filter((n) => n.type === "warning").length}
              </span>
              <span>
                Error:{" "}
                {notifications.filter((n) => n.type === "error").length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
