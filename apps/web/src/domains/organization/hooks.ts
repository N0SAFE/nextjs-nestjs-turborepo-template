"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { organizationEndpoints } from "./endpoints";
import { organizationInvalidations } from "./invalidations";
import { wrapWithInvalidations } from "@/domains/shared/helpers";

// Use Better Auth $Infer types
import { authClient } from "@/lib/auth/options";
type Organization = typeof authClient.$Infer.Organization;
type OrganizationMember = typeof authClient.$Infer.Member;
type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;
import type { OrganizationRole } from "@repo/auth"

// ============================================================================
// ENHANCED ENDPOINTS WITH INVALIDATIONS
// ============================================================================

const enhancedOrganization = wrapWithInvalidations(
  organizationEndpoints,
  organizationInvalidations,
);

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch a paginated list of organizations
 *
 * @example
 * ```ts
 * const { data: organizations } = useOrganizations()
 * ```
 */
export function useOrganizations(options?: {
  pagination?: {
    page?: number;
    pageSize?: number;
  };
  enabled?: boolean;
}) {
  return useQuery(
    organizationEndpoints.list.queryOptions({
      input: options?.pagination,
      enabled: options?.enabled ?? true,
    }),
  );
}

/**
 * Hook to fetch a specific organization by ID
 *
 * @example
 * ```ts
 * const { data: organization } = useOrganization('org-id')
 * ```
 */
export function useOrganization(
  organizationId: string,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery(
    organizationEndpoints.get.queryOptions({
      input: { organizationId },
      enabled: (options?.enabled ?? true) && !!organizationId,
    }),
  );
}

/**
 * Hook to fetch members of an organization
 *
 * @example
 * ```ts
 * const { data: members } = useOrganizationMembers('org-id')
 * ```
 */
export function useOrganizationMembers(
  organizationId: string,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery(
    organizationEndpoints.listMembers.queryOptions({
      input: { organizationId },
      enabled: (options?.enabled ?? true) && !!organizationId,
    }),
  );
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new organization
 *
 * @example
 * ```ts
 * const createOrg = useCreateOrganization()
 * createOrg.mutate({ name: 'Acme', slug: 'acme' })
 * ```
 */
export function useCreateOrganization() {
  const router = useRouter();

  return useMutation(
    enhancedOrganization.create.mutationOptions({
      onSuccess: enhancedOrganization.create.withInvalidationOnSuccess((newOrg) => {
        toast.success(`Organization "${newOrg.name}" created successfully!`);
        router.push(`/dashboard/organizations/${newOrg.id}`);
      }),
      onError: (error) => {
        toast.error(`Failed to create organization: ${error.message ?? 'Unknown error'}`);
      },
    }),
  )
}

/**
 * Hook to update an organization
 *
 * @example
 * ```ts
 * const updateOrg = useUpdateOrganization()
 * updateOrg.mutate({ organizationId: 'org-id', name: 'New Name' })
 * ```
 */
export function useUpdateOrganization() {
  return useMutation(
    enhancedOrganization.update.mutationOptions({
      onSuccess: enhancedOrganization.update.withInvalidationOnSuccess(() => {
        toast.success("Organization updated successfully!");
      }),
      onError: (error) => {
        toast.error(`Failed to update organization: ${error.message ?? 'Unknown error'}`);
      },
    }),
  )
}

/**
 * Hook to delete an organization
 *
 * @example
 * ```ts
 * const deleteOrg = useDeleteOrganization()
 * deleteOrg.mutate({ organizationId: 'org-id' })
 * ```
 */
export function useDeleteOrganization() {
  const router = useRouter();

  return useMutation(
    enhancedOrganization.delete.mutationOptions({
      onSuccess: enhancedOrganization.delete.withInvalidationOnSuccess(() => {
        toast.success("Organization deleted successfully!");
        router.push("/dashboard/organizations");
      }),
      onError: (error) => {
        toast.error(`Failed to delete organization: ${error.message ?? 'Unknown error'}`);
      },
    }),
  )
}

/**
 * Hook to invite a member to an organization
 *
 * @example
 * ```ts
 * const inviteMember = useInviteOrganizationMember()
 * inviteMember.mutate({ organizationId: 'org-id', email: 'user@example.com', role: 'member' })
 * ```
 */
export function useInviteOrganizationMember() {
  return useMutation(
    enhancedOrganization.inviteMember.mutationOptions({
      onSuccess: enhancedOrganization.inviteMember.withInvalidationOnSuccess((_, variables) => {
        toast.success(`Invitation sent to ${variables.email}!`);
      }),
      onError: (error) => {
        toast.error(`Failed to invite member: ${error.message ?? 'Unknown error'}`);
      },
    }),
  )
}

/**
 * Hook to update a member's role
 *
 * @example
 * ```ts
 * const updateRole = useUpdateOrganizationMemberRole()
 * updateRole.mutate({ organizationId: 'org-id', memberId: 'user-id', role: 'admin' })
 * ```
 */
export function useUpdateOrganizationMemberRole() {
  return useMutation(
    enhancedOrganization.updateMemberRole.mutationOptions({
      onSuccess: enhancedOrganization.updateMemberRole.withInvalidationOnSuccess(() => {
        toast.success("Member role updated successfully!");
      }),
      onError: (error) => {
        toast.error(`Failed to update member role: ${error.message ?? 'Unknown error'}`);
      },
    }),
  )
}

/**
 * Hook to remove a member from an organization
 *
 * @example
 * ```ts
 * const removeMember = useRemoveOrganizationMember()
 * removeMember.mutate({ organizationId: 'org-id', memberIdOrEmail: 'user@example.com' })
 * ```
 */
export function useRemoveOrganizationMember() {
  return useMutation(
    enhancedOrganization.removeMember.mutationOptions({
      onSuccess: enhancedOrganization.removeMember.withInvalidationOnSuccess(() => {
        toast.success("Member removed successfully!");
      }),
      onError: (error) => {
        toast.error(`Failed to remove member: ${error.message ?? 'Unknown error'}`);
      },
    }),
  )
}

// ============================================================================
// HELPER HOOKS - PENDING INVITATIONS
// ============================================================================

/**
 * Hook to fetch pending invitations for a specific organization
 *
 * @example
 * ```ts
 * const { data: invitations } = useOrganizationPendingInvitations('org-id')
 * ```
 */
export function useOrganizationPendingInvitations(
  organizationId: string,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery(
    organizationEndpoints.listInvitations.queryOptions({
      input: { organizationId },
      enabled: (options?.enabled ?? true) && !!organizationId,
    }),
  );
}

/**
 * Hook to fetch all pending invitations across all user organizations
 * Aggregates pending invitations from all organizations the user belongs to
 *
 * @example
 * ```ts
 * const { data: allPending } = useAllOrganizationPendingInvitations()
 * ```
 */
/**
 * Hook to fetch all pending invitations for the current user
 * Includes invitations from all organizations
 *
 * @example
 * ```ts
 * const { data: allInvitations } = useAllOrganizationPendingInvitations()
 * ```
 */
export function useAllOrganizationPendingInvitations(options?: {
  enabled?: boolean;
}) {
  return useQuery(
    organizationEndpoints.listUserInvitations.queryOptions({
      input: undefined,
      enabled: options?.enabled ?? true,
    }),
  );
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  Organization,
  ActiveOrganization,
  OrganizationMember,
  OrganizationRole,
};
