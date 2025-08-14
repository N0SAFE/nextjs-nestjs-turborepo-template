import { z } from 'zod'

export const Route = {
    name: 'Middlewareerrorenv',
    params: z.object({}),
    search: z.object({
        from: z.string().optional(),
    })
}
