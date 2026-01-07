'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth'
import { toast } from 'sonner'

// Use Better Auth $Infer types
type Invitation = typeof authClient.$Infer.Invitation

/**
 * Query key registry for invitation-related queries
 */
export const invitationQueryKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationQueryKeys.all, 'list'] as const,
  pending: () => [...invitationQueryKeys.lists(), 'pending'] as const,
  detail: (invitationId: string) => [...invitationQueryKeys.all, 'detail', invitationId] as const,
} as const

/**
 * Hook to fetch pending invitations for the current user
 * Note: Better Auth invitation plugin doesn't provide a direct listInvitations method
 * This returns an empty array for now - invitations need to be fetched per organization
 */
export function usePendingInvitations(options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: invitationQueryKeys.pending(),
    queryFn: (): Promise<Invitation[]> => {
      // TODO: Better Auth doesn't provide a global listInvitations method
      // Invitations must be fetched per organization
      // For now, return empty array
      return Promise.resolve([])
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch all invitations (for admin)
 * Note: Better Auth invitation plugin doesn't provide a direct listInvitations method
 * This returns an empty array for now - invitations need to be fetched per organization
 */
export function useAllInvitations(options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: invitationQueryKeys.lists(),
    queryFn: (): Promise<Invitation[]> => {
      // TODO: Better Auth doesn't provide a global listInvitations method
      // Invitations must be fetched per organization
      // For now, return empty array
      return Promise.resolve([])
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to accept an organization invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
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
      
      // Invalidate invitations
      void queryClient.invalidateQueries({
        queryKey: invitationQueryKeys.all
      })
      
      // Invalidate organizations list (new org added)
      void queryClient.invalidateQueries({
        queryKey: ['organizations']
      })
    },
    onError: (error) => {
      toast.error(`Failed to accept invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to reject an organization invitation
 */
export function useRejectInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
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
      
      // Invalidate invitations
      void queryClient.invalidateQueries({
        queryKey: invitationQueryKeys.all
      })
    },
    onError: (error) => {
      toast.error(`Failed to reject invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to cancel/revoke an invitation (for organization admins)
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { invitationId: string }) => {
      const result = await authClient.organization.acceptInvitation({
        invitationId: data.invitationId,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: () => {
      toast.success('Invitation cancelled')
      
      // Invalidate invitations
      void queryClient.invalidateQueries({
        queryKey: invitationQueryKeys.all
      })
    },
    onError: (error) => {
      toast.error(`Failed to cancel invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

// Type exports
export type { Invitation }
