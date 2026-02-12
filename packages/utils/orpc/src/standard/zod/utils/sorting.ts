/**
 * Sorting Utilities for Zod
 *
 * Zod-based sorting configuration and schema builders.
 * EXTENDS from base sorting types to ensure type compatibility.
 *
 * Type Hierarchy:
 * - SortingConfig = BaseSortingConfig (identical)
 * - SortingSchemaOutput = BaseSortingSchemaOutput
 */

import * as z from "zod";
import {
    type SortingConfig as BaseSortingConfig,
    type SortingSchemaOutput as BaseSortingSchemaOutput,
} from "../../base/utils/sorting";
import {
    CONFIG_SYMBOL,
    withConfig,
    getConfig,
    type ZodSchemaWithConfig,
} from "./pagination";

// Re-export base types for external use
export type { BaseSortingConfig, BaseSortingSchemaOutput };

/**
 * Sort direction type - same as base
 */
export type SortDirection = "asc" | "desc";

/**
 * Nulls handling type - same as base
 */
export type NullsHandling = "first" | "last" | "default";

/**
 * Sorting configuration - EXTENDS base type
 */
export type SortingConfig<TFields extends readonly string[] = readonly string[]> = BaseSortingConfig<TFields>;

/**
 * Sorting input schema output type - EXTENDS base type
 */
export type SortingSchemaOutput<TConfig extends Partial<SortingConfig>> = BaseSortingSchemaOutput<TConfig>;

/**
 * Create a sorting configuration schema
 *
 * @param fields Allowable sort fields
 * @param options Additional sorting options
 * @returns ZodSchema with embedded configuration
 *
 * @example
 * ```typescript
 * const sortingConfig = createSortingConfigSchema(
 *   ['createdAt', 'name', 'email'] as const,
 *   { defaultField: 'createdAt', defaultDirection: 'desc' }
 * );
 * ```
 */
export function createSortingConfigSchema<
    TFields extends readonly string[],
    TAllowMultiple extends boolean = false,
    TAllowNullsHandling extends boolean = false
>(
    fields: TFields,
    options?: {
        defaultField?: TFields[number];
        defaultDirection?: SortDirection;
        allowMultiple?: TAllowMultiple;
        allowNullsHandling?: TAllowNullsHandling;
    }
): ZodSchemaWithConfig<{
    fields: TFields;
    defaultField: TFields[number] | undefined;
    defaultDirection: "asc" | "desc";
    allowMultiple: TAllowMultiple extends true ? true : false;
    allowNullsHandling: TAllowNullsHandling extends true ? true : false;
}> {
    const config = {
        fields,
        defaultField: options?.defaultField,
        defaultDirection: (options?.defaultDirection ?? "asc") as "asc" | "desc",
        allowMultiple: (options?.allowMultiple ?? false) as TAllowMultiple extends true ? true : false,
        allowNullsHandling: (options?.allowNullsHandling ?? false) as TAllowNullsHandling extends true ? true : false,
    };

    let shape: Record<string, z.ZodType>;

    if (config.allowMultiple) {
        // Multiple sort fields
        shape = {
            sortBy: z.array(
                z.object({
                    field: z.enum(fields as unknown as [string, ...string[]]),
                    direction: z.enum(["asc", "desc"]).default("asc"),
                })
            ).min(1).optional(),
        };
    } else {
        // Single sort field
        shape = {
            sortBy: z.enum(fields as unknown as [string, ...string[]]).optional(),
            sortDirection: z.enum(["asc", "desc"]).default(config.defaultDirection),
        };
    }

    if (config.allowNullsHandling) {
        shape.nullsHandling = z.enum(["first", "last"]).optional();
    }

    const schema = z.object(shape);

    return withConfig(schema, config);
}

/**
 * Create a sorting schema from a configuration
 *
 * @param config Sorting configuration
 * @returns Zod schema for sorting input
 */
export function createSortingSchema<TConfig extends Partial<SortingConfig>>(
    config: ZodSchemaWithConfig<TConfig>
): z.ZodType<SortingSchemaOutput<TConfig>> {
    const sortingConfig = getConfig<TConfig>(config);
    if (!sortingConfig) {
        throw new Error("Invalid sorting config schema");
    }

    const fields = sortingConfig.fields ?? [];
    let shape: Record<string, z.ZodType>;

    if (sortingConfig.allowMultiple) {
        // Multiple sort fields
        shape = {
            sortBy: z.array(
                z.object({
                    field: fields.length > 0
                        ? z.enum(fields as unknown as [string, ...string[]])
                        : z.string(),
                    direction: z.enum(["asc", "desc"]).default("asc"),
                })
            ).min(1).optional(),
        };
    } else {
        // Single sort field
        shape = {
            sortBy: fields.length > 0
                ? z.enum(fields as unknown as [string, ...string[]]).optional()
                : z.string().optional(),
            sortDirection: z.enum(["asc", "desc"]).optional(),
        };
    }

    if (sortingConfig.allowNullsHandling) {
        shape.nullsHandling = z.enum(["first", "last"]).optional();
    }

    return z.object(shape) as unknown as z.ZodType<SortingSchemaOutput<TConfig>>;
}

/**
 * Sort direction schema (standalone)
 */
export const sortDirection = z.enum(["asc", "desc"]);

/**
 * Nulls handling schema (standalone)
 */
export const nullsHandling = z.enum(["first", "last", "default"]);

/**
 * Create a simple sort schema (single field)
 *
 * @param fields Allowable sort fields
 * @returns Zod schema for simple sorting
 */
export function createSimpleSortSchema<TFields extends readonly string[]>(fields: TFields) {
    return z.object({
        sortBy: z.enum(fields as unknown as [string, ...string[]]).optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
    });
}

/**
 * Create a multi-sort schema (multiple fields with directions)
 *
 * @param fields Allowable sort fields
 * @param maxSort Maximum number of sort fields (default: 3)
 * @returns Zod schema for multi-field sorting
 */
export function createMultiSortSchema<TFields extends readonly string[]>(
    fields: TFields,
    maxSort = 3
) {
    return z.object({
        sort: z.array(
            z.object({
                field: z.enum(fields as unknown as [string, ...string[]]),
                direction: z.enum(["asc", "desc"]).default("asc"),
                nullsHandling: z.enum(["first", "last", "default"]).optional(),
            })
        ).max(maxSort).optional(),
    });
}

// Re-export shared types
export { CONFIG_SYMBOL, withConfig, getConfig, type ZodSchemaWithConfig };
