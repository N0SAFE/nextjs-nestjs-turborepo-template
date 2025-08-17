# Production Docker Compose Deployments

> Context: Docker-first SaaS template deploying to production. Use this when deploying with Docker Compose on your own infrastructure. For Render-specific steps, see ./RENDER-DEPLOYMENT.md.

This document describes how to deploy the API and Web applications separately in a production environment.

## Files

- `docker-compose.api.prod.yml` - Runs only the NestJS API with database and cache
- `docker-compose.web.prod.yml` - Runs only the Next.js web application

## Production Deployment Usage

### 1. Deploy API in Production

```bash
# Copy the production environment template
cp .env.api.prod.example .env
# Edit the .env file to set secure passwords and proper URLs

# Start the API services
docker-compose -f docker-compose.api.prod.yml up -d

# The API will be available at your configured URL (default: http://localhost:3001)
# Health check: http://your-api-domain.com/health
```

### 2. Deploy Web App in Production (requires running API)

```bash
# Copy the production environment template
cp .env.web.prod.example .env
# Edit the .env file to set your API URL and other production settings

# Start the web app
docker-compose -f docker-compose.web.prod.yml up -d

# The web app will be available at your configured URL
```

### 3. Deploy Both Separately in Production

```bash
# Terminal 1: Start API
docker-compose -f docker-compose.api.prod.yml up

# Terminal 2: Start Web App (after API is ready)
docker-compose -f docker-compose.web.prod.yml up
```

## Production Environment Variables

### API Production Deployment

Create a `.env` file with:

```env
# Database
DB_USER=postgres
DB_PASSWORD=use-a-secure-password-in-production
DB_DATABASE=nestjs_api
DATABASE_URL=postgresql://postgres:your-password@api-db-prod:5432/nestjs_api

# API Security
BETTER_AUTH_SECRET=generate-a-secure-random-value-for-production

# API
API_PORT=3001
NEXT_PUBLIC_API_URL=https://api.your-domain.com/

# Redis
REDIS_URL=redis://api-cache-prod:6379

# Production Optimizations
LOG_LEVEL=warn
NODE_ENV=production
```

### Web Production Deployment

Create a `.env` file with:

```env
# API Connection (point to your production API)
NEXT_PUBLIC_API_URL=https://api.your-domain.com/

# Web App
NEXT_PUBLIC_APP_URL=https://www.your-domain.com
NEXT_PUBLIC_APP_PORT=3000

# Authentication
BETTER_AUTH_URL=https://www.your-domain.com
BETTER_AUTH_SECRET=your-secure-auth-secret

# Production Mode Configuration
NODE_ENV=production
```

## Key Production Configuration Features

### API Production Configuration
- Uses its own isolated network (`api_network`)
- Database and cache are included
- No dependencies on web services
- Enhanced security settings
- Rate limiting and other production optimizations

### Web Production Configuration
- Direct API connection (no proxy by default)
- Includes `wait-api` functionality to ensure API is ready
- Uses `USE_LOCALHOST_CLIENT=false` for production mode
- Can connect to API running anywhere (same server, different server, cloud service, etc.)
- Optimized production build with smaller Docker image

## Production Deployment

### API Server
```bash
# On your API server
docker-compose -f docker-compose.api-only.yml up -d
```

### Web Server
```bash
# On your web server, update .env to point to API server
NEXT_PUBLIC_API_URL=https://your-api-domain.com/

# Deploy web app
docker-compose -f docker-compose.web.prod.yml up -d
```

## Logs and Monitoring

```bash
# API logs
docker-compose -f docker-compose.api.prod.yml logs -f

# Web app logs
docker-compose -f docker-compose.web.prod.yml logs -f

# Specific service logs
docker-compose -f docker-compose.api.prod.yml logs -f api
```

## Stopping Production Services

```bash
# Stop API
docker-compose -f docker-compose.api.prod.yml down

# Stop Web App
docker-compose -f docker-compose.web.prod.yml down

# Stop and remove volumes (API)
docker-compose -f docker-compose.api.prod.yml down -v
```
