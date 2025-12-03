import type { Auth } from "@/auth";
import type { Permission, RoleName } from "@repo/auth/permissions";

/**
 * User session type from Better Auth
 */
export interface UserSession {
  session: Auth["$Infer"]["Session"]["session"];
  user: Auth["$Infer"]["Session"]["user"];
}

/**
 * Access control options for programmatic auth checks
 */
export interface AccessOptions {
  /** Required roles - user must have ANY of these */
  roles?: RoleName[];
  /** Required roles - user must have ALL of these */
  allRoles?: RoleName[];
  /** Required permissions */
  permissions?: Permission;
}

/**
 * Auth utilities available in ORPC context
 */
export interface ORPCAuthContext {
  /** Whether user is authenticated */
  readonly isLoggedIn: boolean;

  /** User session (null if not authenticated) */
  readonly session: UserSession | null;

  /** User object (null if not authenticated) */
  readonly user: UserSession["user"] | null;

  /**
   * Require user to be authenticated
   * @throws UnauthorizedException if not authenticated
   * @returns UserSession
   */
  requireAuth(): UserSession;

  /**
   * Require user to have specific role(s)
   * @param roles - User must have ANY of these roles
   * @throws UnauthorizedException if not authenticated
   * @throws ForbiddenException if missing required roles
   * @returns UserSession
   */
  requireRole(...roles: RoleName[]): UserSession;

  /**
   * Require user to have ALL specified roles
   * @param roles - User must have ALL of these roles
   * @throws UnauthorizedException if not authenticated
   * @throws ForbiddenException if missing required roles
   * @returns UserSession
   */
  requireAllRoles(...roles: RoleName[]): UserSession;

  /**
   * Require user to have specific permissions
   * @param permissions - Required permission object
   * @throws UnauthorizedException if not authenticated
   * @throws ForbiddenException if missing required permissions
   * @returns UserSession
   */
  requirePermissions(permissions: Permission): Promise<UserSession>;

  /**
   * Check if user has access based on options
   * @param options - Access control options
   * @returns true if user has access, false otherwise
   */
  access(options: AccessOptions): Promise<boolean>;

  /**
   * Get user roles as array
   * @returns Array of role names
   */
  getRoles(): RoleName[];

  /**
   * Check if user has specific role
   * @param role - Role to check
   * @returns true if user has role
   */
  hasRole(role: RoleName): boolean;

  /**
   * Check if user has specific permission
   * @param permission - Permission to check
   * @returns true if user has permission
   */
  hasPermission(permission: Permission): Promise<boolean>;
}

/**
 * Authenticated auth context type (guaranteed non-null user and session)
 */
export type AuthenticatedContext = ORPCAuthContext & {
  isLoggedIn: true;
  session: UserSession;
  user: UserSession["user"];
};

/**
 * Type assertion helper for authenticated context
 * Use this after requireAuth() middleware to get proper types without null assertions
 * 
 * @example
 * ```ts
 * implement(contract)
 *   .use(requireAuth())
 *   .handler(({ context }) => {
 *     const auth = assertAuthenticated(context.auth);
 *     const userId = auth.user.id; // No ! needed
 *   })
 * ```
 */
export function assertAuthenticated(auth: ORPCAuthContext): AuthenticatedContext {
  if (!auth.isLoggedIn || !auth.session || !auth.user) {
    throw new Error('Auth context is not authenticated');
  }
  return auth as AuthenticatedContext;
}
