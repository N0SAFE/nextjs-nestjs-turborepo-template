# Service Worker Fix Verification Guide

## Overview
This document explains how to verify that the service worker fixes for double requests and authentication issues are working correctly.

## Issues Fixed

### Issue 1: React Query Cache Bypass
**Problem**: The service worker was using `NetworkFirst` strategy for API routes, causing network requests even when React Query had cached data.

**Fix**: Filtered out all API route matchers from the service worker cache configuration, allowing React Query to handle API caching independently.

### Issue 2: Double Authentication Requests
**Problem**: Authenticated API requests were being intercepted by the service worker, causing:
- First request from service worker cache check (missing auth headers)
- Second request from the actual fetch (with proper auth headers)

**Fix**: By removing API routes from service worker caching, requests go directly to the network with proper credentials attached from the start.

## Verification Steps

### 1. Build and Start the Application

```bash
# Start the development environment with Docker
bun run dev

# Or start production build
bun run build
bun run start
```

### 2. Open Browser DevTools

1. Open the application in Chrome/Edge/Firefox
2. Open DevTools (F12)
3. Go to the **Network** tab
4. Enable "Preserve log" to see all requests across page loads

### 3. Test API Request Behavior

#### Before the Fix (Expected Old Behavior)
- Each API request would appear twice in the Network tab
- First request: Intercepted by service worker, may show as "(from ServiceWorker)"
- Second request: Actual network request
- Authentication might fail on first request

#### After the Fix (Expected New Behavior)
- Each API request should appear ONCE in the Network tab
- No "(from ServiceWorker)" label on API requests
- Authentication headers present from the start
- React Query cache controls when requests are made

### 4. Check Service Worker Registration

1. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Select **Service Workers** in the sidebar
3. Verify the service worker is registered and running
4. Check the service worker source shows our filtered cache configuration

### 5. Test Authenticated Requests

```javascript
// In browser console, test an authenticated API call
fetch('/api/auth/session', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Expected Result**:
- Only ONE request in Network tab
- Request includes authentication cookies
- No 401 Unauthorized errors
- Response returns session data if authenticated

### 6. Test React Query Caching

1. Navigate to a page that uses React Query (e.g., `/showcase/client`)
2. Wait for data to load
3. Check Network tab - should see API request
4. Navigate away and back to the same page
5. Check Network tab again

**Expected Result**:
- First visit: Network request made
- Second visit: No new network request (React Query serves from cache)
- Service worker does NOT intercept or cache the API request

### 7. Test Static Asset Caching

1. Clear the Network tab
2. Reload the page (Ctrl/Cmd + R)
3. Check Network tab for static assets (images, CSS, JS)

**Expected Result**:
- Static assets should show "(from ServiceWorker)" or "from disk cache"
- This confirms service worker still caches non-API resources
- Offline functionality for static assets is preserved

### 8. Test Offline Behavior

1. Load the application while online
2. Open DevTools Network tab
3. Select "Offline" in the network throttling dropdown
4. Try to reload the page

**Expected Result**:
- Static assets (HTML, CSS, JS, images) load from service worker cache
- Page displays offline fallback or cached content
- API requests fail gracefully (as expected - they shouldn't be cached)

## Network Tab Inspection

### What to Look For

#### API Requests (should NOT be cached by SW)
```
Name: /api/auth/session
Status: 200
Size: 1.2 KB
Time: 45 ms
Initiator: fetch
Type: fetch
```

#### Static Assets (should be cached by SW)
```
Name: /_next/static/chunks/main.js
Status: 200 (from ServiceWorker)
Size: (ServiceWorker)
Time: 2 ms
Initiator: script
Type: script
```

### Common Issues

#### If you see double API requests:
- Check that the service worker has been updated
- Try unregistering old service workers in Application → Service Workers
- Hard refresh (Ctrl/Cmd + Shift + R)
- Clear cache and reload

#### If authentication fails:
- Verify cookies are being sent with requests
- Check Network tab for "Cookie" header in request
- Ensure `credentials: 'include'` is set in fetch calls

#### If static assets don't cache:
- Check service worker is active and running
- Verify the filter in sw.ts isn't too aggressive
- Check browser console for service worker errors

## Automated Testing

Run the unit tests to verify the cache configuration logic:

```bash
cd apps/web
bun run test src/app/__tests__/sw.test.ts
```

**Expected Output**:
```
✓ Service Worker Cache Configuration
  ✓ should filter out API route matchers from cache
  ✓ should keep static asset matchers in cache
  ✓ should verify API routes are excluded from our custom cache
```

## Code Changes Reference

### Modified File: `apps/web/src/app/sw.ts`

**Key Changes**:
1. Added `customCache` variable that filters `defaultCache`
2. Filter removes entries where matcher matches API routes
3. Uses `customCache` instead of `defaultCache` in RuntimeCache
4. Static assets (images, fonts, CSS, JS) remain cached

**Filter Logic**:
```typescript
const customCache = defaultCache.filter((entry) => {
  // Test if matcher would match API routes
  // Return false to exclude from cache
  // Return true to include in cache
})
```

## Success Criteria

✅ **API Requests**:
- Appear only once in Network tab
- Include authentication headers from the start
- Not intercepted by service worker
- React Query controls caching behavior

✅ **Static Assets**:
- Cached by service worker
- Show "(from ServiceWorker)" in Network tab
- Work offline

✅ **React Query**:
- Cache works independently of service worker
- No duplicate network requests
- Proper cache invalidation

✅ **Authentication**:
- No double requests
- No 401 errors on first request
- Session data loads correctly

## Rollback Plan

If issues occur, revert to default cache:

```typescript
// In apps/web/src/app/sw.ts
const runtimeCache = new RuntimeCache(defaultCache, {
  // ... existing options
})
```

Then test if the original issues return to confirm the fix was the cause.

## Performance Monitoring

### Metrics to Track

1. **Request Count**: API requests should be cut in half
2. **Authentication Errors**: 401 errors should decrease or disappear
3. **Page Load Time**: Should improve due to fewer redundant requests
4. **React Query Cache Hit Rate**: Should remain unchanged or improve

### Using Browser DevTools Performance Tab

1. Record a session with page navigation
2. Check Network activity
3. Verify API requests occur only when React Query makes them
4. Confirm no duplicate fetch calls

## Additional Notes

### Service Worker Update Behavior

- `skipWaiting: true` means the service worker activates immediately
- `clientsClaim: true` means it takes control of pages immediately
- After updating sw.ts, the new service worker should activate on next page load
- May need to close all tabs and reopen to force update in some browsers

### Browser Compatibility

This fix works with:
- Chrome/Edge (Chromium-based browsers)
- Firefox
- Safari (with service worker support)

### Production Deployment

When deploying to production:
1. Ensure all environment variables are set
2. Build with `bun run build`
3. Service worker will be generated during build
4. Test in production environment before full rollout
5. Monitor error logs for any service worker issues

## Questions or Issues?

If you encounter problems with the service worker fix:
1. Check browser console for errors
2. Review Network tab for request patterns
3. Verify service worker is active
4. Check this verification guide for common issues
5. Create an issue in the repository with:
   - Browser and version
   - Network tab screenshots
   - Console errors
   - Steps to reproduce
