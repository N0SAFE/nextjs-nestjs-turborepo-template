import { ClientOptions } from 'better-auth'
import masterTokenClient from './plugins/masterToken'
import { loginAsClientPlugin } from './plugins/loginAs'
import { passkeyClient } from 'better-auth/client/plugins'
import { validateEnvPath } from '#/env'

const appUrl = validateEnvPath(
    process.env.NEXT_PUBLIC_APP_URL!,
    'NEXT_PUBLIC_APP_URL'
)

export const options = {
    basePath: '/api/auth',
    baseURL: appUrl,
    plugins: [passkeyClient(), masterTokenClient(), loginAsClientPlugin()],
} satisfies ClientOptions
