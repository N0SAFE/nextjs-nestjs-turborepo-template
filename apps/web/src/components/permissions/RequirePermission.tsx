'use client'

import { type ReactNode } from 'react'
import {
  usePermissions,
  useOrganizationPermissions,
  type PlatformPermission,
  type OrganizationPermission,
} from '@/hooks/usePermissions'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'

// ============================================================================
// PLATFORM PERMISSION COMPONENT
// ============================================================================

export interface RequirePlatformPermissionProps {
  /**
   * Platform permission to check
   */
  permission: PlatformPermission | PlatformPermission[]
  /**
   * Whether to require ALL permissions (true) or ANY permission (false)
   * @default false
   */
  requireAll?: boolean
  /**
   * Content to show if user has the required permission
   */
  children: ReactNode
  /**
   * Content to show if user doesn't have the required permission
   */
  fallback?: ReactNode
  /**
   * Content to show while loading
   */
  loading?: ReactNode
}

/**
 * Conditionally renders children based on the user's platform permissions.
 * 
 * @example
 * ```tsx
 * // Single permission
 * <RequirePlatformPermission permission={{ resource: 'user', action: 'list' }}>
 *   <UserListPage />
 * </RequirePlatformPermission>
 * 
 * // Multiple permissions (ANY)
 * <RequirePlatformPermission 
 *   permission={[
 *     { resource: 'user', action: 'list' },
 *     { resource: 'user', action: 'read' },
 *   ]}
 * >
 *   <UserSection />
 * </RequirePlatformPermission>
 * 
 * // Multiple permissions (ALL required)
 * <RequirePlatformPermission 
 *   permission={[
 *     { resource: 'system', action: 'view' },
 *     { resource: 'system', action: 'configure' },
 *   ]}
 *   requireAll
 * >
 *   <SystemConfigPage />
 * </RequirePlatformPermission>
 * ```
 */
export function RequirePlatformPermission({
  permission,
  requireAll = false,
  children,
  fallback = null,
  loading,
}: RequirePlatformPermissionProps) {
  const { canAnyPlatform, canAllPlatform, isLoading, isAuthenticated } = usePermissions()

  if (isLoading) {
    return loading ?? <Skeleton className="h-8 w-full" />
  }

  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Normalize to array
  const permissions = Array.isArray(permission) ? permission : [permission]

  // Check permissions
  const hasPermission = requireAll
    ? canAllPlatform(permissions)
    : canAnyPlatform(permissions)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================================================
// ORGANIZATION PERMISSION COMPONENT
// ============================================================================

export interface RequireOrganizationPermissionProps {
  /**
   * Organization permission to check
   */
  permission: OrganizationPermission | OrganizationPermission[]
  /**
   * The organization ID to check permission for
   */
  organizationId: string
  /**
   * Whether to require ALL permissions (true) or ANY permission (false)
   * @default false
   */
  requireAll?: boolean
  /**
   * Content to show if user has the required permission
   */
  children: ReactNode
  /**
   * Content to show if user doesn't have the required permission
   */
  fallback?: ReactNode
  /**
   * Content to show while loading
   */
  loading?: ReactNode
}

/**
 * Conditionally renders children based on the user's organization permissions.
 * 
 * @example
 * ```tsx
 * // Single permission
 * <RequireOrganizationPermission 
 *   permission={{ resource: 'orgMember', action: 'invite' }}
 *   organizationId={org.id}
 * >
 *   <InviteMemberButton />
 * </RequireOrganizationPermission>
 * 
 * // Multiple permissions with fallback
 * <RequireOrganizationPermission 
 *   permission={[
 *     { resource: 'orgSettings', action: 'delete' },
 *     { resource: 'orgSettings', action: 'transferOwnership' },
 *   ]}
 *   organizationId={org.id}
 *   fallback={<Tooltip>Owner only action</Tooltip>}
 * >
 *   <DeleteOrganizationButton />
 * </RequireOrganizationPermission>
 * ```
 */
export function RequireOrganizationPermission({
  permission,
  organizationId,
  requireAll = false,
  children,
  fallback = null,
  loading,
}: RequireOrganizationPermissionProps) {
  const { canAnyOrganization, canAllOrganization, isLoading, isMember } = useOrganizationPermissions(organizationId)

  if (isLoading) {
    return loading ?? <Skeleton className="h-8 w-full" />
  }

  if (!isMember) {
    return <>{fallback}</>
  }

  // Normalize to array
  const permissions = Array.isArray(permission) ? permission : [permission]

  // Check permissions
  const hasPermission = requireAll
    ? canAllOrganization(permissions)
    : canAnyOrganization(permissions)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================================================
// GENERIC PERMISSION COMPONENT
// ============================================================================

export type PermissionTarget =
  | { type: 'platform'; permission: PlatformPermission | PlatformPermission[] }
  | { type: 'organization'; permission: OrganizationPermission | OrganizationPermission[]; organizationId: string }

export interface RequirePermissionProps {
  /**
   * Permission target specifying platform or organization permission
   */
  target: PermissionTarget
  /**
   * Whether to require ALL permissions (true) or ANY permission (false)
   * @default false
   */
  requireAll?: boolean
  /**
   * Content to show if user has the required permission
   */
  children: ReactNode
  /**
   * Content to show if user doesn't have the required permission
   */
  fallback?: ReactNode
  /**
   * Content to show while loading
   */
  loading?: ReactNode
}

/**
 * Generic permission component that can check either platform or organization permissions.
 * 
 * @example
 * ```tsx
 * // Platform permission
 * <RequirePermission
 *   target={{
 *     type: 'platform',
 *     permission: { resource: 'user', action: 'ban' },
 *   }}
 * >
 *   <BanUserButton />
 * </RequirePermission>
 * 
 * // Organization permission
 * <RequirePermission
 *   target={{
 *     type: 'organization',
 *     permission: { resource: 'project', action: 'delete' },
 *     organizationId: org.id,
 *   }}
 * >
 *   <DeleteProjectButton />
 * </RequirePermission>
 * ```
 */
export function RequirePermission({
  target,
  requireAll = false,
  children,
  fallback = null,
  loading,
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

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook variant of RequirePlatformPermission
 */
export function useRequirePlatformPermission(
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
export function useRequireOrganizationPermission(
  permission: OrganizationPermission | OrganizationPermission[],
  organizationId: string,
  requireAll = false
) {
  const { canAnyOrganization, canAllOrganization, isLoading, isMember, role } = useOrganizationPermissions(organizationId)

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

export default RequirePermission
