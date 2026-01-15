import { authClient } from '../../auth'
import { parseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { StandardLinkOptions, StandardLinkPlugin } from '@orpc/client/standard'
import { hasMasterTokenPlugin } from '@repo/auth/client'

/**
 * Master Token Plugin for ORPC Client
 * 
 * This plugin adds Authorization headers for development authentication using the master token.
 * It handles both client-side (browser) and server-side (SSR) scenarios.
 * 
 * In development mode, when the master token is enabled:
 * - Client-side: Checks if MasterTokenManager.state is active and adds Bearer token
 * - Server-side: Checks for 'master-token-enabled' cookie and adds Bearer token
 * 
 * @template TContext - The base context type
 */
export class MasterTokenPlugin<T extends never> implements StandardLinkPlugin<T> {
  init(link: StandardLinkOptions<T>): void {
    link.clientInterceptors ??= []

    link.clientInterceptors.push(async (options) => {
      // Only run in development mode
      if (process.env.NODE_ENV !== 'development') {
        return options.next(options)
      }

      // Only proceed if authClient has master token plugin
      if (!hasMasterTokenPlugin(authClient)) {
        return options.next(options)
      }

      const headers = options.request.headers

      if (typeof window !== 'undefined') {
        // Client-side: Check if master token is enabled
        const authClientModule = await import('../../auth').then((m) => m.authClient)
        
        if (hasMasterTokenPlugin(authClientModule) && authClientModule.MasterTokenManager.state) {
          const devAuthKey = process.env.NEXT_PUBLIC_DEV_AUTH_KEY

          if (devAuthKey) {
            headers.Authorization = `Bearer ${devAuthKey}`
          }
        }
      } else {
        // Server-side: Check for master-token-enabled cookie
        const cookieHeader = Array.isArray(headers.cookie)
          ? headers.cookie.join('; ')
          : headers.cookie ?? ''
        
        const cookies = parseCookie(cookieHeader)
        
        if (cookies.get('master-token-enabled')) {
          const devAuthKey = process.env.NEXT_PUBLIC_DEV_AUTH_KEY

          if (devAuthKey) {
            headers.Authorization = `Bearer ${devAuthKey}`
          }
        }
      }

      return options.next(options)
    })
  }
}
