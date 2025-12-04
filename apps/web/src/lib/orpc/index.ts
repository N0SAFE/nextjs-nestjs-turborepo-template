import { createORPCClient, onError } from '@orpc/client'
import { type AppContract, appContract } from '@repo/api-contracts'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { ContractRouterClient } from '@orpc/contract'
import { validateEnvPath } from '#/env'
import { toAbsoluteUrl } from '@/lib/utils'
import clientRedirect from '@/actions/redirect'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { redirect, RedirectType } from 'next/navigation'

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
                        headers.cookie = (await nh.cookies()).toString()
                    } catch {
                        console.log(
                            'Warning: next/headers could not be imported. Are you running in a non-Next.js environment?'
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
        // Use direct API URLs, bypassing Next.js proxy
        // Server: API_URL (private Docker network endpoint)
        // Browser: NEXT_PUBLIC_API_URL (public endpoint)
        url:
            typeof window === 'undefined'
                ? validateEnvPath(process.env.API_URL ?? '', 'API_URL')
                : validateEnvPath(process.env.NEXT_PUBLIC_API_URL ?? '', 'NEXT_PUBLIC_API_URL'),
        fetch(request, init, options) {
            return fetch(request, {
                ...init,
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
