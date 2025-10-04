import { z } from 'zod'

export const Route = {
    name: 'DemoInnerState',
    params: z.object({}),
    search: z.object({}),
}
