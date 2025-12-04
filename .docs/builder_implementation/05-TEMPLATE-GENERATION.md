# Template Generation

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Template Generation

## Overview

Template generation is the core process of creating project files from plugin templates. This document explains how the template engine works, how templates are structured, and how code is generated.

## Template Engine

### Technology Stack

The Stratum Builder uses **Handlebars** as its template engine with custom helpers and extensions.

**Why Handlebars?**
- Logic-less templates (prevents complexity)
- Extensive helper system
- Pre-compilation support
- Wide community adoption
- TypeScript support

### Template Structure

Templates are organized within each plugin:

```
plugins/orpc/
└── templates/
    ├── api/
    │   ├── contracts/
    │   │   └── {{entity}}.contract.ts.hbs
    │   ├── controllers/
    │   │   └── {{entity}}.controller.ts.hbs
    │   └── services/
    │       └── {{entity}}.service.ts.hbs
    ├── web/
    │   └── hooks/
    │       └── use{{pascalCase entity}}.ts.hbs
    └── shared/
        └── types/
            └── {{entity}}.types.ts.hbs
```

## Template Types

### 1. Full File Templates

Complete files generated from scratch.

**Example: Controller Template**

```handlebars
// templates/api/controllers/{{entity}}.controller.ts.hbs
import { Controller } from '@nestjs/common';
import { ORPCRoute } from '@orpc/nest';
import { {{pascalCase entity}}Service } from './{{kebabCase entity}}.service';
{{#if withAuth}}
import { AuthGuard } from '@/auth/auth.guard';
import { CurrentUser } from '@/auth/decorators';
{{/if}}
{{#if withValidation}}
import { {{pascalCase entity}}Schema } from './{{kebabCase entity}}.schema';
{{/if}}

/**
 * {{pascalCase entity}} Controller
 * Handles {{lowerCase entity}} operations
 */
@Controller('{{pluralize (kebabCase entity)}}')
{{#if withAuth}}
@UseGuards(AuthGuard)
{{/if}}
export class {{pascalCase entity}}Controller {
  constructor(
    private readonly {{camelCase entity}}Service: {{pascalCase entity}}Service
  ) {}

  /**
   * Get all {{pluralize (lowerCase entity)}}
   */
  @ORPCRoute()
  async findAll(
    {{#if withAuth}}@CurrentUser() user: User{{/if}}
  ) {
    return this.{{camelCase entity}}Service.findAll({{#if withAuth}}user.id{{/if}});
  }

  /**
   * Get {{lowerCase entity}} by ID
   */
  @ORPCRoute()
  async findOne(
    @Param('id') id: string
    {{#if withAuth}}, @CurrentUser() user: User{{/if}}
  ) {
    return this.{{camelCase entity}}Service.findOne(id{{#if withAuth}}, user.id{{/if}});
  }

  {{#if withCreate}}
  /**
   * Create new {{lowerCase entity}}
   */
  @ORPCRoute()
  async create(
    @Body() data: Create{{pascalCase entity}}Dto
    {{#if withAuth}}, @CurrentUser() user: User{{/if}}
  ) {
    return this.{{camelCase entity}}Service.create(data{{#if withAuth}}, user.id{{/if}});
  }
  {{/if}}

  {{#if withUpdate}}
  /**
   * Update {{lowerCase entity}}
   */
  @ORPCRoute()
  async update(
    @Param('id') id: string,
    @Body() data: Update{{pascalCase entity}}Dto
    {{#if withAuth}}, @CurrentUser() user: User{{/if}}
  ) {
    return this.{{camelCase entity}}Service.update(id, data{{#if withAuth}}, user.id{{/if}});
  }
  {{/if}}

  {{#if withDelete}}
  /**
   * Delete {{lowerCase entity}}
   */
  @ORPCRoute()
  async remove(
    @Param('id') id: string
    {{#if withAuth}}, @CurrentUser() user: User{{/if}}
  ) {
    return this.{{camelCase entity}}Service.remove(id{{#if withAuth}}, user.id{{/if}});
  }
  {{/if}}
}
```

**Variables**:
```typescript
{
  entity: 'user',
  withAuth: true,
  withValidation: true,
  withCreate: true,
  withUpdate: true,
  withDelete: true
}
```

**Output**:
```typescript
// apps/api/src/user/user.controller.ts
import { Controller } from '@nestjs/common';
import { ORPCRoute } from '@orpc/nest';
import { UserService } from './user.service';
import { AuthGuard } from '@/auth/auth.guard';
import { CurrentUser } from '@/auth/decorators';
import { UserSchema } from './user.schema';

/**
 * User Controller
 * Handles user operations
 */
@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService
  ) {}

  /**
   * Get all users
   */
  @ORPCRoute()
  async findAll(@CurrentUser() user: User) {
    return this.userService.findAll(user.id);
  }

  // ... more methods
}
```

### 2. Patch Templates

Modify existing files by inserting, replacing, or removing code.

**Example: Main.ts Patch**

```typescript
// patches/api-main.patch.ts
export const patchApiMain = {
  file: 'apps/api/src/main.ts',
  operations: [
    // Import statement
    {
      type: 'import',
      module: '@orpc/nest',
      imports: ['ORPCModule', 'orpcMiddleware']
    },
    
    // Insert before app.listen
    {
      type: 'insert-before',
      anchor: 'app.listen',
      content: `
  // Setup ORPC middleware
  app.use('/api/orpc', orpcMiddleware({
    router: app.get(ORPCModule).router
  }));
`
    },
    
    // Replace existing code
    {
      type: 'replace',
      pattern: /app\.enableCors\(\)/,
      replacement: `app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
  })`
    },
    
    // Insert in module imports
    {
      type: 'insert-in-array',
      array: 'imports',
      module: 'AppModule',
      value: 'ORPCModule.forRoot()'
    }
  ]
};
```

**Patch Application**:
```typescript
// Before
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3001);
}

// After applying patch
import { ORPCModule, orpcMiddleware } from '@orpc/nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
  });
  
  // Setup ORPC middleware
  app.use('/api/orpc', orpcMiddleware({
    router: app.get(ORPCModule).router
  }));
  
  await app.listen(3001);
}
```

### 3. Configuration Templates

Generate configuration files (JSON, YAML, TOML, etc.).

**Example: Docker Compose Template**

```handlebars
# templates/docker-compose.yml.hbs
version: '3.8'

services:
  {{#if hasApi}}
  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
    ports:
      - "{{config.api.port}}:{{config.api.port}}"
    environment:
      - NODE_ENV={{env}}
      - DATABASE_URL=$\{DATABASE_URL}
      {{#if hasRedis}}
      - REDIS_URL=$\{REDIS_URL}
      {{/if}}
    depends_on:
      {{#if hasDatabase}}
      - database
      {{/if}}
      {{#if hasRedis}}
      - redis
      {{/if}}
  {{/if}}

  {{#if hasWeb}}
  web:
    build:
      context: .
      dockerfile: docker/web/Dockerfile
    ports:
      - "{{config.web.port}}:{{config.web.port}}"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:{{config.api.port}}
    depends_on:
      - api
  {{/if}}

  {{#if hasDatabase}}
  database:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB={{config.database.name}}
      - POSTGRES_USER={{config.database.user}}
      - POSTGRES_PASSWORD={{config.database.password}}
    ports:
      - "{{config.database.port}}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  {{/if}}

  {{#if hasRedis}}
  redis:
    image: redis:7-alpine
    ports:
      - "{{config.redis.port}}:6379"
    volumes:
      - redis_data:/data
  {{/if}}

volumes:
  {{#if hasDatabase}}
  postgres_data:
  {{/if}}
  {{#if hasRedis}}
  redis_data:
  {{/if}}
```

### 4. Partial Templates

Reusable template fragments.

**Example: Import Partial**

```handlebars
{{!-- partials/imports.hbs --}}
{{#each imports}}
import { {{join this.items ", "}} } from '{{this.from}}';
{{/each}}
```

**Usage**:
```handlebars
{{> imports imports=dependencies}}

export class MyClass {
  // ...
}
```

## Custom Helpers

### String Manipulation

```typescript
// Case conversion
{{pascalCase 'user-profile'}}    // UserProfile
{{camelCase 'user-profile'}}     // userProfile
{{kebabCase 'UserProfile'}}      // user-profile
{{snakeCase 'UserProfile'}}      // user_profile
{{constantCase 'userProfile'}}   // USER_PROFILE
{{dotCase 'UserProfile'}}        // user.profile

// Text manipulation
{{upperCase 'hello'}}            // HELLO
{{lowerCase 'HELLO'}}            // hello
{{capitalize 'hello world'}}     // Hello world
{{titleCase 'hello world'}}      // Hello World
{{pluralize 'user'}}             // users
{{singularize 'users'}}          // user
{{truncate 'long text' 10}}      // long te...
```

### Conditional Helpers

```handlebars
{{#if condition}}
  True branch
{{else}}
  False branch
{{/if}}

{{#unless condition}}
  Inverted condition
{{/unless}}

{{#eq value 'test'}}
  Equal
{{/eq}}

{{#ne value 'test'}}
  Not equal
{{/ne}}

{{#gt value 5}}
  Greater than
{{/gt}}

{{#lt value 5}}
  Less than
{{/lt}}

{{#or condition1 condition2}}
  OR logic
{{/or}}

{{#and condition1 condition2}}
  AND logic
{{/and}}
```

### Iteration Helpers

```handlebars
{{#each items}}
  {{@index}} - {{this.name}}
  {{#if @first}}First item{{/if}}
  {{#if @last}}Last item{{/if}}
{{/each}}

{{#each items as |item index|}}
  {{index}}: {{item.name}}
{{/each}}

{{#times 5}}
  Repeat {{@index}}
{{/times}}
```

### Array Helpers

```typescript
{{join array ", "}}              // Join with separator
{{length array}}                 // Array length
{{first array}}                  // First element
{{last array}}                   // Last element
{{filter array 'active'}}        // Filter by property
{{map array 'name'}}             // Map to property
{{sort array 'name'}}            // Sort by property
{{reverse array}}                // Reverse array
{{unique array}}                 // Remove duplicates
```

### Object Helpers

```typescript
{{toJson object}}                // JSON.stringify
{{keys object}}                  // Object.keys
{{values object}}                // Object.values
{{get object 'path.to.value'}}   // Get nested value
{{has object 'property'}}        // Check property exists
```

### Path Helpers

```typescript
{{relativePath from to}}         // Relative path
{{dirname path}}                 // Directory name
{{basename path}}                // Base name
{{extname path}}                 // Extension
{{join path1 path2}}            // Join paths
```

### Date Helpers

```typescript
{{now}}                          // Current timestamp
{{timestamp}}                    // ISO timestamp
{{date format='YYYY-MM-DD'}}    // Formatted date
{{dateAdd 7 'days'}}            // Date arithmetic
```

### Utility Helpers

```typescript
{{uuid}}                         // Generate UUID
{{random 1 100}}                 // Random number
{{default value 'fallback'}}     // Default value
{{debug variable}}               // Debug output
```

## Generation Process

### Step 1: Template Discovery

```typescript
class TemplateEngine {
  async discoverTemplates(plugin: Plugin): Promise<Template[]> {
    const templateDir = path.join(plugin.path, 'templates');
    const templates = await this.scanDirectory(templateDir);
    
    return templates.map(file => ({
      source: file,
      destination: this.resolveDestination(file, plugin),
      variables: plugin.templateVariables || {}
    }));
  }
}
```

### Step 2: Variable Resolution

```typescript
async resolveVariables(
  context: PluginContext,
  plugin: Plugin
): Promise<Record<string, any>> {
  const variables = {
    // Project info
    projectName: context.projectName,
    projectPath: context.projectPath,
    
    // Plugin config
    ...plugin.config,
    
    // Installed plugins
    hasAuth: context.hasPlugin('better-auth'),
    hasDatabase: context.hasPlugin('database'),
    hasRedis: context.hasPlugin('redis'),
    
    // Environment
    env: process.env.NODE_ENV || 'development',
    
    // Custom variables from plugin
    ...await plugin.getVariables?.(context)
  };
  
  return variables;
}
```

### Step 3: Template Rendering

```typescript
async renderTemplate(
  template: Template,
  variables: Record<string, any>
): Promise<string> {
  // Load template
  const source = await fs.readFile(template.source, 'utf-8');
  
  // Compile with Handlebars
  const compiled = Handlebars.compile(source, {
    strict: true,
    noEscape: false
  });
  
  // Render with variables
  const rendered = compiled(variables);
  
  // Post-process (format, lint)
  return await this.postProcess(rendered, template);
}
```

### Step 4: File Writing

```typescript
async writeTemplate(
  template: Template,
  content: string,
  context: PluginContext
): Promise<void> {
  const destination = this.resolveDestination(template, context);
  
  // Create directory if needed
  await fs.ensureDir(path.dirname(destination));
  
  // Check for conflicts
  if (await fs.pathExists(destination)) {
    const action = await this.handleConflict(destination, content);
    if (action === 'skip') return;
  }
  
  // Write file
  await fs.writeFile(destination, content, 'utf-8');
  
  // Set permissions if needed
  if (template.executable) {
    await fs.chmod(destination, 0o755);
  }
  
  // Log
  context.log(`Created: ${destination}`);
}
```

### Step 5: Post-Processing

```typescript
async postProcess(
  content: string,
  template: Template
): Promise<string> {
  let processed = content;
  
  // Remove empty lines
  processed = processed.replace(/^\s*[\r\n]/gm, '');
  
  // Fix indentation
  processed = await this.fixIndentation(processed);
  
  // Format code
  if (template.format !== false) {
    processed = await this.formatCode(processed, template);
  }
  
  // Lint code
  if (template.lint !== false) {
    const issues = await this.lintCode(processed, template);
    if (issues.length > 0) {
      this.warn(`Linting issues in ${template.destination}:`, issues);
    }
  }
  
  return processed;
}
```

## Conflict Resolution

When a file already exists:

```typescript
enum ConflictAction {
  OVERWRITE = 'overwrite',  // Replace existing file
  SKIP = 'skip',            // Keep existing file
  MERGE = 'merge',          // Merge content
  DIFF = 'diff',            // Show diff and prompt
  BACKUP = 'backup'         // Backup and replace
}

async handleConflict(
  file: string,
  newContent: string
): Promise<ConflictAction> {
  const existing = await fs.readFile(file, 'utf-8');
  
  // If content is identical, skip
  if (existing === newContent) {
    return ConflictAction.SKIP;
  }
  
  // Show diff
  const diff = this.createDiff(existing, newContent);
  console.log(diff);
  
  // Prompt user
  const answer = await prompts({
    type: 'select',
    name: 'action',
    message: `File ${file} exists. What to do?`,
    choices: [
      { title: 'Overwrite', value: ConflictAction.OVERWRITE },
      { title: 'Skip', value: ConflictAction.SKIP },
      { title: 'Merge', value: ConflictAction.MERGE },
      { title: 'Backup and overwrite', value: ConflictAction.BACKUP }
    ]
  });
  
  if (answer.action === ConflictAction.BACKUP) {
    await this.createBackup(file);
  }
  
  return answer.action;
}
```

## Template Testing

### Unit Tests

```typescript
describe('Template Rendering', () => {
  it('should render controller template', async () => {
    const template = await loadTemplate('api/controller.ts.hbs');
    const variables = {
      entity: 'user',
      withAuth: true
    };
    
    const result = await renderTemplate(template, variables);
    
    expect(result).toContain('export class UserController');
    expect(result).toContain('@UseGuards(AuthGuard)');
  });
  
  it('should handle conditional blocks', async () => {
    const template = '{{#if withAuth}}Auth{{else}}No Auth{{/if}}';
    
    expect(await render(template, { withAuth: true })).toBe('Auth');
    expect(await render(template, { withAuth: false })).toBe('No Auth');
  });
});
```

### Integration Tests

```typescript
describe('Template Generation', () => {
  it('should generate valid TypeScript', async () => {
    const plugin = await loadPlugin('orpc');
    const context = createTestContext();
    
    await generateTemplates(plugin, context);
    
    // Verify TypeScript compiles
    const result = await exec('tsc --noEmit', { cwd: context.projectPath });
    expect(result.code).toBe(0);
  });
});
```

## Best Practices

### 1. Keep Templates Simple
- Minimal logic in templates
- Move complex logic to helpers
- Use partials for reusability

### 2. Consistent Naming
- Use descriptive template names
- Follow file naming conventions
- Use `.hbs` extension for Handlebars

### 3. Document Templates
- Add comments explaining template purpose
- Document required variables
- Provide example output

### 4. Test Thoroughly
- Test all conditional branches
- Test edge cases
- Verify generated code compiles

### 5. Handle Errors Gracefully
- Validate variables before rendering
- Provide helpful error messages
- Support dry-run mode

## Next Steps

- Review [Code Generation](./08-CODE-GENERATION.md) for advanced patterns
- Study [Testing Strategy](./09-TESTING-STRATEGY.md) for testing templates
- Read [Extension Guide](./11-EXTENSION-GUIDE.md) for creating templates

---

*Template generation is the foundation of the builder's code generation capabilities.*
