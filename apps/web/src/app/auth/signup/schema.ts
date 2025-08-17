import zod from 'zod/v4'

export const signupSchema = zod.object({
    name: zod.string().min(2, 'Name must be at least 2 characters'),
    email: zod.email('Please enter a valid email address'),
    password: zod.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: zod.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})
