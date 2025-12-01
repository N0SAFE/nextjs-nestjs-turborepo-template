import zod from 'zod/v4'
import { guardedUrl, parseDebugScopes, trimTrailingSlash } from './utils'
import {
    LOCAL_APP_FALLBACK,
    LOCAL_API_FALLBACK,
    DEFAULT_API_PORT,
} from './constants'

// ============================================================================
// Shared Environment Variables
// ============================================================================

/**
 * Shared environment variables used across multiple apps
 */
const sharedEnvVars = {
    NEXT_PUBLIC_APP_URL: guardedUrl('NEXT_PUBLIC_APP_URL', LOCAL_APP_FALLBACK),
    NODE_ENV: zod.enum(['development', 'production', 'test']).default('development'),
}

// ============================================================================
// Environment Variable Schemas by App
// ============================================================================

/**
 * API App (NestJS) Environment Variables
 * Used by apps/api
 */
export const apiEnvSchema = zod.object({
    // Database
    DATABASE_URL: zod.string().min(1, 'DATABASE_URL is required'),
    
    // API
    API_PORT: zod.coerce.number().int().min(1).max(65535).default(DEFAULT_API_PORT),
    NEXT_PUBLIC_API_URL: guardedUrl('NEXT_PUBLIC_API_URL', LOCAL_API_FALLBACK),
    
    // Web App URLs (for trusted origins)
    APP_URL: zod.url().optional(), // Private Docker network URL
    
    // Authentication
    AUTH_SECRET: zod.string().min(1, 'AUTH_SECRET is required'),
    BETTER_AUTH_SECRET: zod.string().min(1, 'BETTER_AUTH_SECRET is required'),
    AUTH_BASE_DOMAIN: zod.string().optional(),
    DEV_AUTH_KEY: zod.string().optional(),
    TRUSTED_ORIGINS: zod.string().optional(),
    
    // Shared
    ...sharedEnvVars,
}).refine((data) => {
    if (data.BETTER_AUTH_SECRET && data.BETTER_AUTH_SECRET !== data.AUTH_SECRET) {
        return false
    }
    return true
}, {
    message: 'BETTER_AUTH_SECRET must match AUTH_SECRET when provided',
    path: ['BETTER_AUTH_SECRET'],
})

/**
 * Web App (Next.js) Environment Variables
 * Used by apps/web
 */
export const webEnvSchema = zod.object({
    // React Scan Configuration
    REACT_SCAN_GIT_COMMIT_HASH: zod.string().optional(),
    REACT_SCAN_GIT_BRANCH: zod.string().optional(),
    REACT_SCAN_TOKEN: zod.string().optional(),

    API_URL: guardedUrl('API_URL', LOCAL_API_FALLBACK),
    
    // Public API Configuration
    NEXT_PUBLIC_API_URL: guardedUrl('NEXT_PUBLIC_API_URL', LOCAL_API_FALLBACK),
    NEXT_PUBLIC_API_PORT: zod.coerce.number().int().min(1).max(65535).optional(),
    NEXT_PUBLIC_APP_PORT: zod.coerce.number().int().min(1).max(65535).optional(),
    
    // Authentication
    AUTH_SECRET: zod.string().min(1, 'AUTH_SECRET is required'),
    BETTER_AUTH_SECRET: zod.string().min(1, 'BETTER_AUTH_SECRET is required'),
    AUTH_BASE_DOMAIN: zod.string().optional(),
    DEV_AUTH_KEY: zod.string().optional(),
    NEXT_PUBLIC_SHOW_AUTH_LOGS: zod.coerce.boolean().optional().default(false),
    
    // Debug configuration - supports advanced patterns:
    // - "middleware/auth" (exact match)
    // - "middleware/*" (direct children only) 
    // - "middleware/**" (all nested children)
    // - "middleware/{auth,router,cors}/*" (multiple sub-scopes)
    // - "*" (everything)
    // - "middleware/*,auth/test,api/{users,posts}/**" (multiple patterns)
    NEXT_PUBLIC_DEBUG: zod
        .string()
        .optional()
        .default('')
        .transform(parseDebugScopes),
    
    // Optional docs site config; when set, used to render a Docs link in the navbar
    NEXT_PUBLIC_DOC_URL: zod
        .string()
        .url()
        .optional()
        .transform((url) => (url ? trimTrailingSlash(url) : url)),
    NEXT_PUBLIC_DOC_PORT: zod.coerce.number().optional(),
    
    // Development Tools
    REACT_SCAN: zod.coerce.boolean().optional().default(false),
    MILLION_LINT: zod.coerce.boolean().optional().default(false),
    
    ...sharedEnvVars,
}).refine((data) => {
    if (data.BETTER_AUTH_SECRET && data.BETTER_AUTH_SECRET !== data.AUTH_SECRET) {
        return false
    }
    return true
}, {
    message: 'BETTER_AUTH_SECRET must match AUTH_SECRET when provided',
    path: ['BETTER_AUTH_SECRET'],
})

/**
 * Doc App (Fumadocs) Environment Variables
 * Used by apps/doc
 */
export const docEnvSchema = zod.object({
    // Shared
    NODE_ENV: sharedEnvVars.NODE_ENV,
})

// ============================================================================
// Combined Schema for All Apps
// ============================================================================

/**
 * Combined schema that validates all apps' environment variables
 */
export const allEnvSchema = zod.object({
    api: apiEnvSchema,
    web: webEnvSchema,
    doc: docEnvSchema,
})

// ============================================================================
// Type Exports
// ============================================================================

export type ApiEnv = zod.infer<typeof apiEnvSchema>
export type WebEnv = zod.infer<typeof webEnvSchema>
export type DocEnv = zod.infer<typeof docEnvSchema>
export type AllEnv = zod.infer<typeof allEnvSchema>

// ============================================================================
// Re-export Everything
// ============================================================================

export { trimTrailingSlash, guardedUrl, parseDebugScopes } from './utils'
export * from './constants'
export * from './validate'
