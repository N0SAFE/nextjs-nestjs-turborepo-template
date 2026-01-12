/**
 * Organization Middleware Definition
 *
 * Provides type-safe middleware checks for organization-level operations.
 * Uses `TPermissionBuilder extends AnyPermissionBuilder` to preserve
 * the real permission builder type throughout the entire chain.
 *
 * Available checks:
 * - requireSession(): Require authenticated session (inherited)
 * - hasOrganizationPermission(permissions): Check user has permissions in organization context
 * - isMemberOf(organizationId): Check user is member of organization
 * - hasOrganizationRole(organizationId, roles): Check user has specific role in organization
 *
 * Note: Organization permissions are context-based (within an org), not global like admin.
 *
 * @template TPermissionBuilder - The actual PermissionBuilder type (NOT abstracted)
 * @template TAuth - Auth type with organization plugin APIs
 */

import type {
  AnyPermissionBuilder,
  InferStatementFromBuilder,
  InferRoleNamesFromBuilder,
  ApiMethodsWithOrganizationPlugin,
  OrganizationsPermissionsPlugin,
} from '@repo/auth/permissions/plugins';
import {
  BaseMiddlewareDefinition,
  type AuthWithSessionAPI,
} from './base.middleware-definition';
import {
  BaseMiddlewareCheck,
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
 * Organization plugin API constraint.
 * Extends AuthWithSessionAPI to include organization-specific API methods.
 */
export type OrganizationAuthConstraint<TPermissionBuilder extends AnyPermissionBuilder> =
  ApiMethodsWithOrganizationPlugin<TPermissionBuilder> & AuthWithSessionAPI;

/**
 * Factory function type for creating organization plugins lazily with context.
 * Called at check execution time when runtime context (headers, etc.) is available.
 */
export type OrganizationPluginFactory<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends OrganizationAuthConstraint<TPermissionBuilder>,
> = (context: MiddlewareContext<TAuth>) => OrganizationsPermissionsPlugin<TPermissionBuilder, TAuth>;

/**
 * Member type extracted from listMembers return type.
 * This represents an organization member with their role.
 */
interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
  teamId?: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

// ============================================================================
// Organization Permission Check
// ============================================================================

/**
 * Check if user has the specified permissions within organization context.
 * Uses OrganizationsPermissionsPlugin.assertCheckPermission() for type-safe permission checking.
 *
 * Note: This checks permissions in the current organization context, which is
 * determined by the session's active organization.
 */
export class HasOrganizationPermissionCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends OrganizationAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'hasOrganizationPermission' as const;
  readonly description = 'Checks if user has the specified permissions within organization';
  readonly permissions: PermissionObject;

  private readonly getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>;
  private readonly permissionsResolver: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>;

  constructor(
    getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>,
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
      `Missing required organization permissions: ${JSON.stringify(permissions)}`
    );
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return 'You do not have the required organization permissions.';
  }
}

// ============================================================================
// Organization Membership Check
// ============================================================================

/**
 * Check if user is a member of the specified organization.
 * Uses session and organization member lookup.
 */
export class IsMemberOfCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends OrganizationAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'isMemberOf' as const;
  readonly description = 'Checks if user is a member of the specified organization';

  private readonly getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>;
  private readonly organizationIdResolver: ValueOrResolver<string>;

  constructor(
    getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>,
    organizationId: ValueOrResolver<string>
  ) {
    super();
    this.getPlugin = getPlugin;
    this.organizationIdResolver = organizationId;
  }

  async check(context: MiddlewareContext): Promise<void> {
    const organizationId = await resolveValue(this.organizationIdResolver, context);
    const plugin = this.getPlugin(context);

    // Get session (synchronous - returns cached session)
    const session = plugin.getSession();
    if (!session?.user.id) {
      throw new Error('Session required to check organization membership');
    }

    const userId = session.user.id;

    // listMembers returns { members: [...], total: number }
    const result = await plugin.listMembers(organizationId);
    const members = result.members as OrganizationMember[];

    // Check if user is a member
    const isMember = members.some((member) => member.userId === userId);

    if (!isMember) {
      throw new Error(`User is not a member of organization: ${organizationId}`);
    }
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return 'You are not a member of this organization.';
  }
}

// ============================================================================
// Organization Role Check
// ============================================================================

/**
 * Check if user has specific role(s) within an organization.
 * Uses organization member role lookup.
 */
export class HasOrganizationRoleCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends OrganizationAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'hasOrganizationRole' as const;
  readonly description = 'Checks if user has one of the specified roles in organization';
  readonly requiredRoles: readonly string[];
  readonly matchMode: 'any' | 'all' = 'any';

  private readonly getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>;
  private readonly organizationIdResolver: ValueOrResolver<string>;
  private readonly rolesResolver: ValueOrResolver<readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]>;

  constructor(
    getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>,
    organizationId: ValueOrResolver<string>,
    roles: ValueOrResolver<readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]>
  ) {
    super();
    this.getPlugin = getPlugin;
    this.organizationIdResolver = organizationId;
    this.rolesResolver = roles;
    // For metadata
    this.requiredRoles =
      typeof roles === 'function' ? [] : (roles as readonly string[]);
  }

  async check(context: MiddlewareContext): Promise<void> {
    const organizationId = await resolveValue(this.organizationIdResolver, context);
    const roles = await resolveValue(this.rolesResolver, context);
    const plugin = this.getPlugin(context);

    // Get session (synchronous - returns cached session)
    const session = plugin.getSession();
    if (!session?.user.id) {
      throw new Error('Session required to check organization role');
    }

    const userId = session.user.id;

    // listMembers returns { members: [...], total: number }
    const result = await plugin.listMembers(organizationId);
    const members = result.members as OrganizationMember[];

    // Find current user's membership
    const userMember = members.find((member) => member.userId === userId);

    if (!userMember) {
      throw new Error(`User is not a member of organization: ${organizationId}`);
    }

    // Check if user's role matches any of the required roles
    const userRole = userMember.role;
    const rolesArray = roles as readonly string[];
    const hasRole = rolesArray.includes(userRole);

    if (!hasRole) {
      throw new Error(
        `User does not have required role. Required: ${rolesArray.join(', ')}, Has: ${userRole}`
      );
    }
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return 'You do not have the required role in this organization.';
  }
}

// ============================================================================
// Organization Owner Check
// ============================================================================

/**
 * Check if user is the owner of the specified organization.
 */
export class IsOrganizationOwnerCheck<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends OrganizationAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareCheck {
  readonly name = 'isOrganizationOwner' as const;
  readonly description = 'Checks if user is the owner of the organization';

  private readonly getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>;
  private readonly organizationIdResolver: ValueOrResolver<string>;

  constructor(
    getPlugin: OrganizationPluginFactory<TPermissionBuilder, TAuth>,
    organizationId: ValueOrResolver<string>
  ) {
    super();
    this.getPlugin = getPlugin;
    this.organizationIdResolver = organizationId;
  }

  async check(context: MiddlewareContext): Promise<void> {
    const organizationId = await resolveValue(this.organizationIdResolver, context);
    const plugin = this.getPlugin(context);

    // Get organization details
    const organization = await plugin.getOrganization(organizationId);

    // Get session (synchronous - returns cached session)
    const session = plugin.getSession();
    if (!session?.user.id) {
      throw new Error('Session required to check organization ownership');
    }

    const userId = session.user.id;

    // Check if the organization's creatorId matches the current user
    // Note: Better Auth organization plugin stores the creator as the initial owner
    const orgWithCreator = organization as unknown as { creatorId?: string };
    if (orgWithCreator.creatorId !== userId) {
      // Alternative: Check member role for 'owner'
      const result = await plugin.listMembers(organizationId);
      const members = result.members as OrganizationMember[];
      const userMember = members.find((member) => member.userId === userId);

      if (userMember?.role !== 'owner') {
        throw new Error(`User is not the owner of organization: ${organizationId}`);
      }
    }
  }

  getErrorCode(): MiddlewareErrorCode {
    return 'FORBIDDEN';
  }

  getErrorMessage(): string {
    return 'You are not the owner of this organization.';
  }
}

// ============================================================================
// Organization Middleware Definition Class
// ============================================================================

/**
 * Organization middleware definition with full type safety from PermissionBuilder.
 *
 * Provides middleware checks for:
 * - Organization-scoped permission checking via OrganizationsPermissionsPlugin
 * - Organization membership verification
 * - Organization role checking
 * - Organization ownership verification
 *
 * All permission and role types are DERIVED from TPermissionBuilder:
 * - Permissions: InferStatementFromBuilder<TPermissionBuilder>
 * - Roles: InferRoleNamesFromBuilder<TPermissionBuilder>
 *
 * @template TPermissionBuilder - The actual PermissionBuilder type used at instantiation
 * @template TAuth - Auth type with organization plugin APIs
 *
 * @example
 * ```typescript
 * // Create organization middleware definition
 * const middlewares = new OrganizationMiddlewareDefinition(orgPlugin);
 *
 * // Type-safe permission checks (in organization context)
 * middlewares.hasOrganizationPermission({ project: ['create'] })
 *
 * // Membership and role checks
 * middlewares.isMemberOf(orgId)
 * middlewares.hasOrganizationRole(orgId, ['admin', 'owner'])
 * middlewares.isOrganizationOwner(orgId)
 * ```
 */
export class OrganizationMiddlewareDefinition<
  TPermissionBuilder extends AnyPermissionBuilder,
  TAuth extends OrganizationAuthConstraint<TPermissionBuilder>,
> extends BaseMiddlewareDefinition<TPermissionBuilder, TAuth> {
  /**
   * Plugin factory that creates OrganizationsPermissionsPlugin with runtime context.
   */
  private readonly orgPluginFactory: OrganizationPluginFactory<TPermissionBuilder, TAuth>;

  constructor(pluginFactory: OrganizationPluginFactory<TPermissionBuilder, TAuth>) {
    // Pass a base factory to parent (cast since parent accepts BasePluginWrapper factory)
    super(pluginFactory)
    this.orgPluginFactory = pluginFactory;
  }

  /**
   * Get the organization plugin factory for creating org-specific plugins.
   */
  getOrgPluginFactory(): OrganizationPluginFactory<TPermissionBuilder, TAuth> {
    return this.orgPluginFactory;
  }

  // ==========================================================================
  // Permission-Based Methods
  // ==========================================================================

  /**
   * Check if current user has the specified permissions within organization context.
   * Uses: OrganizationsPermissionsPlugin.assertCheckPermission()
   *
   * Note: This checks permissions in the current organization context,
   * which is determined by the session's active organization.
   *
   * @param permissions - Type-safe permissions from PermissionBuilder
   *                      Type: InferStatementFromBuilder<TPermissionBuilder>
   * @returns MiddlewareCheck that verifies permissions
   *
   * @example
   * ```typescript
   * // If your builder defines { project: ['create', 'delete'], team: ['manage'] }
   * middlewares.hasOrganizationPermission({ project: ['create'] })  // ✓ Valid
   * middlewares.hasOrganizationPermission({ project: ['invalid'] }) // ✗ Type error
   * ```
   */
  hasOrganizationPermission(
    permissions: ValueOrResolver<InferStatementFromBuilder<TPermissionBuilder>>
  ): MiddlewareCheck {
    return new HasOrganizationPermissionCheck(
      this.orgPluginFactory,
      permissions
    );
  }

  // ==========================================================================
  // Membership Methods
  // ==========================================================================

  /**
   * Check if current user is a member of the specified organization.
   *
   * @param organizationId - Organization ID to check membership in
   * @returns MiddlewareCheck that verifies membership
   *
   * @example
   * ```typescript
   * // Static organization ID
   * middlewares.isMemberOf('org-123')
   *
   * // Dynamic from context
   * middlewares.isMemberOf((ctx) => ctx.params.organizationId)
   * ```
   */
  isMemberOf(
    organizationId: ValueOrResolver<string>
  ): MiddlewareCheck {
    return new IsMemberOfCheck(
      this.orgPluginFactory,
      organizationId
    );
  }

  // ==========================================================================
  // Role-Based Methods
  // ==========================================================================

  /**
   * Check if current user has any of the specified roles within an organization.
   *
   * @param organizationId - Organization ID to check role in
   * @param roles - Type-safe roles from PermissionBuilder
   *                Type: InferRoleNamesFromBuilder<TPermissionBuilder>[]
   * @returns MiddlewareCheck that verifies role membership
   *
   * @example
   * ```typescript
   * // Check for admin or owner role
   * middlewares.hasOrganizationRole('org-123', ['admin', 'owner'])
   *
   * // Dynamic organization and static roles
   * middlewares.hasOrganizationRole(
   *   (ctx) => ctx.params.orgId,
   *   ['admin']
   * )
   * ```
   */
  hasOrganizationRole(
    organizationId: ValueOrResolver<string>,
    roles: ValueOrResolver<readonly InferRoleNamesFromBuilder<TPermissionBuilder>[]>
  ): MiddlewareCheck {
    return new HasOrganizationRoleCheck(
      this.orgPluginFactory,
      organizationId,
      roles
    );
  }

  /**
   * Check if current user is the owner of the specified organization.
   *
   * @param organizationId - Organization ID to check ownership of
   * @returns MiddlewareCheck that verifies ownership
   *
   * @example
   * ```typescript
   * // Only organization owner can perform this action
   * middlewares.isOrganizationOwner('org-123')
   *
   * // Dynamic from context
   * middlewares.isOrganizationOwner((ctx) => ctx.params.organizationId)
   * ```
   */
  isOrganizationOwner(
    organizationId: ValueOrResolver<string>
  ): MiddlewareCheck {
    return new IsOrganizationOwnerCheck(
      this.orgPluginFactory,
      organizationId
    );
  }
}
