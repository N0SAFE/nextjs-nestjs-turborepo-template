/**
 * Core type definitions for Standard Schema-based operations
 * Uses @standard-schema/spec directly without Zod dependency
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { AnySchema, HTTPMethod, HTTPPath } from "@orpc/contract";

/**
 * Re-export commonly used types
 */
export type { AnySchema, HTTPMethod, HTTPPath } from "@orpc/contract";
export type { StandardSchemaV1 } from "@standard-schema/spec";
export type { VoidSchema, NeverSchema } from "../../shared/standard-schema-helpers";

/**
 * Schema shape type - represents an object where each key maps to a schema
 */
export type SchemaShape = Record<string, AnySchema>;

/**
 * Symbol for storing shape data on object schemas (internal use)
 */
export const SHAPE_SYMBOL = Symbol.for("standard-schema:shape");

/**
 * Object schema type - pure Standard Schema without additional runtime properties
 * Compatible with Zod and other Standard Schema implementations
 * Note: _shape is type-only for TypeScript inference; runtime uses SHAPE_SYMBOL
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
}

/**
 * Array schema type - a schema that represents an array of items
 */
export type ArraySchema<TItem extends AnySchema = AnySchema> = StandardSchemaV1<
    InferSchemaInput<TItem>[],
    InferSchemaOutput<TItem>[]
> & {
    readonly _item: TItem;
};

/**
 * Optional schema type - a schema that represents an optional value
 */
export type OptionalSchema<T extends AnySchema> = StandardSchemaV1<
    InferSchemaInput<T> | undefined,
    InferSchemaOutput<T> | undefined
> & {
    readonly _inner: T;
    readonly _optional: true;
};

/**
 * Nullable schema type - a schema that represents a nullable value
 */
export type NullableSchema<T extends AnySchema> = StandardSchemaV1<
    InferSchemaInput<T> | null,
    InferSchemaOutput<T> | null
> & {
    readonly _inner: T;
    readonly _nullable: true;
};

/**
 * Literal schema type - a schema that represents a specific literal value
 */
export type LiteralSchema<T> = StandardSchemaV1<T, T> & {
    readonly _value: T;
    readonly _literal: true;
};

/**
 * Enum schema type - a schema that represents one of several string values
 */
export type EnumSchema<T extends readonly string[]> = StandardSchemaV1<
    T[number],
    T[number]
> & {
    readonly _values: T;
    readonly _enum: true;
};

/**
 * Union schema type - a schema that represents one of several possible types
 */
export type UnionSchema<T extends readonly [AnySchema, AnySchema, ...AnySchema[]]> = StandardSchemaV1<
    InferSchemaInput<T[number]>,
    InferSchemaOutput<T[number]>
> & {
    readonly _options: T;
    readonly _union: true;
};

/**
 * Tuple schema type - a schema that represents a fixed-length array
 */
export type TupleSchema<T extends readonly AnySchema[]> = StandardSchemaV1<
    { [K in keyof T]: InferSchemaInput<T[K]> },
    { [K in keyof T]: InferSchemaOutput<T[K]> }
> & {
    readonly _items: T;
    readonly _tuple: true;
};

/**
 * Record schema type - a schema that represents a record with string keys
 */
export type RecordSchema<TKey extends AnySchema, TValue extends AnySchema> = StandardSchemaV1<
    Record<InferSchemaInput<TKey> & string, InferSchemaInput<TValue>>,
    Record<InferSchemaOutput<TKey> & string, InferSchemaOutput<TValue>>
> & {
    readonly _keySchema: TKey;
    readonly _valueSchema: TValue;
    readonly _record: true;
};

/**
 * String schema type
 */
export type StringSchema = StandardSchemaV1<string, string> & {
    readonly _string: true;
    readonly _minLength?: number;
    readonly _maxLength?: number;
    readonly _pattern?: RegExp;
};

/**
 * Number schema type
 */
export type NumberSchema = StandardSchemaV1<number, number> & {
    readonly _number: true;
    readonly _min?: number;
    readonly _max?: number;
    readonly _int?: boolean;
};

/**
 * Boolean schema type
 */
export type BooleanSchema = StandardSchemaV1<boolean, boolean> & {
    readonly _boolean: true;
};

/**
 * Date schema type
 */
export type DateSchema = StandardSchemaV1<Date, Date> & {
    readonly _date: true;
};

/**
 * UUID schema type
 */
export type UUIDSchema = StandardSchemaV1<string, string> & {
    readonly _uuid: true;
};

/**
 * Infer input type from a schema
 */
export type InferSchemaInput<T> = T extends StandardSchemaV1<infer I, unknown> ? I : never;

/**
 * Infer output type from a schema
 */
export type InferSchemaOutput<T> = T extends StandardSchemaV1<unknown, infer O> ? O : never;

/**
 * Entity schema type - any Standard Schema that validates to an object
 * Compatible with Zod, Valibot, and other Standard Schema implementations
 */
export type EntitySchema = AnySchema;

/**
 * Extract shape from object schema if available
 */
export function getSchemaShape<T extends AnySchema>(schema: T): SchemaShape | null {
    if (SHAPE_SYMBOL in schema) {
        return schema[SHAPE_SYMBOL] as SchemaShape;
    }
    return null;
}

/**
 * Check if schema has shape metadata
 */
export function hasShape(schema: AnySchema): schema is ObjectSchemaWithShape {
    return SHAPE_SYMBOL in schema;
}

/**
 * Type guard: check if value is an object
 */
export type InferredObject<T> = T extends Record<string, unknown> ? T : never;

/**
 * Route metadata for operations
 */
export type RouteMetadata = {
    method: HTTPMethod;
    path?: HTTPPath;
    summary?: string;
    description?: string;
    tags?: string[];
    deprecated?: boolean;
};

/**
 * Symbol for storing config data on schemas
 */
export const CONFIG_SYMBOL = Symbol.for("standard-schema:config");

/**
 * Schema with embedded config
 */
export type SchemaWithConfig<TConfig, TSchema extends AnySchema = AnySchema> = TSchema & {
    [CONFIG_SYMBOL]: TConfig;
};

/**
 * Check if schema has config
 */
export function hasConfig<TConfig>(schema: AnySchema): schema is SchemaWithConfig<TConfig> {
    return CONFIG_SYMBOL in schema;
}

/**
 * Extract config from schema
 */
export function getConfig<TConfig>(schema: SchemaWithConfig<TConfig>): TConfig {
    return schema[CONFIG_SYMBOL];
}

/**
 * Attach config to schema
 */
export function withConfig<TConfig, TSchema extends AnySchema>(
    schema: TSchema,
    config: TConfig
): SchemaWithConfig<TConfig, TSchema> {
    return Object.assign(schema, { [CONFIG_SYMBOL]: config }) as SchemaWithConfig<TConfig, TSchema>;
}
