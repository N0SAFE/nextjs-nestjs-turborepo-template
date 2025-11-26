import zod from 'zod/v4'
import { apiEnvSchema, webEnvSchema, docEnvSchema, allEnvSchema } from './index'

// ============================================================================
// API Validation Functions
// ============================================================================

/**
 * Validate API environment variables (safe - returns result)
 */
export const validateApiEnvSafe = (object: object) => {
    return apiEnvSchema.safeParse(object)
}

/**
 * Validate API environment variables (throws on error)
 */
export const validateApiEnv = (object: object) => {
    return apiEnvSchema.parse(object)
}

/**
 * Check if API environment is valid
 */
export const apiEnvIsValid = (object: object) => {
    return validateApiEnvSafe(object).success
}

/**
 * Validate a specific path in the API environment schema
 */
export const validateApiEnvPath = <T extends keyof typeof apiEnvSchema.shape>(
    input: zod.input<(typeof apiEnvSchema.shape)[T]>,
    path: T
): zod.infer<(typeof apiEnvSchema.shape)[T]> => {
    return apiEnvSchema.shape[path].parse(input) as zod.infer<
        (typeof apiEnvSchema.shape)[T]
    >
}

// ============================================================================
// Web Validation Functions
// ============================================================================

/**
 * Validate Web environment variables (safe - returns result)
 */
export const validateWebEnvSafe = (object: object) => {
    return webEnvSchema.safeParse(object)
}

/**
 * Validate Web environment variables (throws on error)
 */
export const validateWebEnv = (object: object) => {
    return webEnvSchema.parse(object)
}

/**
 * Check if Web environment is valid
 */
export const webEnvIsValid = (object: object) => {
    return validateWebEnvSafe(object).success
}

/**
 * Validate a specific path in the Web environment schema
 */
export const validateWebEnvPath = <T extends keyof typeof webEnvSchema.shape>(
    input: zod.input<(typeof webEnvSchema.shape)[T]>,
    path: T
): zod.infer<(typeof webEnvSchema.shape)[T]> => {
    return webEnvSchema.shape[path].parse(input) as zod.infer<
        (typeof webEnvSchema.shape)[T]
    >
}

// ============================================================================
// Doc Validation Functions
// ============================================================================

/**
 * Validate Doc environment variables (safe - returns result)
 */
export const validateDocEnvSafe = (object: object) => {
    return docEnvSchema.safeParse(object)
}

/**
 * Validate Doc environment variables (throws on error)
 */
export const validateDocEnv = (object: object) => {
    return docEnvSchema.parse(object)
}

/**
 * Check if Doc environment is valid
 */
export const docEnvIsValid = (object: object) => {
    return validateDocEnvSafe(object).success
}

// ============================================================================
// All Apps Validation Functions
// ============================================================================

/**
 * Validate all apps' environment variables (safe - returns result)
 */
export const validateAllEnvSafe = (env: { api: object; web: object; doc: object }) => {
    return allEnvSchema.safeParse(env)
}

/**
 * Validate all apps' environment variables (throws on error)
 */
export const validateAllEnv = (env: { api: object; web: object; doc: object }) => {
    return allEnvSchema.parse(env)
}

/**
 * Check if all apps' environments are valid
 */
export const allEnvIsValid = (env: { api: object; web: object; doc: object }) => {
    return validateAllEnvSafe(env).success
}
