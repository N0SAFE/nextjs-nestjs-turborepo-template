import ClientAuthProviders from './ClientAuthProviders'

// Server component that wraps the client-side Better Auth provider
// NOTE: We do NOT fetch session here - that would defeat lazy loading!
// Session is only fetched when:
// 1. A page uses SessionPage wrapper (explicit server-side fetch + hydration)
// 2. A component calls useSession() (client-side fetch on-demand)
const AuthProviders = ({
    children,
}: {
    children: React.ReactNode
}) => {
    return (
        <ClientAuthProviders>
            {children}
        </ClientAuthProviders>
    )
}

export default AuthProviders
