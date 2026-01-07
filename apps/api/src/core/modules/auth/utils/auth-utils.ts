import type { Auth } from "@/auth";
import { createPluginRegistry, type AdminPluginWrapper, type OrganizationPluginWrapper } from "../plugin-utils/plugin-wrapper-factory";
import { ORPCError } from "@orpc/client";

/**
 * User session type from Better Auth
 */
export interface UserSession {
  session: Auth["$Infer"]["Session"]["session"];
  user: Auth["$Infer"]["Session"]["user"];
}

/**
 * Request type extended with Better Auth session
 * Used in NestJS guards and controllers for typed access to authentication context
 */
export type RequestWithSession = Request & {
  session?: UserSession | null;
};

/**
 * Global auth utilities class that provides authentication context
 * Used in ORPC handlers via context.auth
 * 
 * For access control, use plugin-based middlewares:
 * - `adminMiddlewares.requireRole(role)` - Require specific role
 * - `adminMiddlewares.requirePermission(permission)` - Permission-based access
 * - `adminMiddlewares.requireAccess({ roles, permissions })` - Complex access control
 * - `organizationMiddlewares.requireRole(role)` - Organization role-based access
 * 
 * @example
 * ```ts
 * // In ORPC handler
 * implement(contract)
 *   .use(adminMiddlewares.requireRole(['admin']))
 *   .handler(({ context }) => {
 *     const { auth } = context;
 *     // Access plugins
 *     await auth.admin.listUsers();
 *     await auth.org.createOrganization({ ... });
 *   })
 * ```
 */
export class AuthUtils {
  private readonly _adminUtils: AdminPluginWrapper;
  private readonly _orgUtils: OrganizationPluginWrapper;

  constructor(
    private readonly _session: UserSession | null,
    private readonly auth: Auth,
    private readonly headers?: Headers
  ) {
    // Create plugin wrappers using the registry with getAll()
    const registry = createPluginRegistry(auth);
    const plugins = registry.getAll(headers ?? new Headers());
    this._adminUtils = plugins.admin;
    this._orgUtils = plugins.organization;
  }

  get isLoggedIn(): boolean {
    return this._session !== null;
  }

  get session(): Auth["$Infer"]["Session"]["session"] | null {
    return this._session?.session ?? null;
  }

  get user(): UserSession["user"] | null {
    return this._session?.user ?? null;
  }

  /**
   * Access admin plugin utilities with auto-injected headers
   * 
   * @example
   * ```typescript
   * // In ORPC handler
   * const user = await context.auth.admin.createUser({
   *   email: 'user@example.com',
   *   password: 'secure123',
   *   name: 'John Doe',
   *   role: 'user'
   * });
   * ```
   */
  get admin(): AdminPluginWrapper {
    return this._adminUtils;
  }

  /**
   * Access organization plugin utilities with auto-injected headers
   * 
   * @example
   * ```typescript
   * // In ORPC handler
   * const org = await context.auth.org.createOrganization({
   *   name: 'Acme Corp',
   *   slug: 'acme-corp',
   *   userId: context.auth.user?.id
   * });
   * ```
   */
  get org(): OrganizationPluginWrapper {
    return this._orgUtils;
  }

  /**
   * Require authentication - throws if user is not logged in
   * 
   * Use this for programmatic auth checks after middleware processing,
   * or as a type guard to narrow the session type.
   * 
   * @throws ORPCError with UNAUTHORIZED code if not authenticated
   * @returns The authenticated user session (guaranteed non-null)
   * 
   * @example
   * ```typescript
   * // Programmatic check in handler
   * const session = context.auth.requireAuth();
   * // session.user and session.session are guaranteed non-null
   * ```
   */
  requireAuth(): UserSession {
    if (!this._session) {
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Authentication required',
      });
    }
    return this._session;
  }
}

/**
 * Empty auth utilities for unauthenticated contexts
 * Used as placeholder before authentication middleware runs
 */
export class AuthUtilsEmpty {
  readonly isLoggedIn = false;
  readonly session = null;
  readonly user = null;
  
  // Admin and org utilities (available even when not logged in)
  private readonly _admin: AdminPluginWrapper;
  private readonly _org: OrganizationPluginWrapper;

  constructor(auth: Auth) {
    // Create utilities using registry with getAll()
    const registry = createPluginRegistry(auth);
    const plugins = registry.getAll(new Headers());
    this._admin = plugins.admin;
    this._org = plugins.organization;
  }

  get admin(): AdminPluginWrapper {
    return this._admin;
  }

  get org(): OrganizationPluginWrapper {
    return this._org;
  }

  /**
   * Always throws UNAUTHORIZED since this is an unauthenticated context
   * @throws ORPCError with UNAUTHORIZED code
   */
  requireAuth(): never {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Authentication required',
    });
  }
}
