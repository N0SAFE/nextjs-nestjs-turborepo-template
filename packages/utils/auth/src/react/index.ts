/**
 * React utilities for Better Auth.
 * 
 * This module provides React-specific utilities organized by concern:
 * - session: Session management (useSession, getSession, prefetch)
 * - permissions: Permission checking hooks and components
 * 
 * For isomorphic imports, use the specific submodules:
 * - '@repo/auth/react/session' - Shared types and constants
 * - '@repo/auth/react/session/client' - Client-side hooks
 * - '@repo/auth/react/session/server' - Server-side utilities
 */

// Re-export session types and constants (isomorphic)
export {
    DEFAULT_SESSION_QUERY_KEY,
    type SessionResult,
    type CreateUseSessionOptions,
    type CreateGetSessionOptions,
    type PrefetchSessionOptions,
} from './session'

// Re-export permission hooks factory and types
export {
    createPermissionHooks,
    type UsePermissionsResult,
    type UseOrganizationPermissionsResult,
    type CreatePermissionHooksOptions,
    type UseSessionResult,
    type SessionData,
    type OrganizationMember,
    type UseOrganizationMembersResult,
} from './usePermissions'

// Re-export permission components factory
export {
    createRequirePermissionComponents,
    type RequirePlatformPermissionProps,
    type RequireOrganizationPermissionProps,
    type RequirePermissionProps,
    type PermissionTarget,
} from './RequirePermission'

// Re-export permission types
export type {
    PlatformPermission,
    OrganizationPermission,
} from './usePermissions'
