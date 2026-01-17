/**
 * Template Contracts
 * 
 * Defines the structure of YAML templates and variable definitions.
 */

/**
 * Template metadata
 */
export interface TemplateMeta {
  /** Template name */
  readonly name: string;
  
  /** Creation timestamp */
  readonly createdAt: Date;
  
  /** Last modified timestamp */
  readonly modifiedAt: Date;
  
  /** File size in bytes */
  readonly fileSize: number;
  
  /** Variable count */
  readonly variableCount: number;
}

/**
 * Complete template structure
 */
export interface ITemplate {
  /** Template file path */
  readonly filePath: string;
  
  /** Template metadata */
  readonly meta: TemplateMeta;
  
  /** Variable definitions extracted from YAML */
  readonly variables: ReadonlyMap<string, VariableDefinition>;
  
  /** Template version (for compatibility checking) */
  readonly version?: string;
  
  /** Template author */
  readonly author?: string;
  
  /** Template description */
  readonly description?: string;
}

/**
 * Variable definition
 * Represents a single environment variable with all its configuration
 */
export interface VariableDefinition {
  /** Variable name (e.g., DATABASE_URL) */
  readonly name: string;
  
  /** Base type (string, number, boolean, url) */
  readonly type: ValidatorType;
  
  /** Pipe syntax parameters (prompt config, validation, transformations) */
  readonly params: Readonly<Record<string, unknown>>;
  
  /** Source line in YAML template (for error reporting) */
  readonly sourceLine?: number;
  
  /** Source file path */
  readonly sourceFile?: string;
  
  /** Resolved value (after prompts/args/defaults) */
  value?: string;
  
  /** Whether value is required (no default) */
  readonly required?: boolean;
  
  /** Default value if not provided */
  readonly defaultValue?: string;
  
  /** Help text for interactive prompts */
  readonly description?: string;
  
  /** Variable dependencies (for circular reference detection) */
  readonly dependencies?: readonly string[];
}

/**
 * Validator types
 */
export type ValidatorType = 'string' | 'number' | 'boolean' | 'url';

/**
 * Prompt configuration (from pipe syntax)
 */
export interface PromptConfig {
  /** Prompt type (select, multiselect, toggle, number, string, autocomplete) */
  readonly type: PromptType;
  
  /** Prompt label/question */
  readonly label: string;
  
  /** Options for select/multiselect */
  readonly options?: readonly string[];
  
  /** Min value for number */
  readonly min?: number;
  
  /** Max value for number */
  readonly max?: number;
  
  /** Default value */
  readonly default?: unknown;
  
  /** Enable autocomplete suggestions */
  readonly autocomplete?: boolean;
}

/**
 * Prompt types (maps to @inquirer/prompts)
 */
export type PromptType = 
  | 'select'       // Single selection from list
  | 'multiselect'  // Multiple selections from list
  | 'toggle'       // Boolean toggle (yes/no)
  | 'number'       // Numeric input
  | 'string'       // Text input
  | 'autocomplete'; // Text with suggestions

/**
 * Template constraints
 */
export interface TemplateConstraints {
  /** Max template size (10MB) */
  readonly maxFileSize: number;
  
  /** Max variable count (5000) */
  readonly maxVariableCount: number;
  
  /** Max nesting depth (5) */
  readonly maxNestingDepth: number;
  
  /** Max segment length (50) */
  readonly maxSegmentLength: number;
}

/**
 * Default template constraints
 */
export const DEFAULT_TEMPLATE_CONSTRAINTS: TemplateConstraints = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxVariableCount: 5000,
  maxNestingDepth: 5,
  maxSegmentLength: 50
};
