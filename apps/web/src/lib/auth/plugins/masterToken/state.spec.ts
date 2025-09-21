import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    MASTER_TOKEN_COOKIE_NAME,
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
        setMasterTokenEnabled(true)
        expect(getMasterTokenEnabled()).toBe(true)

        const cookieHas = document.cookie.includes(`${MASTER_TOKEN_COOKIE_NAME}=true`)
        expect(cookieHas).toBe(true)

        const stored = localStorage.getItem('master-token')
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored as string)
        expect(parsed.value).toBe(true)
    })

    it('clearMasterToken clears cookie, sets localStorage and dispatches event', () => {
        const spy = vi.fn()
        window.addEventListener('master-token-changed', spy)

        // set then clear
        setMasterTokenEnabled(true)
        expect(getMasterTokenEnabled()).toBe(true)

        clearMasterToken()

        expect(getMasterTokenEnabled()).toBe(false)
        const stored = JSON.parse(localStorage.getItem('master-token') || '{}')
        expect(stored.value).toBe(false)

        // event dispatched
        expect(spy).toHaveBeenCalled()
        window.removeEventListener('master-token-changed', spy)
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
