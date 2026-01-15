import { StandardLinkOptions, StandardLinkPlugin } from '@orpc/client/standard'

/**
 * Cookie and Headers Plugin for ORPC Client
 * 
 * This plugin handles cookie and header management for both client-side and server-side requests:
 * 
 * Server-side (SSR):
 * - Automatically imports and includes Next.js cookies in requests
 * - Merges context cookies with server cookies
 * - Sets Content-Type to application/json
 * 
 * Client-side (Browser):
 * - Merges context headers with request headers
 * - Cookies are automatically handled by browser
 * 
 * @template TContext - The base context type (must include cookie and headers)
 */
export class CookieHeadersPlugin<TContext extends {
  cookie?: string | string[]
  headers?: Record<string, string | string[] | undefined>
}> implements StandardLinkPlugin<TContext> {
  init(link: StandardLinkOptions<TContext>): void {
    link.clientInterceptors ??= []

    link.clientInterceptors.push(async (options) => {
      // Merge context headers into request headers
      options.request.headers = {
        ...options.request.headers,
        ...options.context.headers,
      }
      
      const headers = options.request.headers

      // Server-side specific handling
      if (typeof window === 'undefined') {
        try {
          // Import Next.js headers and get cookies
          const nh = await import('next/headers')
          headers.cookie = (await nh.cookies()).toString()
        } catch {
          console.log(
            'Warning: next/headers could not be imported. Are you running in a non-Next.js environment?'
          )
          
          // Fallback: merge context cookies with existing cookies
          const existing = Array.isArray(headers.cookie)
            ? headers.cookie.filter(Boolean)
            : headers.cookie
              ? [headers.cookie]
              : []
          
          const ctx = Array.isArray(options.context.cookie)
            ? options.context.cookie.filter(Boolean)
            : options.context.cookie
              ? [options.context.cookie]
              : []
          
          const merged = [...existing, ...ctx]
          headers.cookie = merged.length > 0 ? merged : undefined
        }

        // Set Content-Type for server-side requests
        headers['Content-Type'] = 'application/json'
      }

      return options.next(options)
    })
  }
}
