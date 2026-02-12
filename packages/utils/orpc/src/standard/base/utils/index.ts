/**
 * Query utilities for Standard Schema
 * Re-exports all query-related utilities
 */

// Pagination
export {
    createPaginationConfigSchema,
    createPaginationSchema,
    createPaginationMetaSchema,
    createPaginatedResponseSchema,
    offsetPagination,
    pagePagination,
    cursorPagination,
    fullPagination,
    type PaginationConfig,
    type PaginationSchemaOutput,
    type PaginationMetaSchemaOutput,
} from "./pagination";

// Sorting
export {
    createSortingConfigSchema,
    createSortingSchema,
    createSimpleSortSchema,
    createMultiSortSchema,
    sortDirection,
    nullsHandling,
    type SortingConfig,
    type SortingSchemaOutput,
} from "./sorting";

// Filtering
export {
    createFilteringConfigSchema,
    createFilteringSchema,
    createSimpleFilterSchema,
    field,
    stringField,
    numericField,
    comparisonField,
    ALL_FILTER_OPERATORS,
    COMPARISON_OPERATORS,
    STRING_OPERATORS,
    NUMERIC_OPERATORS,
    ARRAY_OPERATORS,
    NULL_OPERATORS,
    type FilterOperator,
    type FieldFilterConfig,
    type FilteringConfig,
} from "./filtering";

// Search
export {
    createSearchConfigSchema,
    createSearchSchema,
    createSimpleSearchSchema,
    createAdvancedSearchSchema,
    createFullTextSearchSchema,
    basicSearchSchema,
    type SearchConfig,
    type SearchSchemaOutput,
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
