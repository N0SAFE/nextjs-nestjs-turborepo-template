/**
 * Utility types for creating minimal Auth instances with specific Better Auth plugins
 *
 * Creates a typed Auth instance that includes ONLY the plugins you specify,
 * using the actual `betterAuth()` function's return type inference.
 *
 * This approach leverages Better Auth's own type system to properly infer
 * the API methods contributed by each plugin.
 *
 * @example
 * ```typescript
 * import { admin, organization } from 'better-auth/plugins'
 *
 * const adminPlugin = admin({});
 * const orgPlugin = organization();
 *
 * type AdminOnlyAuth = WithAuthPlugins<[typeof adminPlugin]>;
 * type MultiPluginAuth = WithAuthPlugins<[typeof adminPlugin, typeof orgPlugin]>;
 *
 * // Use in a function
 * function handleUser(auth: AdminOnlyAuth) {
 *   // auth.api.createUser is available with proper typing
 *   // auth.api.createOrganization is NOT available (type error)
 * }
 * ```
 */

import { type Auth as BetterAuthInstance, type BetterAuthOptions } from 'better-auth';

/**
 * Type alias to extract the return type of betterAuth with specific plugins.
 * This properly infers all API methods contributed by the plugins.
 */
export type WithAuthPlugins<TPlugins extends BetterAuthOptions['plugins']> = BetterAuthInstance<{ plugins: TPlugins }>;

/**
 * Minimum Auth interface that all plugin-specific Auth types must satisfy
 * Contains only the base session API that's always available
 */
export interface MinimalAuth {
  api: {
    getSession: (params: { headers: Headers }) => Promise<{ user: unknown; session: unknown } | null>;
  };
}
