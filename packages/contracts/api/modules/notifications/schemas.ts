import { z } from "zod/v4";

/**
 * Schema for a notification event
 */
export const notificationEventSchema = z.object({
  id: z.string(),
  type: z.enum(["info", "warning", "error", "success"]),
  message: z.string(),
  title: z.string().optional(),
  timestamp: z.string().datetime(),
  userId: z.string().optional(),
});

export type NotificationEvent = z.infer<typeof notificationEventSchema>;
