/**
 * Query Builder for Standard Schema
 * Combines pagination, sorting, filtering, and search into unified query schemas
 */

import type { AnySchema, ObjectSchema, SchemaWithConfig } from "../types";
import { CONFIG_SYMBOL, getSchemaShape } from "../types";
import { s } from "../schema";

import type { PaginationConfig } from "./pagination";
import { createPaginationConfigSchema, createPaginationSchema, createPaginationMetaSchema } from "./pagination";

import type { SortingConfig } from "./sorting";
import { createSortingConfigSchema, createSortingSchema } from "./sorting";

import type { FilteringConfig, FieldFilterConfig } from "./filtering";
import { createFilteringConfigSchema, createFilteringSchema } from "./filtering";

import type { SearchConfig } from "./search";
import { createSearchConfigSchema, createSearchSchema } from "./search";

/**
 * Full query configuration combining all query features
 */
export type QueryConfig<
    TPagination extends PaginationConfig | undefined = undefined,
    TSorting extends SortingConfig | undefined = undefined,
    TFiltering extends FilteringConfig | undefined = undefined,
    TSearch extends SearchConfig | undefined = undefined,
> = {
    pagination: TPagination;
    sorting: TSorting;
    filtering: TFiltering;
    search: TSearch;
};

/**
 * Compute input schema type based on config
 */
export type ComputeInputSchema<TConfig extends QueryConfig> = ObjectSchema<{
    [K in keyof TConfig as TConfig[K] extends undefined ? never : K]: AnySchema;
}>;

/**
 * Compute output schema type based on config and data
 */
export type ComputeOutputSchema<TConfig extends QueryConfig, TData extends AnySchema> = ObjectSchema<{
    data: TData extends ObjectSchema ? TData : AnySchema;
    meta: TConfig["pagination"] extends PaginationConfig ? ObjectSchema : never;
}>;

/**
 * Query builder options
 */
export type QueryBuilderOptions<
    TPaginationConfig extends PaginationConfig | undefined = undefined,
    TSortingConfig extends SortingConfig | undefined = undefined,
    TFilteringConfig extends FilteringConfig | undefined = undefined,
    TSearchConfig extends SearchConfig | undefined = undefined,
> = {
    pagination?: TPaginationConfig extends PaginationConfig ? SchemaWithConfig<TPaginationConfig> : undefined;
    sorting?: TSortingConfig extends SortingConfig ? SchemaWithConfig<TSortingConfig> : undefined;
    filtering?: TFilteringConfig extends FilteringConfig ? SchemaWithConfig<TFilteringConfig> : undefined;
    search?: TSearchConfig extends SearchConfig ? SchemaWithConfig<TSearchConfig> : undefined;
};

/**
 * Query builder class for composing query schemas
 */
export class QueryBuilder<
    TPagination extends PaginationConfig | undefined = undefined,
    TSorting extends SortingConfig | undefined = undefined,
    TFiltering extends FilteringConfig | undefined = undefined,
    TSearch extends SearchConfig | undefined = undefined,
> {
    private paginationConfig: SchemaWithConfig<TPagination> | undefined;
    private sortingConfig: SchemaWithConfig<TSorting> | undefined;
    private filteringConfig: SchemaWithConfig<TFiltering> | undefined;
    private searchConfig: SchemaWithConfig<TSearch> | undefined;

    constructor(options?: QueryBuilderOptions<TPagination, TSorting, TFiltering, TSearch>) {
        this.paginationConfig = options?.pagination as SchemaWithConfig<TPagination> | undefined;
        this.sortingConfig = options?.sorting as SchemaWithConfig<TSorting> | undefined;
        this.filteringConfig = options?.filtering as SchemaWithConfig<TFiltering> | undefined;
        this.searchConfig = options?.search as SchemaWithConfig<TSearch> | undefined;
    }

    /**
     * Add pagination configuration
     */
    withPagination<TConfig extends PaginationConfig>(config: SchemaWithConfig<TConfig>): QueryBuilder<TConfig, TSorting, TFiltering, TSearch> {
        return new QueryBuilder({
            pagination: config,
            sorting: this.sortingConfig,
            filtering: this.filteringConfig,
            search: this.searchConfig,
        } as QueryBuilderOptions<TConfig, TSorting, TFiltering, TSearch>);
    }

    /**
     * Add sorting configuration
     */
    withSorting<TConfig extends SortingConfig>(config: SchemaWithConfig<TConfig>): QueryBuilder<TPagination, TConfig, TFiltering, TSearch> {
        return new QueryBuilder({
            pagination: this.paginationConfig,
            sorting: config,
            filtering: this.filteringConfig,
            search: this.searchConfig,
        } as QueryBuilderOptions<TPagination, TConfig, TFiltering, TSearch>);
    }

    /**
     * Add filtering configuration
     */
    withFiltering<TConfig extends FilteringConfig>(config: SchemaWithConfig<TConfig>): QueryBuilder<TPagination, TSorting, TConfig, TSearch> {
        return new QueryBuilder({
            pagination: this.paginationConfig,
            sorting: this.sortingConfig,
            filtering: config,
            search: this.searchConfig,
        } as QueryBuilderOptions<TPagination, TSorting, TConfig, TSearch>);
    }

    /**
     * Add search configuration
     */
    withSearch<TConfig extends SearchConfig>(config: SchemaWithConfig<TConfig>): QueryBuilder<TPagination, TSorting, TFiltering, TConfig> {
        return new QueryBuilder({
            pagination: this.paginationConfig,
            sorting: this.sortingConfig,
            filtering: this.filteringConfig,
            search: config,
        } as QueryBuilderOptions<TPagination, TSorting, TFiltering, TConfig>);
    }

    /**
     * Build the input schema combining all configurations
     */
    buildInputSchema() {
        // Build shape without type annotation to preserve specific types
        const shapeInit = {};

        if (this.paginationConfig) {
            const paginationSchema = createPaginationSchema(this.paginationConfig as SchemaWithConfig<Partial<PaginationConfig>>);
            Object.assign(shapeInit, getSchemaShape(paginationSchema));
        }

        if (this.sortingConfig) {
            const sortingSchema = createSortingSchema(this.sortingConfig);
            Object.assign(shapeInit, getSchemaShape(sortingSchema));
        }

        if (this.filteringConfig) {
            const filteringSchema = createFilteringSchema(this.filteringConfig);
            Object.assign(shapeInit, { filter: s.optional(filteringSchema) });
        }

        if (this.searchConfig) {
            const searchSchema = createSearchSchema(this.searchConfig);
            Object.assign(shapeInit, { search: s.optional(searchSchema) });
        }

        return s.object(shapeInit);
    }

    /**
     * Build the output schema with data and meta
     */
    buildOutputSchema<TData extends AnySchema>(
        dataSchema: TData,
    ): TPagination extends PaginationConfig
        ? ReturnType<
              typeof s.object<{
                  data: ReturnType<typeof s.array<TData>>;
                  meta: ReturnType<typeof createPaginationMetaSchema<TPagination>>;
              }>
          >
        : ReturnType<typeof s.object<{ data: ReturnType<typeof s.array<TData>> }>> {
        // Build separate shapes to preserve exact types
        if (this.paginationConfig) {
            // With pagination: meta is required
            return s.object({
                data: s.array(dataSchema),
                meta: createPaginationMetaSchema(this.paginationConfig as SchemaWithConfig<Partial<PaginationConfig>>),
            }) as TPagination extends PaginationConfig
                ? ReturnType<
                      typeof s.object<{
                          data: ReturnType<typeof s.array<TData>>;
                          meta: ReturnType<typeof createPaginationMetaSchema<TPagination>>;
                      }>
                  >
                : ReturnType<typeof s.object<{ data: ReturnType<typeof s.array<TData>> }>>;
        }

        // Without pagination: meta is not present
        return s.object({
            data: s.array(dataSchema),
        }) as TPagination extends PaginationConfig
            ? ReturnType<
                  typeof s.object<{
                      data: ReturnType<typeof s.array<TData>>;
                      meta: ReturnType<typeof createPaginationMetaSchema<TPagination>>;
                  }>
              >
            : ReturnType<typeof s.object<{ data: ReturnType<typeof s.array<TData>> }>>;
    }

    /**
     * Get configuration object
     */
    getConfig(): QueryConfig<TPagination, TSorting, TFiltering, TSearch> {
        return {
            pagination: this.paginationConfig?.[CONFIG_SYMBOL] as TPagination,
            sorting: this.sortingConfig?.[CONFIG_SYMBOL] as TSorting,
            filtering: this.filteringConfig?.[CONFIG_SYMBOL] as TFiltering,
            search: this.searchConfig?.[CONFIG_SYMBOL] as TSearch,
        };
    }
}

/**
 * Factory function to create a query builder
 */
export function createQueryBuilder(): QueryBuilder {
    return new QueryBuilder();
}

/**
 * Preset: Basic list query (pagination + sorting)
 */
export function createBasicListQuery<TSortFields extends readonly string[]>(options: {
    sortableFields: TSortFields;
    defaultSortField?: TSortFields[number];
    defaultLimit?: number;
    maxLimit?: number;
}): QueryBuilder<PaginationConfig, SortingConfig> {
    const paginationConfig = createPaginationConfigSchema({
        defaultLimit: options.defaultLimit ?? 20,
        maxLimit: options.maxLimit ?? 100,
        includeOffset: true,
        includeCursor: false,
        includePage: true,
    });

    const sortingConfig = createSortingConfigSchema(options.sortableFields, {
        defaultField: options.defaultSortField,
        defaultDirection: "asc",
    });

    return new QueryBuilder().withPagination(paginationConfig).withSorting(sortingConfig) as QueryBuilder<PaginationConfig, SortingConfig>;
}

/**
 * Preset: Searchable list query (pagination + sorting + search)
 */
export function createSearchableListQuery<TSortFields extends readonly string[], TSearchFields extends readonly string[]>(options: {
    sortableFields: TSortFields;
    searchableFields: TSearchFields;
    defaultSortField?: TSortFields[number];
    defaultLimit?: number;
    maxLimit?: number;
}): QueryBuilder<PaginationConfig, SortingConfig, undefined, SearchConfig> {
    const paginationConfig = createPaginationConfigSchema({
        defaultLimit: options.defaultLimit ?? 20,
        maxLimit: options.maxLimit ?? 100,
        includeOffset: true,
        includeCursor: false,
        includePage: true,
    });

    const sortingConfig = createSortingConfigSchema(options.sortableFields, {
        defaultField: options.defaultSortField,
        defaultDirection: "asc",
    });

    const searchConfig = createSearchConfigSchema(options.searchableFields, {
        minQueryLength: 1,
        maxQueryLength: 500,
    });

    return new QueryBuilder().withPagination(paginationConfig).withSorting(sortingConfig).withSearch(searchConfig) as QueryBuilder<PaginationConfig, SortingConfig, undefined, SearchConfig>;
}

/**
 * Preset: Advanced query (all features)
 */
export function createAdvancedQuery<TSortFields extends readonly string[], TSearchFields extends readonly string[], TFilterFields extends Record<string, FieldFilterConfig>>(options: {
    sortableFields: TSortFields;
    searchableFields: TSearchFields;
    filterableFields: TFilterFields;
    defaultSortField?: TSortFields[number];
    defaultLimit?: number;
    maxLimit?: number;
}): QueryBuilder<PaginationConfig, SortingConfig, FilteringConfig, SearchConfig> {
    const paginationConfig = createPaginationConfigSchema({
        defaultLimit: options.defaultLimit ?? 20,
        maxLimit: options.maxLimit ?? 100,
        includeOffset: true,
        includeCursor: true,
        includePage: true,
    });

    const sortingConfig = createSortingConfigSchema(options.sortableFields, {
        defaultField: options.defaultSortField,
        defaultDirection: "asc",
        allowMultiple: true,
    });

    const filteringConfig = createFilteringConfigSchema(options.filterableFields, {
        allowLogicalOperators: true,
    });

    const searchConfig = createSearchConfigSchema(options.searchableFields, {
        minQueryLength: 1,
        maxQueryLength: 500,
        allowFieldSelection: true,
        allowFuzzy: true,
    });

    return new QueryBuilder().withPagination(paginationConfig).withSorting(sortingConfig).withFiltering(filteringConfig).withSearch(searchConfig) as QueryBuilder<
        PaginationConfig,
        SortingConfig,
        FilteringConfig,
        SearchConfig
    >;
}
