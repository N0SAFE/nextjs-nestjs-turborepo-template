/**
 * @fileoverview Admin Domain Query Keys
 * 
 * Centralized query keys for admin-related queries.
 * Combines Better Auth admin keys with custom admin domain keys.
 * 
 * @see apps/web/src/hooks/useAdmin.ts - Better Auth admin hooks
 */

import type { QueryClient } from '@tanstack/react-query'

// ============================================================================
// BETTER AUTH KEYS (From Better Auth plugin)
// ============================================================================

/**
 * Admin query keys from Better Auth
 * 
 * Available keys from Better Auth admin plugin:
 * - adminKeys.all - Base key: ['admin']
 * - adminKeys.users() - All users list
 * - adminKeys.user(userId) - Specific user details
 * - adminKeys.sessions() - Active sessions
 * - adminKeys.bans() - Banned users
 * 
 * @example Usage with Better Auth hooks
 * ```ts
 * import { useAdmin } from '@/hooks/useAdmin'
 * 
 * const { data: users } = useAdmin((ba) => ba.useListUsers())
 * ```
 */
export const adminKeys = {
  /** Base key for all admin queries */
  all: ['admin'] as const,
  
  /** Admin user management */
  users: () => [...adminKeys.all, 'users'] as const,
  user: (userId: string) => [...adminKeys.all, 'user', userId] as const,
  
  /** Admin sessions management */
  sessions: () => [...adminKeys.all, 'sessions'] as const,
  session: (sessionId: string) => [...adminKeys.all, 'session', sessionId] as const,
  
  /** Admin bans management */
  bans: () => [...adminKeys.all, 'bans'] as const,
} as const

// ============================================================================
// CUSTOM KEYS (Domain-specific extensions)
// ============================================================================

/**
 * Custom admin query keys for non-Better Auth queries
 * 
 * @example Platform stats
 * ```ts
 * const { data } = useQuery({
 *   queryKey: adminCustomKeys.platformStats(),
 *   queryFn: () => fetchPlatformStats()
 * })
 * ```
 * 
 * @example System health
 * ```ts
 * const { data } = useQuery({
 *   queryKey: adminCustomKeys.systemHealth(),
 *   queryFn: () => fetchSystemHealth()
 * })
 * ```
 */
export const adminCustomKeys = {
  /** Base key for custom admin queries */
  all: ['admin', 'custom'] as const,
  
  /** Platform-wide statistics */
  platformStats: (options?: { period?: string }) => 
    [...adminCustomKeys.all, 'platform-stats', options] as const,
  
  /** System health monitoring */
  systemHealth: () => [...adminCustomKeys.all, 'system-health'] as const,
  
  /** Audit logs */
  auditLogs: (options?: { entityType?: string; limit?: number }) => 
    [...adminCustomKeys.all, 'audit-logs', options] as const,
  
  /** Platform roles and permissions */
  platformRoles: () => [...adminCustomKeys.all, 'platform-roles'] as const,
  platformPermissions: () => [...adminCustomKeys.all, 'platform-permissions'] as const,
  
  /** System configuration */
  systemConfig: () => [...adminCustomKeys.all, 'system-config'] as const,
  
  /** Feature flags */
  featureFlags: () => [...adminCustomKeys.all, 'feature-flags'] as const,
  
  /** Platform analytics */
  analytics: (options?: { metric?: string; period?: string }) => 
    [...adminCustomKeys.all, 'analytics', options] as const,
  
  /** Organization management (admin view) */
  organizations: () => [...adminCustomKeys.all, 'organizations'] as const,
  organization: (orgId: string) => [...adminCustomKeys.all, 'organization', orgId] as const,
} as const

// ============================================================================
// INVALIDATION HELPERS
// ============================================================================

/**
 * Helper functions for common admin cache invalidation patterns
 * 
 * @example Invalidate all admin queries
 * ```ts
 * import { invalidateAdminQueries } from '@/lib/query-keys/admin'
 * 
 * const handleAdminAction = () => {
 *   invalidateAdminQueries.all(queryClient)
 * }
 * ```
 * 
 * @example Invalidate specific user management queries
 * ```ts
 * const handleUserUpdate = (userId: string) => {
 *   invalidateAdminQueries.user(queryClient, userId)
 * }
 * ```
 */
export const invalidateAdminQueries = {
  /** Invalidate all admin queries (Better Auth + custom) */
  all: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.all })
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.all })
  },
  
  /** Invalidate user management queries */
  users: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.users() })
  },
  
  /** Invalidate specific user */
  user: (queryClient: QueryClient, userId: string) => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
  },
  
  /** Invalidate session management */
  sessions: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.sessions() })
  },
  
  /** Invalidate platform statistics */
  platformStats: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.platformStats() })
  },
  
  /** Invalidate system health */
  systemHealth: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.systemHealth() })
  },
  
  /** Invalidate audit logs */
  auditLogs: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.auditLogs() })
  },
  
  /** Invalidate platform roles and permissions */
  platformRolesAndPermissions: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.platformRoles() })
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.platformPermissions() })
  },
  
  /** Invalidate organization management (admin view) */
  organizations: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.organizations() })
  },
  
  organization: (queryClient: QueryClient, orgId: string) => {
    void queryClient.invalidateQueries({ queryKey: adminCustomKeys.organization(orgId) })
  },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type for admin query key factory */
export type AdminQueryKeys = typeof adminKeys

/** Type for custom admin query keys */
export type AdminCustomKeys = typeof adminCustomKeys

/** Type for invalidation helpers */
export type InvalidateAdminQueries = typeof invalidateAdminQueries
