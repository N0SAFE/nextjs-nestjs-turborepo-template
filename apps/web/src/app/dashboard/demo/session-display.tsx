'use client'

import { useSession } from '@/lib/auth'
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert'
import { Badge } from '@repo/ui/components/shadcn/badge'

/**
 * Client component that uses useSession to display session data.
 * 
 * Key observation: This component does NOT show a loading state
 * because the session was already hydrated from the server!
 */
export function SessionDisplay() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <Alert>
        <AlertDescription>No active session found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Indicators */}
      <div className="flex gap-2 items-center">
        <Badge variant="default">
          ✅ Loaded from cache
        </Badge>
        <span className="text-xs text-muted-foreground">
          (No loading state = hydration success!)
        </span>
      </div>

      {/* Session Data */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Name</p>
          <p className="text-lg font-semibold">{session.user.name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p className="text-lg font-semibold">{session.user.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Role</p>
          <p className="text-lg font-semibold">{session.user.role ?? 'User'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">User ID</p>
          <p className="text-sm font-mono truncate">{session.user.id}</p>
        </div>
      </div>

      {/* Technical Details */}
      <div className="pt-4 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Technical Details
        </p>
        <div className="text-xs space-y-1 text-muted-foreground">
          <p>• Session was fetched on the server during SSR</p>
          <p>• React Query cache was hydrated with the session data</p>
          <p>• This component read from the cache (no API call)</p>
          <p>• Check Network tab: you should see NO session fetch on page load</p>
        </div>
      </div>
    </div>
  )
}
