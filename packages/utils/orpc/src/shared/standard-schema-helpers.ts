/**
 * Standard Schema helper utilities for route-builder-v2
 * 
 * This file provides types and utilities for working with Standard Schema (StandardSchemaV1)
 * from @standard-schema/spec, used by @orpc/contract.
 */

import type { AnySchema, InferSchemaInput, InferSchemaOutput } from "./types";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Schema shape type - represents an object where each key maps to a schema
 * This is the Standard Schema equivalent of Zod's RawShape
 */
export type SchemaShape = Record<string, AnySchema>;

/**
 * Symbol for storing shape data on object schemas (internal use)
 */
export const SHAPE_SYMBOL = Symbol.for("standard-schema:shape");

/**
 * Object schema type - pure Standard Schema with _shape for type inference
 * Note: _shape is type-only; runtime uses SHAPE_SYMBOL for compatibility
 */
export type ObjectSchema<TShape extends SchemaShape = SchemaShape> = StandardSchemaV1<
    { [K in keyof TShape]: InferSchemaInput<TShape[K]> },
    { [K in keyof TShape]: InferSchemaOutput<TShape[K]> }
> & {
    readonly _shape: TShape;  // Type-only property for inference
};

/**
 * Object schema with shape metadata (for schemas we create internally)
 */
export type ObjectSchemaWithShape<TShape extends SchemaShape = SchemaShape> = ObjectSchema<TShape> & {
    [SHAPE_SYMBOL]: TShape;
};

/**
 * Generic object schema (any shape) - use this for functions that accept any ObjectSchema
 */
export type AnyObjectSchema = ObjectSchema;

/**
 * Generic object schema with shape - use this for functions that accept any ObjectSchemaWithShape
 */
export type AnyObjectSchemaWithShape = ObjectSchemaWithShape;

/**
 * Literal schema type - a schema that represents a specific literal value
 */
export type LiteralSchema<T> = StandardSchemaV1<T, T> & {
    readonly _value: T;
};

/**
 * Optional schema type - a schema that represents an optional value
 */
export type OptionalSchema<T extends AnySchema> = StandardSchemaV1<
    InferSchemaInput<T> | undefined,
    InferSchemaOutput<T> | undefined
> & {
    readonly _inner: T;
};

/**
 * Union schema type - a schema that represents one of several possible types
 */
export type UnionSchema<T extends readonly [AnySchema, AnySchema, ...AnySchema[]]> = StandardSchemaV1<
    InferSchemaInput<T[number]>,
    InferSchemaOutput<T[number]>
> & {
    readonly _options: T;
};

/**
 * Void schema type - a schema that represents undefined
 */
export type VoidSchema = AnySchema & {
    readonly _type: 'void';
};

/**
 * Never schema type - a schema that represents never (always fails validation)
 */
export type NeverSchema = StandardSchemaV1<never, never> & {
    readonly _type: 'never';
};

/**
 * Helper type to check if a type is an empty record
 */
export type IsEmptyRecord<T> = keyof T extends never ? true : false;

/**
 * Helper type to extract shape from an ObjectSchema
 */
export type ExtractShape<T extends AnySchema> = T extends ObjectSchema<infer Shape> ? Shape : SchemaShape;

/**
 * Helper type for pick operation on schemas
 */
export type PickSchemaType<TSchema extends AnySchema, K extends string | number | symbol> = 
    TSchema extends ObjectSchema<infer Shape> 
        ? ObjectSchema<Pick<Shape, Extract<K, keyof Shape>>> 
        : AnySchema;

/**
 * Helper type for omit operation on schemas
 */
export type OmitSchemaType<TSchema extends AnySchema, K extends string | number | symbol> = 
    TSchema extends ObjectSchema<infer Shape> 
        ? ObjectSchema<Omit<Shape, Extract<K, keyof Shape>>> 
        : AnySchema;

/**
 * Helper type for extend operation on schemas
 */
export type ExtendSchemaType<TSchema extends AnySchema, TExtension extends SchemaShape> = 
    TSchema extends ObjectSchema<infer Shape> 
        ? ObjectSchema<Shape & TExtension> 
        : AnySchema;

/**
 * Helper type for partial operation on schemas
 */
export type PartialSchemaType<TSchema extends AnySchema, K extends string | number | symbol = string | number | symbol> =
    TSchema extends ObjectSchema<infer Shape>
        ? ObjectSchema<{
              [P in keyof Shape]: P extends Extract<K, keyof Shape> ? OptionalSchema<Shape[P]> : Shape[P];
          }>
        : AnySchema;

/**
 * Helper type to convert inferred type to SchemaShape
 */
export type InferredToSchemaShape<T> = T extends Record<string, unknown> 
    ? { [K in keyof T]: AnySchema } 
    : SchemaShape;

/**
 * Helper type to check if all keys in an object type are optional
 */
export type AllKeysOptional<T> = T extends object 
    ? Partial<T> extends T 
        ? true 
        : false
    : false;

/**
 * Helper type to check if a schema should be optional in detailed input
 * A schema is optional if:
 * - undefined, never
 * - empty object schema (no fields configured)
 * - all fields are optional (including Zod schemas)
 */
export type ShouldBeOptional<T> =
    [T] extends [undefined] ? true :
    [T] extends [never] ? true :
    T extends VoidSchema ? true :
    T extends NeverSchema ? true :
    T extends ObjectSchema<infer Shape> ?
        [keyof Shape] extends [never] ? true :
        AllKeysOptional<InferSchemaOutput<T>> :
    T extends StandardSchemaV1<unknown, infer O> ?
        O extends object ?
            AllKeysOptional<O> :
        false :
    false;

/**
 * Type guard to check if a schema is an ObjectSchema (with shape metadata)
 */
export function isObjectSchema(schema: AnySchema): schema is ObjectSchemaWithShape {
    return typeof schema === 'object' && SHAPE_SYMBOL in schema;
}

/**
 * Extract shape from object schema if available
 */
export function getSchemaShape<T extends AnySchema>(schema: T): SchemaShape {
    if (typeof schema === "object") {
        if (SHAPE_SYMBOL in schema) {
            return (schema as unknown as ObjectSchemaWithShape)[SHAPE_SYMBOL];
        }
    }
    return {};
}

/**
 * Check if schema has shape metadata
 */
export function hasShape(schema: AnySchema): schema is ObjectSchemaWithShape {
    // Runtime check - schemas are objects at runtime even if types don't reflect it
    return SHAPE_SYMBOL in schema;
}

/**
 * Type guard to check if a schema is a VoidSchema
 */
export function isVoidSchema(schema: AnySchema): schema is VoidSchema {
    return typeof schema === 'object' && '_type' in schema && schema._type === 'void';
}

/**
 * Type guard to check if a schema is a NeverSchema
 */
export function isNeverSchema(schema: AnySchema): schema is NeverSchema {
    return typeof schema === 'object' && '_type' in schema && schema._type === 'never';
}

/**
 * Type guard to check if a schema is an OptionalSchema
 */
export function isOptionalSchema(schema: AnySchema): schema is OptionalSchema<AnySchema> {
    return typeof schema === 'object' && '_inner' in schema;
}

/**
 * Type guard to check if a schema is a UnionSchema
 */
export function isUnionSchema(schema: AnySchema): schema is UnionSchema<readonly [AnySchema, AnySchema, ...AnySchema[]]> {
    return typeof schema === 'object' && '_options' in schema && Array.isArray((schema as UnionSchema<[AnySchema, AnySchema]>)._options);
}

/**
 * Get schema operations (pick, omit, extend, partial) if schema is an ObjectSchema
 */
export function getSchemaOperations(schema: AnySchema): ObjectSchema | null {
    if (isObjectSchema(schema)) {
        return schema;
    }
    return null;
}

/**
 * Create an empty object schema
 */
export function emptyObjectSchema<T extends SchemaShape = Record<never, never>>(): ObjectSchemaWithShape<T> {
    return {
        '~standard': {
            version: 1,
            vendor: 'orpc-utils',
            validate: (value: unknown) => {
                if (typeof value === 'object' && value !== null) {
                    return { value: value as never };
                }
                return {
                    issues: [{
                        message: 'Expected an object',
                        path: [],
                    }],
                };
            },
        },
        _shape: {} as T,
        [SHAPE_SYMBOL]: {} as T,
    };
}

/**
 * Create a void schema (represents undefined)
 */
export function voidSchema(): VoidSchema {
    return {
        '~standard': {
            version: 1,
            vendor: 'orpc-utils',
            validate: () => ({ value: undefined }),
        },
        _type: 'void',
    };
}

/**
 * Create a never schema (always fails validation)
 */
export function neverSchema(): NeverSchema {
    return {
        '~standard': {
            version: 1,
            vendor: 'orpc-utils',
            validate: () => ({
                issues: [{
                    message: 'This schema cannot be satisfied',
                    path: [],
                }],
            }),
        },
        _type: 'never',
    };
}

/**
 * Create a literal schema
 */
export function literalSchema<T extends string | number | boolean>(value: T): LiteralSchema<T> {
    return {
        '~standard': {
            version: 1,
            vendor: 'orpc-utils',
            validate: (input: unknown) => {
                if (input === value) {
                    return { value: input as T };
                }
                return {
                    issues: [{
                        message: `Expected literal value: ${String(value)}`,
                        path: [],
                    }],
                };
            },
        },
        _value: value,
    };
}

/**
 * Create an optional schema
 */
export function optionalSchema<T extends AnySchema>(inner: T): OptionalSchema<T> {
    return {
        '~standard': {
            version: 1,
            vendor: 'orpc-utils',
            validate: (value: unknown) => {
                if (value === undefined) {
                    return { value: undefined };
                }
                return inner['~standard'].validate(value);
            },
        },
        _inner: inner,
    };
}

/**
 * Create a union schema
 */
export function unionSchema<T extends readonly [AnySchema, AnySchema, ...AnySchema[]]>(options: T): UnionSchema<T> {
    return {
        '~standard': {
            version: 1,
            vendor: 'orpc-utils',
            validate: (value: unknown) => {
                const issues: StandardSchemaV1.Issue[] = [];
                
                for (const option of options) {
                    const result = option['~standard'].validate(value);
                    if ('value' in result) {
                        return result;
                    }
                    if ('issues' in result) {
                        issues.push(...result.issues);
                    }
                }
                
                return { issues };
            },
        },
        _options: options,
    };
}

/**
 * Create an object schema from a shape
 */
export function objectSchema<T extends SchemaShape>(shape: T): ObjectSchemaWithShape<T> {
    return {
        '~standard': {
            version: 1,
            vendor: 'orpc-utils',
            validate: (value: unknown) => {
                if (typeof value !== 'object' || value === null) {
                    return {
                        issues: [{
                            message: 'Expected an object',
                            path: [],
                        }],
                    };
                }
                
                const result: Record<string, unknown> = {};
                const issues: StandardSchemaV1.Issue[] = [];
                
                for (const [key, schema] of Object.entries(shape)) {
                    const fieldValue = (value as Record<string, unknown>)[key];
                    const fieldResult = schema['~standard'].validate(fieldValue);
                    
                    if ('value' in fieldResult) {
                        result[key] = fieldResult.value;
                    } else if ('issues' in fieldResult) {
                        issues.push(...fieldResult.issues.map(issue => ({
                            ...issue,
                            path: [key, ...(issue.path ?? [])],
                        })));
                    }
                }
                
                if (issues.length > 0) {
                    return { issues };
                }
                
                return { value: result as never };
            },
        },
        _shape: shape,
        [SHAPE_SYMBOL]: shape,
    };
}
