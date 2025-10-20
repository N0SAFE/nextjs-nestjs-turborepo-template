# API Usage Examples

This document provides comprehensive examples of how to use the type-safe ORPC API in your application.

**📚 See also**: [Core Concept: ORPC Implementation Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md) for the fundamental patterns.

## Client-Side Usage (Components)

### Using Query Hooks with `orpc`

```typescript
// In a client component
'use client';

import { orpc } from '@/lib/api';

export function UserProfile() {
  const { data, isLoading, error } = orpc.users.getProfile.useQuery();
  
  if (isLoading) {
    return <div>Loading profile...</div>;
  }
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <div>
      <h1>{data?.name}</h1>
      <p>{data?.email}</p>
    </div>
  );
}
```

### Using Mutations with `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function UpdateProfileForm() {
  const updateProfile = orpc.users.updateProfile.useMutation({
    onSuccess: () => {
      // Refetch profile data after successful update
      orpc.users.getProfile.invalidate();
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateProfile.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? 'Updating...' : 'Update Profile'}
      </button>
      {updateProfile.error && <p>{updateProfile.error.message}</p>}
    </form>
  );
}
```

### Query Invalidation with `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function UserListWithRefresh() {
  const { data: users } = orpc.users.listUsers.useQuery();

  const handleRefresh = () => {
    // Invalidate and refetch
    orpc.users.listUsers.invalidate();
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Users</button>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Prefetching Data with `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function UserPreview({ userId }: { userId: string }) {
  const handleMouseEnter = async () => {
    // Prefetch user data on hover
    await orpc.users.getUser.query({ id: userId });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      User Preview
    </div>
  );
}
```

## Server-Side Usage

### In Server Components

```typescript
## Server-Side Usage with `orpcClient`

### In Server Components

```typescript
// In a server component (must use orpcClient, not orpc)
import { orpcClient } from '@/lib/api';

export async function ServerUserProfile() {
  const profile = await orpcClient.users.getProfile();

  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
    </div>
  );
}
```

### In Server Actions

```typescript
'use server';

import { orpcClient } from '@/lib/api';

export async function updateUserAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  try {
    const result = await orpcClient.users.updateProfile({
      name,
      email,
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

### With Authentication

```typescript
import { auth } from '@/lib/auth';
import { orpcClient } from '@/lib/api';

export async function ProtectedServerComponent() {
  const session = await auth();

  if (!session) {
    return <div>Not authenticated</div>;
  }

  const userProfile = await orpcClient.users.getProfile();

  return (
    <div>
      <p>Welcome, {userProfile.name}</p>
      <p>User ID: {session.user.id}</p>
    </div>
  );
}
```
```

### In Server Actions

```typescript
'use server';

import { orpcClient } from '@/lib/orpc-client';

export async function updateUserAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  try {
    const result = await orpcClient.users.updateProfile({
      name,
      email,
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

### With Authentication

```typescript
import { auth } from '@/lib/auth';
import { orpcClient } from '@/lib/orpc-client';

export async function ProtectedServerComponent() {
  const session = await auth();

  if (!session) {
    return <div>Not authenticated</div>;
  }

  const userProfile = await orpcClient.users.getProfile();

  return (
    <div>
      <p>Welcome, {userProfile.name}</p>
      <p>User ID: {session.user.id}</p>
    </div>
  );
}
```

## Error Handling

## Error Handling

### Client-Side Error Handling with `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function UserForm() {
  const updateProfile = orpc.users.updateProfile.useMutation({
    onError: (error) => {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          console.error('Validation error:', error);
        } else if (error.message.includes('unauthorized')) {
          console.error('Unauthorized:', error);
        } else {
          console.error('Unknown error:', error);
        }
      }
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const data = new FormData(e.currentTarget);
          updateProfile.mutate({
            name: data.get('name') as string,
          });
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }}
    >
      {/* Form fields */}
    </form>
  );
}
```

### Server-Side Error Handling

```typescript
'use server';

import { orpcClient } from '@/lib/api';

export async function handleUserUpdate(formData: FormData) {
  try {
    const result = await orpcClient.users.updateProfile({
      name: formData.get('name') as string,
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}
```

### Server-Side Error Handling

```typescript
'use server';

import { orpcClient } from '@/lib/orpc-client';

export async function handleUserUpdate(formData: FormData) {
  try {
    const result = await orpcClient.users.updateProfile({
      name: formData.get('name') as string,
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}
```

## Type Safety Examples

### Using Inferred Types from `orpc`

```typescript
// Types are automatically inferred from the API response
const { data } = orpc.users.getProfile.useQuery();

// data is typed as { id: string; name: string; email: string; }
console.log(data?.name); // TypeScript knows this is a string
console.log(data?.unknown); // TypeScript error: property doesn't exist
```

### Request Parameter Type Safety with `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function UserDetail({ userId }: { userId: string }) {
  // Parameters are type-checked
  const { data } = orpc.users.getUser.useQuery({
    id: userId,
    // includeRelated: true, // TypeScript error if this param doesn't exist
  });

  return <div>{data?.name}</div>;
}
```

### Mutation Input Type Safety with `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function UpdateForm() {
  const updateProfile = orpc.users.updateProfile.useMutation();

  const handleUpdate = () => {
    updateProfile.mutate({
      name: 'John Doe',
      email: 'john@example.com',
      // age: 30, // TypeScript error if this field doesn't exist
    });
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

## Pagination Example

```typescript
'use client';

import { useState } from 'react';
import { orpc } from '@/lib/api';

export function UserList() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = orpc.users.listUsers.useQuery({
    page,
    pageSize,
  });

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <ul>
            {data?.users.map((user) => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
          <div>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.hasMore}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

## Infinite Query Example

```typescript
'use client';

import { orpc } from '@/lib/api';
import { useInfiniteQuery } from '@tanstack/react-query';

export function InfiniteUserList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['users', 'infinite'],
      queryFn: async ({ pageParam = 1 }) => {
        return orpc.users.listUsers.query({
          page: pageParam,
          pageSize: 10,
        });
      },
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.hasMore) {
          return pages.length + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
    });

  return (
    <div>
      {data?.pages.map((page) =>
        page.users.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))
      )}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading more...' : 'Load More'}
      </button>
    </div>
  );
}
```

## Real-World Scenarios

### Shopping Cart Update with `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function ShoppingCart() {
  const addToCart = orpc.cart.addItem.useMutation({
    onSuccess: () => {
      // Refetch cart after adding item
      orpc.cart.getCart.invalidate();
    },
  });

  const updateQuantity = orpc.cart.updateQuantity.useMutation({
    onSuccess: () => {
      orpc.cart.getCart.invalidate();
    },
  });

  const { data: cart } = orpc.cart.getCart.useQuery();

  return (
    <div>
      {cart?.items.map((item) => (
        <div key={item.id}>
          <p>{item.name}</p>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              updateQuantity.mutate({
                itemId: item.id,
                quantity: parseInt(e.target.value),
              });
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

### Form with Async Validation using `orpc`

```typescript
'use client';

import { orpc } from '@/lib/api';

export function RegistrationForm() {
  const registerUser = orpc.auth.register.useMutation();
  const checkEmail = orpc.auth.checkEmailAvailable.useQuery(
    { email: '' },
    { enabled: false }
  );

  const handleEmailChange = async (email: string) => {
    // Only check if email looks valid
    if (email.includes('@')) {
      const result = await checkEmail.refetch();
      if (!result.data?.available) {
        console.error('Email already in use');
      }
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        registerUser.mutate({
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        });
      }}
    >
      {/* Form fields */}
    </form>
  );
}
```

## Best Practices

1. **Use Server Components for Initial Data**: Fetch initial data in server components for better performance
2. **Invalidate on Mutations**: Always invalidate related queries after mutations
3. **Handle Loading States**: Provide visual feedback during data fetching
4. **Error Boundaries**: Wrap components with error boundaries for error handling
5. **Type Inference**: Let TypeScript infer types - don't manually specify types for API responses
6. **Separation of Concerns**: Keep API logic separate from component logic when possible
