import * as z from 'zod';
import type { PermissionBuilder, RolesAsRoleObjects } from './builder';

/**
 * Generate Zod schemas from permission builder with strong literal type inference
 * Uses z.union + z.literal to preserve exact literal types at compile time
 * 
 * The key technique is to cast the final schemas to z.ZodType<LiteralUnionType>
 * which tells TypeScript's type inference to use the exact literal types
 * instead of widening to generic string.
 */

/**
 * Helper function to safely access array element with runtime check
 * Throws if element is undefined (indicates a bug in the calling code)
 */
function assertDefined<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Unexpected undefined value: ${context}`);
  }
  return value;
}

/**
 * Create strongly-typed Zod schemas from a PermissionBuilder instance
 * Preserves exact literal types (e.g., 'admin' | 'sarah' instead of string)
 */
export function createSchemas<
  TStatement extends Record<string, readonly string[]>,
  TRoles extends Record<string, Record<string, readonly string[]>>
>(builder: PermissionBuilder<TStatement, TRoles>) {
  const statement = builder.getStatement();
  const roles = builder.getRoles();
  
  // Helper to extract statements from a Role object
  // Role objects have { authorize, statements } structure
  type RoleType = RolesAsRoleObjects<TRoles>[keyof TRoles];
  const getStatements = (role: RoleType): Record<string, readonly string[]> => {
    // Better Auth Role objects have a 'statements' property
    if ('statements' in role && typeof role.statements === 'object') {
      return role.statements as Record<string, readonly string[]>;
    }
    // Fallback for raw permission records
    return role as unknown as Record<string, readonly string[]>;
  };
  
  // Extract literal types
  type RoleNames = Extract<keyof TRoles, string>;
  type ResourceNames = Extract<keyof TStatement, string>;
  type AllActions = TStatement[keyof TStatement][number];

  // Build role names schema with proper literal type preservation
  // Filter out roles with no non-empty permissions
  const roleKeys = Object.keys(roles).filter(roleName => {
    const role = roles[roleName as keyof TRoles];
    const rolePerms = getStatements(role);
    return Object.values(rolePerms).some((actions: readonly string[] | Set<string>) => {
      const actionsArr = Array.isArray(actions) ? actions : Array.from(actions as Iterable<string>);
      return actionsArr.length > 0;
    });
  }) as RoleNames[];
  const roleNamesSchema = (() => {
    if (roleKeys.length === 0) return z.never();
    const first = roleKeys[0];
    if (first === undefined) return z.never();
    if (roleKeys.length === 1) return z.literal(first);
    const second = roleKeys[1];
    if (second === undefined) return z.literal(first);
    return z.union([
      z.literal(first),
      z.literal(second),
      ...roleKeys.slice(2).map(k => z.literal(k))
    ] as [z.ZodLiteral<RoleNames>, z.ZodLiteral<RoleNames>, ...z.ZodLiteral<RoleNames>[]]);
  })();

  // Build resource names schema with proper literal type preservation
  // Filter out resources with empty action arrays
  const resourceNamesArray = Object.keys(statement).filter(key => {
    const actions = statement[key as keyof TStatement];
    if (actions === undefined) return false;
    return actions.length > 0;
  }) as ResourceNames[];
  const resourceNamesSchema = 
    resourceNamesArray.length === 0 ? z.never() :
    resourceNamesArray.length === 1 ? z.literal(assertDefined(resourceNamesArray[0], 'resourceNamesArray[0]')) :
    z.union([
      z.literal(assertDefined(resourceNamesArray[0], 'resourceNamesArray[0]')),
      z.literal(assertDefined(resourceNamesArray[1], 'resourceNamesArray[1]')),
      ...resourceNamesArray.slice(2).map(r => z.literal(r))
    ] as [z.ZodLiteral<ResourceNames>, z.ZodLiteral<ResourceNames>, ...z.ZodLiteral<ResourceNames>[]]);

  // Build all actions schema with proper literal type preservation
  const allActionsSet = new Set<AllActions>();
  for (const actions of Object.values(statement)) {
    for (const action of actions) {
      allActionsSet.add(action as AllActions);
    }
  }
  const allActionsArray = Array.from(allActionsSet);
  const allActionsSchema = 
    allActionsArray.length === 0 ? z.never() :
    allActionsArray.length === 1 ? z.literal(allActionsArray[0]) :
    z.union([
      z.literal(allActionsArray[0]),
      z.literal(allActionsArray[1]),
      ...allActionsArray.slice(2).map(a => z.literal(a))
    ] as [z.ZodLiteral<AllActions>, z.ZodLiteral<AllActions>, ...z.ZodLiteral<AllActions>[]]);

  // Build action schemas per resource with proper literal type preservation
  const actionsByResource = {} as Record<keyof TStatement, z.ZodType<TStatement[keyof TStatement][number]>>;
  for (const [resource, actions] of Object.entries(statement) as [keyof TStatement, readonly string[]][]) {
    // Skip resources with no actions
    if (actions.length === 0) continue;
    
    type ResourceAction = TStatement[typeof resource][number];
    const actionsArray = [...actions] as ResourceAction[];
    
    actionsByResource[resource] = (
      actionsArray.length === 0 ? z.never() :
      actionsArray.length === 1 ? z.literal(actionsArray[0]) :
      z.union([
        z.literal(actionsArray[0]),
        z.literal(actionsArray[1]),
        ...actionsArray.slice(2).map(a => z.literal(a))
      ] as [z.ZodLiteral<ResourceAction>, z.ZodLiteral<ResourceAction>, ...z.ZodLiteral<ResourceAction>[]])
    ) as z.ZodType<ResourceAction>;
  }

  // Build permission schema with properly typed shape
  const permissionShape = {} as {
    [K in keyof TStatement]: z.ZodOptional<z.ZodArray<z.ZodType<TStatement[K][number]>>>
  };
  for (const [resource, actionSchema] of Object.entries(actionsByResource) as [keyof TStatement, z.ZodType<TStatement[keyof TStatement][number]>][]) {
    permissionShape[resource] = z.array(actionSchema).optional();
  }
  const permissionSchema = z.object(permissionShape) as z.ZodObject<{
    [K in keyof TStatement]: z.ZodOptional<z.ZodArray<z.ZodType<TStatement[K][number]>>>
  }>;

  // Build role permission schemas
  const rolePermissionSchemas = {} as Record<keyof TRoles, z.ZodObject<Record<string, z.ZodOptional<z.ZodArray<z.ZodType<string>>>>>>;
  for (const [roleName, role] of Object.entries(roles) as [keyof TRoles, RoleType][]) {
    const rolePerms = getStatements(role);
    // Check if role has any non-empty permissions
    const hasPermissions = Object.values(rolePerms).some((actions: readonly string[] | Set<string>) => {
      const actionsArray = Array.isArray(actions) ? actions : Array.from(actions as Iterable<string>);
      return actionsArray.length > 0;
    });
    if (!hasPermissions) continue;
    
    const shape = {} as Record<string, z.ZodOptional<z.ZodArray<z.ZodType<string>>>>;
    for (const [resource, actions] of Object.entries(rolePerms)) {
      // Ensure actions is an array before checking length
      const actionsArray = Array.isArray(actions as string[]) ? [...actions] : Array.from(actions as Iterable<string>);
      if (actionsArray.length === 0) continue;
      const actionSchema = (
        actionsArray.length === 1 ? z.literal(actionsArray[0]) :
        z.union([
          z.literal(actionsArray[0]),
          z.literal(actionsArray[1]),
          ...actionsArray.slice(2).map(a => z.literal(a))
        ] as [z.ZodLiteral<string>, z.ZodLiteral<string>, ...z.ZodLiteral<string>[]])
      ) as z.ZodType<string>;
      shape[resource] = z.array(actionSchema).optional();
    }
    rolePermissionSchemas[roleName] = z.object(shape);
  }

  const resourceActionSchema = z.object({
    resource: resourceNamesSchema,
    action: allActionsSchema,
  });

  return {
    roleNames: roleNamesSchema,
    resourceNames: resourceNamesSchema,
    allActions: allActionsSchema,
    actionsByResource,
    permission: permissionSchema,
    rolePermissions: rolePermissionSchemas,
    resourceAction: resourceActionSchema,
    
    // Actions object with utility functions for schema retrieval and filtering
    actions: {
      /**
       * Get schema for actions of a specific resource
       */
      forResource<R extends keyof TStatement>(resource: R): z.ZodType<TStatement[R][number]> {
        return assertDefined(actionsByResource[resource], `schema for resource ${String(resource)}`);
      },
      
      /**
       * Get schema for multiple resources' actions (union)
       */
      forResources<R extends keyof TStatement>(...resources: R[]): z.ZodType<TStatement[R][number]> {
        const schemas = resources.map(r => 
          assertDefined(actionsByResource[r], `schema for resource ${String(r)}`)
        );
        if (schemas.length === 0) return z.never();
        const first = assertDefined(schemas[0], 'schemas[0]');
        if (schemas.length === 1) return first;
        return z.union(schemas as [typeof first, typeof first, ...(typeof first)[]]);
      },
      
      /**
       * Get actions that a specific role has for a resource
       */
      forRoleOnResource<R extends keyof TRoles, Res extends keyof TStatement>(
        role: R, 
        resource: Res
      ): z.ZodType<
        Res extends keyof TRoles[R] 
          ? TRoles[R][Res] extends readonly (infer A)[] ? A : never
          : never
      > {
        const rolePerms = roles[role];
        const resourceKey = resource as string;
        
        // Handle both flat structure and nested structure with 'statements' wrapper
        const rolePermsRecord = ('statements' in rolePerms && typeof rolePerms.statements === 'object')
          ? rolePerms.statements as unknown as Record<string, readonly string[]>
          : rolePerms as unknown as Record<string, readonly string[]>;

        const actions = rolePermsRecord[resourceKey];
        type ReturnType = z.ZodType<
          Res extends keyof TRoles[R] 
            ? TRoles[R][Res] extends readonly (infer A)[] ? A : never
            : never
        >;
        if (!actions || actions.length === 0) return z.never() as unknown as ReturnType;
        const firstAction = actions[0];
        if (firstAction === undefined) return z.never() as unknown as ReturnType;
        if (actions.length === 1) return z.literal(firstAction) as unknown as ReturnType;
        return z.union([
          z.literal(firstAction),
          ...actions.slice(1).map((a: string) => z.literal(a))
        ]) as unknown as ReturnType;
      },
      
      /**
       * Get all actions available for a specific role across all resources
       */
      forRole<R extends keyof TRoles>(role: R): z.ZodType<TRoles[R][keyof TRoles[R]][number]> {
        const rolePerms = roles[role];
        
        // Handle both flat structure and nested structure with 'statements' wrapper
        const rolePermsRecord = ('statements' in rolePerms && typeof rolePerms.statements === 'object')
          ? rolePerms.statements as unknown as Record<string, readonly string[]>
          : rolePerms as unknown as Record<string, readonly string[]>;
        
        const allRoleActions = new Set<string>();
        for (const actions of Object.values(rolePermsRecord)) {
          // Skip if actions is empty or not iterable
          if ((Array.isArray(actions as string[]) && actions.length === 0)) continue;
          const actionsArray = Array.isArray(actions as string[]) ? actions : Array.from(actions as Iterable<string>);
          for (const action of actionsArray) {
            allRoleActions.add(action);
          }
        }
        
        const actionsArray = Array.from(allRoleActions);
        if (actionsArray.length === 0) return z.never();
        const first = actionsArray[0];
        if (first === undefined) return z.never();
        if (actionsArray.length === 1) return z.literal(first);
        return z.union([
          z.literal(first),
          ...actionsArray.slice(1).map(a => z.literal(a))
        ]);
      },
      
      /**
       * Filter actions by predicate with type narrowing support
       */
      filter<Filtered extends AllActions>(
        predicate: (action: AllActions, resource: ResourceNames) => action is Filtered
      ): z.ZodType<Filtered> {
        const filteredActions = new Set<AllActions>();
        for (const [resource, actions] of Object.entries(statement)) {
          for (const action of actions) {
            if (predicate(action as AllActions, resource as ResourceNames)) {
              filteredActions.add(action as AllActions);
            }
          }
        }
        
        const actionsArray = Array.from(filteredActions);
        if (actionsArray.length === 0) return z.never() as unknown as z.ZodType<Filtered>;
        if (actionsArray.length === 1) return z.literal(actionsArray[0]) as unknown as z.ZodType<Filtered>;
        return z.union([
          z.literal(actionsArray[0]),
          ...actionsArray.slice(1).map(a => z.literal(a))
        ]) as unknown as z.ZodType<Filtered>;
      },
      
      /**
       * Get actions that exist across multiple resources (intersection)
       */
      commonTo<R extends keyof TStatement>(...resources: R[]): z.ZodType<TStatement[R][number]> {
        if (resources.length === 0) return z.never();
        
        const actionSets = resources.map(r => 
          new Set(statement[r])
        );
        
        const firstSet = actionSets[0];
        if (!firstSet) return z.never();
        
        const commonActions = Array.from(firstSet).filter(action =>
          actionSets.every(set => set.has(action))
        );
        
        if (commonActions.length === 0) return z.never();
        const first = commonActions[0];
        if (first === undefined) return z.never();
        if (commonActions.length === 1) return z.literal(first);
        return z.union([
          z.literal(first),
          ...commonActions.slice(1).map(a => z.literal(a))
        ]);
      },
      
      /**
       * Get actions excluding specific ones
       */
      excluding<A extends AllActions>(...excludedActions: A[]): z.ZodType<Exclude<AllActions, A>> {
        const excluded = new Set(excludedActions);
        const filteredActions = allActionsArray.filter(a => !excluded.has(a as A));
        
        if (filteredActions.length === 0) return z.never() as unknown as z.ZodType<Exclude<AllActions, A>>;
        if (filteredActions.length === 1) return z.literal(filteredActions[0]) as unknown as z.ZodType<Exclude<AllActions, A>>;
        return z.union([
          z.literal(filteredActions[0]),
          ...filteredActions.slice(1).map(a => z.literal(a))
        ]) as unknown as z.ZodType<Exclude<AllActions, A>>;
      },
      
      /**
       * Get only specific actions
       */
      only<A extends AllActions>(...actions: A[]): z.ZodType<A> {
        if (actions.length === 0) return z.never();
        const first = actions[0];
        if (first === undefined) return z.never();
        if (actions.length === 1) return z.literal(first);
        return z.union([
          z.literal(first),
          ...actions.slice(1).map(a => z.literal(a))
        ]);
      },
      
      /**
       * Create a custom permission schema with specific resources and their actions
       */
      customPermission<T extends Partial<{
        [K in keyof TStatement]: readonly (TStatement[K][number])[]
      }>>(resourceActions: T): z.ZodObject<{
        [K in keyof T]: T[K] extends readonly (infer A)[] 
          ? z.ZodOptional<z.ZodArray<z.ZodType<A>>>
          : never
      }> {
        const shape = {} as Record<string, z.ZodOptional<z.ZodArray<z.ZodType>>>;
        
        for (const [resource, actions] of Object.entries(resourceActions)) {
          const actionsArray = actions as readonly string[] | undefined;
          if (!actionsArray || actionsArray.length === 0) continue;
          
          const arr = [...actionsArray];
          const actionSchema = (
            arr.length === 1 ? z.literal(arr[0]) :
            z.union([
              z.literal(arr[0]),
              ...arr.slice(1).map((a: string) => z.literal(a))
            ])
          ) as z.ZodType;
          shape[resource] = z.array(actionSchema).optional();
        }
        
        return z.object(shape) as z.ZodObject<{
          [K in keyof T]: T[K] extends readonly (infer A)[] 
            ? z.ZodOptional<z.ZodArray<z.ZodType<A>>>
            : never
        }>;
      },
    },
  } as const;
}

/**
 * Type helper to infer the schemas type from a builder
 */
export type InferSchemas<
  TBuilder extends PermissionBuilder<Record<string, readonly string[]>, Record<string, Record<string, readonly string[]>>>
> = ReturnType<typeof createSchemas<
  TBuilder extends PermissionBuilder<infer TStatement extends Record<string, readonly string[]>, Record<string, Record<string, readonly string[]>>> ? TStatement : never,
  TBuilder extends PermissionBuilder<Record<string, readonly string[]>, infer TRoles extends Record<string, Record<string, readonly string[]>>> ? TRoles : never
>>;

/**
 * Type helper to infer role names from schemas
 */
export type InferRoleNames<T extends ReturnType<typeof createSchemas<Record<string, readonly string[]>, Record<string, Record<string, readonly string[]>>>>> = 
  z.infer<T['roleNames']>;

/**
 * Type helper to infer resource names from schemas
 */
export type InferResourceNames<T extends ReturnType<typeof createSchemas<Record<string, readonly string[]>, Record<string, Record<string, readonly string[]>>>>> = 
  z.infer<T['resourceNames']>;

/**
 * Type helper to infer all actions from schemas
 */
export type InferAllActions<T extends ReturnType<typeof createSchemas<Record<string, readonly string[]>, Record<string, Record<string, readonly string[]>>>>> = 
  z.infer<T['allActions']>;

/**
 * Type helper to infer permission type from schemas
 */
export type InferPermission<T extends ReturnType<typeof createSchemas<Record<string, readonly string[]>, Record<string, Record<string, readonly string[]>>>>> = 
  z.infer<T['permission']>;
