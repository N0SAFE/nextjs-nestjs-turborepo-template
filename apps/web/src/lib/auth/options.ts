import { BetterAuthClientOptions } from 'better-auth'
import { createAuthClientFactory } from '@repo/auth/client'
import { getBaseApiUrl } from '../api-url'

export const authClient = createAuthClientFactory({
    basePath: '/api/auth',
    baseURL: getBaseApiUrl(),
    fetchOptions: {
        credentials: 'include',
    },
} satisfies BetterAuthClientOptions)
