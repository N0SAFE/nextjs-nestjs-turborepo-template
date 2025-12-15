import { oc } from "@orpc/contract";
import { withRouteMethod } from "@repo/orpc-utils/builder";
import { z } from "zod/v4";

/**
 * Test contract for authenticated ORPC endpoint
 * This contract demonstrates a simple GET request that requires authentication
 */
export const testAuthenticatedContract = withRouteMethod("GET", oc)
  .route({
    method: "GET",
    path: "/authenticated",
    summary: "Test authenticated endpoint",
    description: "A test endpoint that requires authentication via middleware",
  })
  .input(z.object({}))
  .output(
    z.object({
      ok: z.boolean(),
      userId: z.string().optional(),
      message: z.string().optional(),
    })
  );

// Define types based on schemas
export type TestAuthenticatedInput = Record<string, never>;
export type TestAuthenticatedOutput = {
  ok: boolean;
  userId?: string;
  message?: string;
};
