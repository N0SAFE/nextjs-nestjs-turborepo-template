/**
 * Push Notification Domain - Client Hooks
 * 
 * React hooks for web push notifications with automatic cache invalidation
 */

'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { pushEndpoints } from './endpoints'
import { pushInvalidations } from './invalidations'
import { wrapWithInvalidations } from '../shared/helpers'

// Wrap endpoints with automatic invalidation
const enhancedPush = wrapWithInvalidations(pushEndpoints, pushInvalidations)

// ============================================================================
// QUERY HOOKS (Read Operations)
// ============================================================================

/**
 * Get VAPID public key for push subscriptions
 */
export function usePushPublicKey() {
  return useQuery(pushEndpoints.getPublicKey.queryOptions())
}

/**
 * Get list of push subscriptions
 */
export function usePushSubscriptions() {
  return useQuery(pushEndpoints.getSubscriptions.queryOptions())
}

/**
 * Get push notification statistics
 */
export function usePushStats() {
  return useQuery(pushEndpoints.getStats.queryOptions())
}

// ============================================================================
// MUTATION HOOKS (Write Operations)
// ============================================================================

/**
 * Subscribe to push notifications
 * Invalidates subscriptions list after subscribing
 */
export function usePushSubscribe() {
  return useMutation(
    pushEndpoints.subscribe.mutationOptions({
      onSuccess: enhancedPush.subscribe.withInvalidationOnSuccess(),
    }),
  )
}

/**
 * Unsubscribe from push notifications
 * Invalidates subscriptions list after unsubscribing
 */
export function usePushUnsubscribe() {
  return useMutation(
    pushEndpoints.unsubscribe.mutationOptions({
      onSuccess: enhancedPush.unsubscribe.withInvalidationOnSuccess(),
    }),
  )
}

/**
 * Send test push notification
 */
export function useSendTestNotification() {
  return useMutation(pushEndpoints.sendTestNotification.mutationOptions())
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Get all push notification mutations in one hook
 */
export function usePushActions() {
  const subscribe = usePushSubscribe()
  const unsubscribe = usePushUnsubscribe()
  const sendTest = useSendTestNotification()

  return {
    subscribe,
    unsubscribe,
    sendTest,
    
    isLoading: {
      subscribe: subscribe.isPending,
      unsubscribe: unsubscribe.isPending,
      sendTest: sendTest.isPending,
    },
    
    errors: {
      subscribe: subscribe.error,
      unsubscribe: unsubscribe.error,
      sendTest: sendTest.error,
    },
  }
}

/**
 * Combined hook for complete push notification management
 */
export function usePushNotifications() {
  const publicKey = usePushPublicKey()
  const subscriptions = usePushSubscriptions()
  const stats = usePushStats()
  const actions = usePushActions()

  return {
    publicKey: publicKey.data,
    subscriptions: subscriptions.data,
    stats: stats.data,
    
    isLoading: {
      publicKey: publicKey.isLoading,
      subscriptions: subscriptions.isLoading,
      stats: stats.isLoading,
      ...actions.isLoading,
    },
    
    errors: {
      publicKey: publicKey.error,
      subscriptions: subscriptions.error,
      stats: stats.error,
      ...actions.errors,
    },
    
    actions,
  }
}
