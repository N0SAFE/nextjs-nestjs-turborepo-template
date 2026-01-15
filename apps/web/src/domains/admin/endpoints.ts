/**
 * Admin Domain - Endpoints
 * 
 * Centralized endpoint definitions using:
 * - ORPC contracts (from API) - used directly
 * - Custom contracts (Better Auth Admin) - created with custom() helper
 * 
 * All endpoints share the same ORPC-like API:
 * - .call(input) - Direct execution
 * - .queryOptions(input) - TanStack Query options
 * - .mutationOptions() - TanStack Mutation options
 * - .queryKey(input) - Cache key for invalidation
 */

import { authClient } from '@/lib/auth'
import { custom, mapBetterAuth } from '../shared/helpers'
import { STALE_TIME } from '../shared/config'
import {
  listUsersSchema,
  banUserSchema,
  unbanUserSchema,
  setRoleSchema,
  createUserSchema,
  updateUserSchema,
  removeUserSchema,
  hasPermissionSchema,
} from './schemas'

// ============================================================================
// ORPC CONTRACTS (from API)
// ============================================================================

/**
 * ORPC API contracts (if any admin endpoints are exposed via ORPC)
 * Currently empty - all admin operations go through Better Auth SDK
 */
const orpcContracts = {} as const

// ============================================================================
// CUSTOM CONTRACTS (Better Auth Admin)
// ============================================================================

/**
 * Better Auth Admin plugin wrapped in custom contracts
 * Uses custom() helper to create ORPC-like contracts
 */
const customContracts = {
  /**
   * List users with pagination and sorting
   */
  listUsers: custom({
    input: listUsersSchema,
    keys: (i) => ['admin', 'listUsers', i],
    handler: authClient.admin.listUsers,
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  /**
   * Check if user has specific permissions
   */
  hasPermission: custom({
    input: hasPermissionSchema,
    keys: (i) => ['admin', 'hasPermission', i],
    handler: authClient.admin.hasPermission,
    map: mapBetterAuth(),
    staleTime: STALE_TIME.SLOW,
  }),

  /**
   * Ban a user
   */
  banUser: custom({
    input: banUserSchema,
    keys: (i) => ['admin', 'banUser', i],
    handler: authClient.admin.banUser,
    map: mapBetterAuth(),
  }),

  /**
   * Unban a user
   */
  unbanUser: custom({
    input: unbanUserSchema,
    keys: (i) => ['admin', 'unbanUser', i],
    handler: authClient.admin.unbanUser,
    map: mapBetterAuth(),
  }),

  /**
   * Set user role
   */
  setRole: custom({
    input: setRoleSchema,
    keys: (i) => ['admin', 'setRole', i],
    handler: authClient.admin.setRole,
    map: mapBetterAuth(),
  }),

  /**
   * Create a new user
   */
  createUser: custom({
    input: createUserSchema,
    keys: (i) => ['admin', 'createUser', i],
    handler: authClient.admin.createUser,
    map: mapBetterAuth(),
  }),

  /**
   * Update user data
   */
  updateUser: custom({
    input: updateUserSchema,
    keys: (i) => ['admin', 'updateUser', i],
    handler: authClient.admin.updateUser,
    map: mapBetterAuth(),
  }),

  /**
   * Remove a user
   */
  removeUser: custom({
    input: removeUserSchema,
    keys: (i) => ['admin', 'removeUser', i],
    handler: authClient.admin.removeUser,
    map: mapBetterAuth(),
  }),
} as const

// ============================================================================
// UNIFIED ENDPOINTS EXPORT
// ============================================================================

/**
 * All admin endpoints in one place
 * Mix of ORPC contracts and custom contracts with unified API
 */
export const adminEndpoints = {
  ...orpcContracts,
  ...customContracts,
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AdminEndpoints = typeof adminEndpoints
