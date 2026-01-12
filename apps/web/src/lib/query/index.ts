/**
 * @fileoverview Query Configuration Exports
 * 
 * Centralized exports for all query configuration modules.
 * Import from this file to access timing constants and domain-specific configs.
 */

// Base configuration
export * from './config'

// Domain-specific configurations
export * from './user-config'
export * from './org-config'
export * from './admin-config'

/**
 * @example Using base configuration
 * ```ts
 * import { STALE_TIME, GC_TIME, RETRY } from '@/lib/query'
 * 
 * const myQuery = useQuery({
 *   staleTime: STALE_TIME.DEFAULT,
 *   gcTime: GC_TIME.DEFAULT,
 *   retry: RETRY.COUNT
 * })
 * ```
 * 
 * @example Using domain-specific configuration
 * ```ts
 * import { USER_LIST_OPTIONS, ORG_MEMBERS_OPTIONS, ADMIN_STATS_OPTIONS } from '@/lib/query'
 * 
 * const users = useQuery({ ...USER_LIST_OPTIONS })
 * const members = useQuery({ ...ORG_MEMBERS_OPTIONS })
 * const stats = useQuery({ ...ADMIN_STATS_OPTIONS })
 * ```
 * 
 * @example Using pagination constants
 * ```ts
 * import { PAGINATION, USER_PAGINATION, ORG_PAGINATION } from '@/lib/query'
 * 
 * const defaultPageSize = PAGINATION.DEFAULT_PAGE_SIZE // 20
 * const userPageSize = USER_PAGINATION.PAGE_SIZE // 20
 * const orgMembersPageSize = ORG_PAGINATION.MEMBERS_PAGE_SIZE // 15
 * ```
 */
