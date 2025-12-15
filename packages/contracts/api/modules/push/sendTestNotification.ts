import { oc } from "@orpc/contract";
import { withRouteMethod } from "@repo/orpc-utils/builder";
import { z } from "zod";

export const sendTestNotificationOutputSchema = z.object({
  success: z.number(),
  failed: z.number(),
  total: z.number(),
});

export const sendTestNotificationContract = withRouteMethod("POST", oc)
  .output(sendTestNotificationOutputSchema)
  .route({
    method: "POST",
    path: "/test",
    summary: "Send test notification",
    description: "Send a test push notification to all user devices",
  });
