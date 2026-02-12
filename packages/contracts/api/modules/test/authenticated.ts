import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

/**
 * Test contract for authenticated ORPC endpoint
 * This contract demonstrates a simple GET request that requires authentication
 */
export const testAuthenticatedContract = route({
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
  )
  .build();

// Define types based on schemas
export type TestAuthenticatedInput = Record<string, never>;
export type TestAuthenticatedOutput = {
  ok: boolean;
  userId?: string;
  message?: string;
};
