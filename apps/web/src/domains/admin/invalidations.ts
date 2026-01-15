/**
 * Admin Domain - Invalidations
 *
 * Defines cache invalidation rules for admin mutations
 */

import { defineInvalidations } from "../shared/helpers";
import { adminEndpoints } from "./endpoints";

/**
 * Admin cache invalidation configuration
 *
 * Maps each mutation to the queries it should invalidate
 */
export const adminInvalidations = defineInvalidations(adminEndpoints, {
  // Ban user invalidates the user and users list
  banUser: ({ keys }) => [
    keys.listUsers({
      input: {
        query: {},
      },
    }),
  ],
  // Unban user invalidates the user and users list
  unbanUser: ({ keys }) => [
    keys.listUsers({
      input: {
        query: {},
      },
    }),
  ],
  // Set role invalidates the user, users list, and permissions
  setRole: ({ keys }) => [
    keys.listUsers({
      input: {
        query: {},
      },
    }),
    keys.hasPermission({
      input: {
        permissions: {},
      },
    }),
  ],
  // Create user invalidates the users list
  createUser: ({ keys }) => [
    keys.listUsers({
      input: {
        query: {},
      },
    }),
  ],
  // Update user invalidates the user and users list
  updateUser: ({ keys }) => [
    keys.listUsers({
      input: {
        query: {},
      },
    }),
  ],
  // Remove user invalidates the users list
  removeUser: ({ keys }) => [
    keys.listUsers({
      input: {
        query: {},
      },
    }),
  ],
});
