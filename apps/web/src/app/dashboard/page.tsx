import { AuthDashboard } from '@/routes'
import { DashboardOverviewClient } from './dashboard-client'
import { PageTimingLogger } from '@/lib/timing'

/**
 * Dashboard Overview Page using SessionRoute pattern
 * 
 * Uses AuthDashboard.SessionRoute to:
 * 1. Fetch session ONCE on the server
 * 2. Pass it as a prop to this component
 * 3. Hydrate it to React Query cache
 * 4. Client components read from cache without refetching
 */
export default AuthDashboard.SessionRoute(({ session }) => {
  const isAdmin = session?.user.role === 'admin'
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {session?.user.name ?? 'User'}!
        </p>
      </div>

      {/* Client-side data components */}
      <DashboardOverviewClient isAdmin={isAdmin} userRole={session?.user.role ?? 'user'} />
      
      {/* Timing Logger */}
      <PageTimingLogger pageName="Dashboard" />
    </div>
  )
})
