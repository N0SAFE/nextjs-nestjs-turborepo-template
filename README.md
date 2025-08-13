# Next.js + NestJS Monorepo Template

A modern, full-stack monorepo template featuring Next.js frontend, NestJS API, Shadcn UI, and TypeScript with authentication, declarative routing, and end-to-end types.

## Features

- 🚀 **Full-Stack Setup**: Next.js frontend + NestJS backend API
- 📦 **Monorepo Structure**: Organized with Turborepo for efficient development
- 🎨 **Modern UI**: Shadcn UI components with Tailwind CSS
- 🔐 **Authentication**: Integrated Better Auth with NestJS
- 🛣️ **Routing**: Declarative routing system for better organization
- 📱 **Type Safety**: Full TypeScript support across all packages with ORPC
- 🔧 **Development Tools**: ESLint, Prettier, and TypeScript configurations
- 🤖 **AI-Ready**: Pre-configured development environment for GitHub Copilot coding agent

## Prerequisites

- Bun 1.2.14+ (primary)
- Node.js 20+ (fallback)
- Docker + Docker Compose

## Getting Started

1. **Clone the Repository**
   ```bash
   git clone [your-repo-url]
   cd nextjs-nestjs-turborepo-template
   ```

2. **Initialize the Project**
   ```bash
   bun run init 
   ```
   This will guide you through an interactive setup to configure your environment

3. **Set Upstream Remote for Updates**
   To keep your project up to date with the original template, add an `upstream` remote:
   ```bash
   git remote add upstream https://github.com/N0SAFE/nextjs-nestjs-turborepo-template.git
   # To fetch and rebase updates from the template later:
   git fetch upstream
   git rebase upstream/main
   ```
   Or use the provided script:
   ```bash
   bun run add:upstream
   ```
   This will automatically add the upstream remote if it does not exist.

4. **Configure Project Name (Optional)**
   To avoid conflicts when running multiple projects, set a unique project name in your `.env` file:
   ```bash
   COMPOSE_PROJECT_NAME=my-unique-project-name
   ```
   See [Project Isolation Guide](./docs/PROJECT-ISOLATION.md) for details.

4. **Start Development Servers**
   ```bash
   bun --bun dev
   ```
   This starts:
   - Next.js at http://localhost:3000
   - NestJS API at http://localhost:3001

## Project Structure

### Apps
- `web/`: Next.js frontend application
  - Features Shadcn UI components
  - Better Auth integration
  - Declarative routing system
  - API integration with ORPC

- `api/`: NestJS backend
  - ORPC endpoints
  - Better Auth configuration
  - Database migrations with Drizzle ORM
  - PostgreSQL integration

### Packages
- `ui/`: Shared React component library
- `api-contracts/`: ORPC type-safe API contracts
- `eslint-config/`: Shared ESLint configurations
- `prettier-config/`: Shared Prettier configurations
- `tailwind-config/`: Shared Tailwind CSS configuration
- `tsconfig/`: Shared TypeScript configurations
- `types/`: Shared TypeScript types

## Development Workflow

1. **Running the Full Development Environment**
   ```bash
   bun --bun dev # Starts all services (API + Web + Database + Redis)
   ```

2. **Running Services Separately (for independent development)**
   ```bash
   # API only (includes database and Redis)
   bun run dev:api
   
   # Web only (connects to external API)
   bun run dev:web
   
   # Build and run with fresh images
   bun run dev:api:build
   bun run dev:web:build
   
   # Stop services
   bun run dev:api:down
   bun run dev:web:down
   
   # View logs
   bun run dev:api:logs
   bun run dev:web:logs
   ```

3. **Building for Production**
   ```bash
   bun --bun build # Builds all apps and packages
   ```

4. **Running Tests**
   ```bash
   bun --bun test # Runs tests across all packages
   ```

5. **Linting and Formatting**
   ```bash
   bun --bun lint # Run ESLint
   bun --bun format # Run Prettier
   ```

## Adding New Components

1. Use Shadcn UI CLI to add new components:
   ```bash
   bun --bun ui:add [component-name]
   ```

2. Components will be available in `packages/ui/components/`

## Deployment

### Frontend (Next.js)
- Optimized for Vercel deployment
- Supports other platforms (AWS, DigitalOcean, etc.)

### Backend (NestJS)
- Deploy to any Node.js hosting platform or via Docker

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Turborepo](https://turbo.build/)
- [Next.js](https://nextjs.org/)
- [NestJS](https://nestjs.com/)
- [ORPC](https://orpc.io/)
- [Better Auth](https://better-auth.com/)
- [Tailwind CSS](https://tailwindcss.com/) for styles
- [Shadcn UI](https://ui.shadcn.com/) for ui components
- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Better Auth](https://better-auth.com/) for authentication
- [PostgreSQL](https://www.postgresql.org/) for database
- [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations
- [tsup](https://github.com/egoist/tsup) for bundling
- [declarative-routing](https://github.com/ProNextJS/declarative-routing/blob/main/docs/nextjs.md) for routing

## Deployment Options

This template supports multiple deployment strategies:

### 1. Combined Docker Compose (Development/Single Server)

Deploy both API and web app together:

```bash
# Development
bun --bun docker:dev
# or
docker-compose -f docker-compose.dev.yml up

# Production
bun --bun docker:prod
# or
docker-compose -f docker-compose.prod.yml up --build
```

### 2. Production Deployments (Separate Services)

For production, deploy API and web app separately for better scalability and security.

#### Deploy API in Production

```bash
# Copy production environment template
cp .env.api.prod.example .env
# Update variables for your production environment

# Start API services
bun --bun prod:api:build
# or
docker-compose -f docker-compose.api.prod.yml up --build
```

#### Deploy Web App in Production (requires running API)

```bash
# Copy production environment template
cp .env.web.prod.example .env
# Update NEXT_PUBLIC_API_URL to point to your production API server

# Start web app
bun --bun prod:web:build
# or
docker-compose -f docker-compose.web.prod.yml up --build
```

### 3. Available Scripts

```bash
# Combined Development
bun --bun docker:dev          # Start combined development environment

# Combined Production
bun --bun docker:prod         # Start combined production environment

# Production API Only
bun --bun prod:api            # Start API services
bun --bun prod:api:build      # Build and start API services
bun --bun prod:api:down       # Stop API services
bun --bun prod:logs:api       # View API logs

# Production Web Only
bun --bun prod:web            # Start web app
bun --bun prod:web:build      # Build and start web app
bun --bun prod:web:down       # Stop web app
bun --bun prod:logs:web       # View web app logs
```

### 4. Production Deployment Guide

For detailed production deployment instructions, see [PRODUCTION-DEPLOYMENT.md](./docs/PRODUCTION-DEPLOYMENT.md).

**Benefits of production deployment:**
- Scale API and web app independently
- Deploy to different servers/regions
- Better security isolation
- Easier maintenance and updates
- Optimized for production environments

## Documentation

Start here: ./docs/README.md

- Architecture: ./docs/ARCHITECTURE.md
- Tech stack: ./docs/TECH-STACK.md
- Getting started: ./docs/GETTING-STARTED.md
- Development workflow: ./docs/DEVELOPMENT-WORKFLOW.md
- Concepts: ./docs/concepts

---

<!-- Removed legacy single-server snippet in favor of PRODUCTION-DEPLOYMENT.md -->
