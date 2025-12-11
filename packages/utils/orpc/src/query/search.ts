import { z } from "zod/v4";
import { CONFIG_SYMBOL, type ZodSchemaWithConfig } from "./sorting";

/**
 * Create a search config schema with attached config data
 * This allows the schema to carry the actual config for runtime extraction
 * 
 * @param searchableFields - Fields that can be searched (optional)
 * @param options - Additional search configuration
 * @returns Zod schema with embedded config
 * 
 * @example
 * ```typescript
 * const config = createSearchConfigSchema(
 *   ["name", "description", "sku"],
 *   {
 *     minQueryLength: 2,
 *     allowFieldSelection: true,
 *     allowRegex: false
 *   }
 * );
 * ```
 */
export function createSearchConfigSchema(
  searchableFields?: readonly string[],
  options?: {
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
) {
  const config = {
    searchableFields: searchableFields ?? [],
    minQueryLength: options?.minQueryLength ?? 1,
    maxQueryLength: options?.maxQueryLength ?? 1000,
    caseSensitive: options?.caseSensitive ?? false,
    allowRegex: options?.allowRegex ?? false,
    allowFieldSelection: options?.allowFieldSelection ?? false,
  };

  const schema = z.object({
    searchableFields: z.array(z.string()),
    minQueryLength: z.number(),
    maxQueryLength: z.number(),
    caseSensitive: z.boolean(),
    allowRegex: z.boolean(),
    allowFieldSelection: z.boolean(),
  });

  // Attach config to schema for runtime extraction (type-safe)
  const result = Object.assign(schema, {
    [CONFIG_SYMBOL]: config
  }) as ZodSchemaWithConfig<typeof config, typeof schema>;

  return result;
}

/**
 * Creates a type-safe search input schema from a config schema
 * 
 * @param configSchema - Zod schema with embedded config created by createSearchConfigSchema
 * @returns Zod schema for search input
 * 
 * @example
 * ```typescript
 * const config = createSearchConfigSchema(
 *   ["name", "description", "sku"],
 *   {
 *     minQueryLength: 2,
 *     allowFieldSelection: true
 *   }
 * );
 * const searchSchema = createSearchSchema(config);
 * 
 * // Inferred type:
 * // {
 * //   query: string (min 2 chars)
 * //   fields?: ("name" | "description" | "sku")[]
 * //   caseSensitive?: boolean
 * // }
 * ```
 */
export function createSearchSchema<TConfig>(
  configSchema: ZodSchemaWithConfig<TConfig>
) {
  // Extract config from schema
  const config = configSchema[CONFIG_SYMBOL] as {
    searchableFields: readonly string[];
    minQueryLength: number;
    maxQueryLength: number;
    caseSensitive: boolean;
    allowRegex: boolean;
    allowFieldSelection: boolean;
  };

  const {
    searchableFields,
    minQueryLength,
    maxQueryLength,
    caseSensitive,
    allowRegex,
    allowFieldSelection,
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
 * 
 * @param minLength - Minimum query length (default: 1)
 * @returns Zod schema for basic search input
 */
export function createSimpleSearchSchema(minLength = 1) {
  const configSchema = createSearchConfigSchema(undefined, {
    minQueryLength: minLength,
  });
  return createSearchSchema(configSchema);
}

/**
 * Creates a full-text search schema
 * 
 * @param searchableFields - Fields that can be searched
 * @returns Zod schema with field selection and full-text features
 */
export function createFullTextSearchSchema(
  searchableFields: readonly string[]
) {
  const configSchema = createSearchConfigSchema(searchableFields, {
    allowFieldSelection: true,
    allowRegex: true,
  });
  
  // Create base schema
  const baseSchema = createSearchSchema(configSchema);
  
  // Extend with full-text specific fields
  return baseSchema.extend({
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
export const baseSearchSchema = (() => {
  const config = createSearchConfigSchema();
  return createSearchSchema(config);
})();

/**
 * Search with highlighting schema
 */
export const searchWithHighlightSchema = (() => {
  const config = createSearchConfigSchema();
  const baseSchema = createSearchSchema(config);
  
  return baseSchema.extend({
    highlight: z.boolean().optional().default(false),
    highlightTag: z.string().optional().default("mark"),
  });
})();
