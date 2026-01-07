/**
 * Server-side layout wrappers for session hydration.
 * 
 * This file provides layout wrappers that fetch and hydrate session data
 * at the layout level, ensuring all components in the layout tree
 * (including MainNavigation) have access to the cached session.
 * 
 * Similar to createSessionPage but for layouts - no params/search validation needed.
 * 
 * @packageDocumentation
 */
import 'server-only'

import React from 'react'
import { unstable_rethrow } from 'next/navigation'
import type { Session, ServerAuthAdapter } from '../types'

// Session constants - must match page-wrappers
const SESSION_QUERY_KEY = ['session']

// ============================================================================
// Configuration - Must be set before using session layout wrappers
// ============================================================================

let serverAuthAdapter: ServerAuthAdapter | null = null
let HydrationBoundary: React.ComponentType<{ state: unknown; children: React.ReactNode }> | null = null
let createQueryClient: (() => { setQueryData: (key: unknown[], data: unknown) => void }) | null = null
let dehydrateQueryClient: ((client: unknown) => unknown) | null = null
let checkAuthCookieFn: (() => Promise<boolean>) | null = null

/**
 * Configure the server-side auth adapter and React Query integration for layouts.
 * Must be called before using createSessionLayout.
 * 
 * @example
 * ```tsx
 * // In your app's route setup (e.g., @/routes/configure-auth.ts)
 * import { configureLayoutAuth } from '@repo/declarative-routing/layout-wrappers/server'
 * import { getSession } from '@/lib/auth'
 * import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
 * import { cookies } from 'next/headers'
 * 
 * configureLayoutAuth({
 *   getSession: async () => {
 *     const { data } = await getSession()
 *     return { data }
 *   }
 * }, {
 *   HydrationBoundary,
 *   createQueryClient: () => new QueryClient(),
 *   dehydrate,
 * }, async () => {
 *   const cookieStore = await cookies()
 *   return cookieStore.has('better-auth.session_token')
 * })
 * ```
 */
export function configureLayoutAuth(
    adapter: ServerAuthAdapter,
    reactQuery?: {
        HydrationBoundary: React.ComponentType<{ state: unknown; children: React.ReactNode }>
        createQueryClient: () => { setQueryData: (key: unknown[], data: unknown) => void }
        dehydrate: (client: unknown) => unknown
    },
    checkAuthCookie?: () => Promise<boolean>
): void {
    serverAuthAdapter = adapter
    if (reactQuery) {
        HydrationBoundary = reactQuery.HydrationBoundary
        createQueryClient = reactQuery.createQueryClient
        dehydrateQueryClient = reactQuery.dehydrate
    }
    if (checkAuthCookie) {
        checkAuthCookieFn = checkAuthCookie
    }
}

/**
 * Get the configured server auth adapter.
 * Throws if not configured.
 */
function getServerAuthAdapter(): ServerAuthAdapter {
    if (!serverAuthAdapter) {
        throw new Error(
            'Layout auth adapter not configured. Call configureLayoutAuth() before using session layout wrappers.'
        )
    }
    return serverAuthAdapter
}

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the session layout component - what your layout component receives.
 */
export type SessionLayoutProps<S extends Session = Session> = {
    children: React.ReactNode
    session: S | null
}

/**
 * Next.js layout props - what Next.js passes to the layout.
 * Next.js always passes params as a Promise, even for static layouts.
 */
export type NextLayoutProps = {
    children: React.ReactNode
    params: Promise<Record<string, string | string[]>>
}

/**
 * Session options for layout wrappers.
 */
export type SessionLayoutOptions = {
    /**
     * Whether to check for auth cookie before fetching session.
     * @default true
     */
    checkCookie?: boolean
    /**
     * Custom fallback to render during Suspense (static prerendering).
     * If not provided, a default loading skeleton is used.
     * 
     * IMPORTANT: The fallback must not use hooks that require context
     * (like useSession, useQuery, etc.) as it renders during static generation.
     * 
     * @default Simple loading div
     */
    fallback?: React.ReactNode
}

// ============================================================================
// createSessionLayout - Main API
// ============================================================================

/**
 * Creates a session-aware layout wrapper that:
 * 1. Fetches session on the server using the configured auth adapter
 * 2. Hydrates React Query cache (if configured)
 * 3. Passes session as a prop to the layout component
 * 
 * Works like RouteBuilder.SessionPage but for layouts - no params/search validation.
 * 
 * Uses an internal Suspense boundary to handle Next.js prerendering gracefully.
 * During static prerendering, the session fetch is deferred and the layout renders
 * with session=null in the fallback.
 * 
 * @example
 * ```tsx
 * // apps/web/src/app/dashboard/layout.tsx
 * import { createSessionLayout } from '@repo/declarative-routing/layout-wrappers/server'
 * 
 * export default createSessionLayout(({ children, session }) => {
 *   return (
 *     <div>
 *       <DashboardNav user={session?.user} />
 *       {children}
 *     </div>
 *   )
 * })
 * ```
 */
export function createSessionLayout<
    S extends Session = Session,
    AdditionalProps extends object = object,
>(
    Component: React.ComponentType<SessionLayoutProps<S> & AdditionalProps>,
    options: SessionLayoutOptions = {}
): React.ComponentType<NextLayoutProps & Omit<AdditionalProps, 'session' | 'children'>> {
    type WrapperProps = NextLayoutProps & Omit<AdditionalProps, 'session' | 'children'>
    
    const { checkCookie = true, fallback: customFallback } = options

    // Inner async component that handles session fetching
    // This is wrapped in Suspense by the outer component
    async function SessionFetchingLayout(props: WrapperProps): Promise<React.ReactNode> {
        const { children, ...additionalProps } = props as NextLayoutProps & Record<string, unknown>
        const authAdapter = getServerAuthAdapter()
        
        // Check for auth cookie to avoid unnecessary session fetch
        let hasAuthCookie = true
        if (checkCookie && checkAuthCookieFn) {
            hasAuthCookie = await checkAuthCookieFn()
        }
        
        let session: S | null = null
        if (hasAuthCookie) {
            try {
                const { data } = await authAdapter.getSession()
                session = data ? (data as S) : null
            } catch (error) {
                // Re-throw internal Next.js errors (PPR bailout, redirects, etc.)
                unstable_rethrow(error)
                console.error('[createSessionLayout] Failed to fetch session:', error)
            }
        }

        // Build component props
        const componentProps = {
            ...(additionalProps as AdditionalProps),
            children,
            session,
        } as SessionLayoutProps<S> & AdditionalProps

        // If React Query integration is configured, hydrate the session
        if (HydrationBoundary && createQueryClient && dehydrateQueryClient) {
            const queryClient = createQueryClient()
            queryClient.setQueryData(SESSION_QUERY_KEY, session)
            const dehydratedState = dehydrateQueryClient(queryClient)
            
            return (
                <HydrationBoundary state={dehydratedState}>
                    <Component {...componentProps} />
                </HydrationBoundary>
            )
        }
        
        return <Component {...componentProps} />
    }

    // Synchronous wrapper that renders a Suspense boundary
    // The fallback renders during static prerendering
    // CRITICAL: The fallback must not use hooks that require context (useSession, useQuery, etc.)
    function WrappedLayout(props: WrapperProps): React.ReactNode {
        // Default fallback: simple loading skeleton
        // Custom fallback can be provided via options.fallback
        // IMPORTANT: We do NOT render <Component /> in the fallback because:
        // 1. Component likely uses client hooks (useSession, useContext, etc.)
        // 2. During static prerendering, those hooks may fail or trigger dynamic detection
        // 3. A simple loading UI avoids all these issues
        //
        // NOTE: We also do NOT render children in the fallback!
        // Rendering children during fallback causes a "flash" where the page content
        // appears before the layout shell (sidebar, nav, etc.) is ready.
        // By not rendering children, the entire layout streams together once session is ready.
        const fallback = customFallback ?? (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        )

        return (
            <React.Suspense fallback={fallback}>
                <SessionFetchingLayout {...props} />
            </React.Suspense>
        )
    }

    const displayName = (Component as { displayName?: string; name?: string }).displayName 
        ?? (Component as { name?: string }).name 
        ?? 'Component'
    WrappedLayout.displayName = `SessionLayout(${displayName})`

    return WrappedLayout as React.ComponentType<WrapperProps>
}

// ============================================================================
// SessionHydrator - Standalone component for hydrating session at any level
// ============================================================================

/**
 * Props for SessionHydrator component.
 */
export type SessionHydratorProps = {
    children: React.ReactNode
}

/**
 * A standalone server component that fetches and hydrates the session.
 * Use this when you can't use createSessionLayout (e.g., in root layout).
 * 
 * This component:
 * 1. Fetches session on the server
 * 2. Hydrates React Query cache with the session
 * 3. Renders children inside HydrationBoundary
 * 
 * @example
 * ```tsx
 * // apps/web/src/app/layout.tsx
 * import { SessionHydrator } from '@repo/declarative-routing/layout-wrappers/server'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ReactQueryProviders>
 *           <SessionHydrator>
 *             <MainNavigation />
 *             {children}
 *           </SessionHydrator>
 *         </ReactQueryProviders>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export async function SessionHydrator({ children }: SessionHydratorProps): Promise<React.ReactNode> {
    // If not configured, just render children
    if (!serverAuthAdapter || !HydrationBoundary || !createQueryClient || !dehydrateQueryClient) {
        return children
    }
    
    // Check for auth cookie to avoid unnecessary session fetch
    // Use try-catch to handle static prerendering where cookies() is not available
    let hasAuthCookie = true
    if (checkAuthCookieFn) {
        try {
            hasAuthCookie = await checkAuthCookieFn()
        } catch (error) {
            // Re-throw internal Next.js errors (PPR bailout, redirects, etc.)
            unstable_rethrow(error)
            // During static prerendering, cookies() throws
            // Skip auth check and session fetch - just render children without hydration
            return children
        }
    }
    
    let session: Session | null = null
    if (hasAuthCookie) {
        try {
            const { data } = await serverAuthAdapter.getSession()
            // Cast to Session since ServerAuthAdapter uses generic S = unknown
            // The consuming app is responsible for providing a correctly typed adapter
            session = (data ?? null) as Session | null
        } catch (error) {
            // Re-throw internal Next.js errors (PPR bailout, redirects, etc.)
            unstable_rethrow(error)
            console.error('[SessionHydrator] Failed to fetch session:', error)
        }
    }
    
    // Hydrate React Query cache
    const queryClient = createQueryClient()
    queryClient.setQueryData(SESSION_QUERY_KEY, session)
    const dehydratedState = dehydrateQueryClient(queryClient)
    
    return (
        <HydrationBoundary state={dehydratedState}>
            {children}
        </HydrationBoundary>
    )
}

// ============================================================================
// Re-export types
// ============================================================================

export type { Session, ServerAuthAdapter } from '../types'
