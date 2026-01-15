import { custom, mapBetterAuth } from '@/domains/shared/helpers'
import { authClient } from '@/lib/auth/options'
import {
  createPlatformInvitationSchema,
  listPlatformInvitationsSchema,
  checkPlatformInvitationSchema,
  validatePlatformInvitationSchema,
  acceptInvitationSchema,
  rejectInvitationSchema,
  cancelInvitationSchema,
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

export const invitationEndpoints = {
  // Platform invitation endpoints (custom plugin)
  listPlatform: custom({
    input: listPlatformInvitationsSchema,
    keys: (i) => ['invitation', 'platform', 'list', i],
    handler: (input) => authClient.invite.list({
      query: { status: input.status },
    }),
    map: mapBetterAuth(),
    staleTime: STALE_TIME.DEFAULT,
  }),

  createPlatform: custom({
    input: createPlatformInvitationSchema,
    keys: (i) => ['invitation', 'platform', 'create', i],
    handler: authClient.invite.create,
    map: mapBetterAuth(),
  }),

  checkPlatform: custom({
    input: checkPlatformInvitationSchema,
    keys: (i) => ['invitation', 'platform', 'check', i],
    handler: (input) => authClient.invite.check({ token: input.token }),
    map: mapBetterAuth(),
  }),

  validatePlatform: custom({
    input: validatePlatformInvitationSchema,
    keys: (i) => ['invitation', 'platform', 'validate', i],
    handler: authClient.invite.validate,
    map: mapBetterAuth(),
  }),

  // Organization invitation endpoints (built-in plugin)
  acceptOrganization: custom({
    input: acceptInvitationSchema,
    keys: (i) => ['invitation', 'organization', 'accept', i],
    handler: authClient.organization.acceptInvitation,
    map: mapBetterAuth(),
  }),

  rejectOrganization: custom({
    input: rejectInvitationSchema,
    keys: (i) => ['invitation', 'organization', 'reject', i],
    handler: authClient.organization.rejectInvitation,
    map: mapBetterAuth(),
  }),

  cancelOrganization: custom({
    input: cancelInvitationSchema,
    keys: (i) => ['invitation', 'organization', 'cancel', i],
    handler: authClient.organization.cancelInvitation,
    map: mapBetterAuth(),
  }),
}
