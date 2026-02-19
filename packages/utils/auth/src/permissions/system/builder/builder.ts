import type { Role } from "better-auth/plugins/access";
import { createAccessControl } from "better-auth/plugins/access";
import type { ZodType, infer as ZodInfer } from "zod/v4";
import { BaseConfig } from "./shared/base-config";
import { StatementsConfig } from "./statements/statements-config";
import { RolesConfig } from "./roles/roles-config";
import { createSchemas } from "./schemas";

/**
 * Helper type to check if a type is exactly Record<string, never> (empty record)
 * Record<string, never> has keyof as `string` and value type as `never`
 */
type IsEmptyRecord<T> = string extends keyof T 
  ? T[string] extends never 
    ? true 
    : false 
  : false;

/**
 * Merge two record types, removing empty Record<string, never> from the result.
 * This ensures clean type signatures without polluting generic intersections.
 * 
 * - If T is exactly Record<string, never> (empty), return just U
 * - Otherwise return T & U
 */
type MergeRecords<T, U> = IsEmptyRecord<T> extends true ? U : T & U;

/**
 * Required permissions type - converts optional properties to required
 * This ensures the resulting type satisfies Record<string, readonly string[]>
 */
type RequiredPermissions<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

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
  TRoles extends Record<string, Record<string, readonly string[]>> = Record<string, never>,
  TMetaShape extends ZodType | undefined = undefined
> {
  constructor(
    private builder: PermissionBuilder<TStatement, TRoles, TMetaShape>,
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
    MergeRecords<TStatement, Record<TResource, TActions>>,
    TRoles,
    TMetaShape
  > {
    this.builder._statement[this.resourceName] = actions;
    return this.builder as unknown as PermissionBuilder<
      MergeRecords<TStatement, Record<TResource, TActions>>,
      TRoles,
      TMetaShape
    >;
  }
}

/**
 * Intermediate builder returned after allPermissions()/permissions() when a metaShape is defined.
 * Forces the caller to call .meta() before getting back to PermissionBuilder.
 */
export class RoleBuilderWithMeta<
  TStatement extends Record<string, readonly string[]>,
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TRoleName extends string,
  TNextRoles extends Record<string, Record<string, readonly string[]>>,
  TMetaShape extends ZodType
> {
  constructor(
    private builder: PermissionBuilder<TStatement, TRoles, TMetaShape>,
    private roleName: TRoleName
  ) {}

  /** Attach metadata to this role. Required when a metaShape is defined. */
  meta(data: ZodInfer<TMetaShape>): PermissionBuilder<TStatement, TNextRoles, TMetaShape> {
    this.builder._roleMeta[this.roleName] = data;
    return this.builder as unknown as PermissionBuilder<TStatement, TNextRoles, TMetaShape>;
  }
}

/**
 * Role builder for defining role permissions
 */
export class RoleBuilder<
  TStatement extends Record<string, readonly string[]>,
  TRoles extends Record<string, Record<string, readonly string[]>>,
  TRoleName extends string = string,
  TMetaShape extends ZodType | undefined = undefined
> {
  constructor(
    private builder: PermissionBuilder<TStatement, TRoles, TMetaShape>,
    private roleName: TRoleName,
    private ac: ReturnType<typeof createAccessControl<TStatement>>
  ) {}

  /**
   * Define permissions for the current role
   */
  permissions<
    const TPermissions extends {
      [K in keyof TStatement]?: readonly (TStatement[K][number])[];
    }
  >(
    permissions: TPermissions
  ): TMetaShape extends ZodType
    ? RoleBuilderWithMeta<TStatement, TRoles, TRoleName, MergeRecords<TRoles, Record<TRoleName, RequiredPermissions<TPermissions>>>, TMetaShape>
    : PermissionBuilder<TStatement, MergeRecords<TRoles, Record<TRoleName, RequiredPermissions<TPermissions>>>, TMetaShape> {
    // @ts-expect-error - Type manipulation for builder pattern
    this.builder._roles[this.roleName] = this.ac.newRole(permissions);
    if (this.builder._metaShape !== undefined) {
      return new RoleBuilderWithMeta(this.builder as unknown as PermissionBuilder<TStatement, TRoles, ZodType>, this.roleName) as never;
    }
    return this.builder as never;
  }

  /**
   * Give this role all permissions from the statement
   */
  allPermissions(): TMetaShape extends ZodType
    ? RoleBuilderWithMeta<TStatement, TRoles, TRoleName, MergeRecords<TRoles, Record<TRoleName, TStatement>>, TMetaShape>
    : PermissionBuilder<TStatement, MergeRecords<TRoles, Record<TRoleName, TStatement>>, TMetaShape> {
    this.builder._roles[this.roleName] = this.ac.newRole(this.builder._statement as never);
    if (this.builder._metaShape !== undefined) {
      return new RoleBuilderWithMeta(this.builder as unknown as PermissionBuilder<TStatement, TRoles, ZodType>, this.roleName) as never;
    }
    return this.builder as never;
  }
}

/**
 * A mini builder returned inside the roles() factory when metaShape is defined.
 * Calling .meta() finalises the entry and allows TypeScript to enforce it.
 */
export class InlineRoleEntry<
  TMetaShape extends ZodType
> {
  /** @internal */
  __permissions: Record<string, readonly string[]>;
  /** @internal */
  __meta?: ZodInfer<TMetaShape>;

  constructor(permissions: Record<string, readonly string[]>) {
    this.__permissions = permissions;
  }

  meta(data: ZodInfer<TMetaShape>): this & { __meta: ZodInfer<TMetaShape> } {
    this.__meta = data;
    return this as this & { __meta: ZodInfer<TMetaShape> };
  }
}

/**
 * Type returned by the `permissions` helper inside `roles()` factory.
 * When metaShape is set the helper returns an InlineRoleEntry that forces .meta();
 * otherwise it returns a plain permissions record.
 */
type PermissionsHelper<
  TStatement extends Record<string, readonly string[]>,
  TMetaShape extends ZodType | undefined
> = <
  const TPermissions extends {
    [K in keyof TStatement]?: readonly (TStatement[K][number])[];
  }
>(permissions: TPermissions) => TMetaShape extends ZodType
  ? InlineRoleEntry<TMetaShape>
  : TPermissions;

/**
 * Extract the raw permissions record from a roles factory entry
 * (handles both plain objects and InlineRoleEntry instances)
 */
type ExtractPermissions<T> = T extends InlineRoleEntry<ZodType>
  ? T["__permissions"]
  : T;

/**
 * Map a roles factory result to its raw permissions, preserving role names
 */
type ExtractRolePermissions<TNewRoles extends Record<string, unknown>> = {
  [K in keyof TNewRoles]: ExtractPermissions<TNewRoles[K]>
};

/**
 * Main Permission Builder class
 *
 * Provides a fluent API for building permission statements and roles
 * with full type safety and autocomplete support.
 *
 * Pass `{ metaShape: z.object({...}) }` to the constructor to require `.meta()` on every role.
 */
export class PermissionBuilder<
  TStatement extends Record<string, readonly string[]> = Record<string, never>,
  TRoles extends Record<string, Record<string, readonly string[]>> = Record<string, never>,
  TMetaShape extends ZodType | undefined = undefined
> extends BaseConfig<{
  statementsConfig: StatementsConfig<TStatement>;
  rolesConfig: RolesConfig<TRoles>;
   
  statement: TStatement;
  ac: ReturnType<typeof createAccessControl<TStatement>>;
  roles: RolesAsRoleObjects<TRoles>;
}> {
  /** @internal */
  _statement: Record<string, readonly string[]> = {};
  
  /** @internal */
  _roles: Record<string, unknown> = {};

  /** @internal */
  _roleMeta: Record<string, unknown> = {};

  /** @internal */
  _metaShape: TMetaShape;
  
  private _ac?: ReturnType<typeof createAccessControl<TStatement>>;
  private _statementsConfig?: StatementsConfig<TStatement>;
  private _rolesConfig?: RolesConfig<TRoles>;

  constructor(options?: { metaShape?: TMetaShape }) {
    super({} as never); // Will be properly initialized in build()
    this._metaShape = (options?.metaShape ?? undefined) as TMetaShape;
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
    const builder = new PermissionBuilder<TStatement, TRoles, undefined>();
    
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
  ): ResourceBuilder<TStatement, TResource, TRoles, TMetaShape> {
    return new ResourceBuilder(this, name) as unknown as ResourceBuilder<TStatement, TResource, TRoles, TMetaShape>;
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
  ): PermissionBuilder<MergeRecords<TStatement, TResources>, TRoles, TMetaShape> {
    // Create helpers object with identity actions function
    const helpers = {
      actions: <const TActions extends readonly string[]>(
        actions: TActions
      ): TActions => actions
    };
    
    // Get resource definitions from factory
    const resourceDefinitions = resourcesFactory(helpers);
    
    // Directly assign to _statement (bypass ResourceBuilder to avoid generic issues)
    for (const [resourceName, actions] of Object.entries(resourceDefinitions)) {
      this._statement[resourceName] = actions;
    }
    
    return this as unknown as PermissionBuilder<MergeRecords<TStatement, TResources>, TRoles, TMetaShape>;
  }

  /**
   * Start defining a role
   * @param name - The role name
   * @returns A RoleBuilder for defining role permissions
   */
  role<const TRole extends string>(
    name: TRole
  ): RoleBuilder<TStatement, TRoles, TRole, TMetaShape> {
    this._ac ??= createAccessControl(this._statement as TStatement);
    return new RoleBuilder<TStatement, TRoles, TRole, TMetaShape>(this as unknown as PermissionBuilder<TStatement, TRoles, TMetaShape>, name, this._ac);
  }

  /**
   * Add multiple roles at once with a simple permissions helper
   * @param rolesFactory - Function that receives helpers (statement and permissions placeholder) and returns role definitions
   * @returns The PermissionBuilder for method chaining
   */
  roles<
    const TNewRoles extends Record<string, TMetaShape extends ZodType ? InlineRoleEntry<TMetaShape> : Record<string, readonly string[]>>
  >(
    rolesFactory: (helpers: {
      statement: TStatement;
      permissions: PermissionsHelper<TStatement, TMetaShape>;
    }) => TNewRoles
  ): PermissionBuilder<TStatement, MergeRecords<TRoles, ExtractRolePermissions<TNewRoles>>, TMetaShape> {
    // Create the permissions helper
    const permissionsHelper = <
      const TPermissions extends {
        [K in keyof TStatement]?: readonly (TStatement[K][number])[];
      }
    >(permissions: TPermissions) => {
      if (this._metaShape !== undefined) {
        return new InlineRoleEntry<ZodType>(permissions as Record<string, readonly string[]>);
      }
      return permissions;
    };

    const helpers = {
      statement: this._statement as TStatement,
      permissions: permissionsHelper as unknown as PermissionsHelper<TStatement, TMetaShape>,
    };
    
    // Get role definitions from factory
    const roleDefinitions = rolesFactory(helpers);
    
    // Initialize access control if not already created
    this._ac ??= createAccessControl(this._statement as TStatement);
    
    // Process each role — extract permissions and optional meta
    for (const [roleName, entry] of Object.entries(roleDefinitions)) {
      if (entry instanceof InlineRoleEntry) {
        this._roles[roleName] = this._ac.newRole(entry.__permissions as never);
        if (entry.__meta !== undefined) {
          this._roleMeta[roleName] = entry.__meta;
        }
      } else {
        this._roles[roleName] = this._ac.newRole(entry as never);
      }
    }
    
    return this as unknown as PermissionBuilder<TStatement, MergeRecords<TRoles, ExtractRolePermissions<TNewRoles>>, TMetaShape>;
  }

  /**
   * Build and return the final statement, access control instance, roles, and schemas
   * @returns Object containing statementsConfig, rolesConfig, statement, ac, roles, and schemas
   */
  build() {
    this._ac = createAccessControl(this._statement as TStatement);
    this._statementsConfig = new StatementsConfig(this._statement as TStatement);
    this._rolesConfig = new RolesConfig(this._roles as TRoles);
    const schemas = createSchemas(this as unknown as PermissionBuilder<TStatement, TRoles>);

    const result: {
      statementsConfig: StatementsConfig<TStatement>;
      rolesConfig: RolesConfig<TRoles>;
      statement: TStatement;
      ac: ReturnType<typeof createAccessControl<TStatement>>;
      roles: RolesAsRoleObjects<TRoles>;
      schemas: ReturnType<typeof createSchemas<TStatement, TRoles>>;
      roleMeta: TMetaShape extends ZodType ? Record<keyof TRoles, ZodInfer<TMetaShape>> : undefined;
    } = {
      statementsConfig: this._statementsConfig,
      rolesConfig: this._rolesConfig,
      statement: this._statement as TStatement,
      ac: this._ac,
      roles: this._roles as RolesAsRoleObjects<TRoles>,
      schemas,
      roleMeta: (this._metaShape !== undefined ? this._roleMeta : undefined) as TMetaShape extends ZodType ? Record<keyof TRoles, ZodInfer<TMetaShape>> : undefined,
    };

    return result;
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
   * Get the meta data for all roles (only available when metaShape is defined)
   */
  getRoleMeta(): TMetaShape extends ZodType ? Record<keyof TRoles, ZodInfer<TMetaShape>> : undefined {
    return (this._metaShape !== undefined ? this._roleMeta : undefined) as TMetaShape extends ZodType ? Record<keyof TRoles, ZodInfer<TMetaShape>> : undefined;
  }

  /**
   * Get all role names (keys) from the builder
   * Useful for deriving role lists from the builder configuration
   */
  getRoleNames(): (keyof TRoles)[] {
    return Object.keys(this._roles) as (keyof TRoles)[];
  }

  /**
   * Get all statement names (resource keys) from the builder
   * Useful for deriving resource lists from the builder configuration
   */
  getStatementNames(): (keyof TStatement)[] {
    return Object.keys(this._statement) as (keyof TStatement)[];
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
