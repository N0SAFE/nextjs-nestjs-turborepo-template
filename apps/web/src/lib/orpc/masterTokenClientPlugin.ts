/**
 * Client-side helper plugin to attach Master Token Authorization header
 * when dev auth mode is enabled via the devtools toggle.
 */
import { getDevAuthEnabled, clearDevAuth } from '@/lib/dev-auth-cookie'
import { toast } from 'sonner'

/**
 * Returns Authorization header object when dev token mode is active and
 * NEXT_PUBLIC_DEV_AUTH_KEY is present. Otherwise returns an empty object.
 */
export function getMasterTokenHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    // Only enable in development to avoid leaking secrets in production
    if (process.env.NODE_ENV !== 'development') return {}

    try {
        if (!getDevAuthEnabled()) return {}

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

/**
 * Disable dev auth mode and show a short sonner toast. Safe to call
 * from client-side only; it's a no-op outside development.
 */
export function disableDevAuthWithToast() {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'development') return

    try {
        if (!getDevAuthEnabled()) return
        clearDevAuth()
        try {
            toast('Dev auth token mode disabled')
        } catch (e) {
            // best-effort
            // eslint-disable-next-line no-console
            console.warn('disableDevAuthWithToast: toast failed', e)
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('disableDevAuthWithToast failed', e)
    }
}
