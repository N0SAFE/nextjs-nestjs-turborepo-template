📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > ORPC Builder Pattern

# ORPC Builder Pattern

> **Type**: Core Concept - API Architecture  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-12-06

## Overview

The ORPC Builder Pattern provides a **fluent, type-safe API** for creating ORPC contracts with standardized CRUD operations and customizable schemas. It eliminates boilerplate while maintaining full type safety and consistency across your API contracts.

## Why Use the ORPC Builder?

**Traditional Contract Creation:**
```typescript
// Lots of repetitive boilerplate for each endpoint
import { oc } from "@orpc/contract";
import { z } from "zod/v4";

const userFindByIdInput = z.object({ id: z.uuid() });
const userFindByIdOutput = userSchema;

const userFindByIdContract = oc
  .route({
    method: "GET",
    path: "/{id}",
    summary: "Get user by ID",
    description: "Retrieve a specific user by their ID",
  })
  .input(userFindByIdInput)
  .output(userSchema.nullable());

// Repeat for create, update, delete, list, count, etc...
```

**With ORPC Builder:**
```typescript
import { standard } from "@repo/orpc-utils";
import { userSchema } from "./schemas";

// Create standard operations instantly
const userOps = standard.zod(userSchema, "user");

// Generate complete, type-safe contracts with minimal code
const userFindByIdContract = userOps.read().build();
const userCreateContract = userOps.create()
  .inputBuilder.omit(["id", "createdAt", "updatedAt"])
  .build();
const userListContract = userOps.list({ 
  pagination: { defaultLimit: 20 },
  sorting: ["createdAt", "name"]
}).build();
```

## Core Benefits

1. **Eliminates Boilerplate**: 90% less code for standard CRUD operations
2. **Type Safety**: Full TypeScript inference through the entire chain
3. **Consistency**: Standard patterns ensure API uniformity
4. **Customizable**: Fluent API allows easy customization at any level
5. **Discoverable**: IDE autocomplete reveals all available operations
6. **Maintainable**: Changes to base schemas cascade automatically

## Installation

The builder is available in the `@repo/orpc-utils` package:

```typescript
import { standard, RouteBuilder, SchemaBuilder } from "@repo/orpc-utils";
```

## Core Concepts

### 1. Standard Operations

The `standard()` function creates a builder with predefined operations for common CRUD patterns:

```typescript
import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

const userOps = standard.zod(userSchema, "user");
```

Available standard operations:

| Operation | Method | Path | Description |
|-----------|--------|------|-------------|
| `read()` | GET | `/{id}` | Get single entity by ID |
| `create()` | POST | `/` | Create new entity |
| `update()` | PUT | `/{id}` | Update entire entity |
| `patch()` | PATCH | `/{id}` | Partial update |
| `delete()` | DELETE | `/{id}` | Delete by ID |
| `list()` | GET | `/` | Paginated list |
| `count()` | GET | `/count` | Get total count |
| `search()` | GET | `/search` | Search with query |
| `check()` | GET | `/check/{field}` | Check field existence |
| `batchCreate()` | POST | `/batch` | Bulk create |
| `batchDelete()` | DELETE | `/batch` | Bulk delete |

### 2. Chainable Customization

Every builder returns a `RouteBuilder` that supports method chaining:

```typescript
const contract = userOps.read()
  .summary("Get user profile")
  .description("Retrieve detailed user information")
  .tags("Users", "Profile")
  .outputBuilder.extend({
    permissions: z.array(z.string())
  })
  .build();
```

### 3. Input/Output Schema Builders

Modify schemas using the `inputBuilder` and `outputBuilder` properties:

```typescript
// Customize input
const createContract = userOps.create()
  .inputBuilder.omit(["id", "createdAt", "updatedAt"])
  .inputBuilder.extend({ inviteCode: z.string().optional() })
  .build();

// Customize output
const readContract = userOps.read()
  .outputBuilder.extend({ postCount: z.number() })
  .outputBuilder.nullable()
  .build();
```

## Usage Examples

### Example 1: Basic CRUD Setup

```typescript
import { oc } from "@orpc/contract";
import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create standard operations
const userOps = standard.zod(userSchema, "user");

// Build all CRUD contracts
export const userContract = oc.tag("User").prefix("/user").router({
  findById: userOps.read().build(),
  
  create: userOps.create()
    .inputBuilder.omit(["id", "createdAt", "updatedAt", "emailVerified"])
    .build(),
  
  update: userOps.update()
    .inputBuilder.omit(["id", "email", "createdAt", "updatedAt"])
    .inputBuilder.partial()
    .build(),
  
  delete: userOps.delete().build(),
  
  list: userOps.list({
    pagination: { defaultLimit: 20, maxLimit: 100 },
    sorting: ["createdAt", "name", "email"]
  }).build(),
  
  count: userOps.count().build(),
});
```

### Example 2: Custom Input Schema Transformations

```typescript
// Pick specific fields
const createContract = userOps.create()
  .inputBuilder.pick(["name", "email"])
  .inputBuilder.extend({
    password: z.string().min(8),
    confirmPassword: z.string()
  })
  .build();

// Omit sensitive fields
const updateContract = userOps.update()
  .inputBuilder.omit(["password", "role", "emailVerified"])
  .inputBuilder.partial()
  .build();

// Custom transformations
const patchContract = userOps.patch()
  .inputBuilder.custom((schema) => 
    schema.pick(["name", "image"]).partial()
  )
  .build();
```

### Example 3: Advanced Customization with .custom()

```typescript
// Apply complex modifications
const advancedContract = userOps.list()
  .custom((builder) => 
    builder
      .summary("Advanced user search")
      .tags("Users", "Advanced")
      .inputBuilder.extend({
        roles: z.array(z.string()).optional(),
        verified: z.boolean().optional(),
        createdAfter: z.string().datetime().optional()
      })
  )
  .build();

// Chain multiple custom operations
const complexContract = userOps.read()
  .custom((builder) => builder.deprecated(true))
  .custom((builder) => builder.tags("Legacy"))
  .outputBuilder.custom((schema) => 
    schema.extend({
      legacyId: z.number(),
      migrationStatus: z.string()
    })
  )
  .build();
```

### Example 4: Pagination and Sorting

```typescript
// Standard pagination
const paginatedList = userOps.list({
  pagination: {
    defaultLimit: 25,
    maxLimit: 100,
    includeOffset: true,
    includeCursor: true  // For cursor-based pagination
  }
}).build();

// With sorting options
const sortableList = userOps.list({
  pagination: { defaultLimit: 20 },
  sorting: ["createdAt", "name", "email", "updatedAt"]
}).build();

// Input type will be:
// {
//   limit: number (default 20, max 100)
//   offset: number (default 0)
//   cursor?: string
//   sortBy?: "createdAt" | "name" | "email" | "updatedAt"
//   sortDirection: "asc" | "desc" (default "asc")
// }
```

### Example 5: Search Functionality

```typescript
// Basic search
const searchContract = userOps.search({
  searchFields: ["name", "email", "bio"]
}).build();

// Search with pagination
const paginatedSearch = userOps.search({
  searchFields: ["name", "email"],
  pagination: { defaultLimit: 50 }
}).build();

// Input type will be:
// {
//   query: string
//   fields?: ("name" | "email" | "bio")[]
//   limit: number
//   offset: number
// }
```

### Example 6: Field Existence Checks

```typescript
// Check if email exists
const checkEmailContract = userOps.check("email").build();

// Custom field check with validation
const checkUsernameContract = userOps
  .check("name", z.string().min(3).max(20))
  .build();

// Input type: { email: string }
// Output type: { exists: boolean }
```

### Example 7: Batch Operations

```typescript
// Batch create with size limit
const batchCreateContract = userOps.batchCreate({
  maxBatchSize: 50
}).build();

// Batch delete
const batchDeleteContract = userOps.batchDelete({
  maxBatchSize: 100
}).build();

// Batch create input type:
// {
//   items: User[] (max 50 items)
// }
//
// Batch create output type:
// {
//   items: User[]
//   errors?: { index: number; error: string }[]
// }
```

### Example 8: Manual Route Building

For complete custom routes, use `RouteBuilder` directly:

```typescript
import { RouteBuilder } from "@repo/orpc-utils";

const customContract = new RouteBuilder()
  .route({
    method: "POST",
    path: "/users/invite",
    summary: "Invite user",
    description: "Send invitation email to new user"
  })
  .input(z.object({
    email: z.email(),
    role: z.enum(["user", "admin"]),
    message: z.string().optional()
  }))
  .output(z.object({
    inviteId: z.string(),
    expiresAt: z.string().datetime()
  }))
  .build();
```

### Example 9: Schema-Only Builders

Use `SchemaBuilder` for standalone schema transformations:

```typescript
import { SchemaBuilder } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create a public user schema
const publicUserSchema = new SchemaBuilder(userSchema)
  .omit(["email", "emailVerified", "password"])
  .extend({
    profileUrl: z.string().url()
  })
  .build();

// Create an admin user schema
const adminUserSchema = new SchemaBuilder(userSchema)
  .extend({
    permissions: z.array(z.string()),
    lastLoginIp: z.string().ip(),
    loginCount: z.number()
  })
  .build();
```

### Example 10: Complex Entity Relationships

```typescript
import { standard } from "@repo/orpc-utils";
import { postSchema, commentSchema } from "./schemas";

const postOps = standard.zod(postSchema, "post");

// Post with comments
const postWithCommentsContract = postOps.read()
  .outputBuilder.extend({
    comments: z.array(commentSchema),
    commentCount: z.number()
  })
  .build();

// Nested creation
const createPostWithTagsContract = postOps.create()
  .inputBuilder.extend({
    tags: z.array(z.string()),
    categoryId: z.string().uuid()
  })
  .build();
```

## Best Practices

### 1. Create Reusable Operation Builders

```typescript
// shared/user-operations.ts
export const userOps = standard.zod(userSchema, "user");

// modules/user/contracts.ts
import { userOps } from "@/shared/user-operations";

export const userFindByIdContract = userOps.read().build();
export const userCreateContract = userOps.create()
  .inputBuilder.omit(["id", "createdAt", "updatedAt"])
  .build();
```

### 2. Use Consistent Naming

```typescript
// Good: Clear entity name and operation
const userOps = standard.zod(userSchema, "user");
const postOps = standard.zod(postSchema, "post");

// Bad: Unclear or inconsistent
const ops1 = standard.zod(userSchema, "usr");
const builder = standard.zod(postSchema, "Post"); // Capitalize for consistency
```

### 3. Extract Common Patterns

```typescript
// utils/contract-helpers.ts
export function createStandardCrud<T extends EntitySchema>(
  schema: T,
  entityName: string,
  omitFields: (keyof z.infer<T>)[]
) {
  const ops = standard.zod(schema, entityName);
  
  return {
    read: ops.read().build(),
    create: ops.create().inputBuilder.omit(omitFields).build(),
    update: ops.update().inputBuilder.omit(omitFields).inputBuilder.partial().build(),
    delete: ops.delete().build(),
    list: ops.list({ pagination: { defaultLimit: 20 } }).build(),
    count: ops.count().build(),
  };
}

// Usage
const userContracts = createStandardCrud(
  userSchema, 
  "user", 
  ["id", "createdAt", "updatedAt", "emailVerified"]
);
```

### 4. Document Custom Operations

```typescript
/**
 * User invitation contract
 * Sends an email invitation with a secure token
 */
const inviteContract = new RouteBuilder()
  .route({
    method: "POST",
    path: "/users/invite",
    summary: "Invite new user",
    description: "Send email invitation with secure token and role assignment"
  })
  .input(inviteSchema)
  .output(inviteResponseSchema)
  .build();
```

### 5. Leverage Type Inference

```typescript
// The builder maintains full type safety
const createInput = userOps.create()
  .inputBuilder.pick(["name", "email"])
  .getInputSchema();

type CreateUserInput = z.infer<typeof createInput>;
// Type: { name: string; email: string }
```

## Migration Guide

### Converting Existing Contracts

**Before:**
```typescript
import { oc } from "@orpc/contract";
import { userSchema } from "@repo/api-contracts/common/user";

export const userFindByIdInput = z.object({ id: z.uuid() });
export const userFindByIdOutput = userSchema;

export const userFindByIdContract = oc
  .route({
    method: "GET",
    path: "/{id}",
    summary: "Get user by ID",
    description: "Retrieve a specific user by their ID",
  })
  .input(userFindByIdInput)
  .output(userSchema.nullable());

export const userCreateInput = z.object({
  name: userSchema.shape.name,
  email: userSchema.shape.email,
  image: userSchema.shape.image,
});

export const userCreateContract = oc
  .route({
    method: "POST",
    path: "/",
    summary: "Create a new user",
    description: "Create a new user in the system",
  })
  .input(userCreateInput)
  .output(userSchema);
```

**After:**
```typescript
import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

const userOps = standard.zod(userSchema, "user");

export const userFindByIdContract = userOps.read()
  .outputBuilder.nullable()
  .build();

export const userCreateContract = userOps.create()
  .inputBuilder.pick(["name", "email", "image"])
  .build();
```

**Result:** ~70% less code with identical type safety!

## Advanced Features

### Custom Schema Builder

For complex schema transformations beyond standard operations:

```typescript
import { SchemaBuilder } from "@repo/orpc-utils";

const transformedSchema = new SchemaBuilder(baseSchema)
  .omit(["internalField"])
  .extend({ computedField: z.string() })
  .partial()
  .nullable()
  .build();
```

### Composing Multiple Modifications

```typescript
const complexContract = userOps.read()
  .tags("Users", "Public")
  .summary("Get public user profile")
  .deprecated(false)
  .inputBuilder.extend({ includeStats: z.boolean().default(false) })
  .outputBuilder.extend({
    stats: z.object({
      postCount: z.number(),
      followerCount: z.number()
    }).optional()
  })
  .custom((builder) => {
    // Apply any custom logic
    if (process.env.NODE_ENV === "development") {
      return builder.description("DEV: Extended user profile");
    }
    return builder;
  })
  .build();
```

### Event Iterators and Streaming

For streaming operations (future feature):

```typescript
// Placeholder for future streaming support
const streamContract = new RouteBuilder()
  .route({
    method: "GET",
    path: "/users/stream",
    summary: "Stream users"
  })
  .input(z.void())
  .output(userSchema) // Will support event iterator output in future
  .build();
```

## Type Safety Guarantees

The builder maintains complete type safety throughout:

```typescript
const ops = standard.zod(userSchema, "user");

// Input types are inferred
const createContract = ops.create()
  .inputBuilder.pick(["name", "email"])
  .build();

// TypeScript knows the exact input shape
type CreateInput = Parameters<typeof createContract.input.parse>[0];
// { name: string; email: string }

// Output types are inferred
const readContract = ops.read()
  .outputBuilder.extend({ extra: z.string() })
  .build();

type ReadOutput = ReturnType<typeof readContract.output.parse>;
// User & { extra: string }
```

## Related Documentation

- [ORPC Implementation Pattern](./09-ORPC-IMPLEMENTATION-PATTERN.md) - Traditional ORPC usage
- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md) - Backend implementation patterns
- [ORPC Client Hooks Pattern](./11-ORPC-CLIENT-HOOKS-PATTERN.md) - Frontend usage

## Summary

The ORPC Builder Pattern is a **powerful abstraction** that:

✅ **Reduces boilerplate** by 70-90% for standard operations  
✅ **Maintains type safety** throughout the entire chain  
✅ **Ensures consistency** across all API contracts  
✅ **Enables customization** through fluent, chainable API  
✅ **Improves maintainability** with centralized patterns  

**Start using it for all new contracts** and gradually migrate existing ones to leverage these benefits!
