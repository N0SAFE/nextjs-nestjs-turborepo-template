/**
 * Admin Permissions Plugin for Better Auth
 *
 * Context-aware wrapper for Better Auth admin plugin with automatic header injection.
 * Provides admin-level operations without requiring manual header passing.
 *
 * All parameter types are automatically inferred from Better Auth API methods.
 *
 * Uses Better Auth's native `auth.api.userHasPermission()` for permission checking.
 *
 * @template TAuth - Auth instance type that must include admin plugin
 */

import { admin, type InferAdminRolesFromOption } from "better-auth/plugins";
import type { WithAuthPlugins } from "./system/auth-with-plugins";
import {
    BasePluginWrapper,
    type BasePluginWrapperOptions,
    type InferParams,
    type ExtractBody,
    type ExtractQuery,
    PermissionAssertionError,
    RoleAssertionError,
} from "./system/base-plugin-wrapper";
import type {
    AnyPermissionBuilder,
    InferStatementFromBuilder,
    InferRoleNamesFromBuilder,
} from "./system/type-inference";

// ============================================================================
// Plugin Instance Types
// ============================================================================

/**
 * Admin plugin instance type
 */
export type AdminPluginInstance<
    TPermissionBuilder extends AnyPermissionBuilder
> = ReturnType<
    typeof admin<{
        roles: ReturnType<TPermissionBuilder["getRoles"]>;
        ac: ReturnType<TPermissionBuilder["getAc"]>;
    }>
>;

/**
 * Auth type with admin plugin - minimum requirement for AdminPermissionsPlugin
 */
export type AuthWithAdminPlugin<
    TPermissionBuilder extends AnyPermissionBuilder
> = WithAuthPlugins<[AdminPluginInstance<TPermissionBuilder>]>;

/**
 * Reduced constraint interface for admin plugin API methods.
 * Only requires the API methods actually used by AdminPermissionsPlugin.
 * This allows testing with mocked auth instances.
 * 
 * NOTE: Uses only TPermissionBuilder as generic parameter - TStatement and TRoles
 * are derived from it using conditional type inference.
 */
export interface ApiMethodsWithAdminPlugin<
    TPermissionBuilder extends AnyPermissionBuilder
> {
    api: Pick<
        AuthWithAdminPlugin<TPermissionBuilder>["api"],
        | "createUser"
        | "updateUser"
        | "setRole"
        | "removeUser"
        | "banUser"
        | "unbanUser"
        | "listUsers"
        | "getSession"
        | "userHasPermission"
    >;
    /**
     * Type inference helper inherited from Auth type.
     * Preserves all plugin type inference from the actual Auth instance.
     */
    $Infer: AuthWithAdminPlugin<TPermissionBuilder>["$Infer"];
}

/**
 * Options for creating AdminPermissionsPlugin
 * Extends BasePluginWrapperOptions for consistent constructor signature.
 * 
 * NOTE: Uses only TPermissionBuilder and TAuth as generic parameters.
 * TStatement and TRoles are derived from TPermissionBuilder using conditional types.
 */
export type AdminPluginWrapperOptions<
    TPermissionBuilder extends AnyPermissionBuilder,
    TAuth extends ApiMethodsWithAdminPlugin<TPermissionBuilder>
> = BasePluginWrapperOptions<TPermissionBuilder, TAuth>;

/**
 * Context-aware wrapper for Better Auth admin plugin
 *
 * Extends BasePluginWrapper to provide:
 * - Admin-level operations with automatic header injection
 * - Permission checking via Better Auth's `auth.api.userHasPermission()`
 * - User management (create, update, delete, ban)
 * - Role management
 *
 * Generic over TPermissionBuilder for type-safe role assignments.
 * TStatement and TRoles are automatically inferred from TPermissionBuilder.
 *
 * @template TPermissionBuilder - Permission builder with typed roles
 * @template TAuth - Auth instance type (inferred from constructor)
 *
 * @example
 * ```typescript
 * // In ORPC handler - types are fully inferred
 * const plugin = registry.create('admin', {
 *   auth,
 *   headers: context.headers,
 *   permissionBuilder: platformBuilder
 * });
 *
 * // Check permissions using Better Auth API
 * const canCreate = await plugin.checkPermission({
 *   project: ['create'],
 *   user: ['read']
 * });
 *
 * // User management
 * const user = await plugin.createUser({
 *   email: 'user@example.com',
 *   password: 'secure123',
 *   name: 'John Doe',
 *   role: 'user'
 * });
 * ```
 */
export class AdminPermissionsPlugin<
    TPermissionBuilder extends AnyPermissionBuilder,
    TAuth extends ApiMethodsWithAdminPlugin<TPermissionBuilder>
> extends BasePluginWrapper<TPermissionBuilder, TAuth>
{
    /**
     * Check if the current user has the specified permissions.
     * Uses Better Auth's native `auth.api.userHasPermission()` API.
     *
     * @param permissions - Resource to actions mapping to check (type-safe from permission builder)
     * @returns Promise resolving to true if all permissions are granted
     *
     * @example
     * ```typescript
     * const canManageUsers = await plugin.checkPermission({
     *   user: ['create', 'update', 'delete'],
     * });
     * ```
     */
    async checkPermission(
        permissions: InferStatementFromBuilder<TPermissionBuilder>
    ): Promise<boolean> {
        try {
            const session = await this.auth.api.getSession({
                headers: this.headers,
            });

            const userId = session?.user.id;
            if (!userId) return false;

            const result = await this.auth.api.userHasPermission(
                { body: { userId, permissions } }
            );

            return result.success;
        } catch (error) {
            console.error("AdminPermissionsPlugin.checkPermission error:", error);
            return false;
        }
    }

    /**
     * Check permissions for a specific role (without requiring user session).
     * Uses Better Auth's native `auth.api.userHasPermission()` with role parameter.
     *
     * @param role - Role name to check permissions for (type-safe from permission builder)
     * @param permissions - Resource to actions mapping to check (type-safe from permission builder)
     * @returns Promise resolving to true if the role has all permissions
     *
     * @example
     * ```typescript
     * const adminCanCreate = await plugin.checkRolePermission('admin', {
     *   project: ['create'],
     * });
     * ```
     */
    async checkRolePermission(
        role: InferRoleNamesFromBuilder<TPermissionBuilder>,
        permissions: InferStatementFromBuilder<TPermissionBuilder>
    ): Promise<boolean> {
        try {
            const result = await this.auth.api.userHasPermission({
                body: {
                    // Type assertion needed: InferRoleNamesFromBuilder is string union from our builder,
                    // Better Auth expects InferAdminRolesFromOption which derives the same union differently
                    role: role as InferAdminRolesFromOption<{
                        roles: ReturnType<TPermissionBuilder["getRoles"]>;
                        ac: ReturnType<TPermissionBuilder["getAc"]>;
                    }>,
                    permissions,
                },
            });

            return result.success;
        } catch (error) {
            console.error("AdminPermissionsPlugin.checkRolePermission error:", error);
            return false;
        }
    }

    /**
     * Assert that the current user has the specified permissions.
     * Throws PermissionAssertionError if the check fails.
     * 
     * This method is used by middleware factories to enforce permissions.
     *
     * @param permissions - Resource to actions mapping to check
     * @param errorMessage - Optional custom error message
     * @throws PermissionAssertionError if permission check fails
     *
     * @example
     * ```typescript
     * // In middleware - will throw if permission check fails
     * await plugin.assertCheckPermission({
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
                message: errorMessage ?? `Missing required permission: ${JSON.stringify(permissions)}`,
                permissions: permissions as Record<string, readonly string[]>,
            });
        }
    }

    /**
     * Get the current user's role name from session.
     * 
     * @returns The user's role name or null if not authenticated
     */
    async getUserRole(): Promise<InferRoleNamesFromBuilder<TPermissionBuilder> | null> {
        try {
            // Use cached session if available
            const sessionData = this.session ?? await this.auth.api.getSession({
                headers: this.headers,
            });

            if (!sessionData?.user) return null;
            // Extract role with explicit type handling - session stores role as string name
            const role = (sessionData.user as Record<string, unknown>).role as InferRoleNamesFromBuilder<TPermissionBuilder> | undefined;
            return role ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Check if the current user has any of the specified roles.
     * 
     * @param roles - Role names to check (user must have at least one)
     * @returns Promise resolving to true if user has any of the roles
     */
    async checkRole(
        roles: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]
    ): Promise<boolean> {
        const userRole = await this.getUserRole();
        if (!userRole || roles.length === 0) return roles.length === 0;
        return (roles as readonly string[]).includes(userRole as string);
    }

    /**
     * Check if the current user has all of the specified roles.
     * Note: For single-role systems, this only passes if roles array has one item matching user's role.
     * 
     * @param roles - Role names to check (user must have all)
     * @returns Promise resolving to true if user has all roles
     */
    async checkAllRoles(
        roles: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]
    ): Promise<boolean> {
        const userRole = await this.getUserRole();
        if (!userRole || roles.length === 0) return roles.length === 0;
        // For single-role systems, all roles must be the same role
        return roles.length === 1 && roles[0] === userRole;
    }

    /**
     * Assert that the current user has any of the specified roles.
     * Throws RoleAssertionError if the check fails.
     * 
     * @param roles - Role names to check (user must have at least one)
     * @param errorMessage - Optional custom error message
     * @throws RoleAssertionError if role check fails
     */
    async assertCheckRole(
        roles: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[],
        errorMessage?: string
    ): Promise<void> {
        const userRole = await this.getUserRole();
        const hasRole = await this.checkRole(roles);
        if (!hasRole) {
            throw new RoleAssertionError({
                message: errorMessage ?? `Required role: ${(roles as readonly string[]).join(' or ')}`,
                requiredRoles: roles as readonly string[],
                actualRole: userRole as string | null,
            });
        }
    }

    /**
     * Assert that the current user has all of the specified roles.
     * Throws RoleAssertionError if the check fails.
     * 
     * @param roles - Role names to check (user must have all)
     * @param errorMessage - Optional custom error message
     * @throws RoleAssertionError if role check fails
     */
    async assertCheckAllRoles(
        roles: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[],
        errorMessage?: string
    ): Promise<void> {
        const userRole = await this.getUserRole();
        const hasAllRoles = await this.checkAllRoles(roles);
        if (!hasAllRoles) {
            throw new RoleAssertionError({
                message: errorMessage ?? `Required all roles: ${(roles as readonly string[]).join(' and ')}`,
                requiredRoles: roles as readonly string[],
                actualRole: userRole as string | null,
            });
        }
    }

    /**
     * Create a new user (admin-only operation)
     * Headers are automatically injected from context
     *
     * Parameter types are automatically inferred from Better Auth API
     *
     * @param data - User creation data (inferred from auth.api.createUser)
     * @returns Created user object
     *
     * @example
     * ```typescript
     * const user = await plugin.createUser({
     *   email: 'newuser@example.com',
     *   password: 'secure123',
     *   name: 'Jane Doe',
     *   role: 'user'
     * });
     * ```
     */
    async createUser(data: ExtractBody<InferParams<TAuth["api"]["createUser"]>>) {
        return await this.auth.api.createUser({
            headers: this.headers,
            body: data,
        });
    }

    /**
     * Update an existing user (admin-only operation)
     *
     * Parameter types are automatically inferred from Better Auth API
     *
     * @param userId - ID of user to update
     * @param data - Fields to update (inferred from auth.api.updateUser)
     * @returns Updated user object
     *
     * @example
     * ```typescript
     * const updatedUser = await plugin.updateUser('user-123', {
     *   name: 'Updated Name',
     *   email: 'newemail@example.com'
     * });
     * ```
     */
    async updateUser(userId: string, data: ExtractBody<InferParams<TAuth["api"]["updateUser"]>>) {
        return await this.auth.api.updateUser({
            headers: this.headers,
            query: { userId },
            body: data,
        });
    }

    /**
     * Set or update a user's role (admin-only operation)
     *
     * Role is strongly typed from the PermissionBuilder's defined roles.
     * Note: Better Auth's setRole endpoint has a design limitation where $Infer.body.role
     * is hardcoded to "user" | "admin". We use InferAdminRolesFromOption to get proper typing.
     *
     * @param userId - ID of user
     * @param role - Role to assign (must be a valid role from PermissionBuilder)
     * @returns Updated user object
     *
     * @example
     * ```typescript
     * await plugin.setRole('user-123', 'admin');
     * ```
     */
    async setRole(
        userId: string,
        role: InferAdminRolesFromOption<{
            roles: ReturnType<TPermissionBuilder["getRoles"]>;
            ac: ReturnType<TPermissionBuilder["getAc"]>;
        }>
    ) {
        return await this.auth.api.setRole({
            headers: this.headers,
            body: {
                userId,
                // Type assertion needed due to Better Auth's hardcoded "user" | "admin" in setRole.$Infer
                role: role as ExtractBody<InferParams<TAuth["api"]["setRole"]>>["role"],
            },
        });
    }

    /**
     * Delete a user (admin-only operation)
     *
     * @param userId - ID of user to delete
     *
     * @example
     * ```typescript
     * await plugin.removeUser('user-123');
     * ```
     */
    async removeUser(userId: string) {
        return await this.auth.api.removeUser({
            headers: this.headers,
            body: { userId },
        });
    }

    /**
     * Ban a user (admin-only operation)
     *
     * Parameter types are automatically inferred from Better Auth API
     *
     * @param userId - ID of user to ban
     * @param banReason - Optional reason for ban (inferred from auth.api.banUser)
     *
     * @example
     * ```typescript
     * await plugin.banUser('user-123', 'Violated terms of service');
     * ```
     */
    async banUser(userId: string, banReason?: ExtractBody<InferParams<TAuth["api"]["banUser"]>>["banReason"]) {
        return await this.auth.api.banUser({
            headers: this.headers,
            body: {
                userId,
                ...(banReason ? { banReason } : {}),
            },
        });
    }

    /**
     * Unban a previously banned user (admin-only operation)
     *
     * @param userId - ID of user to unban
     *
     * @example
     * ```typescript
     * await plugin.unbanUser('user-123');
     * ```
     */
    async unbanUser(userId: string) {
        return await this.auth.api.unbanUser({
            headers: this.headers,
            body: { userId },
        });
    }

    /**
     * List all users (admin-only operation)
     *
     * Parameter types are automatically inferred from Better Auth API
     *
     * @param options - Query options (pagination, filtering) (inferred from auth.api.listUsers)
     * @returns Array of users
     *
     * @example
     * ```typescript
     * const users = await plugin.listUsers({
     *   limit: 50,
     *   offset: 0
     * });
     * ```
     */
    async listUsers(options?: ExtractQuery<InferParams<TAuth["api"]["listUsers"]>>) {
        return await this.auth.api.listUsers({
            headers: this.headers,
            query: options ?? {},
        });
    }
}

/**
 * Type alias for AdminPermissionsPlugin with simplified generic parameters.
 * TStatement and TRoles are automatically inferred from TPermissionBuilder.
 */
export type AdminPlugin<
    TPermissionBuilder extends AnyPermissionBuilder = AnyPermissionBuilder,
    TAuth extends ApiMethodsWithAdminPlugin<TPermissionBuilder> = ApiMethodsWithAdminPlugin<TPermissionBuilder>
> = AdminPermissionsPlugin<TPermissionBuilder, TAuth>;
