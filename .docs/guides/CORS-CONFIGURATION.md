# CORS Configuration Guide

## Overview

Cross-Origin Resource Sharing (CORS) is a security feature that controls which origins (domains) can access your API. This guide explains how CORS is configured in this project and how to troubleshoot common issues.

## CORS Configuration

The API's CORS configuration is located in `apps/api/src/main.ts` and handles:

1. **URL Normalization**: Automatically removes trailing slashes from URLs to prevent mismatches
2. **Multiple Origin Support**: Accepts requests from multiple configured origins
3. **Development Mode Flexibility**: In development, automatically allows all localhost variations
4. **Credential Support**: Enables cookies and authentication headers

## Environment Variables

The CORS configuration reads from the following environment variables:

### Primary Configuration

- **`NEXT_PUBLIC_APP_URL`**: The public-facing URL of your web application (used by browsers)
  - Example: `http://localhost:3000` (no trailing slash recommended)
  - This is the primary origin that will be allowed

- **`APP_URL`**: Internal Docker network URL (optional)
  - Example: `http://web-dev:3000`
  - Used for server-to-server communication within Docker

- **`TRUSTED_ORIGINS`**: Additional origins to trust (comma-separated, optional)
  - Example: `https://app.example.com,https://admin.example.com`
  - Use for multi-domain setups or additional frontend apps

### Better Auth Integration

Better Auth also maintains a separate list of trusted origins (configured in `packages/utils/auth/src/server/auth.ts`) that combines:
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `TRUSTED_ORIGINS`

These origins are used for CORS in the auth module specifically.

## Common CORS Errors and Solutions

### PreflightAllowOriginMismatch

**Symptom**: Browser console shows CORS errors with "Access-Control-Allow-Origin" mismatch.

**Common Causes**:

1. **Trailing Slash Mismatch**
   ```bash
   # ❌ WRONG - Trailing slashes cause issues
   NEXT_PUBLIC_APP_URL=http://localhost:3000/
   
   # ✅ CORRECT - No trailing slash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Wrong Port Number**
   ```bash
   # Make sure ports match your actual setup
   # Check docker-compose.yml for the correct ports
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # Web app port
   NEXT_PUBLIC_API_URL=http://localhost:3001  # API port
   ```

3. **Missing Protocol**
   ```bash
   # ❌ WRONG - Missing http://
   NEXT_PUBLIC_APP_URL=localhost:3000
   
   # ✅ CORRECT - Include protocol
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Access Denied in Production

**Symptom**: CORS works in development but fails in production.

**Solution**: In production, localhost variations are not automatically allowed. You must explicitly configure all origins:

```bash
# Production environment variables
NEXT_PUBLIC_APP_URL=https://app.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
TRUSTED_ORIGINS=https://app.example.com,https://admin.example.com
```

## CORS Behavior by Environment

### Development Mode (`NODE_ENV=development`)

In development, the CORS configuration is **permissive**:
- Allows any `http://localhost:*` origin
- Allows any `http://127.0.0.1:*` origin
- Still respects explicitly configured origins
- Logs rejected origins to help debugging

### Production Mode (`NODE_ENV=production`)

In production, the CORS configuration is **strict**:
- Only allows explicitly configured origins
- Requires exact URL matches (after normalization)
- Rejects all other origins with an error

## Debugging CORS Issues

### 1. Check Environment Variables

```bash
# In the API container or local environment
echo $NEXT_PUBLIC_APP_URL
echo $APP_URL
echo $TRUSTED_ORIGINS
```

### 2. Check Browser Network Tab

In your browser's Developer Tools:
1. Open the Network tab
2. Look for the failing request
3. Check the Request Headers:
   - `Origin`: The origin the browser is sending from
4. Check the Response Headers:
   - `Access-Control-Allow-Origin`: The origin the API is accepting
   - Should match the Origin header

### 3. Check API Logs

The API logs helpful information when origins are rejected:

```
CORS: Rejected origin: http://localhost:3003
CORS: Allowed origins: http://localhost:3000, http://web-dev:3000
```

This tells you:
- What origin was rejected
- What origins are currently configured

### 4. Test with cURL

You can test CORS preflight requests manually:

```bash
# Test OPTIONS preflight request
curl -X OPTIONS http://localhost:3001/api/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Check for Access-Control-Allow-Origin in response
```

## Configuration Examples

### Basic Setup (Single Frontend)

```bash
# .env file
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
APP_URL=http://web-dev:3000
```

### Multi-Domain Setup

```bash
# .env file
NEXT_PUBLIC_APP_URL=https://app.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
TRUSTED_ORIGINS=https://app.example.com,https://admin.example.com,https://mobile.example.com
```

### Development with Custom Port

```bash
# .env file
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_APP_PORT=3003
NEXT_PUBLIC_API_URL=http://localhost:8055
API_PORT=8055
```

## Security Considerations

1. **Never use wildcards in production**: Don't use `*` for `Access-Control-Allow-Origin` in production
2. **Be specific with origins**: Only list origins you actually need
3. **Use HTTPS in production**: Always use `https://` in production environments
4. **Limit trusted origins**: The fewer origins, the better for security
5. **Review logs regularly**: Check for rejected origins to detect potential attacks

## Technical Details

### CORS Headers Set by the API

```typescript
{
  credentials: true,                                           // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],    // Allowed headers
  exposedHeaders: ['Set-Cookie'],                                 // Expose Set-Cookie
}
```

### Origin Matching Flow

1. Browser sends request with `Origin` header
2. API normalizes the origin (removes trailing slash)
3. API checks if normalized origin is in allowed list
4. In development, checks if origin is localhost/127.0.0.1
5. If allowed, returns matching `Access-Control-Allow-Origin`
6. If rejected, returns CORS error and logs the rejection

## Related Files

- **Main CORS Configuration**: `apps/api/src/main.ts`
- **Auth Module CORS**: `apps/api/src/core/modules/auth/auth.module.ts`
- **Better Auth Origins**: `packages/utils/auth/src/server/auth.ts`
- **Docker Configuration**: 
  - `docker/compose/api/docker-compose.api.dev.yml`
  - `docker/compose/web/docker-compose.web.dev.yml`
- **Environment Template**: `.env.example`

## Troubleshooting Checklist

- [ ] Check `.env` file has correct URLs (no trailing slashes)
- [ ] Verify ports match your Docker or local setup
- [ ] Ensure `http://` or `https://` prefix is included
- [ ] Check API logs for "CORS: Rejected origin" messages
- [ ] Verify browser is sending requests from the expected origin
- [ ] In production, ensure all origins are in `TRUSTED_ORIGINS`
- [ ] Restart API after changing environment variables
- [ ] Clear browser cache and cookies

## Getting Help

If you're still experiencing CORS issues:

1. Check the API container logs: `bun run dev:api:logs`
2. Verify environment variables in the container: `docker exec -it <container> env | grep URL`
3. Review the Network tab in browser DevTools
4. Check that both the web app and API are running
5. Ensure you're accessing the web app via the correct URL (not direct file access)
