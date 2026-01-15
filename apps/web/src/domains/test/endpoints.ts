import { orpc } from '@/lib/orpc'

/**
 * Test domain endpoints
 * 
 * All test endpoints use ORPC contracts directly for development and testing purposes.
 * Includes various test scenarios for different features.
 */
export const testEndpoints = {
  /**
   * Non-authenticated test endpoints (public)
   */
  nonAuthenticated: orpc.test.nonAuthenticated,
  
  /**
   * Authenticated test endpoints (requires login)
   */
  authenticated: orpc.test.authenticated,
  
  /**
   * File upload testing
   */
  fileUpload: orpc.test.fileUpload,
  
  /**
   * File download testing
   */
  fileDownload: orpc.test.fileDownload,
  
  /**
   * Server-sent events (SSE) stream testing
   */
  streamOutput: orpc.test.streamOutput,
} as const

export type TestEndpoints = typeof testEndpoints
