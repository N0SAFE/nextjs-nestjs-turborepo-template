# PWA Installation Guide for Next.js 16+ with Turbopack

This guide documents how to set up a Progressive Web App (PWA) using `@serwist/turbopack` in a Next.js 16+ application with Turbopack enabled.

> **Important**: This setup uses `@serwist/turbopack` (preview version), which is specifically designed for Turbopack compatibility. The older `@serwist/next` package does NOT support Turbopack.

## Prerequisites

- Next.js 16.0.0+ with Turbopack
- `cacheComponents: true` compatibility (Next.js 16+)
- Package manager: bun/npm/pnpm/yarn

## Table of Contents

1. [Install Dependencies](#1-install-dependencies)
2. [Configure next.config.ts](#2-configure-nextconfigts)
3. [Create Service Worker](#3-create-service-worker)
4. [Create Route Handler](#4-create-route-handler)
5. [Create Serwist Client Export](#5-create-serwist-client-export)
6. [Update Root Layout](#6-update-root-layout)
7. [Create Offline Page](#7-create-offline-page)
8. [Create PWA Manifest](#8-create-pwa-manifest)
9. [Add PWA Components (Optional)](#9-add-pwa-components-optional)
10. [Verification](#10-verification)

---

## 1. Install Dependencies

```bash
# Using bun
bun add @serwist/turbopack@^10.0.0-preview.14 serwist@10.0.0-preview.14 esbuild-wasm@^0.25.0

# Using npm
npm install @serwist/turbopack@^10.0.0-preview.14 serwist@10.0.0-preview.14 esbuild-wasm@^0.25.0

# Using pnpm
pnpm add @serwist/turbopack@^10.0.0-preview.14 serwist@10.0.0-preview.14 esbuild-wasm@^0.25.0
```

> **Critical**: The `serwist` version MUST match `@serwist/turbopack` version exactly (both must be `10.0.0-preview.14`). `esbuild-wasm` is required for service worker bundling.

---

## 2. Configure next.config.ts

Add `esbuild-wasm` to `serverExternalPackages`:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... your existing config
  
  // Required for @serwist/turbopack
  serverExternalPackages: ["esbuild-wasm"],
  
  // Other recommended settings
  experimental: {
    // ... your experimental settings
  },
};

export default nextConfig;
```

---

## 3. Create Service Worker

Create `app/sw.ts`:

```typescript
// app/sw.ts
import {
  createSerwist,
  addEventListeners,
  RuntimeCache,
  defaultCache,
} from "serwist";
import type { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SERWIST__: Serwist;
    __SW_MANIFEST: Array<{ url: string; revision: string | null }>;
  }
}

// Cast self to the correct type for service worker context
const sw = self as unknown as WorkerGlobalScope & typeof globalThis;

// Initialize Serwist with runtime caching
sw.__SERWIST__ = createSerwist({
  runtimeCaching: new RuntimeCache(defaultCache, {
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
  }),
  precacheEntries: sw.__SW_MANIFEST,
});

// Add standard service worker event listeners
addEventListeners(sw.__SERWIST__);
```

---

## 4. Create Route Handler

Create `app/serwist/[path]/route.ts`:

> **Note**: This route handler serves the compiled service worker files. Due to Next.js 16's `cacheComponents: true`, we cannot export `dynamic`, `dynamicParams`, or `revalidate` - only `GET` and `generateStaticParams` are allowed.

```typescript
// app/serwist/[path]/route.ts
import { serwist } from "@serwist/turbopack";
import type { NextRequest } from "next/server";

// Initialize Serwist with the service worker source file
const handler = await serwist({
  swSrc: "app/sw.ts",
});

// Valid paths that can be served
const map = new Map([
  ["sw.js", true],
  ["sw.js.map", true],
]);

/**
 * Handle GET requests for service worker files
 */
export const GET = (
  request: NextRequest,
  context: { params: Promise<{ path: string }> }
) => {
  return handler(request, context);
};

/**
 * Generate static params for build-time generation
 * Note: Uses try-catch due to potential Iterator.map compatibility issues
 */
export const generateStaticParams = () => {
  try {
    // Try the modern approach
    const keys = Array.from(map.keys());
    return keys.map((path) => ({ path }));
  } catch {
    // Fallback for environments where Iterator methods aren't available
    const paths: { path: string }[] = [];
    map.forEach((_, key) => {
      paths.push({ path: key });
    });
    return paths;
  }
};
```

---

## 5. Create Serwist Client Export

Create `lib/serwist-client.ts`:

> **Why?** The `SerwistProvider` must be used in client components, so we create a clean re-export with the `"use client"` directive.

```typescript
// lib/serwist-client.ts
"use client";

export { SerwistProvider } from "@serwist/turbopack/react";
```

---

## 6. Update Root Layout

Wrap your app with `SerwistProvider` in `app/layout.tsx`:

```tsx
// app/layout.tsx
import { SerwistProvider } from "@/lib/serwist-client";
// ... other imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">
          {/* Your app content */}
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
```

---

## 7. Create Offline Page

Create `app/~offline/page.tsx`:

> **Important**: The offline page uses a tilde (`~`) prefix to avoid routing conflicts. This path must match the `fallbacks.entries[].url` in your service worker.

```tsx
// app/~offline/page.tsx
"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">You&apos;re Offline</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          It seems you&apos;ve lost your internet connection. Please check your
          network settings and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

---

## 8. Create PWA Manifest

Create `public/site.webmanifest`:

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "description": "Your app description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [],
  "shortcuts": [
    {
      "name": "Home",
      "short_name": "Home",
      "url": "/",
      "icons": [
        {
          "src": "/icons/icon-192x192.png",
          "sizes": "192x192"
        }
      ]
    }
  ],
  "categories": ["productivity"],
  "prefer_related_applications": false
}
```

### Required Icons

Create the following icons in `public/icons/`:
- `icon-192x192.png` (192x192px)
- `icon-512x512.png` (512x512px)
- `icon-maskable-192x192.png` (192x192px, maskable format with safe zone)
- `icon-maskable-512x512.png` (512x512px, maskable format with safe zone)
- `apple-touch-icon.png` (180x180px, for iOS)

---

## 9. Add PWA Components (Optional)

### Install Prompt Component

Create `components/pwa/InstallPrompt.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("Installation failed:", error);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4">
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">Install App</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Install our app for a better experience with offline support.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={handleInstall} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Install
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Update Notification Component

Create `components/pwa/UpdateNotification.tsx`:

```tsx
"use client";

import { useSerwistProvider } from "@serwist/turbopack/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";

export function UpdateNotification() {
  const serwist = useSerwistProvider();
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (!serwist) return;

    const handleUpdate = () => {
      setShowUpdate(true);
    };

    // Listen for service worker updates
    if (serwist.registration) {
      serwist.registration.addEventListener("updatefound", () => {
        const newWorker = serwist.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              handleUpdate();
            }
          });
        }
      });
    }
  }, [serwist]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-top-4">
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">Update Available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A new version is available. Refresh to update.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={handleRefresh} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Add Components to Layout

```tsx
// In app/layout.tsx, inside the SerwistProvider:
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";

// Inside the body:
<SerwistProvider swUrl="/serwist/sw.js">
  {children}
  <InstallPrompt />
  <UpdateNotification />
</SerwistProvider>
```

---

## 10. Verification

### Build the Application

```bash
# Build with Turbopack (Next.js 16+)
bun run build
# or
next build --turbopack
```

### Expected Output

You should see output similar to:
```
(serwist) 99 precache entries
```

### Test the PWA

1. **Start production server:**
   ```bash
   bun run start
   # or
   next start
   ```

2. **Open browser DevTools** → Application tab

3. **Check Service Workers:**
   - Service worker should be registered
   - URL should be `/serwist/sw.js`

4. **Check Manifest:**
   - Manifest should load correctly
   - All icons should be accessible

5. **Test Offline:**
   - Enable airplane mode / disable network
   - Refresh the page
   - The offline page should appear

6. **Test Install:**
   - In Chrome, look for the install icon in the address bar
   - Or check the "Install" option in the browser menu

---

## Directory Structure

```
app/
├── layout.tsx           # Root layout with SerwistProvider
├── sw.ts                # Service worker source
├── serwist/
│   └── [path]/
│       └── route.ts     # Route handler for SW files
└── ~offline/
    └── page.tsx         # Offline fallback page

lib/
└── serwist-client.ts    # Client re-export for SerwistProvider

components/
└── pwa/
    ├── InstallPrompt.tsx       # (optional)
    └── UpdateNotification.tsx  # (optional)

public/
├── site.webmanifest     # PWA manifest
└── icons/
    ├── icon-192x192.png
    ├── icon-512x512.png
    ├── icon-maskable-192x192.png
    ├── icon-maskable-512x512.png
    └── apple-touch-icon.png
```

---

## Troubleshooting

### Common Issues

1. **sw.js returns 404**
   - Ensure `app/serwist/[path]/route.ts` exists
   - Check that `@serwist/turbopack` is installed (not `@serwist/next`)
   - Verify `esbuild-wasm` is in `serverExternalPackages`

2. **Build fails with "cacheComponents" error**
   - Remove `export const dynamic`, `export const dynamicParams`, `export const revalidate` from route.ts
   - Only `GET` and `generateStaticParams` exports are allowed

3. **"i.keys.map is not a function" error**
   - Use the try-catch fallback in `generateStaticParams` as shown above

4. **ServiceWorkerGlobalScope type error**
   - Use `WorkerGlobalScope` instead of `ServiceWorkerGlobalScope`
   - Cast with `as unknown as WorkerGlobalScope & typeof globalThis`

5. **Versions mismatch error**
   - Ensure `serwist` and `@serwist/turbopack` versions match exactly

---

## Notes

- This setup uses **preview versions** of `@serwist/turbopack` (as of January 2025)
- The API may change when stable versions are released
- Monitor [Serwist GitHub](https://github.com/serwist/serwist) for updates
- For non-Turbopack setups, use `@serwist/next` instead

---

## References

- [Serwist Documentation](https://serwist.pages.dev/)
- [Serwist Turbopack Example](https://github.com/serwist/serwist/tree/main/examples/next-turbo-basic)
- [Next.js PWA Guide](https://nextjs.org/docs/app/building-your-application/optimizing/progressive-web-apps)
