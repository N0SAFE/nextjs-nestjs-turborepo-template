/**
 * @fileoverview Permission utilities for the web app
 * 
 * This file creates instances of the permission hooks and components
 * by connecting the generic factories from @repo/auth with our specific
 * auth client and organization data fetcher.
 */

import { useMemo } from 'react'
import type { PlatformRole } from '@repo/auth'
import type { UseSessionResult } from '@repo/auth/react'
import { createPermissionHooks, createRequirePermissionComponents } from '@repo/auth/react'
import { authClient } from '@/lib/auth'
import { useOrganizationMembers } from '@/hooks/useOrganization'

/**
 * Adapter hook that converts Better Auth's useSession to the format
 * expected by the permission system.
 * 
 * This adapter ensures that the role field is properly typed as PlatformRole
 * instead of string | null | undefined.
 */
function useSessionAdapter(): UseSessionResult {
  const session = authClient.useSession()
  
  return useMemo(() => ({
    data: session.data ? {
      user: {
        id: session.data.user.id,
        email: session.data.user.email,
        name: session.data.user.name,
        role: session.data.user.role as PlatformRole | null,
      }
    } : null,
    isLoading: session.isPending,
  }), [session])
}

/**
 * Permission hooks for the web app.
 * 
 * These hooks are created by connecting the generic permission factories
 * from @repo/auth with our specific auth client and organization fetcher.
 * 
 * @example Platform Permissions
 * ```tsx
 * function AdminPanel() {
 *   const { hasAnyPlatformRole, isLoading } = usePermissions()
 *   
 *   if (isLoading) return <Spinner />
 *   if (!hasAnyPlatformRole(['admin', 'superAdmin'])) {
 *     return <AccessDenied />
 *   }
 *   
 *   return <AdminContent />
 * }
 * ```
 * 
 * @example Organization Permissions
 * ```tsx
 * function ProjectSettings({ orgId }: { orgId: string }) {
 *   const { hasAnyOrganizationRole, role } = useOrganizationPermissions(orgId)
 *   
 *   if (!hasAnyOrganizationRole(['owner', 'admin'])) {
 *     return <AccessDenied />
 *   }
 *   
 *   return <SettingsForm canDelete={role === 'owner'} />
 * }
 * ```
 */
export const { usePermissions, useOrganizationPermissions } = createPermissionHooks({
  useSession: useSessionAdapter,
  useOrganizationMembers,
})

/**
 * Permission components for the web app.
 * 
 * These components are created by connecting the generic RequirePermission factories
 * from @repo/auth with our specific permission hooks.
 * 
 * @example Platform Permission Component
 * ```tsx
 * <RequirePlatformPermission permission="admin.access">
 *   <AdminPanel />
 * </RequirePlatformPermission>
 * ```
 * 
 * @example Organization Permission Component
 * ```tsx
 * <RequireOrganizationPermission 
 *   organizationId={org.id} 
 *   permission="organization.delete"
 *   fallback={<AccessDenied />}
 * >
 *   <DeleteOrganizationButton />
 * </RequireOrganizationPermission>
 * ```
 * 
 * @example Generic Permission Component
 * ```tsx
 * <RequirePermission 
 *   target={{ type: 'platform', permission: 'admin.access' }}
 *   fallback={<AccessDenied />}
 * >
 *   <AdminContent />
 * </RequirePermission>
 * ```
 */
export const {
  RequirePlatformPermission,
  RequireOrganizationPermission,
  RequirePermission,
} = createRequirePermissionComponents({
  useSession: useSessionAdapter,
  useOrganizationMembers,
})

// Re-export types for convenience
export type {
  PlatformPermission,
  OrganizationPermission,
} from '@repo/auth/react'

export type {
  PlatformRole,
  OrganizationRole,
} from '@repo/auth'
