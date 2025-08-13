# Docker Storage Management

This project can generate significant Docker storage usage due to multiple builds. Here's how to manage it:

## Current Storage Usage
Check your current Docker storage usage:
```bash
bun run docker:size
# or
docker system df
```

## Quick Cleanup (Recommended)
Run the automatic cleanup script:
```bash
bun run docker:cleanup
```

This removes:
- Unused containers
- Unused images  
- Unused build cache
- Unused networks

## Aggressive Cleanup (Use with Caution)
If you need maximum space recovery:
```bash
bun run docker:cleanup:aggressive
```

⚠️ **Warning**: This removes ALL unused images, volumes (including database data), and cache.

## Manual Cleanup Commands

### Build Cache (Usually the biggest culprit)
```bash
# Remove build cache (safe)
docker builder prune -f

# Remove ALL build cache (more aggressive)
docker builder prune -af
```

### Images
```bash
# Remove unused images
docker image prune -f

# Remove ALL unused images (including tagged ones not in use)
docker image prune -af
```

### Containers
```bash
# Remove stopped containers
docker container prune -f
```

### Volumes (⚠️ CAUTION: Will delete database data)
```bash
# Remove unused volumes
docker volume prune -f
```

### Everything (Nuclear option)
```bash
# Remove everything not in use
docker system prune -af --volumes
```

## Prevention Strategies

### 1. Regular Cleanup
Run cleanup weekly or when disk space gets low:
```bash
# Add to your routine
bun run docker:cleanup
```

### 2. Build Cache Limits
Set Docker daemon build cache size limit in Docker Desktop settings:
- Go to Settings → Docker Engine
- Add: `"max-concurrent-downloads": 3, "max-concurrent-uploads": 5`

### 3. Avoid Frequent Full Rebuilds
```bash
# Use this instead of `docker-compose up --build` every time
bun run dev

# Only rebuild when dependencies change
bun run dev:api:build
bun run dev:web:build
```

### 4. Use Targeted Builds
```bash
# Build only what you need
docker-compose -f docker-compose.api.yml up    # API only
docker-compose -f docker-compose.web.yml up    # Web only
```

## Monitoring

### Check Storage Regularly
```bash
# Overview
docker system df

# Detailed breakdown
docker system df -v

# Build cache details
docker builder du
```

### Set up Alerts
Consider setting up disk space monitoring to alert when Docker usage exceeds a threshold.

## Troubleshooting

### Build Cache Corruption
If you see repeated build failures or unusual storage growth:
```bash
docker builder prune -af
docker system prune -f
```

### "No space left on device" Errors
1. Run aggressive cleanup
2. Check Docker Desktop disk allocation
3. Move Docker data location if needed

### Persistent Large Images
Some images remain large due to:
- Development tools in production images
- Unoptimized layer caching
- Large dependencies

Consider optimizing Dockerfiles with multi-stage builds for production.

## Best Practices

1. **Regular cleanup**: Weekly `bun run docker:cleanup`
2. **Monitor usage**: Check `docker system df` regularly  
3. **Targeted rebuilds**: Don't rebuild everything unnecessarily
4. **Development vs Production**: Use separate optimized images for production
5. **Cache mounts**: Use BuildKit cache mounts in Dockerfiles (already implemented)

## Emergency Recovery

If Docker storage fills your disk:
```bash
# Emergency cleanup - removes everything
docker system prune -af --volumes
docker builder prune -af

# Then rebuild only what you need
bun run dev:api:build
```

**Note**: You'll lose all database data with `--volumes` flag.
