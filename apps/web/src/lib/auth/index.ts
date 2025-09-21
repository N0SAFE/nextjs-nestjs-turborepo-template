import { validateEnvPath } from '#/env'
import { createAuthClient } from 'better-auth/react'
import { passkeyClient } from 'better-auth/client/plugins'
import masterTokenClient from './plugins/masterToken'
import { hasMasterTokenPlugin } from './plugins/guards'
import { loginAsClientPlugin } from './plugins/loginAs'

const appUrl = validateEnvPath(
    process.env.NEXT_PUBLIC_APP_URL!,
    'NEXT_PUBLIC_APP_URL'
)

export const authClient = createAuthClient({
    basePath: '/api/auth',
    baseURL: appUrl,
    plugins: [passkeyClient(), masterTokenClient(), loginAsClientPlugin()],
})

export const {
    signIn,
    signUp,
    useSession,
    getSession,
    $store,
    $fetch,
    $ERROR_CODES,
    $Infer,
} = authClient

export const signOut = hasMasterTokenPlugin(authClient) ? authClient.masterTokenSignOut: authClient.signOut 

// Auth pages configuration for Better Auth
export const pages = {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
} as const