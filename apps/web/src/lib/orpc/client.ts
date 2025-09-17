import { createORPCClient, onError } from '@orpc/client';
import { type AppContract, appContract } from '@repo/api-contracts';
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { ContractRouterClient } from '@orpc/contract'
import { validateEnvPath } from '#/env';
import { Authsignin } from '@/routes/index';
import { toAbsoluteUrl } from '@/lib/utils';
import redirect from '@/actions/redirect';
import { getDevAuthEnabled } from '@/lib/dev-auth-cookie';

const APP_URL = validateEnvPath(process.env.NEXT_PUBLIC_APP_URL!, 'NEXT_PUBLIC_APP_URL')

// Create ORPC client with optional server cookies
export function createORPCClientWithCookies(serverCookies?: string) {
  const link = new OpenAPILink(appContract, {
    // Use API_URL directly for server-side requests, APP_URL with /api/nest for client-side
    url: typeof window === 'undefined' ? validateEnvPath(process.env.API_URL!, 'API_URL') : `${APP_URL}/api/nest`,
    headers: ({context}) => {
      const headers: Record<string, string> = {};
      
      // For server-side requests, use provided cookies
      if (typeof window === 'undefined' && serverCookies) {
        headers.cookie = serverCookies;
        headers['Content-Type'] = 'application/json';
      } else {
        // For client-side requests, use context cookie
        headers.cookie = context.cookie || '';
      }
      
      // Check if dev auth token mode is enabled (client-side only in development)
      if (typeof window !== 'undefined' && 
          process.env.NODE_ENV === 'development' && 
          getDevAuthEnabled()) {
        // We need to get the DEV_AUTH_KEY from the server
        // For now, we'll use a placeholder - this will be handled by a server endpoint
        const devAuthKey = process.env.NEXT_PUBLIC_DEV_AUTH_KEY;
        if (devAuthKey) {
          headers.Authorization = `Bearer ${devAuthKey}`;
        }
      }
      
      return headers;
    },
    interceptors: [
      onError((error) => {
        // Don't log AbortError as it's expected when queries are canceled
        if ((error as Error)?.name === 'AbortError' || (error && typeof error === 'object' && 'code' in error && error.code === 'ABORT_ERR')) {
          // Silently ignore abort errors - they're expected during cleanup
          return;
        }
        
        // Check if this is a 401 Unauthorized error
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          // Only redirect on client-side to avoid SSR issues
          if (typeof window !== 'undefined') {
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