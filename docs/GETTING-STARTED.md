# Getting Started

> This guide assumes the opinionated use case for this template:
> Docker-first SaaS development locally, end-to-end types via ORPC and declarative routing, deploying to Render in production.

This guide will help you get up and running with the NextJS-NestJS-Turborepo template quickly. Follow these steps to set up your development environment and start building your application.

## Prerequisites

Install:
- Bun 1.2.14+ (primary)
- Node.js 20+
- Docker + Docker Compose
- Git

## Quick Start

### 1. Clone the Repository

Start by forking this template repository or cloning it directly:

```bash
# Option 1: Fork the repository on GitHub and then clone it
git clone https://github.com/your-username/nextjs-nestjs-turborepo-template.git

# Option 2: Clone directly
git clone https://github.com/N0SAFE/nextjs-nestjs-turborepo-template.git

# Navigate to the project directory
cd nextjs-nestjs-turborepo-template
```

### 2. Project Initialization

Run the interactive initialization script to configure your project:

```bash
# Run the initialization wizard
bun run init
```

This interactive script will:
- Guide you through configuring all environment variables
- Validate your inputs based on the requirements
- Generate a properly formatted `.env` file
- Support different input types (strings, numbers, URLs, booleans, etc.)
- Provide smart defaults and validation rules

The initialization wizard supports various field types:
- **String fields**: Text input with optional validation
- **Number fields**: Numeric input with min/max constraints  
- **URL fields**: URL validation with protocol restrictions
- **Boolean fields**: Yes/no choices with custom labels
- **Select fields**: Single choice from predefined options
- **Multi-select fields**: Multiple choices with custom separators
- **Date fields**: Date input with format validation
- **Secure fields**: Password-style input for sensitive data

### 3. Install Dependencies

After initialization, install all project dependencies:

```bash
# Install dependencies
bun install
```

### 4. Start Development Environment (Docker)

After initialization and dependency installation, start the development environment:

```bash
# Start the development server
bun run dev
```

This command:
- Starts the NestJS API on the configured port (default: `3001`)
- Starts the Next.js development server on the configured port (default: `3000`)
- Sets up hot reloading for both applications
- Starts PostgreSQL database and Redis cache
- Runs database migrations and seeds initial data

### 5. Access the Applications

After the development servers are running:

- **Next.js Web App**: http://localhost:3000
- **NestJS API**: http://localhost:3001
  - API health check: http://localhost:3001/health
  - API documentation: http://localhost:3001/api (if Swagger is enabled)
- **Database**: PostgreSQL on localhost:5432
- **Cache**: Redis on localhost:6379

## Environment Configuration

The template uses several environment files for different services and environments:

- `.env`: Main environment variables
- `.env.api.prod.example`: Example production API environment
- `.env.web.prod.example`: Example production web environment

### Key Environment Variables

#### API (NestJS):
- `DATABASE_URL`: PostgreSQL connection string
- `API_PORT`: Port for the NestJS API (default: 3001)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth
- `REDIS_URL`: Redis connection string

#### Web (Next.js):
- `NEXT_PUBLIC_API_URL`: URL to the NestJS API
- `NEXT_PUBLIC_APP_URL`: URL where the web app is accessible
- `BETTER_AUTH_URL`: Auth callback URL
- `NEXT_PUBLIC_APP_PORT`: Port for the Next.js app (default: 3000)
- `NEXT_PUBLIC_DOC_URL`: URL to your documentation site (when set, a "Docs" link appears in the navbar)
- `NEXT_PUBLIC_DOC_PORT`: Port for the docs site (optional helper used by Docker compose defaults)

## Project Structure Overview

```
nextjs-nestjs-turborepo-template/
├── apps/
│   ├── api/              # NestJS API with ORPC, Better Auth, Drizzle ORM
│   └── web/              # NextJS frontend application with declarative routing
├── packages/             # Shared packages
│   ├── ui/               # Shared UI components (Shadcn)
│   ├── api-contracts/    # ORPC API contracts for type safety
│   └── ...               # Other shared packages
└── docs/                 # Documentation
```

For a more detailed understanding of the project structure, refer to [Architecture Overview](./ARCHITECTURE.md).

## Development Mode Options

### 1. Standard Docker Development

The default development setup runs everything in Docker containers:

```bash
bun run dev
```

### 2. Local Development

Run components directly on your local machine (not in Docker):

```bash
bun run dev:local
```

### 3. Partial Local Development

Run only specific components locally:

```bash
# Start just the API
bun run api -- dev

# Start just the web app
bun run web -- dev
```

## Initial Customization Steps

After setup, you may want to:

1. **Update Project Information**:
   - Change the name in the root `package.json`
   - Update the README.md with your project details

2. **Configure Authentication**:
   - Update Better Auth configuration in `apps/api/src/auth.ts`
   - Set up custom user roles and permissions

3. **Set Up Data Models**:
   - Create database schemas using Drizzle ORM in `apps/api/src/db/drizzle/schema/`
   - Generate and run migrations with `bun run api -- db:generate`

4. **Define API Contracts**:
   - Create ORPC procedures in `packages/api-contracts/`
   - Implement API endpoints in `apps/api/src/`

5. **Customize UI**:
   - Update theme settings in `packages/ui/components/theme-provider.tsx`
   - Modify default layout in `apps/web/src/app/layout.tsx`

## Next Steps

Once you have your environment set up, check out these guides:

- Docs hub: ./README.md
- Development Workflow: ./DEVELOPMENT-WORKFLOW.md
- Architecture Overview: ./ARCHITECTURE.md
- Technology Stack: ./TECH-STACK.md
- Production Deployment: ./PRODUCTION-DEPLOYMENT.md

## Troubleshooting

If you encounter issues during setup:

- Ensure Docker is running correctly
- Check that ports 3000 and 3001 are not used by other applications
- Verify that environment variables are correctly set up
- Check Docker logs: `bun run dev:api:logs` or `bun run dev:web:logs`
- For database issues, try: `bun run api -- db:push` to sync schema

---

For more advanced setup options and configurations, refer to the specific documentation for each component.
