import { createParamDecorator, SetMetadata } from "@nestjs/common";
import type { CustomDecorator, ExecutionContext } from "@nestjs/common";
import type { createAuthMiddleware } from "better-auth/api";
import { AFTER_HOOK_KEY, BEFORE_HOOK_KEY, HOOK_KEY } from "../types/symbols";
import type {
    OrganizationPermissionKeys,
    Permission,
    PlatformPermissionKeys,
    Resource,
    RoleName,
} from "@repo/auth/permissions";
import { organizationPermissions, PermissionChecker, platformPermissions } from "@repo/auth/permissions";
import type { Session as BetterAuthSession } from "better-auth";
import type { UserWithRole } from "better-auth/plugins";
import { getRequestFromContext } from "../utils/context";
/**
 * Allows unauthenticated (anonymous) access to a route or controller.
 * When applied, the AuthGuard will not perform authentication checks.
 */
export const AllowAnonymous = (): CustomDecorator =>
	SetMetadata("PUBLIC", true);

/**
 * Marks a route or controller as having optional authentication.
 * When applied, the AuthGuard allows the request to proceed
 * even if no session is present.
 */
export const OptionalAuth = (): CustomDecorator =>
	SetMetadata("OPTIONAL", true);

/**
 * @deprecated Use AllowAnonymous() instead.
 */
export const Public = AllowAnonymous;

/**
 * @deprecated Use OptionalAuth() instead.
 */
export const Optional = OptionalAuth;

/**
 * Parameter decorator that extracts the user session from the request.
 * Provides easy access to the authenticated user's session data in controller methods.
 * Works with both HTTP and GraphQL execution contexts.
 */
export const Session: ReturnType<typeof createParamDecorator> =
	createParamDecorator((_data: unknown, context: ExecutionContext): unknown => {
		const request = getRequestFromContext(context);
		return request.session;
	});
/**
 * Represents the context object passed to hooks.
 * This type is derived from the parameters of the createAuthMiddleware function.
 */
export type AuthHookContext = Parameters<
	Parameters<typeof createAuthMiddleware>[0]
>[0];

/**
 * Registers a method to be executed before a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const BeforeHook = (path?: `/${string}`): CustomDecorator<symbol> =>
	SetMetadata(BEFORE_HOOK_KEY, path);

/**
 * Registers a method to be executed after a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const AfterHook = (path?: `/${string}`): CustomDecorator<symbol> =>
	SetMetadata(AFTER_HOOK_KEY, path);

/**
 * Class decorator that marks a provider as containing hook methods.
 * Must be applied to classes that use BeforeHook or AfterHook decorators.
 */
export const Hook = (): ClassDecorator => SetMetadata(HOOK_KEY, true);


// ===== PERMISSION-BASED ACCESS CONTROL DECORATORS =====

/**
 * Specifies the roles required to access a route or controller.
 * The user must have ANY of the specified roles to access the resource.
 * Used in conjunction with RoleGuard to enforce role-based access control.
 *
 * @param roles - Role names that are allowed to access the resource
 *
 * @example
 * ```typescript
 * @RequireRole('admin', 'manager')
 * @Get('/sensitive-data')
 * getSensitiveData() {
 *   // Only users with 'admin' OR 'manager' role can access this
 * }
 * ```
 */
export const RequireRole = (...roles: RoleName[]): CustomDecorator => SetMetadata("REQUIRED_ROLES", roles);

/**
 * Specifies that the user must have ALL of the specified roles to access the resource.
 * More restrictive than RequireRole which only requires ANY of the roles.
 *
 * @param roles - Role names that the user must have (all of them)
 *
 * @example
 * ```typescript
 * @RequireAllRoles('admin', 'superuser')
 * @Delete('/system/reset')
 * resetSystem() {
 *   // Only users with BOTH 'admin' AND 'superuser' roles can access this
 * }
 * ```
 */
export const RequireAllRoles = (...roles: RoleName[]): CustomDecorator => SetMetadata("REQUIRED_ALL_ROLES", roles);

/**
 * @deprecated Use plugin-based scope access methods instead (e.g., auth.admin.hasAccess(), auth.org.hasAccess())
 * 
 * Specifies the exact permissions required to access a route or controller.
 * Provides fine-grained access control based on resource-action permissions.
 *
 * **Migration Guide:**
 * - For admin operations: Use `@adminDecorators.RequireAccess()` with `PluginAccessGuard`
 * - For organization operations: Use scope checks in handler (e.g., `auth.org.hasAccess(orgId)`)
 * - For ORPC: Use `adminMiddlewares.requireAccess()` or `organizationMiddlewares.requireResourceAccess()`
 *
 * @param permissions - Permission object specifying required resource-action combinations
 *
 * @example
 * ```typescript
 * // OLD WAY (deprecated)
 * @RequirePermissions({
 *   project: ['create', 'update'],
 *   user: ['list']
 * })
 * @Post('/projects')
 * createProject() { ... }
 * 
 * // NEW WAY (recommended)
 * import { adminDecorators } from '@/core/modules/auth/plugin-utils';
 * 
 * @UseGuards(PluginAccessGuard)
 * @adminDecorators.RequireAccess()
 * @Post('/projects')
 * async createProject(@Session() session) {
 *   // Access check is done by guard via auth.admin.hasAccess()
 * }
 * ```
 */
export const RequirePermissions = <T extends Resource>(permissions: Permission<T>): CustomDecorator => SetMetadata("REQUIRED_PERMISSIONS", permissions);

/**
 * @deprecated Use plugin-based scope access methods instead
 * 
 * Helper decorator for common permission patterns.
 * Uses predefined permission sets from commonPermissions.
 *
 * **Migration Guide:**
 * - Replace with plugin-specific decorators and scope checks
 * - Use `auth.admin.hasAccess()` for platform-level checks
 * - Use `auth.org.hasAccess(orgId)` for organization-level checks
 *
 * @param permissionKey - Key from commonPermissions object
 *
 * @example
 * ```typescript
 * // OLD WAY (deprecated)
 * @RequireCommonPermission('projectFullAccess')
 * @Put('/projects/:id')
 * updateProject() { ... }
 * 
 * // NEW WAY (recommended)
 * import { adminDecorators } from '@/core/modules/auth/plugin-utils';
 * 
 * @UseGuards(PluginAccessGuard)
 * @adminDecorators.RequireAccess()
 * @Put('/projects/:id')
 * async updateProject() { ... }
 * ```
 */
type CommonPermissionKey = PlatformPermissionKeys | OrganizationPermissionKeys;

export const RequireCommonPermission = (permissionKey: CommonPermissionKey): CustomDecorator => {
	const permissions = Object.prototype.hasOwnProperty.call(platformPermissions, permissionKey)
		? platformPermissions[permissionKey as PlatformPermissionKeys]
		: organizationPermissions[permissionKey as OrganizationPermissionKeys];

	return SetMetadata("REQUIRED_PERMISSIONS", permissions);
};

/**
 * Combines role and permission requirements.
 * The user must have the specified role AND the specified permissions.
 *
 * @param role - Required role name
 * @param permissions - Required permissions
 *
 * @example
 * ```typescript
 * @RequireRoleAndPermissions('manager', {
 *   project: ['delete'],
 *   organization: ['manage-members']
 * })
 * @Delete('/projects/:id/force-delete')
 * forceDeleteProject() {
 *   // User must be a manager AND have project:delete + organization:manage-members permissions
 * }
 * ```
 */
export const RequireRoleAndPermissions = <T extends Resource>(role: RoleName, permissions: Permission<T>): MethodDecorator => {
    return (target: object, propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
        if (propertyKey === undefined) {
            throw new Error("RequireRoleAndPermissions can only be applied to methods");
        }

        // Apply both decorators
        RequireRole(role)(target, propertyKey, descriptor);
        RequirePermissions(permissions)(target, propertyKey, descriptor);
        return descriptor;
    };
};

/**
 * Parameter decorator that extracts the user's roles from the request.
 * Provides easy access to the authenticated user's role information in controller methods.
 *
 * @example
 * ```typescript
 * @Get('/profile')
 * getProfile(@UserRoles() roles: RoleName[]) {
 *   // roles contains the user's assigned roles
 *   return { roles };
 * }
 * ```
 */
export const UserRoles: ReturnType<typeof createParamDecorator> = createParamDecorator((_data: unknown, context: ExecutionContext): RoleName[] => {
    const request = context.switchToHttp().getRequest<Request & { session: BetterAuthSession & { user?: UserWithRole }; user?: UserWithRole }>();
    const user = request.user;

    if (!user?.role) {
        return [];
    }

    return PermissionChecker.getUserRoles(user.role);
});

/**
 * Parameter decorator that extracts the current user with their role information.
 * Extends the basic Session decorator with role data.
 *
 * @example
 * ```typescript
 * @Get('/dashboard')
 * getDashboard(@AuthenticatedUser() user: { id: string; role: string; roles: RoleName[] }) {
 *   // user contains id, role string, and parsed roles array
 *   return { welcomeMessage: `Hello ${user.id}`, userRoles: user.roles };
 * }
 * ```
 */
export const AuthenticatedUser: ReturnType<typeof createParamDecorator> = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request & { session: BetterAuthSession & { user?: UserWithRole }; user?: UserWithRole }>();
    const session = request.session;
    const user = request.user;

    if (!session.user) {
        return null;
    }

    const roles = user?.role ? PermissionChecker.getUserRoles(user.role) : [];

    return {
        ...session.user,
        role: user?.role ?? null,
        roles,
    };
});
