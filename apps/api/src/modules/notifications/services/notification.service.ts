import { Injectable } from "@nestjs/common";
import { EventEmitter } from "events";
import type { NotificationEvent } from "@repo/api-contracts";

@Injectable()
export class NotificationService {
  private eventEmitter = new EventEmitter();
  private notifications: NotificationEvent[] = [];
  private eventIdCounter = 0;

  /**
   * Create an async iterator for notification streaming
   * Supports resuming from a specific event ID
   */
  async *createNotificationIterator(
    types?: string[],
    startFromEventId?: string
  ): AsyncGenerator<NotificationEvent> {
    const startIndex = startFromEventId
      ? parseInt(startFromEventId, 10) + 1
      : 0;

    // First, yield any missed events if resuming
    if (startIndex > 0 && startIndex < this.notifications.length) {
      for (let i = startIndex; i < this.notifications.length; i++) {
        const notification = this.notifications[i];
        if (this.shouldIncludeNotification(notification, types)) {
          yield notification;
        }
      }
    }

    // Create a queue for new events
    const queue: NotificationEvent[] = [];
    let resolve: (() => void) | null = null;

    // Listener for new notifications
    const listener = (notification: NotificationEvent) => {
      if (this.shouldIncludeNotification(notification, types)) {
        queue.push(notification);
        if (resolve) {
          resolve();
          resolve = null;
        }
      }
    };

    // Register the listener
    this.eventEmitter.on("notification", listener);

    try {
      // Stream notifications indefinitely
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          // Wait for next notification
          await new Promise<void>((res) => {
            resolve = res;
          });
        }
      }
    } finally {
      // Cleanup: remove listener when stream ends
      this.eventEmitter.off("notification", listener);
    }
  }

  /**
   * Check if a notification should be included based on filters
   */
  private shouldIncludeNotification(
    notification: NotificationEvent,
    types?: string[]
  ): boolean {
    if (types && types.length > 0 && !types.includes(notification.type)) {
      return false;
    }
    return true;
  }

  /**
   * Publish a notification to all connected clients
   */
  async publishNotification(
    input: Omit<NotificationEvent, "id" | "timestamp">
  ): Promise<NotificationEvent> {
    const notification: NotificationEvent = {
      ...input,
      id: (this.eventIdCounter++).toString(),
      timestamp: new Date().toISOString(),
    };

    // Store notification for replay
    this.notifications.push(notification);

    // Keep only last 1000 notifications to prevent memory leak
    if (this.notifications.length > 1000) {
      this.notifications = this.notifications.slice(-1000);
    }

    // Emit to all listeners
    this.eventEmitter.emit("notification", notification);

    return notification;
  }

  /**
   * Get recent notifications
   */
  getRecentNotifications(limit: number = 10): NotificationEvent[] {
    return this.notifications.slice(-limit);
  }
}
