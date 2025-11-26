import type { Role, Statements } from "better-auth/plugins/access";
import { createAccessControl } from "better-auth/plugins/access";
import { BaseConfig } from "./shared/base-config";
import { StatementsConfig } from "./statements/statements-config";
import { RolesConfig } from "./roles/roles-config";
import { createSchemas } from "./schemas";

/**
 * Extract all statement types from TDefaultRoles and merge them
 * For each role in TDefaultRoles, get its statements and combine them
 */
type ExtractStatementUnion<TDefaultRoles extends Record<string, { statements: Record<string, readonly string[]> }>> = 
  TDefaultRoles[keyof TDefaultRoles]['statements'];

/**
 * Get all resource names from the statement union
 */
type AllResourceNames<TStatementUnion extends Record<string, readonly string[]>> = keyof TStatementUnion;

/**
 * For a given resource name, extract the actions from the statement that has it
 */
type ActionsForResource<
  TStatementUnion extends Record<string, readonly string[]>,
  Resource extends string
> = TStatementUnion extends Record<Resource, infer Actions>
  ? Actions extends readonly string[]
    ? Actions
    : never
  : never;

/**
 * Type helper to merge all statements from default roles into a single object type
 * Creates { resource1: actions1, resource2: actions2, ... } from all role statements
 */
type MergeDefaultStatements<TDefaultRoles extends Record<string, { statements: Record<string, readonly string[]> }>> = {
  [Resource in AllResourceNames<ExtractStatementUnion<TDefaultRoles>> & string]: 
    ActionsForResource<ExtractStatementUnion<TDefaultRoles>, Resource>
};

/**
 * Mapped type that converts a roles permissions record into Role objects
 * Each role permission (Record<string, readonly string[]>) becomes a Role<TPermissions>
 */
export type RolesAsRoleObjects<TRoles extends Record<string, Record<string, readonly string[]>>> = {
  [K in keyof TRoles]: Role<TRoles[K]>;
};

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
  actions<const TActions extends readonly string[]>(
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
    const TPermissions extends {
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
  TStatement extends Record<string, readonly string[]>,
  TRoles extends Record<string, Record<string, readonly string[]>>
> extends BaseConfig<{
  statementsConfig: StatementsConfig<TStatement>;
  rolesConfig: RolesConfig<TRoles>;
  statement: TStatement & Statements;
  ac: ReturnType<typeof createAccessControl<TStatement>>;
  roles: RolesAsRoleObjects<TRoles>;
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
   * Start building with default Better Auth admin roles
   * @param defaultRoles - The default Better Auth roles to include (each role has a statements property)
   */
  static withDefaults<
    TDefaultRoles extends Record<string, { statements: Record<string, readonly string[]> }>,
    // Merge all statements from all roles into a single intersection type
    TStatement extends Record<string, readonly string[]> = MergeDefaultStatements<TDefaultRoles>,
    TRoles extends Record<string, Record<string, readonly string[]>> = {
      [K in keyof TDefaultRoles]: TDefaultRoles[K]['statements']
    }
  >(
    defaultRoles: TDefaultRoles
  ): PermissionBuilder<TStatement, TRoles> {
    const builder = new PermissionBuilder<TStatement, TRoles>();
    
    // Extract and merge all statements from all roles
    const allStatements: Record<string, readonly string[]> = {};
    for (const [, role] of Object.entries(defaultRoles)) {
      Object.assign(allStatements, role.statements);
    }
    builder._statement = allStatements;
    
    // Extract roles structure - map role names to their statements
    // This is what _roles expects: { roleName: { resource: [actions] } }
    const rolesStructure: Record<string, Record<string, readonly string[]>> = {};
    for (const [roleName, role] of Object.entries(defaultRoles)) {
      rolesStructure[roleName] = role.statements;
    }
    Object.assign(builder._roles, rolesStructure);
    
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
   * Add multiple resources at once with a simple actions helper
   * @param resourcesFactory - Function that receives helpers (actions placeholder) and returns resource definitions
   * @returns The PermissionBuilder for method chaining
   */
  resources<
    const TResources extends Record<string, readonly string[]>
  >(
    resourcesFactory: (helpers: {
      actions: <const TActions extends readonly string[]>(
        actions: TActions
      ) => TActions;
    }) => TResources
  ): PermissionBuilder<TStatement & TResources, TRoles> {
    // Create helpers object with identity actions function
    const helpers = {
      actions: <const TActions extends readonly string[]>(
        actions: TActions
      ): TActions => actions
    };
    
    // Get resource definitions from factory
    const resourceDefinitions = resourcesFactory(helpers);
    
    // Use ResourceBuilder for each resource
    for (const [resourceName, actions] of Object.entries(resourceDefinitions)) {
      new ResourceBuilder(this, resourceName).actions(actions);
    }
    
    return this as unknown as PermissionBuilder<TStatement & TResources, TRoles>;
  }

  /**
   * Start defining a role
   * @param name - The role name
   * @returns A RoleBuilder for defining role permissions
   */
  role<const TRole extends string>(
    name: TRole
  ): RoleBuilder<TStatement, TRoles, TRole> {
    this._ac ??= createAccessControl(this._statement as TStatement);
    return new RoleBuilder<TStatement, TRoles, TRole>(this, name, this._ac);
  }

  /**
   * Add multiple roles at once with a simple permissions helper
   * @param rolesFactory - Function that receives helpers (statement and permissions placeholder) and returns role definitions
   * @returns The PermissionBuilder for method chaining
   */
  roles<
    const TNewRoles extends Record<string, Record<string, readonly string[]>>
  >(
    rolesFactory: (helpers: {
      statement: TStatement;
      permissions: <
        const TPermissions extends {
          [K in keyof TStatement]?: readonly (TStatement[K][number])[];
        }
      >(permissions: TPermissions) => TPermissions;
    }) => TNewRoles
  ): PermissionBuilder<TStatement, TRoles & TNewRoles> {
    // Create helpers object with statement and identity permissions function
    const helpers = {
      statement: this._statement as TStatement,
      permissions: <
        const TPermissions extends {
          [K in keyof TStatement]?: readonly (TStatement[K][number])[];
        }
      >(permissions: TPermissions): TPermissions => permissions
    };
    
    // Get role definitions from factory
    const roleDefinitions = rolesFactory(helpers);
    
    // Initialize access control if not already created
    this._ac ??= createAccessControl(this._statement as TStatement);
    
    // Create RoleBuilder for each role and call permissions
    for (const [roleName, perms] of Object.entries(roleDefinitions)) {
      new RoleBuilder(this, roleName, this._ac).permissions(perms);
    }
    
    return this as unknown as PermissionBuilder<TStatement, TRoles & TNewRoles>;
  }

  /**
   * Build and return the final statement, access control instance, roles, and schemas
   * @returns Object containing statementsConfig, rolesConfig, statement, ac, roles, and schemas
   */
  build() {
    this._ac = createAccessControl(this._statement as TStatement);
    this._statementsConfig = new StatementsConfig(this._statement as TStatement);
    this._rolesConfig = new RolesConfig(this._roles as TRoles);
    const schemas = createSchemas(this);

    return {
      statementsConfig: this._statementsConfig,
      rolesConfig: this._rolesConfig,
      statement: this._statement as TStatement,
       
      ac: this._ac,
      roles: this._roles as RolesAsRoleObjects<TRoles>,
      schemas,
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
  getRoles(): RolesAsRoleObjects<TRoles> {
    return this._roles as RolesAsRoleObjects<TRoles>;
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
  TDefaultRoles extends Record<string, { statements: Record<string, readonly string[]> }>
>(defaultRoles: TDefaultRoles) {
  return PermissionBuilder.withDefaults(defaultRoles);
}
