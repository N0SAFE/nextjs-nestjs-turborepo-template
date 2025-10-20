import { PermissionBuilder } from "./system/builder/builder";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const permissionConfig = PermissionBuilder.withDefaults(defaultStatements)
    .resource("system")
    .actions(["maintenance", "backup", "restore", "monitor"] as const)
    .resources({
        project: ["create", "read", "update", "delete", "share"] as const,
        organization: ["create", "read", "update", "delete", "manage-members"] as const,
        billing: ["read", "update", "manage-subscriptions"] as const,
        analytics: ["read", "export"] as const,
    })
    .role("superAdmin")
    .allPermissions()
    .roles((ac) => {
        return {
            admin: ac.newRole({
                user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"],
                session: ["list", "revoke", "delete"],
                project: ["create", "read", "update", "delete", "share"],
                organization: ["read", "update", "manage-members"],
                billing: ["read"],
                analytics: ["read"],
            }),

            sarah: ac.newRole({
                user: ["get"],
                session: ["list"],
                project: ["read"],
                organization: ["read"],
                analytics: ["read"],
            }),

            manager: ac.newRole({
                user: ["list"],
                session: ["list"],
                project: ["create", "read", "update", "delete", "share"],
                organization: ["read", "update"],
                billing: ["read"],
            }),

            editor: ac.newRole({
                project: ["create", "read", "update", "share"],
                organization: ["read"],
                analytics: ["read"],
            }),

            viewer: ac.newRole({
                project: ["read"],
                organization: ["read"],
                analytics: ["read"],
            }),

            user: ac.newRole({
                project: ["read"],
                organization: ["read"],
            }),
        };
    });
