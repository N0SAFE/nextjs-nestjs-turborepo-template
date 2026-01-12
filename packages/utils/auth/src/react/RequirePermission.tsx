'use client'

import { type ReactNode } from 'react'
import {
  createPermissionHooks,
  type PlatformPermission,
  type OrganizationPermission,
  type CreatePermissionHooksOptions,
} from './usePermissions'

// ============================================================================
// TYPES
// ============================================================================

export interface RequirePlatformPermissionProps {
  permission: PlatformPermission | PlatformPermission[]
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}

export interface RequireOrganizationPermissionProps {
  permission: OrganizationPermission | OrganizationPermission[]
  organizationId: string
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}

export type PermissionTarget =
  | { type: 'platform'; permission: PlatformPermission | PlatformPermission[] }
  | { type: 'organization'; permission: OrganizationPermission | OrganizationPermission[]; organizationId: string }

export interface RequirePermissionProps {
  target: PermissionTarget
  requireAll?: boolean
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
}

// ============================================================================
// FACTORY FOR CREATING PERMISSION COMPONENTS
// ============================================================================

/**
 * Creates RequirePermission components with provided dependencies.
 * This allows the package to be framework-agnostic while still providing
 * permission-based rendering components.
 * 
 * @example
 * ```tsx
 * // In your app, create the components with your auth hooks:
 * import { createRequirePermissionComponents } from '@repo/auth/react'
 * import { useSession } from '@/lib/auth'
 * import { useOrganizationMembers } from '@/hooks/useOrganization'
 * 
 * export const {
 *   RequirePlatformPermission,
 *   RequireOrganizationPermission,
 *   RequirePermission,
 *   useRequirePlatformPermission,
 *   useRequireOrganizationPermission,
 * } = createRequirePermissionComponents({
 *   useSession,
 *   useOrganizationMembers,
 * })
 * ```
 */
export function createRequirePermissionComponents(options: CreatePermissionHooksOptions) {
  const { usePermissions, useOrganizationPermissions } = createPermissionHooks(options)

  /**
   * Platform permission component
   */
  function RequirePlatformPermission({
    permission,
    requireAll = false,
    children,
    fallback = null,
    loading = null,
  }: RequirePlatformPermissionProps) {
    const { canAnyPlatform, canAllPlatform, isLoading, isAuthenticated } = usePermissions()

    if (isLoading && loading !== null) {
      return <>{loading}</>
    }

    if (!isAuthenticated) {
      return <>{fallback}</>
    }

    const permissions = Array.isArray(permission) ? permission : [permission]
    const hasPermission = requireAll
      ? canAllPlatform(permissions)
      : canAnyPlatform(permissions)

    if (!hasPermission) {
      return <>{fallback}</>
    }

    return <>{children}</>
  }

  /**
   * Organization permission component
   */
  function RequireOrganizationPermission({
    permission,
    organizationId,
    requireAll = false,
    children,
    fallback = null,
    loading = null,
  }: RequireOrganizationPermissionProps) {
    const { canAnyOrganization, canAllOrganization, isLoading, isMember } = 
      useOrganizationPermissions(organizationId)

    if (isLoading && loading !== null) {
      return <>{loading}</>
    }

    if (!isMember) {
      return <>{fallback}</>
    }

    const permissions = Array.isArray(permission) ? permission : [permission]
    const hasPermission = requireAll
      ? canAllOrganization(permissions)
      : canAnyOrganization(permissions)

    if (!hasPermission) {
      return <>{fallback}</>
    }

    return <>{children}</>
  }

  /**
   * Generic permission component
   */
  function RequirePermission({
    target,
    requireAll = false,
    children,
    fallback = null,
    loading = null,
  }: RequirePermissionProps) {
    if (target.type === 'platform') {
      return (
        <RequirePlatformPermission
          permission={target.permission}
          requireAll={requireAll}
          fallback={fallback}
          loading={loading}
        >
          {children}
        </RequirePlatformPermission>
      )
    }

    return (
      <RequireOrganizationPermission
        permission={target.permission}
        organizationId={target.organizationId}
        requireAll={requireAll}
        fallback={fallback}
        loading={loading}
      >
        {children}
      </RequireOrganizationPermission>
    )
  }

  /**
   * Hook variant of RequirePlatformPermission
   */
  function useRequirePlatformPermission(
    permission: PlatformPermission | PlatformPermission[],
    requireAll = false
  ) {
    const { canAnyPlatform, canAllPlatform, isLoading, isAuthenticated } = usePermissions()

    const permissions = Array.isArray(permission) ? permission : [permission]
    const allowed = isAuthenticated && (requireAll
      ? canAllPlatform(permissions)
      : canAnyPlatform(permissions))

    return {
      allowed,
      isLoading,
      isAuthenticated,
    }
  }

  /**
   * Hook variant of RequireOrganizationPermission
   */
  function useRequireOrganizationPermission(
    permission: OrganizationPermission | OrganizationPermission[],
    organizationId: string,
    requireAll = false
  ) {
    const { canAnyOrganization, canAllOrganization, isLoading, isMember, role } = 
      useOrganizationPermissions(organizationId)

    const permissions = Array.isArray(permission) ? permission : [permission]
    const allowed = isMember && (requireAll
      ? canAllOrganization(permissions)
      : canAnyOrganization(permissions))

    return {
      allowed,
      isLoading,
      isMember,
      role,
    }
  }

  return {
    RequirePlatformPermission,
    RequireOrganizationPermission,
    RequirePermission,
    useRequirePlatformPermission,
    useRequireOrganizationPermission,
  }
}

// Re-export types
export {
  type PlatformPermission,
  type OrganizationPermission,
  type CreatePermissionHooksOptions,
} from './usePermissions'
