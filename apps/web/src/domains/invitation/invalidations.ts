/**
 * Invitation Domain - Cache Invalidation Configuration
 *
 * Defines which query keys to invalidate after mutations.
 * Separated from hooks.ts to allow server-side imports without "use client" conflicts.
 */

import { defineInvalidations } from "@/domains/shared/helpers";
import { invitationEndpoints } from "./endpoints";
import { SESSION_QUERY_KEY } from "@/lib/auth";

export const invitationInvalidations = defineInvalidations(
  invitationEndpoints,
  {
    // Platform invitations
    createPlatform: ({ keys }) => [keys.listPlatform()],
    validatePlatform: () => [SESSION_QUERY_KEY],
    // Organization invitations
    acceptOrganization: ({ keys, input }) => [
      keys.acceptOrganization({
        input: {
          invitationId: input.invitationId,
        },
      }),
      ["organization"], // Invalidate organization list (user joined new org)
    ],
    rejectOrganization: ({ keys, input }) => [
      keys.rejectOrganization({ input: { invitationId: input.invitationId } }),
    ],
    cancelOrganization: ({ keys, input }) => [
      keys.cancelOrganization({ input: { invitationId: input.invitationId } }),
    ],
  },
);
