# Docker Build Strategies

> Optimized for the Docker-first SaaS workflow in this template. Use these strategies to choose between fast startup (build-time) and flexible runtime compilation, including Render deployment compatibility.

This project provides multiple Docker compose configurations optimized for different development and deployment scenarios.

## Development Environment

### Full Development Environment (Default)

**Files:**
- `docker-compose.yml` (main development setup)

**What it includes:**
- Next.js web app with hot reloading
- NestJS API with hot reloading  
- PostgreSQL database
- Redis cache

**Usage:**
```bash
bun run dev
# or
docker-compose up
```

### Separate Development Services

For independent development, you can run API and Web services separately:

#### API Development Only

**Files:**
- `docker-compose.api.dev.yml`
- `docker/Dockerfile.api.dev`

**What it includes:**
- NestJS API with development tools
- PostgreSQL database (exposed on port 5432)
- Redis cache (exposed on port 6379)

**Usage:**
```bash
bun run dev:api
# or
docker-compose -f docker-compose.api.dev.yml up
```

**Benefits:**
- ✅ **Independent API development** - work on backend without frontend
- ✅ **External connections** - database and Redis exposed for external tools
- ✅ **Development tools** - curl, wget, bash, nano, git included
- ✅ **Hot reloading** - NestJS auto-reloads on changes

#### Web Development Only

**Files:**
- `docker-compose.web.dev.yml`
- `docker/Dockerfile.web.dev` (existing)

**What it includes:**
- Next.js web app with hot reloading
- Connects to external API server

**Usage:**
```bash
bun run dev:web
# or
docker-compose -f docker-compose.web.dev.yml up
```

**Benefits:**
- ✅ **Independent web development** - work on frontend with external API
- ✅ **Host networking** - easy connection to external services
- ✅ **Hot reloading** - instant updates on code changes
- ✅ **Development features** - auth logs, telemetry disabled

## Production Environment

**Files:**
- `docker/Dockerfile.web.build-time.prod` 
- `docker-compose.build-time.prod.yml`
- Used by default in `docker-compose.prod.yml` and `render.yaml`

**How it works:**
- Next.js application is built during the `docker build` process
- The final image contains the pre-built application
- Container startup only runs the already-compiled application

**Advantages:**
- ✅ **Fast startup time** - container starts immediately
- ✅ **Platform compatibility** - works with Render, Vercel, and other platforms that scan for open ports
- ✅ **Consistent builds** - build environment is captured in the image
- ✅ **Better caching** - Docker layers cache the build artifacts
- ✅ **Smaller runtime footprint** - no dev dependencies in final image

**Disadvantages:**
- ❌ **Longer image build time** - takes more time to create the Docker image
- ❌ **Rebuild required for changes** - code changes require rebuilding the image
- ❌ **Larger image size** - build artifacts are stored in the image

**Use cases:**
- Production deployments
- CI/CD pipelines
- Platform-as-a-Service (Render, Railway, etc.)
- When fast startup is critical
- When you have automated image building

## Runtime Compilation (Flexible for Development)

**Files:**
- `docker/Dockerfile.web.runtime.prod`
- `docker-compose.runtime.prod.yml`

**How it works:**
- Source code is copied to the container
- Next.js application is built when the container starts
- Build happens fresh on every container restart

**Advantages:**
- ✅ **Fresh builds** - always uses the latest source code
- ✅ **Faster image creation** - Docker image builds quickly
- ✅ **Development friendly** - code changes don't require image rebuild
- ✅ **Smaller image layers** - build artifacts not cached in image

**Disadvantages:**
- ❌ **Slow startup time** - 2-5 minutes for build + start
- ❌ **Platform incompatibility** - may timeout on platforms that scan for ports
- ❌ **Resource intensive** - requires build resources at runtime
- ❌ **Build dependencies required** - dev dependencies needed in production

**Use cases:**
- Development environments
- Self-hosted deployments with flexible startup times
- When you want builds to always use fresh dependencies
- Docker Compose local development

## Quick Reference

### Development Commands

```bash
# Full development environment
bun run dev                    # Start all services (API + Web + Database + Redis)

# Separate development services  
bun run dev:api               # Start API services only
bun run dev:web               # Start Web service only
bun run dev:api:build         # Build and start API services
bun run dev:web:build         # Build and start Web service  
bun run dev:api:down          # Stop API services
bun run dev:web:down          # Stop Web service
bun run dev:api:logs          # View API logs
bun run dev:web:logs          # View Web logs
```

### For Render/Vercel Deployment:
```bash
# Use build-time compilation (already configured)
docker build -f docker/Dockerfile.web.build-time.prod .
```

### For Local Development:
```bash
# Runtime compilation for fresh builds (default)
docker-compose -f docker-compose.prod.yml up
# OR use the explicit runtime file
docker-compose -f docker-compose.runtime.prod.yml up
```

### For Production Self-Hosted:
```bash
# Runtime compilation (default) - fresh builds but slower startup
docker-compose -f docker-compose.prod.yml up
# OR for faster startup (build-time compilation)
docker-compose -f docker-compose.build-time.prod.yml up
```

## Environment Variables

Both strategies support the same environment variables:

**Build-time arguments (for build-time compilation):**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL` 
- `BETTER_AUTH_SECRET`
- `API_PORT`

**Runtime environment variables (for both strategies):**
- All the above variables can be overridden at runtime
- Additional runtime-specific variables are set in docker-compose files

## Performance Comparison

| Metric | Build-Time | Runtime |
|--------|------------|---------|
| Image Build Time | 5-10 minutes | 1-2 minutes |
| Container Startup | 5-10 seconds | 2-5 minutes |
| Image Size | Larger (~500MB) | Smaller (~300MB) |
| Memory Usage | Lower | Higher (during build) |
| Platform Compatibility | High | Limited |

## Migration Between Strategies

### From Runtime to Build-Time:
1. Update `dockerfilePath` in your deployment config
2. Add build-time environment variables as build args
3. Expect longer image builds but faster startups

### From Build-Time to Runtime:
1. Update `dockerfilePath` in your deployment config  
2. Remove build args, rely on runtime environment variables
3. Expect faster image builds but slower startups

## Troubleshooting

**Build-Time Issues:**
- Build fails: Check environment variables are set as build args
- Large image: Normal, build artifacts are included
- Slow builds: Use Docker layer caching

**Runtime Issues:**
- Slow startup: Expected, build happens at startup  
- Platform timeouts: Use build-time compilation instead
- Out of memory: Increase container memory limits

## Recommendations

- **Production**: Use build-time compilation (`Dockerfile.web.build-time.prod`)
- **Development**: Use runtime compilation (`Dockerfile.web.runtime.prod`) 
- **CI/CD**: Use build-time compilation for consistent builds
- **Platform deployment**: Use build-time compilation to avoid timeouts
