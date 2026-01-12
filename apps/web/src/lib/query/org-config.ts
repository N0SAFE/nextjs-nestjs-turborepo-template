/**
 * @fileoverview Organization Domain Query Configuration
 * 
 * Query timing and caching configuration for organization-related data.
 * Extends base query configuration with organization-specific optimizations.
 * 
 * @see apps/web/src/lib/query/config.ts - Base configuration
 */

import { createQueryOptions, PAGINATION } from './config'

// ============================================================================
// ORGANIZATION QUERY OPTIONS
// ============================================================================

/**
 * Query options for organization list (changes moderately)
 * Stale after 2 minutes, kept in cache for 10 minutes
 * Users may switch between orgs frequently
 */
export const ORG_LIST_OPTIONS = createQueryOptions('DEFAULT', 'DEFAULT')

/**
 * Query options for current organization details (changes moderately)
 * Stale after 2 minutes, kept in cache for 10 minutes
 */
export const ORG_DETAIL_OPTIONS = createQueryOptions('DEFAULT', 'DEFAULT')

/**
 * Query options for organization members (changes moderately)
 * Stale after 2 minutes, kept in cache for 10 minutes
 * Member list may change due to invitations
 */
export const ORG_MEMBERS_OPTIONS = createQueryOptions('DEFAULT', 'DEFAULT')

/**
 * Query options for organization invitations (changes frequently)
 * Stale after 30 seconds, kept in cache for 5 minutes
 * Invitations have time-sensitive state (pending/accepted/rejected)
 */
export const ORG_INVITATIONS_OPTIONS = createQueryOptions('FAST', 'SHORT')

/**
 * Query options for organization roles (static reference data)
 * Stale after 30 minutes, kept in cache for 30 minutes
 * Roles rarely change once organization is established
 */
export const ORG_ROLES_OPTIONS = createQueryOptions('STATIC', 'LONG')

/**
 * Query options for organization settings (changes rarely)
 * Stale after 5 minutes, kept in cache for 30 minutes
 */
export const ORG_SETTINGS_OPTIONS = createQueryOptions('SLOW', 'LONG')

/**
 * Query options for organization stats/analytics (changes slowly)
 * Stale after 5 minutes, kept in cache for 10 minutes
 */
export const ORG_STATS_OPTIONS = createQueryOptions('SLOW', 'DEFAULT')

// ============================================================================
// ORGANIZATION PAGINATION
// ============================================================================

/**
 * Pagination configuration for organization data
 */
export const ORG_PAGINATION = {
  /** Items per page in organization lists */
  PAGE_SIZE: 20,
  /** Items per page in member lists */
  MEMBERS_PAGE_SIZE: 15,
  /** Items per page in invitation lists */
  INVITATIONS_PAGE_SIZE: 10,
  /** Maximum items per page */
  MAX_PAGE_SIZE: PAGINATION.MAX_PAGE_SIZE,
} as const

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * @example Organization switcher
 * ```ts
 * import { orgHooks } from '@/hooks/useOrganization'
 * import { ORG_LIST_OPTIONS } from '@/lib/query/org-config'
 * 
 * function OrgSwitcher() {
 *   const { data: orgs } = orgHooks.useList(ORG_LIST_OPTIONS)
 *   // List cached for 2 minutes, users can switch orgs without refetching
 * }
 * ```
 * 
 * @example Organization dashboard
 * ```ts
 * import { orgHooks } from '@/hooks/useOrganization'
 * import { ORG_DETAIL_OPTIONS, ORG_STATS_OPTIONS } from '@/lib/query/org-config'
 * 
 * function OrgDashboard({ orgId }: { orgId: string }) {
 *   const { data: org } = orgHooks.useDetail(orgId, ORG_DETAIL_OPTIONS)
 *   const { data: stats } = orgHooks.useStats(orgId, ORG_STATS_OPTIONS)
 * }
 * ```
 * 
 * @example Members management
 * ```ts
 * import { orgHooks } from '@/hooks/useOrganization'
 * import { ORG_MEMBERS_OPTIONS, ORG_PAGINATION } from '@/lib/query/org-config'
 * 
 * function MembersPage() {
 *   const { data } = orgHooks.useMembers({
 *     ...ORG_MEMBERS_OPTIONS,
 *     pagination: { pageSize: ORG_PAGINATION.MEMBERS_PAGE_SIZE }
 *   })
 * }
 * ```
 * 
 * @example Invitation management (time-sensitive)
 * ```ts
 * import { orgHooks } from '@/hooks/useOrganization'
 * import { ORG_INVITATIONS_OPTIONS, ORG_PAGINATION } from '@/lib/query/org-config'
 * 
 * function InvitationsPage() {
 *   const { data } = orgHooks.useInvitations({
 *     ...ORG_INVITATIONS_OPTIONS,
 *     pagination: { pageSize: ORG_PAGINATION.INVITATIONS_PAGE_SIZE }
 *   })
 *   // Fast stale time (30s) ensures invitation state is current
 * }
 * ```
 * 
 * @example Organization settings
 * ```ts
 * import { orgHooks } from '@/hooks/useOrganization'
 * import { ORG_SETTINGS_OPTIONS } from '@/lib/query/org-config'
 * 
 * function OrgSettings({ orgId }: { orgId: string }) {
 *   const { data: settings } = orgHooks.useSettings(orgId, ORG_SETTINGS_OPTIONS)
 *   // Slow stale time (5m) - settings rarely change
 * }
 * ```
 */
