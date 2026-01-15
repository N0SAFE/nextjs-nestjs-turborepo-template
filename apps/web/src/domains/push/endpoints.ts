import { orpc } from '@/lib/orpc'

/**
 * Push notification domain endpoints
 * 
 * All push notification endpoints use ORPC contracts directly.
 * Handles web push notifications with VAPID.
 */
export const pushEndpoints = {
  /**
   * Get VAPID public key for push subscriptions
   */
  getPublicKey: orpc.push.getPublicKey,
  
  /**
   * Get list of push notification subscriptions
   */
  getSubscriptions: orpc.push.getSubscriptions,
  
  /**
   * Get push notification statistics
   */
  getStats: orpc.push.getStats,
  
  /**
   * Subscribe to push notifications
   */
  subscribe: orpc.push.subscribe,
  
  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: orpc.push.unsubscribe,
  
  /**
   * Send test push notification
   */
  sendTestNotification: orpc.push.sendTestNotification,
} as const

export type PushEndpoints = typeof pushEndpoints
