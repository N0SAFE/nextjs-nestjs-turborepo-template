/**
 * Auth Domain - Client Hooks
 *
 * React hooks for client components with consistent patterns:
 * - Query hooks for reading data
 * - Mutation hooks for modifying data
 * - Automatic cache invalidation after mutations
 * - Consistent error handling and loading states
 */

"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { authEndpoints } from "./endpoints";
import { wrapWithInvalidations } from "../shared/helpers";
import { authInvalidations } from "./invalidations";

// Enhanced endpoints with automatic invalidation
const enhancedAuth = wrapWithInvalidations(authEndpoints, authInvalidations);

// ============================================================================
// QUERY HOOKS (Read Operations)
// ============================================================================

/**
 * Get current session
 *
 * @returns Query result with session data or null
 *
 * @example
 * ```tsx
 * function ProfileButton() {
 *   const { data: session, isLoading } = useSession()
 *
 *   if (isLoading) return <Skeleton />
 *   if (!session) return <SignInButton />
 *
 *   return <UserAvatar user={session.user} />
 * }
 * ```
 */
export function useSession() {
  return useQuery(authEndpoints.session.queryOptions());
}

// ============================================================================
// MUTATION HOOKS (Write Operations)
// ============================================================================

/**
 * Sign in mutation
 *
 * Automatically invalidates session after successful sign in
 *
 * @example
 * ```tsx
 * function SignInForm() {
 *   const signIn = useSignIn()
 *
 *   const handleSubmit = (data: SignInInput) => {
 *     signIn.mutate(data, {
 *       onSuccess: () => {
 *         toast.success('Welcome back!')
 *         router.push('/dashboard')
 *       },
 *       onError: (error) => {
 *         toast.error(error.message)
 *       }
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */
export function useSignIn() {
  return useMutation(
    authEndpoints.signIn.mutationOptions({
      onSuccess: enhancedAuth.signIn.withInvalidationOnSuccess(),
    }),
  );
}

/**
 * Sign up mutation
 *
 * Automatically invalidates session after successful sign up
 *
 * @example
 * ```tsx
 * function SignUpForm() {
 *   const signUp = useSignUp()
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       signUp.mutate({ email, password, name })
 *     }}>
 *       ...
 *     </form>
 *   )
 * }
 * ```
 */
export function useSignUp() {
  return useMutation(
    authEndpoints.signUp.mutationOptions({
      onSuccess: enhancedAuth.signUp.withInvalidationOnSuccess(),
    }),
  );
}

/**
 * Sign out mutation
 *
 * Clears all cached data after successful sign out
 *
 * @example
 * ```tsx
 * function SignOutButton() {
 *   const signOut = useSignOut()
 *
 *   return (
 *     <button
 *       onClick={() => signOut.mutate()}
 *       disabled={signOut.isPending}
 *     >
 *       {signOut.isPending ? 'Signing out...' : 'Sign out'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useSignOut() {
  return useMutation(
    authEndpoints.signOut.mutationOptions({
      onSuccess: enhancedAuth.signOut.withInvalidationOnSuccess(),
    }),
  );
}

/**
 * Reset password mutation
 *
 * Resets password with token from email
 * Invalidates session after successful reset
 *
 * @example
 * ```tsx
 * function ResetPasswordForm({ token }: { token: string }) {
 *   const resetPassword = useResetPassword()
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       resetPassword.mutate({ token, password })
 *     }}>
 *       ...
 *     </form>
 *   )
 * }
 * ```
 */
export function useResetPassword() {
  return useMutation(
    authEndpoints.resetPassword.mutationOptions({
      onSuccess: enhancedAuth.resetPassword.withInvalidationOnSuccess(),
    }),
  );
}

/**
 * Update profile mutation
 *
 * Updates user profile information
 * Invalidates session to show updated data
 *
 * @example
 * ```tsx
 * function ProfileEditor() {
 *   const updateProfile = useUpdateProfile()
 *   const { data: session } = useSession()
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       updateProfile.mutate({ name, image }, {
 *         onSuccess: () => {
 *           toast.success('Profile updated')
 *         }
 *       })
 *     }}>
 *       ...
 *     </form>
 *   )
 * }
 * ```
 */
export function useUpdateProfile() {
  return useMutation(
    authEndpoints.updateProfile.mutationOptions({
      onSuccess: enhancedAuth.updateProfile.withInvalidationOnSuccess(),
    }),
  );
}

/**
 * Change password mutation
 *
 * Changes user password
 * Invalidates session after successful change
 *
 * @example
 * ```tsx
 * function ChangePasswordForm() {
 *   const changePassword = useChangePassword()
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault()
 *       changePassword.mutate({ currentPassword, newPassword }, {
 *         onSuccess: () => {
 *           toast.success('Password changed')
 *           form.reset()
 *         }
 *       })
 *     }}>
 *       ...
 *     </form>
 *   )
 * }
 * ```
 */
export function useChangePassword() {
  return useMutation(
    authEndpoints.changePassword.mutationOptions({
      onSuccess: enhancedAuth.changePassword.withInvalidationOnSuccess(),
    }),
  );
}

// ============================================================================
// COMPOSITE HOOKS (Multiple Operations)
// ============================================================================

/**
 * Get all auth mutations in one hook
 *
 * Useful for forms that need access to multiple auth operations
 *
 * @example
 * ```tsx
 * function AuthProvider({ children }) {
 *   const auth = useAuthActions()
 *
 *   return (
 *     <AuthContext.Provider value={auth}>
 *       {children}
 *     </AuthContext.Provider>
 *   )
 * }
 * ```
 */
export function useAuthActions() {
  const signIn = useSignIn();
  const signUp = useSignUp();
  const signOut = useSignOut();
  const resetPassword = useResetPassword();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    changePassword,

    // Grouped loading states
    isLoading: {
      signIn: signIn.isPending,
      signUp: signUp.isPending,
      signOut: signOut.isPending,
      resetPassword: resetPassword.isPending,
      updateProfile: updateProfile.isPending,
      changePassword: changePassword.isPending,
    },

    // Grouped error states
    errors: {
      signIn: signIn.error,
      signUp: signUp.error,
      signOut: signOut.error,
      resetPassword: resetPassword.error,
      updateProfile: updateProfile.error,
      changePassword: changePassword.error,
    },
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export types inferred from endpoints
export type Session = Awaited<ReturnType<typeof authEndpoints.session.call>>;
export type SignInInput = Parameters<typeof authEndpoints.signIn.call>[0];
export type SignUpInput = Parameters<typeof authEndpoints.signUp.call>[0];
export type ResetPasswordInput = Parameters<
  typeof authEndpoints.resetPassword.call
>[0];
export type UpdateProfileInput = Parameters<
  typeof authEndpoints.updateProfile.call
>[0];
export type ChangePasswordInput = Parameters<
  typeof authEndpoints.changePassword.call
>[0];
