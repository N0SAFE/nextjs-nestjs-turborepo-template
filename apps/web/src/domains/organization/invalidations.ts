/**
 * Organization Domain - Cache Invalidation Configuration
 *
 * Defines which query keys to invalidate after mutations.
 * Separated from hooks.ts to allow server-side imports without "use client" conflicts.
 */

import { defineInvalidations } from "@/domains/shared/helpers";
import { organizationEndpoints } from "./endpoints";

export const organizationInvalidations = defineInvalidations(
  organizationEndpoints,
  {
    create: ({ keys }) => [keys.list()],
    update: ({ input, keys }) => [
      keys.get({
        input: { organizationId: input.organizationId },
      }),
      keys.list(),
    ],
    delete: ({ keys }) => [keys.list()],
    inviteMember: ({ input, keys }) => [
      keys.listMembers({
        input: { organizationId: input.organizationId },
      }),
      keys.listInvitations({
        input: { organizationId: input.organizationId },
      }),
      keys.listUserInvitations(),
    ],
    updateMemberRole: ({ input, keys }) => [
      keys.listMembers({
        input: { organizationId: input.organizationId },
      }),
    ],
    removeMember: ({ input, keys }) => [
      keys.listMembers({
        input: { organizationId: input.organizationId },
      }),
    ],
  },
);
