# Inner State Function Pattern

## Overview

The layout system now supports **innerState as a function** that can be called inside child components to access React Context from providers.

## Why This Pattern?

This pattern solves a critical problem: **accessing provider context in child components**.

### The Problem

```tsx
// ❌ This doesn't work - useSession is not available in the layout definition
const innerState = {
    session: useSession().data  // Error: Can only be called inside a component
}
```

### The Solution

```tsx
// ✅ This works - innerState is a function called inside child components
const innerState = () => {
    'use client'
    const session = useSession()  // Works because it's called below providers
    return {
        session: session.data,
        isLoading: session.isPending,
        error: session.error?.message ?? null,
    }
}
```

## Implementation Example

### Step 1: Define Layout with Inner State Function

```tsx
// apps/web/src/app/layout.tsx
import { defineLayout, makeLayout } from '@/routes/makeRoute'
import { useSession } from '@/lib/auth-client'

const RootLayoutComponent = defineLayout(() => {
    // Inner state is a FUNCTION that will be called in child components
    const innerState = () => {
        'use client'
        // Access Better Auth session (requires NextAuthProviders context)
        const session = useSession()
        
        return {
            session: session.data,
            isLoading: session.isPending,
            error: session.error?.message ?? null,
        }
    }
    
    const data = {
        appName: 'My App',
        version: '1.0.0',
    }
    
    const ui = (renderChildren) => {
        return (
            <html>
                <body>
                    <NextAuthProviders>
                        <ReactQueryProviders>
                            {/* innerState function is passed to children */}
                            {renderChildren(innerState)}
                        </ReactQueryProviders>
                    </NextAuthProviders>
                </body>
            </html>
        )
    }
    
    return { ui, data, innerState }
})

export const RootLayout = makeLayout('/', {...}, RootLayoutComponent)
```

### Step 2: Use in Child Components

```tsx
// apps/web/src/app/profile/page.tsx
'use client'

import { withLayout } from '@/routes/makeRoute'
import { RootLayout } from '../layout'

const ProfilePage = withLayout(RootLayout)(function ProfilePage({ layoutData }) {
    // Call innerState() to access session data
    // This works because we're inside the component tree (below providers)
    const { session, isLoading, error } = layoutData.innerState()
    
    if (isLoading) return <div>Loading session...</div>
    if (error) return <div>Error: {error}</div>
    if (!session) return <div>Not authenticated</div>
    
    return (
        <div>
            <h1>Welcome, {session.user.name}!</h1>
            <p>Email: {session.user.email}</p>
            
            {/* Access static layout data */}
            <footer>
                {layoutData.data.appName} v{layoutData.data.version}
            </footer>
        </div>
    )
})

export default ProfilePage
```

## Type Safety

TypeScript automatically infers the return type of `innerState()`:

```tsx
// Types are automatically inferred!
const { session, isLoading, error } = layoutData.innerState()
//      ^? { session: Session | null, isLoading: boolean, error: string | null }
```

## Key Benefits

1. **Access Provider Context**: Use hooks like `useSession()`, `useQuery()`, etc.
2. **Type Safety**: Full TypeScript inference for session data
3. **No Manual Types**: Types are automatically inferred from function return
4. **Clean Pattern**: Separation between static data and dynamic context

## Provider Hierarchy

The innerState function can access any provider above it in the tree:

```tsx
<html>
  <body>
    <NextAuthProviders>          {/* useSession() available here */}
      <ThemeProvider>            {/* useTheme() available here */}
        <ReactQueryProviders>    {/* useQuery() available here */}
          {renderChildren(innerState)}  {/* All providers accessible */}
        </ReactQueryProviders>
      </ThemeProvider>
    </NextAuthProviders>
  </body>
</html>
```

## Real-World Examples

### Example 1: Better Auth Session

```tsx
const innerState = () => {
    'use client'
    const session = useSession()
    return {
        user: session.data?.user ?? null,
        isAuthenticated: !!session.data,
        isLoading: session.isPending,
    }
}
```

### Example 2: React Query + Theme

```tsx
const innerState = () => {
    'use client'
    const theme = useTheme()
    const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
    
    return {
        theme: theme.theme,
        user,
        isDarkMode: theme.theme === 'dark',
    }
}
```

### Example 3: Multiple Context Sources

```tsx
const innerState = () => {
    'use client'
    const session = useSession()
    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
        enabled: !!session.data,
    })
    
    return {
        user: session.data?.user ?? null,
        notifications: notifications ?? [],
        unreadCount: notifications?.filter(n => !n.read).length ?? 0,
    }
}
```

## Migration from Old Pattern

### Before (Manual Types)

```tsx
// ❌ Old way - manual types and schemas
const schema = z.object({
    user: z.object({ name: z.string(), email: z.string() }).nullable(),
})

type InnerState = {
    isLoading: boolean
    error: string | null
}

const Layout = defineLayout<z.infer<typeof schema>, InnerState>(...)
```

### After (Automatic Inference)

```tsx
// ✅ New way - automatic inference
const Layout = defineLayout(() => {
    const innerState = () => {
        'use client'
        const session = useSession()
        return {
            user: session.data?.user ?? null,
            isLoading: session.isPending,
            error: session.error?.message ?? null,
        }
    }
    
    // Types are automatically inferred from return value!
    return { ui, data, innerState }
})
```

## Common Pitfalls

### ❌ Don't Call innerState Outside Component

```tsx
// ❌ This won't work
const Layout = defineLayout(() => {
    const innerState = () => { ... }
    const session = innerState()  // Error: Called outside component tree
    
    const ui = (renderChildren) => {
        return <div>{renderChildren(innerState)}</div>
    }
})
```

### ✅ Call innerState Inside Child Component

```tsx
// ✅ This works
const Page = withLayout(Layout)(({ layoutData }) => {
    const session = layoutData.innerState()  // Called inside component
    return <div>User: {session.user?.name}</div>
})
```

## Testing

```tsx
import { render, screen } from '@testing-library/react'
import { withLayout } from '@/routes/makeRoute'
import { RootLayout } from '../layout'

// Mock the innerState function
vi.mock('@/lib/auth-client', () => ({
    useSession: () => ({
        data: { user: { name: 'Test User' } },
        isPending: false,
        error: null,
    }),
}))

test('renders with session data', () => {
    const Page = withLayout(RootLayout)(({ layoutData }) => {
        const { user } = layoutData.innerState()
        return <div>Welcome, {user?.name}</div>
    })
    
    render(<Page />)
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument()
})
```

## Summary

The inner state function pattern provides:
- ✅ Access to React Context (useSession, useQuery, etc.)
- ✅ Full type safety with automatic inference
- ✅ No manual type definitions required
- ✅ Clean separation of static and dynamic data
- ✅ Flexible and extensible pattern

This makes it easy to work with authentication, themes, queries, and any other provider-based context in your layouts.
