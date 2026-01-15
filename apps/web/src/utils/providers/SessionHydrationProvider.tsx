/**
 * Root-level Session Hydration Provider
 * 
 * This component wraps the app's content to pre-hydrate the session
 * into the React Query cache at the root level. This ensures that
 * components like MainNavigation can access session data immediately
 * without causing "Cannot update component while rendering" errors.
 * 
 * Architecture:
 * 1. Server: Reads session directly from cookie cache (no HTTP request!)
 * 2. Server: Populates React Query cache with session data
 * 3. Server: Uses HydrationBoundary to pass dehydrated state to client
 * 4. Client: React Query hydrates the cache from HydrationBoundary
 * 5. Client: useSession hook reads from already-populated cache
 * 
 * Performance:
 * - Previous: ~1500ms (HTTP request to API for session)
 * - Current: <5ms (decrypt session from cookie locally)
 * 
 * Why this exists:
 * - Previously, session hydration happened in child pages (via SessionPage)
 * - When HydrationBoundary rendered in a child, it would trigger useSession
 *   to update, which caused MainNavigation to re-render during render
 * - This violated React's rule: "Cannot update a component while rendering
 *   a different component"
 * - By hydrating at root level BEFORE MainNavigation renders, we avoid this
 * 
 * Why cookies() is called internally with try-catch:
 * - This component handles the cookies() call internally with error handling
 * - During static prerendering (like /_not-found), cookies() may fail
 * - We gracefully handle this by skipping session fetch and returning children
 * - This allows static pages to still render without session data
 */
import 'server-only'

import React from 'react'
import { unstable_rethrow } from 'next/navigation'
import { SessionHydration } from '@repo/auth/react/session/server'
import { SESSION_QUERY_KEY } from '@/lib/auth'
import type { Session } from '@/lib/auth'
import { getSessionFromCookie } from '@/lib/auth/cookie-session'

export interface SessionHydrationProviderProps {
    children: React.ReactNode
}

/**
 * SessionHydrationProvider - Pre-hydrates session into React Query cache.
 * 
 * Use this in the root layout, inside ReactQueryProviders, wrapping children.
 * Uses cookie-based session retrieval for optimal performance (~5ms vs ~1500ms).
 * 
 * @example
 * ```tsx
 * // In layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <ReactQueryProviders>
 *       <SessionHydrationProvider>
 *         <MainNavigation />
 *         <main>{children}</main>
 *       </SessionHydrationProvider>
 *     </ReactQueryProviders>
 *   )
 * }
 * ```
 */
export async function SessionHydrationProvider({ 
    children 
}: SessionHydrationProviderProps): Promise<React.ReactElement> {
    // Create fetchSession closure using cookie-based session retrieval
    // This is MUCH faster than HTTP-based getSession (~5ms vs ~1500ms)
    const fetchSession = async (): Promise<Session | null> => {
        try {
            return await getSessionFromCookie()
        } catch (e) {
            // Re-throw internal Next.js errors (PPR bailout, redirects, etc.)
            unstable_rethrow(e)
            // During static prerendering or if cookies not available
            // Gracefully return null - page can still render without session
            return null
        }
    }
    const result = await SessionHydration<Session>({
        fetchSession,
        sessionQueryKey: SESSION_QUERY_KEY,
        children,
    })

    return result
}
