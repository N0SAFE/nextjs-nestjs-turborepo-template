'use client'

import { type ReactNode } from 'react'
import { useOrganizationPermissions, type OrganizationRole } from '@/lib/permissions'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'

export interface RequireRoleProps {
  /**
   * Organization roles that are allowed to see the children
   * User needs to have ANY of these roles within the organization
   */
  roles: OrganizationRole[]
  /**
   * The organization ID to check membership and role for
   */
  organizationId: string
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
 * Conditionally renders children based on the user's role in an organization.
 * 
 * @example
 * ```tsx
 * // Only show settings tab to owners and admins
 * <RequireRole roles={['owner', 'admin']} organizationId={org.id}>
 *   <SettingsTab />
 * </RequireRole>
 * 
 * // Show owner-only content with fallback
 * <RequireRole 
 *   roles={['owner']} 
 *   organizationId={org.id}
 *   fallback={<p>Only the organization owner can delete</p>}
 * >
 *   <DeleteOrganizationButton />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  roles,
  organizationId,
  children,
  fallback = null,
  loading,
}: RequireRoleProps) {
  const { hasAnyOrganizationRole, isLoading, isMember } = useOrganizationPermissions(organizationId)

  if (isLoading) {
    return loading ?? <Skeleton className="h-8 w-full" />
  }

  if (!isMember) {
    return <>{fallback}</>
  }

  if (!hasAnyOrganizationRole(roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook variant of RequireRole for more flexible usage
 * 
 * @example
 * ```tsx
 * const { allowed, isLoading, isMember, role } = useRequireRole(['owner', 'admin'], orgId)
 * 
 * if (isLoading) return <Spinner />
 * if (!allowed) return <AccessDenied />
 * 
 * return <AdminContent role={role} />
 * ```
 */
export function useRequireRole(roles: OrganizationRole[], organizationId: string) {
  const { hasAnyOrganizationRole, isLoading, isMember, role } = useOrganizationPermissions(organizationId)

  return {
    allowed: isMember && hasAnyOrganizationRole(roles),
    isLoading,
    isMember,
    role,
  }
}

export default RequireRole
