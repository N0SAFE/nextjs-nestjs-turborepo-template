/**
 * Server-side page wrapper utilities
 * 
 * This file provides the real implementations that:
 * 1. Unwrap params/searchParams promises using async/await (server-only)
 * 2. Validate params/search using Zod schemas
 * 3. Fetch and hydrate session for SessionPage (using injected auth adapter)
 * 
 * The package.json conditional exports ensure:
 * - Server bundles (react-server condition): Use this file
 * - Client bundles (default condition): Use client.ts which uses React.use()
 */
import 'server-only'

import React from 'react'
import { z } from 'zod'
import type {
    Session,
    ServerAuthAdapter,
    SessionOptions,
    SchemasConfig,
    UnwrappedPageProps,
    BasePageProps,
} from '../types'

// ============================================================================
// Configuration - Must be set before using session wrappers
// ============================================================================

let serverAuthAdapter: ServerAuthAdapter | null = null
let HydrationBoundary: React.ComponentType<{ state: unknown; children: React.ReactNode }> | null = null
let createQueryClient: (() => { setQueryData: (key: unknown[], data: unknown) => void }) | null = null
let dehydrateQueryClient: ((client: unknown) => unknown) | null = null

/**
 * Configure the server-side auth adapter and React Query integration.
 * Must be called before using createSessionPage.
 * 
 * @example
 * ```tsx
 * // In your app's route setup
 * import { configureServerAuth } from '@repo/declarative-routing/page-wrappers'
 * import { getSession } from '@/lib/auth'
 * import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
 * 
 * configureServerAuth({
 *   getSession: async () => {
 *     const { data } = await getSession()
 *     return { data }
 *   }
 * }, {
 *   HydrationBoundary,
 *   createQueryClient: () => new QueryClient(),
 *   dehydrate,
 * })
 * ```
 */
export function configureServerAuth(
    adapter: ServerAuthAdapter,
    reactQuery?: {
        HydrationBoundary: React.ComponentType<{ state: unknown; children: React.ReactNode }>
        createQueryClient: () => { setQueryData: (key: unknown[], data: unknown) => void }
        dehydrate: (client: unknown) => unknown
    }
): void {
    serverAuthAdapter = adapter
    if (reactQuery) {
        HydrationBoundary = reactQuery.HydrationBoundary
        createQueryClient = reactQuery.createQueryClient
        dehydrateQueryClient = reactQuery.dehydrate
    }
}

/**
 * Get the configured server auth adapter.
 * Throws if not configured.
 */
function getServerAuthAdapter(): ServerAuthAdapter {
    if (!serverAuthAdapter) {
        throw new Error(
            'Server auth adapter not configured. Call configureServerAuth() before using session wrappers.'
        )
    }
    return serverAuthAdapter
}

// ============================================================================
// Types for Next.js page props (Promise-based)
// ============================================================================

type NextPagePropsInternal<
    Params extends z.ZodType = z.ZodType,
    Search extends z.ZodType = z.ZodType,
> = {
    params: Promise<z.output<Params>>
    searchParams: Promise<z.output<Search>>
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper to cast a component to the correct type.
 */
function asPageComponent<T>(component: React.ComponentType<T>): React.ComponentType<T> {
    return component
}

/**
 * Helper to extract additional props.
 */
function extractAdditionalProps<T extends object>(
    props: T
): Omit<T, 'params' | 'searchParams' | 'children'> {
    const { params, searchParams, children, ...rest } = props as T & {
        params?: unknown
        searchParams?: unknown
        children?: unknown
    }
    void params
    void searchParams
    void children
    return rest as Omit<T, 'params' | 'searchParams' | 'children'>
}

// ============================================================================
// Page Wrappers
// ============================================================================

/**
 * Creates a server page wrapper that unwraps and validates params/search.
 * 
 * On the server, we can use async/await to unwrap the promises from Next.js
 * and validate them with Zod schemas before passing to the component.
 * 
 * @example
 * ```tsx
 * // page.tsx (Server Component)
 * import { createPage } from '@repo/declarative-routing/page-wrappers'
 * 
 * export default createPage(
 *   { params: z.object({ id: z.string() }), search: z.object({}) },
 *   async ({ params, searchParams }) => {
 *     const data = await fetchData(params.id)
 *     return <div>{data.name}</div>
 *   }
 * )
 * ```
 */
export function createPage<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
>(
    schemas: SchemasConfig<Params, Search>,
    Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>
): React.ComponentType<NextPagePropsInternal<Params, Search> & BasePageProps & AdditionalProps> {
    type WrapperProps = NextPagePropsInternal<Params, Search> & BasePageProps & AdditionalProps
    
    async function WrappedComponent(props: WrapperProps): Promise<React.ReactNode> {
        const rawParams = await props.params
        const rawSearchParams = await props.searchParams
        const params = schemas.params.parse(rawParams) as z.output<Params>
        const searchParams = schemas.search.parse(rawSearchParams) as z.output<Search>
        const additionalProps = extractAdditionalProps(props)
        
        const componentProps: UnwrappedPageProps<Params, Search> & AdditionalProps = {
            ...(additionalProps as AdditionalProps),
            params,
            searchParams,
        }
        
        return <Component {...componentProps} />
    }
    
    const displayName = (Component as { displayName?: string; name?: string }).displayName 
        ?? (Component as { name?: string }).name 
        ?? 'Component'
    WrappedComponent.displayName = `ServerPage(${displayName})`
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

/**
 * Helper to wrap a page component with type-safe params/search unwrapping.
 * This is the HOC pattern version of createPage.
 */
export function withPage<
    Params extends z.ZodType,
    Search extends z.ZodType,
>(
    paramsSchema: Params,
    searchSchema: Search
) {
    return function wrapper<AdditionalProps extends object = object>(
        Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>
    ): React.ComponentType<NextPagePropsInternal<Params, Search> & BasePageProps & AdditionalProps> {
        return createPage({ params: paramsSchema, search: searchSchema }, Component) as React.ComponentType<NextPagePropsInternal<Params, Search> & BasePageProps & AdditionalProps>
    }
}

// ============================================================================
// Session Page Wrappers
// ============================================================================

// Session constants
const SESSION_QUERY_KEY = ['session']
const DEFAULT_SESSION_COOKIE = 'better-auth.session_token'

/**
 * Creates a session-aware page wrapper that:
 * 1. Fetches session on the server using the configured auth adapter
 * 2. Hydrates React Query cache (if configured)
 * 3. Unwraps params/searchParams promises
 * 4. Passes session as a prop to the component
 * 
 * @example
 * ```tsx
 * import { createSessionPage } from '@repo/declarative-routing/page-wrappers'
 * 
 * export default createSessionPage(
 *   { params: z.object({ id: z.string() }), search: z.object({}) },
 *   async ({ params, searchParams, session }) => {
 *     return <div>{session?.user.name} - {params.id}</div>
 *   }
 * )
 * ```
 */
export function createSessionPage<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
    S extends Session = Session,
>(
    schemas: SchemasConfig<Params, Search>,
    Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps & { session: S | null }>,
    options?: SessionOptions,
    /**
     * Optional: Function to check if auth cookie exists.
     * If not provided, session will always be fetched.
     */
    checkAuthCookie?: () => Promise<boolean>
): React.ComponentType<NextPagePropsInternal<Params, Search> & BasePageProps & Omit<AdditionalProps, 'session'>> {
    type WrapperProps = NextPagePropsInternal<Params, Search> & BasePageProps & Omit<AdditionalProps, 'session'>
    
    const { checkCookie = true, sessionCookie = DEFAULT_SESSION_COOKIE } = options ?? {}
    
    async function WrappedComponent(props: WrapperProps): Promise<React.ReactNode> {
        const authAdapter = getServerAuthAdapter()
        
        // Check for auth cookie to avoid unnecessary session fetch
        let hasAuthCookie = true
        if (checkCookie && checkAuthCookie) {
            hasAuthCookie = await checkAuthCookie()
        }
        
        let session: S | null = null
        if (hasAuthCookie) {
            const { data } = await authAdapter.getSession()
            session = data ? (data as S) : null
        }

        // Unwrap promises using async/await
        const rawParams = await props.params
        const rawSearchParams = await props.searchParams
        const params = schemas.params.parse(rawParams) as z.output<Params>
        const searchParams = schemas.search.parse(rawSearchParams) as z.output<Search>
        const additionalProps = extractAdditionalProps(props)
        
        const componentProps = {
            ...(additionalProps as AdditionalProps),
            params,
            searchParams,
            session,
        } as UnwrappedPageProps<Params, Search> & AdditionalProps & { session: S | null }

        // If React Query integration is configured, hydrate the session
        console.log('[createSessionPage] React Query configured:', {
            HydrationBoundary: !!HydrationBoundary,
            createQueryClient: !!createQueryClient,
            dehydrateQueryClient: !!dehydrateQueryClient,
            session: session ? { userId: (session as { user?: { id?: string } }).user?.id } : null,
        })
        
        if (HydrationBoundary && createQueryClient && dehydrateQueryClient) {
            const queryClient = createQueryClient()
            // Always set session data (even if null) so client knows it was fetched
            // Client distinguishes "not fetched" (undefined) from "fetched but no session" (null)
            queryClient.setQueryData(SESSION_QUERY_KEY, session)
            const dehydratedState = dehydrateQueryClient(queryClient)
            console.log('[createSessionPage] Dehydrated state:', JSON.stringify(dehydratedState).slice(0, 500))
            
            return (
                <HydrationBoundary state={dehydratedState}>
                    <Component {...componentProps} />
                </HydrationBoundary>
            )
        }
        
        // Without React Query, just render the component
        return <Component {...componentProps} />
    }
    
    const displayName = (Component as { displayName?: string; name?: string }).displayName 
        ?? (Component as { name?: string }).name 
        ?? 'Component'
    WrappedComponent.displayName = `ServerSessionPage(${displayName})`
    
    // Suppress unused variable warning for sessionCookie
    void sessionCookie
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

// ============================================================================
// Factory Pattern - Create pre-configured page wrappers
// ============================================================================

/**
 * Configuration for creating page wrappers with auth injection.
 */
export type CreatePageWrappersConfig<S extends Session = Session> = {
    /**
     * Server auth adapter - provides getSession function.
     */
    auth: ServerAuthAdapter
    /**
     * Optional React Query integration for session hydration.
     */
    reactQuery?: {
        HydrationBoundary: React.ComponentType<{ state: unknown; children: React.ReactNode }>
        createQueryClient: () => { setQueryData: (key: unknown[], data: unknown) => void }
        dehydrate: (client: unknown) => unknown
    }
    /**
     * Optional function to check if auth cookie exists.
     */
    checkAuthCookie?: () => Promise<boolean>
    /**
     * @internal Type marker for session type inference - not used at runtime
     */
    _sessionType?: S
}

/**
 * Creates pre-configured page wrapper functions with auth already injected.
 * This is the recommended way to set up declarative routing with authentication.
 * 
 * @example
 * ```tsx
 * // apps/web/src/routes/makeRoute.tsx
 * import { createPageWrappers } from '@repo/declarative-routing/page-wrappers/server'
 * import { getSession } from '@/lib/auth'
 * import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
 * import { cookies } from 'next/headers'
 * 
 * export const { createPage, createSessionPage, createClientPage } = createPageWrappers({
 *   auth: { getSession },
 *   reactQuery: {
 *     HydrationBoundary,
 *     createQueryClient: () => new QueryClient(),
 *     dehydrate,
 *   },
 *   checkAuthCookie: async () => {
 *     const cookieStore = await cookies()
 *     return cookieStore.has('better-auth.session_token')
 *   },
 * })
 * ```
 */
export function createPageWrappers<S extends Session = Session>(
    config: CreatePageWrappersConfig<S>
) {
    // Configure the global auth adapter (for createSessionPage)
    configureServerAuth(config.auth, config.reactQuery)
    
    // Return bound versions of the page wrappers
    return {
        /**
         * Create a page that unwraps params/search.
         * Uses async/await on server, React.use() on client (via conditional exports).
         */
        createPage,
        
        /**
         * Create a session-aware page with auth already configured.
         * On server: fetches session and hydrates React Query cache.
         * On client: uses useSession hook from configured adapter.
         */
        createSessionPage: <
            Params extends z.ZodType,
            Search extends z.ZodType,
            AdditionalProps extends object = object,
        >(
            schemas: SchemasConfig<Params, Search>,
            Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps & { session: S | null }>,
            options?: SessionOptions
        ) => createSessionPage<Params, Search, AdditionalProps, S>(
            schemas,
            Component,
            options,
            config.checkAuthCookie
        ),
    }
}

// ============================================================================
// Client-only exports (stubs for type compatibility)
// ============================================================================

/**
 * Client-side session injection HOC.
 * 
 * NOTE: This is a stub for server-side type compatibility.
 * The actual implementation is in client.tsx and will be used via conditional exports.
 * If this function is called on the server, it will throw an error.
 * 
 * @example Client-side usage (via conditional exports):
 * ```tsx
 * 'use client'
 * import { withClientSession } from '@repo/declarative-routing/page-wrappers'
 * 
 * function MyComponent({ session }: { session: Session }) {
 *   return <div>{session.user.name}</div>
 * }
 * 
 * export default withClientSession(MyComponent)
 * ```
 */
export function withClientSession<P extends { session: S | null }, S extends Session = Session>(
    WrappedComponent: React.ComponentType<P>
): React.ComponentType<Omit<P, 'session'>> {
    // This should never be called on the server
    // The actual implementation is in client.tsx
    throw new Error(
        'withClientSession cannot be used on the server. ' +
        'Make sure this is only imported in client components ("use client").'
    )
    
    // TypeScript needs a return for the type signature
     
    return WrappedComponent as unknown as React.ComponentType<Omit<P, 'session'>>
}

// Re-export types
export type { z }
export type {
    Session,
    ServerAuthAdapter,
    SessionOptions,
    SchemasConfig,
    UnwrappedPageProps,
    BasePageProps,
} from '../types'
