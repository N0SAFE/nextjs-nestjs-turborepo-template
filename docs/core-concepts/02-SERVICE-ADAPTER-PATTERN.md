📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Service-Adapter Pattern

# Service-Adapter Pattern

> **Type**: Core Concept - Architecture Pattern  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

The Service-Adapter Pattern is the **FUNDAMENTAL** architectural pattern for all API development in this project. Controllers MUST NEVER access DatabaseService directly.

## Core Principle

**⚠️ Controllers MUST NEVER access DatabaseService directly**

This project strictly enforces the Service-Adapter pattern for all API controllers. Violating this pattern leads to:
- Bypassed business logic
- Code duplication across controllers
- Difficult testing and maintenance
- Loss of architectural consistency

## The Three-Layer Architecture

```typescript
┌─────────────────────────────────────────────────────────┐
│                      Controller Layer                    │
│  • Handles HTTP requests (ORPC endpoints)               │
│  • Orchestrates service calls                           │
│  • Transforms responses via adapters                    │
│  • NEVER accesses database directly                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                      Service Layer                       │
│  • Contains business logic                              │
│  • Calls repository methods                             │
│  • Returns entities (NOT contracts)                     │
│  • Validates business rules                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Repository Layer                      │
│  • Direct database access (Drizzle ORM)                 │
│  • CRUD operations                                      │
│  • Query building                                       │
│  • Returns database entities                            │
└─────────────────────────────────────────────────────────┘
```

## Adapter Transformation Pattern

```typescript
┌─────────────────────────────────────────────────────────┐
│                    Adapter Layer                         │
│  • Transforms entities → contracts                      │
│  • Located in adapters/ folder                          │
│  • Fixed contract type definitions                      │
│  • NO business logic here                               │
└─────────────────────────────────────────────────────────┘
```

## Rules

### Repository Layer
- **ONLY layer** that injects `DatabaseService`
- Contains ONLY database queries (no business logic)
- Returns raw database entities
- Uses Drizzle ORM type inference (`$inferSelect`, `$inferInsert`)

### Service Layer
- Contains ALL business logic
- Calls repository methods (never DatabaseService)
- Returns entities (NOT contracts)
- Validates business rules
- Throws business exceptions

### Adapter Layer
- Located in `adapters/` folder
- Contains ONLY transformation logic (entities → contracts)
- NO business logic allowed
- Reusable across multiple controller methods
- Fixed contract types from `@repo/api-contracts`
- **Type-safe parameters**: NEVER use `any` type for method parameters

### Controller Layer
- Handles HTTP requests (ORPC endpoints)
- Orchestrates service calls
- Transforms responses via adapters
- NEVER accesses database directly

## Repository Ownership Rule (CRITICAL)

**⚠️ REPOSITORIES ARE OWNED BY THEIR DOMAIN SERVICE**

Each repository is designed to be accessed ONLY through its dedicated domain service.

**The Rule:**
```
Service A → Service B → Repository B
NOT: Service A → Repository B
```

### ✅ CORRECT: Service-to-Service Communication

```typescript
@Injectable()
export class DeploymentOrchestratorService {
  constructor(
    private readonly deploymentService: DeploymentService,    // ✅ Use domain service
    private readonly projectService: ProjectService,          // ✅ Use domain service
  ) {}

  async orchestrateDeployment(projectId: string) {
    // ✅ Call service methods (they handle repository access internally)
    const project = await this.projectService.findById(projectId);
    const deployment = await this.deploymentService.create({ projectId });
    return deployment;
  }
}
```

### ❌ WRONG: Direct Repository Access

```typescript
@Injectable()
export class DeploymentOrchestratorService {
  constructor(
    private readonly deploymentRepository: DeploymentRepository,   // ❌ WRONG!
    private readonly projectRepository: ProjectRepository,         // ❌ WRONG!
  ) {}

  async orchestrateDeployment(projectId: string) {
    // ❌ Direct repository access bypasses business logic
    const project = await this.projectRepository.findById(projectId);
    const deployment = await this.deploymentRepository.create({ projectId });
    return deployment;
  }
}
```

## Examples

### ❌ WRONG Implementation

```typescript
import { DatabaseService } from '@/core/modules/database/services/database.service';

@Controller()
export class ProjectController {
  constructor(
    private databaseService: DatabaseService, // ❌ WRONG!
  ) {}

  @Implement(projectContract.list)
  list() {
    return implement(projectContract.list).handler(async ({ input }) => {
      const db = this.databaseService.db;
      const projectList = await db.select().from(projects).execute();
      return projectList.map(p => ({ id: p.id, name: p.name }));
    });
  }
}
```

**Problems:**
- Business logic bypassed (service layer unused)
- Transformation duplicated across methods
- Cannot unit test without database
- Violates separation of concerns

### ✅ CORRECT Implementation

```typescript
@Controller()
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,   // ✅ Service for business logic
    private readonly projectAdapter: ProjectAdapter,   // ✅ Adapter for transformations
  ) {}

  @Implement(projectContract.list)
  list() {
    return implement(projectContract.list).handler(async ({ input }) => {
      // 1. Call service for business logic
      const result = await this.projectService.findMany({
        userId: input.userId,
        search: input.search,
        limit: input.limit,
        offset: input.offset,
      });

      // 2. Use adapter to transform to contract
      return this.projectAdapter.adaptProjectListToContract(
        result.projects,
        result.total,
        input.limit,
        input.offset,
      );
    });
  }
}
```

**Benefits:**
- Business logic centralized in service
- Transformations reusable via adapter
- Easy to unit test (mock service/adapter)
- Clear separation of concerns

## Complete Implementation Example

### 1. Repository Layer
```typescript
@Injectable()
export class ProjectRepository {
  constructor(private databaseService: DatabaseService) {}

  async findMany(filters): Promise<Project[]> {
    const db = this.databaseService.db;
    let query = db.select().from(projects);
    // ... query building
    return query.execute();
  }
}
```

### 2. Service Layer
```typescript
@Injectable()
export class ProjectService {
  constructor(private projectRepository: ProjectRepository) {}

  async findMany(filters) {
    // Business logic validation
    if (filters.limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }
    // Call repository
    const projects = await this.projectRepository.findMany(filters);
    // Business logic: filter archived
    return projects.filter(p => !p.isArchived);
  }
}
```

### 3. Adapter Layer
```typescript
@Injectable()
export class ProjectAdapter {
  adaptProjectToContract(project: Project): ProjectContract {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
    };
  }

  adaptProjectListToContract(
    projects: Project[],
    limit: number,
    offset: number,
  ): ProjectListContract {
    return {
      items: projects.map(p => this.adaptProjectToContract(p)),
      pagination: { limit, offset, total: projects.length },
    };
  }
}
```

### 4. Controller Layer
```typescript
@Controller()
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectAdapter: ProjectAdapter,
  ) {}

  @Implement(projectContract.list)
  list() {
    return implement(projectContract.list).handler(async ({ input }) => {
      const result = await this.projectService.findMany(input);
      return this.projectAdapter.adaptProjectListToContract(
        result.projects,
        result.total,
        input.limit,
        input.offset,
      );
    });
  }
}
```

## Refactoring Checklist

When fixing a controller that violates this pattern:

1. ✅ Remove DatabaseService injection
2. ✅ Add Adapter injection
3. ✅ Remove direct schema imports
4. ✅ Remove duplicate transformation methods
5. ✅ Check service has required methods
6. ✅ Refactor each endpoint
7. ✅ Update module providers

## Key Takeaways

1. **NEVER inject `DatabaseService` in controllers**
2. **Services return entities, not contracts**
3. **Adapters are pure transformation functions**
4. **Controllers orchestrate, don't implement**
5. **Repository is ONLY layer accessing database**
6. **Follow domain-driven module organization**
7. **Use adapter methods, don't duplicate**
8. **Extend services when needed**

## Enforcement

This pattern is **MANDATORY** for all API development. Violations must be refactored immediately.

## Related Core Concepts

- [Repository Ownership Rule](./03-REPOSITORY-OWNERSHIP-RULE.md)
- [Core vs Feature Architecture](./04-CORE-VS-FEATURE-ARCHITECTURE.md)
- [Type Manipulation Pattern](./05-TYPE-MANIPULATION-PATTERN.md)

## Full Documentation

For complete details with all examples and edge cases, see:
- **`docs/concepts/SERVICE-ADAPTER-PATTERN.md`** - Full specification with 2000+ lines of detailed examples
