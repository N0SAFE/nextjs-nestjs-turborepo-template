# Docker File Ownership Issue - Solution

## Problem
When running `docker-compose up --build`, file ownership changes from `n0safe:n0safe` to `systemd-network:systemd-journal`. This happens because Docker containers running as different users write to bind-mounted volumes, changing the ownership on the host system.

## Root Cause
1. **API Container**: Was running as `root` user (UID 0)
2. **Web Container**: Was running as `node` user with different UID
3. **Volume Mounts**: Source code mounted as bind volumes
4. **UID Mapping**: Container user IDs don't match host user ID (1000)

## Solution Applied

### 1. Set User Override in docker-compose.yml
Added `user: "${USER_ID:-1000}:${GROUP_ID:-1000}"` to both containers:
```yaml
api-dev:
  user: "${USER_ID:-1000}:${GROUP_ID:-1000}"
  
web-dev:
  user: "${USER_ID:-1000}:${GROUP_ID:-1000}"
```

This approach:
- ✅ **Keeps Dockerfiles unchanged** - No hardcoded UIDs in development images
- ✅ **Runtime flexibility** - User ID can be changed via environment variables
- ✅ **Cross-platform compatibility** - Works on different host systems
- ✅ **No rebuilds required** - Just restart containers with new user ID

### 2. Environment Configuration
Added `.env` file with host user mapping:
```env
USER_ID=1000
GROUP_ID=1000
```

### 3. Dockerfile Structure Preserved
- **API Dockerfile**: Maintains existing `apiuser` (overridden at runtime)
- **Web Dockerfile**: Maintains existing `node` user (overridden at runtime)

## How to Apply the Fix

1. **Fix current ownership:**
   ```bash
   sudo chown -R n0safe:n0safe ./
   ```

2. **Rebuild containers:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

3. **Verify ownership is preserved:**
   ```bash
   ls -la  # Should show n0safe:n0safe ownership
   ```

## Prevention
- Always run containers with `user:` directive matching host UID/GID
- Use consistent user IDs across all containers (1000:1000)
- Avoid running containers as root when using bind mounts

## Alternative Solutions

### Option A: Use Named Volumes Instead of Bind Mounts
Replace bind mounts with named volumes for source code (less convenient for development).

### Option B: Use Docker Development Containers
Use VS Code devcontainers or similar tools that handle permissions automatically.

### Option C: Post-Build Permission Fix
Add a script that fixes permissions after container startup:
```bash
#!/bin/bash
docker-compose exec api-dev chown -R 1000:1000 /app || true
docker-compose exec web-dev chown -R 1000:1000 /app || true
```

## Verification
After applying the fix, files should maintain `n0safe:n0safe` ownership even after container operations.
