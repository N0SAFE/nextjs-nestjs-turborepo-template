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
    platformRoleMeta,
    platformRolesConfig,
} from "./config";

// Platform builder (for generic plugin type inference)
export { platformBuilder } from "./config";

// Platform roles
export {
    PLATFORM_ROLES,
    type PlatformRole,
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
    organizationRoleMeta,
    organizationRolesConfig,
} from "./config";

// Organization builder (for generic plugin type inference)
export { organizationBuilder } from "./config";

// Organization roles
export {
    ORGANIZATION_ROLES,
    type OrganizationRole,
} from "./config";

// Organization resources
export {
    ORGANIZATION_RESOURCES,
    type OrganizationResource,
    type OrganizationActionsForResource,
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

// Export utilities
export * from './utils';

// Export access control utilities
export * from './access-control';

// ============================================================================
// PLUGIN WRAPPERS (V2 PERMISSIONS)
// ============================================================================

// Export plugin system (registry, base types, auth-with-plugins)
export * from './plugins';
