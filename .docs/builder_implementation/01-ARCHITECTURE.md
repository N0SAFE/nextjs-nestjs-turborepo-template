# Stratum Builder - Architecture

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Architecture

## Overview

The Stratum Builder follows a modular, plugin-based architecture that enables flexible project generation while maintaining consistency and production-readiness. This document details the architectural decisions, components, and their interactions.

## Core Architectural Principles

### 1. Plugin-Based Architecture

Every feature in the Stratum ecosystem is a **plugin**. This includes:
- Core features (ORPC, Better Auth, Database)
- Optional features (Job Queue, Email Service, File Upload)
- Infrastructure features (Docker, CI/CD)
- UI features (Component libraries, Theming)

**Benefits:**
- Clear separation of concerns
- Easy to add/remove features
- Testable in isolation
- Reusable across projects

### 2. Dependency-Driven Design

Plugins declare their dependencies explicitly:
```typescript
{
  id: 'better-auth',
  dependencies: ['database', 'orpc'],
  optionalDependencies: ['redis']
}
```

The builder automatically:
- Resolves and installs required dependencies
- Warns about optional dependencies
- Prevents conflicts
- Ensures correct initialization order

### 3. Template Composition

Instead of a monolithic template, the builder **composes** templates:
- Base template (minimal Next.js + NestJS)
- Feature templates (overlay specific functionality)
- Configuration templates (environment, Docker, CI/CD)

### 4. Convention Over Configuration

The builder follows established conventions:
- Consistent folder structure
- Standard naming patterns
- Predictable file locations
- Common configuration formats

Users can override when needed, but defaults work out of the box.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Stratum Builder CLI                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   CLI Layer  │──────│  Orchestrator │──────│  Output  │ │
│  │  (Commander) │      │    Engine     │      │ Generator│ │
│  └──────────────┘      └───────┬───────┘      └──────────┘ │
│                                │                             │
│  ┌─────────────────────────────┴──────────────────────────┐ │
│  │                  Plugin System                          │ │
│  ├──────────────┬──────────────┬──────────────┬──────────┤ │
│  │   Plugin     │  Dependency  │   Template   │  Hook    │ │
│  │   Registry   │   Resolver   │   Engine     │  System  │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ├─────────────────────────────────┐
                           │                                 │
               ┌───────────▼──────────┐        ┌────────────▼────────┐
               │   Feature Plugins     │        │  Infrastructure     │
               ├──────────────────────┤        │  Plugins            │
               │ • ORPC               │        ├─────────────────────┤
               │ • Better Auth        │        │ • Docker            │
               │ • Database           │        │ • CI/CD             │
               │ • Job Queue          │        │ • Monitoring        │
               │ • Event System       │        │ • Testing           │
               │ • File Upload        │        └─────────────────────┘
               │ • Email Service      │
               └──────────────────────┘
```

## Component Breakdown

### 1. CLI Layer (User Interface)

**Responsibility**: User interaction and command handling

**Key Files**:
- `packages/builder/src/cli/index.ts` - Entry point
- `packages/builder/src/cli/commands/*.ts` - Command implementations
- `packages/builder/src/cli/prompts/*.ts` - Interactive prompts

**Commands**:
```bash
stratum init <project-name>     # Initialize new project
stratum add <feature>           # Add feature to existing project
stratum remove <feature>        # Remove feature
stratum update                  # Update dependencies
stratum plugins                 # List available plugins
stratum validate               # Validate configuration
```

### 2. Orchestrator Engine (Core Logic)

**Responsibility**: Coordinate the entire generation process

**Key Components**:
- **Project Analyzer**: Understand existing project structure
- **Feature Selector**: Interactive feature selection UI
- **Dependency Graph Builder**: Create dependency tree
- **Execution Planner**: Determine order of operations
- **Progress Tracker**: Real-time feedback to user

**Flow**:
1. Parse user input and project context
2. Load available plugins from registry
3. Present interactive selection UI
4. Build dependency graph
5. Validate selections
6. Generate execution plan
7. Execute plan with progress updates
8. Run post-generation hooks
9. Display summary and next steps

### 3. Plugin System (Extensibility)

**Responsibility**: Define, register, and manage plugins

#### Plugin Registry

Maintains catalog of all available plugins:
```typescript
interface PluginRegistry {
  register(plugin: Plugin): void;
  get(id: string): Plugin | undefined;
  list(category?: string): Plugin[];
  search(query: string): Plugin[];
}
```

#### Plugin Interface

Every plugin implements this interface:
```typescript
interface Plugin {
  // Metadata
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Short description
  version: string;              // Semver version
  category: PluginCategory;     // Classification
  
  // Dependencies
  dependencies: string[];        // Required plugins
  optionalDependencies: string[]; // Optional plugins
  conflicts: string[];           // Conflicting plugins
  
  // Files and templates
  templates: TemplateDefinition[];
  files: FileDefinition[];
  
  // Configuration
  config: PluginConfig;
  envVars: EnvVarDefinition[];
  
  // Lifecycle hooks
  onBeforeInstall?: Hook;
  onInstall: Hook;
  onAfterInstall?: Hook;
  onRemove?: Hook;
  
  // Validation
  validate?: (context: ProjectContext) => ValidationResult;
}
```

### 4. Dependency Resolver

**Responsibility**: Resolve plugin dependencies automatically

**Algorithm**:
```typescript
class DependencyResolver {
  /**
   * Resolves dependencies for selected plugins
   * @returns Ordered list of plugins to install
   */
  resolve(selected: string[]): Plugin[] {
    const graph = this.buildGraph(selected);
    const sorted = this.topologicalSort(graph);
    return this.validateAndReturn(sorted);
  }
  
  private buildGraph(plugins: string[]): DependencyGraph {
    // Build DAG of dependencies
  }
  
  private topologicalSort(graph: DependencyGraph): string[] {
    // Return installation order
  }
  
  private validateAndReturn(sorted: string[]): Plugin[] {
    // Detect cycles, conflicts
    // Return validated plugin list
  }
}
```

**Features**:
- Automatic dependency resolution
- Cycle detection
- Conflict detection
- Version compatibility checking
- Optional dependency handling

### 5. Template Engine

**Responsibility**: Generate code from templates

**Technology**: Handlebars with custom helpers

**Template Types**:

1. **File Templates**: Complete files
   ```handlebars
   // src/{{module}}/{{entity}}.service.ts
   import { Injectable } from '@nestjs/common';
   
   @Injectable()
   export class {{pascalCase entity}}Service {
     {{#if withDatabase}}
     constructor(private db: DatabaseService) {}
     {{/if}}
   }
   ```

2. **Patch Templates**: Partial modifications
   ```typescript
   {
     file: 'src/main.ts',
     operation: 'insert-before',
     anchor: 'app.listen',
     content: 'app.use(middleware);'
   }
   ```

3. **Configuration Templates**: JSON/YAML configs
   ```handlebars
   {
     "features": {
       {{#each plugins}}
       "{{this.id}}": {{toJson this.config}}{{#unless @last}},{{/unless}}
       {{/each}}
     }
   }
   ```

**Custom Helpers**:
- `{{pascalCase name}}` - PascalCase conversion
- `{{camelCase name}}` - camelCase conversion
- `{{kebabCase name}}` - kebab-case conversion
- `{{snakeCase name}}` - snake_case conversion
- `{{toJson obj}}` - JSON serialization
- `{{include partial}}` - Template inclusion

### 6. Output Generator

**Responsibility**: Write files to disk

**Operations**:
- Create new files
- Modify existing files
- Delete files
- Run commands (npm install, git init)
- Set permissions

**Safety Features**:
- Dry-run mode
- Backup before modification
- Transaction support (rollback on error)
- Conflict detection
- User confirmation for overwrites

## Plugin Categories

Plugins are organized into categories for better discoverability:

### Core Plugins (Required)
- `base` - Base Next.js + NestJS setup
- `typescript` - TypeScript configuration
- `turborepo` - Monorepo structure

### Feature Plugins (Optional)
- `orpc` - Type-safe RPC
- `better-auth` - Authentication
- `database` - PostgreSQL + Drizzle
- `redis` - Redis cache
- `email` - Email service
- `file-upload` - File management
- `job-queue` - Bull queue
- `event-system` - Event bus

### Infrastructure Plugins
- `docker` - Docker setup
- `ci-cd` - GitHub Actions
- `monitoring` - Logging and monitoring
- `testing` - Test framework

### UI Plugins
- `shadcn-ui` - UI components
- `tailwind` - Tailwind CSS
- `theme` - Dark mode support

## Data Flow

### Project Initialization Flow

```
1. User Input
   ↓
2. Load Plugin Registry
   ↓
3. Present Feature Selection
   ↓
4. User Selects Features
   ↓
5. Resolve Dependencies
   ↓
6. Show Dependency Tree for Approval
   ↓
7. Generate Project Structure
   ↓
8. Install Base Template
   ↓
9. For each plugin (in dependency order):
   a. Run onBeforeInstall hook
   b. Copy template files
   c. Apply patches
   d. Update configuration
   e. Run onInstall hook
   f. Run onAfterInstall hook
   ↓
10. Install NPM Dependencies
    ↓
11. Run Initial Setup Commands
    ↓
12. Generate Summary Report
    ↓
13. Display Next Steps
```

### Feature Addition Flow (Existing Project)

```
1. Analyze Existing Project
   ↓
2. Detect Installed Plugins
   ↓
3. Present Available Plugins
   ↓
4. User Selects New Features
   ↓
5. Check Compatibility
   ↓
6. Resolve New Dependencies
   ↓
7. Backup Project
   ↓
8. Install New Plugins
   ↓
9. Update Configuration
   ↓
10. Run Post-Install Tasks
    ↓
11. Display Migration Guide
```

## Configuration Management

### Project Manifest

Each project maintains a `.stratum.json` manifest:

```json
{
  "version": "1.0.0",
  "builder": "0.1.0",
  "created": "2024-01-15T10:00:00Z",
  "plugins": {
    "base": { "version": "1.0.0" },
    "orpc": { "version": "1.2.0" },
    "better-auth": { 
      "version": "1.0.0",
      "config": {
        "providers": ["google", "github"]
      }
    },
    "database": { "version": "1.0.0" }
  },
  "custom": {
    "projectName": "My SaaS App",
    "description": "Production-ready SaaS"
  }
}
```

This manifest:
- Tracks installed plugins and versions
- Stores plugin configurations
- Enables reproducible builds
- Supports migration to newer versions

## Error Handling

### Graceful Degradation

The builder handles errors at multiple levels:

1. **Validation Errors**: Before execution
   - Missing dependencies
   - Version conflicts
   - Invalid configuration

2. **Generation Errors**: During execution
   - Template errors
   - File system errors
   - Permission issues

3. **Runtime Errors**: After generation
   - Package installation failures
   - Command execution errors
   - Database connection issues

### Rollback Strategy

If an error occurs during generation:
1. Stop execution immediately
2. Display error details
3. Offer rollback option
4. Restore from backup if confirmed
5. Log error for debugging

## Security Considerations

### Template Security
- Templates are validated before execution
- No arbitrary code execution
- Sandboxed template engine
- Input sanitization

### Dependency Security
- Verify plugin signatures
- Audit dependencies
- Check for vulnerabilities
- Use lock files

### File System Security
- Validate file paths (no path traversal)
- Check permissions before write
- Respect .gitignore patterns
- Secure temporary files

## Performance Optimizations

### Caching Strategy
- Cache plugin registry
- Cache template compilation
- Reuse dependency resolution
- Parallel file operations

### Lazy Loading
- Load plugins on demand
- Defer template parsing
- Progressive dependency resolution

### Progress Feedback
- Real-time progress updates
- Estimated time remaining
- Detailed operation logging
- Cancellation support

## Extensibility Points

The architecture provides multiple extension points:

1. **Custom Plugins**: Create new plugins
2. **Custom Templates**: Override templates
3. **Custom Hooks**: Add lifecycle hooks
4. **Custom Commands**: Add CLI commands
5. **Custom Validators**: Add validation rules
6. **Custom Helpers**: Add template helpers

## Testing Strategy

See [Testing Strategy](./09-TESTING-STRATEGY.md) for details.

## Next Steps

- Review [Plugin System](./02-PLUGIN-SYSTEM.md) for plugin details
- Study [Feature Catalog](./03-FEATURE-CATALOG.md) for available features
- Read [Dependency Resolution](./07-DEPENDENCY-RESOLUTION.md) for dependency handling

---

*This architecture supports the vision of a flexible, production-ready project builder.*
