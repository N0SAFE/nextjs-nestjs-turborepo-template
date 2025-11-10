/**
 * Abstract base class for configuration builders
 * Provides a build method that returns the final configuration
 */
export abstract class BaseConfig<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = value;
  }

  /**
   * Build and return the final configuration
   */
  build(): T {
    return this._value;
  }
}
