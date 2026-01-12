'use client'

/**
 * @fileoverview Health Hooks - Generated with @repo/orpc-utils/hooks
 * 
 * This file demonstrates the power of the orpc hooks package.
 * The hooks module automatically:
 * - Detects operation types from contract metadata (GET=query, POST/PUT/DELETE=mutation)
 * - Creates properly typed hooks with full inference
 * - Sets up cache invalidation based on CRUD patterns
 * - Generates composite hooks for common UI patterns
 */

import { createRouterHooks, createCompositeHooks, defineInvalidations } from '@repo/orpc-utils/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { orpc, appContract } from '@/lib/orpc'

// ============================================================================
// GENERATED HOOKS - Automatic from contract
// ============================================================================

/**
 * Custom invalidation configuration for health operations.
 * Health checks are read-only, so no invalidations are needed.
 */
const healthInvalidations = defineInvalidations<typeof appContract.health, typeof orpc.health>(orpc.health, {
  // Health checks are read-only, no invalidation needed
})

/**
 * Generate all health hooks from the contract.
 * 
 * This single line replaces manual hook creation!
 * The package detects from the contract:
 * - check: GET /health → useQuery hook
 * - detailed: GET /health/detailed → useQuery hook
 * 
 * IMPORTANT: Pass the raw contract type as the first generic parameter
 * to enable type-level hook discrimination.
 */
const healthHooks = createRouterHooks<typeof appContract.health, typeof orpc.health>(orpc.health, {
  invalidations: healthInvalidations,
  useQueryClient,
})

/**
 * Composite hooks for common UI patterns.
 * These combine multiple base hooks for specific use cases.
 */
const healthComposite = createCompositeHooks(orpc.health, healthHooks, {
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
 * import { healthQueryKeys } from '@/hooks/useHealth'
 * import { useQueryClient } from '@tanstack/react-query'
 * 
 * function MyComponent() {
 *   const queryClient = useQueryClient()
 *   
 *   // Prefetch health check
 *   queryClient.prefetchQuery({
 *     queryKey: healthQueryKeys.check(),
 *     queryFn: ...
 *   })
 *   
 *   // Invalidate all health queries
 *   queryClient.invalidateQueries({
 *     queryKey: healthQueryKeys.all
 *   })
 * }
 * ```
 */
export const healthQueryKeys = healthHooks.queryKeys

// ============================================================================
// NAMED EXPORTS - For convenience and discoverability
// ============================================================================
// 
// Instead of re-exporting individual hooks (which can cause TypeScript
// "inaccessible unique symbol" errors), we provide a clean API:
//
// Usage Option 1 - Use the hooks object directly:
//   import { healthHooks } from '@/hooks/useHealth'
//   const { data } = healthHooks.useCheck()
//
// Usage Option 2 - Destructure in component:
//   import { healthHooks } from '@/hooks/useHealth'
//   const { useCheck, useDetailed } = healthHooks
//   const { data } = useCheck()
//
// ============================================================================

// Re-export the hooks object for convenient access
export { healthHooks, healthComposite }

// ============================================================================
// WRAPPER HOOKS - Provide stable named exports
// ============================================================================

/**
 * Hook to check basic health status
 * @example const { data } = useHealthCheck()
 */
export function useHealthCheck(...args: Parameters<typeof healthHooks.useCheck>) {
  return healthHooks.useCheck(...args)
}

/**
 * Hook to check detailed health status with all subsystems
 * @example const { data } = useHealthDetailed()
 */
export function useHealthDetailed(...args: Parameters<typeof healthHooks.useDetailed>) {
  return healthHooks.useDetailed(...args)
}

// ============================================================================
// COMPOSITE HOOKS - Advanced UI patterns
// ============================================================================

/**
 * Complete health monitoring with combined loading/error states.
 * Perfect for admin dashboards and status pages.
 * 
 * @example
 * ```tsx
 * const { 
 *   list, isLoading, isAnyMutating 
 * } = useHealthManagement()
 * ```
 */
export function useHealthManagement(...args: Parameters<typeof healthComposite.useManagement>) {
  return healthComposite.useManagement(...args)
}

/**
 * Paginated health check list with page controls.
 * 
 * @example
 * ```tsx
 * const { 
 *   data, page, setPage, hasNext, hasPrev 
 * } = useHealthPaginatedList({ pageSize: 10 })
 * ```
 */
export function useHealthPaginatedList(...args: Parameters<typeof healthComposite.usePaginatedList>) {
  return healthComposite.usePaginatedList(...args)
}

/**
 * Infinite scroll pattern with automatic loading.
 * 
 * @example
 * ```tsx
 * const { 
 *   items, loadMore, hasMore, isLoadingMore 
 * } = useHealthInfiniteList({ pageSize: 20 })
 * ```
 */
export function useHealthInfiniteList(...args: Parameters<typeof healthComposite.useInfiniteList>) {
  return healthComposite.useInfiniteList(...args)
}

/**
 * Form data management with optimistic updates.
 * 
 * @example
 * ```tsx
 * const { 
 *   data, update, isUpdating 
 * } = useHealthFormData(healthId)
 * ```
 */
export function useHealthFormData(...args: Parameters<typeof healthComposite.useFormData>) {
  return healthComposite.useFormData(...args)
}

/**
 * Bulk selection and operations.
 * 
 * @example
 * ```tsx
 * const { 
 *   selectedIds, toggleSelection, bulkDelete, isDeleting 
 * } = useHealthSelection()
 * ```
 */
export function useHealthSelection(...args: Parameters<typeof healthComposite.useSelection>) {
  return healthComposite.useSelection(...args)
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
export type HealthCheckResult = ReturnType<typeof useHealthCheck>
export type HealthDetailedResult = ReturnType<typeof useHealthDetailed>
