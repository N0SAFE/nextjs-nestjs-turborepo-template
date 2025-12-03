'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { toast } from 'sonner'

/**
 * Push Notifications hooks for managing web push notifications
 * 
 * These hooks provide comprehensive push notification management:
 * - Checking browser support for push notifications
 * - Subscribing/unsubscribing to notifications
 * - Getting user's VAPID public key
 * - Managing active subscriptions
 * - Sending test notifications
 * - Getting notification statistics
 */

// Helper to convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Helper to get device name from user agent
function getDeviceName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Unknown Browser'
}

/**
 * Hook to check if push notifications are supported in the browser
 */
export function usePushNotificationSupport() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [])

  return { isSupported }
}

/**
 * Hook to get user's VAPID public key
 */
export function useVapidPublicKey() {
  return useQuery(
    orpc.push.getPublicKey.queryOptions({
      input: {},
      staleTime: 1000 * 60 * 60, // 1 hour - VAPID keys don't change often
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    })
  )
}

/**
 * Hook to get user's active push subscriptions
 */
export function usePushSubscriptions() {
  return useQuery(
    orpc.push.getSubscriptions.queryOptions({
      input: {},
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
    })
  )
}

/**
 * Hook to get push notification statistics
 */
export function usePushStats() {
  return useQuery(
    orpc.push.getStats.queryOptions({
      input: {},
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    })
  )
}

/**
 * Hook to subscribe to push notifications
 */
export function useSubscribePushNotifications() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.push.subscribe.mutationOptions({
      onSuccess: () => {
        // Invalidate subscriptions and stats queries
        void queryClient.invalidateQueries({
          queryKey: orpc.push.getSubscriptions.queryKey({ input: {} }),
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.push.getStats.queryKey({ input: {} }),
        })
        toast.success('Successfully subscribed to push notifications')
      },
      onError: (error: Error) => {
        toast.error(`Failed to subscribe: ${error.message}`)
      },
    })
  )
}

/**
 * Hook to unsubscribe from push notifications
 */
export function useUnsubscribePushNotifications() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.push.unsubscribe.mutationOptions({
      onSuccess: () => {
        // Invalidate subscriptions and stats queries
        void queryClient.invalidateQueries({
          queryKey: orpc.push.getSubscriptions.queryKey({ input: {} }),
        })
        void queryClient.invalidateQueries({
          queryKey: orpc.push.getStats.queryKey({ input: {} }),
        })
        toast.success('Successfully unsubscribed from push notifications')
      },
      onError: (error: Error) => {
        toast.error(`Failed to unsubscribe: ${error.message}`)
      },
    })
  )
}

/**
 * Hook to send a test push notification
 */
export function useSendTestNotification() {
  return useMutation(
    orpc.push.sendTestNotification.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `Test notification sent to ${String(result.success)} of ${String(result.total)} devices`
        )
      },
      onError: (error: Error) => {
        toast.error(`Failed to send test notification: ${error.message}`)
      },
    })
  )
}

/**
 * Main hook for managing push notifications
 * Provides complete push notification management functionality
 */
export function usePushNotifications() {
  const { isSupported } = usePushNotificationSupport()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null)

  const publicKeyQuery = useVapidPublicKey()
  const subscriptionsQuery = usePushSubscriptions()
  const subscribeM = useSubscribePushNotifications()
  const unsubscribeM = useUnsubscribePushNotifications()
  const sendTestM = useSendTestNotification()

  // Check current subscription status
  useEffect(() => {
    if (!isSupported) return

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setCurrentSubscription(subscription)
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking push subscription:', error)
      }
    }

    void checkSubscription()
  }, [isSupported])

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in your browser')
      return
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Notification permission denied')
        return
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Get public key
      const { publicKey } = publicKeyQuery.data ?? { publicKey: '' }
      if (!publicKey) {
        throw new Error('Failed to get VAPID public key')
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: String(urlBase64ToUint8Array(publicKey)),
      })

      // Send subscription to server
      await subscribeM.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.toJSON().keys?.p256dh ?? '',
          auth: subscription.toJSON().keys?.auth ?? '',
        },
        deviceName: getDeviceName(),
        userAgent: navigator.userAgent,
      })

      setCurrentSubscription(subscription)
      setIsSubscribed(true)
    } catch (error) {
      console.error('Failed to subscribe:', error)
      toast.error('Failed to subscribe to notifications')
    }
  }, [isSupported, publicKeyQuery.data, subscribeM])

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!currentSubscription) return

    try {
      // Unsubscribe on server
      await unsubscribeM.mutateAsync({
        endpoint: currentSubscription.endpoint,
      })

      // Unsubscribe locally
      await currentSubscription.unsubscribe()
      setCurrentSubscription(null)
      setIsSubscribed(false)
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      toast.error('Failed to unsubscribe from notifications')
    }
  }, [currentSubscription, unsubscribeM])

  /**
   * Send a test notification
   */
  const sendTest = useCallback(async () => {
    try {
      await sendTestM.mutateAsync({})
    } catch (error) {
      console.error('Failed to send test notification:', error)
    }
  }, [sendTestM])

  return {
    // State
    isSupported,
    isSubscribed,
    subscription: currentSubscription,

    // Actions
    subscribe,
    unsubscribe,
    sendTest,

    // Loading states
    isLoading: publicKeyQuery.isLoading || subscribeM.isPending || unsubscribeM.isPending,
    isSendingTest: sendTestM.isPending,

    // Queries
    subscriptions: subscriptionsQuery.data?.subscriptions ?? [],
    publicKey: publicKeyQuery.data?.publicKey,

    // Refetch
    refetch: () => {
      void subscriptionsQuery.refetch()
    },
  }
}

/**
 * Hook for notification permission status
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }, [])

  return {
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    requestPermission,
  }
}
