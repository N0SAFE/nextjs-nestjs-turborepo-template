/**
 * @fileoverview Organization Domain Query Keys
 * 
 * Centralized query keys for organization-related queries.
 * Combines Better Auth organization keys with custom domain keys.
 * 
 * @see apps/web/src/hooks/useOrganization.ts - Better Auth organization hooks
 */

import type { QueryClient } from '@tanstack/react-query'

// ============================================================================
// BETTER AUTH KEYS (From Better Auth plugin)
// ============================================================================

/**
 * Organization query keys from Better Auth
 * 
 * Available keys from Better Auth:
 * - orgKeys.all - Base key: ['organization']
 * - orgKeys.list() - Organization list
 * - orgKeys.detail(orgId) - Organization details
 * - orgKeys.members(orgId) - Organization members
 * - orgKeys.invitations(orgId) - Organization invitations
 * 
 * @example Usage with Better Auth hooks
 * ```ts
 * import { useOrganization } from '@/hooks/useOrganization'
 * 
 * const { data: orgs } = useOrganization((ba) => ba.useListOrganizations())
 * ```
 */
export const orgKeys = {
  /** Base key for all organization queries */
  all: ['organization'] as const,
  
  /** Organization list */
  list: () => [...orgKeys.all, 'list'] as const,
  
  /** Organization details by ID */
  detail: (orgId: string) => [...orgKeys.all, 'detail', orgId] as const,
  
  /** Organization members */
  members: (orgId: string) => [...orgKeys.all, 'members', orgId] as const,
  
  /** Organization invitations */
  invitations: (orgId: string) => [...orgKeys.all, 'invitations', orgId] as const,
  
  /** Organization roles */
  roles: (orgId: string) => [...orgKeys.all, 'roles', orgId] as const,
} as const

// ============================================================================
// CUSTOM KEYS (Domain-specific extensions)
// ============================================================================

/**
 * Custom organization query keys for non-Better Auth queries
 * 
 * @example Organization settings
 * ```ts
 * const { data } = useQuery({
 *   queryKey: orgCustomKeys.settings(orgId),
 *   queryFn: () => fetchOrgSettings(orgId)
 * })
 * ```
 * 
 * @example Organization stats
 * ```ts
 * const { data } = useQuery({
 *   queryKey: orgCustomKeys.stats(orgId),
 *   queryFn: () => fetchOrgStats(orgId)
 * })
 * ```
 */
export const orgCustomKeys = {
  /** Base key for custom org queries */
  all: ['organization', 'custom'] as const,
  
  /** Organization settings */
  settings: (orgId: string) => [...orgCustomKeys.all, 'settings', orgId] as const,
  
  /** Organization stats/analytics */
  stats: (orgId: string, options?: { period?: string }) => 
    [...orgCustomKeys.all, 'stats', orgId, options] as const,
  
  /** Organization activity log */
  activity: (orgId: string, options?: { limit?: number }) => 
    [...orgCustomKeys.all, 'activity', orgId, options] as const,
  
  /** Organization projects/features */
  projects: (orgId: string) => [...orgCustomKeys.all, 'projects', orgId] as const,
  
  /** Organization billing/subscription */
  billing: (orgId: string) => [...orgCustomKeys.all, 'billing', orgId] as const,
} as const

// ============================================================================
// INVALIDATION HELPERS
// ============================================================================

/**
 * Helper functions for common organization cache invalidation patterns
 * 
 * @example Invalidate all organization queries
 * ```ts
 * import { invalidateOrgQueries } from '@/lib/query-keys/organization'
 * 
 * const handleOrgUpdate = () => {
 *   invalidateOrgQueries.all(queryClient)
 * }
 * ```
 * 
 * @example Invalidate specific organization
 * ```ts
 * const handleMemberAdd = (orgId: string) => {
 *   invalidateOrgQueries.byId(queryClient, orgId)
 * }
 * ```
 */
export const invalidateOrgQueries = {
  /** Invalidate all organization queries (Better Auth + custom) */
  all: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: orgKeys.all })
    void queryClient.invalidateQueries({ queryKey: orgCustomKeys.all })
  },
  
  /** Invalidate organization lists only */
  lists: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: orgKeys.list() })
  },
  
  /** Invalidate specific organization by ID */
  byId: (queryClient: QueryClient, orgId: string) => {
    void queryClient.invalidateQueries({ queryKey: orgKeys.detail(orgId) })
    void queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) })
    void queryClient.invalidateQueries({ queryKey: orgKeys.invitations(orgId) })
    void queryClient.invalidateQueries({ queryKey: orgCustomKeys.settings(orgId) })
    void queryClient.invalidateQueries({ queryKey: orgCustomKeys.stats(orgId) })
  },
  
  /** Invalidate organization members */
  members: (queryClient: QueryClient, orgId: string) => {
    void queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) })
  },
  
  /** Invalidate organization invitations */
  invitations: (queryClient: QueryClient, orgId: string) => {
    void queryClient.invalidateQueries({ queryKey: orgKeys.invitations(orgId) })
  },
  
  /** Invalidate organization settings */
  settings: (queryClient: QueryClient, orgId: string) => {
    void queryClient.invalidateQueries({ queryKey: orgCustomKeys.settings(orgId) })
  },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type for organization query key factory */
export type OrgQueryKeys = typeof orgKeys

/** Type for custom organization query keys */
export type OrgCustomKeys = typeof orgCustomKeys

/** Type for invalidation helpers */
export type InvalidateOrgQueries = typeof invalidateOrgQueries
