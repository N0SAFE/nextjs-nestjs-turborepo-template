import { StatementConfig } from './single-statement-config';

/**
 * Extract all possible actions from a statement type
 */
type AllActions<TStatement extends Record<string, readonly string[]>> = 
  TStatement[keyof TStatement][number];

/**
 * Helper type to check if an array contains any of the target values
 */
type HasAnyOf<TArray extends readonly string[], TTarget extends readonly string[]> = 
  Extract<TArray[number], TTarget[number]> extends never ? false : true;

/**
 * Helper type to check if an array contains all of the target values
 */
type HasAllOf<TArray extends readonly string[], TTarget extends readonly string[]> = 
  TTarget[number] extends TArray[number] ? true : false;

/**
 * Helper type to filter statement entries based on action availability
 * Only includes resources that have at least one of the specified actions
 * And filters the actions to only include the specified ones
 */
type FilteredStatement<
  TStatement extends Record<string, readonly string[]>,
  TActions extends readonly AllActions<TStatement>[]
> = {
  [K in keyof TStatement as HasAnyOf<TStatement[K], TActions> extends true
    ? K
    : never]: readonly (Extract<TStatement[K][number], TActions[number]>)[];
};

/**
 * Helper type for omitting actions from statements
 * Only includes resources that have remaining actions after omission
 */
type OmittedStatement<
  TStatement extends Record<string, readonly string[]>,
  TActions extends readonly AllActions<TStatement>[]
> = {
  [K in keyof TStatement as Exclude<TStatement[K][number], TActions[number]> extends never
    ? never
    : K]: readonly (Exclude<TStatement[K][number], TActions[number]>)[];
};

/**
 * Helper type to filter statements that contain a specific action
 */
type WithAction<
  TStatement extends Record<string, readonly string[]>,
  TAction extends AllActions<TStatement>
> = {
  [K in keyof TStatement as TAction extends TStatement[K][number] ? K : never]: TStatement[K];
};

/**
 * Helper type to filter statements that contain all specified actions
 */
type WithAllActions<
  TStatement extends Record<string, readonly string[]>,
  TActions extends readonly AllActions<TStatement>[]
> = {
  [K in keyof TStatement as HasAllOf<TStatement[K], TActions> extends true ? K : never]: TStatement[K];
};

/**
 * Helper type to filter statements that contain any of the specified actions
 */
type WithAnyAction<
  TStatement extends Record<string, readonly string[]>,
  TActions extends readonly AllActions<TStatement>[]
> = {
  [K in keyof TStatement as HasAnyOf<TStatement[K], TActions> extends true
    ? K
    : never]: TStatement[K];
};

/**
 * Helper type to filter statements that don't contain a specific action
 */
type WithoutAction<
  TStatement extends Record<string, readonly string[]>,
  TAction extends AllActions<TStatement>
> = {
  [K in keyof TStatement as TAction extends TStatement[K][number] ? never : K]: TStatement[K];
};

/**
 * StatementConfigCollection - Manages multiple statement configs
 * Provides utility methods to apply operations across all statements
 */
export class StatementConfigCollection<TStatement extends Record<string, readonly string[]>> {
  constructor(private readonly _statements: TStatement) {}

  /**
   * Get all actions for all resources
   * Returns the complete statement object
   */
  all(): TStatement {
    return this._statements;
  }

  /**
   * Build and return the final statement object
   * Alias for all() to maintain consistency with other config classes
   */
  build(): TStatement {
    return this._statements;
  }

  /**
   * Picks specific actions from all statements
   * Includes all resources, with empty arrays for non-matching actions
   * @param actions - Actions to pick
   * @returns Object with filtered resources and their picked actions
   */
  pick<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions,
  ): StatementConfigCollection<FilteredStatement<TStatement, TActions>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};

    for (const [key, config] of Object.entries(this._statements)) {
      const filteredActions = config.filter((action) => actions.includes(action));
      // Always include the resource, even if empty
      result[key as keyof TStatement] = filteredActions.length > 0 ? filteredActions as readonly string[] : [];
    }

    return new StatementConfigCollection(result as unknown as FilteredStatement<TStatement, TActions>);
  }

  /**
   * Omits specific actions from all statements
   * Includes all resources, with empty arrays if all actions are omitted
   * @param actions - Actions to omit
   * @returns Object with filtered resources and their remaining actions
   */
  omit<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions,
  ): StatementConfigCollection<OmittedStatement<TStatement, TActions>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};

    for (const [key, config] of Object.entries(this._statements)) {
      const remainingActions = config.filter((action) => !actions.includes(action));
      // Always include the resource, even if empty
      result[key as keyof TStatement] = remainingActions.length > 0 ? remainingActions as readonly string[] : [];
    }

    return new StatementConfigCollection(result as unknown as OmittedStatement<TStatement, TActions>);
  }

  /**
   * Get only read-only permissions (resources with only "read" action)
   * Excludes resources that don't have "read" or have other actions
   */
  readOnly(): StatementConfigCollection<FilteredStatement<TStatement, readonly ['read']>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      if (resourceActions.includes('read')) {
        result[resource as keyof TStatement] = ['read'] as const;
      }
    }
    
    return new StatementConfigCollection(result as unknown as FilteredStatement<TStatement, readonly ['read']>);
  }

  /**
   * Get only write permissions (create, update, delete)
   * Excludes resources that don't have any write actions
   */
  writeOnly(): StatementConfigCollection<FilteredStatement<TStatement, readonly ['create', 'update', 'delete']>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    const writeActions = ['create', 'update', 'delete'];
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      const filtered = resourceActions.filter(a => writeActions.includes(a));
      // Always include resource, even with empty array
      result[resource as keyof TStatement] = filtered;
    }
    
    return new StatementConfigCollection(result as unknown as FilteredStatement<TStatement, readonly ['create', 'update', 'delete']>);
  }

  /**
   * Get CRUD-only permissions (create, read, update, delete)
   * Excludes resources that don't have any CRUD actions
   */
  crudOnly(): StatementConfigCollection<FilteredStatement<TStatement, readonly ['create', 'read', 'update', 'delete']>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    const crudActions = ['create', 'read', 'update', 'delete'];
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      const filtered = resourceActions.filter(a => crudActions.includes(a));
      if (filtered.length > 0) {
        result[resource as keyof TStatement] = filtered;
      }
    }
    
    return new StatementConfigCollection(result as unknown as FilteredStatement<TStatement, readonly ['create', 'read', 'update', 'delete']>);
  }

  /**
   * Filter resources based on a predicate
   * Only includes resources where predicate returns true
   */
  filter(
    predicate: (resource: string, actions: readonly string[]) => boolean
  ): StatementConfigCollection<TStatement> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};

    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      if (predicate(resource, resourceActions)) {
        result[resource as keyof TStatement] = resourceActions;
      }
    }

    return new StatementConfigCollection(result as TStatement);
  }

  /**
   * Map resources to new values
   */
  map<U>(
    mapper: (resource: string, config: StatementConfig) => U
  ): U[] {
    return Object.entries(this._statements).map(([resource, actions]) =>
      mapper(resource, new StatementConfig(actions))
    );
  }

  /**
   * Get resources that have a specific action
   */
  withAction<TAction extends AllActions<TStatement>>(action: TAction): StatementConfigCollection<WithAction<TStatement, TAction>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      if (resourceActions.includes(action)) {
        result[resource as keyof TStatement] = resourceActions;
      }
    }
    
    return new StatementConfigCollection(result as unknown as WithAction<TStatement, TAction>);
  }

  /**
   * Get resources that have all specified actions
   */
  withAllActions<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions,
  ): StatementConfigCollection<WithAllActions<TStatement, TActions>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      if (actions.every(a => resourceActions.includes(a))) {
        result[resource as keyof TStatement] = resourceActions;
      }
    }
    
    return new StatementConfigCollection(result as unknown as WithAllActions<TStatement, TActions>);
  }

  /**
   * Get resources that have any of the specified actions
   */
  withAnyAction<TActions extends readonly AllActions<TStatement>[]>(
    actions: TActions,
  ): StatementConfigCollection<WithAnyAction<TStatement, TActions>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      if (actions.some(a => resourceActions.includes(a))) {
        result[resource as keyof TStatement] = resourceActions;
      }
    }
    
    return new StatementConfigCollection(result as unknown as WithAnyAction<TStatement, TActions>);
  }

  /**
   * Exclude resources that have a specific action
   */
  withoutAction<TAction extends AllActions<TStatement>>(action: TAction): StatementConfigCollection<WithoutAction<TStatement, TAction>> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      if (!resourceActions.includes(action)) {
        result[resource as keyof TStatement] = resourceActions;
      }
    }
    
    return new StatementConfigCollection(result as unknown as WithoutAction<TStatement, TAction>);
  }

  /**
   * Get only resources (keys)
   */
  resources(): (keyof TStatement)[] {
    return Object.keys(this._statements) as (keyof TStatement)[];
  }

  /**
   * Check if collection is empty
   */
  get isEmpty(): boolean {
    return Object.keys(this._statements).length === 0;
  }

  /**
   * Get number of resources
   */
  get size(): number {
    return Object.keys(this._statements).length;
  }

  /**
   * Convert to plain object
   */
  toObject(): TStatement {
    return { ...this._statements };
  }

  /**
   * Get a specific resource config
   */
  getResource<K extends keyof TStatement>(key: K): StatementConfig<TStatement[K]> | undefined {
    if (key in this._statements) {
      return new StatementConfig(this._statements[key]);
    }
    return undefined;
  }

  /**
   * Apply a transformer to each resource's actions
   */
  transform<U>(
    transformer: (resource: string, config: StatementConfig) => U
  ): Record<string, U> {
    const result: Record<string, U> = {};
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      result[resource] = transformer(resource, new StatementConfig(resourceActions));
    }
    
    return result;
  }

  /**
   * Merge with another statement object or collection
   */
  merge<T extends Record<string, readonly string[]>>(
    other: T | StatementConfigCollection<T>
  ): StatementConfigCollection<TStatement & T> {
    const otherObj = other instanceof StatementConfigCollection ? other.all() : other;
    return new StatementConfigCollection({
      ...this._statements,
      ...otherObj,
    });
  }

  /**
   * Return only resources with non-empty actions
   */
  compact(): StatementConfigCollection<TStatement> {
    const result: Partial<Record<keyof TStatement, readonly string[]>> = {};
    
    for (const [resource, resourceActions] of Object.entries(this._statements)) {
      if (resourceActions.length > 0) {
        result[resource as keyof TStatement] = resourceActions;
      }
    }
    
    return new StatementConfigCollection(result as TStatement);
  }
}
