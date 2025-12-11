import { z } from "zod/v4";

/**
 * Symbol to store config data on Zod schemas
 */
export const CONFIG_SYMBOL = Symbol.for("orpc:config");

/**
 * Type for Zod schema with attached config
 */
export type ZodSchemaWithConfig<TConfig, TSchema extends z.ZodTypeAny = z.ZodTypeAny> = TSchema & {
  [CONFIG_SYMBOL]: TConfig;
};

/**
 * Check if a value is a Zod schema with config attached
 */
export function isZodSchemaWithConfig<TConfig>(value: unknown): value is ZodSchemaWithConfig<TConfig> {
  return value !== null && typeof value === "object" && CONFIG_SYMBOL in value;
}

/**
 * Extract config from a Zod schema
 * @deprecated Use direct symbol access: `schema[CONFIG_SYMBOL]` instead
 */
export function extractConfig<TConfig>(value: ZodSchemaWithConfig<TConfig>): TConfig {
  if (isZodSchemaWithConfig<TConfig>(value)) {
    return value[CONFIG_SYMBOL];
  }
  throw new Error("Expected a Zod schema with embedded config. Use createXConfigSchema() to create config schemas.");
}

/**
 * Sorting configuration schema factory - creates a schema for sorting config with specific fields
 * The schema also carries the config data for runtime extraction via CONFIG_SYMBOL
 */
export const createSortingConfigSchema = <TFields extends readonly string[]>(
  fields: TFields,
  defaults?: {
    defaultField?: TFields[number];
    defaultDirection?: "asc" | "desc";
    allowMultiple?: boolean;
    allowNullsHandling?: boolean;
  }
) => {
  const config = {
    fields,
    defaultField: defaults?.defaultField,
    defaultDirection: defaults?.defaultDirection ?? ("asc" as const),
    allowMultiple: defaults?.allowMultiple ?? false,
    allowNullsHandling: defaults?.allowNullsHandling ?? false,
  };

  const schema = z.object({
    /** Available fields for sorting */
    fields: z.custom<TFields>().default(fields as any),
    /** Default field to sort by */
    defaultField: z.enum(fields as unknown as [string, ...string[]]).optional().default(defaults?.defaultField as any),
    /** Default sort direction */
    defaultDirection: z.enum(["asc", "desc"]).optional().default(defaults?.defaultDirection ?? "asc"),
    /** Allow multiple sort fields */
    allowMultiple: z.boolean().optional().default(defaults?.allowMultiple ?? false),
    /** Allow null values to be first/last */
    allowNullsHandling: z.boolean().optional().default(defaults?.allowNullsHandling ?? false),
  });

  // Attach the config to the schema for runtime extraction (type-safe)
  const result = Object.assign(schema, {
    [CONFIG_SYMBOL]: config
  }) as ZodSchemaWithConfig<typeof config, typeof schema>;

  return result;
};

/**
 * Creates a type-safe sorting input schema
 * 
 * @param configSchema - Zod schema created by createSortingConfigSchema()
 * 
 * @example
 * ```typescript
 * const configSchema = createSortingConfigSchema(
 *   ["createdAt", "name", "price"] as const,
 *   { defaultField: "createdAt", defaultDirection: "desc" }
 * );
 * const sortSchema = createSortingSchema(configSchema);
 * 
 * // Inferred type:
 * // {
 * //   sortBy: "createdAt" | "name" | "price" (default "createdAt")
 * //   sortDirection: "asc" | "desc" (default "desc")
 * // }
 * ```
 */
export function createSortingSchema<TConfig>(
  configSchema: ZodSchemaWithConfig<TConfig>
) {
  const config = configSchema[CONFIG_SYMBOL] as {
    fields: readonly string[];
    defaultField?: string;
    defaultDirection?: "asc" | "desc";
    allowMultiple?: boolean;
    allowNullsHandling?: boolean;
  };

  const {
    fields,
    defaultField,
    defaultDirection = "asc",
    allowMultiple = false,
    allowNullsHandling = false,
  } = config;

  if (fields.length === 0) {
    throw new Error("At least one sortable field must be provided");
  }

  // Build schema conditionally based on config
  if (allowMultiple) {
    // Multiple sort fields
    const sortBySchema = defaultField
      ? z.array(
          z.object({
            field: z.enum(fields as unknown as [string, ...string[]]),
            direction: z.enum(["asc", "desc"]).default(defaultDirection),
          })
        )
        .min(1)
        .optional()
        .default([{ field: defaultField, direction: defaultDirection }])
        .describe("Array of sort criteria")
      : z.array(
          z.object({
            field: z.enum(fields as unknown as [string, ...string[]]),
            direction: z.enum(["asc", "desc"]).default(defaultDirection),
          })
        )
        .min(1)
        .optional()
        .describe("Array of sort criteria");

    let schema = z.object({ sortBy: sortBySchema });

    if (allowNullsHandling) {
      schema = schema.extend({
        nullsHandling: z
          .enum(["first", "last"])
          .optional()
          .describe("How to handle null values in sorting"),
      });
    }

    return schema;
  } else {
    // Single sort field
    const sortBySchema = defaultField
      ? z.enum(fields as unknown as [string, ...string[]]).optional().default(defaultField).describe("Field to sort by")
      : z.enum(fields as unknown as [string, ...string[]]).optional().describe("Field to sort by");

    let schema = z.object({
      sortBy: sortBySchema,
      sortDirection: z
        .enum(["asc", "desc"])
        .default(defaultDirection)
        .describe("Sort direction"),
    });

    if (allowNullsHandling) {
      schema = schema.extend({
        nullsHandling: z
          .enum(["first", "last"])
          .optional()
          .describe("How to handle null values in sorting"),
      });
    }

    return schema;
  }
}

/**
 * Creates a simple ascending/descending sort schema
 * 
 * @param fields - Array of sortable field names
 * @param defaultField - Optional default field to sort by
 * 
 * @example
 * ```typescript
 * const schema = createSimpleSortSchema(["name", "createdAt"] as const, "name");
 * ```
 */
export function createSimpleSortSchema<TFields extends readonly string[]>(
  fields: TFields,
  defaultField?: TFields[number]
) {
  const configSchema = createSortingConfigSchema(fields, {
    defaultField,
    defaultDirection: "asc",
    allowMultiple: false,
  });
  return createSortingSchema(configSchema);
}

/**
 * Creates a multi-field sort schema
 * 
 * @param fields - Array of sortable field names
 * 
 * @example
 * ```typescript
 * const schema = createMultiSortSchema(["name", "price", "createdAt"] as const);
 * ```
 */
export function createMultiSortSchema<TFields extends readonly string[]>(
  fields: TFields
) {
  const configSchema = createSortingConfigSchema(fields, {
    allowMultiple: true,
    defaultDirection: "asc",
  });
  return createSortingSchema(configSchema);
}

/**
 * Generic sort direction schema
 */
export const sortDirection = z
  .enum(["asc", "desc"])
  .default("asc")
  .describe("Sort direction (ascending or descending)");

/**
 * Nulls handling schema
 */
export const nullsHandling = z
  .enum(["first", "last"])
  .optional()
  .describe("How to handle null values in sorting");
