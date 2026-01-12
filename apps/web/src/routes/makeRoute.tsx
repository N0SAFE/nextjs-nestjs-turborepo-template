/*
Derived from: https://www.flightcontrol.dev/blog/fix-nextjs-routing-to-have-full-type-safety
*/
import React from 'react'
import { z } from 'zod'
import queryString from 'query-string'
import Link from 'next/link'
import NProgress from 'nprogress'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { Session } from '@repo/auth'
// IMPORTANT: We explicitly import from /server subpath to ensure server-side implementations
// are used for SessionPage. The conditional exports (react-server condition) don't work
// reliably in monorepos with Next.js bundler.
// 
// - createPage: Used for both server and client pages (params/search validation)
// - createSessionPage: MUST use server version for proper hydration
import { createPage, createSessionPage } from '@repo/declarative-routing/page-wrappers'

// Next.js page props type (Promise-based params/searchParams)
export interface NextPageProps {
    params: Promise<Record<string, string | string[]>>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

const emptySchema = z.object({})

export { emptySchema }

type LinkProps = Parameters<typeof Link>[0]

// When Params is an empty z.object({}), z.input<Params> can resolve to Record<string, never>,
// which poisons intersections (e.g., children: ReactNode becomes never). This conditional
// removes the index-signature when there are no params so React props work as expected.
type ParamProps<P extends z.ZodType> = z.input<P> extends Record<string, never>
    ? object
    : z.input<P>

export interface RouteInfo<
    Params extends z.ZodType,
    Search extends z.ZodType,
> {
    name: string
    params: Params
    search: Search
    description?: string
    anchors?: z.ZodEnum<Record<string, string>>
}

export interface GetInfo<Result extends z.ZodType> {
    result: Result
}

export interface PostInfo<Body extends z.ZodType, Result extends z.ZodType> {
    body: Body
    result: Result
    description?: string
}

export interface PutInfo<Body extends z.ZodType, Result extends z.ZodType> {
    body: Body
    result: Result
    description?: string
}

// Helper functions for type-safe route info creation
export function createRouteInfo<
    Params extends z.ZodType = typeof emptySchema,
    Search extends z.ZodType = typeof emptySchema,
>(
    info: {
        name: string
        params?: Params
        search?: Search
        description?: string
        anchors?: z.ZodEnum<Record<string, string>>
    }
): RouteInfo<
    Params extends undefined ? typeof emptySchema : Params,
    Search extends undefined ? typeof emptySchema : Search
> {
    return {
        name: info.name,
        params: (info.params ?? emptySchema) as Params extends undefined ? typeof emptySchema : Params,
        search: (info.search ?? emptySchema) as Search extends undefined ? typeof emptySchema : Search,
        description: info.description,
        ...(info.anchors ? { anchors: info.anchors } : {}),
    } as RouteInfo<
        Params extends undefined ? typeof emptySchema : Params,
        Search extends undefined ? typeof emptySchema : Search
    >
}

export function createGetInfo<Result extends z.ZodType>(
    info: {
        result: Result
    }
): GetInfo<Result> {
    return {
        result: info.result,
    }
}

export function createPostInfo<
    Body extends z.ZodType,
    Result extends z.ZodType
>(
    info: {
        body: Body
        result: Result
        description?: string
    }
): PostInfo<Body, Result> {
    return {
        body: info.body,
        result: info.result,
        description: info.description,
    }
}

export function createPutInfo<
    Body extends z.ZodType,
    Result extends z.ZodType
>(
    info: {
        body: Body
        result: Result
        description?: string
    }
): PutInfo<Body, Result> {
    return {
        body: info.body,
        result: info.result,
        description: info.description,
    }
}

export function createDeleteInfo(): object {
    return {}
}

type FetchOptions = Parameters<typeof fetch>[1]

export interface CoreRouteElements<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
> {
    params: z.output<Params>
    paramsSchema: Params
    search: z.output<Search>
    searchSchema: Search
}

// Route flags passed from route.info.ts
export interface RouteFlags {
    page: boolean
    layout: boolean
}

type PutRouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
    Body extends z.ZodType,
    Result extends z.ZodType,
> = CoreRouteElements<Params, Search> & {
    (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>>

    body: z.output<Body>
    bodySchema: Body
    result: z.output<Result>
    resultSchema: Result
}

type PostRouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
    Body extends z.ZodType,
    Result extends z.ZodType,
> = CoreRouteElements<Params, Search> & {
    (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>>

    body: z.output<Body>
    bodySchema: Body
    result: z.output<Result>
    resultSchema: Result
}

type GetRouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
    Result extends z.ZodType,
> = CoreRouteElements<Params, Search> & {
    (
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>>

    result: z.output<Result>
    resultSchema: Result
}

type DeleteRouteBuilder<Params extends z.ZodType> = CoreRouteElements<
    Params,
    z.ZodType
> & ((p?: z.input<Params>, options?: FetchOptions) => Promise<void>)


// Page component props that all pages/layouts receive
export interface BasePageProps {
    children?: React.ReactNode
}

// Typed props including params and search (what Next.js passes - Promise-wrapped)
// Works for both pages (params + searchParams) and layouts (params only)
export type PageProps<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    params: Promise<z.output<Params>>
    searchParams: Promise<z.output<Search>>
} & BasePageProps

// Unwrapped props (what components receive after our wrappers unwrap promises)
export type UnwrappedPageProps<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    params: z.output<Params>
    searchParams: z.output<Search>
} & BasePageProps

// Wrapper component type (receives Promise-wrapped props from Next.js)
export type PageComponent<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
> = React.FC<PageProps<Params, Search> & AdditionalProps>

// Unwrapped component type (what developers write - receives unwrapped props)
export type UnwrappedPageComponent<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
> = React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>

// Utility types to extract params and search types from RouteBuilder
export type RouteBuilderParams<T extends PageRouteBuilder<z.ZodType, z.ZodType> | LayoutRouteBuilder<z.ZodType, z.ZodType>> = T extends PageRouteBuilder<infer Params, z.ZodType> | LayoutRouteBuilder<infer Params, z.ZodType>
    ? z.output<Params> 
    : never

export type RouteBuilderSearch<T extends PageRouteBuilder<z.ZodType, z.ZodType> | LayoutRouteBuilder<z.ZodType, z.ZodType>> = T extends PageRouteBuilder<z.ZodType, infer Search> | LayoutRouteBuilder<z.ZodType, infer Search>
    ? z.output<Search> 
    : never

// For backwards compatibility
export type RouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = PageRouteBuilder<Params, Search>

/**
 * LayoutRouteBuilder: Builder type for layout-only routes.
 * Does NOT include navigation methods (Link, ParamsLink, immediate)
 * since layouts cannot be navigated to directly.
 * Only provides Route and SessionRoute wrappers for the layout component.
 */
export type LayoutRouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = CoreRouteElements<Params, Search> & {
    routeName: string
    
    /** Indicates this is a layout-only route */
    isLayoutOnly: true
    
    /** Indicates whether this folder has a page.tsx */
    hasPage: false
    
    /** Indicates whether this folder has a layout.tsx */
    hasLayout: true

    /**
     * Route: Wrapper for layout.tsx components.
     * Works with both server and client components. Provides type-safe params 
     * validation, automatically unwrapping Promise-wrapped props.
     * 
     * For layouts: receives params and children (searchParams will be empty object)
     * 
     * @example Server Layout
     * ```tsx
     * // app/(dashboard)/layout.tsx
     * export default DashboardRoute.Route(async ({ params, children }) => {
     *   const config = await fetchDashboardConfig(params.orgId)
     *   return <DashboardShell config={config}>{children}</DashboardShell>
     * })
     * ```
     * 
     * @example Client Layout
     * ```tsx
     * 'use client'
     * export default DashboardRoute.Route(({ params, children }) => {
     *   const [sidebarOpen, setSidebarOpen] = useState(false)
     *   return <SidebarLayout open={sidebarOpen}>{children}</SidebarLayout>
     * })
     * ```
     */
    Route: <AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps>
    ) => PageComponent<Params, Search, AdditionalProps>

    /**
     * SessionRoute: Wrapper that automatically fetches and hydrates
     * the session on the server. Works for layout.tsx.
     * The session is passed as a prop to the component. Client components 
     * using useSession() will read from the hydrated cache without making 
     * additional requests.
     * 
     * @example Session Layout
     * ```tsx
     * // app/(dashboard)/layout.tsx
     * export default DashboardRoute.SessionRoute(async ({ session, params, children }) => {
     *   return (
     *     <DashboardShell user={session?.user}>
     *       <Sidebar user={session?.user} />
     *       {children}
     *     </DashboardShell>
     *   )
     * })
     * ```
     */
    SessionRoute: <AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps & { session: Session | null }>,
        options?: {
            checkCookie?: boolean
            sessionCookie?: string
        }
    ) => PageComponent<Params, Search, Omit<AdditionalProps, 'session'>>

    // Validation helpers
    validateParams: (params: unknown) => z.output<Params>
    validateSearch: (search: unknown) => z.output<Search>
}

/**
 * PageRouteBuilder: Builder type for routes with a page.tsx.
 * Includes full navigation methods (Link, ParamsLink, immediate)
 * since pages can be navigated to directly.
 */
export type PageRouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = CoreRouteElements<Params, Search> & {
    (p?: z.input<Params>, search?: z.input<Search>, anchor?: string): string

    immediate: (
        router: AppRouterInstance,
        p?: z.input<Params>,
        search?: z.input<Search>,
        anchor?: string
    ) => void

    routeName: string
    
    /** Indicates this is NOT a layout-only route */
    isLayoutOnly: false
    
    /** Indicates whether this folder has a page.tsx */
    hasPage: true
    
    /** Indicates whether this folder has a layout.tsx */
    hasLayout: boolean

    Link: React.FC<
        Omit<LinkProps, 'href'> &
            ParamProps<Params> & {
                search?: z.input<Search>
                anchor?: string
            } & { children?: React.ReactNode }
    >
    ParamsLink: React.FC<
        Omit<LinkProps, 'href'> & {
            params?: z.input<Params>
            search?: z.input<Search>
            anchor?: string
        } & { children?: React.ReactNode }
    >

    /**
     * Route: Universal wrapper for both page.tsx and layout.tsx components.
     * Works with both server and client components. Provides type-safe params 
     * and search validation, automatically unwrapping Promise-wrapped props.
     * 
     * For pages: receives params, searchParams, and optional children
     * For layouts: receives params and children (searchParams will be empty object)
     * 
     * @example Server Page
     * ```tsx
     * // app/(dashboard)/[id]/page.tsx
     * export default MyRoute.Route(async ({ params, searchParams }) => {
     *   const data = await fetchData(params.id)
     *   return <div>{data.name}</div>
     * })
     * ```
     * 
     * @example Client Page
     * ```tsx
     * 'use client'
     * export default MyRoute.Route(({ params, searchParams }) => {
     *   const [count, setCount] = useState(0)
     *   return <button onClick={() => setCount(count + 1)}>{count}</button>
     * })
     * ```
     * 
     * @example Server Layout
     * ```tsx
     * // app/(dashboard)/layout.tsx
     * export default DashboardRoute.Route(async ({ params, children }) => {
     *   const config = await fetchDashboardConfig(params.orgId)
     *   return <DashboardShell config={config}>{children}</DashboardShell>
     * })
     * ```
     * 
     * @example Client Layout
     * ```tsx
     * 'use client'
     * export default DashboardRoute.Route(({ params, children }) => {
     *   const [sidebarOpen, setSidebarOpen] = useState(false)
     *   return <SidebarLayout open={sidebarOpen}>{children}</SidebarLayout>
     * })
     * ```
     */
    Route: <AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps>
    ) => PageComponent<Params, Search, AdditionalProps>

    /**
     * SessionRoute: Universal wrapper that automatically fetches and hydrates
     * the session on the server. Works for both page.tsx and layout.tsx.
     * The session is passed as a prop to the component. Client components 
     * using useSession() will read from the hydrated cache without making 
     * additional requests.
     * 
     * This ensures only ONE session fetch per request, even if multiple 
     * components use useSession().
     * 
     * For pages: receives session, params, searchParams, and optional children
     * For layouts: receives session, params, and children
     * 
     * @example Session Page
     * ```tsx
     * // app/(dashboard)/page.tsx
     * export default DashboardHome.SessionRoute(async ({ session, params, searchParams }) => {
     *   return (
     *     <div>
     *       <h1>Welcome {session?.user.name}</h1>
     *       <ClientComponentUsingSession /> // No extra fetch needed
     *     </div>
     *   )
     * })
     * ```
     * 
     * @example Session Layout
     * ```tsx
     * // app/(dashboard)/layout.tsx
     * export default DashboardRoute.SessionRoute(async ({ session, params, children }) => {
     *   return (
     *     <DashboardShell user={session?.user}>
     *       <Sidebar user={session?.user} />
     *       {children}
     *     </DashboardShell>
     *   )
     * })
     * ```
     */
    SessionRoute: <AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps & { session: Session | null }>,
        options?: {
            checkCookie?: boolean
            sessionCookie?: string
        }
    ) => PageComponent<Params, Search, Omit<AdditionalProps, 'session'>>

    // Validation helpers
    validateParams: (params: unknown) => z.output<Params>
    validateSearch: (search: unknown) => z.output<Search>
}

function createPathBuilder<T extends Record<string, string | string[]>>(
    route: string
): (params: T) => string {
    const pathArr = route.split('/')

    let catchAllSegment: ((params: T) => string) | null = null
    if (pathArr.at(-1)?.startsWith('[[...')) {
        const pop = pathArr.pop()
        if (!pop) {
            throw new Error('Unexpected empty path segment')
        }
        const catchKey = pop.replace('[[...', '').replace(']]', '')
        catchAllSegment = (params: T) => {
            const value = params[catchKey]
            if (!Array.isArray(value)) {
                throw new Error(`Expected array for catch-all param ${catchKey}`)
            }
            return `/${value.join('/')}`
        }
    }

    const elems: ((params: T) => string)[] = []
    for (const elem of pathArr) {
        const catchAll = /\[\.\.\.(.*)\]/.exec(elem)
        const param = /\[(.*)\]/.exec(elem)
        if (catchAll?.[1]) {
            const key = catchAll[1]
            elems.push((params: T) => {
                const value = params[key]
                if (!Array.isArray(value)) {
                    throw new Error(`Expected array for catch-all param ${key}`)
                }
                return value.join('/')
            })
        } else if (param?.[1]) {
            const key = param[1]
            elems.push((params: T) => {
                const value = params[key]
                if (Array.isArray(value)) {
                    throw new Error(`Expected string for param ${key}, got array`)
                }
                if (typeof value !== 'string') {
                    throw new Error(`Expected string for param ${key}, got ${typeof value}`)
                }
                return value
            })
        } else if (!(elem.startsWith('(') && elem.endsWith(')'))) {
            elems.push(() => elem)
        }
    }

    return (params: T): string => {
        const p = elems.map((e) => e(params)).join('/')
        if (catchAllSegment) {
            return p + catchAllSegment(params)
        } else {
            return p.length ? p : '/'
        }
    }
}

function createRouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
>(route: string, info: RouteInfo<Params, Search>) {
    const fn = createPathBuilder<Record<string, string | string[]>>(route)

    return (params?: z.input<Params>, search?: z.input<Search>, anchor?: string) => {
        // Validate and parse params
        const safeParams = info.params.safeParse(params ?? {})
        if (!safeParams.success) {
            throw new Error(
                `Invalid params for route ${info.name}: ${safeParams.error.message}`
            )
        }
        
        // Validate search
        const safeSearch = info.search.safeParse(search ?? {})
        if (!safeSearch.success) {
            throw new Error(
                `Invalid search params for route ${info.name}: ${safeSearch.error.message}`
            )
        }

        // Validate anchor if provided
        if (anchor && info.anchors) {
            const safeAnchor = info.anchors.safeParse(anchor)
            if (!safeAnchor.success) {
                throw new Error(
                    `Invalid anchor for route ${info.name}: ${safeAnchor.error.message}`
                )
            }
        }

        // Pass raw params to urlBuilder - params should be Record<string, string | string[]>
        // The type system ensures z.input<Params> is compatible with this at runtime
        const baseUrl = fn((params ?? {}) as Record<string, string | string[]>)
        const searchString = search ? queryString.stringify(search) : ''
        const anchorString = anchor ? `#${anchor}` : ''
        return [baseUrl, searchString ? `?${searchString}` : '', anchorString].join('')
    }
}

export function makePostRoute<
    Params extends z.ZodType,
    Search extends z.ZodType,
    Body extends z.ZodType,
    Result extends z.ZodType,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    postInfo: PostInfo<Body, Result>
): PostRouteBuilder<Params, Search, Body, Result> {
    const urlBuilder = createRouteBuilder(route, info)

    const routeBuilder: PostRouteBuilder<Params, Search, Body, Result> = (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>> => {
        const safeBody = postInfo.body.safeParse(body)
        if (!safeBody.success) {
            throw new Error(
                `Invalid body for route ${info.name}: ${safeBody.error.message}`
            )
        }

        return fetch(urlBuilder(p, search), {
            ...options,
            method: 'POST',
            body: JSON.stringify(safeBody.data),
            headers: {
                ...(options?.headers instanceof Headers
                    ? Object.fromEntries(options.headers.entries())
                    : Array.isArray(options?.headers)
                      ? Object.fromEntries(options.headers)
                      : options?.headers ?? {}),
                'Content-Type': 'application/json',
            },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch ${info.name}: ${res.statusText}`
                    )
                }
                return res.json() as Promise<z.output<Result>>
            })
            .then((data) => {
                const result = postInfo.result.safeParse(data)
                if (!result.success) {
                    throw new Error(
                        `Invalid response for route ${info.name}: ${result.error.message}`
                    )
                }
                return result.data
            })
    }

    routeBuilder.params = undefined as z.output<Params>
    routeBuilder.paramsSchema = info.params
    routeBuilder.search = undefined as z.output<Search>
    routeBuilder.searchSchema = info.search
    routeBuilder.body = undefined as z.output<Body>
    routeBuilder.bodySchema = postInfo.body
    routeBuilder.result = undefined as z.output<Result>
    routeBuilder.resultSchema = postInfo.result

    return routeBuilder
}

export function makePutRoute<
    Params extends z.ZodType,
    Search extends z.ZodType,
    Body extends z.ZodType,
    Result extends z.ZodType,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    putInfo: PutInfo<Body, Result>
): PutRouteBuilder<Params, Search, Body, Result> {
    const urlBuilder = createRouteBuilder(route, info)

    const routeBuilder: PutRouteBuilder<Params, Search, Body, Result> = (
        body: z.input<Body>,
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>> => {
        const safeBody = putInfo.body.safeParse(body)
        if (!safeBody.success) {
            throw new Error(
                `Invalid body for route ${info.name}: ${safeBody.error.message}`
            )
        }

        return fetch(urlBuilder(p, search), {
            ...options,
            method: 'PUT',
            body: JSON.stringify(safeBody.data),
            headers: {
                ...(options?.headers instanceof Headers
                    ? Object.fromEntries(options.headers.entries())
                    : Array.isArray(options?.headers)
                      ? Object.fromEntries(options.headers)
                      : options?.headers ?? {}),
                'Content-Type': 'application/json',
            },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch ${info.name}: ${res.statusText}`
                    )
                }
                return res.json() as Promise<z.output<Result>>
            })
            .then((data) => {
                const result = putInfo.result.safeParse(data)
                if (!result.success) {
                    throw new Error(
                        `Invalid response for route ${info.name}: ${result.error.message}`
                    )
                }
                return result.data
            })
    }

    routeBuilder.params = undefined as z.output<Params>
    routeBuilder.paramsSchema = info.params
    routeBuilder.search = undefined as z.output<Search>
    routeBuilder.searchSchema = info.search
    routeBuilder.body = undefined as z.output<Body>
    routeBuilder.bodySchema = putInfo.body
    routeBuilder.result = undefined as z.output<Result>
    routeBuilder.resultSchema = putInfo.result

    return routeBuilder
}

export function makeGetRoute<
    Params extends z.ZodType,
    Search extends z.ZodType,
    Result extends z.ZodType,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    getInfo: GetInfo<Result>
): GetRouteBuilder<Params, Search, Result> {
    const urlBuilder = createRouteBuilder(route, info)

    const routeBuilder: GetRouteBuilder<Params, Search, Result> = (
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>> => {
        return fetch(urlBuilder(p, search), options)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch ${info.name}: ${res.statusText}`
                    )
                }
                return res.json() as Promise<z.output<Result>>
            })
            .then((data) => {
                const result = getInfo.result.safeParse(data)
                if (!result.success) {
                    throw new Error(
                        `Invalid response for route ${info.name}: ${result.error.message}`
                    )
                }
                return result.data
            })
    }

    routeBuilder.params = undefined as z.output<Params>
    routeBuilder.paramsSchema = info.params
    routeBuilder.search = undefined as z.output<Search>
    routeBuilder.searchSchema = info.search
    routeBuilder.result = undefined as z.output<Result>
    routeBuilder.resultSchema = getInfo.result

    return routeBuilder
}

export function makeDeleteRoute<
    Params extends z.ZodType,
    Search extends z.ZodType,
>(route: string, info: RouteInfo<Params, Search>): DeleteRouteBuilder<Params> {
    const urlBuilder = createRouteBuilder(route, info)

    const routeBuilder = (
        p?: z.input<Params>,
        options?: FetchOptions
    ): Promise<void> => {
        return fetch(urlBuilder(p), options).then((res) => {
            if (!res.ok) {
                throw new Error(
                    `Failed to fetch ${info.name}: ${res.statusText}`
                )
            }
        })
    }

    routeBuilder.params = undefined as z.output<Params>
    routeBuilder.paramsSchema = info.params
    routeBuilder.search = undefined as z.output<Search>
    routeBuilder.searchSchema = info.search

    return routeBuilder
}

/**
 * makeRoute creates a type-safe route builder with navigation and validation methods.
 * 
 * Based on the flags parameter:
 * - Page routes (page=true): Full navigation (Link, ParamsLink, immediate, callable)
 * - Layout-only routes (page=false): Only wrappers (Route, SessionRoute) and validation
 * 
 * @param route - The route path template (e.g., "/users/[id]")
 * @param info - Route info containing name, params schema, and search schema
 * @param flags - Route flags indicating whether this route has a page and/or layout
 * @returns RouteBuilder with methods appropriate for the route type
 */
// Overload: page routes return PageRouteBuilder
export function makeRoute<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    flags: { page: true; layout: boolean }
): PageRouteBuilder<Params, Search>

// Overload: layout-only routes return LayoutRouteBuilder  
export function makeRoute<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    flags: { page: false; layout: boolean }
): LayoutRouteBuilder<Params, Search>

// Overload: default (backwards compatibility - no flags means page route)
export function makeRoute<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(
    route: string,
    info: RouteInfo<Params, Search>
): PageRouteBuilder<Params, Search>

// Implementation
export function makeRoute<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    flags: RouteFlags = { page: true, layout: false }
): PageRouteBuilder<Params, Search> | LayoutRouteBuilder<Params, Search> {
    // For layout-only routes, return a minimal builder without navigation methods
    if (!flags.page) {
        return makeLayoutRoute(route, info, flags)
    }
    
    // For page routes, return the full builder with all navigation methods
    const urlBuilder = createRouteBuilder(route, info) as PageRouteBuilder<Params, Search>

    urlBuilder.immediate = function immediate(
        router: AppRouterInstance,
        p?: z.input<Params>,
        search?: z.input<Search>,
        anchor?: string
    ) {
        const href = urlBuilder(p, search, anchor)
        NProgress.start()
        router.push(href)
    }

    urlBuilder.routeName = info.name
    urlBuilder.isLayoutOnly = false
    urlBuilder.hasPage = true
    urlBuilder.hasLayout = flags.layout

    urlBuilder.ParamsLink = function RouteLink({
        params: linkParams,
        search: linkSearch,
        anchor: linkAnchor,
        children,
        ...props
    }: Omit<LinkProps, 'href'> & {
        params?: z.input<Params>
        search?: z.input<Search>
        anchor?: string
    } & { children?: React.ReactNode }) {
        // Validate anchor
        let validatedAnchor: string | undefined = linkAnchor
        if (linkAnchor && info.anchors) {
            const safeAnchor = info.anchors.safeParse(linkAnchor)
            if (!safeAnchor.success) {
                throw new Error(
                    `Invalid anchor for route ${info.name}: ${safeAnchor.error.message}`
                )
            }
            validatedAnchor = safeAnchor.data
        }
        
        // Pass unparsed params and search to urlBuilder
        return (
            <Link {...props} href={urlBuilder(linkParams, linkSearch, validatedAnchor)}>
                {children}
            </Link>
        )
    }

    urlBuilder.Link = function RouteLink({
        search: linkSearch,
        anchor: linkAnchor,
        children,
        ...props
    }: Omit<LinkProps, 'href'> &
        (ParamProps<Params> extends Record<string, never>
            ? { search?: z.input<Search>; anchor?: string; children?: React.ReactNode }
            : ParamProps<Params> & { search?: z.input<Search>; anchor?: string; children?: React.ReactNode })) {
        // Extract params from props WITHOUT parsing yet
        // Try to get shape keys if it's a ZodObject, otherwise use empty object
        const paramsSchema = info.params as z.ZodObject<z.ZodRawShape> | z.ZodType
        const paramKeys = 'shape' in paramsSchema ? Object.keys(paramsSchema.shape) : []
        const params: Record<string, unknown> = {}
        for (const key of paramKeys) {
            if (key in props) {
                params[key] = (props as Record<string, unknown>)[key]
            }
        }
        
        // Validate anchor
        let validatedAnchor: string | undefined = linkAnchor
        if (linkAnchor && info.anchors) {
            const safeAnchor = info.anchors.safeParse(linkAnchor)
            if (!safeAnchor.success) {
                throw new Error(
                    `Invalid anchor for route ${info.name}: ${safeAnchor.error.message}`
                )
            }
            validatedAnchor = safeAnchor.data
        }
        
        // Remove params from extraProps to avoid passing them as Link props
        const extraProps = { ...props }
        for (const key of paramKeys) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete (extraProps as Record<string, string>)[key]
        }
        
        // Pass unparsed params to urlBuilder
        return (
            <Link
                {...extraProps}
                href={urlBuilder(params as z.input<Params>, linkSearch, validatedAnchor)}
            >
                {children}
            </Link>
        )
    }

    /**
     * Route: Universal wrapper for both server and client components.
     * Works for both page.tsx and layout.tsx files.
     * Provides type-safe params and search validation. Works seamlessly with
     * both async server components and sync client components.
     * 
     * The wrapper defers loading the appropriate implementation until render time,
     * allowing it to work in both server and client contexts via conditional exports.
     * 
     * @example Server Page
     * ```tsx
     * // page.tsx
     * export default MyRoute.Route(async ({ params, searchParams }) => {
     *   const data = await fetchData(params.id)
     *   return <div>{data.name}</div>
     * })
     * ```
     * 
     * @example Server Layout
     * ```tsx
     * // layout.tsx
     * export default DashboardRoute.Route(async ({ params, children }) => {
     *   return (
     *     <DashboardShell>
     *       {children}
     *     </DashboardShell>
     *   )
     * })
     * ```
     * 
     * @example Client Component
     * ```tsx
     * 'use client'
     * export default MyRoute.Route(({ params, searchParams }) => {
     *   const [count, setCount] = useState(0)
     *   return <button onClick={() => setCount(count + 1)}>{count}</button>
     * })
     * ```
     */
    urlBuilder.Route = function RouteWrapper<AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps>
    ): PageComponent<Params, Search, AdditionalProps> {
        // Use createPage from conditional export - bundler resolves to server.tsx in RSC context
        // Works for both page.tsx and layout.tsx - layouts just use children instead of searchParams
        const schemas = { params: info.params, search: info.search }
        
        const WrappedComponent = createPage<Params, Search, AdditionalProps>(
            schemas,
            component
        )
        
        // Preserve component name for debugging
        WrappedComponent.displayName = `RouteWrapper(${(component.displayName ?? component.name) || 'Component'})`
        
        return WrappedComponent as PageComponent<Params, Search, AdditionalProps>
    }

    /**
     * SessionRoute wraps a page or layout component with session handling for both server and client.
     * 
     * Server-side:
     * 1. Fetches session from cookies using getSession()
     * 2. Hydrates session to React Query cache
     * 3. Passes session as prop to component
     * 
     * Client-side:
     * 1. Reads session from React Query cache using useSession()
     * 2. Uses client-side hooks for params/search
     * 3. Passes session as prop to component
     * 
     * This makes SessionRoute isomorphic - works in both server and client components,
     * and works for both page.tsx and layout.tsx files.
     * 
     * @example Server Page
     * ```tsx
     * // page.tsx
     * export default MyRoute.SessionRoute(({ session, params, searchParams }) => {
     *   return <div>Welcome {session?.user.name}</div>
     * })
     * ```
     * 
     * @example Server Layout
     * ```tsx
     * // layout.tsx
     * export default DashboardRoute.SessionRoute(async ({ session, params, children }) => {
     *   return (
     *     <DashboardShell user={session?.user}>
     *       {children}
     *     </DashboardShell>
     *   )
     * })
     * ```
     * 
     * @example Client Component
     * ```tsx
     * // page.tsx
     * 'use client'
     * export default MyRoute.SessionRoute(({ session, params, searchParams }) => {
     *   const [count, setCount] = useState(0)
     *   return <div>{session?.user.name} - Count: {count}</div>
     * })
     * ```
     */
    urlBuilder.SessionRoute = function SessionRouteWrapper<AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps & { session: Session | null }>,
        options?: {
            checkCookie?: boolean
            sessionCookie?: string
        }
    ): PageComponent<Params, Search, Omit<AdditionalProps, 'session'>> {
        // Use createSessionPage from conditional export - bundler resolves to server.tsx in RSC context
        // Works for both page.tsx and layout.tsx - layouts just use children instead of searchParams
        const schemas = { params: info.params, search: info.search }
        
        // createSessionPage handles:
        // 1. Session fetching and hydration (server) / useSession hook (client)
        // 2. params/searchParams unwrapping and validation
        // 3. Passing session as a prop to the component
        type SessionOmittedProps = Omit<AdditionalProps, 'session'>
        const WrappedComponent = createSessionPage<Params, Search, SessionOmittedProps>(
            schemas,
            component as React.ComponentType<UnwrappedPageProps<Params, Search> & SessionOmittedProps & { session: Session | null }>,
            options
        )
        
        // Preserve component name for debugging
        WrappedComponent.displayName = `SessionRouteWrapper(${(component.displayName ?? component.name) || 'Component'})`
        
        return WrappedComponent as PageComponent<Params, Search, Omit<AdditionalProps, 'session'>>
    }

    urlBuilder.validateParams = function validateParams(params: unknown) {
        return info.params.parse(params)
    }

    urlBuilder.validateSearch = function validateSearch(search: unknown) {
        return info.search.parse(search)
    }

    urlBuilder.params = undefined as z.output<Params>
    urlBuilder.paramsSchema = info.params
    urlBuilder.search = undefined as z.output<Search>
    urlBuilder.searchSchema = info.search

    return urlBuilder
}

/**
 * makeLayoutRoute creates a minimal route builder for layout-only routes.
 * 
 * Layout-only routes don't have navigation methods (Link, ParamsLink, immediate)
 * since you can't navigate directly to a layout - you navigate to pages within it.
 * 
 * @param route - The route path template
 * @param info - Route info containing name, params schema, and search schema  
 * @param flags - Route flags (page will be false for layout-only routes)
 * @returns LayoutRouteBuilder with only Route, SessionRoute, and validation methods
 */
function makeLayoutRoute<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(
    route: string,
    info: RouteInfo<Params, Search>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    flags: RouteFlags
): LayoutRouteBuilder<Params, Search> {
    const layoutBuilder = {} as LayoutRouteBuilder<Params, Search>
    
    layoutBuilder.routeName = info.name
    layoutBuilder.isLayoutOnly = true
    layoutBuilder.hasPage = false
    layoutBuilder.hasLayout = true // Layout-only routes always have layout=true by definition

    /**
     * Route: Universal wrapper for layout components.
     * Provides type-safe params validation for layouts.
     */
    layoutBuilder.Route = function RouteWrapper<AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps>
    ): PageComponent<Params, Search, AdditionalProps> {
        const schemas = { params: info.params, search: info.search }
        
        const WrappedComponent = createPage<Params, Search, AdditionalProps>(
            schemas,
            component
        )
        
        WrappedComponent.displayName = `LayoutRouteWrapper(${(component.displayName ?? component.name) || 'Component'})`
        
        return WrappedComponent as PageComponent<Params, Search, AdditionalProps>
    }

    /**
     * SessionRoute: Layout wrapper with session handling.
     */
    layoutBuilder.SessionRoute = function SessionRouteWrapper<AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps & { session: Session | null }>,
        options?: {
            checkCookie?: boolean
            sessionCookie?: string
        }
    ): PageComponent<Params, Search, Omit<AdditionalProps, 'session'>> {
        const schemas = { params: info.params, search: info.search }
        
        type SessionOmittedProps = Omit<AdditionalProps, 'session'>
        const WrappedComponent = createSessionPage<Params, Search, SessionOmittedProps>(
            schemas,
            component as React.ComponentType<UnwrappedPageProps<Params, Search> & SessionOmittedProps & { session: Session | null }>,
            options
        )
        
        WrappedComponent.displayName = `SessionLayoutRouteWrapper(${(component.displayName ?? component.name) || 'Component'})`
        
        return WrappedComponent as PageComponent<Params, Search, Omit<AdditionalProps, 'session'>>
    }

    layoutBuilder.validateParams = function validateParams(params: unknown) {
        return info.params.parse(params)
    }

    layoutBuilder.validateSearch = function validateSearch(search: unknown) {
        return info.search.parse(search)
    }

    layoutBuilder.params = undefined as z.output<Params>
    layoutBuilder.paramsSchema = info.params
    layoutBuilder.search = undefined as z.output<Search>
    layoutBuilder.searchSchema = info.search

    return layoutBuilder
}
