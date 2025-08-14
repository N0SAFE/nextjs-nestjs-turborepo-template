import { z } from 'zod'

export const Route = {
    name: 'Authsignin',
    params: z.object({}),
    search: z.object({
        callbackUrl: z.string().optional(),
    }),
}
