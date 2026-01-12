'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { 
    DEFAULT_SESSION_QUERY_KEY, 
    type SessionResult, 
    type CreateUseSessionOptions,
    type CreateSessionAwareAuthClientOptions,
    type MinimalAuthClient,
} from './shared'

// Re-export all shared types and constants (same as server.ts)
export { 
    DEFAULT_SESSION_QUERY_KEY, 
    type SessionResult, 
    type BetterAuthSessionResult,
    type CreateUseSessionOptions,
    type CreateSessionAwareAuthClientOptions,
    type MinimalAuthClient,
    type CreateGetSessionOptions,
    type PrefetchSessionOptions,
} from './shared'

// =============================================================================
// SERVER-ONLY STUBS (no-op or throw errors when called on client)
// These exist so that imports from '@repo/auth/react/session' work isomorphically
// =============================================================================

/**
 * Client stub - server-side session fetching doesn't work on client.
 * This is a no-op that returns the provided fetchSession function.
 */
export function createGetSession<TData>(
    options: { fetchSession: () => Promise<TData | null> }
): () => Promise<TData | null> {
    // On client, just return the fetchSession directly
    // This won't have access to server headers, but allows code to compile
    return options.fetchSession
}

/**
 * Client stub - returns query options that can be used with React Query.
 * Note: fetchSession won't work properly on client (no headers access).
 */
export function createSessionQueryOptions<TData>(
    options: {
        fetchSession: () => Promise<TData | null>
        sessionQueryKey?: readonly unknown[]
        staleTime?: number
    }
): {
    queryKey: readonly unknown[]
    queryFn: () => Promise<TData | null>
    staleTime: number
} {
    return {
        queryKey: options.sessionQueryKey ?? DEFAULT_SESSION_QUERY_KEY,
        queryFn: options.fetchSession,
        staleTime: options.staleTime ?? Infinity,
    }
}

/**
 * Client stub - returns a prefetch function.
 * Note: This is primarily meant for server-side prefetching.
 */
export function createPrefetchSession<TData>(
    options: {
        fetchSession: () => Promise<TData | null>
        sessionQueryKey?: readonly unknown[]
        staleTime?: number
    }
): (queryClient: { prefetchQuery: (opts: { queryKey: readonly unknown[]; queryFn: () => Promise<TData | null>; staleTime: number }) => Promise<void> }) => Promise<void> {
    const queryOptions = createSessionQueryOptions(options)
    return async (queryClient) => {
        await queryClient.prefetchQuery(queryOptions)
    }
}

/**
 * Interface for the useSessionQuery result.
 */
interface SessionQueryResult<TData> { 
    data: TData | undefined
    hasData: boolean
    isLoading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

/**
 * Hook that reads session data from React Query cache.
 * 
 * This is designed to work with SessionHydration - when SessionHydration
 * pre-populates the cache on the server, this hook will read from
 * the hydrated data immediately (no loading state, no flash).
 * 
 * Architecture:
 * 1. SessionHydration (server component) fetches session and hydrates RQ cache
 * 2. HydrationBoundary passes dehydrated state to client
 * 3. This hook uses useQuery to read from the hydrated cache
 * 4. Since data is already in cache, useQuery returns it immediately
 * 
 * The queryFn is a fallback for when there's no hydrated data (e.g., direct client navigation).
 * In that case, it returns null (no session) since we can't fetch server-side session on client.
 * 
 * @param queryKey - The query key to read session from (should match SessionHydration's key)
 * @param enabled - Whether the query is enabled
 */
export function useSessionQuery<TData>(
    queryKey: readonly unknown[],
    enabled = true
): SessionQueryResult<TData> {
    const result = useQuery<TData | null>({
        queryKey: queryKey,
        // Fallback queryFn - only runs if cache is empty (no hydration)
        // Returns null since we can't fetch server session on client
        // Better Auth's useSession will handle actual client-side session fetching
        queryFn: () => null,
        // Don't refetch - session should come from hydration or Better Auth
        staleTime: Infinity,
        gcTime: Infinity,
        // Only enabled if explicitly set
        enabled,
        // Use stale data if available (from hydration)
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    })

    return useMemo((): SessionQueryResult<TData> => {
        // Check if we have data (either from hydration or from a previous fetch)
        // IMPORTANT: null is a valid value meaning "user not logged in"
        // Only undefined means "not yet fetched"
        const hasData = result.data !== undefined
        
        return {
            data: result.data as TData | undefined,
            hasData,
            isLoading: result.isLoading,
            error: result.error,
            refetch: async () => {
                await result.refetch()
            },
        }
    }, [result])
}

/**
 * Factory function that creates an enhanced useSession hook.
 * 
 * The created hook integrates with:
 * 1. React Query cache (for HydrationBoundary/SessionPage hydration) - SUBSCRIBES to updates
 * 2. Optional SessionBridge (for backwards compatibility)
 * 3. Better Auth's useSession (as final fallback)
 * 
 * How it works:
 * 1. Subscribes to React Query cache changes via useSyncExternalStore
 *    - When a page hydrates the session (via HydrationBoundary), this hook re-renders
 * 2. If no hydrated data, falls back to SessionBridge (if provided) or Better Auth's useSession
 * 
 * This enables the key behavior:
 * - SessionPage: Server fetches + hydrates RQ cache → useSession picks it up instantly
 * - Regular pages: useSession fetches client-side on first call (lazy loading)
 * - MainNavbar: When navigating to a SessionPage, picks up hydrated session
 *
 * @example
 * ```ts
 * // In your app's auth setup
 * import { createUseSession } from '@repo/auth/react/session/client'
 * import { authClient } from './options'
 * import { useSessionBridge } from './session-bridge'
 * 
 * export const useSession = createUseSession({
 *   authClient,
 *   sessionQueryKey: ['session'],
 *   useSessionBridge, // optional
 * })
 * ```
 */
export function createUseSession<TData>(
    options: CreateUseSessionOptions<TData>
): () => SessionResult<TData> {
    const { 
        authClient, 
        sessionQueryKey = DEFAULT_SESSION_QUERY_KEY,
        useSessionBridge,
    } = options

    return function useSession(): SessionResult<TData> {
        // Use our simplified useQuery-based hook for session data
        // This reads from the hydrated cache (from SessionHydration)
        const { 
            data: cachedSession, 
            hasData: hasHydratedData,
            refetch: refetchCached,
        } = useSessionQuery<TData>(sessionQueryKey)
        
        // Use Better Auth's useSession as a fallback
        const betterAuthSession = authClient.useSession()
        
        // Fallback to SessionBridge (legacy support)
        const bridge = useSessionBridge?.() ?? null
        
        // Determine which session data to use
        const result = useMemo((): SessionResult<TData> => {
            // Priority 1: React Query cache (from SessionHydration hydration)
            if (hasHydratedData) {
                return {
                    data: cachedSession,
                    isLoading: false,
                    isPending: false,
                    error: undefined,
                    refetch: refetchCached,
                }
            }
            
            // Priority 2: SessionBridge (legacy support)
            if (bridge?.data !== undefined) {
                return {
                    data: bridge.data,
                    isLoading: false,
                    isPending: false,
                    error: undefined,
                    refetch: async () => { /* no-op */ },
                }
            }
            
            // Priority 3: Better Auth's useSession (client-side fetch)
            // Normalize isPending to isLoading (and keep isPending for compat)
            return {
                data: betterAuthSession.data,
                isLoading: betterAuthSession.isPending,
                isPending: betterAuthSession.isPending,
                error: betterAuthSession.error,
                refetch: betterAuthSession.refetch,
            }
        }, [hasHydratedData, cachedSession, refetchCached, bridge, betterAuthSession])
        
        return result
    }
}

/**
 * Factory function that wraps an auth client to make it session-aware.
 * 
 * This function takes any Better Auth client and returns the same client with
 * an enhanced `useSession` hook that integrates with React Query cache.
 * 
 * The enhanced useSession:
 * - On client: Uses `useSyncExternalStore` to subscribe to React Query cache changes
 * - Falls back to SessionBridge (if provided) for backwards compatibility
 * - Falls back to the original Better Auth's useSession
 * 
 * All other auth client methods are passed through unchanged.
 * 
 * @example
 * ```ts
 * // In your app's auth setup (client.ts)
 * import { createSessionAwareAuthClient } from '@repo/auth/react/session/client'
 * import { authClient as originalAuthClient } from './options'
 * import { useSessionBridge } from './session-bridge'
 * 
 * export const authClient = createSessionAwareAuthClient(originalAuthClient, {
 *   sessionQueryKey: ['session'],
 *   useSessionBridge, // optional
 * })
 * 
 * // Now authClient.useSession() will automatically use RQ cache subscription
 * export const { useSession, signIn, signUp, signOut } = authClient
 * ```
 * 
 * @param originalClient - The original Better Auth client to wrap
 * @param options - Configuration options for session awareness
 * @returns The same client with an enhanced useSession hook
 */
export function createSessionAwareAuthClient<
    TClient extends MinimalAuthClient<TSession>,
    TSession = TClient extends MinimalAuthClient<infer S> ? S : unknown
>(
    originalClient: TClient,
    options: CreateSessionAwareAuthClientOptions<TSession> = {}
): TClient {
    const { 
        sessionQueryKey = DEFAULT_SESSION_QUERY_KEY,
        useSessionBridge,
    } = options

    // Create the enhanced useSession hook
    const enhancedUseSession = createUseSession({
        authClient: originalClient,
        sessionQueryKey,
        useSessionBridge,
    })

    // Use a Proxy to properly forward all property access to the original client.
    // Better Auth clients use proxy-based property access for methods like signIn, signUp, etc.
    // The spread operator {...originalClient} doesn't copy proxy traps, only own enumerable props.
    // This Proxy ensures all property access (including proxy-based) works correctly,
    // while overriding only useSession with our enhanced version.
    return new Proxy(originalClient, {
        get(target, prop, receiver) {
            // Override useSession with our enhanced version
            if (prop === 'useSession') {
                return enhancedUseSession
            }
            // Forward all other property access to the original client
            return Reflect.get(target, prop, receiver)
        },
    })
}
