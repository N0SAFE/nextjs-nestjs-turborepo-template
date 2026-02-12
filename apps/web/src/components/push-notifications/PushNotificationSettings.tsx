'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  usePushActions,
  usePushNotifications,
} from '@/domains/push/hooks'
import { logger } from '@repo/logger'
import { Button } from '@repo/ui/components/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Bell, BellOff, Send } from 'lucide-react'
import { usePushNotificationSupport } from '@/domains/push/utils'

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
 * Push Notification Settings Component
 * Allows users to enable/disable push notifications and send test notifications
 */
export function PushNotificationSettings() {
  // Use composite hook for all push notification functionality
  const push = usePushNotifications()
  const actions = usePushActions()
  const isSupported = usePushNotificationSupport()
  
  // Track notification permission state
  const [permission, setPermission] = useState<NotificationPermission>('default')

  // Update permission state on mount and when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
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

  const isGranted = permission === 'granted'

  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null)

  // Check current subscription status
  useEffect(() => {
    if (!isSupported) return

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const browserSubscription = await registration.pushManager.getSubscription()
        
        const backendSubscriptions = push.subscriptions?.subscriptions ?? []
        const isBackendSubscribed = browserSubscription
          ? backendSubscriptions.some((sub) => sub.endpoint === browserSubscription.endpoint)
          : false
        
        if (browserSubscription && !isBackendSubscribed) {
          setIsSubscribed(false)
          setCurrentSubscription(null)
        } else {
          setCurrentSubscription(browserSubscription)
          setIsSubscribed(isBackendSubscribed)
        }
      } catch (error) {
        logger.error('Error checking push subscription', { error })
      }
    }

    void checkSubscription()
  }, [isSupported, push.subscriptions])

  // Subscribe action
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in your browser')
      return
    }

    try {
      const permissionResult = await Notification.requestPermission()
      if (permissionResult !== 'granted') {
        toast.error('Notification permission denied')
        return
      }

      const registration = await navigator.serviceWorker.getRegistration('/')
      if (!registration) {
        throw new Error('Service worker not registered')
      }
      await navigator.serviceWorker.ready

      const { publicKey } = push.publicKey ?? { publicKey: '' }
      if (!publicKey) {
        throw new Error('Failed to get VAPID public key')
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      await actions.subscribe.mutateAsync({
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
      logger.error('Failed to subscribe', { error })
      toast.error('Failed to subscribe to notifications')
    }
  }, [isSupported, push.publicKey, actions.subscribe])

  // Unsubscribe action
  const unsubscribe = useCallback(async () => {
    if (!currentSubscription) return

    try {
      await actions.unsubscribe.mutateAsync({
        endpoint: currentSubscription.endpoint,
      })

      await currentSubscription.unsubscribe()
      setCurrentSubscription(null)
      setIsSubscribed(false)
    } catch (error) {
      logger.error('Failed to unsubscribe', { error })
      toast.error('Failed to unsubscribe from notifications')
    }
  }, [currentSubscription, actions.unsubscribe])

  // Send test notification
  const sendTest = useCallback(async () => {
    try {
      await actions.sendTest.mutateAsync({})
    } catch (error) {
      logger.error('Failed to send test notification', { error })
    }
  }, [actions.sendTest])

  const isLoading = push.isLoading.publicKey || actions.subscribe.isPending || actions.unsubscribe.isPending
  const isSendingTest = actions.sendTest.isPending
  const subscriptions = push.subscriptions?.subscriptions ?? []

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Manage your push notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Permission Status</p>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' && '✓ Granted'}
              {permission === 'denied' && '✗ Denied'}
              {permission === 'default' && 'Not yet requested'}
            </p>
          </div>
          {permission === 'default' && (
            <Button onClick={() => {void requestPermission()}} variant="outline">
              Request Permission
            </Button>
          )}
        </div>

        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Subscription Status</p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'Subscribed' : 'Not subscribed'}
            </p>
          </div>
          {isGranted && (
            <Button
              onClick={() => {void (isSubscribed ? unsubscribe() : subscribe())}}
              disabled={isLoading}
              variant={isSubscribed ? 'destructive' : 'default'}
            >
              {isLoading ? (
                'Loading...'
              ) : isSubscribed ? (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Disable Notifications
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Notifications
                </>
              )}
            </Button>
          )}
        </div>

        {/* Statistics */}
        {isSubscribed && push.stats && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-medium">Statistics</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold">{push.stats.activeSubscriptions}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Subscriptions</p>
                <p className="text-2xl font-bold">{push.stats.totalSubscriptions}</p>
              </div>
            </div>
            {push.stats.devices.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Your Devices</p>
                <ul className="space-y-1">
                  {push.stats.devices.map((device, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {device.deviceName} - Last used:{' '}
                      {new Date(device.lastUsed).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Test Notification */}
        {isSubscribed && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Test Notification</p>
              <p className="text-sm text-muted-foreground">
                Send a test notification to all your devices
              </p>
            </div>
            <Button
              onClick={() => {void sendTest()}}
              disabled={isSendingTest}
              variant="outline"
            >
              {isSendingTest ? (
                'Sending...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </div>
        )}

        {/* Active Subscriptions List */}
        {subscriptions.length > 0 && (
          <div className="pt-4 border-t">
            <p className="font-medium mb-2">Active Subscriptions</p>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="text-sm p-2 rounded-lg bg-muted"
                >
                  <p className="font-medium">{sub.deviceName ?? 'Unknown Device'}</p>
                  <p className="text-xs text-muted-foreground">
                    {sub.userAgent && sub.userAgent.length > 50
                      ? sub.userAgent.substring(0, 50) + '...'
                      : sub.userAgent ?? 'No user agent'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
