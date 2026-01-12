'use client'

import { type ReactNode } from 'react'
import { usePermissions, type PlatformRole } from '@/lib/permissions'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'

export interface RequirePlatformRoleProps {
  /**
   * Platform roles that are allowed to see the children
   * User needs to have ANY of these roles
   */
  roles: PlatformRole[]
  /**
   * Content to show if user has the required role
   */
  children: ReactNode
  /**
   * Content to show if user doesn't have the required role
   * If not provided, nothing is rendered
   */
  fallback?: ReactNode
  /**
   * Content to show while loading
   * If not provided, a skeleton is shown
   */
  loading?: ReactNode
}

/**
 * Conditionally renders children based on the user's platform role.
 * 
 * @example
 * ```tsx
 * // Only show admin panel link to admins
 * <RequirePlatformRole roles={['admin', 'superAdmin']}>
 *   <Link href="/dashboard/admin">Admin Panel</Link>
 * </RequirePlatformRole>
 * 
 * // Show different content based on role
 * <RequirePlatformRole 
 *   roles={['superAdmin']} 
 *   fallback={<p>Contact your administrator</p>}
 * >
 *   <SystemSettingsForm />
 * </RequirePlatformRole>
 * ```
 */
export function RequirePlatformRole({
  roles,
  children,
  fallback = null,
  loading,
}: RequirePlatformRoleProps) {
  const { hasAnyPlatformRole, isLoading, isAuthenticated } = usePermissions()

  if (isLoading) {
    return loading ?? <Skeleton className="h-8 w-full" />
  }

  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  if (!hasAnyPlatformRole(roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook variant of RequirePlatformRole for more flexible usage
 * 
 * @example
 * ```tsx
 * const { allowed, isLoading } = useRequirePlatformRole(['admin'])
 * 
 * if (isLoading) return <Spinner />
 * if (!allowed) return <AccessDenied />
 * 
 * return <AdminContent />
 * ```
 */
export function useRequirePlatformRole(roles: PlatformRole[]) {
  const { hasAnyPlatformRole, isLoading, isAuthenticated } = usePermissions()

  return {
    allowed: isAuthenticated && hasAnyPlatformRole(roles),
    isLoading,
    isAuthenticated,
  }
}

export default RequirePlatformRole
