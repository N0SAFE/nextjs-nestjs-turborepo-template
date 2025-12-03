import { oc } from "@orpc/contract";
import { z } from "zod/v4";
import { notificationEventSchema } from "./schemas";

/**
 * Contract for streaming notifications using Server-Sent Events (SSE)
 * 
 * This endpoint provides real-time notification streaming to clients.
 * The stream automatically reconnects with the last event ID to resume from where it left off.
 */
export const notificationStreamContract = oc
  .route({
    method: "GET",
    path: "/stream",
    summary: "Stream notifications in real-time",
    description:
      "Subscribe to real-time notification stream using Server-Sent Events. Supports filtering by notification types and automatic reconnection.",
  })
  .input(
    z.object({
      types: z
        .array(z.enum(["info", "warning", "error", "success"]))
        .optional()
        .describe("Filter notifications by type"),
    })
  )
  .output(
    z.object({
      __iteratorType: z.literal("event").optional(),
      __event: notificationEventSchema,
    })
  );
