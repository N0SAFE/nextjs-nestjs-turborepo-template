/**
 * Plugin Access Guard
 * 
 * Generic guard that enforces access control for Better Auth plugins
 * using scope-based hasAccess() methods.
 * 
 * This guard replaces the old permission-based guards that used hasUserPermission.
 * Instead, it delegates access checks to plugin-specific scope methods like:
 * - auth.admin.hasAccess()
 * - auth.org.hasAccess(organizationId)
 */

import { Injectable, CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../services/auth.service";
import { AuthUtils } from "../utils/auth-utils";
import { APIError } from "better-auth/api";
import type { RequestWithSession } from "../utils/access-control.utils";
import { adminDecorators, organizationDecorators } from "../plugin-utils/plugin-factory";

interface PluginAccessMetadata {
  plugin: string;
  scopeAccessor: string;
  errorMessage?: string;
  throwOnDeny?: boolean;
}

/**
 * Guard that checks plugin access using scope-based hasAccess() methods
 * 
 * This is a generic guard that works with any plugin that has a hasAccess() method
 * in its scope accessor (e.g., auth.admin.hasAccess(), auth.org.hasAccess())
 * 
 * @example
 * ```typescript
 * // In controller with admin plugin decorator
 * @UseGuards(PluginAccessGuard)
 * @adminDecorators.RequireAccess()
 * @Get('/admin/users')
 * listUsers() { ... }
 * 
 * // In controller with organization plugin decorator
 * @UseGuards(PluginAccessGuard)
 * @organizationDecorators.RequireAccess()
 * @Get('/organizations')
 * listOrganizations() { ... }
 * ```
 */
@Injectable()
export class PluginAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for admin plugin access requirement
    const adminMetadata = this.reflector.getAllAndOverride<PluginAccessMetadata>(
      adminDecorators.metadataKey,
      [context.getHandler(), context.getClass()]
    );

    // Check for organization plugin access requirement
    const orgMetadata = this.reflector.getAllAndOverride<PluginAccessMetadata>(
      organizationDecorators.metadataKey,
      [context.getHandler(), context.getClass()]
    );

    // If no plugin access requirements, allow access
    if (!adminMetadata && !orgMetadata) {
      return true;
    }

    // Get request and session
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const session = request.session;

    if (!session) {
      throw new APIError(401, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Get headers from request for AuthUtils
    const headers = new Headers();
    if (request.headers.authorization) {
      headers.set('authorization', request.headers.authorization as string);
    }
    if (request.headers.cookie) {
      headers.set('cookie', request.headers.cookie as string);
    }

    // Create AuthUtils with session and headers
    const authUtils = new AuthUtils(session, this.authService.instance, headers);

    // Check admin access if required
    if (adminMetadata) {
      const hasAccess = await authUtils.admin.hasAccess();
      
      if (!hasAccess) {
        throw new APIError(403, {
          code: "FORBIDDEN",
          message: adminMetadata.errorMessage ?? "Admin access required",
        });
      }
    }

    // Check organization access if required
    if (orgMetadata) {
      // For organization, we need to determine which organization to check
      // This could come from route params, query, or body
      // For now, we just check if user has access to any organization
      const hasAccess = await authUtils.org.hasAccess;
      
      // Note: For specific organization checks, you should pass the organizationId
      // This is a simplified check - in practice, you'd extract organizationId from request
      if (typeof hasAccess === 'function') {
        // If hasAccess is a function, we need an organizationId
        // This should be handled by a more specific guard or middleware
        throw new Error("Organization access check requires organizationId parameter");
      }
    }

    return true;
  }
}
