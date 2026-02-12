import * as z from "zod";
import { CONFIG_SYMBOL, type ZodSchemaWithConfig } from "./sorting";

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
export type FieldFilterConfig = {
  /** Zod schema for the field value */
  schema: z.ZodType;
  /** Allowed operators for this field */
  operators?: readonly FilterOperator[] | FilterOperator[];
  /** Description for documentation */
  description?: string;
}

/**
 * Create a filtering config schema with attached config data
 * This allows the schema to carry the actual config for runtime extraction
 * 
 * @param fields - Available fields for filtering with their schemas
 * @param options - Additional filtering configuration
 * @returns Zod schema with embedded config
 * 
 * @example
 * ```typescript
 * const config = createFilteringConfigSchema({
 *   name: { schema: z.string(), operators: ["eq", "like", "ilike"] },
 *   price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte", "between"] },
 *   categoryId: z.string().uuid(),
 *   inStock: z.boolean()
 * }, {
 *   allowLogicalOperators: true,
 *   allowNested: false,
 *   prefix: "filter"
 * });
 * ```
 */
export function createFilteringConfigSchema<
  TFields extends Record<string, z.ZodType | FieldFilterConfig>
>(
  fields: TFields,
  options?: {
    /** Allow combining filters with AND/OR */
    allowLogicalOperators?: boolean;
    /** Allow nested filters */
    allowNested?: boolean;
    /** Prefix for filter parameter names */
    prefix?: string;
  }
) {
  const config = {
    fields,
    allowLogicalOperators: options?.allowLogicalOperators ?? false,
    allowNested: options?.allowNested ?? false,
    prefix: options?.prefix ?? "",
  };

  // Simple schema without complex typing
  const schema = z.object({
    fields: z.unknown(),
    allowLogicalOperators: z.boolean(),
    allowNested: z.boolean(),
    prefix: z.string(),
  });

  // Attach config to schema for runtime extraction (type-safe)
  const result = Object.assign(schema, {
    [CONFIG_SYMBOL]: config
  }) as ZodSchemaWithConfig<typeof config, typeof schema>;

  return result;
}

/**
 * Creates a type-safe filtering schema from a config schema
 * 
 * @param configSchema - Zod schema with embedded config created by createFilteringConfigSchema
 * @returns Zod schema for filtering input
 * 
 * @example
 * ```typescript
 * const config = createFilteringConfigSchema({
 *   name: { schema: z.string(), operators: ["eq", "like", "ilike"] },
 *   price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte", "between"] },
 *   categoryId: z.string().uuid(),
 *   inStock: z.boolean()
 * });
 * const filterSchema = createFilteringSchema(config);
 * 
 * // Generates schemas for:
 * // name, name_like, name_ilike
 * // price_gt, price_gte, price_lt, price_lte, price_between
 * // categoryId, inStock
 * ```
 */
export function createFilteringSchema<TConfig>(
  configSchema: ZodSchemaWithConfig<TConfig>
) {
  // Extract config from schema
  const config = configSchema[CONFIG_SYMBOL] as {
    fields: Record<string, z.ZodType | FieldFilterConfig>;
    allowLogicalOperators: boolean;
    allowNested: boolean;
    prefix: string;
  };

  const {
    fields,
    allowLogicalOperators,
    allowNested,
    prefix,
  } = config;

  // Start with empty schema
  let schema = z.object({});

  // Generate filter schemas for each field
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    const isConfigObject = typeof fieldConfig === "object" && "schema" in fieldConfig;
    // Cast to z.ZodTypeAny to satisfy TypeScript since we've verified the type above
    const fieldSchema = (isConfigObject ? (fieldConfig).schema : fieldConfig);
    const operators = isConfigObject ? (fieldConfig).operators : ["eq"];
    const description = isConfigObject ? (fieldConfig).description : undefined;

    const prefixedName = prefix ? `${prefix}_${fieldName}` : fieldName;

    // Add base equality filter
    if (!operators || operators.includes("eq")) {
      schema = schema.extend({
        [prefixedName]: fieldSchema
          .optional()
          .describe(description ?? `Filter by ${fieldName}`),
      });
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
            schema = schema.extend({
              [opFieldName]: fieldSchema
                .optional()
                .describe(`Filter ${fieldName} (${op})`),
            });
            break;

          case "in":
          case "nin":
            schema = schema.extend({
              [opFieldName]: z
                .array(fieldSchema)
                .optional()
                .describe(`Filter ${fieldName} (${op})`),
            });
            break;

          case "exists":
            schema = schema.extend({
              [opFieldName]: z
                .boolean()
                .optional()
                .describe(`Check if ${fieldName} exists`),
            });
            break;

          case "between":
            schema = schema.extend({
              [opFieldName]: z
                .tuple([fieldSchema, fieldSchema])
                .optional()
                .describe(`Filter ${fieldName} between two values`),
            });
            break;
        }
      }
    }
  }

  // Add logical operators if allowed
  if (allowLogicalOperators && allowNested) {
    schema = schema.extend({
      _and: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .describe("Combine filters with AND"),
      _or: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .describe("Combine filters with OR"),
    });
  }

  return schema;
}

/**
 * Creates a simple equality-only filter schema
 */
export function createSimpleFilterSchema(
  fields: Record<string, z.ZodType>
) {
  const schema: Record<string, z.ZodType> = {};

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
  } as Record<string, z.ZodType>);
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
    [`${fieldName}_between`]: z.tuple([z.number(), z.number()]).optional(),
    [`${fieldName}_in`]: z.array(z.number()).optional(),
  } as Record<string, z.ZodType>);
}

/**
 * Creates filters for date fields
 */
export function createDateFilterSchema(fieldName: string) {
  return z.object({
    [fieldName]: z.iso.datetime().optional(),
    [`${fieldName}_gt`]: z.iso.datetime().optional().describe("After"),
    [`${fieldName}_gte`]: z.iso.datetime().optional().describe("On or after"),
    [`${fieldName}_lt`]: z.iso.datetime().optional().describe("Before"),
    [`${fieldName}_lte`]: z.iso.datetime().optional().describe("On or before"),
    [`${fieldName}_between`]: z.tuple([z.iso.datetime(), z.iso.datetime()]).optional(),
  } as Record<string, z.ZodType>);
}

/**
 * Creates filters for boolean fields (returns ZodObject)
 */
export function createBooleanFilterSchema(fieldName: string) {
  return z.object({
    [fieldName]: z.boolean().optional(),
  });
}

/**
 * Creates filters for enum fields (returns ZodObject)
 */
 
export function createEnumFilterSchema<T extends readonly [string, ...string[]]>(
  fieldName: string,
  values: T
) {
  return z.object({
    [fieldName]: z.enum(values).optional(),
    [`${fieldName}_in`]: z.array(z.enum(values)).optional(),
    [`${fieldName}_nin`]: z.array(z.enum(values)).optional(),
  } as Record<string, z.ZodType>);
}

/**
 * Creates a boolean filter that can be used with z.object()
 * Returns a Record of Zod schemas for composition
 * 
 * @example
 * ```typescript
 * const filter = createBooleanFilter();
 * const schema = z.object(filter);  // { value: z.boolean().optional() }
 * ```
 */
export function createBooleanFilter() {
  return {
    value: z.boolean().optional(),
  } as const;
}

/**
 * Creates an enum filter that can be used with z.object()
 * Returns a Record of Zod schemas for composition
 * 
 * @param values - Array of allowed enum values
 * @param operators - Optional array of operators to support (default: ['eq'])
 * 
 * @example
 * ```typescript
 * const filter = createEnumFilter(['active', 'inactive', 'pending']);
 * const schema = z.object(filter);
 * // { value: z.enum(['active', 'inactive', 'pending']).optional() }
 * 
 * // With operators
 * const filterWithOps = createEnumFilter(['active', 'inactive'], ['in', 'nin']);
 * const schema = z.object(filterWithOps);
 * // { value: z.enum(...).optional(), value_in: z.array(...).optional(), value_nin: z.array(...).optional() }
 * ```
 */
 
export function createEnumFilter<T extends readonly [string, ...string[]]>(
  values: T,
  operators: readonly FilterOperator[] = ['eq'] as const
) {
  const filter: Record<string, z.ZodType> = {};
  
  // Add base equality filter
  if (operators.includes('eq')) {
    filter.value = z.enum(values).optional();
  }
  
  // Add operator-specific filters
  if (operators.includes('in')) {
    filter.value_in = z.array(z.enum(values)).optional();
  }
  
  if (operators.includes('nin')) {
    filter.value_nin = z.array(z.enum(values)).optional();
  }
  
  return filter;
}

/**
 * Creates a string filter that can be used with z.object()
 * Returns a Record of Zod schemas for composition
 * 
 * @param operators - Array of operators to support
 * 
 * @example
 * ```typescript
 * const filter = createStringFilter(['eq', 'like', 'ilike']);
 * const schema = z.object(filter);
 * // { value: z.string().optional(), value_like: z.string().optional(), value_ilike: z.string().optional() }
 * ```
 */
export function createStringFilter(
  operators: readonly FilterOperator[] = ['eq'] as const
) {
  const filter: Record<string, z.ZodType> = {};
  
  // Add base equality filter
  if (operators.includes('eq')) {
    filter.value = z.string().optional();
  }
  
  // Add operator-specific filters
  if (operators.includes('ne')) {
    filter.value_ne = z.string().optional();
  }
  if (operators.includes('like')) {
    filter.value_like = z.string().optional();
  }
  if (operators.includes('ilike')) {
    filter.value_ilike = z.string().optional();
  }
  if (operators.includes('startsWith')) {
    filter.value_startsWith = z.string().optional();
  }
  if (operators.includes('endsWith')) {
    filter.value_endsWith = z.string().optional();
  }
  if (operators.includes('contains')) {
    filter.value_contains = z.string().optional();
  }
  if (operators.includes('regex')) {
    filter.value_regex = z.string().optional();
  }
  if (operators.includes('in')) {
    filter.value_in = z.array(z.string()).optional();
  }
  if (operators.includes('nin')) {
    filter.value_nin = z.array(z.string()).optional();
  }
  if (operators.includes('exists')) {
    filter.value_exists = z.boolean().optional();
  }
  
  return filter;
}

/**
 * Creates a number filter that can be used with z.object()
 * Returns a Record of Zod schemas for composition
 * 
 * @param operators - Array of operators to support
 * 
 * @example
 * ```typescript
 * const filter = createNumberFilter(['eq', 'gt', 'lt', 'between']);
 * const schema = z.object(filter);
 * ```
 */
export function createNumberFilter(
  operators: readonly FilterOperator[] = ['eq'] as const
) {
  const filter: Record<string, z.ZodType> = {};
  
  // Add base equality filter
  if (operators.includes('eq')) {
    filter.value = z.number().optional();
  }
  
  // Add comparison operators
  if (operators.includes('ne')) {
    filter.value_ne = z.number().optional();
  }
  if (operators.includes('gt')) {
    filter.value_gt = z.number().optional();
  }
  if (operators.includes('gte')) {
    filter.value_gte = z.number().optional();
  }
  if (operators.includes('lt')) {
    filter.value_lt = z.number().optional();
  }
  if (operators.includes('lte')) {
    filter.value_lte = z.number().optional();
  }
  if (operators.includes('in')) {
    filter.value_in = z.array(z.number()).optional();
  }
  if (operators.includes('nin')) {
    filter.value_nin = z.array(z.number()).optional();
  }
  if (operators.includes('between')) {
    filter.value_between = z.tuple([z.number(), z.number()]).optional();
  }
  if (operators.includes('exists')) {
    filter.value_exists = z.boolean().optional();
  }
  
  return filter;
}

/**
 * Creates a date filter that can be used with z.object()
 * Returns a Record of Zod schemas for composition
 * 
 * @param operators - Array of operators to support
 * 
 * @example
 * ```typescript
 * const filter = createDateFilter(['eq', 'gt', 'lt', 'between']);
 * const schema = z.object(filter);
 * ```
 */
export function createDateFilter(
  operators: readonly FilterOperator[] = ['eq'] as const
) {
  const filter: Record<string, z.ZodType> = {};
  
  // Add base equality filter
  if (operators.includes('eq')) {
    filter.value = z.iso.datetime().optional();
  }
  
  // Add comparison operators
  if (operators.includes('ne')) {
    filter.value_ne = z.iso.datetime().optional();
  }
  if (operators.includes('gt')) {
    filter.value_gt = z.iso.datetime().optional();
  }
  if (operators.includes('gte')) {
    filter.value_gte = z.iso.datetime().optional();
  }
  if (operators.includes('lt')) {
    filter.value_lt = z.iso.datetime().optional();
  }
  if (operators.includes('lte')) {
    filter.value_lte = z.iso.datetime().optional();
  }
  if (operators.includes('in')) {
    filter.value_in = z.array(z.iso.datetime()).optional();
  }
  if (operators.includes('nin')) {
    filter.value_nin = z.array(z.iso.datetime()).optional();
  }
  if (operators.includes('between')) {
    filter.value_between = z.tuple([z.iso.datetime(), z.iso.datetime()]).optional();
  }
  if (operators.includes('exists')) {
    filter.value_exists = z.boolean().optional();
  }
  
  return filter;
}
