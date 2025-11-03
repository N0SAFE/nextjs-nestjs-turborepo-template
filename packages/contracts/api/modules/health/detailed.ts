import { oc } from "@orpc/contract";
import { z } from "zod/v4";

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
export const healthDetailedContract = oc
  .route({
    method: "GET",
    path: "/detailed",
    summary: "Detailed health check",
    description: "Get detailed information about the health of the service",
  })
  .input(healthDetailedInput)
  .output(healthDetailedOutput);
