// ============================================================================
// BROWSER API HOOKS
// ============================================================================

/**
 * Hook to check if push notifications are supported in the browser
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
 * Hook to get the current notification permission state
 */
export function useNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}