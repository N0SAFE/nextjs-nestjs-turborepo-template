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
      return false;
    }
  }
  
  // Keep all non-API matchers (fonts, images, static assets, etc.)
  return true;
});

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
