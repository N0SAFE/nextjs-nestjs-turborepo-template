/* eslint @typescript-eslint/no-explicit-any: 0 */

import {
    useQueryStates,
    parseAsString,
    parseAsInteger,
    parseAsBoolean,
    parseAsFloat,
    parseAsArrayOf,
    parseAsStringLiteral,
    parseAsNumberLiteral,
    parseAsJson,
    type Options as BaseOptions
} from 'nuqs'
import { useCallback, useEffect, useState, useRef } from 'react'
import { z } from 'zod'

export type QueryStateFromZodOptions = BaseOptions & {
    delay?: number
    resetKeys?: string[]
}

// Helper function to create a debounced callback without external dependency
function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    const debouncedCallback = useCallback(
        ((...args: Parameters<T>) => {
            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            
            // Set new timeout
            timeoutRef.current = setTimeout(() => {
                callback(...args)
            }, delay)
        }) as T,
        [callback, delay]
    )

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return debouncedCallback
}

// Type-safe helper to check Zod type
function getZodTypeName(schema: z.ZodTypeAny): string {
    return (schema as any)._def?.typeName || 'ZodUnknown'
}

// Type-safe helper to get default value
function getZodDefault(schema: z.ZodTypeAny): any {
    const def = (schema as any)._def
    if (def?.typeName === 'ZodDefault') {
        return def.defaultValue?.()
    }
    return undefined
}

// Type-safe helper to unwrap schema
function unwrapZodSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
    const def = (schema as any)._def
    
    if (def?.typeName === 'ZodDefault') {
        return def.innerType || schema
    }
    
    if (def?.typeName === 'ZodOptional') {
        return def.innerType || schema
    }
    
    return schema
}

// Helper function to create a parser for a single Zod type
function createParserForZodType(schema: z.ZodTypeAny): any {
    const defaultValue = getZodDefault(schema)
    const baseSchema = unwrapZodSchema(schema)
    const typeName = getZodTypeName(baseSchema)
    const def = (baseSchema as any)._def

    switch (typeName) {
        case 'ZodString':
            return defaultValue !== undefined 
                ? parseAsString.withDefault(defaultValue)
                : parseAsString

        case 'ZodNumber':
            // Check if it's an integer
            const checks = def?.checks || []
            const isInt = checks.some((check: any) => check.kind === 'int')
            
            const numberParser = isInt ? parseAsInteger : parseAsFloat
            return defaultValue !== undefined 
                ? numberParser.withDefault(defaultValue)
                : numberParser

        case 'ZodBoolean':
            return defaultValue !== undefined 
                ? parseAsBoolean.withDefault(defaultValue)
                : parseAsBoolean

        case 'ZodEnum':
            // For Zod enums, extract the values
            const enumValues = def?.values || []
            if (enumValues.length > 0) {
                const enumParser = parseAsStringLiteral(enumValues)
                return defaultValue !== undefined 
                    ? enumParser.withDefault(defaultValue)
                    : enumParser
            }
            break

        case 'ZodNativeEnum':
            // For native enums, extract the values
            const nativeEnumValues = def?.values ? Object.values(def.values).filter((v): v is string => typeof v === 'string') : []
            if (nativeEnumValues.length > 0) {
                const nativeEnumParser = parseAsStringLiteral(nativeEnumValues)
                return defaultValue !== undefined 
                    ? nativeEnumParser.withDefault(defaultValue)
                    : nativeEnumParser
            }
            break

        case 'ZodLiteral':
            // For literal types, create an array with just that value
            const literalValue = def?.value
            if (typeof literalValue === 'string') {
                const literalParser = parseAsStringLiteral([literalValue])
                return defaultValue !== undefined 
                    ? literalParser.withDefault(defaultValue)
                    : literalParser
            } else if (typeof literalValue === 'number') {
                const literalParser = parseAsNumberLiteral([literalValue])
                return defaultValue !== undefined 
                    ? literalParser.withDefault(defaultValue)
                    : literalParser
            }
            break

        case 'ZodArray':
            // For arrays, create an array parser with the element type
            const elementSchema = def?.type
            if (elementSchema) {
                const elementTypeName = getZodTypeName(elementSchema)
                let baseElementParser: any
                
                switch (elementTypeName) {
                    case 'ZodString':
                        baseElementParser = parseAsString
                        break
                    case 'ZodNumber':
                        const elementChecks = (elementSchema as any)._def?.checks || []
                        const elementIsInt = elementChecks.some((check: any) => check.kind === 'int')
                        baseElementParser = elementIsInt ? parseAsInteger : parseAsFloat
                        break
                    case 'ZodBoolean':
                        // Note: parseAsBoolean doesn't work well with arrays, fallback to string
                        baseElementParser = parseAsString
                        break
                    default:
                        baseElementParser = parseAsString
                }
                
                const arrayParser = parseAsArrayOf(baseElementParser)
                return defaultValue !== undefined 
                    ? arrayParser.withDefault(defaultValue)
                    : arrayParser
            }
            break

        case 'ZodObject':
            // For nested objects, use JSON parser with the schema
            try {
                const jsonParser = parseAsJson(baseSchema)
                return defaultValue !== undefined 
                    ? jsonParser.withDefault(defaultValue)
                    : jsonParser
            } catch {
                // Fallback if JSON parser fails
                break
            }

        case 'ZodEffects':
            // For refined schemas, try to infer from the underlying schema
            const underlyingSchema = def?.schema
            if (underlyingSchema) {
                return createParserForZodType(underlyingSchema)
            }
            break

        case 'ZodUnion':
            // For unions, we'll use string by default
            // This could be enhanced to be smarter about union types
            return defaultValue !== undefined 
                ? parseAsString.withDefault(defaultValue)
                : parseAsString
    }

    // Final fallback to string parser
    return defaultValue !== undefined 
        ? parseAsString.withDefault(defaultValue)
        : parseAsString
}

// Helper function to get all default values from a schema
function getSchemaDefaults<T extends z.ZodObject<any>>(schema: T): z.infer<T> {
    const shape = schema.shape
    const defaults: any = {}
    
    for (const [key, fieldSchema] of Object.entries(shape)) {
        const defaultValue = getZodDefault(fieldSchema as z.ZodTypeAny)
        if (defaultValue !== undefined) {
            defaults[key] = defaultValue
        } else {
            // If no explicit default, try to parse with the schema to get implicit defaults
            const unwrapped = unwrapZodSchema(fieldSchema as z.ZodTypeAny)
            const typeName = getZodTypeName(unwrapped)
            
            switch (typeName) {
                case 'ZodString':
                    defaults[key] = ''
                    break
                case 'ZodNumber':
                    defaults[key] = 0
                    break
                case 'ZodBoolean':
                    defaults[key] = false
                    break
                case 'ZodArray':
                    defaults[key] = []
                    break
                case 'ZodObject':
                    // For nested objects, recursively get defaults
                    defaults[key] = getSchemaDefaults(unwrapped as z.ZodObject<any>)
                    break
                case 'ZodEnum':
                case 'ZodNativeEnum':
                    const def = (unwrapped as any)._def
                    const values = def?.values
                    if (values) {
                        defaults[key] = Array.isArray(values) ? values[0] : Object.values(values)[0]
                    }
                    break
                case 'ZodLiteral':
                    const literalDef = (unwrapped as any)._def
                    defaults[key] = literalDef?.value
                    break
            }
        }
    }
    
    return defaults
}

// Helper function to merge raw values with schema defaults
function mergeWithDefaults<T extends z.ZodObject>(
    schema: T, 
    rawValues: unknown
): z.infer<T> {
    const defaults = getSchemaDefaults(schema)
    
    // Deep merge rawValues with defaults
    const merged: Record<string | number | symbol, unknown> = { ...defaults }
    
    for (const [key, value] of Object.entries(rawValues || {})) {
        if (value !== null && value !== undefined) {
            merged[key] = value
        }
    }
    
    return merged as z.infer<T>
}
function createParsersFromZodObject<T extends z.ZodObject>(schema: T) {
    const shape = schema.shape
    const parsers: Record<string, any> = {}

    for (const [key, fieldSchema] of Object.entries(shape)) {
        parsers[key] = createParserForZodType(fieldSchema)
    }

    return parsers
}

export function useSafeQueryStatesFromZod<T extends z.ZodObject>(
    schema: T,
    options?: QueryStateFromZodOptions
): [
    z.infer<T>,
    (value: Partial<z.infer<T>> | null) => void
] {
    const parsers = createParsersFromZodObject(schema)
    const delay = options?.delay
    const resetKeys = options?.resetKeys ?? []

    // Extract options without delay and resetKeys for nuqs
    const nuqsOptions = { ...options }
    delete nuqsOptions.delay
    delete nuqsOptions.resetKeys

    const [rawValues, setRawValues] = useQueryStates(parsers, nuqsOptions)

    // Always merge with defaults to ensure we have complete objects
    const mergedValues = mergeWithDefaults(schema, rawValues)

    if (!delay) {
        const setter = (value: Partial<z.infer<T>> | null) => {
            setRawValues(value as any)
            
            // Handle reset keys
            if (value !== null && resetKeys.length > 0) {
                console.warn('Reset key functionality needs to be handled externally when using batched updates')
            }
        }
        
        return [mergedValues, setter]
    }

    const [internalValues, setInternalValues] = useState<z.infer<T>>(mergedValues)

    const debouncedSet = useDebouncedCallback((v: Partial<z.infer<T>> | null) => {
        setRawValues(v as any)

        // Handle reset keys - limited in batched context
        if (resetKeys.length > 0) {
            console.warn('Reset key functionality needs to be handled externally when using batched updates')
        }
    }, delay)

    const set = useCallback((v: Partial<z.infer<T>> | null) => {
        if (v === null) {
            // Reset to default values from schema
            const defaultValues = getSchemaDefaults(schema)
            setInternalValues(defaultValues)
            debouncedSet(null)
        } else {
            setInternalValues(prev => ({ ...prev, ...v }))
            debouncedSet(v)
        }
    }, [debouncedSet, schema])

    useEffect(() => {
        const newMergedValues = mergeWithDefaults(schema, rawValues)
        setInternalValues(newMergedValues)
    }, [rawValues, schema])

    return [internalValues, set]
}