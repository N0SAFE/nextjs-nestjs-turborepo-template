# Module Registry Structure

## Overview

The module registry serves as the central catalog of all available modules in the modular monorepo ecosystem. It provides module discovery, dependency management, and compatibility checking.

## Registry Schema

### Module Definition Structure

```typescript
interface ModuleDefinition {
  // Basic Information
  name: string;                    // @modular/nextjs
  version: string;                 // 1.2.3
  category: ModuleCategory;        // framework | feature | integration
  type: ModuleType;               // webapp | api | package | config
  
  // Description
  displayName: string;            // "Next.js Framework"
  description: string;            // Short description
  longDescription?: string;       // Detailed description
  tags: string[];                // ["react", "ssr", "frontend"]
  
  // Compatibility
  requires: ModuleDependency[];   // Required modules
  conflicts: string[];           // Incompatible modules
  supports: string[];           // Optional enhancements
  
  // Technical Details
  files: ModuleFiles;            // Files to copy/generate
  configuration: ModuleConfig;   // Configuration updates
  scripts: ModuleScripts;       // Scripts to add/run
  
  // Metadata
  author: string;
  license: string;
  repository: string;
  homepage?: string;
  documentation?: string;
  
  // Lifecycle
  installHooks: InstallHook[];
  uninstallHooks: UninstallHook[];
  updateHooks: UpdateHook[];
}
```

## Module Categories

### 1. Foundation Modules
Core infrastructure that other modules depend on:

```yaml
@modular/foundation:
  category: foundation
  type: config
  description: "Base turborepo setup with workspace configuration"
  provides: ["workspace", "turborepo", "package-manager"]
  
@modular/typescript:
  category: foundation  
  type: config
  description: "TypeScript configuration and build setup"
  requires: ["@modular/foundation"]
  provides: ["typescript", "type-checking"]
  
@modular/eslint:
  category: foundation
  type: config
  description: "ESLint configuration with recommended rules"
  requires: ["@modular/foundation"]
  provides: ["linting", "code-quality"]
```

### 2. Framework Modules
Primary application frameworks:

```yaml
@modular/nextjs:
  category: framework
  type: webapp
  description: "Next.js React framework with routing and SSR"
  requires: ["@modular/foundation", "@modular/typescript"]
  provides: ["react", "ssr", "routing", "frontend"]
  conflicts: ["@modular/nuxtjs", "@modular/angular"]
  
@modular/nuxtjs:
  category: framework
  type: webapp
  description: "Nuxt.js Vue framework with universal apps"
  requires: ["@modular/foundation", "@modular/typescript"]
  provides: ["vue", "ssr", "routing", "frontend"]
  conflicts: ["@modular/nextjs", "@modular/angular"]

@modular/directus:
  category: framework
  type: api
  description: "Directus headless CMS and API backend"
  requires: ["@modular/foundation"]
  provides: ["cms", "api", "database", "admin-panel"]
  conflicts: ["@modular/nestjs", "@modular/adonisjs"]
```

### 3. Feature Modules
Specific functionality additions:

```yaml
@modular/auth-nextauth:
  category: feature
  type: package
  description: "NextAuth.js authentication for Next.js"
  requires: ["@modular/nextjs"]
  provides: ["authentication", "oauth", "session-management"]
  
@modular/auth-nuxt:
  category: feature
  type: package
  description: "Nuxt Auth module for authentication"
  requires: ["@modular/nuxtjs"]
  provides: ["authentication", "oauth", "session-management"]
  
@modular/ui-shadcn:
  category: feature
  type: package
  description: "Shadcn/ui component library for React"
  requires: ["@modular/nextjs"]
  supports: ["@modular/tailwind"]
  provides: ["ui-components", "design-system"]
```

### 4. Integration Modules
Cross-cutting concerns and tooling:

```yaml
@modular/docker:
  category: integration
  type: config
  description: "Docker containerization setup"
  provides: ["containerization", "deployment"]
  
@modular/github-actions:
  category: integration
  type: config
  description: "GitHub Actions CI/CD workflows"
  provides: ["ci-cd", "automation"]
  
@modular/testing-vitest:
  category: integration
  type: config
  description: "Vitest testing framework setup"
  requires: ["@modular/foundation"]
  provides: ["testing", "unit-tests"]
```

## Registry API Structure

### Module Search and Discovery

```typescript
interface ModuleSearchQuery {
  category?: ModuleCategory;
  type?: ModuleType;
  tags?: string[];
  provides?: string[];
  compatibleWith?: string[];
  query?: string;
}

interface ModuleSearchResult {
  modules: ModuleDefinition[];
  total: number;
  facets: {
    categories: { [key: string]: number };
    types: { [key: string]: number };
    tags: { [key: string]: number };
  };
}
```

### Compatibility Checking

```typescript
interface CompatibilityCheck {
  isCompatible: boolean;
  conflicts: ConflictInfo[];
  missingDependencies: string[];
  suggestions: string[];
  warnings: WarningInfo[];
}

interface ConflictInfo {
  module: string;
  conflictsWith: string;
  reason: string;
  resolution?: string;
}
```

## Module Installation Manifest

Each installed module creates a manifest entry:

```json
{
  "installedModules": {
    "@modular/foundation": {
      "version": "1.0.0",
      "installedAt": "2024-01-15T10:30:00Z",
      "files": ["turbo.json", "package.json"],
      "configuration": ["workspace.json"],
      "dependencies": []
    },
    "@modular/nextjs": {
      "version": "2.1.0", 
      "installedAt": "2024-01-15T11:00:00Z",
      "files": ["apps/web/*"],
      "configuration": ["turbo.json", "tsconfig.json"],
      "dependencies": ["@modular/foundation", "@modular/typescript"]
    }
  }
}
```

## Registry Implementation

### File Structure
```
registry/
├── modules/
│   ├── foundation/
│   │   ├── foundation.yml
│   │   ├── typescript.yml
│   │   └── eslint.yml
│   ├── frameworks/
│   │   ├── nextjs.yml
│   │   ├── nuxtjs.yml
│   │   └── directus.yml
│   ├── features/
│   │   ├── auth-nextauth.yml
│   │   ├── ui-shadcn.yml
│   │   └── database-prisma.yml
│   └── integrations/
│       ├── docker.yml
│       ├── github-actions.yml
│       └── testing-vitest.yml
├── templates/
│   ├── nextjs/
│   ├── nuxtjs/
│   └── directus/
├── compatibility-rules.yml
└── registry-schema.json
```

### CLI Commands

```bash
# Search modules
modular search "authentication"
modular search --category=framework --type=webapp

# Show module details  
modular info @modular/nextjs

# Check compatibility
modular check @modular/auth-nextauth @modular/nuxtjs

# Install modules
modular install @modular/nextjs
modular install @modular/nextjs @modular/auth-nextauth @modular/ui-shadcn

# List installed modules
modular list
modular list --outdated

# Update modules
modular update @modular/nextjs
modular update --all
```

This registry structure provides a comprehensive system for module discovery, compatibility checking, and installation management while maintaining flexibility for future growth and community contributions.