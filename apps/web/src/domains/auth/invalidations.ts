/**
 * Auth Domain - Cache Invalidation Configuration
 *
 * Defines which queries should be invalidated after each mutation.
 * Uses defineInvalidations for type-safe, declarative invalidation patterns.
 */

import { defineInvalidations } from "../shared/helpers";
import { authEndpoints } from "./endpoints";

/**
 * Auth invalidation configuration
 *
 * Maps each mutation to the queries it should invalidate.
 * Uses query key functions for type safety.
 */
export const authInvalidations = defineInvalidations(authEndpoints, {
  // Sign in: Invalidate session to fetch fresh user data
  signIn: ({ keys }) => [keys.session()],
  // Sign up: Invalidate session (user is automatically signed in)
  signUp: ({ keys }) => [keys.session()],
  // Sign out: Clear session data
  signOut: ({ keys }) => [keys.session()],
  // Reset password: Invalidate session (password changed)
  resetPassword: ({ keys }) => [keys.session()],
  // Update profile: Invalidate session to show updated data
  updateProfile: ({ keys }) => [keys.session()],
  // Change password: Invalidate session (password changed)
  changePassword: ({ keys }) => [keys.session()],
});
