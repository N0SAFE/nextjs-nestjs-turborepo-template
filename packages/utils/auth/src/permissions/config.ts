import { PermissionBuilder } from "./system/builder/builder";
import { defaultRoles } from "better-auth/plugins/admin/access";

/**
 * Creates a permission configuration object
 * @param options Configuration options
 * @returns Permission configuration with checkPermission function and error message
 */
export function createPermissionConfig<Session>(options: {
  checkPermission: (session: Session | null | undefined) => boolean | Promise<boolean>;
  errorMessage?: string;
}): {
  checkPermission: (session: Session | null | undefined) => boolean | Promise<boolean>;
  errorMessage: string;
} {
  return {
    checkPermission: options.checkPermission,
    errorMessage: options.errorMessage ?? 'Permission denied',
  };
}

const builder = PermissionBuilder.withDefaults(defaultRoles)
    .resources(({ actions }) => ({
        capsule: actions(['list', 'read', 'create', 'update', 'delete'] as const)
    }))
    .roles(({ permissions }) => ({
        admin: permissions({
            capsule: ["list", "read", "create", "update", "delete"],
            // user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"],
            // session: ["list", "revoke", "delete"],
        }),

        sarah: permissions({
            capsule: ["list", "read"],
            // user: ["get"],
            // session: ["list"],
        }),
    }));

export const permissionConfig = builder.build();
export const { statement, ac, roles, schemas } = permissionConfig;
