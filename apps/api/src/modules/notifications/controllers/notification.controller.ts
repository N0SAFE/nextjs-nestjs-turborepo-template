import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { notificationContract } from "@repo/api-contracts";
import { NotificationService } from "../services/notification.service";
import { withEventMeta } from "@orpc/server";

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Stream notifications using Server-Sent Events (SSE)
   * 
   * This endpoint returns an async generator that yields notifications in real-time.
   * Clients can reconnect with the last event ID to resume from where they left off.
   */
  @Implement(notificationContract.stream)
  stream() {
    return implement(notificationContract.stream).handler(
      async function* ({ input, signal, lastEventId }) {
        try {
          // Create the notification iterator with optional filtering
          const iterator = this.notificationService.createNotificationIterator(
            input.types,
            lastEventId
          );

          // Stream notifications to client
          for await (const notification of iterator) {
            // Check if client has disconnected
            if (signal?.aborted) {
              console.log("Client disconnected, stopping notification stream");
              break;
            }

            // Yield notification with event metadata for SSE
            yield withEventMeta(notification, {
              id: notification.id,
              retry: 5000, // Client should retry after 5 seconds on connection loss
            });
          }
        } finally {
          // Cleanup logic runs when the stream ends (client disconnect or error)
          console.log("Notification stream ended");
        }
      }.bind(this)
    );
  }

  /**
   * Publish a new notification
   * 
   * This endpoint allows authenticated users/services to publish notifications
   * that will be broadcast to all connected clients.
   */
  @Implement(notificationContract.publish)
  publish() {
    return implement(notificationContract.publish).handler(
      async ({ input }) => {
        // Publish the notification
        const notification = await this.notificationService.publishNotification(
          input
        );

        return notification;
      }
    );
  }
}
