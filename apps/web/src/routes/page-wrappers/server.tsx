/**
 * Server-side page wrapper utilities
 * 
 * This file provides the real implementations that:
 * 1. Unwrap params/searchParams promises using async/await (server-only)
 * 2. Validate params/search using Zod schemas
 * 3. Fetch and hydrate session for SessionPage using cookie cache (no HTTP!)
 * 
 * The package.json conditional exports ensure:
 * - Server bundles (react-server condition): Use this file
 * - Client bundles (default condition): Use client.tsx which uses React.use()
 */
import 'server-only'

import React from 'react'
import { z } from 'zod'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { $Infer } from '@/lib/auth'
import { getSessionFromCookie, hasSessionCookie } from '@/lib/auth/cookie-session'

// Session types
type SessionType = typeof $Infer.Session

// Session constants
const SESSION_QUERY_KEY = ['session']

// Session options interface
export interface SessionOptions {
    checkCookie?: boolean
}

// Types for unwrapped page props (what components receive)
export interface UnwrappedPageProps<
    Params extends z.ZodType,
    Search extends z.ZodType,
> {
    params: z.output<Params>
    searchParams: z.output<Search>
}

// Types for Next.js page props (Promise-based)
export interface NextPageProps<
    Params extends z.ZodType = z.ZodType,
    Search extends z.ZodType = z.ZodType,
> {
    params: Promise<z.output<Params>>
    searchParams: Promise<z.output<Search>>
}

// Base page props
export interface BasePageProps {
    children?: React.ReactNode
}

/**
 * Helper to cast a component to the correct type without inference leakage
 */
function asPageComponent<T>(component: React.ComponentType<T>): React.ComponentType<T> {
    return component
}

/**
 * Helper to extract additional props without triggering unused variable lint errors
 */
function extractAdditionalProps<T extends object>(
    props: T
): Omit<T, 'params' | 'searchParams' | 'children'> {
    // Using object rest with explicitly typed intermediate to avoid lint errors
    const { params, searchParams, children, ...rest } = props as T & {
        params?: unknown
        searchParams?: unknown
        children?: unknown
    }
    // Explicitly void the extracted props to avoid unused variable warnings
    void params
    void searchParams
    void children
    return rest as Omit<T, 'params' | 'searchParams' | 'children'>
}

/**
 * Creates a server page wrapper that unwraps and validates params/search
 * 
 * On the server, we can use async/await to unwrap the promises from Next.js
 * and validate them with Zod schemas before passing to the component.
 * 
 * @example
 * ```tsx
 * // page.tsx (Server Component)
 * import { createPage } from '@/routes/page-wrappers'
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
    schemas: {
        params: Params
        search: Search
    },
    Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>
): React.ComponentType<NextPageProps<Params, Search> & BasePageProps & AdditionalProps> {
    type WrapperProps = NextPageProps<Params, Search> & BasePageProps & AdditionalProps
    
    async function WrappedComponent(props: WrapperProps): Promise<React.ReactNode> {
        // Unwrap promises (server-only operation using async/await)
        const rawParams = await props.params
        const rawSearchParams = await props.searchParams
        
        // Validate with Zod schemas
        const params = schemas.params.parse(rawParams) as z.output<Params>
        const searchParams = schemas.search.parse(rawSearchParams) as z.output<Search>
        
        // Extract additional props (everything except params, searchParams, and children)
        const additionalProps = extractAdditionalProps(props)
        
        // Build the component props with unwrapped params/search
        const componentProps: UnwrappedPageProps<Params, Search> & AdditionalProps = {
            ...(additionalProps as AdditionalProps),
            params,
            searchParams,
        }
        
        return <Component {...componentProps} />
    }
    
    WrappedComponent.displayName = `ServerPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

/**
 * Creates a client page wrapper - on server, this uses async/await
 * The actual client implementation uses React.use()
 * 
 * This function exists so makeRoute.tsx can use a single import path
 * and get the right implementation based on the bundle context.
 */
export function createClientPage<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
>(
    schemas: {
        params: Params
        search: Search
    },
    Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>
): React.ComponentType<NextPageProps<Params, Search> & BasePageProps & AdditionalProps> {
    type WrapperProps = NextPageProps<Params, Search> & BasePageProps & AdditionalProps
    
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
    
    WrappedComponent.displayName = `ServerPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

/**
 * Helper to wrap a page component with type-safe params/search unwrapping
 * This is the HOC pattern version of createPage
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
    ): React.ComponentType<NextPageProps<Params, Search> & BasePageProps & AdditionalProps> {
        type WrapperProps = NextPageProps<Params, Search> & BasePageProps & AdditionalProps
        
        async function WrappedComponent(props: WrapperProps): Promise<React.ReactNode> {
            const rawParams = await props.params
            const rawSearchParams = await props.searchParams
            const params = paramsSchema.parse(rawParams) as z.output<Params>
            const searchParams = searchSchema.parse(rawSearchParams) as z.output<Search>
            const additionalProps = extractAdditionalProps(props)
            const componentProps: UnwrappedPageProps<Params, Search> & AdditionalProps = {
                ...(additionalProps as AdditionalProps),
                params,
                searchParams,
            }
            return <Component {...componentProps} />
        }
        
        WrappedComponent.displayName = `ServerPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
        
        return asPageComponent<WrapperProps>(WrappedComponent)
    }
}

/**
 * Creates a session-aware page wrapper that:
 * 1. Reads session directly from cookie cache (no HTTP request - much faster!)
 * 2. Hydrates React Query with the session data
 * 3. Unwraps params/searchParams promises
 * 4. Passes session as a prop to the component
 * 
 * Performance:
 * - Previous: ~1500ms (HTTP request to API for session)
 * - Current: <5ms (decrypt session from cookie locally)
 * 
 * @example
 * ```tsx
 * import { createSessionPage } from '@/routes/page-wrappers'
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
>(
    schemas: {
        params: Params
        search: Search
    },
    Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps & { session: SessionType | null }>,
    options?: SessionOptions
): React.ComponentType<NextPageProps<Params, Search> & BasePageProps & Omit<AdditionalProps, 'session'>> {
    type WrapperProps = NextPageProps<Params, Search> & BasePageProps & Omit<AdditionalProps, 'session'>
    
    const { checkCookie = true } = options ?? {}
    
    async function WrappedComponent(props: WrapperProps): Promise<React.ReactNode> {
        // Check for auth cookie to avoid unnecessary session read
        const hasAuthCookie = checkCookie ? await hasSessionCookie() : true
        
        let session: SessionType | null = null

        if (hasAuthCookie) {
            // Use cookie-based session retrieval - MUCH faster than HTTP!
            // ~5ms vs ~1500ms for HTTP-based getSession()
            session = await getSessionFromCookie()
        }

        // Create a QueryClient and prime it with the session
        const queryClient = new QueryClient()
        
        // Always set query data (even if null) so client knows session was fetched
        // Client distinguishes "not fetched" (undefined) from "fetched but no session" (null)
        queryClient.setQueryData(SESSION_QUERY_KEY, session)

        const dehydratedState = dehydrate(queryClient)

        // Unwrap promises using async/await
        const rawParams = await props.params
        const rawSearchParams = await props.searchParams
        
        // Validate with Zod schemas
        const params = schemas.params.parse(rawParams) as z.output<Params>
        const searchParams = schemas.search.parse(rawSearchParams) as z.output<Search>
        
        // Extract additional props
        const additionalProps = extractAdditionalProps(props)
        
        // Build the component props with unwrapped params/search and session
        const componentProps = {
            ...(additionalProps as AdditionalProps),
            params,
            searchParams,
            session,
        } as UnwrappedPageProps<Params, Search> & AdditionalProps & { session: SessionType | null }
        
        return (
            <HydrationBoundary state={dehydratedState}>
                <Component {...componentProps} />
            </HydrationBoundary>
        )
    }
    
    WrappedComponent.displayName = `ServerSessionPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

// Re-export types
export type { z }
