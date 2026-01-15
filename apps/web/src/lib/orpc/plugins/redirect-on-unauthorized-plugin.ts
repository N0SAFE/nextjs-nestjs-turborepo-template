import { StandardLinkOptions, StandardLinkPlugin } from '@orpc/client/standard'
import { toAbsoluteUrl } from '@/lib/utils'
import clientRedirect from '@/actions/redirect'
import { redirect, RedirectType } from 'next/navigation'

/**
 * Plugin that automatically redirects to login page on 401 Unauthorized errors
 * 
 * Features:
 * - Server-side: Uses Next.js redirect()
 * - Client-side: Uses client-side navigation
 * - Respects noRedirectOnUnauthorized context flag
 * - Ignores AbortError (user cancelled requests)
 * - Logs redirect events for debugging
 * 
 * @example
 * ```typescript
 * // Normal usage - will redirect on 401
 * await orpc.users.getProfile()
 * 
 * // Disable redirect for manual error handling
 * await orpc.users.getProfile({}, { 
 *   context: { noRedirectOnUnauthorized: true } 
 * })
 * ```
 */
export class RedirectOnUnauthorizedPlugin<
    T extends {
        /**
         * If true, prevents automatic redirect on 401 errors
         * Useful for forms or components that want to handle auth errors themselves
         */
        noRedirectOnUnauthorized?: boolean
    }
> implements StandardLinkPlugin<T> {
    // Order controls plugin loading order (higher = loads earlier)
    order = 100

    init(link: StandardLinkOptions<T>): void {
        // Add error interceptor to handle 401 responses
        link.interceptors = link.interceptors ?? []
        
        link.interceptors.push(async (interceptorOptions) => {
            try {
                return await interceptorOptions.next(interceptorOptions)
            } catch (error) {
                // Ignore abort errors (user cancelled request)
                if (
                    (error as Error | undefined)?.name === 'AbortError' ||
                    (error &&
                        typeof error === 'object' &&
                        'code' in error &&
                        error.code === 'ABORT_ERR')
                ) {
                    throw error
                }

                // Check if redirect is disabled for this request
                if (interceptorOptions.context.noRedirectOnUnauthorized) {
                    throw error
                }

                // Check if this is a 401 Unauthorized error
                if (
                    error &&
                    typeof error === 'object' &&
                    'status' in error &&
                    error.status === 401
                ) {
                    console.log('ORPC Unauthorized - redirecting to login')
                    
                    const loginUrl = toAbsoluteUrl('/login')
                    
                    // Client-side: use client redirect
                    if (typeof window !== 'undefined') {
                        void clientRedirect(loginUrl)
                    } 
                    // Server-side: use Next.js redirect
                    else {
                        redirect(loginUrl, RedirectType.replace)
                    }
                }
                
                // Re-throw the error if not handled
                throw error
            }
        })
    }
}

/**
 * Factory function to create a RedirectOnUnauthorizedPlugin instance
 * 
 * @example
 * ```typescript
 * const link = new OpenAPILink(appContract, {
 *   plugins: [
 *     createRedirectOnUnauthorizedPlugin(),
 *     // ... other plugins
 *   ]
 * })
 * ```
 */
export function createRedirectOnUnauthorizedPlugin() {
    return new RedirectOnUnauthorizedPlugin()
}

const redirectPluginDefault = {
    RedirectOnUnauthorizedPlugin,
}

export default redirectPluginDefault
