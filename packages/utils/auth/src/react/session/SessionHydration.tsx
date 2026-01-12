import 'server-only'

import React, { type ReactNode } from 'react'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { DEFAULT_SESSION_QUERY_KEY } from './shared'

// Simple rethrow function as fallback
function simpleRethrow(error: unknown): never {
  throw error
}

// Use simple rethrow for now - unstable_rethrow is a Next.js internal
// and not always available in all environments
const unstable_rethrow = simpleRethrow

// Performance timing helper
const startTimer = () => performance.now()
const elapsed = (start: number) => (performance.now() - start).toFixed(2)

/**
 * Props for SessionHydration component.
 */
export interface SessionHydrationProps<TSession> {
    /**
     * Children to render. Will have access to hydrated session data via React Query cache.
     */
    children: ReactNode
    /**
     * Function to fetch the session on the server.
     * Can return either:
     * - Direct session: Session | null
     * - Wrapped session: { data: Session | null }
     */
    fetchSession: () => Promise<TSession | { data: TSession | null | undefined } | null>
    /**
     * Optional custom query key for the session.
     * @default ['session']
     */
    sessionQueryKey?: readonly unknown[]
    /**
     * Optional: Skip session fetch if condition is false.
     * Useful for checking auth cookies before fetching.
     * @default true
     */
    shouldFetch?: boolean
}

/**
 * Server component that pre-hydrates the session into React Query cache.
 * 
 * This component:
 * 1. Fetches the session on the server
 * 2. Populates a QueryClient with the session data
 * 3. Wraps children with HydrationBoundary
 * 
 * When placed in a layout above client components using useSession(),
 * those components will immediately have access to the hydrated session
 * without needing to refetch or subscribe to cache updates.
 * 
 * @example
 * ```tsx
 * // In layout.tsx (server component)
 * import { SessionHydration } from '@repo/auth/react/session/server'
 * import { getSession } from '@/lib/auth'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ReactQueryProviders>
 *           <SessionHydration fetchSession={getSession}>
 *             <MainNavigation />
 *             {children}
 *           </SessionHydration>
 *         </ReactQueryProviders>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export async function SessionHydration<TSession>({
    children,
    fetchSession,
    sessionQueryKey = DEFAULT_SESSION_QUERY_KEY,
    shouldFetch = true,
}: SessionHydrationProps<TSession>): Promise<React.ReactElement> {
    const totalStart = startTimer()
    console.log(`🔄 SessionHydration: START`)
    
    // Create a new QueryClient for this request
    console.log(`🔄 SessionHydration: [1/4] Creating QueryClient...`)
    const qcStart = startTimer()
    const queryClient = new QueryClient()
    console.log(`🔄 SessionHydration: [1/4] QueryClient created in ${elapsed(qcStart)}ms`)
    
    // Fetch session if we should
    if (shouldFetch) {
        try {
            console.log(`🔄 SessionHydration: [2/4] Calling fetchSession...`)
            const fetchStart = startTimer()
            const result = await fetchSession()
            console.log(`🔄 SessionHydration: [2/4] fetchSession done in ${elapsed(fetchStart)}ms`)
            
            // Handle both formats:
            // - Direct session: Session | null
            // - Wrapped session: { data: Session | null }
            console.log(`🔄 SessionHydration: [3/4] Processing result...`)
            const processStart = startTimer()
            let session: TSession | null = null
            if (result !== null && result !== undefined) {
                // Check if it's a wrapped response with 'data' property
                if (typeof result === 'object' && 'data' in result) {
                    session = (result as { data: TSession | null | undefined }).data ?? null
                } else {
                    // It's a direct session object
                    session = result as TSession
                }
            }
            
            // ALWAYS set the session in the query cache, even if null
            // This is critical: null means "fetched but user not logged in"
            // undefined (no cache entry) means "not yet fetched"
            // If we don't cache null, the client thinks it needs to fetch and shows loading
            queryClient.setQueryData(sessionQueryKey, session)
            console.log(`🔄 SessionHydration: [3/4] Processed & cached in ${elapsed(processStart)}ms (session=${session ? 'exists' : 'null'})`)
        } catch (error) {
            // Re-throw internal Next.js errors (PPR bailout, redirects, etc.)
            unstable_rethrow(error)
            // Log error but don't fail - session will just be null
            console.error(`🔄 SessionHydration: ERROR after ${elapsed(totalStart)}ms`, error)
        }
    } else {
        console.log(`🔄 SessionHydration: [2/4] Skipping fetch (shouldFetch=false)`)
    }
    
    // Dehydrate the query client state
    console.log(`🔄 SessionHydration: [4/4] Dehydrating...`)
    const dehydrateStart = startTimer()
    const dehydratedState = dehydrate(queryClient)
    console.log(`🔄 SessionHydration: [4/4] Dehydrated in ${elapsed(dehydrateStart)}ms`)
    console.log(`🔄 SessionHydration: END - Total: ${elapsed(totalStart)}ms`)
    
    return (
        <HydrationBoundary state={dehydratedState}>
            {children}
        </HydrationBoundary>
    )
}

/**
 * Factory function to create a typed SessionHydration component.
 * 
 * @example
 * ```tsx
 * // In your auth module
 * import { createSessionHydration } from '@repo/auth/react/session/server'
 * import { getSession } from './auth'
 * 
 * export const SessionHydration = createSessionHydration({
 *   fetchSession: getSession,
 *   sessionQueryKey: ['session'],
 * })
 * 
 * // Then use in layout.tsx
 * <SessionHydration>
 *   <MainNavigation />
 *   {children}
 * </SessionHydration>
 * ```
 */
export function createSessionHydration<TSession>(
    config: Omit<SessionHydrationProps<TSession>, 'children'>
): React.FC<{ children: ReactNode }> {
    return async function ConfiguredSessionHydration({ children }) {
        return SessionHydration<TSession>({
            ...config,
            children,
        })
    }
}
