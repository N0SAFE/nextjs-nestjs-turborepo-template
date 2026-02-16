📍 [Documentation Hub](../README.md) > [Features](./README.md) > ORPC Type-Safe Contracts

# ORPC Type-Safe Contracts

> Reference for the Docker-first SaaS template using ORPC between NestJS API and Next.js web, with generated React Query hooks.

This document explains how to work with ORPC contracts for type-safe API communication between the NestJS backend and Next.js frontend.

## Overview

ORPC (OpenAPI RPC) provides end-to-end type safety by sharing contract definitions between the API and client. Unlike traditional REST APIs, changes to the API are immediately reflected in TypeScript types.

## Contract Structure

API contracts are defined in `packages/contracts/api/index.ts` (workspace package name: `@repo/api-contracts`):

```typescript
import { oc } from '@orpc/contract';
import { userContract, healthContract } from './modules';

export const appContract = oc.router({
  user: userContract,
  health: healthContract,
});
```

## API Implementation

In the NestJS API (`apps/api/src/`), implement contracts with `@Implement(...)`:

```typescript
import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { userContract } from '@repo/api-contracts';

@Controller()
export class UserController {
  @Implement(userContract.findById)
  findById() {
    return implement(userContract.findById).handler(async ({ input }) => {
      return { id: input.params.id };
    });
  }
}
```

## Frontend Usage

In the Next.js app, consume endpoints through `@/lib/orpc` and domain hooks:

```typescript
import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';

function UserProfile({ id }: { id: string }) {
  const { data } = useQuery(
    orpc.user.findById.queryOptions({ input: { params: { id } } })
  );
  return <div>{data?.id}</div>;
}

async function ServerProfile(id: string) {
  const profile = await orpc.user.findById.call({ params: { id } });
  return <div>{profile?.id}</div>;
}
```

## Generating Client Code

After updating contracts, regenerate web artifacts:

```bash
bun run web -- generate
```

This command updates generated web client artifacts (including route/OpenAPI related outputs where configured).

## Development Workflow

1. **Define Contract**: Add or modify contracts in `packages/contracts/api/`
2. **Implement API**: Create corresponding endpoints in `apps/api/src/`
3. **Generate Client**: Run `bun run web -- generate`
4. **Use in Frontend**: Consume via `@/lib/orpc` and domain hooks

## Type Safety Benefits

- **Compile-time Errors**: TypeScript catches API mismatches immediately
- **Auto-completion**: Full IntelliSense for API responses
- **Refactoring Safety**: Renaming fields updates all usages automatically
- **Documentation**: Self-documenting through TypeScript types

## Common Patterns

### Error Handling
```typescript
const { data, error } = useQuery(orpc.user.findById.queryOptions({ input: { params: { id: '1' } } }));

if (error) {
  // Error is typed based on contract
  console.error(error.message);
}
```

### Mutations
```typescript
const updateProfile = useMutation(orpc.user.update.mutationOptions({
  onSuccess: () => {
    // Invalidate related queries in your domain invalidation layer
  },
}));
```

### Server Actions
```typescript
import { orpc } from '@/lib/orpc';

async function updateUserAction(formData: FormData) {
  'use server';
  
  const result = await orpc.user.update.call({
    id: String(formData.get('id')),
    name: String(formData.get('name')),
  });
  
  return result;
}
```

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

## Best Practices

1. **Keep Contracts Simple**: Use clear, descriptive names
2. **Version Carefully**: Breaking changes require careful migration
3. **Document Complex Types**: Add JSDoc comments to schemas
4. **Test Contracts**: Write tests for both API and client usage
5. **Consistent Naming**: Follow consistent patterns across contracts

## Migration from REST/GraphQL

When migrating existing APIs:

1. Define ORPC contracts for existing endpoints
2. Implement contracts in NestJS controllers
3. Replace frontend API calls with ORPC hooks
4. Remove old API client code
5. Update tests to use new contracts

This provides immediate type safety while maintaining familiar REST-like patterns.
