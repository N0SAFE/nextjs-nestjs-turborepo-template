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
   * Returns the filtered actions array directly
   */
  pick<T extends readonly (TActions[number])[]>(actions: T): readonly (TActions[number])[] {
    return this._actions.filter(a => actions.includes(a as any)) as any;
  }

  /**
   * Omit specific actions from the statement
   * Returns the filtered actions array directly
   */
  omit<T extends readonly (TActions[number])[]>(actions: T): readonly (Exclude<TActions[number], T[number]>)[] {
    return this._actions.filter(a => !actions.includes(a as any)) as any;
  }

  /**
   * Check if statement has a specific action
   */
  has(action: string): boolean {
    return this._actions.includes(action as any);
  }

  /**
   * Check if statement has all specified actions
   */
  hasAll(actions: readonly string[]): boolean {
    return actions.every(a => this._actions.includes(a as any));
  }

  /**
   * Check if statement has any of the specified actions
   */
  hasAny(actions: readonly string[]): boolean {
    return actions.some(a => this._actions.includes(a as any));
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
    return this._actions.includes(action as any);
  }

  /**
   * Find index of action
   */
  indexOf(action: string): number {
    return this._actions.indexOf(action as any);
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
    return new StatementConfig([...this._actions, ...actions] as any);
  }

  /**
   * Concat with another statement config
   */
  concat<T extends readonly string[]>(other: StatementConfig<T>): StatementConfig<readonly [...TActions, ...T]> {
    return new StatementConfig([...this._actions, ...other._actions] as any);
  }

  /**
   * Remove duplicates
   */
  unique(): StatementConfig<TActions> {
    return new StatementConfig([...new Set(this._actions)] as any);
  }

  /**
   * Slice actions
   */
  slice(start?: number, end?: number): StatementConfig<readonly (TActions[number])[]> {
    return new StatementConfig(this._actions.slice(start, end) as any);
  }

  /**
   * Reverse actions order
   */
  reverse(): StatementConfig<readonly (TActions[number])[]> {
    return new StatementConfig([...this._actions].reverse() as any);
  }

  /**
   * Sort actions
   */
  sort(compareFn?: (a: TActions[number], b: TActions[number]) => number): StatementConfig<readonly (TActions[number])[]> {
    return new StatementConfig([...this._actions].sort(compareFn) as any);
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
