import { createParamDecorator, SetMetadata } from "@nestjs/common";
import type { CustomDecorator, ExecutionContext } from "@nestjs/common";
import type { createAuthMiddleware } from "better-auth/api";
import { AFTER_HOOK_KEY, BEFORE_HOOK_KEY, HOOK_KEY } from "../types/symbols";
import type { RoleName } from "@repo/auth/permissions";
import { PermissionChecker } from "@repo/auth/permissions";
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
