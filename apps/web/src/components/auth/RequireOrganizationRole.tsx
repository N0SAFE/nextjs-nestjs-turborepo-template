'use client'

import type { ReactNode } from 'react'
import { useOrganizationMembers, type OrganizationMember } from '@/hooks/useOrganization'
import { useSession } from '@/lib/auth'
import type { OrganizationRole } from '@repo/auth/permissions'
import { isOrganizationRoleAtLeast } from '@repo/auth/permissions'

export interface RequireOrganizationRoleProps {
  /**
   * The organization ID to check membership for
   */
  organizationId: string
  /**
   * Roles that are allowed to see the children.
   * User needs at least ONE of these roles within the organization.
   */
  roles: OrganizationRole[]
  /**
   * Optional: Minimum role level (uses role hierarchy)
   * If provided, checks if user's org role is at least this level
   */
  minimumRole?: OrganizationRole
  /**
   * Content to show when user lacks permission
   */
  fallback?: ReactNode
  /**
   * Content to show when data is loading
   */
  loading?: ReactNode
  /**
   * Children to render when permission is granted
   */
  children: ReactNode
}

/**
 * Helper to extract members array from the paginated response
 */
function getMembersArray(
  data: { members: OrganizationMember[]; total: number } | { data: OrganizationMember[] } | OrganizationMember[] | undefined
): OrganizationMember[] {
  if (!data) return []
  // Handle paginated response with members key { members: [...], total: ... }
  if (typeof data === 'object' && 'members' in data && Array.isArray(data.members)) {
    return data.members
  }
  // Handle paginated response { data: [...], meta: {...} }
  if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
    return data.data
  }
  // Handle direct array (shouldn't happen but safe fallback)
  if (Array.isArray(data)) {
    return data
  }
  return []
}

/**
 * RequireOrganizationRole - Shows children only if user has one of the specified roles
 * within a specific organization.
 * 
 * Organization roles (per-org membership):
 * - owner: Full organization access including deletion
 * - admin: Organization management without delete
 * - member: Standard member access
 * 
 * @example
 * ```tsx
 * // Show settings only for owners and admins
 * <RequireOrganizationRole 
 *   organizationId={orgId} 
 *   roles={['owner', 'admin']}
 * >
 *   <OrganizationSettings />
 * </RequireOrganizationRole>
 * 
 * // Owner-only delete button
 * <RequireOrganizationRole 
 *   organizationId={orgId}
 *   roles={['owner']}
 *   fallback={<Tooltip>Only owners can delete</Tooltip>}
 * >
 *   <DeleteOrganizationButton />
 * </RequireOrganizationRole>
 * ```
 */
export function RequireOrganizationRole({
  organizationId,
  roles,
  minimumRole,
  fallback = null,
  loading = null,
  children,
}: RequireOrganizationRoleProps) {
  const { data: session } = useSession()
  const userId = session?.user ? session.user.id : undefined
  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers(
    organizationId,
    { enabled: !!userId }
  )

  // Show loading state while members are being fetched
  if (membersLoading) {
    return <>{loading}</>
  }

  // No session = no access
  if (!userId) {
    return <>{fallback}</>
  }

  // Extract members array from paginated response
  const members: readonly OrganizationMember[] = getMembersArray(membersData)

  // Find the current user's membership
  const membership: OrganizationMember | undefined = members.find((member: OrganizationMember) => member.userId === userId)

  // Not a member = no access
  if (!membership) {
    return <>{fallback}</>
  }

  const memberRole: OrganizationRole = membership.role

  // Check minimum role level if specified
  if (minimumRole) {
    if (isOrganizationRoleAtLeast(memberRole, minimumRole)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  // Check if user has any of the allowed roles
  if (roles.includes(memberRole)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Hook version for programmatic access to organization role
 */
export function useOrganizationRole(organizationId: string | undefined): {
  role: OrganizationRole | null
  isMember: boolean
  hasRole: (roles: OrganizationRole[]) => boolean
  isAtLeast: (minimumRole: OrganizationRole) => boolean
  isLoading: boolean
} {
  const { data: session } = useSession()
  const userId = session?.user ? session.user.id : undefined
  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers(
    organizationId ?? '',
    { enabled: !!userId && !!organizationId }
  )

  // Extract members array from paginated response
  const members = getMembersArray(membersData as { data: OrganizationMember[] } | undefined)

  // Find current user's membership
  const membership = members.find((member) => member.userId === userId)

  const role = membership?.role ?? null

  return {
    role,
    isMember: role !== null,
    hasRole: (roles: OrganizationRole[]) => role !== null && roles.includes(role),
    isAtLeast: (minimumRole: OrganizationRole) =>
      role !== null && isOrganizationRoleAtLeast(role, minimumRole),
    isLoading: membersLoading,
  }
}

// Shorthand alias for consistency with spec
export { RequireOrganizationRole as RequireRole }
export { useOrganizationRole as useOrgRole }
