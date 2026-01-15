/**
 * Auth Domain - Endpoints
 * 
 * Centralized endpoint definitions using:
 * - ORPC contracts (from API) - used directly
 * - Custom contracts (Better Auth) - created with custom() helper
 * 
 * All endpoints share the same ORPC-like API:
 * - .call(input) - Direct execution
 * - .queryOptions(input) - TanStack Query options
 * - .mutationOptions() - TanStack Mutation options
 * - .queryKey(input) - Cache key for invalidation
 */

import { custom, mapBetterAuth } from '@/domains/shared/helpers'
import { STALE_TIME } from '@/domains/shared/config'
import { authClient } from '@/lib/auth/options'
import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './schemas'
import { DEFAULT_SESSION_QUERY_KEY } from '@repo/auth/react'

// ============================================================================
// ORPC CONTRACTS (from API)
// ============================================================================

/**
 * User management from ORPC API
 * These contracts are used directly without wrappers
 */
const orpcContracts = {
  // Example: If you have user endpoints in your API
  // user: {
  //   list: orpc.user.list,
  //   findById: orpc.user.findById,
  //   create: orpc.user.create,
  //   update: orpc.user.update,
  //   delete: orpc.user.delete,
  // }
} as const

// ============================================================================
// CUSTOM CONTRACTS (Better Auth)
// ============================================================================

/**
 * Better Auth session management
 * Uses custom() helper to create ORPC-like contracts
 */
const customContracts = {
  /**
   * Get current session
   * Returns user session data or null if not authenticated
   */
  session: custom({
    keys: DEFAULT_SESSION_QUERY_KEY,
    handler: authClient.getSession,
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  /**
   * Sign in with credentials
   */
  signIn: custom({
    input: signInSchema,
    keys: (i) => ['auth', 'signIn', i],
    map: mapBetterAuth(),
    handler: authClient.signIn.email
  }),

  /**
   * Sign up with credentials
   */
  signUp: custom({
    input: signUpSchema,
    keys: (i) => ['auth', 'signUp', i],
    map: mapBetterAuth(),
    handler: authClient.signUp.email
  }),

  /**
   * Sign out
   */
  signOut: custom({
    keys: (i) => ['auth', 'signOut', i],
    map: mapBetterAuth(),
    handler: authClient.signOut
  }),

  /**
   * Reset password
   */
  resetPassword: custom({
    input: resetPasswordSchema,
    keys: (i) => ['auth', 'resetPassword', i],
    map: mapBetterAuth(),
    handler: authClient.resetPassword
  }),

  /**
   * Update user profile
   */
  updateProfile: custom({
    input: updateProfileSchema,
    keys: (i) => ['auth', 'updateProfile', i],
    map: mapBetterAuth(),
    handler: authClient.updateUser,
  }),

  /**
   * Change password
   */
  changePassword: custom({
    input: changePasswordSchema,
    keys: (i) => ['auth', 'changePassword', i],
    map: mapBetterAuth(),
    handler: authClient.changePassword
  }),
} as const

// ============================================================================
// UNIFIED ENDPOINTS EXPORT
// ============================================================================

/**
 * All auth endpoints in one place
 * Mix of ORPC contracts and custom contracts with unified API
 */
export const authEndpoints = {
  ...orpcContracts,
  ...customContracts,
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AuthEndpoints = typeof authEndpoints
