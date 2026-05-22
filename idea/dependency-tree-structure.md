# Dependency Tree Structure

## Overview

The dependency tree structure defines the hierarchical relationships between modules, ensuring proper installation order, preventing circular dependencies, and maintaining system integrity. This structure enables automatic dependency resolution and conflict prevention.

## Tree Hierarchy Levels

### Level 0: Foundation
Core infrastructure modules that everything depends on.

```
@modular/foundation (Root)
├── package.json workspace configuration
├── turbo.json build orchestration
├── .gitignore version control
└── modular.config.json module system config
```

### Level 1: Development Tools
Essential development and build tools.

```
@modular/foundation
├── @modular/typescript ✅
│   ├── tsconfig.json base configuration
│   ├── packages/tsconfig/ shared configs
│   └── type checking setup
├── @modular/eslint ✅
│   ├── eslint.config.js rules
│   ├── packages/eslint-config/ shared config
│   └── linting pipeline
└── @modular/prettier ✅
    ├── .prettierrc formatting rules
    ├── packages/prettier-config/ shared config
    └── code formatting
```

### Level 2: Framework Layer
Primary application frameworks (mutually exclusive).

```
Foundation + Dev Tools
├── @modular/nextjs ⚡ (Conflicts: nuxtjs, angular)
│   ├── apps/web/ Next.js application
│   ├── next.config.js configuration
│   └── App Router setup
├── @modular/nuxtjs ⚡ (Conflicts: nextjs, angular)
│   ├── apps/web/ Nuxt.js application
│   ├── nuxt.config.ts configuration
│   └── Vue 3 + SSR setup
├── @modular/angular ⚡ (Conflicts: nextjs, nuxtjs)
│   ├── apps/web/ Angular application
│   ├── angular.json workspace
│   └── CLI tooling
└── @modular/directus ⚡ (Conflicts: nestjs, adonisjs)
    ├── apps/api/ Directus backend
    ├── docker-compose.yml
    └── CMS setup
```

### Level 3: Feature Packages
Framework-specific features and enhancements.

```
Framework Layer
├── Next.js Branch
│   ├── @modular/auth-nextauth ✅ (Requires: nextjs)
│   ├── @modular/ui-shadcn ✅ (Requires: nextjs + tailwind)
│   └── @modular/next-seo ✅ (Requires: nextjs)
├── Nuxt.js Branch  
│   ├── @modular/auth-nuxt ✅ (Requires: nuxtjs)
│   ├── @modular/ui-vuetify ✅ (Requires: nuxtjs + vue)
│   └── @modular/nuxt-content ✅ (Requires: nuxtjs)
├── Angular Branch
│   ├── @modular/auth-angular ✅ (Requires: angular)
│   ├── @modular/ui-angular-material ✅ (Requires: angular)
│   └── @modular/angular-fire ✅ (Requires: angular)
└── Directus Branch
    ├── @modular/directus-sdk ✅ (Requires: directus)
    ├── @modular/directus-extensions ✅ (Requires: directus)
    └── @modular/directus-auth ✅ (Requires: directus)
```

### Level 4: Shared Utilities
Cross-cutting packages that can be used by multiple frameworks.

```
Any Framework
├── @modular/types ✅ (Universal)
├── @modular/utils ✅ (Universal)
├── @modular/validation ✅ (Universal)
├── @modular/tailwind ✅ (Frontend frameworks)
├── @modular/database-prisma ✅ (Backend frameworks)
└── @modular/testing-vitest ✅ (Universal)
```

## Dependency Resolution Rules

### Rule 1: Hierarchical Dependencies
Modules can only depend on modules at the same level or lower levels.

```yaml
valid_dependencies:
  level_3_module:
    can_depend_on: [level_0, level_1, level_2, level_3]
    cannot_depend_on: [level_4, level_5]
    
  level_1_module:
    can_depend_on: [level_0, level_1]
    cannot_depend_on: [level_2, level_3, level_4]
```

### Rule 2: Framework Exclusivity
Only one primary framework per category can be active.

```yaml
exclusivity_groups:
  web_frameworks:
    - "@modular/nextjs"
    - "@modular/nuxtjs" 
    - "@modular/angular"
    - "@modular/vite-react"
    - "@modular/vite-vue"
    
  api_frameworks:
    - "@modular/directus"
    - "@modular/nestjs"
    - "@modular/adonisjs"
    - "@modular/express"
    
  orm_systems:
    - "@modular/prisma"
    - "@modular/drizzle"
    - "@modular/typeorm"
```

### Rule 3: Compatibility Requirements
Some modules require specific combinations.

```yaml
compatibility_requirements:
  "@modular/auth-nextauth":
    requires_any: ["@modular/nextjs"]
    requires_all: ["@modular/foundation", "@modular/typescript"]
    
  "@modular/ui-shadcn":
    requires_any: ["@modular/nextjs", "@modular/vite-react"]
    requires_all: ["@modular/tailwind"]
    
  "@modular/directus-sdk":
    requires_any: ["@modular/directus"]
    compatible_with: ["@modular/nextjs", "@modular/nuxtjs"]
```

## Visual Dependency Tree

### Complete Dependency Graph

```mermaid
graph TD
    Foundation[@modular/foundation]
    
    %% Level 1: Dev Tools
    Foundation --> TypeScript[@modular/typescript]
    Foundation --> ESLint[@modular/eslint]
    Foundation --> Prettier[@modular/prettier]
    
    %% Level 2: Frameworks
    TypeScript --> NextJS[@modular/nextjs]
    TypeScript --> NuxtJS[@modular/nuxtjs]
    TypeScript --> Angular[@modular/angular]
    Foundation --> Directus[@modular/directus]
    
    %% Level 3: Framework-specific features
    NextJS --> AuthNext[@modular/auth-nextauth]
    NextJS --> UIShadcn[@modular/ui-shadcn]
    
    NuxtJS --> AuthNuxt[@modular/auth-nuxt]
    NuxtJS --> UIVuetify[@modular/ui-vuetify]
    
    Angular --> AuthAngular[@modular/auth-angular]
    Angular --> UIMaterial[@modular/ui-angular-material]
    
    Directus --> DirectusSDK[@modular/directus-sdk]
    
    %% Level 4: Shared utilities
    Foundation --> Types[@modular/types]
    Foundation --> Utils[@modular/utils]
    Foundation --> Tailwind[@modular/tailwind]
    
    %% Cross-dependencies
    UIShadcn --> Tailwind
    UIVuetify --> Tailwind
    AuthNext --> Types
    AuthNuxt --> Types
    
    %% Styling for conflicts
    classDef conflict fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef compatible fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef universal fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    
    class NextJS,NuxtJS,Angular conflict
    class AuthNext,AuthNuxt,AuthAngular compatible
    class Types,Utils,Foundation universal
```

### Framework-Specific Trees

#### Next.js Ecosystem Tree
```
@modular/foundation
├── @modular/typescript
├── @modular/eslint
└── @modular/nextjs
    ├── @modular/auth-nextauth
    │   └── @modular/types
    ├── @modular/ui-shadcn
    │   └── @modular/tailwind
    ├── @modular/next-seo
    └── @modular/testing-vitest
        └── @modular/test-utils
```

#### Nuxt.js Ecosystem Tree
```
@modular/foundation
├── @modular/typescript
├── @modular/eslint
└── @modular/nuxtjs
    ├── @modular/auth-nuxt
    │   └── @modular/types
    ├── @modular/ui-vuetify
    │   └── @modular/tailwind
    ├── @modular/nuxt-content
    └── @modular/testing-vitest
        └── @modular/test-utils
```

#### Full-Stack Tree (Next.js + Directus)
```
@modular/foundation
├── Development Tools
│   ├── @modular/typescript
│   ├── @modular/eslint
│   └── @modular/prettier
├── Frontend Stack
│   └── @modular/nextjs
│       ├── @modular/auth-nextauth
│       ├── @modular/ui-shadcn
│       └── @modular/directus-sdk
└── Backend Stack
    └── @modular/directus
        ├── @modular/postgres
        └── @modular/docker
```

## Dependency Resolution Algorithm

### Installation Order Calculation

```typescript
interface DependencyGraph {
  [module: string]: {
    dependencies: string[];
    level: number;
    conflicts: string[];
  };
}

function calculateInstallationOrder(modules: string[]): string[] {
  const graph = buildDependencyGraph(modules);
  const resolved: string[] = [];
  const visiting = new Set<string>();
  
  function visit(module: string) {
    if (visiting.has(module)) {
      throw new Error(`Circular dependency detected: ${module}`);
    }
    
    if (resolved.includes(module)) {
      return;
    }
    
    visiting.add(module);
    
    // Visit dependencies first
    graph[module].dependencies.forEach(dep => {
      visit(dep);
    });
    
    visiting.delete(module);
    resolved.push(module);
  }
  
  modules.forEach(module => visit(module));
  return resolved;
}
```

### Conflict Detection

```typescript
function detectConflicts(modules: string[]): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const exclusivityGroups = getExclusivityGroups();
  
  for (const group of exclusivityGroups) {
    const activeInGroup = modules.filter(m => group.includes(m));
    
    if (activeInGroup.length > 1) {
      conflicts.push({
        type: 'exclusivity',
        modules: activeInGroup,
        reason: 'Only one module per group allowed',
        resolution: 'Choose one module from the group'
      });
    }
  }
  
  return conflicts;
}
```

## CLI Integration

### Dependency Commands

```bash
# Show dependency tree for current project
modular tree

# Show what depends on a specific module
modular tree --dependents @modular/types

# Show dependencies of a specific module  
modular tree --dependencies @modular/nextjs

# Validate dependency graph
modular validate

# Show installation order for modules
modular plan @modular/nextjs @modular/auth-nextauth @modular/ui-shadcn
```

### Example CLI Output

```bash
$ modular tree

Project Dependency Tree:
@modular/foundation (v1.0.0)
├── @modular/typescript (v1.0.0) 
├── @modular/eslint (v1.0.0)
└── @modular/nextjs (v2.1.0)
    ├── @modular/auth-nextauth (v1.5.0)
    │   └── @modular/types (v1.0.0)
    └── @modular/ui-shadcn (v2.0.0)
        └── @modular/tailwind (v3.0.0)

$ modular plan @modular/auth-nextauth

Installation Plan:
1. @modular/foundation (already installed)
2. @modular/typescript (already installed) 
3. @modular/nextjs (already installed)
4. @modular/types (new installation)
5. @modular/auth-nextauth (new installation)

$ modular validate

✅ Dependency tree is valid
⚠️  Optimization suggestions:
   - @modular/types is used by multiple modules, consider upgrading to latest version
   - @modular/tailwind could be shared between UI modules
```

## Advanced Dependency Scenarios

### Micro-Frontend Architecture

```yaml
micro_frontend_setup:
  shell_app:
    modules: ["@modular/foundation", "@modular/module-federation"]
    
  app_1:
    modules: ["@modular/nextjs", "@modular/auth-nextauth"]
    exposes: ["./Auth"]
    
  app_2: 
    modules: ["@modular/nuxtjs", "@modular/ui-vuetify"]
    exposes: ["./Dashboard"]
    
  shared_packages:
    modules: ["@modular/types", "@modular/utils"]
    shared_by: ["app_1", "app_2"]
```

### Gradual Migration

```yaml
migration_scenario:
  current_state:
    - "@modular/foundation"
    - "@modular/express"
    - "@modular/jquery-ui"
    
  target_state:
    - "@modular/foundation" 
    - "@modular/nextjs"
    - "@modular/ui-shadcn"
    
  migration_steps:
    1: "Add @modular/nextjs alongside express"
    2: "Migrate routes one by one"
    3: "Add @modular/ui-shadcn"
    4: "Remove @modular/express when migration complete"
```

This dependency tree structure ensures that modules are installed in the correct order, conflicts are prevented, and the system maintains integrity as it grows and evolves.