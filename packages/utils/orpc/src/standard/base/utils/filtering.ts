/**
 * Filtering utilities for Standard Schema
 * Pure Standard Schema implementation without Zod dependency
 */

import type { AnySchema, SchemaWithConfig, ObjectSchema } from "../types";
import { CONFIG_SYMBOL, withConfig } from "../types";
import { s } from "../schema";

/**
 * Available filter operators
 */
export type FilterOperator =
    | "eq" // Equal
    | "ne" // Not equal
    | "gt" // Greater than
    | "gte" // Greater than or equal
    | "lt" // Less than
    | "lte" // Less than or equal
    | "like" // LIKE pattern match
    | "ilike" // Case-insensitive LIKE
    | "in" // In array
    | "notIn" // Not in array
    | "between" // Between two values
    | "isNull" // Is null
    | "isNotNull" // Is not null
    | "contains" // Array contains
    | "startsWith" // String starts with
    | "endsWith"; // String ends with

/**
 * Field filter configuration
 */
export type FieldFilterConfig<TOperators extends readonly FilterOperator[] = readonly FilterOperator[]> = {
    operators: TOperators;
    allowNull?: boolean;
    description?: string;
};

/**
 * FilteringConfig type
 */
export type FilteringConfig<
    TFields extends Record<string, FieldFilterConfig> = Record<string, FieldFilterConfig>
> = {
    fields: TFields;
    allowLogicalOperators: boolean;
    maxDepth: number;
    maxConditions: number;
};

/**
 * All available filter operators
 */
export const ALL_FILTER_OPERATORS = [
    "eq",
    "ne",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "in",
    "notIn",
    "between",
    "isNull",
    "isNotNull",
    "contains",
    "startsWith",
    "endsWith",
] as const satisfies readonly FilterOperator[];

/**
 * Common operator presets
 */
export const COMPARISON_OPERATORS = ["eq", "ne", "gt", "gte", "lt", "lte"] as const satisfies readonly FilterOperator[];
export const STRING_OPERATORS = [
    "eq",
    "ne",
    "like",
    "ilike",
    "startsWith",
    "endsWith",
] as const satisfies readonly FilterOperator[];
export const NUMERIC_OPERATORS = [
    "eq",
    "ne",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
] as const satisfies readonly FilterOperator[];
export const ARRAY_OPERATORS = ["in", "notIn", "contains"] as const satisfies readonly FilterOperator[];
export const NULL_OPERATORS = ["isNull", "isNotNull"] as const satisfies readonly FilterOperator[];

/**
 * Create a filtering config schema with attached config data
 */
export function createFilteringConfigSchema<
    TFields extends Record<string, FieldFilterConfig>,
    TAllowLogical extends boolean = true
>(
    fields: TFields,
    options?: {
        allowLogicalOperators?: TAllowLogical;
        maxDepth?: number;
        maxConditions?: number;
    }
): SchemaWithConfig<{
    fields: TFields;
    allowLogicalOperators: TAllowLogical extends false ? false : true;
    maxDepth: number;
    maxConditions: number;
}> {
    const config = {
        fields,
        allowLogicalOperators: (options?.allowLogicalOperators ?? true) as TAllowLogical extends false ? false : true,
        maxDepth: options?.maxDepth ?? 3,
        maxConditions: options?.maxConditions ?? 10,
    };

    // Create a schema that validates the config structure
    const schema = s.object({
        fields: s.record(s.string(), s.any()),
        allowLogicalOperators: s.boolean(),
        maxDepth: s.int({ min: 1 }),
        maxConditions: s.int({ min: 1 }),
    });

    return withConfig(schema as AnySchema, config);
}

/**
 * Create a field schema based on operators
 */
function createFieldFilterSchema(fieldName: string, fieldConfig: FieldFilterConfig): AnySchema {
    const { operators, allowNull } = fieldConfig;
    const filterShape: Record<string, AnySchema> = {};

    for (const op of operators) {
        switch (op) {
            case "eq":
            case "ne":
            case "gt":
            case "gte":
            case "lt":
            case "lte":
            case "like":
            case "ilike":
            case "startsWith":
            case "endsWith":
            case "contains":
                // Single value operators
                filterShape[op] = s.optional(allowNull ? s.nullable(s.any()) : s.any());
                break;

            case "in":
            case "notIn":
                // Array operators
                filterShape[op] = s.optional(s.array(s.any()));
                break;

            case "between":
                // Range operator
                filterShape[op] = s.optional(
                    s.object({
                        min: s.any(),
                        max: s.any(),
                    })
                );
                break;

            case "isNull":
            case "isNotNull":
                // Boolean flag operators
                filterShape[op] = s.optional(s.boolean());
                break;
        }
    }

    return s.optional(s.object(filterShape));
}

/**
 * Create a filtering input schema from config
 */
export function createFilteringSchema<TConfig>(
    configSchema: SchemaWithConfig<TConfig>
): ObjectSchema {
    const config = configSchema[CONFIG_SYMBOL] as FilteringConfig;
    const { fields, allowLogicalOperators, maxDepth, maxConditions } = config;

    // Build field schemas
    const fieldSchemas: Record<string, AnySchema> = {};
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
        fieldSchemas[fieldName] = createFieldFilterSchema(fieldName, fieldConfig);
    }

    // Create base filter schema
    const baseFilterSchema = s.object(fieldSchemas);

    if (!allowLogicalOperators) {
        return baseFilterSchema;
    }

    // Create recursive filter schema with logical operators
    const filterWithLogical: Record<string, AnySchema> = {
        ...fieldSchemas,
        AND: s.optional(s.array(s.any())), // Will be validated recursively
        OR: s.optional(s.array(s.any())),
        NOT: s.optional(s.any()),
    };

    const schema = s.object(filterWithLogical);

    // Add depth and condition validation
    return {
        ...schema,
        "~standard": {
            ...schema["~standard"],
            validate: (value: unknown) => {
                if (value === undefined || value === null) {
                    return { value: {} as Record<string, unknown> };
                }

                const validationResult = validateFilterDepth(value, maxDepth, maxConditions);
                if (!validationResult.valid) {
                    return { issues: [{ message: validationResult.error ?? "Invalid filter", path: [] }] };
                }

                return schema["~standard"].validate(value);
            },
        },
    };
}

/**
 * Validate filter depth and condition count
 */
function validateFilterDepth(
    filter: unknown,
    maxDepth: number,
    maxConditions: number,
    currentDepth = 0
): { valid: boolean; error?: string } {
    if (currentDepth > maxDepth) {
        return { valid: false, error: `Filter exceeds maximum depth of ${String(maxDepth)}` };
    }

    if (typeof filter !== "object" || filter === null) {
        return { valid: true };
    }

    let conditionCount = 0;
    const obj = filter as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
        if (key === "AND" || key === "OR") {
            if (Array.isArray(value)) {
                for (const item of value) {
                    conditionCount++;
                    const result = validateFilterDepth(item, maxDepth, maxConditions, currentDepth + 1);
                    if (!result.valid) {
                        return result;
                    }
                }
            }
        } else if (key === "NOT") {
            conditionCount++;
            const result = validateFilterDepth(value, maxDepth, maxConditions, currentDepth + 1);
            if (!result.valid) {
                return result;
            }
        } else if (typeof value === "object" && value !== null) {
            // Field filter
            conditionCount += Object.keys(value as Record<string, unknown>).length;
        }
    }

    if (conditionCount > maxConditions) {
        return { valid: false, error: `Filter exceeds maximum conditions of ${String(maxConditions)}` };
    }

    return { valid: true };
}

/**
 * Helper to create a simple filter config for a field
 */
export function field<TOperators extends readonly FilterOperator[]>(
    operators: TOperators,
    options?: { allowNull?: boolean; description?: string }
): FieldFilterConfig<TOperators> {
    return {
        operators,
        ...options,
    };
}

/**
 * Helper to create a string field filter config
 */
export function stringField(options?: { allowNull?: boolean }): FieldFilterConfig {
    return field(STRING_OPERATORS, options);
}

/**
 * Helper to create a numeric field filter config
 */
export function numericField(options?: { allowNull?: boolean }): FieldFilterConfig {
    return field(NUMERIC_OPERATORS, options);
}

/**
 * Helper to create a comparison field filter config
 */
export function comparisonField(options?: { allowNull?: boolean }): FieldFilterConfig {
    return field(COMPARISON_OPERATORS, options);
}

/**
 * Create a simple equality filter schema
 */
export function createSimpleFilterSchema<TFields extends readonly string[]>(fields: TFields): ObjectSchema {
    const fieldConfigs: Record<string, FieldFilterConfig> = {};
    for (const f of fields) {
        fieldConfigs[f] = { operators: ["eq"] };
    }
    const configSchema = createFilteringConfigSchema(fieldConfigs, {
        allowLogicalOperators: false,
    });
    return createFilteringSchema(configSchema);
}
