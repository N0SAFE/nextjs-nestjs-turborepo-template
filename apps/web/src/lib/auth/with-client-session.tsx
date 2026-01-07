'use client'

import React from 'react'
import { useSession } from './index'
import type { $Infer } from './index'

/**
 * Props passed to client components wrapped with withClientSession.
 * Includes the session data and query utilities for refetching.
 */
export interface ClientSessionProps {
    session: typeof $Infer.Session | null | undefined
    isLoading: boolean
    refetch: () => void
}

/**
 * Higher-order component that provides session data and refetch capabilities
 * to client components. This is the client-side equivalent of withSessionHydration.
 * 
 * Use this when you need:
 * - Real-time session updates
 * - Ability to refetch session data
 * - Client-side interactivity with session
 * 
 * @example
 * ```tsx
 * 'use client'
 * 
 * function MyClientComponent({ session, isLoading, refetch }: ClientSessionProps) {
 *   if (isLoading) return <div>Loading...</div>
 *   
 *   return (
 *     <div>
 *       <p>Welcome {session?.user.name}</p>
 *       <button onClick={() => { void refetch() }}>Refresh Session</button>
 *     </div>
 *   )
 * }
 * 
 * export default withClientSession(MyClientComponent)
 * ```
 */
export function withClientSession<P extends ClientSessionProps>(
    Component: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof ClientSessionProps>> {
    const WrappedComponent = (props: Omit<P, keyof ClientSessionProps>) => {
        const { data: session, refetch: originalRefetch } = useSession()
        const isLoading = !session
        
        // Wrap refetch to ensure void return
        const refetch = () => {
            void originalRefetch()
        }

        return (
            <Component
                {...(props as P)}
                session={session}
                isLoading={isLoading}
                refetch={refetch}
            />
        )
    }

    WrappedComponent.displayName = `WithClientSession(${Component.displayName ?? Component.name})`

    return WrappedComponent
}

/**
 * Convenience function to create a client session page.
 * Equivalent to withClientSession but with a more semantic name.
 */
export function createClientSessionPage<P extends ClientSessionProps>(
    Page: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof ClientSessionProps>> {
    return withClientSession(Page)
}
