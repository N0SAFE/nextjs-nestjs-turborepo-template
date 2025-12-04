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

/**
 * Exported role names as a const tuple for type-safe access.
 * This includes both default Better Auth roles and custom roles.
 */
export const ROLE_NAMES = Object.keys(roles) as (keyof typeof roles)[];

/**
 * Type representing all valid role names
 */
export type RoleName = keyof typeof roles;

/**
 * Exported resource names as a const tuple for type-safe access.
 */
export const RESOURCE_NAMES = Object.keys(statement) as (keyof typeof statement)[];

/**
 * Type representing all valid resource names
 */
export type ResourceName = keyof typeof statement;

/**
 * Type representing all valid actions for a specific resource
 */
export type ActionsForResource<R extends ResourceName> = typeof statement[R][number];
