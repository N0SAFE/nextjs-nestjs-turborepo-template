import { PermissionBuilder } from "./system/builder/builder";

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
        user: actions([
            'list',           // List all platform users
            'read',           // View user profile details
            'create',         // Create new users (admin invite)
            'update',         // Update user profile/settings
            'delete',         // Delete user accounts
            'ban',            // Ban/unban users
            'setRole',        // Change platform roles
            'setPassword',    // Reset user passwords
            'impersonate',    // Impersonate users (superAdmin)
        ] as const),
        
        session: actions([
            'list',           // List active sessions
            'read',           // View session details
            'revoke',         // Revoke/logout sessions
            'delete',         // Delete session records
        ] as const),
        
        // ========================================
        // ORGANIZATION MANAGEMENT (Platform-wide view)
        // ========================================
        organization: actions([
            'list',           // List all organizations (admin view)
            'read',           // View any organization details
            'create',         // Create new organizations
            'update',         // Update any organization
            'delete',         // Delete any organization
            'manageMembers',  // Manage members of any org
            'manageInvites',  // Manage invites of any org
            'transfer',       // Transfer org ownership
        ] as const),
        
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
            user: ['list', 'read', 'create', 'update', 'ban', 'setRole'],
            session: ['list', 'read', 'revoke'],
            organization: ['list', 'read', 'create', 'update', 'manageMembers', 'manageInvites'],
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
            user: ['read', 'update'], // Own profile only (enforced at app level)
            session: ['list', 'read', 'revoke'], // Own sessions only
            organization: ['list', 'read', 'create'], // List own orgs, create new
        }),
    }));

// Build and export platform permissions
export const platformPermissionConfig = platformBuilder.build();
export const { 
    statement: platformStatement, 
    ac: platformAc, 
    roles: platformRoles, 
    schemas: platformSchemas,
    rolesConfig: platformRolesConfig,
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
        orgSettings: actions([
            'read',           // View org settings
            'update',         // Update org settings
            'delete',         // Delete the organization
            'transferOwnership', // Transfer org to another member
        ] as const),
        
        orgMember: actions([
            'list',           // List org members
            'read',           // View member details
            'invite',         // Invite new members
            'remove',         // Remove members
            'updateRole',     // Change member roles
        ] as const),
        
        orgInvitation: actions([
            'list',           // List pending invitations
            'create',         // Create invitations
            'revoke',         // Revoke invitations
            'resend',         // Resend invitation emails
        ] as const),
        
        // ========================================
        // TEAMS (Sub-groups within organization)
        // ========================================
        team: actions([
            'list',           // List teams
            'read',           // View team details
            'create',         // Create teams
            'update',         // Update team settings
            'delete',         // Delete teams
            'manageMembers',  // Add/remove team members
        ] as const),
        
        // ========================================
        // PROJECTS (Deployment projects)
        // ========================================
        project: actions([
            'list',           // List projects
            'read',           // View project details
            'create',         // Create projects
            'update',         // Update project settings
            'delete',         // Delete projects
            'archive',        // Archive projects
            'manageCollaborators', // Manage project collaborators
        ] as const),
        
        // ========================================
        // SERVICES (Within projects)
        // ========================================
        service: actions([
            'list',           // List services
            'read',           // View service details
            'create',         // Create services
            'update',         // Update service config
            'delete',         // Delete services
            'deploy',         // Trigger deployments
            'scale',          // Scale replicas
            'restart',        // Restart service
            'stop',           // Stop service
        ] as const),
        
        // ========================================
        // DEPLOYMENTS
        // ========================================
        deployment: actions([
            'list',           // List deployments
            'read',           // View deployment details
            'create',         // Create/trigger deployments
            'cancel',         // Cancel running deployments
            'rollback',       // Rollback to previous
            'promote',        // Promote to production
        ] as const),
        
        // ========================================
        // ENVIRONMENT & SECRETS
        // ========================================
        environment: actions([
            'list',           // List environments
            'read',           // View environment details
            'create',         // Create environments
            'update',         // Update environment
            'delete',         // Delete environments
        ] as const),
        
        secret: actions([
            'list',           // List secrets (names only)
            'read',           // Read secret values
            'create',         // Create secrets
            'update',         // Update secret values
            'delete',         // Delete secrets
        ] as const),
        
        // ========================================
        // DOMAINS (Organization's domains)
        // ========================================
        domain: actions([
            'list',           // List domains
            'read',           // View domain details
            'create',         // Add domains
            'update',         // Update domain config
            'delete',         // Remove domains
            'verify',         // Verify domain ownership
            'manageSsl',      // Manage SSL certificates
        ] as const),
        
        // ========================================
        // INTEGRATIONS
        // ========================================
        webhook: actions([
            'list',           // List webhooks
            'read',           // View webhook details
            'create',         // Create webhooks
            'update',         // Update webhook config
            'delete',         // Delete webhooks
            'test',           // Test webhook delivery
        ] as const),
        
        apiKey: actions([
            'list',           // List API keys
            'read',           // View API key details
            'create',         // Create API keys
            'update',         // Update API key
            'delete',         // Delete API keys
            'regenerate',     // Regenerate API key
        ] as const),
        
        github: actions([
            'list',           // List GitHub connections
            'read',           // View connection details
            'connect',        // Connect GitHub repo
            'disconnect',     // Disconnect GitHub
            'sync',           // Sync repositories
            'configureWebhook', // Configure GitHub webhooks
        ] as const),
        
        // ========================================
        // MONITORING & LOGS
        // ========================================
        analytics: actions([
            'view',           // View org analytics
            'export',         // Export analytics data
        ] as const),
        
        logs: actions([
            'view',           // View logs
            'search',         // Search logs
            'export',         // Export logs
            'stream',         // Stream live logs
        ] as const),
        
        healthCheck: actions([
            'view',           // View health status
            'configure',      // Configure health checks
            'trigger',        // Manually trigger checks
        ] as const),
        
        // ========================================
        // BILLING (If org has billing)
        // ========================================
        billing: actions([
            'view',           // View billing info
            'manage',         // Manage subscription
            'viewInvoices',   // View invoices
            'updatePayment',  // Update payment method
        ] as const),
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
            orgSettings: ['read', 'update'],
            orgMember: ['list', 'read', 'invite', 'remove', 'updateRole'],
            orgInvitation: ['list', 'create', 'revoke', 'resend'],
            team: ['list', 'read', 'create', 'update', 'delete', 'manageMembers'],
            project: ['list', 'read', 'create', 'update', 'delete', 'archive', 'manageCollaborators'],
            service: ['list', 'read', 'create', 'update', 'delete', 'deploy', 'scale', 'restart', 'stop'],
            deployment: ['list', 'read', 'create', 'cancel', 'rollback', 'promote'],
            environment: ['list', 'read', 'create', 'update', 'delete'],
            secret: ['list', 'read', 'create', 'update', 'delete'],
            domain: ['list', 'read', 'create', 'update', 'delete', 'verify', 'manageSsl'],
            webhook: ['list', 'read', 'create', 'update', 'delete', 'test'],
            apiKey: ['list', 'read', 'create', 'update', 'delete', 'regenerate'],
            github: ['list', 'read', 'connect', 'disconnect', 'sync', 'configureWebhook'],
            analytics: ['view', 'export'],
            logs: ['view', 'search', 'export', 'stream'],
            healthCheck: ['view', 'configure', 'trigger'],
            billing: ['view', 'viewInvoices'],
        }),
        
        /**
         * Member - Standard organization member
         * Can work on projects and services but limited management access
         */
        member: permissions({
            orgSettings: ['read'],
            orgMember: ['list', 'read'],
            orgInvitation: ['list'],
            team: ['list', 'read'],
            project: ['list', 'read', 'create', 'update'],
            service: ['list', 'read', 'create', 'update', 'deploy', 'scale', 'restart'],
            deployment: ['list', 'read', 'create', 'cancel', 'rollback'],
            environment: ['list', 'read', 'create', 'update'],
            secret: ['list', 'create', 'update'], // Cannot read secret values
            domain: ['list', 'read', 'create', 'update', 'verify'],
            webhook: ['list', 'read', 'create', 'update'],
            apiKey: ['list', 'read', 'create'],
            github: ['list', 'read', 'connect', 'sync'],
            analytics: ['view'],
            logs: ['view', 'search', 'stream'],
            healthCheck: ['view', 'trigger'],
            billing: ['view'],
        }),
    }));

// Build and export organization permissions
export const organizationPermissionConfig = organizationBuilder.build();
export const { 
    statement: organizationStatement, 
    ac: organizationAc, 
    roles: organizationRoles, 
    schemas: organizationSchemas,
    rolesConfig: organizationRolesConfig,
} = organizationPermissionConfig;

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================
// These exports maintain backward compatibility with existing code
// that uses the old single permission system

export const permissionConfig = platformPermissionConfig;
export const { statement, ac, roles, schemas } = platformPermissionConfig;

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

// Legacy exports
export const ROLE_NAMES = PLATFORM_ROLES;
export type RoleName = PlatformRole;

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

// Legacy exports
export const RESOURCE_NAMES = PLATFORM_RESOURCES;
export type ResourceName = PlatformResource;

/**
 * Type representing all valid actions for a specific platform resource
 */
export type PlatformActionsForResource<R extends PlatformResource> = typeof platformStatement[R][number];

/**
 * Type representing all valid actions for a specific organization resource
 */
export type OrganizationActionsForResource<R extends OrganizationResource> = typeof organizationStatement[R][number];

// Legacy export
export type ActionsForResource<R extends ResourceName> = PlatformActionsForResource<R>;

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
