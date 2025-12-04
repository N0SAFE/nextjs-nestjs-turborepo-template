import { oc } from "@orpc/contract";
import { z } from "zod";

export const sendTestNotificationOutputSchema = z.object({
  success: z.number(),
  failed: z.number(),
  total: z.number(),
});

export const sendTestNotificationContract = oc
  .output(sendTestNotificationOutputSchema)
  .route({
    method: "POST",
    path: "/test",
    summary: "Send test notification",
    description: "Send a test push notification to all user devices",
  });
