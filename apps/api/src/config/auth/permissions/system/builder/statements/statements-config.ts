import { BaseConfig } from '../shared/base-config';
import { StatementConfig } from './single-statement-config';
import { StatementConfigCollection } from './statement-config-collection';

/**
 * StatementsConfig - Manages all statements (resources with their actions)
 * Provides utility methods to manipulate and query the entire statement structure
 */
export class StatementsConfig<TStatement extends Record<string, readonly string[]>> extends BaseConfig<TStatement> {
  constructor(statements: TStatement) {
    super(statements);
  }

  /**
   * Get a single statement config for a specific resource
   * Returns a StatementConfig instance with utility methods
   */
  get<K extends keyof TStatement>(key: K): StatementConfig<TStatement[K]> {
    return new StatementConfig(this._value[key]);
  }

  /**
   * Get a collection of all statements
   * Returns a StatementConfigCollection with batch operations
   */
  getAll(): StatementConfigCollection<TStatement> {
    return new StatementConfigCollection(this._value);
  }

  /**
   * Build and return the final statements object
   */
  build(): TStatement {
    return this._value;
  }

  /**
   * Get the raw statements object
   */
  get raw(): TStatement {
    return this._value;
  }

  /**
   * Add a new resource or merge with existing
   */
  add<TResource extends string, TActions extends readonly string[]>(
    resource: TResource,
    actions: TActions
  ): StatementsConfig<TStatement & Record<TResource, TActions>> {
    return new StatementsConfig({
      ...this._value,
      [resource]: actions,
    } as TStatement & Record<TResource, TActions>);
  }

  /**
   * Add multiple resources at once
   */
  addMany<TResources extends Record<string, readonly string[]>>(
    resources: TResources
  ): StatementsConfig<TStatement & TResources> {
    return new StatementsConfig({
      ...this._value,
      ...resources,
    } as TStatement & TResources);
  }

  /**
   * Get multiple resources as a collection
   * Returns a StatementConfigCollection with batch operations on the selected resources
   */
  getMany<K extends keyof TStatement>(
    resources: readonly K[]
  ): StatementConfigCollection<Pick<TStatement, K>> {
    const subset = {} as Pick<TStatement, K>;
    for (const resource of resources) {
      if (resource in this._value) {
        subset[resource] = this._value[resource];
      }
    }
    return new StatementConfigCollection(subset);
  }

  /**
   * Check if a resource exists
   */
  has(resource: string): boolean {
    return resource in this._value;
  }

  /**
   * Check if a resource has a specific action
   */
  hasAction(resource: string, action: string): boolean {
    const actions = this._value[resource];
    return actions ? actions.includes(action as never) : false;
  }

  /**
   * Remove one or more resources
   */
  omit<K extends keyof TStatement>(
    ...resources: K[]
  ): StatementsConfig<Omit<TStatement, K>> {
    const newStatement = { ...this._value };
    for (const resource of resources) {
      delete newStatement[resource];
    }
    return new StatementsConfig(newStatement as Omit<TStatement, K>);
  }

  /**
   * Keep only specified resources
   */
  pick<K extends keyof TStatement>(
    ...resources: K[]
  ): StatementsConfig<Pick<TStatement, K>> {
    const result: any = {};
    for (const resource of resources) {
      if (resource in this._value) {
        result[resource] = this._value[resource];
      }
    }
    return new StatementsConfig(result);
  }

  /**
   * Filter statements based on a predicate
   */
  filter(
    predicate: (
      resource: keyof TStatement,
      actions: TStatement[keyof TStatement]
    ) => boolean
  ): Record<string, readonly string[]> {
    const result: Record<string, readonly string[]> = {};
    for (const [resource, actions] of Object.entries(this._value)) {
      if (predicate(resource, actions as any)) {
        result[resource] = actions as readonly string[];
      }
    }
    return result;
  }

  /**
   * Map statements to new structure
   */
  map<U>(
    mapper: (
      resource: keyof TStatement,
      actions: TStatement[keyof TStatement]
    ) => U
  ): U[] {
    return Object.entries(this._value).map(([resource, actions]) =>
      mapper(resource, actions as any)
    );
  }

  /**
   * Merge with another statements config
   */
  merge<T extends Record<string, readonly string[]>>(
    other: StatementsConfig<T>
  ): StatementsConfig<TStatement & T> {
    return new StatementsConfig({
      ...this._value,
      ...other._value,
    } as TStatement & T);
  }

  /**
   * Update a resource's actions
   */
  update<K extends keyof TStatement, TActions extends readonly string[]>(
    resource: K,
    actions: TActions
  ): StatementsConfig<TStatement & Record<K, TActions>> {
    return new StatementsConfig({
      ...this._value,
      [resource]: actions,
    } as TStatement & Record<K, TActions>);
  }

  /**
   * Add actions to an existing resource
   */
  addActions<K extends keyof TStatement, TActions extends readonly string[]>(
    resource: K,
    ...actions: TActions
  ): StatementsConfig<TStatement & Record<K, readonly [...TStatement[K], ...TActions]>> {
    const existing = this._value[resource] || ([] as const);
    return new StatementsConfig({
      ...this._value,
      [resource]: [...existing, ...actions] as any,
    } as any);
  }

  /**
   * Remove actions from an existing resource
   */
  removeActions<K extends keyof TStatement>(
    resource: K,
    ...actions: readonly string[]
  ): StatementsConfig<TStatement> {
    const existing = this._value[resource];
    if (!existing) return this;
    
    const filtered = existing.filter(a => !actions.includes(a as string));
    return new StatementsConfig({
      ...this._value,
      [resource]: filtered,
    } as TStatement);
  }

  /**
   * Get all resource names (keys)
   */
  keys(): (keyof TStatement)[] {
    return Object.keys(this._value) as (keyof TStatement)[];
  }

  /**
   * Get all action arrays (values)
   */
  values(): (readonly string[])[] {
    return Object.values(this._value) as (readonly string[])[];
  }

  /**
   * Get entries as [resource, actions] pairs
   */
  entries(): [keyof TStatement, TStatement[keyof TStatement]][] {
    return Object.entries(this._value) as any;
  }

  /**
   * Check if statements object is empty
   */
  get isEmpty(): boolean {
    return Object.keys(this._value).length === 0;
  }

  /**
   * Get number of resources
   */
  get size(): number {
    return Object.keys(this._value).length;
  }

  /**
   * Verify statement structure is valid
   */
  verify(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const [resource, actions] of Object.entries(this._value)) {
      if (typeof resource !== 'string') {
        errors.push(`Invalid resource name: ${resource}`);
      }
      if (!Array.isArray(actions)) {
        errors.push(`Actions for ${resource} must be an array`);
      }
      if (actions.length === 0) {
        errors.push(`Resource ${resource} has no actions`);
      }
      for (const action of actions) {
        if (typeof action !== 'string') {
          errors.push(`Invalid action type for ${resource}: ${action}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clone this config
   */
  clone(): StatementsConfig<TStatement> {
    return new StatementsConfig({ ...this._value });
  }
}
