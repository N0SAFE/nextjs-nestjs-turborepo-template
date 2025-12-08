/**
 * Docker Compose Generator
 *
 * Sets up Docker Compose configuration with development, production,
 * and override files for both API and web applications.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class DockerComposeGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "docker-compose",
    priority: 50,
    version: "1.0.0",
    description: "Docker Compose configuration for development and production",
    contributesTo: ["docker/**", "docker-compose*.yml"],
    dependsOn: [],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Main docker-compose.yml (orchestrator)
    files.push(
      this.file("docker-compose.yml", this.getMainDockerCompose(context), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Development docker-compose
    files.push(
      this.file("docker/compose/docker-compose.dev.yml", this.getDevDockerCompose(context), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Development override
    files.push(
      this.file("docker/compose/docker-compose.dev.override.yml", this.getDevOverride(context), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Production docker-compose
    files.push(
      this.file("docker/compose/docker-compose.prod.yml", this.getProdDockerCompose(context), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Production override
    files.push(
      this.file("docker/compose/docker-compose.prod.override.yml", this.getProdOverride(context), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // API Dockerfile for development
    files.push(
      this.file("docker/compose/api/Dockerfile.dev", this.getApiDevDockerfile(), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // API Dockerfile for production
    files.push(
      this.file("docker/compose/api/Dockerfile.prod", this.getApiProdDockerfile(), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Web Dockerfile for development
    files.push(
      this.file("docker/compose/web/Dockerfile.dev", this.getWebDevDockerfile(), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Web Dockerfile for production
    files.push(
      this.file("docker/compose/web/Dockerfile.prod", this.getWebProdDockerfile(), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Environment file templates
    files.push(
      this.file("docker/.env.example", this.getEnvExample(context), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Docker ignore file
    files.push(
      this.file(".dockerignore", this.getDockerIgnore(), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    // Health check scripts
    files.push(
      this.file("docker/scripts/healthcheck-api.sh", this.getApiHealthCheck(), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    files.push(
      this.file("docker/scripts/wait-for-it.sh", this.getWaitForIt(), {
        mergeStrategy: "replace",
        priority: 50,
      }),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // No npm dependencies - Docker Compose is a system-level tool
    return [];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "docker:dev", command: "docker-compose -f docker/compose/docker-compose.dev.yml -f docker/compose/docker-compose.dev.override.yml up", target: "root", description: "Start development environment", pluginId: "docker-compose" },
      { name: "docker:dev:build", command: "docker-compose -f docker/compose/docker-compose.dev.yml -f docker/compose/docker-compose.dev.override.yml up --build", target: "root", description: "Build and start development environment", pluginId: "docker-compose" },
      { name: "docker:dev:down", command: "docker-compose -f docker/compose/docker-compose.dev.yml -f docker/compose/docker-compose.dev.override.yml down", target: "root", description: "Stop development environment", pluginId: "docker-compose" },
      { name: "docker:prod", command: "docker-compose -f docker/compose/docker-compose.prod.yml -f docker/compose/docker-compose.prod.override.yml up -d", target: "root", description: "Start production environment", pluginId: "docker-compose" },
      { name: "docker:prod:build", command: "docker-compose -f docker/compose/docker-compose.prod.yml build", target: "root", description: "Build production images", pluginId: "docker-compose" },
      { name: "docker:prod:down", command: "docker-compose -f docker/compose/docker-compose.prod.yml down", target: "root", description: "Stop production environment", pluginId: "docker-compose" },
      { name: "docker:logs", command: "docker-compose -f docker/compose/docker-compose.dev.yml logs -f", target: "root", description: "View container logs", pluginId: "docker-compose" },
      { name: "docker:clean", command: "docker-compose -f docker/compose/docker-compose.dev.yml down -v --remove-orphans", target: "root", description: "Clean up containers and volumes", pluginId: "docker-compose" },
    ];
  }

  private getMainDockerCompose(context: GeneratorContext): string {
    const projectName = context.projectConfig.name || "app";
    
    return `# Docker Compose Orchestrator
# This file provides shortcuts to the actual compose configurations
#
# Usage:
#   Development: bun run docker:dev
#   Production:  bun run docker:prod
#
# Or manually:
#   docker-compose -f docker/compose/docker-compose.dev.yml up

name: "${projectName}"

# This is a convenience file that includes the development configuration
include:
  - path: docker/compose/docker-compose.dev.yml
    env_file:
      - .env

# Alternatively, use the scripts in package.json for better control
`;
  }

  private getDevDockerCompose(context: GeneratorContext): string {
    const hasJobQueue = this.hasPlugin(context, "job-queue");
    const hasDatabase = this.hasPlugin(context, "drizzle") || this.hasPlugin(context, "postgresql");
    
    let services = `version: "3.8"

services:
  # NestJS API Service
  api:
    build:
      context: ../..
      dockerfile: docker/compose/api/Dockerfile.dev
    container_name: \${COMPOSE_PROJECT_NAME:-app}-api-dev
    restart: unless-stopped
    ports:
      - "\${API_PORT:-3001}:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://\${DB_USER:-postgres}:\${DB_PASSWORD:-postgres}@db:5432/\${DB_NAME:-app_dev}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ../../apps/api/src:/app/apps/api/src:delegated
      - ../../packages:/app/packages:delegated
      - /app/node_modules
      - /app/apps/api/node_modules
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network

  # Next.js Web Service
  web:
    build:
      context: ../..
      dockerfile: docker/compose/web/Dockerfile.dev
    container_name: \${COMPOSE_PROJECT_NAME:-app}-web-dev
    restart: unless-stopped
    ports:
      - "\${WEB_PORT:-3000}:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://api:3001
      - WATCHPACK_POLLING=true
    volumes:
      - ../../apps/web/src:/app/apps/web/src:delegated
      - ../../apps/web/public:/app/apps/web/public:delegated
      - ../../packages:/app/packages:delegated
      - /app/node_modules
      - /app/apps/web/node_modules
      - /app/apps/web/.next
    depends_on:
      - api
    networks:
      - app-network
`;

    if (hasDatabase) {
      services += `
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-app}-db-dev
    restart: unless-stopped
    ports:
      - "\${DB_PORT:-5432}:5432"
    environment:
      - POSTGRES_USER=\${DB_USER:-postgres}
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-postgres}
      - POSTGRES_DB=\${DB_NAME:-app_dev}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-postgres} -d \${DB_NAME:-app_dev}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
`;
    }

    services += `
  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-app}-redis-dev
    restart: unless-stopped
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
`;

    if (hasJobQueue) {
      services += `
  # Redis Commander (Queue Monitoring - Development Only)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: \${COMPOSE_PROJECT_NAME:-app}-redis-commander
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379
    depends_on:
      - redis
    networks:
      - app-network
    profiles:
      - debug
`;
    }

    services += `
networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
`;

    return services;
  }

  private getDevOverride(context: GeneratorContext): string {
    return `# Development Override Configuration
# Add development-specific configurations here

version: "3.8"

services:
  api:
    # Enable hot reloading with polling (for Docker on Mac/Windows)
    environment:
      - CHOKIDAR_USEPOLLING=true
      - LOG_LEVEL=debug

  web:
    # Enable hot reloading with polling (for Docker on Mac/Windows)
    environment:
      - CHOKIDAR_USEPOLLING=true
      - NEXT_TELEMETRY_DISABLED=1
`;
  }

  private getProdDockerCompose(context: GeneratorContext): string {
    const hasDatabase = this.hasPlugin(context, "drizzle") || this.hasPlugin(context, "postgresql");
    
    let services = `version: "3.8"

services:
  # NestJS API Service (Production)
  api:
    build:
      context: ../..
      dockerfile: docker/compose/api/Dockerfile.prod
      args:
        - NODE_ENV=production
    container_name: \${COMPOSE_PROJECT_NAME:-app}-api-prod
    restart: always
    ports:
      - "\${API_PORT:-3001}:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_HOST=\${REDIS_HOST:-redis}
      - REDIS_PORT=\${REDIS_PORT:-6379}
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Next.js Web Service (Production)
  web:
    build:
      context: ../..
      dockerfile: docker/compose/web/Dockerfile.prod
      args:
        - NODE_ENV=production
        - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
    container_name: \${COMPOSE_PROJECT_NAME:-app}-web-prod
    restart: always
    ports:
      - "\${WEB_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - api
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
`;

    services += `
  # Redis Cache (Production)
  redis:
    image: redis:7-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-app}-redis-prod
    restart: always
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

networks:
  app-network:
    driver: bridge

volumes:
  redis-data:
`;

    return services;
  }

  private getProdOverride(context: GeneratorContext): string {
    return `# Production Override Configuration
# Add production-specific configurations here
# This file should contain sensitive production settings

version: "3.8"

services:
  api:
    environment:
      - LOG_LEVEL=warn
      # Add production secrets via environment variables
      # - JWT_SECRET=\${JWT_SECRET}
      # - BETTER_AUTH_SECRET=\${BETTER_AUTH_SECRET}

  web:
    environment:
      - NEXT_TELEMETRY_DISABLED=1
`;
  }

  private getApiDevDockerfile(): string {
    return `# API Development Dockerfile
FROM node:20-alpine AS base

# Install bun
RUN npm install -g bun

# Install dependencies for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy API source
COPY apps/api/ ./apps/api/

# Expose API port
EXPOSE 3001

# Set working directory to API
WORKDIR /app/apps/api

# Start development server
CMD ["bun", "run", "dev"]
`;
  }

  private getApiProdDockerfile(): string {
    return `# API Production Dockerfile
FROM node:20-alpine AS base

# Install bun
RUN npm install -g bun

WORKDIR /app

# ===== Dependencies Stage =====
FROM base AS deps

COPY package.json bun.lock* ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN bun install --frozen-lockfile --production

# ===== Builder Stage =====
FROM base AS builder

COPY package.json bun.lock* ./
COPY turbo.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

RUN bun install --frozen-lockfile
RUN bun run build --filter=api

# ===== Runner Stage =====
FROM node:20-alpine AS runner

RUN npm install -g bun
RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

EXPOSE 3001

WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
`;
  }

  private getWebDevDockerfile(): string {
    return `# Web Development Dockerfile
FROM node:20-alpine AS base

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy web source
COPY apps/web/ ./apps/web/

# Expose web port
EXPOSE 3000

# Set working directory to web
WORKDIR /app/apps/web

# Start development server
CMD ["bun", "run", "dev"]
`;
  }

  private getWebProdDockerfile(): string {
    return `# Web Production Dockerfile
FROM node:20-alpine AS base

# Install bun
RUN npm install -g bun

WORKDIR /app

# ===== Dependencies Stage =====
FROM base AS deps

COPY package.json bun.lock* ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

RUN bun install --frozen-lockfile

# ===== Builder Stage =====
FROM base AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}

COPY package.json bun.lock* ./
COPY turbo.json ./
COPY apps/web/ ./apps/web/
COPY packages/ ./packages/

RUN bun install --frozen-lockfile
RUN bun run build --filter=web

# ===== Runner Stage =====
FROM node:20-alpine AS runner

RUN npm install -g bun

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
`;
  }

  private getEnvExample(context: GeneratorContext): string {
    const hasDatabase = this.hasPlugin(context, "drizzle") || this.hasPlugin(context, "postgresql");
    const hasBetterAuth = this.hasPlugin(context, "better-auth");
    
    let env = `# Docker Compose Environment Variables
# Copy this file to .env and modify as needed

# Project Configuration
COMPOSE_PROJECT_NAME=${context.projectConfig.name || "app"}

# API Configuration
API_PORT=3001
NODE_ENV=development
`;

    if (hasDatabase) {
      env += `
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=app_dev
DB_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@db:5432/app_dev
`;
    }

    env += `
# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
`;

    if (hasBetterAuth) {
      env += `
# Authentication
BETTER_AUTH_SECRET=your-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3001
`;
    }

    env += `
# Web Configuration
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

    return env;
  }

  private getDockerIgnore(): string {
    return `# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
.next
out
dist
build
.turbo
.vercel

# Testing
coverage
.nyc_output

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
docker/compose/**/volumes
*.log

# Misc
*.tsbuildinfo
*.pid
*.seed

# Git
.git
.gitignore
`;
  }

  private getApiHealthCheck(): string {
    return `#!/bin/sh
# API Health Check Script

set -e

curl -f http://localhost:3001/health || exit 1
`;
  }

  private getWaitForIt(): string {
    return `#!/bin/sh
# Wait for a service to be available

HOST="$1"
PORT="$2"
TIMEOUT="\${3:-30}"

echo "Waiting for $HOST:$PORT..."

start_time=$(date +%s)
while ! nc -z "$HOST" "$PORT" 2>/dev/null; do
  current_time=$(date +%s)
  elapsed=$((current_time - start_time))
  
  if [ "$elapsed" -ge "$TIMEOUT" ]; then
    echo "Timeout waiting for $HOST:$PORT after $TIMEOUT seconds"
    exit 1
  fi
  
  sleep 1
done

echo "$HOST:$PORT is available"
`;
  }
}
