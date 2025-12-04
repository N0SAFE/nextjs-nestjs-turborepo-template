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

// Create the masterTokenSignOut by wrapping the original signOut with the plugin's factory
// The plugin provides $masterTokenSignOut as a factory that takes the original signOut
// and returns a wrapped version that handles dev auth mode
export const signOut = hasMasterTokenPlugin(authClient)
    ? authClient.$masterTokenSignOut(authClient.signOut)
    : authClient.signOut

// Auth pages configuration for Better Auth
export const pages = {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
} as const
