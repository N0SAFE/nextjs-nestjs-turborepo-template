// Non-React state and helpers for master token management
export const MASTER_TOKEN_COOKIE_NAME = 'master-token-enabled'
export const DEV_AUTH_KEY_COOKIE_NAME = 'dev-auth-key'

export function getMasterTokenEnabled(): boolean {
    if (typeof window === 'undefined') return false

    const cookies = document.cookie.split(';')
    const masterTokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith(`${MASTER_TOKEN_COOKIE_NAME}=`)
    )

    return masterTokenCookie?.split('=')[1]?.trim() === 'true'
}

export function setMasterTokenEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 1)
    
    // Use SameSite=None with Secure in production (HTTPS), SameSite=Lax in development
    const isProduction = process.env.NODE_ENV === 'production'
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const useSecure = isProduction || isHttps
    const cookieAttributes = useSecure 
        ? `path=/; SameSite=None; Secure` 
        : `path=/; SameSite=Lax`

    // Set the master-token-enabled flag cookie
    document.cookie = `${MASTER_TOKEN_COOKIE_NAME}=${String(enabled)}; expires=${expirationDate.toUTCString()}; ${cookieAttributes}`

    // Set or clear the dev-auth-key cookie that the server actually reads
    const devAuthKey = process.env.NEXT_PUBLIC_DEV_AUTH_KEY
    if (enabled && devAuthKey) {
        document.cookie = `${DEV_AUTH_KEY_COOKIE_NAME}=${encodeURIComponent(devAuthKey)}; expires=${expirationDate.toUTCString()}; ${cookieAttributes}`
    } else {
        // Clear the dev-auth-key cookie when disabled
        document.cookie = `${DEV_AUTH_KEY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }

    try {
        localStorage.setItem(
            'master-token',
            JSON.stringify({ value: enabled, t: Date.now() })
        )
    } catch {
        // ignore
    }
}

export function clearMasterToken(): void {
    if (typeof window === 'undefined') return

    // Clear both cookies
    document.cookie = `${MASTER_TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${DEV_AUTH_KEY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    
    try {
        localStorage.setItem(
            'master-token',
            JSON.stringify({ value: false, t: Date.now() })
        )
    } catch {
        // ignore
    }

    try {
        window.dispatchEvent(
            new CustomEvent('master-token-changed', {
                detail: { value: false },
            })
        )
    } catch {
        // ignore
    }
}

export function getMasterTokenKey(): string | null {
    return null
}

export type MasterTokenSubscriber = (value: boolean) => void

export const MasterTokenManager = {
    state: typeof window === 'undefined' ? false : getMasterTokenEnabled(),
    subscribers: new Set<MasterTokenSubscriber>(),
    
    onStateChange(fn: MasterTokenSubscriber) {
        MasterTokenManager.subscribers.add(fn)
        return () => MasterTokenManager.subscribers.delete(fn)
    },

    change(value: boolean) {
        try {
            setMasterTokenEnabled(value)
        } catch {
            // ignore
        }
        MasterTokenManager.state = value
        for (const fn of Array.from(MasterTokenManager.subscribers)) {
            try {
                fn(value)
            } catch {
                // ignore
            }
        }
    }
}
