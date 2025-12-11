/**
 * Client-side Better Auth plugins
 * 
 * This module exports all client plugins and their wrapper functions.
 * Use the `use*Client` functions for plugins that require access control configuration.
 */

import { adminClient, organizationClient } from "better-auth/client/plugins";
import type { BetterAuthClientPlugin } from "better-auth/client";
import {
  ac,
  organizationAc,
  organizationRoles,
  roles,
} from "../../permissions/index";
import type { invitePlugin } from "../../server/plugins/invite";

// ============================================================================
// Re-export existing plugins
// ============================================================================

export { default as masterTokenClient } from "./masterToken";
export { loginAsClientPlugin } from "./loginAs";

// Re-export guards
export * from "./guards";

// Re-export plugin utilities
export * from "./masterToken/state";
export type { MasterTokenActions } from "./masterToken/guard";

// Export components
export { MasterTokenProvider, useMasterToken } from "./masterToken/components/provider";

// ============================================================================
// Admin Client Plugin
// ============================================================================

/**
 * Client plugin wrapper for the admin plugin
 * 
 * Pre-configures adminClient with the project's access control and roles.
 * This ensures the client has the same AC configuration as the server.
 * 
 * Provides type-safe methods for:
 * - Creating/updating/deleting users
 * - Managing user roles and bans
 * - Impersonating users
 * - Checking permissions
 * 
 * @example
 * ```typescript
 * import { useAdminClient } from '@repo/auth/client/plugins'
 * 
 * const authClient = createAuthClient({
 *   plugins: [useAdminClient()]
 * })
 * 
 * // Check permissions
 * const canCreate = await authClient.admin.hasPermission({
 *   permissions: { project: ['create'] }
 * })
 * 
 * // Set user role
 * await authClient.admin.setRole({
 *   userId: 'user-id',
 *   role: 'admin'
 * })
 * ```
 */
export function useAdminClient(
  options: Omit<Parameters<typeof adminClient>[0], "ac" | "roles"> = {}
) {
  return adminClient({
    ac,
    roles,
    ...options,
  });
}

export type AdminClientPlugin = ReturnType<typeof useAdminClient>;

// ============================================================================
// Organization Client Plugin
// ============================================================================

/**
 * Client plugin wrapper for the organization plugin
 * 
 * Pre-configures organizationClient with the project's access control and roles.
 * This ensures the client has the same AC configuration as the server.
 * 
 * Provides type-safe methods for:
 * - Creating/updating/deleting organizations
 * - Managing organization members
 * - Managing organization invitations
 * - Checking organization permissions
 * - Teams management (sub-groups within organizations)
 * 
 * @example
 * ```typescript
 * import { useOrganizationClient } from '@repo/auth/client/plugins'
 * 
 * const authClient = createAuthClient({
 *   plugins: [useOrganizationClient()]
 * })
 * 
 * // Create an organization
 * const org = await authClient.organization.create({
 *   name: 'My Organization',
 *   slug: 'my-org'
 * })
 * 
 * // Invite a member
 * await authClient.organization.inviteMember({
 *   organizationId: org.id,
 *   email: 'user@example.com',
 *   role: 'member'
 * })
 * 
 * // Create a team
 * await authClient.organization.createTeam({
 *   name: 'Engineering',
 *   organizationId: org.id
 * })
 * ```
 */
export function useOrganizationClient(
  options: Omit<Parameters<typeof organizationClient>[0], "ac" | "roles"> = {}
) {
  return organizationClient({
    ac: organizationAc,
    roles: organizationRoles,
    // Enable teams feature for sub-group management within organizations
    teams: {
      enabled: true,
    },
    ...options,
  });
}

export type OrganizationClientPlugin = ReturnType<typeof useOrganizationClient>;

// ============================================================================
// Invite Client Plugin
// ============================================================================

/**
 * Client plugin for the invitation system
 * 
 * Provides type-safe methods for:
 * - Creating invitations with email and role
 * - Checking invitation token validity
 * - Validating invitation and creating user account
 * 
 * @example
 * ```typescript
 * import { useInviteClient } from '@repo/auth/client/plugins'
 * 
 * const authClient = createAuthClient({
 *   plugins: [useInviteClient()]
 * })
 * 
 * // Create an invite
 * const { data, error } = await authClient.invite.create({
 *   email: 'user@example.com',
 *   role: 'user'
 * })
 * 
 * // Check an invite
 * const check = await authClient.invite.check({ token: 'abc123...' })
 * 
 * // Validate and create user
 * await authClient.invite.validate({ 
 *   token: 'abc123...', 
 *   password: 'password123',
 *   name: 'John Doe'
 * })
 * ```
 */
export function useInviteClient() {
  return {
    id: "invite",
    $InferServerPlugin: {} as ReturnType<typeof invitePlugin>,
  } satisfies BetterAuthClientPlugin;
}

export type InviteClientPlugin = ReturnType<typeof useInviteClient>;

// Legacy alias for backwards compatibility
/** @deprecated Use `useInviteClient` instead */
export const inviteClient = useInviteClient;
