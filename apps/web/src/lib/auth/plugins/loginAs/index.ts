import { BetterAuthClientPlugin } from "better-auth"

export const loginAsClientPlugin = () => {
    return {
        id: 'login-as',
        $InferServerPlugin: {} as ReturnType<typeof import('@api/config/auth/plugins').loginAsPlugin>,
    } satisfies BetterAuthClientPlugin
}