/**
 * @fileoverview Centralized Query Configuration
 * 
 * Base configuration for TanStack Query timing, retries, and pagination.
 * Domain-specific configs should extend these base values.
 * 
 * @see apps/web/src/lib/query/user-config.ts - User domain configuration
 * @see apps/web/src/lib/query/org-config.ts - Organization domain configuration
 * @see apps/web/src/lib/query/admin-config.ts - Admin domain configuration
 */

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================

/**
 * Stale time configurations (how long data is considered fresh)
 * 
 * - FAST: Frequently changing data (30s) - real-time features, live dashboards
 * - DEFAULT: Standard data (2min) - most API queries
 * - SLOW: Infrequently changing data (5min) - settings, configurations
 * - STATIC: Nearly static data (30min) - reference data, dropdown options
 */
export const STALE_TIME = {
  FAST: 30_000,      // 30 seconds
  DEFAULT: 120_000,  // 2 minutes
  SLOW: 300_000,     // 5 minutes
  STATIC: 1800_000,  // 30 minutes
} as const

export type StaleTimeKey = keyof typeof STALE_TIME

/**
 * Garbage collection time configurations (how long inactive data stays in cache)
 * 
 * - SHORT: Temporary data (5min) - search results, filtered lists
 * - DEFAULT: Standard caching (10min) - most queries
 * - LONG: Long-term caching (30min) - static data, reference tables
 */
export const GC_TIME = {
  SHORT: 300_000,    // 5 minutes
  DEFAULT: 600_000,  // 10 minutes
  LONG: 1800_000,    // 30 minutes
} as const

export type GcTimeKey = keyof typeof GC_TIME

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

/**
 * Retry configuration for failed queries
 */
export const RETRY = {
  /** Number of retry attempts before giving up */
  COUNT: 3,
  /** Initial delay between retries in milliseconds */
  DELAY: 1000,
  /** Whether to use exponential backoff (delay doubles each retry) */
  EXPONENTIAL_BACKOFF: true,
} as const

/**
 * Helper to calculate retry delay with exponential backoff
 * 
 * @example
 * ```ts
 * const delay = getRetryDelay(2) // Returns 4000ms (4 seconds) for 3rd attempt
 * ```
 */
export function getRetryDelay(failureCount: number): number {
  return RETRY.DELAY * Math.pow(2, failureCount - 1)
}

// ============================================================================
// PAGINATION CONFIGURATION
// ============================================================================

/**
 * Pagination defaults
 */
export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum allowed items per page */
  MAX_PAGE_SIZE: 100,
  /** Initial page number */
  INITIAL_PAGE: 1,
} as const

// ============================================================================
// BASE QUERY OPTIONS
// ============================================================================

/**
 * Base query options that can be used as defaults
 * 
 * @example
 * ```ts
 * import { BASE_QUERY_OPTIONS } from '@/lib/query/config'
 * 
 * useQuery({
 *   ...BASE_QUERY_OPTIONS,
 *   queryKey: ['user', userId],
 *   queryFn: fetchUser,
 * })
 * ```
 */
export const BASE_QUERY_OPTIONS = {
  staleTime: STALE_TIME.DEFAULT,
  gcTime: GC_TIME.DEFAULT,
  retry: RETRY.COUNT,
  retryDelay: getRetryDelay,
  refetchOnWindowFocus: false,
} as const

/**
 * Fast query options for real-time data
 */
export const FAST_QUERY_OPTIONS = {
  staleTime: STALE_TIME.FAST,
  gcTime: GC_TIME.SHORT,
  retry: RETRY.COUNT,
  retryDelay: getRetryDelay,
  refetchOnWindowFocus: true,
} as const

/**
 * Static query options for reference data
 */
export const STATIC_QUERY_OPTIONS = {
  staleTime: STALE_TIME.STATIC,
  gcTime: GC_TIME.LONG,
  retry: RETRY.COUNT,
  retryDelay: getRetryDelay,
  refetchOnWindowFocus: false,
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create custom query options with specific timing
 * 
 * @example
 * ```ts
 * const options = createQueryOptions('SLOW', 'LONG')
 * // Returns { staleTime: 300000, gcTime: 1800000, ... }
 * ```
 */
export function createQueryOptions(
  staleTimeKey: StaleTimeKey = 'DEFAULT',
  gcTimeKey: GcTimeKey = 'DEFAULT'
) {
  return {
    staleTime: STALE_TIME[staleTimeKey],
    gcTime: GC_TIME[gcTimeKey],
    retry: RETRY.COUNT,
    retryDelay: getRetryDelay,
    refetchOnWindowFocus: staleTimeKey === 'FAST',
  } as const
}

/**
 * Get pagination slice from array
 * 
 * @example
 * ```ts
 * const page = paginateArray(items, 2, 20)
 * // Returns items 20-39
 * ```
 */
export function paginateArray<T>(
  items: T[],
  page: number = PAGINATION.INITIAL_PAGE,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): T[] {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return items.slice(start, end)
}

/**
 * Calculate total pages
 * 
 * @example
 * ```ts
 * const totalPages = getTotalPages(95, 20) // Returns 5
 * ```
 */
export function getTotalPages(
  totalItems: number,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): number {
  return Math.ceil(totalItems / pageSize)
}
