/**
 * List Operation Builder
 *
 * Fluent API for building list operations with type-safe query configuration.
 * This builder wraps QueryBuilder and provides a cleaner, more intuitive API.
 *
 * @example
 * ```typescript
 * const userOps = standard.zod(userSchema, 'user');
 *
 * // Build list operation with fluent API
 * const userListContract = createFilterConfig(userOps)
 *   .withPagination({ defaultLimit: 20, maxLimit: 100, includeOffset: true })
 *   .withSorting(['name', 'email', 'createdAt'], {
 *     defaultField: 'createdAt',
 *     defaultDirection: 'desc'
 *   })
 *   .withFiltering({
 *     name: { schema: z.string(), operators: ['eq', 'like'] },
 *     email: z.string().email()
 *   })
 *   .withSearch(['name', 'email'])
 *   .buildConfig();
 *
 * const userListContract = userOps.list(userListConfig).build();
 *
 * // Export query schemas for reuse
 * export const userListSchemas = createFilterConfig(userOps)
 *   .withPagination({ defaultLimit: 20 })
 *   .withSorting(['name', 'email'])
 *   .buildConfig();
 * ```
 */

import * as z from "zod";
import type { AnySchema } from "@orpc/contract";
import type { ZodEntitySchema } from "./standard-operations";
import type { ZodStandardOperations } from "./standard-operations";
import type { RouteBuilder } from "../../builder/route-builder";
import {
    createQueryBuilder,
    createPaginationConfigSchema,
    createSortingConfigSchema,
    createFilteringConfigSchema,
    createSearchConfigSchema,
    ALL_FILTER_OPERATORS,
    type QueryBuilder,
    type QueryConfig,
    type FieldFilterConfig,
    type FilterOperator,
} from "./utils";
import type { ComputeInputSchema, ComputeOutputSchema } from "./utils";

/**
 * Filter field definition for the builder's fluent API.
 *
 * Accepts:
 * - Bare Zod schema (uses all default operators)
 * - `{ schema: ZodType, operators: [...] }` for explicit control
 * - Existing FieldFilterConfig for advanced use
 */
export type BuilderFilterField = z.ZodType | { schema: z.ZodType; operators: readonly FilterOperator[] } | FieldFilterConfig;

/**
 * Infer the TypeScript value type from a BuilderFilterField.
 * - ZodType → z.infer<T>
 * - { schema: ZodType } → z.infer<T['schema']>
 * - FieldFilterConfig → unknown (no schema info available)
 */
type InferBuilderFieldValue<T extends BuilderFilterField> = T extends z.ZodType ? z.infer<T> : T extends { schema: infer S extends z.ZodType } ? z.infer<S> : unknown;

/**
 * Infer the operator literal types from a BuilderFilterField.
 * - { operators: readonly [...] } → union of literal operator types
 * - ZodType / FieldFilterConfig without explicit operators → FilterOperator (all)
 */
type InferBuilderFieldOperators<T extends BuilderFilterField> = T extends { operators: readonly (infer U extends FilterOperator)[] } ? U : FilterOperator;

/**
 * Normalize BuilderFilterField types to FieldFilterConfig while preserving
 * both the value type and the exact operator literals via phantom fields.
 */
type NormalizeFilterFields<TFields extends Record<string, BuilderFilterField>> = {
    [K in keyof TFields]: FieldFilterConfig & {
        _valueType: InferBuilderFieldValue<TFields[K]>;
        _operators: InferBuilderFieldOperators<TFields[K]>;
    };
};

/**
 * Check if a field is the `{ schema, operators }` shorthand pattern
 */
function isSchemaWithOperators(field: BuilderFilterField): field is { schema: z.ZodType; operators: readonly FilterOperator[] } {
    return "schema" in field && "operators" in field;
}

/**
 * Check if a field is already a FieldFilterConfig (has `type` or `operators` without `schema`)
 */
function isExistingFieldFilterConfig(field: BuilderFilterField): field is FieldFilterConfig {
    // ZodFieldFilterConfig has 'type', BaseFieldFilterConfig has 'operators' but not 'schema'
    return "type" in field || ("operators" in field && !("schema" in field));
}

/**
 * Normalize a BuilderFilterField to FieldFilterConfig
 */
function normalizeFilterField(field: BuilderFilterField): FieldFilterConfig {
    if (isSchemaWithOperators(field)) {
        // Convert { schema, operators } → BaseFieldFilterConfig (just operators)
        return { operators: [...field.operators] };
    }
    if (isExistingFieldFilterConfig(field)) {
        return field;
    }
    // Bare ZodType → use all operators
    return { operators: [...ALL_FILTER_OPERATORS] };
}

/**
 * List Operation Builder class
 *
 * Provides a fluent API for configuring list operations step by step.
 * Internally manages a QueryBuilder and delegates to the parent operations class.
 */
export class ListOperationBuilder<
    TEntity extends ZodEntitySchema,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    TConfig extends QueryConfig = {},
> {
    private readonly operations: ZodStandardOperations<TEntity, string, z.ZodType>;
    private readonly _entitySchema: TEntity;
    private queryBuilder: QueryBuilder<TConfig>;

    constructor(operations: ZodStandardOperations<TEntity, string, z.ZodType>, entitySchema: TEntity) {
        this.operations = operations;
        this._entitySchema = entitySchema;
        this.queryBuilder = createQueryBuilder<TConfig>();
    }

    /**
     * Configure pagination settings
     */
    withPagination<
        TDefaultLimit extends number = 10,
        TMaxLimit extends number = 100,
        TMinLimit extends number = 1,
        TIncludeOffset extends boolean = true,
        TIncludeCursor extends boolean = false,
        TIncludePage extends boolean = false,
    >(options?: {
        defaultLimit?: TDefaultLimit;
        maxLimit?: TMaxLimit;
        minLimit?: TMinLimit;
        includeOffset?: TIncludeOffset;
        includeCursor?: TIncludeCursor;
        includePage?: TIncludePage;
    }): ListOperationBuilder<
        TEntity,
        TConfig & {
            pagination: ReturnType<typeof createPaginationConfigSchema<TDefaultLimit, TMaxLimit, TMinLimit, TIncludeOffset, TIncludeCursor, TIncludePage>>;
        }
    > {
        const paginationConfig = createPaginationConfigSchema(options);
        this.queryBuilder = this.queryBuilder.withPagination(paginationConfig) as QueryBuilder<TConfig & { pagination: typeof paginationConfig }>;
        return this as unknown as ListOperationBuilder<TEntity, TConfig & { pagination: typeof paginationConfig }>;
    }

    /**
     * Configure sorting settings
     */
    withSorting<TFields extends readonly string[]>(
        fields: TFields,
        options?: {
            defaultField?: TFields[number];
            defaultDirection?: "asc" | "desc";
            allowMultiple?: boolean;
            allowNullsHandling?: boolean;
        },
    ): ListOperationBuilder<
        TEntity,
        TConfig & {
            sorting: ReturnType<typeof createSortingConfigSchema<TFields, boolean, boolean>>;
        }
    > {
        const sortingConfig = createSortingConfigSchema(fields, options);
        this.queryBuilder = this.queryBuilder.withSorting(sortingConfig) as QueryBuilder<TConfig & { sorting: typeof sortingConfig }>;
        return this as unknown as ListOperationBuilder<TEntity, TConfig & { sorting: typeof sortingConfig }>;
    }

    /**
     * Configure filtering settings
     *
     * Fields can be:
     * - A bare Zod schema (uses all default operators)
     * - An object with `{ schema, operators }` for explicit operator control
     * - An existing FieldFilterConfig for advanced use
     *
     * Field keys must be properties of the entity schema.
     */
    withFiltering<TFields extends Partial<Record<keyof z.infer<TEntity>, BuilderFilterField>>>(
        fields: TFields,
        options?: {
            allowLogicalOperators?: boolean;
        },
    ): ListOperationBuilder<
        TEntity,
        TConfig & {
            filtering: ReturnType<typeof createFilteringConfigSchema<NormalizeFilterFields<{ [K in keyof TFields]-?: NonNullable<TFields[K]> }>>>;
        }
    > {
        // Normalize all fields to FieldFilterConfig before passing to createFilteringConfigSchema
        const normalizedFields = {} as { [K in keyof TFields]: FieldFilterConfig };
        for (const [key, field] of Object.entries(fields)) {
            if (field !== undefined) {
                normalizedFields[key as keyof TFields] = normalizeFilterField(field);
            }
        }
        const filteringConfig = createFilteringConfigSchema(normalizedFields, options);
        this.queryBuilder = this.queryBuilder.withFiltering(filteringConfig) as QueryBuilder<TConfig & { filtering: typeof filteringConfig }>;
        return this as unknown as ListOperationBuilder<
            TEntity,
            TConfig & {
                filtering: ReturnType<typeof createFilteringConfigSchema<NormalizeFilterFields<{ [K in keyof TFields]-?: NonNullable<TFields[K]> }>>>;
            }
        >;
    }

    /**
     * Configure search settings
     */
    withSearch<TFields extends readonly string[]>(
        fields: TFields,
        options?: {
            minQueryLength?: number;
            allowFieldSelection?: boolean;
        },
    ): ListOperationBuilder<
        TEntity,
        TConfig & {
            search: ReturnType<typeof createSearchConfigSchema<TFields>>;
        }
    > {
        const searchConfig = createSearchConfigSchema(fields, options);
        this.queryBuilder = this.queryBuilder.withSearch(searchConfig) as QueryBuilder<TConfig & { search: typeof searchConfig }>;
        return this as unknown as ListOperationBuilder<TEntity, TConfig & { search: typeof searchConfig }>;
    }

    /**
     * Get the built query configuration schemas for type computation and reuse.
     */
    getSchemas(): TConfig {
        return this.buildConfig();
    }

    /**
     * Build only the list config (without building the route).
     *
     * Useful when you want to pass config to `ops.list(config)`.
     */
    buildConfig(): TConfig {
        return this.queryBuilder.getConfig();
    }

    /**
     * Build the final list operation contract.
     *
     * Returns a fully built ORPC contract (not a RouteBuilder).
     * Use this directly in router definitions.
     */
    build(): ReturnType<RouteBuilder<AnySchema, AnySchema, "GET", TEntity>["build"]> {
        return this.operations.list(this.buildConfig()).build();
    }

    /**
     * Build the input Zod schema (for type extraction or reuse).
     */
    buildInputSchema(): z.ZodType<ComputeInputSchema<TConfig>, ComputeInputSchema<TConfig>> {
        return this.queryBuilder.buildInputSchema();
    }

    /**
     * Build the output Zod schema (for type extraction or reuse).
     */
    buildOutputSchema(): z.ZodType<ComputeOutputSchema<TConfig, z.infer<TEntity>>> {
        return this.queryBuilder.buildOutputSchema(this._entitySchema);
    }
}

/**
 * Create a fluent list config builder from standard operations.
 *
 * @example
 * ```ts
 * const listConfig = createListConfig(userOps)
 *   .withFiltering({ email: userSchema.shape.email })
 *   .withPagination({ defaultLimit: 20, maxLimit: 100, includeOffset: true })
 *   .buildConfig();
 *
 * const listContract = userOps.list(listConfig).build();
 * ```
 */
export function createListConfig<TEntity extends ZodEntitySchema>(
    operations: ZodStandardOperations<TEntity, string, z.ZodType>,
) {
    return new ListOperationBuilder(operations, operations.getEntitySchema());
}

/**
 * Backward-compatible alias with a filtering-first naming.
 */
export const createFilterConfig = createListConfig;
