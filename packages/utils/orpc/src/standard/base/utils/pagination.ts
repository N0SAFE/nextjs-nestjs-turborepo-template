/**
 * Pagination utilities for Standard Schema
 * Pure Standard Schema implementation without Zod dependency
 */

import type { AnySchema, ObjectSchema, SchemaWithConfig } from "../types";
import { CONFIG_SYMBOL, withConfig } from "../types";
import { s } from "../schema";

/**
 * Pagination configuration options
 */
export type PaginationConfig = {
    defaultLimit: number;
    maxLimit: number;
    minLimit: number;
    includeOffset: boolean;
    includeCursor: boolean;
    includePage: boolean;
};

/**
 * Default pagination configuration
 */
const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
    defaultLimit: 10,
    maxLimit: 100,
    minLimit: 1,
    includeOffset: true,
    includeCursor: false,
    includePage: false,
};

/**
 * Create a pagination config schema with attached config data
 */
export function createPaginationConfigSchema<
    TDefaultLimit extends number = 10,
    TMaxLimit extends number = 100,
    TMinLimit extends number = 1,
    TIncludeOffset extends boolean = true,
    TIncludeCursor extends boolean = false,
    TIncludePage extends boolean = false
>(
    options: {
        defaultLimit?: TDefaultLimit;
        maxLimit?: TMaxLimit;
        minLimit?: TMinLimit;
        includeOffset?: TIncludeOffset;
        includeCursor?: TIncludeCursor;
        includePage?: TIncludePage;
    } = {}
): SchemaWithConfig<{
    defaultLimit: TDefaultLimit extends number ? TDefaultLimit : 10;
    maxLimit: TMaxLimit extends number ? TMaxLimit : 100;
    minLimit: TMinLimit extends number ? TMinLimit : 1;
    includeOffset: TIncludeOffset extends boolean ? TIncludeOffset : true;
    includeCursor: TIncludeCursor extends boolean ? TIncludeCursor : false;
    includePage: TIncludePage extends boolean ? TIncludePage : false;
}> {
    const config = {
        defaultLimit: (options.defaultLimit ?? DEFAULT_PAGINATION_CONFIG.defaultLimit) as TDefaultLimit extends number ? TDefaultLimit : 10,
        maxLimit: (options.maxLimit ?? DEFAULT_PAGINATION_CONFIG.maxLimit) as TMaxLimit extends number ? TMaxLimit : 100,
        minLimit: (options.minLimit ?? DEFAULT_PAGINATION_CONFIG.minLimit) as TMinLimit extends number ? TMinLimit : 1,
        includeOffset: (options.includeOffset ?? DEFAULT_PAGINATION_CONFIG.includeOffset) as TIncludeOffset extends boolean ? TIncludeOffset : true,
        includeCursor: (options.includeCursor ?? DEFAULT_PAGINATION_CONFIG.includeCursor) as TIncludeCursor extends boolean ? TIncludeCursor : false,
        includePage: (options.includePage ?? DEFAULT_PAGINATION_CONFIG.includePage) as TIncludePage extends boolean ? TIncludePage : false,
    };

    const schema = s.object({
        defaultLimit: s.number({ min: 1 }),
        maxLimit: s.number({ min: 1 }),
        minLimit: s.number({ min: 1 }),
        includeOffset: s.boolean(),
        includeCursor: s.boolean(),
        includePage: s.boolean(),
    });

    return withConfig(schema as AnySchema, config);
}

/**
 * Pagination schema output type helper
 */
export type PaginationSchemaOutput<TConfig> = {
    limit: number;
} & (TConfig extends Record<string, unknown> ? (TConfig["includeOffset"] extends true ? { offset: number } : object) : object) &
    (TConfig extends Record<string, unknown> ? (TConfig["includePage"] extends true ? { page: number } : object) : object) &
    (TConfig extends Record<string, unknown> ? (TConfig["includeCursor"] extends true ? { cursor?: string; cursorDirection?: "forward" | "backward" } : object) : object);

/**
 * Create a pagination input schema from config
 */
export function createPaginationSchema<TConfig extends Partial<PaginationConfig>>(
    configSchema: SchemaWithConfig<TConfig>
): ObjectSchema {
    const config = configSchema[CONFIG_SYMBOL] as PaginationConfig;
    const { defaultLimit, maxLimit, minLimit, includeOffset, includeCursor, includePage } = config;

    const shape: Record<string, AnySchema> = {
        limit: s.coerceNumber({
            min: minLimit,
            max: maxLimit,
            int: true,
            description: `Number of items per page (${String(minLimit)}-${String(maxLimit)})`,
        }),
    };

    // Add offset if configured
    if (includeOffset) {
        shape.offset = s.optional(
            s.coerceNumber({
                min: 0,
                int: true,
                description: "Number of items to skip",
            })
        );
    }

    // Add page if configured
    if (includePage) {
        shape.page = s.optional(
            s.coerceNumber({
                min: 1,
                int: true,
                description: "Page number (1-indexed)",
            })
        );
    }

    // Add cursor if configured
    if (includeCursor) {
        shape.cursor = s.optional(s.string({ description: "Cursor for pagination" }));
        shape.cursorDirection = s.optional(
            s.enum(["forward", "backward"] as const)
        );
    }

    // Create schema and set default for limit
    const schema = s.object(shape);

    // Add default value handling to the schema
    return {
        ...schema,
        "~standard": {
            ...schema["~standard"],
            validate: (value: unknown) => {
                const input = typeof value === "object" && value !== null ? value : {};
                const withDefaults = {
                    limit: (input as Record<string, unknown>).limit ?? defaultLimit,
                    ...(includeOffset && { offset: (input as Record<string, unknown>).offset ?? 0 }),
                    ...(includePage && { page: (input as Record<string, unknown>).page ?? 1 }),
                    ...input,
                };
                return schema["~standard"].validate(withDefaults);
            },
        },
    };
}

/**
 * Pagination meta schema output type helper
 */
export type PaginationMetaSchemaOutput<TConfig> = {
    total: number;
    limit: number;
    hasMore: boolean;
} & (TConfig extends { includeOffset: true } ? { offset: number } : object) &
    (TConfig extends { includePage: true } ? { page: number; totalPages: number } : object) &
    (TConfig extends { includeCursor: true } ? { nextCursor: string | null; prevCursor: string | null } : object);

/**
 * Create a pagination metadata output schema from config
 */
export function createPaginationMetaSchema<TConfig extends Partial<PaginationConfig>>(
    configSchema: SchemaWithConfig<TConfig>
) {
    const config = configSchema[CONFIG_SYMBOL] as PaginationConfig;
    const { includeOffset, includeCursor, includePage } = config;

    // Build shape without type annotation to preserve specific types
    const baseShape = {
        total: s.int({ min: 0, description: "Total number of items" }),
        limit: s.int({ min: 1, description: "Items per page" }),
        hasMore: s.boolean({ description: "Whether there are more items" }),
        ...(includeOffset ? { offset: s.int({ min: 0, description: "Current offset" }) } : {}),
        ...(includePage ? {
            page: s.int({ min: 1, description: "Current page number" }),
            totalPages: s.int({ min: 0, description: "Total number of pages" }),
        } : {}),
        ...(includeCursor ? {
            nextCursor: s.nullable(s.string({ description: "Cursor for next page" })),
            prevCursor: s.nullable(s.string({ description: "Cursor for previous page" })),
        } : {}),
    };

    return s.object(baseShape);
}

/**
 * Create a complete paginated response schema
 */
export function createPaginatedResponseSchema<TConfig extends Partial<PaginationConfig>>(
    dataSchema: AnySchema,
    configSchema: SchemaWithConfig<TConfig>
): ObjectSchema {
    return s.object({
        data: s.array(dataSchema),
        meta: createPaginationMetaSchema(configSchema),
    });
}

// Pre-built pagination schemas
export const offsetPagination = createPaginationSchema(
    createPaginationConfigSchema({ includeOffset: true, includeCursor: false, includePage: false })
);

export const pagePagination = createPaginationSchema(
    createPaginationConfigSchema({ includeOffset: false, includeCursor: false, includePage: true })
);

export const cursorPagination = createPaginationSchema(
    createPaginationConfigSchema({ includeOffset: false, includeCursor: true, includePage: false })
);

export const fullPagination = createPaginationSchema(
    createPaginationConfigSchema({ includeOffset: true, includeCursor: true, includePage: true })
);
