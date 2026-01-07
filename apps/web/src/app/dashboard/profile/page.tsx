import { AuthDashboardProfile } from '@/routes'
import { ProfileForm } from './profile-form'
import { PageTimingLogger } from '@/lib/timing'

/**
 * Profile Page using SessionRoute pattern
 * 
 * Uses AuthDashboardProfile.SessionRoute to:
 * 1. Fetch session ONCE on the server
 * 2. Pass it as a prop AND hydrate to React Query cache
 * 3. ProfileForm client component reads from cache instantly
 * 
 * No loading states needed - session data is immediately available.
 */
export default AuthDashboardProfile.SessionRoute(({ session }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>

      {/* Profile form - client component for interactivity */}
      <ProfileForm initialSession={session} />
      
      {/* Timing Logger */}
      <PageTimingLogger pageName="Profile" />
    </div>
  )
})
