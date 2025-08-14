import { z } from 'zod'

export const Route = {
    name: 'Authsignup',
    params: z.object({}),
    search: z.object({
        callbackUrl: z.string().optional(),
    }),
}
