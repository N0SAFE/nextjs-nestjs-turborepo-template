import { createORPCClient, onError } from '@orpc/client'
import { type AppContract, appContract } from '@repo/api-contracts'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { ContractRouterClient } from '@orpc/contract'
import { validateEnvPath } from '#/env'
import { toAbsoluteUrl } from '@/lib/utils'
import clientRedirect from '@/actions/redirect'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { redirect, RedirectType } from 'next/navigation'
import { unstable_rethrow } from 'next/dist/client/components/unstable-rethrow.server'

// Re-export the contract for use in hooks (needed for type discrimination)
export { appContract }
export type { AppContract }

export function createORPCClientWithCookies() {
    const link = new OpenAPILink<{
        cookie?: string | string[]
        headers?: Record<string, string | string[] | undefined>
        noRedirectOnUnauthorized?: boolean
        cache?: RequestCache
        next?: NextFetchRequestConfig
    }>(appContract, {
        clientInterceptors: [
            async (options) => {
                options.request.headers = {
                    ...options.request.headers,
                    ...options.context.headers,
                }
                const headers = options.request.headers

                if (typeof window === 'undefined') {
                    try {
                        const nh = await import('next/headers')
                        const cookieString = (await nh.cookies()).toString()
                        headers.cookie = cookieString
                        console.log(`🔧 ORPC: Setting cookie header (server-side), length=${String(cookieString.length)}`)
                    } catch (error) {
                        unstable_rethrow(error)
                        console.log(
                            'Warning: next/headers could not be imported. Are you running in a non-Next.js environment?',
                            error
                        )
                        const existing = Array.isArray(headers.cookie)
                            ? headers.cookie.filter(Boolean)
                            : headers.cookie
                              ? [headers.cookie]
                              : []
                        const ctx = Array.isArray(options.context.cookie)
                            ? options.context.cookie.filter(Boolean)
                            : options.context.cookie
                              ? [options.context.cookie]
                              : []
                        const merged = [...existing, ...ctx]
                        headers.cookie = merged.length > 0 ? merged : undefined
                    }

                    headers['Content-Type'] = 'application/json'
                }

                return options.next({
                    ...options,
                })
            },
        ],
        // Use direct API URLs for optimal performance
        // Server: API_URL (private Docker network endpoint)
        // Browser: NEXT_PUBLIC_API_URL (public endpoint)
        // Note: Server-side must manually forward cookies via headers (done in interceptor)
        url:
            typeof window === 'undefined'
                ? validateEnvPath(process.env.API_URL ?? '', 'API_URL')
                : validateEnvPath(process.env.NEXT_PUBLIC_API_URL ?? '', 'NEXT_PUBLIC_API_URL'),
        fetch(request, init, options) {
            // CRITICAL: OpenAPILink doesn't pass interceptor headers to init automatically  
            // The headers are in the Request object, not in init
            // Extract them from the Request and merge with any init headers
            const headers = new Headers()
            
            // First, add headers from the Request object (includes interceptor changes)
            request.headers.forEach((value, key) => {
                headers.set(key, value)
            })
            
            // Then, merge/override with any explicit init headers
            if ('headers' in init) {
                const initHeaders = new Headers(init.headers as HeadersInit)
                initHeaders.forEach((value, key) => {
                    headers.set(key, value)
                })
            }
            
            if (typeof window === 'undefined') {
                const cookieHeader = headers.get('cookie')
                console.log(`🔧 ORPC fetch: Server-side request to ${request.url}`)
                console.log(`🔧 ORPC fetch: Cookie header: ${cookieHeader ? cookieHeader.substring(0, 100) + '... (length=' + String(cookieHeader.length) + ')' : 'NONE'}`)
            }
            
            return fetch(request, {
                ...init,
                headers,
                credentials: 'include',
                cache: options.context.cache,
                next: options.context.next
                    ??
                     {
                          revalidate: 60, // Revalidation toutes les 60 secondes
                      },
            })
        },
        interceptors: [
            onError((error, options) => {
                if (
                    (error as Error | undefined)?.name === 'AbortError' ||
                    (error &&
                        typeof error === 'object' &&
                        'code' in error &&
                        error.code === 'ABORT_ERR')
                ) {
                    return
                }

                if (options.context.noRedirectOnUnauthorized) {
                    return
                }

                // Check if this is a 401 Unauthorized error
                if (
                    error &&
                    typeof error === 'object' &&
                    'status' in error &&
                    error.status === 401
                ) {
                    console.log('ORPC Unauthorized - redirecting to login')
                    if (typeof window !== 'undefined') {
                        const loginUrl = toAbsoluteUrl('/login')
                        void clientRedirect(loginUrl)
                    } else {
                        const loginUrl = toAbsoluteUrl('/login')
                        redirect(loginUrl, RedirectType.replace)
                    }
                }
            }),
        ],
    })

    return createORPCClient<ContractRouterClient<AppContract>>(link)
}

export const orpc = createTanstackQueryUtils(createORPCClientWithCookies())
