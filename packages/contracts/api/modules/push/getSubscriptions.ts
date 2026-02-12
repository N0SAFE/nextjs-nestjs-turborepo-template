import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

export const subscriptionSchema = z.object({
  id: z.string(),
  endpoint: z.string(),
  deviceName: z.string().nullable(),
  userAgent: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  lastUsedAt: z.date().nullable(),
});

export const getSubscriptionsOutputSchema = z.object({
  subscriptions: z.array(subscriptionSchema),
});

export const getSubscriptionsContract = route({
    method: "GET",
    path: "/subscriptions",
    summary: "Get user subscriptions",
    description: "Get all active push notification subscriptions for the current user",
  })
  .output(getSubscriptionsOutputSchema)
  .build();
