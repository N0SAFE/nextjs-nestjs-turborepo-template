/**
 * Filtering Utilities for Zod
 *
 * Zod-based filtering configuration and schema builders.
 * EXTENDS from base filtering types to ensure type compatibility.
 *
 * Type Hierarchy:
 * - FilterOperator = BaseFilterOperator (identical)
 * - FieldFilterConfig extends BaseFieldFilterConfig
 * - FilteringConfig = BaseFilteringConfig (identical)
 */

import * as z from "zod";
import {
    type FilterOperator as BaseFilterOperator,
    type FieldFilterConfig as BaseFieldFilterConfig,
    type FilteringConfig as BaseFilteringConfig,
    ALL_FILTER_OPERATORS as BASE_ALL_FILTER_OPERATORS,
    COMPARISON_OPERATORS as BASE_COMPARISON_OPERATORS,
    STRING_OPERATORS as BASE_STRING_OPERATORS,
    NUMERIC_OPERATORS as BASE_NUMERIC_OPERATORS,
    ARRAY_OPERATORS as BASE_ARRAY_OPERATORS,
    NULL_OPERATORS as BASE_NULL_OPERATORS,
} from "../../base/utils/filtering";
import {
    CONFIG_SYMBOL,
    withConfig,
    getConfig,
    type ZodSchemaWithConfig,
} from "./pagination";

// Re-export base types for external use
export type { BaseFilterOperator, BaseFieldFilterConfig, BaseFilteringConfig };

// Re-export operator presets from base
export const ALL_FILTER_OPERATORS = BASE_ALL_FILTER_OPERATORS;
export const COMPARISON_OPERATORS = BASE_COMPARISON_OPERATORS;
export const STRING_OPERATORS = BASE_STRING_OPERATORS;
export const NUMERIC_OPERATORS = BASE_NUMERIC_OPERATORS;
export const ARRAY_OPERATORS = BASE_ARRAY_OPERATORS;
export const NULL_OPERATORS = BASE_NULL_OPERATORS;

/**
 * Filter operator types - EXTENDS base type
 */
export type FilterOperator = BaseFilterOperator;

/**
 * Field filter configuration - uses base type with Zod-specific adaptations
 */
type ZodFieldFilterConfig = {
    type: "string" | "number" | "boolean" | "date" | "enum" | "array";
    operators?: FilterOperator[];
    enumValues?: readonly string[];
    nullable?: boolean;
    /** Phantom field for carrying the resolved value type through the type system */
    _valueType?: unknown;
    /** Phantom field for carrying exact operator literal types through the type system */
    _operators?: unknown;
};

export type FieldFilterConfig = ZodFieldFilterConfig | (BaseFieldFilterConfig & { _valueType?: unknown; _operators?: unknown });

/**
 * Filtering configuration type - EXTENDS base type
 */
export type FilteringConfig<TFields extends Record<string, FieldFilterConfig> = Record<string, FieldFilterConfig>> = {
    fields: TFields;
    allowLogicalOperators: boolean;
};

/**
 * Extract operators from a field filter config.
 * Priority: _operators phantom → readonly operators array → type-based defaults.
 */
type ExtractOperators<TConfig extends FieldFilterConfig> = 
    TConfig extends { _operators: infer U extends FilterOperator } ? U :
    TConfig extends { operators: readonly (infer U)[] } ? U :
    TConfig extends { type: infer T } ? 
        T extends "string" ? "eq" | "ne" | "like" | "ilike" | "in" | "notIn" | "contains" | "startsWith" | "endsWith" :
        T extends "number" ? "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "between" :
        T extends "boolean" ? "eq" | "ne" :
        T extends "date" ? "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "between" :
        T extends "enum" ? "eq" | "ne" | "in" | "notIn" :
        T extends "array" ? "contains" | "in" :
        "eq" | "ne"
    : "eq" | "ne";

/**
 * Extract the value type from a FieldFilterConfig.
 * Uses _valueType phantom if available, otherwise resolves from `type` field, else `unknown`.
 */
type ExtractValueType<TConfig extends FieldFilterConfig> =
    TConfig extends { _valueType: infer V } ? unknown extends V ? (
        TConfig extends { type: infer T } ?
            T extends "string" ? string :
            T extends "number" ? number :
            T extends "boolean" ? boolean :
            T extends "date" ? string | Date :
            T extends "enum" ? string :
            unknown
        : unknown
    ) : V : (
        TConfig extends { type: infer T } ?
            T extends "string" ? string :
            T extends "number" ? number :
            T extends "boolean" ? boolean :
            T extends "date" ? string | Date :
            T extends "enum" ? string :
            unknown
        : unknown
    );

/**
 * Compute the value type for a specific operator.
 * Most operators use the field's value type directly, except:
 * - `between` → tuple [T, T]
 * - `in`/`notIn` → array T[]
 * - `isNull`/`isNotNull` → boolean
 */
type OperatorValueType<TOp extends FilterOperator, TValue> =
    TOp extends "between" ? [TValue, TValue] :
    TOp extends "in" | "notIn" ? TValue[] :
    TOp extends "isNull" | "isNotNull" ? boolean :
    TValue;

/**
 * Discriminated union entry for a field filter.
 * Each variant has a literal `operator` and a typed `value`.
 * e.g., { operator: 'eq'; value: string } | { operator: 'like'; value: string }
 */
type FieldFilterEntry<TOps extends FilterOperator, TValue> = {
    [Op in TOps]: { operator: Op; value: OperatorValueType<Op, TValue> };
}[TOps];

/**
 * Filtering schema output type — each field is a { operator, value } discriminated union.
 * Supports `_and`/`_or` logical composition for complex filter expressions.
 *
 * Usage:
 * ```typescript
 * // Single field filter
 * { email: { operator: 'eq', value: 'test@example.com' } }
 *
 * // Logical composition
 * {
 *   _and: [
 *     { createdAt: { operator: 'gt', value: '2024-01-01' } },
 *     { createdAt: { operator: 'lt', value: '2024-12-31' } },
 *   ]
 * }
 * ```
 */
export type FilteringSchemaOutput<TFields extends Record<string, FieldFilterConfig>> = {
    [K in keyof TFields]?: FieldFilterEntry<ExtractOperators<TFields[K]>, ExtractValueType<TFields[K]>>;
} & {
    _and?: Partial<Record<keyof TFields | "_and" | "_or", unknown>>;
    _or?: Partial<Record<keyof TFields | "_and" | "_or", unknown>>;
};

/**
 * Create a filtering configuration schema
 *
 * @param fields Field filter configurations
 * @param options Additional filtering options
 * @returns ZodSchema with embedded configuration
 *
 * @example
 * ```typescript
 * const filteringConfig = createFilteringConfigSchema({
 *   name: { type: 'string', operators: ['eq', 'like', 'ilike'] },
 *   age: { type: 'number', operators: ['eq', 'gt', 'lt', 'between'] },
 *   status: { type: 'enum', enumValues: ['active', 'inactive'] },
 *   createdAt: { type: 'date', operators: ['gt', 'lt', 'between'] },
 * });
 * ```
 */
export function createFilteringConfigSchema<TFields extends Record<string, FieldFilterConfig>>(
    fields: TFields,
    options?: {
        allowLogicalOperators?: boolean;
    }
): ZodSchemaWithConfig<FilteringConfig<TFields>> {
    const config: FilteringConfig<TFields> = {
        fields,
        allowLogicalOperators: options?.allowLogicalOperators ?? true,
    };

    // Build a flexible filter schema
    const filterSchema = z.record(z.string(), z.unknown()).optional();

    return withConfig(filterSchema, config);
}

/**
 * Create a filtering schema from a configuration
 *
 * @param config Filtering configuration
 * @returns Zod schema for filtering input
 */
export function createFilteringSchema<TConfig extends Partial<FilteringConfig>>(
    config: ZodSchemaWithConfig<TConfig>
): z.ZodType<TConfig extends FilteringConfig<infer TFields> ? FilteringSchemaOutput<TFields> : never> {
    const filteringConfig = getConfig<TConfig>(config);
    if (!filteringConfig) {
        throw new Error("Invalid filtering config schema");
    }

    const fields = filteringConfig.fields ?? {};
    const shape: Record<string, z.ZodType> = {};

    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
        shape[fieldName] = createFieldFilterSchema(fieldConfig);
    }

    // Add _and/_or logical operators if allowed
    if (filteringConfig.allowLogicalOperators) {
        const recursiveFilterSchema: z.ZodType = z.lazy(() => z.object({
            _and: z.array(recursiveFilterSchema).optional(),
            _or: z.array(recursiveFilterSchema).optional(),
            ...shape,
        }).partial());
        return recursiveFilterSchema as unknown as z.ZodType<TConfig extends FilteringConfig<infer TFields> ? FilteringSchemaOutput<TFields> : never>;
    }

    return z.object(shape).partial() as unknown as z.ZodType<TConfig extends FilteringConfig<infer TFields> ? FilteringSchemaOutput<TFields> : never>;
}

/**
 * Create a schema for a single field's filter — { operator: 'op', value: valueSchema }
 * Returns a discriminated union of all configured operators for the field.
 *
 * @param config Field filter configuration
 * @returns Zod schema for the field's filter (optional)
 */
export function createFieldFilterSchema(config: FieldFilterConfig): z.ZodType {
    const operators = getOperators(config);
    const baseSchema = getBaseSchema(config);

    // Create discriminated union: { operator: 'op', value: valueSchema } for each operator
    const variants = operators.map(op =>
        z.object({
            operator: z.literal(op),
            value: createOperatorValueSchema(op, baseSchema),
        })
    );

    if (variants.length === 0) {
        return z.never().optional();
    }
    if (variants.length === 1 && variants[0]) {
        return variants[0].optional();
    }

    return z.union(variants as unknown as [z.ZodType, z.ZodType, ...z.ZodType[]]).optional();
}

/**
 * Get default operators for a field type
 */
function getDefaultOperators(type: ZodFieldFilterConfig["type"]): FilterOperator[] {
    switch (type) {
        case "string":
            return ["eq", "ne", "like", "ilike", "in", "notIn", "contains", "startsWith", "endsWith"];
        case "number":
            return ["eq", "ne", "gt", "gte", "lt", "lte", "in", "notIn", "between"];
        case "boolean":
            return ["eq", "ne"];
        case "date":
            return ["eq", "ne", "gt", "gte", "lt", "lte", "between"];
        case "enum":
            return ["eq", "ne", "in", "notIn"];
        case "array":
            return ["contains", "in"];
        default:
            return ["eq", "ne"];
    }
}

/**
 * Create a schema for an operator's value
 */
function createOperatorValueSchema(
    operator: FilterOperator,
    baseSchema: z.ZodType
): z.ZodType {

    switch (operator) {
        case "in":
        case "notIn":
            return z.array(baseSchema);
        case "between":
            return z.tuple([baseSchema, baseSchema]);
        case "isNull":
        case "isNotNull":
            return z.boolean();
        default:
            return baseSchema;
    }
}

/**
 * Get the base Zod schema for a field type
 */
function isZodFieldFilterConfig(config: FieldFilterConfig): config is ZodFieldFilterConfig {
    return typeof config === "object" && "type" in config;
}

function getOperators(config: FieldFilterConfig): FilterOperator[] {
    if (isZodFieldFilterConfig(config)) {
        return config.operators ?? getDefaultOperators(config.type);
    }

    return [...config.operators];
}

function getBaseSchema(config: FieldFilterConfig): z.ZodType {
    if (isZodFieldFilterConfig(config)) {
        switch (config.type) {
            case "string":
                return z.string();
            case "number":
                return z.number();
            case "boolean":
                return z.boolean();
            case "date":
                return z.coerce.date();
            case "enum":
                if (config.enumValues && config.enumValues.length > 0) {
                    return z.enum(config.enumValues as [string, ...string[]]);
                }
                return z.string();
            case "array":
                return z.array(z.unknown());
            default:
                return z.unknown();
        }
    }

    const baseSchema = z.unknown();
    return config.allowNull ? baseSchema.nullable() : baseSchema;
}

// ==================== Helper Factory Functions ====================

/**
 * Create a string field filter config
 */
export function stringField(options?: {
    operators?: FilterOperator[];
    nullable?: boolean;
}): FieldFilterConfig {
    return {
        type: "string",
        operators: options?.operators ?? ["eq", "ne", "like", "ilike", "contains", "startsWith", "endsWith"],
        nullable: options?.nullable,
    };
}

/**
 * Create a numeric field filter config
 */
export function numericField(options?: {
    operators?: FilterOperator[];
    nullable?: boolean;
}): FieldFilterConfig {
    return {
        type: "number",
        operators: options?.operators ?? ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
        nullable: options?.nullable,
    };
}

/**
 * Create a comparison field filter config (gt, lt, gte, lte)
 */
export function comparisonField(options?: {
    nullable?: boolean;
}): FieldFilterConfig {
    return {
        type: "number",
        operators: ["gt", "gte", "lt", "lte", "between"],
        nullable: options?.nullable,
    };
}

/**
 * Create a boolean field filter config
 */
export function booleanField(options?: {
    nullable?: boolean;
}): FieldFilterConfig {
    return {
        type: "boolean",
        operators: ["eq", "ne"],
        nullable: options?.nullable,
    };
}

/**
 * Create a date field filter config
 */
export function dateField(options?: {
    operators?: FilterOperator[];
    nullable?: boolean;
}): FieldFilterConfig {
    return {
        type: "date",
        operators: options?.operators ?? ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
        nullable: options?.nullable,
    };
}

/**
 * Create an enum field filter config
 */
export function enumField<TValues extends readonly string[]>(
    values: TValues,
    options?: {
        operators?: FilterOperator[];
        nullable?: boolean;
    }
): FieldFilterConfig {
    return {
        type: "enum",
        enumValues: values,
        operators: options?.operators ?? ["eq", "ne", "in", "notIn"],
        nullable: options?.nullable,
    };
}

/**
 * Create an array field filter config
 */
export function arrayField(options?: {
    operators?: FilterOperator[];
    nullable?: boolean;
}): FieldFilterConfig {
    return {
        type: "array",
        operators: options?.operators ?? ["contains", "in"],
        nullable: options?.nullable,
    };
}

// Re-export shared types
export { CONFIG_SYMBOL, withConfig, getConfig, type ZodSchemaWithConfig };
