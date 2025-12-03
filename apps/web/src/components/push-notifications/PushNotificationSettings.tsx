'use client'

import { usePushNotifications, useNotificationPermission, usePushStats } from '@/hooks/usePushNotifications'
import { Button } from '@repo/ui/components/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Bell, BellOff, Send } from 'lucide-react'

/**
 * Push Notification Settings Component
 * Allows users to enable/disable push notifications and send test notifications
 */
export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendTest,
    isLoading,
    isSendingTest,
    subscriptions,
  } = usePushNotifications()

  const { permission, isGranted, requestPermission } = useNotificationPermission()
  const statsQuery = usePushStats()

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
        {isSubscribed && statsQuery.data && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-medium">Statistics</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold">{statsQuery.data.activeSubscriptions}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Subscriptions</p>
                <p className="text-2xl font-bold">{statsQuery.data.totalSubscriptions}</p>
              </div>
            </div>
            {statsQuery.data.devices.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Your Devices</p>
                <ul className="space-y-1">
                  {statsQuery.data.devices.map((device, index) => (
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
