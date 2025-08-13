# Docker Configuration Migration: Directus to NestJS (Archived)

This document is preserved for historical context of the migration. Current Docker usage is covered in:
- docs/PRODUCTION-DEPLOYMENT.md
- docs/DOCKER-BUILD-STRATEGIES.md

This document summarizes all the changes made to migrate the Docker and Docker Compose configurations from Directus to NestJS.

## Files Updated

### Docker Files
- `docker/Dockerfile.api.dev` - Updated to build NestJS development container
- `docker/Dockerfile.api.prod` - Updated to build NestJS production container with multi-stage build

### Docker Compose Files
- `docker-compose.yml` - Updated main development compose file
- `docker-compose.api.yml` - Updated API-only development compose file  
- `docker-compose.api.prod.yml` - Updated API production compose file
- `docker-compose.prod.yml` - Updated full production compose file
- `docker-compose.web.yml` - Updated web development compose file
- `docker-compose.web.prod.yml` - Updated web production compose file

### Environment Configuration Files
- `.env.example` - Updated default environment variables
- `.env.template` - Updated template with NestJS configuration
- `.env.api.prod.example` - Updated API production environment
- `.env.web.prod.example` - Updated web production environment

### Application Configuration
- `apps/web/next.config.ts` - Updated default API URL from 8055 to 3001
- `apps/web/package.json` - Updated fallback API port reference
- `apps/api/src/app.module.ts` - Added HealthModule
- `apps/api/src/health/health.controller.ts` - Created health check endpoints
- `apps/api/src/health/health.module.ts` - Created health module

### Documentation
- `docs/ARCHITECTURE.md` - Updated architecture overview for NestJS

## Key Changes Summary

### Database Migration
- **From**: MySQL 8.0 for Directus
- **To**: PostgreSQL 16 for NestJS
- Updated connection strings and environment variables

### API Port Changes
- **From**: Port 8055 (Directus default)
- **To**: Port 3001 (NestJS default)
- Updated all references across compose files and environment variables

### Health Check Endpoints
- **From**: `/server/health` (Directus)
- **To**: `/health` (NestJS custom endpoint)
- Created new health controller with multiple endpoints:
  - `/health` - Basic health check
  - `/health/ready` - Readiness probe
  - `/health/live` - Liveness probe

### Docker Build Fixes
- **Fixed**: EXPOSE directive in Dockerfiles now uses literal port numbers instead of variables
- **Fixed**: Build arguments in Docker Compose files now match Dockerfile expectations
- **Fixed**: Workspace package dependencies (`@repo/*`) now copied before `bun install`
- **Fixed**: Lockfile frozen constraint removed for development builds to allow dependency resolution
- **Fixed**: Workspace root installation to properly resolve catalog references (`catalog:auth`, etc.)
- **Fixed**: NestJS development server now uses Node.js instead of Bun for compatibility
- **Fixed**: Added NestJS CLI global installation and initial build step for development
- **Updated**: All web Dockerfiles (`web.dev`, `web.runtime.prod`, `web.build-time.prod`) 
- **Updated**: All API Dockerfiles (`api.dev`, `api.prod`) to handle monorepo structure
- **Issue Resolved**: "invalid containerPort" error caused by variable substitution in EXPOSE command
- **Issue Resolved**: "@repo/* failed to resolve" error caused by missing workspace packages during install
- **Issue Resolved**: "lockfile had changes, but lockfile is frozen" error in development builds
- **Issue Resolved**: "Cannot find module '/app/apps/api/dist/main'" error in NestJS development server

### Environment Variables
- Removed Directus-specific variables:
  - `DIRECTUS_SECRET`
  - `DIRECTUS_ADMIN_EMAIL`
  - `DIRECTUS_ADMIN_PASSWORD`
  - `DB_ROOT_PASSWORD`
  - `NEXT_PUBLIC_API_PORT`
- Added NestJS-specific variables:
  - `API_PORT`
  - `JWT_SECRET`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DATABASE_URL` (PostgreSQL format)

### Container Configuration
- **Development**: Now builds from source with hot reloading using bun
- **Production**: Multi-stage build for optimized production images
- **Dependencies**: Updated to use Node.js 20 Alpine base images
- **User Management**: Proper non-root user setup in production

### Docker Compose Networks
- Maintained existing network structure
- Updated service dependencies and health checks
- Changed database service from MySQL to PostgreSQL
- Updated Redis to use Alpine variant for consistency

## Testing the Changes

To test the updated configuration:

1. **Development Mode**:
   ```bash
   docker-compose up
   # API should be available at http://localhost:3001
   # Web app should be available at http://localhost:3000
   ```

2. **API Only Development**:
   ```bash
   docker-compose -f docker-compose.api.yml up
   ```

3. **Production Mode**:
   ```bash
   docker-compose -f docker-compose.prod.yml up
   ```

4. **Health Check**:
   ```bash
   curl http://localhost:3001/health
   ```

## Breaking Changes

⚠️ **Important**: These changes introduce breaking changes:

1. **Database**: Migration from MySQL to PostgreSQL requires data migration
2. **API Endpoints**: Complete API structure change from Directus REST/GraphQL to tRPC
3. **Authentication**: Migration from Directus auth to Better Auth
4. **Environment Variables**: Many environment variables have changed names/formats

## Next Steps

1. Update any remaining documentation references to Directus
2. Test all Docker configurations in different environments
3. Update CI/CD pipelines if they reference the old configurations
4. Update any deployment scripts or infrastructure-as-code
5. Migrate existing data from MySQL/Directus to PostgreSQL/NestJS format
