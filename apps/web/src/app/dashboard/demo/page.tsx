import { AuthDashboardDemo } from '@/routes'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/shadcn/card'
import { SessionDisplay } from './session-display'

console.log('uio')

/**
 * Example page demonstrating the SessionRoute pattern.
 * 
 * This page uses AuthDashboardDemo.SessionRoute which:
 * 1. Fetches the session ONCE on the server
 * 2. Passes it as a prop to this component
 * 3. Hydrates it to React Query cache
 * 4. Client components (SessionDisplay) read from the cache without refetching
 * 
 * This prevents the "double fetch" problem where both server and client
 * fetch the session independently.
 */
export default AuthDashboardDemo.SessionRoute(({ session }) => {
  
  console.log('server or client ?')
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Session Hydration Demo
        </h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates server-side session fetch + client hydration
        </p>
        {session && (
          <p className="text-sm text-muted-foreground mt-1">
            Server prop: Logged in as <strong>{session.user.email}</strong>
          </p>
        )}
      </div>

      {/* Demo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🎯 How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Server fetches once:</strong> The SessionRoute wrapper calls{' '}
                <code className="bg-muted px-1 rounded">getSession()</code> on the server
              </li>
              <li>
                <strong>Hydrates to client:</strong> Session data is dehydrated and sent
                to the client&apos;s React Query cache
              </li>
              <li>
                <strong>Client reads cache:</strong> Client components using{' '}
                <code className="bg-muted px-1 rounded">useSession()</code> read from
                the cache without refetching
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>✨ Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Single fetch:</strong> Only one API call per request
              </li>
              <li>
                <strong>No loading states:</strong> Client components get data instantly
              </li>
              <li>
                <strong>Type-safe:</strong> Full TypeScript support with route params
              </li>
              <li>
                <strong>Opt-in:</strong> Use SessionRoute only where needed
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Live Session Display */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Live Session Data (from cache)</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionDisplay />
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>💻 Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            <code>{`// page.tsx (Server Component)
import { AuthDashboardDemo } from '@/routes'

export default AuthDashboardDemo.SessionRoute(({ session }) => {
  // Session is available as a prop AND hydrated for client components
  return (
    <div>
      <h1>Welcome {session?.user.name}</h1>
      <ClientComponent />
    </div>
  )
})

// client-component.tsx
'use client'
import { useSession } from '@/lib/auth'

export function ClientComponent() {
  const { data: session } = useSession()
  // No loading state! Data is instantly available from cache
  return <div>Email: {session?.user.email}</div>
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
})
