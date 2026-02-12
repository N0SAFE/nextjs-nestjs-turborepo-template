/**
 * User Domain - Cache Invalidation Configuration
 *
 * Defines which queries to invalidate when mutations succeed.
 */

import { defineInvalidations } from "../shared/helpers";
import { userEndpoints } from "./endpoints";

function resolveUserId(input: unknown): string | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const candidate = input as { id?: string; params?: { id?: string } };
  return candidate.id ?? candidate.params?.id;
}

/**
 * User invalidation configuration
 *
 * Maps each mutation to the queries it should invalidate:
 * - create: Invalidates user list and count
 * - update: Invalidates specific user and list
 * - delete: Invalidates specific user, list, and count
 */
export const userInvalidations = defineInvalidations(userEndpoints, {
  create: ({ keys }) => [keys.list(), keys.count()],
  update: ({ input, keys }) => {
    const userId = resolveUserId(input);
    return userId
      ? [keys.findById({ input: { params: { id: userId } } }), keys.list()]
      : [keys.list()];
  },
  delete: ({ input, keys }) => {
    const userId = resolveUserId(input);
    return userId
      ? [keys.findById({ input: { params: { id: userId } } }), keys.list(), keys.count()]
      : [keys.list(), keys.count()];
  },
});
