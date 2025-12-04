/* eslint-disable */
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

/**
 * Custom cache configuration that excludes API routes to prevent double requests
 * and authentication issues.
 * 
 * Problem:
 * - Service worker's NetworkFirst/NetworkOnly strategies intercept API requests
 * - This causes double requests: one from SW cache check, one from React Query
 * - First request may lack proper authentication headers
 * - React Query's cache becomes ineffective as SW makes network calls anyway
 * 
 * Solution:
 * - Filter out all API route matchers from defaultCache
 * - Let React Query handle API caching and authentication
 * - Keep SW caching only for static assets (images, fonts, CSS, JS)
 */
const customCache = defaultCache.filter((entry) => {
  // Remove any cache entries that match API routes
  // This includes:
  // - /api/auth/* routes
  // - /api/* routes (both sameOrigin and external)
  // - Any matcher function that checks for /api/ in pathname
  
  if (typeof entry.matcher === 'function') {
    // Test the matcher with a mock API request to see if it would match
    const testApiRequest = {
      request: new Request('http://localhost:3000/api/test', {
        headers: new Headers()
      }),
      url: new URL('http://localhost:3000/api/test'),
      sameOrigin: true,
    };
    
    try {
      const matches = entry.matcher(testApiRequest as any);
      // If this matcher would match an API route, exclude it
      if (matches) {
        console.log('[SW] Filtered out API route matcher (function)');
        return false;
      }
    } catch (e) {
      // If matcher throws, keep it (likely not an API matcher)
    }
  } else if (entry.matcher instanceof RegExp) {
    // Check if regex would match API routes
    if (entry.matcher.test('/api/auth/session') || 
        entry.matcher.test('/api/users') ||
        entry.matcher.test('/api/nest/health')) {
      console.log('[SW] Filtered out API route matcher (regex):', entry.matcher);
      return false;
    }
  }
  
  // Keep all non-API matchers (fonts, images, static assets, etc.)
  return true;
});

console.log('[SW] Custom cache initialized with', customCache.length, 'entries (filtered from', defaultCache.length, 'default entries)');

// Create RuntimeCache extension with filtered caching strategies
const runtimeCache = new RuntimeCache(customCache, {
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
