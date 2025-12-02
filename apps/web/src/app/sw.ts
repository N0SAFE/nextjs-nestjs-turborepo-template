import {
  createSerwist,
  RuntimeCache,
  addEventListeners,
} from "serwist";
import { defaultCache } from "@serwist/turbopack/worker";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: { url: string; revision: string | null }[];
  }
}

// Cast self to the correct type for service worker context
const sw = self as unknown as WorkerGlobalScope & typeof globalThis;

// Create RuntimeCache extension with default caching strategies
const runtimeCache = new RuntimeCache(defaultCache, {
  warmEntries: ["/~offline"],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Initialize Serwist with runtime caching and precache entries
const serwist = createSerwist({
  precache: {
    entries: sw.__SW_MANIFEST,
  },
  skipWaiting: true,
  clientsClaim: true,
  extensions: [runtimeCache],
});

// Add standard service worker event listeners
addEventListeners(serwist);

// ============================================================================
// Push Notifications Support
// ============================================================================

/**
 * Handle incoming push notifications
 */
sw.addEventListener('push', (event: any) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    (self as any).registration.showNotification(data.title || 'Notification', options)
  );
});

/**
 * Handle notification clicks
 */
sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  // Get the URL to open from notification data
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    (self as any).clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList: any[]) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(urlToOpen);
        }
      })
  );
});
