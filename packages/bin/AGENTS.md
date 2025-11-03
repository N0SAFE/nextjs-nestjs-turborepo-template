# AGENTS.md — Bin Package Development Guide

This file defines how to develop CLI tools (bin packages) in this repository using NestJS and nest-commander.

## Architecture Pattern

All bin packages MUST follow the NestJS + nest-commander pattern for consistency, testability, and maintainability.

### Why NestJS + nest-commander?

1. **Dependency Injection**: Leverage NestJS's powerful DI system for better testing and modularity
2. **Service-Command Pattern**: Separate business logic (services) from CLI interface (commands)
3. **Type Safety**: Full TypeScript support with decorators and metadata
4. **Testability**: Easy to unit test commands and services independently
5. **Consistency**: Same patterns as the API application
6. **Official Support**: nest-commander is the official NestJS CLI framework

## Creating a New Bin Package

When creating a new bin package, follow this scaffolding process:

### 1. Initialize NestJS Project

```bash
# Navigate to packages/bin directory
cd packages/bin

# Create new NestJS application using Bun
bun x nest new your-cli-name

# Choose 'bun' as your package manager when prompted
```

### 2. Configure for CLI Usage

After scaffolding, update the generated files:

**Update package.json**:

**Update package.json**:

```json
{
  "name": "@repo-bin/your-cli-name",
  "version": "1.0.0",
  "description": "Description of your CLI tool",
  "type": "module",
  "main": "src/main.ts",
  "bin": {
    "your-cli-name": "./dist/main.js"
  },
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "dev": "nest start --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@nestjs/common": "catalog:nestjs",
    "@nestjs/core": "catalog:nestjs",
    "nest-commander": "catalog:utils",
    "reflect-metadata": "catalog:utils"
  },
  "devDependencies": {
    "@nestjs/cli": "catalog:nestjs",
    "@nestjs/schematics": "catalog:nestjs",
    "@nestjs/testing": "catalog:nestjs",
    "@repo-configs/typescript": "*",
    "@repo-configs/vitest": "*",
    "@types/node": "catalog:build",
    "typescript": "catalog:build",
    "vitest": "catalog:testing"
  }
}
```

### 3. Install nest-commander

```bash
# Add nest-commander for CLI functionality
bun add nest-commander
```

### 4. Update NestJS Configuration Files

**nest-cli.json**:
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": false,
    "tsConfigPath": "tsconfig.build.json"
  }
}
```

**tsconfig.json**:
```json
{
  "extends": "@repo-configs/typescript/config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020",
    "lib": ["ES2020"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**tsconfig.build.json**:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/__tests__/**"]
}
```

### 5. Implement the Service-Command Pattern

**src/services/your-service.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class YourService {
  async execute(options: YourOptions): Promise<void> {
    // Business logic here
    console.log('Executing service logic...');
  }
}

interface YourOptions {
  // Define your options
}
```

**src/commands/your.command.ts**:
```typescript
import { Command, CommandRunner, Option } from 'nest-commander';
import { YourService } from '../services/your-service.service';

interface YourCommandOptions {
  option1?: string;
  option2?: number;
}

@Command({
  name: 'your-command',
  description: 'Description of what your command does',
})
export class YourCommand extends CommandRunner {
  constructor(private readonly yourService: YourService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: YourCommandOptions,
  ): Promise<void> {
    await this.yourService.execute({
      option1: options?.option1,
      option2: options?.option2,
    });
  }

  @Option({
    flags: '-o, --option1 <value>',
    description: 'Description of option1',
  })
  parseOption1(val: string): string {
    return val;
  }

  @Option({
    flags: '-n, --option2 <number>',
    description: 'Description of option2',
  })
  parseOption2(val: string): number {
    return parseInt(val, 10);
  }
}
```

**src/app.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { YourCommand } from './commands/your.command';
import { YourService } from './services/your-service.service';

@Module({
  providers: [YourCommand, YourService],
})
export class AppModule {}
```

**src/main.ts**:
```typescript
#!/usr/bin/env bun
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
}

bootstrap();
```

### 6. Add Shebang and Make Executable

After building, add shebang to `dist/main.js`:
```bash
#!/usr/bin/env node
```

Make it executable:
```bash
chmod +x dist/main.js
```

Or use a build script to automate this:

**scripts/build.ts**:
```typescript
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';

// Build with NestJS
execSync('nest build', { stdio: 'inherit' });

// Add shebang to main.js
const mainPath = join(process.cwd(), 'dist', 'main.js');
const content = readFileSync(mainPath, 'utf8');

if (!content.startsWith('#!/usr/bin/env')) {
  writeFileSync(mainPath, `#!/usr/bin/env node\n${content}`);
  chmodSync(mainPath, 0o755);
  console.log('✅ Added shebang and made executable');
}
```

Update package.json scripts:
```json
{
  "scripts": {
    "build": "bun run scripts/build.ts"
  }
}
```

### 7. Write Tests

**src/services/__tests__/your-service.service.test.ts**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from '../your-service.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute successfully', async () => {
    // Test your service logic
    const result = await service.execute({ /* options */ });
    expect(result).toBeDefined();
  });
});
```

**src/commands/__tests__/your.command.test.ts**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { YourCommand } from '../your.command';
import { YourService } from '../../services/your-service.service';

describe('YourCommand', () => {
  let command: YourCommand;
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourCommand,
        {
          provide: YourService,
          useValue: {
            execute: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    command = module.get<YourCommand>(YourCommand);
    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  it('should call service with correct options', async () => {
    await command.run([], { option1: 'test', option2: 123 });
    
    expect(service.execute).toHaveBeenCalledWith({
      option1: 'test',
      option2: 123,
    });
  });
});
```

## Best Practices

### 1. Separation of Concerns
- **Commands**: Handle CLI input/output and option parsing
- **Services**: Contain business logic and can be reused
- **Modules**: Organize related commands and services

### 2. Dependency Injection
```typescript
// ✅ GOOD: Use DI
@Command({ name: 'example' })
export class ExampleCommand extends CommandRunner {
  constructor(
    private readonly someService: SomeService,
    private readonly anotherService: AnotherService,
  ) {
    super();
  }
}

// ❌ BAD: Direct instantiation
@Command({ name: 'example' })
export class ExampleCommand extends CommandRunner {
  private someService = new SomeService();
}
```

### 3. Error Handling
```typescript
async run(params: string[], options?: Options): Promise<void> {
  try {
    await this.service.execute(options);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
```

### 4. Input Validation
```typescript
@Option({
  flags: '-p, --port <number>',
  description: 'Port number',
})
parsePort(val: string): number {
  const port = parseInt(val, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }
  return port;
}
```

### 5. Async Operations
Always use async/await for asynchronous operations:
```typescript
async run(params: string[], options?: Options): Promise<void> {
  await this.service.processAsync();
}
```

## Official Documentation

Refer to the official documentation for advanced usage:

- **NestJS Documentation**: https://docs.nestjs.com/
- **nest-commander Documentation**: https://docs.nestjs.com/recipes/nest-commander
- **nest-commander GitHub**: https://github.com/jmcdo29/nest-commander

## Example Reference

See the existing bin packages in this repository for reference implementations:
- `packages/bin/runthenkill` (basic CLI tool example - to be migrated)

## Migration Guide for Existing Bins

If you have an existing bin package using Commander.js directly:

1. Create NestJS structure as shown above
2. Move logic from main file to services
3. Create command classes using nest-commander decorators
4. Update tests to use NestJS testing utilities
5. Update package.json with new build process
6. Verify the bin still works after migration

## Checklist for New Bin Package

- [ ] Created package directory in `packages/bin/`
- [ ] Installed NestJS and nest-commander dependencies
- [ ] Created nest-cli.json configuration
- [ ] Created proper TypeScript configuration
- [ ] Implemented service with business logic
- [ ] Implemented command with nest-commander decorators
- [ ] Created app.module.ts
- [ ] Created main.ts with CommandFactory
- [ ] Added shebang to built output
- [ ] Made executable (`chmod +x`)
- [ ] Written unit tests for service
- [ ] Written unit tests for command
- [ ] Updated package.json with correct bin entry
- [ ] Tested CLI works as expected
- [ ] Updated this AGENTS.md if needed

## Summary

All bin packages MUST use the NestJS + nest-commander pattern. This ensures:
- Consistent architecture across CLI tools
- Better testability with NestJS testing utilities
- Proper dependency injection
- Type safety with TypeScript decorators
- Maintainable and scalable CLI applications

Do not create bin packages using plain Commander.js or other CLI frameworks.
