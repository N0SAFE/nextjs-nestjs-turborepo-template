# Development Workflow

> This workflow targets the Docker-first SaaS use case: develop locally with Docker, use ORPC for end-to-end types and declarative routing for Next.js, and prepare for a Render production deployment.

This document outlines the recommended development workflow when working with the NextJS-NestJS-Turborepo template, covering day-to-day development tasks, commands, and best practices.

## Development Environment Setup

Before you start development, ensure you have set up the project according to the [Getting Started](./GETTING-STARTED.md) guide.

## Starting the Development Environment

### Full Development Environment (Recommended)

The easiest way to start development is using the Docker-based development setup:

```bash
bun run dev
```

This command:
- Starts all services (API, database, web app) in Docker containers
- Sets up hot reloading for real-time development
- Configures proper networking between services
- Mounts appropriate volumes for local file access

### Local Development Mode

If you prefer to run services directly on your machine:

```bash
bun run dev:local
```

This requires you to have all dependencies installed locally and properly configured.

### Individual Service Development

You can also run services individually:

```bash
# Run just the API service
bun run api -- dev

# Run just the web service
bun run web -- dev

# Run with browser auto-opening
bun run web -- dev:open
```

## Daily Development Tasks

### 1. API Development with NestJS

1. Create or modify API endpoints in `apps/api/src`
2. Update ORPC contracts in `packages/api-contracts/`
3. Use the package manager to install dependencies:
   ```bash
   cd apps/api
   bun install your-dependency
   ```
4. Restart the API service to apply changes:
   ```bash
   bun run dev:api
   ```

#### Working with Database

Manage database schema and data with Drizzle ORM:

```bash
# Generate migrations after schema changes
bun run api -- db:generate

# Push schema changes to database
bun run api -- db:push

# Run pending migrations
bun run api -- db:migrate

# Access database studio for admin tasks
bun run api -- db:studio

# Seed development data
bun run api -- db:seed
```

### 2. Frontend Development

#### Creating New Pages

1. Create new page components in `apps/web/src/app` following Next.js App Router structure
2. Create corresponding `page.info.ts` files for declarative routing
3. Run `bun run web -- dr:build` to generate type-safe routes
4. Use server components by default unless client interactivity is needed

#### Working with UI Components

1. Use existing components from `packages/ui` where possible
2. Create new shared components in `packages/ui` if they'll be reused
3. Create page-specific components within the page directory

#### Using ORPC Client

Access data from NestJS API using the ORPC client:

```typescript
// In client components
import { api } from '@/lib/api';

// Use generated hooks
const { data, isLoading } = api.users.getProfile.useQuery();

// In server components  
import { orpcClient } from '@/lib/orpc-client';

const userData = await orpcClient.users.getProfile();
```

#### Authentication

Use Better Auth for authentication:

```typescript
// Check authentication in server components
import { auth } from '@/lib/auth';

const session = await auth();
if (!session) {
  // Handle unauthenticated state
}
```

### 3. Running Tests

```bash
# Run all tests
bun run test

# Run specific workspace tests
bun run web -- test
bun run api -- test
```

### 4. Building for Production

Create production builds for testing:

```bash
# Build all workspaces
bun run build

# Build specific workspace
bun run web -- build
```

## Code Quality and Standards

### Linting

Run linting across the entire monorepo:

```bash
bun run lint
```

Fix automatically fixable issues:

```bash
bun run lint -- --fix
```

### Formatting

Format code across the entire monorepo:

```bash
bun run format
```

## Working with Packages

### Creating a New Shared Package

1. Create a new directory in `packages/` with the appropriate structure
2. Add a `package.json` with the correct name and dependencies
3. Update root `turbo.json` if needed for pipeline configuration
4. Reference the new package from other workspaces as needed

### Using Workspace Commands

Run commands in specific workspaces:

```bash
# Run a command in the web workspace
bun run web -- your-command

# Run a command in the API workspace
bun run api -- your-command

# Run a command in the UI package
bun run @repo/ui -- your-command
```

## Git Workflow

### Recommended Branch Strategy

1. **Main/Master**: Production-ready code
2. **Development**: Integration branch for feature work
3. **Feature branches**: Individual features and fixes

Example workflow:

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push -u origin feature/new-feature

# Create a pull request to development branch
```

### Commit Conventions

Follow conventional commit messages:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding or fixing tests
- `chore`: Maintenance tasks

Example: `feat(auth): Add password reset functionality`

## Dependency Management

### Adding Dependencies

```bash
# Add to root
bun install -D dependency-name

# Add to specific workspace
bun run web -- install dependency-name
bun run api -- install dependency-name
```

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Update specific dependency
npm update package-name
```

## Troubleshooting

If you encounter issues during development:

### Common Issues
- Check Docker logs: `docker-compose logs -f [service-name]`
- Restart the development environment: `bun run dev`
- Clear caches: `bun run clean`

### Memory Issues in Docker
If you encounter ENOMEM (out of memory) errors during Docker development:
- See [Memory Optimization](./MEMORY-OPTIMIZATION.md) for detailed solutions
- The most common cause is the declarative-routing watch process consuming excessive memory
- Memory limits have been added to containers to prevent crashes

### Declarative Routing
When route structure changes, you may need to manually rebuild routes:
```bash
# Rebuild declarative routes
bun run web -- dr:build
```

For more troubleshooting guidance, see [Troubleshooting](./TROUBLESHOOTING.md)

## Advanced Development Features

### Turborepo Remote Caching

For team development, set up Turborepo remote caching:

```bash
bun x --bun turbo login
bun x --bun turbo link
```

### Custom Docker Configuration

Modify Docker settings in the `docker-compose.dev.yml` file for development or `docker-compose.prod.yml` for production.
