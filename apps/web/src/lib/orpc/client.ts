import { createORPCClient, onError } from '@orpc/client'
import { type AppContract, appContract } from '@repo/api-contracts'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { ContractRouterClient } from '@orpc/contract'
import { validateEnvPath } from '#/env'
import { Authsignin } from '@/routes/index'
import { toAbsoluteUrl } from '@/lib/utils'
import redirect from '@/actions/redirect'
import { authClient } from '../auth'
import { hasMasterTokenPlugin } from '../auth/plugins/guards'
import { parseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const APP_URL = validateEnvPath(
    process.env.NEXT_PUBLIC_APP_URL!,
    'NEXT_PUBLIC_APP_URL'
)

// Create ORPC client with optional server cookies
export function createORPCClientWithCookies() {
    const link = new OpenAPILink<{
        cookie?: string | string[]
        headers?: Record<string, string | string[] | undefined>,
        noRedirectOnUnauthorized?: boolean
    }>(appContract, {
        clientInterceptors: [
            async (options) => {
                options.request.headers = {
                    ...options.request.headers,
                    ...options.context.headers,
                }
                const headers = options.request.headers

                // For server-side requests, use provided cookies
                if (typeof window === 'undefined') {
                    try {
                        headers.cookie = (
                            await (await import('next/headers')).cookies()
                        ).toString()
                    } catch {
                        // Normalize existing headers.cookie and options.context.cookie into an array of strings
                        // filtering out any undefined values, then assign either a string[] or undefined.
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

                console.log(hasMasterTokenPlugin(authClient))

                // Check if dev auth token mode is enabled (client-side only in development)
                if (
                    process.env.NODE_ENV === 'development' &&
                    hasMasterTokenPlugin(authClient)
                ) {
                    if (typeof window !== 'undefined') {
                        if (authClient.MasterTokenManager.state) {
                            // We need to get the DEV_AUTH_KEY from the server
                            // For now, we'll use a placeholder - this will be handled by a server endpoint
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

                            console.log('using dev auth key', devAuthKey)

                            if (devAuthKey) {
                                headers.Authorization = `Bearer ${devAuthKey}`
                            }
                        }
                    }
                }

                console.log('calling: ', options.path, 'with', options)

                return options.next({
                    ...options,
                })
            },
        ],
        // Use API_URL directly for server-side requests, APP_URL with /api/nest for client-side
        url:
            typeof window === 'undefined'
                ? validateEnvPath(process.env.API_URL!, 'API_URL')
                : `${APP_URL}/api/nest`,
        interceptors: [
            onError((error, options) => {
                console.log(error)
                // Don't log AbortError as it's expected when queries are canceled
                if (
                    (error as Error)?.name === 'AbortError' ||
                    (error &&
                        typeof error === 'object' &&
                        'code' in error &&
                        error.code === 'ABORT_ERR')
                ) {
                    // Silently ignore abort errors - they're expected during cleanup
                    return
                }

                if (options.context.noRedirectOnUnauthorized) {
                    // Skip redirect logic if context flag is set
                    return
                }

                // Check if this is a 401 Unauthorized error
                if (
                    error &&
                    typeof error === 'object' &&
                    'status' in error &&
                    error.status === 401
                ) {
                    // Only redirect on client-side to avoid SSR issues
                    if (typeof window !== 'undefined') {
                        // Get current page URL for redirect callback
                        const currentPath =
                            window.location.pathname + window.location.search

                        // Generate login URL with callback
                        const loginUrl = toAbsoluteUrl(
                            Authsignin(
                                {},
                                {
                                    callbackUrl: currentPath,
                                }
                            )
                        )

                        // Redirect to login page
                        window.location.href = loginUrl
                        redirect(loginUrl)
                    }

                    throw error // Re-throw to allow further handling if needed
                }
            }),
        ],
    })

    return createORPCClient<ContractRouterClient<AppContract>>(link)
}
