# @repo/env-template-prompter

## New Command: `check`

Run the following to check your .env.template config, display groups in use, and show a dependency graph of env variable relationships:

```bash
bun run src/commands/check.ts
```

This will output:
- Groups in use and their variables
- Dependency graph showing which env variable depends on which

A sophisticated TypeScript library for interactive environment configuration from `.env.template` files. Features a service-based architecture with dependency injection, plugin support, and both CLI and programmatic interfaces.

## 🌟 Features

- **Interactive Configuration**: Beautiful CLI prompts with validation
- **Template Syntax**: Advanced field definitions with constraints and transformations
- **Service Architecture**: Clean separation of concerns with dependency injection
- **Plugin System**: Extensible transformers and validators
- **TypeScript**: Full type safety throughout
- **Dual APIs**: Both CLI and programmatic interfaces
- **Comprehensive Testing**: Unit, integration, and E2E tests with Vitest

## 🚀 Quick Start

### CLI Usage

```bash
# Basic usage
bun run env-prompt

# With custom template
bun run env-prompt custom.env.template

# With options
bun run env-prompt --debug --skip-existing -o .env.local
```

### Programmatic Usage

```typescript
import { EnvTemplatePrompter } from '@repo/env-template-prompter';

const prompter = new EnvTemplatePrompter({
  templatePath: '.env.template',
  outputPath: '.env',
  debugMode: false
});

const result = await prompter.processTemplate();
console.log(`Generated ${result.fieldCount} fields`);
```

## 📝 Template Syntax

### Basic Fields
```env
# String field
APP_NAME={{string}}

# Number with constraints
API_PORT={{number|min=3000|max=65535|allow=80,443}}

# URL validation
DATABASE_URL={{url}}

# Email validation
ADMIN_EMAIL={{email}}
```

### Advanced Features
```env
# Custom message
SECRET_KEY={{string|message=Enter your application secret (32+ chars)|validate=min_length:32}}

# Transformers
DATABASE_HOST={{string|transformer=extract_hostname|source=@{DATABASE_URL}}}
API_PORT={{number|transformer=extract_port|source=@{API_URL}|auto_derive=true}}

# Group organization
SYSTEM_ENV_TEMPLATE_CONFIG={{string|value={"groups":{"API":"API Configuration","DATABASE":"Database Settings"}}}}
API_URL={{string|group=API}}
DATABASE_URL={{string|group=DATABASE}}
```

## 🏗️ Architecture

The package uses a service-oriented architecture:

- **ConfigService**: Runtime configuration and debug management
- **TemplateParserService**: Parse `.env.template` files
- **ValidationService**: Input validation with custom rules
- **TransformerService**: Value transformations and dependencies
- **GroupingService**: Organize fields into logical groups
- **PromptService**: Interactive user prompts
- **OutputService**: Generate formatted `.env` files

## 🔌 Plugin System

### Custom Transformers
```typescript
const uppercaseTransformer: TransformerPlugin = {
  name: 'uppercase',
  transform: (value: string) => value.toUpperCase()
};

prompter.registerTransformer(uppercaseTransformer);
```

### Custom Validators
```typescript
const phoneValidator: ValidatorPlugin = {
  name: 'phone',
  validate: (value: string) => /^\+?[\d\s-()]+$/.test(value),
  errorMessage: () => 'Please enter a valid phone number'
};

prompter.registerValidator(phoneValidator);
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Unit tests only
bun run test:unit

# Integration tests
bun run test:integration

# E2E tests
bun run test:e2e

# Coverage report
bun run test:coverage
```

## 📦 Build

```bash
# Build the package
bun run build

# Development mode
bun run dev

# Type checking
bun run type-check
```

## 🔧 Development

```bash
# Install dependencies
bun install

# Build and test
bun run build
bun test

# Lint and format
bun run lint
bun run lint:fix
```

## 📚 Documentation

For detailed documentation, see:
- [Service Architecture](../../../docs/env-template-prompter/SERVICE-ARCHITECTURE.md)
- [Implementation Roadmap](../../../docs/env-template-prompter/IMPLEMENTATION-ROADMAP.md)
- [Memory Bank](../../../docs/env-template-prompter/MEMORY-BANK.md)

## 🤝 Contributing

This package is part of the nextjs-nestjs-turborepo template. Please see the main repository for contribution guidelines.

## 📄 License

MIT - see the main repository for details.
