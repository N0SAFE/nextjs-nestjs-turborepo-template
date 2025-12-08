# Scaffold Architecture

> Comprehensive architecture documentation for the configurable multi-app monorepo generator system.

**Version**: 1.1.0 | **Last Updated**: December 2025 | **Status**: Production Ready

---

## Quick Start

> Get up and running in 5 minutes

### Installation

```bash
# Install globally
bun add -g @repo/scaffold

# Or use directly with bunx
bunx @repo/scaffold new my-project
```

### Create Your First Project

```bash
# Interactive mode (recommended for first-time users)
scaffold new my-project --interactive

# Using a template
scaffold new my-project --template saas-starter

# Minimal setup
scaffold new my-project --template minimal
```

### Your First scaffold.config.ts

```typescript
import { defineConfig } from '@repo/scaffold';

export default defineConfig({
  project: {
    name: 'my-project',
    description: 'My awesome project',
  },
  
  packageManager: 'bun',
  
  apps: [
    {
      name: 'api',
      type: 'nestjs',
      plugins: ['drizzle', 'better-auth', 'orpc'],
    },
    {
      name: 'web', 
      type: 'nextjs',
      plugins: ['shadcn-ui', 'react-query'],
    },
  ],
  
  bridges: [
    { type: 'orpc', source: 'api', target: 'web' },
  ],
});
```

### Post-Scaffold Commands

```bash
cd my-project
bun install          # Install dependencies
bun run dev          # Start development servers
bun run build        # Build for production
bun run test         # Run tests
```

---

## Glossary

> Key terms and definitions used throughout this documentation

| Term | Definition |
|------|------------|
| **App** | A deployable application unit (e.g., NestJS API, Next.js web app) |
| **App Type** | The framework/technology of an app (nestjs, nextjs, fumadocs, etc.) |
| **Bridge** | A plugin that connects two apps for type-safe communication |
| **Contribution** | Files, dependencies, or scripts that a generator adds to the project |
| **Enhancement Plugin** | A plugin that extends/modifies another plugin's behavior |
| **Feature Plugin** | A plugin that adds complete functionality (auth, database, etc.) |
| **Generator** | A class that produces files/code for a specific plugin or app type |
| **Global Context** | Shared registry for cross-generator communication |
| **Merge Strategy** | How multiple file contributions are combined into one file |
| **Package Plugin** | A plugin that generates shared packages (not apps) |
| **Plugin** | A configurable unit that adds features/behavior to apps |
| **Scaffold** | The process of generating a complete project structure |
| **Symbol** | A unique identifier for a plugin in the registry |
| **Transform** | An AST modification applied to existing code |

---

## Table of Contents

### Quick Navigation

| I want to... | Go to |
|--------------|-------|
| Get started quickly | [Quick Start](#quick-start) |
| Understand terminology | [Glossary](#glossary) |
| Understand the system | [Vision & Goals](#vision--goals) → [System Overview](#system-overview) |
| Understand plugin design | [Plugin Design Philosophy](#plugin-design-philosophy) ⭐ NEW |
| Create a new plugin | [Plugin Development Guide](#plugin-development-guide) → [Plugin System](#plugin-system) |
| Configure generation | [Configuration System](#configuration-system) → [CLI Reference](#cli-command-reference) |
| Debug an issue | [Debugging & Troubleshooting](#debugging--troubleshooting) → [Error Handling](#error-handling--recovery) |
| Understand templates | [Template Engine](#template-engine) |
| See real examples | [Real-World Examples](#real-world-examples) |
| See existing implementations | [Current Implementations](#current-implementations) ⭐ NEW |

### Full Table of Contents

0. [Quick Start](#quick-start) ⭐ NEW
   - [Installation](#installation)
   - [Create Your First Project](#create-your-first-project)
   - [Post-Scaffold Commands](#post-scaffold-commands)
0. [Glossary](#glossary) ⭐ NEW
1. [Vision & Goals](#vision--goals)
   - [The Ultimate Goal](#the-ultimate-goal)
   - [Design Philosophy](#design-philosophy)
2. [System Overview](#system-overview)
   - [Architecture Layers](#architecture-layers)
   - [Key Statistics](#key-statistics)
3. [Core Architecture](#core-architecture)
   - [Module Structure](#module-structure)
   - [Service Dependencies](#service-dependencies)
4. [Plugin Design Philosophy](#plugin-design-philosophy) ⭐ NEW
   - [Three-Tier Plugin Strategy](#three-tier-plugin-strategy)
   - [Framework Agnostic Packages](#framework-agnostic-packages)
   - [Framework-Specific Integrations](#framework-specific-integrations)
   - [Aggregator Plugins](#aggregator-plugins)
   - [Maximum App Support Principle](#maximum-app-support-principle)
5. [Multi-App Type System](#multi-app-type-system)
   - [Supported App Types](#supported-app-types)
   - [Flexible App Placement](#flexible-app-placement)
   - [Per-App Plugin Registration](#per-app-plugin-registration)
6. [Plugin System](#plugin-system)
   - [Two-Tier Plugin Architecture](#two-tier-plugin-architecture)
   - [Plugin Symbol System](#plugin-symbol-system)
   - [Plugin Type Categories](#plugin-type-categories)
   - [Plugin Resolution & Validation](#plugin-resolution--validation)
7. [Generator System](#generator-system)
   - [Generator Types](#generator-types)
   - [Generator Priority System](#generator-priority-system)
8. [Inter-App Connections](#inter-app-connections)
   - [Connection Types](#connection-types)
   - [Bridge Examples](#bridge-examples)
9. [Orchestration Pipeline](#orchestration-pipeline)
   - [7-Phase Scaffolding Process](#7-phase-scaffolding-process)
10. [File Contribution System](#file-contribution-system)
    - [Merge Strategies](#merge-strategies-9-types)
    - [AST Transform Types](#ast-transform-types-8-types)
    - [Conflict Resolution](#conflict-resolution)
11. [Global Context Registry](#global-context-registry)
    - [Standard Namespaces](#standard-namespaces)
    - [Cross-Generator Communication](#cross-generator-communication-example)
12. [Configuration System](#configuration-system)
    - [Configuration File Structure](#configuration-file-structure)
    - [Configuration Schema (Zod Validated)](#configuration-schema-zod-validated)
    - [App Configuration Reference (`apps[]`)](#app-configuration-reference-apps) ⭐ NEW
    - [Per-Plugin Configuration](#per-plugin-configuration)
    - [Config Schema Registry](#config-schema-registry)
13. [Package Plugin System](#package-plugin-system)
    - [Package Type Hierarchy](#package-type-hierarchy)
    - [Package Enhancement System](#package-enhancement-system)
    - [Plugin-to-Package Dependencies](#plugin-to-package-dependencies)
14. [Template Engine](#template-engine)
    - [Template Syntax](#template-syntax)
    - [Available Variables](#available-variables)
    - [Custom Helpers](#custom-helpers)
    - [Template Inheritance](#template-inheritance)
15. [Error Handling & Recovery](#error-handling--recovery)
    - [Error Categories](#error-categories)
    - [Recovery Strategies](#recovery-strategies)
    - [Rollback Mechanism](#rollback-mechanism)
    - [Error Code Reference](#error-code-reference) ⭐ NEW
16. [CLI Command Reference](#cli-command-reference)
    - [Core Commands](#core-commands)
    - [Plugin Commands](#plugin-commands)
    - [Utility Commands](#utility-commands)
    - [Environment Variables](#environment-variables)
17. [Plugin Development Guide](#plugin-development-guide)
    - [Creating a New Plugin](#creating-a-new-plugin)
    - [Plugin Testing](#plugin-testing)
    - [Publishing Plugins](#publishing-plugins)
18. [Testing Strategy](#testing-strategy)
    - [Generator Testing](#generator-testing)
    - [Plugin Testing](#plugin-testing-1)
    - [Snapshot Testing](#snapshot-testing)
19. [Debugging & Troubleshooting](#debugging--troubleshooting)
    - [Debug Mode](#debug-mode)
    - [Common Issues](#common-issues)
    - [Execution Tracing](#execution-tracing)
20. [Performance Considerations](#performance-considerations)
    - [Generation Benchmarks](#generation-benchmarks)
    - [Caching Strategies](#caching-strategies)
    - [Large Monorepo Optimization](#large-monorepo-optimization)
21. [Security Considerations](#security-considerations) ⭐ NEW
    - [Template Security](#template-security)
    - [Generated Code Security](#generated-code-security)
    - [Secrets Handling](#secrets-handling)
22. [Migration Guide](#migration-guide)
    - [Migrating Existing Projects](#migrating-existing-projects)
    - [Version Upgrade Guide](#version-upgrade-guide)
23. [Current Implementations](#current-implementations) ⭐ NEW
    - [Existing Apps in Monorepo](#existing-apps-in-monorepo)
    - [Existing Packages in Monorepo](#existing-packages-in-monorepo)
    - [Implementation Status Matrix](#implementation-status-matrix)
24. [Future Roadmap](#future-roadmap) ⭐ NEW
    - [Planned App Types](#planned-app-types)
    - [Planned Plugins](#planned-plugins)
    - [Extension Ideas](#extension-ideas)
25. [Real-World Examples](#real-world-examples)
    - [SaaS Starter Example](#saas-starter-example)
    - [E-Commerce Monorepo Example](#e-commerce-monorepo-example)
    - [API-Only Microservice Example](#api-only-microservice-example)
26. [Summary](#summary)

---

## Vision & Goals

### The Ultimate Goal

Generate a **fully configurable monorepo** where:

- **Multiple application types** coexist (NestJS API, Next.js Web, Fumadocs, etc.)
- **Applications can be placed anywhere** (`apps/api`, `apps/web`, `apps/admin`, `services/auth`)
- **Each app registers independent plugins** per its needs
- **Plugins can connect apps** (API ↔ Web, API ↔ Multiple Web Apps, API ↔ API)
- **Behavior modification plugins** transform existing code (oRPC over NestJS controllers)

### Design Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTREME CONFIGURABILITY                          │
├─────────────────────────────────────────────────────────────────────┤
│  Everything is optional. Everything is configurable.                │
│  No hardcoded paths. No assumptions about structure.                │
│  Plugins compose, transform, and extend each other.                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## System Overview

### Architecture Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLI Layer                                 │
│  (nest-commander: new, add, remove, list, info commands)         │
├──────────────────────────────────────────────────────────────────┤
│                      Project Service                              │
│  (Project creation, validation, dry-run, overwrite control)      │
├──────────────────────────────────────────────────────────────────┤
│                   Plugin Resolution Layer                         │
│  (Dependency resolution, conflict detection, topological sort)   │
├──────────────────────────────────────────────────────────────────┤
│                  Generator Orchestration                          │
│  (7-phase pipeline, contribution collection, file merging)       │
├──────────────────────────────────────────────────────────────────┤
│                    Generator Layer                                │
│  (38 generators: core, app, feature, infrastructure, ui)         │
├──────────────────────────────────────────────────────────────────┤
│                  Template Engine Layer                            │
│  (Handlebars with 35+ custom helpers)                            │
├──────────────────────────────────────────────────────────────────┤
│                   File System Layer                               │
│  (File merging, AST transforms, conflict resolution)             │
└──────────────────────────────────────────────────────────────────┘
```

### Key Statistics

| Metric | Count |
|--------|-------|
| Total Generators | 38 |
| Passing Tests | 602 |
| Plugin Categories | 5 |
| Merge Strategies | 9 |
| AST Transform Types | 8 |
| Guard Types | 8 |
| CLI Command Types | 12 |

---

## Core Architecture

### Module Structure

```
src/
├── modules/
│   ├── cli/                 # CLI commands (new, add, remove, list, info)
│   ├── config/              # Configuration loading and validation
│   ├── generator/           # Generator orchestration and execution
│   │   ├── base/            # BaseGenerator abstract class
│   │   ├── generators/      # All 38 generator implementations
│   │   │   ├── app/         # App generators (nestjs, nextjs)
│   │   │   ├── core/        # Core generators (turborepo, typescript, etc.)
│   │   │   ├── feature/     # Feature generators (auth, orpc, drizzle, etc.)
│   │   │   ├── infrastructure/  # Infra generators (docker, postgres, etc.)
│   │   │   └── ui/          # UI generators (tailwind, shadcn, themes)
│   │   ├── file-merger.service.ts
│   │   ├── generator-orchestrator.service.ts
│   │   ├── global-context-registry.service.ts
│   │   └── template.service.ts
│   ├── guard/               # Guard execution service
│   ├── io/                  # File system operations
│   ├── plugin/              # Plugin registry and resolution
│   ├── project/             # Project creation service
│   └── template/            # Handlebars template engine
├── types/                   # TypeScript type definitions
│   ├── config.types.ts      # Configuration types
│   └── generator.types.ts   # Generator, plugin, contribution types
└── main.ts                  # Application entry point
```

### Service Dependencies

```
ProjectService
    │
    ├── ConfigService (load & validate config)
    ├── PluginResolverService (resolve dependencies)
    └── GeneratorOrchestratorService
            │
            ├── GlobalContextRegistryService
            ├── TemplateService
            ├── FileMergerService
            └── All 38 Generator Instances
```

---

## Plugin Design Philosophy

> **Core Principle**: Plugins should be designed to maximize compatibility across different app types. A well-designed plugin follows a three-tier architecture that separates framework-agnostic logic from framework-specific integrations.

### Three-Tier Plugin Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TIER 3: AGGREGATOR PLUGINS                        │
│    Combine multiple framework-specific plugins for easy one-line usage      │
│                                                                             │
│   Example: @scaffold/auth → uses @scaffold/auth-nestjs + @scaffold/auth-nextjs
│            @scaffold/ui   → uses @scaffold/ui-nextjs + @scaffold/ui-docs     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIER 2: FRAMEWORK-SPECIFIC PLUGINS                       │
│    Specialized integrations for each supported app type/framework           │
│                                                                             │
│   @scaffold/auth-nestjs  │  @scaffold/auth-nextjs  │  @scaffold/auth-express│
│   @scaffold/db-nestjs    │  @scaffold/db-nextjs    │  @scaffold/db-fastify  │
│   @scaffold/ui-nextjs    │  @scaffold/ui-docs      │  (more as needed)      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TIER 1: PACKAGE PLUGINS (Core Logic)                    │
│    Framework-agnostic shared packages with maximum reusability              │
│                                                                             │
│   @repo/auth-utils    │  @repo/types        │  @repo/env        │          │
│   @repo/api-contracts │  @repo/ui-base      │  @repo/validators │          │
│                                                                             │
│   ✅ Zero framework dependencies  ✅ Pure TypeScript/JavaScript             │
│   ✅ Reusable across ALL apps     ✅ Well-tested core logic                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Framework-Agnostic Packages (Tier 1)

**Package plugins provide the CORE LOGIC without any framework coupling.** These live in `packages/` and can be imported by ANY app type.

#### Design Rules for Package Plugins

| Rule | Rationale | Example |
|------|-----------|---------|
| **No framework imports** | Ensures portability | ❌ `import { Injectable } from '@nestjs/common'` |
| **Pure TypeScript** | Maximum compatibility | ✅ Plain classes, functions, types |
| **Dependency-free or minimal** | Reduces conflicts | ✅ Only `zod`, `lodash` if needed |
| **Export schemas & types** | Enables validation anywhere | ✅ `export const userSchema = z.object({...})` |
| **Export pure functions** | Framework adapts these | ✅ `export function hashPassword(pwd: string)` |

#### Current Package Plugins in Monorepo

These packages already exist and follow the framework-agnostic principle:

```
packages/
├── configs/
│   ├── eslint/        # ESLint config - works with any JS/TS project
│   ├── prettier/      # Prettier config - universal code formatting
│   ├── tailwind/      # Tailwind config - CSS framework, not tied to React
│   ├── typescript/    # TSConfig bases - reusable across all apps
│   └── vitest/        # Test config - universal testing setup
├── contracts/
│   └── api/           # ORPC contracts - framework-agnostic API definitions
├── types/             # Shared TypeScript types
├── ui/
│   └── base/          # Base UI components (can be framework-agnostic primitives)
└── utils/
    ├── auth/          # Auth utilities - core logic without framework
    └── env/           # Environment utilities - pure TypeScript
```

#### Example: Auth Package Plugin (Framework-Agnostic)

```typescript
// packages/utils/auth/src/index.ts
// ✅ CORRECT: No framework imports, pure TypeScript

import { z } from 'zod';

// Schema definitions (reusable anywhere)
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// Pure functions (no framework coupling)
export async function hashPassword(password: string): Promise<string> {
  // Implementation using crypto APIs
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Implementation
}

export function generateSessionToken(): string {
  // Implementation
}

// Configuration types (consumed by framework-specific plugins)
export interface AuthConfig {
  sessionDuration: number;
  providers: ('github' | 'google' | 'email')[];
  callbacks?: {
    onUserCreated?: (user: User) => Promise<void>;
  };
}
```

### Framework-Specific Integrations (Tier 2)

**Framework-specific plugins ADAPT the core package logic for each supported framework.** They handle:
- Framework decorators/annotations
- Dependency injection
- Routing patterns
- Middleware integration

#### Design Pattern for Framework Plugins

```typescript
// scaffold-plugins/auth-nestjs/src/index.ts
// NestJS-specific integration

import { Injectable, Module, Guard } from '@nestjs/common';
import { 
  hashPassword, 
  verifyPassword, 
  userSchema,
  type AuthConfig 
} from '@repo/auth';  // ← Uses Tier 1 package

@Injectable()
export class AuthService {
  // Adapts pure functions for NestJS DI
  async hash(password: string) {
    return hashPassword(password);
  }
  
  async verify(password: string, hash: string) {
    return verifyPassword(password, hash);
  }
}

@Guard()
export class AuthGuard {
  // NestJS-specific guard implementation
}

@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

```typescript
// scaffold-plugins/auth-nextjs/src/index.ts  
// Next.js-specific integration

import { 
  hashPassword, 
  verifyPassword,
  type AuthConfig 
} from '@repo/auth';  // ← Same Tier 1 package

// Next.js middleware
export function authMiddleware(config: AuthConfig) {
  return async function middleware(request: NextRequest) {
    // Implementation using core auth utilities
  };
}

// Server actions
export async function signInAction(formData: FormData) {
  'use server';
  // Uses core auth functions
}

// React hooks
export function useAuth() {
  // Client-side auth state
}
```

### Aggregator Plugins (Tier 3)

**Aggregator plugins combine multiple framework-specific plugins for one-line integration.** Users don't need to know which specific plugins to install.

#### How Aggregators Work

```typescript
// scaffold-plugins/auth/src/index.ts
// The "auth" aggregator plugin

import type { ScaffoldPlugin, AppConfig } from '@scaffold/core';

export const authPlugin: ScaffoldPlugin = {
  name: '@scaffold/auth',
  version: '1.0.0',
  
  // Declares which framework plugins it aggregates
  aggregates: {
    nestjs: '@scaffold/auth-nestjs',
    nextjs: '@scaffold/auth-nextjs',
    express: '@scaffold/auth-express',  // Future
    fastify: '@scaffold/auth-fastify',  // Future
  },
  
  // Declares the core package dependency
  packageDependencies: ['@repo/auth'],
  
  // Auto-selects correct plugins based on app types
  resolvePlugins(apps: AppConfig[]) {
    const appTypes = new Set(apps.map(a => a.type));
    const plugins: string[] = [];
    
    for (const type of appTypes) {
      if (this.aggregates[type]) {
        plugins.push(this.aggregates[type]);
      }
    }
    
    return plugins;
  },
};
```

#### User Experience with Aggregators

```typescript
// scaffold.config.ts
// Users only specify the aggregator - framework detection is automatic

export default {
  apps: [
    { type: 'nestjs', path: 'apps/api', name: 'api' },
    { type: 'nextjs', path: 'apps/web', name: 'web' },
  ],
  plugins: [
    'auth',    // Automatically uses auth-nestjs + auth-nextjs
    'db',      // Automatically uses db-nestjs + db-nextjs
    'ui',      // Automatically uses ui-nextjs (no NestJS UI)
  ],
}

// Behind the scenes:
// - @scaffold/auth → resolves to [@scaffold/auth-nestjs, @scaffold/auth-nextjs]
// - @scaffold/db → resolves to [@scaffold/db-nestjs, @scaffold/db-nextjs]
// - @scaffold/ui → resolves to [@scaffold/ui-nextjs]
```

### Maximum App Support Principle

> **Goal**: Every plugin should aim to support the maximum number of app types possible.

#### Support Matrix Template

When designing a plugin, create a support matrix:

| Feature | NestJS | Next.js | Express | Fastify | Fumadocs |
|---------|--------|---------|---------|---------|----------|
| Core Package | ✅ | ✅ | ✅ | ✅ | ✅ |
| Framework Plugin | ✅ | ✅ | 🔮 Future | 🔮 Future | ❌ N/A |
| Aggregator | ✅ | ✅ | 🔮 Future | 🔮 Future | ❌ N/A |

#### Current Implementation Status

**Existing Apps in Monorepo:**
- ✅ `api` (NestJS) - Full support
- ✅ `web` (Next.js) - Full support
- ✅ `doc` (Fumadocs) - Documentation app
- ✅ `builder-ui` - UI builder app

**Existing Package Plugins:**
- ✅ `@repo-configs/eslint` - All apps
- ✅ `@repo-configs/prettier` - All apps
- ✅ `@repo-configs/tailwind` - CSS-based apps
- ✅ `@repo-configs/typescript` - All TypeScript apps
- ✅ `@repo-configs/vitest` - All testable apps
- ✅ `@repo/api-contracts` - API apps (NestJS + consumers)
- ✅ `@repo/types` - All apps
- ✅ `@repo/ui-base` - UI apps (Next.js, Fumadocs)
- ✅ `@repo/auth` - Apps requiring auth
- ✅ `@repo/env` - All apps

**Future Plugin Ideas:**

| Plugin | Package (Tier 1) | NestJS (Tier 2) | Next.js (Tier 2) | Aggregator (Tier 3) |
|--------|------------------|-----------------|------------------|---------------------|
| Database | `@repo/db-schema` | `@scaffold/db-nestjs` | `@scaffold/db-nextjs` | `@scaffold/db` |
| Cache | `@repo/cache-utils` | `@scaffold/cache-nestjs` | `@scaffold/cache-nextjs` | `@scaffold/cache` |
| Queue | `@repo/queue-types` | `@scaffold/queue-nestjs` | `@scaffold/queue-nextjs` | `@scaffold/queue` |
| Email | `@repo/email-templates` | `@scaffold/email-nestjs` | `@scaffold/email-nextjs` | `@scaffold/email` |
| Storage | `@repo/storage-utils` | `@scaffold/storage-nestjs` | `@scaffold/storage-nextjs` | `@scaffold/storage` |

### Plugin Design Checklist

When creating a new plugin, follow this checklist:

```markdown
## Plugin Design Checklist

### Tier 1: Package Plugin
- [ ] Create package in `packages/` directory
- [ ] Zero framework imports (no @nestjs/*, no next/*, etc.)
- [ ] Export Zod schemas for validation
- [ ] Export TypeScript types
- [ ] Export pure functions for core logic
- [ ] Export configuration interfaces
- [ ] Add comprehensive unit tests
- [ ] Document public API

### Tier 2: Framework-Specific Plugins
- [ ] Create plugin for each supported framework
- [ ] Import and use Tier 1 package for core logic
- [ ] Implement framework-specific adapters
- [ ] Handle dependency injection (if applicable)
- [ ] Implement routing/middleware (if applicable)
- [ ] Add framework-specific tests
- [ ] Document framework-specific usage

### Tier 3: Aggregator Plugin
- [ ] Create aggregator that references all Tier 2 plugins
- [ ] Implement automatic framework detection
- [ ] Declare package dependencies
- [ ] Provide unified configuration schema
- [ ] Document which frameworks are supported
- [ ] Add integration tests across frameworks
```

---

## Multi-App Type System

### Supported Application Types

| Type | Generator | Default Path | Description |
|------|-----------|--------------|-------------|
| `nestjs` | `NestJSGenerator` | `apps/api` | NestJS API with modules, guards, decorators |
| `nextjs` | `NextJSGenerator` | `apps/web` | Next.js 15+ with App Router |
| `fumadocs` | *Planned* | `apps/docs` | Documentation site |
| `express` | *Planned* | `apps/gateway` | Express.js microservice |
| `fastify` | *Planned* | `apps/service` | Fastify microservice |

### Flexible App Placement

Apps are NOT hardcoded to specific paths. Configuration controls placement:

```typescript
// scaffold.config.ts
export default {
  apps: [
    { type: 'nestjs', path: 'apps/api', name: 'api' },
    { type: 'nestjs', path: 'services/auth', name: 'auth-service' },
    { type: 'nextjs', path: 'apps/web', name: 'web' },
    { type: 'nextjs', path: 'apps/admin', name: 'admin-dashboard' },
    { type: 'fumadocs', path: 'apps/docs', name: 'documentation' },
  ],
  // Each app can have its own plugins
  appPlugins: {
    'api': ['better-auth', 'drizzle', 'orpc'],
    'auth-service': ['better-auth', 'redis', 'job-queue'],
    'web': ['react-query', 'zustand', 'shadcn-ui'],
    'admin-dashboard': ['react-query', 'shadcn-ui', 'next-themes'],
  }
}
```

### Per-App Plugin Registration

Each application maintains its own plugin set:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Monorepo                                  │
├─────────────────────────────────────────────────────────────────┤
│  apps/api (nestjs)           │  apps/web (nextjs)               │
│  ├── better-auth             │  ├── react-query                 │
│  ├── drizzle                 │  ├── zustand                     │
│  ├── orpc                    │  ├── shadcn-ui                   │
│  └── redis                   │  └── next-themes                 │
├──────────────────────────────┼──────────────────────────────────┤
│  services/auth (nestjs)      │  apps/admin (nextjs)             │
│  ├── better-auth             │  ├── react-query                 │
│  ├── job-queue               │  ├── shadcn-ui                   │
│  └── redis                   │  └── admin-dashboard             │
└─────────────────────────────────────────────────────────────────┘

---

## Plugin System

### Two-Tier Architecture: Apps & Plugins

The system distinguishes between **App Types** (application scaffolds) and **Plugins** (features/enhancements):

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP TYPES (Tier 1)                          │
│  Standalone application scaffolds that can exist independently   │
├─────────────────────────────────────────────────────────────────┤
│  • nestjs     - NestJS API application                          │
│  • nextjs     - Next.js web application                         │
│  • fumadocs   - Documentation site                              │
│  • express    - Express.js microservice                         │
│  • fastify    - Fastify microservice                            │
│  • astro      - Astro static/hybrid site                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Plugins attach to Apps
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PLUGINS (Tier 2)                           │
│  Features, enhancements, and bridges that extend apps            │
├─────────────────────────────────────────────────────────────────┤
│  Feature Plugins    │ drizzle, better-auth, zod, react-query    │
│  Enhancement Plugins│ orpc (enhances nestjs controllers)        │
│  Bridge Plugins     │ orpc-better-auth, api-web-connector       │
│  Utility Plugins    │ eslint, prettier, vitest                  │
│  UI Plugins         │ tailwindcss, shadcn-ui, next-themes       │
└─────────────────────────────────────────────────────────────────┘
```

### App Type Definition

```typescript
interface AppType {
  id: AppTypeId;
  name: string;
  description: string;
  framework: 'nestjs' | 'nextjs' | 'express' | 'fastify' | 'astro' | 'fumadocs';
  runtime: 'node' | 'bun' | 'edge';
  category: 'backend' | 'frontend' | 'fullstack' | 'documentation';
  
  // Default configuration
  defaultPath: string;              // e.g., 'apps/api'
  defaultPort: number;              // e.g., 3001
  
  // Capabilities this app type provides
  capabilities: AppCapability[];
  
  // Files this app type generates
  getBaseFiles(context: AppContext): FileSpec[];
}

type AppTypeId = 'nestjs' | 'nextjs' | 'fumadocs' | 'express' | 'fastify' | 'astro';

type AppCapability = 
  | 'http-server'       // Can serve HTTP requests
  | 'api-routes'        // Has API route support
  | 'ssr'               // Server-side rendering
  | 'ssg'               // Static site generation
  | 'database-access'   // Can connect to databases
  | 'auth-provider'     // Can provide authentication
  | 'auth-consumer'     // Can consume authentication
  | 'rpc-server'        // Can serve RPC endpoints
  | 'rpc-client'        // Can consume RPC endpoints
  | 'job-processing'    // Can process background jobs
  | 'websocket'         // WebSocket support
  | 'edge-runtime';     // Edge runtime compatible
```

### Plugin Type Categories

```typescript
type PluginType = 
  | 'feature'       // Standalone feature (drizzle, zod, react-query)
  | 'enhancement'   // Modifies existing behavior (orpc over nestjs)
  | 'bridge'        // Connects two plugins/apps (orpc-better-auth)
  | 'utility'       // Dev tooling (eslint, prettier, vitest)
  | 'ui'            // UI components (tailwind, shadcn)
  | 'infrastructure'// DevOps (docker, kubernetes)
  | 'integration';  // Third-party integrations (stripe, sendgrid)
```

### Plugin Definition with App Support

```typescript
interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  type: PluginType;
  
  // CRITICAL: Which app types this plugin supports
  supportedApps: AppTypeId[] | '*';  // '*' means all apps
  
  // Validation function - can this plugin work with given app?
  validateAppSupport(appType: AppTypeId, appConfig: AppConfig): ValidationResult;
  
  // Dependencies
  dependencies?: PluginDependency[];
  optionalDependencies?: PluginDependency[];
  conflicts?: string[];
  
  // For enhancement plugins - which plugins does this enhance?
  enhances?: string[];
  
  // For bridge plugins - which two things does this connect?
  bridges?: {
    source: string;  // Plugin or App ID
    target: string;  // Plugin or App ID
  };
  
  // Required capabilities from the app
  requiredCapabilities?: AppCapability[];
  
  // Capabilities this plugin provides
  providesCapabilities?: AppCapability[];
}

interface PluginDependency {
  pluginId: PluginSymbol;  // MUST be a symbol, not a string
  optional?: boolean;
  version?: string;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

### Plugin Symbol System (Type-Safe Dependencies)

Every plugin **MUST** export a unique symbol. This ensures:
- **Compile-time safety** - No typos in dependency references
- **Refactoring safety** - Rename detection via IDE
- **Uniqueness guarantee** - Symbols are guaranteed unique
- **Import tracking** - Clear dependency graph via imports

#### Why Symbols Over Strings?

```typescript
// ❌ BAD: String-based dependencies (error-prone)
const myPlugin: PluginDefinition = {
  dependencies: [
    { pluginId: 'betterauth' },    // Typo! Should be 'better-auth'
    { pluginId: 'react-qurey' },   // Typo! Should be 'react-query'
    { pluginId: 'zod' },           // Works, but no compile-time check
  ],
};

// ✅ GOOD: Symbol-based dependencies (type-safe)
import { BETTER_AUTH, REACT_QUERY, ZOD } from '@scaffold/plugin-symbols';

const myPlugin: PluginDefinition = {
  dependencies: [
    { pluginId: BETTER_AUTH },     // Type-checked, auto-complete
    { pluginId: REACT_QUERY },     // IDE catches typos immediately
    { pluginId: ZOD },             // Clear import graph
  ],
};
```

#### Plugin Symbol Definition

Each plugin exports its symbol from a dedicated file:

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// PLUGIN SYMBOL DEFINITION PATTERN
// ═══════════════════════════════════════════════════════════════════════════

// plugins/drizzle/symbol.ts
export const DRIZZLE = Symbol.for('plugin:drizzle');
export type DrizzleSymbol = typeof DRIZZLE;

// plugins/better-auth/symbol.ts
export const BETTER_AUTH = Symbol.for('plugin:better-auth');
export type BetterAuthSymbol = typeof BETTER_AUTH;

// plugins/orpc/symbol.ts
export const ORPC = Symbol.for('plugin:orpc');
export type OrpcSymbol = typeof ORPC;

// plugins/react-query/symbol.ts
export const REACT_QUERY = Symbol.for('plugin:react-query');
export type ReactQuerySymbol = typeof REACT_QUERY;

// plugins/zustand/symbol.ts  
export const ZUSTAND = Symbol.for('plugin:zustand');
export type ZustandSymbol = typeof ZUSTAND;

// plugins/shadcn-ui/symbol.ts
export const SHADCN_UI = Symbol.for('plugin:shadcn-ui');
export type ShadcnUiSymbol = typeof SHADCN_UI;

// plugins/tailwindcss/symbol.ts
export const TAILWINDCSS = Symbol.for('plugin:tailwindcss');
export type TailwindcssSymbol = typeof TAILWINDCSS;

// plugins/typescript/symbol.ts
export const TYPESCRIPT = Symbol.for('plugin:typescript');
export type TypescriptSymbol = typeof TYPESCRIPT;

// plugins/eslint/symbol.ts
export const ESLINT = Symbol.for('plugin:eslint');
export type EslintSymbol = typeof ESLINT;

// plugins/vitest/symbol.ts
export const VITEST = Symbol.for('plugin:vitest');
export type VitestSymbol = typeof VITEST;

// plugins/zod/symbol.ts
export const ZOD = Symbol.for('plugin:zod');
export type ZodSymbol = typeof ZOD;
```

#### Central Symbol Registry

All plugin symbols are re-exported from a central registry:

```typescript
// src/plugins/symbols/index.ts
// ═══════════════════════════════════════════════════════════════════════════
// CENTRAL PLUGIN SYMBOL REGISTRY
// All plugin symbols MUST be registered here
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// CORE PLUGINS
// ─────────────────────────────────────────────────────────────────────────────
export { TYPESCRIPT, type TypescriptSymbol } from '../typescript/symbol';
export { ESLINT, type EslintSymbol } from '../eslint/symbol';
export { PRETTIER, type PrettierSymbol } from '../prettier/symbol';
export { ZOD, type ZodSymbol } from '../zod/symbol';
export { VITEST, type VitestSymbol } from '../vitest/symbol';
export { BUN_RUNTIME, type BunRuntimeSymbol } from '../bun-runtime/symbol';
export { TURBOREPO, type TurborepoSymbol } from '../turborepo/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// APP TYPE SYMBOLS
// ─────────────────────────────────────────────────────────────────────────────
export { NESTJS, type NestjsSymbol } from '../nestjs/symbol';
export { NEXTJS, type NextjsSymbol } from '../nextjs/symbol';
export { ASTRO, type AstroSymbol } from '../astro/symbol';
export { EXPRESS, type ExpressSymbol } from '../express/symbol';
export { FASTIFY, type FastifySymbol } from '../fastify/symbol';
export { FUMADOCS, type FumadocsSymbol } from '../fumadocs/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE PLUGINS
// ─────────────────────────────────────────────────────────────────────────────
export { DRIZZLE, type DrizzleSymbol } from '../drizzle/symbol';
export { DATABASE_SEEDER, type DatabaseSeederSymbol } from '../database-seeder/symbol';
export { POSTGRESQL, type PostgresqlSymbol } from '../postgresql/symbol';
export { REDIS, type RedisSymbol } from '../redis/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION PLUGINS
// ─────────────────────────────────────────────────────────────────────────────
export { BETTER_AUTH, type BetterAuthSymbol } from '../better-auth/symbol';
export { API_KEY_AUTH, type ApiKeyAuthSymbol } from '../api-key-auth/symbol';
export { PERMISSION_SYSTEM, type PermissionSystemSymbol } from '../permission-system/symbol';
export { BETTER_AUTH_ADMIN, type BetterAuthAdminSymbol } from '../better-auth-admin/symbol';
export { BETTER_AUTH_OAUTH_GOOGLE, type BetterAuthOAuthGoogleSymbol } from '../better-auth-oauth-google/symbol';
export { BETTER_AUTH_OAUTH_GITHUB, type BetterAuthOAuthGithubSymbol } from '../better-auth-oauth-github/symbol';
export { BETTER_AUTH_OAUTH_DISCORD, type BetterAuthOAuthDiscordSymbol } from '../better-auth-oauth-discord/symbol';
export { BETTER_AUTH_BEARER, type BetterAuthBearerSymbol } from '../better-auth-bearer/symbol';
export { BETTER_AUTH_TWO_FACTOR, type BetterAuthTwoFactorSymbol } from '../better-auth-two-factor/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// API/RPC PLUGINS
// ─────────────────────────────────────────────────────────────────────────────
export { ORPC, type OrpcSymbol } from '../orpc/symbol';
export { ORPC_CONTRACTS, type OrpcContractsSymbol } from '../orpc-contracts/symbol';
export { ORPC_STREAMING, type OrpcStreamingSymbol } from '../orpc-streaming/symbol';
export { ORPC_BETTER_AUTH, type OrpcBetterAuthSymbol } from '../orpc-better-auth/symbol';
export { ORPC_REACT_QUERY, type OrpcReactQuerySymbol } from '../orpc-react-query/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// STATE MANAGEMENT PLUGINS
// ─────────────────────────────────────────────────────────────────────────────
export { REACT_QUERY, type ReactQuerySymbol } from '../react-query/symbol';
export { ZUSTAND, type ZustandSymbol } from '../zustand/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// UI PLUGINS
// ─────────────────────────────────────────────────────────────────────────────
export { TAILWINDCSS, type TailwindcssSymbol } from '../tailwindcss/symbol';
export { SHADCN_UI, type ShadcnUiSymbol } from '../shadcn-ui/symbol';
export { NEXT_THEMES, type NextThemesSymbol } from '../next-themes/symbol';
export { LUCIDE_ICONS, type LucideIconsSymbol } from '../lucide-icons/symbol';
export { TOAST_SONNER, type ToastSonnerSymbol } from '../toast-sonner/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// INFRASTRUCTURE PLUGINS
// ─────────────────────────────────────────────────────────────────────────────
export { DOCKER, type DockerSymbol } from '../docker/symbol';
export { DOCKER_COMPOSE, type DockerComposeSymbol } from '../docker-compose/symbol';
export { GITHUB_ACTIONS, type GithubActionsSymbol } from '../github-actions/symbol';
export { CI_CD, type CiCdSymbol } from '../ci-cd/symbol';
export { JOB_QUEUE, type JobQueueSymbol } from '../job-queue/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// PACKAGE PLUGINS (for shared packages)
// ─────────────────────────────────────────────────────────────────────────────
export { ESLINT_CONFIG, type EslintConfigSymbol } from '../eslint-config/symbol';
export { TYPESCRIPT_CONFIG, type TypescriptConfigSymbol } from '../typescript-config/symbol';
export { PRETTIER_CONFIG, type PrettierConfigSymbol } from '../prettier-config/symbol';
export { VITEST_CONFIG, type VitestConfigSymbol } from '../vitest-config/symbol';
export { TAILWIND_CONFIG, type TailwindConfigSymbol } from '../tailwind-config/symbol';
export { SHARED_TYPES, type SharedTypesSymbol } from '../shared-types/symbol';
export { AUTH_TYPES, type AuthTypesSymbol } from '../auth-types/symbol';
export { AUTH_UTILS, type AuthUtilsSymbol } from '../auth-utils/symbol';
export { UI_BASE, type UiBaseSymbol } from '../ui-base/symbol';

// ─────────────────────────────────────────────────────────────────────────────
// SYMBOL TYPE UNION
// ─────────────────────────────────────────────────────────────────────────────
export type PluginSymbol =
  // Core
  | TypescriptSymbol | EslintSymbol | PrettierSymbol | ZodSymbol | VitestSymbol
  | BunRuntimeSymbol | TurborepoSymbol
  // App Types
  | NestjsSymbol | NextjsSymbol | AstroSymbol | ExpressSymbol | FastifySymbol | FumadocsSymbol
  // Database
  | DrizzleSymbol | DatabaseSeederSymbol | PostgresqlSymbol | RedisSymbol
  // Auth
  | BetterAuthSymbol | ApiKeyAuthSymbol | PermissionSystemSymbol | BetterAuthAdminSymbol
  | BetterAuthOAuthGoogleSymbol | BetterAuthOAuthGithubSymbol | BetterAuthOAuthDiscordSymbol
  | BetterAuthBearerSymbol | BetterAuthTwoFactorSymbol
  // API/RPC
  | OrpcSymbol | OrpcContractsSymbol | OrpcStreamingSymbol | OrpcBetterAuthSymbol | OrpcReactQuerySymbol
  // State
  | ReactQuerySymbol | ZustandSymbol
  // UI
  | TailwindcssSymbol | ShadcnUiSymbol | NextThemesSymbol | LucideIconsSymbol | ToastSonnerSymbol
  // Infrastructure
  | DockerSymbol | DockerComposeSymbol | GithubActionsSymbol | CiCdSymbol | JobQueueSymbol
  // Package Plugins
  | EslintConfigSymbol | TypescriptConfigSymbol | PrettierConfigSymbol | VitestConfigSymbol
  | TailwindConfigSymbol | SharedTypesSymbol | AuthTypesSymbol | AuthUtilsSymbol | UiBaseSymbol;

// ─────────────────────────────────────────────────────────────────────────────
// SYMBOL LOOKUP MAP (for runtime resolution)
// ─────────────────────────────────────────────────────────────────────────────
export const PLUGIN_SYMBOL_MAP: ReadonlyMap<string, PluginSymbol> = new Map([
  ['typescript', TYPESCRIPT],
  ['eslint', ESLINT],
  ['prettier', PRETTIER],
  ['zod', ZOD],
  ['vitest', VITEST],
  ['drizzle', DRIZZLE],
  ['better-auth', BETTER_AUTH],
  ['orpc', ORPC],
  ['react-query', REACT_QUERY],
  ['zustand', ZUSTAND],
  ['tailwindcss', TAILWINDCSS],
  ['shadcn-ui', SHADCN_UI],
  // ... all other mappings
]);

// Reverse lookup: symbol to string ID
export const SYMBOL_TO_ID_MAP: ReadonlyMap<PluginSymbol, string> = new Map(
  Array.from(PLUGIN_SYMBOL_MAP.entries()).map(([id, sym]) => [sym, id])
);
```

#### Using Symbols in Plugin Definitions

```typescript
// plugins/orpc/definition.ts
import { ORPC, ZOD, TYPESCRIPT, NESTJS, NEXTJS } from '../symbols';
import { OrpcConfigSchema } from './config';

export const orpcPlugin: PluginDefinition = {
  symbol: ORPC,                    // Plugin's own symbol
  id: 'orpc',                      // String ID (derived from symbol)
  name: 'oRPC Type-Safe RPC',
  type: 'enhancement',
  configSchema: OrpcConfigSchema,  // Zod schema for config
  
  supportedApps: [NESTJS, NEXTJS], // App symbols, not strings!
  
  dependencies: [
    { pluginId: ZOD },             // Symbol reference
    { pluginId: TYPESCRIPT },      // Symbol reference
  ],
  
  // ... rest of definition
};

// plugins/orpc-better-auth/definition.ts
import { ORPC_BETTER_AUTH, ORPC, BETTER_AUTH, NESTJS, NEXTJS } from '../symbols';

export const orpcBetterAuthBridge: PluginDefinition = {
  symbol: ORPC_BETTER_AUTH,
  id: 'orpc-better-auth',
  name: 'oRPC + Better Auth Bridge',
  type: 'bridge',
  
  supportedApps: [NESTJS, NEXTJS],
  
  bridges: {
    source: ORPC,                  // Symbol reference
    target: BETTER_AUTH,           // Symbol reference
  },
  
  dependencies: [
    { pluginId: ORPC },            // Symbol reference
    { pluginId: BETTER_AUTH },     // Symbol reference
  ],
};
```

#### Symbol-Based Type Safety in Generators

```typescript
// In generator context, type-safe plugin checks
class OrpcGenerator extends PluginGenerator {
  protected override metadata = {
    symbol: ORPC,
    pluginId: 'orpc',
    // ...
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];
    
    // Type-safe plugin checks using symbols
    if (this.hasPlugin(context, BETTER_AUTH)) {
      // BETTER_AUTH is a symbol, compiler ensures it exists
      files.push(this.generateAuthIntegration(context));
    }
    
    if (this.hasPlugin(context, REACT_QUERY)) {
      // Type-checked at compile time
      files.push(this.generateReactQueryHooks(context));
    }
    
    return files;
  }
  
  // Type-safe dependency access
  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      { symbol: ZOD, package: 'zod', version: '^3.23.0' },
      { symbol: TYPESCRIPT, package: 'typescript', version: '^5.0.0', dev: true },
    ];
  }
}

// Updated hasPlugin signature - accepts only symbols
function hasPlugin(context: GeneratorContext, symbol: PluginSymbol): boolean {
  return context.enabledPlugins.has(symbol);
}

// Type-safe plugin retrieval
function getPluginConfig<T extends PluginSymbol>(
  context: GeneratorContext,
  symbol: T
): PluginConfigMap[T] | undefined {
  return context.pluginConfigs.get(symbol) as PluginConfigMap[T];
}
```

#### Complete Plugin File Structure

Each plugin should have this file structure:

```
plugins/
├── drizzle/
│   ├── symbol.ts              # Export: DRIZZLE symbol
│   ├── config.ts              # Export: DrizzleConfigSchema (Zod)
│   ├── definition.ts          # Export: drizzlePlugin definition
│   ├── generator.ts           # Export: DrizzleGenerator class
│   └── index.ts               # Re-export all
│
├── better-auth/
│   ├── symbol.ts              # Export: BETTER_AUTH symbol
│   ├── config.ts              # Export: BetterAuthConfigSchema
│   ├── definition.ts          # Export: betterAuthPlugin definition
│   ├── generator.ts           # Export: BetterAuthGenerator class
│   └── index.ts
│
├── orpc/
│   ├── symbol.ts              # Export: ORPC symbol
│   ├── config.ts              # Export: OrpcConfigSchema
│   ├── definition.ts          # Export: orpcPlugin definition
│   ├── generator.ts           # Export: OrpcGenerator class
│   └── index.ts
│
└── symbols/
    └── index.ts               # Central symbol registry (re-exports all)
```

#### Plugin Symbol Validation

The system validates that all symbols are properly registered:

```typescript
// src/plugins/validation/symbol-validator.ts

export function validatePluginSymbols(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check all plugins have symbols
  for (const plugin of getAllPlugins()) {
    if (!plugin.symbol) {
      errors.push(`Plugin "${plugin.id}" is missing required symbol export`);
    }
    
    // Verify symbol matches ID convention
    const expectedSymbol = Symbol.for(`plugin:${plugin.id}`);
    if (plugin.symbol !== expectedSymbol) {
      errors.push(
        `Plugin "${plugin.id}" symbol mismatch. ` +
        `Expected Symbol.for('plugin:${plugin.id}')`
      );
    }
  }
  
  // 2. Check all dependencies use symbols
  for (const plugin of getAllPlugins()) {
    for (const dep of plugin.dependencies ?? []) {
      if (typeof dep.pluginId === 'string') {
        errors.push(
          `Plugin "${plugin.id}" uses string dependency "${dep.pluginId}". ` +
          `Must use symbol import instead.`
        );
      }
    }
  }
  
  // 3. Check for duplicate symbols
  const symbolMap = new Map<symbol, string>();
  for (const plugin of getAllPlugins()) {
    if (symbolMap.has(plugin.symbol)) {
      errors.push(
        `Duplicate symbol detected: ${plugin.id} and ${symbolMap.get(plugin.symbol)}`
      );
    }
    symbolMap.set(plugin.symbol, plugin.id);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
```
```

### Plugin Type Examples

#### Feature Plugin (Standalone Feature)

```typescript
import { DRIZZLE, ZOD, POSTGRESQL, NESTJS, NEXTJS, EXPRESS, FASTIFY, PRISMA, TYPEORM } from '../symbols';
import { DrizzleConfigSchema } from './config';

const drizzlePlugin: PluginDefinition = {
  symbol: DRIZZLE,                 // Plugin's own symbol (REQUIRED)
  id: 'drizzle',
  name: 'Drizzle ORM',
  type: 'feature',
  configSchema: DrizzleConfigSchema,
  supportedApps: [NESTJS, NEXTJS, EXPRESS, FASTIFY],  // Symbols, not strings!
  
  requiredCapabilities: ['database-access'],
  providesCapabilities: ['database-access'],
  
  dependencies: [
    { pluginId: ZOD },                        // Symbol reference
    { pluginId: POSTGRESQL, optional: true }, // Symbol with optional flag
  ],
  conflicts: [PRISMA, TYPEORM],               // Symbol references for conflicts
  
  validateAppSupport(appSymbol, appConfig) {
    const supported = [NESTJS, NEXTJS, EXPRESS, FASTIFY];
    if (!supported.includes(appSymbol)) {
      return { 
        valid: false, 
        errors: [`Drizzle does not support this app type`] 
      };
    }
    return { valid: true };
  }
};
```

#### Enhancement Plugin (Modifies Existing Behavior)

```typescript
import { ORPC, ZOD, TYPESCRIPT, NESTJS, NEXTJS } from '../symbols';
import { OrpcConfigSchema } from './config';

const orpcPlugin: PluginDefinition = {
  symbol: ORPC,                    // Plugin's own symbol (REQUIRED)
  id: 'orpc',
  name: 'oRPC Type-Safe RPC',
  type: 'enhancement',
  configSchema: OrpcConfigSchema,
  supportedApps: [NESTJS, NEXTJS],  // Symbols, not strings!
  
  // oRPC ENHANCES existing NestJS controllers
  enhances: ['nestjs-controllers'],
  
  requiredCapabilities: ['http-server'],
  providesCapabilities: ['rpc-server', 'rpc-client'],
  
  dependencies: [
    { pluginId: ZOD },             // Symbol reference
    { pluginId: TYPESCRIPT },      // Symbol reference
  ],
  
  validateAppSupport(appSymbol, appConfig) {
    if (appSymbol === NESTJS) {
      return { valid: true };  // Full support - enhances controllers
    }
    if (appSymbol === NEXTJS) {
      return { valid: true };  // Client-side support
    }
    return { 
      valid: false, 
      errors: [`oRPC requires nestjs (server) or nextjs (client)`] 
    };
  }
};
```

#### Bridge Plugin (Connects Two Things)

```typescript
import { 
  ORPC_BETTER_AUTH, ORPC, BETTER_AUTH, 
  NESTJS, NEXTJS, API_WEB_CONNECTOR 
} from '../symbols';

const orpcBetterAuthBridge: PluginDefinition = {
  symbol: ORPC_BETTER_AUTH,        // Plugin's own symbol (REQUIRED)
  id: 'orpc-better-auth',
  name: 'oRPC + Better Auth Bridge',
  type: 'bridge',
  supportedApps: [NESTJS, NEXTJS],  // Symbols!
  
  // This plugin BRIDGES orpc and better-auth (using symbols)
  bridges: {
    source: ORPC,                   // Symbol reference
    target: BETTER_AUTH,            // Symbol reference
  },
  
  dependencies: [
    { pluginId: ORPC },             // Symbol reference
    { pluginId: BETTER_AUTH },      // Symbol reference
  ],
  
  validateAppSupport(appSymbol, appConfig) {
    // Bridge requires both source and target plugins
    return { valid: true };
  }
};

const apiWebConnector: PluginDefinition = {
  symbol: API_WEB_CONNECTOR,       // Plugin's own symbol (REQUIRED)
  id: 'api-web-connector',
  name: 'API ↔ Web Connector',
  type: 'bridge',
  supportedApps: '*',  // Works with any app combination
  
  // Bridges an API app to a Web app (using symbols)
  bridges: {
    source: NESTJS,                 // Symbol reference for app type
    target: NEXTJS,                 // Symbol reference for app type
  },
  
  validateAppSupport(appSymbol, appConfig) {
    return { valid: true };
  }
};
```

#### Utility Plugin (Dev Tooling)

```typescript
import { ESLINT, TYPESCRIPT } from '../symbols';
import { EslintConfigSchema } from './config';

const eslintPlugin: PluginDefinition = {
  symbol: ESLINT,                  // Plugin's own symbol (REQUIRED)
  id: 'eslint',
  name: 'ESLint',
  type: 'utility',
  configSchema: EslintConfigSchema,
  supportedApps: '*',  // Works with ALL app types
  
  dependencies: [
    { pluginId: TYPESCRIPT },       // Symbol reference
  ],
  
  validateAppSupport(appSymbol, appConfig) {
    return { valid: true };  // Universal support
  }
};
```

#### UI Plugin (Frontend Only)

```typescript
import { SHADCN_UI, TAILWINDCSS, REACT, NEXTJS, ASTRO } from '../symbols';
import { ShadcnUiConfigSchema } from './config';

const shadcnPlugin: PluginDefinition = {
  symbol: SHADCN_UI,               // Plugin's own symbol (REQUIRED)
  id: 'shadcn-ui',
  name: 'shadcn/ui Components',
  type: 'ui',
  configSchema: ShadcnUiConfigSchema,
  supportedApps: [NEXTJS, ASTRO],  // Frontend only (symbols!)
  
  requiredCapabilities: ['ssr', 'ssg'],
  
  dependencies: [
    { pluginId: TAILWINDCSS },              // Symbol reference
    { pluginId: REACT, optional: true },    // Symbol reference, optional
  ],
  
  validateAppSupport(appSymbol, appConfig) {
    const supported = [NEXTJS, ASTRO];
    if (!supported.includes(appSymbol)) {
      return { 
        valid: false, 
        errors: [`shadcn/ui requires a frontend framework (nextjs, astro)`] 
      };
    }
    return { valid: true };
  }
};
```

### Complete Plugin Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLUGIN TYPES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FEATURE PLUGINS (Standalone capabilities)                       │
│  ├── DRIZZLE          [NESTJS, NEXTJS, EXPRESS, FASTIFY]        │
│  ├── BETTER_AUTH      [NESTJS, NEXTJS]                          │
│  ├── ZOD              [*]                                       │
│  ├── REACT_QUERY      [NEXTJS, ASTRO]                           │
│  ├── ZUSTAND          [NEXTJS, ASTRO]                           │
│  ├── JOB_QUEUE        [NESTJS, EXPRESS, FASTIFY]                │
│  └── REDIS            [NESTJS, EXPRESS, FASTIFY]                │
│                                                                  │
│  ENHANCEMENT PLUGINS (Modify existing behavior)                  │
│  ├── ORPC             [NESTJS, NEXTJS] → enhances controllers   │
│  ├── GRAPHQL          [NESTJS] → adds GraphQL layer             │
│  ├── SWAGGER          [NESTJS] → adds OpenAPI docs              │
│  └── TRPC             [NEXTJS] → type-safe API                  │
│                                                                  │
│  BRIDGE PLUGINS (Connect two plugins or apps)                    │
│  ├── ORPC_BETTER_AUTH     bridges: ORPC ↔ BETTER_AUTH           │
│  ├── ORPC_REACT_QUERY     bridges: ORPC ↔ REACT_QUERY           │
│  ├── DRIZZLE_BETTER_AUTH  bridges: DRIZZLE ↔ BETTER_AUTH        │
│  ├── API_WEB_CONNECTOR    bridges: NESTJS ↔ NEXTJS              │
│  └── AUTH_SESSION_SYNC    bridges: api ↔ web                    │
│                                                                  │
│  UTILITY PLUGINS (Dev tooling - universal)                       │
│  ├── TYPESCRIPT       [*]                                       │
│  ├── ESLINT           [*]                                       │
│  ├── PRETTIER         [*]                                       │
│  ├── VITEST           [*]                                       │
│  └── HUSKY            [*]                                       │
│                                                                  │
│  UI PLUGINS (Frontend only)                                      │
│  ├── TAILWINDCSS      [NEXTJS, ASTRO, FUMADOCS]                 │
│  ├── SHADCN_UI        [NEXTJS, ASTRO]                           │
│  ├── NEXT_THEMES      [NEXTJS]                                  │
│  └── LUCIDE_ICONS     [NEXTJS, ASTRO]                           │
│                                                                  │
│  INFRASTRUCTURE PLUGINS (DevOps)                                 │
│  ├── DOCKER           [*]                                       │
│  ├── DOCKER_COMPOSE   [*]                                       │
│  ├── POSTGRESQL       [NESTJS, EXPRESS, FASTIFY]                │
│  ├── GITHUB_ACTIONS   [*]                                       │
│  └── KUBERNETES       [*]                                       │
│                                                                  │
│  INTEGRATION PLUGINS (Third-party services)                      │
│  ├── stripe           [nestjs, nextjs]                          │
│  ├── sendgrid         [nestjs, nextjs]                          │
│  ├── s3-storage       [nestjs, nextjs]                          │
│  └── sentry           [*]                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Resolution & Validation

#### Resolution Flow

```typescript
class PluginResolverService {
  /**
   * Resolves plugins for a specific app configuration
   */
  resolveForApp(
    appType: AppTypeId,
    appConfig: AppConfig,
    requestedPlugins: string[]
  ): PluginResolutionResult {
    
    const result: PluginResolutionResult = {
      enabled: [],
      disabled: [],
      errors: [],
      warnings: [],
    };
    
    for (const pluginId of requestedPlugins) {
      const plugin = this.registry.get(pluginId);
      
      // 1. Validate app support
      const validation = plugin.validateAppSupport(appType, appConfig);
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        result.disabled.push(pluginId);
        continue;
      }
      
      // 2. Check required capabilities
      if (plugin.requiredCapabilities) {
        const appCapabilities = this.getAppCapabilities(appType);
        const missing = plugin.requiredCapabilities.filter(
          cap => !appCapabilities.includes(cap)
        );
        if (missing.length > 0) {
          result.errors.push(
            `Plugin ${pluginId} requires capabilities: ${missing.join(', ')}`
          );
          continue;
        }
      }
      
      // 3. Resolve dependencies (recursive)
      const deps = this.resolveDependencies(plugin, appType, appConfig);
      result.enabled.push(...deps.enabled);
      result.errors.push(...deps.errors);
      
      // 4. Check conflicts
      const conflicts = this.checkConflicts(pluginId, result.enabled);
      if (conflicts.length > 0) {
        result.errors.push(
          `Plugin ${pluginId} conflicts with: ${conflicts.join(', ')}`
        );
        continue;
      }
      
      result.enabled.push(pluginId);
    }
    
    // 5. Topological sort by dependencies
    result.enabled = this.topologicalSort(result.enabled);
    
    // 6. Generate warnings for recommended plugins
    result.warnings = this.getRecommendations(result.enabled, appType);
    
    return result;
  }
}
```

#### Multi-App Resolution

When resolving plugins across multiple apps:

```typescript
interface MonorepoConfig {
  apps: AppDefinition[];
  sharedPlugins: string[];     // Applied to all apps
  perAppPlugins: Record<string, string[]>;
  connections: ConnectionDefinition[];
}

class MonorepoPluginResolver {
  resolve(config: MonorepoConfig): MonorepoResolutionResult {
    const result: MonorepoResolutionResult = {
      apps: {},
      bridges: [],
      errors: [],
    };
    
    // 1. Resolve shared plugins for each app
    for (const app of config.apps) {
      const appPlugins = [
        ...config.sharedPlugins,
        ...(config.perAppPlugins[app.name] || []),
      ];
      
      result.apps[app.name] = this.resolver.resolveForApp(
        app.type,
        app.config,
        appPlugins
      );
    }
    
    // 2. Resolve bridge plugins
    for (const connection of config.connections) {
      const bridgePlugin = this.findBridgePlugin(
        connection.from,
        connection.to,
        connection.via
      );
      
      if (bridgePlugin) {
        // Validate bridge can work with both apps
        const sourceApp = config.apps.find(a => a.name === connection.from);
        const targetApp = config.apps.find(a => a.name === connection.to);
        
        const valid = bridgePlugin.validateAppSupport(sourceApp.type, sourceApp.config)
                   && bridgePlugin.validateAppSupport(targetApp.type, targetApp.config);
        
        if (valid) {
          result.bridges.push({
            plugin: bridgePlugin.id,
            source: connection.from,
            target: connection.to,
          });
        }
      }
    }
    
    return result;
  }
}
```

### App Capability Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APP CAPABILITY MATRIX                                 │
├─────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬────────┤
│ Capability  │ nestjs   │ nextjs   │ express  │ fastify  │ astro    │fumadocs│
├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ http-server │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │   ✅   │
│ api-routes  │    ✅    │    ✅    │    ✅    │    ✅    │    ✅    │   ❌   │
│ ssr         │    ❌    │    ✅    │    ❌    │    ❌    │    ✅    │   ✅   │
│ ssg         │    ❌    │    ✅    │    ❌    │    ❌    │    ✅    │   ✅   │
│ database    │    ✅    │    ✅    │    ✅    │    ✅    │    ❌    │   ❌   │
│ auth-server │    ✅    │    ✅    │    ✅    │    ✅    │    ❌    │   ❌   │
│ auth-client │    ❌    │    ✅    │    ❌    │    ❌    │    ✅    │   ❌   │
│ rpc-server  │    ✅    │    ❌    │    ✅    │    ✅    │    ❌    │   ❌   │
│ rpc-client  │    ❌    │    ✅    │    ❌    │    ❌    │    ✅    │   ❌   │
│ jobs        │    ✅    │    ❌    │    ✅    │    ✅    │    ❌    │   ❌   │
│ websocket   │    ✅    │    ❌    │    ✅    │    ✅    │    ❌    │   ❌   │
│ edge        │    ❌    │    ✅    │    ❌    │    ❌    │    ✅    │   ✅   │
└─────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴────────┘
```

### Plugin → App Support Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PLUGIN → APP SUPPORT MATRIX                           │
├──────────────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Plugin           │ nestjs   │ nextjs   │ express  │ fastify  │ fumadocs     │
├──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤
│ drizzle          │    ✅    │    ✅    │    ✅    │    ✅    │      ❌      │
│ better-auth      │    ✅    │    ✅    │    ✅    │    ✅    │      ❌      │
│ orpc (server)    │    ✅    │    ❌    │    ❌    │    ❌    │      ❌      │
│ orpc (client)    │    ❌    │    ✅    │    ❌    │    ❌    │      ❌      │
│ react-query      │    ❌    │    ✅    │    ❌    │    ❌    │      ✅      │
│ zustand          │    ❌    │    ✅    │    ❌    │    ❌    │      ❌      │
│ shadcn-ui        │    ❌    │    ✅    │    ❌    │    ❌    │      ✅      │
│ tailwindcss      │    ❌    │    ✅    │    ❌    │    ❌    │      ✅      │
│ job-queue        │    ✅    │    ❌    │    ✅    │    ✅    │      ❌      │
│ redis            │    ✅    │    ❌    │    ✅    │    ✅    │      ❌      │
│ typescript       │    ✅    │    ✅    │    ✅    │    ✅    │      ✅      │
│ eslint           │    ✅    │    ✅    │    ✅    │    ✅    │      ✅      │
│ docker           │    ✅    │    ✅    │    ✅    │    ✅    │      ✅      │
└──────────────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
```

---

## Generator System

### Two Generator Types: App Generators & Plugin Generators

The system now separates **App Generators** (create application scaffolds) from **Plugin Generators** (add features):

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP GENERATORS                                │
│  Create standalone application scaffolds                         │
├─────────────────────────────────────────────────────────────────┤
│  NestJSAppGenerator      Priority: 10                           │
│  NextJSAppGenerator      Priority: 10                           │
│  FumadocsAppGenerator    Priority: 10                           │
│  ExpressAppGenerator     Priority: 10                           │
│  FastifyAppGenerator     Priority: 10                           │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ After apps are created
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PLUGIN GENERATORS                              │
│  Add features to existing apps (check supportedApps)            │
├─────────────────────────────────────────────────────────────────┤
│  Feature:       DrizzleGenerator, BetterAuthGenerator, etc.     │
│  Enhancement:   OrpcGenerator (transforms NestJS controllers)   │
│  Bridge:        OrpcBetterAuthBridgeGenerator                   │
│  Utility:       ESLintGenerator, PrettierGenerator, etc.        │
│  UI:            TailwindGenerator, ShadcnGenerator, etc.        │
└─────────────────────────────────────────────────────────────────┘
```

### App Generator Base Class

```typescript
abstract class AppGenerator {
  abstract readonly appType: AppTypeId;
  abstract readonly capabilities: AppCapability[];
  
  // Generate the base application structure
  abstract generateApp(context: AppGeneratorContext): AppGeneratorResult;
  
  // Get the default configuration for this app type
  abstract getDefaultConfig(): AppConfig;
  
  // Validate if a plugin can be added to this app
  validatePlugin(plugin: PluginDefinition): ValidationResult {
    // Check if plugin supports this app type
    if (plugin.supportedApps !== '*' && 
        !plugin.supportedApps.includes(this.appType)) {
      return { 
        valid: false, 
        errors: [`${plugin.id} does not support ${this.appType}`] 
      };
    }
    
    // Check required capabilities
    if (plugin.requiredCapabilities) {
      const missing = plugin.requiredCapabilities.filter(
        cap => !this.capabilities.includes(cap)
      );
      if (missing.length > 0) {
        return {
          valid: false,
          errors: [`Missing capabilities: ${missing.join(', ')}`]
        };
      }
    }
    
    return { valid: true };
  }
}
```

### Plugin Generator Base Class

```typescript
abstract class PluginGenerator {
  abstract readonly pluginId: string;
  abstract readonly pluginType: PluginType;
  abstract readonly supportedApps: AppTypeId[] | '*';
  
  // Validate if this plugin can work with the given app
  abstract validateAppSupport(
    appType: AppTypeId, 
    appConfig: AppConfig
  ): ValidationResult;
  
  // Get list of supported apps (for documentation/UI)
  getSupportedApps(): AppTypeId[] {
    if (this.supportedApps === '*') {
      return ['nestjs', 'nextjs', 'express', 'fastify', 'astro', 'fumadocs'];
    }
    return this.supportedApps;
  }
  
  // Generate files for a specific app
  abstract generateForApp(
    appType: AppTypeId,
    context: PluginGeneratorContext
  ): PluginGeneratorResult;
}
```

### Enhancement Generator (Modifies Existing Code)

```typescript
abstract class EnhancementGenerator extends PluginGenerator {
  readonly pluginType = 'enhancement';
  
  // Which existing functionality does this enhance?
  abstract readonly enhances: string[];
  
  // Generate AST transforms to modify existing code
  abstract getTransforms(
    appType: AppTypeId,
    context: PluginGeneratorContext
  ): ASTTransform[];
}

// Example: oRPC enhances NestJS controllers
class OrpcEnhancementGenerator extends EnhancementGenerator {
  readonly pluginId = 'orpc';
  readonly supportedApps: AppTypeId[] = ['nestjs'];
  readonly enhances = ['nestjs-controllers'];
  
  validateAppSupport(appType: AppTypeId): ValidationResult {
    if (appType !== 'nestjs') {
      return { valid: false, errors: ['oRPC server only supports NestJS'] };
    }
    return { valid: true };
  }
  
  getTransforms(appType: AppTypeId, context: PluginGeneratorContext): ASTTransform[] {
    return [
      // Add @implement decorator to all controller methods
      {
        type: 'add-decorator',
        target: 'controller-methods',
        decorator: '@implement(contract.{methodName})',
        imports: [{ from: '@orpc/server', specifiers: ['implement'] }],
      },
      // Add contract imports
      {
        type: 'add-import',
        source: '@repo/contracts',
        specifiers: ['contract'],
      },
    ];
  }
}
```

### Bridge Generator (Connects Two Things)

```typescript
abstract class BridgeGenerator extends PluginGenerator {
  readonly pluginType = 'bridge';
  
  // What does this bridge connect?
  abstract readonly bridges: {
    source: string;  // Plugin ID or 'app:{appType}'
    target: string;  // Plugin ID or 'app:{appType}'
  };
  
  // Generate bridge files
  abstract generateBridge(
    sourceApp: AppDefinition,
    targetApp: AppDefinition,
    context: BridgeGeneratorContext
  ): BridgeGeneratorResult;
}

// Example: oRPC + Better Auth bridge
class OrpcBetterAuthBridgeGenerator extends BridgeGenerator {
  readonly pluginId = 'orpc-better-auth';
  readonly supportedApps: AppTypeId[] = ['nestjs', 'nextjs'];
  readonly bridges = { source: 'orpc', target: 'better-auth' };
  
  generateBridge(
    sourceApp: AppDefinition,
    targetApp: AppDefinition,
    context: BridgeGeneratorContext
  ): BridgeGeneratorResult {
    return {
      files: [
        // Auth context for oRPC procedures
        this.file('packages/contracts/api/auth-context.ts', `
          import { auth } from '@/auth';
          export const authContext = {
            getSession: () => auth.api.getSession(),
            requireAuth: () => auth.api.requireAuth(),
          };
        `),
        // Protected procedure builder
        this.file('apps/api/src/orpc/protected.ts', `
          import { procedure } from '@orpc/server';
          import { authContext } from '@repo/contracts/auth-context';
          
          export const protectedProcedure = procedure
            .use(async ({ next }) => {
              const session = await authContext.requireAuth();
              return next({ ctx: { session } });
            });
        `),
      ],
    };
  }
}
```

### Generator Priority System

```
┌─────────────────────────────────────────────────────────────────┐
│                    GENERATION ORDER                              │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1: Monorepo Setup       (Priority 0-5)                   │
│    → turborepo, typescript, eslint, prettier                    │
│                                                                  │
│  Phase 2: App Generation       (Priority 10)                    │
│    → nestjs, nextjs, fumadocs (create app scaffolds)            │
│                                                                  │
│  Phase 3: Feature Plugins      (Priority 20-30)                 │
│    → drizzle, better-auth, zod, react-query                     │
│                                                                  │
│  Phase 4: Enhancement Plugins  (Priority 35-40)                 │
│    → orpc (modify controllers), swagger, graphql                │
│                                                                  │
│  Phase 5: Bridge Plugins       (Priority 45-50)                 │
│    → orpc-better-auth, api-web-connector                        │
│                                                                  │
│  Phase 6: UI Plugins           (Priority 55-60)                 │
│    → tailwindcss, shadcn-ui, next-themes                        │
│                                                                  │
│  Phase 7: Infrastructure       (Priority 65-70)                 │
│    → docker, docker-compose, github-actions                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Inter-App Connections

### Connection Plugin Architecture

Plugins can establish connections between applications:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Connection Plugins                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐      orpc-bridge       ┌─────────┐                │
│  │   API   │◄─────────────────────►│   Web   │                 │
│  │(NestJS) │   Type-safe RPC        │(Next.js)│                │
│  └─────────┘                        └─────────┘                 │
│       │                                   │                      │
│       │     better-auth-client           │                      │
│       └──────────────────────────────────┘                      │
│             Session sharing                                      │
│                                                                  │
│  ┌─────────┐    event-bus-bridge    ┌─────────┐                │
│  │  API 1  │◄─────────────────────►│  API 2  │                 │
│  │(NestJS) │   Redis pub/sub        │(NestJS) │                │
│  └─────────┘                        └─────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Connection Types

| Connection | Source | Target | Mechanism |
|------------|--------|--------|-----------|
| `orpc-bridge` | NestJS | Next.js | Type-safe RPC contracts |
| `better-auth-client` | NestJS | Next.js | Session/auth sharing |
| `event-bus-bridge` | NestJS | NestJS | Redis pub/sub |
| `api-gateway` | Express | NestJS[] | Request routing |
| `shared-contracts` | Any | Any | TypeScript package |

### oRPC Bridge Example

When `orpc` is enabled on API and `orpc-client` on Web:

```typescript
// Generated: packages/contracts/api/index.ts
export const apiContract = {
  user: {
    getById: contract.query({ input: z.string(), output: UserSchema }),
    create: contract.mutation({ input: CreateUserSchema, output: UserSchema }),
  }
};

// Generated: apps/api/src/modules/user/user.controller.ts
@Controller()
export class UserController {
  @implement(apiContract.user.getById)
  async getById(id: string) { ... }
}

// Generated: apps/web/src/lib/api-client.ts
export const api = createORPCClient(apiContract, {
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
});

// Usage in Next.js
const user = await api.user.getById('123');
```

### Multi-Web App Connections

One API can serve multiple frontends:

```typescript
// Configuration
{
  connections: [
    { from: 'api', to: 'web', via: 'orpc-bridge' },
    { from: 'api', to: 'admin', via: 'orpc-bridge' },
    { from: 'api', to: 'mobile-web', via: 'orpc-bridge' },
  ]
}
```

Each frontend gets its own typed client:

```
packages/
├── contracts/
│   └── api/                 # Shared contracts
apps/
├── api/                     # Single NestJS API
├── web/                     # Customer portal
│   └── src/lib/api-client.ts
├── admin/                   # Admin dashboard
│   └── src/lib/api-client.ts
└── mobile-web/              # Mobile PWA
    └── src/lib/api-client.ts
```

---

## Orchestration Pipeline

### 7-Phase Scaffolding Process

The `GeneratorOrchestratorService` executes a precise 7-phase pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: Pre-Scaffold Guards                  │
│  • Check system requirements (Node version, disk space)          │
│  • Validate configuration                                        │
│  • Verify output directory                                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                PHASE 2: Collect Plugin Contributions             │
│  • Each generator provides: files, deps, scripts, guards, cmds  │
│  • Contributions tagged with plugin ID and priority              │
│  • Context-aware generation (checks other enabled plugins)       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 3: Plugin Guards                        │
│  • Run per-plugin guard checks                                   │
│  • Validate dependencies exist                                   │
│  • Check for required files/configs                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 4: CLI Commands                           │
│  • Execute tool initializations (shadcn init, prisma init)       │
│  • Run generators (nest generate, etc.)                          │
│  • Install additional tools                                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 5: File Merging                           │
│  • Collect all file contributions                                │
│  • Apply merge strategies (replace, json-merge, ast-transform)   │
│  • Resolve conflicts by priority                                 │
│  • Write final files to disk                                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 6: Core Files                             │
│  • Generate .gitignore (merged from all plugins)                 │
│  • Generate README.md (with plugin documentation)                │
│  • Generate .env.example (all required env vars)                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 7: Package.json                           │
│  • Merge all dependencies from plugins                           │
│  • Merge all scripts from plugins                                │
│  • Add workspaces configuration                                  │
│  • Write final package.json                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2 Deep Dive: Contribution Collection

```typescript
interface PluginContributions {
  files: FileContribution[];
  dependencies: DependencySpec[];
  devDependencies: DependencySpec[];
  scripts: ScriptSpec[];
  guards: GuardSpec[];
  cliCommands: CLICommandSpec[];
}

// Each generator contributes based on context
class BetterAuthGenerator extends BaseGenerator {
  async contribute(context: GeneratorContext): Promise<PluginContributions> {
    const files: FileContribution[] = [];
    
    // Always generate core auth files
    files.push(this.file('apps/api/src/auth.ts', ...));
    
    // Conditionally generate based on other plugins
    if (this.hasPlugin(context, 'orpc')) {
      // oRPC integration handled by orpc-better-auth generator
    }
    
    if (this.hasPlugin(context, 'nextjs')) {
      files.push(this.file('apps/web/src/lib/auth-client.ts', ...));
    }
    
    return { files, dependencies: [...], scripts: [...] };
  }
}
```

---

## File Contribution System

### Multiple Plugins, One File

The key innovation: **multiple plugins can contribute to the same file**.

```
┌──────────────────────────────────────────────────────────────────┐
│  File: apps/api/src/app.module.ts                                │
├──────────────────────────────────────────────────────────────────┤
│  NestJS Generator (Priority 20)                                  │
│    → Base module structure                                       │
│                                                                  │
│  BetterAuth Generator (Priority 27)                              │
│    → Add AuthModule import                                       │
│                                                                  │
│  Drizzle Generator (Priority 26)                                 │
│    → Add DrizzleModule import                                    │
│                                                                  │
│  ORPC Generator (Priority 25)                                    │
│    → Add ORPCModule import                                       │
│                                                                  │
│  Final Merged Result                                             │
│    → Complete AppModule with all imports                         │
└──────────────────────────────────────────────────────────────────┘
```

### Merge Strategies (9 Types)

```typescript
type MergeStrategy = 
  | 'replace'           // Overwrite entirely (highest priority wins)
  | 'json-merge'        // Shallow merge JSON objects
  | 'json-merge-deep'   // Deep merge JSON objects
  | 'append'            // Add content at end
  | 'prepend'           // Add content at beginning
  | 'insert-after'      // Insert after a marker
  | 'insert-before'     // Insert before a marker
  | 'ast-transform'     // Modify code via AST
  | 'line-merge'        // Merge by line (for .gitignore, etc.)
  | 'section-merge';    // Merge marked sections
```

### AST Transform Types (8 Types)

For intelligent code modification:

```typescript
type ASTTransformType =
  | 'add-import'        // Add import statement
  | 'add-export'        // Add export statement
  | 'add-decorator'     // Add class/method decorator
  | 'add-method'        // Add method to class
  | 'add-property'      // Add property to class/object
  | 'add-array-item'    // Add item to array
  | 'wrap-function'     // Wrap function call
  | 'modify-object';    // Modify object literal
```

### AST Transform Example

oRPC modifying NestJS controller:

```typescript
// Original (from NestJS generator)
@Controller('users')
export class UserController {
  @Get()
  findAll() { return this.userService.findAll(); }
}

// AST Transform (from ORPC generator)
{
  type: 'ast-transform',
  transforms: [
    { type: 'add-import', source: '@orpc/server', specifiers: ['implement'] },
    { type: 'add-decorator', target: 'findAll', decorator: '@implement(userContract.findAll)' },
  ]
}

// Result
import { implement } from '@orpc/server';

@Controller('users')
export class UserController {
  @implement(userContract.findAll)
  @Get()
  findAll() { return this.userService.findAll(); }
}
```

### FileContribution Interface

```typescript
interface FileContribution {
  path: string;
  content: string;
  pluginId: string;
  priority: number;
  mergeStrategy: MergeStrategy;
  
  // For AST transforms
  transforms?: ASTTransform[];
  
  // For insert strategies
  marker?: string;
  
  // Metadata
  description?: string;
  overwriteExisting?: boolean;
}
```

### Conflict Resolution

When multiple plugins target the same file:

1. **Same merge strategy**: Merge in priority order
2. **Different merge strategies**: Higher priority wins
3. **Replace strategy**: Highest priority takes all
4. **AST transforms**: Applied sequentially by priority

---

## Global Context Registry

### Purpose

The Global Context Registry enables **cross-generator communication** without tight coupling:

```
┌─────────────────────────────────────────────────────────────────┐
│                 GLOBAL CONTEXT REGISTRY                          │
│          (Inter-Generator Communication Hub)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    register()    ┌─────────────────────────┐   │
│  │   Drizzle   │ ───────────────► │  GlobalContextRegistry  │   │
│  │  Generator  │                  │                         │   │
│  └─────────────┘                  │  schema.user            │   │
│                                   │  schema.session         │   │
│  ┌─────────────┐    get()         │  entity.User            │   │
│  │ BetterAuth  │ ◄─────────────── │  entity.Session         │   │
│  │  Generator  │                  │  service.AuthService    │   │
│  └─────────────┘                  │  contract.userContract  │   │
│                                   │                         │   │
│  ┌─────────────┐    subscribe()   │  ┌───────────────────┐  │   │
│  │    oRPC     │ ◄─────────────── │  │  Per-App Context  │  │   │
│  │  Generator  │                  │  │  api: {...}       │  │   │
│  └─────────────┘                  │  │  web: {...}       │  │   │
│                                   │  └───────────────────┘  │   │
└─────────────────────────────────────────────────────────────────┘
```

### GlobalContextRegistryService

```typescript
class GlobalContextRegistryService {
  // Global registry (shared across all apps)
  private globalRegistry = new Map<string, Map<string, RegistryEntry>>();
  
  // Per-app registries
  private appRegistries = new Map<string, Map<string, Map<string, RegistryEntry>>>();
  
  // Register a value globally
  register(namespace: string, key: string, value: any, metadata?: EntryMetadata): void;
  
  // Register a value for a specific app
  registerForApp(appName: string, namespace: string, key: string, value: any): void;
  
  // Get from global registry
  get<T>(namespace: string, key: string): T | undefined;
  
  // Get from app-specific registry
  getFromApp<T>(appName: string, namespace: string, key: string): T | undefined;
  
  // Get all entries in a namespace
  getAll(namespace: string): Map<string, RegistryEntry>;
  
  // Check if a key exists
  has(namespace: string, key: string): boolean;
  
  // Get the entire app registry
  getAppRegistry(appName: string): Map<string, Map<string, RegistryEntry>>;
}
```

### Standard Namespaces

| Namespace | Description | Example Keys |
|-----------|-------------|--------------|
| `schema` | Database schemas | `user`, `session`, `post` |
| `entity` | Entity types | `User`, `Session`, `Post` |
| `service` | Service classes | `AuthService`, `UserService` |
| `contract` | oRPC contracts | `userContract`, `authContract` |
| `route` | API routes | `/api/auth`, `/api/users` |
| `component` | React components | `AuthProvider`, `UserProfile` |
| `hook` | React hooks | `useAuth`, `useUser` |
| `env` | Environment variables | `DATABASE_URL`, `AUTH_SECRET` |
| `capability` | Runtime capabilities | `auth-provider`, `rpc-server` |

### Cross-Generator Communication Example

```typescript
// 1. Drizzle registers schemas
class DrizzleGenerator extends PluginGenerator {
  generateForApp(appType: AppTypeId, context: PluginGeneratorContext) {
    // Register schema for other generators
    context.globalContext.register('schema', 'user', {
      tableName: 'users',
      columns: ['id', 'email', 'name', 'createdAt'],
      source: 'drizzle',
    });
    
    // Register for specific app
    context.globalContext.registerForApp(context.appName, 'entity', 'User', {
      typeName: 'User',
      schema: 'users',
    });
    
    return { files: [/* ... */] };
  }
}

// 2. Better Auth uses registered schemas
class BetterAuthGenerator extends PluginGenerator {
  generateForApp(appType: AppTypeId, context: PluginGeneratorContext) {
    const userSchema = context.globalContext.get('schema', 'user');
    
    if (userSchema?.source === 'drizzle') {
      // Integrate with existing Drizzle schema
      return this.generateWithDrizzle(userSchema, context);
    } else {
      // Generate standalone schema
      return this.generateStandalone(context);
    }
  }
}

// 3. oRPC reads all registered contracts
class OrpcBridgeGenerator extends BridgeGenerator {
  generateBridge(sourceApp, targetApp, context) {
    // Get all contracts from API app
    const contracts = context.globalContext.getFromApp(sourceApp.name, 'contract');
    
    // Generate typed client for each contract
    return {
      files: Array.from(contracts.entries()).map(([name, contract]) =>
        this.generateClientHook(name, contract)
      ),
    };
  }
}
```

---

## Configuration System

### Configuration File Structure

The scaffold uses a TypeScript configuration file for maximum flexibility:

```typescript
// scaffold.config.ts
import { defineConfig } from '@repo/scaffold';

export default defineConfig({
  // Project metadata
  project: {
    name: 'my-saas-app',
    description: 'A full-stack SaaS application',
    version: '1.0.0',
  },

  // Package manager
  packageManager: 'bun',

  // Applications to generate
  apps: [
    {
      name: 'api',
      type: 'nestjs',
      path: 'apps/api',
      plugins: ['drizzle', 'better-auth', 'orpc', 'redis'],
      config: {
        drizzle: { provider: 'postgresql' },
        betterAuth: { 
          providers: ['google', 'github'],
          features: ['admin', 'bearer'],
        },
      },
    },
    {
      name: 'web',
      type: 'nextjs',
      path: 'apps/web',
      plugins: ['react-query', 'zustand', 'shadcn-ui', 'next-themes'],
      config: {
        shadcnUi: { theme: 'zinc', components: ['button', 'card', 'dialog'] },
      },
    },
    {
      name: 'docs',
      type: 'fumadocs',
      path: 'apps/docs',
      plugins: [],
    },
  ],

  // Cross-app bridges
  bridges: [
    { type: 'orpc', source: 'api', target: 'web', contract: 'packages/contracts/api' },
    { type: 'orpc-better-auth', source: 'api', target: 'web' },
  ],

  // Shared packages
  packages: [
    { name: 'contracts', path: 'packages/contracts' },
    { name: 'ui', path: 'packages/ui' },
    { name: 'types', path: 'packages/types' },
  ],

  // Global plugins (applied to monorepo root)
  plugins: ['turborepo', 'typescript', 'eslint', 'prettier', 'vitest'],

  // Infrastructure
  infrastructure: {
    docker: true,
    dockerCompose: true,
    githubActions: true,
    database: 'postgresql',
    cache: 'redis',
  },
});
```

### Configuration Schema (Zod Validated)

```typescript
const AppConfigSchema = z.object({
  // Required properties
  name: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/),
  type: z.enum(['nestjs', 'nextjs', 'fumadocs', 'express', 'fastify', 'astro']),
  path: z.string().min(1),
  plugins: z.array(z.string()),
  
  // Optional properties
  pluginConfigs: z.record(z.any()).optional(),
  port: z.number().int().min(1024).max(65535).optional(),
  primary: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const BridgeConfigSchema = z.object({
  type: z.string(),
  source: z.string(),
  target: z.string(),
  contract: z.string().optional(),
});

const ScaffoldConfigSchema = z.object({
  project: ProjectMetadataSchema,
  packageManager: z.enum(['bun', 'npm', 'pnpm', 'yarn']).default('bun'),
  apps: z.array(AppConfigSchema),
  bridges: z.array(BridgeConfigSchema).optional(),
  packages: z.array(PackageConfigSchema).optional(),
  plugins: z.array(z.string()),
  infrastructure: InfrastructureConfigSchema.optional(),
});
```

### App Configuration Reference (`apps[]`)

The `apps[]` array defines all applications in your monorepo. Each entry configures a single app instance with its framework, plugins, and settings.

#### AppConfig Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ Yes | Unique identifier for this app (e.g., `"api"`, `"web"`, `"admin"`). Must start with lowercase letter and contain only lowercase letters, numbers, and hyphens. |
| `type` | `AppTypeId` | ✅ Yes | Framework/app type. One of: `"nestjs"`, `"nextjs"`, `"fumadocs"`, `"express"`, `"fastify"`, `"astro"` |
| `path` | `string` | ✅ Yes | Output path relative to monorepo root (e.g., `"apps/api"`, `"services/auth"`) |
| `plugins` | `string[]` | ✅ Yes | Array of plugin identifiers to enable for this app |
| `pluginConfigs` | `Record<string, unknown>` | ❌ No | Plugin-specific configurations keyed by plugin ID |
| `port` | `number` | ❌ No | Default port for this app (1024-65535). Used by Docker, dev scripts |
| `primary` | `boolean` | ❌ No | Whether this is the primary app of its type. Affects bridge generation |
| `metadata` | `Record<string, unknown>` | ❌ No | Custom app-specific metadata for plugins or custom generators |

#### AppTypeId Values

| Type | Description | Default Capabilities |
|------|-------------|---------------------|
| `nestjs` | NestJS API with modules, guards, decorators, and DI | `http-server`, `api`, `websocket`, `database`, `auth`, `middleware`, `dependency-injection` |
| `nextjs` | Next.js with App Router, SSR/SSG support | `http-server`, `ssr`, `ssg`, `api`, `middleware`, `static-export` |
| `fumadocs` | Documentation site with MDX support | `ssg`, `static-export` |
| `express` | Express.js minimal HTTP server | `http-server`, `api`, `middleware` |
| `fastify` | Fastify high-performance server | `http-server`, `api`, `middleware`, `websocket` |
| `astro` | Astro static site builder | `ssg`, `ssr`, `static-export` |

#### Complete Example

```typescript
apps: [
  // Primary API application
  {
    name: 'api',
    type: 'nestjs',
    path: 'apps/api',
    plugins: ['drizzle', 'better-auth', 'orpc', 'redis', 'swagger'],
    pluginConfigs: {
      drizzle: {
        provider: 'postgresql',
        migrationsFolder: './drizzle',
      },
      betterAuth: {
        providers: ['google', 'github'],
        features: { admin: true, bearer: true },
      },
      swagger: {
        title: 'My API',
        version: '1.0.0',
      },
    },
    port: 3001,
    primary: true,
    metadata: {
      team: 'backend',
      deploymentTier: 'critical',
    },
  },
  
  // Main web application
  {
    name: 'web',
    type: 'nextjs',
    path: 'apps/web',
    plugins: ['react-query', 'zustand', 'shadcn-ui', 'next-themes'],
    pluginConfigs: {
      shadcnUi: {
        theme: 'zinc',
        components: ['button', 'card', 'dialog', 'form', 'table'],
      },
    },
    port: 3000,
    primary: true,
  },
  
  // Admin dashboard (secondary Next.js app)
  {
    name: 'admin',
    type: 'nextjs',
    path: 'apps/admin',
    plugins: ['react-query', 'shadcn-ui'],
    port: 3002,
    primary: false, // Not primary - bridges use 'web' as target
  },
  
  // Documentation site
  {
    name: 'docs',
    type: 'fumadocs',
    path: 'apps/docs',
    plugins: [],
    port: 3003,
    metadata: {
      docsVersion: 'v2',
    },
  },
],
```

#### Migration from Legacy `plugins[]`

> ⚠️ **Deprecation Notice**: The root-level `plugins[]` property for app-specific plugins is deprecated. Use `apps[].plugins` instead.

**Before (deprecated):**
```typescript
// ❌ Old pattern - plugins at root level
export default defineConfig({
  plugins: ['drizzle', 'better-auth', 'react-query'], // Mixed app plugins
  // ...
});
```

**After (recommended):**
```typescript
// ✅ New pattern - per-app plugin configuration
export default defineConfig({
  apps: [
    {
      name: 'api',
      type: 'nestjs',
      plugins: ['drizzle', 'better-auth'], // API-specific plugins
      // ...
    },
    {
      name: 'web',
      type: 'nextjs',
      plugins: ['react-query'], // Web-specific plugins
      // ...
    },
  ],
  // Root plugins are now for monorepo-level tools only
  plugins: ['turborepo', 'typescript', 'eslint', 'prettier'],
});
```

#### Validation Rules

1. **Name uniqueness**: Each app `name` must be unique across all apps
2. **Path uniqueness**: Each app `path` must be unique
3. **Plugin compatibility**: Plugins must be compatible with the app's `type` (validated against `AppType.supportedPlugins`)
4. **Required plugins**: Some app types have required plugins that are auto-enabled
5. **Port conflicts**: If `port` is specified, it must be unique across all apps

### Per-Plugin Configuration

Every plugin and package plugin **MUST** define its configuration as a Zod schema. This enables:
- **Type inference** - `z.infer<typeof ConfigSchema>` for TypeScript types
- **Runtime validation** - Validates user config before generation
- **Default values** - Sensible defaults with `.default()`
- **Documentation** - Self-documenting configuration options

#### Plugin Config Schema Pattern

```typescript
import { z } from 'zod';

// Base interface that all plugin configs must implement
interface PluginConfigDefinition<T extends z.ZodSchema> {
  schema: T;
  defaults: z.infer<T>;
  validate(config: unknown): z.infer<T>;
}

// Factory to create type-safe config definitions
function definePluginConfig<T extends z.ZodSchema>(
  schema: T,
  defaults?: Partial<z.infer<T>>
): PluginConfigDefinition<T> {
  return {
    schema,
    defaults: schema.parse(defaults ?? {}),
    validate: (config) => schema.parse(config),
  };
}
```

#### App Plugin Configuration Schemas

All app plugins must export a `configSchema` that defines their configuration:

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Better Auth Plugin Config
export const BetterAuthConfigSchema = z.object({
  // OAuth Providers
  providers: z.array(z.enum(['google', 'github', 'discord', 'twitter', 'email', 'magic-link']))
    .default([]),
  
  // Features to enable
  features: z.object({
    admin: z.boolean().default(false),
    bearer: z.boolean().default(false),
    twoFactor: z.boolean().default(false),
    magicLink: z.boolean().default(false),
    emailVerification: z.boolean().default(true),
    passwordReset: z.boolean().default(true),
  }).default({}),
  
  // Session configuration
  session: z.object({
    strategy: z.enum(['jwt', 'database']).default('database'),
    maxAge: z.number().default(60 * 60 * 24 * 7), // 7 days
    updateAge: z.number().default(60 * 60 * 24), // 1 day
  }).default({}),
  
  // Custom user fields
  userFields: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'date', 'json']),
    required: z.boolean().default(false),
    unique: z.boolean().default(false),
  })).default([]),
  
  // Rate limiting
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    maxAttempts: z.number().default(5),
    windowMs: z.number().default(60 * 1000), // 1 minute
  }).default({}),
}).strict();

export type BetterAuthConfig = z.infer<typeof BetterAuthConfigSchema>;

// API Key Auth Plugin Config
export const ApiKeyAuthConfigSchema = z.object({
  headerName: z.string().default('X-API-Key'),
  queryParam: z.string().optional(),
  prefix: z.string().default('sk_'),
  hashAlgorithm: z.enum(['sha256', 'sha512', 'argon2']).default('sha256'),
  expirationDays: z.number().optional(),
  scopes: z.array(z.string()).default([]),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    requestsPerMinute: z.number().default(60),
  }).default({}),
}).strict();

export type ApiKeyAuthConfig = z.infer<typeof ApiKeyAuthConfigSchema>;

// Permission System Plugin Config
export const PermissionSystemConfigSchema = z.object({
  type: z.enum(['rbac', 'abac', 'hybrid']).default('rbac'),
  defaultRoles: z.array(z.object({
    name: z.string(),
    permissions: z.array(z.string()),
    inherits: z.array(z.string()).default([]),
  })).default([
    { name: 'admin', permissions: ['*'], inherits: [] },
    { name: 'user', permissions: ['read:own', 'write:own'], inherits: [] },
  ]),
  superAdminRole: z.string().default('admin'),
  cachePermissions: z.boolean().default(true),
  cacheTTL: z.number().default(300), // 5 minutes
}).strict();

export type PermissionSystemConfig = z.infer<typeof PermissionSystemConfigSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Drizzle ORM Plugin Config
export const DrizzleConfigSchema = z.object({
  provider: z.enum(['postgresql', 'mysql', 'sqlite', 'turso']).default('postgresql'),
  schemaPath: z.string().default('src/db/schema'),
  migrationsPath: z.string().default('drizzle/migrations'),
  
  // Connection pooling
  pool: z.object({
    min: z.number().default(2),
    max: z.number().default(10),
    idleTimeout: z.number().default(30000),
  }).default({}),
  
  // Features
  features: z.object({
    timestamps: z.boolean().default(true),
    softDelete: z.boolean().default(false),
    audit: z.boolean().default(false),
  }).default({}),
  
  // Logging
  logging: z.object({
    queries: z.boolean().default(false),
    slowQueryThreshold: z.number().default(1000), // ms
  }).default({}),
}).strict();

export type DrizzleConfig = z.infer<typeof DrizzleConfigSchema>;

// Database Seeder Plugin Config
export const DatabaseSeederConfigSchema = z.object({
  seedPath: z.string().default('src/db/seeds'),
  faker: z.object({
    locale: z.string().default('en'),
    seed: z.number().optional(),
  }).default({}),
  environments: z.array(z.enum(['development', 'test', 'staging'])).default(['development', 'test']),
  truncateBeforeSeed: z.boolean().default(false),
  checksumTracking: z.boolean().default(true),
}).strict();

export type DatabaseSeederConfig = z.infer<typeof DatabaseSeederConfigSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// API/RPC PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// oRPC Plugin Config
export const OrpcConfigSchema = z.object({
  // Router configuration
  router: z.object({
    style: z.enum(['flat', 'nested', 'domain']).default('nested'),
    prefix: z.string().default('/api'),
  }).default({}),
  
  // Validation
  validation: z.object({
    enabled: z.boolean().default(true),
    stripUnknown: z.boolean().default(true),
    coerceTypes: z.boolean().default(true),
  }).default({}),
  
  // Error handling
  errors: z.object({
    includeStack: z.boolean().default(false),
    mask: z.boolean().default(true),
    customCodes: z.record(z.string(), z.number()).default({}),
  }).default({}),
  
  // Streaming/SSE
  streaming: z.object({
    enabled: z.boolean().default(false),
    heartbeatInterval: z.number().default(30000),
  }).default({}),
  
  // OpenAPI generation
  openapi: z.object({
    enabled: z.boolean().default(true),
    path: z.string().default('/api/openapi.json'),
    info: z.object({
      title: z.string().default('API'),
      version: z.string().default('1.0.0'),
    }).default({}),
  }).default({}),
}).strict();

export type OrpcConfig = z.infer<typeof OrpcConfigSchema>;

// React Query Plugin Config
export const ReactQueryConfigSchema = z.object({
  // Default options
  defaults: z.object({
    staleTime: z.number().default(5 * 60 * 1000), // 5 minutes
    gcTime: z.number().default(10 * 60 * 1000), // 10 minutes (formerly cacheTime)
    retry: z.union([z.number(), z.boolean()]).default(3),
    refetchOnWindowFocus: z.boolean().default(true),
    refetchOnReconnect: z.boolean().default(true),
  }).default({}),
  
  // DevTools
  devtools: z.object({
    enabled: z.boolean().default(true),
    position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).default('bottom-right'),
  }).default({}),
  
  // Persist queries
  persist: z.object({
    enabled: z.boolean().default(false),
    key: z.string().default('react-query-cache'),
    storage: z.enum(['localStorage', 'sessionStorage', 'indexedDB']).default('localStorage'),
  }).default({}),
}).strict();

export type ReactQueryConfig = z.infer<typeof ReactQueryConfigSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// UI PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Shadcn UI Plugin Config
export const ShadcnUiConfigSchema = z.object({
  // Theme
  theme: z.object({
    base: z.enum(['default', 'slate', 'stone', 'gray', 'zinc', 'neutral']).default('zinc'),
    radius: z.number().min(0).max(1).default(0.5),
    cssVariables: z.boolean().default(true),
  }).default({}),
  
  // Components to install
  components: z.array(z.string()).default([
    'button', 'card', 'dialog', 'dropdown-menu', 'input', 'label', 'toast',
  ]),
  
  // Icon library
  icons: z.enum(['lucide', 'radix', 'phosphor', 'heroicons']).default('lucide'),
  
  // Dark mode
  darkMode: z.object({
    enabled: z.boolean().default(true),
    default: z.enum(['light', 'dark', 'system']).default('system'),
    storageKey: z.string().default('theme'),
  }).default({}),
}).strict();

export type ShadcnUiConfig = z.infer<typeof ShadcnUiConfigSchema>;

// Tailwind CSS Plugin Config
export const TailwindCssConfigSchema = z.object({
  version: z.enum(['3', '4']).default('4'),
  
  // Content paths
  content: z.array(z.string()).default([
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ]),
  
  // Theme extensions
  theme: z.object({
    extend: z.record(z.any()).default({}),
  }).default({}),
  
  // Plugins
  plugins: z.array(z.enum([
    'forms', 'typography', 'aspect-ratio', 'container-queries', 'animate',
  ])).default([]),
  
  // CSS-in-JS
  cssInJs: z.boolean().default(false),
}).strict();

export type TailwindCssConfig = z.infer<typeof TailwindCssConfigSchema>;

// Next Themes Plugin Config
export const NextThemesConfigSchema = z.object({
  attribute: z.enum(['class', 'data-theme', 'data-mode']).default('class'),
  defaultTheme: z.enum(['light', 'dark', 'system']).default('system'),
  enableSystem: z.boolean().default(true),
  enableColorScheme: z.boolean().default(true),
  storageKey: z.string().default('theme'),
  themes: z.array(z.string()).default(['light', 'dark']),
  forcedTheme: z.string().optional(),
  disableTransitionOnChange: z.boolean().default(false),
}).strict();

export type NextThemesConfig = z.infer<typeof NextThemesConfigSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Zustand Plugin Config
export const ZustandConfigSchema = z.object({
  // Store configuration
  stores: z.array(z.object({
    name: z.string(),
    persist: z.boolean().default(false),
    devtools: z.boolean().default(true),
  })).default([]),
  
  // Middleware
  middleware: z.object({
    immer: z.boolean().default(true),
    devtools: z.boolean().default(true),
    persist: z.object({
      enabled: z.boolean().default(false),
      storage: z.enum(['localStorage', 'sessionStorage', 'indexedDB']).default('localStorage'),
    }).default({}),
  }).default({}),
}).strict();

export type ZustandConfig = z.infer<typeof ZustandConfigSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// INFRASTRUCTURE PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Docker Compose Plugin Config
export const DockerComposeConfigSchema = z.object({
  // Environments to generate
  environments: z.array(z.enum(['dev', 'prod', 'test'])).default(['dev', 'prod']),
  
  // Services
  services: z.object({
    database: z.boolean().default(true),
    redis: z.boolean().default(false),
    mailhog: z.boolean().default(false),
    minio: z.boolean().default(false),
  }).default({}),
  
  // Networking
  network: z.object({
    name: z.string().default('app_network'),
    driver: z.enum(['bridge', 'host', 'overlay']).default('bridge'),
  }).default({}),
  
  // Volumes
  volumes: z.object({
    persistent: z.boolean().default(true),
    named: z.boolean().default(true),
  }).default({}),
}).strict();

export type DockerComposeConfig = z.infer<typeof DockerComposeConfigSchema>;

// Job Queue Plugin Config (BullMQ)
export const JobQueueConfigSchema = z.object({
  // Queue configuration
  defaultQueue: z.string().default('default'),
  queues: z.array(z.object({
    name: z.string(),
    concurrency: z.number().default(5),
    limiter: z.object({
      max: z.number(),
      duration: z.number(),
    }).optional(),
  })).default([]),
  
  // Bull Board
  dashboard: z.object({
    enabled: z.boolean().default(true),
    path: z.string().default('/admin/queues'),
    auth: z.boolean().default(true),
  }).default({}),
  
  // Redis connection
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    db: z.number().default(0),
  }).default({}),
}).strict();

export type JobQueueConfig = z.infer<typeof JobQueueConfigSchema>;

// CI/CD Plugin Config
export const CiCdConfigSchema = z.object({
  provider: z.enum(['github-actions', 'gitlab-ci', 'circleci']).default('github-actions'),
  
  // Pipeline stages
  stages: z.object({
    lint: z.boolean().default(true),
    typecheck: z.boolean().default(true),
    test: z.boolean().default(true),
    build: z.boolean().default(true),
    deploy: z.boolean().default(false),
  }).default({}),
  
  // Triggers
  triggers: z.object({
    pushBranches: z.array(z.string()).default(['main', 'develop']),
    pullRequest: z.boolean().default(true),
  }).default({}),
  
  // Caching
  cache: z.object({
    dependencies: z.boolean().default(true),
    buildOutput: z.boolean().default(true),
  }).default({}),
}).strict();

export type CiCdConfig = z.infer<typeof CiCdConfigSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// TESTING PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Vitest Plugin Config
export const VitestConfigSchema = z.object({
  // Coverage
  coverage: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['v8', 'istanbul']).default('v8'),
    thresholds: z.object({
      statements: z.number().default(80),
      branches: z.number().default(80),
      functions: z.number().default(80),
      lines: z.number().default(80),
    }).default({}),
  }).default({}),
  
  // UI
  ui: z.object({
    enabled: z.boolean().default(true),
    port: z.number().default(51204),
  }).default({}),
  
  // Environment
  environment: z.enum(['node', 'jsdom', 'happy-dom']).default('node'),
  
  // Globals
  globals: z.boolean().default(true),
}).strict();

export type VitestConfig = z.infer<typeof VitestConfigSchema>;
```

#### Package Plugin Configuration Schemas

Package plugins also define their configuration with Zod schemas:

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// CONFIG PACKAGE PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// ESLint Config Package Plugin
export const EslintConfigPackageSchema = z.object({
  style: z.enum(['recommended', 'strict', 'all']).default('recommended'),
  
  // Rule sets to include
  ruleSets: z.object({
    typescript: z.boolean().default(true),
    imports: z.boolean().default(true),
    unicorn: z.boolean().default(false),
    sonar: z.boolean().default(false),
  }).default({}),
  
  // Framework-specific
  frameworks: z.array(z.enum(['react', 'nextjs', 'nestjs', 'node'])).default([]),
  
  // Formatting
  formatting: z.object({
    usePrettier: z.boolean().default(true),
    printWidth: z.number().default(100),
    tabWidth: z.number().default(2),
  }).default({}),
}).strict();

export type EslintConfigPackageConfig = z.infer<typeof EslintConfigPackageSchema>;

// TypeScript Config Package Plugin
export const TypescriptConfigPackageSchema = z.object({
  target: z.enum(['ES2020', 'ES2021', 'ES2022', 'ESNext']).default('ES2022'),
  module: z.enum(['CommonJS', 'ESNext', 'NodeNext']).default('ESNext'),
  
  // Strictness
  strict: z.object({
    noImplicitAny: z.boolean().default(true),
    strictNullChecks: z.boolean().default(true),
    strictFunctionTypes: z.boolean().default(true),
    noUncheckedIndexedAccess: z.boolean().default(true),
  }).default({}),
  
  // Path mapping
  paths: z.record(z.string(), z.array(z.string())).default({
    '@/*': ['./src/*'],
  }),
  
  // Decorators (for NestJS)
  decorators: z.object({
    experimentalDecorators: z.boolean().default(false),
    emitDecoratorMetadata: z.boolean().default(false),
  }).default({}),
}).strict();

export type TypescriptConfigPackageConfig = z.infer<typeof TypescriptConfigPackageSchema>;

// Prettier Config Package Plugin
export const PrettierConfigPackageSchema = z.object({
  printWidth: z.number().default(100),
  tabWidth: z.number().default(2),
  useTabs: z.boolean().default(false),
  semi: z.boolean().default(true),
  singleQuote: z.boolean().default(true),
  trailingComma: z.enum(['none', 'es5', 'all']).default('es5'),
  bracketSpacing: z.boolean().default(true),
  arrowParens: z.enum(['avoid', 'always']).default('always'),
  
  // Plugins
  plugins: z.array(z.enum([
    'prettier-plugin-tailwindcss',
    'prettier-plugin-organize-imports',
    'prettier-plugin-packagejson',
  ])).default([]),
}).strict();

export type PrettierConfigPackageConfig = z.infer<typeof PrettierConfigPackageSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT PACKAGE PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// oRPC Contracts Package Plugin
export const OrpcContractsPackageSchema = z.object({
  // Router style
  routerStyle: z.enum(['flat', 'nested', 'domain']).default('nested'),
  
  // Validation
  validation: z.object({
    includeValidation: z.boolean().default(true),
    zodVersion: z.enum(['3.x', '4.x']).default('3.x'),
  }).default({}),
  
  // Procedures to generate
  procedures: z.array(z.object({
    name: z.string(),
    type: z.enum(['query', 'mutation', 'subscription']).default('query'),
    input: z.string().optional(),
    output: z.string().optional(),
  })).default([]),
  
  // Error handling
  errors: z.object({
    customErrors: z.boolean().default(true),
    errorCodes: z.record(z.string(), z.number()).default({}),
  }).default({}),
  
  // Export format
  exportFormat: z.enum(['named', 'default', 'barrel']).default('named'),
}).strict();

export type OrpcContractsPackageConfig = z.infer<typeof OrpcContractsPackageSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES PACKAGE PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Shared Types Package Plugin
export const SharedTypesPackageSchema = z.object({
  // Entity types to generate
  entities: z.array(z.object({
    name: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      optional: z.boolean().default(false),
    })),
  })).default([]),
  
  // Utility types
  utilities: z.object({
    pagination: z.boolean().default(true),
    apiResponse: z.boolean().default(true),
    errorTypes: z.boolean().default(true),
  }).default({}),
  
  // Brand types for type safety
  brandTypes: z.array(z.string()).default(['UserId', 'PostId']),
}).strict();

export type SharedTypesPackageConfig = z.infer<typeof SharedTypesPackageSchema>;

// Auth Types Package Plugin (Enhancement)
export const AuthTypesPackageSchema = z.object({
  // Session type fields
  sessionFields: z.array(z.object({
    name: z.string(),
    type: z.string(),
  })).default([
    { name: 'id', type: 'string' },
    { name: 'userId', type: 'string' },
    { name: 'expiresAt', type: 'Date' },
  ]),
  
  // User type fields
  userFields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    optional: z.boolean().default(false),
  })).default([
    { name: 'id', type: 'string', optional: false },
    { name: 'email', type: 'string', optional: false },
    { name: 'name', type: 'string', optional: true },
  ]),
  
  // Role/Permission types
  rbac: z.object({
    roles: z.array(z.string()).default(['admin', 'user']),
    permissions: z.array(z.string()).default([]),
  }).default({}),
}).strict();

export type AuthTypesPackageConfig = z.infer<typeof AuthTypesPackageSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// UI PACKAGE PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// UI Base Package Plugin
export const UiBasePackageSchema = z.object({
  // Component library base
  base: z.enum(['radix', 'headless-ui', 'ark-ui']).default('radix'),
  
  // Styling
  styling: z.object({
    solution: z.enum(['tailwind', 'css-modules', 'styled-components']).default('tailwind'),
    cssVariables: z.boolean().default(true),
  }).default({}),
  
  // Components to include
  components: z.array(z.string()).default([
    'button', 'input', 'card', 'dialog', 'dropdown',
  ]),
  
  // Animation library
  animations: z.enum(['framer-motion', 'react-spring', 'none']).default('framer-motion'),
}).strict();

export type UiBasePackageConfig = z.infer<typeof UiBasePackageSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// UTILS PACKAGE PLUGINS
// ═══════════════════════════════════════════════════════════════════════════

// Validation Utils Package Plugin
export const ValidationUtilsPackageSchema = z.object({
  // Validators to generate
  validators: z.array(z.enum([
    'email', 'password', 'phone', 'url', 'uuid', 'slug', 'date', 'creditCard',
  ])).default(['email', 'password', 'url', 'uuid']),
  
  // Custom patterns
  patterns: z.record(z.string(), z.string()).default({}),
  
  // Zod integration
  zodSchemas: z.boolean().default(true),
}).strict();

export type ValidationUtilsPackageConfig = z.infer<typeof ValidationUtilsPackageSchema>;

// Auth Utils Package Plugin (Enhancement)
export const AuthUtilsPackageSchema = z.object({
  // Helper functions
  helpers: z.object({
    hashPassword: z.boolean().default(true),
    verifyPassword: z.boolean().default(true),
    generateToken: z.boolean().default(true),
    parseToken: z.boolean().default(true),
  }).default({}),
  
  // Token configuration
  tokens: z.object({
    algorithm: z.enum(['HS256', 'HS384', 'HS512', 'RS256']).default('HS256'),
    expiresIn: z.string().default('7d'),
  }).default({}),
  
  // Password hashing
  passwords: z.object({
    algorithm: z.enum(['bcrypt', 'argon2', 'scrypt']).default('bcrypt'),
    rounds: z.number().default(12),
  }).default({}),
}).strict();

export type AuthUtilsPackageConfig = z.infer<typeof AuthUtilsPackageSchema>;
```

#### Config Schema Registry

All config schemas are registered in a central registry for runtime access:

```typescript
// Config schema registry
const ConfigSchemaRegistry = {
  // App Plugins
  'better-auth': BetterAuthConfigSchema,
  'api-key-auth': ApiKeyAuthConfigSchema,
  'permission-system': PermissionSystemConfigSchema,
  'drizzle': DrizzleConfigSchema,
  'database-seeder': DatabaseSeederConfigSchema,
  'orpc': OrpcConfigSchema,
  'react-query': ReactQueryConfigSchema,
  'shadcn-ui': ShadcnUiConfigSchema,
  'tailwindcss': TailwindCssConfigSchema,
  'next-themes': NextThemesConfigSchema,
  'zustand': ZustandConfigSchema,
  'docker-compose': DockerComposeConfigSchema,
  'job-queue': JobQueueConfigSchema,
  'ci-cd': CiCdConfigSchema,
  'vitest': VitestConfigSchema,
  
  // Package Plugins
  'eslint-config': EslintConfigPackageSchema,
  'typescript-config': TypescriptConfigPackageSchema,
  'prettier-config': PrettierConfigPackageSchema,
  'orpc-contracts': OrpcContractsPackageSchema,
  'shared-types': SharedTypesPackageSchema,
  'auth-types': AuthTypesPackageSchema,
  'ui-base': UiBasePackageSchema,
  'validation-utils': ValidationUtilsPackageSchema,
  'auth-utils': AuthUtilsPackageSchema,
} as const;

// Type-safe config getter
function getConfigSchema<K extends keyof typeof ConfigSchemaRegistry>(
  pluginId: K
): typeof ConfigSchemaRegistry[K] {
  return ConfigSchemaRegistry[pluginId];
}

// Validate plugin config at runtime
function validatePluginConfig<K extends keyof typeof ConfigSchemaRegistry>(
  pluginId: K,
  config: unknown
): z.infer<typeof ConfigSchemaRegistry[K]> {
  const schema = getConfigSchema(pluginId);
  return schema.parse(config);
}
```

#### Usage in Generators

Generators access validated config through the context:

```typescript
class BetterAuthGenerator extends FeatureGenerator {
  // Declare the config schema
  static configSchema = BetterAuthConfigSchema;
  
  protected getFiles(context: GeneratorContext): FileSpec[] {
    // Config is already validated and typed
    const config = context.config as BetterAuthConfig;
    
    const files: FileSpec[] = [];
    
    // Use type-safe config
    if (config.features.admin) {
      files.push(this.generateAdminDashboard(context));
    }
    
    if (config.features.twoFactor) {
      files.push(this.generate2FAFiles(context));
    }
    
    for (const provider of config.providers) {
      files.push(this.generateOAuthProvider(provider, context));
    }
    
    return files;
  }
}
```

### CLI Integration

The CLI uses the configuration for project scaffolding:

```bash
# Interactive mode (prompts for all options)
scaffold new my-project

# From config file
scaffold new my-project --config scaffold.config.ts

# Quick templates
scaffold new my-project --template saas-starter
scaffold new my-project --template api-only

# Add plugins to existing project
scaffold add better-auth --app api
scaffold add shadcn-ui --app web

# List available plugins
scaffold list plugins --app-type nestjs
scaffold list plugins --type feature

# Show plugin info
scaffold info better-auth
```

---

## Package Plugin System

The **Package Plugin System** introduces a third tier to the architecture, enabling the generation of shared packages within the monorepo. Unlike apps (which are standalone applications) and plugins (which add features to apps), **Package Plugins** generate reusable packages that can be shared across multiple apps and consumed by other plugins.

### Package Type Hierarchy

Package plugins are organized by type, with each type serving a specific purpose in the monorepo:

```
packages/
├── bin/                    # Executable CLI packages
│   ├── scaffold/
│   └── dev-tools/
├── configs/                # Configuration packages
│   ├── eslint/
│   ├── typescript/
│   ├── prettier/
│   └── vitest/
├── contracts/              # API contract definitions
│   ├── api/               # Main API contracts
│   └── admin/             # Admin API contracts
├── types/                  # Shared TypeScript types
│   └── common/
├── ui/                     # UI component libraries
│   ├── base/              # Base components
│   └── charts/            # Chart components
└── utils/                  # Utility packages
    ├── auth/              # Auth utilities
    └── validation/        # Validation helpers
```

### Package Type Definitions

```typescript
type PackageTypeId = 
  | 'bin'        // Executable/CLI packages
  | 'configs'    // Configuration packages (eslint, typescript, prettier, etc.)
  | 'contracts'  // API contracts (oRPC, tRPC, REST schemas)
  | 'types'      // Shared TypeScript type definitions
  | 'ui'         // UI component libraries
  | 'utils';     // Utility function packages

interface PackageType {
  id: PackageTypeId;
  name: string;
  description: string;
  defaultPath: string;           // Default location in packages/
  supportsEnhancement: boolean;  // Can other packages enhance this?
  dependencies: PackageTypeId[]; // Other package types this typically needs
}

// Package type registry
const packageTypes: Record<PackageTypeId, PackageType> = {
  bin: {
    id: 'bin',
    name: 'Executable Package',
    description: 'CLI tools and executable scripts',
    defaultPath: 'packages/bin',
    supportsEnhancement: true,
    dependencies: ['utils', 'types'],
  },
  configs: {
    id: 'configs',
    name: 'Configuration Package',
    description: 'Shared configuration for tooling (eslint, typescript, etc.)',
    defaultPath: 'packages/configs',
    supportsEnhancement: true,
    dependencies: [],
  },
  contracts: {
    id: 'contracts',
    name: 'Contract Package',
    description: 'API contracts and schemas for type-safe communication',
    defaultPath: 'packages/contracts',
    supportsEnhancement: true,
    dependencies: ['types'],
  },
  types: {
    id: 'types',
    name: 'Types Package',
    description: 'Shared TypeScript type definitions',
    defaultPath: 'packages/types',
    supportsEnhancement: true,
    dependencies: [],
  },
  ui: {
    id: 'ui',
    name: 'UI Package',
    description: 'Reusable UI components',
    defaultPath: 'packages/ui',
    supportsEnhancement: true,
    dependencies: ['types', 'utils'],
  },
  utils: {
    id: 'utils',
    name: 'Utility Package',
    description: 'Shared utility functions',
    defaultPath: 'packages/utils',
    supportsEnhancement: true,
    dependencies: ['types'],
  },
};
```

### Package Enhancement System

Every package type supports **enhancements** - packages that extend or customize the base functionality:

```typescript
interface PackageEnhancement {
  basePackage: string;           // Package being enhanced
  enhancementId: string;         // Unique identifier
  type: 'addition' | 'override' | 'wrapper';
  description: string;
}

// Example: ESLint config enhancement for Next.js
const nextjsEslintEnhancement: PackageEnhancement = {
  basePackage: '@repo/eslint-config',
  enhancementId: 'eslint-nextjs',
  type: 'addition',
  description: 'Adds Next.js specific ESLint rules',
};

// Enhancement categories by package type
type PackageEnhancementType = 
  | 'configs/enhancement'    // Config package enhancers
  | 'contracts/enhancement'  // Contract package enhancers
  | 'types/enhancement'      // Type package enhancers
  | 'ui/enhancement'         // UI package enhancers
  | 'utils/enhancement';     // Utility package enhancers
```

### Package Plugin Interface

Package plugins follow a similar pattern to regular plugins but generate packages instead of app features:

```typescript
interface PackagePlugin {
  id: string;
  name: string;
  description: string;
  packageType: PackageTypeId;
  
  // Package metadata
  metadata: {
    version: string;
    author?: string;
    repository?: string;
  };
  
  // Dependencies on other package plugins
  dependsOnPackages: string[];
  
  // Can be configured by these plugins
  configurableBy: string[];
  
  // Configuration schema
  configSchema: z.ZodSchema;
  
  // Generate the package
  generate(context: PackagePluginContext): PackageGeneratorResult;
}

interface PackagePluginContext {
  packageName: string;
  packagePath: string;
  config: Record<string, unknown>;
  
  // Access to global context
  globalContext: GlobalContextRegistry;
  
  // Parent plugin configuration (if this is a dependency)
  parentConfig?: {
    pluginId: string;
    configuration: Record<string, unknown>;
  };
  
  // All apps that will use this package
  consumers: Array<{
    appName: string;
    appType: AppTypeId;
  }>;
}

interface PackageGeneratorResult {
  files: GeneratedFile[];
  exports: PackageExport[];
  dependencies: PackageDependency[];
  peerDependencies: PackageDependency[];
}
```

### Plugin-to-Package Dependencies

Plugins can declare dependencies on package plugins, enabling a **hierarchical generation** where:
1. Package plugins are generated first
2. App plugins can then use the generated packages

```typescript
// In plugin definition
interface PluginDefinition {
  id: string;
  // ... other fields
  
  // Package plugins this plugin depends on
  packageDependencies: PackageDependencyDeclaration[];
}

interface PackageDependencyDeclaration {
  packagePluginId: string;         // ID of the package plugin
  required: boolean;               // Is this package required?
  configuration?: Record<string, unknown>;  // Config to pass to package plugin
}

// Example: oRPC plugin depends on orpc-contracts package
const orpcPlugin: PluginDefinition = {
  id: 'orpc',
  name: 'oRPC',
  type: 'feature',
  supportedAppTypes: ['nestjs', 'nextjs'],
  
  packageDependencies: [
    {
      packagePluginId: 'orpc-contracts',
      required: true,
      configuration: {
        // oRPC plugin configures how contracts are generated
        routerStyle: 'flat',
        includeValidation: true,
        zodVersion: '3.x',
      },
    },
  ],
  
  // ... rest of plugin definition
};
```

### Parent Plugin Configuration Flow

When a plugin depends on a package plugin, the parent can **configure and customize** the package generation:

```typescript
// Parent plugin configures its package dependency
class OrpcPlugin extends FeaturePlugin {
  private contractsConfig: OrpcContractsConfig;
  
  constructor(config: OrpcPluginConfig) {
    super();
    
    // Configure the contracts package based on oRPC config
    this.contractsConfig = {
      routerStyle: config.routerStyle ?? 'flat',
      includeValidation: config.includeValidation ?? true,
      procedures: config.procedures ?? [],
      errorHandling: config.errorHandling ?? 'standard',
    };
  }
  
  // Pass configuration to package plugin
  getPackageDependencyConfig(packagePluginId: string): Record<string, unknown> {
    if (packagePluginId === 'orpc-contracts') {
      return this.contractsConfig;
    }
    return {};
  }
}

// Package plugin receives configuration from parent
class OrpcContractsPackagePlugin implements PackagePlugin {
  id = 'orpc-contracts';
  packageType: PackageTypeId = 'contracts';
  configurableBy = ['orpc', 'trpc', 'api-client'];
  
  generate(context: PackagePluginContext): PackageGeneratorResult {
    // Use parent plugin configuration if available
    const config = context.parentConfig?.configuration ?? this.getDefaultConfig();
    
    const routerStyle = config.routerStyle ?? 'flat';
    const includeValidation = config.includeValidation ?? true;
    
    // Generate contracts based on combined configuration
    return {
      files: this.generateContractFiles(routerStyle, includeValidation),
      exports: this.generateExports(),
      dependencies: [
        { name: '@orpc/server', version: '^1.0.0' },
        { name: 'zod', version: '^3.23.0' },
      ],
      peerDependencies: [],
    };
  }
}
```

### Package Plugin Registry

All package plugins are registered in a central registry:

```typescript
class PackagePluginRegistry {
  private plugins = new Map<string, PackagePlugin>();
  private byType = new Map<PackageTypeId, Set<string>>();
  
  register(plugin: PackagePlugin): void {
    this.plugins.set(plugin.id, plugin);
    
    // Index by type
    const typeSet = this.byType.get(plugin.packageType) ?? new Set();
    typeSet.add(plugin.id);
    this.byType.set(plugin.packageType, typeSet);
  }
  
  // Get all package plugins of a specific type
  getByType(type: PackageTypeId): PackagePlugin[] {
    const ids = this.byType.get(type) ?? new Set();
    return Array.from(ids).map(id => this.plugins.get(id)!);
  }
  
  // Resolve dependencies for a plugin
  resolveDependencies(pluginId: string): PackagePlugin[] {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return [];
    
    const dependencies: PackagePlugin[] = [];
    for (const depId of plugin.dependsOnPackages) {
      const depPlugin = this.plugins.get(depId);
      if (depPlugin) {
        // Recursively resolve
        dependencies.push(...this.resolveDependencies(depId));
        dependencies.push(depPlugin);
      }
    }
    
    return dependencies;
  }
}
```

### Standard Package Plugins

| Package Plugin | Type | Description | Configurable By |
|---------------|------|-------------|-----------------|
| `eslint-config` | configs | Base ESLint configuration | - |
| `eslint-nextjs` | configs/enhancement | Next.js ESLint rules | nextjs app type |
| `eslint-nestjs` | configs/enhancement | NestJS ESLint rules | nestjs app type |
| `typescript-config` | configs | Base TypeScript configuration | - |
| `prettier-config` | configs | Prettier configuration | - |
| `vitest-config` | configs | Vitest configuration | - |
| `orpc-contracts` | contracts | oRPC contract definitions | orpc, api-client |
| `trpc-contracts` | contracts | tRPC contract definitions | trpc, api-client |
| `shared-types` | types | Common TypeScript types | - |
| `auth-types` | types/enhancement | Auth-related types | better-auth |
| `ui-base` | ui | Base UI components | shadcn-ui |
| `ui-charts` | ui/enhancement | Chart components | charts plugin |
| `validation-utils` | utils | Validation utilities | - |
| `auth-utils` | utils/enhancement | Auth helper functions | better-auth |

### Generation Order with Package Plugins

The orchestration pipeline now includes package plugins in the generation order:

```
1. Analyze Configuration
   └─ Identify required package plugins from all app plugins
   
2. Generate Packages (NEW PHASE)
   ├─ Sort package plugins by dependencies
   ├─ For each package plugin:
   │   ├─ Collect configuration from parent plugins
   │   ├─ Generate package files
   │   └─ Register exports in global context
   
3. Generate App Types
   └─ App type generators can now import from generated packages
   
4. Generate Plugins
   └─ Plugin generators can use generated packages
   
5. Generate Bridges
   └─ Bridge generators connect apps using shared packages
   
6. File Resolution
   └─ Resolve all file contributions including package files
```

### Example: oRPC with Contracts Package

```typescript
// scaffold.config.ts
export default defineConfig({
  apps: [
    {
      name: 'api',
      type: 'nestjs',
      plugins: ['orpc'],
      config: {
        orpc: {
          routerStyle: 'nested',
          includeValidation: true,
          procedures: ['user', 'auth', 'post'],
        },
      },
    },
    {
      name: 'web',
      type: 'nextjs',
      plugins: ['orpc-client'],
    },
  ],
  
  // Package configuration (optional - plugins auto-configure)
  packages: [
    {
      name: 'contracts',
      plugin: 'orpc-contracts',
      path: 'packages/contracts/api',
      // Can override plugin-provided config
      config: {
        exportFormat: 'named',
      },
    },
  ],
  
  bridges: [
    { type: 'orpc', source: 'api', target: 'web' },
  ],
});

// Generated structure:
// packages/
// └── contracts/
//     └── api/
//         ├── package.json
//         ├── tsconfig.json
//         ├── src/
//         │   ├── index.ts           # Main exports
//         │   ├── router.ts          # Router definition
//         │   └── procedures/
//         │       ├── user.ts
//         │       ├── auth.ts
//         │       └── post.ts
//         └── README.md
```

### Package Plugin vs Regular Plugin

| Aspect | Regular Plugin | Package Plugin |
|--------|---------------|----------------|
| **Target** | Apps (`apps/api`, `apps/web`) | Packages (`packages/`) |
| **Purpose** | Add features to apps | Create shared packages |
| **Scope** | Single app | Multiple apps can consume |
| **Dependencies** | Other plugins | Other package plugins |
| **Configuration** | From app config | From parent plugins + config |
| **Generation Order** | After packages | Before apps |
| **Output** | Files in app directory | Complete package with package.json |

---

## Template Engine

The scaffold uses **Handlebars** as its template engine with extensive customization for code generation.

### Template Syntax

```handlebars
{{! Basic variable interpolation }}
{{projectName}}

{{! Conditional blocks }}
{{#if hasAuth}}
import { AuthModule } from './auth/auth.module';
{{/if}}

{{! Iteration }}
{{#each plugins}}
import { {{pascalCase this.name}}Module } from './{{kebabCase this.name}}/{{kebabCase this.name}}.module';
{{/each}}

{{! Nested conditionals }}
{{#if database}}
  {{#if (eq database.provider 'postgresql')}}
import { PostgresDialect } from 'drizzle-orm/postgres-js';
  {{else if (eq database.provider 'mysql')}}
import { MySqlDialect } from 'drizzle-orm/mysql2';
  {{/if}}
{{/if}}
```

### Available Variables

Templates receive a rich context object with all generation data:

```typescript
interface TemplateContext {
  // Project metadata
  project: {
    name: string;
    description: string;
    version: string;
  };
  
  // Current app being generated
  app: {
    name: string;
    type: AppTypeId;
    path: string;
    plugins: string[];
  };
  
  // All apps in the monorepo
  apps: AppConfig[];
  
  // Package manager
  packageManager: 'bun' | 'npm' | 'pnpm' | 'yarn';
  
  // Plugin configurations
  config: Record<string, unknown>;
  
  // Global context registry data
  globalContext: {
    schemas: Record<string, SchemaDefinition>;
    entities: Record<string, EntityDefinition>;
    services: Record<string, ServiceDefinition>;
    contracts: Record<string, ContractDefinition>;
  };
  
  // Feature flags
  features: {
    hasAuth: boolean;
    hasDatabase: boolean;
    hasOrpc: boolean;
    hasDocker: boolean;
    hasCiCd: boolean;
  };
  
  // Environment
  environment: 'development' | 'production' | 'test';
}
```

### Custom Helpers

The template engine includes **35+ custom helpers** for code generation:

#### String Transformation Helpers

```handlebars
{{! Case transformations }}
{{pascalCase "user-service"}}      → UserService
{{camelCase "user-service"}}       → userService
{{kebabCase "UserService"}}        → user-service
{{snakeCase "UserService"}}        → user_service
{{constantCase "userService"}}     → USER_SERVICE
{{titleCase "user service"}}       → User Service

{{! String manipulation }}
{{pluralize "user"}}               → users
{{singularize "users"}}            → user
{{capitalize "hello"}}             → Hello
{{lowercase "HELLO"}}              → hello
{{uppercase "hello"}}              → HELLO
```

#### Comparison Helpers

```handlebars
{{! Equality }}
{{#if (eq appType 'nestjs')}}...{{/if}}
{{#if (ne appType 'nextjs')}}...{{/if}}

{{! Comparison }}
{{#if (gt priority 10)}}...{{/if}}
{{#if (gte priority 10)}}...{{/if}}
{{#if (lt priority 10)}}...{{/if}}
{{#if (lte priority 10)}}...{{/if}}

{{! Logical operators }}
{{#if (and hasAuth hasDatabase)}}...{{/if}}
{{#if (or hasAuth hasApiKey)}}...{{/if}}
{{#if (not disabled)}}...{{/if}}
```

#### Array/Collection Helpers

```handlebars
{{! Array operations }}
{{#if (includes plugins 'drizzle')}}...{{/if}}
{{#if (isEmpty plugins)}}...{{/if}}
{{length plugins}}
{{first plugins}}
{{last plugins}}

{{! Join with separator }}
{{join plugins ', '}}

{{! Array filtering }}
{{#each (filter plugins 'type' 'feature')}}
  {{this.name}}
{{/each}}
```

#### Code Generation Helpers

```handlebars
{{! Import generation }}
{{import 'AuthService' './auth.service'}}
{{importType 'User' './types'}}

{{! Decorator generation }}
{{decorator 'Controller' 'users'}}
{{decorator 'Injectable'}}

{{! Path resolution }}
{{relativePath from to}}
{{absolutePath path}}

{{! JSON formatting }}
{{json config indent=2}}
{{jsonStringify value}}
```

#### Conditional Code Blocks

```handlebars
{{! Conditional imports block }}
{{#imports}}
  {{#if hasAuth}}
  import { AuthModule } from './auth/auth.module';
  {{/if}}
  {{#if hasOrpc}}
  import { OrpcModule } from './orpc/orpc.module';
  {{/if}}
{{/imports}}

{{! Module array generation }}
imports: [
  {{#moduleImports}}
    {{#if hasDatabase}}DrizzleModule,{{/if}}
    {{#if hasAuth}}AuthModule,{{/if}}
    {{#if hasOrpc}}OrpcModule,{{/if}}
  {{/moduleImports}}
],
```

### Template Inheritance

Templates can extend base templates and override specific blocks:

```handlebars
{{! templates/base/module.hbs }}
import { Module } from '@nestjs/common';
{{> imports}}

@Module({
  imports: [{{> moduleImports}}],
  controllers: [{{> controllers}}],
  providers: [{{> providers}}],
  exports: [{{> exports}}],
})
export class {{pascalCase moduleName}}Module {}
```

```handlebars
{{! templates/auth/module.hbs - extends base }}
{{#extend 'base/module'}}

{{#block 'imports'}}
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
{{/block}}

{{#block 'controllers'}}
AuthController
{{/block}}

{{#block 'providers'}}
AuthService
{{/block}}

{{/extend}}
```

### Template File Organization

```
src/
└── templates/
    ├── base/                    # Base templates for inheritance
    │   ├── module.hbs
    │   ├── service.hbs
    │   ├── controller.hbs
    │   └── package-json.hbs
    ├── apps/                    # App-specific templates
    │   ├── nestjs/
    │   │   ├── main.ts.hbs
    │   │   ├── app.module.ts.hbs
    │   │   └── ...
    │   ├── nextjs/
    │   │   ├── app/layout.tsx.hbs
    │   │   ├── app/page.tsx.hbs
    │   │   └── ...
    │   └── fumadocs/
    │       └── ...
    ├── plugins/                 # Plugin-specific templates
    │   ├── better-auth/
    │   ├── drizzle/
    │   ├── orpc/
    │   └── ...
    └── packages/                # Package templates
        ├── configs/
        ├── contracts/
        └── ...
```

### Creating Custom Templates

```typescript
// Register a custom template
class MyPluginGenerator extends PluginGenerator {
  protected getTemplates(): TemplateRegistration[] {
    return [
      {
        name: 'my-plugin/service',
        path: 'templates/my-plugin/service.hbs',
        context: (ctx) => ({
          ...ctx,
          customField: 'value',
        }),
      },
    ];
  }
  
  protected getFiles(context: GeneratorContext): FileSpec[] {
    return [
      {
        path: 'src/my-plugin/my-plugin.service.ts',
        template: 'my-plugin/service',
        context: { serviceName: 'MyPlugin' },
      },
    ];
  }
}
```

---

## Error Handling & Recovery

The scaffold system implements comprehensive error handling to ensure safe generation with clear feedback.

### Error Categories

| Category | Code Range | Description | Recovery |
|----------|-----------|-------------|----------|
| `ConfigurationError` | 1000-1099 | Invalid scaffold.config.ts | Show validation errors, abort |
| `ValidationError` | 1100-1199 | Schema validation failed | Show field errors, abort |
| `DependencyError` | 1200-1299 | Missing or circular dependency | Auto-resolve or prompt |
| `PluginError` | 1300-1399 | Plugin incompatibility | Suggest alternatives |
| `GenerationError` | 1400-1499 | File generation failed | Rollback affected files |
| `MergeConflictError` | 1500-1599 | AST merge impossible | Keep both versions, warn |
| `FileSystemError` | 1600-1699 | I/O operation failed | Retry or rollback |
| `TemplateError` | 1700-1799 | Template rendering failed | Show template location |

### Error Interface

```typescript
interface ScaffoldError {
  code: number;
  category: ErrorCategory;
  message: string;
  details?: string;
  
  // Location information
  file?: string;
  line?: number;
  column?: number;
  
  // Context for debugging
  context?: {
    plugin?: string;
    generator?: string;
    template?: string;
    phase?: string;
  };
  
  // Recovery options
  recovery?: {
    canRetry: boolean;
    canRollback: boolean;
    suggestions: string[];
  };
  
  // Stack trace (in debug mode)
  stack?: string;
}
```

### Recovery Strategies

```typescript
// Error recovery configuration
const recoveryStrategies: Record<ErrorCategory, RecoveryStrategy> = {
  ConfigurationError: {
    action: 'abort',
    cleanup: false,
    message: 'Please fix the configuration and try again.',
  },
  
  DependencyError: {
    action: 'prompt',
    options: [
      { label: 'Auto-install missing dependencies', action: 'auto-resolve' },
      { label: 'Skip this plugin', action: 'skip-plugin' },
      { label: 'Abort generation', action: 'abort' },
    ],
  },
  
  GenerationError: {
    action: 'rollback',
    cleanup: true,
    preservePartial: false,
    message: 'Rolling back generated files...',
  },
  
  MergeConflictError: {
    action: 'prompt',
    options: [
      { label: 'Keep existing file', action: 'keep-existing' },
      { label: 'Overwrite with new', action: 'overwrite' },
      { label: 'Create .conflict file', action: 'create-conflict' },
      { label: 'Abort generation', action: 'abort' },
    ],
  },
  
  FileSystemError: {
    action: 'retry',
    maxRetries: 3,
    retryDelay: 1000,
    fallback: 'abort',
  },
};
```

### Rollback Mechanism

The scaffold implements a **transaction-like rollback system**:

```typescript
class GenerationTransaction {
  private operations: FileOperation[] = [];
  private completed: FileOperation[] = [];
  
  // Record an operation for potential rollback
  recordOperation(op: FileOperation): void {
    this.operations.push(op);
  }
  
  // Mark operation as completed
  markCompleted(op: FileOperation): void {
    this.completed.push(op);
  }
  
  // Rollback all completed operations
  async rollback(): Promise<RollbackResult> {
    const results: RollbackOperation[] = [];
    
    // Reverse order for proper cleanup
    for (const op of this.completed.reverse()) {
      try {
        await this.undoOperation(op);
        results.push({ operation: op, status: 'rolled-back' });
      } catch (error) {
        results.push({ operation: op, status: 'failed', error });
      }
    }
    
    return {
      totalOperations: this.completed.length,
      rolledBack: results.filter(r => r.status === 'rolled-back').length,
      failed: results.filter(r => r.status === 'failed').length,
      details: results,
    };
  }
  
  private async undoOperation(op: FileOperation): Promise<void> {
    switch (op.type) {
      case 'create':
        // Delete the created file
        await fs.unlink(op.path);
        break;
      case 'modify':
        // Restore original content
        await fs.writeFile(op.path, op.originalContent!);
        break;
      case 'delete':
        // Restore deleted file
        await fs.writeFile(op.path, op.originalContent!);
        break;
      case 'mkdir':
        // Remove created directory (if empty)
        await fs.rmdir(op.path);
        break;
    }
  }
}
```

### Error Messages Format

```
┌──────────────────────────────────────────────────────────────────┐
│ ❌ SCAFFOLD ERROR [1301]                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Plugin 'shadcn-ui' is not compatible with app type 'nestjs'.   │
│                                                                  │
│  File: scaffold.config.ts                                        │
│  Line: 24                                                        │
│                                                                  │
│  Context:                                                        │
│    App: api                                                      │
│    Plugin: shadcn-ui                                             │
│    Expected: nextjs, fumadocs                                    │
│                                                                  │
│  Suggestions:                                                    │
│    1. Remove 'shadcn-ui' from the 'api' app plugins             │
│    2. Add 'shadcn-ui' to a Next.js app instead                  │
│    3. Use 'nestjs-swagger' for API documentation                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Complete Error Code Reference

All scaffold errors follow the format `[XYYY]` where `X` is the category and `YYY` is the specific error.

#### Configuration Errors (1XXX)

| Code | Name | Description | Common Cause | Resolution |
|------|------|-------------|--------------|------------|
| `1001` | `CONFIG_NOT_FOUND` | Configuration file not found | Missing `scaffold.config.ts` | Create config file or specify path with `-c` |
| `1002` | `CONFIG_PARSE_ERROR` | Failed to parse configuration | Syntax error in config | Check TypeScript syntax errors |
| `1003` | `CONFIG_VALIDATION_ERROR` | Configuration validation failed | Invalid property values | Check against config schema |
| `1004` | `CONFIG_SCHEMA_MISMATCH` | Config doesn't match expected schema | Outdated config format | Run `scaffold migrate config` |
| `1010` | `INVALID_APP_TYPE` | Unknown app type specified | Typo in `type` field | Use: `nestjs`, `nextjs`, `fumadocs` |
| `1011` | `DUPLICATE_APP_NAME` | Multiple apps with same name | Copy-paste error | Use unique names for each app |
| `1012` | `INVALID_APP_PATH` | App path is invalid | Path outside workspace | Use relative paths within workspace |
| `1020` | `MISSING_REQUIRED_FIELD` | Required configuration field missing | Incomplete config | Add required field to config |
| `1021` | `INVALID_FIELD_TYPE` | Field has wrong type | String where number expected | Check field type in schema |

#### Plugin Errors (13XX)

| Code | Name | Description | Common Cause | Resolution |
|------|------|-------------|--------------|------------|
| `1301` | `PLUGIN_INCOMPATIBLE` | Plugin not compatible with app type | Using UI plugin on API app | Check plugin compatibility matrix |
| `1302` | `PLUGIN_NOT_FOUND` | Plugin could not be resolved | Typo in plugin name | Check available plugins with `scaffold list plugins` |
| `1303` | `PLUGIN_VERSION_CONFLICT` | Plugin versions conflict | Multiple plugins need different versions | Upgrade to compatible versions |
| `1304` | `PLUGIN_DEPENDENCY_MISSING` | Plugin dependency not satisfied | Plugin A requires plugin B | Add required plugin to config |
| `1305` | `PLUGIN_CIRCULAR_DEPENDENCY` | Circular dependency detected | A → B → C → A | Restructure plugin dependencies |
| `1310` | `PLUGIN_CONFIG_INVALID` | Plugin configuration invalid | Wrong plugin options | Check plugin documentation |
| `1311` | `PLUGIN_INIT_FAILED` | Plugin initialization failed | Plugin internal error | Check plugin logs, report issue |

#### Generator Errors (2XXX)

| Code | Name | Description | Common Cause | Resolution |
|------|------|-------------|--------------|------------|
| `2001` | `GENERATOR_NOT_FOUND` | Generator not registered | Internal error | Report as bug |
| `2002` | `GENERATOR_PRIORITY_CONFLICT` | Multiple generators same priority | Plugin conflict | Adjust generator priorities |
| `2010` | `TEMPLATE_NOT_FOUND` | Template file missing | Incomplete plugin | Reinstall plugin |
| `2011` | `TEMPLATE_SYNTAX_ERROR` | Template has syntax error | Malformed template | Fix template syntax |
| `2012` | `TEMPLATE_VARIABLE_UNDEFINED` | Template uses undefined variable | Missing context | Define variable in generator |
| `2020` | `GENERATOR_TIMEOUT` | Generator took too long | Complex generation | Increase timeout or optimize |
| `2021` | `GENERATOR_OOM` | Out of memory during generation | Very large project | Increase memory limit |

#### File System Errors (3XXX)

| Code | Name | Description | Common Cause | Resolution |
|------|------|-------------|--------------|------------|
| `3001` | `FILE_WRITE_FAILED` | Failed to write file | Permission denied | Check directory permissions |
| `3002` | `FILE_READ_FAILED` | Failed to read file | File doesn't exist | Verify file path |
| `3003` | `DIRECTORY_CREATE_FAILED` | Failed to create directory | Parent doesn't exist | Check path structure |
| `3010` | `MERGE_CONFLICT` | File merge resulted in conflict | Incompatible contributions | Resolve manually or use strategy |
| `3011` | `MERGE_STRATEGY_FAILED` | Merge strategy could not be applied | Invalid existing content | Check file format |
| `3020` | `DISK_SPACE_ERROR` | Insufficient disk space | Full disk | Free disk space |
| `3021` | `PATH_TOO_LONG` | File path exceeds limit | Deep nesting | Flatten directory structure |

#### Validation Errors (4XXX)

| Code | Name | Description | Common Cause | Resolution |
|------|------|-------------|--------------|------------|
| `4001` | `SCHEMA_VALIDATION_FAILED` | Generated file fails schema | Generator bug | Report as bug |
| `4002` | `TYPESCRIPT_ERROR` | Generated TypeScript has errors | Template issue | Check template |
| `4003` | `ESLINT_ERROR` | Generated code fails linting | Style mismatch | Update ESLint config |
| `4010` | `CIRCULAR_IMPORT` | Circular imports detected | Bad code structure | Restructure imports |
| `4011` | `MISSING_EXPORT` | Expected export not found | Template incomplete | Add missing export |

#### Network Errors (5XXX)

| Code | Name | Description | Common Cause | Resolution |
|------|------|-------------|--------------|------------|
| `5001` | `NETWORK_ERROR` | Network request failed | No internet | Check connection |
| `5002` | `REGISTRY_UNAVAILABLE` | Plugin registry unavailable | Service down | Retry later |
| `5003` | `DOWNLOAD_FAILED` | Failed to download plugin | Timeout or 404 | Check plugin name/version |
| `5010` | `AUTH_REQUIRED` | Authentication required | Private registry | Provide credentials |
| `5011` | `AUTH_FAILED` | Authentication failed | Invalid credentials | Check credentials |

### Dry Run Mode

Test generation without writing files:

```bash
scaffold new my-project --dry-run
```

```typescript
interface DryRunResult {
  wouldCreate: string[];      // Files that would be created
  wouldModify: string[];      // Files that would be modified
  wouldDelete: string[];      // Files that would be deleted
  conflicts: ConflictInfo[];  // Potential merge conflicts
  dependencies: string[];     // NPM packages that would be installed
  
  // Summary
  summary: {
    totalFiles: number;
    totalDirs: number;
    estimatedSize: string;
    estimatedTime: string;
  };
}
```

---

## CLI Command Reference

### Core Commands

#### `scaffold new <project-name>`

Create a new monorepo project.

```bash
scaffold new my-project [options]

Options:
  -c, --config <path>      Path to scaffold.config.ts (default: ./scaffold.config.ts)
  -t, --template <name>    Use a predefined template (saas-starter, api-only, fullstack)
  -d, --directory <path>   Output directory (default: ./<project-name>)
  -p, --package-manager    Package manager to use (bun, npm, pnpm, yarn)
  --dry-run                Preview changes without writing files
  --no-install             Skip dependency installation
  --no-git                 Skip git initialization
  --verbose                Enable verbose output
  --debug                  Enable debug mode with full stack traces
  
Examples:
  scaffold new my-saas --template saas-starter
  scaffold new my-api --config custom.config.ts --dry-run
  scaffold new my-app -p pnpm --no-git
```

#### `scaffold add <plugin>`

Add a plugin to an existing app.

```bash
scaffold add <plugin> [options]

Options:
  -a, --app <name>         Target app name (required)
  -c, --config <json>      Plugin configuration as JSON string
  --dry-run                Preview changes without writing files
  --force                  Overwrite existing files without prompting
  
Examples:
  scaffold add better-auth --app api
  scaffold add shadcn-ui --app web --config '{"theme":"zinc"}'
  scaffold add drizzle --app api --config '{"provider":"postgresql"}'
```

#### `scaffold remove <plugin>`

Remove a plugin from an app.

```bash
scaffold remove <plugin> [options]

Options:
  -a, --app <name>         Target app name (required)
  --keep-files             Keep generated files (only remove from config)
  --dry-run                Preview changes without writing files
  
Examples:
  scaffold remove shadcn-ui --app web
  scaffold remove better-auth --app api --keep-files
```

### Plugin Commands

#### `scaffold list plugins`

List available plugins.

```bash
scaffold list plugins [options]

Options:
  --app-type <type>        Filter by app type (nestjs, nextjs, fumadocs, etc.)
  --type <category>        Filter by plugin type (feature, enhancement, bridge, etc.)
  --json                   Output as JSON
  
Examples:
  scaffold list plugins --app-type nestjs
  scaffold list plugins --type feature --json
```

#### `scaffold info <plugin>`

Show detailed information about a plugin.

```bash
scaffold info <plugin>

Output:
  - Name, description, version
  - Supported app types
  - Dependencies (required and optional)
  - Configuration schema
  - Generated files list

Examples:
  scaffold info better-auth
  scaffold info drizzle
```

#### `scaffold validate`

Validate the current scaffold configuration.

```bash
scaffold validate [options]

Options:
  -c, --config <path>      Path to scaffold.config.ts
  --strict                 Enable strict validation mode
  
Examples:
  scaffold validate
  scaffold validate --config custom.config.ts --strict
```

### Utility Commands

#### `scaffold init`

Initialize a scaffold.config.ts in the current directory.

```bash
scaffold init [options]

Options:
  --template <name>        Start from a template
  --interactive            Interactive configuration wizard
  
Examples:
  scaffold init --interactive
  scaffold init --template saas-starter
```

#### `scaffold upgrade`

Upgrade scaffold configuration to the latest version.

```bash
scaffold upgrade [options]

Options:
  -c, --config <path>      Path to scaffold.config.ts
  --dry-run                Show what would change
  
Examples:
  scaffold upgrade
  scaffold upgrade --dry-run
```

#### `scaffold doctor`

Diagnose common issues with the scaffold setup.

```bash
scaffold doctor [options]

Options:
  --fix                    Attempt to fix detected issues
  
Output:
  - Configuration validity
  - Dependency status
  - Plugin compatibility
  - File system permissions
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SCAFFOLD_CONFIG` | Default config file path | `./scaffold.config.ts` |
| `SCAFFOLD_VERBOSE` | Enable verbose output | `false` |
| `SCAFFOLD_DEBUG` | Enable debug mode | `false` |
| `SCAFFOLD_NO_COLOR` | Disable colored output | `false` |
| `SCAFFOLD_PARALLEL` | Max parallel operations | `4` |
| `SCAFFOLD_TIMEOUT` | Operation timeout (ms) | `30000` |
| `SCAFFOLD_CACHE_DIR` | Template cache directory | `~/.scaffold/cache` |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Validation error |
| 4 | Dependency error |
| 5 | Plugin error |
| 6 | Generation error |
| 7 | File system error |
| 130 | User interrupted (Ctrl+C) |

---

## Plugin Development Guide

This guide walks through creating, testing, and publishing custom plugins.

### Creating a New Plugin

#### Step 1: Define Plugin Metadata

```typescript
// src/plugins/my-plugin/my-plugin.plugin.ts
import { z } from 'zod';
import { definePlugin, PluginCategory, AppTypeId } from '@repo/scaffold';

// 1. Define the configuration schema
export const MyPluginConfigSchema = z.object({
  enableFeatureA: z.boolean().default(true),
  apiPrefix: z.string().default('/api'),
  customOptions: z.record(z.string()).default({}),
}).strict();

export type MyPluginConfig = z.infer<typeof MyPluginConfigSchema>;

// 2. Define the plugin
export const myPlugin = definePlugin({
  // Unique identifier (kebab-case)
  id: 'my-plugin',
  
  // Display name
  name: 'My Plugin',
  
  // Description
  description: 'Adds my custom functionality to the app',
  
  // Version
  version: '1.0.0',
  
  // Plugin category
  category: PluginCategory.Feature,
  
  // Supported app types
  supportedAppTypes: [AppTypeId.NestJS, AppTypeId.NextJS],
  
  // Dependencies
  dependencies: {
    required: [],  // Must have these plugins
    optional: ['drizzle', 'better-auth'],  // Enhanced if present
    conflicts: [],  // Cannot coexist with these
  },
  
  // Configuration schema
  configSchema: MyPluginConfigSchema,
  
  // Generator class
  generator: MyPluginGenerator,
});
```

#### Step 2: Implement the Generator

```typescript
// src/plugins/my-plugin/my-plugin.generator.ts
import { FeatureGenerator, GeneratorContext, FileSpec } from '@repo/scaffold';
import { MyPluginConfig } from './my-plugin.plugin';

export class MyPluginGenerator extends FeatureGenerator {
  // Declare config type for type safety
  declare config: MyPluginConfig;
  
  // Priority determines execution order (20-29 for features)
  static priority = 25;
  
  // Generate files for a specific app type
  protected getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];
    
    // Core files always generated
    files.push({
      path: 'src/my-plugin/my-plugin.module.ts',
      template: 'my-plugin/module',
      context: {
        ...context,
        config: this.config,
      },
    });
    
    files.push({
      path: 'src/my-plugin/my-plugin.service.ts',
      template: 'my-plugin/service',
    });
    
    // Conditional files based on config
    if (this.config.enableFeatureA) {
      files.push({
        path: 'src/my-plugin/feature-a.ts',
        template: 'my-plugin/feature-a',
      });
    }
    
    // Files that depend on other plugins
    if (this.hasPlugin(context, 'drizzle')) {
      files.push({
        path: 'src/my-plugin/my-plugin.repository.ts',
        template: 'my-plugin/repository-drizzle',
      });
    }
    
    return files;
  }
  
  // Register contributions to the global context
  protected registerContext(context: GeneratorContext): void {
    // Register service for other plugins to use
    context.globalContext.register('service', 'MyPluginService', {
      className: 'MyPluginService',
      importPath: './my-plugin/my-plugin.service',
    });
    
    // Register routes
    context.globalContext.register('route', '/my-plugin', {
      method: 'GET',
      handler: 'MyPluginController.getAll',
    });
  }
  
  // Dependencies to add to package.json
  protected getDependencies(): DependencySpec[] {
    return [
      { name: 'my-library', version: '^1.0.0', dev: false },
    ];
  }
  
  // Scripts to add to package.json
  protected getScripts(): ScriptSpec[] {
    return [
      { name: 'my-plugin:sync', command: 'my-plugin sync' },
    ];
  }
  
  // Modify existing files
  protected getTransforms(context: GeneratorContext): FileTransform[] {
    return [
      {
        path: 'src/app.module.ts',
        transforms: [
          {
            type: 'add-import',
            source: './my-plugin/my-plugin.module',
            specifiers: ['MyPluginModule'],
          },
          {
            type: 'add-array-item',
            target: 'imports',
            value: 'MyPluginModule',
          },
        ],
      },
    ];
  }
}
```

#### Step 3: Create Templates

```handlebars
{{! templates/my-plugin/module.hbs }}
import { Module } from '@nestjs/common';
import { MyPluginService } from './my-plugin.service';
import { MyPluginController } from './my-plugin.controller';
{{#if config.enableFeatureA}}
import { FeatureAService } from './feature-a';
{{/if}}

@Module({
  controllers: [MyPluginController],
  providers: [
    MyPluginService,
    {{#if config.enableFeatureA}}
    FeatureAService,
    {{/if}}
  ],
  exports: [MyPluginService],
})
export class MyPluginModule {}
```

#### Step 4: Register the Plugin

```typescript
// src/plugins/index.ts
import { PluginRegistry } from '@repo/scaffold';
import { myPlugin } from './my-plugin/my-plugin.plugin';

export function registerPlugins(registry: PluginRegistry): void {
  registry.register(myPlugin);
}
```

### Plugin Testing

#### Unit Testing

```typescript
// src/plugins/my-plugin/__tests__/my-plugin.generator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext, MockGlobalContext } from '@repo/scaffold/testing';
import { MyPluginGenerator } from '../my-plugin.generator';
import { MyPluginConfigSchema } from '../my-plugin.plugin';

describe('MyPluginGenerator', () => {
  let generator: MyPluginGenerator;
  let context: ReturnType<typeof createTestContext>;
  
  beforeEach(() => {
    context = createTestContext({
      appType: 'nestjs',
      appName: 'api',
      plugins: ['my-plugin'],
    });
    
    generator = new MyPluginGenerator({
      config: MyPluginConfigSchema.parse({}),
      context,
    });
  });
  
  describe('getFiles', () => {
    it('should generate core module file', () => {
      const files = generator.getFiles(context);
      
      expect(files).toContainEqual(
        expect.objectContaining({
          path: 'src/my-plugin/my-plugin.module.ts',
        })
      );
    });
    
    it('should generate feature-a when enabled', () => {
      generator = new MyPluginGenerator({
        config: MyPluginConfigSchema.parse({ enableFeatureA: true }),
        context,
      });
      
      const files = generator.getFiles(context);
      
      expect(files).toContainEqual(
        expect.objectContaining({
          path: 'src/my-plugin/feature-a.ts',
        })
      );
    });
    
    it('should NOT generate feature-a when disabled', () => {
      generator = new MyPluginGenerator({
        config: MyPluginConfigSchema.parse({ enableFeatureA: false }),
        context,
      });
      
      const files = generator.getFiles(context);
      
      expect(files).not.toContainEqual(
        expect.objectContaining({
          path: 'src/my-plugin/feature-a.ts',
        })
      );
    });
  });
  
  describe('getDependencies', () => {
    it('should include my-library dependency', () => {
      const deps = generator.getDependencies();
      
      expect(deps).toContainEqual({
        name: 'my-library',
        version: '^1.0.0',
        dev: false,
      });
    });
  });
});
```

#### Snapshot Testing

```typescript
// src/plugins/my-plugin/__tests__/my-plugin.snapshot.test.ts
import { describe, it, expect } from 'vitest';
import { generateSnapshot, createTestContext } from '@repo/scaffold/testing';

describe('MyPlugin Snapshots', () => {
  it('should match snapshot for default config', async () => {
    const result = await generateSnapshot({
      plugins: ['my-plugin'],
      appType: 'nestjs',
      config: {},
    });
    
    expect(result.files).toMatchSnapshot();
  });
  
  it('should match snapshot with all features enabled', async () => {
    const result = await generateSnapshot({
      plugins: ['my-plugin'],
      appType: 'nestjs',
      config: {
        'my-plugin': {
          enableFeatureA: true,
          customOptions: { key: 'value' },
        },
      },
    });
    
    expect(result.files).toMatchSnapshot();
  });
});
```

#### Integration Testing

```typescript
// src/plugins/my-plugin/__tests__/my-plugin.integration.test.ts
import { describe, it, expect } from 'vitest';
import { scaffoldProject, cleanupProject } from '@repo/scaffold/testing';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('MyPlugin Integration', () => {
  const testDir = '/tmp/scaffold-test';
  
  afterEach(async () => {
    await cleanupProject(testDir);
  });
  
  it('should generate working project with my-plugin', async () => {
    await scaffoldProject({
      directory: testDir,
      config: {
        project: { name: 'test-project' },
        apps: [{
          name: 'api',
          type: 'nestjs',
          plugins: ['my-plugin'],
        }],
      },
    });
    
    // Verify files exist
    expect(existsSync(join(testDir, 'apps/api/src/my-plugin/my-plugin.module.ts'))).toBe(true);
    
    // Verify content
    const moduleContent = readFileSync(
      join(testDir, 'apps/api/src/my-plugin/my-plugin.module.ts'),
      'utf-8'
    );
    expect(moduleContent).toContain('MyPluginModule');
    
    // Verify package.json
    const packageJson = JSON.parse(
      readFileSync(join(testDir, 'apps/api/package.json'), 'utf-8')
    );
    expect(packageJson.dependencies['my-library']).toBeDefined();
  });
});
```

### Publishing Plugins

#### Local Plugins

For project-specific plugins, place them in the project:

```
my-project/
├── scaffold-plugins/
│   └── my-plugin/
│       ├── index.ts
│       ├── my-plugin.plugin.ts
│       ├── my-plugin.generator.ts
│       └── templates/
└── scaffold.config.ts
```

```typescript
// scaffold.config.ts
import { defineConfig } from '@repo/scaffold';
import { myPlugin } from './scaffold-plugins/my-plugin';

export default defineConfig({
  plugins: [myPlugin],
  // ...
});
```

#### NPM Packages

For shareable plugins, publish as npm packages:

```json
{
  "name": "scaffold-plugin-my-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@repo/scaffold": "^1.0.0"
  }
}
```

```typescript
// scaffold.config.ts
import { defineConfig } from '@repo/scaffold';
import { myPlugin } from 'scaffold-plugin-my-plugin';

export default defineConfig({
  plugins: [myPlugin],
  // ...
});
```

### Plugin Checklist

Before releasing a plugin, ensure:

- [ ] **Metadata complete**: id, name, description, version
- [ ] **Config schema defined**: All options documented with defaults
- [ ] **App types validated**: Only supports compatible app types
- [ ] **Dependencies declared**: Required, optional, and conflicting plugins
- [ ] **Generator implemented**: All file generation logic
- [ ] **Templates created**: All required template files
- [ ] **Context registered**: Services, routes, schemas registered
- [ ] **Unit tests passing**: Generator logic tested
- [ ] **Snapshot tests**: File output verified
- [ ] **Integration test**: Full generation tested
- [ ] **Documentation written**: README with usage examples

---

## Testing Strategy

### Generator Testing

#### Unit Testing Generators

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockContext, TestGenerator } from '@repo/scaffold/testing';

describe('BetterAuthGenerator', () => {
  let generator: BetterAuthGenerator;
  let mockContext: ReturnType<typeof createMockContext>;
  
  beforeEach(() => {
    mockContext = createMockContext({
      appType: 'nestjs',
      appName: 'api',
      appPath: 'apps/api',
    });
    
    generator = new BetterAuthGenerator({
      config: { providers: ['google', 'github'] },
      context: mockContext,
    });
  });
  
  it('should generate auth module', () => {
    const files = generator.generate();
    
    expect(files).toContainFile('src/auth/auth.module.ts');
    expect(files).toContainFile('src/auth/auth.service.ts');
  });
  
  it('should register auth routes in global context', () => {
    generator.generate();
    
    expect(mockContext.globalContext.get('route', '/auth')).toBeDefined();
  });
});
```

#### Testing File Merging

```typescript
describe('File Merging', () => {
  it('should merge JSON files correctly', async () => {
    const result = await mergeFiles({
      base: { scripts: { test: 'vitest' } },
      contribution: { scripts: { build: 'tsc' } },
      strategy: 'json-merge-deep',
    });
    
    expect(result).toEqual({
      scripts: {
        test: 'vitest',
        build: 'tsc',
      },
    });
  });
  
  it('should apply AST transforms', async () => {
    const result = await applyTransforms({
      source: 'import { Module } from "@nestjs/common";',
      transforms: [
        {
          type: 'add-import',
          source: './auth/auth.module',
          specifiers: ['AuthModule'],
        },
      ],
    });
    
    expect(result).toContain("import { AuthModule } from './auth/auth.module';");
  });
});
```

### Plugin Testing

```typescript
describe('Plugin Compatibility', () => {
  it('should validate plugin supports app type', () => {
    const plugin = getPlugin('shadcn-ui');
    
    expect(plugin.supportsAppType('nextjs')).toBe(true);
    expect(plugin.supportsAppType('nestjs')).toBe(false);
  });
  
  it('should resolve plugin dependencies', () => {
    const deps = resolvePluginDependencies(['orpc-better-auth']);
    
    expect(deps).toContain('orpc');
    expect(deps).toContain('better-auth');
  });
  
  it('should detect plugin conflicts', () => {
    expect(() => {
      validatePluginSet(['drizzle', 'prisma']);
    }).toThrow('Plugins conflict: drizzle and prisma');
  });
});
```

### Snapshot Testing

```typescript
describe('Generated Output Snapshots', () => {
  it('should match snapshot for NestJS with Drizzle', async () => {
    const output = await scaffold({
      apps: [{
        name: 'api',
        type: 'nestjs',
        plugins: ['drizzle'],
        config: { drizzle: { provider: 'postgresql' } },
      }],
    });
    
    expect(output.fileTree).toMatchSnapshot();
    expect(output.packageJson).toMatchSnapshot();
  });
  
  it('should match snapshot for full SaaS setup', async () => {
    const output = await scaffold({
      apps: [
        {
          name: 'api',
          type: 'nestjs',
          plugins: ['drizzle', 'better-auth', 'orpc'],
        },
        {
          name: 'web',
          type: 'nextjs',
          plugins: ['react-query', 'shadcn-ui'],
        },
      ],
      bridges: [
        { type: 'orpc', source: 'api', target: 'web' },
      ],
    });
    
    expect(output).toMatchSnapshot();
  });
});
```

### Integration Testing

```typescript
describe('Full Scaffold Integration', () => {
  const testDir = '/tmp/scaffold-integration-test';
  
  beforeAll(async () => {
    await scaffold({
      directory: testDir,
      config: saasStarterConfig,
    });
  });
  
  afterAll(async () => {
    await fs.rm(testDir, { recursive: true });
  });
  
  it('should have valid package.json in all apps', async () => {
    const apiPackage = await readJson(`${testDir}/apps/api/package.json`);
    const webPackage = await readJson(`${testDir}/apps/web/package.json`);
    
    expect(apiPackage.name).toBe('@my-project/api');
    expect(webPackage.name).toBe('@my-project/web');
  });
  
  it('should pass TypeScript type checking', async () => {
    const result = await exec('bun run type-check', { cwd: testDir });
    expect(result.exitCode).toBe(0);
  });
  
  it('should pass linting', async () => {
    const result = await exec('bun run lint', { cwd: testDir });
    expect(result.exitCode).toBe(0);
  });
  
  it('should build successfully', async () => {
    const result = await exec('bun run build', { cwd: testDir });
    expect(result.exitCode).toBe(0);
  });
});
```

### Test Coverage Goals

| Component | Target Coverage |
|-----------|-----------------|
| Core Services | 90%+ |
| Generators | 85%+ |
| Plugins | 80%+ |
| Templates | 75%+ (via snapshots) |
| CLI Commands | 70%+ |

---

## Debugging & Troubleshooting

### Debug Mode

Enable comprehensive debugging output:

```bash
# Via CLI flag
scaffold new my-project --debug

# Via environment variable
SCAFFOLD_DEBUG=true scaffold new my-project
```

Debug mode enables:
- Full stack traces on errors
- Generator execution timing
- File operation logging
- Template rendering details
- Memory usage tracking

### Verbose Output

For detailed but less overwhelming output:

```bash
scaffold new my-project --verbose
```

Verbose output shows:
- Phase transitions
- Generator names as they run
- Files being generated
- Dependencies being resolved

### Execution Tracing

The scaffold provides detailed execution traces:

```typescript
// Enable tracing programmatically
const result = await scaffold({
  config: myConfig,
  options: {
    trace: true,
    traceOutput: './scaffold-trace.json',
  },
});
```

Trace output structure:

```json
{
  "startTime": "2025-12-06T10:30:00Z",
  "endTime": "2025-12-06T10:30:15Z",
  "totalDuration": 15000,
  "phases": [
    {
      "name": "Plugin Resolution",
      "duration": 150,
      "operations": [
        { "type": "resolve", "plugin": "drizzle", "duration": 20 },
        { "type": "resolve", "plugin": "better-auth", "duration": 25 }
      ]
    },
    {
      "name": "Generation",
      "duration": 5000,
      "generators": [
        {
          "name": "NestJSGenerator",
          "duration": 1200,
          "files": 15,
          "templates": ["nestjs/main", "nestjs/app-module"]
        }
      ]
    }
  ],
  "fileOperations": [
    { "type": "create", "path": "apps/api/src/main.ts", "size": 1024 },
    { "type": "merge", "path": "package.json", "strategy": "json-merge-deep" }
  ]
}
```

### Common Issues

#### Issue: "Plugin X is not compatible with app type Y"

**Cause**: Attempting to add a plugin to an unsupported app type.

**Solution**:
```typescript
// Check supported app types
scaffold info <plugin>

// Or programmatically
const plugin = getPlugin('shadcn-ui');
console.log(plugin.supportedAppTypes); // ['nextjs', 'fumadocs']
```

#### Issue: "Circular dependency detected"

**Cause**: Plugins have mutual dependencies.

**Solution**:
```bash
# View dependency graph
scaffold info <plugin> --deps

# The error message shows the cycle:
# drizzle -> better-auth -> drizzle
```

#### Issue: "Merge conflict in file X"

**Cause**: Multiple plugins generate incompatible content for the same file.

**Solutions**:
1. Use `--force` to let highest priority win
2. Use dry-run to preview conflicts
3. Adjust plugin priorities in config

```bash
# Preview conflicts
scaffold new my-project --dry-run

# Force generation
scaffold new my-project --force
```

#### Issue: "Template not found: X"

**Cause**: Missing or misnamed template file.

**Solution**:
```typescript
// Verify template exists
const templatePath = generator.resolveTemplatePath('my-template');
console.log('Looking for:', templatePath);

// Check template registration
console.log(generator.getTemplates());
```

#### Issue: "Config validation failed"

**Cause**: Invalid scaffold.config.ts values.

**Solution**:
```bash
# Validate config
scaffold validate --config scaffold.config.ts

# Shows detailed validation errors:
# ❌ apps[0].plugins[2]: Unknown plugin 'invalid-plugin'
# ❌ bridges[0].source: App 'missing-app' not found
```

### Debugging Generator Output

```typescript
// In your generator, add debug logging
class MyGenerator extends FeatureGenerator {
  protected getFiles(context: GeneratorContext): FileSpec[] {
    this.debug('Config:', this.config);
    this.debug('App type:', context.appType);
    this.debug('Has drizzle:', this.hasPlugin(context, 'drizzle'));
    
    const files = [...];
    
    this.debug('Generated files:', files.map(f => f.path));
    
    return files;
  }
}
```

### Inspecting Generated Content

```bash
# Generate to a temp directory for inspection
scaffold new test-output --dry-run > generation-plan.txt

# Or generate and diff
scaffold new test-output
diff -r expected-output test-output
```

---

## Performance Considerations

### Generation Benchmarks

| Scenario | Files | Time | Memory |
|----------|-------|------|--------|
| Minimal (NestJS only) | ~25 | 2s | 50MB |
| Standard (NestJS + NextJS) | ~80 | 5s | 100MB |
| Full SaaS | ~150 | 10s | 150MB |
| Large Monorepo (5 apps) | ~300 | 20s | 250MB |

### Caching Strategies

#### Template Caching

Templates are compiled once and cached:

```typescript
class TemplateCache {
  private cache = new Map<string, HandlebarsTemplateDelegate>();
  
  getOrCompile(name: string, source: string): HandlebarsTemplateDelegate {
    if (!this.cache.has(name)) {
      this.cache.set(name, Handlebars.compile(source));
    }
    return this.cache.get(name)!;
  }
}
```

#### Config Schema Caching

Zod schemas are cached after first parse:

```typescript
const schemaCache = new Map<string, z.ZodSchema>();

function getSchema(pluginId: string): z.ZodSchema {
  if (!schemaCache.has(pluginId)) {
    schemaCache.set(pluginId, loadSchema(pluginId));
  }
  return schemaCache.get(pluginId)!;
}
```

#### File System Caching

For repeated scaffolding (e.g., development):

```bash
# Enable file system cache
SCAFFOLD_CACHE_DIR=~/.scaffold/cache scaffold new my-project

# Clear cache
scaffold cache clear
```

### Large Monorepo Optimization

#### Parallel Generation

Generators without dependencies run in parallel:

```typescript
const parallelGroups = groupByPriority(generators);

for (const group of parallelGroups) {
  // Run generators in parallel within same priority
  await Promise.all(group.map(g => g.generate(context)));
}
```

#### Incremental Generation

For adding plugins to existing projects:

```bash
# Only generate files for the new plugin
scaffold add shadcn-ui --app web --incremental
```

#### Memory Management

For large projects, stream file writing:

```typescript
class StreamingFileWriter {
  async writeFiles(files: AsyncIterable<FileSpec>): Promise<void> {
    for await (const file of files) {
      await this.writeFile(file);
      // Allow GC between files
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
```

### Performance Configuration

```typescript
// scaffold.config.ts
export default defineConfig({
  // ...
  performance: {
    // Max parallel file operations
    parallelism: 8,
    
    // Enable template caching
    cacheTemplates: true,
    
    // Stream large files instead of buffering
    streamThreshold: 1024 * 1024, // 1MB
    
    // Timeout for individual operations
    operationTimeout: 30000,
  },
});
```

---

## Security Considerations

> **Critical**: The scaffold system generates code that will run in production. Security must be considered at every layer: template authoring, code generation, and generated output.

### Template Security

#### Input Sanitization

All user inputs and configuration values must be sanitized before template interpolation:

```typescript
// ❌ DANGEROUS: Direct interpolation
const template = `const apiKey = "${config.apiKey}"`;

// ✅ SAFE: Sanitized interpolation
import { sanitize, escapeString } from '@scaffold/security';

const template = `const apiKey = "${escapeString(config.apiKey)}"`;
```

#### Template Injection Prevention

```typescript
// Template engine configuration
const templateConfig = {
  // Disable dynamic code evaluation
  allowEval: false,
  
  // Whitelist allowed helpers only
  allowedHelpers: ['if', 'each', 'unless', 'with', 'lookup'],
  
  // Escape HTML by default
  escapeHtml: true,
  
  // Maximum template depth (prevent recursion attacks)
  maxDepth: 10,
  
  // Maximum output size
  maxOutputSize: 10 * 1024 * 1024, // 10MB
};
```

#### Trusted Template Sources

```typescript
// Only load templates from trusted sources
const trustedSources = [
  // Built-in templates
  path.join(__dirname, 'templates'),
  
  // Verified plugin templates
  ...verifiedPluginPaths,
];

function loadTemplate(templatePath: string) {
  const resolved = path.resolve(templatePath);
  
  if (!trustedSources.some(src => resolved.startsWith(src))) {
    throw new SecurityError(
      `Template path outside trusted sources: ${templatePath}`
    );
  }
  
  return fs.readFileSync(resolved, 'utf-8');
}
```

### Generated Code Security

#### Secrets Handling

**NEVER generate hardcoded secrets.** Always use environment variables:

```typescript
// ❌ DANGEROUS: Hardcoded secrets
export default {
  secret: 'sk_live_1234567890',
  apiKey: 'AIzaSyB...',
};

// ✅ SAFE: Environment variable references
export default {
  secret: process.env.SESSION_SECRET,
  apiKey: process.env.API_KEY,
};
```

#### Generated Secret Placeholders

When generating config files, use clear placeholder patterns:

```typescript
// Generated .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
SESSION_SECRET=<GENERATE-32-CHAR-SECRET>
API_KEY=<GET-FROM-PROVIDER>

// Generated instructions
console.log(`
⚠️  SECURITY REMINDER:
1. Generate a secure SESSION_SECRET:
   openssl rand -base64 32

2. Never commit .env files with real secrets

3. Use environment-specific secrets in CI/CD
`);
```

#### SQL Injection Prevention

When generating database queries or migrations:

```typescript
// ❌ DANGEROUS: String concatenation
const query = `SELECT * FROM ${tableName} WHERE id = ${id}`;

// ✅ SAFE: Parameterized queries
const query = sql`SELECT * FROM ${sql.identifier(tableName)} WHERE id = ${id}`;
```

#### Generated Validator Functions

Always generate proper input validation:

```typescript
// Generated API endpoint
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']),
});

export async function createUser(input: unknown) {
  // Always validate
  const validated = createUserSchema.parse(input);
  
  // Safe to use
  return db.users.create(validated);
}
```

### Authentication & Authorization Patterns

When generating auth-related code:

```typescript
// Generated auth configuration (Better Auth example)
export const authConfig = {
  // Use secure session settings
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
    // Secure cookie settings (generated based on environment)
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
    },
  },
  
  // Rate limiting (prevent brute force)
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 10, // 10 attempts per window
  },
};
```

### Path Traversal Prevention

When generating file paths:

```typescript
import { resolve, relative, normalize } from 'path';

function safeFilePath(basePath: string, userInput: string): string {
  const normalized = normalize(userInput);
  
  // Prevent path traversal
  if (normalized.includes('..')) {
    throw new SecurityError('Path traversal attempt detected');
  }
  
  const fullPath = resolve(basePath, normalized);
  
  // Ensure result is within base path
  const relativePath = relative(basePath, fullPath);
  if (relativePath.startsWith('..')) {
    throw new SecurityError('Path outside allowed directory');
  }
  
  return fullPath;
}
```

### Dependency Security

#### Generated package.json Security

```typescript
// Generator ensures secure defaults
const packageJsonDefaults = {
  // Lock file generation
  engines: {
    node: '>=18.0.0',
    bun: '>=1.0.0',
  },
  
  // Security scripts
  scripts: {
    'security:audit': 'bun audit',
    'security:check': 'bunx @snyk/cli test',
  },
};
```

#### Dependency Version Pinning

```typescript
// Generate exact versions for security-critical deps
const securityCriticalDeps = [
  'better-auth',
  'drizzle-orm',
  'zod',
  '@auth/core',
];

function generateDependencies(deps: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(deps).map(([name, version]) => {
      // Pin security-critical dependencies
      if (securityCriticalDeps.includes(name)) {
        return [name, version.replace('^', '')];
      }
      return [name, version];
    })
  );
}
```

### Secure Defaults

The scaffold system generates with secure defaults:

| Category | Secure Default | Why |
|----------|----------------|-----|
| CORS | Explicit origins only | Prevent unauthorized access |
| Cookies | `httpOnly`, `secure`, `sameSite` | XSS/CSRF protection |
| Headers | Security headers enabled | OWASP compliance |
| Rate Limiting | Enabled by default | DoS protection |
| Input Validation | Required on all endpoints | Injection prevention |
| Error Messages | Generic in production | Information leakage prevention |
| Logging | No sensitive data | Credential exposure prevention |

### Security Checklist for Plugin Authors

```markdown
## Plugin Security Checklist

### Template Security
- [ ] All user inputs are sanitized
- [ ] No dynamic code evaluation (`eval`, `new Function`)
- [ ] HTML is escaped by default
- [ ] Template paths are validated

### Generated Code Security
- [ ] No hardcoded secrets
- [ ] Environment variables for all sensitive config
- [ ] Parameterized database queries
- [ ] Input validation on all public functions
- [ ] Proper error handling (no stack traces in production)

### Dependency Security
- [ ] Minimal dependencies
- [ ] No known vulnerabilities (run `bun audit`)
- [ ] Security-critical deps are version-pinned
- [ ] Dependencies are from trusted sources

### Authentication/Authorization
- [ ] Secure session configuration
- [ ] Rate limiting enabled
- [ ] Proper CORS configuration
- [ ] CSRF protection where applicable

### Documentation
- [ ] Security considerations documented
- [ ] Required secrets listed
- [ ] Environment setup instructions
```

### Error Code Reference (Security-Related)

| Code | Error | Resolution |
|------|-------|------------|
| `SEC001` | Template injection detected | Sanitize input before interpolation |
| `SEC002` | Path traversal attempt | Use `safeFilePath()` helper |
| `SEC003` | Untrusted template source | Only use verified plugin templates |
| `SEC004` | Hardcoded secret detected | Move to environment variable |
| `SEC005` | Insecure dependency version | Update to patched version |
| `SEC006` | Missing input validation | Add Zod schema validation |
| `SEC007` | Unsafe SQL construction | Use parameterized queries |
| `SEC008` | Missing rate limiting | Enable rate limiting middleware |

---

## Migration Guide

### Migrating Existing Projects

#### Step 1: Analyze Current Structure

```bash
# Install scaffold globally
bun add -g @repo/scaffold

# Analyze existing project
scaffold analyze ./my-existing-project
```

Output:
```
Detected Structure:
  - Package Manager: bun
  - Monorepo: yes (Turborepo)
  - Apps:
    - apps/api (NestJS-like structure)
    - apps/web (Next.js 14)
  - Packages:
    - packages/ui (React components)
    - packages/types (TypeScript types)

Recommended Plugins:
  - api: drizzle (database files detected), better-auth (auth files detected)
  - web: react-query, shadcn-ui (ui components detected)

Migration Complexity: MEDIUM
  - 15 files would need manual adjustment
  - 3 potential conflicts detected
```

#### Step 2: Generate Migration Config

```bash
scaffold migrate init ./my-existing-project
```

Creates `scaffold.migrate.ts`:

```typescript
export default {
  // Files to preserve (won't be overwritten)
  preserve: [
    'apps/api/src/custom/**',
    'apps/web/src/features/**',
  ],
  
  // Files to merge (combine existing + generated)
  merge: [
    'apps/api/src/app.module.ts',
    'package.json',
    'tsconfig.json',
  ],
  
  // Files to replace (overwrite with generated)
  replace: [
    'apps/api/src/main.ts',
    '.eslintrc.js',
  ],
  
  // Custom transformations
  transforms: [
    {
      file: 'apps/api/src/app.module.ts',
      transform: (content) => {
        // Custom migration logic
        return content.replace('OldModule', 'NewModule');
      },
    },
  ],
};
```

#### Step 3: Run Migration

```bash
# Dry run first
scaffold migrate --dry-run

# Execute migration
scaffold migrate

# With backup
scaffold migrate --backup ./backup-$(date +%Y%m%d)
```

### Version Upgrade Guide

#### From v0.x to v1.0

**Breaking Changes**:
1. Config file renamed from `scaffold.json` to `scaffold.config.ts`
2. Plugin configs moved from top-level to `apps[].config`
3. New `bridges` array replaces `connections`

**Migration Script**:
```bash
scaffold upgrade --from 0.x --to 1.0
```

**Manual Changes**:

```typescript
// Before (v0.x)
{
  "apps": ["api", "web"],
  "plugins": {
    "api": ["drizzle", "better-auth"],
    "web": ["shadcn-ui"]
  },
  "connections": [
    { "from": "api", "to": "web", "type": "orpc" }
  ]
}

// After (v1.0)
export default defineConfig({
  apps: [
    {
      name: 'api',
      type: 'nestjs',
      plugins: ['drizzle', 'better-auth'],
    },
    {
      name: 'web',
      type: 'nextjs',
      plugins: ['shadcn-ui'],
    },
  ],
  bridges: [
    { type: 'orpc', source: 'api', target: 'web' },
  ],
});
```

#### Checking for Updates

```bash
# Check current version
scaffold --version

# Check for updates
scaffold check-updates

# Upgrade scaffold itself
bun update @repo/scaffold
```

---

## Current Implementations

> **Note**: This section documents what currently exists in the monorepo. The scaffold system aims to automate the creation and maintenance of these patterns.

### Existing Apps in Monorepo

| App | Path | Type | Description | Key Features |
|-----|------|------|-------------|--------------|
| **api** | `apps/api` | NestJS | Backend API server | ORPC, Better Auth, Drizzle ORM, PostgreSQL |
| **web** | `apps/web` | Next.js | Frontend web application | App Router, React 19, Declarative Routing, TailwindCSS |
| **doc** | `apps/doc` | Fumadocs | Documentation site | MDX, Next.js based, Full-text search |
| **builder-ui** | `apps/builder-ui` | Vite + React | UI builder tool | Component playground, Storybook-like |

#### App Configuration References

**api (NestJS)**
```typescript
// Current structure in apps/api
apps/api/
├── src/
│   ├── app.module.ts       // Root module
│   ├── auth.ts             // Better Auth config
│   ├── db/                 // Drizzle database
│   │   ├── drizzle/
│   │   │   └── schema/     // Database schemas
│   │   └── migrations/
│   ├── modules/            // Feature modules
│   └── orpc/               // ORPC contracts
├── drizzle.config.ts       // Drizzle configuration
├── nest-cli.json           // NestJS CLI config
└── package.json
```

**web (Next.js)**
```typescript
// Current structure in apps/web
apps/web/
├── src/
│   ├── app/                // App Router pages
│   ├── components/         // React components
│   ├── hooks/              // Custom hooks (ORPC client hooks)
│   ├── lib/                // Utilities
│   ├── routes/             // Declarative routing
│   └── state/              // Zustand stores
├── declarative-routing.config.json
├── next.config.ts
├── tailwind.config.mts
└── package.json
```

**doc (Fumadocs)**
```typescript
// Current structure in apps/doc
apps/doc/
├── content/                // MDX documentation
│   └── docs/
├── src/
│   └── app/               // Next.js App Router
├── source.config.ts       // Fumadocs config
└── package.json
```

### Existing Packages in Monorepo

#### Configuration Packages (`packages/configs/`)

| Package | Path | Purpose | Used By |
|---------|------|---------|---------|
| **eslint** | `packages/configs/eslint` | Shared ESLint configuration | All apps |
| **prettier** | `packages/configs/prettier` | Shared Prettier configuration | All apps |
| **tailwind** | `packages/configs/tailwind` | Shared Tailwind configuration | web, doc |
| **typescript** | `packages/configs/typescript` | Base TSConfig files | All apps |
| **vitest** | `packages/configs/vitest` | Shared Vitest configuration | All apps |

#### Shared Packages

| Package | Path | Purpose | Key Exports |
|---------|------|---------|-------------|
| **api-contracts** | `packages/contracts/api` | ORPC contract definitions | Procedures, schemas, types |
| **types** | `packages/types` | Shared TypeScript types | Common interfaces, utilities |
| **ui-base** | `packages/ui/base` | Base UI components | Shadcn components, primitives |
| **auth** | `packages/utils/auth` | Auth utilities | Session helpers, middleware |
| **env** | `packages/utils/env` | Environment utilities | Type-safe env access |

#### Package Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPS LAYER                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │   api   │  │   web   │  │   doc   │  │   builder-ui    │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘    │
└───────┼────────────┼────────────┼────────────────┼──────────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PACKAGES LAYER                              │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ contracts/api    │←─│      web         │                     │
│  └──────────────────┘  └────────┬─────────┘                     │
│                                 │                                │
│  ┌──────────────────┐  ┌───────┴─────────┐  ┌────────────────┐  │
│  │   types          │←─│   ui/base       │←─│  doc, builder  │  │
│  └──────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────┐                      │
│  │   utils/auth     │←─│   api, web      │                      │
│  └──────────────────┘  └─────────────────┘                      │
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────┐                      │
│  │   utils/env      │←─│   all apps      │                      │
│  └──────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONFIGS LAYER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │  eslint  │ │ prettier │ │ tailwind │ │typescript│ │ vitest ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Status Matrix

| Feature | api | web | doc | builder-ui | Package Support |
|---------|-----|-----|-----|------------|-----------------|
| **TypeScript** | ✅ | ✅ | ✅ | ✅ | `configs/typescript` |
| **ESLint** | ✅ | ✅ | ✅ | ✅ | `configs/eslint` |
| **Prettier** | ✅ | ✅ | ✅ | ✅ | `configs/prettier` |
| **Vitest** | ✅ | ✅ | ❌ | ❌ | `configs/vitest` |
| **TailwindCSS** | ❌ | ✅ | ✅ | ✅ | `configs/tailwind` |
| **Database (Drizzle)** | ✅ | ❌ | ❌ | ❌ | N/A |
| **Auth (Better Auth)** | ✅ | ✅ (client) | ❌ | ❌ | `utils/auth` |
| **ORPC** | ✅ (server) | ✅ (client) | ❌ | ❌ | `contracts/api` |
| **UI Components** | ❌ | ✅ | ✅ | ✅ | `ui/base` |
| **Environment** | ✅ | ✅ | ✅ | ✅ | `utils/env` |

### How Scaffold Would Generate This

The scaffold system would automate creation of this exact structure:

```typescript
// scaffold.config.ts that generates the current monorepo
export default defineConfig({
  project: {
    name: 'nextjs-nestjs-turborepo-template',
    packageManager: 'bun',
  },
  
  apps: [
    {
      name: 'api',
      type: 'nestjs',
      path: 'apps/api',
      plugins: ['drizzle', 'better-auth', 'orpc'],
    },
    {
      name: 'web',
      type: 'nextjs',
      path: 'apps/web',
      plugins: ['better-auth-client', 'orpc-client', 'shadcn-ui', 'zustand'],
    },
    {
      name: 'doc',
      type: 'fumadocs',
      path: 'apps/doc',
      plugins: ['mdx'],
    },
    {
      name: 'builder-ui',
      type: 'vite-react',
      path: 'apps/builder-ui',
      plugins: ['shadcn-ui'],
    },
  ],
  
  packages: [
    { name: 'api-contracts', path: 'packages/contracts/api' },
    { name: 'types', path: 'packages/types' },
    { name: 'ui-base', path: 'packages/ui/base' },
    { name: 'auth', path: 'packages/utils/auth' },
    { name: 'env', path: 'packages/utils/env' },
  ],
  
  configs: ['eslint', 'prettier', 'tailwind', 'typescript', 'vitest'],
  
  connections: [
    { from: 'api', to: 'web', via: 'orpc' },
    { from: 'api', to: 'web', via: 'auth' },
  ],
});
```

---

## Future Roadmap

> **Note**: This section describes planned features and extensions. Items marked as ideas are proposals that could be implemented.

### Planned App Types

| App Type | Status | Description | Target Use Case |
|----------|--------|-------------|-----------------|
| `nestjs` | ✅ Implemented | NestJS API server | Backend APIs |
| `nextjs` | ✅ Implemented | Next.js frontend | Web applications |
| `fumadocs` | ✅ Implemented | Documentation site | Project docs |
| `vite-react` | ✅ Implemented | Vite + React app | SPA, tools |
| `express` | 🔮 Planned | Express.js server | Microservices, simple APIs |
| `fastify` | 🔮 Planned | Fastify server | High-performance APIs |
| `hono` | 💡 Idea | Hono server | Edge-compatible APIs |
| `remix` | 💡 Idea | Remix app | Full-stack React |
| `astro` | 💡 Idea | Astro site | Content-focused sites |
| `electron` | 💡 Idea | Electron app | Desktop applications |
| `react-native` | 💡 Idea | React Native app | Mobile applications |

### Planned Plugins

#### Database Plugins

| Plugin | Status | Framework Support | Description |
|--------|--------|-------------------|-------------|
| `drizzle` | ✅ Implemented | NestJS | Drizzle ORM integration |
| `prisma` | 🔮 Planned | NestJS, Next.js | Prisma ORM integration |
| `kysely` | 💡 Idea | All | Kysely query builder |
| `typeorm` | 💡 Idea | NestJS | TypeORM integration |

#### Authentication Plugins

| Plugin | Status | Framework Support | Description |
|--------|--------|-------------------|-------------|
| `better-auth` | ✅ Implemented | NestJS, Next.js | Better Auth integration |
| `lucia` | 💡 Idea | All | Lucia auth integration |
| `clerk` | 💡 Idea | Next.js | Clerk integration |
| `auth0` | 💡 Idea | All | Auth0 integration |

#### API Plugins

| Plugin | Status | Framework Support | Description |
|--------|--------|-------------------|-------------|
| `orpc` | ✅ Implemented | NestJS, Next.js | ORPC type-safe RPC |
| `trpc` | 🔮 Planned | All | tRPC integration |
| `graphql` | 💡 Idea | NestJS | GraphQL API |
| `rest-swagger` | 💡 Idea | NestJS | OpenAPI docs |

#### UI Plugins

| Plugin | Status | Framework Support | Description |
|--------|--------|-------------------|-------------|
| `shadcn-ui` | ✅ Implemented | Next.js | Shadcn/UI components |
| `radix-ui` | 💡 Idea | Next.js | Radix primitives only |
| `chakra-ui` | 💡 Idea | Next.js | Chakra UI components |
| `mantine` | 💡 Idea | Next.js | Mantine components |

#### State Management Plugins

| Plugin | Status | Framework Support | Description |
|--------|--------|-------------------|-------------|
| `zustand` | ✅ Implemented | Next.js | Zustand state |
| `jotai` | 💡 Idea | Next.js | Jotai atoms |
| `redux-toolkit` | 💡 Idea | Next.js | RTK integration |

#### Infrastructure Plugins

| Plugin | Status | Framework Support | Description |
|--------|--------|-------------------|-------------|
| `redis` | 🔮 Planned | NestJS | Redis caching |
| `bullmq` | 🔮 Planned | NestJS | Job queue |
| `s3-storage` | 💡 Idea | All | S3 file storage |
| `stripe` | 💡 Idea | NestJS, Next.js | Stripe payments |
| `resend` | 💡 Idea | All | Email with Resend |

### Extension Ideas

#### 1. Visual Scaffold Builder
```typescript
// Idea: Web-based config builder
// Would generate scaffold.config.ts through drag-and-drop

interface VisualBuilderFeature {
  name: 'visual-builder';
  description: 'GUI for creating scaffold configs';
  implementation: 'Could use builder-ui app as base';
  benefits: ['Lower barrier to entry', 'Visual dependency graph', 'Real-time preview'];
}
```

#### 2. AI-Powered Configuration
```typescript
// Idea: Describe project, get config
scaffold ai "I need a SaaS with auth, payments, and a blog"

// Would generate appropriate scaffold.config.ts
```

#### 3. Migration Assistant
```typescript
// Idea: Migrate from other frameworks
scaffold migrate from-create-react-app ./my-cra-app
scaffold migrate from-create-next-app ./my-next-app
```

#### 4. Plugin Marketplace
```typescript
// Idea: Community plugin registry
scaffold plugins search payments
scaffold plugins install @community/stripe-plugin
scaffold plugins publish ./my-plugin
```

#### 5. Project Analytics
```typescript
// Idea: Track project health metrics
scaffold analyze --full

// Output: dependency freshness, security vulnerabilities,
// code quality metrics, test coverage, etc.
```

#### 6. Incremental Scaffolding
```typescript
// Idea: Add features to existing apps without full scaffold
scaffold enhance api add-crud users
scaffold enhance web add-page dashboard
scaffold enhance api add-endpoint /api/webhooks
```

### Contribution Guidelines

Want to contribute to the scaffold system? Here's how:

1. **New App Type**: Create generator in `generators/apps/`, add to app type registry
2. **New Plugin**: Follow three-tier architecture (package → framework → aggregator)
3. **New Template**: Add to appropriate generator's template directory
4. **Bug Fix**: Check error codes, add regression test
5. **Documentation**: Update this ARCHITECTURE.md file

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## Real-World Examples

### SaaS Starter Example

Complete configuration for a SaaS application:

```typescript
// scaffold.config.ts
import { defineConfig } from '@repo/scaffold';

export default defineConfig({
  project: {
    name: 'my-saas',
    description: 'A modern SaaS application',
    version: '1.0.0',
  },
  
  packageManager: 'bun',
  
  apps: [
    // API Server
    {
      name: 'api',
      type: 'nestjs',
      path: 'apps/api',
      plugins: [
        'drizzle',
        'better-auth',
        'orpc',
        'redis',
        'job-queue',
      ],
      config: {
        drizzle: {
          provider: 'postgresql',
          features: {
            timestamps: true,
            softDelete: true,
          },
        },
        betterAuth: {
          providers: ['google', 'github', 'email'],
          features: {
            admin: true,
            twoFactor: true,
          },
        },
        orpc: {
          openapi: { enabled: true },
        },
        jobQueue: {
          queues: [
            { name: 'emails', concurrency: 5 },
            { name: 'exports', concurrency: 2 },
          ],
        },
      },
    },
    
    // Web Application
    {
      name: 'web',
      type: 'nextjs',
      path: 'apps/web',
      plugins: [
        'react-query',
        'zustand',
        'shadcn-ui',
        'next-themes',
      ],
      config: {
        shadcnUi: {
          theme: { base: 'zinc' },
          components: [
            'button', 'card', 'dialog', 'dropdown-menu',
            'input', 'label', 'toast', 'tabs', 'table',
            'avatar', 'badge', 'skeleton',
          ],
        },
        reactQuery: {
          devtools: { enabled: true },
        },
      },
    },
    
    // Documentation
    {
      name: 'docs',
      type: 'fumadocs',
      path: 'apps/docs',
      plugins: [],
    },
  ],
  
  // Cross-app connections
  bridges: [
    { type: 'orpc', source: 'api', target: 'web' },
    { type: 'orpc-better-auth', source: 'api', target: 'web' },
  ],
  
  // Shared packages
  packages: [
    { name: 'contracts', path: 'packages/contracts/api' },
    { name: 'ui', path: 'packages/ui' },
    { name: 'types', path: 'packages/types' },
  ],
  
  // Global plugins (monorepo root)
  plugins: [
    'turborepo',
    'typescript',
    'eslint',
    'prettier',
    'vitest',
    'docker-compose',
    'ci-cd',
  ],
  
  // Infrastructure
  infrastructure: {
    docker: true,
    dockerCompose: true,
    githubActions: true,
    database: 'postgresql',
    cache: 'redis',
  },
});
```

**Generated Structure**:
```
my-saas/
├── apps/
│   ├── api/                      # NestJS API
│   │   ├── src/
│   │   │   ├── auth/             # Better Auth module
│   │   │   ├── db/               # Drizzle ORM
│   │   │   ├── orpc/             # oRPC router
│   │   │   ├── jobs/             # BullMQ jobs
│   │   │   └── ...
│   │   └── package.json
│   ├── web/                      # Next.js App
│   │   ├── src/
│   │   │   ├── app/              # App Router
│   │   │   ├── components/       # Shadcn UI
│   │   │   ├── lib/              # API client, auth
│   │   │   └── ...
│   │   └── package.json
│   └── docs/                     # Fumadocs
│       └── ...
├── packages/
│   ├── contracts/api/            # oRPC contracts
│   ├── ui/                       # Shared UI
│   └── types/                    # Shared types
├── docker-compose.yml
├── .github/workflows/            # CI/CD
├── turbo.json
└── package.json
```

### E-Commerce Monorepo Example

Configuration for an e-commerce platform:

```typescript
// scaffold.config.ts
import { defineConfig } from '@repo/scaffold';

export default defineConfig({
  project: {
    name: 'my-store',
    description: 'E-commerce platform',
  },
  
  apps: [
    // Main API
    {
      name: 'api',
      type: 'nestjs',
      plugins: ['drizzle', 'better-auth', 'orpc', 'redis', 'stripe'],
      config: {
        drizzle: { provider: 'postgresql' },
        stripe: {
          webhooks: true,
          products: true,
          subscriptions: false,
        },
      },
    },
    
    // Customer storefront
    {
      name: 'storefront',
      type: 'nextjs',
      plugins: ['react-query', 'shadcn-ui', 'next-intl'],
      config: {
        nextIntl: {
          locales: ['en', 'es', 'fr'],
          defaultLocale: 'en',
        },
      },
    },
    
    // Admin dashboard
    {
      name: 'admin',
      type: 'nextjs',
      plugins: ['react-query', 'shadcn-ui', 'react-table'],
    },
  ],
  
  bridges: [
    { type: 'orpc', source: 'api', target: 'storefront' },
    { type: 'orpc', source: 'api', target: 'admin' },
    { type: 'orpc-better-auth', source: 'api', target: 'storefront' },
    { type: 'orpc-better-auth', source: 'api', target: 'admin' },
  ],
  
  packages: [
    { name: 'contracts', path: 'packages/contracts/api' },
    { name: 'ui', path: 'packages/ui' },
  ],
  
  plugins: ['turborepo', 'typescript', 'eslint', 'docker-compose'],
});
```

### API-Only Microservice Example

Minimal configuration for an API-only service:

```typescript
// scaffold.config.ts
import { defineConfig } from '@repo/scaffold';

export default defineConfig({
  project: {
    name: 'user-service',
    description: 'User management microservice',
  },
  
  apps: [
    {
      name: 'api',
      type: 'nestjs',
      path: 'src',  // Flat structure, no apps/ directory
      plugins: ['drizzle', 'orpc', 'api-key-auth'],
      config: {
        drizzle: {
          provider: 'postgresql',
          features: {
            timestamps: true,
            audit: true,
          },
        },
        apiKeyAuth: {
          scopes: ['read:users', 'write:users', 'admin'],
          rateLimit: {
            requestsPerMinute: 100,
          },
        },
      },
    },
  ],
  
  plugins: ['typescript', 'eslint', 'vitest', 'docker-compose'],
  
  infrastructure: {
    docker: true,
    database: 'postgresql',
  },
});
```

**Generated Structure**:
```
user-service/
├── src/
│   ├── auth/              # API key authentication
│   ├── db/                # Drizzle ORM
│   ├── orpc/              # oRPC endpoints
│   ├── users/             # User module
│   ├── app.module.ts
│   └── main.ts
├── drizzle/               # Migrations
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## Summary

This architecture enables:

1. **Extreme Configurability**: Everything is optional and configurable
2. **Multi-App Support**: Multiple apps of different types in one monorepo
3. **Per-App Plugins**: Each app has its own plugin set
4. **Plugin Validation**: Plugins validate compatibility with app types
5. **Cross-App Bridges**: Type-safe connections between apps
6. **AST Transforms**: Intelligent code modification without conflicts
7. **Global Context**: Cross-generator communication without coupling
8. **Heavy Configuration**: TypeScript config with Zod validation

The result is a **professional-grade scaffold system** capable of generating complex, production-ready monorepos with complete type safety and optimal developer experience.
```

