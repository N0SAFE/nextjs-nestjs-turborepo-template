📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > TypeScript Type Manipulation Pattern

# TypeScript Type Manipulation Pattern

> **Type**: Core Concept - Type System  
> **Priority**: 🟡 IMPORTANT  
> **Last Updated**: 2025-10-14

## Overview

This project emphasizes TypeScript's type inference capabilities to reduce duplication and maintain single source of truth.

## Core Principle

**⚠️ Prefer type inference over manual type definitions**

## Type Definition Hierarchy

1. **Contracts** (Source of Truth): `packages/contracts/api/index.ts`
2. **Inferred Types**: Extract from contracts using TypeScript utilities
3. **Custom Types**: Only when inference + logic is needed

## ✅ CORRECT: Infer from Contracts

```typescript
// packages/contracts/api/index.ts
export const projectContract = router({
  getById: procedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ 
      id: z.string(), 
      name: z.string(),
      description: z.string().nullable(),
    }))
    .query(),
});

// apps/api/src/modules/project/interfaces/project.types.ts
import type { projectContract } from '@repo/api-contracts';

// ✅ Extract type from contract (single source of truth)
export type ProjectContract = typeof projectContract.getById.output;

// ✅ Infer from database schema
import { projects } from '@/config/drizzle/schema';
export type Project = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
```

## ❌ WRONG: Manual Type Duplication

```typescript
// ❌ Manually redefining contract type
export interface ProjectContract {
  id: string;
  name: string;
  description: string | null;
}
```

## Built-in Utility Types

Use these extensively:

```typescript
// Extract from contracts
type Input = typeof contract.endpoint.input;
type Output = typeof contract.endpoint.output;

// Standard utilities
type Partial<T>        // Make all properties optional
type Required<T>       // Make all properties required
type Pick<T, K>        // Select specific properties
type Omit<T, K>        // Exclude specific properties
type ReturnType<T>     // Extract return type from function
type Parameters<T>     // Extract parameter types from function
type Awaited<T>        // Unwrap Promise type
type NonNullable<T>    // Remove null/undefined

// Example usage
type CreateProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
type ProjectUpdate = Partial<Pick<Project, 'name' | 'description'>>;
```

## When to Create Interface Files

### ✅ Create Interface File When

- Type involves contract extraction + custom logic
- Type combines multiple sources (contract + database + custom)
- Type is reused across multiple files in the module

### ❌ DON'T Create Interface File When

- Type is pure inference (just `typeof` or `ReturnType`)
- Type is used in only one file (define inline)
- Type is simple utility type combination

## Location Rules

- **Module-specific types**: `apps/api/src/modules/[feature]/interfaces/[feature].types.ts`
- **Reusable generic types**: `apps/api/src/core/interfaces/[concept].ts`
- **Contract type extractions**: In module interfaces if used by multiple files

## Examples

### ✅ Interface File with Custom Logic

```typescript
// apps/api/src/modules/project/interfaces/project.types.ts
import type { projectContract } from '@repo/api-contracts';
import type { projects } from '@/config/drizzle/schema';

// Contract type extraction
export type ProjectContract = typeof projectContract.getById.output;
export type ProjectListContract = typeof projectContract.list.output;

// Database entity inference
export type Project = typeof projects.$inferSelect;

// Custom type with business logic
export interface ProjectWithStats extends Project {
  deploymentCount: number;
  lastDeploymentAt: Date | null;
  status: 'active' | 'paused' | 'archived';
}
```

### ✅ Inline Inference

```typescript
// apps/api/src/modules/project/adapters/project-adapter.service.ts
import type { projectContract } from '@repo/api-contracts';

@Injectable()
export class ProjectAdapter {
  // ✅ Inline type extraction (used only here)
  adaptToContract(
    project: typeof projects.$inferSelect
  ): typeof projectContract.getById.output {
    return { ... };
  }
}
```

### ✅ Generic Type in Core

```typescript
// apps/api/src/core/interfaces/pagination.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Used across multiple modules: projects, deployments, environments
```

## Type Import Conventions

```typescript
// ✅ Use type-only imports when possible
import type { ProjectContract } from '../interfaces/project.types';
import type { projects } from '@/config/drizzle/schema';

// ✅ Extract inline for simple cases
type Project = typeof projects.$inferSelect;

// ✅ Use typeof for contract extraction
type Output = typeof projectContract.getById.output;
```

## Enforcement

This pattern is **RECOMMENDED** for type consistency and avoiding duplication.

## Related Core Concepts

- [Service-Adapter Pattern](./02-SERVICE-ADAPTER-PATTERN.md) - Uses contract types in adapters
- [ORPC Implementation Pattern](./09-ORPC-IMPLEMENTATION-PATTERN.md) - Contract-first development
