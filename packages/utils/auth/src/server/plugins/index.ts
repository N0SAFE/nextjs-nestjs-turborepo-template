/**
 * Server-side Better Auth plugins
 * 
 * This module exports all server plugins and their wrapper functions.
 * Use the `use*` functions for plugins that require access control configuration.
 */

import { admin, organization } from "better-auth/plugins";
import {
  ac,
  organizationAc,
  organizationRoles,
  roles,
  schemas,
} from "../../permissions/config";
import { invitePlugin, type InvitePluginOptions } from "./invite";

// ============================================================================
// Re-export existing plugins
// ============================================================================

export * from './loginAs'
export * from './masterTokenAuth'
export * from './invite'
export * from './pushNotifications'

// ============================================================================
// Admin Plugin
// ============================================================================

/**
 * Server plugin wrapper for the admin plugin
 * 
 * Pre-configures admin with the project's access control and roles.
 * This ensures the server has consistent AC configuration.
 * 
 * Provides:
 * - User management (create, update, delete)
 * - Role management
 * - Ban management
 * - Impersonation
 * 
 * @example
 * ```typescript
 * import { useAdmin } from '@repo/auth/server/plugins'
 * 
 * betterAuth({
 *   plugins: [
 *     useAdmin({ defaultRole: 'user' })
 *   ]
 * })
 * ```
 */
export function useAdmin(
  options: Omit<Parameters<typeof admin>[0], "ac" | "roles"> = {}
) {
  return admin({
    ac,
    roles,
    ...options,
  });
}

export type AdminPlugin = ReturnType<typeof useAdmin>;

// ============================================================================
// Organization Plugin
// ============================================================================

/**
 * Server plugin wrapper for the organization plugin
 * 
 * Pre-configures organization with the project's access control and roles.
 * This ensures the server has consistent AC configuration.
 * 
 * Provides:
 * - Organization management (create, update, delete)
 * - Member management
 * - Organization invitations
 * - Organization roles
 * - Teams management (sub-groups within organizations)
 * 
 * @example
 * ```typescript
 * import { useOrganization } from '@repo/auth/server/plugins'
 * 
 * betterAuth({
 *   plugins: [
 *     useOrganization()
 *   ]
 * })
 * ```
 */
export function useOrganization(
  options: Omit<Parameters<typeof organization>[0], "ac" | "roles"> = {}
) {
  return organization({
    ac: organizationAc,
    roles: organizationRoles,
    // Enable teams feature for sub-group management within organizations
    teams: {
      enabled: true,
      allowRemovingAllTeams: true, // Allow removing all teams
    },
    ...options,
  });
}

export type OrganizationPlugin = ReturnType<typeof useOrganization>;

// ============================================================================
// Invite Plugin
// ============================================================================

// Infer the actual role names type from the schemas
type ConfiguredRoleNames = typeof schemas.roleNames extends { _output: infer T } ? T extends string ? T : string : string;

/**
 * Type-safe helper to configure the invite plugin with your role system
 * Uses the generated role schema for validation
 * 
 * @example
 * ```typescript
 * import { useInvite } from '@repo/auth/server/plugins'
 * 
 * betterAuth({
 *   plugins: [
 *     useAdmin({ defaultRole: 'guest' }),
 *     useInvite({
 *       inviteDurationDays: 7,
 *     })
 *   ]
 * })
 * ```
 */
export function useInvite(
  options?: Omit<InvitePluginOptions<ConfiguredRoleNames>, "roleSchema">
) {
  return invitePlugin({
    inviteDurationDays: 7,
    ...options,
    // Type assertion is safe here - schemas.roleNames will always be compatible
    // with the RoleSchemaType that invitePlugin expects
    roleSchema: schemas.roleNames,
  } as InvitePluginOptions<ConfiguredRoleNames>);
}

export type InvitePlugin = ReturnType<typeof useInvite>;