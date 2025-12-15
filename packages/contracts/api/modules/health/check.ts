import { oc } from "@orpc/contract";
import { withRouteMethod } from "@repo/orpc-utils/builder";
import { z } from "zod/v4";

// Define the input for the check endpoint
export const healthCheckInput = z.object({});

// Define the output for the check endpoint
export const healthCheckOutput = z.object({
  status: z.string(),
  timestamp: z.string(),
  service: z.string().optional(),
});

// Define the contract
export const healthCheckContract = withRouteMethod("GET", oc)
  .route({
    method: "GET",
    path: "/",
    summary: "Health check endpoint",
    description: "Returns a simple health status",
  })
  .input(healthCheckInput)
  .output(healthCheckOutput);
