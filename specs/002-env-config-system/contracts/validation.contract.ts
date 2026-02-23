/**
 * Validation Contracts
 * 
 * Defines validation result structures and error types.
 */

/**
 * Validation result
 * Returned by validators to indicate success or structured errors
 */
export interface ValidationResult {
  /** Validation succeeded (no errors) */
  readonly success: boolean;
  
  /** Validated value (if success) */
  readonly value?: unknown;
  
  /** Validation errors (fatal) */
  readonly errors: readonly ValidationError[];
  
  /** Validation warnings (non-fatal) */
  readonly warnings?: readonly ValidationError[];
}

/**
 * Structured validation error
 * Provides rich context for debugging and user feedback
 */
export interface ValidationError {
  /** Hierarchical error code (e.g., YAML_PARSE_INVALID_SYNTAX, VAR_REQUIRED_MISSING) */
  readonly code: string;
  
  /** Human-readable message */
  readonly message: string;
  
  /** Error severity */
  readonly severity: 'error' | 'warning' | 'info';
  
  /** Source location (file, line, column) */
  readonly source?: SourceLocation;
  
  /** Expected value (for comparison errors) */
  readonly expected?: unknown;
  
  /** Actual value received */
  readonly actual?: unknown;
  
  /** Suggested fix */
  readonly suggestion?: string;
}

/**
 * Source location for error reporting
 */
export interface SourceLocation {
  /** Source file path */
  readonly file?: string;
  
  /** Line number (1-indexed) */
  readonly line?: number;
  
  /** Column number (1-indexed) */
  readonly column?: number;
  
  /** Variable name */
  readonly variable?: string;
}

/**
 * Error code categories
 */
export enum ErrorCode {
  // YAML parsing errors
  YAML_PARSE_INVALID_SYNTAX = 'YAML_PARSE_INVALID_SYNTAX',
  YAML_PARSE_FILE_NOT_FOUND = 'YAML_PARSE_FILE_NOT_FOUND',
  YAML_PARSE_TOO_LARGE = 'YAML_PARSE_TOO_LARGE',
  
  // Variable validation errors
  VAR_REQUIRED_MISSING = 'VAR_REQUIRED_MISSING',
  VAR_TYPE_MISMATCH = 'VAR_TYPE_MISMATCH',
  VAR_INVALID_VALUE = 'VAR_INVALID_VALUE',
  VAR_CIRCULAR_DEPENDENCY = 'VAR_CIRCULAR_DEPENDENCY',
  VAR_REFERENCE_NOT_FOUND = 'VAR_REFERENCE_NOT_FOUND',
  VAR_STRING_TOO_SHORT = 'VAR_STRING_TOO_SHORT',
  VAR_STRING_TOO_LONG = 'VAR_STRING_TOO_LONG',
  VAR_NUMBER_OUT_OF_RANGE = 'VAR_NUMBER_OUT_OF_RANGE',
  VAR_URL_INVALID_PROTOCOL = 'VAR_URL_INVALID_PROTOCOL',
  
  // Plugin errors
  PLUGIN_LOAD_FAILED = 'PLUGIN_LOAD_FAILED',
  PLUGIN_INVALID_INTERFACE = 'PLUGIN_INVALID_INTERFACE',
  PLUGIN_DUPLICATE_NAME = 'PLUGIN_DUPLICATE_NAME',
  PLUGIN_EXECUTION_TIMEOUT = 'PLUGIN_EXECUTION_TIMEOUT',
  PLUGIN_EXECUTION_ERROR = 'PLUGIN_EXECUTION_ERROR',
  
  // Pipe syntax parsing errors
  PIPE_PARSE_INVALID_SYNTAX = 'PIPE_PARSE_INVALID_SYNTAX',
  PIPE_PARSE_INVALID_NESTING = 'PIPE_PARSE_INVALID_NESTING',
  PIPE_PARSE_INVALID_ESCAPE = 'PIPE_PARSE_INVALID_ESCAPE',
  PIPE_PARSE_JSON_INVALID = 'PIPE_PARSE_JSON_INVALID',
  PIPE_PARSE_MAX_DEPTH_EXCEEDED = 'PIPE_PARSE_MAX_DEPTH_EXCEEDED',
  
  // Transformation errors
  TRANSFORM_TYPE_MISMATCH = 'TRANSFORM_TYPE_MISMATCH',
  TRANSFORM_MISSING_PARAM = 'TRANSFORM_MISSING_PARAM',
  TRANSFORM_INVALID_PARAM = 'TRANSFORM_INVALID_PARAM',
  TRANSFORM_EXECUTION_ERROR = 'TRANSFORM_EXECUTION_ERROR',
}

/**
 * Validation options
 * Configures validation behavior
 */
export interface ValidationOptions {
  /** Fail on warnings (not just errors) */
  readonly strict: boolean;
  
  /** Max depth for nested properties */
  readonly maxNestingDepth: number;
  
  /** Max path segment length */
  readonly maxSegmentLength: number;
  
  /** Allow circular references (resolve with defaults) */
  readonly allowCircular: boolean;
}

/**
 * Validation helper functions
 */
export class ValidationHelpers {
  /**
   * Create a successful validation result
   */
  static success(value: unknown): ValidationResult {
    return {
      success: true,
      value,
      errors: [],
      warnings: []
    };
  }
  
  /**
   * Create a failed validation result
   */
  static failure(errors: ValidationError[], warnings: ValidationError[] = []): ValidationResult {
    return {
      success: false,
      errors,
      warnings
    };
  }
  
  /**
   * Create a validation error
   */
  static createError(
    code: ErrorCode | string,
    message: string,
    options?: {
      severity?: 'error' | 'warning' | 'info';
      source?: SourceLocation;
      expected?: unknown;
      actual?: unknown;
      suggestion?: string;
    }
  ): ValidationError {
    return {
      code,
      message,
      severity: options?.severity ?? 'error',
      source: options?.source,
      expected: options?.expected,
      actual: options?.actual,
      suggestion: options?.suggestion
    };
  }
  
  /**
   * Combine multiple validation results
   * Collects ALL errors and warnings
   */
  static combine(results: ValidationResult[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];
    let hasValue = true;
    let combinedValue: unknown;
    
    for (const result of results) {
      if (!result.success) {
        hasValue = false;
      } else if (hasValue) {
        combinedValue = result.value;
      }
      
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }
    
    return allErrors.length > 0
      ? ValidationHelpers.failure(allErrors, allWarnings)
      : ValidationHelpers.success(combinedValue);
  }
}
