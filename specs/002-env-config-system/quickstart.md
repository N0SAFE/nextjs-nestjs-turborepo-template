# Environment Configuration System - Quick Start Guide

Complete developer guide for the Environment Configuration System, covering installation, usage, template syntax, plugin development, and best practices.

---

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Template Syntax Guide](#template-syntax-guide)
4. [Plugin Development](#plugin-development)
5. [CLI Reference](#cli-reference)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### Using Bun (Recommended)

```bash
# Add to workspace package
cd packages/env-config
bun install

# Or add as dependency to another package
bun add @repo/env-config
```

### Using npm/yarn

```bash
# npm
npm install @repo/env-config

# yarn
yarn add @repo/env-config
```

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd packages/env-config
bun install

# Run tests
bun test

# Build
bun run build
```

---

## Basic Usage

The system supports three execution modes: **Interactive**, **Argument**, and **CI**.

### Interactive Mode (Default)

Prompts user for each variable with visual interface.

**Template file**: `.env.template.yml`

```yaml
meta:
  name: "My Application Config"
  description: "Environment configuration for development"
  version: "1.0.0"

variables:
  DATABASE_URL:
    type: url
    description: "PostgreSQL database connection string"
    required: true
    prompt:
      type: string
      label: "Database URL"
    params:
      protocol: "postgresql"
      
  API_PORT:
    type: number
    description: "Port for the API server"
    required: false
    default: 3001
    prompt:
      type: number
      label: "API Port"
      min: 1024
      max: 65535
```

**Run interactive mode**:

```bash
bun run env-config
```

**Output**: `.env` file

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
API_PORT=3001
```

**Interactive prompt flow**:

1. System reads `.env.template.yml`
2. Validates template structure
3. Discovers and loads plugins
4. For each required variable:
   - Displays label and description
   - Shows appropriate input control (string, number, select, etc.)
   - Validates input against type and constraints
   - Applies transformers if configured
5. Generates `.env` file with results

---

### Argument Mode

Pass variable values directly via command-line arguments.

**Use case**: CI/CD pipelines, automation scripts, non-interactive environments.

**Run with arguments**:

```bash
bun run env-config \
  --mode argument \
  --arg DATABASE_URL=postgresql://user:pass@localhost:5432/mydb \
  --arg API_PORT=3001 \
  --arg NODE_ENV=production
```

**Multiple arguments**:

```bash
# Using repeated --arg flags
bun run env-config \
  --mode argument \
  --arg KEY1=value1 \
  --arg KEY2=value2 \
  --arg KEY3=value3

# Or JSON file
echo '{"KEY1": "value1", "KEY2": "value2"}' > args.json
bun run env-config --mode argument --args-file args.json
```

**Validation in argument mode**:

- Required variables: Must be provided via --arg or error
- Type validation: Still enforced (number, url, boolean)
- Transformers: Still applied to provided values
- No prompts: Fully non-interactive

---

### CI Mode

Strict validation mode for CI/CD pipelines with enhanced error reporting.

**Features**:

- Non-interactive (fails if required variables missing)
- Strict validation (no warnings, only errors)
- Exit codes for automation
- Comprehensive error output

**Run in CI mode**:

```bash
bun run env-config --mode ci --template .env.template.yml --output .env
```

**CI behavior**:

- Reads from environment variables (`process.env`)
- Validates all constraints strictly
- Fails fast on first error
- Exit code 1 on validation failure
- Exit code 0 on success

**CI environment variables**:

```bash
# Set in CI pipeline
export DATABASE_URL=postgresql://user:pass@db:5432/prod
export API_PORT=3001
export NODE_ENV=production

# Run validator
bun run env-config --mode ci
```

**GitHub Actions example**:

```yaml
- name: Generate environment config
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_PORT: 3001
    NODE_ENV: production
  run: |
    bun run env-config --mode ci --template .env.template.yml --output .env
```

---

## Template Syntax Guide

Templates are written in YAML with special pipe syntax for variable configuration.

### Basic Structure

```yaml
meta:
  name: "Project Name"              # Required
  description: "Project description" # Optional
  version: "1.0.0"                  # Optional
  author: "Team Name"               # Optional

variables:
  VARIABLE_NAME:
    type: string                    # Required: string | number | boolean | url
    description: "What this variable does"
    required: true                  # Default: false
    default: "default-value"        # Optional
    params:                         # Type-specific parameters
      minLength: 5
      maxLength: 100
    prompt:                         # Interactive mode configuration
      type: string
      label: "Display Label"
```

### Pipe Syntax

Variables can use pipe syntax for inline configuration:

**Format**: `type|param1=value1|param2=value2|required/default:value`

**Examples**:

```yaml
variables:
  # String with length constraints
  API_KEY: "string|minLength=32|maxLength=64|required"
  
  # Number with range
  PORT: "number|min=1024|max=65535|default:3000"
  
  # Boolean with custom labels
  DEBUG: "boolean|labels=yes,no|default:no"
  
  # URL with protocol restriction
  DATABASE_URL: "url|protocol=postgresql|required"
  
  # Select with options
  ENVIRONMENT: "select|options=dev,staging,prod|default:dev"
```

### Nested Properties

Use dot notation for nested properties:

```yaml
variables:
  LOG_LEVEL:
    type: select
    prompt.type: select
    prompt.options: ["error", "warn", "info", "debug"]
    prompt.default: info
    params.strict: true
```

**Equivalent to**:

```yaml
variables:
  LOG_LEVEL:
    type: select
    prompt:
      type: select
      options: ["error", "warn", "info", "debug"]
      default: info
    params:
      strict: true
```

### JSON Values

For complex default values, use JSON:

```yaml
variables:
  CORS_ORIGINS:
    type: string
    default: |
      ["http://localhost:3000", "http://localhost:3001"]
    params:
      json: true
```

### Escape Sequences

Special characters in pipe syntax require escaping:

| Character | Escape | Example |
|-----------|--------|---------|
| Pipe `\|` | `\\|` | `string\|minLength=5` (literal pipe in value) |
| Backslash `\\` | `\\\\` | `path\\to\\file` |
| Comma `,` | `\,` | `options=opt1\,with\,comma,opt2` |
| Colon `:` | `\:` | `default:http\://localhost` |
| Dot `.` | `\.` | `pattern=file\.txt` |
| Quote `"` | `\"` | `default:"Say \"Hi\""` |
| Newline | `\n` | `default:Line1\nLine2` |
| Tab | `\t` | `default:Col1\tCol2` |

**Example with escapes**:

```yaml
variables:
  FILE_PATH:
    type: string
    default: "C:\\Users\\Admin\\file.txt"  # Escaped backslashes
    
  MESSAGE:
    type: string
    default: "Line 1\nLine 2\nLine 3"      # Newlines
    
  CSV_ROW:
    type: string
    default: "Column1\tColumn2\tColumn3"   # Tabs
```

### Variable References

Reference other variables using `${VAR_NAME}` syntax:

```yaml
variables:
  # Base variables
  DB_HOST:
    type: string
    required: true
    
  DB_PORT:
    type: number
    default: 5432
    
  DB_NAME:
    type: string
    required: true
    
  DB_USER:
    type: string
    required: true
    
  DB_PASSWORD:
    type: string
    required: true
    params:
      secure: true
  
  # Derived variable using references
  DATABASE_URL:
    type: url
    default: "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    params:
      protocol: "postgresql"
```

**Reference resolution**:

1. Variables resolved in dependency order
2. Circular dependencies detected and reported
3. Missing references cause validation errors
4. References can be nested: `${PREFIX}_${SUFFIX}`

---

## Plugin Development

Plugins extend the system with custom validators and transformers.

### Creating a Validator

**Interface**:

```typescript
import type { IValidator, ValidationResult, PluginMetadata } from '@repo/env-config/contracts';
import { z } from 'zod';

export class MyValidator implements IValidator {
  // Metadata (required)
  readonly metadata: PluginMetadata = {
    name: 'my-validator',
    version: '1.0.0',
    description: 'Custom validation logic',
    author: 'Your Name'
  };

  // Validate method (required)
  validate(value: unknown, params: Record<string, unknown>): ValidationResult {
    // Your validation logic
    const isValid = /* check value */;
    
    if (!isValid) {
      return {
        success: false,
        errors: [{
          code: 'VAR_INVALID_VALUE',
          message: 'Value does not meet requirements',
          severity: 'error',
          source: { file: '', line: 0, column: 0, variable: '' }
        }]
      };
    }
    
    return {
      success: true,
      value: value
    };
  }

  // Schema method (required)
  getSchema(params: Record<string, unknown>): z.ZodSchema {
    return z.string().min(params.minLength as number || 0);
  }
}
```

**File naming**: `my-validator.validator.ts`

**Registration**:

```typescript
// Automatic discovery if placed in plugin directories
// Or manual registration:
import { registry } from '@repo/env-config';
import { MyValidator } from './my-validator.validator';

registry.registerValidator('my-validator', new MyValidator());
```

**Example: Email Validator**

```typescript
import type { IValidator, ValidationResult, PluginMetadata } from '@repo/env-config/contracts';
import { z } from 'zod';

export class EmailValidator implements IValidator {
  readonly metadata: PluginMetadata = {
    name: 'email',
    version: '1.0.0',
    description: 'Validates email addresses',
    author: 'Config Team'
  };

  validate(value: unknown, params: Record<string, unknown>): ValidationResult {
    if (typeof value !== 'string') {
      return {
        success: false,
        errors: [{
          code: 'VAR_TYPE_MISMATCH',
          message: 'Email must be a string',
          severity: 'error',
          source: { file: '', line: 0, column: 0, variable: '' }
        }]
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        success: false,
        errors: [{
          code: 'VAR_INVALID_VALUE',
          message: 'Invalid email format',
          severity: 'error',
          source: { file: '', line: 0, column: 0, variable: '' },
          expected: 'user@domain.com',
          actual: value
        }]
      };
    }

    // Optional: Domain whitelist
    if (params.allowedDomains) {
      const domain = value.split('@')[1];
      const allowed = params.allowedDomains as string[];
      if (!allowed.includes(domain)) {
        return {
          success: false,
          errors: [{
            code: 'VAR_INVALID_VALUE',
            message: `Email domain not in whitelist: ${allowed.join(', ')}`,
            severity: 'error',
            source: { file: '', line: 0, column: 0, variable: '' }
          }]
        };
      }
    }

    return { success: true, value };
  }

  getSchema(params: Record<string, unknown>): z.ZodSchema {
    return z.string().email();
  }
}
```

**Usage in template**:

```yaml
variables:
  ADMIN_EMAIL:
    type: email
    required: true
    params:
      allowedDomains: ["company.com", "partner.com"]
```

---

### Creating a Transformer

**Interface**:

```typescript
import type {
  ITransformer,
  VariableContext,
  Result,
  ValidationError,
  PluginMetadata
} from '@repo/env-config/contracts';
import { ResultOps } from '@repo/env-config/contracts';
import { z } from 'zod';

export class MyTransformer implements ITransformer {
  // Metadata (required)
  readonly metadata: PluginMetadata = {
    name: 'my-transformer',
    version: '1.0.0',
    description: 'Custom transformation logic',
    author: 'Your Name'
  };

  // Transform method (required)
  transform(
    value: unknown,
    params: Record<string, unknown>,
    context: VariableContext
  ): Result<unknown, ValidationError> {
    try {
      // Transform logic
      const transformed = /* modify value */;
      return ResultOps.ok(transformed);
    } catch (error) {
      return ResultOps.fail({
        code: 'TRANSFORM_EXECUTION_ERROR',
        message: error.message,
        severity: 'error',
        source: { file: '', line: 0, column: 0, variable: context.currentVariable || '' }
      });
    }
  }

  // Schema method (required)
  getSchema(params: Record<string, unknown>): z.ZodSchema {
    return z.unknown();
  }
}
```

**File naming**: `my-transformer.transformer.ts`

**Example: Base64 Encoder**

```typescript
import type {
  ITransformer,
  VariableContext,
  Result,
  ValidationError,
  PluginMetadata
} from '@repo/env-config/contracts';
import { ResultOps } from '@repo/env-config/contracts';
import { z } from 'zod';

export class Base64Transformer implements ITransformer {
  readonly metadata: PluginMetadata = {
    name: 'base64',
    version: '1.0.0',
    description: 'Encodes/decodes base64 strings',
    author: 'Config Team'
  };

  transform(
    value: unknown,
    params: Record<string, unknown>,
    context: VariableContext
  ): Result<unknown, ValidationError> {
    if (typeof value !== 'string') {
      return ResultOps.fail({
        code: 'TRANSFORM_TYPE_MISMATCH',
        message: 'Base64 transformer requires string input',
        severity: 'error',
        source: {
          file: '',
          line: 0,
          column: 0,
          variable: context.currentVariable || ''
        }
      });
    }

    try {
      const mode = params.mode as string || 'encode';
      
      if (mode === 'encode') {
        return ResultOps.ok(Buffer.from(value).toString('base64'));
      } else if (mode === 'decode') {
        return ResultOps.ok(Buffer.from(value, 'base64').toString('utf-8'));
      } else {
        return ResultOps.fail({
          code: 'TRANSFORM_INVALID_PARAM',
          message: `Invalid mode: ${mode}. Use 'encode' or 'decode'`,
          severity: 'error',
          source: {
            file: '',
            line: 0,
            column: 0,
            variable: context.currentVariable || ''
          }
        });
      }
    } catch (error) {
      return ResultOps.fail({
        code: 'TRANSFORM_EXECUTION_ERROR',
        message: `Base64 transformation failed: ${error.message}`,
        severity: 'error',
        source: {
          file: '',
          line: 0,
          column: 0,
          variable: context.currentVariable || ''
        }
      });
    }
  }

  getSchema(params: Record<string, unknown>): z.ZodSchema {
    return z.string();
  }
}
```

**Usage in template**:

```yaml
variables:
  SECRET_KEY:
    type: string
    required: true
    transformers:
      - name: base64
        params:
          mode: encode
```

---

### Plugin Testing

**Unit test structure**:

```typescript
import { describe, it, expect } from 'vitest';
import { EmailValidator } from '../email.validator';

describe('EmailValidator', () => {
  const validator = new EmailValidator();

  describe('validate', () => {
    it('should accept valid email', () => {
      const result = validator.validate('user@example.com', {});
      expect(result.success).toBe(true);
      expect(result.value).toBe('user@example.com');
    });

    it('should reject invalid email format', () => {
      const result = validator.validate('not-an-email', {});
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('VAR_INVALID_VALUE');
    });

    it('should enforce domain whitelist', () => {
      const result = validator.validate('user@example.com', {
        allowedDomains: ['company.com']
      });
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('whitelist');
    });

    it('should reject non-string values', () => {
      const result = validator.validate(123, {});
      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('VAR_TYPE_MISMATCH');
    });
  });

  describe('getSchema', () => {
    it('should return email schema', () => {
      const schema = validator.getSchema({});
      expect(() => schema.parse('user@example.com')).not.toThrow();
      expect(() => schema.parse('invalid')).toThrow();
    });
  });
});
```

**Integration test**:

```typescript
import { describe, it, expect } from 'vitest';
import { PluginRegistry } from '../registry';
import { EmailValidator } from '../plugins/email.validator';

describe('PluginRegistry Integration', () => {
  it('should discover and register plugins', async () => {
    const registry = new PluginRegistry();
    
    const result = await registry.discoverAndRegister({
      pluginPaths: ['./src/plugins'],
      validatorPattern: '*.validator.ts',
      transformerPattern: '*.transformer.ts',
      timeout: 5000,
      enableCache: false,
      cacheTTL: 0
    });

    expect(result.validators.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should use registered validator', async () => {
    const registry = new PluginRegistry();
    const validator = new EmailValidator();
    
    const registerResult = registry.registerValidator('email', validator);
    expect(registerResult.success).toBe(true);

    const retrievedValidator = registry.getValidator('email');
    expect(retrievedValidator).toBe(validator);
  });
});
```

---

### Plugin Best Practices

1. **Error Collection**: Return all errors, don't fail on first error

```typescript
validate(value: unknown, params: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Collect all errors
  if (condition1) {
    errors.push({ /* error 1 */ });
  }
  if (condition2) {
    errors.push({ /* error 2 */ });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, value };
}
```

2. **Type Safety**: Use Zod schemas for runtime type checking

```typescript
getSchema(params: Record<string, unknown>): z.ZodSchema {
  const baseSchema = z.string();
  
  if (params.minLength) {
    return baseSchema.min(params.minLength as number);
  }
  
  return baseSchema;
}
```

3. **Context Usage**: Access other variables for derived validation

```typescript
transform(value: unknown, params: Record<string, unknown>, context: VariableContext): Result<unknown, ValidationError> {
  const relatedVar = context.variables.get('RELATED_VAR');
  
  // Use relatedVar in transformation
  const transformed = `${value}-${relatedVar}`;
  
  return ResultOps.ok(transformed);
}
```

4. **Metadata**: Provide comprehensive metadata

```typescript
readonly metadata: PluginMetadata = {
  name: 'descriptive-name',
  version: '1.0.0',
  description: 'Detailed description of what the plugin does and when to use it',
  author: 'Team Name <team@company.com>'
};
```

---

## CLI Reference

### Commands

```bash
# Generate .env file (interactive mode)
bun run env-config

# Specify template and output files
bun run env-config --template custom.template.yml --output custom.env

# Argument mode with variables
bun run env-config --mode argument --arg VAR1=value1 --arg VAR2=value2

# CI mode
bun run env-config --mode ci

# Load arguments from JSON file
bun run env-config --mode argument --args-file args.json

# Specify custom plugin directories
bun run env-config --plugin-dir ./plugins --plugin-dir ./custom-plugins

# Enable verbose logging
bun run env-config --verbose

# Dry run (validate without writing file)
bun run env-config --dry-run

# Show version
bun run env-config --version

# Show help
bun run env-config --help
```

### Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--mode` | `-m` | string | `interactive` | Execution mode: `interactive`, `argument`, `ci` |
| `--template` | `-t` | string | `.env.template.yml` | Path to template file |
| `--output` | `-o` | string | `.env` | Path to output file |
| `--arg` | `-a` | string[] | `[]` | Variable arguments (format: `KEY=value`) |
| `--args-file` | | string | | JSON file with variable arguments |
| `--plugin-dir` | `-p` | string[] | `[]` | Additional plugin directories |
| `--verbose` | `-v` | boolean | `false` | Enable verbose logging |
| `--dry-run` | `-d` | boolean | `false` | Validate without writing output |
| `--strict` | `-s` | boolean | `false` | Enable strict validation mode |
| `--version` | `-V` | boolean | | Show version number |
| `--help` | `-h` | boolean | | Show help message |

### Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | Success | Configuration generated successfully |
| `1` | Validation Error | Template validation failed |
| `2` | Missing Required | Required variables not provided |
| `3` | Plugin Error | Plugin loading or execution failed |
| `4` | File Error | Template file not found or not readable |
| `5` | Parse Error | YAML parsing failed |
| `6` | Circular Dependency | Circular variable references detected |
| `7` | Transform Error | Variable transformation failed |

### Environment Variables

The CLI respects these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ENV_CONFIG_TEMPLATE` | Default template file path | `.env.template.yml` |
| `ENV_CONFIG_OUTPUT` | Default output file path | `.env` |
| `ENV_CONFIG_MODE` | Default execution mode | `interactive` |
| `ENV_CONFIG_STRICT` | Enable strict validation | `false` |
| `ENV_CONFIG_VERBOSE` | Enable verbose logging | `false` |
| `ENV_CONFIG_PLUGIN_DIR` | Additional plugin directories (colon-separated) | |

**Example**:

```bash
export ENV_CONFIG_TEMPLATE=./config/app.template.yml
export ENV_CONFIG_OUTPUT=./config/.env
export ENV_CONFIG_MODE=argument

bun run env-config --arg DATABASE_URL=postgresql://...
```

---

## Common Patterns

### 1. Derived Variables

Compute variables from other variables:

```yaml
variables:
  # Base variables
  APP_NAME:
    type: string
    required: true
    default: "myapp"
    
  ENVIRONMENT:
    type: select
    required: true
    prompt:
      type: select
      options: ["dev", "staging", "prod"]
      default: "dev"
  
  # Derived variables
  LOG_FILE:
    type: string
    default: "/var/log/${APP_NAME}-${ENVIRONMENT}.log"
    
  DATABASE_NAME:
    type: string
    default: "${APP_NAME}_${ENVIRONMENT}"
```

---

### 2. Conditional Defaults

Environment-specific defaults:

```yaml
variables:
  ENVIRONMENT:
    type: select
    required: true
    prompt:
      type: select
      options: ["dev", "staging", "prod"]
      
  DATABASE_URL:
    type: url
    required: true
    default: |
      ${ENVIRONMENT === 'dev' 
        ? 'postgresql://localhost:5432/dev' 
        : ENVIRONMENT === 'staging' 
          ? 'postgresql://staging-db:5432/staging' 
          : 'postgresql://prod-db:5432/prod'}
    params:
      protocol: "postgresql"
```

---

### 3. Multi-Environment Configs

Generate multiple environment files:

```bash
# Development
bun run env-config \
  --template .env.template.yml \
  --output .env.development \
  --arg ENVIRONMENT=dev

# Staging
bun run env-config \
  --template .env.template.yml \
  --output .env.staging \
  --arg ENVIRONMENT=staging

# Production
bun run env-config \
  --template .env.template.yml \
  --output .env.production \
  --arg ENVIRONMENT=prod
```

**Or use multiple templates**:

```yaml
# .env.template.base.yml (shared)
variables:
  APP_NAME:
    type: string
    required: true

# .env.template.dev.yml (development-specific)
extends: .env.template.base.yml
variables:
  DEBUG:
    type: boolean
    default: true
```

---

### 4. Plugin Composition

Chain multiple transformers:

```yaml
variables:
  SECRET_KEY:
    type: string
    required: true
    prompt:
      type: string
      label: "Secret Key"
    transformers:
      - name: trim           # Remove whitespace
      - name: uppercase      # Convert to uppercase
      - name: base64         # Encode to base64
        params:
          mode: encode
```

**Execution order**: `trim` → `uppercase` → `base64`

---

### 5. Secret Management

Handle secrets securely:

```yaml
variables:
  DATABASE_PASSWORD:
    type: string
    required: true
    params:
      secure: true          # Hide input in prompts
      minLength: 16
      pattern: "^[A-Za-z0-9!@#$%^&*]+$"
    prompt:
      type: string
      label: "Database Password"
      
  # Alternative: Load from external source
  API_KEY:
    type: string
    required: true
    default: "${env:API_KEY}"  # Load from environment variable
```

---

### 6. Validation Chains

Combine multiple validators:

```yaml
variables:
  EMAIL:
    type: email              # Built-in email validator
    required: true
    params:
      allowedDomains: ["company.com"]
    validators:
      - name: email          # Email format
      - name: domain-check   # Custom domain validator
        params:
          whitelist: ["company.com", "partner.com"]
```

---

## Troubleshooting

### Common Errors

#### 1. Circular Dependency Error

**Error**:
```
VAR_CIRCULAR_DEPENDENCY: Circular dependency detected: VAR_A → VAR_B → VAR_A
```

**Cause**: Variables reference each other in a loop

**Solution**: Break the circular reference

```yaml
# ❌ Circular dependency
variables:
  VAR_A:
    default: "${VAR_B}"
  VAR_B:
    default: "${VAR_A}"

# ✅ Fixed
variables:
  VAR_BASE:
    default: "base-value"
  VAR_A:
    default: "${VAR_BASE}-a"
  VAR_B:
    default: "${VAR_BASE}-b"
```

---

#### 2. Invalid Pipe Syntax

**Error**:
```
PIPE_PARSE_INVALID_SYNTAX: Invalid pipe syntax at position 15
```

**Cause**: Malformed pipe expression

**Common mistakes**:

```yaml
# ❌ Missing closing quote
VAR: "string|minLength=5

# ❌ Unescaped pipe in value
VAR: "string|pattern=a|b"

# ❌ Invalid parameter format
VAR: "number|min 5"

# ✅ Correct syntax
VAR: "string|minLength=5"
VAR: "string|pattern=a\\|b"
VAR: "number|min=5"
```

---

#### 3. Missing Required Variable

**Error**:
```
VAR_REQUIRED_MISSING: Required variable 'DATABASE_URL' not provided
```

**Solution in argument mode**:

```bash
bun run env-config --mode argument --arg DATABASE_URL=postgresql://...
```

**Solution in CI mode**:

```bash
export DATABASE_URL=postgresql://...
bun run env-config --mode ci
```

---

#### 4. Type Mismatch

**Error**:
```
VAR_TYPE_MISMATCH: Expected number but got string for variable 'PORT'
```

**Solution**: Provide correct type

```bash
# ❌ Wrong type
--arg PORT=three-thousand

# ✅ Correct type
--arg PORT=3000
```

---

#### 5. Plugin Load Failed

**Error**:
```
PLUGIN_LOAD_FAILED: Could not load plugin './plugins/custom.validator.ts'
```

**Debugging steps**:

1. Verify file exists: `ls -la ./plugins/custom.validator.ts`
2. Check file naming: Must end with `.validator.ts` or `.transformer.ts`
3. Verify export: Plugin must export default class implementing interface
4. Check dependencies: Ensure all imports are available
5. Test plugin in isolation:

```typescript
import { CustomValidator } from './plugins/custom.validator';

const validator = new CustomValidator();
console.log(validator.metadata);
```

---

### Debugging Tips

#### 1. Enable Verbose Mode

```bash
bun run env-config --verbose
```

**Output includes**:

- Template parsing details
- Plugin discovery and loading
- Variable resolution order
- Validation steps
- Transformation pipeline
- Error stack traces

---

#### 2. Dry Run Mode

```bash
bun run env-config --dry-run
```

**Benefits**:

- Validates template without writing file
- Shows what would be generated
- Useful for CI validation
- No side effects

---

#### 3. Check Error Codes

Each error has a specific code for automated handling:

```typescript
try {
  await generateConfig();
} catch (error) {
  if (error.code === 'VAR_REQUIRED_MISSING') {
    console.error('Missing required variables:', error.variables);
  } else if (error.code === 'YAML_PARSE_INVALID_SYNTAX') {
    console.error('YAML syntax error at line', error.line);
  }
}
```

**Error code reference**: See `validation.contract.ts` ErrorCode enum

---

#### 4. Performance Profiling

```bash
# Enable performance metrics
bun run env-config --verbose --performance
```

**Metrics reported**:

- Template parse time
- Plugin discovery time
- Validation duration
- Transformation duration
- Total execution time

**Expected performance** (from research.md):

- Parse: ~780ms for 1000 variables
- Generate: ~1100ms for 1000 variables
- Plugin discovery: ~180ms for 50 plugins

---

#### 5. Cache Issues

If experiencing stale plugin cache:

```bash
# Clear cache
rm -rf .env-config-cache

# Disable cache temporarily
bun run env-config --no-cache
```

---

### Performance Tuning

#### 1. Enable Caching

```bash
bun run env-config \
  --cache-size 100 \
  --cache-ttl 300000  # 5 minutes
```

---

#### 2. Parallel Processing

```bash
bun run env-config \
  --parallel \
  --batch-size 100
```

**Benefits**:

- Faster validation for large templates
- Parallel plugin discovery
- Concurrent variable resolution

**Trade-offs**:

- Higher memory usage
- More CPU cores required

---

#### 3. Optimize Template

```yaml
# ❌ Slow: Many small validators
variables:
  VAR1: "string|minLength=5|maxLength=100|pattern=^[a-z]+$"
  VAR2: "string|minLength=5|maxLength=100|pattern=^[a-z]+$"
  # ... repeated 1000 times

# ✅ Fast: Shared validator config
_shared_string_config: &string_config
  type: string
  params:
    minLength: 5
    maxLength: 100
    pattern: "^[a-z]+$"

variables:
  VAR1: *string_config
  VAR2: *string_config
```

---

## Next Steps

1. **Implementation**: See `plan.md` Phase 2 for implementation tasks
2. **Architecture**: Review `data-model.md` for entity relationships
3. **Contracts**: Explore `contracts/` directory for type definitions
4. **Research**: See `research.md` for technology decisions and benchmarks

---

**Generated**: Phase 1 - Design Documentation  
**Version**: 1.0.0  
**Last Updated**: 2024-01-XX
