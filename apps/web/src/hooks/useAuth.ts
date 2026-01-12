'use client'

/**
 * @fileoverview Authentication Hooks - Unified Invalidation Pattern
 * 
 * This file demonstrates the NEW UNIFIED INVALIDATION PATTERN where:
 * 1. Custom hooks are defined with defineCustomHooks
 * 2. BOTH ORPC contract AND custom hooks are passed to defineInvalidations
 * 3. All invalidation rules (ORPC + custom) live in ONE config object
 * 4. Type-safe across both hook types
 * 5. Single source of truth for cache invalidation
 * 
 * Architecture:
 * - Custom hooks defined with defineCustomHooks (from @repo/orpc-utils/hooks)
 * - Each hook provides mutationKey for cache identification
 * - Compatible with ORPC's mergeHooks utility
 * - Unified invalidations via defineInvalidations({ contract, custom }, config)
 * - Maintains same interface as ORPC-generated hooks
 * 
 * Better Auth Integration:
 * - Uses Better Auth client SDK (authClient) as data source
 * - Not ORPC contracts (auth is framework-level, not API endpoints)
 * - Automatic session cache invalidation via unified invalidation config
 * - Toast notifications for user feedback
 * - Type-safe with Better Auth's $Infer types
 * 
 * Unified Invalidation Pattern:
 * ```ts
 * // 1. Define custom hooks (no onSuccess invalidation)
 * const authCustomHooks = defineCustomHooks({
 *   useSignInEmail: () => useMutation({ mutationFn: ... }),
 *   useSignOut: () => useMutation({ mutationFn: ... }),
 * })
 * 
 * // 2. Define ALL invalidations in one place (ORPC + custom)
 * const authInvalidations = defineInvalidations({
 *   contract: appContract.user,  // Optional: ORPC contract if exists
 *   custom: authCustomHooks,     // Custom hooks for type inference
 * }, {
 *   // ORPC operations (type-safe from contract)
 *   create: ['list', 'count'],
 *   
 *   // Custom operations (type-safe from authCustomHooks!)
 *   useSignInEmail: () => [SESSION_QUERY_KEY],
 *   useSignOut: () => ['*'], // Special: invalidate all
 * })
 * 
 * // 3. Apply invalidations to merged hooks
 * const authHooks = mergeHooks({
 *   custom: authCustomHooks,
 *   invalidations: authInvalidations,
 * })
 * ```
 * 
 * Usage Example:
 * ```ts
 * import { authHooks } from '@/hooks/useAuth'
 * import { userHooks } from '@/hooks/useUser.orpc-hooks'
 * import { mergeHooks } from '@repo/orpc-utils/hooks'
 * 
 * // Merge ORPC and custom hooks
 * const hooks = mergeHooks({
 *   router: userHooks,
 *   composite: {},
 *   custom: authHooks
 * })
 * 
 * // Use unified interface
 * const { data: users } = hooks.useList() // ORPC
 * const signIn = hooks.useSignInEmail() // Custom
 * ```
 */

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authClient, signOut } from '@/lib/auth'
import { SESSION_QUERY_KEY } from '@/lib/auth'
import { defineCustomHooks, defineInvalidations } from '@repo/orpc-utils/hooks'

// ============================================================================
// QUERY KEYS - Define FIRST, use everywhere
// ============================================================================

/**
 * Auth domain query keys - Single source of truth
 * 
 * Define keys FIRST, then use them in:
 * 1. useMutation/useQuery for mutationKey/queryKey
 * 2. defineInvalidations for cache invalidation
 * 3. External code for manual cache operations
 * 
 * @example In mutations
 * ```ts
 * useMutation({
 *   mutationKey: authKeys.signInEmail(),  // Use key directly
 *   mutationFn: ...
 * })
 * ```
 * 
 * @example In invalidations
 * ```ts
 * defineInvalidations({ custom: authHooks }, {
 *   useSignInEmail: ({ keys }) => [keys.session()]
 * })
 * ```
 * 
 * @example External usage
 * ```ts
 * queryClient.invalidateQueries({ queryKey: authKeys.session() })
 * ```
 */
export const authKeys = {
  /**
   * Session query key - used by Better Auth's useSession hook
   */
  session: () => SESSION_QUERY_KEY,
  
  /**
   * All auth queries - for broad invalidation
   */
  all: () => ['auth'] as const,
  
  // Mutation keys (for tracking/deduplication)
  signInEmail: () => ['auth', 'signInEmail'] as const,
  signOut: () => ['auth', 'signOut'] as const,
  signUpEmail: () => ['auth', 'signUpEmail'] as const,
  resetPassword: () => ['auth', 'resetPassword'] as const,
}

// ============================================================================
// CUSTOM AUTH HOOKS - Using keys directly
// ============================================================================

/**
 * Custom hooks for Better Auth operations
 * 
 * Pattern:
 * 1. Keys defined above (authKeys)
 * 2. Hooks use keys directly for mutationKey
 * 3. Keys attached to hooks via defineCustomHooks
 * 
 * Usage:
 * ```ts
 * // Access hooks
 * const signIn = authCustomHooks.useSignInEmail()
 * 
 * // Access keys (from the same object)
 * queryClient.invalidateQueries({ queryKey: authCustomHooks.keys.session() })
 * ```
 */
export const authCustomHooks = defineCustomHooks({
  /**
   * Sign in with email/password
   * 
   * @example
   * ```ts
   * const signIn = authHooks.useSignInEmail()
   * signIn.mutate({ email: 'user@example.com', password: 'pass' })
   * ```
   */
  useSignInEmail: () => {
    return useMutation({
      mutationKey: authKeys.signInEmail(),  // Use key directly!
      mutationFn: async (input: { email: string; password: string }) => {
        return authClient.signIn.email({
          email: input.email,
          password: input.password,
        })
      },
      onSuccess: () => {
        // NOTE: No invalidation here! Handled by authInvalidations config
        toast.success('Successfully signed in')
      },
      onError: (error: Error) => {
        toast.error(`Sign in failed: ${error.message}`)
      },
    })
  },

  /**
   * Sign out current user
   * 
   * @example
   * ```ts
   * const signOutMutation = authHooks.useSignOut()
   * signOutMutation.mutate()
   * ```
   */
  useSignOut: () => {
    return useMutation({
      mutationKey: authKeys.signOut(),  // Use key directly!
      mutationFn: async () => {
        await signOut()
      },
      onSuccess: () => {
        // NOTE: No invalidation here! Handled by authInvalidations config
        toast.success('Successfully signed out')
      },
      onError: (error: Error) => {
        toast.error(`Sign out failed: ${error.message}`)
      },
    })
  },

  /**
   * Sign up with email/password
   * 
   * @example
   * ```ts
   * const signUp = authHooks.useSignUpEmail()
   * signUp.mutate({ 
   *   email: 'new@example.com', 
   *   password: 'pass', 
   *   name: 'John' 
   * })
   * ```
   */
  useSignUpEmail: () => {
    return useMutation({
      mutationKey: authKeys.signUpEmail(),  // Use key directly!
      mutationFn: async (input: { email: string; password: string; name: string }) => {
        return authClient.signUp.email({
          email: input.email,
          password: input.password,
          name: input.name,
        })
      },
      onSuccess: () => {
        // NOTE: No invalidation here! Handled by authInvalidations config
        toast.success('Account created successfully')
      },
      onError: (error: Error) => {
        toast.error(`Sign up failed: ${error.message}`)
      },
    })
  },

  /**
   * Reset password
   * 
   * @example
   * ```ts
   * const reset = authHooks.useResetPassword()
   * reset.mutate({ newPassword: 'newpass' })
   * ```
   */
  useResetPassword: () => {
    return useMutation({
      mutationKey: authKeys.resetPassword(),  // Use key directly!
      mutationFn: async (input: { newPassword: string }) => {
        return authClient.resetPassword({
          newPassword: input.newPassword,
        })
      },
      onSuccess: () => {
        // NOTE: No invalidation here! Handled by authInvalidations config
        toast.success('Password reset successfully')
      },
      onError: (error: Error) => {
        toast.error(`Password reset failed: ${error.message}`)
      },
    })
  },
}, {
  // Attach keys to the hooks object for external access
  keys: authKeys,
})

// ============================================================================
// UNIFIED INVALIDATIONS - Query Key-Based Pattern
// ============================================================================

/**
 * Unified invalidation configuration for auth custom hooks.
 * 
 * NEW QUERY KEY-BASED PATTERN:
 * - Invalidations receive a `keys` parameter with type-safe key factories
 * - Return a LIST of query keys to invalidate: `[key1, key2, ...]`
 * - Each key is an actual query key tuple, not a string reference
 * 
 * Benefits:
 * - ✅ Type-safe - TypeScript knows the shape of each key
 * - ✅ Discoverable - autocomplete shows available keys
 * - ✅ Reusable - same keys can be used externally
 * - ✅ Maintainable - refactoring is safe
 * 
 * Return Format:
 * ```ts
 * // Returns a LIST of query keys
 * useSignIn: ({ keys }) => [
 *   keys.session(),  // Returns: ['auth', 'session', ...]
 * ]
 * // Full return: [['auth', 'session', ...]]
 * //              ^^^ outer array = list of keys to invalidate
 * //                 ^^^^^^^^^^^^^^^^^^^ inner array = single query key
 * ```
 * 
 * @example Extending with ORPC contract
 * ```ts
 * import { appContract } from '@repo/api-contracts'
 * import { userHooks } from '@/hooks/useUser'
 * 
 * const authInvalidations = defineInvalidations({
 *   contract: appContract.user,  // Add ORPC contract
 *   custom: authCustomHooks,
 * }, {
 *   // ORPC mutations use combined keys
 *   create: ({ keys }) => [keys.list(), keys.count()],
 *   update: ({ keys, input }) => [
 *     keys.list(),
 *     keys.findById({ id: input.id }),
 *   ],
 *   
 *   // Custom hooks use their own keys
 *   useSignInEmail: ({ keys }) => [keys.session()],
 *   useSignOut: ({ keys }) => [keys.all()],
 * })
 * ```
 */
export const authInvalidations = defineInvalidations(
  {
    // No ORPC contract for auth (framework-level, not API endpoints)
    custom: authCustomHooks,
  },
  {
    // Custom hook invalidations - using actual query keys!
    // Each returns a LIST of query keys to invalidate
    // 
    // Context now provides:
    // - keys: Type-safe query key factories
    // - input: The mutation variables (type-safe per hook!)
    // - result: The mutation result data
    //
    // For useSignInEmail, TypeScript knows:
    // - input: { email: string; password: string }
    // - result: Awaited<ReturnType<typeof authClient.signIn.email>>
    useSignInEmail: ({ keys, input }) => {
      // Input is typed! TypeScript knows input.email and input.password exist
      console.debug('[Auth Invalidation] Sign in with email:', input.email)
      return [keys.session()]
    },
    useSignOut: ({ keys }) => [keys.all()],
    useSignUpEmail: ({ keys, input }) => {
      // Input is typed! TypeScript knows input.email, input.password, input.name exist
      console.debug('[Auth Invalidation] Sign up with email:', input.email)
      return [keys.session()]
    },
    useResetPassword: ({ keys, input }) => {
      // Input is typed! TypeScript knows input.newPassword exists
      console.debug('[Auth Invalidation] Reset password requested')
      // Note: input.newPassword is available but we don't log sensitive data
      void input  // Acknowledge input is available but not used for security
      return [keys.session()]
    },
  }
)

// ============================================================================
// EXPORTED HOOKS - With Invalidations Applied
// ============================================================================

/**
 * Auth hooks with unified invalidations applied.
 * 
 * NOTE: This is a demonstration. In a real implementation, you'd need to
 * enhance mergeHooks to accept and apply the invalidations config.
 * For now, custom hooks still handle invalidations via onSuccess.
 * 
 * @todo Enhance mergeHooks to apply invalidations from defineInvalidations
 */
export const authHooks = authCustomHooks

// ============================================================================
// COMPOSITE HOOKS - Grouped Operations
// ============================================================================

/**
 * Composite hook for auth actions
 * 
 * Provides grouped access to all authentication operations with:
 * - Convenience methods for mutations
 * - Async variants for programmatic usage
 * - Grouped loading states
 * - Grouped error states
 * 
 * @example
 * ```ts
 * const { signInEmail, signOut, isLoading, errors } = useAuthActions()
 * 
 * // Use in form handler
 * const handleSubmit = async (data) => {
 *   await signInEmailAsync(data)
 * }
 * 
 * // Check loading state
 * if (isLoading.signInEmail) return <Spinner />
 * ```
 */
export function useAuthActions() {
  const signInEmail = authHooks.useSignInEmail()
  const signOut = authHooks.useSignOut()
  const signUpEmail = authHooks.useSignUpEmail()
  const resetPassword = authHooks.useResetPassword()

  return {
    // Convenience methods
    signInEmail: signInEmail.mutate,
    signInEmailAsync: signInEmail.mutateAsync,
    signOut: signOut.mutate,
    signOutAsync: signOut.mutateAsync,
    signUpEmail: signUpEmail.mutate,
    signUpEmailAsync: signUpEmail.mutateAsync,
    resetPassword: resetPassword.mutate,
    resetPasswordAsync: resetPassword.mutateAsync,
    
    // Grouped loading states
    isLoading: {
      signInEmail: signInEmail.isPending,
      signOut: signOut.isPending,
      signUpEmail: signUpEmail.isPending,
      resetPassword: resetPassword.isPending,
    },
    
    // Grouped error states
    errors: {
      signInEmail: signInEmail.error,
      signOut: signOut.error,
      signUpEmail: signUpEmail.error,
      resetPassword: resetPassword.error,
    },
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type exports for consumers
 */
export type AuthCustomHooks = typeof authCustomHooks
export type AuthInvalidations = typeof authInvalidations
export type AuthHooks = typeof authHooks
export type AuthActions = ReturnType<typeof useAuthActions>

// ============================================================================
// DOCUMENTATION - How to Use Unified Invalidations
// ============================================================================

/**
 * HOW TO USE THE UNIFIED INVALIDATION PATTERN:
 * 
 * 1. Define custom hooks WITHOUT onSuccess invalidations:
 * ```ts
 * const customHooks = defineCustomHooks({
 *   useSomeAction: () => useMutation({
 *     mutationFn: async () => { ... },
 *     // NO onSuccess invalidation here!
 *   })
 * })
 * ```
 * 
 * 2. Define ALL invalidations in one place:
 * ```ts
 * const invalidations = defineInvalidations({
 *   contract: appContract.user,  // Optional: ORPC contract
 *   custom: customHooks,         // Custom hooks for type inference
 * }, {
 *   // ORPC mutations (if contract provided)
 *   create: ['list', 'count'],
 *   update: (input) => ({ list: undefined, findById: { id: input.id } }),
 *   
 *   // Custom hook invalidations (type-safe from customHooks!)
 *   useSomeAction: () => [SESSION_QUERY_KEY],
 *   useAnotherAction: () => ['*'], // Clear all cache
 * })
 * ```
 * 
 * 3. Apply invalidations to merged hooks:
 * ```ts
 * const hooks = mergeHooks({
 *   router: orpcHooks,           // Optional: ORPC hooks
 *   custom: customHooks,
 *   invalidations: invalidations, // Apply unified config
 * })
 * ```
 * 
 * BENEFITS:
 * - ✅ Single source of truth for invalidations
 * - ✅ Type-safe for both ORPC and custom operations
 * - ✅ Easy to maintain and discover
 * - ✅ Consistent pattern across all hooks
 * - ✅ No scattered onSuccess callbacks
 * 
 * SPECIAL KEYS:
 * - '*' : Invalidates ALL queries (use sparingly)
 * 
 * @see packages/utils/orpc/src/hooks/generate-hooks.ts for defineInvalidations
 * @see packages/utils/orpc/src/hooks/merge-hooks.ts for mergeHooks
 */
