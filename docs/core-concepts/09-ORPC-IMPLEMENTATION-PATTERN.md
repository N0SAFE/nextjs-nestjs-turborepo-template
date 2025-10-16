📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > ORPC Implementation Pattern

# ORPC Implementation Pattern

> **Type**: Core Concept - API Architecture  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-14

## Overview

ORPC (OpenAPI RPC) is the **FUNDAMENTAL** pattern for type-safe API communication in this project. It provides end-to-end type safety between NestJS backend and Next.js frontend through shared contract definitions.

## Core Principle

**⚠️ ALL API endpoints MUST use ORPC contracts - NO traditional REST decorators**

ORPC contracts are the **single source of truth** for API types. Changes to contracts automatically propagate to both frontend and backend, ensuring compile-time type safety across the entire application.

## Why ORPC is Mandatory

Unlike traditional REST APIs where frontend and backend types can drift apart:
- **Compile-time Safety**: TypeScript catches API mismatches immediately
- **Auto-completion**: Full IntelliSense for API requests and responses
- **Refactoring Safety**: Renaming fields updates all usages automatically
- **Self-documenting**: Types serve as living documentation
- **No Manual Sync**: Frontend hooks auto-generate from contracts

## Contract-First Development Flow

```
1. Define Contract → 2. Implement API → 3. Generate Client → 4. Use in Frontend
   (packages/          (apps/api/src/)      (bun run web      (import & use
    api-contracts/)                          -- generate)       generated hooks)
```

## Contract Structure

### Location
All contracts are defined in `packages/api-contracts/index.ts`:

```typescript
import { o } from '@orpc/contract';
import { z } from 'zod';

export const userContract = o.contract({
  getProfile: o.route({
    method: 'GET',
    path: '/users/profile',
    responses: {
      200: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
      }),
    },
  }),
  
  updateProfile: o.route({
    method: 'PUT',
    path: '/users/profile',
    body: z.object({
      name: z.string().min(1).max(100),
    }),
    responses: {
      200: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
      }),
    },
  }),
});
```

### Contract Components

1. **Input Schema**: Zod validation for request data
2. **Output Schema**: Zod validation for response data
3. **Method**: `.query()` (GET-like) or `.mutation()` (POST/PUT/DELETE-like)
4. **Path**: Optional explicit path (auto-generated if omitted)

## ORPC vs Traditional REST Decorators

### ❌ WRONG - Traditional NestJS REST

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    // Traditional REST - NOT USED in this project
  }
  
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    // Traditional REST - NOT USED in this project
  }
}
```

**Problems:**
- No compile-time type safety with frontend
- Manual type synchronization required
- Frontend doesn't know about API changes until runtime
- Requires manual API client code

### ✅ CORRECT - ORPC Implementation

```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { userContract } from '@repo/api-contracts';
import { UserService } from '../services/user.service';
import { UserAdapter } from '../adapters/user-adapter.service';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userAdapter: UserAdapter,
  ) {}
  
  @Implement(userContract.getById)
  getById() {
    return implement(userContract.getById).handler(async ({ input }) => {
      const user = await this.userService.findById(input.id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.userAdapter.adaptUserToContract(user);
    });
  }
  
  @Implement(userContract.create)
  create() {
    return implement(userContract.create).handler(async ({ input }) => {
      const user = await this.userService.create(input);
      return this.userAdapter.adaptUserToContract(user);
    });
  }
}
```

**Benefits:**
- End-to-end type safety (frontend automatically knows response type)
- No manual API client code needed
- Refactoring safety (contract changes break compilation)
- Auto-generated React Query hooks
- Self-documenting API

## API Implementation Components

### 1. Contract Definition (packages/api-contracts/index.ts)

```typescript
import { procedure, router } from '@orpc/server';
import { z } from 'zod';

export const projectContract = router({
  getById: procedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ 
      id: z.string(), 
      name: z.string(),
      description: z.string().nullable(),
      createdAt: z.string(),
    }))
    .query(),
    
  create: procedure
    .input(z.object({ 
      name: z.string().min(1).max(100), 
      description: z.string().optional(),
    }))
    .output(z.object({ 
      id: z.string(), 
      name: z.string(),
      description: z.string().nullable(),
      createdAt: z.string(),
    }))
    .mutation(),
});
```

### 2. Controller Implementation (apps/api/src/modules/*/controllers/)

```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { projectContract } from '@repo/api-contracts';
import { ProjectService } from '../services/project.service';
import { ProjectAdapter } from '../adapters/project-adapter.service';

@Controller()
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectAdapter: ProjectAdapter,
  ) {}
  
  @Implement(projectContract.getById)
  getById() {
    return implement(projectContract.getById).handler(async ({ input }) => {
      // 1. Call service for business logic
      const project = await this.projectService.findById(input.id);
      
      // 2. Transform via adapter to match contract
      return this.projectAdapter.adaptProjectToContract(project);
    });
  }
}
```

### 3. Session Handling

ORPC endpoints access session data via the `@Session()` decorator:

```typescript
import { Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller()
export class ProjectController {
  @Implement(projectContract.create)
  create(@Session() session?: UserSession) {
    return implement(projectContract.create).handler(async ({ input }) => {
      // Session contains user information if authenticated
      const userId = session?.user?.id;
      
      const project = await this.projectService.create({
        ...input,
        userId,
      });
      
      return this.projectAdapter.adaptProjectToContract(project);
    });
  }
}
```

**Session Type:**
```typescript
export type UserSession = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
};
```

### 4. Input Validation

ORPC provides **automatic** input validation using Zod schemas:

```typescript
// Contract with validation
export const projectContract = router({
  create: procedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      repositoryUrl: z.string().url(),
    }))
    .output(z.object({ /* ... */ }))
    .mutation(),
});

// Controller automatically validates input
@Implement(projectContract.create)
create() {
  return implement(projectContract.create).handler(async ({ input }) => {
    // Input is already validated by ORPC
    // TypeScript knows exact shape of input
    // No manual validation needed
  });
}
```

## Frontend Usage

### Client Components (React Query Hooks)

```typescript
import { orpc } from '@/lib/api';

function ProfileComponent() {
  // Auto-generated hook with full type safety
  const { data, isLoading, error } = orpc.users.getProfile.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  // data is fully typed from contract
  return <div>Hello, {data?.name}!</div>;
}

function UpdateProfile() {
  const mutation = orpc.users.updateProfile.useMutation();
  
  const handleSubmit = (name: string) => {
    // Input is typed from contract
    mutation.mutate({ name });
  };
  
  return (
    <button onClick={() => handleSubmit('John')}>
      Update Profile
    </button>
  );
}
```

### Server Components (Direct Client)

```typescript
import { orpcClient } from '@/lib/orpc-client';

async function ServerProfile() {
  // Direct client call (server-side only)
  const profile = await orpcClient.users.getProfile();
  
  // profile is fully typed from contract
  return <div>Hello, {profile.name}!</div>;
}
```

### Server Actions

```typescript
import { orpcClient } from '@/lib/orpc-client';

async function updateUserAction(formData: FormData) {
  'use server';
  
  // Type-safe server action
  const result = await orpcClient.users.updateProfile({
    name: formData.get('name') as string,
  });
  
  return result;
}
```

## Development Workflow

### 1. Define Contract
```typescript
// packages/api-contracts/index.ts
export const userRouter = {
  getUsers: procedure.query(),
  createUser: procedure.input(z.object({...})).mutation()
}
```

### 2. Create NestJS Implementation (Required Order)

**CRITICAL**: Follow the Service-Adapter pattern:

```bash
# 1. Create Repository (Database access layer)
# apps/api/src/modules/user/repositories/user.repository.ts

# 2. Create Service (Business logic layer)  
# apps/api/src/modules/user/services/user.service.ts

# 3. Create Adapter (Transformation layer)
# apps/api/src/modules/user/adapters/user-adapter.service.ts

# 4. Create Controller (HTTP endpoint layer)
# apps/api/src/modules/user/controllers/user.controller.ts
```

### 3. Generate Client
```bash
bun run web -- generate
```

This command:
- Reads contracts from `packages/api-contracts/`
- Generates React Query hooks
- Creates type-safe client methods
- Updates types across frontend

### 4. Use in Frontend
```typescript
// Auto-imported, fully typed
import { orpc } from '@/lib/api';

const { data } = orpc.users.getUsers.useQuery();
```

## Complete Implementation Example

### 1. Contract (packages/api-contracts/index.ts)
```typescript
export const projectContract = router({
  update: procedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    }))
    .output(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      updatedAt: z.string(),
    }))
    .mutation(),
});
```

### 2. Service (apps/api/src/modules/project/services/)
```typescript
@Injectable()
export class ProjectService {
  constructor(private projectRepository: ProjectRepository) {}
  
  async update(id: string, data: { name: string; description?: string }) {
    return this.projectRepository.update(id, data);
  }
}
```

### 3. Adapter (apps/api/src/modules/project/adapters/)
```typescript
@Injectable()
export class ProjectAdapter {
  adaptProjectToContract(project: Project): ProjectContract {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
```

### 4. Controller (apps/api/src/modules/project/controllers/)
```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { projectContract } from '@repo/api-contracts';
import { Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller()
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectAdapter: ProjectAdapter,
  ) {}
  
  @Implement(projectContract.update)
  update(@Session() session?: UserSession) {
    return implement(projectContract.update).handler(async ({ input }) => {
      // Input validated by ORPC (name, description, id)
      const project = await this.projectService.update(input.id, {
        name: input.name,
        description: input.description,
      });
      
      // Adapter transforms entity → contract
      return this.projectAdapter.adaptProjectToContract(project);
    });
  }
}
```

### 5. Frontend Usage (Automatic)
```typescript
import { orpc } from '@/lib/api';

function UpdateProjectForm({ projectId }: { projectId: string }) {
  // Auto-generated, fully typed
  const mutation = orpc.projectContract.update.useMutation();
  
  const handleSubmit = (data: { name: string; description?: string }) => {
    mutation.mutate({
      id: projectId,
      name: data.name,
      description: data.description,
    });
  };
  
  // mutation.data is typed as ProjectContract
  // mutation.isPending, mutation.error available
}
```

## Best Practices

### DO:
✅ Always use `@Implement(contract)` decorator  
✅ Always use `implement(contract).handler()` for implementation  
✅ Follow Service-Adapter pattern (service → adapter → return)  
✅ Define comprehensive input/output schemas in contracts  
✅ Use `@Session()` decorator for authentication  
✅ Return contract-typed objects (adapter handles transformation)  
✅ Keep contracts simple with clear, descriptive names  
✅ Add JSDoc comments to complex schemas  
✅ Version contracts carefully (breaking changes require migration)

### DON'T:
❌ Never use `@Get()`, `@Post()`, `@Put()`, `@Delete()` REST decorators  
❌ Never bypass ORPC contracts with manual routes  
❌ Never skip adapter transformation (always return contract type)  
❌ Never access DatabaseService in controllers (use service layer)  
❌ Never manually validate input (ORPC handles via Zod schemas)  
❌ Never make breaking contract changes without migration plan

## Troubleshooting

### Contract Mismatch
If API implementation doesn't match contract:
```bash
# Check API logs
bun run dev:api:logs

# Verify contract implementation
bun run api -- test
```

### Generation Issues
If client generation fails:
```bash
# Clean and regenerate
bun run web -- clean
bun run web -- generate
```

### Type Errors
If TypeScript errors occur after contract changes:
```bash
# Restart TypeScript server in your IDE
# Or restart the development server
bun run dev
```

## Migration from REST/GraphQL

When migrating existing APIs:

1. **Define ORPC contracts** for existing endpoints
2. **Implement contracts** in NestJS controllers following Service-Adapter pattern
3. **Generate client** with `bun run web -- generate`
4. **Replace frontend API calls** with ORPC hooks
5. **Remove old API client code**
6. **Update tests** to use new contracts

This provides immediate type safety while maintaining familiar patterns.

## Enforcement

This pattern is **MANDATORY** for all API development:
- ✅ All new endpoints MUST use ORPC contracts
- ✅ All endpoints MUST follow Service-Adapter pattern
- ✅ All frontend API calls MUST use generated hooks
- ❌ Traditional REST decorators are FORBIDDEN
- ❌ Manual API client code is FORBIDDEN

Violations must be refactored immediately.

## Related Core Concepts

- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md) - Three-layer architecture for controllers
- [Repository Ownership Rule](./03-REPOSITORY-OWNERSHIP-RULE.md) - Repository access patterns
- [Type Manipulation Pattern](./05-TYPE-MANIPULATION-PATTERN.md) - TypeScript type utilities

## Full Documentation

For complete reference documentation with additional examples:
- **Contract definition patterns**: See `packages/api-contracts/` for live examples
- **React Query integration**: See `apps/web/src/lib/api.ts` for client setup
- **Error handling patterns**: See existing controllers for error handling approaches
