/**
 * Query utilities for Zod v2
 *
 * Zod-based query utilities that EXTEND from base types.
 * Re-exports all query-related utilities with Zod implementations.
 */

// Pagination - extends from base
export {
    createPaginationConfigSchema,
    createPaginationSchema,
    createPaginationMetaSchema,
    createPaginatedResponseSchema,
    offsetPagination,
    pagePagination,
    cursorPagination,
    fullPagination,
    CONFIG_SYMBOL,
    hasConfig,
    getConfig,
    withConfig,
    type ZodSchemaWithConfig,
    type PaginationConfig,
    type PaginationInputFields,
    type PaginationMetaOutput,
    // Re-export base types for reference
    type BasePaginationConfig,
    type BasePaginationSchemaOutput,
    type BasePaginationMetaSchemaOutput,
} from "./pagination";

// Sorting - extends from base
export {
    createSortingConfigSchema,
    createSortingSchema,
    createSimpleSortSchema,
    createMultiSortSchema,
    sortDirection,
    nullsHandling,
    type SortingConfig,
    type SortingSchemaOutput,
    type SortDirection,
    type NullsHandling,
    // Re-export base types for reference
    type BaseSortingConfig,
    type BaseSortingSchemaOutput,
} from "./sorting";

// Filtering - extends from base
export {
    createFilteringConfigSchema,
    createFilteringSchema,
    createFieldFilterSchema,
    stringField,
    numericField,
    comparisonField,
    booleanField,
    dateField,
    enumField,
    arrayField,
    ALL_FILTER_OPERATORS,
    COMPARISON_OPERATORS,
    STRING_OPERATORS,
    NUMERIC_OPERATORS,
    ARRAY_OPERATORS,
    NULL_OPERATORS,
    type FilterOperator,
    type FieldFilterConfig,
    type FilteringConfig,
    type FilteringSchemaOutput,
    // Re-export base types for reference
    type BaseFilterOperator,
    type BaseFieldFilterConfig,
    type BaseFilteringConfig,
} from "./filtering";

// Search - extends from base
export {
    createSearchConfigSchema,
    createSearchSchema,
    createSimpleSearchSchema,
    createAdvancedSearchSchema,
    type SearchConfig,
    type SearchSchemaOutput,
    // Re-export base types for reference
    type BaseSearchConfig,
    type BaseSearchSchemaOutput,
} from "./search";

// Query Builder
export {
    QueryBuilder,
    createQueryBuilder,
    createBasicListQuery,
    createSearchableListQuery,
    createAdvancedQuery,
    type QueryConfig,
    type ComputeInputSchema,
    type ComputeOutputSchema,
    type QueryBuilderOptions,
} from "./query-builder";
