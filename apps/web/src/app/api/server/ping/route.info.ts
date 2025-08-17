import { z } from 'zod'

export const Route = {
    name: 'ApiServerPing',
    params: z.object({}),
}

export const GET = {
    result: z.object({}),
}
