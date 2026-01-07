'use client'

import { useMemo } from 'react'
import { useSession } from '@/lib/auth'
import { useOrganizationMembers } from './useOrganization'
import type { OrganizationMember } from './useOrganization'
import {
  type PlatformRole,
  type OrganizationRole,
  type PlatformResource,
  type OrganizationResource,
  hasPlatformPermission,
  hasOrganizationPermission,
  isPlatformRoleAtLeast,
  isOrganizationRoleAtLeast,
  platformRoleConfig,
  organizationRoleConfig,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
} from '@repo/auth/permissions'

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformPermission {
  resource: PlatformResource
  action: string
}

export interface OrganizationPermission {
  resource: OrganizationResource
  action: string
}

export interface UsePermissionsResult {
  // User state
  isAuthenticated: boolean
  isLoading: boolean
  user: {
    id?: string
    email?: string
    name?: string
    role?: PlatformRole | null
  } | null

  // Platform role checks
  hasPlatformRole: (role: PlatformRole) => boolean
  hasAnyPlatformRole: (roles: PlatformRole[]) => boolean
  isPlatformAdmin: () => boolean
  isPlatformSuperAdmin: () => boolean
  platformRoleLevel: number

  // Platform permission checks
  canPlatform: (resource: PlatformResource, action: string) => boolean
  canAnyPlatform: (permissions: PlatformPermission[]) => boolean
  canAllPlatform: (permissions: PlatformPermission[]) => boolean
}

export interface UseOrganizationPermissionsResult {
  // Organization state
  isLoading: boolean
  isMember: boolean
  role: OrganizationRole | null

  // Organization role checks
  hasOrganizationRole: (role: OrganizationRole) => boolean
  hasAnyOrganizationRole: (roles: OrganizationRole[]) => boolean
  isOrganizationOwner: () => boolean
  isOrganizationAdmin: () => boolean
  organizationRoleLevel: number

  // Organization permission checks
  canOrganization: (resource: OrganizationResource, action: string) => boolean
  canAnyOrganization: (permissions: OrganizationPermission[]) => boolean
  canAllOrganization: (permissions: OrganizationPermission[]) => boolean
}

// ============================================================================
// PLATFORM PERMISSIONS HOOK
// ============================================================================

/**
 * Hook for checking platform-level permissions and roles
 * 
 * @example
 * ```tsx
 * const { isPlatformAdmin, canPlatform } = usePermissions()
 * 
 * if (isPlatformAdmin()) {
 *   // Show admin UI
 * }
 * 
 * if (canPlatform('user', 'list')) {
 *   // Show user list
 * }
 * ```
 */
export function usePermissions(): UsePermissionsResult {
  const { data: session } = useSession()
  const isLoading = !session

  const user = useMemo(() => {
    if (!session?.user) return null
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as PlatformRole,
    }
  }, [session])

  const platformRoleLevel = useMemo(() => {
    if (!user?.role) return 0
    return platformRoleConfig[user.role].level
  }, [user])

  // Platform role checks
  const hasPlatformRole = useMemo(() => {
    return (role: PlatformRole): boolean => {
      if (!user?.role) return false
      return user.role === role
    }
  }, [user])

  const hasAnyPlatformRole = useMemo(() => {
    return (roles: PlatformRole[]): boolean => {
      if (!user?.role) return false
      return roles.includes(user.role)
    }
  }, [user])

  const isPlatformAdmin = useMemo(() => {
    return (): boolean => {
      if (!user?.role) return false
      return isPlatformRoleAtLeast(user.role, 'admin')
    }
  }, [user])

  const isPlatformSuperAdmin = useMemo(() => {
    return (): boolean => {
      if (!user?.role) return false
      return user.role === 'superAdmin'
    }
  }, [user])

  // Platform permission checks
  const canPlatform = useMemo(() => {
    return (resource: PlatformResource, action: string): boolean => {
      if (!user?.role) return false
      return hasPlatformPermission(user.role, resource, action)
    }
  }, [user])

  const canAnyPlatform = useMemo(() => {
    return (permissions: PlatformPermission[]): boolean => {
      const role = user?.role
      if (!role) return false
      return permissions.some(({ resource, action }) => 
        hasPlatformPermission(role, resource, action)
      )
    }
  }, [user])

  const canAllPlatform = useMemo(() => {
    return (permissions: PlatformPermission[]): boolean => {
      const role = user?.role
      if (!role) return false
      return permissions.every(({ resource, action }) => 
        hasPlatformPermission(role, resource, action)
      )
    }
  }, [user])

  return {
    isAuthenticated: !!session?.user,
    isLoading,
    user,
    hasPlatformRole,
    hasAnyPlatformRole,
    isPlatformAdmin,
    isPlatformSuperAdmin,
    platformRoleLevel,
    canPlatform,
    canAnyPlatform,
    canAllPlatform,
  }
}

// ============================================================================
// ORGANIZATION PERMISSIONS HOOK
// ============================================================================

/**
 * Hook for checking organization-level permissions and roles
 * 
 * @param organizationId - The organization ID to check permissions for
 * 
 * @example
 * ```tsx
 * const { isOrganizationOwner, canOrganization } = useOrganizationPermissions(orgId)
 * 
 * if (isOrganizationOwner()) {
 *   // Show delete button
 * }
 * 
 * if (canOrganization('orgMember', 'invite')) {
 *   // Show invite button
 * }
 * ```
 */
export function useOrganizationPermissions(
  organizationId: string | undefined
): UseOrganizationPermissionsResult {
  const { data: session } = useSession()
  const { data: membersData, isLoading } = useOrganizationMembers(organizationId ?? '')

  // Find current user's membership
  const membership = useMemo(() => {
    if (!session?.user || !membersData) return null
    const userId = session.user.id
    const members = getMembersArray(membersData)
    return members.find((m: OrganizationMember) => m.userId === userId) ?? null
  }, [session, membersData])

  const role = useMemo<OrganizationRole | null>(() => {
    return membership?.role ?? null
  }, [membership])

  const organizationRoleLevel = useMemo(() => {
    if (!role) return 0
    return organizationRoleConfig[role].level
  }, [role])

  // Organization role checks
  const hasOrganizationRole = useMemo(() => {
    return (checkRole: OrganizationRole): boolean => {
      if (!role) return false
      return role === checkRole
    }
  }, [role])

  const hasAnyOrganizationRole = useMemo(() => {
    return (roles: OrganizationRole[]): boolean => {
      if (!role) return false
      return roles.includes(role)
    }
  }, [role])

  const isOrganizationOwner = useMemo(() => {
    return (): boolean => {
      if (!role) return false
      return role === 'owner'
    }
  }, [role])

  const isOrganizationAdmin = useMemo(() => {
    return (): boolean => {
      if (!role) return false
      return isOrganizationRoleAtLeast(role, 'admin')
    }
  }, [role])

  // Organization permission checks
  const canOrganization = useMemo(() => {
    return (resource: OrganizationResource, action: string): boolean => {
      if (!role) return false
      return hasOrganizationPermission(role, resource, action)
    }
  }, [role])

  const canAnyOrganization = useMemo(() => {
    return (permissions: OrganizationPermission[]): boolean => {
      const r = role
      if (!r) return false
      return permissions.some(({ resource, action }) => 
        hasOrganizationPermission(r, resource, action)
      )
    }
  }, [role])

  const canAllOrganization = useMemo(() => {
    return (permissions: OrganizationPermission[]): boolean => {
      const r = role
      if (!r) return false
      return permissions.every(({ resource, action }) => 
        hasOrganizationPermission(r, resource, action)
      )
    }
  }, [role])

  return {
    isLoading,
    isMember: !!membership,
    role,
    hasOrganizationRole,
    hasAnyOrganizationRole,
    isOrganizationOwner,
    isOrganizationAdmin,
    organizationRoleLevel,
    canOrganization,
    canAnyOrganization,
    canAllOrganization,
  }
}

// ============================================================================
// COMBINED PERMISSIONS HOOK
// ============================================================================

/**
 * Hook that combines platform and organization permissions
 * 
 * @param organizationId - Optional organization ID for org-level checks
 * 
 * @example
 * ```tsx
 * const perms = useCombinedPermissions(orgId)
 * 
 * // Platform checks
 * if (perms.platform.isPlatformAdmin()) { ... }
 * 
 * // Organization checks (only if orgId provided)
 * if (perms.organization?.isOrganizationOwner()) { ... }
 * ```
 */
export function useCombinedPermissions(organizationId?: string) {
  const platform = usePermissions()
  const organization = useOrganizationPermissions(organizationId)

  return {
    platform,
    organization: organizationId ? organization : null,
    isLoading: platform.isLoading || (organizationId ? organization.isLoading : false),
  }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function getMembersArray(
  data: { data: OrganizationMember[] } | { members: OrganizationMember[] } | OrganizationMember[] | undefined
): OrganizationMember[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if ('data' in data && Array.isArray(data.data)) return data.data
  if ('members' in data && Array.isArray(data.members)) return data.members
  return []
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  type PlatformRole,
  type OrganizationRole,
  type PlatformResource,
  type OrganizationResource,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
  platformRoleConfig,
  organizationRoleConfig,
}
