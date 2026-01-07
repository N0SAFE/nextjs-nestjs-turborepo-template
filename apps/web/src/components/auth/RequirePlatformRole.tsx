'use client'

import type { ReactNode } from 'react'
import { useSession } from '@/lib/auth'
import type { PlatformRole } from '@repo/auth/permissions'
import { isPlatformRoleAtLeast } from '@repo/auth/permissions'

export interface RequirePlatformRoleProps {
  /**
   * Roles that are allowed to see the children.
   * User needs at least ONE of these roles.
   */
  roles: PlatformRole[]
  /**
   * Optional: Minimum role level (uses role hierarchy)
   * If provided, checks if user's role is at least this level
   */
  minimumRole?: PlatformRole
  /**
   * Content to show when user lacks permission
   */
  fallback?: ReactNode
  /**
   * Content to show when session is loading
   */
  loading?: ReactNode
  /**
   * Children to render when permission is granted
   */
  children: ReactNode
}

/**
 * RequirePlatformRole - Shows children only if user has one of the specified platform roles.
 * 
 * Platform roles are user-wide (stored in user.role field):
 * - superAdmin: Full platform access
 * - admin: Platform administration
 * - user: Standard user
 * 
 * @example
 * ```tsx
 * // Show admin panel only for admins
 * <RequirePlatformRole roles={['admin', 'superAdmin']}>
 *   <AdminPanel />
 * </RequirePlatformRole>
 * 
 * // With fallback
 * <RequirePlatformRole 
 *   roles={['admin']} 
 *   fallback={<p>Admin access required</p>}
 * >
 *   <SensitiveData />
 * </RequirePlatformRole>
 * 
 * // Using minimum role level (hierarchy-based)
 * <RequirePlatformRole minimumRole="admin">
 *   <AdminFeatures />
 * </RequirePlatformRole>
 * ```
 */
export function RequirePlatformRole({
  roles,
  minimumRole,
  fallback = null,
  // loading prop is kept for API compatibility but not used since session is synchronous
  loading: _loading,
  children,
}: RequirePlatformRoleProps) {
  void _loading // suppress unused variable warning
  const { data: session } = useSession()

  // No session = no access
  if (!session?.user) {
    return <>{fallback}</>
  }

  const userRole = session.user.role as PlatformRole | undefined

  // No role = no access
  if (!userRole) {
    return <>{fallback}</>
  }

  // Check minimum role level if specified
  if (minimumRole) {
    if (isPlatformRoleAtLeast(userRole, minimumRole)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  // Check if user has any of the allowed roles
  if (roles.includes(userRole)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Hook version for programmatic access
 */
export function usePlatformRole(): {
  role: PlatformRole | null
  hasRole: (roles: PlatformRole[]) => boolean
  isAtLeast: (minimumRole: PlatformRole) => boolean
} {
  const { data: session } = useSession()
  
  const role = session?.user ? (session.user.role as PlatformRole | undefined) ?? null : null

  return {
    role,
    hasRole: (roles: PlatformRole[]) => role !== null && roles.includes(role),
    isAtLeast: (minimumRole: PlatformRole) => 
      role !== null && isPlatformRoleAtLeast(role, minimumRole),
  }
}
