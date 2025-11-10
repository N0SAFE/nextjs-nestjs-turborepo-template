/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { BetterAuthClientPlugin, BetterFetch, ClientStore, BetterAuthClientOptions } from 'better-auth/client'
import {
    getMasterTokenEnabled,
    setMasterTokenEnabled,
    clearMasterToken,
    getMasterTokenKey,
    MasterTokenManager,
} from './state'

/**
 * Better Auth client plugin to attach a master token Authorization header
 * when the devtools dev-auth flag is enabled. This keeps auth-related
 * behavior colocated under `lib/auth/plugins`.
 */
export const masterTokenClient = (): BetterAuthClientPlugin =>
    ({
        getActions: ($fetch: BetterFetch, $store: ClientStore, _options: BetterAuthClientOptions | undefined) => {
            const createMasterTokenSignOut = <TSignOut extends (...args: unknown[]) => Promise<unknown>>(signOutFn: TSignOut) => {
                return async (...args: Parameters<TSignOut>): Promise<Awaited<ReturnType<TSignOut>> | null> => {
                    // If dev auth mode is active in development, we want to disable the
                    // dev-auth token mode and then refresh the client session instead of
                    // performing a real sign-out. This keeps the UX local to the browser
                    // when using the development master token flow.
                    if (
                        typeof window !== 'undefined' &&
                        process.env.NODE_ENV === 'development'
                    ) {
                        if (!MasterTokenManager.state) {
                            // If dev auth mode is not active, fall through to the original
                            // signOut behavior to ensure sign-out still works.
                            return signOutFn(...args) as Promise<Awaited<ReturnType<TSignOut>>>
                        }
                        try {
                            MasterTokenManager.change(false)
                            return null
                        } catch {
                            // Defensive: if anything in our dev-only flow fails, fall through
                            // to the original signOut behavior to ensure sign-out still works.
                            console.warn(
                                'master-token signOut interception failed, falling back'
                            )
                        }
                    }
                    return null
                }
            }

            return {
                getMasterTokenEnabled,
                setMasterTokenEnabled,
                clearMasterToken,
                getMasterTokenKey,
                MasterTokenManager,
                // We'll set this dynamically when the client is created
                $masterTokenSignOut: createMasterTokenSignOut,
            }
        },
        id: 'master-token-client',
        fetchPlugins: [
            {
                hooks: {
                    onRequest: (ctx) => {
                        if (!MasterTokenManager.state) {
                            return ctx
                        }

                        // Only enable in development to avoid leaking secrets in production
                        if (process.env.NODE_ENV !== 'development') return ctx

                        try {
                            const key = process.env.NEXT_PUBLIC_DEV_AUTH_KEY
                            if (!key) return ctx

                            const mergedHeaders = Object.assign(
                                {
                                    Authorization: `Bearer ${key}`,
                                    ...Array.isArray(ctx?.headers) ? ctx.headers.reduce((acc, [key, data]) => {
                                    return {
                                        ...acc,
                                        [key]: data
                                    }
                                }, {}) : ctx?.headers ?? {},
                                },
                                ctx?.headers || {}
                            )
                            return {
                                ...(ctx || {}),
                                headers: new Headers({ ...Array.isArray(mergedHeaders) ? mergedHeaders.reduce((acc, [key, data]) => {
                                    return {
                                        ...acc,
                                        [key]: data
                                    }
                                }, {}) : mergedHeaders ?? {}, }),
                            }
                        } catch (e) {
                            // defensive fallback
                            console.warn(
                                'masterTokenClientPlugin: failed to build header',
                                e
                            )
                            return ctx
                        }
                    },
                },
                id: 'master-token-header',
                name: 'Master Token Header Plugin',
            },
        ],
    }) satisfies BetterAuthClientPlugin

export default masterTokenClient
