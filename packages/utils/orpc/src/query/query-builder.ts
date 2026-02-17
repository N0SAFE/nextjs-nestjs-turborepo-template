import * as z from "zod";
import {
  createPaginationSchema,
  createPaginationConfigSchema,
} from "./pagination";
import {
  createSortingSchema,
  createSortingConfigSchema,
  type ZodSchemaWithConfig,
  CONFIG_SYMBOL,
} from "./sorting";
import {
  createFilteringSchema,
  createFilteringConfigSchema,
  type FieldFilterConfig,
} from "./filtering";
import {
  createSearchSchema,
  createSearchConfigSchema,
} from "./search";

// Re-export config schema creators for convenience
export {
  createPaginationConfigSchema,
  createSortingConfigSchema,
  createFilteringConfigSchema,
  createSearchConfigSchema,
  type ZodSchemaWithConfig,
  CONFIG_SYMBOL,
};

/**
 * Type constraint for filter fields - re-exports FieldFilterConfig from filtering.ts
 * Can be either:
 * - A Zod schema directly
 * - An object with schema and operators configuration
 */
export type FilterFieldConfig = z.ZodType | FieldFilterConfig;

/**
 * Extract schema type from FilterFieldConfig
 */
export type ExtractSchemaFromFilterField<T> = 
  T extends { schema: infer S } 
    ? S extends z.ZodType ? S : never
    : T extends z.ZodType ? T : never;

/**
 * Meta schema shape based on configuration
 * Uses conditional types to compute exact meta structure
 */
export type MetaSchema = {
  total: number;
  limit: number;
  hasMore: boolean;
  offset?: number;
  nextCursor?: string | null;
  prevCursor?: string | null;
  page?: number;
  totalPages?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  appliedFilters?: Record<string, unknown>;
  searchQuery?: string;
}

/**
 * Helper to extract pagination config from ZodSchemaWithConfig
 */
type ExtractPaginationConfig<T> = T extends ZodSchemaWithConfig<infer Config> ? Config : never;

/**
 * Compute meta schema type based on QueryConfig
 */
export type ComputeMetaSchema<TConfig extends QueryConfig> = 
  TConfig["pagination"] extends undefined
    ? { total?: number }
    : ExtractPaginationConfig<TConfig["pagination"]> extends infer PaginationConfig
      ? {
          total: number;
          limit: number;
          hasMore: boolean;
        } & (PaginationConfig extends { includeOffset: true } ? { offset: number } : object)
          & (PaginationConfig extends { includeCursor: true }
              ? { nextCursor: string | null; prevCursor: string | null }
              : object)
          & (PaginationConfig extends { includePage: true } ? { page: number; totalPages: number } : object)
          & (TConfig["sorting"] extends ZodSchemaWithConfig<unknown> ? { sortBy?: string; sortDirection?: "asc" | "desc" } : object)
          & (TConfig["filtering"] extends ZodSchemaWithConfig<unknown> ? { appliedFilters?: Record<string, unknown> } : object)
          & (TConfig["search"] extends ZodSchemaWithConfig<unknown> ? { searchQuery?: string } : object)
      : never;

/**
 * Complete query parameters configuration - accepts only Zod schemas with embedded config
 * All configuration is now embedded in Zod schemas using CONFIG_SYMBOL
 */
export type QueryConfig = {
  /** Pagination configuration - Zod schema with embedded config */
  pagination?: ZodSchemaWithConfig<unknown>;
  /** Sorting configuration - Zod schema with embedded config */
  sorting?: ZodSchemaWithConfig<unknown>;
  /** Filtering configuration - Zod schema with embedded config */
  filtering?: ZodSchemaWithConfig<unknown>;
  /** Search configuration - Zod schema with embedded config */
  search?: ZodSchemaWithConfig<unknown>;
  /** Additional custom fields */
  customFields?: Record<string, z.ZodType>;
}

/**
 * Helper to create a properly typed QueryConfig that preserves specific config types
 * Use this instead of `as const` to ensure type inference works correctly
 */
export function defineQueryConfig<
  TPagination extends ZodSchemaWithConfig<unknown> | undefined,
  TSorting extends ZodSchemaWithConfig<unknown> | undefined,
  TFiltering extends ZodSchemaWithConfig<unknown> | undefined,
  TSearch extends ZodSchemaWithConfig<unknown> | undefined
>(config: {
  pagination?: TPagination;
  sorting?: TSorting;
  filtering?: TFiltering;
  search?: TSearch;
  customFields?: Record<string, z.ZodType>;
}): {
  pagination: TPagination;
  sorting: TSorting;
  filtering: TFiltering;
  search: TSearch;
  customFields?: Record<string, z.ZodType>;
} {
  return config as {
    pagination: TPagination;
    sorting: TSorting;
    filtering: TFiltering;
    search: TSearch;
    customFields?: Record<string, z.ZodType>;
  };
}

/**
 * Type-level helper to infer the shape of pagination schema
 */
type InferPaginationShape<T> = T extends ZodSchemaWithConfig<infer Config>
  ? Config extends { includeOffset: true; includePage: true; includeCursor: true }
    ? { limit: number; offset: number; page: number; cursor?: string; cursorDirection?: "forward" | "backward" }
    : Config extends { includeOffset: true; includePage: true }
    ? { limit: number; offset: number; page: number }
    : Config extends { includeOffset: true; includeCursor: true }
    ? { limit: number; offset: number; cursor?: string; cursorDirection?: "forward" | "backward" }
    : Config extends { includePage: true; includeCursor: true }
    ? { limit: number; page: number; cursor?: string; cursorDirection?: "forward" | "backward" }
    : Config extends { includeOffset: true }
    ? { limit: number; offset: number }
    : Config extends { includePage: true }
    ? { limit: number; page: number }
    : Config extends { includeCursor: true }
    ? { limit: number; cursor?: string; cursorDirection?: "forward" | "backward" }
    : { limit: number }
  : object;

/**
 * Type-level helper to infer the shape of sorting schema
 */
type InferSortingShape<T> = T extends ZodSchemaWithConfig<infer Config>
  ? Config extends { allowMultiple: true; allowNullsHandling: true }
    ? { sortBy?: { field: string; direction: "asc" | "desc" }[]; nullsHandling?: "first" | "last" }
    : Config extends { allowMultiple: true }
    ? { sortBy?: { field: string; direction: "asc" | "desc" }[] }
    : Config extends { allowNullsHandling: true }
    ? { sortBy?: string; sortDirection?: "asc" | "desc"; nullsHandling?: "first" | "last" }
    : { sortBy?: string; sortDirection?: "asc" | "desc" }
  : object;

/**
 * Convert union of object types to intersection (merge all properties)
 * Example: { a: string } | { b: number } => { a: string } & { b: number }
 */
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Extract Zod schema type from field config or raw Zod type
 */
type ExtractFieldType<T> = T extends { schema: infer S }
  ? S extends z.ZodType
    ? z.infer<S>
    : unknown
  : T extends z.ZodType
  ? z.infer<T>
  : unknown;

/**
 * Extract operators from field config (defaults to "eq" if not specified)
 */
type ExtractOperators<T> = T extends { operators: readonly (infer Op)[] }
  ? Op
  : T extends { operators: (infer Op)[] }
  ? Op
  : "eq";

/**
 * Generate field type for a single operator
 * Maps operator name to appropriate TypeScript type signature
 */
type GenerateOperatorField<K extends string, TFieldType, TOp> =
  TOp extends "eq" 
    ? Partial<Record<K, TFieldType>>
  : TOp extends "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "regex" | "startsWith" | "endsWith" | "contains"
    ? Partial<Record<`${K}_${TOp}`, TFieldType>>
  : TOp extends "in" | "nin"
    ? Partial<Record<`${K}_${TOp}`, TFieldType[]>>
  : TOp extends "exists"
    ? Partial<Record<`${K}_exists`, boolean>>
  : TOp extends "between"
    ? Partial<Record<`${K}_between`, { from: TFieldType; to: TFieldType }>>
  : object;

/**
 * Generate all operator fields for a single field (base + all operator variants)
 * Uses distributive conditional types to generate union, then merges with UnionToIntersection
 */
type GenerateAllOperatorFields<K extends string, TField> = 
  UnionToIntersection<
    GenerateOperatorField<K, ExtractFieldType<TField>, ExtractOperators<TField>>
  >;

/**
 * Type-level helper to infer the complete shape of filtering schema
 * Generates base fields + all operator-suffixed variants (name_like, email_ilike, createdAt_gt, etc.)
 */
type InferFilteringShape<T> = T extends ZodSchemaWithConfig<infer Config>
  ? Config extends { fields: infer Fields }
    ? Fields extends Record<string, unknown>
      ? UnionToIntersection<
          { [K in keyof Fields]: GenerateAllOperatorFields<K & string, Fields[K]> }[keyof Fields]
        >
      : object
    : object
  : object;

/**
 * Type-level helper to infer the shape of search schema
 * Infers query (always present) and fields (when allowFieldSelection is true)
 */
type InferSearchShape<T> = T extends ZodSchemaWithConfig<infer Config>
  ? Config extends { allowFieldSelection: true; searchableFields: readonly string[] }
    ? { query: string; fields?: string[]; mode?: "contains" | "startsWith" | "endsWith" | "exact"; caseSensitive?: boolean }
      & (Config extends { allowRegex: true } ? { useRegex?: boolean } : object)
    : { query: string; mode?: "contains" | "startsWith" | "endsWith" | "exact"; caseSensitive?: boolean }
      & (Config extends { allowRegex: true } ? { useRegex?: boolean } : object)
  : object;
/**
 * Compute the complete input schema shape from QueryConfig at type level
 * This provides proper type inference for ORPC contracts
 */
export type ComputeInputSchema<TConfig extends QueryConfig> = 
  InferPaginationShape<TConfig["pagination"]> &
  InferSortingShape<TConfig["sorting"]> &
  InferFilteringShape<TConfig["filtering"]> &
  InferSearchShape<TConfig["search"]> &
  (TConfig["customFields"] extends Record<string, z.ZodType>
    ? { [K in keyof TConfig["customFields"]]: z.infer<TConfig["customFields"][K]> }
    : object);

/**
 * Compute the complete output schema shape from QueryConfig at type level
 * Output is always { data: TData[], meta: MetaSchema }
 */
export type ComputeOutputSchema<TConfig extends QueryConfig, TData> = {
  data: TData[];
  meta: ComputeMetaSchema<TConfig>;
};


/** * Query builder for creating comprehensive type-safe query parameter schemas
 * 
 * @example
 * ```typescript
 * // Create config schemas using factories
 * const paginationConfig = createPaginationConfigSchema({ 
 *   defaultLimit: 20, maxLimit: 100 
 * });
 * const sortingConfig = createSortingConfigSchema(
 *   ["createdAt", "name", "price"],
 *   { defaultField: "createdAt", defaultDirection: "desc" }
 * );
 * const filteringConfig = createFilteringConfigSchema({
 *   name: { schema: z.string(), operators: ["eq", "like", "ilike"] },
 *   price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte"] },
 *   inStock: z.boolean()
 * });
 * const searchConfig = createSearchConfigSchema(
 *   ["name", "description"],
 *   { minQueryLength: 2 }
 * );
 * 
 * // Build query with Zod schemas
 * const queryBuilder = new QueryBuilder({
 *   pagination: paginationConfig,
 *   sorting: sortingConfig,
 *   filtering: filteringConfig,
 *   search: searchConfig
 * });
 * 
 * const inputSchema = queryBuilder.buildInputSchema();
 * const outputSchema = queryBuilder.buildOutputSchema(itemSchema);
 * ```
 */
export class QueryBuilder<TConfig extends QueryConfig = QueryConfig> {
  constructor(private config: TConfig = {} as TConfig) {}



  /**
   * Build the complete input schema with all query parameters
   * Returns a properly typed schema that preserves type information for ORPC inference
   * 
   * The returned schema shape is computed at the type level using ComputeInputSchema<TConfig>
   * and cast at runtime to preserve proper types through ORPC contracts.
   */
  buildInputSchema(): z.ZodType<ComputeInputSchema<TConfig>, ComputeInputSchema<TConfig>> {
    const schemas: z.ZodType[] = [];

    // Add pagination (disabled if explicitly set to undefined)
    if (this.config.pagination !== undefined) {
      const paginationSchema = createPaginationSchema(this.config.pagination);
      schemas.push(paginationSchema);
    }

    // Add sorting
    if (this.config.sorting) {
      const sortingSchema = createSortingSchema(this.config.sorting);
      schemas.push(sortingSchema);
    }

    // Add filtering
    if (this.config.filtering) {
      const filteringSchema = createFilteringSchema(this.config.filtering);
      schemas.push(filteringSchema);
    }

    // Add search
    if (this.config.search) {
      const searchSchema = createSearchSchema(this.config.search);
      schemas.push(searchSchema);
    }

    // Add custom fields
    if (this.config.customFields) {
      schemas.push(z.object(this.config.customFields));
    }

    // Merge all schemas
    if (schemas.length === 0) {
      return z.object({}) as unknown as z.ZodType<ComputeInputSchema<TConfig>, ComputeInputSchema<TConfig>>;
    }

    const [firstSchema, ...restSchemas] = schemas;
    if (!firstSchema) {
      return z.object({}) as unknown as z.ZodType<ComputeInputSchema<TConfig>, ComputeInputSchema<TConfig>>;
    }
    
    // Merge schemas at runtime, but preserve the type-level computed shape
    // This allows ORPC to properly infer the input type from the contract
    // Cast to ZodObject for merging since our schemas are all object-like
    const firstAsObject = firstSchema as unknown as z.ZodObject;
    const mergedSchema = restSchemas.reduce<z.ZodObject>(
      (acc, schema) => acc.extend((schema as unknown as z.ZodObject).shape), 
      firstAsObject
    );
    return mergedSchema as unknown as z.ZodType<ComputeInputSchema<TConfig>, ComputeInputSchema<TConfig>>;
  }

  /**
   * Build the output schema with dynamic metadata based on configuration
   * Uses type casting to preserve proper meta schema types through ORPC contracts
   */
  buildOutputSchema<TData extends z.ZodType>(dataSchema: TData) {
    const metaSchema = this.buildMetaSchema();
    
    // Cast the output schema to preserve the exact shape through ORPC
    // Using ReturnType to capture the exact meta schema type from buildMetaSchema
    type MetaSchemaType = ReturnType<QueryBuilder<TConfig>['buildMetaSchema']>;
    type OutputSchema = z.ZodObject<{
      data: z.ZodArray<TData>;
      meta: MetaSchemaType;
    }>;
    
    return z.object({
      data: z.array(dataSchema),
      meta: metaSchema,
    }) as unknown as OutputSchema;
  }

  /**
   * Build the meta schema dynamically based on what features are configured
   * Uses generics and type assertions to preserve exact type structure
   */
  buildMetaSchema() {
    // Extract config from Zod schemas using CONFIG_SYMBOL
    const paginationConfig = this.config.pagination?.[CONFIG_SYMBOL] as {
      includeOffset?: boolean;
      includeCursor?: boolean;
      includePage?: boolean;
    } | undefined;
    
    const {
      includeOffset = true,
      includeCursor = false,
      includePage = false,
    } = paginationConfig ?? {};

    // Build the base shape that TypeScript can properly infer
    const baseShape = this.config.pagination !== undefined
      ? {
          total: z.number().int().min(0).describe("Total number of items"),
          limit: z.number().int().positive().describe("Items per page"),
          hasMore: z.boolean().describe("Whether there are more items"),
          // Always include these as optional since TypeScript can't infer conditional spreads
          offset: includeOffset 
            ? z.number().int().min(0).describe("Current offset")
            : z.number().int().min(0).describe("Current offset").optional(),
          page: includePage
            ? z.number().int().min(1).describe("Current page number")
            : z.number().int().min(1).describe("Current page number").optional(),
          totalPages: includePage
            ? z.number().int().min(0).describe("Total number of pages")
            : z.number().int().min(0).describe("Total number of pages").optional(),
          nextCursor: includeCursor
            ? z.string().nullable().describe("Cursor for next page")
            : z.string().nullable().describe("Cursor for next page").optional(),
          prevCursor: includeCursor
            ? z.string().nullable().describe("Cursor for previous page")
            : z.string().nullable().describe("Cursor for previous page").optional(),
        }
      : {
          total: z.number().int().min(0).optional().describe("Total number of items"),
        };

    const sortingShape = this.config.sorting
      ? {
          sortBy: z.string().optional().describe("Field used for sorting"),
          sortDirection: z.enum(["asc", "desc"]).optional().describe("Sort direction applied"),
        }
      : {};

    const filteringShape = this.config.filtering
      ? {
          appliedFilters: z.record(z.string(), z.unknown()).optional().describe("Filters applied to the query"),
          filterCount: z.number().int().min(0).optional().describe("Number of filters applied"),
        }
      : {};

    const searchShape = this.config.search
      ? {
          searchQuery: z.string().optional().describe("Search query applied"),
          searchFields: z.array(z.string()).optional().describe("Fields searched"),
        }
      : {};

    // Merge all shapes together
    const schema = z.object({
      ...baseShape,
      ...sortingShape,
      ...filteringShape,
      ...searchShape,
    });
    
    // Type cast based on config generics to preserve exact type through ORPC
    // This uses the TConfig generic to compute the exact meta type
    // We wrap in array to prevent distribution and check if property is undefined/missing
    // [TConfig['key']] extends [undefined] is true only when the property is exactly undefined
    type HasSorting = [TConfig['sorting']] extends [undefined] ? false : true;
    type HasFiltering = [TConfig['filtering']] extends [undefined] ? false : true;
    type HasSearch = [TConfig['search']] extends [undefined] ? false : true;
    
    type MetaShape = TConfig['pagination'] extends undefined
      ? z.ZodObject<{ total: z.ZodOptional<z.ZodNumber> }>
      : z.ZodObject<{
          total: z.ZodNumber;
          limit: z.ZodNumber;
          hasMore: z.ZodBoolean;
          offset: TConfig['pagination'] extends { includeOffset: false } ? z.ZodOptional<z.ZodNumber> : z.ZodNumber;
          page: TConfig['pagination'] extends { includePage: false } ? z.ZodOptional<z.ZodNumber> : (TConfig['pagination'] extends { includePage: true } ? z.ZodNumber : z.ZodOptional<z.ZodNumber>);
          totalPages: TConfig['pagination'] extends { includePage: false } ? z.ZodOptional<z.ZodNumber> : (TConfig['pagination'] extends { includePage: true } ? z.ZodNumber : z.ZodOptional<z.ZodNumber>);
          nextCursor: TConfig['pagination'] extends { includeCursor: true } ? z.ZodNullable<z.ZodString> : z.ZodOptional<z.ZodNullable<z.ZodString>>;
          prevCursor: TConfig['pagination'] extends { includeCursor: true } ? z.ZodNullable<z.ZodString> : z.ZodOptional<z.ZodNullable<z.ZodString>>;
        } & (HasSorting extends true ? {
          sortBy: z.ZodOptional<z.ZodString>;
          sortDirection: z.ZodOptional<z.ZodEnum<Readonly<Record<string, "asc" |"desc">>>>;
        } : Record<never, z.ZodType>) & (HasFiltering extends true ? {
          appliedFilters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
          filterCount: z.ZodOptional<z.ZodNumber>;
        } : Record<never, z.ZodType>) & (HasSearch extends true ? {
          searchQuery: z.ZodOptional<z.ZodString>;
          searchFields: z.ZodOptional<z.ZodArray<z.ZodString>>;
        } : Record<never, z.ZodType>)>;
    
    return schema as unknown as MetaShape;
  }

  /**
   * Build just the pagination input schema
   */
  buildPaginationSchema() {
    if (!this.config.pagination) {
      throw new Error("Pagination configuration not provided");
    }
    return createPaginationSchema(this.config.pagination);
  }

  /**
   * Build just the sorting input schema
   */
  buildSortingSchema() {
    if (!this.config.sorting) {
      throw new Error("Sorting configuration not provided");
    }
    return createSortingSchema(this.config.sorting);
  }

  /**
   * Build just the filtering input schema
   */
  buildFilteringSchema() {
    if (!this.config.filtering) {
      throw new Error("Filtering configuration not provided");
    }
    return createFilteringSchema(this.config.filtering);
  }

  /**
   * Build just the search input schema
   */
  buildSearchSchema() {
    if (!this.config.search) {
      throw new Error("Search configuration not provided");
    }
    return createSearchSchema(this.config.search);
  }

  /**
   * Update configuration and return new builder
   */
  withConfig<TUpdates extends Partial<QueryConfig>>(
    updates: TUpdates
  ): QueryBuilder<TConfig & TUpdates> {
    return new QueryBuilder({
      ...this.config,
      ...updates,
    });
  }

  /**
   * Add pagination to the query
   */
  withPagination<TSchema extends ZodSchemaWithConfig<unknown>>(
    config: TSchema
  ): QueryBuilder<TConfig & { pagination: TSchema }> {
    return new QueryBuilder({
      ...this.config,
      pagination: config,
    } as TConfig & { pagination: TSchema });
  }

  /**
   * Add sorting to the query
   */
  withSorting<TSchema extends ZodSchemaWithConfig<unknown>>(
    config: TSchema
  ): QueryBuilder<TConfig & { sorting: TSchema }> {
    return new QueryBuilder({
      ...this.config,
      sorting: config,
    } as TConfig & { sorting: TSchema });
  }

  /**
   * Add filtering to the query
   */
  withFiltering<TSchema extends ZodSchemaWithConfig<unknown>>(
    config: TSchema
  ): QueryBuilder<TConfig & { filtering: TSchema }> {
    return new QueryBuilder({
      ...this.config,
      filtering: config,
    } as TConfig & { filtering: TSchema });
  }

  /**
   * Add search to the query
   */
  withSearch<TSchema extends ZodSchemaWithConfig<unknown>>(
    config: TSchema
  ): QueryBuilder<TConfig & { search: TSchema }> {
    return new QueryBuilder({
      ...this.config,
      search: config,
    } as TConfig & { search: TSchema });
  }

  /**
   * Add custom fields to the query
   */
  withCustomFields<TFields extends Record<string, z.ZodType>>(
    fields: TFields
  ): QueryBuilder<TConfig & { customFields: TFields }> {
    return new QueryBuilder({
      ...this.config,
      customFields: {
        ...this.config.customFields,
        ...fields,
      },
    } as TConfig & { customFields: TFields });
  }
}

/**
 * Helper function to create a query builder
 * Uses generics to preserve exact config type for proper type inference
 */
export function createQueryBuilder<TConfig extends QueryConfig = QueryConfig>(
  config: TConfig = {} as TConfig
): QueryBuilder<TConfig> {
  return new QueryBuilder(config);
}

/**
 * Helper to create a simple list query with pagination and sorting
 */
export function createListQuery(
  sortableFields: readonly string[],
  paginationOptions?: { defaultLimit?: number; maxLimit?: number }
) {
  const pagination = createPaginationConfigSchema(paginationOptions ?? { defaultLimit: 10, maxLimit: 100 });
  const sorting = createSortingConfigSchema(sortableFields, { defaultDirection: "asc" });
  
  return new QueryBuilder({
    pagination,
    sorting,
  });
}

/**
 * Helper to create a search query with pagination
 */
export function createSearchQuery(
  searchableFields: readonly string[],
  paginationOptions?: { defaultLimit?: number; maxLimit?: number }
) {
  const pagination = createPaginationConfigSchema(paginationOptions ?? { defaultLimit: 20, maxLimit: 100 });
  const search = createSearchConfigSchema(searchableFields, { minQueryLength: 1, allowFieldSelection: true });
  
  return new QueryBuilder({
    pagination,
    search,
  });
}

/**
 * Helper to create an advanced query with all features
 */
export function createAdvancedQuery(config: {
  sortableFields: readonly string[];
  filterableFields: Record<string, FilterFieldConfig>;
  searchableFields?: readonly string[];
  pagination?: { defaultLimit?: number; maxLimit?: number };
}) {
  const pagination = createPaginationConfigSchema(config.pagination ?? { defaultLimit: 20, maxLimit: 100 });
  const sorting = createSortingConfigSchema(config.sortableFields, { defaultDirection: "asc" });
  const filtering = createFilteringConfigSchema(config.filterableFields);
  const search = config.searchableFields
    ? createSearchConfigSchema(config.searchableFields, { minQueryLength: 1, allowFieldSelection: true })
    : undefined;
  
  return new QueryBuilder({
    pagination,
    sorting,
    filtering,
    search,
  });
}
