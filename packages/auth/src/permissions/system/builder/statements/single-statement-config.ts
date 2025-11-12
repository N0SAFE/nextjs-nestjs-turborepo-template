/**
 * StatementConfig - Manages actions for a single statement/resource
 * Provides utility methods to manipulate and query actions
 */
export class StatementConfig<TActions extends readonly string[] = readonly string[]> {
  constructor(private readonly _actions: TActions) {}

  /**
   * Get all actions as readonly array
   */
  all(): TActions {
    return this._actions;
  }

  /**
   * Get empty actions array
   */
  none(): readonly [] {
    return [] as const;
  }

  /**
   * Pick specific actions from the statement
   * Returns a new StatementConfig instance with filtered actions
   */
  pick(actions: readonly (TActions[number])[]): StatementConfig<readonly (TActions[number])[]> {
    const filtered = this._actions.filter(a => actions.includes(a));
    return new StatementConfig(filtered);
  }

  /**
   * Omit specific actions from the statement
   * Returns a new StatementConfig instance with filtered actions
   */
  omit(actions: readonly (TActions[number])[]): StatementConfig<readonly (Exclude<TActions[number], typeof actions[number]>)[]> {
    const filtered = this._actions.filter((a): a is Exclude<TActions[number], typeof actions[number]> => !actions.includes(a));
    return new StatementConfig(filtered);
  }

  /**
   * Check if statement has a specific action
   */
  has(action: string): boolean {
    return this._actions.includes(action);
  }

  /**
   * Check if statement has all specified actions
   */
  hasAll(actions: readonly string[]): boolean {
    return actions.every(a => this._actions.includes(a));
  }

  /**
   * Check if statement has any of the specified actions
   */
  hasAny(actions: readonly string[]): boolean {
    return actions.some(a => this._actions.includes(a));
  }

  /**
   * Filter actions based on a predicate
   */
  filter(predicate: (action: TActions[number]) => boolean): readonly (TActions[number])[] {
    return this._actions.filter(predicate);
  }

  /**
   * Map actions to new values
   */
  map<U>(mapper: (action: TActions[number]) => U): readonly U[] {
    return this._actions.map(mapper);
  }

  /**
   * Get first action
   */
  first(): TActions[number] | undefined {
    return this._actions[0];
  }

  /**
   * Get last action
   */
  last(): TActions[number] | undefined {
    return this._actions[this._actions.length - 1];
  }

  /**
   * Get action at index
   */
  at(index: number): TActions[number] | undefined {
    return this._actions[index];
  }

  /**
   * Check if statement includes action
   */
  includes(action: string): boolean {
    return this._actions.includes(action);
  }

  /**
   * Find index of action
   */
  indexOf(action: string): number {
    return this._actions.indexOf(action);
  }

  /**
   * Get number of actions
   */
  get length(): number {
    return this._actions.length;
  }

  /**
   * Check if statement has no actions
   */
  get isEmpty(): boolean {
    return this._actions.length === 0;
  }

  /**
   * Convert to array
   */
  toArray(): TActions[number][] {
    return [...this._actions];
  }

  /**
   * Get actions as readonly array (same as all())
   */
  build(): TActions {
    return this._actions;
  }

  /**
   * Add actions (returns new instance)
   */
  add<T extends readonly string[]>(...actions: T): StatementConfig<readonly [...TActions, ...T]> {
    return new StatementConfig([...this._actions, ...actions]);
  }

  /**
   * Concat with another statement config
   */
  concat<T extends readonly string[]>(other: StatementConfig<T>): StatementConfig<readonly [...TActions, ...T]> {
    return new StatementConfig([...this._actions, ...other._actions]);
  }

  /**
   * Remove duplicates
   */
  unique(): StatementConfig<TActions> {
    return new StatementConfig<TActions>(Array.from(new Set(this._actions)) as unknown as TActions);
  }

  /**
   * Slice actions
   */
  slice(start?: number, end?: number): StatementConfig<readonly (TActions[number])[]> {
    return new StatementConfig(this._actions.slice(start, end));
  }

  /**
   * Reverse actions order
   */
  reverse(): StatementConfig<readonly (TActions[number])[]> {
    return new StatementConfig([...this._actions].reverse());
  }

  /**
   * Sort actions
   */
  sort(compareFn?: (a: TActions[number], b: TActions[number]) => number): StatementConfig<readonly (TActions[number])[]> {
    return new StatementConfig([...this._actions].sort(compareFn));
  }

  /**
   * Check if every action satisfies predicate
   */
  every(predicate: (action: TActions[number]) => boolean): boolean {
    return this._actions.every(predicate);
  }

  /**
   * Check if some action satisfies predicate
   */
  some(predicate: (action: TActions[number]) => boolean): boolean {
    return this._actions.some(predicate);
  }

  /**
   * Find first action matching predicate
   */
  find(predicate: (action: TActions[number]) => boolean): TActions[number] | undefined {
    return this._actions.find(predicate);
  }

  /**
   * Find index of first action matching predicate
   */
  findIndex(predicate: (action: TActions[number]) => boolean): number {
    return this._actions.findIndex(predicate);
  }

  /**
   * Join actions into string
   */
  join(separator?: string): string {
    return this._actions.join(separator);
  }

  /**
   * Create read-only permission (only 'read' action)
   */
  readOnly(): readonly ['read'] | readonly [] {
    return this.has('read') ? (['read'] as const) : ([] as const);
  }

  /**
   * Create write permissions (create, update, delete)
   */
  writeOnly(): readonly (TActions[number])[] {
    return this.filter(a => ['create', 'update', 'delete'].includes(a as string));
  }

  /**
   * Exclude read action
   */
  withoutRead(): readonly (TActions[number])[] {
    return this.filter(a => a !== 'read');
  }

  /**
   * Only CRUD actions (create, read, update, delete)
   */
  crudOnly(): readonly (TActions[number])[] {
    return this.filter(a => ['create', 'read', 'update', 'delete'].includes(a as string));
  }
}
