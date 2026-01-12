/**
 * @fileoverview User Domain Query Keys
 * 
 * Centralized query keys for user-related queries.
 * Reuses ORPC-generated keys from userHooks and adds custom keys.
 * 
 * @see apps/web/src/hooks/useUser.ts - ORPC-generated user hooks
 */

import type { QueryClient } from '@tanstack/react-query'
import { userQueryKeys } from '@/hooks/useUser'

// ============================================================================
// ORPC-GENERATED KEYS (Re-exported)
// ============================================================================

/**
 * User query keys from ORPC contract
 * 
 * Available keys:
 * - userKeys.all - Base key for all user queries: ['user']
 * - userKeys.list(input?) - User list key
 * - userKeys.findById(input) - User detail key
 * - userKeys.count(input?) - User count key
 * - userKeys.checkEmail(input) - Email check key (mutation)
 * - userKeys.create(input) - Create user key (mutation)
 * - userKeys.update(input) - Update user key (mutation)
 * - userKeys.delete(input) - Delete user key (mutation)
 */
export const userKeys = userQueryKeys

// ============================================================================
// CUSTOM KEYS (Domain-specific extensions)
// ============================================================================

/**
 * Custom user query keys for non-ORPC queries
 * 
 * @example Current user session
 * ```ts
 * const { data } = useQuery({
 *   queryKey: userCustomKeys.currentUser(),
 *   queryFn: () => fetchCurrentUser()
 * })
 * ```
 * 
 * @example User preferences
 * ```ts
 * const { data } = useQuery({
 *   queryKey: userCustomKeys.preferences(userId),
 *   queryFn: () => fetchUserPreferences(userId)
 * })
 * ```
 */
export const userCustomKeys = {
  /** Base key for custom user queries */
  all: ['user', 'custom'] as const,
  
  /** Current user session */
  currentUser: () => [...userCustomKeys.all, 'current'] as const,
  
  /** User preferences by user ID */
  preferences: (userId: string) => [...userCustomKeys.all, 'preferences', userId] as const,
  
  /** User activity history */
  activity: (userId: string, options?: { limit?: number }) => 
    [...userCustomKeys.all, 'activity', userId, options] as const,
  
  /** User notifications */
  notifications: (userId: string, options?: { unreadOnly?: boolean }) => 
    [...userCustomKeys.all, 'notifications', userId, options] as const,
} as const

// ============================================================================
// INVALIDATION HELPERS
// ============================================================================

/**
 * Helper functions for common cache invalidation patterns
 * 
 * @example Invalidate all user queries
 * ```ts
 * import { invalidateUserQueries } from '@/lib/query-keys/user'
 * import { useQueryClient } from '@tanstack/react-query'
 * 
 * function MyComponent() {
 *   const queryClient = useQueryClient()
 *   
 *   const handleRefresh = () => {
 *     invalidateUserQueries.all(queryClient)
 *   }
 * }
 * ```
 */
export const invalidateUserQueries = {
  /** Invalidate all user queries (ORPC + custom) */
  all: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: userKeys.all })
    void queryClient.invalidateQueries({ queryKey: userCustomKeys.all })
  },
  
  /** Invalidate user lists only */
  lists: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: userKeys.list() })
  },
  
  /** Invalidate specific user by ID */
  byId: (queryClient: QueryClient, userId: string) => {
    void queryClient.invalidateQueries({ queryKey: userKeys.findById({ id: userId }) })
    void queryClient.invalidateQueries({ queryKey: userCustomKeys.preferences(userId) })
    void queryClient.invalidateQueries({ queryKey: userCustomKeys.activity(userId) })
  },
  
  /** Invalidate current user session */
  currentUser: (queryClient: QueryClient) => {
    void queryClient.invalidateQueries({ queryKey: userCustomKeys.currentUser() })
  },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type for user query key factory */
export type UserQueryKeys = typeof userKeys

/** Type for custom user query keys */
export type UserCustomKeys = typeof userCustomKeys

/** Type for invalidation helpers */
export type InvalidateUserQueries = typeof invalidateUserQueries
