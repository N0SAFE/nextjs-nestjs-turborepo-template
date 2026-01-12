'use client'

/**
 * @fileoverview Test Hooks - Generated with @repo/orpc-utils/hooks
 * 
 * This file demonstrates the power of the orpc hooks package.
 * The hooks module automatically:
 * - Detects operation types from contract metadata (GET=query, POST/PUT/DELETE=mutation)
 * - Creates properly typed hooks with full inference
 * - Sets up cache invalidation based on CRUD patterns
 * - Generates composite hooks for common UI patterns
 * 
 * The test module contains various test endpoints for development and testing:
 * - nonAuthenticated: Public test endpoints
 * - authenticated: Protected test endpoints
 * - fileUpload: File upload testing
 * - fileDownload: File download testing
 * - streamOutput: Server-sent events testing
 */

import { createRouterHooks, createCompositeHooks, defineInvalidations } from '@repo/orpc-utils/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { orpc, appContract } from '@/lib/orpc'

// ============================================================================
// GENERATED HOOKS - Automatic from contract
// ============================================================================

/**
 * Custom invalidation configuration for test operations.
 * Test endpoints are typically stateless, minimal invalidation needed.
 */
const testInvalidations = defineInvalidations<typeof appContract.test, typeof orpc.test>(orpc.test, {
  // Test endpoints are typically stateless, no invalidation needed
})

/**
 * Generate all test hooks from the contract.
 * 
 * This single line replaces manual hook creation!
 * The package detects from the contract all nested routers:
 * - test.nonAuthenticated.* → Various query hooks
 * - test.authenticated.* → Various query hooks (requires auth)
 * - test.fileUpload.* → Mutation hooks for file uploads
 * - test.fileDownload.* → Query hooks for file downloads
 * - test.streamOutput.* → Query hooks for SSE streams
 * 
 * IMPORTANT: Pass the raw contract type as the first generic parameter
 * to enable type-level hook discrimination.
 */
const testHooks = createRouterHooks<typeof appContract.test, typeof orpc.test>(orpc.test, {
  invalidations: testInvalidations,
  useQueryClient,
})

/**
 * Composite hooks for common UI patterns.
 * These combine multiple base hooks for specific use cases.
 */
const testComposite = createCompositeHooks(orpc.test, testHooks, {
  useQueryClient,
})

// ============================================================================
// QUERY KEY EXPORTS - For manual cache management
// ============================================================================

/**
 * Query key registry exported from generated hooks.
 * Use these for manual cache operations like prefetching or invalidation.
 * 
 * @example
 * ```ts
 * import { testQueryKeys } from '@/hooks/useTest'
 * import { useQueryClient } from '@tanstack/react-query'
 * 
 * function MyComponent() {
 *   const queryClient = useQueryClient()
 *   
 *   // Prefetch test data
 *   queryClient.prefetchQuery({
 *     queryKey: testQueryKeys.nonAuthenticated(),
 *     queryFn: ...
 *   })
 *   
 *   // Invalidate all test queries
 *   queryClient.invalidateQueries({
 *     queryKey: testQueryKeys.all
 *   })
 * }
 * ```
 */
export const testQueryKeys = testHooks.queryKeys

// ============================================================================
// NAMED EXPORTS - For convenience and discoverability
// ============================================================================
// 
// Instead of re-exporting individual hooks (which can cause TypeScript
// "inaccessible unique symbol" errors), we provide a clean API:
//
// Usage Option 1 - Use the hooks object directly:
//   import { testHooks } from '@/hooks/useTest'
//   const { data } = testHooks.useNonAuthenticated()
//
// Usage Option 2 - Destructure in component:
//   import { testHooks } from '@/hooks/useTest'
//   const { useNonAuthenticated, useAuthenticated } = testHooks
//   const { data } = useNonAuthenticated()
//
// ============================================================================

// Re-export the hooks object for convenient access
export { testHooks, testComposite }

// ============================================================================
// WRAPPER HOOKS - Provide stable named exports for each sub-router
// ============================================================================

/**
 * Hook for non-authenticated test endpoints
 * @example const { data } = useTestNonAuthenticated()
 */
export function useTestNonAuthenticated(...args: Parameters<typeof testHooks.useNonAuthenticated>) {
  return testHooks.useNonAuthenticated(...args)
}

/**
 * Hook for authenticated test endpoints (requires login)
 * @example const { data } = useTestAuthenticated()
 */
export function useTestAuthenticated(...args: Parameters<typeof testHooks.useAuthenticated>) {
  return testHooks.useAuthenticated(...args)
}

/**
 * Hook for file upload testing
 * @example const { mutate } = useTestFileUpload()
 */
export function useTestFileUpload(...args: Parameters<typeof testHooks.useFileUpload>) {
  return testHooks.useFileUpload(...args)
}

/**
 * Hook for file download testing
 * @example const { data } = useTestFileDownload()
 */
export function useTestFileDownload(...args: Parameters<typeof testHooks.useFileDownload>) {
  return testHooks.useFileDownload(...args)
}

/**
 * Hook for SSE stream testing
 * @example const { data } = useTestStreamOutput()
 */
export function useTestStreamOutput(...args: Parameters<typeof testHooks.useStreamOutput>) {
  return testHooks.useStreamOutput(...args)
}

// ============================================================================
// COMPOSITE WRAPPER HOOKS - Common UI patterns
// ============================================================================

/**
 * Hook for managing test operations with mutations and queries
 * @example const { actions, isLoading } = useTestManagement()
 */
export function useTestManagement(...args: Parameters<typeof testComposite.useManagement>) {
  return testComposite.useManagement(...args)
}

/**
 * Hook for paginated test data lists
 * @example const { data, page, setPage } = useTestPaginatedList()
 */
export function useTestPaginatedList(...args: Parameters<typeof testComposite.usePaginatedList>) {
  return testComposite.usePaginatedList(...args)
}

/**
 * Hook for infinite scroll test data
 * @example const { data, fetchNextPage } = useTestInfiniteList()
 */
export function useTestInfiniteList(...args: Parameters<typeof testComposite.useInfiniteList>) {
  return testComposite.useInfiniteList(...args)
}

/**
 * Hook for form data with test operations
 * @example const { formData, handleSubmit } = useTestFormData()
 */
export function useTestFormData(...args: Parameters<typeof testComposite.useFormData>) {
  return testComposite.useFormData(...args)
}

/**
 * Hook for test item selection state
 * @example const { selected, toggle } = useTestSelection()
 */
export function useTestSelection(...args: Parameters<typeof testComposite.useSelection>) {
  return testComposite.useSelection(...args)
}

// ============================================================================
// TYPE EXPORTS - For TypeScript consumers
// ============================================================================

export type {
  RouterHooks,
  ExtractInput,
  ExtractOutput,
} from '@repo/orpc-utils/hooks'

// Infer types from the hooks for use in components
export type TestNonAuthenticatedResult = ReturnType<typeof useTestNonAuthenticated>
export type TestAuthenticatedResult = ReturnType<typeof useTestAuthenticated>
export type TestFileUploadResult = ReturnType<typeof useTestFileUpload>
export type TestFileDownloadResult = ReturnType<typeof useTestFileDownload>
export type TestStreamOutputResult = ReturnType<typeof useTestStreamOutput>
