/**
 * Test Domain - Client Hooks
 * 
 * React hooks for testing various features
 */

'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { testEndpoints } from './endpoints'

// ============================================================================
// QUERY HOOKS (Read Operations)
// ============================================================================

/**
 * Test non-authenticated endpoint
 */
export function useNonAuthenticatedTest() {
  return useQuery(testEndpoints.nonAuthenticated.queryOptions({ input: {} }))
}

/**
 * Test authenticated endpoint
 */
export function useAuthenticatedTest(options?: { enabled?: boolean }) {
  return useQuery(
    testEndpoints.authenticated.queryOptions({
      input: {},
      enabled: options?.enabled,
    }),
  )
}

/**
 * Test file download
 */
export function useFileDownload(filename?: string, options?: { enabled?: boolean }) {
  return useQuery(
    testEndpoints.fileDownload.queryOptions({
      input: { filename: filename ?? '' },
      enabled: options?.enabled ?? !!filename,
    }),
  )
}

// ============================================================================
// MUTATION HOOKS (Write Operations)
// ============================================================================

/**
 * Test file upload mutation
 */
export function useFileUpload() {
  return useMutation(testEndpoints.fileUpload.mutationOptions({}))
}

/**
 * Test SSE stream mutation
 */
export function useStreamOutput() {
  return useMutation(testEndpoints.streamOutput.mutationOptions({}))
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Get all test mutations in one hook
 */
export function useTestActions() {
  const fileUpload = useFileUpload()
  const streamOutput = useStreamOutput()

  return {
    fileUpload,
    streamOutput,
    
    isLoading: {
      fileUpload: fileUpload.isPending,
      streamOutput: streamOutput.isPending,
    },
    
    errors: {
      fileUpload: fileUpload.error,
      streamOutput: streamOutput.error,
    },
  }
}
