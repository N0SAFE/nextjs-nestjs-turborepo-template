import { oc } from "@orpc/contract";
import { z } from "zod";

export const deviceSchema = z.object({
  deviceName: z.string(),
  lastUsed: z.date(),
});

export const getStatsOutputSchema = z.object({
  totalSubscriptions: z.number(),
  activeSubscriptions: z.number(),
  devices: z.array(deviceSchema),
});

export const getStatsContract = oc
  .output(getStatsOutputSchema)
  .route({
    method: "GET",
    path: "/stats",
    summary: "Get push notification stats",
    description: "Get push notification statistics for the current user",
  });
