'use client'

/**
 * @fileoverview Admin Hooks - Better Auth Admin Plugin
 * 
 * This file provides React hooks for administrative operations using Better Auth's Admin plugin.
 * The Admin plugin extends Better Auth with user management capabilities.
 * 
 * Key Features:
 * - User listing with pagination and sorting
 * - Permission management and checking
 * - User banning/unbanning
 * - Role management (platform-wide roles)
 * - User CRUD operations (create, update, remove)
 * - Centralized query key management
 * - Automatic cache invalidation
 * - Toast notifications for feedback
 * 
 * Unlike ORPC hooks which use generated contracts, these hooks wrap Better Auth's
 * Admin plugin methods with React Query for optimal caching and state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth'
import { toast } from 'sonner'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Infer role type from Better Auth setRole method parameters
type SetRoleParams = Parameters<typeof authClient.admin.setRole>[0]
type PlatformRole = SetRoleParams['role']

// Infer create user parameters
type CreateUserParams = Parameters<typeof authClient.admin.createUser>[0]

// ============================================================================
// QUERY KEY REGISTRY
// ============================================================================

/**
 * Query key registry for admin-related queries
 * Centralizes query key definitions for better maintainability and type safety
 */
export const adminQueryKeys = {
  all: ['admin'] as const,
  users: (filters?: { limit?: number; offset?: number; sortBy?: string; sortDirection?: 'asc' | 'desc' }) =>
    [...adminQueryKeys.all, 'users', filters] as const,
  user: (userId: string) =>
    [...adminQueryKeys.all, 'user', userId] as const,
  permissions: (userId: string) =>
    [...adminQueryKeys.all, 'permissions', userId] as const,
} as const

/**
 * Hook to fetch a paginated list of users
 */
export function useAdminListUsers(options?: {
  limit?: number
  offset?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  enabled?: boolean
}) {
  return useQuery({
    queryKey: adminQueryKeys.users({
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy,
      sortDirection: options?.sortDirection,
    }),
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit: options?.limit ?? 50,
          offset: options?.offset ?? 0,
          sortBy: options?.sortBy,
          sortDirection: options?.sortDirection,
        },
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook to check if a user has specific permissions
 */
export function useAdminHasPermission(permissions: Record<string, string[]>, options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'hasPermission', permissions],
    queryFn: async () => {
      const result = await authClient.admin.hasPermission({
        permissions,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // 5 minutes - permissions don't change often
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook to ban a user
 */
export function useAdminBanUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      userId: string
      banReason?: string
      banExpiresIn?: number
    }) => {
      const result = await authClient.admin.banUser({
        userId: data.userId,
        banReason: data.banReason,
        banExpiresIn: data.banExpiresIn,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      toast.success('User banned successfully')

      // Invalidate user queries
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.user(variables.userId)
      })

      // Invalidate user list
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users()
      })
    },
    onError: (error) => {
      toast.error(`Failed to ban user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to unban a user
 */
export function useAdminUnbanUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { userId: string }) => {
      const result = await authClient.admin.unbanUser({
        userId: data.userId,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      toast.success('User unbanned successfully')

      // Invalidate user queries
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.user(variables.userId)
      })

      // Invalidate user list
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users()
      })
    },
    onError: (error) => {
      toast.error(`Failed to unban user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to set a user's platform role
 */
export function useAdminSetRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      userId: string
      role: PlatformRole
    }) => {
      const result = await authClient.admin.setRole({
        userId: data.userId,
        role: data.role,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      const roleStr = Array.isArray(variables.role) ? variables.role.join(', ') : variables.role
      toast.success(`User role updated to ${roleStr}`)

      // Invalidate user queries
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.user(variables.userId)
      })

      // Invalidate user list
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users()
      })

      // Invalidate permissions
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.permissions(variables.userId)
      })
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to create a new user
 */
export function useAdminCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateUserParams) => {
      const result = await authClient.admin.createUser(data)

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: () => {
      toast.success('User created successfully')

      // Invalidate user list
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users()
      })
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to update a user
 */
export function useAdminUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      userId: string
      data: Record<string, unknown>
    }) => {
      const result = await authClient.admin.updateUser({
        userId: data.userId,
        data: data.data,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      toast.success('User updated successfully')

      // Invalidate specific user query
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.user(variables.userId)
      })

      // Invalidate user list
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users()
      })
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to remove a user
 */
export function useAdminRemoveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { userId: string }) => {
      const result = await authClient.admin.removeUser({
        userId: data.userId,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      toast.success('User removed successfully')

      // Remove specific user from cache
      queryClient.removeQueries({
        queryKey: adminQueryKeys.user(variables.userId)
      })

      // Invalidate user list
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users()
      })
    },
    onError: (error) => {
      toast.error(`Failed to remove user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Composite hook providing all admin actions
 * Useful for components that need multiple admin operations
 */
export function useAdminActions() {
  const banUser = useAdminBanUser()
  const unbanUser = useAdminUnbanUser()
  const setRole = useAdminSetRole()
  const createUser = useAdminCreateUser()
  const updateUser = useAdminUpdateUser()
  const removeUser = useAdminRemoveUser()

  return {
    // Mutation functions
    banUser: banUser.mutate,
    banUserAsync: banUser.mutateAsync,
    unbanUser: unbanUser.mutate,
    unbanUserAsync: unbanUser.mutateAsync,
    setRole: setRole.mutate,
    setRoleAsync: setRole.mutateAsync,
    createUser: createUser.mutate,
    createUserAsync: createUser.mutateAsync,
    updateUser: updateUser.mutate,
    updateUserAsync: updateUser.mutateAsync,
    removeUser: removeUser.mutate,
    removeUserAsync: removeUser.mutateAsync,

    // Loading states
    isLoading: {
      ban: banUser.isPending,
      unban: unbanUser.isPending,
      setRole: setRole.isPending,
      create: createUser.isPending,
      update: updateUser.isPending,
      remove: removeUser.isPending,
    },

    // Error states
    errors: {
      ban: banUser.error,
      unban: unbanUser.error,
      setRole: setRole.error,
      create: createUser.error,
      update: updateUser.error,
      remove: removeUser.error,
    },
  }
}

/**
 * Type exports for use in components
 */
export type AdminPlatformRole = PlatformRole
export type AdminActions = ReturnType<typeof useAdminActions>
