import { z } from 'zod'

export const Route = {
    name: 'MiddlewareerrorhealthCheck',
    params: z.object({}),
    search: z.object({
        json: z.string().optional(),
        from: z.string().optional()
    })
}
