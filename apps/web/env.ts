import zod from 'zod/v4'

// Helper to trim trailing slash
const trimTrailingSlash = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url)

// Fallback defaults for local / test usage. **Never** rely on defaults in production.
const LOCAL_APP_FALLBACK = 'http://localhost:3000'
const LOCAL_API_FALLBACK = 'http://localhost:3001'

const guardedUrl = (name: string, fallback: string) =>
    zod
        .url()
        .superRefine((val, ctx) => {
            // If we had to use a fallback in production, surface a hard error.
            if (process.env.NODE_ENV === 'production') {
                if (!val) {
                    ctx.addIssue({ code: 'custom', message: `${name} is required in production but was not provided` })
                }
                ctx.value = val;
                return;
            }
            ctx.value = val || fallback;
        })
        .transform(trimTrailingSlash)

export const envSchema = zod.object({
    REACT_SCAN_GIT_COMMIT_HASH: zod.string().optional(),
    REACT_SCAN_GIT_BRANCH: zod.string().optional(),
    REACT_SCAN_TOKEN: zod.string().optional(),
    // Provide dev/test fallback; production guard above will error if missing.
    NEXT_PUBLIC_APP_URL: guardedUrl('NEXT_PUBLIC_APP_URL', LOCAL_APP_FALLBACK),
    NEXT_PUBLIC_SHOW_AUTH_LOGS: zod.coerce.boolean().optional().default(false),
    // Optional docs site config; when set, used to render a Docs link in the navbar
    NEXT_PUBLIC_DOC_URL: zod
        .string()
        .url()
        .optional()
        .transform((url) => (url ? trimTrailingSlash(url) : url)),
    NEXT_PUBLIC_DOC_PORT: zod.coerce.number().optional(),
    API_URL: guardedUrl('API_URL', LOCAL_API_FALLBACK),
    NODE_ENV: zod
        .enum(['development', 'production', 'test'])
        .optional()
        .default('development'),
    BETTER_AUTH_SECRET: zod.string().optional(),
    BETTER_AUTH_URL: zod.string().url().optional(),
    REACT_SCAN: zod.coerce.boolean().optional().default(false),
    MILLION_LINT: zod.coerce.boolean().optional().default(false),
})

export const validateEnvSafe = (object: object) => {
    return envSchema.safeParse(object)
}

export const envIsValid = (object: object) => {
    return validateEnvSafe(object).success
}

export const validateEnv = (object: object) => {
    return envSchema.parse(object)
}

export const validateEnvPath = <T extends keyof typeof envSchema.shape>(
    input: zod.input<(typeof envSchema.shape)[T]>,
    path: T
): zod.infer<(typeof envSchema.shape)[T]> => {
    return envSchema.shape[path].parse(input) as zod.infer<
        (typeof envSchema.shape)[T]
    >
}
