import * as z from "zod";
import { route } from "@repo/orpc-utils/builder";

// Define the input for the detailed endpoint
export const healthDetailedInput = z.object({});

// Define the output for the detailed endpoint
export const healthDetailedOutput = z.object({
  status: z.string(),
  timestamp: z.string(),
  service: z.string(),
  uptime: z.coerce.number(),
  memory: z.object({
    used: z.coerce.number(),
    free: z.coerce.number(),
    total: z.coerce.number(),
  }),
  database: z.object({
    status: z.string(),
    timestamp: z.string(),
    responseTime: z.coerce.number().optional(),
    error: z.string().optional(),
  }),
});

// Define the contract
export const healthDetailedContract = route({
    method: "GET",
    path: "/detailed",
    summary: "Detailed health check",
    description: "Provides detailed health information including dependencies",
  })
  .input(healthDetailedInput)
  .output(healthDetailedOutput)
  .build();
