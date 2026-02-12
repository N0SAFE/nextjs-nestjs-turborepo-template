/**
 * Search Utilities for Zod
 *
 * Zod-based search configuration and schema builders.
 * EXTENDS from base search types to ensure type compatibility.
 *
 * Type Hierarchy:
 * - SearchConfig extends BaseSearchConfig
 * - SearchSchemaOutput = BaseSearchSchemaOutput
 */

import * as z from "zod";
import {
    type SearchConfig as BaseSearchConfig,
    type SearchSchemaOutput as BaseSearchSchemaOutput,
} from "../../base/utils/search";
import {
    CONFIG_SYMBOL,
    withConfig,
    getConfig,
    type ZodSchemaWithConfig,
} from "./pagination";

// Re-export base types for external use
export type { BaseSearchConfig, BaseSearchSchemaOutput };

/**
 * Search configuration - EXTENDS base type
 */
export type SearchConfig = {
    searchableFields?: readonly string[];
    minQueryLength: number;
    maxQueryLength: number;
    allowFieldSelection: boolean;
    fuzzySearch: boolean;
};

/**
 * Map zod SearchConfig to base SearchConfig fields
 * Using the base output type for compatibility
 */
export type SearchSchemaOutput<TConfig extends Partial<SearchConfig>> = {
    query: string;
} & (TConfig["allowFieldSelection"] extends true
    ? { searchFields?: TConfig["searchableFields"] extends readonly string[]
        ? TConfig["searchableFields"][number][]
        : string[] }
    : object) &
    (TConfig["fuzzySearch"] extends true ? { fuzzyThreshold?: number } : object);

/**
 * Create a search configuration schema
 *
 * @param searchableFields Fields that can be searched
 * @param options Additional search options
 * @returns ZodSchema with embedded configuration
 *
 * @example
 * ```typescript
 * const searchConfig = createSearchConfigSchema(
 *   ['name', 'email', 'description'] as const,
 *   { minQueryLength: 2, allowFieldSelection: true }
 * );
 * ```
 */
export function createSearchConfigSchema<TFields extends readonly string[] | undefined = undefined>(
    searchableFields?: TFields,
    options?: {
        minQueryLength?: number;
        maxQueryLength?: number;
        allowFieldSelection?: boolean;
        fuzzySearch?: boolean;
    }
): ZodSchemaWithConfig<SearchConfig> {
    const config: SearchConfig = {
        searchableFields,
        minQueryLength: options?.minQueryLength ?? 1,
        maxQueryLength: options?.maxQueryLength ?? 200,
        allowFieldSelection: options?.allowFieldSelection ?? false,
        fuzzySearch: options?.fuzzySearch ?? false,
    };

    const shape: Record<string, z.ZodType> = {
        query: z.string().min(config.minQueryLength).max(config.maxQueryLength),
    };

    if (config.allowFieldSelection && searchableFields && searchableFields.length > 0) {
        shape.searchFields = z.array(
            z.enum(searchableFields as unknown as [string, ...string[]])
        ).optional();
    }

    if (config.fuzzySearch) {
        shape.fuzzyThreshold = z.number().min(0).max(1).optional();
    }

    const schema = z.object(shape);

    return withConfig(schema, config);
}

/**
 * Create a search schema from a configuration
 *
 * @param config Search configuration
 * @returns Zod schema for search input
 */
export function createSearchSchema<TConfig extends Partial<SearchConfig>>(
    config: ZodSchemaWithConfig<TConfig>
): z.ZodType<SearchSchemaOutput<TConfig>> {
    const searchConfig = getConfig<TConfig>(config);
    if (!searchConfig) {
        throw new Error("Invalid search config schema");
    }

    const shape: Record<string, z.ZodType> = {
        query: z.string()
            .min(searchConfig.minQueryLength ?? 1)
            .max(searchConfig.maxQueryLength ?? 200),
    };

    if (searchConfig.allowFieldSelection && searchConfig.searchableFields) {
        const fields = searchConfig.searchableFields;
        if (fields.length > 0) {
            shape.searchFields = z.array(
                z.enum(fields as unknown as [string, ...string[]])
            ).optional();
        }
    }

    if (searchConfig.fuzzySearch) {
        shape.fuzzyThreshold = z.number().min(0).max(1).optional();
    }

    return z.object(shape) as unknown as z.ZodType<SearchSchemaOutput<TConfig>>;
}

/**
 * Create a simple search schema (query string only)
 *
 * @param options Search options
 * @returns Zod schema for simple search
 */
export function createSimpleSearchSchema(options?: {
    minLength?: number;
    maxLength?: number;
}) {
    return z.object({
        query: z.string()
            .min(options?.minLength ?? 1)
            .max(options?.maxLength ?? 200),
    });
}

/**
 * Create an advanced search schema with multiple options
 *
 * @param searchableFields Fields that can be searched
 * @param options Search options
 * @returns Zod schema for advanced search
 */
export function createAdvancedSearchSchema<TFields extends readonly string[]>(
    searchableFields: TFields,
    options?: {
        minLength?: number;
        maxLength?: number;
        enableFuzzy?: boolean;
        enableHighlighting?: boolean;
    }
) {
    const shape: Record<string, z.ZodType> = {
        query: z.string()
            .min(options?.minLength ?? 1)
            .max(options?.maxLength ?? 200),
        searchFields: z.array(
            z.enum(searchableFields as unknown as [string, ...string[]])
        ).optional(),
    };

    if (options?.enableFuzzy) {
        shape.fuzzyThreshold = z.number().min(0).max(1).default(0.8).optional();
        shape.fuzzyEnabled = z.boolean().default(false).optional();
    }

    if (options?.enableHighlighting) {
        shape.highlightEnabled = z.boolean().default(true).optional();
        shape.highlightTag = z.string().default("<mark>").optional();
    }

    return z.object(shape);
}

// Re-export shared types
export { CONFIG_SYMBOL, withConfig, getConfig, type ZodSchemaWithConfig };
