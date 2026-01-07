/**
 * Client-side page wrapper utilities
 * 
 * This file provides client-side implementations that:
 * 1. Use React.use() to unwrap params/searchParams promises
 * 2. Validate params/search using Zod schemas
 * 3. Use useSession() hook for SessionPage
 * 
 * The package.json conditional exports ensure:
 * - Client bundles (default condition): Use this file with React.use()
 * - Server bundles (react-server condition): Use server.tsx with async/await
 * 
 * NOTE: Components using this must have 'use client' at the top of their file.
 */
'use client'

import React, { use } from 'react'
import { z } from 'zod'
import { useSession } from '@/lib/auth'

// Session options interface (same as server)
export interface SessionOptions {
    checkCookie?: boolean
    sessionCookie?: string
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
 * Extracts additional props by omitting params, searchParams, and children
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
 * Creates a page wrapper that unwraps and validates params/search
 * 
 * On the client, we use React.use() to unwrap the promises from Next.js
 * and validate them with Zod schemas before passing to the component.
 * 
 * This version is loaded when the component is in a client bundle.
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
    
    function WrappedComponent(props: WrapperProps): React.ReactNode {
        // Use React.use() to unwrap promises (works in client components with Suspense)
        const rawParams = use(props.params)
        const rawSearchParams = use(props.searchParams)
        
        // Validate with Zod schemas
        const params = schemas.params.parse(rawParams) as z.output<Params>
        const searchParams = schemas.search.parse(rawSearchParams) as z.output<Search>
        
        // Extract additional props (everything except params and searchParams)
        const additionalProps = extractAdditionalProps(props)
        
        // Build the component props with unwrapped params/search
        const componentProps: UnwrappedPageProps<Params, Search> & AdditionalProps = {
            ...(additionalProps as AdditionalProps),
            params,
            searchParams,
        }
        
        return <Component {...componentProps} />
    }
    
    WrappedComponent.displayName = `ClientPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

/**
 * Creates a client page wrapper using React.use() for promise unwrapping
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createClientPage } from '@/routes/page-wrappers'
 * 
 * export default createClientPage(
 *   { params: z.object({ id: z.string() }), search: z.object({}) },
 *   ({ params, searchParams }) => {
 *     const [count, setCount] = useState(0)
 *     return <div>{params.id} - {count}</div>
 *   }
 * )
 * ```
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
    
    function WrappedComponent(props: WrapperProps): React.ReactNode {
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
    
    WrappedComponent.displayName = `ClientPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
    
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
        
        function WrappedComponent(props: WrapperProps): React.ReactNode {
            const rawParams = use(props.params)
            const rawSearchParams = use(props.searchParams)
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
        
        WrappedComponent.displayName = `ClientPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
        
        return asPageComponent<WrapperProps>(WrappedComponent)
    }
}

/**
 * Client-side version of createSessionPage
 * 
 * On the client, this uses the useSession() hook from Better Auth.
 * The session data is already hydrated from the server via React Query.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createSessionPage } from '@/routes/page-wrappers'
 * 
 * export default createSessionPage(
 *   { params: z.object({ id: z.string() }), search: z.object({}) },
 *   ({ params, searchParams, session }) => {
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
    Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps & { session: typeof import('@/lib/auth').$Infer.Session | null }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: SessionOptions
): React.ComponentType<NextPageProps<Params, Search> & BasePageProps & Omit<AdditionalProps, 'session'>> {
    type WrapperProps = NextPageProps<Params, Search> & BasePageProps & Omit<AdditionalProps, 'session'>
    
    function WrappedComponent(props: WrapperProps): React.ReactNode {
        // Use React.use() to unwrap promises
        const rawParams = use(props.params)
        const rawSearchParams = use(props.searchParams)
        
        // Validate with Zod schemas
        const params = schemas.params.parse(rawParams) as z.output<Params>
        const searchParams = schemas.search.parse(rawSearchParams) as z.output<Search>
        
        // Use Better Auth hook for session (reads from hydrated cache)
        const { data: session, isPending } = useSession()
        
        // Show loading state while session is loading
        if (isPending) {
            return null // Or a loading spinner
        }
        
        // Extract additional props
        const additionalProps = extractAdditionalProps(props)
        
        // Build the component props with unwrapped params/search and session
        const componentProps = {
            ...(additionalProps as AdditionalProps),
            params,
            searchParams,
            session: session ?? null,
        } as UnwrappedPageProps<Params, Search> & AdditionalProps & { session: typeof import('@/lib/auth').$Infer.Session | null }
        
        return <Component {...componentProps} />
    }
    
    WrappedComponent.displayName = `ClientSessionPage(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`
    
    return asPageComponent<WrapperProps>(WrappedComponent)
}

// Re-export types
export type { z }
