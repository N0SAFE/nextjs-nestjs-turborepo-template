'use client'

/**
 * @fileoverview Push Notification Hooks - Generated with @repo/orpc-utils/hooks
 * 
 * This file demonstrates the power of the orpc hooks package.
 * The hooks module automatically:
 * - Detects operation types from contract metadata (GET=query, POST/PUT/DELETE=mutation)
 * - Creates properly typed hooks with full inference
 * - Sets up cache invalidation based on CRUD patterns
 * - Generates composite hooks for common UI patterns
 */

import { createRouterHooks, createCompositeHooks, defineInvalidations } from '@repo/orpc-utils/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { orpc, appContract } from '@/lib/orpc'

// ============================================================================
// GENERATED HOOKS - Automatic from contract
// ============================================================================

/**
 * Custom invalidation configuration for push notification operations.
 */
const pushInvalidations = defineInvalidations<typeof appContract.push, typeof orpc.push>(orpc.push, {
  // When subscribing, refresh the subscriptions list
  subscribe: ['getSubscriptions'],
  // When unsubscribing, refresh the subscriptions list
  unsubscribe: ['getSubscriptions'],
  // When sending test notification, refresh stats
  sendTestNotification: ['getStats'],
})

/**
 * Generate all push notification hooks from the contract.
 * 
 * This single line replaces manual hook creation!
 * The package detects from the contract:
 * - getPublicKey: GET /push/public-key → useQuery hook
 * - getSubscriptions: GET /push/subscriptions → useQuery hook
 * - getStats: GET /push/stats → useQuery hook
 * - subscribe: POST /push/subscribe → useMutation hook
 * - unsubscribe: POST /push/unsubscribe → useMutation hook
 * - sendTestNotification: POST /push/test → useMutation hook
 * 
 * IMPORTANT: Pass the raw contract type as the first generic parameter
 * to enable type-level hook discrimination.
 */
const pushHooks = createRouterHooks<typeof appContract.push, typeof orpc.push>(orpc.push, {
  invalidations: pushInvalidations,
  useQueryClient,
})

/**
 * Composite hooks for common UI patterns.
 * These combine multiple base hooks for specific use cases.
 */
const pushComposite = createCompositeHooks(orpc.push, pushHooks, {
  useQueryClient,
})

// ============================================================================
// QUERY KEY EXPORTS - For manual cache management
// ============================================================================

/**
 * Query key registry exported from generated hooks.
 * Use these for manual cache operations like prefetching or invalidation.
 * 
 * @example
 * ```ts
 * import { pushQueryKeys } from '@/hooks/usePush'
 * import { useQueryClient } from '@tanstack/react-query'
 * 
 * function MyComponent() {
 *   const queryClient = useQueryClient()
 *   
 *   // Prefetch subscriptions
 *   queryClient.prefetchQuery({
 *     queryKey: pushQueryKeys.getSubscriptions(),
 *     queryFn: ...
 *   })
 *   
 *   // Invalidate all push queries
 *   queryClient.invalidateQueries({
 *     queryKey: pushQueryKeys.all
 *   })
 * }
 * ```
 */
export const pushQueryKeys = pushHooks.queryKeys

// ============================================================================
// NAMED EXPORTS - For convenience and discoverability
// ============================================================================
// 
// Instead of re-exporting individual hooks (which can cause TypeScript
// "inaccessible unique symbol" errors), we provide a clean API:
//
// Usage Option 1 - Use the hooks object directly:
//   import { pushHooks } from '@/hooks/usePush'
//   const { data } = pushHooks.useGetSubscriptions()
//
// Usage Option 2 - Destructure in component:
//   import { pushHooks } from '@/hooks/usePush'
//   const { useGetPublicKey, useSubscribe } = pushHooks
//   const { data } = useGetPublicKey()
//
// ============================================================================

// Re-export the hooks object for convenient access
export { pushHooks, pushComposite }

// ============================================================================
// WRAPPER HOOKS - Provide stable named exports
// ============================================================================

/**
 * Hook to get VAPID public key for push notifications
 * @example const { data } = usePushPublicKey()
 */
export function usePushPublicKey(...args: Parameters<typeof pushHooks.useGetPublicKey>) {
  return pushHooks.useGetPublicKey(...args)
}

/**
 * Hook to get list of push notification subscriptions
 * @example const { data } = usePushSubscriptions()
 */
export function usePushSubscriptions(...args: Parameters<typeof pushHooks.useGetSubscriptions>) {
  return pushHooks.useGetSubscriptions(...args)
}

/**
 * Hook to get push notification statistics
 * @example const { data } = usePushStats()
 */
export function usePushStats(...args: Parameters<typeof pushHooks.useGetStats>) {
  return pushHooks.useGetStats(...args)
}

/**
 * Hook to subscribe to push notifications
 * @example const { mutate } = usePushSubscribe()
 */
export function usePushSubscribe(...args: Parameters<typeof pushHooks.useSubscribe>) {
  return pushHooks.useSubscribe(...args)
}

/**
 * Hook to unsubscribe from push notifications
 * @example const { mutate } = usePushUnsubscribe()
 */
export function usePushUnsubscribe(...args: Parameters<typeof pushHooks.useUnsubscribe>) {
  return pushHooks.useUnsubscribe(...args)
}

/**
 * Hook to send test push notification
 * @example const { mutate } = usePushSendTest()
 */
export function usePushSendTest(...args: Parameters<typeof pushHooks.useSendTestNotification>) {
  return pushHooks.useSendTestNotification(...args)
}

// ============================================================================
// COMPOSITE HOOKS - Advanced UI patterns
// ============================================================================

/**
 * Complete push notification management with combined loading/error states.
 * Perfect for notification settings pages.
 * 
 * @example
 * ```tsx
 * const { 
 *   list, create, update, delete: del,
 *   isLoading, isAnyMutating 
 * } = usePushManagement()
 * ```
 */
export function usePushManagement(...args: Parameters<typeof pushComposite.useManagement>) {
  return pushComposite.useManagement(...args)
}

/**
 * Paginated subscription list with page controls.
 * 
 * @example
 * ```tsx
 * const { 
 *   data, page, setPage, hasNext, hasPrev 
 * } = usePushPaginatedList({ pageSize: 10 })
 * ```
 */
export function usePushPaginatedList(...args: Parameters<typeof pushComposite.usePaginatedList>) {
  return pushComposite.usePaginatedList(...args)
}

/**
 * Infinite scroll pattern with automatic loading.
 * 
 * @example
 * ```tsx
 * const { 
 *   items, loadMore, hasMore, isLoadingMore 
 * } = usePushInfiniteList({ pageSize: 20 })
 * ```
 */
export function usePushInfiniteList(...args: Parameters<typeof pushComposite.useInfiniteList>) {
  return pushComposite.useInfiniteList(...args)
}

/**
 * Form data management with optimistic updates.
 * 
 * @example
 * ```tsx
 * const { 
 *   data, update, isUpdating 
 * } = usePushFormData(subscriptionId)
 * ```
 */
export function usePushFormData(...args: Parameters<typeof pushComposite.useFormData>) {
  return pushComposite.useFormData(...args)
}

/**
 * Bulk selection and operations.
 * 
 * @example
 * ```tsx
 * const { 
 *   selectedIds, toggleSelection, bulkDelete, isDeleting 
 * } = usePushSelection()
 * ```
 */
export function usePushSelection(...args: Parameters<typeof pushComposite.useSelection>) {
  return pushComposite.useSelection(...args)
}

// ============================================================================
// BROWSER API HOOKS - Client-side push notification support detection
// ============================================================================

/**
 * Hook to check if push notifications are supported in the browser.
 * Checks for Service Worker, PushManager, and Notification API support.
 * @returns true if push notifications are fully supported
 * @example const isSupported = usePushNotificationSupport()
 */
export function usePushNotificationSupport(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Hook to get the current notification permission state.
 * @returns 'granted', 'denied', 'default', or 'unsupported'
 * @example const permission = useNotificationPermission()
 */
export function useNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Composite hook that combines browser support checking with server-side data.
 * Provides a complete interface for push notification features.
 * @example const push = usePushNotifications()
 */
export function usePushNotifications() {
  const isSupported = usePushNotificationSupport()
  const permission = useNotificationPermission()
  
  return {
    // Browser API state
    isSupported,
    permission,
    
    // Server hooks
    publicKey: usePushPublicKey(),
    subscriptions: usePushSubscriptions(),
    stats: usePushStats(),
    subscribe: usePushSubscribe(),
    unsubscribe: usePushUnsubscribe(),
    sendTest: usePushSendTest(),
  }
}

// ============================================================================
// TYPE EXPORTS - For TypeScript consumers
// ============================================================================

export type {
  RouterHooks,
  ExtractInput,
  ExtractOutput,
} from '@repo/orpc-utils/hooks'

// Infer types from the hooks for use in components
export type PushPublicKeyResult = ReturnType<typeof usePushPublicKey>
export type PushSubscriptionsResult = ReturnType<typeof usePushSubscriptions>
export type PushStatsResult = ReturnType<typeof usePushStats>
export type PushSubscribeResult = ReturnType<typeof usePushSubscribe>
export type PushUnsubscribeResult = ReturnType<typeof usePushUnsubscribe>
export type PushSendTestResult = ReturnType<typeof usePushSendTest>
