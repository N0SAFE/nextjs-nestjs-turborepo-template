# AGENTS.md — Scaffold CLI Package

This document provides guidance for AI coding agents working on the scaffold CLI package.

## Package Overview

**Purpose**: CLI tool to scaffold NestJS + Next.js Turborepo projects from builder-ui configurations.

**Location**: `packages/bin/scaffold/`

**Technology Stack**:
- NestJS + nest-commander for CLI framework
- Handlebars for template processing
- Zod for validation
- ora/kleur for terminal UI

## Architecture

```
src/
├── main.ts                    # CLI entry point (CommandFactory)
├── app.module.ts              # Root NestJS module
├── commands/                  # CLI commands (nest-commander)
├── modules/
│   ├── plugin/                # Plugin management
│   ├── generator/             # File generation orchestration
│   ├── generators/            # Individual plugin generators
│   ├── project/               # Project management
│   ├── io/                    # File system & terminal I/O
│   └── config/                # Configuration parsing & validation
├── templates/                 # Handlebars templates
└── utils/                     # Shared utilities
```

## Key Patterns

### Service-Command Pattern

Commands handle CLI I/O only; business logic lives in services:

```typescript
// ❌ BAD: Logic in command
@Command({ name: 'create' })
export class CreateCommand extends CommandRunner {
  async run(): Promise<void> {
    // Don't put business logic here
    const config = await this.parseConfig();
    await this.generateFiles();
  }
}

// ✅ GOOD: Command delegates to services
@Command({ name: 'create' })
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
```

### Generator Pattern

Each plugin has its own generator extending BaseGenerator:

```typescript
@Injectable()
export class BetterAuthGenerator extends BaseGenerator {
  readonly pluginId = 'better-auth';
  readonly dependencies = ['database'];
  readonly conflicts = ['clerk', 'supabase-auth'];

  async generate(context: GeneratorContext): Promise<GeneratorResult> {
    // 1. Generate files from templates
    // 2. Modify existing files if needed
    // 3. Return result with files created/modified
  }
}
```

### Template Pattern

Templates use Handlebars with custom helpers:

```handlebars
{{#if hasAuth}}
import { AuthModule } from './auth/auth.module';
{{/if}}

@Module({
  imports: [
    {{#each imports}}
    {{this}},
    {{/each}}
  ],
})
export class AppModule {}
```

## Development Workflow

### Adding a New Generator

1. Create generator file in `src/modules/generators/<category>/`
2. Extend `BaseGenerator` class
3. Implement `generate()` method
4. Add templates in `templates/`
5. Register in `GeneratorsModule`
6. Add tests in `__tests__/`

### Adding a New Command

1. Create command file in `src/commands/`
2. Use `@Command` decorator with name and options
3. Extend `CommandRunner`
4. Inject required services
5. Register in `AppModule`
6. Add tests

## Type System

### Core Types

```typescript
// Plugin definition
interface Plugin {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  dependencies?: string[];
  optionalDependencies?: string[];
  conflicts?: string[];
  devOnly?: boolean;
  default?: boolean;
  tags?: string[];
  docsUrl?: string;
}

// Project configuration (from builder-ui)
interface ProjectConfig {
  projectName: string;
  description?: string;
  author?: string;
  license?: string;
  packageManager: 'bun' | 'npm' | 'yarn' | 'pnpm';
  template?: string;
  features: string[];  // Selected plugin IDs
  pluginConfigs?: Record<string, PluginConfig>;
  ports?: { api?: number; web?: number; doc?: number };
}

// Generator context
interface GeneratorContext {
  projectConfig: ProjectConfig;
  pluginConfig?: PluginConfig;
  outputPath: string;
  enabledPlugins: string[];
  templateService: TemplateService;
  fileSystem: FileSystemService;
  logger: LoggerService;
}
```

## Testing Guidelines

### Unit Tests

Test services in isolation with mocked dependencies:

```typescript
describe('PluginResolverService', () => {
  let service: PluginResolverService;
  let registry: MockType<PluginRegistryService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PluginResolverService,
        { provide: PluginRegistryService, useFactory: mockFactory },
      ],
    }).compile();

    service = module.get(PluginResolverService);
  });

  it('should resolve dependencies', () => {
    // Test dependency resolution
  });
});
```

### Integration Tests

Test full scaffolding flows with temporary directories:

```typescript
describe('Scaffold Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scaffold-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it('should scaffold a basic project', async () => {
    // Test full scaffold flow
  });
});
```

## Commands Reference

```bash
# Create new project
scaffold create <name> --config <path> [--interactive] [--skip-install]

# Add plugin to existing project
scaffold add <plugin-id> [--config <overrides>] [--dry-run]

# Remove plugin from project
scaffold remove <plugin-id> [--keep-files] [--force]

# List available plugins
scaffold list [--category <cat>] [--installed] [--json]

# Validate project
scaffold validate [path] [--fix] [--strict]

# Show plugin info
scaffold info <plugin-id>
```

## Dependencies

### Production
- `@nestjs/common`, `@nestjs/core`: NestJS framework
- `nest-commander`: CLI framework for NestJS
- `handlebars`: Template engine
- `zod`: Schema validation
- `ora`: Terminal spinners
- `kleur`: Terminal colors
- `prompts`: Interactive prompts
- `execa`: Command execution
- `fs-extra`: Enhanced file system operations
- `glob`: File pattern matching

### Development
- `vitest`: Testing framework
- `@nestjs/testing`: NestJS testing utilities

## Error Handling

All errors should be typed and handled gracefully:

```typescript
export class PluginNotFoundError extends Error {
  constructor(pluginId: string) {
    super(`Plugin not found: ${pluginId}`);
    this.name = 'PluginNotFoundError';
  }
}

export class DependencyConflictError extends Error {
  constructor(pluginId: string, conflictsWith: string[]) {
    super(`Plugin ${pluginId} conflicts with: ${conflictsWith.join(', ')}`);
    this.name = 'DependencyConflictError';
  }
}
```

## Performance Considerations

1. **Lazy Loading**: Use dynamic imports for generators not needed
2. **Parallel Generation**: Generate independent files in parallel
3. **Template Caching**: Cache compiled Handlebars templates
4. **Dependency Graph**: Pre-compute topological sort for install order

## Related Documentation

- [TODO.md](./TODO.md) - Comprehensive implementation checklist
- [Builder UI Types](../../apps/builder-ui/src/types.ts) - Shared type definitions
- [Builder UI Plugins](../../apps/builder-ui/src/data/plugins.ts) - Plugin definitions
