/**
 * Standard Schema factory functions
 * 
 * Pure Standard Schema implementations without Zod dependency.
 * These functions create schemas that conform to @standard-schema/spec.
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
    AnySchema,
    ArraySchema,
    BooleanSchema,
    DateSchema,
    EnumSchema,
    LiteralSchema,
    NeverSchema,
    NullableSchema,
    NumberSchema,
    ObjectSchema,
    ObjectSchemaWithShape,
    OptionalSchema,
    RecordSchema,
    SchemaShape,
    StringSchema,
    TupleSchema,
    UUIDSchema,
    UnionSchema,
    VoidSchema,
    InferSchemaOutput,
} from "./types";
import { SHAPE_SYMBOL } from "./types";

const VENDOR = "standard-schema-v2";

/**
 * Create a string schema
 */
export function string(options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    description?: string;
}): StringSchema {
    const { minLength, maxLength, pattern, description } = options ?? {};

    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "string") {
                    return { issues: [{ message: description ?? "Expected string", path: [] }] };
                }
                if (minLength !== undefined && value.length < minLength) {
                    return { issues: [{ message: `Minimum length is ${String(minLength)}`, path: [] }] };
                }
                if (maxLength !== undefined && value.length > maxLength) {
                    return { issues: [{ message: `Maximum length is ${String(maxLength)}`, path: [] }] };
                }
                if (pattern && !pattern.test(value)) {
                    return { issues: [{ message: `Must match pattern ${pattern.toString()}`, path: [] }] };
                }
                return { value };
            },
        },
        _string: true,
        _minLength: minLength,
        _maxLength: maxLength,
        _pattern: pattern,
    };
}

/**
 * Create a number schema
 */
export function number(options?: {
    min?: number;
    max?: number;
    int?: boolean;
    description?: string;
}): NumberSchema {
    const { min, max, int, description } = options ?? {};

    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "number" || Number.isNaN(value)) {
                    return { issues: [{ message: description ?? "Expected number", path: [] }] };
                }
                if (int && !Number.isInteger(value)) {
                    return { issues: [{ message: "Expected integer", path: [] }] };
                }
                if (min !== undefined && value < min) {
                    return { issues: [{ message: `Minimum is ${String(min)}`, path: [] }] };
                }
                if (max !== undefined && value > max) {
                    return { issues: [{ message: `Maximum is ${String(max)}`, path: [] }] };
                }
                return { value };
            },
        },
        _number: true,
        _min: min,
        _max: max,
        _int: int,
    };
}

/**
 * Create an integer schema
 */
export function int(options?: {
    min?: number;
    max?: number;
    description?: string;
}): NumberSchema {
    return number({ ...options, int: true });
}

/**
 * Create a boolean schema
 */
export function boolean(options?: { description?: string }): BooleanSchema {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "boolean") {
                    return { issues: [{ message: options?.description ?? "Expected boolean", path: [] }] };
                }
                return { value };
            },
        },
        _boolean: true,
    };
}

/**
 * Create a date schema
 */
export function date(options?: { description?: string }): DateSchema {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
                    return { issues: [{ message: options?.description ?? "Expected date", path: [] }] };
                }
                return { value };
            },
        },
        _date: true,
    };
}

/**
 * Create a UUID schema
 */
export function uuid(options?: { description?: string }): UUIDSchema {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "string" || !uuidPattern.test(value)) {
                    return { issues: [{ message: options?.description ?? "Expected UUID", path: [] }] };
                }
                return { value };
            },
        },
        _uuid: true,
    };
}

/**
 * Create a literal schema
 */
export function literal<T extends string | number | boolean>(value: T): LiteralSchema<T> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (input: unknown) => {
                if (input === value) {
                    return { value: input as T };
                }
                return { issues: [{ message: `Expected literal: ${String(value)}`, path: [] }] };
            },
        },
        _value: value,
        _literal: true,
    };
}

/**
 * Create an enum schema
 */
export function enumeration<T extends readonly [string, ...string[]]>(values: T): EnumSchema<T> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "string" || !values.includes(value)) {
                    return { issues: [{ message: `Expected one of: ${values.join(", ")}`, path: [] }] };
                }
                return { value: value as T[number] };
            },
        },
        _values: values,
        _enum: true,
    };
}

/**
 * Create a void schema
 */
export function voidSchema(): VoidSchema {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: () => ({ value: undefined }),
        },
        _void: true,
    };
}

/**
 * Create a never schema
 */
export function never(): NeverSchema {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: () => ({ issues: [{ message: "This schema cannot be satisfied", path: [] }] }),
        },
        _never: true,
    };
}

/**
 * Create an optional schema
 */
export function optional<T extends AnySchema>(schema: T): OptionalSchema<T> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (value === undefined) {
                    return { value: undefined };
                }
                return schema["~standard"].validate(value);
            },
        },
        _inner: schema,
        _optional: true,
    };
}

/**
 * Create a nullable schema
 */
export function nullable<T extends AnySchema>(schema: T): NullableSchema<T> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (value === null) {
                    return { value: null };
                }
                return schema["~standard"].validate(value);
            },
        },
        _inner: schema,
        _nullable: true,
    };
}

/**
 * Create an array schema
 */
export function array<T extends AnySchema>(
    itemSchema: T,
    options?: { min?: number; max?: number; description?: string }
): ArraySchema<T> {
    const { min, max, description } = options ?? {};

    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (!Array.isArray(value)) {
                    return { issues: [{ message: description ?? "Expected array", path: [] }] };
                }
                if (min !== undefined && value.length < min) {
                    return { issues: [{ message: `Minimum length is ${String(min)}`, path: [] }] };
                }
                if (max !== undefined && value.length > max) {
                    return { issues: [{ message: `Maximum length is ${String(max)}`, path: [] }] };
                }

                const result: unknown[] = [];
                const issues: StandardSchemaV1.Issue[] = [];

                for (let i = 0; i < value.length; i++) {
                    const itemResult = itemSchema["~standard"].validate(value[i]);
                    if ("value" in itemResult) {
                        result.push(itemResult.value);
                    } else if ("issues" in itemResult) {
                        issues.push(
                            ...itemResult.issues.map((issue) => ({
                                ...issue,
                                path: [i, ...(issue.path ?? [])],
                            }))
                        );
                    }
                }

                if (issues.length > 0) {
                    return { issues };
                }

                return { value: result as InferSchemaOutput<T>[] };
            },
        },
        _item: itemSchema,
    };
}

/**
 * Create a tuple schema
 */
export function tuple<T extends readonly [AnySchema, ...AnySchema[]]>(items: T): TupleSchema<T> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (!Array.isArray(value) || value.length !== items.length) {
                    return { issues: [{ message: `Expected tuple of length ${String(items.length)}`, path: [] }] };
                }

                const result: unknown[] = [];
                const issues: StandardSchemaV1.Issue[] = [];

                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    if (!item) {
                        throw new Error("Argument expression expected.");
                    }
                    const itemResult = item["~standard"].validate(value[i]);
                    if ("value" in itemResult) {
                        result.push(itemResult.value);
                    } else if ("issues" in itemResult) {
                        issues.push(
                            ...itemResult.issues.map((issue) => ({
                                ...issue,
                                path: [i, ...(issue.path ?? [])],
                            }))
                        );
                    }
                }

                if (issues.length > 0) {
                    return { issues };
                }

                return { value: result as never };
            },
        },
        _items: items,
        _tuple: true,
    };
}

/**
 * Create a union schema
 */
export function union<T extends readonly [AnySchema, AnySchema, ...AnySchema[]]>(options: T): UnionSchema<T> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                const allIssues: StandardSchemaV1.Issue[] = [];

                for (const option of options) {
                    const result = option["~standard"].validate(value);
                    if ("value" in result) {
                        return result;
                    }
                    if ("issues" in result) {
                        allIssues.push(...result.issues);
                    }
                }

                return { issues: allIssues };
            },
        },
        _options: options,
        _union: true,
    };
}

/**
 * Create an object schema
 */
export function object<T extends SchemaShape>(shape: T): ObjectSchemaWithShape<T> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "object" || value === null) {
                    return { issues: [{ message: "Expected object", path: [] }] };
                }

                const result: Record<string, unknown> = {};
                const issues: StandardSchemaV1.Issue[] = [];

                for (const [key, schema] of Object.entries(shape)) {
                    const fieldValue = (value as Record<string, unknown>)[key];
                    const fieldResult = schema["~standard"].validate(fieldValue);

                    if ("value" in fieldResult) {
                        result[key] = fieldResult.value;
                    } else if ("issues" in fieldResult) {
                        issues.push(
                            ...fieldResult.issues.map((issue) => ({
                                ...issue,
                                path: [key, ...(issue.path ?? [])],
                            }))
                        );
                    }
                }

                if (issues.length > 0) {
                    return { issues };
                }

                return { value: result as InferSchemaOutput<ObjectSchema<T>> };
            },
        },
        _shape: shape,
        [SHAPE_SYMBOL]: shape,
    };
}

/**
 * Create a record schema
 */
export function record<TKey extends AnySchema, TValue extends AnySchema>(
    keySchema: TKey,
    valueSchema: TValue
): RecordSchema<TKey, TValue> {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "object" || value === null) {
                    return { issues: [{ message: "Expected record", path: [] }] };
                }

                const result: Record<string, unknown> = {};
                const issues: StandardSchemaV1.Issue[] = [];

                for (const [key, val] of Object.entries(value)) {
                    const keyResult = keySchema["~standard"].validate(key);
                    const valueResult = valueSchema["~standard"].validate(val);

                    if ("issues" in keyResult && keyResult.issues) {
                        issues.push(
                            ...keyResult.issues.map((issue) => ({
                                ...issue,
                                path: [key, ...(issue.path ?? [])],
                            }))
                        );
                    }

                    if ("issues" in valueResult && valueResult.issues) {
                        issues.push(
                            ...valueResult.issues.map((issue) => ({
                                ...issue,
                                path: [key, ...(issue.path ?? [])],
                            }))
                        );
                    }

                    if ("value" in keyResult && "value" in valueResult) {
                        result[String(keyResult.value)] = valueResult.value;
                    }
                }

                if (issues.length > 0) {
                    return { issues };
                }

                return { value: result as never };
            },
        },
        _keySchema: keySchema,
        _valueSchema: valueSchema,
        _record: true,
    };
}

/**
 * Extend an object schema with additional fields
 */
export function extend<TBase extends ObjectSchemaWithShape, TExtension extends SchemaShape>(
    base: TBase,
    extension: TExtension
): ObjectSchemaWithShape<TBase[typeof SHAPE_SYMBOL] & TExtension> {
    return object({ ...base[SHAPE_SYMBOL], ...extension });
}

/**
 * Pick specific fields from an object schema
 */
export function pick<TSchema extends ObjectSchemaWithShape, K extends keyof TSchema[typeof SHAPE_SYMBOL]>(
    schema: TSchema,
    keys: readonly K[]
): ObjectSchemaWithShape<Pick<TSchema[typeof SHAPE_SYMBOL], K>> {
    const pickedShape: SchemaShape = {};
    for (const key of keys) {
        const keyStr = key as string;
        const fieldSchema = schema[SHAPE_SYMBOL][keyStr];
        if (fieldSchema) {
            pickedShape[keyStr] = fieldSchema;
        }
    }
    return object(pickedShape) as ObjectSchemaWithShape<Pick<TSchema[typeof SHAPE_SYMBOL], K>>;
}

/**
 * Omit specific fields from an object schema
 */
export function omit<TSchema extends ObjectSchemaWithShape, K extends keyof TSchema[typeof SHAPE_SYMBOL]>(
    schema: TSchema,
    keys: readonly K[]
): ObjectSchemaWithShape<Omit<TSchema[typeof SHAPE_SYMBOL], K>> {
    const keySet = new Set(keys as readonly string[]);
    const omittedShape: SchemaShape = {};
    for (const [key, value] of Object.entries(schema[SHAPE_SYMBOL])) {
        if (!keySet.has(key)) {
            omittedShape[key] = value;
        }
    }
    return object(omittedShape) as ObjectSchemaWithShape<Omit<TSchema[typeof SHAPE_SYMBOL], K>>;
}

/**
 * Make all fields of an object schema optional
 */
export function partial<TSchema extends ObjectSchemaWithShape>(
    schema: TSchema
): ObjectSchemaWithShape<{ [K in keyof TSchema[typeof SHAPE_SYMBOL]]: OptionalSchema<TSchema[typeof SHAPE_SYMBOL][K]> }> {
    const partialShape: SchemaShape = {};
    for (const [key, value] of Object.entries(schema[SHAPE_SYMBOL])) {
        partialShape[key] = optional(value);
    }
    return object(partialShape) as ObjectSchemaWithShape<{ [K in keyof TSchema[typeof SHAPE_SYMBOL]]: OptionalSchema<TSchema[typeof SHAPE_SYMBOL][K]> }>;
}

/**
 * Create an unknown schema
 */
export function unknown(): AnySchema {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => ({ value }),
        },
    };
}

/**
 * Create an any schema (alias for unknown)
 */
export function any(): AnySchema {
    return unknown();
}

/**
 * Create a coerced number schema (for query params)
 */
export function coerceNumber(options?: {
    min?: number;
    max?: number;
    int?: boolean;
    description?: string;
}): NumberSchema {
    const { min, max, int: isInt, description } = options ?? {};

    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                const num = typeof value === "string" ? Number(value) : value;

                if (typeof num !== "number" || Number.isNaN(num)) {
                    return { issues: [{ message: description ?? "Expected number", path: [] }] };
                }
                if (isInt && !Number.isInteger(num)) {
                    return { issues: [{ message: "Expected integer", path: [] }] };
                }
                if (min !== undefined && num < min) {
                    return { issues: [{ message: `Minimum is ${String(min)}`, path: [] }] };
                }
                if (max !== undefined && num > max) {
                    return { issues: [{ message: `Maximum is ${String(max)}`, path: [] }] };
                }
                return { value: num };
            },
        },
        _number: true,
        _min: min,
        _max: max,
        _int: isInt,
    };
}

/**
 * Create a coerced boolean schema (for query params)
 */
export function coerceBoolean(options?: { description?: string }): BooleanSchema {
    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value === "boolean") {
                    return { value };
                }
                if (value === "true" || value === "1") {
                    return { value: true };
                }
                if (value === "false" || value === "0") {
                    return { value: false };
                }
                return { issues: [{ message: options?.description ?? "Expected boolean", path: [] }] };
            },
        },
        _boolean: true,
    };
}

/**
 * Create an ISO datetime schema
 */
export function isoDatetime(options?: { description?: string }): StringSchema {
    const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

    return {
        "~standard": {
            version: 1,
            vendor: VENDOR,
            validate: (value: unknown) => {
                if (typeof value !== "string" || !pattern.test(value)) {
                    return { issues: [{ message: options?.description ?? "Expected ISO datetime", path: [] }] };
                }
                return { value };
            },
        },
        _string: true,
        _pattern: pattern,
    };
}

// Export as 's' namespace for convenient access
export const s = {
    string,
    number,
    int,
    boolean,
    date,
    uuid,
    literal,
    enum: enumeration,
    void: voidSchema,
    never,
    optional,
    nullable,
    array,
    tuple,
    union,
    object,
    record,
    extend,
    pick,
    omit,
    partial,
    unknown,
    any,
    coerceNumber,
    coerceBoolean,
    isoDatetime,
};
