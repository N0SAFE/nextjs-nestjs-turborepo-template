import { PermissionBuilder } from "./system/builder/builder";
import { defaultStatements as adminDefaultStatements } from "better-auth/plugins/admin/access";
import { defaultStatements as organizationDefaultStatements } from 'better-auth/plugins/organization/access'


/**
 * Permission Configuration for the Deployer Platform
 * 
 * This configuration defines a dual-layer permission system:
 * 
 * ============================================================================
 * LAYER 1: PLATFORM ROLES (User's global role)
 * ============================================================================
 * These roles define what a user can do across the entire platform.
 * Stored in the user's `role` field.
 * 
 * - superAdmin: Platform-level admin with full access to everything
 * - admin: Standard admin, can manage users and platform settings
 * - user: Default role for regular authenticated users
 * 
 * ============================================================================
 * LAYER 2: ORGANIZATION ROLES (User's role within an organization)
 * ============================================================================
 * These roles define what a member can do within a specific organization.
 * Stored in the organization membership `role` field.
 * 
 * - owner: Full organization access including deletion and ownership transfer
 * - admin: Organization management, member management, cannot delete org
 * - member: Standard member access to organization resources
 * 
 * ============================================================================
 * HOW THEY WORK TOGETHER
 * ============================================================================
 * 
 * Example scenarios:
 * 1. User with platform role "user" + org role "owner" in Org A:
 *    - Can manage Org A fully (owner permissions)
 *    - Cannot access admin panel or other platform features
 * 
 * 2. User with platform role "admin" + org role "member" in Org B:
 *    - Has limited access within Org B (member permissions)
 *    - Can access admin panel for platform management
 * 
 * 3. User with platform role "superAdmin":
 *    - Full access to everything regardless of org membership
 */

// ============================================================================
// PLATFORM PERMISSION SYSTEM
// ============================================================================

/**
 * Platform-level permission builder
 * Defines resources and roles for platform-wide access control
 */
const platformBuilder = new PermissionBuilder()
    .resources(({ actions }) => ({
        // ========================================
        // USER & SESSION MANAGEMENT (Platform-wide)
        // ========================================
        user: actions(adminDefaultStatements.user),
        session: actions(adminDefaultStatements.session),
        
        // ========================================
        // PLATFORM ADMINISTRATION
        // ========================================
        system: actions([
            'view',           // View system status/health
            'configure',      // Update system configuration
            'maintenance',    // Enable/disable maintenance mode
            'backup',         // Manage backups
            'audit',          // View audit logs
        ] as const),
        
        setup: actions([
            'initialize',     // Run initial platform setup
            'configure',      // Configure initial settings
        ] as const),
        
        // ========================================
        // PLATFORM-WIDE MONITORING
        // ========================================
        platformAnalytics: actions([
            'view',           // View platform-wide analytics
            'export',         // Export platform analytics
            'configure',      // Configure analytics settings
        ] as const),
        
        platformLogs: actions([
            'view',           // View all platform logs
            'search',         // Search across all logs
            'export',         // Export logs
            'configure',      // Configure log retention
        ] as const),
        
        // ========================================
        // INFRASTRUCTURE (Platform-wide)
        // ========================================
        traefik: actions([
            'read',           // View Traefik config
            'update',         // Update routing rules
            'sync',           // Force sync configuration
        ] as const),
        
        platformDomain: actions([
            'list',           // List all platform domains
            'read',           // View domain details
            'create',         // Add platform domains
            'update',         // Update domain config
            'delete',         // Remove domains
            'verifySsl',      // Verify/renew SSL
        ] as const),
    }))
    // ==========================================
    // PLATFORM ROLES
    // ==========================================
    /**
     * Super Admin - Platform administrator with full access
     * Only assigned to initial setup user and critical system admins
     */
    .role('superAdmin').allPermissions()
    .roles(({ permissions }) => ({
        /**
         * Admin - Standard platform administrator
         * Can manage users and view platform-wide data
         * Cannot access system configuration or maintenance
         */
        admin: permissions({
            user: ['list', 'create', 'update', 'ban', 'set-role'],
            session: ['list', 'revoke'],
            system: ['view'],
            platformAnalytics: ['view', 'export'],
            platformLogs: ['view', 'search', 'export'],
            traefik: ['read'],
            platformDomain: ['list', 'read'],
        }),
        
        /**
         * User - Standard authenticated user
         * Can manage own profile and create organizations
         * Actual resource access determined by organization membership
         */
        user: permissions({
            user: ['update'], // Own profile only (enforced at app level)
            session: ['list', 'revoke'], // Own sessions only
        }),
    }));

// Export the builder for type inference in generic plugins
export { platformBuilder };

// Build and export platform permissions
export const platformPermissionConfig = platformBuilder.build();
export const { 
    statement: platformStatement, 
    ac: platformAc, 
    roles: platformRoles, 
    schemas: platformSchemas,
    rolesConfig: platformRolesConfig,
    roleMeta: platformRoleMeta,
} = platformPermissionConfig;

// ============================================================================
// ORGANIZATION PERMISSION SYSTEM
// ============================================================================

/**
 * Organization-level permission builder
 * Defines resources and roles for organization-scoped access control
 * 
 * These permissions apply to resources WITHIN an organization.
 * The user's organization role (owner/admin/member) determines access.
 */
const organizationBuilder = new PermissionBuilder()
    .resources(({ actions }) => ({
        // ========================================
        // ORGANIZATION SETTINGS & MEMBERS
        // ========================================
        organization: actions(organizationDefaultStatements.organization),
        member: actions(organizationDefaultStatements.member),
        team: actions(organizationDefaultStatements.team),
        invitation: actions(organizationDefaultStatements.invitation),
        ac: actions(organizationDefaultStatements.ac),
    }))
    // ==========================================
    // ORGANIZATION ROLES
    // ==========================================
    /**
     * Owner - Full organization access
     * Can do everything including delete org and transfer ownership
     */
    .role('owner').allPermissions()
    .roles(({ permissions }) => ({
        /**
         * Admin - Organization administrator
         * Can manage most things except delete org or transfer ownership
         */
        admin: permissions({
            organization: ['update', 'delete'],
            invitation: ['cancel', 'create'],
            member: ['create', 'delete', 'update'],
            team: ['create', 'delete', 'update'],
        }),
        
        /**
         * Member - Standard organization member
         * Can work on projects and services but limited management access
         */
        member: permissions({}),
    }));

// Export the builder for type inference in generic plugins
export { organizationBuilder };

// Build and export organization permissions
export const organizationPermissionConfig = organizationBuilder.build();
export const { 
    statement: organizationStatement, 
    ac: organizationAc, 
    roles: organizationRoles, 
    schemas: organizationSchemas,
    rolesConfig: organizationRolesConfig,
    roleMeta: organizationRoleMeta,
} = organizationPermissionConfig;



// ============================================================================
// PLATFORM ROLE EXPORTS
// ============================================================================

/**
 * Platform role names derived from the builder configuration
 * This ensures the role list stays in sync with the builder definition
 */
export const PLATFORM_ROLES = platformBuilder.getRoleNames();

/**
 * Type representing valid platform role names
 */
export type PlatformRole = typeof PLATFORM_ROLES[number];

/**
 * Platform role configuration for display
 */
export const platformRoleConfig: Record<
    PlatformRole,
    { label: string; description: string; level: number; color: string }
> = {
    superAdmin: {
        label: 'Super Admin',
        description: 'Full platform access including system configuration',
        level: 3,
        color: 'red',
    },
    admin: {
        label: 'Admin',
        description: 'Platform administration without system access',
        level: 2,
        color: 'orange',
    },
    user: {
        label: 'User',
        description: 'Standard user with organization-based access',
        level: 1,
        color: 'blue',
    },
};



// ============================================================================
// ORGANIZATION ROLE EXPORTS
// ============================================================================

/**
 * Organization membership roles derived from the builder configuration
 * These define a user's role within a specific organization
 */
export const ORGANIZATION_ROLES = organizationBuilder.getRoleNames();

/**
 * Type representing valid organization membership roles
 */
export type OrganizationRole = typeof ORGANIZATION_ROLES[number];

/**
 * Organization role configuration for display
 */
export const organizationRoleConfig: Record<
    OrganizationRole,
    { label: string; description: string; level: number; color: string; icon: string }
> = {
    owner: {
        label: 'Owner',
        description: 'Full organization access including deletion and ownership transfer',
        level: 3,
        color: 'amber',
        icon: 'crown',
    },
    admin: {
        label: 'Admin',
        description: 'Organization management without delete or transfer capabilities',
        level: 2,
        color: 'purple',
        icon: 'shield',
    },
    member: {
        label: 'Member',
        description: 'Standard member with project and service access',
        level: 1,
        color: 'slate',
        icon: 'user',
    },
};

// ============================================================================
// RESOURCE EXPORTS
// ============================================================================

/**
 * Platform resource names derived from the builder configuration
 */
export type PlatformResource = keyof typeof platformStatement;
export const PLATFORM_RESOURCES = platformBuilder.getStatementNames();

/**
 * Organization resource names derived from the builder configuration
 */
export type OrganizationResource = keyof typeof organizationStatement;
export const ORGANIZATION_RESOURCES = organizationBuilder.getStatementNames();



/**
 * Type representing all valid actions for a specific platform resource
 */
export type PlatformActionsForResource<R extends PlatformResource> = typeof platformStatement[R][number];

/**
 * Type representing all valid actions for a specific organization resource
 */
export type OrganizationActionsForResource<R extends OrganizationResource> = typeof organizationStatement[R][number];



// ============================================================================
// PERMISSION CHECK HELPERS
// ============================================================================

/**
 * Check if a platform role has a specific permission
 */
export function hasPlatformPermission(
    role: PlatformRole,
    resource: PlatformResource,
    action: string
): boolean {
    // superAdmin has all permissions
    if (role === 'superAdmin') return true;
    
    // Check if the role has the action for the resource using rolesConfig
    return platformRolesConfig.hasPermission(role, resource, action);
}

/**
 * Check if an organization role has a specific permission
 */
export function hasOrganizationPermission(
    role: OrganizationRole,
    resource: OrganizationResource,
    action: string
): boolean {
    // owner has all permissions
    if (role === 'owner') return true;
    
    // Check if the role has the action for the resource using rolesConfig
    return organizationRolesConfig.hasPermission(role, resource, action);
}

/**
 * Get all permissions for a platform role
 */
export function getPlatformRolePermissions(role: PlatformRole) {
    return platformRoles[role];
}

/**
 * Get all permissions for an organization role
 */
export function getOrganizationRolePermissions(role: OrganizationRole) {
    return organizationRoles[role];
}

/**
 * Check if a role level is higher or equal to another
 */
export function isPlatformRoleAtLeast(role: PlatformRole, minimumRole: PlatformRole): boolean {
    return platformRoleConfig[role].level >= platformRoleConfig[minimumRole].level;
}

/**
 * Check if an organization role level is higher or equal to another
 */
export function isOrganizationRoleAtLeast(role: OrganizationRole, minimumRole: OrganizationRole): boolean {
    return organizationRoleConfig[role].level >= organizationRoleConfig[minimumRole].level;
}
