'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type QueryClient } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { toast } from 'sonner'
import type { z } from 'zod'
import type { userSchema } from '@repo/api-contracts/common/user'

// Infer types from the contract schemas
type User = z.infer<typeof userSchema>

/**
 * User management hooks for user CRUD operations and profile management
 * 
 * These hooks provide comprehensive user management capabilities:
 * - User listing with pagination, filtering, and sorting
 * - Individual user profile retrieval
 * - User creation, updates, and deletion
 * - Email validation and availability checking
 * - User statistics and metrics
 */

// Hook to get paginated list of users
export function useUsers(options?: {
  pagination?: {
    page?: number
    pageSize?: number
  }
  sort?: {
    field?: keyof User
    direction?: 'asc' | 'desc'
  }
  filter?: Partial<Pick<User, 'id' | 'email' | 'name'>>
  enabled?: boolean
}) {
  const params = {
    pagination: {
      page: options?.pagination?.page || 1,
      pageSize: options?.pagination?.pageSize || 20,
    },
    sort: {
      field: (options?.sort?.field || 'name') as keyof User,
      direction: options?.sort?.direction || 'asc' as const,
    },
    filter: options?.filter,
  }

  return useQuery(orpc.user.list.queryOptions({
    input: params,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  }))
}

// Hook to get a specific user by ID
export function useUser(userId: string, options?: {
  enabled?: boolean
}) {
  return useQuery(orpc.user.findById.queryOptions({
    input: { id: userId },
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  }))
}

// Hook to create a new user
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation(orpc.user.create.mutationOptions({
    onSuccess: (newUser) => {
      // Invalidate user list to refresh data with proper input structure
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.list.queryKey({ 
          input: {
            pagination: { limit: 10, offset: 0 },
            sort: { field: 'createdAt', direction: 'desc' }
          }
        })
      })
      // Invalidate user count
      queryClient.invalidateQueries({ queryKey: orpc.user.count.queryKey({ input: {} }) })
      toast.success(`User "${newUser.name}" created successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`)
    },
  }))
}

// Hook to update a user
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation(orpc.user.update.mutationOptions({
    onSuccess: (updatedUser, variables) => {
      // Invalidate user list to refresh data with proper input structure
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.list.queryKey({ 
          input: {
            pagination: { limit: 10, offset: 0 },
            sort: { field: 'createdAt', direction: 'desc' }
          }
        })
      })
      // Invalidate the specific user query
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.findById.queryKey({ input: { id: variables.id } }) 
      })
      toast.success(`User "${updatedUser.name}" updated successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`)
    },
  }))
}

// Hook to delete a user
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation(orpc.user.delete.mutationOptions({
    onSuccess: (_, variables) => {
      // Invalidate user list to refresh data with proper input structure
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.list.queryKey({ 
          input: {
            pagination: { limit: 10, offset: 0 },
            sort: { field: 'createdAt', direction: 'desc' }
          }
        })
      })
      // Invalidate user count
      queryClient.invalidateQueries({ queryKey: orpc.user.count.queryKey({ input: {} }) })
      // Remove the specific user from cache
      queryClient.removeQueries({ 
        queryKey: orpc.user.findById.queryKey({ input: { id: variables.id } }) 
      })
      toast.success('User deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`)
    },
  }))
}

// Hook to check email availability
export function useCheckEmail() {
  return useMutation(orpc.user.checkEmail.mutationOptions({
    onError: (error: Error) => {
      toast.error(`Failed to check email availability: ${error.message}`)
    },
  }))
}

// Hook to get user count and statistics
export function useUserCount(options?: {
  enabled?: boolean
}) {
  return useQuery(orpc.user.count.queryOptions({
    input: {},
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  }))
}

// Hook for user search functionality
export function useUserSearch(searchQuery?: string, options?: {
  enabled?: boolean
  limit?: number
}) {
  return useUsers({
    filter: searchQuery ? {
      name: searchQuery,
      email: searchQuery,
    } : undefined,
    pagination: {
      pageSize: options?.limit || 10,
    },
    enabled: (options?.enabled ?? true) && !!searchQuery,
  })
}

// Hook for user management actions
export function useUserActions() {
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const checkEmail = useCheckEmail()

  return {
    // User CRUD actions
    createUser: createUser.mutate,
    createUserAsync: createUser.mutateAsync,
    updateUser: updateUser.mutate,
    updateUserAsync: updateUser.mutateAsync,
    deleteUser: deleteUser.mutate,
    deleteUserAsync: deleteUser.mutateAsync,
    
    // Email validation
    checkEmail: checkEmail.mutate,
    checkEmailAsync: checkEmail.mutateAsync,
    
    // Loading states
    isLoading: {
      create: createUser.isPending,
      update: updateUser.isPending,
      delete: deleteUser.isPending,
      checkEmail: checkEmail.isPending,
    },
    
    // Error states
    errors: {
      create: createUser.error,
      update: updateUser.error,
      delete: deleteUser.error,
      checkEmail: checkEmail.error,
    },
    
    // Success states
    isSuccess: {
      create: createUser.isSuccess,
      update: updateUser.isSuccess,
      delete: deleteUser.isSuccess,
      checkEmail: checkEmail.isSuccess,
    }
  }
}

// Hook for user profile management
export function useUserProfile(userId?: string) {
  const user = useUser(userId || '', { enabled: !!userId })
  const updateUser = useUpdateUser()
  
  return {
    profile: user.data,
    isLoading: user.isLoading,
    isError: user.isError,
    error: user.error,
    refetch: user.refetch,
    
    // Profile update actions
    updateProfile: updateUser.mutate,
    updateProfileAsync: updateUser.mutateAsync,
    isUpdating: updateUser.isPending,
    updateError: updateUser.error,
    updateSuccess: updateUser.isSuccess,
  }
}

// Hook for user administration dashboard
export function useUserAdministration(options?: {
  pageSize?: number
  autoRefresh?: boolean
  refetchInterval?: number
}) {
  const users = useUsers({
    pagination: { pageSize: options?.pageSize || 25 }
  })
  
  const userCount = useUserCount()
  const userActions = useUserActions()

  return {
    // Data
    users: users.data?.users || [],
    totalUsers: userCount.data?.count || 0,
    meta: users.data?.meta,
    
    // Loading states
    isLoading: users.isLoading || userCount.isLoading,
    isRefreshing: users.isFetching,
    
    // Error states
    error: users.error || userCount.error,
    hasError: users.isError || userCount.isError,
    
    // Actions (excluding isLoading to avoid conflict)
    createUser: userActions.createUser,
    createUserAsync: userActions.createUserAsync,
    updateUser: userActions.updateUser,
    updateUserAsync: userActions.updateUserAsync,
    deleteUser: userActions.deleteUser,
    deleteUserAsync: userActions.deleteUserAsync,
    checkEmail: userActions.checkEmail,
    checkEmailAsync: userActions.checkEmailAsync,
    
    // Action-specific loading states
    actionLoading: userActions.isLoading,
    errors: userActions.errors,
    isSuccess: userActions.isSuccess,
    
    // Refresh functions
    refresh: () => {
      users.refetch()
      userCount.refetch()
    },
    
    // Pagination helpers
    pagination: {
      currentPage: Math.floor((users.data?.meta?.pagination?.offset || 0) / (users.data?.meta?.pagination?.limit || 10)) + 1,
      totalPages: Math.ceil((users.data?.meta?.pagination?.total || 0) / (users.data?.meta?.pagination?.limit || 10)),
      hasNextPage: users.data?.meta?.pagination?.hasMore || false,
      hasPrevPage: (users.data?.meta?.pagination?.offset || 0) > 0,
    }
  }
}

// Hook for user selection (e.g., in forms or team management)
export function useUserSelector(options?: {
  multiple?: boolean
  excludeUserIds?: string[]
  filterByRole?: string[]
}) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const users = useUsers()
  
  // Filter users based on options
  const availableUsers = users.data?.users?.filter(user => {
    if (options?.excludeUserIds?.includes(user.id)) return false
    // Add role filtering if needed when roles are added to user schema
    return true
  }) || []
  
  const selectedUsers = availableUsers.filter(user => 
    selectedUserIds.includes(user.id)
  )
  
  const toggleUser = (userId: string) => {
    if (options?.multiple) {
      setSelectedUserIds(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      )
    } else {
      setSelectedUserIds([userId])
    }
  }
  
  const clearSelection = () => setSelectedUserIds([])
  
  const selectAll = () => {
    if (options?.multiple) {
      setSelectedUserIds(availableUsers.map(user => user.id))
    }
  }
  
  return {
    // Available users for selection
    availableUsers,
    selectedUsers,
    selectedUserIds,
    
    // Selection actions
    toggleUser,
    clearSelection,
    selectAll,
    isSelected: (userId: string) => selectedUserIds.includes(userId),
    
    // Loading and error states
    isLoading: users.isLoading,
    error: users.error,
    hasError: users.isError,
    
    // Utility
    hasSelection: selectedUserIds.length > 0,
    selectionCount: selectedUserIds.length,
  }
}

// Utility hook for user validation
export function useUserValidation() {
  const checkEmail = useCheckEmail()
  
  return {
    validateEmail: checkEmail.mutate,
    validateEmailAsync: checkEmail.mutateAsync,
    isValidating: checkEmail.isPending,
    validationError: checkEmail.error,
    
    // Common validation helpers
    isValidName: (name: string) => name.length >= 2 && name.length <= 50,
    isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    
    // Password validation (if needed)
    isValidPassword: (password: string) => password.length >= 8,
  }
}

// ============================================================================
// SERVER-SIDE FUNCTIONS (for Server Components and Server Actions)
// ============================================================================

/**
 * Direct async function for fetching users
 * Used in server components, server actions, or non-React code
 */
export async function getUsers(params: {
  pagination?: { page?: number; pageSize?: number }
  sort?: { field?: string; direction?: 'asc' | 'desc' }
  filter?: Record<string, unknown>
} = {}) {
  return orpc.user.list.call({
    pagination: {
      limit: params.pagination?.page || 1,
      offset: params.pagination?.pageSize || 20,
    },
    sort: {
      field: params.sort?.field || 'name',
      direction: params.sort?.direction || 'asc',
    },
    filter: params.filter,
  })
}

/**
 * Direct async function for fetching a single user
 */
export async function getUser(userId: string) {
  return orpc.user.findById.call({ id: userId })
}

/**
 * Direct async function for user count
 */
export async function getUserCount() {
  return orpc.user.count.call({})
}

// ============================================================================
// PREFETCH FUNCTIONS (for optimistic data loading)
// ============================================================================

/**
 * Prefetch users list for improved perceived performance
 */
export function prefetchUsers(
  queryClient: QueryClient,
  params?: {
    pagination?: { page?: number; pageSize?: number }
    sort?: { field?: keyof User; direction?: 'asc' | 'desc' }
  }
) {
  return queryClient.prefetchQuery(
    orpc.user.list.queryOptions({
      input: {
        pagination: {
          page: params?.pagination?.page || 1,
          pageSize: params?.pagination?.pageSize || 20,
        },
        sort: {
          field: (params?.sort?.field || 'name') as keyof User,
          direction: params?.sort?.direction || 'asc' as const,
        },
      },
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  )
}

/**
 * Prefetch a single user by ID
 */
export function prefetchUser(
  queryClient: QueryClient,
  userId: string
) {
  return queryClient.prefetchQuery(
    orpc.user.findById.queryOptions({
      input: { id: userId },
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  )
}

/**
 * Prefetch user count
 */
export function prefetchUserCount(queryClient: QueryClient) {
  return queryClient.prefetchQuery(
    orpc.user.count.queryOptions({
      input: {},
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
    })
  )
}

// ============================================================================
// INFINITE QUERY HOOKS (for scroll-based pagination)
// ============================================================================

/**
 * Infinite query hook for scroll-based user loading
 */
export function useUsersInfinite(options?: {
  pageSize?: number
  sort?: { field?: keyof User; direction?: 'asc' | 'desc' }
  filter?: Partial<Pick<User, 'id' | 'email' | 'name'>>
}) {
  return useInfiniteQuery(
    orpc.user.list.infiniteOptions({
      input: (context: { pageParam?: number }) => ({
        pagination: {
          page: context?.pageParam || 1,
          pageSize: options?.pageSize || 20,
        },
        sort: {
          field: (options?.sort?.field || 'name') as keyof User,
          direction: options?.sort?.direction || 'asc' as const,
        },
        filter: options?.filter,
      }),
      getNextPageParam: (lastPage: any, _: any, lastPageParam: number) => {
        // Determine if there are more pages
        if (!lastPage.meta?.pagination?.hasMore) {
          return undefined
        }
        return lastPageParam + 1
      },
      getPreviousPageParam: (_: any, __: any, firstPageParam: number) => {
        // Allow going back if not on first page
        if (firstPageParam === 1) {
          return undefined
        }
        return firstPageParam - 1
      },
      initialPageParam: 1,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  )
}

/**
 * Infinite query hook for user search with scroll
 */
export function useUserSearchInfinite(searchQuery?: string, options?: {
  pageSize?: number
}) {
  return useUsersInfinite({
    filter: searchQuery ? {
      name: searchQuery,
      email: searchQuery,
    } : undefined,
    pageSize: options?.pageSize || 20,
  })
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate all user-related queries
 */
export function invalidateAllUserQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['user'] })
}

/**
 * Invalidate user list cache
 */
export function invalidateUserListCache(queryClient: QueryClient) {
  queryClient.invalidateQueries({ 
    queryKey: orpc.user.list.queryKey({ 
      input: {
        pagination: { limit: 10, offset: 0 },
        sort: { field: 'createdAt', direction: 'desc' }
      }
    }) 
  })
}

/**
 * Invalidate specific user cache
 */
export function invalidateUserCache(queryClient: QueryClient, userId: string) {
  queryClient.invalidateQueries({ 
    queryKey: orpc.user.findById.queryKey({ input: { id: userId } }) 
  })
}

// Export types for use in components
export type UserData = User
export type UserList = ReturnType<typeof useUsers>
export type UserActions = ReturnType<typeof useUserActions>
export type UserProfile = ReturnType<typeof useUserProfile>
export type UserAdministration = ReturnType<typeof useUserAdministration>
export type UserSelector = ReturnType<typeof useUserSelector>
export type UserValidation = ReturnType<typeof useUserValidation>
export type UsersInfinite = ReturnType<typeof useUsersInfinite>
