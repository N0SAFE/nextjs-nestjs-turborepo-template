import zod from 'zod/v4'

/**
 * Helper to trim trailing slash from URLs
 */
export const trimTrailingSlash = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url)

/**
 * Helper to create URL validators with production guards and dev fallbacks
 * @param name - Environment variable name for error messages
 * @param fallback - Fallback URL for development/test environments
 * @returns Zod URL schema with production validation
 */
export const guardedUrl = (name: string, fallback: string) =>
    zod
        .url()
        .superRefine((val, ctx) => {
            // If we had to use a fallback in production, surface a hard error.
            if (process.env.NODE_ENV === 'production') {
                if (!val) {
                    ctx.addIssue({ 
                        code: 'custom', 
                        message: `${name} is required in production but was not provided` 
                    })
                }
                ctx.value = val;
                return;
            }
            ctx.value = val || fallback;
        })
        .transform(trimTrailingSlash)

/**
 * Debug scope parser - transforms comma-separated scopes into structured format
 * Supports patterns like:
 * - "middleware/auth" (exact match)
 * - "middleware/*" (match all direct children)
 * - "middleware/**" (match all nested children)
 * - "middleware/{auth,router,cors}/*" (match multiple specific sub-scopes)
 * - "*" (match everything)
 * - "middleware/*,auth/test,api/{users,posts}/**" (multiple patterns)
 */
export const parseDebugScopes = (input: string): { patterns: string[], enableAll: boolean } => {
    if (!input || input.trim() === '') {
        return { patterns: [], enableAll: false }
    }
    
    const scopes = input.split(',').map(s => s.trim()).filter(Boolean)
    const enableAll = scopes.includes('*')
    
    return {
        patterns: scopes,
        enableAll
    }
}
