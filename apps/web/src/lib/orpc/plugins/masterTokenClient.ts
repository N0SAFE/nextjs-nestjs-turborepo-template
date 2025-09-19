import { authClient } from "../../auth"
import { hasMasterTokenPlugin } from "../../auth/plugins/guards"

/**
 * Returns Authorization header object when dev token mode is active and
 * NEXT_PUBLIC_DEV_AUTH_KEY is present. Otherwise returns an empty object.
 */
export function getMasterTokenHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    // Only enable in development to avoid leaking secrets in production
    if (process.env.NODE_ENV !== 'development') return {}

    try {
        if (hasMasterTokenPlugin(authClient) && !authClient.MasterTokenManager.state) return {}

        const key = process.env.NEXT_PUBLIC_DEV_AUTH_KEY
        if (!key) return {}

        return {
            Authorization: `Bearer ${key}`,
        }
    } catch (e) {
        // defensive fallback
        console.warn('masterTokenClientPlugin: failed to build header', e)
        return {}
    }
}

export default getMasterTokenHeader
