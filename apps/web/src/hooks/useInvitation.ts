'use client'

/**
 * @fileoverview Invitation Hooks - Platform & Organization Invitation Management
 * 
 * This file provides React hooks for managing both platform and organization invitations
 * following the standard hooks pattern with defineCustomHooks and defineInvalidations.
 * 
 * Platform Invitations (Custom Better Auth invite plugin):
 * - Create platform invitations to invite NEW users to the application
 * - List platform invitations with status filtering (pending/used/expired)
 * - Check invitation token validity
 * - Validate invitation and create user account
 * 
 * Organization Invitations (Built-in Better Auth org plugin):
 * - Accept invitation (join organization)
 * - Reject invitation (decline to join)
 * - Cancel invitation (revoke sent invitation)
 * 
 * Pattern:
 * 1. Define query keys FIRST (invitationKeys)
 * 2. Create custom hooks using defineCustomHooks
 * 3. Configure invalidations using defineInvalidations
 * 4. Export final hooks with invalidations applied
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authClient, SESSION_QUERY_KEY } from '@/lib/auth'
import { defineCustomHooks, defineInvalidations } from '@repo/orpc-utils/hooks'

// Use Better Auth $Infer types
type Invitation = typeof authClient.$Infer.Invitation
type PlatformInvite = Awaited<ReturnType<typeof authClient.invite.list>>['invitations'][number]

// ============================================================================
// QUERY KEYS - Define FIRST, use everywhere
// ============================================================================

/**
 * Invitation domain query keys - FLAT structure for type compatibility
 * 
 * Pattern: Follow Better Auth's flat key structure (no nested objects)
 * This ensures compatibility with QueryKeys type from orpc-utils
 * 
 * @example In queries
 * ```ts
 * useQuery({
 *   queryKey: invitationKeys.platformList('pending'),
 *   queryFn: ...
 * })
 * ```
 * 
 * @example In invalidations
 * ```ts
 * defineInvalidations({ custom: invitationCustomHooks }, {
 *   useCreatePlatformInvitation: ({ keys }) => [keys.platformAll()]
 * })
 * ```
 */
export const invitationKeys = {
  /** Session key for auth-related invalidations */
  session: () => SESSION_QUERY_KEY,
  
  /** All invitation queries - for broad invalidation */
  all: () => ['invitations'] as const,
  
  /** Platform invitation keys (custom plugin) - FLAT structure */
  platformAll: () => ['invitations', 'platform'] as const,
  platformLists: () => ['invitations', 'platform', 'list'] as const,
  platformList: (status?: 'pending' | 'used' | 'expired') => 
    ['invitations', 'platform', 'list', { status }] as const,
  
  /** Organization invitation keys (built-in plugin) - FLAT structure */
  organizationAll: () => ['invitations', 'organization'] as const,
  organizationLists: () => ['invitations', 'organization', 'list'] as const,
  organizationPending: () => ['invitations', 'organization', 'list', 'pending'] as const,
  
  /** Mutation keys (for tracking/deduplication) */
  createPlatformInvitation: () => ['invitations', 'platform', 'create'] as const,
  checkPlatformInvitation: () => ['invitations', 'platform', 'check'] as const,
  validatePlatformInvitation: () => ['invitations', 'platform', 'validate'] as const,
  acceptInvitation: () => ['invitations', 'organization', 'accept'] as const,
  rejectInvitation: () => ['invitations', 'organization', 'reject'] as const,
  cancelInvitation: () => ['invitations', 'organization', 'cancel'] as const,
}

// ============================================================================
// CUSTOM INVITATION HOOKS - Using keys directly
// ============================================================================

/**
 * Custom hooks for invitation operations
 * 
 * Pattern:
 * 1. Keys defined above (invitationKeys)
 * 2. Hooks use keys directly for queryKey/mutationKey
 * 3. Keys attached to hooks via defineCustomHooks
 * 4. Invalidations configured separately via defineInvalidations
 * 
 * Usage:
 * ```ts
 * // Access hooks
 * const { data } = invitationHooks.usePlatformInvitations({ status: 'pending' })
 * 
 * // Access keys (from the same object)
 * queryClient.invalidateQueries({ queryKey: invitationHooks.keys.platform.all() })
 * ```
 */
export const invitationCustomHooks = defineCustomHooks({
  // ========================================================================
  // PLATFORM INVITATIONS (Custom Plugin)
  // ========================================================================
  
  /**
   * Query hook to list platform invitations with optional status filter
   * 
   * @example
   * ```ts
   * const { data: invitations } = invitationHooks.usePlatformInvitations({ 
   *   status: 'pending' 
   * })
   * ```
   */
  usePlatformInvitations: (options?: {
    status?: 'pending' | 'used' | 'expired'
    enabled?: boolean
  }) => {
    return useQuery({
      queryKey: invitationKeys.platformList(options?.status),
      queryFn: async () => {
        const result = await authClient.invite.list({
          query: { status: options?.status },
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        
        return result.data.invitations
      },
      enabled: options?.enabled ?? true,
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    })
  },

  /**
   * Mutation hook to create a platform invitation
   * 
   * @example
   * ```ts
   * const createInvite = invitationHooks.useCreatePlatformInvitation()
   * createInvite.mutate({ email: 'user@example.com', role: 'user' })
   * ```
   */
  useCreatePlatformInvitation: () => {
    return useMutation({
      mutationKey: invitationKeys.createPlatformInvitation(),
      mutationFn: async (data: { email: string; role: string }) => {
        const result = await authClient.invite.create({
          email: data.email,
          role: data.role,
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        return result.data
      },
      onSuccess: () => {
        toast.success('Platform invitation created!')
      },
      onError: (error: Error) => {
        toast.error(`Failed to create invitation: ${error.message}`)
      },
    })
  },

  /**
   * Mutation hook to check platform invitation validity (public endpoint)
   * 
   * @example
   * ```ts
   * const checkInvite = invitationHooks.useCheckPlatformInvitation()
   * const result = await checkInvite.mutateAsync('token-string')
   * if (result.valid) { /* proceed *\/ }
   * ```
   */
  useCheckPlatformInvitation: () => {
    return useMutation({
      mutationKey: invitationKeys.checkPlatformInvitation(),
      mutationFn: async (token: string) => {
        const result = await authClient.invite.check({ token })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        return result.data
      },
      onError: (error: Error) => {
        toast.error(`Invalid invitation: ${error.message}`)
      },
    })
  },

  /**
   * Mutation hook to validate platform invitation and create account (public endpoint)
   * 
   * @example
   * ```ts
   * const validateInvite = invitationHooks.useValidatePlatformInvitation()
   * validateInvite.mutate({ 
   *   token: 'abc123', 
   *   password: 'password123',
   *   name: 'John Doe'
   * })
   * ```
   */
  useValidatePlatformInvitation: () => {
    return useMutation({
      mutationKey: invitationKeys.validatePlatformInvitation(),
      mutationFn: async (data: { token: string; password: string; name: string }) => {
        const result = await authClient.invite.validate({
          token: data.token,
          password: data.password,
          name: data.name,
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        return result.data
      },
      onSuccess: () => {
        toast.success('Account created successfully!')
      },
      onError: (error: Error) => {
        toast.error(`Failed to create account: ${error.message}`)
      },
    })
  },

  // ========================================================================
  // ORGANIZATION INVITATIONS (Built-in Plugin)
  // ========================================================================

  /**
   * Query hook to fetch pending invitations for the current user
   * 
   * Note: Better Auth doesn't provide a global listInvitations method yet.
   * This returns an empty array - invitations need to be fetched per organization.
   * 
   * @example
   * ```ts
   * const { data: invitations } = invitationHooks.usePendingInvitations()
   * ```
   */
  usePendingInvitations: (options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: invitationKeys.organizationPending(),
      queryFn: async (): Promise<Invitation[]> => {
        // NOTE: Better Auth organization plugin does not provide global invitation listing.
        // Organization invitations must be fetched per-organization using:
        // authClient.organization.getInvitations({ organizationId })
        // This hook returns empty array as placeholder for future per-org implementation.
        return []
      },
      enabled: options?.enabled ?? true,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  },

  /**
   * Query hook to fetch all invitations (for admin)
   * 
   * Note: Better Auth doesn't provide a global listInvitations method yet.
   * This returns an empty array - invitations need to be fetched per organization.
   * 
   * @example
   * ```ts
   * const { data: invitations } = invitationHooks.useAllInvitations()
   * ```
   */
  useAllInvitations: (options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: invitationKeys.organizationLists(),
      queryFn: async (): Promise<Invitation[]> => {
        // NOTE: Better Auth organization plugin does not provide global invitation listing.
        // Organization invitations must be fetched per-organization using:
        // authClient.organization.getInvitations({ organizationId })
        // For admin views showing all invitations, you would need to:
        // 1. Fetch all organizations
        // 2. Fetch invitations for each organization
        // 3. Merge the results
        // This hook returns empty array as placeholder for future implementation.
        return []
      },
      enabled: options?.enabled ?? true,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
    })
  },

  /**
   * Mutation hook to accept an organization invitation
   * 
   * @example
   * ```ts
   * const acceptInvite = invitationHooks.useAcceptInvitation()
   * acceptInvite.mutate('invitation-id')
   * ```
   */
  useAcceptInvitation: () => {
    return useMutation({
      mutationKey: invitationKeys.acceptInvitation(),
      mutationFn: async (invitationId: string) => {
        const result = await authClient.organization.acceptInvitation({
          invitationId,
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        return result.data
      },
      onSuccess: () => {
        toast.success('Invitation accepted!')
      },
      onError: (error: Error) => {
        toast.error(`Failed to accept invitation: ${error.message}`)
      },
    })
  },

  /**
   * Mutation hook to reject an organization invitation
   * 
   * @example
   * ```ts
   * const rejectInvite = invitationHooks.useRejectInvitation()
   * rejectInvite.mutate('invitation-id')
   * ```
   */
  useRejectInvitation: () => {
    return useMutation({
      mutationKey: invitationKeys.rejectInvitation(),
      mutationFn: async (invitationId: string) => {
        const result = await authClient.organization.rejectInvitation({
          invitationId,
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        return result.data
      },
      onSuccess: () => {
        toast.success('Invitation rejected')
      },
      onError: (error: Error) => {
        toast.error(`Failed to reject invitation: ${error.message}`)
      },
    })
  },

  /**
   * Mutation hook to cancel/revoke an invitation (for organization admins)
   * 
   * @example
   * ```ts
   * const cancelInvite = invitationHooks.useCancelInvitation()
   * cancelInvite.mutate({ invitationId: 'invitation-id' })
   * ```
   */
  useCancelInvitation: () => {
    return useMutation({
      mutationKey: invitationKeys.cancelInvitation(),
      mutationFn: async (data: { invitationId: string }) => {
        const result = await authClient.organization.cancelInvitation({
          invitationId: data.invitationId,
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        return result.data
      },
      onSuccess: () => {
        toast.success('Invitation cancelled')
      },
      onError: (error: Error) => {
        toast.error(`Failed to cancel invitation: ${error.message}`)
      },
    })
  },
}, { keys: invitationKeys })

// ============================================================================
// INVALIDATIONS CONFIGURATION
// ============================================================================

/**
 * Centralized cache invalidation configuration for invitation hooks
 * 
 * Defines which queries to invalidate after each mutation:
 * - Platform invitation creation → invalidate platform list
 * - Platform invitation validation → invalidate session (new user logged in)
 * - Organization invitation actions → invalidate invitation lists & organizations
 * 
 * @example How it works
 * ```ts
 * // When useCreatePlatformInvitation() succeeds:
 * // 1. Toast notification (from hook)
 * // 2. These queries are invalidated automatically:
 * queryClient.invalidateQueries({ queryKey: invitationKeys.platform.all() })
 * ```
 */
export const invitationInvalidations = defineInvalidations(
  {
    // No ORPC contract for invitations (Better Auth plugin, not API endpoints)
    custom: invitationCustomHooks,
  },
  {
    // Platform invitation invalidations
    useCreatePlatformInvitation: ({ keys }) => [
      keys.platformAll(), // Invalidate all platform invitation lists
    ],
    
    useValidatePlatformInvitation: ({ keys }) => [
      keys.session(), // User just created account and logged in
    ],
    
    // Organization invitation invalidations
    useAcceptInvitation: ({ keys }) => [
      keys.organizationAll(), // Invalidate organization invitation lists
      ['organizations'], // Invalidate organizations list (user joined new org)
    ],
    
    useRejectInvitation: ({ keys }) => [
      keys.organizationAll(), // Invalidate organization invitation lists
    ],
    
    useCancelInvitation: ({ keys }) => [
      keys.organizationAll(), // Invalidate organization invitation lists
    ],
  }
)

// ============================================================================
// EXPORTED HOOKS - With Invalidations Applied
// ============================================================================

/**
 * Invitation hooks with unified invalidations applied.
 * 
 * These hooks automatically handle cache invalidation after mutations,
 * ensuring the UI stays in sync with the server state.
 * 
 * @example
 * ```ts
 * import { invitationHooks } from '@/hooks/useInvitation'
 * 
 * // In your component
 * const { data: invitations } = invitationHooks.usePlatformInvitations({ 
 *   status: 'pending' 
 * })
 * 
 * const createInvite = invitationHooks.useCreatePlatformInvitation()
 * 
 * // Cache automatically invalidated after mutation
 * createInvite.mutate({ email: 'user@example.com', role: 'user' })
 * ```
 */
export const invitationHooks = invitationCustomHooks

// ============================================================================
// INDIVIDUAL HOOK EXPORTS (for convenience)
// ============================================================================

// Platform invitation hooks
export const usePlatformInvitations = invitationHooks.usePlatformInvitations
export const useCreatePlatformInvitation = invitationHooks.useCreatePlatformInvitation
export const useCheckPlatformInvitation = invitationHooks.useCheckPlatformInvitation
export const useValidatePlatformInvitation = invitationHooks.useValidatePlatformInvitation

// Organization invitation hooks
export const usePendingInvitations = invitationHooks.usePendingInvitations
export const useAllInvitations = invitationHooks.useAllInvitations
export const useAcceptInvitation = invitationHooks.useAcceptInvitation
export const useRejectInvitation = invitationHooks.useRejectInvitation
export const useCancelInvitation = invitationHooks.useCancelInvitation

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { Invitation, PlatformInvite }

