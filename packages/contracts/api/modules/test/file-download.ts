import { oc } from "@orpc/contract";
import { z } from "zod/v4";

/**
 * Test contract for file download
 * This contract demonstrates how to return files as output using z.file()
 */
export const testFileDownloadContract = oc
  .route({
    method: "GET",
    path: "/file-download",
    summary: "Download a file",
    description: "Test endpoint for downloading files",
  })
  .input(
    z.object({
      fileName: z.string().default("test.txt"),
      content: z.string().default("Hello World"),
    })
  )
  .output(
    z.object({
      file: z.file(),
    })
  );

// Define types based on schemas
export type TestFileDownloadInput = {
  fileName?: string;
  content?: string;
};

export type TestFileDownloadOutput = {
  file: File;
};
