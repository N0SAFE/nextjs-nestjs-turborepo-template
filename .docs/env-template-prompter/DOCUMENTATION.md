# 📖 @repo/env-template-prompter Documentation

## 🌟 Overview

The `@repo/env-template-prompter` package is a sophisticated TypeScript library designed to transform `.env.template` files into interactive configuration experiences. It provides a service-based architecture with dependency injection, plugin support, and both CLI and programmatic interfaces.

## 🎯 Core Concepts

### Template Syntax
The package uses an advanced template syntax that supports complex field definitions:

```env
# Basic field
DATABASE_URL={{string}}

# Field with validation
API_PORT={{number|min=3000|max=65535|allow=80,443}}

# Field with transformation
DATABASE_HOST={{string|transformer=extract_hostname|source=@{DATABASE_URL}}}

# Field with custom message
SECRET_KEY={{string|message=Enter your application secret key (32+ characters)|validate=min_length:32}}
```

### Group Configuration
Fields can be organized into logical groups for better UX:

```env
SYSTEM_ENV_TEMPLATE_CONFIG={{string|value={"groups":{"NEXT_PUBLIC":"Next.js Public Configuration","DATABASE":"Database Configuration","API":"API Configuration"}}}}

# Explicit group assignment
NEXT_PUBLIC_API_URL={{string|group=NEXT_PUBLIC}}
DATABASE_URL={{string|group=DATABASE}}
API_SECRET={{string|group=API}}
```

### Variable References
Fields can reference other variables for dynamic behavior:

```env
# Reference previous input
DATABASE_URL={{string}}
DATABASE_PORT={{number|transformer=extract_port|source=@{DATABASE_URL}|auto_derive=true}}

# Environment variable expansion
LOG_LEVEL={{string|value=${NODE_ENV:production}}}
```

## 🏗️ Architecture

### Service-Based Design
The package follows a service-oriented architecture with clear separation of concerns:

```typescript
interface ServiceContainer {
  configService: ConfigService;
  templateParserService: TemplateParserService;
  validationService: ValidationService;
  transformerService: TransformerService;
  groupingService: GroupingService;
  promptService: PromptService;
  outputService: OutputService;
}
```

### Dependency Injection
Services are injected based on their dependencies:

```typescript
class EnvTemplatePrompter {
  constructor(
    private configService: ConfigService,
    private templateParser: TemplateParserService,
    private validator: ValidationService,
    // ... other services
  ) {}
}
```

### Plugin Architecture
The package supports plugins for extensibility:

```typescript
interface TransformerPlugin {
  name: string;
  transform(value: string, params: Record<string, string>): string | Promise<string>;
}

interface ValidatorPlugin {
  name: string;
  validate(value: string, params: Record<string, string>): boolean | Promise<boolean>;
}
```

## 🔧 Core Services

### ConfigService
**Purpose:** Manages runtime configuration and debug settings  
**Dependencies:** None  
**Key Methods:**
- `setDebugMode(enabled: boolean): void`
- `getConfig(): RuntimeConfig`
- `setOutputPath(path: string): void`

```typescript
interface RuntimeConfig {
  debugMode: boolean;
  outputPath: string;
  templatePath: string;
  skipExisting: boolean;
}
```

### TemplateParserService
**Purpose:** Parses .env.template files and extracts field definitions  
**Dependencies:** ConfigService  
**Key Methods:**
- `parseTemplate(content: string): TemplateField[]`
- `extractFieldDefinition(line: string): TemplateField | null`
- `parseFieldOptions(optionsString: string): FieldOptions`

```typescript
interface TemplateField {
  key: string;
  type: FieldType;
  options: FieldOptions;
  rawLine: string;
  lineNumber: number;
}

interface FieldOptions {
  value?: string;
  message?: string;
  group?: string;
  transformer?: string;
  source?: string;
  auto_derive?: boolean;
  validate?: string;
  min?: number;
  max?: number;
  allow?: string;
}
```

### ValidationService
**Purpose:** Validates user input based on field types and constraints  
**Dependencies:** ConfigService  
**Key Methods:**
- `validateField(value: string, field: TemplateField): ValidationResult`
- `validateUrl(url: string): boolean`
- `validateNumber(value: string, options: FieldOptions): boolean`
- `registerValidator(plugin: ValidatorPlugin): void`

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

### TransformerService
**Purpose:** Applies transformations to field values  
**Dependencies:** ValidationService, ConfigService  
**Key Methods:**
- `applyTransformers(field: TemplateField, context: TransformContext): Promise<string>`
- `registerTransformer(plugin: TransformerPlugin): void`
- `getBuiltInTransformers(): TransformerPlugin[]`

```typescript
interface TransformContext {
  sourceValue: string;
  allValues: Map<string, string>;
  field: TemplateField;
}
```

### GroupingService
**Purpose:** Organizes fields into logical groups for presentation  
**Dependencies:** ConfigService  
**Key Methods:**
- `groupFields(fields: TemplateField[]): GroupedFields`
- `parseExplicitGroups(config: string): Record<string, string>`
- `autoDetectGroups(fields: TemplateField[]): Record<string, string>`

```typescript
interface GroupedFields {
  groups: Map<string, TemplateField[]>;
  ungrouped: TemplateField[];
  groupTitles: Map<string, string>;
}
```

### PromptService
**Purpose:** Handles interactive user prompts  
**Dependencies:** ValidationService, TransformerService, ConfigService  
**Key Methods:**
- `promptForField(field: TemplateField, context: PromptContext): Promise<string>`
- `promptForGroup(groupName: string, fields: TemplateField[]): Promise<Map<string, string>>`
- `shouldSkipField(field: TemplateField, context: PromptContext): boolean`

```typescript
interface PromptContext {
  existingValues: Map<string, string>;
  groupTitle?: string;
  skipExisting: boolean;
}
```

### OutputService
**Purpose:** Generates .env files with proper formatting  
**Dependencies:** ConfigService  
**Key Methods:**
- `generateEnvFile(values: Map<string, string>, template: TemplateField[]): string`
- `writeEnvFile(content: string, path: string): Promise<void>`
- `addComments(content: string, fields: TemplateField[]): string`

## 🔌 Plugin System

### Creating Custom Transformers
```typescript
const customTransformer: TransformerPlugin = {
  name: 'uppercase',
  transform: (value: string) => value.toUpperCase()
};

prompter.registerTransformer(customTransformer);
```

### Creating Custom Validators
```typescript
const emailValidator: ValidatorPlugin = {
  name: 'email',
  validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
};

prompter.registerValidator(emailValidator);
```

### Built-in Transformers
1. **extract_port:** Extracts port number from URLs
2. **extract_hostname:** Extracts hostname from URLs
3. **cors_origins:** Builds CORS origins list from existing URLs
4. **generate_secret:** Generates cryptographic secrets
5. **boolean_flag:** Converts strings to boolean flags
6. **array_from_csv:** Converts CSV strings to arrays

### Built-in Validators
1. **url:** Validates URL format
2. **number:** Validates numeric input with min/max/allow
3. **string:** Validates string input with length constraints
4. **boolean:** Validates boolean input
5. **email:** Validates email format
6. **port:** Validates port numbers

## 🚀 Usage Examples

### CLI Usage
```bash
# Basic usage
bun run env-prompt

# With debug output
bun run env-prompt --debug

# Specify template file
bun run env-prompt --template custom.env.template

# Skip existing values
bun run env-prompt --skip-existing
```

### Programmatic Usage
```typescript
import { EnvTemplatePrompter } from '@repo/env-template-prompter';

const prompter = new EnvTemplatePrompter({
  templatePath: '.env.template',
  outputPath: '.env',
  debugMode: false
});

// Process template
const result = await prompter.processTemplate();
console.log(`Generated .env with ${result.fieldCount} fields`);

// Register custom plugins
prompter.registerTransformer(customTransformer);
prompter.registerValidator(customValidator);
```

### Advanced Configuration
```typescript
// Custom service configuration
const prompter = new EnvTemplatePrompter({
  templatePath: '.env.template',
  outputPath: '.env.local',
  skipExisting: true,
  plugins: {
    transformers: [customTransformer],
    validators: [customValidator]
  }
});

// Process with context
const result = await prompter.processTemplate({
  existingEnv: process.env,
  interactive: false, // Non-interactive mode
  defaultValues: new Map([
    ['DATABASE_URL', 'postgres://localhost:5432/app']
  ])
});
```

## 🧪 Testing Strategy

### Unit Testing
Each service is tested in isolation:

```typescript
describe('ValidationService', () => {
  let service: ValidationService;
  let mockConfig: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfig = createMockConfigService();
    service = new ValidationService(mockConfig);
  });

  it('should validate URLs correctly', () => {
    const result = service.validateUrl('https://example.com');
    expect(result).toBe(true);
  });
});
```

### Integration Testing
Service interactions are tested:

```typescript
describe('Template Processing Integration', () => {
  let prompter: EnvTemplatePrompter;

  it('should process complete template workflow', async () => {
    const result = await prompter.processTemplate({
      interactive: false,
      defaultValues: testValues
    });
    
    expect(result.success).toBe(true);
    expect(result.fieldCount).toBe(5);
  });
});
```

### E2E Testing
Complete CLI scenarios:

```typescript
describe('CLI E2E Tests', () => {
  it('should handle complete interactive session', async () => {
    const cli = new CLIInterface();
    const result = await cli.run(['--template', 'test.env.template']);
    
    expect(result.exitCode).toBe(0);
    expect(fs.existsSync('.env')).toBe(true);
  });
});
```

## 📦 Package Structure

```
packages/env-template-prompter/
├── src/
│   ├── services/
│   │   ├── ConfigService.ts
│   │   ├── TemplateParserService.ts
│   │   ├── ValidationService.ts
│   │   ├── TransformerService.ts
│   │   ├── GroupingService.ts
│   │   ├── PromptService.ts
│   │   └── OutputService.ts
│   ├── plugins/
│   │   ├── transformers/
│   │   └── validators/
│   ├── types/
│   │   ├── index.ts
│   │   ├── services.ts
│   │   └── plugins.ts
│   ├── cli/
│   │   ├── index.ts
│   │   └── CLIInterface.ts
│   ├── EnvTemplatePrompter.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docs/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 🔄 Migration Path

### Phase 1: Package Setup
1. Create package structure
2. Setup TypeScript and build tools
3. Configure testing framework
4. Define core interfaces

### Phase 2: Service Implementation
1. Implement each service with proper dependencies
2. Create plugin architecture
3. Add comprehensive error handling
4. Implement debug utilities

### Phase 3: Integration
1. Create main EnvTemplatePrompter class
2. Implement CLI interface
3. Add programmatic API
4. Create comprehensive tests

### Phase 4: Migration
1. Update root project dependencies
2. Migrate existing .env.template
3. Update documentation
4. Deprecate old scripts

## 🎨 User Experience

### Interactive Flow
1. **Welcome Message:** Clear introduction to the process
2. **Group Headers:** Beautiful group titles with descriptions
3. **Field Prompts:** Context-aware prompts with validation
4. **Progress Indicators:** Clear progress through groups
5. **Success Summary:** Confirmation of generated configuration

### Debug Output
When debug mode is enabled, comprehensive logging shows:
- Template parsing details
- Group organization logic
- Transformer execution steps
- Validation results
- Variable resolution process

### Error Handling
- **Graceful Degradation:** Continue processing on non-critical errors
- **Clear Messages:** User-friendly error descriptions
- **Recovery Options:** Suggestions for fixing issues
- **Validation Feedback:** Immediate feedback on input validation

---

This package represents a complete evolution from the simple init.js script to a professional, extensible, and maintainable solution for environment configuration management.
