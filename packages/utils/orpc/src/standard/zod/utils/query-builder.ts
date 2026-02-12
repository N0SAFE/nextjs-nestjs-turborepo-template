/**
 * Query Builder for Zod
 *
 * Fluent builder for combining pagination, sorting, filtering, and search.
 */

import * as z from "zod";
import {
    createPaginationSchema,
    createPaginationMetaSchema,
    createPaginationConfigSchema,
    type PaginationConfig,
    type PaginationInputFields,
    type PaginationMetaOutput,
    type ZodSchemaWithConfig,
    hasConfig,
} from "./pagination";
import {
    createSortingSchema,
    createSortingConfigSchema,
    type SortingConfig,
    type SortingSchemaOutput,
} from "./sorting";
import {
    createFilteringSchema,
    createFilteringConfigSchema,
    type FilteringConfig,
    type FilteringSchemaOutput
} from "./filtering";
import {
    createSearchSchema,
    createSearchConfigSchema,
    type SearchConfig,
} from "./search";

/**
 * Query configuration type
 */
export type QueryConfig = {
    pagination?: ZodSchemaWithConfig<Partial<PaginationConfig>>;
    sorting?: ZodSchemaWithConfig<Partial<SortingConfig>>;
    filtering?: ZodSchemaWithConfig<FilteringConfig>;
    search?: ZodSchemaWithConfig<unknown>;
};

/**
 * Compute the input schema type from a QueryConfig
 */
export type ComputeInputSchema<TConfig extends QueryConfig> =
    (NonNullable<TConfig["pagination"]> extends ZodSchemaWithConfig<infer P>
        ? P extends Partial<PaginationConfig>
            ? PaginationInputFields<P>
            : object
        : object) &
    (NonNullable<TConfig["sorting"]> extends ZodSchemaWithConfig<infer S>
        ? S extends Partial<SortingConfig>
            ? SortingSchemaOutput<S>
            : object
        : object) &
    (NonNullable<TConfig["filtering"]> extends ZodSchemaWithConfig<infer F>
        ? F extends FilteringConfig<infer TFields>
            ? { filter?: FilteringSchemaOutput<TFields> }
            : object
        : object) &
    (NonNullable<TConfig["search"]> extends ZodSchemaWithConfig<unknown>
        ? { query?: string; searchFields?: string[] }
        : object);

/**
 * Compute the output schema type from a QueryConfig
 */
export type ComputeOutputSchema<TConfig extends QueryConfig, TData> = {
    data: TData[];
} & (NonNullable<TConfig["pagination"]> extends ZodSchemaWithConfig<infer P>
    ? P extends Partial<PaginationConfig>
        ? { meta: PaginationMetaOutput<P> }
        : object
    : object);

/**
 * Query builder options
 */
export type QueryBuilderOptions = QueryConfig;

/**
 * Query Builder class
 *
 * Fluent builder for combining query features
 *
 * @example
 * ```typescript
 * const queryBuilder = new QueryBuilder()
 *   .withPagination(createPaginationConfigSchema({ defaultLimit: 20 }))
 *   .withSorting(createSortingConfigSchema(['name', 'createdAt'] as const))
 *   .withFiltering(createFilteringConfigSchema({
 *     name: { type: 'string' },
 *     status: { type: 'enum', enumValues: ['active', 'inactive'] }
 *   }));
 *
 * const inputSchema = queryBuilder.buildInputSchema();
 * const outputSchema = queryBuilder.buildOutputSchema(entitySchema);
 * ```
 */
export class QueryBuilder<TConfig extends QueryConfig = Record<string, never>> {
    private config: TConfig;

    constructor(config: TConfig = {} as TConfig) {
        this.config = config;
    }

    /**
     * Add pagination configuration
     */
    withPagination<TPagination extends ZodSchemaWithConfig<Partial<PaginationConfig>>>(
        pagination: TPagination
    ): QueryBuilder<TConfig & { pagination: TPagination }> {
        return new QueryBuilder({
            ...this.config,
            pagination,
        }) as QueryBuilder<TConfig & { pagination: TPagination }>;
    }

    /**
     * Add sorting configuration
     */
    withSorting<TSorting extends ZodSchemaWithConfig<Partial<SortingConfig>>>(
        sorting: TSorting
    ): QueryBuilder<TConfig & { sorting: TSorting }> {
        return new QueryBuilder({
            ...this.config,
            sorting,
        }) as QueryBuilder<TConfig & { sorting: TSorting }>;
    }

    /**
     * Add filtering configuration
     */
    withFiltering<TFiltering extends ZodSchemaWithConfig<FilteringConfig>>(
        filtering: TFiltering
    ): QueryBuilder<TConfig & { filtering: TFiltering }> {
        return new QueryBuilder({
            ...this.config,
            filtering,
        }) as QueryBuilder<TConfig & { filtering: TFiltering }>;
    }

    /**
     * Add search configuration
     */
    withSearch<TSearch extends ZodSchemaWithConfig<Partial<SearchConfig>>>(
        search: TSearch
    ): QueryBuilder<TConfig & { search: TSearch }> {
        return new QueryBuilder({
            ...this.config,
            search,
        }) as QueryBuilder<TConfig & { search: TSearch }>;
    }

    /**
     * Build the input schema
     * Returns a properly typed ZodObject that preserves field structure
     */
    buildInputSchema(): z.ZodType<ComputeInputSchema<TConfig>, ComputeInputSchema<TConfig>> {
        const shape: Record<string, z.ZodType> = {};

        if (this.config.pagination && hasConfig(this.config.pagination)) {
            const paginationSchema = createPaginationSchema(
                this.config.pagination as unknown as ZodSchemaWithConfig<Partial<PaginationConfig>>
            );
            Object.assign(shape, (paginationSchema as unknown as z.ZodObject<z.ZodRawShape>).shape);
        }

        if (this.config.sorting && hasConfig(this.config.sorting)) {
            const sortingSchema = createSortingSchema(
                this.config.sorting as unknown as ZodSchemaWithConfig<Partial<SortingConfig>>
            );
            Object.assign(shape, (sortingSchema as z.ZodObject<z.ZodRawShape>).shape);
        }

        if (this.config.filtering && hasConfig(this.config.filtering)) {
            shape.filter = createFilteringSchema(
                this.config.filtering as unknown as ZodSchemaWithConfig<Partial<FilteringConfig>>
            ).optional();
        }

        if (this.config.search && hasConfig(this.config.search)) {
            const searchSchema = createSearchSchema(
                this.config.search as unknown as ZodSchemaWithConfig<Partial<SearchConfig>>
            );
            // Merge search fields but make query optional for combined queries
            const searchShape = (searchSchema as unknown as z.ZodObject<z.ZodRawShape>).shape;
            for (const [key, fieldSchema] of Object.entries(searchShape)) {
                const zodField = fieldSchema as unknown as z.ZodType;
                shape[key] = key === "query" ? zodField.optional() : zodField;
            }
        }

        return z.object(shape) as unknown as z.ZodType<ComputeInputSchema<TConfig>, ComputeInputSchema<TConfig>>;
    }

    /**
     * Build the output schema
     * Returns a properly typed ZodObject that preserves field structure
     *
     * @param itemSchema Schema for individual items
     */
    buildOutputSchema<TItemSchema extends z.ZodType>(
        itemSchema: TItemSchema
    ): z.ZodType<ComputeOutputSchema<TConfig, z.infer<TItemSchema>>, ComputeOutputSchema<TConfig, z.infer<TItemSchema>>> {
        const shape: Record<string, z.ZodType> = {
            data: z.array(itemSchema),
        };

        if (this.config.pagination && hasConfig(this.config.pagination)) {
            shape.meta = createPaginationMetaSchema(
                this.config.pagination as unknown as ZodSchemaWithConfig<Partial<PaginationConfig>>
            );
        }

        return z.object(shape) as unknown as z.ZodType<ComputeOutputSchema<TConfig, z.infer<TItemSchema>>, ComputeOutputSchema<TConfig, z.infer<TItemSchema>>>;
    }

    /**
     * Get the current configuration
     */
    getConfig(): TConfig {
        return this.config;
    }
}

/**
 * Create a query builder
 *
 * @param config Initial configuration
 * @returns QueryBuilder instance
 */
export function createQueryBuilder<TConfig extends QueryConfig>(
    config?: TConfig
): QueryBuilder<TConfig> {
    return new QueryBuilder(config ?? {} as TConfig);
}

// ==================== Preset Builders ====================

/**
 * Create a basic list query (pagination only)
 */
export function createBasicListQuery(options?: {
    defaultLimit?: number;
    maxLimit?: number;
}) {
    return createQueryBuilder({
        pagination: createPaginationConfigSchema({
            defaultLimit: options?.defaultLimit ?? 10,
            maxLimit: options?.maxLimit ?? 100,
            includeOffset: true,
        }),
    });
}

/**
 * Create a searchable list query (pagination + search)
 */
export function createSearchableListQuery<TFields extends readonly string[]>(
    searchableFields: TFields,
    options?: {
        defaultLimit?: number;
        maxLimit?: number;
        minQueryLength?: number;
    }
) {
    return createQueryBuilder({
        pagination: createPaginationConfigSchema({
            defaultLimit: options?.defaultLimit ?? 20,
            maxLimit: options?.maxLimit ?? 100,
            includeOffset: true,
        }),
        search: createSearchConfigSchema(searchableFields, {
            minQueryLength: options?.minQueryLength ?? 1,
            allowFieldSelection: true,
        }),
    });
}

/**
 * Create an advanced query (pagination + sorting + filtering + search)
 */
export function createAdvancedQuery<
    TSortFields extends readonly string[],
    TFilterFields extends Record<string, import("./filtering").FieldFilterConfig>,
    TSearchFields extends readonly string[]
>(options: {
    sortableFields: TSortFields;
    filterableFields: TFilterFields;
    searchableFields?: TSearchFields;
    defaultLimit?: number;
    maxLimit?: number;
    defaultSortField?: TSortFields[number];
    defaultSortDirection?: "asc" | "desc";
}) {
    const config: QueryConfig = {
        pagination: createPaginationConfigSchema({
            defaultLimit: options.defaultLimit ?? 20,
            maxLimit: options.maxLimit ?? 100,
            includeOffset: true,
            includePage: true,
        }),
        sorting: createSortingConfigSchema(options.sortableFields, {
            defaultField: options.defaultSortField,
            defaultDirection: options.defaultSortDirection ?? "asc",
        }),
        filtering: createFilteringConfigSchema(options.filterableFields),
    };

    if (options.searchableFields && options.searchableFields.length > 0) {
        config.search = createSearchConfigSchema(options.searchableFields, {
            allowFieldSelection: true,
        });
    }

    return createQueryBuilder(config);
}
