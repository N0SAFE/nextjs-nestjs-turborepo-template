📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > ORPC Implementation Pattern

# ORPC Implementation Pattern

> **Type**: Core Concept - API Architecture  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-20

## Overview

ORPC is the **FUNDAMENTAL** pattern for type-safe API communication in this project. It provides end-to-end type safety between NestJS backend and Next.js frontend through shared contract definitions, using `@orpc/contract`, `@orpc/nest`, and `@orpc/tanstack-query`.

## Core Principle

**⚠️ ALL API endpoints MUST use ORPC contracts with `@Implement` decorators**

ORPC contracts are the **single source of truth** for API types. Contracts use `oc.route()` definitions with Zod schemas, controllers use `@Implement(contract)` with `implement(contract).handler()`, and the frontend automatically gets typed React Query hooks without manual generation steps.

## Why ORPC is Mandatory

Unlike traditional REST APIs where frontend and backend types can drift apart:
- **Compile-time Safety**: TypeScript catches API mismatches immediately  
- **Auto-completion**: Full IntelliSense for API requests and responses in both backend and frontend
- **Refactoring Safety**: Contract changes break compilation, preventing runtime errors
- **Self-documenting**: Zod schemas and TypeScript types serve as living documentation
- **Auto-generated Hooks**: React Query hooks with full type inference generated at build time
- **Shared Validation**: Same Zod schemas validate input on both client and server

## Contract-First Development Flow

```
1. Define Contract → 2. Implement API → 3. Use in Frontend
   (packages/          (apps/api/src/)      (import { orpc }
    api-contracts/)    @Implement +          from '@/lib/orpc')
                       implement().handler()  
```

**Key Point**: There is NO separate "generate" step. React Query hooks are created automatically during the web app build process.

## Contract Structure

### File Organization

Contracts are organized in `packages/api-contracts/` with this structure:

```
packages/api-contracts/
├── index.ts                    # Main app contract (aggregates all modules)
├── common/
│   └── pagination.ts           # Shared schemas (pagination, sorting, etc.)
└── modules/
    ├── user/
    │   ├── index.ts            # User router combining all user endpoints
    │   ├── list.ts             # Individual endpoint contracts
    │   ├── create.ts
    │   ├── update.ts
    │   └── ...
    ├── capsule/
    │   ├── index.ts            # Capsule router
    │   ├── list.ts
    │   └── ...
    └── health/
        └── index.ts            # Health check contract
```

### Main App Contract (packages/api-contracts/index.ts)

The main contract aggregates all feature modules:

```typescript
import { oc } from '@orpc/contract';
import { userContract } from './modules/user';
import { capsuleContract } from './modules/capsule';
import { healthContract } from './modules/health';

export const appContract = oc.router({
  user: userContract,
  capsule: capsuleContract,
  health: healthContract,
});

export type AppContract = typeof appContract;
```

### Feature Module Router Pattern

Each feature uses `.tag().prefix().router()` to organize endpoints:

```typescript
// packages/api-contracts/modules/capsule/index.ts
import { oc } from '@orpc/contract';
import { listWeeklyContract } from './list-weekly';
import { getByIdContract } from './get-by-id';
import { listContract } from './list';
import { createContract } from './create';
import { updateContract } from './update';
import { deleteContract } from './delete';

export const capsuleContract = oc
  .tag('Capsule')
  .prefix('/capsule')
  .router({
    listWeekly: listWeeklyContract,
    getById: getByIdContract,
    list: listContract,
    create: createContract,
    update: updateContract,
    delete: deleteContract,
  });
```

### Individual Endpoint Contract Pattern

Each endpoint is defined with `oc.route()`:

```typescript
// packages/api-contracts/modules/user/list.ts
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { paginationSchema, sortSchema } from '../../common/pagination';

const userFilterSchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
}).optional();

const userOutputSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
  createdAt: z.string(),
});

export const listContract = oc
  .route({
    method: 'GET',
    path: '/',
    summary: 'List users with pagination, sorting, and filtering',
  })
  .input(
    z.object({
      pagination: paginationSchema,
      sort: sortSchema(z.enum(['email', 'name', 'createdAt'])),
      filter: userFilterSchema,
    }),
  )
  .output(
    z.object({
      users: z.array(userOutputSchema),
      pagination: z.object({
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      }),
    }),
  );
```

### Contract Components Explained

1. **`.route({ method, path, summary })`**: Defines HTTP method, path, and OpenAPI documentation
2. **`.input(zodSchema)`**: Request validation schema (query params, path params, or body)
3. **`.output(zodSchema)`**: Response type validation and TypeScript inference
4. **`.tag(name)`**: Groups endpoints in OpenAPI documentation
5. **`.prefix(path)`**: Adds path prefix to all routes in a router

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
- Separate validation on frontend and backend

### ✅ CORRECT - ORPC Implementation

```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { capsuleContract } from '@repo/api-contracts';
import { CapsuleService } from '../services/capsule.service';
import { CapsuleAdapter } from '../adapters/capsule.adapter';
import { RequireRole, Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller()
export class CapsuleController {
  constructor(
    private readonly capsuleService: CapsuleService,
    private readonly capsuleAdapter: CapsuleAdapter,
  ) {}
  
  @RequireRole('admin')
  @Implement(capsuleContract.getById)
  getById() {
    return implement(capsuleContract.getById).handler(async ({ input }) => {
      // Input already validated by ORPC with Zod schema
      const capsule = await this.capsuleService.findById(input.id);
      
      if (!capsule) {
        throw new NotFoundException('Capsule not found');
      }
      
      // Adapter transforms entity to contract type
      return this.capsuleAdapter.toContract(capsule);
    });
  }
  
  @RequireRole('admin')
  @Implement(capsuleContract.create)
  create(@Session() session: UserSession) {
    return implement(capsuleContract.create).handler(async ({ input }) => {
      // Access authenticated user from session
      const userId = session.user.id;
      
      const capsule = await this.capsuleService.create({
        ...input,
        userId,
      });
      
      return this.capsuleAdapter.toContract(capsule);
    });
  }
}
```

**Benefits:**
- ✅ End-to-end type safety (frontend automatically knows response type)
- ✅ No manual API client code needed
- ✅ Refactoring safety (contract changes break compilation)
- ✅ Auto-generated React Query hooks at build time
- ✅ Self-documenting API with OpenAPI generation
- ✅ Single source of validation (Zod schemas)
- ✅ User context via `@Session()` decorator
- ✅ Authorization via `@RequireRole()` decorator

## API Implementation Components

### 1. Contract Definition (packages/api-contracts/modules/*/...)

Complete example with all patterns:

```typescript
// packages/api-contracts/modules/capsule/list.ts
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { paginationSchema, sortSchema } from '../../common/pagination';

const capsuleFilterSchema = z.object({
  title: z.string().optional(),
  state: z.enum(['draft', 'scheduled', 'sent']).optional(),
  userId: z.string().optional(),
}).optional();

const capsuleOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  state: z.enum(['draft', 'scheduled', 'sent']),
  scheduledFor: z.string().nullable(),
  sentAt: z.string().nullable(),
  contentCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listContract = oc
  .route({
    method: 'GET',
    path: '/',
    summary: 'List capsules with pagination, sorting, and filtering',
  })
  .input(
    z.object({
      pagination: paginationSchema,
      sort: sortSchema(z.enum(['createdAt', 'scheduledFor', 'title'])),
      filter: capsuleFilterSchema,
    }),
  )
  .output(
    z.object({
      capsules: z.array(capsuleOutputSchema),
      pagination: z.object({
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      }),
    }),
  );
```

### 2. Controller Implementation (apps/api/src/modules/*/controllers/)

```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { capsuleContract } from '@repo/api-contracts';
import { CapsuleService } from '../services/capsule.service';
import { CapsuleAdapter } from '../adapters/capsule.adapter';
import { RequireRole, Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller()
export class CapsuleController {
  constructor(
    private readonly capsuleService: CapsuleService,
    private readonly capsuleAdapter: CapsuleAdapter,
  ) {}
  
  @RequireRole('admin')
  @Implement(capsuleContract.list)
  list() {
    return implement(capsuleContract.list).handler(async ({ input }) => {
      // 1. Call service for business logic
      const { capsules, total } = await this.capsuleService.findAll(
        input.pagination,
        input.sort,
        input.filter,
      );
      
      // 2. Transform entities via adapter to match contract
      return {
        capsules: capsules.map((c) => this.capsuleAdapter.toContract(c)),
        pagination: {
          total,
          limit: input.pagination.limit,
          offset: input.pagination.offset,
        },
      };
    });
  }
  
  @RequireRole('admin')
  @Implement(capsuleContract.update)
  update(@Session() session: UserSession) {
    return implement(capsuleContract.update).handler(async ({ input }) => {
      // Access user context from session
      const userId = session.user.id;
      
      // Service layer handles authorization check
      const capsule = await this.capsuleService.update(
        input.id,
        input.data,
        userId,
      );
      
      return this.capsuleAdapter.toContract(capsule);
    });
  }
}
```

### 3. Authorization Patterns

ORPC endpoints use decorators for authorization:

```typescript
import { RequireRole, Public } from '@/core/modules/auth/decorators/decorators';

@Controller()
export class UserController {
  // Public endpoint (no authentication required)
  @Public()
  @Implement(userContract.create)
  create() {
    return implement(userContract.create).handler(async ({ input }) => {
      // Anyone can create a user
    });
  }
  
  // Requires specific roles
  @RequireRole('admin', 'sarah')
  @Implement(userContract.list)
  list() {
    return implement(userContract.list).handler(async ({ input }) => {
      // Only admin or sarah can list users
    });
  }
  
  // Requires admin role
  @RequireRole('admin')
  @Implement(userContract.delete)
  delete() {
    return implement(userContract.delete).handler(async ({ input }) => {
      // Only admin can delete users
    });
  }
}
```

### 4. User Context via Session Decorator

> **📚 For comprehensive auth documentation, see [Better Auth Integration](./07-BETTER-AUTH-INTEGRATION.md)**
> 
> This section shows ORPC-specific auth patterns. For full decorator reference, guards system, permission management, and audit recommendations, refer to the Better Auth Integration doc.

Access authenticated user information via `@Session()` decorator:

```typescript
import { Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller()
export class CapsuleController {
  constructor(
    private readonly capsuleService: CapsuleService,
  ) {}
  
  @RequireRole('admin')
  @Implement(capsuleContract.create)
  create(@Session() session: UserSession) {
    return implement(capsuleContract.create).handler(async ({ input }) => {
      // Access authenticated user from session
      const userId = session.user.id;
      const userEmail = session.user.email;
      const userName = session.user.name;
      
      // Use in service calls
      const capsule = await this.capsuleService.create({
        ...input,
        userId,
      });
      
      return this.capsuleAdapter.toContract(capsule);
    });
  }
}
```

**UserSession Type (from Better Auth):**
```typescript
export type UserSession = {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
};
```

**For optional authentication:**
```typescript
@Optional()
@Implement(someContract)
handler(@Session() session?: UserSession) {
  return implement(someContract).handler(async ({ input }) => {
    // Session might be undefined if user is not authenticated
    const userId = session?.user?.id;
    // Handle both authenticated and unauthenticated cases
  });
}
```

### 5. Input Validation

ORPC provides **automatic** input validation using Zod schemas:

```typescript
// Contract with comprehensive validation
export const createContract = oc
  .route({ method: 'POST', path: '/' })
  .input(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      scheduledFor: z.string().datetime().optional(),
      tags: z.array(z.string()).max(10).optional(),
    }),
  )
  .output(capsuleOutputSchema);

// Controller receives pre-validated input
@Implement(capsuleContract.create)
create() {
  return implement(capsuleContract.create).handler(async ({ input }) => {
    // Input is already validated by ORPC:
    // - title is 1-200 chars
    // - description is max 1000 chars (optional)
    // - scheduledFor is valid ISO datetime (optional)
    // - tags is array of max 10 strings (optional)
    
    // TypeScript knows exact shape of input
    // No manual validation needed!
  });
}
```

## Frontend Usage

### ORPC Client Setup

The ORPC client is configured in `/apps/web/src/lib/orpc/index.ts` with:
- Cookie injection for authentication
- Custom header support
- 401 error handling with automatic redirects
- Server-side vs client-side request handling
- Dev auth token support for development

**Always import from:**
```typescript
import { orpc } from '@/lib/orpc';
```

### Client Components - Query Options Pattern (RECOMMENDED)

**✅ ALWAYS use this pattern** - Use `queryOptions` with TanStack Query hooks:

```typescript
'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';

function CapsuleList() {
  // ✅ CORRECT: Use queryOptions with useQuery
  const { data, isLoading, error } = useQuery(
    orpc.capsule.list.queryOptions({
      input: {
        pagination: { limit: 10, offset: 0 },
        sort: { field: 'createdAt', direction: 'desc' },
        filter: { state: 'draft' },
      },
    })
  );
  
  if (isLoading) return <div>Loading capsules...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  // data.capsules is fully typed from contract
  return (
    <ul>
      {data.capsules.map((capsule) => (
        <li key={capsule.id}>
          {capsule.title} - {capsule.state}
        </li>
      ))}
    </ul>
  );
}
```

**Advanced Query Options:**

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';

function UserManagement() {
  const [userSearch, setUserSearch] = useState('');
  
  // queryOptions provides full TanStack Query control
  const usersQuery = useQuery(
    orpc.user.list.queryOptions({
      input: {
        pagination: { limit: 20, offset: 0 },
        sort: { field: 'email', direction: 'asc' },
        filter: userSearch ? { name: userSearch } : undefined,
      },
      context: {
        // Custom headers (useful for dev auth tokens)
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEV_AUTH_KEY}`,
        },
        // Don't redirect on 401 (useful for admin panels)
        noRedirectOnUnauthorized: true,
      },
    }),
  );
  
  return (
    <div>
      <input
        type="text"
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        placeholder="Search users..."
      />
      
      {usersQuery.isLoading && <div>Loading...</div>}
      {usersQuery.error && <div>Error: {usersQuery.error.message}</div>}
      
      {usersQuery.data && (
        <div>
          <p>Total users: {usersQuery.data.pagination.total}</p>
          <ul>
            {usersQuery.data.users.map((user) => (
              <li key={user.id}>{user.email} - {user.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Context Options:**
- `headers`: Custom HTTP headers (e.g., for dev auth tokens)
- `noRedirectOnUnauthorized`: Disable automatic redirect on 401 errors
- `cache`: Next.js cache configuration
- `next`: Next.js revalidation configuration

**❌ NEVER use direct hooks:**
```typescript
// ❌ WRONG - Do not use this pattern
orpc.capsule.list.useQuery({ input: { ... } });
```

### Mutations

**✅ ALWAYS use mutationOptions pattern:**

```typescript
'use client';
import { useMutation } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';

function CreateCapsuleForm() {
  // ✅ CORRECT: Use mutationOptions with useMutation
  const createMutation = useMutation(
    orpc.capsule.create.mutationOptions({
      onSuccess: (data) => {
        console.log('Created capsule:', data.id);
        // Invalidate cache to refresh list
        orpc.capsule.list.invalidate();
      },
      onError: (error) => {
        console.error('Failed to create:', error.message);
      },
    })
  );
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Input is fully typed from contract
    createMutation.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      scheduledFor: formData.get('scheduledFor') as string,
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required />
      <textarea name="description" />
      <input name="scheduledFor" type="datetime-local" />
      
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Capsule'}
      </button>
      
      {createMutation.error && (
        <div className="error">{createMutation.error.message}</div>
      )}
    </form>
  );
}
```

**❌ NEVER use direct mutation hooks:**
```typescript
// ❌ WRONG - Do not use this pattern
orpc.capsule.create.useMutation({ ... });
```

### Server Components (Direct Client Call)

**✅ ALWAYS use `.call()` method in server components:**

```typescript
import { orpc } from '@/lib/orpc';

async function ServerCapsuleDetail({ id }: { id: string }) {
  // ✅ CORRECT: Direct .call() method (server-side only)
  const capsule = await orpc.capsule.getById.call({ id });

  // capsule is fully typed from contract
  return (
    <div>
      <h1>{capsule.title}</h1>
      <p>{capsule.description}</p>
      <p>State: {capsule.state}</p>
      <p>Content Count: {capsule.contentCount}</p>
    </div>
  );
}
```

**❌ NEVER call contracts directly without `.call()`:**
```typescript
// ❌ WRONG - Do not use this pattern
const capsule = await orpc.capsule.getById({ id });
```

### Server Actions

**✅ ALWAYS use `.call()` method in server actions:**

```typescript
'use server';
import { orpc } from '@/lib/orpc';
import { revalidatePath } from 'next/cache';

export async function updateCapsuleAction(id: string, formData: FormData) {
  try {
    // ✅ CORRECT: Type-safe server action with .call()
    const capsule = await orpc.capsule.update.call({
      id,
      data: {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
      },
    });
    
    // Revalidate relevant pages
    revalidatePath('/admin/capsules');
    revalidatePath(`/admin/capsules/${id}`);
    
    return { success: true, capsule };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**❌ NEVER call contracts directly without `.call()`:**
```typescript
// ❌ WRONG - Do not use this pattern
const capsule = await orpc.capsule.update({ id, data });
```

## Development Workflow

### 1. Define Contract

Create a new endpoint contract in the appropriate module:

```typescript
// packages/api-contracts/modules/capsule/publish.ts
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const publishContract = oc
  .route({
    method: 'POST',
    path: '/:id/publish',
    summary: 'Publish a capsule for sending',
  })
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      state: z.literal('scheduled'),
      scheduledFor: z.string(),
    }),
  );
```

Add to module router:

```typescript
// packages/api-contracts/modules/capsule/index.ts
import { publishContract } from './publish';

export const capsuleContract = oc
  .tag('Capsule')
  .prefix('/capsule')
  .router({
    // ... existing endpoints
    publish: publishContract,
  });
```

### 2. Implement in NestJS (Required Order)

**CRITICAL**: Follow the Service-Adapter pattern:

```bash
# 1. Update Service (Business logic layer)
# apps/api/src/modules/capsule/services/capsule.service.ts
# Add publish method with validation

# 2. Update Adapter (Transformation layer)
# apps/api/src/modules/capsule/adapters/capsule.adapter.ts
# Ensure toContract handles new state

# 3. Update Controller (HTTP endpoint layer)
# apps/api/src/modules/capsule/controllers/capsule.controller.ts
# Add @Implement with implement().handler()
```

Example controller implementation:

```typescript
@RequireRole('admin')
@Implement(capsuleContract.publish)
publish() {
  return implement(capsuleContract.publish).handler(async ({ input }) => {
    const userId = this.request.user.id;
    
    const capsule = await this.capsuleService.publish(input.id, userId);
    
    return {
      id: capsule.id,
      state: capsule.state,
      scheduledFor: capsule.scheduledFor!.toISOString(),
    };
  });
}
```

### 3. Hooks Auto-Generate

**Important**: React Query hooks are automatically generated at build time. There is NO separate "generate" command needed.

The `bun run generate` script in `apps/web/package.json` runs:
```json
{
  "scripts": {
    "generate": "bun --bun openapi && next-sitemap"
  }
}
```

This generates:
- ✅ OpenAPI documentation (for API exploration)
- ✅ Sitemap for SEO

It does **NOT** generate React Query hooks - those are created automatically during the Next.js build process.

### 4. Use in Frontend

Hooks are immediately available after contract definition:

```typescript
// Client component
'use client';
import { orpc } from '@/lib/orpc';

function PublishButton({ capsuleId }: { capsuleId: string }) {
  const publishMutation = orpc.capsule.publish.useMutation();
  
  return (
    <button
      onClick={() => publishMutation.mutate({ id: capsuleId })}
      disabled={publishMutation.isPending}
    >
      {publishMutation.isPending ? 'Publishing...' : 'Publish Capsule'}
    </button>
  );
}
```

## Complete Implementation Example

This example shows the full flow from contract to frontend usage.

### 1. Contract (packages/api-contracts/modules/capsule/update.ts)

```typescript
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const updateContract = oc
  .route({
    method: 'PUT',
    path: '/:id',
    summary: 'Update capsule details',
  })
  .input(
    z.object({
      id: z.string(),
      data: z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        scheduledFor: z.string().datetime().optional(),
      }),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      state: z.enum(['draft', 'scheduled', 'sent']),
      scheduledFor: z.string().nullable(),
      contentCount: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  );
```

### 2. Service (apps/api/src/modules/capsule/services/capsule.service.ts)

```typescript
@Injectable()
export class CapsuleService {
  constructor(private capsuleRepository: CapsuleRepository) {}
  
  async update(
    id: string,
    data: { title?: string; description?: string; scheduledFor?: Date },
    userId: string,
  ): Promise<Capsule> {
    // Authorization check
    const capsule = await this.capsuleRepository.findById(id);
    if (!capsule) {
      throw new NotFoundException('Capsule not found');
    }
    if (capsule.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    
    // Business logic
    return this.capsuleRepository.update(id, data);
  }
}
```

### 3. Adapter (apps/api/src/modules/capsule/adapters/capsule.adapter.ts)

```typescript
@Injectable()
export class CapsuleAdapter {
  toContract(capsule: Capsule & { contentCount?: number }): CapsuleContract {
    return {
      id: capsule.id,
      title: capsule.title,
      description: capsule.description,
      state: capsule.state,
      scheduledFor: capsule.scheduledFor?.toISOString() ?? null,
      contentCount: capsule.contentCount ?? 0,
      createdAt: capsule.createdAt.toISOString(),
      updatedAt: capsule.updatedAt.toISOString(),
    };
  }
}
```

### 4. Controller (apps/api/src/modules/capsule/controllers/capsule.controller.ts)

```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { capsuleContract } from '@repo/api-contracts';
import { CapsuleService } from '../services/capsule.service';
import { CapsuleAdapter } from '../adapters/capsule.adapter';
import { RequireRole, Session } from '@/core/modules/auth/decorators/decorators';
import type { UserSession } from '@/core/modules/auth/guards/auth.guard';

@Controller()
export class CapsuleController {
  constructor(
    private readonly capsuleService: CapsuleService,
    private readonly capsuleAdapter: CapsuleAdapter,
  ) {}
  
  @RequireRole('admin')
  @Implement(capsuleContract.update)
  update(@Session() session: UserSession) {
    return implement(capsuleContract.update).handler(async ({ input }) => {
      // Extract user from session
      const userId = session.user.id;
      
      // Parse datetime strings to Date objects
      const data = {
        ...input.data,
        scheduledFor: input.data.scheduledFor
          ? new Date(input.data.scheduledFor)
          : undefined,
      };
      
      // Call service with authorization context
      const capsule = await this.capsuleService.update(
        input.id,
        data,
        userId,
      );
      
      // Transform entity to contract type
      return this.capsuleAdapter.toContract(capsule);
    });
  }
}
```

### 5. Frontend Usage (Automatic - No Generation Step)

```typescript
// Client component with mutation
'use client';
import { orpc } from '@/lib/orpc';

function EditCapsuleForm({ capsuleId, initialData }: Props) {
  // Auto-generated, fully typed mutation
  const updateMutation = orpc.capsule.update.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh UI
      orpc.capsule.getById.invalidate({ id: capsuleId });
      orpc.capsule.list.invalidate();
    },
  });
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Input is fully typed from contract
    updateMutation.mutate({
      id: capsuleId,
      data: {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        scheduledFor: formData.get('scheduledFor') as string,
      },
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" defaultValue={initialData.title} />
      <textarea name="description" defaultValue={initialData.description ?? ''} />
      <input name="scheduledFor" type="datetime-local" />
      
      <button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
      
      {updateMutation.error && (
        <div className="error">{updateMutation.error.message}</div>
      )}
    </form>
  );
}
```

## Best Practices

### DO:
✅ Always use `@Implement(contract)` decorator on controller methods  
✅ Always use `implement(contract).handler()` for implementation  
✅ Follow Service-Adapter pattern (service → adapter → return contract type)  
✅ Use `@Session()` decorator for accessing authenticated user context
✅ Use `@RequireRole()` or `@Public()` decorators for authorization
✅ Client: Use `useQuery(orpc.contract.queryOptions({input}))` pattern
✅ Client: Use `useMutation(orpc.contract.mutationOptions({input}))` pattern
✅ Server: Use `await orpc.contract.call({...})` for server-side calls  
✅ Define comprehensive Zod schemas in contracts for automatic validation  
✅ Organize contracts by feature module (`modules/user/`, `modules/capsule/`)  
✅ Use `oc.tag().prefix().router()` for feature module routers  
✅ Import from `@/lib/orpc` in all frontend code  
✅ Use direct hooks (`.useQuery()`, `.useMutation()`) for simple cases  
✅ Use `queryOptions()` with `useQuery()` for advanced TanStack Query features  
✅ Keep contracts simple with clear, descriptive names  
✅ Add JSDoc comments to complex schemas for better IntelliSense  
✅ Return contract-typed objects (adapter handles entity → contract transformation)

### DON'T:
❌ Never use `@Get()`, `@Post()`, `@Put()`, `@Delete()` REST decorators  
❌ Never bypass ORPC contracts with manual routes  
❌ Never skip adapter transformation (always return contract type, not raw entities)  
❌ Never access DatabaseService or repositories in controllers (use service layer)  
❌ Never manually validate input (ORPC handles via Zod schemas)  
❌ Never make breaking contract changes without migration plan  
❌ Never import from wrong path (use `@/lib/orpc`, not `@/lib/api`)  
❌ Never run `bun run web -- generate` expecting it to generate hooks (they auto-generate)  
❌ Never inject REQUEST directly (use `@Session()` decorator for user context)
❌ Never use direct hooks like `orpc.contract.useQuery()` or `orpc.contract.useMutation()`
❌ Never call ORPC contracts directly without `.call()` in server components

## Error Handling

ORPC provides structured error handling:

```typescript
import { ORPCError } from '@orpc/server';

@Implement(capsuleContract.delete)
delete() {
  return implement(capsuleContract.delete).handler(async ({ input }) => {
    const capsule = await this.capsuleService.findById(input.id);
    
    if (!capsule) {
      // Standard HTTP errors work
      throw new NotFoundException('Capsule not found');
    }
    
    if (capsule.state === 'sent') {
      // Custom ORPC errors
      throw new ORPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete sent capsules',
      });
    }
    
    await this.capsuleService.delete(input.id, this.request.user.id);
    
    return { success: true };
  });
}
```

Frontend error handling:

```typescript
const deleteMutation = orpc.capsule.delete.useMutation({
  onError: (error) => {
    // Error is typed with message and code
    if (error.code === 'NOT_FOUND') {
      toast.error('Capsule not found');
    } else if (error.code === 'BAD_REQUEST') {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
  },
});
```

## Troubleshooting

### Contract Mismatch Error
**Symptom**: TypeScript errors about type incompatibility

**Solution**:
```bash
# 1. Verify contract definition matches implementation
# 2. Check adapter returns correct contract type
# 3. Restart TypeScript server in IDE
```

### Hooks Not Available
**Symptom**: Cannot import ORPC hooks in frontend

**Solution**:
```bash
# 1. Verify you're importing from '@/lib/orpc' (not '@/lib/api')
# 2. Restart Next.js dev server
bun run dev:web

# 3. Clear Next.js cache if needed
rm -rf apps/web/.next
```

### 401 Unauthorized Errors
**Symptom**: All requests return 401

**Solution**:
```typescript
// Check if you need noRedirectOnUnauthorized in context
const query = useQuery(
  orpc.admin.users.queryOptions({
    input: { /* ... */ },
    context: {
      noRedirectOnUnauthorized: true, // Prevents automatic redirect
    },
  })
);
```

### Input Validation Fails
**Symptom**: ORPC rejects valid input

**Solution**:
```bash
# 1. Check Zod schema in contract definition
# 2. Verify input shape matches schema exactly
# 3. Check for optional vs required fields
# 4. Ensure datetime strings are ISO 8601 format
```

### Type Errors After Contract Changes
**Symptom**: TypeScript errors in multiple files after updating contract

**Solution**:
```bash
# 1. Save all files
# 2. Restart TypeScript server (CMD/CTRL + Shift + P → "Restart TS Server")
# 3. Check all files using the contract
# 4. Update adapters to match new contract type
```

## Migration from REST/GraphQL

When migrating existing APIs to ORPC:

### Step 1: Define Contracts
Create ORPC contracts matching existing REST endpoints:

```typescript
// Old REST: GET /api/users/:id
// New ORPC contract:
export const getByIdContract = oc
  .route({ method: 'GET', path: '/:id' })
  .input(z.object({ id: z.string() }))
  .output(userOutputSchema);
```

### Step 2: Update Controllers
Replace REST decorators with `@Implement`:

```typescript
// Old:
@Get(':id')
async getUser(@Param('id') id: string) { /* ... */ }

// New:
@Implement(userContract.getById)
getById() {
  return implement(userContract.getById).handler(async ({ input }) => {
    // Same logic, but input.id instead of param
  });
}
```

### Step 3: Update Frontend
Replace fetch calls with ORPC hooks:

```typescript
// Old:
const response = await fetch(`/api/users/${id}`);
const user = await response.json();

// New:
const { data: user } = orpc.user.getById.useQuery({ input: { id } });
```

### Step 4: Remove Old Code
- Delete manual API client code
- Remove REST decorators
- Update tests to use ORPC contracts

## Enforcement

This pattern is **MANDATORY** for all API development:
- ✅ All new endpoints MUST use ORPC contracts with `oc.route()`
- ✅ All endpoints MUST follow Service-Adapter pattern  
- ✅ All controllers MUST use `@Implement` and `implement().handler()`
- ✅ All authorization MUST use `@RequireRole()` or `@Public()` decorators
- ✅ All user context MUST use `@Session()` decorator (not `@Inject(REQUEST)`)
- ✅ All frontend API calls MUST use `orpc` from `@/lib/orpc`
- ❌ Traditional REST decorators (`@Get`, `@Post`, etc.) are FORBIDDEN
- ❌ Manual API client code is FORBIDDEN
- ❌ Direct database access in controllers is FORBIDDEN

Violations must be refactored immediately.

## Related Core Concepts

- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md) - Three-layer architecture for controllers
- [Repository Ownership Rule](./03-REPOSITORY-OWNERSHIP-RULE.md) - Repository access patterns  
- [Type Manipulation Pattern](./05-TYPE-MANIPULATION-PATTERN.md) - TypeScript type utilities
- [Better Auth Integration](./07-BETTER-AUTH-INTEGRATION.md) - Authentication with Better Auth

## Additional Resources

**Live Code Examples:**
- **Contract Organization**: `packages/api-contracts/index.ts` and `packages/api-contracts/modules/`
- **Controller Implementation**: `apps/api/src/modules/capsule/controllers/capsule.controller.ts`
- **Frontend Usage**: `apps/web/src/components/devtools/TanStackDevTools.tsx` (production queryOptions example)
- **ORPC Client Setup**: `apps/web/src/lib/orpc/index.ts`

**Key Files to Reference:**
- `apps/web/package.json` - See `generate` script (openapi + sitemap, NOT hooks)
- `packages/api-contracts/common/pagination.ts` - Shared schemas for pagination/sorting
- `apps/api/src/core/types/request.type.ts` - UserRequest type definition

**Documentation:**
- ORPC Official: https://orpc.io/
- Zod Schema Validation: https://zod.dev/
- TanStack Query: https://tanstack.com/query
