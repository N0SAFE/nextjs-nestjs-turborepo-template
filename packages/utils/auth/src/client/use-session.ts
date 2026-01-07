'use client'

import type { QueryClient, QueryCacheNotifyEvent } from '@tanstack/react-query'
import { QueryClientContext } from '@tanstack/react-query'
import { useCallback, useContext, useMemo, useSyncExternalStore } from 'react'

// Default session query key - can be overridden
export const DEFAULT_SESSION_QUERY_KEY = ['session'] as const

/**
 * Try to get QueryClient from context, returns null if not available.
 * This is needed because useQueryClient throws if there's no QueryClientProvider.
 */
function useQueryClientSafe(): QueryClient | null {
    // QueryClientContext can return undefined if no provider is available
    const queryClient = useContext(QueryClientContext)
    return queryClient ?? null
}

/**
 * Subscribe to React Query cache changes for a specific query key.
 * This allows components to re-render when HydrationBoundary updates the cache.
 */
 
function useQueryCacheSubscription<TData>(
    queryClient: QueryClient | null,
    queryKey: readonly unknown[]
): { data: TData | undefined; hasData: boolean } {
    // Subscribe to cache changes
    const subscribe = useCallback((callback: () => void) => {
        if (!queryClient) return (): void => { /* no-op cleanup */ }
        const unsubscribe = queryClient.getQueryCache().subscribe((event: QueryCacheNotifyEvent) => {
            // Only trigger for our specific query key
            const eventKey = JSON.stringify(event.query.queryKey)
            const targetKey = JSON.stringify(queryKey)
            if (eventKey === targetKey) {
                callback()
            }
        })
        return unsubscribe
    }, [queryClient, queryKey])

    // Get current snapshot from cache
    const getSnapshot = useCallback(() => {
        if (!queryClient) return { data: undefined, hasData: false }
        const state = queryClient.getQueryState(queryKey)
        const data = queryClient.getQueryData<TData>(queryKey)
        const hasData = state?.dataUpdatedAt !== undefined && state.dataUpdatedAt > 0
        return { data, hasData }
    }, [queryClient, queryKey])

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Session result type
 */
export interface SessionResult<TData> {
    data: TData | null | undefined
    isLoading: boolean
    error: unknown
    refetch: () => Promise<void>
}

/**
 * Options for creating an enhanced useSession hook
 */
export interface CreateUseSessionOptions<TData> {
    /**
     * The Better Auth client instance - must have a useSession method
     */
    authClient: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useSession: (...args: any[]) => SessionResult<TData>
    }
    /**
     * Query key used for session data in React Query cache
     * @default ['session']
     */
    sessionQueryKey?: readonly unknown[]
    /**
     * Optional session bridge hook for backwards compatibility
     * Returns { data: Session | null | undefined } or null if not available
     */
    useSessionBridge?: () => { data: TData | null | undefined } | null
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
 * import { createUseSession } from '@repo/auth/client'
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
        const queryClient = useQueryClientSafe()
        
        // Subscribe to React Query cache for session updates
        // This re-renders when HydrationBoundary hydrates the session
        const { data: cachedSession, hasData: hasHydratedData } = useQueryCacheSubscription<TData>(
            queryClient,
            sessionQueryKey
        )
        
        // Use Better Auth's useSession as a fallback
        const betterAuthSession = authClient.useSession()
        
        // Fallback to SessionBridge (legacy support)
        const bridge = useSessionBridge?.() ?? null
        
        // Determine which session data to use
        const result = useMemo((): SessionResult<TData> => {
            // Priority 1: React Query cache (subscribes to HydrationBoundary updates)
            if (queryClient && hasHydratedData) {
                return {
                    data: cachedSession,
                    isLoading: false,
                    error: undefined,
                    refetch: async () => {
                        await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
                    },
                }
            }
            
            // Priority 2: SessionBridge (legacy support)
            if (bridge?.data !== undefined) {
                return {
                    data: bridge.data,
                    isLoading: false,
                    error: undefined,
                    refetch: async () => { /* no-op */ },
                }
            }
            
            // Priority 3: Better Auth's useSession (client-side fetch)
            return betterAuthSession
        }, [queryClient, hasHydratedData, cachedSession, bridge, betterAuthSession, sessionQueryKey])
        
        return result
    }
}

// Re-export for convenience
export { useQueryCacheSubscription, useQueryClientSafe }
