/**
 * Assertion Definition System
 * 
 * Provides a flexible pattern where plugin methods return "assertion definitions"
 * that can be converted to decorators or middlewares by converter functions.
 * 
 * Key concepts:
 * - AssertionDefinition: What every plugin method returns
 * - createAssertion: Helper to create assertion definitions
 * - CompositeAssertion: Combines multiple assertions with logical operators
 * 
 * Framework-specific converters (toDecorator, toMiddleware) should be implemented
 * in the consuming application, not in this shared package.
 * 
 * Assertion types map to Better Auth APIs:
 * - Admin: 'admin:hasAccess' | 'admin:hasPermission' | 'admin:checkRolePermission'
 * - Org: 'org:hasAccess' | 'org:hasPermission'
 * - Composite: 'composite:and' | 'composite:or' | 'composite:not'
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Base assertion definition interface.
 * 
 * Every plugin method that defines an access requirement returns this.
 * The evaluate() function is a closure that captures the plugin instance
 * and performs the actual check when called.
 * 
 * @template TPayload - Type of the payload data (role, permission, etc.)
 */
export interface AssertionDefinition<TPayload = unknown> {
  /** Unique type identifier for the assertion */
  readonly type: string;
  
  /** Type-safe payload data */
  readonly payload: TPayload;
  
  /** 
   * Evaluate the assertion.
   * This is a closure that captures the plugin instance.
   * @returns Promise resolving to true if assertion passes
   */
  evaluate(): Promise<boolean>;
}

/**
 * Serializable assertion metadata (for decorators).
 * Since decorators can't store closures, we store the definition
 * without the evaluate function.
 */
export interface AssertionMetadata<TPayload = unknown> {
  /** Unique type identifier */
  readonly type: string;
  
  /** Payload data */
  readonly payload: TPayload;
  
  /** Plugin name that created this assertion */
  readonly pluginName: string;
  
  /** Method name on the plugin to call for evaluation */
  readonly evaluatorMethod: string;
  
  /** Arguments to pass to the evaluator method */
  readonly evaluatorArgs: unknown[];
}

/**
 * Composite assertion type for combining multiple assertions
 */
export type CompositeOperator = 'and' | 'or' | 'not';

/**
 * Payload for composite assertions
 */
export interface CompositePayload {
  operator: CompositeOperator;
  assertions: AssertionDefinition[];
}

// ============================================================================
// Assertion Creators
// ============================================================================

/**
 * Create a simple assertion definition.
 * 
 * @param type - Unique type identifier
 * @param payload - Type-safe payload data
 * @param evaluate - Evaluation function (closure over plugin)
 * @returns AssertionDefinition
 * 
 * @example
 * ```typescript
 * class AdminPlugin {
 *   requireAdmin() {
 *     return createAssertion('role', { role: 'admin' }, () => this.hasAdminRole());
 *   }
 * }
 * ```
 */
export function createAssertion<TPayload>(
  type: string,
  payload: TPayload,
  evaluate: () => Promise<boolean>
): AssertionDefinition<TPayload> {
  return {
    type,
    payload,
    evaluate,
  };
}

/**
 * Create a serializable assertion metadata for decorators.
 * 
 * @param type - Unique type identifier
 * @param payload - Payload data
 * @param pluginName - Name of the plugin that created this
 * @param evaluatorMethod - Method name on plugin to call
 * @param evaluatorArgs - Arguments to pass to evaluator method
 * @returns AssertionMetadata
 */
export function createAssertionMetadata<TPayload>(
  type: string,
  payload: TPayload,
  pluginName: string,
  evaluatorMethod: string,
  evaluatorArgs: unknown[] = []
): AssertionMetadata<TPayload> {
  return {
    type,
    payload,
    pluginName,
    evaluatorMethod,
    evaluatorArgs,
  };
}

// ============================================================================
// Composite Assertion Helpers
// ============================================================================

/**
 * Combine multiple assertions with AND logic.
 * All assertions must pass for the composite to pass.
 * 
 * @param assertions - Assertions to combine
 * @returns Composite AssertionDefinition
 * 
 * @example
 * ```typescript
 * const assertion = assertAll(
 *   plugin.requireAuth(),
 *   plugin.requirePermission({ user: ['read'] })
 * );
 * ```
 */
export function assertAll(
  ...assertions: AssertionDefinition[]
): AssertionDefinition<CompositePayload> {
  return createAssertion(
    'composite:and',
    { operator: 'and', assertions },
    async () => {
      for (const assertion of assertions) {
        if (!(await assertion.evaluate())) {
          return false;
        }
      }
      return true;
    }
  );
}

/**
 * Combine multiple assertions with OR logic.
 * At least one assertion must pass for the composite to pass.
 * 
 * @param assertions - Assertions to combine
 * @returns Composite AssertionDefinition
 * 
 * @example
 * ```typescript
 * const assertion = assertAny(
 *   plugin.requireRole('admin'),
 *   plugin.requireRole('superAdmin')
 * );
 * ```
 */
export function assertAny(
  ...assertions: AssertionDefinition[]
): AssertionDefinition<CompositePayload> {
  return createAssertion(
    'composite:or',
    { operator: 'or', assertions },
    async () => {
      for (const assertion of assertions) {
        if (await assertion.evaluate()) {
          return true;
        }
      }
      return false;
    }
  );
}

/**
 * Negate an assertion.
 * The composite passes if the inner assertion fails.
 * 
 * @param assertion - Assertion to negate
 * @returns Negated AssertionDefinition
 * 
 * @example
 * ```typescript
 * const assertion = assertNot(plugin.requireRole('guest'));
 * ```
 */
export function assertNot(
  assertion: AssertionDefinition
): AssertionDefinition<CompositePayload> {
  return createAssertion(
    'composite:not',
    { operator: 'not', assertions: [assertion] },
    async () => !(await assertion.evaluate())
  );
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Extract payload type from an assertion definition
 */
export type InferPayload<T> = T extends AssertionDefinition<infer P> ? P : never;

/**
 * Check if an assertion is a composite type
 */
export function isCompositeAssertion(
  assertion: AssertionDefinition
): assertion is AssertionDefinition<CompositePayload> {
  return assertion.type.startsWith('composite:');
}

/**
 * Check if a value is an AssertionDefinition
 */
export function isAssertionDefinition(value: unknown): value is AssertionDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    'evaluate' in value &&
    typeof (value as { evaluate: unknown }).evaluate === 'function'
  );
}

/**
 * Check if a value is AssertionMetadata (serializable form)
 */
export function isAssertionMetadata(value: unknown): value is AssertionMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    'pluginName' in value &&
    'evaluatorMethod' in value
  );
}

