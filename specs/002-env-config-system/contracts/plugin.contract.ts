/**
 * Plugin Contracts
 * 
 * Defines interfaces for validator and transformer plugins.
 * All plugins must implement these interfaces for type safety and compatibility.
 */

import type { ZodSchema } from 'zod';
import type { ValidationResult, ValidationError } from './validation.contract';
import type { Result } from './result.contract';

/**
 * Base plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin name */
  readonly name: string;
  
  /** Semantic version */
  readonly version: string;
  
  /** Human-readable description */
  readonly description?: string;
  
  /** Plugin author */
  readonly author?: string;
}

/**
 * Validator plugin interface
 * 
 * Validators check values against type-specific rules (e.g., string length, number range).
 * All validators must return ValidationResult (never throw).
 */
export interface IValidator {
  /** Plugin metadata */
  readonly meta: PluginMetadata;
  
  /** Validator type name (e.g., 'string', 'number', 'url') */
  readonly type: string;
  
  /**
   * Validate value against type-specific rules
   * 
   * @param value - Value to validate
   * @param params - Validation parameters from pipe syntax
   * @returns Validation result (success or errors)
   * 
   * @example
   * ```ts
   * const result = validator.validate("hello", { minLength: 3 });
   * if (!result.success) {
   *   console.error(result.errors);
   * }
   * ```
   */
  validate(value: unknown, params: Record<string, unknown>): ValidationResult;
  
  /**
   * Get parameter schema for this validator
   * Used to validate pipe syntax params at parse time
   * 
   * @returns Zod schema for params object
   */
  getSchema(): ZodSchema;
}

/**
 * Transformer plugin interface
 * 
 * Transformers modify values (e.g., truncate, concat, reference resolution).
 * All transformers must return Result<unknown, ValidationError>.
 */
export interface ITransformer {
  /** Plugin metadata */
  readonly meta: PluginMetadata;
  
  /** Transformer name (e.g., 'truncate', 'concat', 'reference') */
  readonly name: string;
  
  /**
   * Transform value using transformation rules
   * 
   * @param value - Value to transform
   * @param params - Transformation parameters
   * @param context - Variable context (for reference resolution)
   * @returns Transformed value or error
   * 
   * @example
   * ```ts
   * const result = transformer.transform("hello world", { maxLength: 5 }, ctx);
   * if (result.success) {
   *   console.log(result.value); // "hello"
   * }
   * ```
   */
  transform(
    value: unknown,
    params: Record<string, unknown>,
    context: VariableContext
  ): Result<unknown, ValidationError>;
  
  /**
   * Get parameter schema for this transformer
   * Used to validate pipe syntax params at parse time
   * 
   * @returns Zod schema for params object
   */
  getSchema(): ZodSchema;
}

/**
 * Variable context for transformers
 * Provides access to other resolved variables for reference resolution
 */
export interface VariableContext {
  /** All resolved variables (name → value) */
  readonly variables: ReadonlyMap<string, string>;
  
  /** Current variable being processed (for circular reference detection) */
  readonly currentVariable: string;
}

/**
 * Plugin error
 * Thrown/returned when plugin fails to load or register
 */
export interface PluginError {
  /** Error code (e.g., PLUGIN_LOAD_FAILED) */
  readonly code: string;
  
  /** Error message */
  readonly message: string;
  
  /** Plugin name that failed */
  readonly pluginName?: string;
  
  /** Plugin file path */
  readonly pluginPath?: string;
  
  /** Underlying error */
  readonly cause?: Error;
}
