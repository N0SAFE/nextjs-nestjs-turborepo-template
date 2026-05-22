/**
 * Result Type Contract
 * 
 * Railway-Oriented Programming pattern for error handling.
 * Enables error collection without exceptions.
 */

/**
 * Result type representing success or failure
 * Based on Railway-Oriented Programming pattern
 * 
 * @template T - Success value type
 * @template E - Error type
 */
export type Result<T, E> = 
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

/**
 * Result operations
 * Provides monadic operations for Result type
 */
export class ResultOps {
  /**
   * Create a successful result
   */
  static ok<T, E = never>(value: T): Result<T, E> {
    return { success: true, value };
  }
  
  /**
   * Create a failed result
   */
  static fail<T = never, E = unknown>(error: E): Result<T, E> {
    return { success: false, error };
  }
  
  /**
   * Map success value (functor)
   */
  static map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U
  ): Result<U, E> {
    if (!result.success) {
      return result as Result<U, E>;
    }
    return ResultOps.ok(fn(result.value));
  }
  
  /**
   * Bind (flatMap) for chaining operations (monad)
   */
  static bind<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
  ): Result<U, E> {
    if (!result.success) {
      return result as Result<U, E>;
    }
    return fn(result.value);
  }
  
  /**
   * Combine multiple results (applicative)
   * Collects ALL errors if any fail
   */
  static combine<T extends readonly unknown[], E>(
    results: { [K in keyof T]: Result<T[K], E> }
  ): Result<T, E[]> {
    const errors: E[] = [];
    const values: unknown[] = [];
    
    for (const result of results) {
      if (result.success) {
        values.push(result.value);
      } else {
        errors.push(result.error);
      }
    }
    
    if (errors.length > 0) {
      return ResultOps.fail(errors);
    }
    return ResultOps.ok(values as unknown as T);
  }
  
  /**
   * Traverse array with error collection
   */
  static async traverse<T, U, E>(
    items: T[],
    fn: (item: T) => Promise<Result<U, E>>
  ): Promise<Result<U[], E[]>> {
    const results = await Promise.all(items.map(fn));
    return ResultOps.combine(results);
  }
}
