/**
 * Shared types and constants for session management.
 * This file contains isomorphic code that works on both client and server.
 */

// Default session query key - can be overridden
export const DEFAULT_SESSION_QUERY_KEY = ['session'] as const

/**
 * Session result type - our normalized output with isLoading
 */
export interface SessionResult<TData> {
    data: TData | null | undefined
    isLoading: boolean
    isPending?: boolean  // For compatibility with components expecting isPending
    error: unknown
    refetch: () => Promise<void>
}

/**
 * Better Auth's native session result type (uses isPending instead of isLoading)
 */
export interface BetterAuthSessionResult<TData> {
    data: TData | null | undefined
    isPending: boolean
    error: unknown
    refetch: () => Promise<void>
}

/**
 * Minimal auth client interface - the methods we expect from any Better Auth client.
 * Note: Better Auth uses isPending, we normalize to isLoading in our enhanced hook.
 * 
 * getSession returns the session directly (not wrapped in { data, error }) in Better Auth.
 * The response shape is: { user, session, ... } | null
 */
export interface MinimalAuthClient<TSession = unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSession: (...args: any[]) => BetterAuthSessionResult<TSession>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSession: (...args: any[]) => Promise<TSession | null>
    // Allow any other properties (spread from original client)
    [key: string]: unknown
}

/**
 * Options for creating a session-aware auth client
 */
export interface CreateSessionAwareAuthClientOptions<TSession = unknown> {
    /**
     * Query key used for session data in React Query cache
     * @default ['session']
     */
    sessionQueryKey?: readonly unknown[]
    /**
     * Optional session bridge hook for backwards compatibility (client-side only)
     * Returns { data: Session | null | undefined } or null if not available
     */
    useSessionBridge?: () => { data: TSession | null | undefined } | null
}

/**
 * Options for creating an enhanced useSession hook (client-side)
 */
export interface CreateUseSessionOptions<TData> {
    /**
     * The Better Auth client instance - must have a useSession method
     * Note: Better Auth uses isPending, we normalize to isLoading in our output
     */
    authClient: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useSession: (...args: any[]) => BetterAuthSessionResult<TData>
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
 * Options for creating a getSession function (server-side)
 */
export interface CreateGetSessionOptions<TData> {
    /**
     * Function to fetch session from the server
     */
    fetchSession: () => Promise<TData | null>
    /**
     * Query key used for session data in React Query cache
     * @default ['session']
     */
    sessionQueryKey?: readonly unknown[]
}

/**
 * Options for session prefetching (server-side)
 */
export interface PrefetchSessionOptions {
    /**
     * Query key used for session data in React Query cache
     * @default ['session']
     */
    sessionQueryKey?: readonly unknown[]
    /**
     * Stale time for the query in milliseconds
     * @default Infinity (never stale when prefetched)
     */
    staleTime?: number
}
