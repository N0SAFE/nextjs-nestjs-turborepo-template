# ORPC Client Hooks Pattern

> **Type**: Core Concept - API Client Pattern  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-10-21

## Overview

When consuming ORPC APIs in Next.js client components, **always create custom React Query hooks** that wrap ORPC operations. Never use ORPC directly in components. This pattern ensures:

- **Type Safety**: Full end-to-end TypeScript inference from API contracts
- **Cache Management**: Centralized React Query configuration and invalidation
- **Reusability**: Hooks are composable and reusable across components
- **Performance**: Built-in prefetching, infinite queries, and stale-while-revalidate
- **Consistency**: Uniform error handling, loading states, and success feedback

## Core Principle

### ❌ INCORRECT - Direct ORPC in Component
```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'

export function UserList() {
  // DON'T DO THIS - Direct ORPC usage
  const { data: users } = useQuery(orpc.user.list.queryOptions({
    input: { pagination: { limit: 10, offset: 0 } }
  }))
  
  return <div>{users?.length || 0} users</div>
}
```

### ✅ CORRECT - Custom Hook Layer
```tsx
'use client'

import { useUsers } from '@/hooks/useUsers'

export function UserList() {
  // Use the custom hook instead
  const { data } = useUsers({ pagination: { pageSize: 10 } })
  
  return <div>{data?.users?.length || 0} users</div>
}
```

## Hook Organization

Hooks must be organized by domain and placed in `apps/web/src/hooks/`:

```
apps/web/src/hooks/
├── index.ts                          # Export all hooks
├── useUsers.ts                       # User domain hooks
├── useProjects.ts                    # Project domain hooks
├── useSettings.ts                    # Settings domain hooks
└── ...
```

Each domain file exports:
- **Query Hooks**: `useUsers()`, `useUser()`, `useUserCount()`
- **Mutation Hooks**: `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`
- **Utility Hooks**: `useUserActions()`, `useUserProfile()`, `useUserAdministration()`
- **Helper Functions**: `getUsers()`, `prefetchUsers()`, `invalidateUsersCache()`
- **Type Exports**: `UserData`, `UserList`, `UserActions`

## Pattern Structure

### 1. Query Hooks (Read Operations)

Query hooks wrap ORPC `queryOptions()` with React Query configuration:

```typescript
export function useUsers(options?: {
  pagination?: { page?: number; pageSize?: number }
  sort?: { field?: keyof User; direction?: 'asc' | 'desc' }
  filter?: Partial<Pick<User, 'id' | 'email' | 'name'>>
  enabled?: boolean
}) {
  const params = {
    pagination: {
      page: options?.pagination?.page || 1,
      pageSize: options?.pagination?.pageSize || 20,
    },
    sort: {
      field: (options?.sort?.field || 'name') as keyof User,
      direction: options?.sort?.direction || 'asc' as const,
    },
    filter: options?.filter,
  }

  return useQuery(orpc.user.list.queryOptions({
    input: params,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60,        // 1 minute - data freshness
    gcTime: 1000 * 60 * 5,       // 5 minutes - cache retention
  }))
}

export function useUser(userId: string, options?: { enabled?: boolean }) {
  return useQuery(orpc.user.findById.queryOptions({
    input: { id: userId },
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  }))
}

export function useUserCount(options?: { enabled?: boolean }) {
  return useQuery(orpc.user.count.queryOptions({
    input: {},
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2,    // 2 minutes
    gcTime: 1000 * 60 * 10,      // 10 minutes
  }))
}
```

**Key Features:**
- `enabled` option for conditional queries
- Appropriate `staleTime` for each query (depends on data volatility)
- `gcTime` for cache retention
- Type-safe input parameters inferred from contracts

### 2. Mutation Hooks (Write Operations)

Mutation hooks wrap ORPC `mutationOptions()` with cache invalidation:

```typescript
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation(orpc.user.create.mutationOptions({
    onSuccess: (newUser) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.list.queryKey({ 
          input: { /* match your default params */ }
        })
      })
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.count.queryKey({ input: {} })
      })
      
      // User feedback
      toast.success(`User "${newUser.name}" created successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`)
    },
  }))
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation(orpc.user.update.mutationOptions({
    onSuccess: (updatedUser, variables) => {
      // Invalidate the specific user query
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.findById.queryKey({ input: { id: variables.id } }) 
      })
      // Invalidate list cache (user may affect sort order)
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.list.queryKey({ input: {} }) 
      })
      
      toast.success(`User "${updatedUser.name}" updated successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`)
    },
  }))
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation(orpc.user.delete.mutationOptions({
    onSuccess: (_, variables) => {
      // Remove from specific cache
      queryClient.removeQueries({ 
        queryKey: orpc.user.findById.queryKey({ input: { id: variables.id } }) 
      })
      // Invalidate list cache
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.list.queryKey({ input: {} }) 
      })
      // Invalidate counts
      queryClient.invalidateQueries({ 
        queryKey: orpc.user.count.queryKey({ input: {} })
      })
      
      toast.success('User deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`)
    },
  }))
}
```

**Key Features:**
- Centralized cache invalidation strategy
- Consistent error and success handling
- Query key management via ORPC's built-in helpers
- Typed mutation parameters and responses

### 3. Utility Hooks (Composed Functionality)

Composite hooks that combine multiple queries/mutations for common use cases:

```typescript
export function useUserActions() {
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  return {
    // Convenience methods
    createUser: createUser.mutate,
    createUserAsync: createUser.mutateAsync,
    updateUser: updateUser.mutate,
    updateUserAsync: updateUser.mutateAsync,
    deleteUser: deleteUser.mutate,
    deleteUserAsync: deleteUser.mutateAsync,
    
    // Grouped loading states
    isLoading: {
      create: createUser.isPending,
      update: updateUser.isPending,
      delete: deleteUser.isPending,
    },
    
    // Grouped error states
    errors: {
      create: createUser.error,
      update: updateUser.error,
      delete: deleteUser.error,
    },
  }
}

export function useUserAdministration(options?: {
  pageSize?: number
  autoRefresh?: boolean
}) {
  const users = useUsers({ pagination: { pageSize: options?.pageSize || 25 } })
  const userCount = useUserCount()
  const userActions = useUserActions()

  return {
    // Query data
    users: users.data?.users || [],
    totalUsers: userCount.data?.count || 0,
    
    // Loading states
    isLoading: users.isLoading || userCount.isLoading,
    isRefreshing: users.isFetching,
    
    // Error states
    error: users.error || userCount.error,
    
    // Actions combined
    ...userActions,
    
    // Refresh function
    refresh: () => {
      users.refetch()
      userCount.refetch()
    },
  }
}
```

### 4. Direct Functions (Non-Hook Usage)

For use in server components or outside React:

```typescript
/**
 * Direct async function for fetching users
 * Used in server components, server actions, or non-React code
 */
export async function getUsers(params: {
  pagination?: { page?: number; pageSize?: number }
  sort?: { field?: string; direction?: 'asc' | 'desc' }
  filter?: Record<string, unknown>
} = {}) {
  return orpc.user.list.call({
    pagination: params.pagination || { page: 1, pageSize: 20 },
    sort: params.sort || { field: 'name', direction: 'asc' },
    filter: params.filter,
  })
}

/**
 * Direct async function for fetching a single user
 */
export async function getUser(userId: string) {
  return orpc.user.findById.call({ id: userId })
}

/**
 * Direct async function for user count
 */
export async function getUserCount() {
  return orpc.user.count.call({})
}
```

### 5. Prefetch Functions

Pre-load data to improve perceived performance:

```typescript
export function usePrefetchUsers(
  queryClient: ReturnType<typeof useQueryClient>,
  params?: {
    pagination?: { page?: number; pageSize?: number }
    sort?: { field?: keyof User; direction?: 'asc' | 'desc' }
  }
) {
  return queryClient.prefetchQuery(
    orpc.user.list.queryOptions({
      input: {
        pagination: params?.pagination || { page: 1, pageSize: 20 },
        sort: params?.sort || { field: 'name', direction: 'asc' },
      },
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  )
}

export function usePrefetchUser(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string
) {
  return queryClient.prefetchQuery(
    orpc.user.findById.queryOptions({
      input: { id: userId },
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  )
}

// Usage in components
export function UserListWithPrefetch() {
  const queryClient = useQueryClient()
  const { data } = useUsers()
  
  // Prefetch next page on scroll
  const prefetchNextPage = () => {
    usePrefetchUsers(queryClient, { 
      pagination: { page: 2, pageSize: 20 } 
    })
  }
  
  return (
    <div onScroll={prefetchNextPage}>
      {data?.users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### 6. Infinite Query Hooks

For pagination patterns (scroll-based loading):

```typescript
export function useUsersInfinite(options?: {
  pageSize?: number
  sort?: { field?: keyof User; direction?: 'asc' | 'desc' }
  filter?: Partial<Pick<User, 'id' | 'email' | 'name'>>
}) {
  return useInfiniteQuery(
    orpc.user.list.infiniteQueryOptions({
      input: (context) => ({
        pagination: {
          page: (context?.pageParam || 1),
          pageSize: options?.pageSize || 20,
        },
        sort: options?.sort || { field: 'name', direction: 'asc' },
        filter: options?.filter,
      }),
      getNextPageParam: (lastPage, _, lastPageParam) => {
        // Determine if there are more pages
        if (!lastPage.meta?.pagination?.hasMore) {
          return undefined
        }
        return (lastPageParam as number) + 1
      },
      getPreviousPageParam: (_, __, firstPageParam) => {
        // Allow going back if not on first page
        if (firstPageParam === 1) {
          return undefined
        }
        return (firstPageParam as number) - 1
      },
      initialPageParam: 1,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  )
}

// Usage in component
export function InfiniteUserList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    useUsersInfinite({ pageSize: 20 })
  
  const users = data?.pages.flatMap(page => page.users) || []
  
  return (
    <InfiniteScroll
      dataLength={users.length}
      next={fetchNextPage}
      hasMore={hasNextPage || false}
      loader={<Spinner />}
    >
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </InfiniteScroll>
  )
}
```

## Cache Invalidation Strategy

### Query Keys Hierarchy

```typescript
// ORPC provides query keys automatically:
orpc.user.list.queryKey(input)        // [['user.list', input]]
orpc.user.findById.queryKey(input)    // [['user.findById', input]]
orpc.user.count.queryKey(input)       // [['user.count', input]]

// Invalidate all user-related queries
queryClient.invalidateQueries({ 
  queryKey: ['user'] 
})

// Invalidate only user list queries
queryClient.invalidateQueries({ 
  queryKey: orpc.user.list.queryKey({ input: {} }) 
})

// Remove specific user from cache
queryClient.removeQueries({ 
  queryKey: orpc.user.findById.queryKey({ input: { id: userId } }) 
})
```

### Invalidation Patterns

**After Create:**
```typescript
// Invalidate list and count (new user added)
queryClient.invalidateQueries({ queryKey: ['user', 'list'] })
queryClient.invalidateQueries({ queryKey: ['user', 'count'] })
```

**After Update:**
```typescript
// Invalidate specific user and list (sort may change)
queryClient.invalidateQueries({ queryKey: ['user', 'findById'] })
queryClient.invalidateQueries({ queryKey: ['user', 'list'] })
```

**After Delete:**
```typescript
// Remove from cache and invalidate list/count
queryClient.removeQueries({ queryKey: ['user', 'findById'] })
queryClient.invalidateQueries({ queryKey: ['user', 'list'] })
queryClient.invalidateQueries({ queryKey: ['user', 'count'] })
```

## SDK Integration

### Better Auth Client

When dealing with authentication, **always use Better Auth's client SDK** instead of custom ORPC hooks:

```typescript
// ❌ DON'T: Don't create custom hooks for auth
export function useAuthMe() {
  return useQuery(orpc.auth.me.queryOptions({ input: {} }))
}

// ✅ DO: Use Better Auth's client SDK
import { useSession } from '@better-auth/react'

export function useCurrentUser() {
  const { data: session } = useSession()
  return session?.user
}

// Or for server components
import { auth } from '@/lib/auth'

async function getCurrentUser() {
  const session = await auth()
  return session?.user
}
```

### Domain-Specific ORPC Clients

For other domains, always create domain hooks that use ORPC:

```typescript
// ✅ DO: Create domain-specific hooks for non-auth APIs
export function useProjects() {
  return useQuery(orpc.project.list.queryOptions({ input: {} }))
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation(orpc.project.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', 'list'] })
    }
  }))
}
```

## Type Safety

### Infer Types from Contracts

```typescript
import type { z } from 'zod'
import type { userSchema } from '@repo/api-contracts/common/user'

// Infer User type from API contract schema
type User = z.infer<typeof userSchema>

// Export for component usage
export type UserData = User
export type UserList = ReturnType<typeof useUsers>
export type UserActions = ReturnType<typeof useUserActions>
```

### Component Usage

```tsx
import type { UserData, UserActions } from '@/hooks/useUsers'
import { useUserActions } from '@/hooks/useUsers'

interface UserFormProps {
  user?: UserData
  onSubmit: (user: UserData) => Promise<void>
}

export function UserForm({ user, onSubmit }: UserFormProps) {
  const { createUser, updateUser } = useUserActions()
  
  // Full type safety
  const handleSubmit = (data: UserData) => {
    if (user?.id) {
      updateUser({ ...data, id: user.id })
    } else {
      createUser(data)
    }
  }
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit({ /* data */ } as UserData)
    }}>
      {/* Form fields */}
    </form>
  )
}
```

## Best Practices

### ✅ DO

1. **Create dedicated hooks** for each ORPC operation
2. **Organize by domain** (users, projects, settings, etc.)
3. **Use React Query's options** (`staleTime`, `gcTime`, `enabled`)
4. **Centralize cache invalidation** in mutation hooks
5. **Export utility functions** for server components
6. **Provide type exports** for components
7. **Group related hooks** in composite utilities
8. **Use prefetch** for anticipated user interactions
9. **Implement infinite queries** for scroll-based pagination
10. **Add proper error handling** with user feedback (toast notifications)

### ❌ DON'T

1. **Use ORPC directly in components** - always create a hook layer
2. **Scatter cache invalidation** logic across components
3. **Use generic/reusable hooks** - create domain-specific ones
4. **Forget to enable/disable queries** conditionally
5. **Use inappropriate `staleTime`** values (should match data volatility)
6. **Ignore `gcTime`** settings (impacts memory usage)
7. **Mix auth SDK with custom hooks** - use Better Auth client for session
8. **Skip type exports** - provide types for component usage
9. **Create server-side hooks** - use direct async functions instead
10. **Implement cache invalidation on client only** - it's permanent for session

## Testing

### Hook Testing Example

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUsers } from '@/hooks/useUsers'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

test('useUsers fetches users successfully', async () => {
  const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() })
  
  expect(result.current.isLoading).toBe(true)
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })
  
  expect(result.current.data?.users).toBeDefined()
})
```

---

# Practical Usage Examples

This section provides real-world examples of using the ORPC Client Hooks Pattern in your Next.js application.

## Basic Query Usage

### Simple Data Fetching

```tsx
'use client'

import { useUsers } from '@/hooks/useUsers'

export function UsersList() {
  const { data, isLoading, error } = useUsers({
    pagination: { pageSize: 10 }
  })

  if (isLoading) return <div>Loading users...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### With Filtering and Sorting

```tsx
'use client'

import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'

export function SearchableUsersList() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'email'>('name')

  const { data, isLoading } = useUsers({
    pagination: { pageSize: 20 },
    filter: search ? { name: search, email: search } : undefined,
    sort: { field: sortBy, direction: 'asc' }
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
        <option value="name">Sort by Name</option>
        <option value="email">Sort by Email</option>
      </select>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {data?.users?.map(user => (
            <li key={user.id}>
              <strong>{user.name}</strong> ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Conditional Queries

```tsx
'use client'

import { useUser } from '@/hooks/useUsers'

interface UserDetailProps {
  userId?: string
}

export function UserDetail({ userId }: UserDetailProps) {
  // Query is only enabled when userId is provided
  const { data: user, isLoading } = useUser(userId || '', {
    enabled: !!userId
  })

  if (!userId) {
    return <div>Select a user to view details</div>
  }

  if (isLoading) {
    return <div>Loading user...</div>
  }

  if (!user) {
    return <div>User not found</div>
  }

  return (
    <div>
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>ID: {user.id}</p>
    </div>
  )
}
```

## Mutation Usage

### Create User

```tsx
'use client'

import { useState } from 'react'
import { useCreateUser } from '@/hooks/useUsers'

export function CreateUserForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  
  const { mutate: createUser, isPending } = useCreateUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createUser(
      { name, email },
      {
        onSuccess: () => {
          setName('')
          setEmail('')
        }
      }
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

### Update User

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useUser, useUpdateUser } from '@/hooks/useUsers'
import type { UserData } from '@/hooks/useUsers'

interface EditUserProps {
  userId: string
}

export function EditUserForm({ userId }: EditUserProps) {
  const { data: user, isLoading } = useUser(userId)
  const { mutate: updateUser, isPending } = useUpdateUser()
  
  const [formData, setFormData] = useState<Partial<UserData>>({})

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData(user)
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUser({ ...formData, id: userId } as UserData)
  }

  if (isLoading) return <div>Loading user...</div>

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name || ''}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="email"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Updating...' : 'Update User'}
      </button>
    </form>
  )
}
```

### Delete User with Confirmation

```tsx
'use client'

import { useDeleteUser } from '@/hooks/useUsers'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DeleteUserButtonProps {
  userId: string
  userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const { mutate: deleteUser, isPending } = useDeleteUser()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button variant="destructive">Delete</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete User</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete {userName}? This action cannot be undone.
        </AlertDialogDescription>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => deleteUser({ id: userId })}
          disabled={isPending}
        >
          {isPending ? 'Deleting...' : 'Delete'}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

## Composite Hooks

### Using useUserActions

```tsx
'use client'

import { useUserActions } from '@/hooks/useUsers'

export function UserManagementPanel() {
  const {
    createUser,
    updateUser,
    deleteUser,
    isLoading,
    errors,
  } = useUserActions()

  return (
    <div>
      <button
        onClick={() => createUser({ name: 'John', email: 'john@example.com' })}
        disabled={isLoading.create}
      >
        Create User
      </button>
      {errors.create && <p style={{ color: 'red' }}>{errors.create.message}</p>}

      <button
        onClick={() => updateUser({ id: '1', name: 'Jane' })}
        disabled={isLoading.update}
      >
        Update User
      </button>
      {errors.update && <p style={{ color: 'red' }}>{errors.update.message}</p>}

      <button
        onClick={() => deleteUser({ id: '1' })}
        disabled={isLoading.delete}
      >
        Delete User
      </button>
      {errors.delete && <p style={{ color: 'red' }}>{errors.delete.message}</p>}
    </div>
  )
}
```

### Using useUserAdministration

```tsx
'use client'

import { useUserAdministration } from '@/hooks/useUsers'
import { DeleteUserButton } from './DeleteUserButton'

export function AdminDashboard() {
  const {
    users,
    totalUsers,
    isLoading,
    pagination,
    createUser,
    deleteUser,
    refresh
  } = useUserAdministration({
    pageSize: 25
  })

  return (
    <div>
      <h2>User Administration</h2>
      <p>Total Users: {totalUsers}</p>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <DeleteUserButton userId={user.id} userName={user.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <p>
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <button onClick={refresh}>Refresh</button>
          </div>
        </>
      )}
    </div>
  )
}
```

## Prefetching

### Prefetch on Hover

```tsx
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePrefetchUser } from '@/hooks/useUsers'

interface UserLinkProps {
  userId: string
  name: string
}

export function UserLink({ userId, name }: UserLinkProps) {
  const queryClient = useQueryClient()

  const handleMouseEnter = () => {
    // Prefetch user data when hovering over the link
    usePrefetchUser(queryClient, userId)
  }

  return (
    <a href={`/users/${userId}`} onMouseEnter={handleMouseEnter}>
      {name}
    </a>
  )
}
```

### Prefetch Next Page

```tsx
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useUsers, usePrefetchUsers } from '@/hooks/useUsers'
import React from 'react'

export function PaginatedUsersList() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)

  const { data, isLoading } = useUsers({
    pagination: { page, pageSize: 20 }
  })

  const handleNextPage = () => {
    // Prefetch next page before user clicks
    usePrefetchUsers(queryClient, {
      pagination: { page: page + 1, pageSize: 20 }
    })
    setPage(page + 1)
  }

  return (
    <div>
      {/* User list */}
      <button onClick={handleNextPage}>
        Next Page
      </button>
    </div>
  )
}
```

## Infinite Queries

### Infinite Scroll

```tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useUsersInfinite } from '@/hooks/useUsers'

export function InfiniteUsersList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUsersInfinite({ pageSize: 20 })

  const observerTarget = useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const users = data?.pages.flatMap(page => page.users) || []

  return (
    <div>
      {users.map(user => (
        <div key={user.id} className="p-4 border-b">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}

      {isFetchingNextPage && <div>Loading more...</div>}

      <div ref={observerTarget} />
    </div>
  )
}
```

### Load More Button

```tsx
'use client'

import { useUsersInfinite } from '@/hooks/useUsers'

export function LoadMoreUsersList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUsersInfinite({ pageSize: 20 })

  const users = data?.pages.flatMap(page => page.users) || []

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

## Server Components

### Using Direct Functions

```tsx
import { getUsers, getUser } from '@/hooks/useUsers'

// This is a Server Component - no 'use client' directive
export async function UserListPage() {
  // Direct async function call (not a hook)
  const response = await getUsers({
    pagination: { pageSize: 20 },
    sort: { field: 'name', direction: 'asc' }
  })

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {response.users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Using Server Actions

```tsx
'use server'

import { getUser, getUserCount } from '@/hooks/useUsers'

export async function getUserSummary(userId: string) {
  const user = await getUser(userId)
  const count = await getUserCount()

  return {
    user,
    totalUsers: count.count,
  }
}
```

## Advanced Patterns

### Custom Hook Composition

```tsx
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useUsers, usePrefetchUsers, invalidateUserListCache } from '@/hooks/useUsers'

export function useSmartUserList() {
  const queryClient = useQueryClient()
  const { data, ...rest } = useUsers()

  return {
    users: data?.users || [],
    ...rest,

    // Prefetch next page automatically
    prefetchNextPage: () => {
      usePrefetchUsers(queryClient, {
        pagination: { page: 2, pageSize: 20 }
      })
    },

    // Force refresh all user data
    forceRefresh: () => {
      invalidateUserListCache(queryClient)
    },

    // Computed properties
    isEmpty: data?.users?.length === 0,
    count: data?.users?.length || 0,
  }
}
```

### Form Validation with Hooks

```tsx
'use client'

import { useCheckEmail } from '@/hooks/useUsers'
import { useState } from 'react'

interface UseEmailValidationProps {
  onEmailValid?: (email: string) => void
  onEmailInvalid?: (email: string) => void
}

export function useEmailValidation(props?: UseEmailValidationProps) {
  const [lastCheckedEmail, setLastCheckedEmail] = useState<string>('')
  const { mutate: checkEmail, isPending } = useCheckEmail()

  const validate = async (email: string) => {
    setLastCheckedEmail(email)
    checkEmail(
      { email },
      {
        onSuccess: () => {
          props?.onEmailValid?.(email)
        },
        onError: () => {
          props?.onEmailInvalid?.(email)
        }
      }
    )
  }

  return {
    validate,
    isValidating: isPending,
    lastCheckedEmail,
  }
}
```

### Dependent Queries

```tsx
'use client'

import { useUser, useUsers } from '@/hooks/useUsers'

interface UserWithTeamProps {
  userId: string
}

export function UserWithTeam({ userId }: UserWithTeamProps) {
  // Fetch the user
  const { data: user } = useUser(userId)

  // Dependent query - only fetch team members if we have the user
  const { data: teamMembers } = useUsers({
    filter: { teamId: user?.teamId },
    enabled: !!user?.teamId
  })

  return (
    <div>
      <h1>{user?.name}</h1>
      <h2>Team Members</h2>
      <ul>
        {teamMembers?.users?.map(member => (
          <li key={member.id}>{member.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

# Quick Reference

## Hook Quick Reference Table

### Query Hooks (Read Operations)

| Hook | Purpose | Returns | Stale Time | GC Time |
|------|---------|---------|-----------|---------|
| `useUsers()` | List with pagination/filter/sort | `{ users: [], meta: {...} }` | 1 min | 5 min |
| `useUser()` | Single user by ID | `{ id, name, email, ... }` | 1 min | 5 min |
| `useUserCount()` | User count statistics | `{ count: number }` | 2 min | 10 min |
| `useUsersInfinite()` | Infinite scroll pagination | `{ pages: [], pageInfo: {...} }` | 1 min | 5 min |

### Mutation Hooks (Write Operations)

| Hook | Action | Cache Effect | Success Feedback |
|------|--------|--------------|------------------|
| `useCreateUser()` | Create new user | Invalidate list, count | Toast message |
| `useUpdateUser()` | Update user | Invalidate user, list | Toast message |
| `useDeleteUser()` | Delete user | Remove user, invalidate list, count | Toast message |
| `useCheckEmail()` | Validate email | None (mutation only) | Error toast only |

### Composite Utility Hooks

| Hook | Combines | Use Case | Returns |
|------|----------|----------|---------|
| `useUserActions()` | All mutations | Quick access to all CRUD | `{ createUser, updateUser, deleteUser, ..., isLoading, errors }` |
| `useUserAdministration()` | List + count + actions | Admin dashboard | `{ users, totalUsers, actions, pagination, refresh }` |

### Prefetch & Direct Functions

| Function | Purpose | Type |
|----------|---------|------|
| `usePrefetchUsers()` | Pre-load user list | Hook for client |
| `usePrefetchUser()` | Pre-load single user | Hook for client |
| `getUsers()` | Server component fetch | Direct async |
| `getUser()` | Server component fetch | Direct async |

## Cache Invalidation Patterns

### After Create
```typescript
queryClient.invalidateQueries({ queryKey: ['user', 'list'] })
queryClient.invalidateQueries({ queryKey: ['user', 'count'] })
```

### After Update
```typescript
queryClient.invalidateQueries({ queryKey: ['user', 'findById'] })
queryClient.invalidateQueries({ queryKey: ['user', 'list'] })
```

### After Delete
```typescript
queryClient.removeQueries({ queryKey: ['user', 'findById'] })
queryClient.invalidateQueries({ queryKey: ['user', 'list'] })
queryClient.invalidateQueries({ queryKey: ['user', 'count'] })
```

## Common Usage Patterns

```tsx
// Basic list fetch
const { data, isLoading } = useUsers({ pagination: { pageSize: 10 } })

// With filtering
const { data } = useUsers({ filter: { name: searchTerm } })

// Create user
const { mutate } = useCreateUser()
mutate({ name: 'John', email: 'john@example.com' })

// Profile management
const { profile, updateProfile } = useUserProfile(userId)

// Admin dashboard
const { users, totalUsers, pagination } = useUserAdministration()

// Infinite scroll
const { data, fetchNextPage, hasNextPage } = useUsersInfinite()

// Prefetch on hover
const onMouseEnter = () => usePrefetchUser(queryClient, userId)

// Server component
const response = await getUsers({ pagination: { pageSize: 20 } })
```

## Common Mistakes Reference

| ❌ Mistake | ✅ Correct |
|-----------|-----------|
| Using ORPC directly | Create custom hook layer |
| Invalidating everywhere | Centralize in mutation hooks |
| Generic hooks | Domain-specific hooks |
| Ignoring `enabled` option | Always use conditional queries |
| Wrong `staleTime` | Match data volatility |
| No prefetch | Anticipate user interactions |
| Mixing Auth patterns | Use Better Auth SDK for auth |
| No type exports | Always export types |

---

## Examples

See `apps/web/src/hooks/` for real-world examples:
- `useUsers.ts` - User management hooks
- `useProjects.ts` - Project management hooks
- `useSettings.ts` - Settings management hooks

## Related Core Concepts

- [02-SERVICE-ADAPTER-PATTERN.md](./02-SERVICE-ADAPTER-PATTERN.md) - Layered architecture for API access
- [09-ORPC-IMPLEMENTATION-PATTERN.md](./09-ORPC-IMPLEMENTATION-PATTERN.md) - Server-side ORPC implementation
- [05-TYPE-MANIPULATION-PATTERN.md](./05-TYPE-MANIPULATION-PATTERN.md) - TypeScript type inference
- [07-BETTER-AUTH-INTEGRATION.md](./07-BETTER-AUTH-INTEGRATION.md) - Authentication SDK usage

## Enforcement

This is a **🔴 CRITICAL** pattern that must be followed:

- **All client components** consuming ORPC APIs must use these hooks
- **No direct ORPC usage** in React components
- **Cache invalidation** must be centralized in hooks
- **Type safety** must be maintained throughout
- **Code review requirement**: PRs violating this pattern should not be approved
