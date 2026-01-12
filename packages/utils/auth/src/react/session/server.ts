/**
 * Server-side session utilities.
 * These utilities are safe to use in Server Components and server-side code.
 * 
 * This module exports the same API as the client module for isomorphic imports.
 * Client-only functions (hooks) will throw errors if called on the server.
 */

import { DEFAULT_SESSION_QUERY_KEY } from './shared'
import type { 
    CreateGetSessionOptions, 
    PrefetchSessionOptions,
    CreateUseSessionOptions,
    CreateSessionAwareAuthClientOptions,
    MinimalAuthClient,
    SessionResult,
} from './shared'

// Re-export all shared types and constants (same as client.ts)
export { DEFAULT_SESSION_QUERY_KEY } from './shared'
export type { 
    SessionResult,
    BetterAuthSessionResult,
    CreateUseSessionOptions,
    CreateSessionAwareAuthClientOptions,
    MinimalAuthClient,
    CreateGetSessionOptions, 
    PrefetchSessionOptions,
} from './shared'

// Re-export SessionHydration component
export { 
    SessionHydration, 
    createSessionHydration,
    type SessionHydrationProps,
} from './SessionHydration'

// =============================================================================
// CLIENT-ONLY STUBS (throw errors when called on server)
// These exist so that imports from '@repo/auth/react/session' work isomorphically
// =============================================================================

/**
 * Server stub - throws error. Use this only on the client.
 * @throws Error when called on server
 */
export function useQueryClientSafe(): never {
    throw new Error('useQueryClientSafe is a client-only hook and cannot be used in Server Components')
}

/**
 * Server stub - throws error. Use this only on the client.
 * @throws Error when called on server
 */
export function useQueryCacheSubscription(): never {
    throw new Error('useQueryCacheSubscription is a client-only hook and cannot be used in Server Components')
}

/**
 * Server stub for createUseSession.
 * Returns a function that throws when called - useSession is client-only.
 * The factory itself doesn't throw so code importing it on server compiles.
 */
export function createUseSession<TData>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: CreateUseSessionOptions<TData>
): () => SessionResult<TData> {
    return function useSession(): SessionResult<TData> {
        throw new Error('useSession is a client-only hook and cannot be used in Server Components. Use getSession() instead.')
    }
}

/**
 * Server implementation of createSessionAwareAuthClient.
 * 
 * On the server, this returns a Proxy that forwards all property access to the
 * original client, except for useSession which throws an error when called.
 * 
 * We use a Proxy because Better Auth clients use proxy-based property access
 * for methods like signIn, signUp, getSession, etc. The spread operator
 * {...originalClient} doesn't copy these proxy-trapped properties.
 * 
 * Server components should use getSession() directly instead of useSession().
 * 
 * @param originalClient - The original Better Auth client
 * @param _options - Configuration options (not used on server except for sessionQueryKey)
 * @returns The client with useSession that throws on server
 */
export function createSessionAwareAuthClient<
    TClient extends MinimalAuthClient<TSession>,
    TSession = TClient extends MinimalAuthClient<infer S> ? S : unknown
>(
    originalClient: TClient,
    _options: CreateSessionAwareAuthClientOptions<TSession> = {}
): TClient {
    // On server, return a Proxy that throws for useSession but forwards everything else
    // This allows the code to compile and getSession/signIn/etc to work properly
    const serverUseSession = createUseSession<TSession>({
        authClient: originalClient,
        sessionQueryKey: _options.sessionQueryKey ?? DEFAULT_SESSION_QUERY_KEY,
        useSessionBridge: _options.useSessionBridge,
    })

    return new Proxy(originalClient, {
        get(target, prop, receiver) {
            // Override useSession with our throwing version
            if (prop === 'useSession') {
                return serverUseSession
            }
            // Forward all other property access to the original client
            return Reflect.get(target, prop, receiver)
        },
    })
}

// =============================================================================
// SERVER-SIDE IMPLEMENTATIONS
// =============================================================================

/**
 * Factory function that creates a getSession function for server-side usage.
 * 
 * @example
 * ```ts
 * // In your app's auth setup
 * import { createGetSession } from '@repo/auth/react/session/server'
 * import { auth } from './auth'
 * 
 * export const getSession = createGetSession({
 *   fetchSession: () => auth.api.getSession({ headers: {cookie: (await cookies()).toString()} }),
 * })
 * ```
 */
export function createGetSession<TData>(
    options: CreateGetSessionOptions<TData>
): () => Promise<TData | null> {
    const { fetchSession } = options

    return async function getSession(): Promise<TData | null> {
        return fetchSession()
    }
}

/**
 * Create query options for prefetching session data.
 * Use this with React Query's prefetchQuery or dehydrate.
 * 
 * @example
 * ```ts
 * // In a Server Component
 * import { createSessionQueryOptions } from '@repo/auth/react/session/server'
 * import { getSession } from './auth'
 * 
 * const queryClient = new QueryClient()
 * await queryClient.prefetchQuery(
 *   createSessionQueryOptions({
 *     fetchSession: getSession,
 *     sessionQueryKey: ['session'],
 *   })
 * )
 * ```
 */
export function createSessionQueryOptions<TData>(
    options: CreateGetSessionOptions<TData> & PrefetchSessionOptions
): {
    queryKey: readonly unknown[]
    queryFn: () => Promise<TData | null>
    staleTime: number
} {
    const { 
        fetchSession, 
        sessionQueryKey = DEFAULT_SESSION_QUERY_KEY,
        staleTime = Infinity,
    } = options

    return {
        queryKey: sessionQueryKey,
        queryFn: fetchSession,
        staleTime,
    }
}

/**
 * Helper to create a session prefetch function for use in layouts/pages.
 * Returns a function that prefetches session data into a QueryClient.
 * 
 * @example
 * ```ts
 * // In your app's auth setup
 * import { createPrefetchSession } from '@repo/auth/react/session/server'
 * import { getSession } from './auth'
 * 
 * export const prefetchSession = createPrefetchSession({
 *   fetchSession: getSession,
 * })
 * 
 * // In a layout
 * const queryClient = new QueryClient()
 * await prefetchSession(queryClient)
 * ```
 */
export function createPrefetchSession<TData>(
    options: CreateGetSessionOptions<TData> & PrefetchSessionOptions
): (queryClient: { prefetchQuery: (options: { queryKey: readonly unknown[]; queryFn: () => Promise<TData | null>; staleTime: number }) => Promise<void> }) => Promise<void> {
    const queryOptions = createSessionQueryOptions(options)

    return async function prefetchSession(queryClient): Promise<void> {
        await queryClient.prefetchQuery(queryOptions)
    }
}
