/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { z } from 'zod'
import { safeParse } from 'zod/v4'

interface ParsedData<T> { error?: string; data?: T }

export function safeParseSearchParams<T extends z.ZodType>(
    schema: T,
    searchParams: URLSearchParams
): any {
    const paramsArray = getAllParamsAsArrays(searchParams)
    return processSchema(schema, paramsArray)
}

function processSchema(
    schema: any,
    paramsArray: Record<string, string[]>
): Record<string, unknown> {
    if (schema instanceof z.ZodOptional) {
        schema = schema.def.innerType
    }
    switch ((schema as object).constructor) {
        case z.ZodObject: {
            const { shape } = schema as z.ZodObject<z.ZodRawShape>
            return parseShape(shape, paramsArray)
        }
        case z.ZodUnion: {
            const { options } = (
                schema as z.ZodUnion<
                    [
                        z.ZodObject<z.ZodRawShape>,
                        ...z.ZodObject<z.ZodRawShape>[],
                    ]
                >
            ).def
            for (const option of options) {
                const { shape } = option
                const requireds = getRequireds(shape)

                const result = parseShape(shape, paramsArray, true)
                const keys = Object.keys(result)

                if (requireds.every((key) => keys.includes(key))) {
                    return result
                }
            }
            return {}
        }
        default:
            throw new Error('Unsupported schema type')
    }
}

function getRequireds(shape: z.ZodRawShape) {
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
            if (paramsArray[key]) {
                const fieldData = convertToRequiredType(
                    paramsArray[key],
                    fieldSchema
                )

                if (fieldData.error) {
                    if (isPartOfUnion) {
                        return {}
                    }
                    continue
                }
                const result = safeParse(fieldSchema, fieldData.data)
                if (result.success) {
                    parsed[key] = result.data
                }
            } else if (fieldSchema instanceof z.ZodDefault) {
                const result = fieldSchema.safeParse(undefined)
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
        if (!params[key]) {
            params[key] = []
        }
        params[key].push(value)
    })

    return params
}

function convertToRequiredType(
    values: string[],
    schema: z.core.$ZodType
): ParsedData<unknown> {
    const usedSchema = getInnerType(schema)
    if (values.length > 1 && !(usedSchema instanceof z.ZodArray)) {
        return { error: 'Multiple values for non-array field' }
    }
    const value = parseValues(usedSchema, values)
    if (value.error && schema.constructor === z.ZodDefault) {
        return { data: undefined }
    }
    return value
}

function parseValues(schema: z.core.$ZodType, values: string[]): ParsedData<unknown> {
    switch (schema.constructor) {
        case z.ZodNumber:
            return parseNumber(values[0])
        case z.ZodBoolean:
            return parseBoolean(values[0])
        case z.ZodString:
            return { data: values[0] }
        case z.ZodArray: {
            const elementSchema = schema._zod.def.type
            switch (elementSchema.constructor) {
                case z.ZodNumber:
                    return parseArray(values, parseNumber)
                case z.ZodBoolean:
                    return parseArray(values, parseBoolean)
                case z.ZodString:
                    return { data: values }
                default:
                    return {
                        error:
                            'unsupported array element type ' +
                            String(elementSchema.constructor),
                    }
            }
        }
        default:
            return { error: 'unsupported type ' + String(schema.constructor) }
    }
}

function getInnerType(schema: z.core.$ZodType) {
    switch (schema.constructor) {
        case z.ZodOptional:
        case z.ZodDefault:
            return (schema._zod.def as unknown as {innerType: z.core.$ZodType}).innerType
        default:
            return schema
    }
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
    const numbers = values.map(parseFunction)
    const error = numbers.find((n) => n.error)?.error
    if (error) {
        return { error }
    }
    return { data: numbers.filter((n): n is Omit<ParsedData<T>, "data"> & {data: T} => Boolean(n.data)).map((n) => n.data) }
}
