import type { BetterAuthClientPlugin } from 'better-auth/client'
import dynamic from 'next/dynamic'
import {
    getMasterTokenEnabled,
    setMasterTokenEnabled,
    clearMasterToken,
    getMasterTokenKey,
    MasterTokenManager,
} from './state'
import { authClient } from '../..'

export const MasterTokenProvider = dynamic(
    () => import('./components/provider').then((m) => m.MasterTokenProvider)
)

/**
 * Better Auth client plugin to attach a master token Authorization header
 * when the devtools dev-auth flag is enabled. This keeps auth-related
 * behavior colocated under `lib/auth/plugins`.
 */
export const masterTokenClient = (): ReturnType<() => BetterAuthClientPlugin> =>
    ({
        getActions: () => {
            async function masterTokenSignOut(
                ...args: Parameters<typeof authClient.signOut>
            ) {
                // If dev auth mode is active in development, we want to disable the
                // dev-auth token mode and then refresh the client session instead of
                // performing a real sign-out. This keeps the UX local to the browser
                // when using the development master token flow.
                if (
                    typeof window !== 'undefined' &&
                    process.env.NODE_ENV === 'development'
                ) {
                    console.log(
                        'MasterTokenManager.state',
                        MasterTokenManager.state
                    )
                    if (!MasterTokenManager.state) {
                        // If dev auth mode is not active, fall through to the original
                        // signOut behavior to ensure sign-out still works.
                        return authClient.signOut(...args)
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
            }

            return {
                getMasterTokenEnabled,
                setMasterTokenEnabled,
                clearMasterToken,
                getMasterTokenKey,
                MasterTokenProvider,
                MasterTokenManager,
                masterTokenSignOut,
            }
        },
        id: 'master-token-client',
        fetchPlugins: [
            {
                hooks: {
                    onRequest: (ctx) => {
                        console.log('masterTokenClientPlugin: onRequest', ctx)
                        console.log(
                            'DevAuthManager.state',
                            MasterTokenManager.state
                        )
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
                                    ...(ctx?.headers || {}),
                                },
                                ctx?.headers || {}
                            )
                            return {
                                ...(ctx || {}),
                                headers: new Headers({ ...mergedHeaders }),
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
