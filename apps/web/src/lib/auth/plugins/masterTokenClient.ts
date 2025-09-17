import type { BetterAuthClientPlugin } from 'better-auth/client'
import { getDevAuthEnabled } from '@/lib/dev-auth-cookie'

/**
 * Better Auth client plugin to attach a master token Authorization header
 * when the devtools dev-auth flag is enabled. This keeps auth-related
 * behavior colocated under `lib/auth/plugins`.
 */
export const masterTokenClient = () =>
    ({
        id: 'master-token-client',
        fetchPlugins: [
            {
                hooks: {
                    onRequest: (ctx) => {
                        console.log('fetchWithMasterToken called with:', ctx)
                        // Only enable in development to avoid leaking secrets in production
                        if (process.env.NODE_ENV !== 'development') return ctx

                        console.log(
                            'masterTokenClient: checking dev auth status'
                        )

                        try {
                            if (!getDevAuthEnabled()) return ctx
                            console.log('masterTokenClient: dev auth enabled')

                            const key = process.env.NEXT_PUBLIC_DEV_AUTH_KEY
                            console.log(
                                'masterTokenClient: got key from env:',
                                !!key
                            )
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
