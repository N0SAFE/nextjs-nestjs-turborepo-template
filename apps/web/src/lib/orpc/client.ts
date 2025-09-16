import { createORPCClient, onError } from '@orpc/client';
import { type AppContract, appContract } from '@repo/api-contracts';
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { ContractRouterClient } from '@orpc/contract'
import { validateEnvPath } from '#/env';
import { Authsignin } from '@/routes/index';
import { toAbsoluteUrl } from '@/lib/utils';
import redirect from '@/actions/redirect';

const APP_URL = validateEnvPath(process.env.NEXT_PUBLIC_APP_URL!, 'NEXT_PUBLIC_APP_URL')

// Create ORPC client with optional server cookies
export function createORPCClientWithCookies(serverCookies?: string) {
  const link = new OpenAPILink(appContract, {
    // Use API_URL directly for server-side requests, APP_URL with /api/nest for client-side
    url: typeof window === 'undefined' ? validateEnvPath(process.env.API_URL!, 'API_URL') : `${APP_URL}/api/nest`,
    headers: ({context}) => {
      // For server-side requests, use provided cookies
      if (typeof window === 'undefined' && serverCookies) {
        return {
          cookie: serverCookies,
          'Content-Type': 'application/json',
        };
      }
      
      // For client-side requests, use context cookie
      return {
        cookie: context.cookie || '',
      };
    },
    interceptors: [
      onError((error) => {
        // Don't log AbortError as it's expected when queries are canceled
        if ((error as Error)?.name === 'AbortError' || (error && typeof error === 'object' && 'code' in error && error.code === 'ABORT_ERR')) {
          // Silently ignore abort errors - they're expected during cleanup
          return;
        }
        
        console.error('ORPC Error:', error)
        
        // Check if this is a 401 Unauthorized error
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          // Only redirect on client-side to avoid SSR issues
          if (typeof window !== 'undefined') {
            console.log('401 Unauthorized detected, redirecting to login...')
            
            // Get current page URL for redirect callback
            const currentPath = window.location.pathname + window.location.search
            
            // Generate login URL with callback
            const loginUrl = toAbsoluteUrl(
              Authsignin(
                {},
                {
                  callbackUrl: currentPath,
                }
              )
            )
            
            // Redirect to login page
            window.location.href = loginUrl
            redirect(loginUrl)
          }

          throw error; // Re-throw to allow further handling if needed
        }
      })
    ],
  })

  return createORPCClient<ContractRouterClient<AppContract>>(link);
}