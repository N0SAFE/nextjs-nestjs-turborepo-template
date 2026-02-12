/**
 * User Domain - Client Hooks
 *
 * React hooks for user management with automatic cache invalidation
 */

"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { userEndpoints } from "./endpoints";
import { userInvalidations } from "./invalidations";
import { wrapWithInvalidations } from "../shared/helpers";

// Wrap endpoints with automatic invalidation
const enhancedUser = wrapWithInvalidations(userEndpoints, userInvalidations);

// ============================================================================
// QUERY HOOKS (Read Operations)
// ============================================================================

/**
 * List users with filters
 */
export function useUserList(
  input: Parameters<typeof userEndpoints.list.call>[0],
) {
  return useQuery(userEndpoints.list.queryOptions({ input: input }));
}

/**
 * Get user by ID
 */
export function useUser(userId: string) {
  return useQuery(
    userEndpoints.findById.queryOptions({ input: { params: { id: userId } } }),
  );
}

/**
 * Check if email is available
 */
export function useCheckEmail(email: string, options?: { enabled?: boolean }) {
  return useQuery(
    userEndpoints.checkEmail.queryOptions({ input: { email }, enabled: options?.enabled ?? !!email }),
  );
}

/**
 * Get user count statistics
 */
export function useUserCount() {
  return useQuery(userEndpoints.count.queryOptions());
}

// ============================================================================
// MUTATION HOOKS (Write Operations)
// ============================================================================

/**
 * Create user mutation
 * Invalidates user list after creation
 */
export function useCreateUser() {
  return useMutation(
    userEndpoints.create.mutationOptions({
      onSuccess: enhancedUser.create.withInvalidationOnSuccess(),
    }),
  );
}

/**
 * Update user mutation
 * Invalidates both the specific user and the user list
 */
export function useUpdateUser() {
  return useMutation(
    userEndpoints.update.mutationOptions({
      onSuccess: enhancedUser.update.withInvalidationOnSuccess(),
    }),
  );
}

/**
 * Delete user mutation
 * Invalidates user list and removes the deleted user from cache
 */
export function useDeleteUser() {
  return useMutation(
    userEndpoints.delete.mutationOptions({
      onSuccess: enhancedUser.delete.withInvalidationOnSuccess(),
    }),
  );
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Get all user mutations in one hook
 */
export function useUserActions() {
  const create = useCreateUser();
  const update = useUpdateUser();
  const deleteUser = useDeleteUser();

  return {
    create,
    update,
    delete: deleteUser,

    isLoading: {
      create: create.isPending,
      update: update.isPending,
      delete: deleteUser.isPending,
    },

    errors: {
      create: create.error,
      update: update.error,
      delete: deleteUser.error,
    },
  };
}
