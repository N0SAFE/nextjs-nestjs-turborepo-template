'use client'

import type { ReactNode } from 'react'
import { useSession } from '@/lib/auth'
import { useOrganizationMembers, type OrganizationMember } from '@/hooks/useOrganization'
import {
  hasPlatformPermission,
  hasOrganizationPermission,
  type PlatformRole,
  type PlatformResource,
  type OrganizationResource,
} from '@repo/auth/permissions'

/**
 * Helper to extract members array from the paginated response
 */
function getMembersArray(
  data: { data: OrganizationMember[] } | OrganizationMember[] | undefined
): OrganizationMember[] {
  if (!data) return []
  if ('data' in data && Array.isArray(data.data)) {
    return data.data
  }
  if (Array.isArray(data)) {
    return data
  }
  return []
}

/**
 * Platform permission definition
 * Defines a permission at the platform level (user's global role)
 */
export interface PlatformPermissionDef {
  type: 'platform'
  resource: PlatformResource
  action: string
}

/**
 * Organization permission definition
 * Defines a permission at the organization level (user's org membership role)
 */
export interface OrganizationPermissionDef {
  type: 'organization'
  organizationId: string
  resource: OrganizationResource
  action: string
}

export type PermissionDef = PlatformPermissionDef | OrganizationPermissionDef

export interface RequirePermissionProps {
  /**
   * Permission(s) to check. Can be a single permission or array.
   * For arrays, user needs ALL permissions (AND logic).
   */
  permission: PermissionDef | PermissionDef[]
  /**
   * How to combine multiple permissions
   * - 'all': User needs ALL permissions (default)
   * - 'any': User needs at least ONE permission
   */
  mode?: 'all' | 'any'
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
 * RequirePermission - Shows children only if user has the specified permission(s).
 */
export function RequirePermission({
  permission,
  mode = 'all',
  fallback = null,
  loading = null,
  children,
}: RequirePermissionProps) {
  const { data: session } = useSession()
  const userId = session?.user ? session.user.id : undefined
  
  // Extract unique organization IDs from permissions for fetching
  const permissions = Array.isArray(permission) ? permission : [permission]
  const orgIds = Array.from(new Set(
    permissions
      .filter((p): p is OrganizationPermissionDef => p.type === 'organization')
      .map((p) => p.organizationId)
  ))

  const primaryOrgId = orgIds[0]
  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers(
    primaryOrgId ?? '',
    { enabled: Boolean(userId && primaryOrgId) }
  )

  // Loading state for org permissions
  if (primaryOrgId && membersLoading) {
    return <>{loading}</>
  }

  // No session = no access
  if (!session?.user) {
    return <>{fallback}</>
  }

  const userPlatformRole = session.user.role as PlatformRole | undefined
  
  // Find user's org membership if needed
  const members = getMembersArray(membersData as { data: OrganizationMember[] } | undefined)
  const userOrgMembership = members.find((member) => member.userId === userId)
  const userOrgRole = userOrgMembership?.role

  // Check each permission
  const checkPermission = (perm: PermissionDef): boolean => {
    if (perm.type === 'platform') {
      if (!userPlatformRole) return false
      return hasPlatformPermission(userPlatformRole, perm.resource, perm.action)
    } else {
      if (!userOrgRole) return false
      return hasOrganizationPermission(userOrgRole, perm.resource, perm.action)
    }
  }

  // Apply mode logic
  const hasPermission = mode === 'all'
    ? permissions.every(checkPermission)
    : permissions.some(checkPermission)

  if (hasPermission) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Hook for programmatic permission checking
 */
export function usePermission(permission: PermissionDef | PermissionDef[]): {
  hasPermission: boolean
  isLoading: boolean
} {
  const { data: session } = useSession()
  const userId = session?.user ? session.user.id : undefined
  
  const permissions = Array.isArray(permission) ? permission : [permission]
  const orgIds = Array.from(new Set(
    permissions
      .filter((p): p is OrganizationPermissionDef => p.type === 'organization')
      .map((p) => p.organizationId)
  ))

  const primaryOrgId = orgIds[0]
  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers(
    primaryOrgId ?? '',
    { enabled: Boolean(userId && primaryOrgId) }
  )

  const isLoading = Boolean(primaryOrgId) && membersLoading

  if (isLoading || !session?.user) {
    return { hasPermission: false, isLoading }
  }

  const userPlatformRole = session.user.role as PlatformRole | undefined
  const members = getMembersArray(membersData as { data: OrganizationMember[] } | undefined)
  const userOrgMembership = members.find((member) => member.userId === userId)
  const userOrgRole = userOrgMembership?.role

  const checkPermission = (perm: PermissionDef): boolean => {
    if (perm.type === 'platform') {
      if (!userPlatformRole) return false
      return hasPlatformPermission(userPlatformRole, perm.resource, perm.action)
    } else {
      if (!userOrgRole) return false
      return hasOrganizationPermission(userOrgRole, perm.resource, perm.action)
    }
  }

  const hasPermission = permissions.every(checkPermission)

  return { hasPermission, isLoading }
}

/**
 * Simplified hook for platform permissions only
 */
export function usePlatformPermission(
  resource: PlatformResource,
  action: string
): { hasPermission: boolean } {
  const { data: session } = useSession()

  if (!session?.user) {
    return { hasPermission: false }
  }

  const userRole = session.user.role as PlatformRole | undefined
  if (!userRole) {
    return { hasPermission: false }
  }

  return {
    hasPermission: hasPlatformPermission(userRole, resource, action),
  }
}

/**
 * Simplified hook for organization permissions only
 */
export function useOrganizationPermission(
  organizationId: string | undefined,
  resource: OrganizationResource,
  action: string
): { hasPermission: boolean; isLoading: boolean } {
  const { data: session } = useSession()
  const userId = session?.user ? session.user.id : undefined
  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers(
    organizationId ?? '',
    { enabled: Boolean(userId && organizationId) }
  )

  if (membersLoading || !session?.user || !organizationId) {
    return { hasPermission: false, isLoading: membersLoading }
  }

  const members = getMembersArray(membersData as { data: OrganizationMember[] } | undefined)
  const membership = members.find((member) => member.userId === userId)
  const userRole = membership?.role

  if (!userRole) {
    return { hasPermission: false, isLoading: false }
  }

  return {
    hasPermission: hasOrganizationPermission(userRole, resource, action),
    isLoading: false,
  }
}
