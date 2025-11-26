import { admin, organization } from "better-auth/plugins";
import { statement, ac, roles, schemas } from "./config";

// Export all system classes and types
export * from "./system";

// Export built configuration
export { statement, ac, roles, schemas };

// Export common permissions
export { commonPermissions, type CommonPermissionKeys, type CommonPermission } from "./common";

// Export utilities
export * from './utils';

// Export invite helper
export { useInvite } from './invite';

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
