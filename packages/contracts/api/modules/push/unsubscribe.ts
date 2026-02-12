import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

export const unsubscribeInputSchema = z.object({
  endpoint: z.string(),
});

export const unsubscribeOutputSchema = z.object({
  success: z.boolean(),
});

export const unsubscribeContract = route({
    method: "POST",
    path: "/unsubscribe",
    summary: "Unsubscribe from push notifications",
    description: "Unsubscribe from push notifications for a specific endpoint",
  })
  .input(unsubscribeInputSchema)
  .output(unsubscribeOutputSchema)
  .build();
