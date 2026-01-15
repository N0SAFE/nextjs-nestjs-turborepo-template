"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { invitationEndpoints } from "./endpoints";
import { invitationInvalidations } from "./invalidations";
import { wrapWithInvalidations } from "@/domains/shared/helpers";

// ============================================================================
// ENHANCED ENDPOINTS WITH INVALIDATIONS
// ============================================================================

const enhancedInvitation = wrapWithInvalidations(
  invitationEndpoints,
  invitationInvalidations,
);

// ============================================================================
// PLATFORM INVITATION HOOKS (Custom Plugin)
// ============================================================================

/**
 * List platform invitations with optional status filter
 */
export function usePlatformInvitations(options?: {
  status?: "pending" | "used" | "expired";
  enabled?: boolean;
}) {
  return useQuery(
    invitationEndpoints.listPlatform.queryOptions({
      input: { status: options?.status },
      enabled: options?.enabled ?? true,
    }),
  );
}

/**
 * Create a new platform invitation
 */
export function useCreatePlatformInvitation() {
  return useMutation(
    invitationEndpoints.createPlatform.mutationOptions({
      onSuccess: enhancedInvitation.createPlatform.withInvalidationOnSuccess(
        () => {
          toast.success("Platform invitation created!");
        },
      ),
      onError: (error) => {
        toast.error(
          `Failed to create invitation: ${error.message ?? "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Check platform invitation validity (public endpoint)
 */
export function useCheckPlatformInvitation() {
  return useMutation(
    invitationEndpoints.checkPlatform.mutationOptions({
      onError: (error) => {
        toast.error(`Invalid invitation: ${error.message ?? "Unknown error"}`);
      },
    }),
  );
}

/**
 * Validate platform invitation and create account (public endpoint)
 */
export function useValidatePlatformInvitation() {
  return useMutation(
    invitationEndpoints.validatePlatform.mutationOptions({
      onSuccess: enhancedInvitation.validatePlatform.withInvalidationOnSuccess(
        () => {
          toast.success("Account created successfully!");
        },
      ),
      onError: (error) => {
        toast.error(
          `Failed to create account: ${error.message ?? "Unknown error"}`,
        );
      },
    }),
  );
}

// ============================================================================
// ORGANIZATION INVITATION HOOKS (Built-in Plugin)
// ============================================================================

/**
 * Accept an organization invitation
 */
export function useAcceptInvitation() {
  return useMutation(
    invitationEndpoints.acceptOrganization.mutationOptions({
      onSuccess:
        enhancedInvitation.acceptOrganization.withInvalidationOnSuccess(() => {
          toast.success("Invitation accepted!");
        }),
      onError: (error) => {
        toast.error(
          `Failed to accept invitation: ${error.message ?? "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Reject an organization invitation
 */
export function useRejectInvitation() {
  return useMutation(
    invitationEndpoints.rejectOrganization.mutationOptions({
      onSuccess:
        enhancedInvitation.rejectOrganization.withInvalidationOnSuccess(() => {
          toast.success("Invitation rejected");
        }),
      onError: (error) => {
        toast.error(
          `Failed to reject invitation: ${error.message ?? "Unknown error"}`,
        );
      },
    }),
  );
}

/**
 * Cancel/revoke an invitation (for organization admins)
 */
export function useCancelInvitation() {
  return useMutation(
    invitationEndpoints.cancelOrganization.mutationOptions({
      onSuccess:
        enhancedInvitation.cancelOrganization.withInvalidationOnSuccess(() => {
          toast.success("Invitation cancelled");
        }),
      onError: (error) => {
        toast.error(
          `Failed to cancel invitation: ${error.message ?? "Unknown error"}`,
        );
      },
    }),
  );
}
