/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Declarative Routing - Route Builder Factory
 * 
 * This module provides type-safe route builders for Next.js applications.
 * Based on: https://www.flightcontrol.dev/blog/fix-nextjs-routing-to-have-full-type-safety
 * 
 * The factory pattern allows injection of:
 * - Page wrapper implementations (server vs client)
 * - Session handling implementations
 * - Custom link components
 */

import React from 'react'
import { z } from 'zod'
import queryString from 'query-string'
import Link from 'next/link'
import NProgress from 'nprogress'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import type {
    Session,
    BasePageProps,
    UnwrappedPageProps,
    RouteInfo,
    GetInfo,
    PostInfo,
    PutInfo,
    SchemasConfig,
    SessionOptions,
} from './types'

// ============================================================================
// Constants
// ============================================================================

export const emptySchema = z.object({})

// ============================================================================
// Types
// ============================================================================

type LinkProps = Parameters<typeof Link>[0]
type FetchOptions = Parameters<typeof fetch>[1]

/**
 * Helper type for component displayName access to avoid unsafe member access on any.
 */
type ComponentWithDisplayName = { displayName?: string; name?: string }

/**
 * Helper type for RouteBuilder with session page wrappers assignment.
 */
type RouteBuilderWithSessionPages = {
    SessionPage: unknown
    ClientSessionPage: unknown
}

/**
 * When Params is an empty z.object({}), z.input<Params> can resolve to Record<string, never>,
 * which poisons intersections (e.g., children: ReactNode becomes never). This conditional
 * removes the index-signature when there are no params so React props work as expected.
 */
type ParamProps<P extends z.ZodType> = z.input<P> extends Record<string, never>
    ? object
    : z.input<P>

/**
 * Core route elements shared by all route builders.
 */
export type CoreRouteElements<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
> = {
    params: z.output<Params>
    paramsSchema: Params
    search: z.output<Search>
    searchSchema: Search
}

/**
 * Page component type that receives Promise-wrapped props from Next.js.
 */
export type PageComponent<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
> = React.ComponentType<{
    params: Promise<z.output<Params>>
    searchParams: Promise<z.output<Search>>
} & BasePageProps & AdditionalProps>

/**
 * Unwrapped page component type (what developers write).
 */
export type UnwrappedPageComponent<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
> = React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>

/**
 * Client session props passed to components.
 */
type ClientSessionInjectedProps<S extends Session = Session> = {
    session: S | null | undefined
    isLoading: boolean
    refetch: () => void
}

// ============================================================================
// Route Builders
// ============================================================================

/**
 * Main RouteBuilder type for page routes.
 */
export type RouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
    RoutePath extends string = string,
    Info extends Record<string, unknown> = Record<string, unknown>,
> = CoreRouteElements<Params, Search> & {
    /**
     * Build URL from params and search.
     */
    (p?: z.input<Params>, search?: z.input<Search>): string
    
    /**
     * Build URL - explicit method version.
     */
    buildUrl: (p?: z.input<Params>, search?: z.input<Search>) => string
    
    /**
     * Route path pattern (e.g., "/products/[id]").
     */
    routePath: RoutePath
    
    /**
     * Route name for debugging.
     */
    routeName: string
    
    /**
     * Additional route info.
     */
    info: Info

    /**
     * Navigate immediately using router.push with NProgress.
     */
    immediate: (
        router: AppRouterInstance,
        p?: z.input<Params>,
        search?: z.input<Search>
    ) => void

    /**
     * Type-safe Link component with params as top-level props.
     */
    Link: React.FC<
        Omit<LinkProps, 'href'> &
            ParamProps<Params> & {
                search?: z.input<Search>
            } & { children?: React.ReactNode }
    >
    
    /**
     * Type-safe Link component with params as nested object.
     */
    ParamsLink: React.FC<
        Omit<LinkProps, 'href'> & {
            params?: z.input<Params>
            search?: z.input<Search>
        } & { children?: React.ReactNode }
    >

    /**
     * Universal Page wrapper - works in both server and client components.
     */
    Page: <AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps>
    ) => PageComponent<Params, Search, AdditionalProps>

    /**
     * Explicit Client Page wrapper.
     */
    ClientPage: <AdditionalProps extends object = object>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps>
    ) => PageComponent<Params, Search, AdditionalProps>

    /**
     * Session Page wrapper - fetches/hydrates session.
     */
    SessionPage: <AdditionalProps extends object = object, S extends Session = Session>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps & { session: S | null }>,
        options?: SessionOptions
    ) => PageComponent<Params, Search, Omit<AdditionalProps, 'session'>>

    /**
     * Client Session Page wrapper - uses useSession hook.
     */
    ClientSessionPage: <AdditionalProps extends object = object, S extends Session = Session>(
        component: UnwrappedPageComponent<Params, Search, AdditionalProps & ClientSessionInjectedProps<S>>
    ) => PageComponent<Params, Search, Omit<AdditionalProps, keyof ClientSessionInjectedProps>>

    // Validation helpers
    validateParams: (params: unknown) => z.output<Params>
    validateSearch: (search: unknown) => z.output<Search>
}

/**
 * GET route builder.
 */
export type GetRouteBuilder<
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

/**
 * POST route builder.
 */
export type PostRouteBuilder<
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

/**
 * PUT route builder.
 */
export type PutRouteBuilder<
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

/**
 * DELETE route builder.
 */
export type DeleteRouteBuilder<Params extends z.ZodType> = CoreRouteElements<
    Params,
    z.ZodType
> & ((p?: z.input<Params>, options?: FetchOptions) => Promise<void>)

// ============================================================================
// Factory Configuration
// ============================================================================

/**
 * Page wrapper factory interface.
 * Implementations can be server or client specific.
 */
export type PageWrapperFactory = {
    createPage: <
        Params extends z.ZodType,
        Search extends z.ZodType,
        AdditionalProps extends object = object,
    >(
        schemas: SchemasConfig<Params, Search>,
        Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>
    ) => React.ComponentType<{
        params: Promise<z.output<Params>>
        searchParams: Promise<z.output<Search>>
    } & BasePageProps & AdditionalProps>
    
    createClientPage: <
        Params extends z.ZodType,
        Search extends z.ZodType,
        AdditionalProps extends object = object,
    >(
        schemas: SchemasConfig<Params, Search>,
        Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>
    ) => React.ComponentType<{
        params: Promise<z.output<Params>>
        searchParams: Promise<z.output<Search>>
    } & BasePageProps & AdditionalProps>
    
    createSessionPage: <
        Params extends z.ZodType,
        Search extends z.ZodType,
        AdditionalProps extends object = object,
        S extends Session = Session,
    >(
        schemas: SchemasConfig<Params, Search>,
        Component: React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps & { session: S | null }>,
        options?: SessionOptions
    ) => React.ComponentType<{
        params: Promise<z.output<Params>>
        searchParams: Promise<z.output<Search>>
    } & BasePageProps & Omit<AdditionalProps, 'session'>>
}

/**
 * Session HOC factory interface.
 */
export type SessionHOCFactory = {
    withClientSession: <P extends ClientSessionInjectedProps, S extends Session = Session>(
        WrappedComponent: React.ComponentType<P>
    ) => React.ComponentType<Omit<P, keyof ClientSessionInjectedProps<S>>>
}

/**
 * Configuration for creating route builders.
 */
export type RouteFactoryConfig = {
    /**
     * Page wrapper implementations (from conditional exports).
     */
    pageWrappers: PageWrapperFactory
    
    /**
     * Session HOC for ClientSessionPage.
     */
    sessionHOC?: SessionHOCFactory
}

// ============================================================================
// Internal Helpers
// ============================================================================

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
            const catchAll = params[catchKey] as unknown as string[]
            return `/${catchAll.join('/')}`
        }
    }

    const elems: ((params: T) => string)[] = []
    for (const elem of pathArr) {
        const catchAll = /\[\.\.\.(.*)\]/.exec(elem)
        const param = /\[(.*)\]/.exec(elem)
        if (catchAll?.[1]) {
            const key = catchAll[1]
            elems.push((params: T) =>
                (params[key as unknown as string] as string[]).join('/')
            )
        } else if (param?.[1]) {
            const key = param[1]
            elems.push(
                (params: T) => params[key as unknown as string] as string
            )
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

function createUrlBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
>(route: string, info: RouteInfo<Params, Search>) {
    const fn = createPathBuilder<Record<string, any>>(route)

    return (params?: z.input<Params>, search?: z.input<Search>) => {
        let checkedParams: Partial<z.output<Params>> = params ?? {}
        const safeParams = info.params.safeParse(checkedParams)
        if (!safeParams.success) {
            throw new Error(
                `Invalid params for route ${info.name}: ${safeParams.error.message}`
            )
        } else {
            checkedParams = safeParams.data
        }
        
        const safeSearch = info.search.safeParse(search ?? {})
        if (!safeSearch.success) {
            throw new Error(
                `Invalid search params for route ${info.name}: ${safeSearch.error.message}`
            )
        }

        const baseUrl = fn(checkedParams as Record<string, any>)
        const searchString = search && queryString.stringify(search)
        return [baseUrl, searchString ? `?${searchString}` : ''].join('')
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create makeRoute and other route builders with injected dependencies.
 * 
 * @example
 * ```tsx
 * // In apps/web/src/routes/configure.ts
 * import { createRouteFactory } from '@repo/declarative-routing'
 * import { createPage, createSessionPage } from '@repo/declarative-routing/page-wrappers'
 * import { withClientSession } from '@/lib/auth/with-client-session'
 * 
 * const { makeRoute, makeGetRoute, makePostRoute, makePutRoute, makeDeleteRoute } = 
 *   createRouteFactory({
 *     pageWrappers: {
 *       createPage,
 *       createClientPage: createPage, // Same implementation for now
 *       createSessionPage,
 *     },
 *     sessionHOC: {
 *       withClientSession,
 *     },
 *   })
 * 
 * export { makeRoute, makeGetRoute, makePostRoute, makePutRoute, makeDeleteRoute }
 * ```
 */
export function createRouteFactory(config: RouteFactoryConfig) {
    const { pageWrappers, sessionHOC } = config

    /**
     * Create a route builder for page routes.
     */
    function makeRoute<
        Params extends z.ZodType,
        Search extends z.ZodType = typeof emptySchema,
    >(
        route: string,
        info: RouteInfo<Params, Search>
    ): RouteBuilder<Params, Search> {
        const buildUrl = createUrlBuilder(route, info)

        const urlBuilder = buildUrl as RouteBuilder<Params, Search>

        // Add buildUrl method explicitly
        urlBuilder.buildUrl = buildUrl
        urlBuilder.routePath = route
        urlBuilder.routeName = info.name
        urlBuilder.info = info

        urlBuilder.immediate = function immediate(
            router: AppRouterInstance,
            p?: z.input<Params>,
            search?: z.input<Search>
        ) {
            const href = buildUrl(p, search)
            NProgress.start()
            router.push(href)
        }

        urlBuilder.ParamsLink = function RouteLink({
            params: linkParams,
            search: linkSearch,
            children,
            ...props
        }: Omit<LinkProps, 'href'> & {
            params?: z.input<Params>
            search?: z.input<Search>
        } & { children?: React.ReactNode }) {
            return (
                <Link {...props} href={buildUrl(linkParams, linkSearch)}>
                    {children}
                </Link>
            )
        }

        urlBuilder.Link = function RouteLink({
            search: linkSearch,
            children,
            ...props
        }: Omit<LinkProps, 'href'> &
            (ParamProps<Params> extends Record<string, never>
                ? { search?: z.input<Search>; children?: React.ReactNode }
                : ParamProps<Params> & { search?: z.input<Search>; children?: React.ReactNode })) {
            const parsedParams = info.params.parse(props) as z.input<Params>
            const params = parsedParams as Record<string, any>
            const extraProps = { ...props }
            for (const key of Object.keys(params)) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete extraProps[key as keyof typeof props]
            }
            return (
                <Link
                    {...extraProps}
                    href={buildUrl(parsedParams, linkSearch)}
                >
                    {children}
                </Link>
            )
        }

        // Page wrapper
        urlBuilder.Page = function PageWrapper<AdditionalProps extends object = object>(
            component: UnwrappedPageComponent<Params, Search, AdditionalProps>
        ): PageComponent<Params, Search, AdditionalProps> {
            const schemas = { params: info.params, search: info.search }
            
            const WrappedPage = pageWrappers.createPage<Params, Search, AdditionalProps>(
                schemas,
                component
            )
            
            ;(WrappedPage as ComponentWithDisplayName).displayName = `Page(${(component as ComponentWithDisplayName).displayName ?? (component as ComponentWithDisplayName).name ?? 'Component'})`
            
            return WrappedPage as PageComponent<Params, Search, AdditionalProps>
        }

        // Client Page wrapper
        urlBuilder.ClientPage = function ClientPageWrapper<AdditionalProps extends object = object>(
            component: UnwrappedPageComponent<Params, Search, AdditionalProps>
        ): PageComponent<Params, Search, AdditionalProps> {
            const schemas = { params: info.params, search: info.search }
            
            const WrappedPage = pageWrappers.createClientPage<Params, Search, AdditionalProps>(
                schemas,
                component
            )
            
            ;(WrappedPage as ComponentWithDisplayName).displayName = `ClientPage(${(component as ComponentWithDisplayName).displayName ?? (component as ComponentWithDisplayName).name ?? 'Component'})`
            
            return WrappedPage as PageComponent<Params, Search, AdditionalProps>
        }

        // Session Page wrapper
        // Type assertion needed because TypeScript can't prove Omit<AdditionalProps & { session: S | null }, 'session'> === Omit<AdditionalProps, 'session'>
        ;(urlBuilder as unknown as RouteBuilderWithSessionPages).SessionPage = function SessionPageWrapper<AdditionalProps extends object = object, S extends Session = Session>(
            component: UnwrappedPageComponent<Params, Search, AdditionalProps & { session: S | null }>,
            options?: SessionOptions
        ): PageComponent<Params, Search, Omit<AdditionalProps, 'session'>> {
            const schemas = { params: info.params, search: info.search }
            
            type SessionOmittedProps = Omit<AdditionalProps, 'session'>
            const WrappedPage = pageWrappers.createSessionPage<Params, Search, SessionOmittedProps, S>(
                schemas,
                component as React.ComponentType<UnwrappedPageProps<Params, Search> & SessionOmittedProps & { session: S | null }>,
                options
            )
            
            ;(WrappedPage as ComponentWithDisplayName).displayName = `SessionPage(${(component as ComponentWithDisplayName).displayName ?? (component as ComponentWithDisplayName).name ?? 'Component'})`
            
            return WrappedPage as PageComponent<Params, Search, Omit<AdditionalProps, 'session'>>
        }

        // Client Session Page wrapper
        // Type assertion needed because TypeScript can't prove Omit<AdditionalProps & ClientSessionInjectedProps<S>, keyof ClientSessionInjectedProps<Session>> === Omit<AdditionalProps, keyof ClientSessionInjectedProps<Session>>
        ;(urlBuilder as unknown as RouteBuilderWithSessionPages).ClientSessionPage = function ClientSessionPageWrapper<AdditionalProps extends object = object, S extends Session = Session>(
            component: UnwrappedPageComponent<Params, Search, AdditionalProps & ClientSessionInjectedProps<S>>
        ): PageComponent<Params, Search, Omit<AdditionalProps, keyof ClientSessionInjectedProps>> {
            if (!sessionHOC) {
                throw new Error(
                    'ClientSessionPage requires sessionHOC to be configured. ' +
                    'Pass sessionHOC.withClientSession to createRouteFactory.'
                )
            }
            
            // First wrap with ClientPage to unwrap params/search
            const UnwrappedPage = urlBuilder.ClientPage(component)
            
            // Then wrap with withClientSession for session handling
            const WrappedComponent = sessionHOC.withClientSession<any, S>(UnwrappedPage)
            
            ;(WrappedComponent as ComponentWithDisplayName).displayName = `ClientSessionPage(${(component as ComponentWithDisplayName).displayName ?? (component as ComponentWithDisplayName).name ?? 'Component'})`
            
            return WrappedComponent as PageComponent<Params, Search, Omit<AdditionalProps, keyof ClientSessionInjectedProps>>
        }

        // Validation helpers
        urlBuilder.validateParams = function validateParams(params: unknown) {
            return info.params.parse(params)
        }

        urlBuilder.validateSearch = function validateSearch(search: unknown) {
            return info.search.parse(search)
        }

        // Schema references
        urlBuilder.params = undefined as z.output<Params>
        urlBuilder.paramsSchema = info.params
        urlBuilder.search = undefined as z.output<Search>
        urlBuilder.searchSchema = info.search

        return urlBuilder
    }

    /**
     * Create a GET route builder for API routes.
     */
    function makeGetRoute<
        Params extends z.ZodType,
        Search extends z.ZodType,
        Result extends z.ZodType,
    >(
        route: string,
        info: RouteInfo<Params, Search>,
        getInfo: GetInfo<Result>
    ): GetRouteBuilder<Params, Search, Result> {
        const urlBuilder = createUrlBuilder(route, info)

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

    /**
     * Create a POST route builder for API routes.
     */
    function makePostRoute<
        Params extends z.ZodType,
        Search extends z.ZodType,
        Body extends z.ZodType,
        Result extends z.ZodType,
    >(
        route: string,
        info: RouteInfo<Params, Search>,
        postInfo: PostInfo<Body, Result>
    ): PostRouteBuilder<Params, Search, Body, Result> {
        const urlBuilder = createUrlBuilder(route, info)

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
                    ...(Array.isArray(options?.headers) 
                        ? options.headers.reduce((acc, [key, data]) => ({ ...acc, [key]: data }), {})
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

    /**
     * Create a PUT route builder for API routes.
     */
    function makePutRoute<
        Params extends z.ZodType,
        Search extends z.ZodType,
        Body extends z.ZodType,
        Result extends z.ZodType,
    >(
        route: string,
        info: RouteInfo<Params, Search>,
        putInfo: PutInfo<Body, Result>
    ): PutRouteBuilder<Params, Search, Body, Result> {
        const urlBuilder = createUrlBuilder(route, info)

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
                    ...(Array.isArray(options?.headers) 
                        ? options.headers.reduce((acc, [key, data]) => ({ ...acc, [key]: data }), {})
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

    /**
     * Create a DELETE route builder for API routes.
     */
    function makeDeleteRoute<
        Params extends z.ZodType,
        Search extends z.ZodType,
    >(route: string, info: RouteInfo<Params, Search>): DeleteRouteBuilder<Params> {
        const urlBuilder = createUrlBuilder(route, info)

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

    return {
        makeRoute,
        makeGetRoute,
        makePostRoute,
        makePutRoute,
        makeDeleteRoute,
    }
}

// ============================================================================
// Type exports
// ============================================================================

export type {
    Session,
    BasePageProps,
    UnwrappedPageProps,
    RouteInfo,
    GetInfo,
    PostInfo,
    PutInfo,
    SchemasConfig,
    SessionOptions,
    ClientSessionInjectedProps,
}

export { z }
