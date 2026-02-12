/**
 * Standard Schema v2 - Base Implementation
 *
 * Pure Standard Schema implementation without Zod dependency.
 * Uses @standard-schema/spec directly for schema definitions.
 */

// Core types
export {
    CONFIG_SYMBOL,
    SHAPE_SYMBOL,
    hasConfig,
    getConfig,
    withConfig,
    getSchemaShape,
    hasShape,
    type AnySchema,
    type HTTPMethod,
    type HTTPPath,
    type StandardSchemaV1,
    type SchemaShape,
    type ObjectSchema,
    type ObjectSchemaWithShape,
    type ArraySchema,
    type OptionalSchema,
    type NullableSchema,
    type LiteralSchema,
    type EnumSchema,
    type UnionSchema,
    type TupleSchema,
    type RecordSchema,
    type VoidSchema,
    type NeverSchema,
    type StringSchema,
    type NumberSchema,
    type BooleanSchema,
    type DateSchema,
    type UUIDSchema,
    type SchemaWithConfig,
    type EntitySchema,
    type RouteMetadata,
    type InferSchemaInput,
    type InferSchemaOutput,
} from "./types";

// Schema factory functions
export {
    s,
    string,
    number,
    int,
    boolean,
    date,
    uuid,
    literal,
    enumeration,
    voidSchema,
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
} from "./schema";

// Query utilities
export * from "./utils";

// Standard operations
export * from "./standard-operations";
