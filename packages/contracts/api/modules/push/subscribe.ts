import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

const subscriptionKeysSchema = z.object({
  p256dh: z.string(),
  auth: z.string(),
});

export const subscribeInputSchema = z.object({
  endpoint: z.string(),
  keys: subscriptionKeysSchema,
  deviceName: z.string().optional(),
  userAgent: z.string().optional(),
});

export const subscribeOutputSchema = z.object({
  id: z.string(),
  deviceName: z.string().nullable(),
  createdAt: z.date(),
});

export const subscribeContract = route({
    method: "POST",
    path: "/subscribe",
    summary: "Subscribe to push notifications",
    description: "Subscribe the current user to push notifications",
  })
  .input(subscribeInputSchema)
  .output(subscribeOutputSchema)
  .build();
