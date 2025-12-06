import { z } from "zod/v4";

/**
 * Search configuration options
 */
export interface SearchConfig {
  /** Fields that can be searched */
  searchableFields?: readonly string[];
  /** Minimum query length */
  minQueryLength?: number;
  /** Maximum query length */
  maxQueryLength?: number;
  /** Allow case-sensitive search */
  caseSensitive?: boolean;
  /** Allow regex search */
  allowRegex?: boolean;
  /** Allow field-specific search */
  allowFieldSelection?: boolean;
}

/**
 * Creates a type-safe search input schema
 * 
 * @example
 * ```typescript
 * const searchSchema = createSearchSchema({
 *   searchableFields: ["name", "description", "sku"],
 *   minQueryLength: 2,
 *   allowFieldSelection: true
 * });
 * 
 * // Inferred type:
 * // {
 * //   query: string (min 2 chars)
 * //   fields?: ("name" | "description" | "sku")[]
 * //   caseSensitive?: boolean
 * // }
 * ```
 */
export function createSearchSchema(config: SearchConfig = {}) {
  const {
    searchableFields,
    minQueryLength = 1,
    maxQueryLength = 1000,
    caseSensitive = false,
    allowRegex = false,
    allowFieldSelection = false,
  } = config;

  const schema: Record<string, z.ZodTypeAny> = {
    query: z
      .string()
      .min(minQueryLength, `Query must be at least ${minQueryLength} characters`)
      .max(maxQueryLength, `Query must be at most ${maxQueryLength} characters`)
      .describe("Search query string"),
  };

  if (allowFieldSelection && searchableFields && searchableFields.length > 0) {
    schema.fields = z
      .array(z.enum(searchableFields as [string, ...string[]]))
      .optional()
      .describe("Specific fields to search in");
  }

  if (!caseSensitive) {
    schema.caseSensitive = z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether search is case-sensitive");
  }

  if (allowRegex) {
    schema.useRegex = z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to use regex matching");
  }

  // Search mode
  schema.mode = z
    .enum(["contains", "startsWith", "endsWith", "exact"])
    .optional()
    .default("contains")
    .describe("Search matching mode");

  return z.object(schema as z.ZodRawShape);
}

/**
 * Creates a simple search schema (query only)
 */
export function createSimpleSearchSchema(minLength: number = 1) {
  return z.object({
    query: z.string().min(minLength).describe("Search query"),
  });
}

/**
 * Creates a full-text search schema
 */
export function createFullTextSearchSchema(
  searchableFields: readonly string[]
) {
  return z.object({
    query: z.string().min(1).describe("Full-text search query"),
    fields: z
      .array(z.enum(searchableFields as [string, ...string[]]))
      .optional()
      .describe("Fields to search"),
    operator: z
      .enum(["and", "or"])
      .optional()
      .default("or")
      .describe("How to combine search terms"),
    highlight: z
      .boolean()
      .optional()
      .describe("Return highlighted results"),
  });
}

/**
 * Base search query schema
 */
export const baseSearchSchema = z.object({
  query: z.string().min(1).describe("Search query string"),
});

/**
 * Search with highlighting schema
 */
export const searchWithHighlightSchema = z.object({
  query: z.string().min(1),
  highlight: z.boolean().optional().default(false),
  highlightTag: z.string().optional().default("mark"),
});
