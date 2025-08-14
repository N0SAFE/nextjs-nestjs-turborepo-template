'use client'

import {
    setSession as setZustandSession,
    subscribeToUserSession as subscribeToZustandUserSession,
    getSession as getZustandSession,
} from '@/state/session'
import { useSession } from './index'
import { useEffect } from 'react'

export default function Validate({
    children,
}: React.PropsWithChildren<object>) {
    const { data: session } = useSession()

    // Handle zustand session updates
    useEffect(() => {
        const unsubscribe = subscribeToZustandUserSession((state) => {
            if (state.session && session !== state.session) {
                if (process.env.NEXT_PUBLIC_SHOW_AUTH_LOGS) {
                    console.log(
                        'Better Auth Validate: updating session from zustand',
                        state.session
                    )
                }
                // Better Auth handles session updates automatically
            }
        })
        return () => unsubscribe()
    }, [session])

    // Handle session updates and errors
    useEffect(() => {
        if (!session) {
            setZustandSession(null)
            return
        }

        if (session !== getZustandSession()) {
            if (process.env.NEXT_PUBLIC_SHOW_AUTH_LOGS) {
                console.log('Better Auth Validate: syncing session to zustand', session)
            }
            setZustandSession(session)
        }
    }, [session])

    return <>{children}</>
}
