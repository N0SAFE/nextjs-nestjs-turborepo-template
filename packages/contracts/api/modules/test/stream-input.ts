import { oc, eventIterator } from "@orpc/contract";
import { z } from "zod/v4";

/**
 * Test contract with eventIterator as INPUT (client -> server stream)
 * This contract demonstrates streaming data from client to server.
 */
export const testStreamInputContract = oc
  .route({
    method: "POST",
    path: "/stream-input",
    summary: "Test streaming input",
    description: "Test endpoint that receives streaming data from client",
  })
  .input(
    z.object({
      stream: eventIterator(
        z.object({
          message: z.string(),
          timestamp: z.number(),
        })
      ),
      metadata: z
        .object({
          sessionId: z.string(),
        })
        .optional(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      receivedCount: z.number(),
      message: z.string(),
    })
  );

export type TestStreamInputInput = {
  stream: AsyncIterableIterator<{ message: string; timestamp: number }>;
  metadata?: { sessionId: string };
};

export type TestStreamInputOutput = {
  success: boolean;
  receivedCount: number;
  message: string;
};
