# @repo-bin/scaffold

A powerful CLI tool to scaffold NestJS + Next.js Turborepo projects from builder-ui configurations. Built with NestJS + nest-commander, featuring a strong type system and modular architecture.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [create](#create-command)
  - [list](#list-command)
  - [info](#info-command)
  - [validate](#validate-command)
- [Configuration](#configuration)
  - [Configuration File Format](#configuration-file-format)
  - [Plugin Configuration](#plugin-configuration)
- [Available Generators](#available-generators)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [API Reference](#api-reference)

---

## Overview

The scaffold CLI enables rapid project bootstrapping by:

- **Generating monorepo structures** with apps (api, web, doc) and shared packages
- **Configuring 19+ plugins** for authentication, database, UI, infrastructure, and more
- **Type-safe configuration** with Zod schema validation
- **Handlebars templates** for flexible file generation
- **Dependency resolution** with topological sorting and conflict detection

### Key Features

✅ **Strong Type System** - Full TypeScript with Zod validation  
✅ **Modular Architecture** - NestJS services with dependency injection  
✅ **Plugin System** - 19 generators covering all project aspects  
✅ **Template Engine** - Handlebars with 35+ custom helpers  
✅ **Interactive Mode** - Prompts for guided configuration  
✅ **Validation** - Config and project structure validation  
✅ **Extensible** - Easy to add new generators and templates

---

## Installation

The scaffold CLI is part of the monorepo. To use it locally:

```bash
# From the monorepo root
bun install

# Build the scaffold package
bun run build --filter=@repo-bin/scaffold

# Run directly
bun run packages/bin/scaffold/dist/main.js <command>

# Or link globally
cd packages/bin/scaffold
bun link
scaffold <command>
```

---

## Quick Start

### Create a New Project

```bash
# Interactive mode
scaffold create my-project --interactive

# From configuration file
scaffold create my-project --config ./project-config.json

# With specific template
scaffold create my-project --template fullstack
```

### List Available Plugins

```bash
# All plugins
scaffold list

# By category
scaffold list --category authentication
scaffold list --category database

# JSON output
scaffold list --json
```

### Validate a Configuration

```bash
# Validate config file
scaffold validate --config ./project-config.json

# Validate existing project
scaffold validate --project ./my-project
```

---

## Commands

### Create Command

Creates a new project from configuration.

```bash
scaffold create <name> [options]
```

**Arguments:**
- `name` - Project name (required)

**Options:**
| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--config <path>` | `-c` | Path to JSON configuration file | - |
| `--template <type>` | `-t` | Base template: `fullstack`, `api-only`, `web-only`, `minimal` | `fullstack` |
| `--output <path>` | `-o` | Output directory | `./<name>` |
| `--interactive` | `-i` | Enable interactive mode | `false` |
| `--skip-install` | - | Skip dependency installation | `false` |
| `--skip-git` | - | Skip git initialization | `false` |
| `--force` | `-f` | Overwrite existing directory | `false` |
| `--dry-run` | - | Preview changes without writing | `false` |
| `--verbose` | `-v` | Verbose output | `false` |

**Examples:**

```bash
# Basic fullstack project
scaffold create my-app

# API-only with specific config
scaffold create my-api --template api-only --config ./api-config.json

# Interactive with output directory
scaffold create my-project -i -o /projects/my-project

# Preview without creating files
scaffold create test-project --dry-run
```

---

### List Command

Lists available plugins and templates.

```bash
scaffold list [options]
```

**Options:**
| Option | Alias | Description |
|--------|-------|-------------|
| `--category <cat>` | `-c` | Filter by category |
| `--template <type>` | `-t` | Filter by template type |
| `--default` | `-d` | Show only default plugins |
| `--json` | `-j` | Output as JSON |
| `--verbose` | `-v` | Show detailed information |

**Available Categories:**
- `authentication` - Auth plugins (Better Auth, API Keys)
- `database` - Database plugins (Drizzle, PostgreSQL)
- `api` - API plugins (ORPC, React Query)
- `ui` - UI plugins (Shadcn, TailwindCSS, Next Themes)
- `infrastructure` - Infrastructure (Docker, GitHub Actions, Redis)
- `core` - Core tools (TypeScript, ESLint, Prettier, Vitest, Turborepo)
- `state` - State management (Zustand, Zod)

**Examples:**

```bash
# List all plugins with details
scaffold list -v

# List authentication plugins
scaffold list -c authentication

# JSON output for scripting
scaffold list -j > plugins.json

# List default plugins
scaffold list -d
```

---

### Info Command

Shows detailed information about a specific plugin.

```bash
scaffold info <plugin-id>
```

**Arguments:**
- `plugin-id` - Plugin identifier (e.g., `better-auth`, `drizzle`)

**Output includes:**
- Plugin name and description
- Category and tags
- Dependencies (required/optional)
- Conflicts with other plugins
- Configuration options
- Files generated
- Documentation links

**Examples:**

```bash
# Get info about Better Auth
scaffold info better-auth

# Get info about Drizzle
scaffold info drizzle
```

---

### Validate Command

Validates configuration files or existing projects.

```bash
scaffold validate [options]
```

**Options:**
| Option | Alias | Description |
|--------|-------|-------------|
| `--config <path>` | `-c` | Validate configuration file |
| `--project <path>` | `-p` | Validate existing project |
| `--strict` | `-s` | Enable strict validation |
| `--fix` | - | Auto-fix issues where possible |
| `--json` | `-j` | Output as JSON |

**Validation checks:**
- Schema validation (Zod)
- Plugin dependency resolution
- Conflict detection
- Required fields presence
- Value type correctness
- Plugin configuration validity

**Examples:**

```bash
# Validate a config file
scaffold validate -c ./project-config.json

# Validate with strict mode
scaffold validate -c ./config.json --strict

# Get validation results as JSON
scaffold validate -c ./config.json -j
```

---

## Configuration

### Configuration File Format

The scaffold CLI accepts JSON configuration files matching the `ScaffoldConfigFileSchema`:

```typescript
interface ScaffoldConfig {
  // Project metadata
  projectName: string;           // Required: Project name (kebab-case)
  description?: string;          // Optional: Project description
  author?: string;               // Optional: Author name
  license?: string;              // Optional: License type (default: "MIT")
  
  // Project structure
  template?: "fullstack" | "api-only" | "web-only" | "minimal";
  packageManager?: "bun" | "npm" | "yarn" | "pnpm";  // Default: "bun"
  
  // Features selection
  features: string[];            // Required: Array of plugin IDs to enable
  
  // Plugin-specific configurations
  pluginConfigs?: {
    [pluginId: string]: Record<string, unknown>;
  };
  
  // Port configuration
  ports?: {
    api?: number;                // Default: 3001
    web?: number;                // Default: 3000
    doc?: number;                // Default: 3002
  };
  
  // Output settings
  outputPath?: string;           // Default: "./<projectName>"
}
```

### Example Configuration Files

**Full-Stack Project:**

```json
{
  "projectName": "my-saas-app",
  "description": "Full-stack SaaS application",
  "author": "Your Name",
  "license": "MIT",
  "template": "fullstack",
  "packageManager": "bun",
  "features": [
    "typescript",
    "eslint",
    "prettier",
    "turborepo",
    "vitest",
    "better-auth",
    "drizzle",
    "postgresql",
    "orpc",
    "react-query",
    "zod",
    "zustand",
    "shadcn-ui",
    "tailwindcss",
    "next-themes",
    "docker",
    "github-actions"
  ],
  "pluginConfigs": {
    "better-auth": {
      "providers": ["google", "github"],
      "sessionStrategy": "jwt"
    },
    "drizzle": {
      "database": "postgresql",
      "generateMigrations": true
    }
  },
  "ports": {
    "api": 3001,
    "web": 3000,
    "doc": 3002
  }
}
```

**API-Only Project:**

```json
{
  "projectName": "my-api",
  "template": "api-only",
  "features": [
    "typescript",
    "eslint",
    "prettier",
    "vitest",
    "drizzle",
    "postgresql",
    "orpc",
    "zod",
    "docker",
    "redis"
  ]
}
```

**Minimal Project:**

```json
{
  "projectName": "minimal-starter",
  "template": "minimal",
  "features": [
    "typescript",
    "eslint",
    "prettier"
  ]
}
```

### Plugin Configuration

Each plugin can have its own configuration under `pluginConfigs`:

**Better Auth Configuration:**
```json
{
  "better-auth": {
    "providers": ["google", "github", "discord"],
    "sessionStrategy": "jwt" | "database",
    "sessionExpiry": 604800,
    "enableAdmin": true,
    "enable2FA": false
  }
}
```

**Drizzle Configuration:**
```json
{
  "drizzle": {
    "database": "postgresql" | "mysql" | "sqlite",
    "generateMigrations": true,
    "seedData": true,
    "studioEnabled": true
  }
}
```

**Docker Configuration:**
```json
{
  "docker": {
    "includeCompose": true,
    "includeDevCompose": true,
    "services": ["api", "web", "db", "redis"],
    "registry": "ghcr.io"
  }
}
```

---

## Available Generators

### Core Generators (6)

| Generator | Plugin ID | Description |
|-----------|-----------|-------------|
| TypeScript | `typescript` | TypeScript configuration with strict mode |
| ESLint | `eslint` | ESLint with shared config package |
| Prettier | `prettier` | Prettier formatting with shared config |
| Turborepo | `turborepo` | Monorepo build system configuration |
| Vitest | `vitest` | Testing framework with shared config |

### Feature Generators (7)

| Generator | Plugin ID | Dependencies | Description |
|-----------|-----------|--------------|-------------|
| Better Auth | `better-auth` | `drizzle` | Authentication with Better Auth |
| Drizzle | `drizzle` | `postgresql` | Drizzle ORM setup |
| ORPC | `orpc` | `zod` | Type-safe RPC framework |
| React Query | `react-query` | - | TanStack Query for data fetching |
| Zod | `zod` | - | Schema validation library |
| Zustand | `zustand` | - | State management |

### UI Generators (3)

| Generator | Plugin ID | Dependencies | Description |
|-----------|-----------|--------------|-------------|
| Shadcn UI | `shadcn-ui` | `tailwindcss` | Component library |
| TailwindCSS | `tailwindcss` | - | Utility-first CSS |
| Next Themes | `next-themes` | - | Theme switching |

### Infrastructure Generators (5)

| Generator | Plugin ID | Dependencies | Description |
|-----------|-----------|--------------|-------------|
| Docker | `docker` | - | Dockerfiles and compose |
| GitHub Actions | `github-actions` | - | CI/CD workflows |
| PostgreSQL | `postgresql` | - | Database configuration |
| Redis | `redis` | - | Redis cache configuration |

---

## Architecture

### Module Structure

```
src/
├── main.ts                          # CLI entry point (CommandFactory)
├── app.module.ts                    # Root NestJS module
│
├── commands/                        # CLI commands (nest-commander)
│   ├── create.command.ts           # Project creation
│   ├── list.command.ts             # Plugin listing
│   ├── info.command.ts             # Plugin information
│   └── validate.command.ts         # Config validation
│
├── modules/
│   ├── io/                          # Input/Output services
│   │   ├── file-system.service.ts  # File operations
│   │   ├── logger.service.ts       # Colored terminal output
│   │   ├── spinner.service.ts      # Progress indicators
│   │   └── prompt.service.ts       # Interactive prompts
│   │
│   ├── config/                      # Configuration services
│   │   ├── config-parser.service.ts    # Parse config files
│   │   ├── config-validator.service.ts # Zod validation
│   │   └── config-merger.service.ts    # Merge with defaults
│   │
│   ├── plugin/                      # Plugin management
│   │   ├── plugin-registry.service.ts  # Plugin definitions
│   │   └── plugin-resolver.service.ts  # Dependency resolution
│   │
│   ├── generator/                   # Generation orchestration
│   │   ├── generator-orchestrator.service.ts
│   │   ├── template.service.ts         # Handlebars processing
│   │   ├── file-merger.service.ts      # Smart file merging
│   │   └── generators/                 # Individual generators
│   │       ├── base/base-generator.ts  # Abstract base class
│   │       ├── core/                   # Core generators
│   │       ├── feature/                # Feature generators
│   │       ├── ui/                     # UI generators
│   │       └── infrastructure/         # Infrastructure generators
│   │
│   ├── template/                    # Template management
│   │   ├── template-registry.service.ts
│   │   └── template-helpers.service.ts # Custom Handlebars helpers
│   │
│   └── project/                     # Project management
│       ├── project-config.service.ts
│       └── project-validator.service.ts
│
├── templates/                       # Handlebars templates
│   ├── root/                        # Root project files
│   ├── app/api/                     # API app templates
│   ├── app/web/                     # Web app templates
│   ├── package/                     # Package templates
│   └── config/                      # Config file templates
│
└── types/                           # Type definitions
    ├── config.types.ts
    ├── generator.types.ts
    ├── plugin.types.ts
    └── errors.types.ts
```

### Service Pattern

The CLI follows a strict Service-Command pattern:

```typescript
// Commands handle CLI I/O only
@Command({ name: 'create', description: 'Create a new project' })
export class CreateCommand extends CommandRunner {
  constructor(
    private readonly orchestrator: GeneratorOrchestratorService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async run(args: string[], options: CreateOptions): Promise<void> {
    this.logger.info('Creating project...');
    await this.orchestrator.scaffold(config, outputPath);
    this.logger.success('Project created!');
  }
}

// Business logic lives in services
@Injectable()
export class GeneratorOrchestratorService {
  async scaffold(
    config: ProjectConfig,
    outputPath: string,
  ): Promise<ScaffoldResult> {
    // All scaffolding logic here
  }
}
```

### Generator Pattern

Each generator extends `BaseGenerator`:

```typescript
@Injectable()
export class TypeScriptGenerator extends BaseGenerator {
  readonly pluginId = 'typescript';
  readonly name = 'TypeScript';
  readonly dependencies: string[] = [];
  readonly optionalDependencies: string[] = [];
  readonly conflicts: string[] = [];

  async generate(context: GeneratorContext): Promise<GeneratorResult> {
    const files: GeneratedFile[] = [];
    
    // Generate tsconfig.json
    files.push({
      path: 'tsconfig.json',
      content: await this.renderTemplate('tsconfig.json.hbs', context),
    });
    
    return {
      success: true,
      filesCreated: files.map(f => f.path),
      filesModified: [],
      warnings: [],
      errors: [],
    };
  }
}
```

---

## Development

### Adding a New Generator

1. **Create the generator file:**

```typescript
// src/modules/generator/generators/feature/my-plugin.generator.ts
import { Injectable } from '@nestjs/common';
import { BaseGenerator, GeneratorContext, GeneratorResult } from '../base';

@Injectable()
export class MyPluginGenerator extends BaseGenerator {
  readonly pluginId = 'my-plugin';
  readonly name = 'My Plugin';
  readonly dependencies = ['typescript'];
  readonly optionalDependencies = ['eslint'];
  readonly conflicts = ['conflicting-plugin'];

  async generate(context: GeneratorContext): Promise<GeneratorResult> {
    const files: GeneratedFile[] = [];
    
    // Add your generation logic
    
    return {
      success: true,
      filesCreated: files.map(f => f.path),
      filesModified: [],
      warnings: [],
      errors: [],
    };
  }
}
```

2. **Add templates in `templates/`:**

```handlebars
{{! templates/feature/my-plugin/config.ts.hbs }}
export const config = {
  name: '{{projectName}}',
  {{#if enableFeature}}
  feature: true,
  {{/if}}
};
```

3. **Register in the generator collection:**

```typescript
// src/modules/generator/generators/generator-collection.ts
import { MyPluginGenerator } from './feature/my-plugin.generator';

export const GENERATOR_COLLECTION = [
  // ... existing generators
  MyPluginGenerator,
];
```

4. **Add tests:**

```typescript
// src/modules/generator/generators/feature/__tests__/my-plugin.generator.spec.ts
describe('MyPluginGenerator', () => {
  let generator: MyPluginGenerator;
  
  beforeEach(() => {
    generator = new MyPluginGenerator(/* dependencies */);
  });
  
  it('should generate config file', async () => {
    const result = await generator.generate(mockContext);
    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('config.ts');
  });
});
```

### Template Helpers

The template system includes 35+ Handlebars helpers:

**String Helpers:**
- `{{camelCase name}}` - Convert to camelCase
- `{{pascalCase name}}` - Convert to PascalCase
- `{{kebabCase name}}` - Convert to kebab-case
- `{{snakeCase name}}` - Convert to snake_case
- `{{capitalize text}}` - Capitalize first letter
- `{{uppercase text}}` - UPPERCASE
- `{{lowercase text}}` - lowercase
- `{{trim text}}` - Trim whitespace

**Array Helpers:**
- `{{join array ","}}` - Join array with separator
- `{{first array}}` - Get first element
- `{{last array}}` - Get last element
- `{{includes array "item"}}` - Check if array includes item
- `{{length array}}` - Get array length

**Comparison Helpers:**
- `{{eq a b}}` - Equal
- `{{ne a b}}` - Not equal
- `{{gt a b}}` - Greater than
- `{{lt a b}}` - Less than
- `{{gte a b}}` - Greater than or equal
- `{{lte a b}}` - Less than or equal
- `{{and a b}}` - Logical AND
- `{{or a b}}` - Logical OR
- `{{not a}}` - Logical NOT

**Conditional Helpers:**
- `{{#if condition}}...{{/if}}`
- `{{#unless condition}}...{{/unless}}`
- `{{#ifAny a b c}}...{{/ifAny}}`
- `{{#ifAll a b c}}...{{/ifAll}}`

**JSON Helpers:**
- `{{json object}}` - Stringify object
- `{{jsonPretty object}}` - Pretty print JSON

**Plugin Helpers:**
- `{{hasPlugin "plugin-id"}}` - Check if plugin enabled
- `{{hasAnyPlugin "a" "b"}}` - Check if any plugin enabled
- `{{hasAllPlugins "a" "b"}}` - Check if all plugins enabled
- `{{pluginConfig "plugin-id" "key"}}` - Get plugin config value

---

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run in watch mode
bun run test:watch

# Run with UI
bun run test:ui

# Run with coverage
bun run test:coverage
```

### Test Structure

```
src/
├── modules/
│   ├── io/__tests__/
│   │   ├── file-system.service.spec.ts
│   │   ├── logger.service.spec.ts
│   │   ├── spinner.service.spec.ts
│   │   └── prompt.service.spec.ts
│   │
│   ├── config/__tests__/
│   │   ├── config-parser.service.spec.ts
│   │   └── config-validator.service.spec.ts
│   │
│   ├── generator/__tests__/
│   │   ├── template.service.spec.ts
│   │   └── generator-orchestrator.service.spec.ts
│   │
│   ├── generator/generators/__tests__/
│   │   ├── base-generator.spec.ts
│   │   ├── typescript.generator.spec.ts
│   │   └── generator-collection.spec.ts
│   │
│   ├── template/__tests__/
│   │   ├── template-registry.service.spec.ts
│   │   └── template-helpers.service.spec.ts
│   │
│   └── plugin/__tests__/
│       └── plugin-registry.service.spec.ts
```

### Test Coverage

Current test coverage: **431 tests passing** across 12 test files.

| Module | Tests | Coverage |
|--------|-------|----------|
| IO Services | 159 | ✅ |
| Config Services | 79 | ✅ |
| Generator Services | 84 | ✅ |
| Template Services | 109 | ✅ |

---

## API Reference

### Core Services

#### FileSystemService

```typescript
interface FileSystemService {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  copyFile(src: string, dest: string): Promise<void>;
  copyDirectory(src: string, dest: string): Promise<void>;
  remove(path: string): Promise<void>;
  readDirectory(path: string): Promise<string[]>;
  readJson<T>(path: string): Promise<T>;
  writeJson<T>(path: string, data: T, options?: { pretty?: boolean }): Promise<void>;
  isDirectory(path: string): Promise<boolean>;
  isFile(path: string): Promise<boolean>;
  glob(pattern: string, options?: GlobOptions): Promise<string[]>;
}
```

#### LoggerService

```typescript
interface LoggerService {
  info(message: string, context?: string): void;
  success(message: string, context?: string): void;
  warning(message: string, context?: string): void;
  error(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  step(current: number, total: number, message: string): void;
  box(title: string, content: string): void;
  list(items: string[], options?: ListOptions): void;
  table(data: Record<string, unknown>[], columns?: string[]): void;
  newline(): void;
}
```

#### ConfigValidatorService

```typescript
interface ConfigValidatorService {
  validate(data: unknown): ValidationResult<ScaffoldConfig>;
  validatePartial(data: unknown): ValidationResult<Partial<ScaffoldConfig>>;
  getSchema(): ZodSchema;
  formatErrors(errors: ZodError): string;
}
```

#### TemplateService

```typescript
interface TemplateService {
  compile(template: string, data: TemplateData): string;
  compileFile(templatePath: string, data: TemplateData): Promise<string>;
  registerHelper(name: string, helper: HelperDelegate): void;
  registerPartial(name: string, template: string): void;
  hasTemplate(templatePath: string): Promise<boolean>;
  listTemplates(directory?: string): Promise<string[]>;
}
```

### Types

#### GeneratorContext

```typescript
interface GeneratorContext {
  config: ScaffoldConfig;
  pluginConfig?: Record<string, unknown>;
  outputPath: string;
  enabledPlugins: string[];
  dryRun: boolean;
  verbose: boolean;
}
```

#### GeneratorResult

```typescript
interface GeneratorResult {
  success: boolean;
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  warnings: string[];
  errors: string[];
  metadata?: Record<string, unknown>;
}
```

#### ValidationResult

```typescript
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}
```

---

## Error Handling

The CLI uses typed error classes for consistent error handling:

```typescript
// Plugin not found
throw new PluginNotFoundError('unknown-plugin');

// Dependency conflict
throw new DependencyConflictError('plugin-a', ['plugin-b', 'plugin-c']);

// Validation error
throw new ValidationError('Invalid config', errors);

// Template error
throw new TemplateError('template.hbs', 'Syntax error at line 5');

// File system error
throw new FileSystemError('read', '/path/to/file', originalError);
```

---

## Related Documentation

- [AGENTS.md](./AGENTS.md) - AI agent development guidelines
- [TODO.md](./TODO.md) - Implementation roadmap and checklist
- [Builder UI](../../apps/builder-ui/) - Visual configuration tool

---

## License

MIT © [Your Name]
