import { z } from "zod/v4";

/**
 * Sorting configuration options
 */
export interface SortingConfig<TFields extends readonly string[] = readonly string[]> {
  /** Available fields for sorting */
  fields: TFields;
  /** Default field to sort by */
  defaultField?: TFields[number];
  /** Default sort direction */
  defaultDirection?: "asc" | "desc";
  /** Allow multiple sort fields */
  allowMultiple?: boolean;
  /** Allow null values to be first/last */
  allowNullsHandling?: boolean;
}

/**
 * Creates a type-safe sorting input schema
 * 
 * @example
 * ```typescript
 * const sortSchema = createSortingSchema({
 *   fields: ["createdAt", "name", "price"] as const,
 *   defaultField: "createdAt",
 *   defaultDirection: "desc"
 * });
 * 
 * // Inferred type:
 * // {
 * //   sortBy: "createdAt" | "name" | "price" (default "createdAt")
 * //   sortDirection: "asc" | "desc" (default "desc")
 * // }
 * ```
 */
export function createSortingSchema<TFields extends readonly string[]>(
  config: SortingConfig<TFields>
) {
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

  const schema: Record<string, z.ZodTypeAny> = {};

  if (allowMultiple) {
    // Multiple sort fields
    schema.sortBy = z
      .array(
        z.object({
          field: z.enum(fields as unknown as [string, ...string[]]),
          direction: z.enum(["asc", "desc"]).default(defaultDirection),
        })
      )
      .min(1)
      .optional()
      .describe("Array of sort criteria");

    if (defaultField) {
      schema.sortBy = (schema.sortBy as z.ZodOptional<any>).default([
        { field: defaultField, direction: defaultDirection },
      ]);
    }
  } else {
    // Single sort field
    const sortBySchema = z
      .enum(fields as unknown as [string, ...string[]])
      .optional()
      .describe("Field to sort by");

    schema.sortBy = defaultField
      ? sortBySchema.default(defaultField)
      : sortBySchema;

    schema.sortDirection = z
      .enum(["asc", "desc"])
      .default(defaultDirection)
      .describe("Sort direction");
  }

  if (allowNullsHandling) {
    schema.nullsHandling = z
      .enum(["first", "last"])
      .optional()
      .describe("How to handle null values in sorting");
  }

  return z.object(schema as z.ZodRawShape);
}

/**
 * Creates a simple ascending/descending sort schema
 */
export function createSimpleSortSchema<TFields extends readonly string[]>(
  fields: TFields,
  defaultField?: TFields[number]
) {
  return createSortingSchema({
    fields,
    defaultField,
    defaultDirection: "asc",
    allowMultiple: false,
  });
}

/**
 * Creates a multi-field sort schema
 */
export function createMultiSortSchema<TFields extends readonly string[]>(
  fields: TFields
) {
  return createSortingSchema({
    fields,
    allowMultiple: true,
    defaultDirection: "asc",
  });
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
