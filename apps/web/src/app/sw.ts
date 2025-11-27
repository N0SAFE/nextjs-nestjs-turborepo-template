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
