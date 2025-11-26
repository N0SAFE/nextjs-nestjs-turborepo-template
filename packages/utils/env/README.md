# @repo/env

Centralized environment variable validation for all apps using Zod.

## Features

- 🔒 **Production Guards**: Enforces required URLs in production, allows fallbacks in dev
- 🎯 **Type Safety**: Full TypeScript inference for all environment variables
- 🧰 **Shared Helpers**: Reusable validation utilities (guardedUrl, trimTrailingSlash, parseDebugScopes)
- 📦 **Per-App Schemas**: Separate validation for api, web, and doc apps
- ✅ **Validation Functions**: Safe and throwing variants for each app

## Usage

### API App (NestJS)

```typescript
import { validateApiEnv, apiEnvSchema, type ApiEnv } from '@repo/env'

// In your ConfigModule
const env = validateApiEnv(process.env)

// Type-safe access
const port: number = env.API_PORT
```

### Web App (Next.js)

```typescript
import { validateWebEnv, webEnvSchema, type WebEnv } from '@repo/env'

// Validate environment
const env = validateWebEnv(process.env)

// Type-safe access
const apiUrl: string = env.API_URL
```

### Doc App (Fumadocs)

```typescript
import { validateDocEnv, docEnvSchema, type DocEnv } from '@repo/env'

// Validate environment
const env = validateDocEnv(process.env)
```

## Available Schemas

### `apiEnvSchema` (NestJS API)
- `DATABASE_URL` (required): PostgreSQL connection string
- `API_PORT` (default: 3001): API server port
- `AUTH_SECRET` (required): Authentication secret key
- `DEV_AUTH_KEY` (optional): Development auth token
- `NODE_ENV` (default: 'development'): Environment mode
- `NEXT_PUBLIC_APP_URL` (required): Web app URL for CORS

### `webEnvSchema` (Next.js Web)
- `NEXT_PUBLIC_APP_URL` (production-required): Web app URL
- `API_URL` (production-required): API server URL
- `NEXT_PUBLIC_SHOW_AUTH_LOGS` (default: false): Enable auth logging
- `NEXT_PUBLIC_DEBUG` (optional): Debug scope patterns
- `NEXT_PUBLIC_DOC_URL`, `NEXT_PUBLIC_DOC_PORT` (optional): Documentation site
- `NODE_ENV` (default: 'development'): Environment mode
- `REACT_SCAN`, `MILLION_LINT` (optional): Development tools
- React Scan variables: `REACT_SCAN_GIT_COMMIT_HASH`, `REACT_SCAN_GIT_BRANCH`, `REACT_SCAN_TOKEN`

### `docEnvSchema` (Fumadocs)
- `NODE_ENV` (default: 'development'): Environment mode

## Validation Functions

Each schema has three validation functions:

```typescript
// Safe validation (returns Result type)
const result = validateApiEnvSafe(process.env)
if (result.success) {
  console.log(result.data)
}

// Throwing validation (throws ZodError on failure)
const env = validateApiEnv(process.env)

// Boolean check
if (apiEnvIsValid(process.env)) {
  // Environment is valid
}

// Validate specific path
const apiUrl = validateWebEnvPath(process.env.API_URL, 'API_URL')
```

## Shared Helpers

### `guardedUrl(name: string, fallback: string)`
Creates a URL validator that:
- **Production**: Requires the URL to be set, throws error if missing
- **Development/Test**: Falls back to provided value if not set

```typescript
import { guardedUrl } from '@repo/env'

const schema = z.object({
  API_URL: guardedUrl('API_URL', 'http://localhost:3001')
})
```

### `trimTrailingSlash(url: string)`
Removes trailing slashes from URLs for consistency.

### `parseDebugScopes(input: string)`
Parses comma-separated debug scope patterns:
- `"middleware/auth"` - exact match
- `"middleware/*"` - direct children only
- `"middleware/**"` - all nested children
- `"middleware/{auth,router,cors}/*"` - multiple sub-scopes
- `"*"` - everything

## Type Exports

```typescript
import type { ApiEnv, WebEnv, DocEnv } from '@repo/env'
```
