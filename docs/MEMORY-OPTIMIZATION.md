# Memory Optimization for Docker Development

This document explains the memory optimization fixes applied to resolve ENOMEM errors during Docker development.

## Issue Description

The development Docker environment was experiencing memory exhaustion (ENOMEM errors) caused by the `declarative-routing build --watch` process running concurrently with Next.js development server. This watch process would consume excessive memory while monitoring file changes, causing the container to crash with:

```
ENOMEM: not enough memory, read
```

## Solution Applied

### 1. Disabled Watch Mode in Docker

Modified `apps/web/package.json` to remove the concurrent declarative-routing watch process from the Docker development script:

**Before:**
```json
"dev:docker": "concurrently --kill-others-on-fail -n next,routing -c green,magenta \"envcli cross-env NODE_OPTIONS='--inspect' next dev -H 0.0.0.0 -p $:{NEXT_PUBLIC_APP_PORT} --turbopack\" \"bun --bun dr:build:watch\""
```

**After:**
```json
"dev:docker": "bun --bun dr:build && envcli cross-env NODE_OPTIONS='--inspect' next dev -H 0.0.0.0 -p $:{NEXT_PUBLIC_APP_PORT} --turbopack"
```

### 2. Added Memory Limits to Docker Containers

Updated `docker-compose.yml` to include memory limits for development containers:

```yaml
# Web container
web-dev:
  mem_limit: 4g
  memswap_limit: 4g

# API container  
api-dev:
  mem_limit: 2g
  memswap_limit: 2g
```

## Impact and Trade-offs

### Benefits
- ✅ **Eliminates ENOMEM errors** - Docker development environment starts reliably
- ✅ **Faster startup time** - No concurrent watch process during container initialization
- ✅ **Better resource management** - Memory limits prevent runaway processes
- ✅ **Stable development** - Containers no longer crash due to memory exhaustion

### Trade-offs
- ❌ **Manual route building** - Declarative routes need to be rebuilt manually when route structure changes
- ❌ **No automatic route watching** - Changes to `page.info.ts` files require manual intervention

## When to Rebuild Routes

You need to manually rebuild declarative routes when:

1. **Adding new pages** with `page.tsx` files
2. **Modifying route parameters** in existing pages
3. **Changing `page.info.ts` files** that define route metadata
4. **Adding or removing API routes**

## Manual Route Building Commands

```bash
# Build routes once (recommended for Docker development)
bun run web -- dr:build

# Build routes with watch mode (only for local development)
bun run web -- dr:build:watch
```

## Alternative: Local Development with Watch Mode

If you need automatic route rebuilding, consider using local development instead of Docker:

```bash
# Stop Docker
docker-compose down

# Run locally with watch mode
bun run dev:local
```

This runs both the Next.js server and declarative-routing watch process on your local machine where memory constraints are typically less restrictive.

## Memory Monitoring

To monitor container memory usage:

```bash
# Check container stats
docker stats

# Check specific container memory
docker stats nextjs-directus-web-dev --no-stream
```

## Future Improvements

Potential optimizations for re-enabling watch mode:

1. **Increase Docker memory allocation** for your Docker Desktop/Engine
2. **Optimize declarative-routing configuration** to watch fewer files
3. **Use alternative file watching strategies** that consume less memory
4. **Implement selective watching** only for specific directories

## Reverting Changes

To re-enable watch mode (if memory issues are resolved):

```json
"dev:docker": "concurrently --kill-others-on-fail -n next,routing -c green,magenta \"envcli cross-env NODE_OPTIONS='--inspect' next dev -H 0.0.0.0 -p $:{NEXT_PUBLIC_APP_PORT} --turbopack\" \"bun --bun dr:build:watch\""
```

**Warning:** Only revert if you have increased Docker memory limits or resolved the underlying memory consumption issue.
