/**
 * @fileoverview Query Keys Exports
 * 
 * Centralized exports for all domain-specific query keys.
 * Import from this file to access keys and helper functions.
 */

// Domain-specific query keys
export * from './user'
export * from './organization'
export * from './admin'
export * from './invitation'

/**
 * @example Using domain query keys
 * ```ts
 * import { userKeys, orgKeys, adminKeys, invitationKeys } from '@/lib/query-keys'
 * 
 * // User keys
 * const listKey = userKeys.list()
 * const detailKey = userKeys.detail(userId)
 * 
 * // Organization keys
 * const orgListKey = orgKeys.list()
 * const membersKey = orgKeys.members(orgId)
 * 
 * // Admin keys
 * const statsKey = adminKeys.stats()
 * const auditKey = adminKeys.audit()
 * 
 * // Invitation keys
 * const platformKey = invitationKeys.platformList('pending')
 * const orgInviteKey = invitationKeys.organizationPending()
 * ```
 * 
 * @example Using helper functions
 * ```ts
 * import { invalidateAllUsers, invalidateAllOrganizations } from '@/lib/query-keys'
 * 
 * const queryClient = useQueryClient()
 * 
 * // Invalidate all user-related queries
 * invalidateAllUsers(queryClient)
 * 
 * // Invalidate all organization-related queries
 * invalidateAllOrganizations(queryClient)
 * ```
 */
