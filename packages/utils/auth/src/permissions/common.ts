import { 
    platformSchemas, 
    organizationSchemas,
    type PlatformRole,
    type OrganizationRole,
    platformRoles,
    organizationRoles,
} from "./config";

/**
 * Common Permission Definitions
 * 
 * This file provides reusable permission sets that align with the project's
 * dual-layer permission system:
 * 
 * - PLATFORM ROLES: superAdmin, admin, user (global access)
 * - ORGANIZATION ROLES: owner, admin, member (org-scoped access)
 * 
 * The permission bundles are derived directly from the config to ensure consistency.
 */

// ============================================================================
// RE-EXPORT PERMISSION BUNDLES FROM CONFIG
// ============================================================================

/**
 * Platform permission bundles - derived from platformRoles in config
 * These are the actual permissions assigned to each platform role.
 */
export const platformPermissions = platformRoles;

/**
 * Organization permission bundles - derived from organizationRoles in config
 * These are the actual permissions assigned to each organization role.
 */
export const organizationPermissions = organizationRoles;

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

/**
 * Platform-level schema helpers for permission validation
 */
export const platformSchemaHelpers = {
    /** Schema for read-only actions across platform resources */
    readOnlyActions: platformSchemas.actions.only("list"),

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
 * Organization-level schema helpers for permission validation
 */
export const organizationSchemaHelpers = {
    /** Schema for read-only actions across organization resources */
    readOnlyActions: organizationSchemas.actions.only("update"),

    /** Schema for organization actions */
    organizationActions: organizationSchemas.actions.forResource("organization"),

    /** Schema for member actions */
    memberActions: organizationSchemas.actions.forResource("member"),

    /** Schema for team actions */
    teamActions: organizationSchemas.actions.forResource("team"),

    /** Schema for invitation actions */
    invitationActions: organizationSchemas.actions.forResource("invitation"),

    /** Schema for organization owner permissions */
    ownerAllActions: organizationSchemas.actions.forRole("owner"),

    /** Schema for organization admin actions */
    adminAllActions: organizationSchemas.actions.forRole("admin"),

    /** Schema for organization member actions */
    memberAllActions: organizationSchemas.actions.forRole("member"),
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Keys for platform permission bundles */
export type PlatformPermissionKeys = PlatformRole;

/** Keys for organization permission bundles */
export type OrganizationPermissionKeys = OrganizationRole;

/** Get the permission bundle type for a platform role */
export type PlatformPermission<T extends PlatformPermissionKeys> = (typeof platformPermissions)[T];

/** Get the permission bundle type for an organization role */
export type OrganizationPermission<T extends OrganizationPermissionKeys> = (typeof organizationPermissions)[T];


