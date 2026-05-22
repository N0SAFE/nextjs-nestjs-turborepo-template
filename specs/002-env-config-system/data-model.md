# Data Model: Environment Configuration System

> **Phase**: 1 - Design & Contracts  
> **Date**: 2025-11-02  
> **Feature**: Environment Configuration Management System

## Overview

This document defines the core entities, their relationships, and validation rules for the environment configuration system. Each entity serves a specific purpose in the template parsing, validation, and .env generation workflow.

---

## Core Entities

### 1. Variable Definition

**Purpose**: Represents a single environment variable with its metadata, validation, and transformation configuration.

**Structure**:
```typescript
interface VariableDefinition {
  /** Variable name (e.g., DATABASE_URL) */
  name: string;
  
  /** Base type (string, number, boolean, url) */
  type: ValidatorType;
  
  /** Pipe syntax parameters (prompt config, validation, transformations) */
  params: Record<string, unknown>;
  
  /** Source line in YAML template (for error reporting) */
  sourceLine?: number;
  
  /** Source file path */
  sourceFile?: string;
  
  /** Resolved value (after prompts/args/defaults) */
  value?: string;
  
  /** Whether value is required (no default) */
  required?: boolean;
  
  /** Default value if not provided */
  defaultValue?: string;
  
  /** Help text for interactive prompts */
  description?: string;
  
  /** Variable dependencies (for circular reference detection) */
  dependencies?: string[];
}
```

**Validation Rules**:
- `name`: Must match `/^[A-Z][A-Z0-9_]*$/` (uppercase, alphanumeric + underscore)
- `type`: Must be one of registered validator types
- `params`: Must validate against plugin schemas
- `dependencies`: Must not form circular references
- Either `defaultValue` OR `required` must be specified

**Relationships**:
- Validated by → **Validator Plugin** (via `type`)
- Transformed by → **Transformer Plugin** (via `params.transform`)
- Referenced by → Other **Variable Definitions** (via substitution)
- Defined in → **Template**

**State Transitions**:
```
[DEFINED] → (parse) → [PARSED]
          ↓
      (validate)
          ↓
     [VALIDATED] → (prompt/arg) → [RESOLVED]
                                      ↓
                                  (transform)
                                      ↓
                                   [FINAL]
```

---

### 2. Validator Plugin

**Purpose**: Validates variable values against type-specific rules (e.g., string length, number range, URL protocol).

**Structure**:
```typescript
interface IValidator {
  /** Plugin metadata */
  meta: PluginMetadata;
  
  /** Validator type name (e.g., 'string', 'number', 'url') */
  type: string;
  
  /**
   * Validate value against type-specific rules
   * @param value - Value to validate
   * @param params - Validation parameters from pipe syntax
   * @returns Validation result (success or errors)
   */
  validate(value: unknown, params: Record<string, unknown>): ValidationResult;
  
  /**
   * Get parameter schema for this validator
   * (used for validating pipe syntax params)
   */
  getSchema(): ZodSchema;
}

interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
}
```

**Built-in Validators**:
1. **StringValidator**: Validates string values (min/max length, pattern, enum)
2. **NumberValidator**: Validates numeric values (min/max, integer, range)
3. **BooleanValidator**: Validates boolean values (true/false, yes/no, 1/0)
4. **URLValidator**: Validates URL format (protocols, hostname, port)

**Validation Rules**:
- `meta.name`: Must be unique across all validators
- `type`: Must match validator's purpose (e.g., 'string' for StringValidator)
- `validate()`: Must return ValidationResult, never throw
- `getSchema()`: Must return valid Zod schema

**Relationships**:
- Validates → **Variable Definition** values
- Registered in → **Plugin Registry**
- Loaded by → **Plugin Loader**

**Example Usage**:
```typescript
const stringValidator: IValidator = {
  meta: {
    name: 'string-validator',
    version: '1.0.0',
    description: 'Validates string values with length and pattern constraints'
  },
  type: 'string',
  
  validate(value: unknown, params: Record<string, unknown>): ValidationResult {
    if (typeof value !== 'string') {
      return ResultOps.fail({
        code: 'VAR_TYPE_MISMATCH',
        message: `Expected string, got ${typeof value}`,
        severity: 'error'
      });
    }
    
    // Validate min length
    if (params.minLength && value.length < params.minLength) {
      return ResultOps.fail({
        code: 'VAR_STRING_TOO_SHORT',
        message: `String must be at least ${params.minLength} characters`,
        severity: 'error'
      });
    }
    
    // More validation rules...
    
    return ResultOps.ok(value);
  },
  
  getSchema(): ZodSchema {
    return z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      enum: z.array(z.string()).optional()
    });
  }
};
```

---

### 3. Transformer Plugin

**Purpose**: Transforms variable values (e.g., truncate, concat, reference resolution).

**Structure**:
```typescript
interface ITransformer {
  /** Plugin metadata */
  meta: PluginMetadata;
  
  /** Transformer name (e.g., 'truncate', 'concat', 'reference') */
  name: string;
  
  /**
   * Transform value using transformation rules
   * @param value - Value to transform
   * @param params - Transformation parameters
   * @param context - Variable context (for reference resolution)
   * @returns Transformed value or error
   */
  transform(
    value: unknown,
    params: Record<string, unknown>,
    context: VariableContext
  ): Result<unknown, ValidationError>;
  
  /**
   * Get parameter schema for this transformer
   */
  getSchema(): ZodSchema;
}

interface VariableContext {
  /** All resolved variables (for reference resolution) */
  variables: Map<string, string>;
  
  /** Current variable being processed */
  currentVariable: string;
}
```

**Built-in Transformers**:
1. **TruncateTransformer**: Truncates string to max length
2. **ConcatTransformer**: Concatenates values with separator
3. **ReferenceTransformer**: Resolves variable references (e.g., `${OTHER_VAR}`)

**Validation Rules**:
- `meta.name`: Must be unique across all transformers
- `transform()`: Must return Result<unknown, ValidationError>, never throw
- Must handle circular references gracefully
- Must preserve type compatibility (e.g., number transform returns number)

**Relationships**:
- Transforms → **Variable Definition** values
- Registered in → **Plugin Registry**
- Loaded by → **Plugin Loader**
- Uses → **Variable Context** for reference resolution

**Example Usage**:
```typescript
const truncateTransformer: ITransformer = {
  meta: {
    name: 'truncate-transformer',
    version: '1.0.0',
    description: 'Truncates strings to maximum length'
  },
  name: 'truncate',
  
  transform(value: unknown, params: Record<string, unknown>): Result<unknown, ValidationError> {
    if (typeof value !== 'string') {
      return ResultOps.fail({
        code: 'TRANSFORM_TYPE_MISMATCH',
        message: 'Truncate only works on strings',
        severity: 'error'
      });
    }
    
    const maxLength = params.maxLength as number;
    if (!maxLength) {
      return ResultOps.fail({
        code: 'TRANSFORM_MISSING_PARAM',
        message: 'truncate requires maxLength parameter',
        severity: 'error'
      });
    }
    
    const truncated = value.length > maxLength ? value.substring(0, maxLength) : value;
    return ResultOps.ok(truncated);
  },
  
  getSchema(): ZodSchema {
    return z.object({
      maxLength: z.number().positive()
    });
  }
};
```

---

### 4. Template

**Purpose**: Represents a YAML template file structure with variables and metadata.

**Structure**:
```typescript
interface Template {
  /** Template file path */
  filePath: string;
  
  /** Template metadata */
  meta: TemplateMeta;
  
  /** Variable definitions extracted from YAML */
  variables: Map<string, VariableDefinition>;
  
  /** Template version (for compatibility checking) */
  version?: string;
  
  /** Template author */
  author?: string;
  
  /** Template description */
  description?: string;
}

interface TemplateMeta {
  /** Template name */
  name: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  modifiedAt: Date;
  
  /** File size in bytes */
  fileSize: number;
  
  /** Variable count */
  variableCount: number;
}
```

**YAML Template Structure**:
```yaml
# Template metadata (optional)
meta:
  name: "Production Environment Template"
  version: "1.0.0"
  author: "DevOps Team"
  description: "Environment variables for production deployment"

# Variable definitions
variables:
  DATABASE_URL: string|prompt.type:select,prompt.options:["postgresql://prod:5432","mysql://prod:3306"],prompt.label:"Choose database"|required:true
  
  API_PORT: number|prompt.type:number,prompt.min:1024,prompt.max:65535,prompt.label:"API Port"|default:3000
  
  DEBUG_MODE: boolean|prompt.type:toggle,prompt.label:"Enable Debug"|default:false
  
  APP_URL: url|prompt.type:string,prompt.label:"Application URL"|required:true|transform:truncate,maxLength:100
```

**Validation Rules**:
- `filePath`: Must exist and be readable
- `meta.name`: Required, unique identifier
- `variables`: Must not have duplicate names
- `version`: Must follow semver if specified
- Total size must be ≤ 10MB
- Variable count must be ≤ 5000

**Relationships**:
- Contains → **Variable Definition**s
- Parsed by → **YAML Parser**
- Validated by → **Template Validator**

---

### 5. Configuration

**Purpose**: Runtime configuration for the CLI tool (modes, paths, options).

**Structure**:
```typescript
interface Configuration {
  /** Execution mode */
  mode: ExecutionMode;
  
  /** Template file path */
  templatePath: string;
  
  /** Output .env file path */
  outputPath: string;
  
  /** CLI arguments (for argument mode) */
  args?: Map<string, string>;
  
  /** Plugin directories (for auto-discovery) */
  pluginPaths?: string[];
  
  /** Validation options */
  validation: ValidationOptions;
  
  /** Performance options */
  performance: PerformanceOptions;
}

enum ExecutionMode {
  INTERACTIVE = 'interactive',  // Prompt user for values
  ARGUMENT = 'argument',         // Use CLI arguments
  CI = 'ci'                      // Strict mode, fail on missing
}

interface ValidationOptions {
  /** Fail on warnings (not just errors) */
  strict: boolean;
  
  /** Max depth for nested properties */
  maxNestingDepth: number;
  
  /** Max path segment length */
  maxSegmentLength: number;
  
  /** Allow circular references (resolve with defaults) */
  allowCircular: boolean;
}

interface PerformanceOptions {
  /** Enable caching */
  enableCache: boolean;
  
  /** Cache size limit */
  cacheSize: number;
  
  /** Enable parallel validation */
  enableParallel: boolean;
  
  /** Batch size for parallel processing */
  batchSize: number;
}
```

**Default Configuration**:
```typescript
const DEFAULT_CONFIG: Configuration = {
  mode: ExecutionMode.INTERACTIVE,
  templatePath: './.env.template.yml',
  outputPath: './.env',
  validation: {
    strict: false,
    maxNestingDepth: 5,
    maxSegmentLength: 50,
    allowCircular: false
  },
  performance: {
    enableCache: true,
    cacheSize: 50,
    enableParallel: true,
    batchSize: 50
  }
};
```

**Validation Rules**:
- `templatePath`: Must exist and be readable
- `outputPath`: Directory must exist and be writable
- `validation.maxNestingDepth`: Must be 1-10
- `performance.cacheSize`: Must be 1-1000
- `performance.batchSize`: Must be 1-200

**Relationships**:
- Loaded by → **ConfigService**
- Used by → **CLI Command**
- Validates via → **Zod Schema**

---

### 6. Validation Result

**Purpose**: Represents the outcome of validation with structured errors and warnings.

**Structure**:
```typescript
interface ValidationResult {
  /** Validation succeeded (no errors) */
  success: boolean;
  
  /** Validated value (if success) */
  value?: unknown;
  
  /** Validation errors (fatal) */
  errors: ValidationError[];
  
  /** Validation warnings (non-fatal) */
  warnings?: ValidationError[];
}

interface ValidationError {
  /** Error code (e.g., VAR_REQUIRED_MISSING) */
  code: string;
  
  /** Human-readable message */
  message: string;
  
  /** Error severity */
  severity: 'error' | 'warning' | 'info';
  
  /** Source location (file, line, column) */
  source?: SourceLocation;
  
  /** Expected vs actual values */
  expected?: unknown;
  actual?: unknown;
  
  /** Suggested fix */
  suggestion?: string;
}

interface SourceLocation {
  /** Source file path */
  file?: string;
  
  /** Line number (1-indexed) */
  line?: number;
  
  /** Column number (1-indexed) */
  column?: number;
  
  /** Variable name */
  variable?: string;
}
```

**Error Code Categories**:
- `YAML_*`: YAML parsing errors
- `VAR_*`: Variable validation errors
- `PLUGIN_*`: Plugin loading/execution errors
- `CIRCULAR_*`: Circular reference errors
- `TRANSFORM_*`: Transformation errors

**Relationships**:
- Returned by → **Validator**, **Transformer**, **Parser**
- Collected by → **ValidationService**
- Formatted by → **ErrorFormatter**

---

### 7. Plugin Registry

**Purpose**: Manages loaded plugins (validators, transformers) and provides discovery/registration API.

**Structure**:
```typescript
interface IPluginRegistry {
  /** Registered validators */
  validators: Map<string, IValidator>;
  
  /** Registered transformers */
  transformers: Map<string, ITransformer>;
  
  /**
   * Register a validator plugin
   */
  registerValidator(validator: IValidator): Result<void, PluginError>;
  
  /**
   * Register a transformer plugin
   */
  registerTransformer(transformer: ITransformer): Result<void, PluginError>;
  
  /**
   * Auto-discover and register plugins from directory
   */
  discoverAndRegister(pluginPath: string, pattern: string): Promise<Result<void, PluginError[]>>;
  
  /**
   * Get validator by type
   */
  getValidator(type: string): IValidator | undefined;
  
  /**
   * Get transformer by name
   */
  getTransformer(name: string): ITransformer | undefined;
  
  /**
   * List all registered plugin names
   */
  list(): { validators: string[]; transformers: string[] };
  
  /**
   * Clear all plugins (for testing)
   */
  clear(): void;
}
```

**Validation Rules**:
- Validator types must be unique
- Transformer names must be unique
- Plugins must pass schema validation before registration
- Discovery must complete in <500ms for 50 plugins
- Plugin errors must not crash registry

**Relationships**:
- Contains → **Validator Plugins**, **Transformer Plugins**
- Used by → **ValidationService**, **TransformationService**
- Populated by → **PluginLoader**

---

## Entity Relationships Diagram

```
┌─────────────────────┐
│     Template        │
│  (YAML file)        │
└──────────┬──────────┘
           │ contains
           │
           ▼
┌────────────────────────────┐
│  Variable Definition       │
│  - name, type, params      │
│  - value, dependencies     │
└───┬──────────────────┬─────┘
    │                  │
    │ validated by     │ transformed by
    │                  │
    ▼                  ▼
┌──────────────┐  ┌─────────────────┐
│  Validator   │  │  Transformer    │
│  Plugin      │  │  Plugin         │
└──────┬───────┘  └────────┬────────┘
       │                   │
       │ registered in     │
       │                   │
       └─────────┬─────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Plugin Registry   │
        │  - validators      │
        │  - transformers    │
        └──────────┬─────────┘
                   │
                   │ used by
                   │
                   ▼
        ┌──────────────────────┐
        │  Validation Result   │
        │  - success, errors   │
        │  - warnings, value   │
        └──────────────────────┘
```

---

## Validation Flow

```
1. Parse YAML Template
   ↓
2. Extract Variable Definitions
   ↓
3. Validate Pipe Syntax
   ↓
4. Load Plugins (validators, transformers)
   ↓
5. Detect Circular References
   ↓
6. Resolve Values (interactive/args/defaults)
   ↓
7. Validate Values (via validator plugins)
   ↓
8. Transform Values (via transformer plugins)
   ↓
9. Generate .env File
```

---

## Type Safety Enforcement

All entities use TypeScript strict mode with:
- No `any` types
- Strict null checks
- No implicit returns
- Readonly for immutable data
- Zod schemas for runtime validation

**Example**:
```typescript
// ✅ Type-safe entity definition
interface VariableDefinition {
  readonly name: string;
  readonly type: ValidatorType;
  readonly params: Readonly<Record<string, unknown>>;
  readonly sourceLine?: number;
}

// ✅ Zod schema for runtime validation
const variableDefinitionSchema = z.object({
  name: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  type: z.enum(['string', 'number', 'boolean', 'url']),
  params: z.record(z.unknown()),
  sourceLine: z.number().optional()
});
```

---

## Summary

This data model provides:
- ✅ **7 Core Entities** with clear responsibilities
- ✅ **Type Safety** via TypeScript + Zod
- ✅ **Validation Rules** for each entity
- ✅ **Relationship Mapping** between entities
- ✅ **State Transitions** for variable lifecycle
- ✅ **Error Handling** via Result types

All entities are designed to support the "bullet proof" requirement with comprehensive validation, error collection, and type safety at compile-time and runtime.
