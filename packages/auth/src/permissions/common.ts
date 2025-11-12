import { permissionConfig } from "./config";

export const commonPermissions = {
    projectFullAccess: permissionConfig.createPermission(({ statementsConfig }) => ({
        project: statementsConfig.get("project").all(),
    })),

    projectReadOnly: permissionConfig.createPermission({
        project: ["read"],
    }),

    projectEditor: permissionConfig.createPermission(({ statementsConfig }) => ({
        project: statementsConfig.get("project").omit(["delete"]).all(),
    })),

    organizationFullAccess: permissionConfig.createPermission(({ statementsConfig }) => ({
        organization: statementsConfig.get("organization").all(),
    })),

    organizationManagement: permissionConfig.createPermission(({ statementsConfig }) => ({
        organization: statementsConfig.get("organization").omit(["create", "delete"]).all(),
    })),

    organizationReadOnly: permissionConfig.createPermission({
        organization: ["read"],
    }),

    userManagement: permissionConfig.createPermission(({ statementsConfig }) => ({
        user: statementsConfig.get("user").all(),
    })),

    userViewing: permissionConfig.createPermission(({ statementsConfig }) => ({
        user: statementsConfig.get("user").pick(["list", "get"]).all(),
    })),

    sessionManagement: permissionConfig.createPermission(({ statementsConfig }) => ({
        session: statementsConfig.get("session").all(),
    })),

    sessionViewing: permissionConfig.createPermission({
        session: ["list"],
    }),

    billingFullAccess: permissionConfig.createPermission(({ statementsConfig }) => ({
        billing: statementsConfig.get("billing").all(),
    })),

    billingReadOnly: permissionConfig.createPermission({
        billing: ["read"],
    }),

    analyticsFullAccess: permissionConfig.createPermission(({ statementsConfig }) => ({
        analytics: statementsConfig.get("analytics").all(),
    })),

    analyticsReadOnly: permissionConfig.createPermission({
        analytics: ["read"],
    }),

    systemAdmin: permissionConfig.createPermission(({ statementsConfig }) => ({
        system: statementsConfig.get("system").all(),
    })),

    systemMonitoring: permissionConfig.createPermission({
        system: ["monitor"],
    }),

    // Using collection API to get read-only access across all resources
    readOnlyAccess: permissionConfig.createPermission(({ statementsConfig }) =>
        statementsConfig.getAll().readOnly().all()
    ),    contentManagement: permissionConfig.createPermission(({ statementsConfig }) => ({
        project: statementsConfig.get("project").all(),
        organization: statementsConfig.get("organization").omit(["create", "delete"]).all(),
        analytics: ["read"],
    })),

    adminAccess: permissionConfig.createPermission(({ statementsConfig }) => ({
        user: statementsConfig.get("user").all(),
        session: statementsConfig.get("session").all(),
        project: statementsConfig.get("project").all(),
        organization: statementsConfig.get("organization").omit(["create", "delete"]).all(),
        billing: ["read"],
        analytics: ["read"],
    })),

    // Using collection API to get all resources with all actions
    superAdminAccess: permissionConfig.createPermission(({ statementsConfig }) => 
        statementsConfig.getAll().all()
    ),

    // Using collection API to get only CRUD operations across all resources
    crudAccess: permissionConfig.createPermission(({ statementsConfig }) =>
        statementsConfig.getAll().crudOnly().all()
    ),    // Using collection API to get write operations (create, update, delete) across all resources
    writeAccess: permissionConfig.createPermission(({ statementsConfig }) =>
        statementsConfig.getAll().writeOnly().all()
    ),    // Using collection API to pick specific actions across all resources
    listAndReadAccess: permissionConfig.createPermission(({ statementsConfig }) =>
        statementsConfig.getAll().pick(["list", "read"]).all()
    ),    // Using collection API on specific resources only
    userProjectManagement: permissionConfig.createPermission(({ statementsConfig }) => 
        statementsConfig.getMany(["user", "project"]).all()
    ),

    // Using collection API to omit dangerous actions across all resources
    safeModeAccess: permissionConfig.createPermission(({ statementsConfig }) =>
        statementsConfig.getAll().omit(["delete"]).all()
    ),    // Example: Using collection with specific resources and filters
    analyticsAndBillingRead: permissionConfig.createPermission(({ statementsConfig }) =>
        statementsConfig.getMany(["analytics", "billing"]).pick(["read"]).all()
    ),
} as const;

export type CommonPermissionKeys = keyof typeof commonPermissions;

export type CommonPermission<T extends CommonPermissionKeys> = (typeof commonPermissions)[T];
