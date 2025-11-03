# AGENTS.md — MCP Repo Manager

This MCP server provides tools and resources for managing the monorepo structure, creating new packages, and running repository-wide commands.

## Overview

The `@repo/mcp-repo` package is an MCP (Model Context Protocol) server built with NestJS and `@rekog/mcp-nest`. It exposes tools and resources to help manage the monorepo effectively.

## Architecture

### Technology Stack

- **NestJS**: Application framework with dependency injection
- **@rekog/mcp-nest**: MCP server integration for NestJS
- **Zod v4**: Schema validation for tool inputs
- **Bun**: Runtime and package manager
- **TypeScript**: Type-safe implementation

### Structure

```
src/
├── main.ts              # MCP server entry point with STDIO transport
├── app.module.ts        # Main module configuration
├── services/            # Business logic services
│   ├── package.service.ts
│   ├── command.service.ts
│   └── scaffold.service.ts
└── tools/               # MCP tool providers
    ├── package.tools.ts
    ├── command.tools.ts
    └── scaffold.tools.ts
```

## Available Tools

### Package Management Tools

Tools for managing packages in the monorepo:

- **list-packages**: List all packages with metadata
- **get-package-info**: Get detailed info about a specific package
- **create-package**: Scaffold a new package with type (config, bin, mcp, ui, contracts, etc.)
- **update-package**: Update package.json fields
- **delete-package**: Remove a package from the monorepo

### Command Tools

Tools for running repository-wide commands:

- **run-eslint**: Run ESLint on specified packages or entire repo
- **run-prettier**: Format code with Prettier
- **run-typecheck**: Run TypeScript type checking
- **run-tests**: Execute tests with Vitest
- **run-build**: Build packages
- **run-clean**: Clean build artifacts

### Scaffold Tools

Tools for scaffolding new structures:

- **scaffold-config-package**: Create a new config package
- **scaffold-bin-package**: Create a new bin (CLI) package with NestJS + nest-commander
- **scaffold-mcp-package**: Create a new MCP server package
- **scaffold-ui-package**: Create a new UI component package
- **scaffold-contracts-package**: Create a new API contracts package
- **scaffold-types-package**: Create a new types package

## Development

### Running the MCP Server

```bash
# Development with MCP Inspector (recommended)
bun run dev

# Production mode
bun run start:prod

# Build
bun run build
```

### Testing

```bash
# Run tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage
```

### Type Checking

```bash
bun run type-check
```

## Tool Implementation Pattern

All tools follow this pattern using `@rekog/mcp-nest` decorators:

```typescript
import { McpTool } from '@rekog/mcp-nest';
import { z } from 'zod';

@McpTool({
  name: 'tool-name',
  description: 'Description of what the tool does',
  schema: z.object({
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional().describe('Optional parameter'),
  }),
})
async toolName(input: z.infer<typeof schema>) {
  // Implementation
  return {
    content: [
      {
        type: 'text',
        text: 'Result of the operation',
      },
    ],
  };
}
```

## Service Pattern

Services contain the business logic:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  async doSomething(param: string): Promise<Result> {
    // Business logic here
    return result;
  }
}
```

## Adding New Tools

1. Create a new service in `src/services/` if needed
2. Create a new tools provider in `src/tools/`
3. Use `@McpTool()` decorator with Zod schema
4. Register the provider in `app.module.ts`
5. Test the tool with MCP Inspector

## Best Practices

1. **Validation**: Always use Zod schemas for input validation
2. **Error Handling**: Catch and format errors appropriately
3. **Documentation**: Include detailed descriptions in tool schemas
4. **Type Safety**: Leverage TypeScript for type checking
5. **Testing**: Write tests for all services and tools
6. **Separation**: Keep business logic in services, tool interface in providers

## Configuration

The MCP server is configured in `app.module.ts`:

```typescript
McpModule.forRoot({
  name: 'repo-manager',
  version: '1.0.0',
  transport: McpTransportType.STDIO,
})
```

## Resources

- [@rekog/mcp-nest Documentation](https://github.com/rekog/mcp-nest)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [NestJS Documentation](https://docs.nestjs.com)
- [Zod Documentation](https://zod.dev)
