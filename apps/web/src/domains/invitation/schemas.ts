/**
 * Invitation Domain - Zod Schemas
 *
 * Validation schemas for invitation operations
 * Separated from endpoints to allow reuse across client and server contexts
 */

import { z } from "zod";

// ============================================================================
// INPUT SCHEMAS - Platform Invitations (Custom Plugin)
// ============================================================================

/**
 * Create a new platform invitation
 */
export const createPlatformInvitationSchema = z.object({
  email: z.email(),
  role: z.string(),
});

/**
 * List all platform invitations
 */
export const listPlatformInvitationsSchema = z
  .object({
    status: z.enum(["pending", "used", "expired"]).optional(),
  })
  .optional();

/**
 * Check if an invitation token is valid
 */
export const checkPlatformInvitationSchema = z.object({
  token: z.string(),
});

/**
 * Validate an invitation token with user details
 */
export const validatePlatformInvitationSchema = z.object({
  token: z.string(),
  password: z.string(),
  name: z.string(),
});

// ============================================================================
// INPUT SCHEMAS - Organization Invitations (Built-in Plugin)
// ============================================================================

/**
 * Accept an invitation
 */
export const acceptInvitationSchema = z.object({
  invitationId: z.string(),
});

/**
 * Reject an invitation
 */
export const rejectInvitationSchema = z.object({
  invitationId: z.string(),
});

/**
 * Cancel an invitation (by inviter)
 */
export const cancelInvitationSchema = z.object({
  invitationId: z.string(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreatePlatformInvitationInput = z.infer<
  typeof createPlatformInvitationSchema
>;
export type ListPlatformInvitationsInput = z.infer<
  typeof listPlatformInvitationsSchema
>;
export type CheckPlatformInvitationInput = z.infer<
  typeof checkPlatformInvitationSchema
>;
export type ValidatePlatformInvitationInput = z.infer<
  typeof validatePlatformInvitationSchema
>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type RejectInvitationInput = z.infer<typeof rejectInvitationSchema>;
export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>;
