/**
 * User Domain - Cache Invalidation Configuration
 *
 * Defines which queries to invalidate when mutations succeed.
 */

import { defineInvalidations } from "../shared/helpers";
import { userEndpoints } from "./endpoints";

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
  update: ({ input, keys }) => [
    keys.findById({ input: { id: input.id } }),
    keys.list(),
  ],
  delete: ({ input, keys }) => [
    keys.findById({ input: { id: input.id } }),
    keys.list(),
    keys.count(),
  ],
});
