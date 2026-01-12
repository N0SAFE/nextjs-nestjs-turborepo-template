/**
 * @fileoverview User Domain Query Configuration
 * 
 * Query timing and caching configuration for user-related data.
 * Extends base query configuration with domain-specific optimizations.
 * 
 * @see apps/web/src/lib/query/config.ts - Base configuration
 */

import { createQueryOptions, PAGINATION } from './config'

// ============================================================================
// USER QUERY OPTIONS
// ============================================================================

/**
 * Query options for user list (moderately changing data)
 * Stale after 2 minutes, kept in cache for 10 minutes
 */
export const USER_LIST_OPTIONS = createQueryOptions('DEFAULT', 'DEFAULT')

/**
 * Query options for single user profile (changes less frequently)
 * Stale after 5 minutes, kept in cache for 30 minutes
 */
export const USER_PROFILE_OPTIONS = createQueryOptions('SLOW', 'LONG')

/**
 * Query options for current user session (real-time)
 * Stale after 30 seconds, kept in cache for 5 minutes
 * Refetches on window focus for up-to-date session state
 */
export const USER_SESSION_OPTIONS = createQueryOptions('FAST', 'SHORT')

/**
 * Query options for user count/statistics (static-ish data)
 * Stale after 5 minutes, kept in cache for 30 minutes
 */
export const USER_COUNT_OPTIONS = createQueryOptions('SLOW', 'LONG')

/**
 * Query options for user permissions (changes rarely)
 * Stale after 30 minutes, kept in cache for 30 minutes
 */
export const USER_PERMISSIONS_OPTIONS = createQueryOptions('STATIC', 'LONG')

// ============================================================================
// USER PAGINATION
// ============================================================================

/**
 * Pagination configuration for user lists
 */
export const USER_PAGINATION = {
  /** Users per page in list views */
  PAGE_SIZE: PAGINATION.DEFAULT_PAGE_SIZE,
  /** Users per page in compact views (dropdowns, selectors) */
  COMPACT_PAGE_SIZE: 10,
  /** Maximum users per page */
  MAX_PAGE_SIZE: PAGINATION.MAX_PAGE_SIZE,
} as const

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example User list query
 * ```ts
 * import { userHooks } from '@/hooks/useUser'
 * import { USER_LIST_OPTIONS } from '@/lib/query/user-config'
 * 
 * function UserList() {
 *   const { data } = userHooks.useList({
 *     ...USER_LIST_OPTIONS,
 *     pagination: { pageSize: USER_PAGINATION.PAGE_SIZE }
 *   })
 * }
 * ```
 * 
 * @example Current user session
 * ```ts
 * import { useSession } from '@/lib/auth'
 * import { USER_SESSION_OPTIONS } from '@/lib/query/user-config'
 * 
 * function UserProfile() {
 *   const { data: session } = useSession(USER_SESSION_OPTIONS)
 * }
 * ```
 * 
 * @example User permissions
 * ```ts
 * import { usePermissions } from '@/hooks/usePermissions'
 * import { USER_PERMISSIONS_OPTIONS } from '@/lib/query/user-config'
 * 
 * function PermissionCheck() {
 *   const { data: permissions } = usePermissions({
 *     ...USER_PERMISSIONS_OPTIONS,
 *     userId: currentUserId
 *   })
 * }
 * ```
 */
