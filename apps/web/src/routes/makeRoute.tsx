/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/*
Derived from: https://www.flightcontrol.dev/blog/fix-nextjs-routing-to-have-full-type-safety
*/
import { z } from 'zod'
import queryString from 'query-string'
import Link from 'next/link'
import NProgress from 'nprogress'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

const emptySchema = z.object({})

export { emptySchema }

type LinkProps = Parameters<typeof Link>[0]

export interface RouteInfo<
    Params extends z.ZodType,
    Search extends z.ZodType,
> {
    name: string
    params: Params
    search: Search
    description?: string
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

type FetchOptions = Parameters<typeof fetch>[1]

interface CoreRouteElements<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
> {
    params: z.output<Params>
    paramsSchema: Params
    search: z.output<Search>
    searchSchema: Search
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

export type RouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
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
            z.input<Params> & {
                search?: z.input<Search>
            } & { children?: React.ReactNode }
    >
    ParamsLink: React.FC<
        Omit<LinkProps, 'href'> & {
            params?: z.input<Params>
            search?: z.input<Search>
        } & { children?: React.ReactNode }
    >
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
            const catchAll = params[catchKey] as unknown as string[]
            return catchAll ? `/${catchAll.join('/')}` : ''
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

function createRouteBuilder<
    Params extends z.ZodType,
    Search extends z.ZodType,
>(route: string, info: RouteInfo<Params, Search>) {
    const fn = createPathBuilder<Record<string, any>>(route)

    return (params?: z.input<Params>, search?: z.input<Search>) => {
        let checkedParams: Partial<z.core.output<Params>> = params ?? {}
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
            ? info.search?.safeParse(search ?? {})
            : null
        if (info.search && !safeSearch?.success) {
            throw new Error(
                `Invalid search params for route ${info.name}: ${String(safeSearch?.error.message)}`
            )
        }

        const baseUrl = fn(checkedParams as Record<string, any>)
        const searchString = search && queryString.stringify(search)
        return [baseUrl, searchString ? `?${searchString}` : ''].join('')
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
                ...Array.isArray(options?.headers) ? options.headers.reduce((acc, [key, data]) => {
                    return {
                        ...acc,
                        [key]: data
                    }
                }, {}) : options?.headers ?? {},
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
                ...Array.isArray(options?.headers) ? options.headers.reduce((acc, [key, data]) => {
                    return {
                        ...acc,
                        [key]: data
                    }
                }, {}) : options?.headers ?? {},
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

export function makeRoute<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
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
        z.input<Params> & {
            search?: z.input<Search>
        } & { children?: React.ReactNode }) {
        const parsedParams = info.params.parse(props) as z.core.input<Params>
        const params = parsedParams as Record<string, any>
        const extraProps = { ...props }
        for (const key of Object.keys(params)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete extraProps[key as keyof typeof props]
        }
        return (
            <Link
                {...extraProps}
                href={urlBuilder(parsedParams, linkSearch)}
            >
                {children}
            </Link>
        )
    }

    urlBuilder.params = undefined as z.output<Params>
    urlBuilder.paramsSchema = info.params
    urlBuilder.search = undefined as z.output<Search>
    urlBuilder.searchSchema = info.search

    return urlBuilder
}
