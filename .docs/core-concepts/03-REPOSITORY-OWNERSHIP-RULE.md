📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > Repository Ownership Rule

# Repository Ownership Rule

> **Type**: Core Concept - Architecture Pattern  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

**⚠️ REPOSITORIES ARE OWNED BY THEIR DOMAIN SERVICE - NEVER ACCESS REPOSITORIES DIRECTLY FROM OTHER SERVICES**

This is a **FUNDAMENTAL ARCHITECTURAL PRINCIPLE**: Each repository is designed to be accessed ONLY through its dedicated domain service.

## The Rule

```
Service A → Service B → Repository B
NOT: Service A → Repository B
```

## Why This Matters

1. **Business Logic Centralization**: All validation, authorization, and business rules for a domain are in ONE place (its service)
2. **Consistency**: Every access to data goes through the domain service, ensuring consistent behavior
3. **Maintainability**: Changing logic means updating ONE service, not hunting through multiple files
4. **Testing**: Mock services instead of repositories for cleaner, faster tests
5. **Encapsulation**: Repository implementation details hidden behind service interface

## ✅ CORRECT: Service-to-Service Communication

```typescript
@Injectable()
export class DeploymentOrchestratorService {
  constructor(
    private readonly deploymentService: DeploymentService,    // ✅ Use domain service
    private readonly projectService: ProjectService,          // ✅ Use domain service
    private readonly serviceService: ServiceService,          // ✅ Use domain service
  ) {}

  async orchestrateDeployment(projectId: string) {
    // ✅ Call service methods (they handle repository access internally)
    const project = await this.projectService.findById(projectId);
    const services = await this.serviceService.findByProjectId(projectId);
    const deployment = await this.deploymentService.create({
      projectId,
      // ... data
    });
    
    return deployment;
  }
}

// Domain service encapsulates repository access
@Injectable()
export class DeploymentService {
  constructor(
    private readonly deploymentRepository: DeploymentRepository,  // ✅ Repository accessed here
  ) {}

  async create(data: CreateDeploymentInput) {
    // Business logic and validation
    if (!data.projectId) {
      throw new BadRequestException('Project ID required');
    }

    // Repository access through service
    return await this.deploymentRepository.create(data);
  }

  async findById(id: string) {
    const deployment = await this.deploymentRepository.findById(id);
    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    return deployment;
  }
}
```

## ❌ WRONG: Direct Repository Access

```typescript
@Injectable()
export class DeploymentOrchestratorService {
  constructor(
    private readonly deploymentRepository: DeploymentRepository,   // ❌ WRONG! Skip service layer
    private readonly projectRepository: ProjectRepository,         // ❌ WRONG! Skip service layer
    private readonly serviceRepository: ServiceRepository,         // ❌ WRONG! Skip service layer
  ) {}

  async orchestrateDeployment(projectId: string) {
    // ❌ Direct repository access bypasses business logic
    const project = await this.projectRepository.findById(projectId);
    const services = await this.serviceRepository.findByProjectId(projectId);
    const deployment = await this.deploymentRepository.create({
      projectId,
      // ... data
    });
    
    // Problems:
    // 1. No validation from ProjectService
    // 2. No authorization checks from ServiceService
    // 3. No business logic from DeploymentService
    // 4. Duplicate validation code across multiple orchestrators
    // 5. Changes to business logic require updating multiple files
    
    return deployment;
  }
}
```

## When You Need Data from Another Domain

1. **Identify the domain** (deployment, project, service, etc.)
2. **Find the domain's service** (DeploymentService, ProjectService, etc.)
3. **Call the appropriate service method**
4. **Let the service handle repository access internally**

## Exception Cases (RARE)

- **Only when creating the initial domain service** for a new module
- **Only in the service's own module** - never across module boundaries
- **Document why** if you must access a repository from outside its service

## Common Patterns

| Pattern | Use Domain Service | NOT Repository |
|---------|-------------------|----------------|
| Orchestration services | ✅ DeploymentService.create() | ❌ DeploymentRepository.create() |
| Cleanup services | ✅ DeploymentService.findStuck() | ❌ DeploymentRepository.findStuck() |
| Monitoring services | ✅ DeploymentService.findRecent() | ❌ DeploymentRepository.findRecent() |
| Webhook handlers | ✅ ServiceService.findById() | ❌ ServiceRepository.findById() |
| Background jobs | ✅ ProjectService.findMany() | ❌ ProjectRepository.findMany() |

## Enforcement

If you're injecting a repository outside of its dedicated service, **you're doing it wrong!**

This rule is **MANDATORY** and violations must be refactored immediately.

## Related Core Concepts

- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md)
- [Core vs Feature Architecture](./04-CORE-VS-FEATURE-ARCHITECTURE.md)
