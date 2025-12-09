import { z } from "zod/v4";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
  type PaginationConfig,
} from "./pagination";
import {
  createSortingSchema,
  type SortingConfig,
} from "./sorting";
import {
  createFilteringSchema,
  type FilteringConfig,
} from "./filtering";
import {
  createSearchSchema,
  type SearchConfig,
} from "./search";

/**
 * Complete query parameters configuration
 */
export interface QueryConfig<TFilterFields extends Record<string, any> = Record<string, any>> {
  /** Pagination configuration */
  pagination?: PaginationConfig;
  /** Sorting configuration */
  sorting?: SortingConfig<readonly string[]>;
  /** Filtering configuration */
  filtering?: FilteringConfig<TFilterFields>;
  /** Search configuration */
  search?: SearchConfig;
  /** Additional custom fields */
  customFields?: Record<string, z.ZodTypeAny>;
}

/**
 * Query builder for creating comprehensive type-safe query parameter schemas
 * 
 * @example
 * ```typescript
 * const queryBuilder = new QueryBuilder({
 *   pagination: { defaultLimit: 20, maxLimit: 100 },
 *   sorting: {
 *     fields: ["createdAt", "name", "price"],
 *     defaultField: "createdAt",
 *     defaultDirection: "desc"
 *   },
 *   filtering: {
 *     fields: {
 *       name: { schema: z.string(), operators: ["eq", "like", "ilike"] },
 *       price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte"] },
 *       inStock: z.boolean()
 *     }
 *   },
 *   search: {
 *     searchableFields: ["name", "description"],
 *     minQueryLength: 2
 *   }
 * });
 * 
 * const inputSchema = queryBuilder.buildInputSchema();
 * const outputSchema = queryBuilder.buildOutputSchema(itemSchema);
 * ```
 */
export class QueryBuilder<TFilterFields extends Record<string, any> = Record<string, any>> {
  constructor(private config: QueryConfig<TFilterFields> = {}) {}

  /**
   * Build the complete input schema with all query parameters
   */
  buildInputSchema(): z.ZodObject<any> {
    const schemas: z.ZodObject<any>[] = [];

    // Add pagination (disabled if explicitly set to undefined)
    if (this.config.pagination !== undefined) {
      const paginationSchema = createPaginationSchema(
        this.config.pagination || {}
      );
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
      schemas.push(z.object(this.config.customFields as z.ZodRawShape));
    }

    // Merge all schemas
    if (schemas.length === 0) {
      return z.object({});
    }

    let result: z.ZodObject<any> = schemas[0]!;
    for (let i = 1; i < schemas.length; i++) {
      result = result.merge(schemas[i]!);
    }

    return result;
  }

  /**
   * Build the output schema with pagination metadata
   */
  buildOutputSchema<T extends z.ZodTypeAny>(dataSchema: T): z.ZodObject<any> {
    return createPaginatedResponseSchema(
      dataSchema,
      this.config.pagination || {}
    );
  }

  /**
   * Build just the pagination input schema
   */
  buildPaginationSchema() {
    return createPaginationSchema(this.config.pagination || {});
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
  withConfig(updates: Partial<QueryConfig<TFilterFields>>): QueryBuilder<TFilterFields> {
    return new QueryBuilder({
      ...this.config,
      ...updates,
    });
  }

  /**
   * Add pagination to the query
   */
  withPagination(config: PaginationConfig): QueryBuilder<TFilterFields> {
    return new QueryBuilder({
      ...this.config,
      pagination: config,
    });
  }

  /**
   * Add sorting to the query
   */
  withSorting(config: SortingConfig<readonly string[]>): QueryBuilder<TFilterFields> {
    return new QueryBuilder({
      ...this.config,
      sorting: config,
    });
  }

  /**
   * Add filtering to the query
   */
  withFiltering<TNewFields extends Record<string, any>>(
    config: FilteringConfig<TNewFields>
  ): QueryBuilder<TNewFields> {
    return new QueryBuilder({
      ...this.config,
      filtering: config,
    });
  }

  /**
   * Add search to the query
   */
  withSearch(config: SearchConfig): QueryBuilder<TFilterFields> {
    return new QueryBuilder({
      ...this.config,
      search: config,
    });
  }

  /**
   * Add custom fields to the query
   */
  withCustomFields(fields: Record<string, z.ZodTypeAny>): QueryBuilder<TFilterFields> {
    return new QueryBuilder({
      ...this.config,
      customFields: {
        ...this.config.customFields,
        ...fields,
      },
    });
  }
}

/**
 * Helper function to create a query builder
 */
export function createQueryBuilder<TFilterFields extends Record<string, any> = Record<string, any>>(
  config: QueryConfig<TFilterFields> = {}
): QueryBuilder<TFilterFields> {
  return new QueryBuilder(config);
}

/**
 * Helper to create a simple list query with pagination and sorting
 */
export function createListQuery(
  sortableFields: readonly string[],
  paginationConfig?: PaginationConfig
) {
  return new QueryBuilder({
    pagination: paginationConfig || { defaultLimit: 10, maxLimit: 100 },
    sorting: {
      fields: sortableFields,
      defaultDirection: "asc",
    },
  });
}

/**
 * Helper to create a search query with pagination
 */
export function createSearchQuery(
  searchableFields: readonly string[],
  paginationConfig?: PaginationConfig
) {
  return new QueryBuilder({
    pagination: paginationConfig || { defaultLimit: 20, maxLimit: 100 },
    search: {
      searchableFields,
      minQueryLength: 1,
      allowFieldSelection: true,
    },
  });
}

/**
 * Helper to create an advanced query with all features
 */
export function createAdvancedQuery<TFilterFields extends Record<string, any>>(config: {
  sortableFields: readonly string[];
  filterableFields: TFilterFields;
  searchableFields?: readonly string[];
  pagination?: PaginationConfig;
}) {
  return new QueryBuilder({
    pagination: config.pagination || { defaultLimit: 20, maxLimit: 100 },
    sorting: {
      fields: config.sortableFields,
      defaultDirection: "asc",
    },
    filtering: {
      fields: config.filterableFields,
    },
    search: config.searchableFields
      ? {
          searchableFields: config.searchableFields,
          minQueryLength: 1,
          allowFieldSelection: true,
        }
      : undefined,
  });
}
