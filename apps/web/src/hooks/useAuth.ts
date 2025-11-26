import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth'

/**
 * Hook to sign in with email and password
 */
export function useSignInEmailMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      return authClient.signIn.email({
        email: params.email,
        password: params.password,
      })
    },
    onSuccess: ({ error }) => {
      if (error) {
        toast.error(error.message ?? 'Authentication failed')
      } else {
        toast.success('Signed in successfully')
        void queryClient.invalidateQueries({ queryKey: ['session'] })
      }
    },
    onError: (error: Error) => {
      toast.error(`Sign in failed: ${error.message}`)
    },
  })
}

/**
 * Hook to sign out
 */
export function useSignOutMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      return authClient.signOut()
    },
    onSuccess: () => {
      toast.success('Signed out successfully')
      void queryClient.invalidateQueries({ queryKey: ['session'] })
      queryClient.clear()
    },
    onError: (error: Error) => {
      toast.error(`Sign out failed: ${error.message}`)
    },
  })
}

/**
 * Hook to sign up with email and password
 */
export function useSignUpEmailMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: { email: string; password: string; name: string }) => {
      return authClient.signUp.email({
        email: params.email,
        password: params.password,
        name: params.name,
      })
    },
    onSuccess: ({ error }) => {
      if (error) {
        toast.error(error.message ?? 'Sign up failed')
      } else {
        toast.success('Account created successfully')
        void queryClient.invalidateQueries({ queryKey: ['session'] })
      }
    },
    onError: (error: Error) => {
      toast.error(`Sign up failed: ${error.message}`)
    },
  })
}

/**
 * Hook to reset password
 */
export function useResetPasswordMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: { newPassword: string }) => {
      return authClient.resetPassword({
        newPassword: params.newPassword,
      })
    },
    onSuccess: ({ error }) => {
      if (error) {
        toast.error(error.message ?? 'Failed to reset password')
      } else {
        toast.success('Password reset successfully')
        void queryClient.invalidateQueries({ queryKey: ['session'] })
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset password: ${error.message}`)
    },
  })
}

/**
 * Composite hook for auth actions
 */
export function useAuthActions() {
  const signInEmail = useSignInEmailMutation()
  const signOut = useSignOutMutation()
  const signUpEmail = useSignUpEmailMutation()
  const resetPassword = useResetPasswordMutation()

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
