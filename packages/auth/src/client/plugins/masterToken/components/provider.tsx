"use client"
import React, { useEffect, useState, useContext } from 'react'
import { toast } from 'sonner'
import {
    getMasterTokenEnabled,
    MasterTokenManager,
} from '../state'
import { MasterTokenContext } from './context'

interface MasterTokenProviderProps {
    refetch: () => void | Promise<void>
    children?: React.ReactNode
}

export const MasterTokenProvider: React.FC<MasterTokenProviderProps> = ({
    children,
    refetch,
}) => {
    const [enabled, setEnabledState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return getMasterTokenEnabled()
    })

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'master-token-changed' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue) as {
                        value: boolean
                    }
                    MasterTokenManager.change(parsed.value)
                } catch {
                    // ignore
                }
            }
        }

        const onCustom = (e: Event) => {
            const cev = e as CustomEvent<{value?: string}>
            if (typeof cev.detail.value !== 'undefined') {
                MasterTokenManager.change(Boolean(cev.detail.value))
            }
        }

        window.addEventListener('storage', onStorage)
        window.addEventListener('master-token-changed', onCustom as EventListener)
        const unsub = MasterTokenManager.onStateChange((v) => {
            setEnabledState(v)
            if (!v) {
                toast('Master token mode disabled')
            }
        })

        return () => {
            window.removeEventListener('storage', onStorage)
            window.removeEventListener('master-token-changed', onCustom as EventListener)
            void unsub()
        }
    }, [])

    useEffect(() => {
        refetch()
    }, [enabled, refetch])

    return (
        <MasterTokenContext.Provider
            value={{ enabled, setEnabled: MasterTokenManager.change.bind(MasterTokenManager) }}
        >
            {children}
        </MasterTokenContext.Provider>
    )
}

export function useMasterToken() {
    const ctx = useContext(MasterTokenContext)
    if (!ctx) throw new Error('useMasterToken must be used inside MasterTokenProvider')
    return ctx
}

export default MasterTokenProvider
