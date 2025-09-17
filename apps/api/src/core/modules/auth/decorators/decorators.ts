import { SetMetadata, createParamDecorator } from "@nestjs/common";
import type { CustomDecorator, ExecutionContext } from "@nestjs/common";
import type { createAuthMiddleware } from "better-auth/api";
import { AFTER_HOOK_KEY, BEFORE_HOOK_KEY, HOOK_KEY } from "../types/symbols";
import type { 
  Permission, 
  RoleName, 
  Resource,
  CommonPermissionKeys,
} from "@/config/auth/permissions";
import { PermissionChecker, commonPermissions } from "@/config/auth/permissions";

/**
 * Marks a route or a controller as public, allowing unauthenticated access.
 * When applied, the AuthGuard will skip authentication checks.
 */
export const Public = (): CustomDecorator<string> =>
	SetMetadata("PUBLIC", true);

/**
 * Marks a route or a controller as having optional authentication.
 * When applied, the AuthGuard will allow the request to proceed
 * even if no session is present.
 */
export const Optional = (): CustomDecorator<string> =>
	SetMetadata("OPTIONAL", true);

/**
 * Parameter decorator that extracts the user session from the request.
 * Provides easy access to the authenticated user's session data in controller methods.
 */
export const Session: ReturnType<typeof createParamDecorator> =
	createParamDecorator((_data: unknown, context: ExecutionContext): unknown => {
		const request = context.switchToHttp().getRequest();
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
export const BeforeHook = (path: `/${string}`): CustomDecorator<symbol> =>
	SetMetadata(BEFORE_HOOK_KEY, path);

/**
 * Registers a method to be executed after a specific auth route is processed.
 * @param path - The auth route path that triggers this hook (must start with '/')
 */
export const AfterHook = (path: `/${string}`): CustomDecorator<symbol> =>
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
export const RequireRole = (...roles: RoleName[]): CustomDecorator<string> =>
  SetMetadata("REQUIRED_ROLES", roles);

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
export const RequireAllRoles = (...roles: RoleName[]): CustomDecorator<string> =>
  SetMetadata("REQUIRED_ALL_ROLES", roles);

/**
 * Specifies the exact permissions required to access a route or controller.
 * Provides fine-grained access control based on resource-action permissions.
 * 
 * @param permissions - Permission object specifying required resource-action combinations
 * 
 * @example
 * ```typescript
 * @RequirePermissions({
 *   project: ['create', 'update'],
 *   user: ['list']
 * })
 * @Post('/projects')
 * createProject() {
 *   // Only users with project:create, project:update AND user:list permissions can access this
 * }
 * ```
 */
export const RequirePermissions = <T extends Resource>(
  permissions: Permission<T>
): CustomDecorator<string> => SetMetadata("REQUIRED_PERMISSIONS", permissions);

/**
 * Helper decorator for common permission patterns.
 * Uses predefined permission sets from commonPermissions.
 * 
 * @param permissionKey - Key from commonPermissions object
 * 
 * @example
 * ```typescript
 * @RequireCommonPermission('projectFullAccess')
 * @Put('/projects/:id')
 * updateProject() {
 *   // Uses the predefined projectFullAccess permission set
 * }
 * ```
 */
export const RequireCommonPermission = <T extends CommonPermissionKeys>(
  permissionKey: T
): CustomDecorator<string> => {
  return SetMetadata("REQUIRED_PERMISSIONS", commonPermissions[permissionKey]);
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
export const RequireRoleAndPermissions = <T extends Resource>(
  role: RoleName,
  permissions: Permission<T>
): MethodDecorator => {
  return (target: any, propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
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
export const UserRoles: ReturnType<typeof createParamDecorator> =
  createParamDecorator((_data: unknown, context: ExecutionContext): RoleName[] => {
    const request = context.switchToHttp().getRequest();
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
export const AuthenticatedUser: ReturnType<typeof createParamDecorator> =
  createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const session = request.session;
    const user = request.user;
    
    if (!session?.user) {
      return null;
    }
    
    const roles = user?.role ? PermissionChecker.getUserRoles(user.role) : [];
    
    return {
      ...session.user,
      role: user?.role || null,
      roles,
    };
  });
