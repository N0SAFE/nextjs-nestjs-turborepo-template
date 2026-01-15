/**
 * Organization Domain - Zod Schemas
 *
 * Validation schemas for organization operations
 * Separated from endpoints to allow reuse across client and server contexts
 */

import { organizationSchemas } from "@repo/auth";
import { z } from "zod";

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * List organizations with pagination
 */
export const listOrganizationsSchema = z
  .object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
  })
  .optional();

/**
 * Get a specific organization by ID
 */
export const getOrganizationSchema = z.object({
  organizationId: z.string(),
});

/**
 * List members of an organization
 */
export const listMembersSchema = z.object({
  organizationId: z.string(),
});

/**
 * Create a new organization
 */
export const createOrganizationSchema = z.object({
  name: z.string(),
  slug: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Update an existing organization
 */
export const updateOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string().optional(),
  slug: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Delete an organization
 */
export const deleteOrganizationSchema = z.object({
  organizationId: z.string(),
});

/**
 * Invite a member to an organization
 */
export const inviteMemberSchema = z.object({
  organizationId: z.string(),
  email: z.email(),
  role: organizationSchemas.roleNames,
});

/**
 * Update a member's role
 */
export const updateMemberRoleSchema = z.object({
  organizationId: z.string(),
  memberId: z.string(),
  role: organizationSchemas.roleNames,
});

/**
 * Remove a member from an organization
 */
export const removeMemberSchema = z.object({
  organizationId: z.string(),
  memberIdOrEmail: z.string(),
});

/**
 * List pending invitations for an organization
 */
export const listInvitationsSchema = z.object({
  organizationId: z.string().optional(),
});

/**
 * List all invitations for the current user
 */
export const listUserInvitationsSchema = z.object({}).optional();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>;
export type GetOrganizationInput = z.infer<typeof getOrganizationSchema>;
export type ListMembersInput = z.infer<typeof listMembersSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type ListInvitationsInput = z.infer<typeof listInvitationsSchema>;
export type ListUserInvitationsInput = z.infer<typeof listUserInvitationsSchema>;
