// Non-React state and helpers for master token management
export const MASTER_TOKEN_COOKIE_NAME = 'master-token-enabled'

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

    document.cookie = `${MASTER_TOKEN_COOKIE_NAME}=${enabled}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`

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

    document.cookie = `${MASTER_TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
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

export class MasterTokenManager {
    static state: boolean =
        typeof window === 'undefined' ? false : getMasterTokenEnabled()

    static subscribers = new Set<MasterTokenSubscriber>()

    static onStateChange(fn: MasterTokenSubscriber) {
        MasterTokenManager.subscribers.add(fn)
        return () => MasterTokenManager.subscribers.delete(fn)
    }

    static change(value: boolean) {
        try {
            setMasterTokenEnabled(value)
        } catch {
            // ignore
        }
        MasterTokenManager.state = Boolean(value)
        for (const fn of Array.from(MasterTokenManager.subscribers)) {
            try {
                fn(Boolean(value))
            } catch {
                // ignore
            }
        }
    }
}
