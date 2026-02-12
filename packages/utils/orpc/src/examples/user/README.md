# ORPC User Module - Complete Feature Example

This example demonstrates a **complete, production-ready implementation** of a user management module using the ORPC utilities package. It showcases all available patterns: entity schemas, standard operations with builder extensions, hook generation, cache invalidation, and React component integration.

## 📁 Directory Structure

```
user/
├── entity/
│   └── index.ts          # Zod schema definitions for User entity
├── contracts/
│   ├── standard.ts       # Standard operations with builder extensions (pick, omit, extend, etc.)
│   └── index.ts          # Combined router contract
├── hooks/
│   └── index.ts          # React Query hooks generation + cache utilities
├── usage/
│   └── component-examples.tsx  # React component examples
└── README.md             # This documentation
```

## 🎯 What This Example Covers

| Feature | File | Description |
|---------|------|-------------|
| **Entity Schema** | `entity/index.ts` | Zod schema with validation, enums, partial schemas |
| **Standard CRUD** | `contracts/standard.ts` | List, Read, Create, Update, Delete with pagination/sorting/filtering |
| **Builder Extensions** | `contracts/standard.ts` | `pick`, `omit`, `partial`, `extend` for input customization |
| **Batch Operations** | `contracts/standard.ts` | Batch create, read, update, delete |
| **Streaming** | `contracts/standard.ts` | Real-time data streaming with Server-Sent Events |
| **Soft Delete & Archive** | `contracts/standard.ts` | Soft delete, archive, restore operations |
| **Router Contracts** | `contracts/index.ts` | Combined router with tags, prefix |
| **Hook Generation** | `hooks/index.ts` | `createRouterHooks` with automatic query/mutation detection |
| **Invalidation Rules** | `hooks/index.ts` | `defineInvalidations` for automatic cache invalidation |
| **Query Keys** | `hooks/index.ts` | Query key factory for manual cache manipulation |
| **Optimistic Updates** | `hooks/index.ts` | Helper utilities for optimistic UI updates |
| **React Components** | `usage/component-examples.tsx` | Comprehensive component examples |

---

## 📋 Entity Schema

The entity schema defines the data structure and validation rules using Zod:

```typescript
// entity/index.ts
import { z } from 'zod';

export const USER_ROLES = ['user', 'admin', 'moderator', 'superadmin'] as const;
export const USER_STATUS = ['active', 'inactive', 'banned', 'pending'] as const;

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().min(1).max(100),
  image: z.url().optional(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUS),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Derived schemas for different operations
export const userCreateSchema = userSchema.pick({
  email: true,
  name: true,
  role: true,
});

export const userUpdateSchema = userSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

---

## 🔧 Standard CRUD Contracts with Builder Extensions

Standard operations are built using the `standard()` builder from `@repo/orpc-utils`. The key concept is that **all customization happens through builder extensions**, not separate files:

```typescript
// contracts/standard.ts
import { standard, createPaginationConfigSchema, createSortingConfigSchema } from '@repo/orpc-utils';
import { userSchema } from '../entity';
import { z } from 'zod';

const userOps = standard.zod(userSchema, 'user');

// === BASIC OPERATIONS ===

// LIST with config
export const userListContract = userOps.list({
  pagination: createPaginationConfigSchema({ defaultPage: 1, defaultLimit: 10, maxLimit: 100 }),
  sorting: createSortingConfigSchema({ fields: ['createdAt', 'updatedAt', 'email', 'name'] }),
}).build();

// READ - single item by ID
export const userReadContract = userOps.read().build();

// === BUILDER EXTENSIONS FOR INPUT CUSTOMIZATION ===

// CREATE with picked fields + extension
export const userCreateContract = userOps
  .create()
  .inputBuilder.pick(['name', 'email', 'image'])  // Only use these fields from schema
  .extend({ password: z.string().min(8) })        // Add password field
  .build();

// UPDATE with partial fields
export const userUpdateContract = userOps
  .update()
  .inputBuilder.partial()                         // Make all fields optional
  .omit(['id'])                                   // But remove id from input
  .build();

// DELETE with extension for confirmation
export const userDeleteContract = userOps
  .delete()
  .inputBuilder.extend({ confirmation: z.literal(true) })  // Require confirmation
  .build();

// === OUTPUT CUSTOMIZATION ===

// READ with nullable output (for 404 cases)
export const userReadNullableContract = userOps
  .read()
  .outputBuilder.nullable()
  .build();

// === CUSTOM PATH PARAMETERS ===

// Organization-scoped users with custom path
export const orgUserListContract = userOps
  .list({})
  .pathWithParams(p => `/orgs/${p('orgId', z.uuid())}/users`)
  .build();

// === BATCH OPERATIONS ===
export const userBatchCreateContract = userOps.batchCreate(50).build();
export const userBatchDeleteContract = userOps.batchDelete(100).build();
export const userBatchReadContract = userOps.batchRead(50).build();
export const userBatchUpdateContract = userOps.batchUpdate(50).build();

// === SOFT DELETE & ARCHIVE ===
export const userSoftDeleteContract = userOps.softDelete().build();
export const userArchiveContract = userOps.archive().build();
export const userRestoreContract = userOps.restore().build();

// === STREAMING ===
export const userStreamingListContract = userOps.streamList().build();
```

### Builder Extension Methods

| Method | Description | Example |
|--------|-------------|---------|
| `.pick([...fields])` | Only include specified fields | `.inputBuilder.pick(['name', 'email'])` |
| `.omit([...fields])` | Exclude specified fields | `.inputBuilder.omit(['id', 'createdAt'])` |
| `.partial()` | Make all fields optional | `.inputBuilder.partial()` |
| `.extend({...})` | Add additional fields | `.inputBuilder.extend({ password: z.string() })` |
| `.nullable()` | Make output nullable | `.outputBuilder.nullable()` |
| `.pathWithParams(fn)` | Custom path with type-safe params | `.pathWithParams(p => /orgs/${p('orgId', z.uuid())}/users)` |

---

## 🔗 Combined Router Contract

All contracts are combined into a single router:

```typescript
// contracts/index.ts
import { oc } from '@orpc/contract';

export const userContract = oc
  .tag('User')
  .prefix('/users')
  .router({
    // Standard CRUD
    list: userListContract,
    read: userReadContract,
    create: userCreateContract,
    update: userUpdateContract,
    delete: userDeleteContract,
    
    // Utility
    count: userCountContract,
    exists: userExistsContract,
    
    // Batch Operations
    batchCreate: userBatchCreateContract,
    batchDelete: userBatchDeleteContract,
    batchRead: userBatchReadContract,
    batchUpdate: userBatchUpdateContract,
    
    // Soft Delete & Archive
    softDelete: userSoftDeleteContract,
    archive: userArchiveContract,
    restore: userRestoreContract,
    
    // Streaming
    streamList: userStreamingListContract,
    streamRead: userStreamingReadContract,
    streamSearch: userStreamingSearchContract,
  });
```

---

## 🪝 Hook Generation

### Basic Hook Generation

```typescript
// hooks/index.ts
import { createRouterHooks, defineInvalidations } from '@repo/orpc-utils/hooks';

export const userHooks = createRouterHooks(userContract, {
  useQueryClient,
  invalidations: userInvalidationRules,
});

// Use in components:
// userHooks.useList({ pagination: { page: 1, limit: 10 } })
// userHooks.useCreate()
// userHooks.useUpdate()
// etc.
```

### Invalidation Rules

```typescript
import { defineInvalidations } from '@repo/orpc-utils/hooks';

export const userInvalidationRules = defineInvalidations(userContract, {
  create: {
    invalidates: ['list', 'count'],
  },
  update: {
    invalidates: ['list', 'read'],
  },
  delete: {
    invalidates: ['list', 'count', 'read', 'exists'],
  },
  softDelete: {
    invalidates: ['list', 'read', 'count'],
  },
  archive: {
    invalidates: ['list', 'read', 'count'],
  },
  restore: {
    invalidates: ['list', 'read', 'count'],
  },
  batchCreate: {
    invalidates: ['list', 'count'],
  },
  batchDelete: {
    invalidates: ['list', 'count', 'read'],
  },
  batchUpdate: {
    invalidates: ['list', 'read'],
  },
});
```

### Query Key Factory

```typescript
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters) => [...userQueryKeys.lists(), filters] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id) => [...userQueryKeys.details(), id] as const,
  count: (filters) => [...userQueryKeys.all, 'count', filters] as const,
};
```

---

## ⚛️ React Component Examples

The `usage/component-examples.tsx` file contains comprehensive examples:

| # | Component | Pattern Demonstrated |
|---|-----------|---------------------|
| 1 | `UserListPage` | Paginated list with loading/error states |
| 2 | `UserDetailPage` | Single item fetch with conditional rendering |
| 3 | `CreateUserForm` | Form handling with mutations |
| 4 | `UserEditForm` | Updates with optimistic updates |
| 5 | `DeleteUserButton` | Delete with confirmation |
| 6 | `UserBatchActions` | Multi-select with batch operations |

### Example: Basic List with Pagination

```tsx
export function UserListPage() {
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = userHooks.useList({
    pagination: { page, limit: 10 },
    sorting: { field: 'createdAt', direction: 'desc' },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Users ({data.pagination.total} total)</h1>
      <ul>
        {data.items.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <Pagination page={page} onChange={setPage} total={data.pagination.totalPages} />
    </div>
  );
}
```

---

## 📚 API Reference

### Standard Operations

| Operation | HTTP Method | Path | Description |
|-----------|-------------|------|-------------|
| `list` | GET | `/users` | List with pagination/sorting/filtering |
| `read` | GET | `/users/{id}` | Get single user |
| `create` | POST | `/users` | Create new user |
| `update` | PATCH | `/users/{id}` | Update existing user |
| `delete` | DELETE | `/users/{id}` | Delete user |
| `count` | GET | `/users/count` | Count matching users |
| `exists` | GET | `/users/{id}/exists` | Check if user exists |

### Batch Operations

| Operation | HTTP Method | Path | Description |
|-----------|-------------|------|-------------|
| `batchCreate` | POST | `/users/batch` | Create multiple users |
| `batchRead` | POST | `/users/batch/read` | Read multiple users |
| `batchUpdate` | PATCH | `/users/batch` | Update multiple users |
| `batchDelete` | DELETE | `/users/batch` | Delete multiple users |

### Soft Delete & Archive

| Operation | HTTP Method | Path | Description |
|-----------|-------------|------|-------------|
| `softDelete` | POST | `/users/{id}/soft-delete` | Mark as deleted |
| `archive` | POST | `/users/{id}/archive` | Archive user |
| `restore` | POST | `/users/{id}/restore` | Restore user |

### Streaming

| Operation | HTTP Method | Path | Description |
|-----------|-------------|------|-------------|
| `streamList` | GET | `/users/stream` | Stream user list updates |
| `streamRead` | GET | `/users/{id}/stream` | Stream single user updates |
| `streamSearch` | GET | `/users/search/stream` | Stream search results |

---

## 🚀 Getting Started

1. **Copy this example** to your project's feature modules directory
2. **Customize the entity schema** for your data model
3. **Use builder extensions** (`pick`, `omit`, `partial`, `extend`) to customize operations
4. **Generate hooks** using `createRouterHooks`
5. **Use in React components** with the generated hooks

```typescript
// Your feature module
import { userContract, userHooks } from './user';

// Register contract with ORPC server
app.register(userContract, userImplementation);

// Use hooks in React components
function MyComponent() {
  const { data, isLoading } = userHooks.useList({ pagination: { page: 1, limit: 10 } });
  const createMutation = userHooks.useCreate();
  // ...
}
```

---

## 📖 Further Reading

- [ORPC Documentation](https://orpc.dev)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Zod Documentation](https://zod.dev)
- [Project Architecture](../../../README.md)
