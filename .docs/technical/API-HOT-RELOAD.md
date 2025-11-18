# API Hot Reload Implementation

## Overview

This document describes the implementation of automatic API restart functionality in the Docker development environment. When source files are synced to the container, the API process restarts automatically without requiring a container restart.

## Problem Statement

The original implementation used `bun src/main.ts --watch`, which had the following issues:

1. **Inconsistent file watching**: Bun's `--watch` flag was not reliably detecting file changes in Docker volume mounts
2. **Process not restarting**: When changes were detected, the entire process wasn't being properly killed and restarted
3. **Resource leaks**: Without proper shutdown handling, resources (database connections, ports) weren't being released
4. **Poor developer experience**: Developers had to manually restart containers or processes

## Solution Architecture

### Components

1. **Nodemon**: Battle-tested file watcher and process manager
2. **Docker Compose Sync**: Syncs local files to container
3. **Graceful Shutdown**: NestJS application shutdown hooks
4. **Legacy Watch Mode**: Polling-based file watching for Docker compatibility

### Flow Diagram

```
Developer saves file
    ↓
Docker Compose sync action copies file to container
    ↓
Nodemon (polling mode) detects file change
    ↓
Nodemon waits 1 second (debounce delay)
    ↓
Nodemon sends SIGTERM to current process
    ↓
NestJS receives SIGTERM
    ↓
Graceful shutdown begins:
  - Close database connections
  - Release HTTP server port
  - Clean up resources
  - Exit with code 0
    ↓
Nodemon starts new process: bun --bun src/main.ts
    ↓
NestJS application bootstraps
    ↓
API ready (2-3 seconds total)
```

## Implementation Details

### 1. Nodemon Configuration (`apps/api/nodemon.json`)

```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts", "node_modules"],
  "exec": "bun --bun src/main.ts",
  "restartable": "rs",
  "env": {
    "NODE_ENV": "development"
  },
  "delay": 1000,
  "verbose": true,
  "signal": "SIGTERM",
  "legacyWatch": true
}
```

**Key Settings:**

- `legacyWatch: true` - Uses polling instead of fsevents (required for Docker volumes)
- `delay: 1000` - 1 second debounce to avoid rapid restarts from multiple file changes
- `signal: "SIGTERM"` - Clean shutdown signal (vs SIGKILL)
- `exec: "bun --bun src/main.ts"` - Uses Bun runtime directly

### 2. Graceful Shutdown Implementation (`apps/api/src/main.ts`)

```typescript
// Enable NestJS shutdown hooks
app.enableShutdownHooks();

// Handle termination signals for graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received, starting graceful shutdown...`);
  try {
    await app.close();
    console.log('Application closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
```

**What happens during shutdown:**

1. `app.close()` called
2. HTTP server stops accepting new connections
3. Existing connections are completed (with timeout)
4. Database connection pool is drained
5. All lifecycle hooks (`onApplicationShutdown`, `beforeApplicationShutdown`) are called
6. Process exits cleanly

### 3. Package Script Update

Changed from:
```json
"start:dev": "bun --bun src/main --watch"
```

To:
```json
"start:dev": "nodemon"
```

Nodemon automatically reads `nodemon.json` configuration.

### 4. Docker Compose Configuration (Already Present)

```yaml
environment:
  - CHOKIDAR_USEPOLLING=true  # Enables polling for file watchers

develop:
  watch:
    - action: sync
      path: ../../..
      target: /app
      ignore:
        - node_modules/
        # ... other ignores
```

The `CHOKIDAR_USEPOLLING=true` environment variable ensures that both nodemon's chokidar dependency and any other file watchers use polling, which is more reliable in Docker volume mount scenarios.

## Why This Solution Works

### Nodemon Advantages

1. **Proven reliability**: Used in production by millions of Node.js developers
2. **Docker-optimized**: Legacy watch mode specifically designed for containerized environments
3. **Process management**: Properly kills and restarts entire process tree
4. **Signal handling**: Sends configurable signals (SIGTERM for graceful shutdown)
5. **Debouncing**: Built-in delay to handle rapid file changes
6. **Manual restart**: Type `rs` + Enter in console for manual restart

### Graceful Shutdown Advantages

1. **No port conflicts**: Port 3005 is properly released before restart
2. **No database connection leaks**: All connections closed properly
3. **Fast restarts**: Clean shutdown enables fast startup (2-3 seconds)
4. **No orphaned processes**: No zombie processes left behind
5. **Production-ready pattern**: Same shutdown handling used in production

### Why Not Bun's --watch?

Bun's `--watch` flag has limitations:

1. **File watching in Docker**: Uses inotify events which don't work well with Docker volume mounts
2. **Process restart**: May not kill the entire process tree properly
3. **Maturity**: Newer implementation with less battle-testing in containerized environments
4. **Shutdown handling**: No built-in graceful shutdown mechanism

## Performance Characteristics

- **File change detection**: <100ms (with polling interval)
- **Shutdown time**: 500ms-1s (graceful cleanup)
- **Startup time**: 1-2s (NestJS bootstrap)
- **Total restart time**: 2-3s (from file save to ready)

## Manual Operations

### Force Restart
```
rs [Enter]
```
Type `rs` in the terminal where the API is running and press Enter.

### View Nodemon Status
Nodemon outputs verbose logs showing:
- Files being watched
- File changes detected
- Process starts/stops

### Debugging Nodemon
```bash
# Run nodemon with debugging
DEBUG=nodemon:* nodemon
```

## Testing the Implementation

### 1. Test File Change Detection

1. Start development environment:
   ```bash
   bun run dev
   ```

2. Make a change to any file in `apps/api/src/`
   ```typescript
   // apps/api/src/main.ts
   console.log('Test change'); // Add this line
   ```

3. Save the file

4. Observe the logs:
   ```
   [nodemon] restarting due to changes...
   [nodemon] starting `bun --bun src/main.ts`
   SIGTERM received, starting graceful shutdown...
   Application closed gracefully
   🚀 NestJS API with oRPC running on port 3005
   ```

### 2. Test Rapid Changes

1. Make multiple rapid changes to different files
2. Nodemon should debounce and only restart once after 1 second
3. No multiple restarts should occur

### 3. Test Graceful Shutdown

1. Start the API
2. Establish a database connection (make an API call)
3. Trigger a restart by saving a file
4. Check that no "EADDRINUSE" or "connection pool" errors occur

## Troubleshooting

### API Not Restarting

**Check nodemon is running:**
```bash
docker exec -it nextjs-nestjs-api-dev ps aux | grep nodemon
```

**Check file sync is working:**
```bash
# Check file timestamp in container
docker exec -it nextjs-nestjs-api-dev stat /app/apps/api/src/main.ts
```

### Multiple Restarts

If you see multiple restarts for a single change:
- Check `delay` value in `nodemon.json` (increase if needed)
- Check if editor is creating multiple temporary files

### Slow Restarts

If restarts take more than 5 seconds:
- Check graceful shutdown is completing (look for "Application closed gracefully")
- Check database connection pool settings
- Verify no long-running operations blocking shutdown

### File Changes Not Detected

If changes aren't detected:
- Verify `CHOKIDAR_USEPOLLING=true` is set
- Check `legacyWatch: true` in `nodemon.json`
- Verify Docker Compose sync action is configured
- Check file is not in ignore list

## Maintenance

### When to Update

- **Nodemon version**: Update when new versions fix bugs or add features
- **Configuration**: Adjust `delay` or `watch` paths as project grows
- **Shutdown logic**: Update if adding new resources that need cleanup

### Related Files

- `apps/api/nodemon.json` - Nodemon configuration
- `apps/api/src/main.ts` - Application bootstrap and shutdown
- `apps/api/scripts/entrypoint.dev.ts` - Development entrypoint
- `docker/compose/api/docker-compose.api.dev.yml` - Docker Compose configuration
- `.docs/guides/DEVELOPMENT-WORKFLOW.md` - Developer documentation

## Comparison with Alternatives

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Nodemon** ✅ | Battle-tested, Docker-optimized, graceful restart | Extra dependency | **Best choice** |
| tsx --watch | TypeScript-native, fast | Less mature in Docker, fewer options | Good alternative |
| Bun --watch | Native to Bun, fast | Docker issues, new/immature | Not recommended for Docker |
| Custom chokidar | Full control | Maintenance burden, reinventing wheel | Overkill |
| Manual restart | No dependencies | Poor DX, error-prone | Development nightmare |

## Conclusion

The nodemon-based hot reload implementation provides:
- ✅ Reliable file watching in Docker volumes
- ✅ Proper process management and restarts
- ✅ Graceful shutdown preventing resource leaks
- ✅ Fast restart times (2-3 seconds)
- ✅ Battle-tested and maintainable solution
- ✅ Excellent developer experience

This implementation follows industry best practices and provides a robust foundation for development workflow.
