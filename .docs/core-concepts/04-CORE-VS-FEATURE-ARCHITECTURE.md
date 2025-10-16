📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Core vs Feature Architecture

# Core vs Feature Architecture

> **Type**: Core Concept - Architecture Pattern  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

The application is organized into two distinct layers: Core Modules (infrastructure) and Feature Modules (HTTP endpoints + domain logic).

## Architecture

```
apps/api/src/
├── core/
│   └── modules/           # Core infrastructure modules
│       ├── database/
│       ├── auth/
│       ├── orchestration/
│       └── ...
└── modules/               # Feature modules
    ├── deployment/
    ├── project/
    ├── service/
    └── ...
```

## Core Modules (`src/core/modules/`)

Core modules provide **infrastructure services** that are shared across the application.

### Rules for Core Modules

1. ✅ **Can only import other core modules**
2. ❌ **Cannot import feature modules**
3. ❌ **No `@Global()` decorators** (except `BullModule.forRoot`)
4. ✅ **Export services for use by features**
5. ✅ **Contain business logic if shared infrastructure**

### When to Create a Core Module

**Put logic in Core Module when:**
- Used by 2+ feature modules
- Domain-agnostic (not tied to specific feature)
- Infrastructure concern (auth, database, cache)
- Reusable utility function

### Examples of Core Modules

- **DatabaseModule**: Database connection and query building
- **AuthModule**: Authentication and authorization infrastructure
- **OrchestrationModule**: Deployment orchestration, Bull queues
- **StorageModule**: File storage infrastructure
- **CacheModule**: Caching infrastructure

## Feature Modules (`src/modules/`)

Feature modules provide **HTTP endpoints** and **domain-specific logic**.

### Rules for Feature Modules

1. ✅ **Can import core modules**
2. ✅ **Can import other feature modules** (with care)
3. ✅ **Contain domain-specific business logic**
4. ✅ **Expose HTTP endpoints via controllers**
5. ❌ **Cannot be imported by core modules**

### When to Create a Feature Module

**Put logic in Feature Module when:**
- Only used by one feature
- Feature-specific business rules
- HTTP endpoint orchestration
- Domain-specific workflow

### Examples of Feature Modules

- **DeploymentModule**: Deployment HTTP endpoints and domain logic
- **ProjectModule**: Project HTTP endpoints and domain logic
- **ServiceModule**: Service HTTP endpoints and domain logic

## Decision Framework

| Concern | Core Module | Feature Module |
|---------|-------------|----------------|
| Used by multiple features? | ✅ | ❌ |
| Infrastructure concern? | ✅ | ❌ |
| Has HTTP endpoints? | ❌ | ✅ |
| Domain-specific? | ❌ | ✅ |
| Reusable utility? | ✅ | ❌ |

## ❌ WRONG: Duplicated Logic

```typescript
// apps/api/src/modules/project/services/project.service.ts
generateSlug(name: string) { ... } // ❌ Duplicated

// apps/api/src/modules/environment/services/environment.service.ts
generateSlug(name: string) { ... } // ❌ Duplicated

// ✅ Should be in core/modules/utils/services/slug.service.ts
```

## ✅ CORRECT: Shared Logic in Core

```typescript
// apps/api/src/core/modules/encryption/services/encryption.service.ts
@Injectable()
export class EncryptionService {
  encrypt(data: string): string { ... }
  decrypt(encrypted: string): string { ... }
}

// Used by multiple features: projects, environments, api-keys
```

## ✅ CORRECT: Feature-Specific Logic

```typescript
// apps/api/src/modules/deployment/services/deployment.service.ts
@Injectable()
export class DeploymentService {
  async createDeployment(projectId: string, config: DeploymentConfig) {
    // Deployment-specific business logic
  }
}
```

## Circular Dependency Handling

### Rule: Never Import CoreModule from Core Modules

```typescript
// ❌ WRONG - Importing CoreModule from a core module
import { CoreModule } from '@/core/core.module';

@Module({
  imports: [CoreModule], // ❌ Creates circular dependency
})
export class DatabaseModule {}
```

```typescript
// ✅ CORRECT - Import only specific modules needed
import { ConfigModule } from '@/core/modules/config/config.module';

@Module({
  imports: [ConfigModule], // ✅ Direct import
})
export class DatabaseModule {}
```

## Enforcement

This architecture is **MANDATORY** for all module organization. Violations create tight coupling and circular dependencies.

## Related Core Concepts

- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md)
- [Repository Ownership Rule](./03-REPOSITORY-OWNERSHIP-RULE.md)

## Full Documentation

For complete details, see:
- **`docs/architecture/CORE-VS-FEATURE-ARCHITECTURE.md`** - Full specification
- **`docs/architecture/CORE-MODULE-ARCHITECTURE.md`** - Core module dependency rules
