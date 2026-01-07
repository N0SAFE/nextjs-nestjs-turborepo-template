'use client'

/**
 * Client-side routing hooks for declarative routing.
 * 
 * These hooks provide type-safe access to route parameters,
 * search parameters, and programmatic navigation.
 * 
 * All hooks work with RouteBuilder instances to ensure type safety.
 */

import { useCallback, useMemo } from 'react'
import { useParams as useNextParams, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import { z } from 'zod'
import NProgress from 'nprogress'
import queryString from 'query-string'
import type { RouteBuilder } from './make-route'

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the usePush hook.
 */
type UsePushOptions<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    params?: z.input<Params>
    search?: z.input<Search>
}

/**
 * Return type for usePush hook.
 */
type UsePushReturn<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = (options?: UsePushOptions<Params, Search>) => void

/**
 * Helper to extract search params from a RouteBuilder.
 */
type InferSearch<T> = T extends RouteBuilder<z.ZodType, infer S>
    ? z.output<S>
    : never

/**
 * Helper to extract params from a RouteBuilder.
 */
type InferParams<T> = T extends RouteBuilder<infer P, z.ZodType>
    ? z.output<P>
    : never

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for programmatic navigation with type safety.
 * 
 * Uses NProgress to show loading indicator during navigation.
 * 
 * @example
 * ```tsx
 * import { usePush } from '@repo/declarative-routing/hooks'
 * import { ProductDetail } from '@/routes'
 * 
 * function MyComponent() {
 *   const push = usePush(ProductDetail)
 *   
 *   const handleClick = () => {
 *     push({
 *       params: { productId: '123' },
 *       search: { tab: 'reviews' }
 *     })
 *   }
 *   
 *   return <button onClick={handleClick}>View Product</button>
 * }
 * ```
 */
export function usePush<
    Params extends z.ZodType,
    Search extends z.ZodType,
>(
    route: RouteBuilder<Params, Search>
): UsePushReturn<Params, Search> {
    const router = useRouter()

    return useCallback(
        (options?: UsePushOptions<Params, Search>) => {
            const params = options?.params ?? {}
            const search = options?.search ?? {}
            
            // Build the URL using route's buildUrl function
            let url: string
            if (typeof route.buildUrl === 'function') {
                url = route.buildUrl(params as z.input<Params>, search as z.input<Search>)
            } else {
                // Fallback: construct URL manually
                let pathname = route.routePath
                
                // Replace path params
                for (const [key, value] of Object.entries(params)) {
                    pathname = pathname.replace(`[${key}]`, String(value))
                    pathname = pathname.replace(`[...${key}]`, String(value))
                }
                
                // Add search params
                const searchStr = queryString.stringify(search as Record<string, unknown>, {
                    skipNull: true,
                    skipEmptyString: true,
                })
                
                url = searchStr ? `${pathname}?${searchStr}` : pathname
            }

            NProgress.start()
            router.push(url)
        },
        [router, route]
    )
}

/**
 * Hook to get type-safe route parameters.
 * 
 * Parses the current route params using the route's param schema.
 * 
 * @example
 * ```tsx
 * import { useParams } from '@repo/declarative-routing/hooks'
 * import { ProductDetail } from '@/routes'
 * 
 * function ProductPage() {
 *   const params = useParams(ProductDetail)
 *   // params.productId is typed as string
 *   return <div>Product ID: {params.productId}</div>
 * }
 * ```
 */
export function useParams<Route extends RouteBuilder<z.ZodType, z.ZodType>>(
    route: Route
): InferParams<Route> {
    const rawParams = useNextParams()
    
    return useMemo(() => {
        if (route.paramsSchema === emptySchema) {
            return {} as InferParams<Route>
        }
        
        const result = route.paramsSchema.safeParse(rawParams)
        if (result.success) {
            return result.data as InferParams<Route>
        }
        
        // Return empty object on parse failure (better than throwing in render)
        console.warn('Failed to parse route params:', result.error)
        return {} as InferParams<Route>
    }, [rawParams, route.paramsSchema])
}

/**
 * Hook to get type-safe search parameters.
 * 
 * Parses the current search params using the route's search schema.
 * 
 * @example
 * ```tsx
 * import { useSearchParams } from '@repo/declarative-routing/hooks'
 * import { ProductList } from '@/routes'
 * 
 * function ProductListPage() {
 *   const search = useSearchParams(ProductList)
 *   // search.page is typed as number | undefined
 *   // search.category is typed as string | undefined
 *   return <div>Page: {search.page ?? 1}</div>
 * }
 * ```
 */
export function useSearchParams<Route extends RouteBuilder<z.ZodType, z.ZodType>>(
    route: Route
): InferSearch<Route> {
    const rawSearchParams = useNextSearchParams()
    
    return useMemo(() => {
        if (route.searchSchema === emptySchema) {
            return {} as InferSearch<Route>
        }
        
        // Convert URLSearchParams to plain object
        const searchObj: Record<string, string | string[]> = {}
        rawSearchParams.forEach((value, key) => {
            const existing = searchObj[key]
            if (existing) {
                if (Array.isArray(existing)) {
                    existing.push(value)
                } else {
                    searchObj[key] = [existing, value]
                }
            } else {
                searchObj[key] = value
            }
        })
        
        const result = route.searchSchema.safeParse(searchObj)
        if (result.success) {
            return result.data as InferSearch<Route>
        }
        
        // Return empty object on parse failure
        console.warn('Failed to parse search params:', result.error)
        return {} as InferSearch<Route>
    }, [rawSearchParams, route.searchSchema])
}

/**
 * Hook for managing a single search parameter with state-like API.
 * 
 * Returns the current value and a setter function that updates the URL.
 * 
 * @example
 * ```tsx
 * import { useSearchParamState } from '@repo/declarative-routing/hooks'
 * import { ProductList } from '@/routes'
 * 
 * function ProductListPage() {
 *   const [page, setPage] = useSearchParamState(ProductList, 'page')
 *   
 *   return (
 *     <div>
 *       <span>Page: {page ?? 1}</span>
 *       <button onClick={() => setPage((page ?? 0) + 1)}>Next</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSearchParamState<
    Route extends RouteBuilder<z.ZodType, z.ZodType>,
    K extends keyof InferSearch<Route>,
>(
    route: Route,
    key: K
): [InferSearch<Route>[K], (value: InferSearch<Route>[K]) => void] {
    const router = useRouter()
    const rawSearchParams = useNextSearchParams()
    const currentSearch = useSearchParams(route)
    
    const value = currentSearch[key]
    
    const setValue = useCallback(
        (newValue: InferSearch<Route>[K]) => {
            // Get current search params
            const searchObj: Record<string, string | string[]> = {}
            rawSearchParams.forEach((v, k) => {
                searchObj[k] = v
            })
            
            // Update the specific key
            if (newValue === null || newValue === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete searchObj[key as string]
            } else {
                searchObj[key as string] = String(newValue)
            }
            
            // Build new URL
            const searchStr = queryString.stringify(searchObj, {
                skipNull: true,
                skipEmptyString: true,
            })
            
            const pathname = window.location.pathname
            const url = searchStr ? `${pathname}?${searchStr}` : pathname
            
            router.push(url)
        },
        [router, rawSearchParams, key]
    )
    
    return [value, setValue]
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Empty Zod schema used as default for routes without params/search.
 */
export const emptySchema = z.object({})

// ============================================================================
// Re-exports
// ============================================================================

export type { RouteBuilder }
export { z }
