import { oc, eventIterator } from "@orpc/contract";
import { z } from "zod/v4";

/**
 * Test contract with eventIterator as OUTPUT (Server-Sent Events)
 * This contract demonstrates streaming data from server to client
 * This is the most common streaming pattern in oRPC
 */
export const testStreamOutputContract = oc
  .route({
    method: "GET",
    path: "/stream-output",
    summary: "Test streaming output (SSE)",
    description: "Test endpoint that sends streaming data to client using Server-Sent Events",
  })
  .input(
    z.object({
      count: z.number().default(10),
      interval: z.number().default(1000),
      message: z.string().default("Hello"),
    })
  )
  .output(
    eventIterator(
      z.object({
        index: z.number(),
        message: z.string(),
        timestamp: z.number(),
      })
    )
  );

// Define types based on schemas
export type TestStreamOutputInput = {
  count?: number;
  interval?: number;
  message?: string;
};

export type TestStreamOutputOutput = AsyncIterableIterator<{
  index: number;
  message: string;
  timestamp: number;
}>;
