# Plugin System

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Plugin System

## Overview

The plugin system is the heart of the Stratum Builder. It enables modular, composable features that can be mixed and matched to create custom projects. This document provides comprehensive details on how plugins work, how to create them, and how they interact.

## Plugin Structure

### Basic Plugin Anatomy

```typescript
// packages/builder/src/plugins/orpc/index.ts
import { Plugin, PluginCategory } from '../../types';

export const orpcPlugin: Plugin = {
  // Identity
  id: 'orpc',
  name: 'ORPC Type-Safe RPC',
  description: 'End-to-end type-safe API communication',
  version: '1.0.0',
  category: PluginCategory.Feature,
  
  // Dependencies
  dependencies: ['base', 'typescript'],
  optionalDependencies: ['better-auth'],
  conflicts: ['rest-api', 'graphql'],
  
  // Templates and files
  templates: [
    {
      source: 'templates/orpc',
      destination: '.',
      patterns: ['**/*.ts', '**/*.tsx']
    }
  ],
  
  // Configuration
  config: {
    enableOpenAPI: true,
    enableValidation: true,
    clientPort: 3001
  },
  
  // Environment variables
  envVars: [
    {
      key: 'NEXT_PUBLIC_API_URL',
      value: 'http://localhost:3001',
      description: 'API endpoint URL',
      required: true
    }
  ],
  
  // Lifecycle hooks
  onBeforeInstall: async (context) => {
    // Pre-installation checks
    console.log('Preparing ORPC installation...');
  },
  
  onInstall: async (context) => {
    // Main installation logic
    await installORPCPackages(context);
    await setupORPCRoutes(context);
    await generateTypes(context);
  },
  
  onAfterInstall: async (context) => {
    // Post-installation tasks
    console.log('ORPC installed successfully!');
    console.log('Run `bun run web -- generate` to update types');
  },
  
  // Validation
  validate: async (context) => {
    const errors = [];
    if (!context.hasTypeScript) {
      errors.push('TypeScript is required for ORPC');
    }
    return { valid: errors.length === 0, errors };
  }
};
```

### Plugin Directory Structure

```
packages/builder/src/plugins/orpc/
├── index.ts                 # Plugin definition
├── templates/               # Template files
│   ├── api/
│   │   ├── contracts/
│   │   │   └── user.contract.ts
│   │   └── controllers/
│   │       └── user.controller.ts
│   └── web/
│       └── hooks/
│           └── useUser.ts
├── patches/                 # File modifications
│   ├── api-main.patch.ts
│   └── web-app.patch.ts
├── scripts/                 # Helper scripts
│   ├── setup.ts
│   └── validate.ts
├── config/                  # Default configs
│   └── orpc.config.ts
└── README.md               # Plugin documentation
```

## Plugin Types

### 1. Core Plugins

Essential plugins required for every project.

**Example: Base Plugin**
```typescript
export const basePlugin: Plugin = {
  id: 'base',
  name: 'Base Template',
  description: 'Next.js + NestJS foundation',
  version: '1.0.0',
  category: PluginCategory.Core,
  dependencies: [],
  
  onInstall: async (context) => {
    // Create monorepo structure
    await createMonorepoStructure(context);
    
    // Setup package.json workspaces
    await setupWorkspaces(context);
    
    // Install base dependencies
    await installBaseDependencies(context);
    
    // Setup Turborepo
    await setupTurborepo(context);
  }
};
```

### 2. Feature Plugins

Optional features that add specific capabilities.

**Example: Better Auth Plugin**
```typescript
export const betterAuthPlugin: Plugin = {
  id: 'better-auth',
  name: 'Better Auth',
  description: 'Modern authentication system',
  version: '1.0.0',
  category: PluginCategory.Feature,
  dependencies: ['base', 'database'],
  optionalDependencies: ['redis', 'email'],
  
  config: {
    providers: [],
    sessionExpiry: '7d',
    enableMFA: false
  },
  
  // Interactive configuration
  configure: async (context) => {
    const answers = await prompts([
      {
        type: 'multiselect',
        name: 'providers',
        message: 'Select auth providers:',
        choices: [
          { title: 'Email/Password', value: 'credentials' },
          { title: 'Google', value: 'google' },
          { title: 'GitHub', value: 'github' },
          { title: 'Microsoft', value: 'microsoft' }
        ]
      },
      {
        type: 'confirm',
        name: 'enableMFA',
        message: 'Enable multi-factor authentication?',
        initial: false
      }
    ]);
    
    return { ...context.config, ...answers };
  },
  
  onInstall: async (context) => {
    // Install Better Auth
    await installAuthPackages(context);
    
    // Setup auth configuration
    await setupAuthConfig(context);
    
    // Create auth tables
    await createAuthTables(context);
    
    // Setup auth routes
    await setupAuthRoutes(context);
    
    // Configure selected providers
    await configureProviders(context);
  }
};
```

### 3. Infrastructure Plugins

Handle deployment, CI/CD, and infrastructure concerns.

**Example: Docker Plugin**
```typescript
export const dockerPlugin: Plugin = {
  id: 'docker',
  name: 'Docker Setup',
  description: 'Docker and Docker Compose configuration',
  version: '1.0.0',
  category: PluginCategory.Infrastructure,
  dependencies: ['base'],
  
  config: {
    nodeVersion: '20',
    includeRedis: false,
    includePostgres: false,
    productionOptimized: true
  },
  
  onInstall: async (context) => {
    // Generate Dockerfiles
    await generateDockerfiles(context);
    
    // Create docker-compose.yml files
    await createDockerComposeFiles(context);
    
    // Setup .dockerignore
    await setupDockerIgnore(context);
    
    // Create development configurations
    await setupDevConfigs(context);
    
    // Create production configurations
    await setupProdConfigs(context);
  }
};
```

### 4. UI Plugins

Handle user interface components and styling.

**Example: Shadcn UI Plugin**
```typescript
export const shadcnPlugin: Plugin = {
  id: 'shadcn-ui',
  name: 'Shadcn UI',
  description: 'Beautiful UI components',
  version: '1.0.0',
  category: PluginCategory.UI,
  dependencies: ['base', 'tailwind'],
  
  config: {
    components: [],
    theme: 'default',
    darkMode: true
  },
  
  configure: async (context) => {
    const { components } = await prompts({
      type: 'multiselect',
      name: 'components',
      message: 'Select components to include:',
      choices: [
        { title: 'Button', value: 'button' },
        { title: 'Card', value: 'card' },
        { title: 'Dialog', value: 'dialog' },
        { title: 'Form', value: 'form' },
        { title: 'Input', value: 'input' },
        { title: 'Select', value: 'select' },
        { title: 'All Components', value: 'all' }
      ]
    });
    
    return { ...context.config, components };
  },
  
  onInstall: async (context) => {
    // Setup shadcn-ui
    await setupShadcn(context);
    
    // Install selected components
    await installComponents(context);
    
    // Setup theme configuration
    await setupTheme(context);
  }
};
```

## Plugin Lifecycle

### Installation Lifecycle

```typescript
// 1. Validation Phase
await plugin.validate?.(context);

// 2. Configuration Phase
const config = await plugin.configure?.(context);
context.config = { ...context.config, ...config };

// 3. Pre-installation Phase
await plugin.onBeforeInstall?.(context);

// 4. Installation Phase (Main)
await plugin.onInstall(context);

// 5. Post-installation Phase
await plugin.onAfterInstall?.(context);

// 6. Verification Phase
await verifyInstallation(plugin, context);
```

### Hook Details

#### onBeforeInstall

Runs before the main installation. Use for:
- Validation checks
- Dependency verification
- Backup creation
- User confirmations

```typescript
onBeforeInstall: async (context) => {
  // Check if required services are available
  if (await isPostgresRunning()) {
    console.log('✓ PostgreSQL is running');
  } else {
    throw new Error('PostgreSQL must be running');
  }
  
  // Backup existing files
  await backupFiles(context, ['src/auth.ts', 'src/database.ts']);
}
```

#### onInstall

Main installation logic. Use for:
- Copying template files
- Installing packages
- Running setup scripts
- Creating database schemas

```typescript
onInstall: async (context) => {
  // Copy templates
  await copyTemplates(context, plugin.templates);
  
  // Install NPM packages
  await installPackages(context, [
    'better-auth',
    '@thallesp/nestjs-better-auth'
  ]);
  
  // Run database migrations
  await runMigrations(context);
  
  // Generate types
  await generateTypes(context);
}
```

#### onAfterInstall

Runs after installation. Use for:
- Cleanup tasks
- Final configuration
- User instructions
- Next steps

```typescript
onAfterInstall: async (context) => {
  // Display success message
  console.log('✓ Better Auth installed successfully!');
  
  // Show next steps
  console.log('\nNext steps:');
  console.log('1. Configure auth providers in .env');
  console.log('2. Run database migrations');
  console.log('3. Start the development server');
  
  // Create getting started guide
  await createGettingStartedGuide(context);
}
```

#### onRemove

Runs when removing a plugin. Use for:
- Cleaning up files
- Removing packages
- Database cleanup
- Configuration removal

```typescript
onRemove: async (context) => {
  // Remove plugin files
  await removeFiles(context, plugin.files);
  
  // Remove packages
  await removePackages(context, plugin.packages);
  
  // Clean up database
  await cleanupDatabase(context);
  
  // Update configuration
  await removeConfiguration(context, plugin.id);
}
```

## Template System

### Template Types

#### 1. Full File Templates

Complete files written from scratch:

```typescript
// Template: templates/orpc/api/user.controller.ts
templates: [
  {
    source: 'templates/orpc/api/user.controller.ts',
    destination: 'apps/api/src/user/user.controller.ts',
    variables: {
      entityName: 'User',
      withAuth: true
    }
  }
]
```

```handlebars
// user.controller.ts
import { Controller } from '@nestjs/common';
import { ORPCRoute } from '@orpc/nest';
import { {{pascalCase entityName}}Service } from './{{kebabCase entityName}}.service';
{{#if withAuth}}
import { AuthGuard } from '../auth/auth.guard';
{{/if}}

@Controller('{{kebabCase entityName}}')
{{#if withAuth}}
@UseGuards(AuthGuard)
{{/if}}
export class {{pascalCase entityName}}Controller {
  constructor(
    private readonly {{camelCase entityName}}Service: {{pascalCase entityName}}Service
  ) {}
  
  @ORPCRoute()
  async findAll() {
    return this.{{camelCase entityName}}Service.findAll();
  }
}
```

#### 2. Patch Templates

Modify existing files:

```typescript
patches: [
  {
    file: 'apps/api/src/main.ts',
    operations: [
      {
        type: 'insert-before',
        anchor: 'app.listen',
        content: `
  // Setup ORPC middleware
  app.use('/api', orpcMiddleware());
`
      },
      {
        type: 'import',
        module: '@orpc/nest',
        imports: ['orpcMiddleware']
      }
    ]
  }
]
```

#### 3. Configuration Templates

Generate configuration files:

```typescript
// Generate tsconfig.json
templates: [
  {
    source: 'templates/tsconfig.json.hbs',
    destination: 'tsconfig.json',
    type: 'json'
  }
]
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    {{#if strictMode}}
    "strict": true,
    {{/if}}
    "paths": {
      {{#each aliases}}
      "{{@key}}": ["{{this}}"]{{#unless @last}},{{/unless}}
      {{/each}}
    }
  }
}
```

### Template Variables

Plugins can provide variables for templates:

```typescript
onInstall: async (context) => {
  const variables = {
    projectName: context.projectName,
    entityName: 'User',
    withAuth: context.hasPlugin('better-auth'),
    dbType: context.config.database.type,
    apiPort: context.config.api.port,
    // Custom helpers
    features: context.installedPlugins.map(p => p.id)
  };
  
  await renderTemplates(context, plugin.templates, variables);
}
```

### Template Helpers

Custom Handlebars helpers for code generation:

```typescript
// Built-in helpers
{{pascalCase 'user-profile'}}    // UserProfile
{{camelCase 'user-profile'}}     // userProfile
{{kebabCase 'UserProfile'}}      // user-profile
{{snakeCase 'UserProfile'}}      // user_profile
{{upperCase 'hello'}}            // HELLO
{{lowerCase 'HELLO'}}            // hello

// Conditional helpers
{{#if hasAuth}}...{{/if}}
{{#unless hasAuth}}...{{/unless}}
{{#each items}}...{{/each}}

// Custom helpers
{{toJson object}}                // JSON.stringify(object, null, 2)
{{timestamp}}                    // new Date().toISOString()
{{uuid}}                         // crypto.randomUUID()
{{relativePath from to}}         // Path relative calculation
```

## Plugin Configuration

### Static Configuration

Define default configuration:

```typescript
config: {
  // Scalar values
  enabled: true,
  port: 3001,
  timeout: 5000,
  
  // Arrays
  providers: ['google', 'github'],
  
  // Objects
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp'
  }
}
```

### Dynamic Configuration

Interactive configuration prompts:

```typescript
configure: async (context) => {
  const answers = await prompts([
    // Text input
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: context.projectName
    },
    
    // Select
    {
      type: 'select',
      name: 'database',
      message: 'Select database:',
      choices: [
        { title: 'PostgreSQL', value: 'postgres' },
        { title: 'MySQL', value: 'mysql' },
        { title: 'SQLite', value: 'sqlite' }
      ]
    },
    
    // Multi-select
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select features:',
      choices: [
        { title: 'Authentication', value: 'auth' },
        { title: 'File Upload', value: 'upload' },
        { title: 'Email', value: 'email' }
      ]
    },
    
    // Confirm
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      initial: true
    },
    
    // Number
    {
      type: 'number',
      name: 'port',
      message: 'API port:',
      initial: 3001,
      min: 1024,
      max: 65535
    }
  ]);
  
  return answers;
}
```

### Environment Variables

Define required environment variables:

```typescript
envVars: [
  // Required variable
  {
    key: 'DATABASE_URL',
    value: 'postgresql://user:password@localhost:5432/myapp',
    description: 'PostgreSQL connection string',
    required: true,
    validate: (value) => {
      return value.startsWith('postgresql://');
    }
  },
  
  // Optional variable
  {
    key: 'REDIS_URL',
    value: 'redis://localhost:6379',
    description: 'Redis connection string',
    required: false
  },
  
  // Variable with dynamic value
  {
    key: 'NEXT_PUBLIC_API_URL',
    value: (context) => `http://localhost:${context.config.api.port}`,
    description: 'Public API URL',
    required: true
  }
]
```

## Plugin Dependencies

### Declaring Dependencies

```typescript
{
  // Required dependencies (must be installed)
  dependencies: ['base', 'typescript', 'database'],
  
  // Optional dependencies (enhance functionality)
  optionalDependencies: ['redis', 'email'],
  
  // Conflicting plugins (cannot coexist)
  conflicts: ['rest-api', 'graphql'],
  
  // Peer dependencies (version requirements)
  peerDependencies: {
    'better-auth': '^1.0.0',
    'drizzle-orm': '^0.30.0'
  }
}
```

### Dependency Resolution

The builder automatically:

1. **Resolves transitive dependencies**
   ```
   User selects: [better-auth]
   Resolved: [base, typescript, database, better-auth]
   ```

2. **Detects conflicts**
   ```
   User selects: [rest-api, graphql]
   Error: Plugins 'rest-api' and 'graphql' conflict
   ```

3. **Suggests optional dependencies**
   ```
   Installing: better-auth
   Suggestion: Install 'redis' for session caching?
   ```

4. **Validates versions**
   ```
   better-auth requires drizzle-orm ^0.30.0
   Found: drizzle-orm 0.29.0
   Action: Upgrade drizzle-orm to 0.30.0
   ```

## Plugin Context

Plugins receive a context object with project information:

```typescript
interface PluginContext {
  // Project info
  projectName: string;
  projectPath: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  
  // Installed plugins
  installedPlugins: Plugin[];
  currentPlugin: Plugin;
  
  // Configuration
  config: Record<string, any>;
  envVars: Record<string, string>;
  
  // Helpers
  hasPlugin(id: string): boolean;
  getPlugin(id: string): Plugin | undefined;
  getConfig(key: string): any;
  setConfig(key: string, value: any): void;
  
  // File operations
  copyFile(source: string, dest: string): Promise<void>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  
  // Template operations
  renderTemplate(template: string, vars: any): string;
  copyTemplate(source: string, dest: string, vars: any): Promise<void>;
  
  // Package operations
  installPackages(packages: string[]): Promise<void>;
  removePackages(packages: string[]): Promise<void>;
  
  // Command execution
  exec(command: string): Promise<{ stdout: string; stderr: string }>;
  
  // Logging
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
}
```

## Plugin Testing

### Unit Tests

Test individual plugin logic:

```typescript
describe('ORPC Plugin', () => {
  let context: PluginContext;
  
  beforeEach(() => {
    context = createTestContext();
  });
  
  it('should install ORPC packages', async () => {
    await orpcPlugin.onInstall(context);
    
    expect(context.installedPackages).toContain('@orpc/server');
    expect(context.installedPackages).toContain('@orpc/client');
  });
  
  it('should validate TypeScript dependency', async () => {
    context.installedPlugins = [];
    
    const result = await orpcPlugin.validate(context);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('TypeScript is required');
  });
});
```

### Integration Tests

Test plugin installation in real projects:

```typescript
describe('ORPC Plugin Integration', () => {
  let testProject: string;
  
  beforeEach(async () => {
    testProject = await createTestProject();
  });
  
  afterEach(async () => {
    await cleanupTestProject(testProject);
  });
  
  it('should create working ORPC setup', async () => {
    const builder = new StratumBuilder();
    await builder.installPlugins(testProject, ['base', 'orpc']);
    
    // Verify files exist
    expect(await fileExists(`${testProject}/apps/api/src/orpc`)).toBe(true);
    
    // Verify project builds
    const result = await exec('bun run build', { cwd: testProject });
    expect(result.code).toBe(0);
    
    // Verify types are generated
    expect(await fileExists(`${testProject}/apps/web/src/lib/api.ts`)).toBe(true);
  });
});
```

## Best Practices

### 1. Keep Plugins Focused
Each plugin should do one thing well. Split complex features into multiple plugins.

### 2. Document Everything
Provide clear README for each plugin with examples and configuration options.

### 3. Version Carefully
Use semantic versioning and maintain compatibility.

### 4. Test Thoroughly
Write comprehensive tests for all plugin functionality.

### 5. Handle Errors Gracefully
Provide helpful error messages and recovery strategies.

### 6. Use Idempotent Operations
Plugins should be safely re-runnable.

### 7. Respect User Choices
Allow configuration and don't force opinions.

### 8. Provide Examples
Include working examples in plugin documentation.

## Next Steps

- Review [Feature Catalog](./03-FEATURE-CATALOG.md) for available plugins
- Study [Code Generation](./08-CODE-GENERATION.md) for template details
- Read [Extension Guide](./11-EXTENSION-GUIDE.md) to create plugins

---

*The plugin system enables infinite extensibility while maintaining consistency.*
