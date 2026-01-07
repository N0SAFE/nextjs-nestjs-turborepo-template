/**
 * Organizations Permissions Plugin for Better Auth
 *
 * Context-aware wrapper for Better Auth organizations plugin.
 * Provides organization-level operations with automatic header injection.
 *
 * Uses Better Auth's native `auth.api.hasPermission()` for permission checking.
 *
 * All parameter types are automatically inferred from Better Auth API methods.
 *
 * @template TPermissionBuilder - Permission builder type, from which TStatement and TRoles are inferred
 * @template TAuth - Auth instance type that must include organization plugin
 */

import { organization } from "better-auth/plugins";
import type { WithAuthPlugins } from "./system/auth-with-plugins";
import type { PermissionBuilder } from "../system/builder/builder";
import type { LiteralString } from "better-auth";
import {
    BasePluginWrapper,
    PermissionAssertionError,
    type BasePluginWrapperOptions,
    type InferParams,
    type ExtractBody,
    type ExtractQuery,
} from "./system/base-plugin-wrapper";
import type {
    AnyPermissionBuilder,
    InferStatementFromBuilder,
    InferRolesFromBuilder,
} from "./system/type-inference";

// ============================================================================
// Plugin Instance Types
// ============================================================================

/**
 * Organization plugin instance type.
 * TStatement and TRoles are automatically derived from TPermissionBuilder.
 * 
 * Uses basic organization configuration - the API methods we wrap are
 * consistent across all organization plugin configurations.
 */
export type OrganizationPluginInstance<
    TPermissionBuilder extends AnyPermissionBuilder = PermissionBuilder
> = ReturnType<
    typeof organization<{
        roles: ReturnType<TPermissionBuilder["getRoles"]>;
        ac: ReturnType<TPermissionBuilder["getAc"]>;
        teams: { enabled: true };
        dynamicAccessControl: { enabled: true };
    }>
>;

/**
 * Auth type with organization plugin - minimum requirement for OrganizationsPermissionsPlugin.
 * TStatement and TRoles are automatically derived from TPermissionBuilder.
 */
export type AuthWithOrganizationPlugin<
    TPermissionBuilder extends AnyPermissionBuilder = PermissionBuilder
> = WithAuthPlugins<[OrganizationPluginInstance<TPermissionBuilder>]>;

/**
 * Reduced constraint interface for organization plugin API methods.
 * Only requires the API methods actually used by OrganizationsPermissionsPlugin.
 * This allows testing with mocked auth instances.
 * 
 * TStatement and TRoles are automatically derived from TPermissionBuilder,
 * reducing the number of generic parameters needed.
 */
export interface ApiMethodsWithOrganizationPlugin<
    TPermissionBuilder extends AnyPermissionBuilder = PermissionBuilder
> {
    api: Pick<
        AuthWithOrganizationPlugin<TPermissionBuilder>["api"],
        | "createOrganization"
        | "getFullOrganization"
        | "updateOrganization"
        | "deleteOrganization"
        | "listOrganizations"
        | "addMember"
        | "updateMemberRole"
        | "removeMember"
        | "listMembers"
        | "getSession"
        | "hasPermission"
    >;
    /**
 * Type inference helper inherited from Auth type.
     * Preserves all plugin type inference from the actual Auth instance.
     */
    $Infer: AuthWithOrganizationPlugin<TPermissionBuilder>["$Infer"];
}

/**
 * Options for creating OrganizationsPermissionsPlugin
 * Extends BasePluginWrapperOptions for consistent constructor signature.
 * 
 * NOTE: Uses only TPermissionBuilder and TAuth as generic parameters.
 * TStatement and TRoles are derived from TPermissionBuilder using conditional types.
 */
export type OrganizationsPluginWrapperOptions<
    TPermissionBuilder extends AnyPermissionBuilder,
    TAuth extends ApiMethodsWithOrganizationPlugin<TPermissionBuilder>
> = BasePluginWrapperOptions<TPermissionBuilder, TAuth>;

/**
 * Context-aware wrapper for Better Auth organizations plugin
 *
 * Extends BasePluginWrapper to provide:
 * - Organization-level operations with automatic header injection
 * - Permission checking via Better Auth's `auth.api.hasPermission()`
 * - Organization CRUD operations
 * - Member management
 * - Role management within organizations
 *
 * Generic over TPermissionBuilder for type-safe role assignments.
 * TStatement and TRoles are automatically derived from TPermissionBuilder.
 *
 * @template TPermissionBuilder - Permission builder with typed roles
 * @template TAuth - Auth instance type with organization plugin
 *
 * @example
 * ```typescript
 * // In ORPC handler
 * const org = registry.create('organizations', {
 *   auth,
 *   headers: context.headers,
 *   permissionBuilder: organizationBuilder
 * });
 *
 * // Check permissions using Better Auth API
 * const canCreate = await org.checkPermission({
 *   project: ['create'],
 * });
 *
 * // Organization management
 * const newOrg = await org.createOrganization({
 *   name: 'Acme Corp',
 *   slug: 'acme-corp'
 * });
 * ```
 */
export class OrganizationsPermissionsPlugin<
    TPermissionBuilder extends AnyPermissionBuilder,
    TAuth extends ApiMethodsWithOrganizationPlugin<TPermissionBuilder>
> extends BasePluginWrapper<TPermissionBuilder, TAuth>
{
    /**
     * Check if the current user has the specified permissions within an organization
     *
     * Uses Better Auth's organization-level `hasPermission` API to verify
     * the current user (from session) has the requested permissions.
     *
     * @param permissions - Permission statements to check (typed from permission builder)
     * @returns Promise resolving to true if user has all specified permissions
     *
     * @example
     * ```typescript
     * const canManageProjects = await org.checkPermission({
     *   project: ['create', 'delete'],
     * });
     * ```
     */
    async checkPermission(
        permissions: InferStatementFromBuilder<TPermissionBuilder>
    ): Promise<boolean> {
        try {
            const result = await this.auth.api.hasPermission({
                headers: this.headers,
                body: {
                    permissions,
                },
            });

            return result.success;
        } catch (error) {
            console.error('OrganizationsPermissionsPlugin.checkPermission error:', error);
            return false;
        }
    }

    /**
     * Assert that the current user has the specified permissions within an organization.
     * Throws PermissionAssertionError if the user lacks any of the required permissions.
     *
     * Uses Better Auth's organization-level `hasPermission` API internally.
     *
     * @param permissions - Permission statements to check (typed from permission builder)
     * @param errorMessage - Optional custom error message
     * @throws {PermissionAssertionError} When user lacks required permissions
     *
     * @example
     * ```typescript
     * // In middleware or handler - throws on failure
     * await org.assertCheckPermission({
     *   project: ['create', 'delete'],
     * });
     * ```
     */
    async assertCheckPermission(
        permissions: InferStatementFromBuilder<TPermissionBuilder>,
        errorMessage?: string
    ): Promise<void> {
        const hasPermission = await this.checkPermission(permissions);
        
        if (!hasPermission) {
            throw new PermissionAssertionError({
                message: errorMessage ?? 'Organization permission denied',
                permissions,
                code: 'FORBIDDEN',
            });
        }
    }

    /**
     * Create a new organization
     *
     * @param data - Organization creation data
     * @returns Created organization object
     *
     * @example
     * ```typescript
     * const org = await context.auth.organizations.createOrganization({
     *   name: 'Acme Corp',
     *   slug: 'acme-corp',
     *   metadata: { industry: 'technology' }
     * });
     * ```
     */
    async createOrganization(data: ExtractBody<InferParams<TAuth["api"]["createOrganization"]>>) {
        return await this.auth.api.createOrganization({
            headers: this.headers,
            body: {
                name: data.name,
                slug: data.slug,
                logo: data.logo,
                metadata: data.metadata,
            },
        });
    }

    /**
     * Get organization details
     *
     * @param organizationId - ID of the organization
     * @returns Organization object
     *
     * @example
     * ```typescript
     * const org = await context.auth.organizations.getOrganization('org-123');
     * ```
     */
    async getOrganization(organizationId: string) {
        return await this.auth.api.getFullOrganization({
            headers: this.headers,
            query: { organizationId },
        });
    }

    /**
     * Update an organization
     *
     * @param organizationId - ID of organization to update
     * @param data - Fields to update
     * @returns Updated organization object
     *
     * @example
     * ```typescript
     * const org = await context.auth.organizations.updateOrganization('org-123', {
     *   name: 'Acme Corporation'
     * });
     * ```
     */
    async updateOrganization(organizationId: string, data: ExtractBody<InferParams<TAuth["api"]["updateOrganization"]>>) {
        return await this.auth.api.updateOrganization({
            headers: this.headers,
            query: { organizationId },
            body: data,
        });
    }

    /**
     * Delete an organization
     *
     * @param organizationId - ID of organization to delete
     *
     * @example
     * ```typescript
     * await context.auth.organizations.deleteOrganization('org-123');
     * ```
     */
    async deleteOrganization(organizationId: string) {
        return await this.auth.api.deleteOrganization({
            headers: this.headers,
            body: { organizationId },
        });
    }

    /**
     * List all organizations for current user
     *
     * @param options - Query options (pagination, filtering)
     * @returns Array of organizations
     *
     * @example
     * ```typescript
     * const orgs = await context.auth.organizations.listOrganizations();
     * ```
     */
    async listOrganizations(options?: ExtractQuery<InferParams<TAuth["api"]["listOrganizations"]>>) {
        return await this.auth.api.listOrganizations({
            headers: this.headers,
            query: options ?? {},
        });
    }

    /**
     * Add a member to an organization
     *
     * @param organizationId - ID of organization
     * @param userId - ID of user to add
     * @param role - Role to assign
     * @returns Member object
     *
     * @example
     * ```typescript
     * const member = await context.auth.organizations.addMember('org-123', 'user-456', 'member');
     * ```
     */
    async addMember(
        organizationId: string,
        userId: string,
        role: (keyof InferRolesFromBuilder<TPermissionBuilder> extends infer K extends string ? K : InferRolesFromBuilder<TPermissionBuilder>) |
              (keyof InferRolesFromBuilder<TPermissionBuilder> extends infer K extends string ? K : InferRolesFromBuilder<TPermissionBuilder>)[]
    ) {
        return await this.auth.api.addMember({
            headers: this.headers,
            body: {
                organizationId,
                userId,
                role: role as unknown as ExtractBody<InferParams<TAuth["api"]["addMember"]>>["role"],
            },
        });
    }

    /**
     * Update a member's role in an organization
     *
     * @param organizationId - ID of organization
     * @param userId - ID of member
     * @param role - New role
     * @returns Updated member object
     *
     * @example
     * ```typescript
     * await context.auth.organizations.updateMemberRole('org-123', 'user-456', 'admin');
     * ```
     */
    async updateMemberRole(
        organizationId: string,
        userId: string,
        role: LiteralString | LiteralString[] |
              (keyof InferRolesFromBuilder<TPermissionBuilder> extends infer K extends string ? K : InferRolesFromBuilder<TPermissionBuilder>) |
              (keyof InferRolesFromBuilder<TPermissionBuilder> extends infer K extends string ? K : InferRolesFromBuilder<TPermissionBuilder>)[]
    ) {
        return await this.auth.api.updateMemberRole({
            headers: this.headers,
            body: {
                organizationId,
                memberId: userId,
                role: role as ExtractBody<InferParams<TAuth["api"]["updateMemberRole"]>>["role"],
            },
        });
    }

    /**
     * Remove a member from an organization
     *
     * @param organizationId - ID of organization
     * @param userId - ID of member to remove
     *
     * @example
     * ```typescript
     * await context.auth.organizations.removeMember('org-123', 'user-456');
     * ```
     */
    async removeMember(organizationId: string, userId: string) {
        return await this.auth.api.removeMember({
            headers: this.headers,
            body: {
                memberIdOrEmail: userId,
                organizationId,
            } as ExtractBody<InferParams<TAuth["api"]["removeMember"]>>,
        });
    }

    /**
     * List members of an organization
     *
     * @param organizationId - ID of organization
     * @param options - Query options
     * @returns Array of members
     *
     * @example
     * ```typescript
     * const members = await context.auth.organizations.listMembers('org-123');
     * ```
     */
    async listMembers(organizationId: string, options?: ExtractQuery<InferParams<TAuth["api"]["listMembers"]>>) {
        return await this.auth.api.listMembers({
            headers: this.headers,
            query: {
                organizationId,
                ...options,
            } as ExtractQuery<InferParams<TAuth["api"]["listMembers"]>>,
        });
    }
}

/**
 * Convenience type alias for OrganizationsPermissionsPlugin.
 * Uses simplified 2-parameter generic signature.
 */
export type OrganizationsPlugin<
    TPermissionBuilder extends AnyPermissionBuilder = PermissionBuilder,
    TAuth extends ApiMethodsWithOrganizationPlugin<TPermissionBuilder> = ApiMethodsWithOrganizationPlugin<TPermissionBuilder>
> = OrganizationsPermissionsPlugin<TPermissionBuilder, TAuth>;
