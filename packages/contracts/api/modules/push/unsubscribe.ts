import { oc } from "@orpc/contract";
import { withRouteMethod } from "@repo/orpc-utils/builder";
import { z } from "zod";

export const unsubscribeInputSchema = z.object({
  endpoint: z.string(),
});

export const unsubscribeOutputSchema = z.object({
  success: z.boolean(),
});

export const unsubscribeContract = withRouteMethod("POST", oc)
  .input(unsubscribeInputSchema)
  .output(unsubscribeOutputSchema)
  .route({
    method: "POST",
    path: "/unsubscribe",
    summary: "Unsubscribe from push notifications",
    description: "Unsubscribe from push notifications for a specific endpoint",
  });
