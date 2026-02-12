/**
 * Sorting utilities for Standard Schema
 * Pure Standard Schema implementation without Zod dependency
 */

import type { AnySchema, SchemaWithConfig, ObjectSchema } from "../types";
import { CONFIG_SYMBOL, withConfig } from "../types";
import { s } from "../schema";

/**
 * Sorting configuration type
 */
export type SortingConfig<TFields extends readonly string[] = readonly string[]> = {
    fields: TFields;
    defaultField: TFields[number] | undefined;
    defaultDirection: "asc" | "desc";
    allowMultiple: boolean;
    allowNullsHandling: boolean;
};

/**
 * Create a sorting config schema with attached config data
 */
export function createSortingConfigSchema<
    TFields extends readonly string[],
    TAllowMultiple extends boolean = false,
    TAllowNullsHandling extends boolean = false
>(
    fields: TFields,
    options?: {
        defaultField?: TFields[number];
        defaultDirection?: "asc" | "desc";
        allowMultiple?: TAllowMultiple;
        allowNullsHandling?: TAllowNullsHandling;
    }
): SchemaWithConfig<{
    fields: TFields;
    defaultField: TFields[number] | undefined;
    defaultDirection: "asc" | "desc";
    allowMultiple: TAllowMultiple extends true ? true : false;
    allowNullsHandling: TAllowNullsHandling extends true ? true : false;
}> {
    const config = {
        fields,
        defaultField: options?.defaultField,
        defaultDirection: options?.defaultDirection ?? ("asc" as const),
        allowMultiple: (options?.allowMultiple ?? false) as TAllowMultiple extends true ? true : false,
        allowNullsHandling: (options?.allowNullsHandling ?? false) as TAllowNullsHandling extends true ? true : false,
    };

    const schema = s.object({
        fields: s.array(s.string()),
        defaultField: s.optional(s.string()),
        defaultDirection: s.enum(["asc", "desc"] as const),
        allowMultiple: s.boolean(),
        allowNullsHandling: s.boolean(),
    });

    return withConfig(schema as AnySchema, config);
}

/**
 * Sorting schema output type helper
 */
export type SortingSchemaOutput<TConfig> = TConfig extends { allowMultiple: true }
    ? {
          sortBy?: { field: string; direction: "asc" | "desc" }[];
      } & (TConfig extends { allowNullsHandling: true } ? { nullsHandling?: "first" | "last" } : object)
    : {
          sortBy?: string;
          sortDirection?: "asc" | "desc";
      } & (TConfig extends { allowNullsHandling: true } ? { nullsHandling?: "first" | "last" } : object);

/**
 * Create a sorting input schema from config
 */
export function createSortingSchema<TConfig>(
    configSchema: SchemaWithConfig<TConfig>
): ObjectSchema {
    const config = configSchema[CONFIG_SYMBOL] as SortingConfig;
    const { fields, defaultField, defaultDirection, allowMultiple, allowNullsHandling } = config;

    if (fields.length === 0) {
        throw new Error("At least one sortable field must be provided");
    }

    const shape: Record<string, AnySchema> = {};

    if (allowMultiple) {
        // Multiple sort fields
        shape.sortBy = s.optional(
            s.array(
                s.object({
                    field: s.enum(fields as [string, ...string[]]),
                    direction: s.enum(["asc", "desc"] as const),
                }),
                { min: 1 }
            )
        );
    } else {
        // Single sort field
        shape.sortBy = s.optional(s.enum(fields as [string, ...string[]]));
        shape.sortDirection = s.optional(s.enum(["asc", "desc"] as const));
    }

    if (allowNullsHandling) {
        shape.nullsHandling = s.optional(s.enum(["first", "last"] as const));
    }

    const schema = s.object(shape);

    // Add default value handling
    return {
        ...schema,
        "~standard": {
            ...schema["~standard"],
            validate: (value: unknown) => {
                const input = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

                // Apply defaults
                const withDefaults = { ...input };

                if (allowMultiple) {
                    if (!withDefaults.sortBy && defaultField) {
                        withDefaults.sortBy = [{ field: defaultField, direction: defaultDirection }];
                    }
                } else {
                    if (!withDefaults.sortBy && defaultField) {
                        withDefaults.sortBy = defaultField;
                    }
                    withDefaults.sortDirection ??= defaultDirection;
                }

                return schema["~standard"].validate(withDefaults);
            },
        },
    };
}

/**
 * Helper to create a simple sort schema
 */
export function createSimpleSortSchema<TFields extends readonly string[]>(
    fields: TFields,
    defaultField?: TFields[number]
): ObjectSchema {
    const configSchema = createSortingConfigSchema(fields, {
        defaultField,
        defaultDirection: "asc",
        allowMultiple: false,
    });
    return createSortingSchema(configSchema);
}

/**
 * Helper to create a multi-field sort schema
 */
export function createMultiSortSchema<TFields extends readonly string[]>(fields: TFields): ObjectSchema {
    const configSchema = createSortingConfigSchema(fields, {
        allowMultiple: true,
        defaultDirection: "asc",
    });
    return createSortingSchema(configSchema);
}

// Standalone schemas
export const sortDirection = s.enum(["asc", "desc"] as const);
export const nullsHandling = s.optional(s.enum(["first", "last"] as const));
