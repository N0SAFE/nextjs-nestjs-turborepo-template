/**
 * Pagination Utilities for Zod
 *
 * Zod-based pagination configuration and schema builders.
 * EXTENDS from base pagination types to ensure type compatibility.
 *
 * Type Hierarchy:
 * - PaginationConfig = BasePaginationConfig (identical)
 * - PaginationInputFields uses BasePaginationSchemaOutput
 * - PaginationMetaOutput uses BasePaginationMetaSchemaOutput
 */

import * as z from "zod";
import {
    type PaginationConfig as BasePaginationConfig,
    type PaginationSchemaOutput as BasePaginationSchemaOutput,
    type PaginationMetaSchemaOutput as BasePaginationMetaSchemaOutput,
} from "../../base/utils/pagination";
import { CONFIG_SYMBOL } from "../../base/types";

// Re-export base types for external use
export type { BasePaginationConfig, BasePaginationSchemaOutput, BasePaginationMetaSchemaOutput };

// Re-export CONFIG_SYMBOL for use in other zod utilities
export { CONFIG_SYMBOL };

/**
 * Zod schema with embedded configuration
 * Uses the same CONFIG_SYMBOL as base for cross-compatibility
 * 
 * This explicitly types the config-enhanced schema to ensure proper type narrowing
 */
export type ZodSchemaWithConfig<TConfig, TSchema extends z.ZodType = z.ZodType> = TSchema & {
    [CONFIG_SYMBOL]: TConfig;
};

/**
 * Check if a schema has embedded configuration
 */
export function hasConfig<T>(schema: z.ZodType): schema is ZodSchemaWithConfig<T> {
    return CONFIG_SYMBOL in schema;
}

/**
 * Get configuration from a schema
 */
export function getConfig<T>(schema: z.ZodType): T | undefined {
    if (hasConfig<T>(schema)) {
        return schema[CONFIG_SYMBOL];
    }
    return undefined;
}

/**
 * Attach configuration to a schema
 * 
 * Mutates the schema object to add the CONFIG_SYMBOL property.
 * Returns the same schema instance with updated type information.
 */
export function withConfig<TConfig, TSchema extends z.ZodType>(
    schema: TSchema,
    config: TConfig
): ZodSchemaWithConfig<TConfig, TSchema> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (schema as any)[CONFIG_SYMBOL] = config;
    return schema as ZodSchemaWithConfig<TConfig, TSchema>;
}

/**
 * Pagination configuration - extends base type
 * Any changes to BasePaginationConfig will be reflected here
 */
export type PaginationConfig = BasePaginationConfig;

/**
 * Pagination input fields from the config - extends base type
 */
export type PaginationInputFields<TConfig extends Partial<PaginationConfig>> = BasePaginationSchemaOutput<TConfig>;

/**
 * Create a pagination configuration schema
 *
 * @param config Pagination configuration options
 * @returns ZodSchema with embedded configuration
 *
 * @example
 * ```typescript
 * const paginationConfig = createPaginationConfigSchema({
 *   defaultLimit: 20,
 *   maxLimit: 100,
 *   includeOffset: true,
 *   includePage: true,
 * });
 * ```
 */
export function createPaginationConfigSchema<
    TDefaultLimit extends number = 10,
    TMaxLimit extends number = 100,
    TMinLimit extends number = 1,
    TIncludeOffset extends boolean = true,
    TIncludeCursor extends boolean = false,
    TIncludePage extends boolean = false
>(
    config?: {
        defaultLimit?: TDefaultLimit;
        maxLimit?: TMaxLimit;
        minLimit?: TMinLimit;
        includeOffset?: TIncludeOffset;
        includeCursor?: TIncludeCursor;
        includePage?: TIncludePage;
    }
): ZodSchemaWithConfig<{
    defaultLimit: TDefaultLimit;
    maxLimit: TMaxLimit;
    minLimit: TMinLimit;
    includeOffset: TIncludeOffset;
    includeCursor: TIncludeCursor;
    includePage: TIncludePage;
}> {
    const finalConfig = {
        defaultLimit: (config?.defaultLimit ?? 10) as TDefaultLimit,
        maxLimit: (config?.maxLimit ?? 100) as TMaxLimit,
        minLimit: (config?.minLimit ?? 1) as TMinLimit,
        includeOffset: (config?.includeOffset ?? true) as TIncludeOffset,
        includeCursor: (config?.includeCursor ?? false) as TIncludeCursor,
        includePage: (config?.includePage ?? false) as TIncludePage,
    };

    // Build schema shape dynamically based on config
    const shape: Record<string, z.ZodType> = {
        limit: z.number().int().min(finalConfig.minLimit).max(finalConfig.maxLimit).default(finalConfig.defaultLimit),
    };

    if (finalConfig.includeOffset) {
        shape.offset = z.number().int().min(0).default(0);
    }

    if (finalConfig.includePage) {
        shape.page = z.number().int().min(1).default(1);
    }

    if (finalConfig.includeCursor) {
        shape.cursor = z.string().optional();
    }

    const schema = z.object(shape);

    return withConfig(schema, finalConfig);
}

/**
 * Create a pagination schema from a configuration
 *
 * @param config Pagination configuration
 * @returns Zod schema for pagination input
 */
export function createPaginationSchema<TConfig extends Partial<PaginationConfig>>(
    config: ZodSchemaWithConfig<TConfig>
): z.ZodType<PaginationInputFields<TConfig>> {
    const paginationConfig = getConfig<TConfig>(config);
    if (!paginationConfig) {
        throw new Error("Invalid pagination config schema");
    }

    const shape: Record<string, z.ZodType> = {
        limit: z.coerce.number().int().min(1).max(paginationConfig.maxLimit ?? 100),
    };

    if (paginationConfig.includeOffset) {
        shape.offset = z.coerce.number().int().min(0).default(0);
    }

    if (paginationConfig.includePage) {
        shape.page = z.coerce.number().int().min(1).default(1);
    }

    if (paginationConfig.includeCursor) {
        shape.cursor = z.string().optional();
    }

    return z.object(shape) as unknown as z.ZodType<PaginationInputFields<TConfig>>;
}

/**
 * Pagination meta schema output type
 */
export type PaginationMetaOutput<TConfig extends Partial<PaginationConfig>> = {
    total: number;
    limit: number;
    hasMore: boolean;
} & (TConfig["includeOffset"] extends true ? { offset: number } : object) &
    (TConfig["includePage"] extends true ? { page: number; totalPages: number } : object) &
    (TConfig["includeCursor"] extends true ? { nextCursor?: string | null; prevCursor?: string | null } : object);

/**
 * Create a pagination meta schema
 *
 * @param config Pagination configuration
 * @returns Zod schema for pagination metadata output
 */
export function createPaginationMetaSchema<TConfig extends Partial<PaginationConfig>>(
    config: ZodSchemaWithConfig<TConfig>
): z.ZodType<PaginationMetaOutput<TConfig>> {
    const paginationConfig = getConfig<TConfig>(config);
    if (!paginationConfig) {
        throw new Error("Invalid pagination config schema");
    }

    const shape: Record<string, z.ZodType> = {
        total: z.number().int().min(0),
        limit: z.number().int().min(1),
        hasMore: z.boolean(),
    };

    if (paginationConfig.includeOffset) {
        shape.offset = z.number().int().min(0);
    }

    if (paginationConfig.includePage) {
        shape.page = z.number().int().min(1);
        shape.totalPages = z.number().int().min(0);
    }

    if (paginationConfig.includeCursor) {
        shape.nextCursor = z.string().nullable().optional();
        shape.prevCursor = z.string().nullable().optional();
    }

    return z.object(shape) as unknown as z.ZodType<PaginationMetaOutput<TConfig>>;
}

/**
 * Create a paginated response schema wrapper
 *
 * @param itemSchema Schema for individual items
 * @param config Pagination configuration
 * @returns Zod schema for paginated response
 */
export function createPaginatedResponseSchema<
    TItemSchema extends z.ZodType,
    TConfig extends Partial<PaginationConfig>
>(itemSchema: TItemSchema, config: ZodSchemaWithConfig<TConfig>) {
    return z.object({
        data: z.array(itemSchema),
        meta: createPaginationMetaSchema(config),
    });
}

/**
 * Preset: Offset-based pagination config
 */
export const offsetPagination = createPaginationConfigSchema({
    includeOffset: true,
    includePage: false,
    includeCursor: false,
});

/**
 * Preset: Page-based pagination config
 */
export const pagePagination = createPaginationConfigSchema({
    includeOffset: false,
    includePage: true,
    includeCursor: false,
});

/**
 * Preset: Cursor-based pagination config
 */
export const cursorPagination = createPaginationConfigSchema({
    includeOffset: false,
    includePage: false,
    includeCursor: true,
});

/**
 * Preset: Full pagination config (all methods)
 */
export const fullPagination = createPaginationConfigSchema({
    includeOffset: true,
    includePage: true,
    includeCursor: true,
});
