import { oc, eventIterator } from "@orpc/contract";
import { z } from "zod/v4";

/**
 * Test contract with streaming in BOTH directions.
 * Client sends an input stream; server responds with an output stream.
 */
export const testStreamBidirectionalContract = oc
  .route({
    method: "POST",
    path: "/stream-bidirectional",
    summary: "Test bidirectional streaming",
    description:
      "Test endpoint with streaming in both directions - client sends stream, server responds with stream",
  })
  .input(
    z.object({
      stream: eventIterator(
        z.object({
          message: z.string(),
          clientTimestamp: z.number(),
        })
      ),
      metadata: z.object({
        sessionId: z.string(),
        userId: z.string(),
      }),
    })
  )
  .output(
    eventIterator(
      z.object({
        response: z.string(),
        originalMessage: z.string(),
        serverTimestamp: z.number(),
        processed: z.boolean(),
      })
    )
  );

export type TestStreamBidirectionalInput = {
  stream: AsyncIterableIterator<{ message: string; clientTimestamp: number }>;
  metadata: { sessionId: string; userId: string };
};

export type TestStreamBidirectionalOutput = AsyncIterableIterator<{
  response: string;
  originalMessage: string;
  serverTimestamp: number;
  processed: boolean;
}>;
