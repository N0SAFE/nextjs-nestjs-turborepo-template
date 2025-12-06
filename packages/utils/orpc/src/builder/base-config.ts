/**
 * Base configuration class providing common functionality for builders
 * Similar to the auth permission builder's BaseConfig
 */
export abstract class BaseConfig<TResult> {
  constructor(protected result: TResult) {}

  /**
   * Build and return the final result
   */
  build(): TResult {
    return this.result;
  }

  /**
   * Get the current result without building
   */
  getResult(): TResult {
    return this.result;
  }
}
