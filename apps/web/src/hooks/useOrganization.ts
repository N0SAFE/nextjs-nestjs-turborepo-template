'use client'

/**
 * @fileoverview Organization Hooks - Better Auth Organization Plugin
 * 
 * This file provides React hooks for multi-tenancy organization operations using
 * Better Auth's Organization plugin. Organizations provide tenant isolation and
 * role-based access control within each organization context.
 * 
 * Key Features:
 * - Organization CRUD operations (create, update, delete)
 * - Member management (invite, remove, update roles)
 * - Organization-specific roles and permissions
 * - Active organization context switching
 * - Centralized query key management
 * - Automatic cache invalidation
 * - Toast notifications for feedback
 * 
 * Unlike ORPC hooks which use generated contracts, these hooks wrap Better Auth's
 * Organization plugin methods with React Query for optimal caching and state management.
 * 
 * Organization Hierarchy:
 * - Platform (top level) - managed by Admin plugin
 * - Organizations (tenants) - managed by Organization plugin
 * - Organization Members - users with organization-specific roles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Use Better Auth $Infer types
type Organization = typeof authClient.$Infer.Organization
type OrganizationMember = typeof authClient.$Infer.Member
type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization

// Infer role type from Better Auth inviteMember method parameters
type InviteMemberParams = Parameters<typeof authClient.organization.inviteMember>[0]
type OrganizationRole = InviteMemberParams['role']

/**
 * Query key registry for organization-related queries
 * Centralizes query key definitions for better maintainability and type safety
 */
export const organizationQueryKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationQueryKeys.all, 'list'] as const,
  list: (filters?: { page?: number; pageSize?: number }) => 
    [...organizationQueryKeys.lists(), filters] as const,
  details: () => [...organizationQueryKeys.all, 'detail'] as const,
  detail: (organizationId: string) => 
    [...organizationQueryKeys.details(), organizationId] as const,
  members: (organizationId: string) => 
    [...organizationQueryKeys.detail(organizationId), 'members'] as const,
} as const

/**
 * Hook to fetch a paginated list of organizations
 */
export function useOrganizations(options?: {
  pagination?: {
    page?: number
    pageSize?: number
  }
  enabled?: boolean
}) {
  return useQuery({
    queryKey: organizationQueryKeys.list(options?.pagination),
    queryFn: async (): Promise<Organization[]> => {
      const result = await authClient.organization.list()
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch a specific organization by ID
 */
export function useOrganization(organizationId: string, options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: organizationQueryKeys.detail(organizationId),
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required')
      
      const result = await authClient.organization.getFullOrganization({
        query: {
          organizationId,
        },
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    enabled: (options?.enabled ?? true) && !!organizationId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch members of an organization
 */
export function useOrganizationMembers(organizationId: string, options?: {
  enabled?: boolean
}) {
  return useQuery({
    queryKey: organizationQueryKeys.members(organizationId),
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required')
      
      const result = await authClient.organization.listMembers({
        query: {
          organizationId,
        },
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    enabled: (options?.enabled ?? true) && !!organizationId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { name: string; slug: string; metadata?: Record<string, unknown> }) => {
      const result = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
        metadata: data.metadata,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (newOrg) => {
      toast.success(`Organization "${newOrg.name}" created successfully!`)
      
      // Invalidate organization list
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.lists()
      })

      // Navigate to the new organization
      router.push(`/dashboard/organizations/${newOrg.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to update an organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { organizationId: string; name?: string; slug?: string; metadata?: Record<string, unknown> }) => {
      const result = await authClient.organization.update({
        organizationId: data.organizationId,
        data: {
          name: data.name,
          slug: data.slug,
          metadata: data.metadata,
        },
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (updatedOrg) => {
      toast.success('Organization updated successfully!')

      // Invalidate specific organization query
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail(updatedOrg.id)
      })

      // Invalidate organization list
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.lists()
      })
    },
    onError: (error) => {
      toast.error(`Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to delete an organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { organizationId: string }) => {
      const result = await authClient.organization.delete({
        organizationId: data.organizationId,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: () => {
      toast.success('Organization deleted successfully!')

      // Invalidate organization list
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.all
      })

      // Navigate back to organizations list
      router.push('/dashboard/organizations')
    },
    onError: (error) => {
      toast.error(`Failed to delete organization: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to invite a member to an organization
 */
export function useInviteOrganizationMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { organizationId: string; email: string; role: OrganizationRole }) => {
      const result = await authClient.organization.inviteMember({
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      toast.success(`Invitation sent to ${variables.email}!`)

      // Invalidate members list
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.members(variables.organizationId)
      })
    },
    onError: (error) => {
      toast.error(`Failed to invite member: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to update a member's role
 */
export function useUpdateOrganizationMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { organizationId: string; memberId: string; role: OrganizationRole }) => {
      const result = await authClient.organization.updateMemberRole({
        organizationId: data.organizationId,
        memberId: data.memberId,
        role: data.role,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      toast.success('Member role updated successfully!')

      // Invalidate members list
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.members(variables.organizationId)
      })
    },
    onError: (error) => {
      toast.error(`Failed to update member role: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

/**
 * Hook to remove a member from an organization
 */
export function useRemoveOrganizationMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { organizationId: string; memberIdOrEmail: string }) => {
      const result = await authClient.organization.removeMember({
        organizationId: data.organizationId,
        memberIdOrEmail: data.memberIdOrEmail,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      toast.success('Member removed successfully!')

      // Invalidate members list
      void queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.members(variables.organizationId)
      })
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })
}

// Type exports for use in components
export type { Organization, ActiveOrganization, OrganizationMember, OrganizationRole }
