import { z } from "zod/v4";
import { CONFIG_SYMBOL, type ZodSchemaWithConfig } from "./sorting";

/**
 * Create a pagination config schema with attached config data
 * This allows the schema to carry the actual config for runtime extraction
 * 
 * @param options - Pagination configuration options
 * @returns Zod schema with embedded config
 * 
 * @example
 * ```typescript
 * const config = createPaginationConfigSchema({
 *   defaultLimit: 20,
 *   maxLimit: 100,
 *   includeOffset: true,
 *   includeCursor: true
 * });
 * ```
 */
export function createPaginationConfigSchema<
  TDefaultLimit extends number | undefined = undefined,
  TMaxLimit extends number | undefined = undefined,
  TMinLimit extends number | undefined = undefined,
  TIncludeOffset extends boolean | undefined = undefined,
  TIncludeCursor extends boolean | undefined = undefined,
  TIncludePage extends boolean | undefined = undefined
>(options: {
  /** Default number of items per page */
  defaultLimit?: TDefaultLimit;
  /** Maximum number of items per page */
  maxLimit?: TMaxLimit;
  /** Minimum number of items per page */
  minLimit?: TMinLimit;
  /** Include offset-based pagination */
  includeOffset?: TIncludeOffset;
  /** Include cursor-based pagination */
  includeCursor?: TIncludeCursor;
  /** Include page-based pagination */
  includePage?: TIncludePage;
} = {}) {
  // Compute config with defaults - preserve literal types
  const config = {
    defaultLimit: (options.defaultLimit ?? 10) as TDefaultLimit extends number ? TDefaultLimit : 10,
    maxLimit: (options.maxLimit ?? 100) as TMaxLimit extends number ? TMaxLimit : 100,
    minLimit: (options.minLimit ?? 1) as TMinLimit extends number ? TMinLimit : 1,
    includeOffset: (options.includeOffset ?? true) as TIncludeOffset extends boolean ? TIncludeOffset : true,
    includeCursor: (options.includeCursor ?? false) as TIncludeCursor extends boolean ? TIncludeCursor : false,
    includePage: (options.includePage ?? false) as TIncludePage extends boolean ? TIncludePage : false,
  };

  const schema = z.object({
    defaultLimit: z.number().optional().default(config.defaultLimit),
    maxLimit: z.number().optional().default(config.maxLimit),
    minLimit: z.number().optional().default(config.minLimit),
    includeOffset: z.boolean().optional().default(config.includeOffset),
    includeCursor: z.boolean().optional().default(config.includeCursor),
    includePage: z.boolean().optional().default(config.includePage),
  });

  // Attach config to schema for runtime extraction (type-safe)
  const result = Object.assign(schema, {
    [CONFIG_SYMBOL]: config
  }) as ZodSchemaWithConfig<typeof config, typeof schema>;

  return result;
}

/**
 * Type helper to compute the pagination schema output type based on config
 */
type PaginationSchemaOutput<TConfig> = {
  limit: number;
} & (TConfig extends { includeOffset: true } ? { offset: number } : object)
  & (TConfig extends { includePage: true } ? { page: number } : object)
  & (TConfig extends { includeCursor: true } ? { cursor?: string; cursorDirection?: "forward" | "backward" } : object);

/**
 * Creates a type-safe pagination input schema from a config schema
 * 
 * @param configSchema - Zod schema with embedded config created by createPaginationConfigSchema
 * @returns Zod schema for pagination input
 * 
 * @example
 * ```typescript
 * const config = createPaginationConfigSchema({
 *   defaultLimit: 20,
 *   maxLimit: 100,
 *   includeOffset: true,
 *   includeCursor: true
 * });
 * const paginationSchema = createPaginationSchema(config);
 * 
 * // Inferred type:
 * // {
 * //   limit: number (default 20, max 100)
 * //   offset: number (default 0)
 * //   cursor?: string
 * // }
 * ```
 */
export function createPaginationSchema<TConfig>(
  configSchema: ZodSchemaWithConfig<TConfig>
): z.ZodType<PaginationSchemaOutput<TConfig>> {
  // Extract config from schema
  const config = configSchema[CONFIG_SYMBOL] as {
    defaultLimit: number;
    maxLimit: number;
    minLimit: number;
    includeOffset: boolean;
    includeCursor: boolean;
    includePage: boolean;
  };

  const {
    defaultLimit,
    maxLimit,
    minLimit,
    includeOffset,
    includeCursor,
    includePage,
  } = config;

  // Base schema with limit
  let schema = z.object({
    limit: z.coerce
      .number()
      .int()
      .min(minLimit)
      .max(maxLimit)
      .default(defaultLimit)
      .describe(`Number of items per page (${String(minLimit)}-${String(maxLimit)})`),
  });

  // Extend with offset if needed
  if (includeOffset) {
    schema = schema.extend({
      offset: z.coerce
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Number of items to skip"),
    });
  }

  // Extend with page if needed
  if (includePage) {
    schema = schema.extend({
      page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .describe("Page number (1-indexed)"),
    });
  }

  // Extend with cursor if needed
  if (includeCursor) {
    schema = schema.extend({
      cursor: z
        .string()
        .optional()
        .describe("Cursor for cursor-based pagination"),
      cursorDirection: z
        .enum(["forward", "backward"])
        .default("forward")
        .optional()
        .describe("Direction for cursor pagination"),
    });
  }

  return schema as unknown as z.ZodType<PaginationSchemaOutput<TConfig>>;
}

/**
 * Type helper to compute the pagination meta schema output type based on config
 */
type PaginationMetaSchemaOutput<TConfig> = {
  total: number;
  limit: number;
  hasMore: boolean;
} & (TConfig extends { includeOffset: true } ? { offset: number } : object)
  & (TConfig extends { includePage: true } ? { page: number; totalPages: number } : object)
  & (TConfig extends { includeCursor: true } ? { nextCursor: string | null; prevCursor: string | null } : object);

/**
 * Creates a type-safe pagination metadata output schema from a config schema
 * 
 * @param configSchema - Zod schema with embedded config created by createPaginationConfigSchema
 * @returns Zod schema for pagination metadata output
 * 
 * @example
 * ```typescript
 * const config = createPaginationConfigSchema({
 *   includeCursor: true,
 *   includePage: true
 * });
 * const metaSchema = createPaginationMetaSchema(config);
 * 
 * // Output includes: total, limit, offset, hasMore, nextCursor, prevCursor, page, totalPages
 * ```
 */
export function createPaginationMetaSchema<TConfig>(
  configSchema: ZodSchemaWithConfig<TConfig>
): z.ZodType<PaginationMetaSchemaOutput<TConfig>> {
  // Extract config from schema
  const config = configSchema[CONFIG_SYMBOL] as {
    includeOffset: boolean;
    includeCursor: boolean;
    includePage: boolean;
  };

  const { includeOffset, includeCursor, includePage } = config;

  // Base meta schema
  let schema = z.object({
    total: z.number().int().min(0).describe("Total number of items"),
    limit: z.number().int().positive().describe("Items per page"),
    hasMore: z.boolean().describe("Whether there are more items"),
  });

  // Extend with offset if needed
  if (includeOffset) {
    schema = schema.extend({
      offset: z.number().int().min(0).describe("Current offset"),
    });
  }

  // Extend with page info if needed
  if (includePage) {
    schema = schema.extend({
      page: z.number().int().min(1).describe("Current page number"),
      totalPages: z.number().int().min(0).describe("Total number of pages"),
    });
  }

  // Extend with cursors if needed
  if (includeCursor) {
    schema = schema.extend({
      nextCursor: z.string().nullable().describe("Cursor for next page"),
      prevCursor: z.string().nullable().describe("Cursor for previous page"),
    });
  }

  return schema as unknown as z.ZodType<PaginationMetaSchemaOutput<TConfig>>;
}

/**
 * Helper to create complete paginated response schema from a config schema
 * 
 * @param dataSchema - Zod schema for individual data items
 * @param configSchema - Zod schema with embedded config
 * @returns Zod schema for paginated response with data and meta
 */
export function createPaginatedResponseSchema<
  TData extends z.ZodType,
  TConfig
>(dataSchema: TData, configSchema: ZodSchemaWithConfig<TConfig>) {
  return z.object({
    data: z.array(dataSchema),
    meta: createPaginationMetaSchema(configSchema),
  });
}

/**
 * Offset-based pagination schema (traditional)
 */
export const offsetPagination = (() => {
  const config = createPaginationConfigSchema({
    includeOffset: true,
    includeCursor: false,
    includePage: false,
  });
  return createPaginationSchema(config);
})();

/**
 * Page-based pagination schema
 */
export const pagePagination = (() => {
  const config = createPaginationConfigSchema({
    includeOffset: false,
    includeCursor: false,
    includePage: true,
  });
  return createPaginationSchema(config);
})();

/**
 * Cursor-based pagination schema (for infinite scroll)
 */
export const cursorPagination = (() => {
  const config = createPaginationConfigSchema({
    includeOffset: false,
    includeCursor: true,
    includePage: false,
  });
  return createPaginationSchema(config);
})();

/**
 * Combined pagination schema with all options
 */
export const fullPagination = (() => {
  const config = createPaginationConfigSchema({
    includeOffset: true,
    includeCursor: true,
    includePage: true,
  });
  return createPaginationSchema(config);
})();
