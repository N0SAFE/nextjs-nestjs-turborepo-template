# @repo/mcp-repo

MCP (Model Context Protocol) server for managing this monorepo. Provides tools for package management, command execution, and scaffolding new packages.

## Features

- 📦 **Package Management**: List, create, update, and delete packages
- 🛠️ **Command Execution**: Run eslint, prettier, typecheck, tests, and builds
- 🏗️ **Scaffolding**: Generate new packages with proper structure (configs, bins, MCPs, UI, contracts, types)
- 🔍 **Type Safe**: Built with TypeScript and Zod v4 validation
- ⚡ **Fast**: Powered by Bun and NestJS

## Quick Start

```bash
# Development with MCP Inspector
bun run dev

# Build
bun run build

# Production
bun run start:prod
```

## Available Tools

### Package Tools
- `list-packages` - List all packages in the monorepo
- `get-package-info` - Get detailed package information
- `create-package` - Scaffold a new package
- `update-package` - Update package.json fields
- `delete-package` - Remove a package

### Command Tools
- `run-eslint` - Lint code with ESLint
- `run-prettier` - Format code with Prettier
- `run-typecheck` - Type check with TypeScript
- `run-tests` - Run tests with Vitest
- `run-build` - Build packages
- `run-clean` - Clean build artifacts

### Scaffold Tools
- `scaffold-config-package` - New config package
- `scaffold-bin-package` - New CLI tool (NestJS + nest-commander)
- `scaffold-mcp-package` - New MCP server
- `scaffold-ui-package` - New UI components package
- `scaffold-contracts-package` - New API contracts package
- `scaffold-types-package` - New TypeScript types package

## Technology Stack

- **NestJS** - Application framework
- **@rekog/mcp-nest** - MCP server integration
- **Zod v4** - Schema validation
- **Bun** - Runtime and package manager
- **TypeScript** - Type safety

## Development

See [AGENTS.md](./AGENTS.md) for detailed development guidelines and architecture documentation.

## License

UNLICENSED
