import { createORPCClient, onError } from '@orpc/client'
import { type AppContract, appContract } from '@repo/api-contracts'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { ContractRouterClient } from '@orpc/contract'
import { validateEnvPath } from '#/env'
import { Authsignin } from '@/routes/index'
import { toAbsoluteUrl } from '@/lib/utils'
import clientRedirect from '@/actions/redirect'
import { hasMasterTokenPlugin } from '../auth/plugins/guards'
import { parseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { redirect, RedirectType } from 'next/navigation'
import { serverAuthClient } from '../auth/server'

const APP_URL = validateEnvPath(
    process.env.NEXT_PUBLIC_APP_URL!,
    'NEXT_PUBLIC_APP_URL'
)

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
                        console.log(
                            'ORPC Server-side Request - setting cookies',
                            headers.cookie
                        )
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

                if (
                    process.env.NODE_ENV === 'development' &&
                    hasMasterTokenPlugin(serverAuthClient)
                ) {
                    if (typeof window !== 'undefined') {
                        const authClient = await import('../auth').then(
                            (m) => m.authClient
                        )
                        if (hasMasterTokenPlugin(authClient) && authClient.MasterTokenManager.state) {
                            const devAuthKey =
                                process.env.NEXT_PUBLIC_DEV_AUTH_KEY

                            if (devAuthKey) {
                                headers.Authorization = `Bearer ${devAuthKey}`
                            }
                        }
                    } else {
                        if (
                            parseCookie(
                                Array.isArray(headers.cookie)
                                    ? headers.cookie.join('; ')
                                    : headers.cookie || ''
                            ).get('master-token-enabled')
                        ) {
                            const devAuthKey =
                                process.env.NEXT_PUBLIC_DEV_AUTH_KEY

                            if (devAuthKey) {
                                headers.Authorization = `Bearer ${devAuthKey}`
                            }
                        }
                    }
                }

                return options.next({
                    ...options,
                })
            },
        ],
        url:
            typeof window === 'undefined'
                ? validateEnvPath(process.env.API_URL!, 'API_URL')
                : `${APP_URL}/api/nest`,
        fetch(request, init, options) {
            return fetch(request, {
                ...init,
                cache: options.context.cache,
                next: options.context.next
                    ? options.context.next
                    : {
                          revalidate: 60, // Revalidation toutes les 60 secondes
                      },
            })
        },
        interceptors: [
            onError(async (error, options) => {
                if (
                    (error as Error)?.name === 'AbortError' ||
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
                        const currentPath =
                            window.location.pathname + window.location.search

                        const loginUrl = toAbsoluteUrl(
                            Authsignin(
                                {},
                                {
                                    callbackUrl: currentPath,
                                }
                            )
                        )

                        await clientRedirect(loginUrl)
                    } else {
                        const headerList = await (
                            await import('next/headers')
                        ).headers()
                        const currentPath = headerList.get('x-pathname') || '/'

                        const loginUrl = toAbsoluteUrl(
                            Authsignin(
                                {},
                                {
                                    callbackUrl: currentPath,
                                }
                            )
                        )

                        redirect(loginUrl, RedirectType.replace)
                    }
                }
            }),
        ],
    })

    return createORPCClient<ContractRouterClient<AppContract>>(link)
}

export const orpc = createTanstackQueryUtils(createORPCClientWithCookies())
