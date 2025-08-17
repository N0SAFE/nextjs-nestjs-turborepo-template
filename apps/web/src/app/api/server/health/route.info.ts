import { z } from 'zod'

export const Route = {
    name: 'ApiServerHealth',
    params: z.object({}),
}

export const GET = {
    result: z.object({}),
}
