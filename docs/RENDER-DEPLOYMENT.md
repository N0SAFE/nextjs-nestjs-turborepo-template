# Render Deployment Guide

> This guide shows how to deploy the Next.js + NestJS + Documentation stack to Render using the provided blueprint.

## 🚀 Deploy your Next.js + NestJS + Docs app to Render

### Prerequisites
- GitHub repository with your code
- Render account (free at render.com)

### Step-by-Step Deployment

#### 1. Sign Up and Connect Repository
1. Go to [render.com](https://render.com) and sign up (free)
2. Connect your GitHub account
3. Grant access to your repository

#### 2. Deploy Using Blueprint (Recommended)
1. In Render dashboard, click **"New"** → **"Blueprint"**
2. Connect your repository
3. Render will automatically detect the `render.yaml` file
4. Review the services that will be created:
   - **nestjs-api**: Your NestJS backend API
   - **nextjs-web**: Your Next.js frontend web application  
   - **doc-app**: Your documentation site (using Fumadocs)
   - **nestjs-db**: PostgreSQL database (free tier)

#### 3. Update Service Names (Optional)
The `render.yaml` uses dynamic service references, so URLs are automatically generated based on your service names:

```yaml
# URLs are automatically generated from service names
- key: NEXT_PUBLIC_API_URL
  fromService:
    type: web
    name: nestjs-api  # Change this if you rename the service
    envVarKey: RENDER_EXTERNAL_URL
```

If you change the service names in `render.yaml`, make sure the `fromService.name` properties match:
- `nestjs-api` service → all `name: nestjs-api` references
- `nextjs-web` service → all `name: nextjs-web` references  
- `doc-app` service → all `name: doc-app` references

The actual URLs will be automatically:
- API: `https://your-nestjs-api-service.onrender.com`
- Web: `https://your-nextjs-web-service.onrender.com`
- Docs: `https://your-doc-app-service.onrender.com`

#### 4. Deploy and Configure
1. Click **"Apply"** to start deployment
2. Wait for services to build and deploy (10-15 minutes)
3. Access your API at: `https://your-api-service.onrender.com`
4. Access your web app at: `https://your-web-service.onrender.com`
5. Access your documentation at: `https://your-doc-service.onrender.com`

#### 5. Configure API and Database
1. Go to your API URL
2. Verify API health at `/health` endpoint
3. The database schema will be automatically migrated on startup
4. Configure authentication as needed

### Service Architecture

**Three-Service Deployment:**

1. **NestJS API** (`nestjs-api`)
   - Handles backend logic, database operations, authentication
   - Uses ORPC for type-safe API contracts
   - Includes Drizzle ORM for database operations
   - Automatically runs migrations on startup

2. **Next.js Web App** (`nextjs-web`)  
   - Frontend user interface
   - Consumes API through type-safe ORPC contracts
   - Includes authentication and state management
   - Links to documentation site

3. **Documentation Site** (`doc-app`)
   - Built with Fumadocs for documentation
   - Independent deployment for better performance
   - Accessible via docs URL from web app

4. **PostgreSQL Database** (`nestjs-db`)
   - Shared database for the NestJS API
   - Free tier includes 90-day retention
   - Automatic backups included

### Deployment Optimizations

**Build Performance:**
- All services use build-time compilation to prevent Render timeouts
- Docker builds compile applications during build phase, not startup
- Uses caching for faster subsequent builds
- Static generation happens after service starts to avoid build timeouts

**Health Checks:**
- Extended health check start period (120s) to allow for proper service initialization
- NestJS API health check at `/health` endpoint
- Web app health check at root path (`/`)
- Documentation site health check at root path (`/`)
- Automatic retry mechanism for service stability

### Environment Variables

The blueprint automatically configures:

**API Service:**
- Database connection (auto-configured from PostgreSQL service)
- API configuration (port, health check path)
- Authentication secrets (auto-generated)
- Cross-service URL references

**Web App Service:**
- API URL reference (auto-generated from API service)
- App URL reference (self-referencing)
- Documentation URL reference (auto-generated from docs service)
- Authentication secrets (shared with API)

**Documentation Service:**
- Minimal configuration (port and Node environment)
- Independent of other services

### Manual Deployment (Alternative)

If you prefer manual setup:

#### Deploy NestJS API:
1. New → Web Service
2. Connect repository
3. Docker environment
4. Dockerfile path: `./docker/Dockerfile.api.prod`
5. Add PostgreSQL database
6. Configure environment variables

#### Deploy Next.js Web:
1. New → Web Service  
2. Connect repository
3. Docker environment
4. Dockerfile path: `./docker/Dockerfile.web.build-time.prod`
5. Configure environment variables

#### Deploy Documentation Site:
1. New → Web Service
2. Connect repository  
3. Docker environment
4. Dockerfile path: `./docker/Dockerfile.doc.build-time.prod`
5. Configure environment variables

### Free Tier Limitations

**Render Free Tier includes:**
- 750 hours/month web service usage (per service)
- Services sleep after 15 minutes of inactivity
- 90-day PostgreSQL database (then requires upgrade)
- 512MB RAM per service
- Shared CPU

**For production use:**
- Upgrade to paid plan ($7/month per service)
- Persistent database storage
- No sleep mode
- Better performance

### Troubleshooting

**Next.js config URL parsing errors:**
- The next.config.ts automatically handles hostname-only values from Render's `fromService` references
- If you see "cannot be parsed as a URL" errors, the automatic https:// prefix should resolve it
- Ensure service names in `fromService.name` match your actual service names in render.yaml

**Port scan timeout during deployment:**
- This issue occurs when the build process takes too long
- Our Dockerfiles now build apps during Docker build phase (not startup)
- If you still see timeouts, consider upgrading to a paid plan for faster builds

**Service won't start:**
- Check build logs in Render dashboard
- Verify Dockerfile paths in render.yaml
- Ensure all environment variables are set
- Wait for the health check start period (120s for web services)

**Database connection issues:**
- Verify PostgreSQL service is running
- Check database environment variables in API service
- Wait for database to be fully initialized
- Database migrations run automatically on API startup

**CORS errors:**
- API automatically gets the web app URL for CORS configuration
- Ensure URLs match your actual service URLs
- Check that service references in render.yaml are correct

**Build takes too long:**
- All services are configured to build during Docker build phase
- Build happens before startup to prevent timeouts
- Consider using a paid plan for faster build resources

### Inter-Service Communication

**Automatic URL Generation:**
- Web app automatically gets API URL from `nestjs-api` service
- Web app automatically gets docs URL from `doc-app` service  
- API automatically gets web app URL for CORS configuration

**Service Dependencies:**
- Web app depends on API service for backend functionality
- Documentation is independent and can deploy separately
- All services share the same PostgreSQL database (API only)

### Custom Domains

All three services support custom domains:
1. Go to service settings in Render
2. Add custom domain for each service
3. Configure DNS records as instructed
4. Update environment variables if needed

### Monitoring

Monitor your services:
- Check logs in Render dashboard for each service
- Set up alerts for service health
- Monitor usage to avoid free tier limits
- Use health check endpoints to verify service status

### Next Steps

After successful deployment:
1. Verify all three services are running and accessible
2. Test API endpoints at `/health` and other routes
3. Check that web app can communicate with API
4. Verify documentation site is accessible and up-to-date
5. Configure authentication providers and secrets
6. Add custom domains (optional)
7. Set up monitoring and backups
8. Consider upgrading for production use
