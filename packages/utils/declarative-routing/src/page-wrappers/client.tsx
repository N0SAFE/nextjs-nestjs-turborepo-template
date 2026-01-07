'use client'

/**
 * Client-side page wrapper utilities
 * 
 * This file provides the client implementations that:
 * 1. Unwrap params/searchParams promises using React.use() (client-side)
 * 2. Validate params/search using Zod schemas
 * 3. Use the useSession hook for session access (using injected auth adapter)
 * 
 * The package.json conditional exports ensure:
 * - Server bundles (react-server condition): Use server.ts
 * - Client bundles (default condition): Use this file
 * 
 * IMPORTANT: All React.use() calls that access dynamic data (params/searchParams)
 * must be wrapped in a Suspense boundary for SSG/prerendering to work correctly.
 * This is a Next.js 15+ requirement.
 */

import React, { use, Suspense } from 'react'
import { z } from 'zod'
import type {
    Session,
    ClientAuthAdapter,
    ClientSessionProps,
    SessionOptions,
    SchemasConfig,
    UnwrappedPageProps,
    BasePageProps,
} from '../types'

// ============================================================================
// Configuration - Must be set before using session wrappers
// ============================================================================

let clientAuthAdapter: ClientAuthAdapter | null = null

/**
 * Configure the client-side auth adapter.
 * Must be called before using client session wrappers.
 * 
 * @example
 * ```tsx
 * // In your app's client setup (e.g., provider)
 * import { configureClientAuth } from '@repo/declarative-routing/page-wrappers'
 * import { useSession } from '@/lib/auth'
 * 
 * configureClientAuth({
 *   useSession: () => {
 *     const session = useSession()
 *     return {
 *       data: session.data,
 *       isPending: session.isPending,
 *       refetch: session.refetch,
 *     }
 *   }
 * })
 * ```
 */
export function configureClientAuth(adapter: ClientAuthAdapter): void {
    clientAuthAdapter = adapter
}

/**
 * Get the configured client auth adapter.
 * Throws if not configured.
 */
function getClientAuthAdapter(): ClientAuthAdapter {
    if (!clientAuthAdapter) {
        throw new Error(
            'Client auth adapter not configured. Call configureClientAuth() before using client session wrappers.'
        )
    }
    return clientAuthAdapter
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
 * Creates a client page wrapper that unwraps and validates params/search.
 * 
 * On the client, we use React.use() to unwrap the promises from Next.js
 * and validate them with Zod schemas before passing to the component.
 * 
 * IMPORTANT: The inner component that calls React.use() is wrapped in a Suspense
 * boundary to support Next.js 15+ SSG/prerendering where accessing dynamic data
 * (searchParams) requires Suspense.
 * 
 * @example
 * ```tsx
 * // page.tsx (Client Component)
 * 'use client'
 * import { createPage } from '@repo/declarative-routing/page-wrappers'
 * 
 * export default createPage(
 *   { params: z.object({ id: z.string() }), search: z.object({}) },
 *   ({ params, searchParams }) => {
 *     return <div>ID: {params.id}</div>
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
    
    // Inner component that unwraps promises using React.use()
    // Must be inside Suspense boundary for SSG/prerendering compatibility
    function InnerComponent(props: WrapperProps): React.ReactNode {
        // Use React.use() to unwrap promises on the client
        const rawParams = use(props.params)
        const rawSearchParams = use(props.searchParams)
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
    
    // Outer wrapper with Suspense boundary for SSG/prerendering support
    function WrappedComponent(props: WrapperProps): React.ReactNode {
        return (
            <Suspense fallback={null}>
                <InnerComponent {...props} />
            </Suspense>
        )
    }
    
    const displayName = (Component as { displayName?: string; name?: string }).displayName 
        ?? (Component as { name?: string }).name 
        ?? 'Component'
    WrappedComponent.displayName = `ClientPage(${displayName})`
    
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

/**
 * Creates a client-side session-aware page wrapper that:
 * 1. Unwraps params/searchParams using React.use()
 * 2. Uses the useSession hook from the configured auth adapter
 * 3. Passes session and loading state as props
 * 
 * IMPORTANT: The inner component that calls React.use() is wrapped in a Suspense
 * boundary to support Next.js 15+ SSG/prerendering where accessing dynamic data
 * (searchParams) requires Suspense.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createSessionPage } from '@repo/declarative-routing/page-wrappers'
 * 
 * export default createSessionPage(
 *   { params: z.object({ id: z.string() }), search: z.object({}) },
 *   ({ params, searchParams, session, isLoading }) => {
 *     if (isLoading) return <div>Loading...</div>
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
    Component: React.ComponentType<
        UnwrappedPageProps<Params, Search> & 
        AdditionalProps & 
        ClientSessionProps<S>
    >,
    _options?: SessionOptions
): React.ComponentType<NextPagePropsInternal<Params, Search> & BasePageProps & Omit<AdditionalProps, keyof ClientSessionProps<S>>> {
    // _options is kept for API consistency with server.tsx but not needed on client
    void _options
    
    type WrapperProps = NextPagePropsInternal<Params, Search> & BasePageProps & Omit<AdditionalProps, keyof ClientSessionProps<S>>
    
    // Inner component that unwraps promises using React.use()
    // Must be inside Suspense boundary for SSG/prerendering compatibility
    function InnerComponent(props: WrapperProps): React.ReactNode {
        const authAdapter = getClientAuthAdapter()
        const sessionHook = authAdapter.useSession()
        
        // Use React.use() to unwrap promises
        const rawParams = use(props.params)
        const rawSearchParams = use(props.searchParams)
        const params = schemas.params.parse(rawParams) as z.output<Params>
        const searchParams = schemas.search.parse(rawSearchParams) as z.output<Search>
        const additionalProps = extractAdditionalProps(props)
        
        const componentProps = {
            ...(additionalProps as AdditionalProps),
            params,
            searchParams,
            session: sessionHook.data ?? null,
            isLoading: sessionHook.isPending,
            refetch: () => { void sessionHook.refetch() },
        } as UnwrappedPageProps<Params, Search> & AdditionalProps & ClientSessionProps<S>
        
        return <Component {...componentProps} />
    }
    
    // Outer wrapper with Suspense boundary for SSG/prerendering support
    function WrappedComponent(props: WrapperProps): React.ReactNode {
        return (
            <Suspense fallback={null}>
                <InnerComponent {...props} />
            </Suspense>
        )
    }
    
    const displayName = (Component as { displayName?: string; name?: string }).displayName 
        ?? (Component as { name?: string }).name 
        ?? 'Component'
    WrappedComponent.displayName = `ClientSessionPage(${displayName})`
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

// ============================================================================
// HOC for Session Wrapping
// ============================================================================

/**
 * Higher-Order Component that wraps a component with session access.
 * Uses the configured client auth adapter's useSession hook.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { withClientSession } from '@repo/declarative-routing/page-wrappers'
 * 
 * interface MyComponentProps {
 *   title: string
 * }
 * 
 * function MyComponent({ title, session, isLoading }: MyComponentProps & ClientSessionProps) {
 *   return <div>{title}: {session?.user.name}</div>
 * }
 * 
 * export default withClientSession(MyComponent)
 * ```
 */
export function withClientSession<
    P extends ClientSessionProps<S>,
    S extends Session = Session,
>(
    WrappedComponent: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof ClientSessionProps<S>>> {
    function WithSessionComponent(props: Omit<P, keyof ClientSessionProps<S>>): React.ReactNode {
        const authAdapter = getClientAuthAdapter()
        const sessionHook = authAdapter.useSession()
        
        const enhancedProps = {
            ...props,
            session: sessionHook.data ?? null,
            isLoading: sessionHook.isPending,
            refetch: () => { void sessionHook.refetch() },
        } as P
        
        return <WrappedComponent {...enhancedProps} />
    }
    
    const displayName = (WrappedComponent as { displayName?: string; name?: string }).displayName
        ?? (WrappedComponent as { name?: string }).name
        ?? 'Component'
    WithSessionComponent.displayName = `WithClientSession(${displayName})`
    
    return WithSessionComponent
}

// ============================================================================
// Factory Pattern - Create pre-configured page wrappers
// ============================================================================

/**
 * Configuration for creating page wrappers with auth injection.
 */
export type CreatePageWrappersConfig<S extends Session = Session> = {
    /**
     * Client auth adapter - provides useSession hook.
     */
    auth: ClientAuthAdapter
    /**
     * @internal Type marker for session type inference - not used at runtime
     */
    _sessionType?: S
}

/**
 * Creates pre-configured page wrapper functions with auth already injected.
 * This is the client-side version that uses useSession hook.
 * 
 * @example
 * ```tsx
 * // In a client module
 * 'use client'
 * import { createPageWrappers } from '@repo/declarative-routing/page-wrappers'
 * import { useSession } from '@/lib/auth'
 * 
 * export const { createPage, createSessionPage } = createPageWrappers({
 *   auth: {
 *     useSession: () => {
 *       const session = useSession()
 *       return { data: session.data, isPending: session.isPending, refetch: session.refetch }
 *     }
 *   },
 * })
 * ```
 */
export function createPageWrappers<S extends Session = Session>(
    config: CreatePageWrappersConfig<S>
) {
    // Configure the global auth adapter
    configureClientAuth(config.auth)
    
    // Return bound versions of the page wrappers
    return {
        /**
         * Create a page that unwraps params/search using React.use().
         */
        createPage,
        
        /**
         * Create a session-aware page with auth already configured.
         * Uses useSession hook from configured adapter.
         */
        createSessionPage: <
            Params extends z.ZodType,
            Search extends z.ZodType,
            AdditionalProps extends object = object,
        >(
            schemas: SchemasConfig<Params, Search>,
            Component: React.ComponentType<
                UnwrappedPageProps<Params, Search> & 
                AdditionalProps & 
                ClientSessionProps<S>
            >,
            options?: SessionOptions
        ) => createSessionPage<Params, Search, AdditionalProps, S>(
            schemas,
            Component,
            options
        ),
    }
}

// Re-export types
export type { z }
export type {
    Session,
    ClientAuthAdapter,
    ClientSessionProps,
    SessionOptions,
    SchemasConfig,
    UnwrappedPageProps,
    BasePageProps,
} from '../types'
