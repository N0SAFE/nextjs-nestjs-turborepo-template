import { warnOnConflicts } from './merge/conflicts';
import {
  extractCustomQueryKeys,
  extractRouterQueryKeys,
  mergeQueryKeys,
} from './merge/keys';
import type {
  CustomHooks,
  CustomHooksWithKeys,
  DefineCustomHooksOptions,
  MergeHooksConfig,
  MergedHooks,
  QueryKeys,
} from './merge/types';
/**
 * @fileoverview Utilities for merging ORPC-generated hooks with custom hooks
 * 
 * This module provides a unified way to combine:
 * - Router hooks (from createRouterHooks)
 * - Composite hooks (from createCompositeHooks)
 * - Custom hooks (manually defined domain-specific hooks)
 * 
 * Custom hooks remain separate from ORPC procedures but can be referenced
 * in invalidation configs via the `custom` property.
 * 
 * NEW: Query Key-Based Invalidation Pattern
 * Custom hooks can now define their own `keys` object for type-safe invalidation:
 * 
 * @example
 * ```typescript
 * // Define custom hooks WITH keys
 * const customHooks = defineCustomHooks({
 *   useProfile: () => useQuery({ ... }),
 *   useUpdateProfile: () => useMutation({ ... })
 * }, {
 *   keys: {
 *     profile: (userId: string) => ['profile', userId] as const,
 *     all: () => ['profile'] as const,
 *   }
 * })
 * 
 * // Define invalidations using keys
 * const invalidations = defineInvalidations({
 *   custom: customHooks
 * }, {
 *   useUpdateProfile: ({ keys, input }) => [
 *     keys.profile(input.userId),  // Type-safe!
 *     keys.all(),
 *   ]
 * })
 * 
 * // External usage
 * queryClient.invalidateQueries({ queryKey: customHooks.keys.profile('123') })
 * ```
 */

/**
 * Type for query key factory functions
 * Each key factory returns a readonly tuple representing a query key
 */
export type { QueryKeyFactory } from './merge/types';

/**
 * Type for a keys object containing query key factories
 */
export type { QueryKeys } from './merge/types';

/**
 * Type for custom hook definitions
 */
export type { CustomHooks } from './merge/types';

/**
 * Extract keys type from a hooks object (router or custom)
 */
export type { ExtractKeys } from './merge/types';

/**
 * Configuration for merging hooks
 */
export type { MergeHooksConfig } from './merge/types';

/**
 * Combined keys from all hook sources
 */
export type { MergedKeys } from './merge/types';

/**
 * Merged hooks type - combines router, composite, and custom hooks
 * Also combines `keys` from all sources
 */
export type { MergedHooks } from './merge/types';

/**
 * Merge ORPC-generated hooks with custom hooks into a unified API
 * 
 * NEW: Also merges `keys` from all sources into a unified `keys` object.
 * - Router hooks: `queryKeys` → merged into `keys`
 * - Custom hooks: `keys` → merged into `keys`
 * 
 * @param config - Configuration containing router, composite, and custom hooks
 * @returns A merged object containing all hooks and combined keys
 * 
 * @example Basic usage
 * ```typescript
 * const hooks = mergeHooks({
 *   router: routerHooks,
 *   composite: compositeHooks,
 *   custom: customHooks
 * })
 * ```
 * 
 * @example With keys
 * ```typescript
 * const userHooks = createRouterHooks(orpc.user, { ... })
 * // userHooks.queryKeys = { list: ..., findById: ..., all: ... }
 * 
 * const authHooks = defineCustomHooks({ ... }, {
 *   keys: { session: () => [...], all: () => [...] }
 * })
 * 
 * const hooks = mergeHooks({
 *   router: userHooks,
 *   composite: {},
 *   custom: authHooks
 * })
 * 
 * // Access combined keys
 * hooks.keys.list()      // from userHooks
 * hooks.keys.session()   // from authHooks
 * ```
 */
export function mergeHooks<
  TRouter extends Record<string, unknown>,
  TComposite extends Record<string, unknown>,
  TCustom extends CustomHooks = Record<string, never>
>(
  config: MergeHooksConfig<TRouter, TComposite, TCustom>
): MergedHooks<TRouter, TComposite, TCustom> {
  const { router, composite, custom = {} as TCustom } = config

  // Check for naming conflicts (excluding keys)
  const routerKeys = Object.keys(router).filter(k => k !== 'queryKeys' && k !== 'keys')
  const compositeKeys = Object.keys(composite).filter(k => k !== 'keys')
  const customKeys = Object.keys(custom).filter(k => k !== 'keys')

  warnOnConflicts([...routerKeys, ...compositeKeys, ...customKeys], 'hooks')

  // Extract keys from router (queryKeys) and custom (keys)
  const routerQueryKeys = extractRouterQueryKeys(router)
  const customQueryKeys = extractCustomQueryKeys(custom as Record<string, unknown>)
  
  // Check for key naming conflicts
  warnOnConflicts([...Object.keys(routerQueryKeys), ...Object.keys(customQueryKeys)], 'query keys')

  // Merge keys (custom takes precedence)
  const mergedKeys = mergeQueryKeys(routerQueryKeys, customQueryKeys)

  // Merge all hooks with custom hooks taking precedence
  // Remove queryKeys/keys from individual sources, add unified keys
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queryKeys: _queryKeys, ...routerWithoutKeys } = router as TRouter & { queryKeys?: unknown }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { keys: _keys, ...customWithoutKeys } = custom as TCustom & { keys?: unknown }
  
  // NOTE: The cast through unknown is necessary because:
  // 1. The merged keys object has a computed type based on runtime values
  // 2. MergedKeys<TRouter, TCustom> is a precise type intersection
  // 3. TypeScript can't verify the runtime object matches the compile-time type
  // This is safe because we construct mergedKeys from the exact sources
  // that MergedKeys extracts from (routerQueryKeys + customQueryKeys)
  return {
    ...routerWithoutKeys,
    ...composite,
    ...customWithoutKeys,
    keys: mergedKeys,
  } as unknown as MergedHooks<TRouter, TComposite, TCustom>
}

/**
 * Custom hooks with optional keys - the result type
 */
export type { CustomHooksWithKeys } from './merge/types';

/**
 * Options for defineCustomHooks
 */
export type { DefineCustomHooksOptions } from './merge/types';

/**
 * Helper to define custom hooks with type inference and optional keys
 * 
 * NEW: Now supports a `keys` option for query key-based invalidation.
 * Keys are attached to the returned hooks object for external access.
 * 
 * @param hooks - Object containing custom hook functions
 * @param options - Optional configuration including keys
 * @returns The hooks object with `keys` property attached
 * 
 * @example Without keys (backwards compatible)
 * ```typescript
 * const customHooks = defineCustomHooks({
 *   useProfile: (userId: string) => useQuery({ ... }),
 *   useUpdateProfile: () => useMutation({ ... })
 * })
 * ```
 * 
 * @example With keys (new pattern)
 * ```typescript
 * const authHooks = defineCustomHooks({
 *   useSignInEmail: () => useMutation({
 *     mutationKey: ['auth', 'signInEmail'],
 *     mutationFn: async (input) => authClient.signIn.email(input)
 *   }),
 *   useSignOut: () => useMutation({
 *     mutationKey: ['auth', 'signOut'],
 *     mutationFn: async () => signOut()
 *   }),
 * }, {
 *   keys: {
 *     session: () => ['auth', 'session'] as const,
 *     all: () => ['auth'] as const,
 *   }
 * })
 * 
 * // Access keys externally
 * queryClient.invalidateQueries({ queryKey: authHooks.keys.session() })
 * 
 * // Use in defineInvalidations
 * defineInvalidations({ custom: authHooks }, {
 *   useSignInEmail: ({ keys }) => [keys.session()],
 *   useSignOut: ({ keys }) => [keys.all()],
 * })
 * ```
 */
export function defineCustomHooks<
  THooks extends CustomHooks,
  TKeys extends QueryKeys = Record<string, never>
>(
  hooks: THooks,
  options?: DefineCustomHooksOptions<TKeys>
): CustomHooksWithKeys<THooks, TKeys> {
  const keys = (options?.keys ?? {}) as TKeys
  
  // Attach keys to the hooks object
  return Object.assign({}, hooks, { keys }) as CustomHooksWithKeys<THooks, TKeys>
}




