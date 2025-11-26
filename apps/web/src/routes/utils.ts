import { z } from 'zod'

interface ParsedData<T> { error?: string; data?: T }

type ZodSchema = z.ZodType

export function safeParseSearchParams<T extends ZodSchema>(
    schema: T,
    searchParams: URLSearchParams
): z.infer<T> {
    const paramsArray = getAllParamsAsArrays(searchParams)
    return processSchema(schema, paramsArray) as z.infer<T>
}

function processSchema(
    schema: ZodSchema,
    paramsArray: Record<string, string[]>
): Record<string, unknown> {
    // Unwrap optional wrapper if present
    let unwrappedSchema = schema
    if (schema instanceof z.ZodOptional) {
        unwrappedSchema = schema.unwrap()
    }

    if (unwrappedSchema instanceof z.ZodObject) {
        const shape = unwrappedSchema.shape as z.ZodRawShape
        return parseShape(shape, paramsArray)
    }

    if (unwrappedSchema instanceof z.ZodUnion) {
        const options = unwrappedSchema.options as z.ZodObject<z.ZodRawShape>[]
        for (const option of options) {
            const shape = option.shape
            const requireds = getRequireds(shape)

            const result = parseShape(shape, paramsArray, true)
            const keys = Object.keys(result)

            if (requireds.every((key) => keys.includes(key))) {
                return result
            }
        }
        return {}
    }

    throw new Error('Unsupported schema type')
}

function getRequireds(shape: z.ZodRawShape): string[] {
    const keys: string[] = []
    for (const key in shape) {
        const fieldShape = shape[key]
        if (
            !(fieldShape instanceof z.ZodDefault) &&
            !(fieldShape instanceof z.ZodOptional)
        ) {
            keys.push(key)
        }
    }
    return keys
}

function parseShape(
    shape: z.ZodRawShape,
    paramsArray: Record<string, string[]>,
    isPartOfUnion = false
): Record<string, unknown> {
    const parsed: Record<string, unknown> = {}

    for (const key in shape) {
        if (Object.hasOwn(shape, key)) {
            const fieldSchema = shape[key]
            if (!fieldSchema) continue
            
            const values = paramsArray[key]
            if (values) {
                const fieldData = convertToRequiredType(values, fieldSchema)

                if (fieldData.error) {
                    if (isPartOfUnion) {
                        return {}
                    }
                    continue
                }
                if (fieldData.data !== undefined) {
                    const result = (fieldSchema as z.ZodType).safeParse(fieldData.data)
                    if (result.success) {
                        parsed[key] = result.data
                    }
                }
            } else if (fieldSchema instanceof z.ZodDefault) {
                const result = (fieldSchema as z.ZodType).safeParse(undefined)
                if (result.success) {
                    parsed[key] = result.data
                }
            }
        }
    }

    return parsed
}

function getAllParamsAsArrays(
    searchParams: URLSearchParams
): Record<string, string[]> {
    const params: Record<string, string[]> = {}

    searchParams.forEach((value, key) => {
        params[key] ??= []
        params[key].push(value)
    })

    return params
}

function convertToRequiredType(
    values: string[],
    schema: ZodSchema
): ParsedData<unknown> {
    const usedSchema = getInnerType(schema)
    if (values.length > 1 && !(usedSchema instanceof z.ZodArray)) {
        return { error: 'Multiple values for non-array field' }
    }
    const value = parseValues(usedSchema, values)
    if (value.error && schema instanceof z.ZodDefault) {
        return { data: undefined }
    }
    return value
}

function parseValues(schema: ZodSchema, values: string[]): ParsedData<unknown> {
    const firstValue = values[0]
    
    if (schema instanceof z.ZodNumber) {
        if (firstValue === undefined) return { error: 'No value provided for number field' }
        return parseNumber(firstValue)
    }
    
    if (schema instanceof z.ZodBoolean) {
        if (firstValue === undefined) return { error: 'No value provided for boolean field' }
        return parseBoolean(firstValue)
    }
    
    if (schema instanceof z.ZodString) {
        return { data: firstValue }
    }
    
    if (schema instanceof z.ZodArray) {
        const elementSchema = schema.element
        
        if (elementSchema instanceof z.ZodNumber) {
            return parseArray(values, parseNumber)
        }
        if (elementSchema instanceof z.ZodBoolean) {
            return parseArray(values, parseBoolean)
        }
        if (elementSchema instanceof z.ZodString) {
            return { data: values }
        }
        return {
            error: 'unsupported array element type ' + elementSchema.constructor.name,
        }
    }
    
    return { error: 'unsupported type ' + schema.constructor.name }
}

function getInnerType(schema: ZodSchema): ZodSchema {
    if (schema instanceof z.ZodOptional) {
        return schema.unwrap()
    }
    if (schema instanceof z.ZodDefault) {
        return schema.unwrap()
    }
    return schema
}

function parseNumber(str: string): ParsedData<number> {
    const num = +str
    return isNaN(num) ? { error: `${str} is NaN` } : { data: num }
}

function parseBoolean(str: string): ParsedData<boolean> {
    switch (str) {
        case 'true':
            return { data: true }
        case 'false':
            return { data: false }
        default:
            return { error: `${str} is not a boolean` }
    }
}

function parseArray<T>(
    values: string[],
    parseFunction: (str: string) => ParsedData<T>
): ParsedData<T[]> {
    const results = values.map(parseFunction)
    const errorResult = results.find((n) => n.error)
    if (errorResult?.error) {
        return { error: errorResult.error }
    }
    return { data: results.map((n) => n.data).filter((d): d is T => d !== undefined) }
}
