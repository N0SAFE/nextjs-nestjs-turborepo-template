import { admin, organization } from "better-auth/plugins";
import { statement, ac, roles, schemas } from "./config";
import { type InvitePluginOptions, invitePlugin } from "../server/index";

// Export all system classes and types
export * from "./system";

// Export built configuration
export { statement, ac, roles, schemas };

// Export role names constant and type for type-safe role access
export { ROLE_NAMES, type RoleName } from './config';

// Export resource names constant and types for type-safe resource access
export { RESOURCE_NAMES, type ResourceName, type ActionsForResource } from './config';

// Export common permissions
export { commonPermissions, type CommonPermissionKeys, type CommonPermission } from "./common";

// Export utilities
export * from './utils';

// Export access control utilities
export * from './access-control';

export function useAdmin(
  options: Omit<Parameters<typeof admin>[0], "ac" | "roles"> = {}
) {
  return admin({
    ac,
    roles,
    ...options,
  });
}

export function useOrganization(
  options: Omit<Parameters<typeof organization>[0], "ac" | "roles"> = {}
) {
  return organization({
    ac,
    roles,
    ...options,
  });
}

// Infer the actual role names type from the schemas
type ConfiguredRoleNames = typeof schemas.roleNames extends { _output: infer T } ? T extends string ? T : string : string;

/**
 * Type-safe helper to configure the invite plugin with your role system
 * Uses the generated role schema for validation
 * 
 * @example
 * ```typescript
 * import { useInvite } from '@repo/auth/permissions/invite'
 * 
 * betterAuth({
 *   plugins: [
 *     useAdmin({ defaultRole: 'sarah' }),
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

