'use client'

/**
 * @fileoverview User Hooks - Generated with @repo/orpc-utils/hooks
 * 
 * This file demonstrates the power of the orpc hooks package.
 * Compare this ~50 lines to the ~400+ lines in useUsers.ts!
 * 
 * The hooks module automatically:
 * - Detects operation types from contract metadata (GET=query, POST/PUT/DELETE=mutation)
 * - Creates properly typed hooks with full inference
 * - Sets up cache invalidation based on CRUD patterns
 * - Generates composite hooks for common UI patterns
 */

import { createRouterHooks, createCompositeHooks, defineInvalidations } from '@repo/orpc-utils/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { orpc, appContract } from '@/lib/orpc'

// ============================================================================
// GENERATED HOOKS - Automatic from contract
// ============================================================================

/**
 * Custom invalidation configuration for better cache management.
 * This is optional - the package has smart defaults.
 */
const userInvalidations = defineInvalidations<typeof appContract.user, typeof orpc.user>(orpc.user, {
  // When creating a user, refresh the list and count (broad invalidation)
  create: ['list', 'count'],

  // When updating, invalidate list broadly and target the specific `findById({ id })` variant
  // The callback receives (input, output, context) - input is most useful for invalidation
  update: (input) => ({
    findById: { id: input.id },
  }),

  // When deleting, refresh everything (broad invalidation)
  delete: ['list', 'count', 'findById'],
})

/**
 * Generate all user hooks from the contract.
 * 
 * This single line replaces hundreds of lines of manual hook creation!
 * The package detects from the contract:
 * - list: GET /user → useQuery hook
 * - findById: GET /user/:id → useQuery hook
 * - create: POST /user → useMutation hook
 * - update: PUT /user/:id → useMutation hook
 * - delete: DELETE /user/:id → useMutation hook
 * - checkEmail: POST /user/check-email → useMutation hook
 * - count: GET /user/count → useQuery hook
 * 
 * IMPORTANT: Pass the raw contract type as the first generic parameter
 * to enable type-level hook discrimination. This is required because
 * TanStack Query's createTanstackQueryUtils() wraps contracts into
 * ProcedureUtils types that lose the ~orpc metadata.
 */
const userHooks = createRouterHooks<typeof appContract.user, typeof orpc.user>(orpc.user, {
  invalidations: userInvalidations,
  useQueryClient,
})

/**
 * Composite hooks for common UI patterns.
 * These combine multiple base hooks for specific use cases.
 */
const userComposite = createCompositeHooks(orpc.user, userHooks, {
  useQueryClient,
})

// ============================================================================
// NAMED EXPORTS - For convenience and discoverability
// ============================================================================
// 
// Instead of re-exporting individual hooks (which can cause TypeScript
// "inaccessible unique symbol" errors), we provide a clean API:
//
// Usage Option 1 - Use the hooks object directly:
//   import { userHooks } from '@/hooks/useUser.orpc-hooks'
//   const { data } = userHooks.useList({ limit: 20 })
//
// Usage Option 2 - Destructure in component:
//   import { userHooks } from '@/hooks/useUser.orpc-hooks'
//   const { useList, useCreate, useUpdate, useDelete } = userHooks
//   const { data } = useList({ limit: 20 })
//
// ============================================================================

// Re-export the hooks object for convenient access
export { userHooks, userComposite }

// ============================================================================
// WRAPPER HOOKS - Provide stable named exports
// ============================================================================

/**
 * Hook to fetch paginated user list
 * @example const { data } = useUserList({ limit: 20 })
 */
export function useUserList(...args: Parameters<typeof userHooks.useList>) {
  return userHooks.useList(...args)
}

/**
 * Hook to fetch a single user by ID
 * @example const { data } = useUserFindById({ id: 'user-123' })
 */
export function useUserFindById(...args: Parameters<typeof userHooks.useFindById>) {
  return userHooks.useFindById(...args)
}

/**
 * Hook to get user count statistics
 * @example const { data } = useUserCount()
 */
export function useUserCount(...args: Parameters<typeof userHooks.useCount>) {
  return userHooks.useCount(...args)
}

/**
 * Hook to check email availability
 * @example const { mutate } = useUserCheckEmail()
 */
export function useUserCheckEmail(...args: Parameters<typeof userHooks.useCheckEmail>) {
  return userHooks.useCheckEmail(...args)
}

/**
 * Hook to create a new user
 * @example const { mutate } = useUserCreate()
 */
export function useUserCreate(...args: Parameters<typeof userHooks.useCreate>) {
  return userHooks.useCreate(...args)
}

/**
 * Hook to update an existing user
 * @example const { mutate } = useUserUpdate()
 */
export function useUserUpdate(...args: Parameters<typeof userHooks.useUpdate>) {
  return userHooks.useUpdate(...args)
}

/**
 * Hook to delete a user
 * @example const { mutate } = useUserDelete()
 */
export function useUserDelete(...args: Parameters<typeof userHooks.useDelete>) {
  return userHooks.useDelete(...args)
}

// ============================================================================
// COMPOSITE HOOKS - Advanced UI patterns
// ============================================================================

/**
 * Complete CRUD management with combined loading/error states.
 * Perfect for admin dashboards.
 * 
 * @example
 * ```tsx
 * const { 
 *   list, create, update, delete: del,
 *   isLoading, isAnyMutating 
 * } = useUserManagement()
 * ```
 */
export function useUserManagement(...args: Parameters<typeof userComposite.useManagement>) {
  return userComposite.useManagement(...args)
}

/**
 * Paginated list with page controls.
 * 
 * @example
 * ```tsx
 * const { 
 *   data, page, setPage, hasNext, hasPrev 
 * } = useUserPaginatedList({ pageSize: 10 })
 * ```
 */
export function useUserPaginatedList(...args: Parameters<typeof userComposite.usePaginatedList>) {
  return userComposite.usePaginatedList(...args)
}

/**
 * Infinite scroll pattern with automatic loading.
 * 
 * @example
 * ```tsx
 * const { 
 *   items, loadMore, hasMore, isLoadingMore 
 * } = useUserInfiniteList({ pageSize: 20 })
 * ```
 */
export function useUserInfiniteList(...args: Parameters<typeof userComposite.useInfiniteList>) {
  return userComposite.useInfiniteList(...args)
}

/**
 * Form data management with optimistic updates.
 * 
 * @example
 * ```tsx
 * const { 
 *   data, update, isUpdating 
 * } = useUserFormData(userId)
 * ```
 */
export function useUserFormData(...args: Parameters<typeof userComposite.useFormData>) {
  return userComposite.useFormData(...args)
}

/**
 * Bulk selection and operations.
 * 
 * @example
 * ```tsx
 * const { 
 *   selectedIds, toggleSelection, bulkDelete, isDeleting 
 * } = useUserSelection()
 * ```
 */
export function useUserSelection(...args: Parameters<typeof userComposite.useSelection>) {
  return userComposite.useSelection(...args)
}

// ============================================================================
// TYPE EXPORTS - For TypeScript consumers
// ============================================================================

export type {
  RouterHooks,
  ExtractInput,
  ExtractOutput,
} from '@repo/orpc-utils/hooks'

// Infer types from the hooks for use in components
export type UserListResult = ReturnType<typeof useUserList>
export type UserFindByIdResult = ReturnType<typeof useUserFindById>
export type UserCreateResult = ReturnType<typeof useUserCreate>
export type UserUpdateResult = ReturnType<typeof useUserUpdate>
export type UserDeleteResult = ReturnType<typeof useUserDelete>
