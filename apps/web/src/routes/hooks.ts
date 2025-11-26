import { useRouter } from 'next/navigation'
import {
    useParams as useNextParams,
    useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { z } from 'zod'
import { QueryStateFromZodOptions, useSafeQueryStatesFromZod } from '../utils/useSafeQueryStatesFromZod'

import { emptySchema, RouteBuilder } from './makeRoute'

type PushOptions = Parameters<ReturnType<typeof useRouter>['push']>[1]

export function usePush<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(builder: RouteBuilder<Params, Search>) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { push } = useRouter()
    return (
        p: z.input<Params>,
        search?: z.input<Search>,
        options?: PushOptions
    ) => {
        push(builder(p, search), options)
    }
}

export function useParams<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(builder: RouteBuilder<Params, Search>): z.output<Params> {
    const res = builder.paramsSchema.safeParse(useNextParams())
    if (!res.success) {
        throw new Error(
            `Invalid route params for route ${builder.routeName}: ${res.error.message}`
        )
    }
    return res.data
}

export function useSearchParams<
    Params extends z.ZodType,
    Search extends z.ZodType = typeof emptySchema,
>(builder: RouteBuilder<Params, Search>): z.output<Search> {
    const res = builder.searchSchema.safeParse(
        convertURLSearchParamsToObject(useNextSearchParams())
    )
    if (!res.success) {
        throw new Error(
            `Invalid search params for route ${builder.routeName}: ${res.error.message}`
        )
    }
    return res.data
}

function convertURLSearchParamsToObject(
    params: Readonly<URLSearchParams> | null
): Record<string, string | string[]> {
    if (!params) {
        return {}
    }

    const obj: Record<string, string | string[]> = {}
    for (const [key, value] of Array.from(params.entries())) {
        if (params.getAll(key).length > 1) {
            obj[key] = params.getAll(key)
        } else {
            obj[key] = value
        }
    }
    return obj
}

/**
 * Hook that provides state management for search parameters based on a RouteBuilder
 * Returns a tuple similar to useState: [searchParamObject, setSearchParamObject]
 * 
 * @example
 * ```tsx
 * const searchRoute = makeRoute('/search', {
 *   name: 'search',
 *   params: z.object({}),
 *   search: z.object({
 *     query: z.string().default(''),
 *     page: z.number().int().min(1).default(1),
 *     category: z.enum(['all', 'products']).default('all')
 *   })
 * })
 * 
 * function SearchPage() {
 *   const [searchParams, setSearchParams] = useSearchParamState(searchRoute)
 *   
 *   const handleSearch = (query: string) => {
 *     setSearchParams({ query, page: 1 })
 *   }
 *   
 *   return (
 *     <div>
 *       <input 
 *         value={searchParams.query}
 *         onChange={(e) => setSearchParams({ query: e.target.value })}
 *       />
 *       <p>Current page: {searchParams.page}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSearchParamState<
    Params extends z.ZodType,
    Search extends z.ZodObject<z.ZodRawShape>,
>(routeBuilder: RouteBuilder<Params, Search>, options?: QueryStateFromZodOptions): [
    z.infer<Search>,
    (value: Partial<z.infer<Search>> | null) => void
] {
    return useSafeQueryStatesFromZod(routeBuilder.searchSchema, options)
}
