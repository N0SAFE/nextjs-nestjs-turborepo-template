import { organizationSchemas, platformSchemas } from "./config";

/**
 * Common Permission Definitions
 * 
 * This file provides reusable permission sets that align with the project's
 * dual-layer permission system:
 * 
 * - PLATFORM ROLES: superAdmin, admin, user (global access)
 * - ORGANIZATION ROLES: owner, admin, member (org-scoped access)
 * 
 * These permission bundles can be imported and used across the application
 * for consistent permission checks.
 */

// ============================================================================
// PLATFORM-LEVEL PERMISSION BUNDLES
// ============================================================================

/**
 * Platform permission bundles for different platform roles.
 * Use these for platform-wide resource access.
 */
export const platformPermissions = {
    // ==========================================
    // Super Admin - Full Platform Access
    // ==========================================
    superAdmin: {
        user: ["list", "read", "create", "update", "delete", "ban", "setRole", "setPassword", "impersonate"] as const,
        session: ["list", "read", "revoke", "delete"] as const,
        organization: ["list", "read", "create", "update", "delete", "manageMembers", "manageInvites", "transfer"] as const,
        system: ["view", "configure", "maintenance", "backup", "audit"] as const,
        setup: ["initialize", "configure"] as const,
        platformAnalytics: ["view", "export", "configure"] as const,
        platformLogs: ["view", "search", "export", "configure"] as const,
    },

    // ==========================================
    // Admin - Platform Administration
    // ==========================================
    admin: {
        user: ["list", "read", "create", "update", "ban", "setRole"] as const,
        session: ["list", "read", "revoke"] as const,
        organization: ["list", "read", "create", "update", "manageMembers", "manageInvites"] as const,
        system: ["view"] as const,
        platformAnalytics: ["view", "export"] as const,
        platformLogs: ["view", "search", "export"] as const,
    },

    // ==========================================
    // User - Standard Platform Access
    // ==========================================
    user: {
        user: ["read", "update"] as const, // Own profile only
        session: ["list", "read", "revoke"] as const, // Own sessions only
        organization: ["list", "read", "create"] as const, // List own orgs, create new
    },
} as const;

// ============================================================================
// ORGANIZATION-LEVEL PERMISSION BUNDLES
// ============================================================================

/**
 * Organization permission bundles for different organization roles.
 * Use these for organization-scoped resource access.
 */
export const organizationPermissions = {
    // ==========================================
    // Owner - Full Organization Access
    // ==========================================
    owner: {
        orgSettings: ["read", "update", "delete", "transferOwnership"] as const,
        orgMember: ["list", "read", "invite", "remove", "updateRole"] as const,
        orgInvitation: ["list", "create", "revoke", "resend"] as const,
        team: ["list", "read", "create", "update", "delete", "manageMembers"] as const,
        project: ["list", "read", "create", "update", "delete", "archive", "manageCollaborators"] as const,
        analytics: ["view", "export"] as const,
        logs: ["view", "search", "export", "stream"] as const,
        apiKey: ["list", "read", "create", "update", "delete", "regenerate"] as const,
        webhook: ["list", "read", "create", "update", "delete", "test"] as const,
        billing: ["view", "manage", "viewInvoices", "updatePayment"] as const,
    },

    // ==========================================
    // Admin - Organization Management
    // ==========================================
    admin: {
        orgSettings: ["read", "update"] as const,
        orgMember: ["list", "read", "invite", "remove", "updateRole"] as const,
        orgInvitation: ["list", "create", "revoke", "resend"] as const,
        team: ["list", "read", "create", "update", "delete", "manageMembers"] as const,
        project: ["list", "read", "create", "update", "delete", "archive", "manageCollaborators"] as const,
        analytics: ["view", "export"] as const,
        logs: ["view", "search", "export", "stream"] as const,
        apiKey: ["list", "read", "create", "update", "delete", "regenerate"] as const,
        webhook: ["list", "read", "create", "update", "delete", "test"] as const,
        billing: ["view", "viewInvoices"] as const,
    },

    // ==========================================
    // Member - Standard Organization Access
    // ==========================================
    member: {
        orgSettings: ["read"] as const,
        orgMember: ["list", "read"] as const,
        orgInvitation: ["list"] as const,
        team: ["list", "read"] as const,
        project: ["list", "read", "create", "update"] as const,
        analytics: ["view"] as const,
        logs: ["view", "search", "stream"] as const,
        apiKey: ["list", "read", "create"] as const,
        webhook: ["list", "read", "create", "update"] as const,
        billing: ["view"] as const,
    },
} as const;

// ============================================================================
// LEGACY COMMON PERMISSIONS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use `platformPermissions` and `organizationPermissions` instead.
 * These are kept for backward compatibility.
 */
export const commonPermissions = {
    // Platform role permissions (mapped from platformPermissions)
    userManagement: platformPermissions.admin,
    userSelf: platformPermissions.user,
    systemFull: platformPermissions.superAdmin,
    systemReadOnly: platformPermissions.admin,

    // Organization role permissions (mapped from organizationPermissions)
    organizationOwner: organizationPermissions.owner,
    organizationAdmin: organizationPermissions.admin,
    organizationMember: organizationPermissions.member,

    // Project-level permissions (subset of organization permissions)
    projectOwner: {
        project: organizationPermissions.owner.project,
        analytics: organizationPermissions.owner.analytics,
        logs: organizationPermissions.owner.logs,
        apiKey: organizationPermissions.owner.apiKey,
        webhook: organizationPermissions.owner.webhook,
    },
    projectAdmin: {
        project: organizationPermissions.admin.project,
        analytics: organizationPermissions.admin.analytics,
        logs: organizationPermissions.admin.logs,
        apiKey: organizationPermissions.admin.apiKey,
        webhook: organizationPermissions.admin.webhook,
    },
    projectDeveloper: {
        project: ["list", "read", "create", "update"] as const,
        logs: ["view", "search", "stream"] as const,
        apiKey: ["list", "read", "create"] as const,
        webhook: ["list", "read", "create", "update"] as const,
    },
    projectViewer: {
        project: ["list", "read"] as const,
        logs: ["view"] as const,
    },
} as const;

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * Platform-level schema definitions for permission validation
 */
export const platformSchemaHelpers = {
    /** Schema for read-only actions across platform resources */
    readOnlyActions: platformSchemas.actions.only("list", "read"),

    /** Schema for user management actions */
    userManagementActions: platformSchemas.actions.forResource("user"),

    /** Schema for system actions */
    systemActions: platformSchemas.actions.forResource("system"),

    /** Schema for super admin permissions */
    superAdminActions: platformSchemas.actions.forRole("superAdmin"),

    /** Schema for admin permissions */
    adminActions: platformSchemas.actions.forRole("admin"),

    /** Schema for user permissions */
    userActions: platformSchemas.actions.forRole("user"),
} as const;

/**
 * Organization-level schema definitions for permission validation
 */
export const organizationSchemaHelpers = {
    /** Schema for read-only actions across organization resources */
    readOnlyActions: organizationSchemas.actions.only("list", "read"),

    /** Schema for write actions (create, update, delete) */
    writeActions: organizationSchemas.actions.filter((action): action is "create" | "update" | "delete" =>
        /create|update|delete/.test(action)
    ),

    /** Schema for project actions */
    projectActions: organizationSchemas.actions.forResource("project"),

    /** Schema for team actions */
    teamActions: organizationSchemas.actions.forResource("team"),

    /** Schema for dangerous/destructive actions */
    destructiveActions: organizationSchemas.actions.only("delete"),

    /** Schema for safe actions (excluding delete) */
    safeActions: organizationSchemas.actions.excluding("delete"),

    /** Custom permission schema for read-only project access */
    readOnlyPermission: organizationSchemas.actions.customPermission({
        project: ["list", "read"] as const,
        team: ["list", "read"] as const,
    }),

    /** Schema for organization owner permissions */
    ownerAllActions: organizationSchemas.actions.forRole("owner"),

    /** Schema for organization admin actions */
    adminAllActions: organizationSchemas.actions.forRole("admin"),

    /** Schema for organization member actions */
    memberAllActions: organizationSchemas.actions.forRole("member"),
} as const;

/**
 * @deprecated Use `organizationSchemaHelpers` instead.
 * Kept for backward compatibility.
 */
export const commonSchemas = organizationSchemaHelpers;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Keys for platform permission bundles */
export type PlatformPermissionKeys = keyof typeof platformPermissions;

/** Keys for organization permission bundles */
export type OrganizationPermissionKeys = keyof typeof organizationPermissions;

/** Get the permission bundle type for a platform role */
export type PlatformPermission<T extends PlatformPermissionKeys> = (typeof platformPermissions)[T];

/** Get the permission bundle type for an organization role */
export type OrganizationPermission<T extends OrganizationPermissionKeys> = (typeof organizationPermissions)[T];

/**
 * @deprecated Use `PlatformPermissionKeys` or `OrganizationPermissionKeys` instead.
 */
export type CommonPermissionKeys = keyof typeof commonPermissions;

/**
 * @deprecated Use `PlatformPermission` or `OrganizationPermission` instead.
 */
export type CommonPermission<T extends CommonPermissionKeys> = (typeof commonPermissions)[T];
