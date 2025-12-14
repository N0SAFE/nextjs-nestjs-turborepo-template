import { oc } from "@orpc/contract";

// Import all test contract definitions
import { testNonAuthenticatedContract } from './non-authenticated';
import { testAuthenticatedContract } from './authenticated';
import { testFileUploadContract } from './file-upload';
import { testFileDownloadContract } from './file-download';
import { testStreamOutputContract } from './stream-output';

// Combine into main test contract
export const testContract = oc.tag("Test").prefix("/test").router({
  nonAuthenticated: testNonAuthenticatedContract,
  authenticated: testAuthenticatedContract,
  fileUpload: testFileUploadContract,
  fileDownload: testFileDownloadContract,
  streamOutput: testStreamOutputContract,
});

export type TestContract = typeof testContract;

// Re-export everything from individual contracts
export * from './non-authenticated';
export * from './authenticated';
export * from './file-upload';
export * from './file-download';
export * from './stream-output';
