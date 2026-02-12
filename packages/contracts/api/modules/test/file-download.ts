import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

/**
 * Test contract for file download
 * This contract demonstrates how to return files using z.file()
 */
export const testFileDownloadContract = route({
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
  )
  .build();

// Define types based on schemas
export type TestFileDownloadInput = {
  fileName?: string;
  content?: string;
};

export type TestFileDownloadOutput = {
  file: File;
};
