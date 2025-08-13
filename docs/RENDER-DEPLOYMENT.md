# Render Deployment Guide

> This guide targets the Docker-first SaaS use case and shows how to deploy this template to Render using the provided blueprint.

## 🚀 Deploy your Next.js + NestJS app to Render

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
   - **nextjs-web**: Your Next.js frontend
   - **api-db**: PostgreSQL database (free tier)

#### 3. Update Service Names (Optional)
The `render.yaml` uses dynamic service references, so URLs are automatically generated based on your service names:

```yaml
# URLs are automatically generated from service names
- key: NEXT_PUBLIC_API_URL
  fromService:
    type: web
    name: nestjs-api  # Change this if you rename the service
    property: host
```

If you change the service names in `render.yaml`, make sure the `fromService.name` properties match:
- `nestjs-api` service → all `name: nestjs-api` references
- `nextjs-web` service → all `name: nextjs-web` references

The actual URLs will be automatically:
- API: `https://your-actual-service-name.onrender.com`
- Web: `https://your-actual-web-service-name.onrender.com`

#### 4. Deploy and Configure
1. Click **"Apply"** to start deployment
2. Wait for services to build and deploy (10-15 minutes)
3. Access your API at: `https://your-api-service.onrender.com`
4. Access your web app at: `https://your-web-service.onrender.com`

#### 5. Configure API and Database
1. Go to your API URL
2. Verify API health at `/health` endpoint
3. Set up database schema with migrations
4. Configure authentication as needed

### Deployment Optimizations

**Build Performance:**
- The web service Dockerfile builds the Next.js app during the Docker build phase
- This prevents Render from timing out while scanning for open ports
- Uses `SKIP_STATIC_GENERATION=true` to speed up the build process
- Static generation happens after the service starts to avoid build timeouts

**Health Checks:**
- Extended health check start period (120s) to allow for proper service initialization
- Health check endpoint configured at root path (`/`)
- Automatic retry mechanism for service stability

### Environment Variables

The blueprint automatically configures:
- Database connection
- CORS settings
- Authentication secrets
- Service URLs

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
4. Dockerfile path: `./docker/Dockerfile.web.prod`
5. Configure environment variables

### Free Tier Limitations

**Render Free Tier includes:**
- 750 hours/month web service usage
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
- Our Dockerfile now builds the app during Docker build phase (not startup)
- Uses `SKIP_STATIC_GENERATION=true` to speed up builds
- If you still see timeouts, consider upgrading to a paid plan for faster builds

**Service won't start:**
- Check build logs in Render dashboard
- Verify Dockerfile paths in render.yaml
- Ensure all environment variables are set
- Wait for the health check start period (120s for web service)

**Database connection issues:**
- Verify PostgreSQL service is running
- Check database environment variables
- Wait for database to be fully initialized

**CORS errors:**
- Update CORS_ORIGIN in API service
- Ensure URLs match your actual service URLs

**Build takes too long:**
- The web service is configured with `SKIP_STATIC_GENERATION=true`
- Build happens during Docker build phase, not at startup
- Consider using a paid plan for faster build resources

### Custom Domains

Both services support custom domains:
1. Go to service settings in Render
2. Add custom domain
3. Configure DNS records as instructed

### Monitoring

Monitor your services:
- Check logs in Render dashboard
- Set up alerts for service health
- Monitor usage to avoid free tier limits

### Next Steps

After successful deployment:
1. Run database migrations and seed if needed
2. Configure authentication providers and secrets
3. Add custom domains (optional)
4. Set up monitoring and backups
5. Consider upgrading for production use
