/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
Derived from: https://www.flightcontrol.dev/blog/fix-nextjs-routing-to-have-full-type-safety
*/
import { z } from 'zod'
import queryString from 'query-string'
import Link from 'next/link'
import NProgress from 'nprogress'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { createContext, useContext } from 'react'

const emptySchema = z.object({})

export { emptySchema }

type LinkProps = Parameters<typeof Link>[0]

// When Params is an empty z.object({}), z.input<Params> can resolve to Record<string, never>,
// which poisons intersections (e.g., children: ReactNode becomes never). This conditional
// removes the index-signature when there are no params so React props work as expected.
type ParamProps<P extends z.ZodSchema> =
    z.input<P> extends Record<string, never> ? object : z.input<P>

export type RouteInfo<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
> = {
    name: string
    params: Params
    search: Search
    description?: string
}

export type GetInfo<Result extends z.ZodSchema> = {
    result: Result
}

export type PostInfo<Body extends z.ZodSchema, Result extends z.ZodSchema> = {
    body: Body
    result: Result
    description?: string
}

export type PutInfo<Body extends z.ZodSchema, Result extends z.ZodSchema> = {
    body: Body
    result: Result
    description?: string
}

type FetchOptions = Parameters<typeof fetch>[1]

type CoreRouteElements<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema = typeof emptySchema,
> = {
    params: z.output<Params>
    paramsSchema: Params
    search: z.output<Search>
    searchSchema: Search
}

type PutRouteBuilder<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
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
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
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
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Result extends z.ZodSchema,
> = CoreRouteElements<Params, Search> & {
    (
        p?: z.input<Params>,
        search?: z.input<Search>,
        options?: FetchOptions
    ): Promise<z.output<Result>>

    result: z.output<Result>
    resultSchema: Result
}

type DeleteRouteBuilder<Params extends z.ZodSchema> = CoreRouteElements<
    Params,
    z.ZodSchema
> & {
    (p?: z.input<Params>, options?: FetchOptions): Promise<void>
}

// Page component props that all pages receive
export type BasePageProps = {
    children?: React.ReactNode
}

// Typed page props including params and search
export type PageProps<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
> = {
    params: Promise<z.output<Params>>
    searchParams: Promise<z.output<Search>>
} & BasePageProps

// Page wrapper component type
export type PageComponent<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    AdditionalProps = object,
> = React.FC<PageProps<Params, Search> & AdditionalProps>

// Utility types to extract params and search types from RouteBuilder
export type RouteBuilderParams<T extends RouteBuilder<any, any>> =
    T extends RouteBuilder<infer Params, any> ? z.output<Params> : never

export type RouteBuilderSearch<T extends RouteBuilder<any, any>> =
    T extends RouteBuilder<any, infer Search> ? z.output<Search> : never

// Layout types
export type LayoutParams = {
    children: React.ReactNode
}

export type NoUiRenderParams = LayoutParams & {
    noUiRender: true
}

export type LayoutState<TData = any, TInnerState = any> = {
    ui: (
        renderChildren: (useState: TInnerState) => React.ReactNode
    ) => React.ReactNode
    data: TData
    useState: TInnerState
}

export type LayoutFunction<TData = any, TInnerState = any> = {
    (params: LayoutParams): React.ReactNode
    (params: NoUiRenderParams): LayoutState<TData, TInnerState>
}

export type LayoutInfo<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
> = {
    name: string
    params: Params
    search: Search
    description?: string
}

export type LayoutComponent<
    _Params extends z.ZodSchema,
    _Search extends z.ZodSchema,
    TData = any,
    TInnerState = any,
> = LayoutFunction<TData, TInnerState>

export type LayoutBuilder<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    TData = any,
    TInnerState = any,
> = {
    Layout: LayoutComponent<Params, Search, TData, TInnerState>
    LayoutWrapper: React.FC<{ children: React.ReactNode }>
    getConfig: (
        params?: z.input<Params>,
        search?: z.input<Search>
    ) => LayoutState<TData, TInnerState>
    getData: (params?: z.input<Params>, search?: z.input<Search>) => TData
    getInnerState: (
        params?: z.input<Params>,
        search?: z.input<Search>
    ) => TInnerState
    params: z.output<Params>
    paramsSchema: Params
    search: z.output<Search>
    searchSchema: Search
    data: TData
    validateParams: (params: unknown) => z.output<Params>
    validateSearch: (search: unknown) => z.output<Search>
}

// Type utilities to extract layout types
export type ExtractLayoutData<T extends LayoutBuilder<any, any, any, any>> =
    T extends LayoutBuilder<any, any, infer TData, any> ? TData : never

export type ExtractLayoutInnerState<
    T extends LayoutBuilder<any, any, any, any>,
> =
    T extends LayoutBuilder<any, any, any, infer TInnerState>
        ? TInnerState
        : never

export type ExtractLayoutConfig<T extends LayoutBuilder<any, any, any, any>> = {
    data: ExtractLayoutData<T>
    useState: ExtractLayoutInnerState<T>
}

// Helper type to extract layout data from single or multiple layouts
export type ExtractLayoutsData<T> =
    T extends LayoutBuilder<any, any, any, any>
        ? ExtractLayoutConfig<T>
        : T extends Record<string, LayoutBuilder<any, any, any, any>>
          ? { [K in keyof T]: ExtractLayoutConfig<T[K]> }
          : never

// Context type for layout data
type LayoutContextValue<TData = any, TInnerState = any> = {
    data: TData
    useState: TInnerState
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

// Hook to access layout context
export function useLayoutContext<
    TData = any,
    TInnerState = any,
>(): LayoutContextValue<TData, TInnerState> {
    const context = useContext(LayoutContext)
    if (!context) {
        throw new Error('useLayoutContext must be used within a LayoutProvider')
    }
    return context as LayoutContextValue<TData, TInnerState>
}

// Multiple layouts context
type MultiLayoutContextValue = Record<string, LayoutContextValue>
const MultiLayoutContext = createContext<MultiLayoutContextValue | null>(null)

export function useMultiLayoutContext(): MultiLayoutContextValue {
    const context = useContext(MultiLayoutContext)
    if (!context) {
        throw new Error(
            'useMultiLayoutContext must be used within a MultiLayoutProvider'
        )
    }
    return context
}

export type RouteBuilder<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
> = CoreRouteElements<Params, Search> & {
    (p?: z.input<Params>, search?: z.input<Search>): string

    immediate: (
        router: AppRouterInstance,
        p?: z.input<Params>,
        search?: z.input<Search>
    ) => void

    routeName: string

    Link: React.FC<
        Omit<LinkProps, 'href'> &
            ParamProps<Params> & {
                search?: z.input<Search>
            } & { children?: React.ReactNode }
    >
    ParamsLink: React.FC<
        Omit<LinkProps, 'href'> & {
            params?: z.input<Params>
            search?: z.input<Search>
        } & { children?: React.ReactNode }
    >

    Page: <AdditionalProps = object>(
        component: PageComponent<Params, Search, AdditionalProps>
    ) => PageComponent<Params, Search, AdditionalProps>

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
        const catchKey = pathArr.pop()!.replace('[[...', '').replace(']]', '')
        catchAllSegment = (params: T) => {
            const catchAll = params[catchKey] as unknown as string[]
            return catchAll ? `/${catchAll.join('/')}` : ''
        }
    }

    const elems: ((params: T) => string)[] = []
    for (const elem of pathArr) {
        const catchAll = elem.match(/\[\.\.\.(.*)\]/)
        const param = elem.match(/\[(.*)\]/)
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

function createRouteBuilder<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
>(route: string, info: RouteInfo<Params, Search>) {
    const fn = createPathBuilder<Record<string, any>>(route)

    return (params?: z.input<Params>, search?: z.input<Search>) => {
        let checkedParams: any = params || {}
        if (info.params) {
            const safeParams = info.params.safeParse(checkedParams)
            if (!safeParams?.success) {
                throw new Error(
                    `Invalid params for route ${info.name}: ${safeParams.error.message}`
                )
            } else {
                checkedParams = safeParams.data
            }
        }
        const safeSearch = info.search
            ? info.search?.safeParse(search || {})
            : null
        if (info.search && !safeSearch?.success) {
            throw new Error(
                `Invalid search params for route ${info.name}: ${safeSearch?.error.message}`
            )
        }

        const baseUrl = fn(checkedParams)
        const searchString = search && queryString.stringify(search)
        return [baseUrl, searchString ? `?${searchString}` : ''].join('')
    }
}

export function makePostRoute<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
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
                ...(options?.headers || {}),
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
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Body extends z.ZodSchema,
    Result extends z.ZodSchema,
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
                ...(options?.headers || {}),
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
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    Result extends z.ZodSchema,
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
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
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

export function makeRoute<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema = typeof emptySchema,
>(
    route: string,
    info: RouteInfo<Params, Search>
): RouteBuilder<Params, Search> {
    const urlBuilder: RouteBuilder<Params, Search> = createRouteBuilder(
        route,
        info
    ) as RouteBuilder<Params, Search>

    urlBuilder.immediate = function immediate(
        router: AppRouterInstance,
        p?: z.input<Params>,
        search?: z.input<Search>
    ) {
        const href = urlBuilder(p, search)
        NProgress.start()
        router.push(href)
    }

    urlBuilder.routeName = info.name

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
            <Link {...props} href={urlBuilder(linkParams, linkSearch)}>
                {children}
            </Link>
        )
    }

    urlBuilder.Link = function RouteLink({
        search: linkSearch,
        children,
        ...props
    }: Omit<LinkProps, 'href'> &
        ParamProps<Params> & {
            search?: z.input<Search>
        } & { children?: React.ReactNode }) {
        const parsedParams = info.params.parse(props as any)
        const params = parsedParams as Record<string, any>
        const extraProps = { ...props }
        for (const key of Object.keys(params)) {
            delete (extraProps as any)[key]
        }
        return (
            <Link
                {...extraProps}
                href={urlBuilder(parsedParams as any, linkSearch)}
            >
                {children}
            </Link>
        )
    }

    urlBuilder.Page = function PageWrapper<AdditionalProps = object>(
        component: PageComponent<Params, Search, AdditionalProps>
    ) {
        const WrappedComponent = (
            props: PageProps<Params, Search> & AdditionalProps
        ) => {
            // Always use props as-is since they're already properly typed
            // The hooks should be used directly in components that need reactive updates
            return component(props)
        }

        // Preserve component name for debugging
        WrappedComponent.displayName = `RoutePageWrapper(${component.displayName || component.name || 'Component'})`

        return WrappedComponent as PageComponent<
            Params,
            Search,
            AdditionalProps
        >
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

// Layout builder function with automatic type inference
export function makeLayout<
    Params extends z.ZodSchema,
    Search extends z.ZodSchema,
    TData = any,
    TInnerState = any,
>(
    route: string,
    info: LayoutInfo<Params, Search>,
    layoutComponent: LayoutComponent<Params, Search, TData, TInnerState>
): LayoutBuilder<Params, Search, TData, TInnerState> {
    // Extract types from the layout component by calling it with noUiRender
    const sampleConfig = layoutComponent({
        children: null,
        noUiRender: true,
    } as NoUiRenderParams) as LayoutState<TData, TInnerState>
    const layoutBuilder: LayoutBuilder<Params, Search, TData, TInnerState> = {
        Layout: layoutComponent,

        LayoutWrapper: function LayoutWrapper({
            children,
        }: {
            children: React.ReactNode
        }) {
            const config = layoutBuilder.getConfig()

            return (
                <LayoutContext.Provider
                    value={{
                        data: config.data,
                        useState: config.useState,
                    }}
                >
                    {children}
                </LayoutContext.Provider>
            )
        },

        getConfig: (_params?: z.input<Params>, _search?: z.input<Search>) => {
            // Call layout with noUiRender to get config
            const result = layoutComponent({
                children: null,
                noUiRender: true,
            } as NoUiRenderParams)

            // The result should be LayoutState when noUiRender is true
            return result as unknown as LayoutState<TData, TInnerState>
        },

        getData: (params?: z.input<Params>, search?: z.input<Search>) => {
            const config = layoutBuilder.getConfig(params, search)
            return config.data
        },

        getInnerState: (params?: z.input<Params>, search?: z.input<Search>) => {
            const config = layoutBuilder.getConfig(params, search)
            return config.useState
        },

        params: undefined as z.output<Params>,
        paramsSchema: info.params,
        search: undefined as z.output<Search>,
        searchSchema: info.search,
        data: sampleConfig.data,

        validateParams: (params: unknown) => {
            return info.params.parse(params)
        },

        validateSearch: (search: unknown) => {
            return info.search.parse(search)
        },
    }

    return layoutBuilder
}

// withLayout HOC - supports single or multiple layouts
export function withLayout<
    TLayouts extends
        | LayoutBuilder<any, any, any, any>
        | Record<string, LayoutBuilder<any, any, any, any>>,
    TPageParams extends z.ZodSchema = typeof emptySchema,
    TPageSearch extends z.ZodSchema = typeof emptySchema,
>(layouts: TLayouts) {
    return function <TAdditionalProps = object>(
        PageComponent: React.FC<
            PageProps<TPageParams, TPageSearch> & {
                layoutData: ExtractLayoutsData<TLayouts>
            } & TAdditionalProps
        >
    ): PageComponent<TPageParams, TPageSearch, TAdditionalProps> {
        const WrappedPage: PageComponent<
            TPageParams,
            TPageSearch,
            TAdditionalProps
        > = (props) => {
            // Extract layout data
            let layoutData: ExtractLayoutsData<TLayouts>
            let contextProvider: React.ReactNode

            if (typeof layouts === 'function' || 'Layout' in layouts) {
                // Single layout
                const layout = layouts as LayoutBuilder<any, any, any, any>
                const config = layout.getConfig()
                layoutData = {
                    data: config.data,
                    useState: config.useState,
                } as ExtractLayoutsData<TLayouts>

                contextProvider = (
                    <LayoutContext.Provider
                        value={{
                            data: config.data,
                            useState: config.useState,
                        }}
                    >
                        <PageComponent {...props} layoutData={layoutData} />
                    </LayoutContext.Provider>
                )
            } else {
                // Multiple layouts
                const layoutsObj = layouts as Record<
                    string,
                    LayoutBuilder<any, any, any, any>
                >
                const multiContext: MultiLayoutContextValue = {}
                layoutData = Object.entries(layoutsObj).reduce(
                    (acc, [key, layout]) => {
                        const config = layout.getConfig()
                        acc[key] = {
                            data: config.data,
                            useState: config.useState,
                        }
                        multiContext[key] = {
                            data: config.data,
                            useState: config.useState,
                        }
                        return acc
                    },
                    {} as any
                ) as ExtractLayoutsData<TLayouts>

                contextProvider = (
                    <MultiLayoutContext.Provider value={multiContext}>
                        <PageComponent {...props} layoutData={layoutData} />
                    </MultiLayoutContext.Provider>
                )
            }

            return <>{contextProvider}</>
        }

        WrappedPage.displayName = `withLayout(${PageComponent.displayName || PageComponent.name || 'Component'})`

        return WrappedPage
    }
}

// Helper function to create layout context provider
export function createLayoutProvider<_TData = any, TInnerState = any>(
    layoutBuilder: LayoutBuilder<any, any, any, TInnerState>
) {
    return function LayoutProvider({
        children,
    }: {
        children: React.ReactNode
    }) {
        const config = layoutBuilder.getConfig()

        return (
            <LayoutContext.Provider
                value={{
                    data: config.data,
                    useState: config.useState,
                }}
            >
                {children}
            </LayoutContext.Provider>
        )
    }
}

// defineLayout helper function
export function defineLayout<TData, TInnerState>(
    layoutStateFn: (params: LayoutParams) => LayoutState<TData, TInnerState>
): LayoutFunction<TData, TInnerState> {
    const layoutFunction = ((params: LayoutParams | NoUiRenderParams) => {
        const state = layoutStateFn(params)

        if ('noUiRender' in params && params.noUiRender === true) {
            return state // Return config
        }

        return state.ui((_useState) => params.children) // Return UI
    }) as LayoutFunction<TData, TInnerState>

    return layoutFunction
}
