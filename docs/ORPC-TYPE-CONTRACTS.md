# ORPC Type-Safe API Contracts

> Reference for the Docker-first SaaS template using ORPC between NestJS API and Next.js web, with generated React Query hooks.

This document explains how to work with ORPC contracts for type-safe API communication between the NestJS backend and Next.js frontend.

## Overview

ORPC (OpenAPI RPC) provides end-to-end type safety by sharing contract definitions between the API and client. Unlike traditional REST APIs, changes to the API are immediately reflected in TypeScript types.

## Contract Structure

API contracts are defined in `packages/api-contracts/index.ts`:

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
});
```

## API Implementation

In the NestJS API (`apps/api/src/`), implement the contracts:

```typescript
import { Controller, Get } from '@nestjs/common';
import { userContract } from '@repo/api-contracts';

@Controller('users')
export class UsersController {
  @Get('profile')
  async getProfile() {
    // Implementation matches contract
    return {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
    };
  }
}
```

## Frontend Usage

In the Next.js app, use generated hooks:

```typescript
// Client components
import { api } from '@/lib/api';

function ProfileComponent() {
  const { data, isLoading, error } = api.users.getProfile.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Hello, {data?.name}!</div>;
}

// Server components
import { orpcClient } from '@/lib/orpc-client';

async function ServerProfile() {
  const profile = await orpcClient.users.getProfile();
  return <div>Hello, {profile.name}!</div>;
}
```

## Generating Client Code

After updating contracts, regenerate the client:

```bash
bun run web -- generate
```

This command:
1. Reads contracts from `packages/api-contracts/`
2. Generates React Query hooks
3. Creates type-safe client methods
4. Updates OpenAPI documentation

## Development Workflow

1. **Define Contract**: Add or modify contracts in `packages/api-contracts/`
2. **Implement API**: Create corresponding endpoints in `apps/api/src/`
3. **Generate Client**: Run `bun run web -- generate`
4. **Use in Frontend**: Import and use the generated hooks/clients

## Type Safety Benefits

- **Compile-time Errors**: TypeScript catches API mismatches immediately
- **Auto-completion**: Full IntelliSense for API responses
- **Refactoring Safety**: Renaming fields updates all usages automatically
- **Documentation**: Self-documenting through TypeScript types

## Common Patterns

### Error Handling
```typescript
const { data, error } = api.users.getProfile.useQuery();

if (error) {
  // Error is typed based on contract
  console.error(error.message);
}
```

### Mutations
```typescript
const updateProfile = api.users.updateProfile.useMutation({
  onSuccess: () => {
    // Refetch profile data
    api.users.getProfile.invalidate();
  },
});
```

### Server Actions
```typescript
import { orpcClient } from '@/lib/orpc-client';

async function updateUserAction(formData: FormData) {
  'use server';
  
  const result = await orpcClient.users.updateProfile({
    name: formData.get('name') as string,
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
