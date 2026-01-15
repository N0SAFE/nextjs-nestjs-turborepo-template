"use client";

/**
 * Admin Domain - Client Hooks
 *
 * React hooks for administrative operations using Better Auth's Admin plugin.
 * Uses the custom contract system with automatic cache invalidation.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { adminEndpoints } from "./endpoints";
import { adminInvalidations } from "./invalidations";
import { wrapWithInvalidations } from "../shared/helpers";
import { toast } from "sonner";

// ============================================================================
// ENHANCED ENDPOINTS WITH INVALIDATIONS
// ============================================================================

/**
 * Admin endpoints enhanced with automatic cache invalidation
 */
const enhancedAdmin = wrapWithInvalidations(adminEndpoints, adminInvalidations);

// ============================================================================
// QUERY HOOKS (Read Operations)
// ============================================================================

/**
 * List users with pagination
 */
export function useAdminListUsers(options?: {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  enabled?: boolean;
}) {
  return useQuery(
    enhancedAdmin.listUsers.queryOptions({
      input: {
        query: {
          limit: options?.limit,
          offset: options?.offset,
          sortBy: options?.sortBy,
          sortDirection: options?.sortDirection,
        },
      },
      enabled: options?.enabled ?? true,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    }),
  );
}

/**
 * Check if user has permissions
 */
export function useAdminHasPermission(
  permissions: Record<string, string[]>,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery(
    enhancedAdmin.hasPermission.queryOptions({
      input: { permissions },
      enabled: options?.enabled ?? true,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    }),
  );
}

// ============================================================================
// MUTATION HOOKS (Write Operations)
// ============================================================================

/**
 * Ban a user
 */
export function useAdminBanUser() {
  return useMutation(
    enhancedAdmin.banUser.mutationOptions({
      onSuccess: enhancedAdmin.banUser.withInvalidationOnSuccess(() => {
        toast.success("User banned successfully");
      }),
      onError: (error) => {
        toast.error(
          `Failed to ban user: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Unban a user
 */
export function useAdminUnbanUser() {
  return useMutation(
    enhancedAdmin.unbanUser.mutationOptions({
      onSuccess: enhancedAdmin.unbanUser.withInvalidationOnSuccess(() => {
        toast.success("User unbanned successfully");
      }),
      onError: (error) => {
        toast.error(
          `Failed to unban user: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Set user role
 */
export function useAdminSetRole() {
  return useMutation(
    enhancedAdmin.setRole.mutationOptions({
      onSuccess: enhancedAdmin.setRole.withInvalidationOnSuccess(
        (_, variables) => {
          const roleStr = Array.isArray(variables.role)
            ? variables.role.join(", ")
            : variables.role;
          toast.success(`User role updated to ${roleStr}`);
        },
      ),
      onError: (error) => {
        toast.error(
          `Failed to update role: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Create user
 */
export function useAdminCreateUser() {
  return useMutation(
    enhancedAdmin.createUser.mutationOptions({
      onSuccess: enhancedAdmin.createUser.withInvalidationOnSuccess(() => {
        toast.success("User created successfully");
      }),
      onError: (error) => {
        toast.error(
          `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Update user
 */
export function useAdminUpdateUser() {
  return useMutation(
    enhancedAdmin.updateUser.mutationOptions({
      onSuccess: enhancedAdmin.updateUser.withInvalidationOnSuccess(() => {
        toast.success("User updated successfully");
      }),
      onError: (error) => {
        toast.error(
          `Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Remove user
 */
export function useAdminRemoveUser() {
  return useMutation(
    enhancedAdmin.removeUser.mutationOptions({
      onSuccess: enhancedAdmin.removeUser.withInvalidationOnSuccess(() => {
        toast.success("User removed successfully");
      }),
      onError: (error) => {
        toast.error(
          `Failed to remove user: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      },
    }),
  );
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * All admin actions in one hook
 */
export function useAdminActions() {
  const banUser = useAdminBanUser();
  const unbanUser = useAdminUnbanUser();
  const setRole = useAdminSetRole();
  const createUser = useAdminCreateUser();
  const updateUser = useAdminUpdateUser();
  const removeUser = useAdminRemoveUser();

  return {
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

    isLoading: {
      ban: banUser.isPending,
      unban: unbanUser.isPending,
      setRole: setRole.isPending,
      create: createUser.isPending,
      update: updateUser.isPending,
      remove: removeUser.isPending,
    },

    errors: {
      ban: banUser.error,
      unban: unbanUser.error,
      setRole: setRole.error,
      create: createUser.error,
      update: updateUser.error,
      remove: removeUser.error,
    },
  };
}
