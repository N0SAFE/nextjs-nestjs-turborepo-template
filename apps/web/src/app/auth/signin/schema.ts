import zod from 'zod/v4'

export const loginSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(6),
})
