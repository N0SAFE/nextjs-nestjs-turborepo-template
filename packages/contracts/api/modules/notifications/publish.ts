import { oc } from "@orpc/contract";
import { z } from "zod/v4";
import { notificationEventSchema } from "./schemas";

/**
 * Contract for publishing a new notification
 * 
 * This endpoint allows authenticated users or services to publish notifications
 * that will be broadcast to all connected clients subscribed to the stream.
 */
export const notificationPublishContract = oc
  .route({
    method: "POST",
    path: "/publish",
    summary: "Publish a new notification",
    description:
      "Publish a notification that will be broadcast to all subscribed clients",
  })
  .input(
    z.object({
      type: z.enum(["info", "warning", "error", "success"]),
      message: z.string().min(1).max(500),
      title: z.string().min(1).max(100).optional(),
      userId: z.string().optional().describe("Target specific user (optional)"),
    })
  )
  .output(notificationEventSchema);
