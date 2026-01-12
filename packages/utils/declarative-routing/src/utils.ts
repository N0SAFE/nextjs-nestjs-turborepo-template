/**
 * URL Search Parameters Parsing Utilities
 * 
 * This module provides utilities for parsing Next.js searchParams
 * using Zod schemas with proper type coercion for URL parameters.
 * 
 * Key features:
 * - Supports ZodObject, ZodUnion, and nested schemas
 * - Handles arrays and numeric parameters
 * - Preserves optional/nullable types
 * - Type-safe parsing with Zod validation
 * 
 * Compatible with Zod v4
 */

import { z } from 'zod'

/**
 * Supported types for URL parameter conversion.
 */
type SupportedType = 'string' | 'number' | 'boolean' | 'array'

/**
 * Processed query parameter value ready for Zod parsing.
 */
type ProcessedValue = string | number | boolean | (string | number | boolean)[]

/**
 * Next.js searchParams type - can be a plain object or a Promise.
 */
type SearchParamsType = 
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>

/**
 * Safe parse result type (Zod v4 compatible).
 */
type SafeParseResult<T> = 
    | { success: true; data: T }
    | { success: false; error: z.ZodError<T> }

/**
 * Convert a raw query value to the expected Zod type.
 * 
 * @param value - Raw value from URL search params (string, array, or undefined)
 * @param expectedType - The expected Zod type for conversion
 * @returns Converted value suitable for Zod parsing
 */
function convertToRequiredType(
    value: string | string[] | undefined,
    expectedType: SupportedType
): ProcessedValue | undefined {
    if (value === undefined) {
        return undefined
    }

    switch (expectedType) {
        case 'number': {
            if (Array.isArray(value)) {
                return value.map((v) => {
                    const parsed = parseFloat(v)
                    return isNaN(parsed) ? v : parsed
                })
            }
            const parsed = parseFloat(value)
            return isNaN(parsed) ? value : parsed
        }

        case 'boolean':
            if (Array.isArray(value)) {
                return value.map((v) => v === 'true')
            }
            return value === 'true'

        case 'array':
            return Array.isArray(value) ? value : [value]

        case 'string':
        default:
            return value
    }
}

/**
 * Get the schema type name for Zod v4 compatibility.
 * In Zod v4, we use schema.def.type to identify schema types.
 */
function getSchemaTypeName(schema: z.ZodType): string {
    // Access the internal type name
    const def = schema.def
    if (typeof def === 'object' && 'type' in def) {
        return def.type
    }
    // Fallback to constructor name
    return schema.constructor.name
}

/**
 * Get the inner type for wrapper schemas (optional, nullable, default, etc.)
 */
function getInnerSchema(schema: z.ZodType): z.ZodType | null {
    const def = schema.def
    // Zod v4 uses 'innerType' for wrappers
    if ('innerType' in def && def.innerType) {
        return def.innerType as z.ZodType
    }
    // Also check 'schema' for pipe/transform
    if ('schema' in def && def.schema) {
        return def.schema as z.ZodType
    }
    return null
}

/**
 * Get the expected type from a Zod schema.
 * 
 * Unwraps optional, nullable, and default wrappers to find
 * the underlying type for proper conversion.
 * 
 * Compatible with Zod v4.
 */
function getExpectedType(schema: z.ZodType): SupportedType {
    const typeName = getSchemaTypeName(schema)
    
    // Check wrapper types first - unwrap them recursively
    const wrapperTypes = ['optional', 'nullable', 'default', 'prefault', 'nonoptional']
    if (wrapperTypes.includes(typeName)) {
        const inner = getInnerSchema(schema)
        if (inner) {
            return getExpectedType(inner)
        }
    }

    // Check pipe/transform schemas
    if (typeName === 'pipe' || typeName === 'transform') {
        const inner = getInnerSchema(schema)
        if (inner) {
            return getExpectedType(inner)
        }
    }

    // Check primitive types (including coerced versions)
    if (typeName === 'array') {
        return 'array'
    }
    if (typeName === 'number') {
        return 'number'
    }
    if (typeName === 'boolean') {
        return 'boolean'
    }
    if (typeName === 'string') {
        return 'string'
    }

    // For unions, try to find a numeric type first, then boolean, then string
    if (typeName === 'union') {
        const def = schema.def
        if (typeof def === 'object' && 'options' in def && Array.isArray(def.options)) {
            const options = def.options as z.ZodType[]
            for (const option of options) {
                const optionType = getExpectedType(option)
                if (optionType === 'number') return 'number'
            }
            for (const option of options) {
                const optionType = getExpectedType(option)
                if (optionType === 'boolean') return 'boolean'
            }
        }
    }

    return 'string'
}

/**
 * Get the shape from a Zod object schema (v4 compatible).
 */
function getSchemaShape(schema: z.ZodType): Record<string, z.ZodType> | null {
    const def = schema.def
    if (typeof def === 'object' && 'shape' in def) {
        const shape = def.shape
        // In Zod v4, shape can be a function or an object
        if (typeof shape === 'function') {
            const shapeGetter = shape as () => Record<string, z.ZodType>
            return shapeGetter()
        }
        if (shape && typeof shape === 'object') {
            return shape as Record<string, z.ZodType>
        }
    }
    return null
}

/**
 * Parse the shape of a Zod schema.
 * 
 * Handles ZodObject, ZodUnion, and nested schema structures.
 * Returns a record of key-value pairs with expected types.
 * 
 * Compatible with Zod v4.
 */
function parseShape(
    schema: z.ZodType,
    rawParams: Record<string, string | string[] | undefined>
): Record<string, ProcessedValue | undefined> {
    const typeName = getSchemaTypeName(schema)

    // Handle ZodObject
    if (typeName === 'object') {
        const shape = getSchemaShape(schema)
        if (shape) {
            const result: Record<string, ProcessedValue | undefined> = {}
            for (const [key, fieldSchema] of Object.entries(shape)) {
                const expectedType = getExpectedType(fieldSchema)
                const rawValue = rawParams[key]
                result[key] = convertToRequiredType(rawValue, expectedType)
            }
            return result
        }
    }

    // Handle ZodUnion - try each option's shape
    if (typeName === 'union') {
        const def = schema.def
        if (typeof def === 'object' && 'options' in def && Array.isArray(def.options)) {
            const options = def.options as z.ZodType[]
            for (const option of options) {
                const result = parseShape(option, rawParams)
                if (Object.keys(result).length > 0) {
                    return result
                }
            }
        }
    }

    // Handle pipe/transform (refinements, transforms)
    if (typeName === 'pipe' || typeName === 'transform') {
        const inner = getInnerSchema(schema)
        if (inner) {
            return parseShape(inner, rawParams)
        }
    }

    // Fallback: return raw params as-is
    return rawParams as Record<string, ProcessedValue | undefined>
}

/**
 * Process a Zod schema to prepare raw params for parsing.
 * 
 * This function converts URL string values to the types expected
 * by the Zod schema (numbers, booleans, arrays, etc.).
 */
function processSchema<T extends z.ZodType>(
    schema: T,
    rawParams: Record<string, string | string[] | undefined>
): z.input<T> {
    return parseShape(schema, rawParams) as z.input<T>
}

/**
 * Safely parse URL search parameters using a Zod schema.
 * 
 * This function:
 * 1. Awaits the searchParams if it's a Promise (Next.js 15+)
 * 2. Converts string values to the expected types (number, boolean, array)
 * 3. Parses with Zod for validation
 * 4. Returns the validated output
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * import { safeParseSearchParams } from '@repo/declarative-routing/utils'
 * 
 * const searchSchema = z.object({
 *   page: z.coerce.number().optional().default(1),
 *   query: z.string().optional(),
 *   tags: z.array(z.string()).optional(),
 * })
 * 
 * export default async function Page({ searchParams }) {
 *   const params = await safeParseSearchParams(searchParams, searchSchema)
 *   // params.page is number, params.query is string | undefined
 *   // params.tags is string[] | undefined
 * }
 * ```
 * 
 * @param searchParams - Next.js searchParams (plain object or Promise)
 * @param schema - Zod schema to validate against
 * @returns Validated search parameters with proper types
 */
export async function safeParseSearchParams<T extends z.ZodType>(
    searchParams: SearchParamsType,
    schema: T
): Promise<z.output<T>> {
    // Await if Promise (Next.js 15+)
    const rawParams = await Promise.resolve(searchParams)
    
    // Convert to expected types based on schema
    const processedParams = processSchema(schema, rawParams)
    
    // Parse with Zod
    return schema.parse(processedParams) as z.output<T>
}

/**
 * Synchronous version of safeParseSearchParams.
 * 
 * Use this when you're certain searchParams is not a Promise
 * (e.g., in client components after unwrapping with React.use()).
 * 
 * @param searchParams - Plain object searchParams
 * @param schema - Zod schema to validate against
 * @returns Validated search parameters with proper types
 */
export function safeParseSearchParamsSync<T extends z.ZodType>(
    searchParams: Record<string, string | string[] | undefined>,
    schema: T
): z.output<T> {
    const processedParams = processSchema(schema, searchParams)
    return schema.parse(processedParams) as z.output<T>
}

/**
 * Try to parse search params without throwing on failure.
 * 
 * Returns a safe result object with either the data or the error.
 * 
 * @example
 * ```tsx
 * const result = await safeTryParseSearchParams(searchParams, schema)
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export async function safeTryParseSearchParams<T extends z.ZodType>(
    searchParams: SearchParamsType,
    schema: T
): Promise<SafeParseResult<z.output<T>>> {
    const rawParams = await Promise.resolve(searchParams)
    const processedParams = processSchema(schema, rawParams)
    return schema.safeParse(processedParams) as SafeParseResult<z.output<T>>
}

// Re-export Zod for convenience
export { z }
