import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { z } from 'zod'
import { useSafeQueryStatesFromZod, type QueryStateFromZodOptions } from './index'

// Route builder configuration
export interface RouteBuilderConfig<T extends z.ZodObject> {
  schema: T
  basePath?: string
  options?: QueryStateFromZodOptions
}

// Route builder return type
export interface RouteBuilder<T extends z.ZodObject> {
  // Current state and setter
  state: z.infer<T>
  setState: (value: Partial<z.infer<T>> | null) => void
  
  // URL generation
  buildUrl: (params?: Partial<z.infer<T>>) => string
  buildRelativeUrl: (params?: Partial<z.infer<T>>) => string
  
  // Navigation
  navigate: (params?: Partial<z.infer<T>>, options?: NavigationOptions) => void
  replace: (params?: Partial<z.infer<T>>, options?: NavigationOptions) => void
  push: (params?: Partial<z.infer<T>>, options?: NavigationOptions) => void
  
  // State helpers
  reset: () => void
  merge: (params: Partial<z.infer<T>>) => void
  set: (params: z.infer<T>) => void
  clear: (keys: (keyof z.infer<T>)[]) => void
  
  // Utilities
  getSearchParams: (params?: Partial<z.infer<T>>) => URLSearchParams
  getCurrentUrl: () => string
  isActive: (params: Partial<z.infer<T>>) => boolean
  
  // Validation
  validate: (params: unknown) => z.ZodSafeParseResult<z.infer<T>>
  validatePartial: (params: unknown) => z.ZodSafeParseResult<Partial<z.infer<T>>>
}

export interface NavigationOptions {
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
}

/**
 * Hook for building type-safe routes with query parameters based on Zod schemas
 * 
 * @example
 * ```tsx
 * const SearchSchema = z.object({
 *   query: z.string().default(''),
 *   page: z.number().int().min(1).default(1),
 *   category: z.enum(['all', 'products']).default('all')
 * })
 * 
 * function SearchPage() {
 *   const route = useRouteBuilder({
 *     schema: SearchSchema,
 *     basePath: '/search',
 *     options: { delay: 300 }
 *   })
 * 
 *   // Navigate with type safety
 *   const handleSearch = (query: string) => {
 *     route.navigate({ query, page: 1 })
 *   }
 * 
 *   // Build URLs
 *   const searchUrl = route.buildUrl({ query: 'test', category: 'products' })
 * 
 *   return (
 *     <div>
 *       <input 
 *         value={route.state.query}
 *         onChange={(e) => route.merge({ query: e.target.value })}
 *       />
 *       <p>Current URL: {route.getCurrentUrl()}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRouteBuilder<T extends z.ZodObject>(
  config: RouteBuilderConfig<T>
): RouteBuilder<T> {
  const { schema, basePath, options } = config
  const router = useRouter()
  const pathname = usePathname()
  
  // Use the base query states hook
  const [state, setState] = useSafeQueryStatesFromZod(schema, options)
  
  // Get the current base path (use provided basePath or current pathname)
  const currentBasePath = basePath || pathname
  
  // Helper to merge params with current state
  const mergeWithCurrentState = useCallback((params?: Partial<z.infer<T>>): z.infer<T> => {
    if (!params) return state
    return { ...state, ...params }
  }, [state])
  
  // Build search parameters from state
  const getSearchParams = useCallback((params?: Partial<z.infer<T>>): URLSearchParams => {
    const finalParams = mergeWithCurrentState(params)
    const searchParams = new URLSearchParams()
    
    // Get schema defaults to avoid adding default values to URL
    const defaults = schema.parse({})
    
    Object.entries(finalParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Only add to URL if it's different from the default
        const defaultValue = defaults[key as keyof typeof defaults]
        
        if (value !== defaultValue) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (item !== null && item !== undefined) {
                searchParams.append(key, String(item))
              }
            })
          } else if (typeof value === 'object') {
            searchParams.set(key, JSON.stringify(value))
          } else {
            searchParams.set(key, String(value))
          }
        }
      }
    })
    
    return searchParams
  }, [mergeWithCurrentState, schema])
  
  // Build full URL
  const buildUrl = useCallback((params?: Partial<z.infer<T>>): string => {
    const searchParams = getSearchParams(params)
    const queryString = searchParams.toString()
    return queryString ? `${currentBasePath}?${queryString}` : currentBasePath
  }, [getSearchParams, currentBasePath])
  
  // Build relative URL (just the query string)
  const buildRelativeUrl = useCallback((params?: Partial<z.infer<T>>): string => {
    const searchParams = getSearchParams(params)
    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }, [getSearchParams])
  
  // Navigation functions
  const navigate = useCallback((
    params?: Partial<z.infer<T>>, 
    navOptions?: NavigationOptions
  ) => {
    const url = buildUrl(params)
    if (navOptions?.replace) {
      router.replace(url, { scroll: navOptions?.scroll })
    } else {
      router.push(url, { scroll: navOptions?.scroll })
    }
  }, [buildUrl, router])
  
  const replace = useCallback((
    params?: Partial<z.infer<T>>, 
    navOptions?: NavigationOptions
  ) => {
    navigate(params, { ...navOptions, replace: true })
  }, [navigate])
  
  const push = useCallback((
    params?: Partial<z.infer<T>>, 
    navOptions?: NavigationOptions
  ) => {
    navigate(params, { ...navOptions, replace: false })
  }, [navigate])
  
  // State helper functions
  const reset = useCallback(() => {
    setState(null)
  }, [setState])
  
  const merge = useCallback((params: Partial<z.infer<T>>) => {
    setState(params)
  }, [setState])
  
  const set = useCallback((params: z.infer<T>) => {
    setState(params)
  }, [setState])
  
  const clear = useCallback((keys: (keyof z.infer<T>)[]) => {
    const updates: Partial<z.infer<T>> = {}
    const defaults = schema.parse({})
    
    keys.forEach(key => {
      updates[key] = defaults[key]
    })
    
    setState(updates)
  }, [setState, schema])
  
  // Utility functions
  const getCurrentUrl = useCallback((): string => {
    return buildUrl()
  }, [buildUrl])
  
  const isActive = useCallback((params: Partial<z.infer<T>>): boolean => {
    return Object.entries(params).every(([key, value]) => {
      const currentValue = state[key as keyof z.infer<T>]
      if (Array.isArray(value) && Array.isArray(currentValue)) {
        return value.length === currentValue.length && 
               value.every((v, i) => v === currentValue[i])
      }
      return currentValue === value
    })
  }, [state])
  
  // Validation functions
  const validate = useCallback((params: unknown): z.ZodSafeParseResult<z.infer<T>> => {
    return schema.safeParse(params)
  }, [schema])
  
  const validatePartial = useCallback((params: unknown): z.ZodSafeParseResult<Partial<z.infer<T>>> => {
    const result = schema.partial().safeParse(params)
    return result as z.ZodSafeParseResult<Partial<z.infer<T>>>
  }, [schema])
  
  // Return the route builder object
  return useMemo(() => ({
    // Current state
    state,
    setState,
    
    // URL generation
    buildUrl,
    buildRelativeUrl,
    
    // Navigation
    navigate,
    replace,
    push,
    
    // State helpers
    reset,
    merge,
    set,
    clear,
    
    // Utilities
    getSearchParams,
    getCurrentUrl,
    isActive,
    
    // Validation
    validate,
    validatePartial
  }), [
    state,
    setState,
    buildUrl,
    buildRelativeUrl,
    navigate,
    replace,
    push,
    reset,
    merge,
    set,
    clear,
    getSearchParams,
    getCurrentUrl,
    isActive,
    validate,
    validatePartial
  ])
}

// Pre-configured route builders for common patterns
export function useSearchRouteBuilder<T extends z.ZodObject>(
  schema: T,
  options?: QueryStateFromZodOptions
) {
  return useRouteBuilder({
    schema: schema.extend({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(10)
    }),
    options: { delay: 300, ...options }
  })
}

export function usePaginationRouteBuilder<T extends z.ZodObject>(
  schema: T,
  options?: QueryStateFromZodOptions
) {
  return useRouteBuilder({
    schema: schema.extend({
      page: z.number().int().min(1).default(1),
      offset: z.number().int().min(0).default(0)
    }),
    options
  })
}

export function useFilterRouteBuilder<T extends z.ZodObject>(
  schema: T,
  options?: QueryStateFromZodOptions
) {
  return useRouteBuilder({
    schema: schema.extend({
      sortBy: z.string().default(''),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
      search: z.string().default('')
    }),
    options: { delay: 300, ...options }
  })
}