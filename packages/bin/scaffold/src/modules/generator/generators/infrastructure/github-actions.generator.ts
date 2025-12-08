/**
 * GitHub Actions Generator
 *
 * Sets up CI/CD workflows for GitHub Actions.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
} from "../../../../types/generator.types";

@Injectable()
export class GithubActionsGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "github-actions",
    priority: 40,
    version: "1.0.0",
    description: "GitHub Actions CI/CD workflows",
    dependencies: ["turborepo"],
    contributesTo: [".github/workflows/*"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [
      this.file(".github/workflows/ci.yml", this.getCIWorkflow(context)),
      this.file(".github/workflows/release.yml", this.getReleaseWorkflow(context)),
      this.file(".github/dependabot.yml", this.getDependabot()),
      this.file(".github/PULL_REQUEST_TEMPLATE.md", this.getPRTemplate()),
      this.file(".github/CODEOWNERS", this.getCodeOwners(context)),
    ];

    // Add deployment workflow if docker is enabled
    if (this.hasPlugin(context, "docker")) {
      files.push(
        this.file(".github/workflows/deploy.yml", this.getDeployWorkflow(context))
      );
    }

    return files;
  }

  private getCIWorkflow(context: GeneratorContext): string {
    const { projectConfig } = context;

    return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "1.2.14"
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Lint
        run: bun run lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "1.2.14"
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Type check
        run: bun run type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    ${this.hasPlugin(context, "postgresql") ? `services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ${projectConfig.name?.replace(/-/g, "_") || "app"}_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5` : ""}
    ${this.hasPlugin(context, "redis") ? `
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5` : ""}
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "1.2.14"
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run tests
        run: bun run test:coverage
        env:
          ${this.hasPlugin(context, "postgresql") ? `DATABASE_URL: postgresql://postgres:postgres@localhost:5432/${projectConfig.name?.replace(/-/g, "_") || "app"}_test` : "CI: true"}
          ${this.hasPlugin(context, "redis") ? "REDIS_URL: redis://localhost:6379" : ""}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check]
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "1.2.14"
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build
        run: bun run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            apps/*/dist
            apps/*/.next
          retention-days: 7
`;
  }

  private getReleaseWorkflow(context: GeneratorContext): string {
    return `name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  packages: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "1.2.14"
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build
        run: bun run build
      
      - name: Generate changelog
        id: changelog
        uses: orhun/git-cliff-action@v3
        with:
          config: cliff.toml
          args: --verbose --latest --strip header
        env:
          OUTPUT: CHANGELOG.md
      
      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          body: \${{ steps.changelog.outputs.content }}
          draft: false
          prerelease: \${{ contains(github.ref, '-') }}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
  }

  private getDeployWorkflow(context: GeneratorContext): string {
    return `name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-push:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      api-image: \${{ steps.meta-api.outputs.tags }}
      web-image: \${{ steps.meta-web.outputs.tags }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      ${this.hasPlugin(context, "nestjs") ? `
      - name: Extract metadata (API)
        id: meta-api
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}-api
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push API
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/builder/api/Dockerfile.prod
          push: true
          tags: \${{ steps.meta-api.outputs.tags }}
          labels: \${{ steps.meta-api.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      ` : ""}
      ${this.hasPlugin(context, "nextjs") ? `
      - name: Extract metadata (Web)
        id: meta-web
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}-web
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Web
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/builder/web/Dockerfile.prod
          push: true
          tags: \${{ steps.meta-web.outputs.tags }}
          labels: \${{ steps.meta-web.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NEXT_PUBLIC_API_URL=\${{ secrets.API_URL }}
      ` : ""}

  deploy:
    name: Deploy to Environment
    runs-on: ubuntu-latest
    needs: build-and-push
    environment:
      name: \${{ github.event.inputs.environment || 'staging' }}
      url: \${{ vars.DEPLOY_URL }}
    
    steps:
      - name: Deploy via webhook
        run: |
          curl -X POST "\${{ secrets.DEPLOY_WEBHOOK_URL }}" \\
            -H "Authorization: Bearer \${{ secrets.DEPLOY_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            -d '{"images": {"api": "\${{ needs.build-and-push.outputs.api-image }}", "web": "\${{ needs.build-and-push.outputs.web-image }}"}}'
`;
  }

  private getDependabot(): string {
    return `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      typescript:
        patterns:
          - "typescript"
          - "@types/*"
      nestjs:
        patterns:
          - "@nestjs/*"
          - "nest-*"
      next:
        patterns:
          - "next"
          - "next-*"
          - "@next/*"
      react:
        patterns:
          - "react"
          - "react-dom"
          - "@types/react*"
      testing:
        patterns:
          - "vitest"
          - "@vitest/*"
          - "@testing-library/*"
      linting:
        patterns:
          - "eslint*"
          - "@eslint/*"
          - "prettier"
    labels:
      - "dependencies"
      - "automated"

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "docker"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "github-actions"
`;
  }

  private getPRTemplate(): string {
    return `## Description

<!-- Describe your changes in detail -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test updates

## Related Issues

<!-- Link any related issues here using #issue_number -->

Closes #

## How Has This Been Tested?

<!-- Describe the tests you ran to verify your changes -->

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->
`;
  }

  private getCodeOwners(context: GeneratorContext): string {
    return `# Default owners for everything
* @${context.projectConfig.author || "owner"}

# App-specific owners
/apps/api/ @${context.projectConfig.author || "owner"}
/apps/web/ @${context.projectConfig.author || "owner"}

# Package owners
/packages/ @${context.projectConfig.author || "owner"}

# Infrastructure
/.github/ @${context.projectConfig.author || "owner"}
/docker/ @${context.projectConfig.author || "owner"}

# Documentation
/docs/ @${context.projectConfig.author || "owner"}
*.md @${context.projectConfig.author || "owner"}
`;
  }
}
