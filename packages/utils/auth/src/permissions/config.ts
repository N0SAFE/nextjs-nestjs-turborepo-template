import { PermissionBuilder } from "./system/builder/builder";
import { defaultRoles } from "better-auth/plugins/admin/access";

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
