'use client'

/**
 * @fileoverview Health Hooks - Domain-based Pattern
 * 
 * This file provides React hooks for health check operations using the new
 * domain-based approach with direct TanStack Query usage.
 * 
 * Pattern:
 * - Import endpoints from domain
 * - Use direct useQuery/useMutation
 * - No package utilities (defineInvalidations, createRouterHooks, etc.)
 * - Simple, maintainable, type-safe
 */

import { useQuery } from '@tanstack/react-query'
import { healthEndpoints } from './endpoints'

/**
 * Hook to perform basic health check
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useHealthCheck()
 * if (data?.status === 'ok') {
 *   // System is healthy
 * }
 * ```
 */
export function useHealthCheck(options?: { enabled?: boolean }) {
  return useQuery(healthEndpoints.check.queryOptions({
    input: {},
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30, // 30 seconds - health checks should be fresh
    gcTime: 1000 * 60, // 1 minute
  }))
}

/**
 * Hook to perform detailed health check with subsystem status
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useHealthDetailed()
 * console.log(data?.subsystems) // { database: 'ok', redis: 'ok', ... }
 * ```
 */
export function useHealthDetailed(options?: { enabled?: boolean }) {
  return useQuery(healthEndpoints.detailed.queryOptions({
    input: {},
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  }))
}

/**
 * Query keys for manual cache operations
 * 
 * @example
 * ```ts
 * import { healthQueryKeys } from '@/domains/health/hooks'
 * import { useQueryClient } from '@tanstack/react-query'
 * 
 * function MyComponent() {
 *   const queryClient = useQueryClient()
 *   
 *   // Invalidate health checks
 *   queryClient.invalidateQueries({
 *     queryKey: healthQueryKeys.check()
 *   })
 * }
 * ```
 */
export const healthQueryKeys = {
  all: ['health'] as const,
  check: () => healthEndpoints.check.queryKey({ input: {} }),
  detailed: () => healthEndpoints.detailed.queryKey({ input: {} }),
}

/**
 * Type exports for use in components
 */
export type HealthCheckResult = ReturnType<typeof useHealthCheck>
export type HealthDetailedResult = ReturnType<typeof useHealthDetailed>
