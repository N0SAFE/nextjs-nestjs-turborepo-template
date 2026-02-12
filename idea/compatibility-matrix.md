# Module Compatibility Matrix

## Overview

The compatibility matrix defines which modules can work together, which conflict, and what dependencies are required. This prevents invalid combinations like using Next.js authentication modules with Nuxt.js applications.

## Compatibility Rules

### Framework Exclusivity Rules

Certain modules are mutually exclusive and cannot coexist:

#### Web Framework Conflicts
```yaml
web_framework_exclusivity:
  rule: "Only one web framework can be active"
  conflicts:
    - [@modular/nextjs, @modular/nuxtjs, @modular/angular, @modular/vite-react, @modular/vite-vue]
  reason: "Multiple frontend frameworks would conflict in routing and build processes"
```

#### API Framework Conflicts  
```yaml
api_framework_exclusivity:
  rule: "Only one primary API framework can be active"
  conflicts:
    - [@modular/directus, @modular/nestjs, @modular/adonisjs, @modular/express]
  reason: "Multiple API servers would conflict on ports and request handling"
```

#### Database ORM Conflicts
```yaml
orm_exclusivity:
  rule: "Only one ORM can be the primary database layer"
  conflicts:
    - [@modular/prisma, @modular/drizzle, @modular/typeorm]
  reason: "Multiple ORMs would create conflicting schema definitions"
```

### Framework-Specific Dependencies

#### Next.js Ecosystem
```yaml
nextjs_dependencies:
  "@modular/auth-nextauth":
    requires: ["@modular/nextjs"]
    incompatible_with: ["@modular/nuxtjs", "@modular/angular"]
    reason: "NextAuth is specific to Next.js framework"
    
  "@modular/ui-shadcn":
    requires: ["@modular/nextjs"] # React-based
    compatible_with: ["@modular/vite-react"]
    incompatible_with: ["@modular/nuxtjs", "@modular/angular"]
    
  "@modular/next-seo":
    requires: ["@modular/nextjs"]
    enhances: ["@modular/next-sitemap"]
```

#### Nuxt.js Ecosystem  
```yaml
nuxtjs_dependencies:
  "@modular/auth-nuxt":
    requires: ["@modular/nuxtjs"]
    incompatible_with: ["@modular/nextjs", "@modular/angular"]
    
  "@modular/ui-vuetify":
    requires: ["@modular/nuxtjs"] # Vue-based
    compatible_with: ["@modular/vite-vue"]
    incompatible_with: ["@modular/nextjs", "@modular/angular"]
    
  "@modular/nuxt-content":
    requires: ["@modular/nuxtjs"]
    provides_alternative_to: ["@modular/directus"]
```

#### Angular Ecosystem
```yaml
angular_dependencies:
  "@modular/auth-angular":
    requires: ["@modular/angular"]
    incompatible_with: ["@modular/nextjs", "@modular/nuxtjs"]
    
  "@modular/ui-angular-material":
    requires: ["@modular/angular"]
    incompatible_with: ["@modular/nextjs", "@modular/nuxtjs"]
```

### Technology Stack Compatibility

#### CSS Framework Compatibility
```yaml
css_frameworks:
  "@modular/tailwind":
    compatible_with: ["@modular/nextjs", "@modular/nuxtjs", "@modular/angular"]
    enhances: ["@modular/ui-shadcn", "@modular/ui-headless"]
    
  "@modular/styled-components":
    compatible_with: ["@modular/nextjs", "@modular/vite-react"]
    incompatible_with: ["@modular/nuxtjs", "@modular/angular"]
    conflicts_with: ["@modular/emotion"]
    
  "@modular/sass":
    compatible_with: ["@modular/nextjs", "@modular/nuxtjs", "@modular/angular"]
    provides_alternative_to: ["@modular/tailwind"]
```

#### Database Compatibility
```yaml
database_compatibility:
  "@modular/postgres":
    compatible_with: ["@modular/prisma", "@modular/drizzle", "@modular/typeorm"]
    required_by: ["@modular/directus"]
    
  "@modular/mysql":
    compatible_with: ["@modular/prisma", "@modular/drizzle", "@modular/typeorm"]
    alternative_to: ["@modular/postgres"]
    
  "@modular/sqlite":
    compatible_with: ["@modular/prisma", "@modular/drizzle"]
    ideal_for: ["development", "prototyping"]
    not_recommended_for: ["production"]
```

## Compatibility Matrix Table

| Module | Next.js | Nuxt.js | Angular | Directus | NestJS | AdonisJS |
|--------|---------|---------|---------|----------|--------|----------|
| **Auth Modules** |
| `@modular/auth-nextauth` | ✅ | ❌ | ❌ | 🔄 | 🔄 | 🔄 |
| `@modular/auth-nuxt` | ❌ | ✅ | ❌ | 🔄 | 🔄 | 🔄 |
| `@modular/auth-angular` | ❌ | ❌ | ✅ | 🔄 | 🔄 | 🔄 |
| **UI Libraries** |
| `@modular/ui-shadcn` | ✅ | ❌ | ❌ | N/A | N/A | N/A |
| `@modular/ui-vuetify` | ❌ | ✅ | ❌ | N/A | N/A | N/A |
| `@modular/ui-angular-material` | ❌ | ❌ | ✅ | N/A | N/A | N/A |
| **CSS Frameworks** |
| `@modular/tailwind` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `@modular/styled-components` | ✅ | ❌ | ❌ | N/A | N/A | N/A |
| **Database ORMs** |
| `@modular/prisma` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| `@modular/drizzle` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

Legend:
- ✅ Fully Compatible
- ❌ Incompatible/Conflicts
- 🔄 Can work together (API + Frontend)
- ⚠️ Limited compatibility
- N/A Not applicable

## Advanced Compatibility Scenarios

### Multi-App Monorepo Scenarios

```yaml
scenario_1_fullstack_nextjs:
  description: "Full-stack Next.js with Directus backend"
  modules:
    - "@modular/foundation"
    - "@modular/nextjs"
    - "@modular/directus" 
    - "@modular/auth-nextauth"
    - "@modular/ui-shadcn"
    - "@modular/tailwind"
  compatibility: ✅
  
scenario_2_multi_frontend:
  description: "Shared API with multiple frontends"
  modules:
    - "@modular/foundation"
    - "@modular/nextjs"      # Admin panel
    - "@modular/nuxtjs"      # Public website  
    - "@modular/directus"    # Shared API
  compatibility: ✅
  notes: "Frontends in separate apps/ directories"
  
scenario_3_incompatible:
  description: "Next.js with Nuxt auth (INVALID)"
  modules:
    - "@modular/nextjs"
    - "@modular/auth-nuxt"
  compatibility: ❌
  error: "auth-nuxt requires @modular/nuxtjs"
```

### Dependency Resolution

```typescript
interface DependencyResolution {
  // Direct dependencies
  requires: string[];
  
  // Optional enhancements
  enhances?: string[];
  
  // Suggested companions
  recommends?: string[];
  
  // Version constraints
  peerDependencies?: { [key: string]: string };
  
  // Conflict resolution
  replaces?: string[];
  provides_alternative_to?: string[];
}
```

### Version Compatibility

```yaml
version_compatibility:
  "@modular/nextjs":
    "1.x": 
      compatible_with:
        "@modular/auth-nextauth": "^1.0.0"
        "@modular/ui-shadcn": "^1.0.0"
    "2.x":
      compatible_with:
        "@modular/auth-nextauth": "^2.0.0"
        "@modular/ui-shadcn": "^1.5.0 || ^2.0.0"
      breaking_changes:
        - "New auth provider configuration format"
        - "Updated component API"
```

## Automatic Conflict Detection

### CLI Integration

```bash
# Check before installation
$ modular install @modular/auth-nuxt
❌ Error: @modular/auth-nuxt requires @modular/nuxtjs
💡 Suggestion: Install @modular/nuxtjs first, or use @modular/auth-nextauth for Next.js

# Compatibility check for multiple modules
$ modular check @modular/nextjs @modular/auth-nuxt @modular/ui-shadcn
❌ Compatibility Issues Found:
   - @modular/auth-nuxt conflicts with @modular/nextjs
   - Use @modular/auth-nextauth instead for Next.js apps

✅ Alternative suggestion:
   @modular/nextjs + @modular/auth-nextauth + @modular/ui-shadcn
```

### Runtime Validation

```typescript
// During installation
function validateModuleCompatibility(
  requestedModules: string[],
  existingModules: string[]
): CompatibilityResult {
  const allModules = [...requestedModules, ...existingModules];
  
  // Check for conflicts
  const conflicts = findConflicts(allModules);
  
  // Check for missing dependencies  
  const missing = findMissingDependencies(requestedModules, existingModules);
  
  // Generate suggestions
  const suggestions = generateSuggestions(conflicts, missing);
  
  return {
    isValid: conflicts.length === 0 && missing.length === 0,
    conflicts,
    missingDependencies: missing,
    suggestions
  };
}
```

This compatibility matrix ensures that developers cannot accidentally create invalid module combinations while providing clear guidance on compatible alternatives and proper dependency resolution.