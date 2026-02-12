import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

/**
 * Test contract for file upload
 * This contract demonstrates how to accept file uploads using z.file()
 */
export const testFileUploadContract = route({
    method: "POST",
    path: "/file-upload",
    summary: "Upload a file",
    description: "Test endpoint for uploading files with validation",
  })
  .input(
    z.object({
      file: z.file(),
      name: z.string().optional(),
      description: z.string().optional(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      message: z.string().optional(),
    })
  )
  .build();

// Define types based on schemas
export type TestFileUploadInput = {
  file: File;
  name?: string;
  description?: string;
};

export type TestFileUploadOutput = {
  success: boolean;
  fileName: string;
  fileSize: number;
  mimeType: string;
  message?: string;
};
