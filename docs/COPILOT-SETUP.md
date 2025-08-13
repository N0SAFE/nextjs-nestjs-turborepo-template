# GitHub Copilot Coding Agent Development Environment

This repository has been configured with a custom development environment for GitHub Copilot coding agent. The agent will have access to all the necessary tools and dependencies to work effectively with this Next.js + NestJS Turborepo project.

For developer documentation, see the docs hub at ./README.md for the recommended journey and topic index.

## Environment Setup

The Copilot coding agent environment includes:

### 🛠️ Core Tools
- **Node.js 20** - JavaScript runtime
- **Bun 1.2.14** - Fast package manager and bundler
- **Turbo 2.1.2** - Monorepo build system
- **Docker & Docker Buildx** - Containerization platform
- **NestJS CLI** - Backend framework development tools

### 🗄️ Services
- **PostgreSQL 16** - Database for NestJS API
- **Redis 8** - Caching layer for performance

### 📦 Project Structure
The environment is pre-configured for this Turborepo monorepo structure:
- `apps/web` - Next.js frontend application with declarative routing
- `apps/api` - NestJS API backend with ORPC and Better Auth
- `packages/*` - Shared packages and utilities including ORPC contracts

### ⚙️ Pre-configured Environment Variables
The agent has access to all necessary environment variables:
- API endpoints and configuration
- Database connection settings
- Authentication secrets
- Development tool settings

## Features for Copilot Agent

### 🚀 Ready-to-Use Commands
The agent can immediately use these commands:
```bash
bun run dev          # Start full development environment with Docker
bun run dev:local    # Start development environment locally
bun run build        # Build all packages
bun run test         # Run all tests
bun run lint         # Run linting
bun run format       # Format code
bun run clean        # Clean build artifacts
```

### 🏗️ Pre-built Dependencies
- All npm/bun dependencies are installed and cached
- Shared packages are pre-built
- Declarative routing is generated
- Environment configuration is ready

### 🔧 Development Tools
- TypeScript support with tsx
- Testing with Vitest
- Linting with ESLint
- Code formatting with Prettier
- Hot reloading for development

## How It Works

1. **Automatic Setup**: When Copilot starts working on your repository, it automatically runs the setup workflow
2. **Cached Dependencies**: Dependencies are cached for faster subsequent runs
3. **Service Availability**: PostgreSQL and Redis services are started and health-checked
4. **Tool Verification**: All tools are verified to be working correctly
5. **Environment Ready**: The agent receives a fully configured development environment

## Customization

The setup can be customized by modifying `.github/workflows/copilot-setup-steps.yml`:

### Adding New Tools
```yaml
- name: Install additional tools
  run: |
    bun install -g your-tool
```

### Environment Variables
Add environment variables in the `env` section or create secrets in the `copilot` environment on GitHub.

### Services
Add additional services in the `services` section:
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: password
```

## Testing the Setup

You can test the setup workflow manually:
1. Go to your repository's **Actions** tab
2. Select **Copilot Setup Steps** workflow
3. Click **Run workflow**

This will validate that the environment sets up correctly and all tools are accessible.

## Performance Optimizations

The setup includes several optimizations:
- **Dependency Caching**: Bun dependencies are cached across runs
- **Pre-built Packages**: Shared packages are built during setup
- **Service Health Checks**: Services are verified before proceeding
- **Timeout Protection**: 15-minute timeout prevents hanging
- **Parallel Operations**: Multiple tools installed simultaneously

## Troubleshooting

If the Copilot agent encounters issues:

1. **Check the workflow logs** in the Actions tab
2. **Verify environment variables** are correctly set
3. **Ensure services are healthy** (PostgreSQL, Redis)
4. **Check tool versions** match your requirements

## Security Considerations

- **Minimal Permissions**: The workflow only requests `contents: read`
- **Isolated Environment**: Each run gets a fresh, isolated environment
- **No Secrets Required**: Uses only public tools and test credentials
- **Service Isolation**: Services run in isolated containers

---

The GitHub Copilot coding agent is now ready to work efficiently with your Next.js + NestJS Turborepo project! 🚀
