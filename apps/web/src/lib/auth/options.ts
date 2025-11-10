import { createAuthClientFactory } from '@repo/auth/client'
import { validateEnvPath } from '#/env'

const appUrl = validateEnvPath(
    process.env.NEXT_PUBLIC_APP_URL ?? '',
    'NEXT_PUBLIC_APP_URL'
)

export const authClient = createAuthClientFactory({
    basePath: '/api/auth',
    baseURL: appUrl,
    fetchOptions: {
        credentials: 'include',
    },
})
