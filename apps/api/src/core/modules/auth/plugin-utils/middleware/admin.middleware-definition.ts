/**
 * Admin Middleware Definition
 *
 * Provides type-safe middleware checks for admin-level operations.
 * Uses LAZY plugin instantiation - the plugin is created when checks execute,
 * giving access to runtime headers.
 *
 * Available checks:
 * - requireSession(): Require authenticated session (inherited)
 * - hasPermission(permissions): Check user has specific permissions
 * - hasPermissionByRole(role, permissions): Check role has permissions
 * - hasRole(roles): Check user has one of the specified roles
 * - requireAdminRole(): Require user to be admin
 *
 * @template TPermissionBuilder - The actual PermissionBuilder type (NOT abstracted)
 * @template TAuth - Auth type with admin plugin APIs
 */

import type {
  AnyPermissionBuilder,
  InferStatementFromBuilder,
  InferRoleNamesFromBuilder,
  ApiMethodsWithAdminPlugin,
  AdminPermissionsPlugin,
} from '@repo/auth/permissions/plugins';
import {
  BaseMiddlewareDefinition,
  type AuthWithSessionAPI,
} from './base.middleware-definition';
import {
  BaseMiddlewareCheck,
  createPermissionError,
  resolveValue,
  type MiddlewareCheck,
  type MiddlewareContext,
  type MiddlewareErrorCode,
  type ValueOrResolver,
  type PermissionObject,
} from './middleware-check';

// ============================================================================
// Type Constraints
// ============================================================================

/**
 * Admin plugin API constraint.
 * Extends AuthWithSessionAPI to include admin-specific API methods.
 */
export type AdminAuthConstraint<TPermissionBuilder extends AnyPermissionBuilder> =
  ApiMethodsWithAdminPlugin<TPermissionBuilder> & AuthWithSessionAPI;

/**
 * Plugin factory type for AdminPermissionsPlugin.
 * Creates the plugin with runtime context (headers).
 */
export type AdminPluginFactory<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AdminAuthConstraint<TPermissionBuilder>,
> = (context: MiddlewareContext<TAuth>) => AdminPermissionsPlugin<TPermissionBuilder, TAuth>;

// ============================================================================
// Admin Permission Check
// ============================================================================

/**
 * Check if user has the specified permissions.
 * Uses AdminPermissionsPlugin.checkPermission() for type-safe permission checking.
 */
export class HasPermissionCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AdminAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'hasPermission' as const;
  readonly description = 'Checks if user has the specified permissions';
  readonly permissions: PermissionObject;

  private readonly getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>;
  private readonly permissionsResolver: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>;

  constructor(
    getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>,
    permissions: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>
  ) {
    super();
    this.getPlugin = getPlugin;
    this.permissionsResolver = permissions;
    // For metadata - resolve static permissions immediately if not a function
    this.permissions =
      typeof permissions === 'function'
        ? {}
        : (permissions as unknown as PermissionObject);
  }

  async check(context: MiddlewareContext): Promise<void> {
    const permissions = await resolveValue(this.permissionsResolver, context);
    const plugin = this.getPlugin(context);

    // Use plugin's assertCheckPermission which throws PermissionAssertionError
    await plugin.assertCheckPermission(
      permissions,
      `Missing required permissions: ${JSON.stringify(permissions)}`
    );
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return 'You do not have the required permissions.';
  }
}

// ============================================================================
// Admin Permission By Role Check
// ============================================================================

/**
 * Check if a specific role has the specified permissions.
 * Uses AdminPermissionsPlugin.checkRolePermission() for type-safe checking.
 */
export class HasPermissionByRoleCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AdminAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'hasPermissionByRole' as const;
  readonly description = 'Checks if a role has the specified permissions';
  readonly permissions: PermissionObject;
  readonly role?: string;

  private readonly getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>;
  private readonly roleResolver: ValueOrResolver<InferRoleNamesFromBuilder<TPermissionBuilder>>;
  private readonly permissionsResolver: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>;

  constructor(
    getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>,
    role: ValueOrResolver<InferRoleNamesFromBuilder<TPermissionBuilder>>,
    permissions: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>
  ) {
    super();
    this.getPlugin = getPlugin;
    this.roleResolver = role;
    this.permissionsResolver = permissions;
    // For metadata
    this.permissions =
      typeof permissions === 'function'
        ? {}
        : (permissions as unknown as PermissionObject);
    this.role = typeof role === 'function' ? undefined : (role as string);
  }

  async check(context: MiddlewareContext): Promise<void> {
    const role = await resolveValue(this.roleResolver, context);
    const permissions = await resolveValue(this.permissionsResolver, context);
    const plugin = this.getPlugin(context);

    const hasPermission = await plugin.checkRolePermission(role, permissions);

    if (!hasPermission) {
      throw createPermissionError(
        permissions as unknown as PermissionObject,
        `Role '${role as string}' does not have permissions: ${JSON.stringify(permissions)}`
      );
    }
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return `Role does not have the required permissions.`;
  }
}

// ============================================================================
// Admin Role Check
// ============================================================================

/**
 * Check if user has any of the specified roles.
 * Uses AdminPermissionsPlugin.checkRole() for type-safe role checking.
 */
export class HasRoleCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AdminAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'hasRole' as const;
  readonly description = 'Checks if user has one of the specified roles';
  readonly requiredRoles: readonly string[];
  readonly matchMode: 'any' | 'all' = 'any';

  private readonly getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>;
  private readonly rolesResolver: ValueOrResolver<readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]>;

  constructor(
    getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>,
    roles: ValueOrResolver<readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]>
  ) {
    super();
    this.getPlugin = getPlugin;
    this.rolesResolver = roles;
    // For metadata
    this.requiredRoles =
      typeof roles === 'function' ? [] : (roles as readonly string[]);
  }

  async check(context: MiddlewareContext): Promise<void> {
    const roles = await resolveValue(this.rolesResolver, context);
    const plugin = this.getPlugin(context);

    // Use plugin's assertCheckRole which throws RoleAssertionError
    await plugin.assertCheckRole(
      roles as string[],
      `Required role: ${(roles as readonly string[]).join(' or ')}`
    );
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return `You do not have the required role.`;
  }
}

// ============================================================================
// Admin Role Requirement Check
// ============================================================================

/**
 * Require user to be in admin roles.
 * Uses: Checks session.user.role against adminRoles.
 */
export class RequireAdminRoleCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AdminAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'requireAdminRole' as const;
  readonly description = 'Requires user to have admin role';
  readonly requiredRoles: readonly string[];
  readonly matchMode: 'any' | 'all' = 'any';

  private readonly getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>;
  private readonly adminRoles: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[];

  constructor(
    getPlugin: AdminPluginFactory<TPermissionBuilder, TAuth>,
    adminRoles: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]
  ) {
    super();
    this.getPlugin = getPlugin;
    this.adminRoles = adminRoles;
    this.requiredRoles = adminRoles as readonly string[];
  }

  async check(context: MiddlewareContext): Promise<void> {
    const plugin = this.getPlugin(context);

    // Use plugin's assertCheckRole
    await plugin.assertCheckRole(
      this.adminRoles as string[],
      'Admin access required'
    );
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return 'Admin access required.';
  }
}

// ============================================================================
// Admin Middleware Definition Class
// ============================================================================

/**
 * Admin middleware definition with LAZY plugin instantiation.
 *
 * Instead of receiving a plugin instance at construction, this class receives
 * a plugin factory function. The factory is called when checks execute,
 * providing access to runtime context (headers).
 *
 * Provides middleware checks for:
 * - Permission checking via AdminPermissionsPlugin.checkPermission()
 * - Role checking via AdminPermissionsPlugin.checkRole()
 * - Admin role requirements
 *
 * All permission and role types are DERIVED from TPermissionBuilder:
 * - Permissions: InferStatementFromBuilder<TPermissionBuilder>
 * - Roles: InferRolesFromBuilder<TPermissionBuilder>
 *
 * @template TPermissionBuilder - The actual PermissionBuilder type used at instantiation
 * @template TAuth - Auth type with admin plugin APIs
 *
 * @example
 * ```typescript
 * // Create admin middleware with lazy plugin factory
 * const middlewares = new AdminMiddlewareDefinition(
 *   (context) => registry.create('admin', { headers: context.headers })
 * );
 *
 * // When check executes, plugin is created with runtime headers
 * const check = middlewares.hasPermission({ user: ['create'] });
 * await check.check({ headers: request.headers, ... });
 * ```
 */
export class AdminMiddlewareDefinition<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends AdminAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareDefinition<TPermissionBuilder, TAuth> {
  /**
   * Admin roles for requireAdminRole() check.
   * Default: ['admin']
   */
  private readonly adminRoles: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[];

  /**
   * Get the plugin factory cast to AdminPermissionsPlugin type.
   */
  protected getAdminPluginFactory(): AdminPluginFactory<TPermissionBuilder, TAuth> {
    return this.pluginFactory as unknown as AdminPluginFactory<TPermissionBuilder, TAuth>;
  }

  constructor(
    pluginFactory: AdminPluginFactory<TPermissionBuilder, TAuth>,
    options?: { adminRoles?: readonly InferRoleNamesFromBuilder<TPermissionBuilder>[] }
  ) {
    super(pluginFactory);
    // Default to 'admin' as the admin role - cast needed for generic constraint
    this.adminRoles = options?.adminRoles ?? (['admin'] as unknown as readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]);
  }

  // ==========================================================================
  // Permission-Based Methods
  // ==========================================================================

  /**
   * Check if current user has the specified permissions.
   * Uses: AdminPermissionsPlugin.assertCheckPermission()
   *
   * @param permissions - Type-safe permissions from PermissionBuilder
   *                      Type: InferStatementFromBuilder<TPermissionBuilder>
   * @returns MiddlewareCheck that verifies permissions
   *
   * @example
   * ```typescript
   * // If your builder defines { user: ['create', 'delete'], project: ['read'] }
   * middlewares.hasPermission({ user: ['create'] })           // ✓ Valid
   * middlewares.hasPermission({ user: ['invalid'] })          // ✗ Type error
   * ```
   */
  hasPermission(
    permissions: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>
  ): MiddlewareCheck {
    return new HasPermissionCheck(
      this.getAdminPluginFactory(),
      permissions
    );
  }

  /**
   * Check if a specific role has the specified permissions.
   * Uses: AdminPermissionsPlugin.checkRolePermission()
   *
   * @param role - Type-safe role from PermissionBuilder
   * @param permissions - Type-safe permissions from PermissionBuilder
   * @returns MiddlewareCheck that verifies role permissions
   *
   * @example
   * ```typescript
   * // If your builder defines roles 'admin' | 'user' | 'moderator'
   * middlewares.hasPermissionByRole('admin', { user: ['ban'] })   // ✓ Valid
   * middlewares.hasPermissionByRole('invalid', { user: ['ban'] }) // ✗ Type error
   * ```
   */
  hasPermissionByRole(
    role: ValueOrResolver<InferRoleNamesFromBuilder<TPermissionBuilder>>,
    permissions: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>
  ): MiddlewareCheck {
    return new HasPermissionByRoleCheck(
      this.getAdminPluginFactory(),
      role,
      permissions
    );
  }

  // ==========================================================================
  // Role-Based Methods
  // ==========================================================================

  /**
   * Check if current user has any of the specified roles.
   * Uses: AdminPermissionsPlugin.assertCheckRole()
   *
   * @param roles - Type-safe role names from PermissionBuilder
   *                Type: InferRoleNamesFromBuilder<TPermissionBuilder>[]
   * @returns MiddlewareCheck that verifies role membership
   *
   * @example
   * ```typescript
   * middlewares.hasRole(['admin', 'moderator'])  // ✓ Type-safe role names
   * ```
   */
  hasRole(
    roles: ValueOrResolver<readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]>
  ): MiddlewareCheck {
    return new HasRoleCheck(
      this.getAdminPluginFactory(),
      roles
    );
  }

  /**
   * Require user to be in the admin roles.
   * Uses: AdminPermissionsPlugin.assertCheckRole() with adminRoles option
   *
   * Default adminRoles: ['admin']
   *
   * @returns MiddlewareCheck that verifies admin role
   *
   * @example
   * ```typescript
   * // Default: requires 'admin' role
   * middlewares.requireAdminRole()
   *
   * // Custom admin roles via constructor options
   * const middlewares = new AdminMiddlewareDefinition(pluginFactory, {
   *   adminRoles: ['admin', 'superuser']
   * });
   * ```
   */
  requireAdminRole(): MiddlewareCheck {
    return new RequireAdminRoleCheck(
      this.getAdminPluginFactory(),
      this.adminRoles
    );
  }
}
