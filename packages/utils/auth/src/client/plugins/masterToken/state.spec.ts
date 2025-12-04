import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    MASTER_TOKEN_COOKIE_NAME,
    DEV_AUTH_KEY_COOKIE_NAME,
    getMasterTokenEnabled,
    setMasterTokenEnabled,
    clearMasterToken,
    MasterTokenManager,
} from './state'

// Ensure tests run in jsdom environment where document and localStorage exist

describe('master token state utilities', () => {
    beforeEach(() => {
        // Reset document.cookie and localStorage between tests
        Object.defineProperty(window, 'localStorage', {
            value: window.localStorage,
            configurable: true,
        })
        document.cookie = ''
        try {
            localStorage.clear()
        } catch {
            // ignore
        }
        // reset manager state and subscribers
        MasterTokenManager.state = false
        MasterTokenManager.subscribers = new Set()
    })

    it('getMasterTokenEnabled returns false when cookie absent', () => {
        document.cookie = ''
        expect(getMasterTokenEnabled()).toBe(false)
    })

    it('setMasterTokenEnabled sets cookie and localStorage', () => {
        // Set up env var for this test
        const originalEnv = process.env.NEXT_PUBLIC_DEV_AUTH_KEY
        process.env.NEXT_PUBLIC_DEV_AUTH_KEY = 'test-dev-key'
        
        setMasterTokenEnabled(true)
        expect(getMasterTokenEnabled()).toBe(true)

        const cookieHasMasterToken = document.cookie.includes(`${MASTER_TOKEN_COOKIE_NAME}=true`)
        expect(cookieHasMasterToken).toBe(true)
        
        // Should also set the dev-auth-key cookie with the actual key
        const cookieHasDevAuthKey = document.cookie.includes(`${DEV_AUTH_KEY_COOKIE_NAME}=test-dev-key`)
        expect(cookieHasDevAuthKey).toBe(true)

        const stored = localStorage.getItem('master-token')
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed.value).toBe(true)
        
        // Cleanup
        process.env.NEXT_PUBLIC_DEV_AUTH_KEY = originalEnv
    })

    it('clearMasterToken clears cookie, sets localStorage and dispatches event', () => {
        // Set up env var for this test
        const originalEnv = process.env.NEXT_PUBLIC_DEV_AUTH_KEY
        process.env.NEXT_PUBLIC_DEV_AUTH_KEY = 'test-dev-key'
        
        const spy = vi.fn()
        window.addEventListener('master-token-changed', spy)

        // set then clear
        setMasterTokenEnabled(true)
        expect(getMasterTokenEnabled()).toBe(true)
        expect(document.cookie.includes(`${DEV_AUTH_KEY_COOKIE_NAME}=test-dev-key`)).toBe(true)

        clearMasterToken()

        expect(getMasterTokenEnabled()).toBe(false)
        // dev-auth-key cookie should be cleared (empty or absent)
        expect(document.cookie.includes(`${DEV_AUTH_KEY_COOKIE_NAME}=test-dev-key`)).toBe(false)
        
        const stored = JSON.parse(localStorage.getItem('master-token') ?? '{}')
        expect(stored.value).toBe(false)

        // event dispatched
        expect(spy).toHaveBeenCalled()
        window.removeEventListener('master-token-changed', spy)
        
        // Cleanup
        process.env.NEXT_PUBLIC_DEV_AUTH_KEY = originalEnv
    })

    it('MasterTokenManager.change updates state and notifies subscribers', () => {
        const calls: boolean[] = []
        const unsub = MasterTokenManager.onStateChange((v) => calls.push(v))

        MasterTokenManager.change(true)
        expect(MasterTokenManager.state).toBe(true)
        expect(calls).toEqual([true])

        MasterTokenManager.change(false)
        expect(MasterTokenManager.state).toBe(false)
        expect(calls).toEqual([true, false])

        // unsubscribe and ensure no further calls
        unsub()
        MasterTokenManager.change(true)
        expect(calls).toEqual([true, false])
    })
})
