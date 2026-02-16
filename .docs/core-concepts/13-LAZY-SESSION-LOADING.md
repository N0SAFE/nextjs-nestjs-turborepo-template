# Lazy Session Loading with Session Bridge

> Type: Core Concept — Authentication  
> Priority: 🔴 Critical  
> Last Updated: 2025-12-23

## Overview

Better Auth provides efficient client-side session management. This architecture enhances it with **lazy loading** and **optional server hydration**:

### Two Loading Patterns

**Pattern 1: Lazy Client-Side Fetch (Default)**
- ❌ **NO** server-side session fetch on every page load
- ✅ Client components call `useSession()` → fetches only when first needed
- ✅ Better Auth handles caching and refetching automatically
- ✅ Best for public pages or pages where session isn't immediately needed

**Pattern 2: Explicit Server Hydration (Opt-in with `SessionPage`)**
- ✅ Server fetches session **once** using `SessionPage` wrapper
- ✅ Seeds client context → all nested `useSession()` calls read from cache
- ✅ No loading state, instant access to session
- ✅ Best for authenticated pages that need immediate session access

## Key Principle

**We do NOT fetch session on every server render automatically.** This would defeat the purpose of lazy loading. Instead:

1. **Default behavior**: Let Better Auth fetch session client-side when `useSession()` is first called
2. **Opt-in server fetch**: Use `SessionPage` wrapper when you explicitly want server-side session + hydration

## Architecture

### Root Provider (No Automatic Fetch)

```tsx
// apps/web/src/utils/providers/AuthProviders/index.tsx
const AuthProviders = ({ children }: { children: React.ReactNode }) => {
    // NOTE: NO await getSession() here!
    // Session fetched only when explicitly needed via SessionPage
    // or lazily on client via useSession()
    return (
        <ClientAuthProviders>
            {children}
        </ClientAuthProviders>
    )
}
```

### Client Provider (Empty by Default)

```tsx
// apps/web/src/utils/providers/AuthProviders/ClientAuthProviders.tsx
export const ClientAuthProviders: React.FC<
    React.PropsWithChildren<{ initialSession?: Session }>
> = ({ children, initialSession }) => {
    // initialSession is undefined unless SessionPage provided it
    return (
        <SessionBridgeProvider initialSession={initialSession}>
            {children}
        </SessionBridgeProvider>
    )
}
```

### Smart useSession Hook

```ts
// apps/web/src/lib/auth/index.ts
export function useSession(...args) {
    const bridge = useSessionBridge()
    
    // 1. If SessionPage provided session, use it (no fetch)
    if (bridge?.data !== undefined) {
        return {
            data: bridge.data,
            isLoading: false,
            error: undefined,
            refetch: async () => {} // already fresh from server
        }
    }
    
    // 2. Otherwise, fetch client-side (lazy loading)
    return authClient.useSession(...args)
}
```

## Usage Examples

### Example 1: Lazy Loading (Default)

Most pages should use this - no server fetch, fast server render:

```tsx
'use client'

export default function ProfilePage() {
    // Fetches session client-side on first render
    const { data: session, isLoading } = useSession()
    
    if (isLoading) return <div>Loading...</div>
    if (!session) return <div>Please sign in</div>
    
    return <div>Welcome {session.user.name}!</div>
}
```

**Benefits:**
- Fast server render (no session fetch)
- Client-side fetch only happens if component mounts
- Better Auth handles caching across pages

### Example 2: Server Hydration (Opt-in)

Use `SessionPage` when you need instant session access:

```tsx
// Server component - session fetched once on server
export default Dashboard.SessionPage(async ({ session, params }) => {
    // session is already typed and available - no loading state!
    const userData = await fetchUserData(session.user.id)
    
    return (
        <div>
            <h1>Welcome {session.user.name}</h1>
            <UserProfile data={userData} />
            <NestedClientComponent /> {/* Will also have instant session access */}
        </div>
    )
})
```

**Benefits:**
- No loading state on client
- SEO-friendly (session data in initial HTML)
- Nested client components get instant access

### Example 3: Nested Components with Hydrated Session

When parent uses `SessionPage`, all children get instant access:

```tsx
'use client'

function UserProfile() {
    // No fetch! Reads from bridge seeded by parent's SessionPage
    const { data: session, isLoading } = useSession()
    
    // isLoading is false immediately!
    return <div>{session?.user.email}</div>
}
```

## When to Use Each Pattern

### Use Lazy Loading (Default) When:
- ✅ Page doesn't require authentication
- ✅ Session data isn't needed immediately
- ✅ You want fastest possible server render
- ✅ You're okay with brief loading state

### Use SessionPage (Server Hydration) When:
- ✅ Page requires authentication
- ✅ Session data needed immediately (no loading state)
- ✅ You want SEO benefits of server-rendered session data
- ✅ Multiple nested components need session

## Performance Impact

### Old Approach (Automatic Fetch Everywhere)
```
Every page request:
  Server: Fetch session (100-200ms)
  Client: Receive hydrated session
  Total: 100-200ms overhead on EVERY page
```

### New Approach (Lazy + Opt-in)
```
Default pages (lazy):
  Server: No fetch (0ms)
  Client: Fetch on first useSession() call (100-200ms)
  Total: 0ms server overhead, client pays cost only when needed

SessionPage (opt-in):
  Server: Fetch session (100-200ms)
  Client: Instant access from bridge (0ms)
  Total: 100-200ms server overhead, but ONLY on pages that need it
```

## Migration Guide

If you previously relied on automatic session fetching:

**Before (automatic everywhere):**
```tsx
// Every page automatically had session on server
function MyPage() {
    const { data: session } = useSession() // instant
    return <div>{session?.user.name}</div>
}
```

**After (choose your pattern):**

Option A - Lazy loading (add loading state):
```tsx
'use client'

function MyPage() {
    const { data: session, isLoading } = useSession() // client-side fetch
    if (isLoading) return <div>Loading...</div>
    return <div>{session?.user.name}</div>
}
```

Option B - Explicit server fetch (use SessionPage):
```tsx
export default MyRoute.SessionPage(async ({ session }) => {
    // session already fetched on server
    return <div>{session.user.name}</div>
})
```

## Related Patterns

- **SessionPage** - Server-side session fetch + hydration
- **ClientSessionPage** - Client-side session with refetch capability
- **Page** - Universal wrapper (no session)
- **ClientPage** - Explicit client component wrapper (no session)

## Troubleshooting

**Q: My client component shows loading state now, but it didn't before**  
A: That's expected! We removed automatic server fetch. Either:
- Add a loading state (recommended for non-critical pages)
- Convert to `SessionPage` (for pages that need instant session)

**Q: When should I use SessionPage vs just useSession?**  
A: Use `SessionPage` when:
- Session is required for the page (redirect if not authenticated)
- You need SEO benefits from server-rendered session data
- You want to avoid loading states in the UI

**Q: Does this break Better Auth's caching?**  
A: No! Better Auth still caches sessions client-side. This just prevents fetching on server when not needed.

## Files Reference

- `apps/web/src/utils/providers/AuthProviders/index.tsx` - Root provider (NO fetch)
- `apps/web/src/lib/auth/session-bridge.tsx` - Context for optional hydrated session
- `apps/web/src/lib/auth/index.ts` - Smart useSession wrapper
- `apps/web/src/lib/auth/with-session-hydration.tsx` - Server fetch for SessionPage
- `apps/web/src/lib/auth/with-client-session.tsx` - Client refetch for ClientSessionPage

## Related Documentation

- [11-ORPC-CLIENT-HOOKS-PATTERN.md](./11-ORPC-CLIENT-HOOKS-PATTERN.md) - API client hooks
- [12-DECLARATIVE-ROUTING-PATTERN.md](./12-DECLARATIVE-ROUTING-PATTERN.md) - Type-safe routing
- [DEVELOPMENT-WORKFLOW.md](../guides/DEVELOPMENT-WORKFLOW.md) - Dev Auth Token Mode
