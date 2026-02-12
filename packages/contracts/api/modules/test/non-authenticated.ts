import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

/**
 * Test contract for non-authenticated ORPC endpoint
 * This contract demonstrates a simple GET request without authentication
 */
export const testNonAuthenticatedContract = route({
    method: "GET",
    path: "/non-authenticated",
    summary: "Test non-authenticated endpoint",
    description: "A simple test endpoint that does not require authentication",
  })
  .input(z.object({}))
  .output(
    z.object({
      ok: z.boolean(),
      message: z.string().optional(),
    })
  )
  .build();

// Define types based on schemas
export type TestNonAuthenticatedInput = Record<string, never>;
export type TestNonAuthenticatedOutput = {
  ok: boolean;
  message?: string;
};
