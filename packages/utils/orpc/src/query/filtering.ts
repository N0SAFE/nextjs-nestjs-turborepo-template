import { z } from "zod/v4";

/**
 * Filter operator types
 */
export type FilterOperator =
  | "eq"      // equals
  | "ne"      // not equals
  | "gt"      // greater than
  | "gte"     // greater than or equal
  | "lt"      // less than
  | "lte"     // less than or equal
  | "in"      // in array
  | "nin"     // not in array
  | "like"    // SQL LIKE (contains)
  | "ilike"   // case-insensitive LIKE
  | "regex"   // regex match
  | "exists"  // field exists/not null
  | "between" // between two values
  | "startsWith" // starts with string
  | "endsWith"   // ends with string
  | "contains";  // contains string

/**
 * Filter configuration for a field
 */
export interface FieldFilterConfig {
  /** Zod schema for the field value */
  schema: z.ZodTypeAny;
  /** Allowed operators for this field */
  operators?: FilterOperator[];
  /** Description for documentation */
  description?: string;
}

/**
 * Filtering configuration options
 */
export interface FilteringConfig {
  /** Available fields for filtering with their schemas */
  fields: Record<string, FieldFilterConfig | z.ZodTypeAny>;
  /** Allow combining filters with AND/OR */
  allowLogicalOperators?: boolean;
  /** Allow nested filters */
  allowNested?: boolean;
  /** Prefix for filter parameter names */
  prefix?: string;
}

/**
 * Creates a type-safe filtering schema
 * 
 * @example
 * ```typescript
 * const filterSchema = createFilteringSchema({
 *   fields: {
 *     name: { schema: z.string(), operators: ["eq", "like", "ilike"] },
 *     price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte", "between"] },
 *     categoryId: z.string().uuid(),
 *     inStock: z.boolean()
 *   }
 * });
 * 
 * // Generates schemas for:
 * // name, name_like, name_ilike
 * // price_gt, price_gte, price_lt, price_lte, price_between
 * // categoryId, inStock
 * ```
 */
export function createFilteringSchema(config: FilteringConfig) {
  const {
    fields,
    allowLogicalOperators = false,
    allowNested = false,
    prefix = "",
  } = config;

  const schema: Record<string, z.ZodTypeAny> = {};

  // Generate filter schemas for each field
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    const isConfigObject = fieldConfig && typeof fieldConfig === "object" && "schema" in fieldConfig;
    const fieldSchema = isConfigObject ? fieldConfig.schema : fieldConfig;
    const operators = isConfigObject ? fieldConfig.operators : ["eq"];
    const description = isConfigObject ? fieldConfig.description : undefined;

    const prefixedName = prefix ? `${prefix}_${fieldName}` : fieldName;

    // Add base equality filter
    if (!operators || operators.includes("eq")) {
      schema[prefixedName] = fieldSchema
        .optional()
        .describe(description || `Filter by ${fieldName}`);
    }

    // Add operator-specific filters
    if (operators) {
      for (const op of operators) {
        if (op === "eq") continue; // Already handled

        const opSuffix = `_${op}`;
        const opFieldName = `${prefixedName}${opSuffix}`;

        switch (op) {
          case "ne":
          case "gt":
          case "gte":
          case "lt":
          case "lte":
          case "like":
          case "ilike":
          case "regex":
          case "startsWith":
          case "endsWith":
          case "contains":
            schema[opFieldName] = fieldSchema
              .optional()
              .describe(`Filter ${fieldName} (${op})`);
            break;

          case "in":
          case "nin":
            schema[opFieldName] = z
              .array(fieldSchema)
              .optional()
              .describe(`Filter ${fieldName} (${op})`);
            break;

          case "exists":
            schema[opFieldName] = z
              .boolean()
              .optional()
              .describe(`Check if ${fieldName} exists`);
            break;

          case "between":
            schema[opFieldName] = z
              .object({
                from: fieldSchema,
                to: fieldSchema,
              })
              .optional()
              .describe(`Filter ${fieldName} between two values`);
            break;
        }
      }
    }
  }

  // Add logical operators if allowed
  if (allowLogicalOperators && allowNested) {
    // This would create recursive schemas for AND/OR combinations
    // For simplicity, we'll add basic support
    schema._and = z
      .array(z.record(z.string(), z.any()))
      .optional()
      .describe("Combine filters with AND");
    
    schema._or = z
      .array(z.record(z.string(), z.any()))
      .optional()
      .describe("Combine filters with OR");
  }

  return z.object(schema as z.ZodRawShape);
}

/**
 * Creates a simple equality-only filter schema
 */
export function createSimpleFilterSchema(
  fields: Record<string, z.ZodTypeAny>
) {
  const schema: Record<string, z.ZodTypeAny> = {};

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    schema[fieldName] = fieldSchema.optional();
  }

  return z.object(schema as z.ZodRawShape);
}

/**
 * Creates filters for string fields with common operators
 */
export function createStringFilterSchema(fieldName: string) {
  return z.object({
    [fieldName]: z.string().optional(),
    [`${fieldName}_like`]: z.string().optional().describe("Contains (case-sensitive)"),
    [`${fieldName}_ilike`]: z.string().optional().describe("Contains (case-insensitive)"),
    [`${fieldName}_startsWith`]: z.string().optional(),
    [`${fieldName}_endsWith`]: z.string().optional(),
    [`${fieldName}_in`]: z.array(z.string()).optional(),
  } as Record<string, z.ZodTypeAny>);
}

/**
 * Creates filters for number fields with comparison operators
 */
export function createNumberFilterSchema(fieldName: string) {
  return z.object({
    [fieldName]: z.number().optional(),
    [`${fieldName}_gt`]: z.number().optional().describe("Greater than"),
    [`${fieldName}_gte`]: z.number().optional().describe("Greater than or equal"),
    [`${fieldName}_lt`]: z.number().optional().describe("Less than"),
    [`${fieldName}_lte`]: z.number().optional().describe("Less than or equal"),
    [`${fieldName}_between`]: z.object({
      from: z.number(),
      to: z.number(),
    }).optional(),
    [`${fieldName}_in`]: z.array(z.number()).optional(),
  } as Record<string, z.ZodTypeAny>);
}

/**
 * Creates filters for date fields
 */
export function createDateFilterSchema(fieldName: string) {
  return z.object({
    [fieldName]: z.string().datetime().optional(),
    [`${fieldName}_gt`]: z.string().datetime().optional().describe("After"),
    [`${fieldName}_gte`]: z.string().datetime().optional().describe("On or after"),
    [`${fieldName}_lt`]: z.string().datetime().optional().describe("Before"),
    [`${fieldName}_lte`]: z.string().datetime().optional().describe("On or before"),
    [`${fieldName}_between`]: z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).optional(),
  } as Record<string, z.ZodTypeAny>);
}

/**
 * Creates filters for boolean fields
 */
export function createBooleanFilterSchema(fieldName: string) {
  return z.object({
    [fieldName]: z.boolean().optional(),
  });
}

/**
 * Creates filters for enum fields
 */
export function createEnumFilterSchema<T extends readonly [string, ...string[]]>(
  fieldName: string,
  values: T
) {
  return z.object({
    [fieldName]: z.enum(values).optional(),
    [`${fieldName}_in`]: z.array(z.enum(values)).optional(),
    [`${fieldName}_nin`]: z.array(z.enum(values)).optional(),
  } as Record<string, z.ZodTypeAny>);
}
