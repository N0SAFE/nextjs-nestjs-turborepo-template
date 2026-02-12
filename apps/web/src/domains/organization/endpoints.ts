import { custom, mapBetterAuth } from '@/domains/shared/helpers'
import { authClient } from '@/lib/auth/options'
import {
  listOrganizationsSchema,
  getOrganizationSchema,
  listMembersSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  deleteOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  listInvitationsSchema,
  listUserInvitationsSchema,
} from './schemas'

// ============================================================================
// STALE TIME CONSTANTS
// ============================================================================

const STALE_TIME = {
  DEFAULT: 1000 * 60, // 1 minute
  LONG: 1000 * 60 * 5, // 5 minutes
}

// ============================================================================
// ENDPOINTS
// ============================================================================

export const organizationEndpoints = {
  // Query endpoints
  list: custom({
    input: listOrganizationsSchema,
    keys: (i) => ['organization', 'list', i],
    handler: (input) => authClient.organization.list({
      query: input,
    }),
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  get: custom({
    input: getOrganizationSchema,
    keys: (i) => ['organization', 'get', i],
    handler: (input) => authClient.organization.getFullOrganization({
      query: { organizationId: input.organizationId },
    }),
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  listMembers: custom({
    input: listMembersSchema,
    keys: (i) => ['organization', 'listMembers', i],
    handler: (input) => authClient.organization.listMembers({
      query: { organizationId: input.organizationId },
    }),
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  listInvitations: custom({
    input: listInvitationsSchema,
    keys: (i) => ['organization', 'listInvitations', i],
    handler: (input) => authClient.organization.listInvitations({
      query: { organizationId: input.organizationId },
    }),
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  listUserInvitations: custom({
    input: listUserInvitationsSchema,
    keys: (i) => ['organization', 'listUserInvitations', i],
    handler: () => authClient.organization.listUserInvitations(),
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  // Mutation endpoints
  create: custom({
    input: createOrganizationSchema,
    keys: (i) => ['organization', 'create', i],
    handler: authClient.organization.create,
    map: mapBetterAuth(),
  }),

  update: custom({
    input: updateOrganizationSchema,
    keys: (i) => ['organization', 'update', i],
    handler: (input) => authClient.organization.update({
      organizationId: input.organizationId,
      data: {
        name: input.name,
        slug: input.slug,
        metadata: input.metadata,
      },
    }),
    map: mapBetterAuth(),
  }),

  delete: custom({
    input: deleteOrganizationSchema,
    keys: (i) => ['organization', 'delete', i],
    handler: authClient.organization.delete,
    map: mapBetterAuth(),
  }),

  inviteMember: custom({
    input: inviteMemberSchema,
    keys: (i) => ['organization', 'inviteMember', i],
    handler: authClient.organization.inviteMember,
    map: mapBetterAuth(),
  }),

  updateMemberRole: custom({
    input: updateMemberRoleSchema,
    keys: (i) => ['organization', 'updateMemberRole', i],
    handler: authClient.organization.updateMemberRole,
    map: mapBetterAuth(),
  }),

  removeMember: custom({
    input: removeMemberSchema,
    keys: (i) => ['organization', 'removeMember', i],
    handler: authClient.organization.removeMember,
    map: mapBetterAuth(),
  }),
}
