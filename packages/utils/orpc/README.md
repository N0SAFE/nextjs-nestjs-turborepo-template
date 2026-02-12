# @repo/orpc-utils

Fluent builder utilities for creating type-safe ORPC contracts with standardized patterns.

## Overview

This package provides a powerful builder pattern for creating ORPC API contracts, eliminating boilerplate while maintaining full type safety. It's inspired by the auth permission builder pattern and provides a similar fluent API for contract creation.

## Installation

This is an internal workspace package. Import it in your code:

```typescript
import { standard, RouteBuilder, SchemaBuilder } from "@repo/orpc-utils";
```

## Quick Start

```typescript
import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create a standard operations builder
const userOps = standard.zod(userSchema, "user");

// Generate complete CRUD contracts with minimal code
export const userContract = oc.tag("User").prefix("/user").router({
  findById: userOps.read().build(),
  
  create: userOps.create()
    .inputBuilder.omit(["id", "createdAt", "updatedAt"])
    .build(),
  
  update: userOps.update()
    .inputBuilder.partial()
    .build(),
  
  delete: userOps.delete().build(),
  
  list: userOps.list({
    pagination: { defaultLimit: 20 },
    sorting: ["createdAt", "name"]
  }).build(),
  
  count: userOps.count().build(),
});
```

## Core Features

### 🎯 Standard Operations

Pre-built CRUD operations with sensible defaults:

- `read()` - GET by ID
- `create()` - POST new entity
- `update()` - PUT entire entity  
- `patch()` - PATCH partial update
- `delete()` - DELETE by ID
- `list()` - GET with pagination, sorting & filtering
- `count()` - GET total count
- `search()` - GET with full-text search
- `check()` - GET field existence
- `batchCreate()` - POST multiple entities
- `batchDelete()` - DELETE multiple by IDs

### 🔍 Type-Safe Query Utilities

Comprehensive query parameter handling with full type inference:

- **Pagination**: Offset, page, and cursor-based pagination
- **Sorting**: Single and multi-field sorting with nulls handling
- **Filtering**: 15+ operators (eq, gt, like, in, between, etc.) for any field type
- **Search**: Simple to full-text search with field selection
- **QueryBuilder**: Combine all features with fluent API

### 🔗 Chainable Customization

Fluent API for easy customization:

```typescript
const contract = userOps.read()
  .summary("Get user profile")
  .tags("Users", "Profile")
  .inputBuilder.extend({ includeStats: z.boolean() })
  .outputBuilder.extend({ stats: statsSchema })
  .build();
```

### 🛡️ Type Safety

Full TypeScript inference throughout the entire chain:

```typescript
const createContract = userOps.create()
  .inputBuilder.pick(["name", "email"])
  .build();

// TypeScript knows the exact input shape
type CreateInput = z.infer<typeof createContract.input>;
// { name: string; email: string }
```

### 🧩 Schema Builders

Modify schemas with `.inputBuilder` and `.outputBuilder`:

```typescript
// Pick specific fields
.inputBuilder.pick(["name", "email"])

// Omit fields
.inputBuilder.omit(["id", "createdAt"])

// Extend with new fields
.inputBuilder.extend({ role: z.string() })

// Make partial
.inputBuilder.partial()

// Custom transformations
.inputBuilder.custom((schema) => schema.partial().omit(["id"]))
```

## API Reference

### `standard(schema, entityName)`

Creates a standard operations builder for an entity schema.

**Parameters:**
- `schema: z.ZodObject<any>` - The entity Zod schema
- `entityName: string` - The entity name (used in summaries/descriptions)

**Returns:** `StandardOperations<TEntity>`

**Example:**
```typescript
const userOps = standard.zod(userSchema, "user");
```

### StandardOperations Methods

#### `read()`
Create a GET by ID operation.

**Returns:** `RouteBuilder` with input `{ id: string }` and output `TEntity`

#### `create()`
Create a POST operation for entity creation.

**Returns:** `RouteBuilder` with input and output `TEntity`

#### `update()`
Create a PUT operation for full entity update.

**Returns:** `RouteBuilder` with input and output `TEntity`

#### `patch()`
Create a PATCH operation for partial update.

**Returns:** `RouteBuilder` with partial input and output `TEntity`

#### `delete()`
Create a DELETE operation.

**Returns:** `RouteBuilder` with input `{ id: string }` and output `{ success: boolean; message?: string }`

#### `list(options?)`
Create a GET operation with pagination and optional sorting.

**Options:**
```typescript
{
  pagination?: {
    defaultLimit?: number;    // Default: 10
    maxLimit?: number;        // Default: 100
    includeOffset?: boolean;  // Default: true
    includeCursor?: boolean;  // Default: false
  };
  sorting?: readonly string[]; // Sortable field names
}
```

**Returns:** `RouteBuilder` with pagination/sorting input and paginated output

#### `count()`
Create a GET operation that returns total count.

**Returns:** `RouteBuilder` with void input and `{ count: number }` output

#### `search(options?)`
Create a GET operation for searching entities.

**Options:**
```typescript
{
  searchFields?: readonly string[]; // Fields to search in
  pagination?: PaginationOptions;
}
```

**Returns:** `RouteBuilder` with search input and paginated output

#### `check(fieldName, fieldSchema?)`
Create a GET operation to check if a field value exists.

**Parameters:**
- `fieldName: keyof Entity` - Field to check
- `fieldSchema?: z.ZodTypeAny` - Optional schema override

**Returns:** `RouteBuilder` with field input and `{ exists: boolean }` output

#### `batchCreate(options?)`
Create a POST operation for batch entity creation.

**Options:**
```typescript
{
  maxBatchSize?: number; // Default: 100
}
```

#### `batchDelete(options?)`
Create a DELETE operation for batch deletion.

**Options:**
```typescript
{
  maxBatchSize?: number; // Default: 100
}
```

### RouteBuilder

Main builder class for creating custom routes.

#### Constructor
```typescript
new RouteBuilder(route?, input?, output?)
```

#### Methods

**Route Configuration:**
- `.route(metadata)` - Set complete route metadata
- `.method(method)` - Set HTTP method
- `.path(path)` - Set route path
- `.summary(summary)` - Set route summary
- `.description(description)` - Set route description
- `.tags(...tags)` - Add tags
- `.deprecated(boolean)` - Mark as deprecated

**Schema Configuration:**
- `.input(schema)` - Set input schema
- `.output(schema)` - Set output schema
- `.inputBuilder` - Access input schema builder
- `.outputBuilder` - Access output schema builder

**Customization:**
- `.custom(modifier)` - Apply custom modifications

**Build:**
- `.build()` - Build and return the ORPC contract

### SchemaBuilder

Builder for standalone schema transformations.

#### Constructor
```typescript
new SchemaBuilder(schema)
```

#### Methods

- `.pick(keys)` - Pick specific fields
- `.omit(keys)` - Omit specific fields
- `.partial()` - Make all fields optional
- `.required()` - Make all fields required
- `.extend(extension)` - Add new fields
- `.merge(other)` - Merge with another schema
- `.nullable()` - Make schema nullable
- `.optional()` - Make schema optional
- `.default(value)` - Add default value
- `.describe(description)` - Add description
- `.custom(modifier)` - Apply custom transformation
- `.build()` - Build and return the Zod schema

## Examples

### Basic CRUD
```typescript
import { oc } from "@orpc/contract";
import { standard } from "@repo/orpc-utils";

const userOps = standard.zod(userSchema, "user");

export const userContract = oc.tag("User").prefix("/user").router({
  findById: userOps.read().build(),
  create: userOps.create()
    .inputBuilder.omit(["id", "createdAt", "updatedAt"])
    .build(),
  update: userOps.update()
    .inputBuilder.partial()
    .build(),
  delete: userOps.delete().build(),
  list: userOps.list().build(),
  count: userOps.count().build(),
});
```

### Advanced Customization
```typescript
const advancedContract = userOps.read()
  .summary("Get user with statistics")
  .tags("Users", "Stats")
  .inputBuilder.extend({
    includeStats: z.boolean().default(false)
  })
  .outputBuilder.extend({
    stats: z.object({
      postCount: z.number(),
      followerCount: z.number()
    }).optional()
  })
  .build();
```

### Custom Route
```typescript
import { RouteBuilder } from "@repo/orpc-utils";

const customContract = new RouteBuilder()
  .route({
    method: "POST",
    path: "/users/invite",
    summary: "Invite user",
  })
  .input(z.object({
    email: z.email(),
    role: z.enum(["user", "admin"])
  }))
  .output(z.object({
    inviteId: z.string(),
    expiresAt: z.string().datetime()
  }))
  .build();
```

### Schema Transformations
```typescript
import { SchemaBuilder } from "@repo/orpc-utils";

const publicUserSchema = new SchemaBuilder(userSchema)
  .omit(["email", "password"])
  .extend({ profileUrl: z.string().url() })
  .build();
```

## Documentation

For comprehensive documentation, see:
- [ORPC Builder Pattern](./../../../.docs/core-concepts/12-ORPC-BUILDER-PATTERN.md) - Complete guide with examples
- [ORPC Implementation Pattern](./../../../.docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md) - Traditional ORPC usage

## License

Internal use only - part of the nextjs-nestjs-turborepo-template
