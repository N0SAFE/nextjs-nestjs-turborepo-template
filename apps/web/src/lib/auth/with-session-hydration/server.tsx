import 'server-only'

import React from 'react'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getSession, $Infer } from '../index'
import { cookies } from 'next/headers'

// Better Auth uses 'session' as the query key for the session query
const SESSION_QUERY_KEY = ['session']

// Better Auth session cookie name - adjust if your config uses a different name
const SESSION_COOKIE = 'better-auth.session_token'

export interface WithSessionHydrationOptions {
    /**
     * Skip session fetch if no auth cookie is present
     * @default true
     */
    checkCookie?: boolean
    /**
     * Custom session cookie name if different from default
     */
    sessionCookie?: string
}

/**
 * Server-side wrapper that fetches the session once and hydrates it to the client.
 * Works with the existing useSession hook via React Query hydration.
 * 
 * This ensures:
 * - Single session fetch per request (on the server)
 * - Client components using useSession read from hydrated cache
 * - No duplicate fetches across the request lifecycle
 * - Session is passed as a prop to the wrapped component
 * 
 * @example
 * ```tsx
 * // In a layout or page (server component)
 * export default withSessionHydration(async ({ session, children }) => {
 *   // Session is available as a prop
 *   return <div>Welcome {session?.user.name}</div>
 * })
 * ```
 */
export function withSessionHydration<P extends object>(
    Component: React.ComponentType<P & { session: typeof $Infer.Session | null }>,
    options?: WithSessionHydrationOptions
): React.ComponentType<Omit<P, 'session'>> {
    const { checkCookie = true, sessionCookie = SESSION_COOKIE } = options ?? {}

    const WrappedComponent = async (props: Omit<P, 'session'>) => {
        // Check for auth cookie to avoid unnecessary session fetch
        const hasAuthCookie = checkCookie ? (await cookies()).has(sessionCookie) : true
        
        let session: typeof $Infer.Session | null | undefined

        if (hasAuthCookie) {
            const { data } = await getSession()
            session = data ?? null
        }

        // Create a QueryClient and prime it with the session
        const queryClient = new QueryClient()
        
        // Only set query data if we have a valid session
        if (session !== null && session !== undefined) {
            queryClient.setQueryData(SESSION_QUERY_KEY, session)
        }

        const dehydratedState = dehydrate(queryClient)

        return (
            <HydrationBoundary state={dehydratedState}>
                <Component {...(props as P)} session={session ?? null} />
            </HydrationBoundary>
        )
    }

    WrappedComponent.displayName = `WithSessionHydration(${Component.displayName ?? Component.name})`

    return WrappedComponent as React.ComponentType<Omit<P, 'session'>>
}

/**
 * Utility to create a session-aware page component that automatically
 * fetches and hydrates the session on the server.
 * 
 * @example
 * ```tsx
 * // In a page.tsx (server component)
 * import { createSessionPage } from '@/lib/auth/with-session-hydration'
 * 
 * export default createSessionPage(async ({ session, params, searchParams }) => {
 *   // Session is available as a prop
 *   // Client components can also use useSession() without refetching
 *   return (
 *     <div>
 *       <h1>Welcome {session?.user.name}</h1>
 *       <ClientComponent /> // Will read session from cache
 *     </div>
 *   )
 * })
 * ```
 */
export function createSessionPage<P extends object>(
    Page: React.ComponentType<P & { session: typeof $Infer.Session | null }>,
    options?: WithSessionHydrationOptions
): React.ComponentType<Omit<P, 'session'>> {
    return withSessionHydration(Page, options)
}
