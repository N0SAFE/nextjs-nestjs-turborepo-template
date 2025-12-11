// ============================================================================
// PERMISSION SYSTEM EXPORTS
// ============================================================================

// Export all system classes and types (PermissionBuilder, RoleBuilder, etc.)
export * from "./system";

// ============================================================================
// PLATFORM PERMISSION EXPORTS
// ============================================================================

// Platform permission configuration
export {
    platformPermissionConfig,
    platformStatement,
    platformAc,
    platformRoles,
    platformSchemas,
} from "./config";

// Platform roles
export {
    PLATFORM_ROLES,
    type PlatformRole,
    platformRoleConfig,
} from "./config";

// Platform resources
export {
    PLATFORM_RESOURCES,
    type PlatformResource,
    type PlatformActionsForResource,
} from "./config";

// ============================================================================
// ORGANIZATION PERMISSION EXPORTS
// ============================================================================

// Organization permission configuration
export {
    organizationPermissionConfig,
    organizationStatement,
    organizationAc,
    organizationRoles,
    organizationSchemas,
} from "./config";

// Organization roles
export {
    ORGANIZATION_ROLES,
    type OrganizationRole,
    organizationRoleConfig,
} from "./config";

// Organization resources
export {
    ORGANIZATION_RESOURCES,
    type OrganizationResource,
    type OrganizationActionsForResource,
} from "./config";

// ============================================================================
// PERMISSION CHECK HELPERS
// ============================================================================

export {
    hasPlatformPermission,
    hasOrganizationPermission,
    getPlatformRolePermissions,
    getOrganizationRolePermissions,
    isPlatformRoleAtLeast,
    isOrganizationRoleAtLeast,
} from "./config";

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// These exports maintain backward compatibility with existing code
export {
    // Legacy config exports (alias to platform)
    permissionConfig,
    statement,
    ac,
    roles,
    schemas,
    // Legacy role exports (alias to platform)
    ROLE_NAMES,
    type RoleName,
    // Legacy resource exports (alias to platform)
    RESOURCE_NAMES,
    type ResourceName,
    type ActionsForResource,
} from "./config";

// ============================================================================
// COMMON PERMISSIONS & UTILITIES
// ============================================================================

// Export platform and organization permission bundles
export {
    platformPermissions,
    organizationPermissions,
    type PlatformPermissionKeys,
    type OrganizationPermissionKeys,
    type PlatformPermission,
    type OrganizationPermission,
} from "./common";

// Export schema helpers
export {
    platformSchemaHelpers,
    organizationSchemaHelpers,
} from "./common";

// Export legacy common permissions (for backward compatibility)
export {
    commonPermissions,
    commonSchemas,
    type CommonPermissionKeys,
    type CommonPermission,
} from "./common";

// Export utilities
export * from './utils';

// Export access control utilities
export * from './access-control';

