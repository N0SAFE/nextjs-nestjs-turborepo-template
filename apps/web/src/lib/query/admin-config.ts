/**
 * @fileoverview Admin Domain Query Configuration
 * 
 * Query timing and caching configuration for admin-related data.
 * Extends base query configuration with admin-specific optimizations.
 * 
 * @see apps/web/src/lib/query/config.ts - Base configuration
 */

import { createQueryOptions, PAGINATION } from './config'

// ============================================================================
// ADMIN QUERY OPTIONS
// ============================================================================

/**
 * Query options for admin dashboard stats (real-time)
 * Stale after 30 seconds, kept in cache for 5 minutes
 * Auto-refetches on window focus for live monitoring
 */
export const ADMIN_STATS_OPTIONS = createQueryOptions('FAST', 'SHORT')

/**
 * Query options for audit logs (moderately changing)
 * Stale after 2 minutes, kept in cache for 10 minutes
 */
export const ADMIN_AUDIT_OPTIONS = createQueryOptions('DEFAULT', 'DEFAULT')

/**
 * Query options for system settings (changes rarely)
 * Stale after 5 minutes, kept in cache for 30 minutes
 */
export const ADMIN_SETTINGS_OPTIONS = createQueryOptions('SLOW', 'LONG')

/**
 * Query options for system health checks (real-time)
 * Stale after 30 seconds, kept in cache for 5 minutes
 */
export const ADMIN_HEALTH_OPTIONS = createQueryOptions('FAST', 'SHORT')

/**
 * Query options for admin user list (moderately changing)
 * Stale after 2 minutes, kept in cache for 10 minutes
 */
export const ADMIN_USER_LIST_OPTIONS = createQueryOptions('DEFAULT', 'DEFAULT')

/**
 * Query options for platform roles (static reference data)
 * Stale after 30 minutes, kept in cache for 30 minutes
 */
export const ADMIN_ROLES_OPTIONS = createQueryOptions('STATIC', 'LONG')

/**
 * Query options for platform permissions (static reference data)
 * Stale after 30 minutes, kept in cache for 30 minutes
 */
export const ADMIN_PERMISSIONS_OPTIONS = createQueryOptions('STATIC', 'LONG')

// ============================================================================
// ADMIN PAGINATION
// ============================================================================

/**
 * Pagination configuration for admin data tables
 */
export const ADMIN_PAGINATION = {
  /** Items per page in admin tables */
  PAGE_SIZE: 25,
  /** Items per page in admin audit logs */
  AUDIT_PAGE_SIZE: 50,
  /** Items per page in admin compact views */
  COMPACT_PAGE_SIZE: 10,
  /** Maximum items per page */
  MAX_PAGE_SIZE: PAGINATION.MAX_PAGE_SIZE,
} as const

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example Admin dashboard
 * ```ts
 * import { adminHooks } from '@/hooks/useAdmin'
 * import { ADMIN_STATS_OPTIONS } from '@/lib/query/admin-config'
 * 
 * function AdminDashboard() {
 *   const { data: stats } = adminHooks.useStats(ADMIN_STATS_OPTIONS)
 *   // Stats refetch every 30s and on window focus
 * }
 * ```
 * 
 * @example Admin user management
 * ```ts
 * import { adminHooks } from '@/hooks/useAdmin'
 * import { ADMIN_USER_LIST_OPTIONS, ADMIN_PAGINATION } from '@/lib/query/admin-config'
 * 
 * function AdminUsers() {
 *   const { data } = adminHooks.useUserList({
 *     ...ADMIN_USER_LIST_OPTIONS,
 *     pagination: { pageSize: ADMIN_PAGINATION.PAGE_SIZE }
 *   })
 * }
 * ```
 * 
 * @example Audit logs
 * ```ts
 * import { adminHooks } from '@/hooks/useAdmin'
 * import { ADMIN_AUDIT_OPTIONS, ADMIN_PAGINATION } from '@/lib/query/admin-config'
 * 
 * function AuditLog() {
 *   const { data } = adminHooks.useAuditLog({
 *     ...ADMIN_AUDIT_OPTIONS,
 *     pagination: { pageSize: ADMIN_PAGINATION.AUDIT_PAGE_SIZE }
 *   })
 * }
 * ```
 * 
 * @example System health monitoring
 * ```ts
 * import { healthHooks } from '@/hooks/useHealth'
 * import { ADMIN_HEALTH_OPTIONS } from '@/lib/query/admin-config'
 * 
 * function HealthMonitor() {
 *   const { data: health } = healthHooks.useCheck(ADMIN_HEALTH_OPTIONS)
 *   // Auto-refreshes every 30s for real-time monitoring
 * }
 * ```
 */
