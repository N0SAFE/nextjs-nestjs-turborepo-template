'use client'

/**
 * @fileoverview Permission Hooks - Role-Based Access Control (RBAC)
 * 
 * This file provides React hooks for checking user permissions across different contexts:
 * - Platform-level permissions (admin operations)
 * - Organization-level permissions (per-tenant access control)
 * - Component-level permission checks (UI visibility)
 * 
 * Key Features:
 * - Platform permission checking (usePermissions)
 * - Organization permission checking (useOrganizationPermissions)
 * - Combined permission checking (useCombinedPermissions)
 * - Session-aware permission resolution
 * - Type-safe permission string definitions
 * 
 * Permission Model:
 * - Platform permissions: Apply globally across the application
 * - Organization permissions: Apply within a specific organization context
 * - Permissions defined as resource:action format (e.g., 'user:delete', 'org:update')
 * 
 * Unlike ORPC hooks which use generated contracts, these hooks work directly with
 * session data and Better Auth's permission model for real-time access control checks.
 * 
 * NOTE: This module requires external dependencies to be provided:
 * - useSession hook from Better Auth client
 * - useOrganizationMembers hook for org membership data
 * These should be imported and passed when creating wrapper components.
 */

import { useMemo } from 'react'
import type {
  PlatformRole,
  OrganizationRole,
  PlatformResource,
  OrganizationResource,
} from '../permissions'
import {
  hasPlatformPermission,
  hasOrganizationPermission,
  isPlatformRoleAtLeast,
  isOrganizationRoleAtLeast,
  platformRoleConfig,
  organizationRoleConfig,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
} from '../permissions'

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

/**
 * Session data interface - compatible with Better Auth session
 */
export interface SessionData {
  user?: {
    id: string
    email?: string
    name?: string
    role?: PlatformRole | null
  }
}

/**
 * Organization member data interface
 */
export interface OrganizationMember {
  userId: string
  role: OrganizationRole
  [key: string]: unknown
}

/**
 * Use session hook result
 */
export interface UseSessionResult {
  data: SessionData | null | undefined
  isLoading?: boolean
}

/**
 * Use organization members hook result
 */
export interface UseOrganizationMembersResult {
  data?: { data: OrganizationMember[] } | { members: OrganizationMember[] } | OrganizationMember[]
  isLoading: boolean
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
// PERMISSION HOOKS FACTORY
// ============================================================================

export interface CreatePermissionHooksOptions {
  useSession: () => UseSessionResult
  useOrganizationMembers: (organizationId: string) => UseOrganizationMembersResult
}

/**
 * Creates permission hooks with provided dependencies
 */
export function createPermissionHooks({
  useSession,
  useOrganizationMembers,
}: CreatePermissionHooksOptions) {
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
  function usePermissions(): UsePermissionsResult {
    const session = useSession()
    const isLoading = session.isLoading ?? false

    const user = useMemo(() => {
      if (!session.data?.user) return null
      return {
        id: session.data.user.id,
        email: session.data.user.email,
        name: session.data.user.name,
        role: session.data.user.role as PlatformRole,
      }
    }, [session.data])

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
      isAuthenticated: !!session.data?.user,
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
  function useOrganizationPermissions(
    organizationId: string | undefined
  ): UseOrganizationPermissionsResult {
    const session = useSession()
    const members = useOrganizationMembers(organizationId ?? '')

    // Find current user's membership
    const membership = useMemo(() => {
      if (!session.data?.user || !members.data) return null
      const userId = session.data.user.id
      const membersArray = getMembersArray(members.data)
      return membersArray.find((m: OrganizationMember) => m.userId === userId) ?? null
    }, [session.data, members.data])

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
      isLoading: members.isLoading,
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
  function useCombinedPermissions(organizationId?: string) {
    const platform = usePermissions()
    const organization = useOrganizationPermissions(organizationId)

    return {
      platform,
      organization: organizationId ? organization : null,
      isLoading: platform.isLoading || (organizationId ? organization.isLoading : false),
    }
  }

  return {
    usePermissions,
    useOrganizationPermissions,
    useCombinedPermissions,
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
} from '../permissions'
