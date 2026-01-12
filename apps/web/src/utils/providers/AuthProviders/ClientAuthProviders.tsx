'use client'

import React from 'react'
import { useSession } from '@/lib/auth'
// Use explicit client path to avoid conditional export resolution issues with TypeScript
import { configureClientAuth } from '@repo/declarative-routing/page-wrappers/client'

// Configure the client auth adapter for declarative routing ClientSessionPage wrappers
// The useSession function is passed as a reference and will be called inside components
configureClientAuth({
    // This function returns a hook - it will be called inside a component context
    useSession: () => {
        const session = useSession()
        return {
            data: session.data ?? null,
            // useSession may return either isPending (Better Auth native) or isLoading (our bridge)
            // We need to handle both cases
            isPending: ('isPending' in session ? session.isPending : false),
            refetch: session.refetch,
        }
    },
})

/**
 * Client-side auth providers wrapper.
 * Configures the auth adapter for declarative routing.
 */
export const ClientAuthProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
    // No longer need SessionBridgeProvider - useSession from createSessionAwareAuthClient
    // automatically subscribes to React Query cache for hydrated session data
    return <>{children}</>
}

export default ClientAuthProviders