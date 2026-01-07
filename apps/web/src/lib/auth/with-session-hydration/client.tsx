/**
 * Client-side implementation for with-session-hydration.
 * 
 * This module is automatically used instead of server.tsx when bundled
 * for client contexts, thanks to the conditional exports in package.json.
 * 
 * On the client:
 * - Uses useSession() hook from Better Auth
 * - Uses useParams() and useSearchParams() hooks from @/routes/hooks
 * - No session fetching needed (reads from hydrated React Query cache)
 */
'use client'

import React from 'react'
import { useSession } from '@/lib/auth'

// Re-export the types for consistency
export interface WithSessionHydrationOptions {
    checkCookie?: boolean
    sessionCookie?: string
}

/**
 * Client-side version of withSessionHydration
 * 
 * On the client, this simply passes the session from useSession() hook
 * to the wrapped component. The session data is already hydrated from
 * the server via React Query's HydrationBoundary.
 */
export function withSessionHydration<P extends object>(
    Component: React.ComponentType<P & { session: typeof import('@/lib/auth').$Infer.Session | null }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: WithSessionHydrationOptions
): React.ComponentType<Omit<P, 'session'>> {
    function ClientWrapper(props: Omit<P, 'session'>) {
        // Use Better Auth hook for session (reads from hydrated cache)
        const { data: session, isPending } = useSession()
        
        // Show loading state while session is loading
        if (isPending) {
            return null // Or a loading spinner
        }
        
        const componentProps = {
            ...props,
            session: session,
        } as P & { session: typeof import('@/lib/auth').$Infer.Session | null }
        
        return <Component {...componentProps} />
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- displayName can be undefined for functional components
    ClientWrapper.displayName = `WithSessionHydration(${Component.displayName ?? Component.name ?? 'Component'})`
    
    return ClientWrapper
}

/**
 * Client-side version of createSessionPage
 * 
 * Just an alias for withSessionHydration on the client
 */
export function createSessionPage<P extends object>(
    Page: React.ComponentType<P & { session: typeof import('@/lib/auth').$Infer.Session | null }>,
    options?: WithSessionHydrationOptions
): React.ComponentType<Omit<P, 'session'>> {
    return withSessionHydration(Page, options)
}
