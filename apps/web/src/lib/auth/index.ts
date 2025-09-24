import { createAuthClient } from 'better-auth/react'
import { hasMasterTokenPlugin } from './plugins/guards'
import { options } from './options'

export const authClient = createAuthClient(options)

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
