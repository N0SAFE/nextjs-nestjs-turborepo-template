import { hasMasterTokenPlugin } from '@repo/auth/client'
import { authClient } from './options'

export { authClient }

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

export const signOut = hasMasterTokenPlugin(authClient)
    ? authClient.masterTokenSignOut
    : authClient.signOut

// Auth pages configuration for Better Auth
export const pages = {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
} as const
