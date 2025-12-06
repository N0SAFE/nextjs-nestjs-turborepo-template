import { z } from "zod/v4";

/**
 * Pagination configuration options
 */
export interface PaginationConfig {
  /** Default number of items per page */
  defaultLimit?: number;
  /** Maximum number of items per page */
  maxLimit?: number;
  /** Minimum number of items per page */
  minLimit?: number;
  /** Include offset-based pagination */
  includeOffset?: boolean;
  /** Include cursor-based pagination */
  includeCursor?: boolean;
  /** Include page-based pagination */
  includePage?: boolean;
}

/**
 * Creates a type-safe pagination input schema
 * 
 * @example
 * ```typescript
 * const paginationSchema = createPaginationSchema({
 *   defaultLimit: 20,
 *   maxLimit: 100,
 *   includeOffset: true,
 *   includeCursor: true
 * });
 * 
 * // Inferred type:
 * // {
 * //   limit: number (default 20, max 100)
 * //   offset: number (default 0)
 * //   cursor?: string
 * // }
 * ```
 */
export function createPaginationSchema(config: PaginationConfig = {}) {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    minLimit = 1,
    includeOffset = true,
    includeCursor = false,
    includePage = false,
  } = config;

  const schema: Record<string, z.ZodTypeAny> = {
    limit: z.coerce
      .number()
      .int()
      .min(minLimit)
      .max(maxLimit)
      .default(defaultLimit)
      .describe(`Number of items per page (${minLimit}-${maxLimit})`),
  };

  if (includeOffset) {
    schema.offset = z.coerce
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of items to skip");
  }

  if (includePage) {
    schema.page = z.coerce
      .number()
      .int()
      .min(1)
      .default(1)
      .describe("Page number (1-indexed)");
  }

  if (includeCursor) {
    schema.cursor = z
      .string()
      .optional()
      .describe("Cursor for cursor-based pagination");
    
    schema.cursorDirection = z
      .enum(["forward", "backward"])
      .default("forward")
      .optional()
      .describe("Direction for cursor pagination");
  }

  return z.object(schema as z.ZodRawShape);
}

/**
 * Creates a type-safe pagination metadata output schema
 * 
 * @example
 * ```typescript
 * const metaSchema = createPaginationMetaSchema({
 *   includeCursor: true,
 *   includePage: true
 * });
 * 
 * // Output includes: total, limit, offset, hasMore, nextCursor, prevCursor, page, totalPages
 * ```
 */
export function createPaginationMetaSchema(config: PaginationConfig = {}) {
  const {
    includeOffset = true,
    includeCursor = false,
    includePage = false,
  } = config;

  const schema: Record<string, z.ZodTypeAny> = {
    total: z.number().int().min(0).describe("Total number of items"),
    limit: z.number().int().positive().describe("Items per page"),
    hasMore: z.boolean().describe("Whether there are more items"),
  };

  if (includeOffset) {
    schema.offset = z.number().int().min(0).describe("Current offset");
  }

  if (includePage) {
    schema.page = z.number().int().min(1).describe("Current page number");
    schema.totalPages = z.number().int().min(0).describe("Total number of pages");
  }

  if (includeCursor) {
    schema.nextCursor = z.string().nullable().describe("Cursor for next page");
    schema.prevCursor = z.string().nullable().describe("Cursor for previous page");
  }

  return z.object(schema as z.ZodRawShape);
}

/**
 * Helper to create complete paginated response schema
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
  config: PaginationConfig = {}
) {
  return z.object({
    data: z.array(dataSchema),
    meta: createPaginationMetaSchema(config),
  });
}

/**
 * Offset-based pagination schema (traditional)
 */
export const offsetPagination = createPaginationSchema({
  includeOffset: true,
  includeCursor: false,
  includePage: false,
});

/**
 * Page-based pagination schema
 */
export const pagePagination = createPaginationSchema({
  includeOffset: false,
  includeCursor: false,
  includePage: true,
});

/**
 * Cursor-based pagination schema (for infinite scroll)
 */
export const cursorPagination = createPaginationSchema({
  includeOffset: false,
  includeCursor: true,
  includePage: false,
});

/**
 * Combined pagination schema with all options
 */
export const fullPagination = createPaginationSchema({
  includeOffset: true,
  includeCursor: true,
  includePage: true,
});
