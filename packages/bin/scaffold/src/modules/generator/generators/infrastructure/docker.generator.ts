/**
 * Docker Generator
 *
 * Sets up Docker and Docker Compose for containerized development and deployment.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class DockerGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "docker",
    priority: 40,
    version: "1.0.0",
    description: "Docker and Docker Compose configuration",
    dependencies: ["turborepo"],
    contributesTo: ["docker-compose.yml", "Dockerfile", ".dockerignore", "package.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [
      this.file(".dockerignore", this.getDockerIgnore()),
      this.file("docker-compose.yml", this.getDockerCompose(context)),
      this.file("docker/compose/docker-compose.dev.yml", this.getDevCompose(context)),
      this.file("docker/compose/docker-compose.prod.yml", this.getProdCompose(context)),
    ];

    // Add Dockerfiles for each app
    if (this.hasPlugin(context, "nestjs")) {
      files.push(
        this.file("docker/builder/api/Dockerfile.dev", this.getApiDevDockerfile()),
        this.file("docker/builder/api/Dockerfile.prod", this.getApiProdDockerfile())
      );
    }

    if (this.hasPlugin(context, "nextjs")) {
      files.push(
        this.file("docker/builder/web/Dockerfile.dev", this.getWebDevDockerfile()),
        this.file("docker/builder/web/Dockerfile.prod", this.getWebProdDockerfile())
      );
    }

    return files;
  }

  protected override getScripts(context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "docker:up",
        command: "docker compose up -d",
        target: "root",
        pluginId: "docker",
        description: "Start all containers",
      },
      {
        name: "docker:down",
        command: "docker compose down",
        target: "root",
        pluginId: "docker",
        description: "Stop all containers",
      },
      {
        name: "docker:logs",
        command: "docker compose logs -f",
        target: "root",
        pluginId: "docker",
        description: "View container logs",
      },
      {
        name: "docker:build",
        command: "docker compose build",
        target: "root",
        pluginId: "docker",
        description: "Build all containers",
      },
      {
        name: "dev",
        command: "docker compose -f docker/compose/docker-compose.dev.yml up",
        target: "root",
        pluginId: "docker",
        description: "Start development environment",
      },
    ];
  }

  private getDockerIgnore(): string {
    return `# Dependencies
node_modules
**/node_modules

# Build outputs
dist
build
.next
.turbo

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage
.nyc_output

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore
`;
  }

  private getDockerCompose(context: GeneratorContext): string {
    const { projectConfig } = context;
    const services: string[] = [];

    if (this.hasPlugin(context, "nestjs")) {
      services.push(`  api:
    build:
      context: .
      dockerfile: docker/builder/api/Dockerfile.dev
    ports:
      - "\${API_PORT:-${projectConfig.ports?.api || 3001}}:${projectConfig.ports?.api || 3001}"
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/api/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    depends_on:
      - postgres
      - redis`);
    }

    if (this.hasPlugin(context, "nextjs")) {
      services.push(`  web:
    build:
      context: .
      dockerfile: docker/builder/web/Dockerfile.dev
    ports:
      - "\${WEB_PORT:-${projectConfig.ports?.web || 3000}}:${projectConfig.ports?.web || 3000}"
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/web/node_modules
      - /app/apps/web/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://api:${projectConfig.ports?.api || 3001}
    depends_on:
      - api`);
    }

    if (this.hasPlugin(context, "postgresql")) {
      services.push(`  postgres:
    image: postgres:16-alpine
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    environment:
      - POSTGRES_USER=\${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=\${POSTGRES_DB:-${projectConfig.name || "app"}}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5`);
    }

    if (this.hasPlugin(context, "redis")) {
      services.push(`  redis:
    image: redis:7-alpine
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5`);
    }

    const volumes: string[] = [];
    if (this.hasPlugin(context, "postgresql")) {
      volumes.push("  postgres_data:");
    }
    if (this.hasPlugin(context, "redis")) {
      volumes.push("  redis_data:");
    }

    return `version: "3.8"

services:
${services.join("\n\n")}

${volumes.length > 0 ? `volumes:\n${volumes.join("\n")}` : ""}
`;
  }

  private getDevCompose(context: GeneratorContext): string {
    return `# Development environment overrides
version: "3.8"

services:
  api:
    command: bun run dev
    environment:
      - NODE_ENV=development
      - DEBUG=*

  web:
    command: bun run dev
    environment:
      - NODE_ENV=development
      - NEXT_TELEMETRY_DISABLED=1
`;
  }

  private getProdCompose(context: GeneratorContext): string {
    return `# Production environment configuration
version: "3.8"

services:
  api:
    build:
      dockerfile: docker/builder/api/Dockerfile.prod
    command: bun run start
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  web:
    build:
      dockerfile: docker/builder/web/Dockerfile.prod
    command: bun run start
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  postgres:
    restart: unless-stopped

  redis:
    restart: unless-stopped
`;
  }

  private getApiDevDockerfile(): string {
    return `FROM oven/bun:1.2-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Set working directory for API
WORKDIR /app/apps/api

EXPOSE 3001

CMD ["bun", "run", "dev"]
`;
  }

  private getApiProdDockerfile(): string {
    return `FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build --filter=api

# Production image
FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["bun", "run", "start"]
`;
  }

  private getWebDevDockerfile(): string {
    return `FROM oven/bun:1.2-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json bun.lock* ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Set working directory for web
WORKDIR /app/apps/web

EXPOSE 3000

CMD ["bun", "run", "dev"]
`;
  }

  private getWebProdDockerfile(): string {
    return `FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json bun.lock* ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build --filter=web

# Production image
FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
`;
  }
}
