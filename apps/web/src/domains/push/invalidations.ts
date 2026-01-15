/**
 * Push Notification Domain - Cache Invalidation Configuration
 *
 * Defines which queries to invalidate when mutations succeed.
 */

import { defineInvalidations } from "../shared/helpers";
import { pushEndpoints } from "./endpoints";

/**
 * Push notification invalidation configuration
 *
 * Maps each mutation to the queries it should invalidate:
 * - subscribe: Invalidates subscriptions list and stats
 * - unsubscribe: Invalidates subscriptions list and stats
 */
export const pushInvalidations = defineInvalidations(pushEndpoints, {
  subscribe: ({ keys }) => [keys.getSubscriptions(), keys.getStats()],
  unsubscribe: ({ keys }) => [keys.getSubscriptions(), keys.getStats()],
});
