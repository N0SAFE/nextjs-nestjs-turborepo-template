/**
 * Search utilities for Standard Schema
 * Pure Standard Schema implementation without Zod dependency
 */

import type { AnySchema, SchemaWithConfig, ObjectSchema } from "../types";
import { CONFIG_SYMBOL, withConfig } from "../types";
import { s } from "../schema";

/**
 * Search configuration type
 */
export type SearchConfig<TFields extends readonly string[] = readonly string[]> = {
    fields: TFields;
    minQueryLength: number;
    maxQueryLength: number;
    allowFieldSelection: boolean;
    allowRegex: boolean;
    allowFuzzy: boolean;
    caseSensitive: boolean;
};

/**
 * Create a search config schema with attached config data
 */
export function createSearchConfigSchema<
    TFields extends readonly string[],
    TAllowFieldSelection extends boolean = false,
    TAllowRegex extends boolean = false,
    TAllowFuzzy extends boolean = false
>(
    fields: TFields,
    options?: {
        minQueryLength?: number;
        maxQueryLength?: number;
        allowFieldSelection?: TAllowFieldSelection;
        allowRegex?: TAllowRegex;
        allowFuzzy?: TAllowFuzzy;
        caseSensitive?: boolean;
    }
): SchemaWithConfig<{
    fields: TFields;
    minQueryLength: number;
    maxQueryLength: number;
    allowFieldSelection: TAllowFieldSelection extends true ? true : false;
    allowRegex: TAllowRegex extends true ? true : false;
    allowFuzzy: TAllowFuzzy extends true ? true : false;
    caseSensitive: boolean;
}> {
    const config = {
        fields,
        minQueryLength: options?.minQueryLength ?? 1,
        maxQueryLength: options?.maxQueryLength ?? 500,
        allowFieldSelection: (options?.allowFieldSelection ?? false) as TAllowFieldSelection extends true ? true : false,
        allowRegex: (options?.allowRegex ?? false) as TAllowRegex extends true ? true : false,
        allowFuzzy: (options?.allowFuzzy ?? false) as TAllowFuzzy extends true ? true : false,
        caseSensitive: options?.caseSensitive ?? false,
    };

    const schema = s.object({
        fields: s.array(s.string()),
        minQueryLength: s.int({ min: 0 }),
        maxQueryLength: s.int({ min: 1 }),
        allowFieldSelection: s.boolean(),
        allowRegex: s.boolean(),
        allowFuzzy: s.boolean(),
        caseSensitive: s.boolean(),
    });

    return withConfig(schema as AnySchema, config);
}

/**
 * Search schema output type helper
 */
export type SearchSchemaOutput<TConfig> = {
    query: string;
} & (TConfig extends { allowFieldSelection: true }
    ? { searchFields?: string[] }
    : object) &
    (TConfig extends { allowRegex: true } ? { useRegex?: boolean } : object) &
    (TConfig extends { allowFuzzy: true } ? { fuzzyMatch?: boolean; fuzzyThreshold?: number } : object);

/**
 * Create a search input schema from config
 */
export function createSearchSchema<TConfig>(
    configSchema: SchemaWithConfig<TConfig>
): ObjectSchema {
    const config = configSchema[CONFIG_SYMBOL] as SearchConfig;
    const {
        fields,
        minQueryLength,
        maxQueryLength,
        allowFieldSelection,
        allowRegex,
        allowFuzzy,
    } = config;

    const shape: Record<string, AnySchema> = {
        query: s.string({ minLength: minQueryLength, maxLength: maxQueryLength }),
    };

    if (allowFieldSelection && fields.length > 0) {
        shape.searchFields = s.optional(
            s.array(s.enum(fields as [string, ...string[]]), { min: 1 })
        );
    }

    if (allowRegex) {
        shape.useRegex = s.optional(s.boolean());
    }

    if (allowFuzzy) {
        shape.fuzzyMatch = s.optional(s.boolean());
        shape.fuzzyThreshold = s.optional(s.number({ min: 0, max: 1 }));
    }

    return s.object(shape);
}

/**
 * Helper to create a simple search schema
 */
export function createSimpleSearchSchema<TFields extends readonly string[]>(
    fields: TFields,
    options?: { minQueryLength?: number; maxQueryLength?: number }
): ObjectSchema {
    const configSchema = createSearchConfigSchema(fields, {
        minQueryLength: options?.minQueryLength ?? 1,
        maxQueryLength: options?.maxQueryLength ?? 500,
        allowFieldSelection: false,
        allowRegex: false,
        allowFuzzy: false,
    });
    return createSearchSchema(configSchema);
}

/**
 * Helper to create an advanced search schema
 */
export function createAdvancedSearchSchema<TFields extends readonly string[]>(
    fields: TFields,
    options?: {
        minQueryLength?: number;
        maxQueryLength?: number;
        allowFuzzy?: boolean;
    }
): ObjectSchema {
    const configSchema = createSearchConfigSchema(fields, {
        minQueryLength: options?.minQueryLength ?? 1,
        maxQueryLength: options?.maxQueryLength ?? 500,
        allowFieldSelection: true,
        allowRegex: true,
        allowFuzzy: options?.allowFuzzy ?? true,
    });
    return createSearchSchema(configSchema);
}

/**
 * Helper to create a full-text search query schema
 */
export function createFullTextSearchSchema(options?: {
    minQueryLength?: number;
    maxQueryLength?: number;
}): ObjectSchema {
    return s.object({
        query: s.string({
            minLength: options?.minQueryLength ?? 1,
            maxLength: options?.maxQueryLength ?? 500,
        }),
        highlight: s.optional(s.boolean()),
        snippetLength: s.optional(s.int({ min: 10, max: 500 })),
        analyzerId: s.optional(s.string()),
    });
}

// Prebuilt search query schema
export const basicSearchSchema = s.object({
    query: s.string({ minLength: 1, maxLength: 500 }),
});
