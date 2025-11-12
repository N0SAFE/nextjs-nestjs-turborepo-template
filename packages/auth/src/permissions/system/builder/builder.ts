import type { Statements } from "better-auth/plugins/access";
import { createAccessControl } from "better-auth/plugins/access";
import type { AccessControlRoles } from "../types";
import { BaseConfig } from "./shared/base-config";
import { StatementsConfig } from "./statements/statements-config";
import { RolesConfig } from "./roles/roles-config";

/**
 * Permission Builder API
 * 
 * Provides a fluent, type-safe API for building permission statements and roles
 * with full autocomplete support.
 * 
 * @example
 * ```typescript
 * import { PermissionBuilder } from './builder';
 * 
 * const builder = new PermissionBuilder()
 *   .resource('project')
 *     .actions(['create', 'read', 'update', 'delete', 'share'])
 *   .resource('organization')
 *     .actions(['create', 'read', 'update', 'delete', 'manage-members'])
 *   .resource('billing')
 *     .actions(['read', 'update', 'manage-subscriptions'])
 *   .build();
 * 
 * const { statement, ac, roles } = builder;
 * ```
 */

/**
 * Resource builder for adding actions to a resource
 */
export class ResourceBuilder<
  TStatement extends Record<string, readonly string[]>,
  TResource extends string,
  TRoles extends Record<string, Record<string, readonly string[]>> = Record<string, never>
> {
  constructor(
    private builder: PermissionBuilder<TStatement, TRoles>,
    private resourceName: TResource
  ) {}

  /**
   * Define actions for the current resource
   * @param actions - Array of action names
   * @returns The parent PermissionBuilder for method chaining
   */
  actions<TActions extends readonly string[]>(
    actions: TActions
  ): PermissionBuilder<
    TStatement & Record<TResource, TActions>,
    TRoles
  > {
    this.builder._statement[this.resourceName] = actions;
    return this.builder as unknown as PermissionBuilder<
      TStatement & Record<TResource, TActions>,
      TRoles
    >;
  }
}

/**
 * Role builder for defining role permissions
 */
export class RoleBuilder<
  TStatement extends Record<string, readonly string[]>,
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TRoleName extends string = string
> {
  constructor(
    private builder: PermissionBuilder<TStatement, TRoles>,
    private roleName: TRoleName,
    private ac: ReturnType<typeof createAccessControl<TStatement>>
  ) {}

  /**
   * Define permissions for the current role
   * @param permissions - Partial permission object with resources and their actions
   * @returns The parent PermissionBuilder for method chaining
   */
  permissions<
    TPermissions extends {
      [K in keyof TStatement]?: readonly (TStatement[K][number])[];
    }
  >(
    permissions: TPermissions
  ): PermissionBuilder<TStatement, TRoles & Record<typeof this.roleName, TPermissions>> {
    // @ts-expect-error - Type manipulation for builder pattern
    this.builder._roles[this.roleName] = this.ac.newRole(permissions);
    return this.builder as unknown as PermissionBuilder<
      TStatement,
      TRoles & Record<typeof this.roleName, TPermissions>
    >;
  }

  /**
   * Give this role all permissions from the statement
   * @returns The parent PermissionBuilder for method chaining
   */
  allPermissions(): PermissionBuilder<TStatement, TRoles & Record<typeof this.roleName, TStatement>> {
    // @ts-expect-error - Type manipulation for builder pattern
    this.builder._roles[this.roleName] = this.ac.newRole(this.builder._statement);
    return this.builder as unknown as PermissionBuilder<
      TStatement,
      TRoles & Record<typeof this.roleName, TStatement>
    >;
  }
}

/**
 * Main Permission Builder class
 * 
 * Provides a fluent API for building permission statements and roles
 * with full type safety and autocomplete support.
 */
export class PermissionBuilder<
  TStatement extends Record<string, readonly string[]> = Record<string, readonly string[]>,
  TRoles extends Record<string, Record<string, readonly string[]>> = Record<string, never>
> extends BaseConfig<{
  statementsConfig: StatementsConfig<TStatement>;
  rolesConfig: RolesConfig<TRoles>;
  statement: TStatement & Statements;
  ac: ReturnType<typeof createAccessControl<TStatement>>;
  roles: TRoles & AccessControlRoles;
}> {
  /** @internal */
  _statement: Record<string, readonly string[]> = {};
  
  /** @internal */
  _roles: Record<string, unknown> = {};
  
  private _ac?: ReturnType<typeof createAccessControl<TStatement>>;
  private _statementsConfig?: StatementsConfig<TStatement>;
  private _rolesConfig?: RolesConfig<TRoles>;

  constructor() {
    super({} as never); // Will be properly initialized in build()
  }

  /**
   * Start building with default Better Auth admin statements
   * @param defaultStatements - The default Better Auth statements to include
   */
  static withDefaults<TDefaults extends Record<string, readonly string[]>>(
    defaultStatements: TDefaults
  ): PermissionBuilder<TDefaults> {
    const builder = new PermissionBuilder<TDefaults>();
    builder._statement = { ...defaultStatements };
    return builder;
  }

  /**
   * Add a new resource to the permission statement
   * @param name - The resource name
   * @returns A ResourceBuilder for defining actions
   */
  resource<TResource extends string>(
    name: TResource
  ): ResourceBuilder<TStatement, TResource, TRoles> {
    return new ResourceBuilder(this, name);
  }

  /**
   * Add multiple resources at once
   * @param resources - Object mapping resource names to their actions
   * @returns The PermissionBuilder for method chaining
   */
  resources<
    TResources extends Record<string, readonly string[]>
  >(
    resources: TResources
  ): PermissionBuilder<TStatement & TResources, TRoles> {
    Object.assign(this._statement, resources);
    return this as unknown as PermissionBuilder<TStatement & TResources, TRoles>;
  }

  /**
   * Start defining a role
   * @param name - The role name
   * @returns A RoleBuilder for defining role permissions
   */
  role<TRole extends string>(
    name: TRole
  ): RoleBuilder<TStatement, TRoles, TRole> {
    this._ac ??= createAccessControl(this._statement as TStatement);
    return new RoleBuilder<TStatement, TRoles, TRole>(this, name, this._ac);
  }

  /**
   * Add multiple roles at once
   * @param roles - Function that receives the ac instance and returns roles
   * @returns The PermissionBuilder for method chaining
   */
  roles<TNewRoles extends Record<string, unknown>>(
    rolesFactory: (ac: ReturnType<typeof createAccessControl<TStatement>>) => TNewRoles
  ): PermissionBuilder<TStatement, TRoles & TNewRoles> {
    this._ac ??= createAccessControl(this._statement as TStatement);
    const newRoles = rolesFactory(this._ac);
    Object.assign(this._roles, newRoles);
    return this as unknown as PermissionBuilder<TStatement, TRoles & TNewRoles>;
  }

  /**
   * Build and return the final statement, access control instance, and roles
   * @returns Object containing statementsConfig, rolesConfig, statement, ac, and roles
   */
  build() {
    this._ac = createAccessControl(this._statement as TStatement);
    this._statementsConfig = new StatementsConfig(this._statement as TStatement);
    this._rolesConfig = new RolesConfig(this._roles as TRoles);

    return {
      statementsConfig: this._statementsConfig,
      rolesConfig: this._rolesConfig,
      statement: this._statement as TStatement & Statements,
       
      ac: this._ac,
      roles: this._roles as TRoles & AccessControlRoles,
    };
  }

  /**
   * Get the statements config (creates if needed)
   */
  getStatementsConfig(): StatementsConfig<TStatement> {
    return this._statementsConfig ??= new StatementsConfig(this._statement as TStatement);
  }

  /**
   * Get the roles config (creates if needed)
   */
  getRolesConfig(): RolesConfig<TRoles> {
    return this._rolesConfig ??= new RolesConfig(this._roles as TRoles);
  }

  /**
   * Get the statement (without building)
   */
  getStatement(): TStatement {
    return this._statement as TStatement;
  }

  /**
   * Get the access control instance (creates if needed)
   */
  getAc(): ReturnType<typeof createAccessControl<TStatement>> {
    return this._ac ??= createAccessControl(this._statement as TStatement);
  }

  /**
   * Get the roles (without building)
   */
  getRoles(): TRoles {
    return this._roles as TRoles;
  }

  /**
   * Create a permission object from the statement
   * This is useful for creating common permission patterns
   * 
   * @example
   * // Direct permissions object
   * permissionConfig.createPermission({ project: ["read", "write"] })
   * 
   * // Factory function with access to config context
   * permissionConfig.createPermission(({ statementsConfig, ac }) => ({
   *   project: statementsConfig.get('project').pick(['read', 'write']).build(),
   *   user: statementsConfig.get('user').readOnly()
   * }))
   */
  createPermission<T extends Record<string, readonly string[]>>(
    permissions: 
      | T 
      | ((
          config: { 
            statementsConfig: StatementsConfig<TStatement>;
            rolesConfig: RolesConfig<TRoles>;
            ac: ReturnType<typeof createAccessControl<TStatement>>;
          },
          builder: this
        ) => T)
  ): T {
    if (typeof permissions === 'function') {
      const ac = this.getAc();
      const statementsConfig = this.getStatementsConfig();
      const rolesConfig = this.getRolesConfig();
      
      return permissions(
        { 
          statementsConfig,
          rolesConfig,
          ac,
        },
        this
      );
    }
    return permissions;
  }
  
  /**
   * Get the statement property directly
   */
  get statement(): TStatement {
    return this._statement as TStatement;
  }
}

/**
 * Helper function to create a new PermissionBuilder
 */
export function createPermissionBuilder() {
  return new PermissionBuilder();
}

/**
 * Helper function to create a PermissionBuilder with Better Auth defaults
 */
export function createPermissionBuilderWithDefaults<
  TDefaults extends Record<string, readonly string[]>
>(defaultStatements: TDefaults) {
  return PermissionBuilder.withDefaults(defaultStatements);
}
