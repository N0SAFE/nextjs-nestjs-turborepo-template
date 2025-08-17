import React from 'react'
import ClientBetterAuthProviders from './ClientBetterAuthProviders'

const BetterAuthProviders: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    return (
        <ClientBetterAuthProviders>
            {children}
        </ClientBetterAuthProviders>
    )
}

export default BetterAuthProviders
