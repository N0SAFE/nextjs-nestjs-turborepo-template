import { z } from "zod/v4";
import { eventIterator, type HTTPPath, type AnySchema } from "@orpc/contract";
import { RouteBuilder, type EventIteratorWrapper, type IdentityWrapper, type SchemaWrapper } from "../builder/route-builder";
import type { EntitySchema, RouteMetadata } from "../builder/types";
import {
  createPaginationConfigSchema,
} from "../query/pagination";
import {
  createSortingConfigSchema,
  type ZodSchemaWithConfig,
  CONFIG_SYMBOL,
} from "../query/sorting";
import {
  createFilteringConfigSchema,
} from "../query/filtering";
import {
  createSearchConfigSchema,
} from "../query/search";
import { 
  createQueryBuilder, 
  type QueryConfig,
  type ComputeInputSchema,
  type ComputeOutputSchema,
} from "../query/query-builder";

type MergeRouteInput<TBase, TQuery> = [TBase] extends [undefined]
  ? TQuery
  : [TQuery] extends [undefined]
    ? TBase
    : TBase & TQuery;

function mergeInputSchemas(base: z.ZodType, query: z.ZodType): z.ZodType {
  // Most routes have object-like inputs; preserve that shape when composing.
  if (base instanceof z.ZodVoid) {
    return query;
  }
  if (query instanceof z.ZodVoid) {
    return base;
  }

  if (base instanceof z.ZodObject && query instanceof z.ZodObject) {
    // Prefer base fields if there is a collision; query params should not
    // accidentally overwrite path params.
    return query.extend(base.shape);
  }

  throw new Error(
    "StandardOperations.listFrom() requires base and query input schemas to be ZodObject (or ZodVoid)."
  );
}

type AnyWrapper<TSchema extends z.ZodType> = IdentityWrapper | SchemaWrapper<TSchema, AnySchema>;

type StandardListPlainOptions = {
  pagination?:
    | ZodSchemaWithConfig<unknown>
    | {
        defaultLimit?: number;
        maxLimit?: number;
        includeOffset?: boolean;
        includeCursor?: boolean;
        includePage?: boolean;
      };
  sorting?:
    | ZodSchemaWithConfig<unknown>
    | {
        fields: readonly string[];
        defaultField?: string;
        defaultDirection?: "asc" | "desc";
      };
  filtering?:
    | ZodSchemaWithConfig<unknown>
    | {
        fields: Record<string, z.ZodType>;
        allowLogicalOperators?: boolean;
      };
  /** Optional search config schema (used by some operations) */
  search?: ZodSchemaWithConfig<unknown>;
};

function normalizeListQueryConfig(
  queryConfigOrOptions?: QueryConfig | StandardListPlainOptions
): QueryConfig {
  const input = queryConfigOrOptions;

  // Detect whether the input is a QueryConfig-style object (config-schemas)
  const isQueryConfig =
    !!input &&
    (((input as QueryConfig).pagination)?.[
      CONFIG_SYMBOL
    ] !== undefined ||
      ((input as QueryConfig).sorting)?.[
        CONFIG_SYMBOL
      ] !== undefined ||
      ((input as QueryConfig).filtering)?.[
        CONFIG_SYMBOL
      ] !== undefined ||
      (input as QueryConfig).search?.[CONFIG_SYMBOL] !== undefined);

  if (isQueryConfig) {
    return input as QueryConfig;
  }

  const options = input as StandardListPlainOptions | undefined;
  const normalized: QueryConfig = {};

  // Handle pagination - accept ZodSchemaWithConfig OR plain object
  if (options?.pagination !== undefined) {
    if (CONFIG_SYMBOL in options.pagination) {
      normalized.pagination = options.pagination;
    } else {
      normalized.pagination = createPaginationConfigSchema(
        options.pagination as Parameters<typeof createPaginationConfigSchema>[0]
      );
    }
  } else {
    normalized.pagination = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 100 });
  }

  // Handle sorting - accept ZodSchemaWithConfig OR plain object
  if (options?.sorting) {
    if (CONFIG_SYMBOL in options.sorting) {
      normalized.sorting = options.sorting;
    } else {
      const sortingOpts = options.sorting as {
        fields: readonly string[];
        defaultField?: string;
        defaultDirection?: "asc" | "desc";
      };
      normalized.sorting = createSortingConfigSchema(sortingOpts.fields, {
        defaultField: sortingOpts.defaultField,
        defaultDirection: sortingOpts.defaultDirection ?? "asc",
      });
    }
  }

  // Handle filtering - accept ZodSchemaWithConfig OR plain object
  if (options?.filtering) {
    if (CONFIG_SYMBOL in options.filtering) {
      normalized.filtering = options.filtering;
    } else {
      const filteringOpts = options.filtering as {
        fields: Record<string, z.ZodType>;
        allowLogicalOperators?: boolean;
      };
      normalized.filtering = createFilteringConfigSchema(filteringOpts.fields, {
        allowLogicalOperators: filteringOpts.allowLogicalOperators,
      });
    }
  }

  // Search config is currently only supported via config schema
  if (options?.search) {
    normalized.search = options.search;
  }

  return normalized;
}



/**
 * Standard operations factory
 */
export class StandardOperations<TEntity extends EntitySchema> {
  constructor(
    private entitySchema: TEntity,
    private entityName: string
  ) {}

  /**
   * Create a list-like contract from an existing contract, using the same
   * pagination/sorting/filtering config-based approach as `list()`.
   *
   * This is useful when you already have a base route that defines path params
   * (e.g. orgId) and an item shape, and you want to add standardized query
   * inputs and a paginated response wrapper.
   *
   * Notes:
   * - Input schemas must be `z.object(...)` (or `z.void()`) because composition
   *   is done via object extension.
   * - Wrappers are **reset** (identity) because the input/output schemas change.
   *   If you need streaming, prefer `streamingList()` or add a dedicated helper.
   */
  static listFrom<
    TBaseInput extends z.ZodType,
    TBaseOutput extends z.ZodType,
    TConfig extends QueryConfig = QueryConfig
  >(
    base: RouteBuilder<TBaseInput, TBaseOutput, AnyWrapper<TBaseInput>, AnyWrapper<TBaseOutput>>,
    queryConfig?: TConfig
  ): RouteBuilder<
    z.ZodType<MergeRouteInput<z.input<TBaseInput>, ComputeInputSchema<TConfig>>>,
    z.ZodType<ComputeOutputSchema<TConfig, z.output<TBaseOutput>>>
  >;
  static listFrom<TBaseInput extends z.ZodType, TBaseOutput extends z.ZodType>(
    base: RouteBuilder<TBaseInput, TBaseOutput, AnyWrapper<TBaseInput>, AnyWrapper<TBaseOutput>>,
    options?: StandardListPlainOptions
  ): RouteBuilder<z.ZodType, z.ZodType>;
  static listFrom<TBaseInput extends z.ZodType, TBaseOutput extends z.ZodType>(
    base: RouteBuilder<TBaseInput, TBaseOutput, AnyWrapper<TBaseInput>, AnyWrapper<TBaseOutput>>,
    queryConfigOrOptions?: QueryConfig | StandardListPlainOptions
  ): unknown {
    return StandardOperations.listFromSchemas(
      base.getRouteMetadata(),
      base.getInputSchema(),
      base.getOutputSchema(),
      queryConfigOrOptions
    );
  }

  /**
   * Schema/config-first variant of `listFrom()`.
   *
   * Use this when you don't have (or don't want to depend on) a `RouteBuilder`
   * instance. A thin builder-based adapter (`listFrom`) is still available.
   */
  static listFromSchemas<
    TBaseInput extends z.ZodType,
    TItemSchema extends z.ZodType,
    TConfig extends QueryConfig = QueryConfig
  >(
    route: RouteMetadata,
    baseInputSchema: TBaseInput,
    itemSchema: TItemSchema,
    queryConfig?: TConfig
  ): RouteBuilder<
    z.ZodType<MergeRouteInput<z.input<TBaseInput>, ComputeInputSchema<TConfig>>>,
    z.ZodType<ComputeOutputSchema<TConfig, z.output<TItemSchema>>>
  >;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  static listFromSchemas<TBaseInput extends z.ZodType, TItemSchema extends z.ZodType>(
    route: RouteMetadata,
    baseInputSchema: TBaseInput,
    itemSchema: TItemSchema,
    options?: StandardListPlainOptions
  ): RouteBuilder<z.ZodType, z.ZodType>;
   
   
  static listFromSchemas<TBaseInput extends z.ZodType, TItemSchema extends z.ZodType>(
    route: RouteMetadata,
    baseInputSchema: TBaseInput,
    itemSchema: TItemSchema,
    queryConfigOrOptions?: QueryConfig | StandardListPlainOptions
  ): unknown {
    const normalized = normalizeListQueryConfig(queryConfigOrOptions);

    const queryBuilder = createQueryBuilder(normalized);
    const queryInputSchema = queryBuilder.buildInputSchema();
    const mergedInputSchema = mergeInputSchemas(baseInputSchema, queryInputSchema);
    const outputSchema = queryBuilder.buildOutputSchema(itemSchema);

    return new RouteBuilder(
      route,
      mergedInputSchema as unknown as z.ZodType,
      outputSchema as unknown as z.ZodType
    );
  }

  /**
   * Create a standard READ operation (GET by ID)
   * 
   * @example
   * ```typescript
   * standard.read(userSchema, 'user')
   *   .custom((builder) => builder.summary('Get user by ID'))
   *   .build();
   * ```
   */
  read(): RouteBuilder<z.ZodObject<{ id: z.ZodUUID }>, TEntity> {
    const inputSchema = z.object({
      id: z.uuid(),
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: `/{id}`,
        summary: `Get ${this.entityName} by ID`,
        description: `Retrieve a specific ${this.entityName} by their ID`,
      },
      inputSchema,
      this.entitySchema
    );

    return builder;
  }

  /**
   * Create a STREAMING READ operation (GET by ID with real-time updates)
   * 
   * Similar to `read()` but returns an EventIterator for real-time updates.
   * Useful for subscribing to changes on a single entity.
   * 
   * Supports both consumption modes:
   * - **Live Mode**: Data replaces with each update (real-time single entity view)
   * - **Streamed Mode**: Data accumulates (history of entity states)
   * 
   * @example
   * ```typescript
   * // Create a streaming read endpoint
   * const streamingUserContract = userOps.streamingRead().build();
   * 
   * // Live mode - always shows current state
   * const { data } = userHooks.useLiveStreamingRead({ id: 'uuid' });
   * 
   * // Streamed mode - accumulates updates
   * const { data } = userHooks.useStreamedStreamingRead({ id: 'uuid' });
   * ```
   */
  streamingRead(options?: {
    /** Custom path for the streaming endpoint (default: '/{id}/streaming') */
    path?: string;
  }): RouteBuilder<z.ZodObject<{ id: z.ZodUUID }>, TEntity, undefined, EventIteratorWrapper> {
    const inputSchema = z.object({
      id: z.uuid(),
    });

    const streamPath = (options?.path ?? '/{id}/streaming') as HTTPPath;

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: streamPath,
        summary: `Streaming ${this.entityName} by ID`,
        description: `Real-time streaming of a specific ${this.entityName} via EventIterator. Supports both live (replace) and streamed (accumulate) consumption modes.`,
      },
      inputSchema,
      this.entitySchema
    );

    return builder.wrapOutput(eventIterator);
  }

  /**
   * Create a standard CREATE operation (POST)
   * 
   * @example
   * ```typescript
   * standard.create(userSchema, 'user')
   *   .inputBuilder.omit(['id', 'createdAt', 'updatedAt'])
   *   .build();
   * ```
   */
  create(): RouteBuilder<TEntity, TEntity, undefined, undefined, "POST"> {
    const builder = new RouteBuilder<TEntity, TEntity, undefined, undefined, "POST">(
      {
        method: "POST",
        path: "/",
        summary: `Create a new ${this.entityName}`,
        description: `Create a new ${this.entityName} in the system`,
      },
      this.entitySchema,
      this.entitySchema,
      undefined,
      undefined,
      "POST"
    );

    return builder;
  }

  /**
   * Create a standard UPDATE operation (PUT/PATCH)
   * 
   * @example
   * ```typescript
   * standard.update(userSchema, 'user')
   *   .inputBuilder.partial()
   *   .build();
   * ```
   */
  update(): RouteBuilder<TEntity, TEntity, undefined, undefined, "PUT"> {
    const builder = new RouteBuilder<TEntity, TEntity, undefined, undefined, "PUT">(
      {
        method: "PUT",
        path: `/{id}`,
        summary: `Update an existing ${this.entityName}`,
        description: `Update an existing ${this.entityName} in the system`,
      },
      this.entitySchema,
      this.entitySchema,
      undefined,
      undefined,
      "PUT"
    );

    return builder;
  }

  /**
   * Create a standard PATCH operation (partial update)
   */
  patch(): RouteBuilder<z.ZodType<Partial<z.infer<TEntity>>>, TEntity, undefined, undefined, "PATCH"> {
    const partialSchema = this.entitySchema.partial();

    const builder = new RouteBuilder<z.ZodType<Partial<z.infer<TEntity>>>, TEntity, undefined, undefined, "PATCH">(
      {
        method: "PATCH",
        path: `/{id}`,
        summary: `Partially update ${this.entityName}`,
        description: `Update specific fields of ${this.entityName}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      partialSchema as any,
      this.entitySchema,
      undefined,
      undefined,
      "PATCH"
    );

    return builder as unknown as RouteBuilder<z.ZodType<Partial<z.infer<TEntity>>>, TEntity, undefined, undefined, "PATCH">;
  }

  /**
   * Create a standard DELETE operation
   * 
   * @example
   * ```typescript
   * standard.delete(userSchema, 'user')
   *   .build();
   * ```
   */
  delete(): RouteBuilder<
    z.ZodObject<{ id: z.ZodUUID }>,
    z.ZodObject<{ success: z.ZodBoolean; message: z.ZodOptional<z.ZodString> }>,
    undefined,
    undefined,
    "DELETE"
  > {
    const inputSchema = z.object({
      id: z.uuid(),
    });

    const outputSchema = z.object({
      success: z.boolean(),
      message: z.string().optional(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ id: z.ZodUUID }>,
      z.ZodObject<{ success: z.ZodBoolean; message: z.ZodOptional<z.ZodString> }>,
      undefined,
      undefined,
      "DELETE"
    >(
      {
        method: "DELETE",
        path: `/{id}`,
        summary: `Delete ${this.entityName}`,
        description: `Delete a ${this.entityName} by ID`,
      },
      inputSchema,
      outputSchema,
      undefined,
      undefined,
      "DELETE"
    );

    return builder;
  }

  /**
   * Create a standard LIST operation with pagination, sorting, and filtering
   * 
   * Accepts EITHER:
   * 1. ZodSchemaWithConfig objects (new API) - Already have config embedded
   * 2. Plain configuration objects (legacy API) - Will create config schemas
   * 
   * @example
   * ```typescript
   * // New API with ZodSchemaWithConfig:
   * const paginationConfig = createPaginationConfigSchema({ defaultLimit: 20 });
   * const sortingConfig = createSortingConfigSchema(['createdAt', 'name'] as const);
   * standard.list(userSchema, 'user', {
   *   pagination: paginationConfig,
   *   sorting: sortingConfig
   * }).build();
   * 
   * // Legacy API with plain objects (still supported):
   * standard.list(userSchema, 'user', {
   *   pagination: { defaultLimit: 20 },
   *   sorting: { fields: ['createdAt', 'name'] as const }
   * }).build();
   * ```
   */
  list<TConfig extends QueryConfig = QueryConfig>(queryConfig?: TConfig): RouteBuilder<
    z.ZodType<ComputeInputSchema<TConfig>>,
    z.ZodType<ComputeOutputSchema<TConfig, z.infer<TEntity>>>
  >;
  list(options?: {
    pagination?: ZodSchemaWithConfig<unknown> | { defaultLimit?: number; maxLimit?: number; includeOffset?: boolean; includeCursor?: boolean; includePage?: boolean };
    sorting?: ZodSchemaWithConfig<unknown> | { fields: readonly string[]; defaultField?: string; defaultDirection?: "asc" | "desc" };
    filtering?: ZodSchemaWithConfig<unknown> | { fields: Record<string, z.ZodType>; allowLogicalOperators?: boolean };
  }): RouteBuilder<z.ZodType, z.ZodType>;
  list<TConfig extends QueryConfig = QueryConfig>(optionsOrConfig?: TConfig | StandardListPlainOptions):
    | RouteBuilder<
        z.ZodType<ComputeInputSchema<TConfig>>,
        z.ZodType<ComputeOutputSchema<TConfig, z.infer<TEntity>>>
      >
    | RouteBuilder<z.ZodType, z.ZodType> {
    // Cast to a partial QueryConfig shape for type-safe access
    const input = optionsOrConfig;

    // Check if this is a pre-built QueryConfig or plain options
    const isQueryConfig = input && 
      ((input.pagination as ZodSchemaWithConfig<unknown> | undefined)?.[CONFIG_SYMBOL] !== undefined ||
       (input.sorting as ZodSchemaWithConfig<unknown> | undefined)?.[CONFIG_SYMBOL] !== undefined ||
       (input.filtering as ZodSchemaWithConfig<unknown> | undefined)?.[CONFIG_SYMBOL] !== undefined ||
       input.search?.[CONFIG_SYMBOL] !== undefined);

    if (isQueryConfig) {
      const typedConfig = input as TConfig;
      const queryBuilder = createQueryBuilder(typedConfig);
      const inputSchema = queryBuilder.buildInputSchema();
      const outputSchema = queryBuilder.buildOutputSchema(this.entitySchema);

      const builder = new RouteBuilder(
        {
          method: "GET",
          path: "/",
          summary: `List ${this.entityName}s`,
          description: `Retrieve a paginated list of ${this.entityName}s with optional filtering and sorting`,
        },
        inputSchema,
        outputSchema
      );

      return builder as unknown as RouteBuilder<
        z.ZodType<ComputeInputSchema<TConfig>>,
        z.ZodType<ComputeOutputSchema<TConfig, z.infer<TEntity>>>
      >;
    }

    // Plain options - build a non-specific QueryConfig from them
    const options = input as StandardListPlainOptions | undefined;
    const queryConfig: QueryConfig = {};

      // Handle pagination - accept ZodSchemaWithConfig OR plain object
      if (options?.pagination !== undefined) {
        // Check if it's already a ZodSchemaWithConfig (has CONFIG_SYMBOL)
        if (CONFIG_SYMBOL in options.pagination) {
          queryConfig.pagination = options.pagination;
        } else {
          // Plain object - create config schema
          queryConfig.pagination = createPaginationConfigSchema(options.pagination as Parameters<typeof createPaginationConfigSchema>[0]);
        }
      } else {
        queryConfig.pagination = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 100 });
      }

      // Handle sorting - accept ZodSchemaWithConfig OR plain object
      if (options?.sorting) {
        if (CONFIG_SYMBOL in options.sorting) {
          queryConfig.sorting = options.sorting;
        } else {
          const sortingOpts = options.sorting as { fields: readonly string[]; defaultField?: string; defaultDirection?: "asc" | "desc" };
          queryConfig.sorting = createSortingConfigSchema(sortingOpts.fields, {
            defaultField: sortingOpts.defaultField,
            defaultDirection: sortingOpts.defaultDirection ?? "asc",
          });
        }
      }

      // Handle filtering - accept ZodSchemaWithConfig OR plain object
      if (options?.filtering) {
        if (CONFIG_SYMBOL in options.filtering) {
          queryConfig.filtering = options.filtering;
        } else {
          const filteringOpts = options.filtering as { fields: Record<string, z.ZodType>; allowLogicalOperators?: boolean };
          queryConfig.filtering = createFilteringConfigSchema(
            filteringOpts.fields,
            { allowLogicalOperators: filteringOpts.allowLogicalOperators }
          );
        }
      }
    const queryBuilder = createQueryBuilder(queryConfig);
    const inputSchema = queryBuilder.buildInputSchema();
    const outputSchema = queryBuilder.buildOutputSchema(this.entitySchema);

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/",
        summary: `List ${this.entityName}s`,
        description: `Retrieve a paginated list of ${this.entityName}s with optional filtering and sorting`,
      },
      inputSchema,
      outputSchema
    );

    return builder as unknown as RouteBuilder<z.ZodType, z.ZodType>;
  }

  /**
   * Create a STREAMING LIST operation with real-time updates via EventIterator
   * 
   * Returns the same structure as `list()` but wrapped in an EventIterator that
   * emits data updates in real-time. This single operation supports TWO consumption modes:
   * 
   * 1. **Live Mode**: Uses `experimental_liveOptions` - replaces data with each new value.
   *    Ideal for real-time dashboards where you want the most current state.
   * 
   * 2. **Streamed Mode**: Uses `experimental_streamedOptions` - accumulates chunks into array.
   *    Ideal for scenarios where you want to receive and combine batches of updates.
   * 
   * The orpc-hooks package automatically detects EventIterator outputs and generates
   * BOTH hook variants:
   * - `useLive{Name}()` - for live/real-time replacement mode
   * - `useStreamed{Name}()` - for streamed/accumulation mode
   * 
   * This method returns a RouteBuilder with an eventIterator output wrapper configured.
   * The wrapper is applied at build() time, allowing further fluent modifications.
   * 
   * @example
   * ```typescript
   * // Create a streaming list endpoint (single definition)
   * const streamingUsersContract = userOps.streamingList({
   *   pagination: { defaultLimit: 20 },
   *   sorting: { fields: ['createdAt', 'name'] }
   * }).build();
   * 
   * // The orpc-hooks package generates BOTH hooks automatically:
   * 
   * // Live mode - data replaces with each update
   * const { data } = userHooks.useLiveStreamingList({ limit: 20 });
   * // data automatically updates when server pushes new values
   * 
   * // Streamed mode - data accumulates
   * const { data } = userHooks.useStreamedStreamingList({ limit: 20 });
   * // data is an array of accumulated responses
   * ```
   */
  streamingList(options?: {
    pagination?: ZodSchemaWithConfig<unknown> | { defaultLimit?: number; maxLimit?: number; includeOffset?: boolean; includeCursor?: boolean; includePage?: boolean };
    sorting?: ZodSchemaWithConfig<unknown> | { fields: readonly string[]; defaultField?: string; defaultDirection?: "asc" | "desc" };
    filtering?: ZodSchemaWithConfig<unknown> | { fields: Record<string, z.ZodType>; allowLogicalOperators?: boolean };
    /** Custom path for the streaming endpoint (default: '/streaming') */
    path?: string;
  }): RouteBuilder<z.ZodType, z.ZodType, undefined, EventIteratorWrapper> {
    const queryConfig: QueryConfig = {};

    if (options?.pagination !== undefined) {
      if (CONFIG_SYMBOL in options.pagination) {
        queryConfig.pagination = options.pagination;
      } else {
        queryConfig.pagination = createPaginationConfigSchema(options.pagination);
      }
    } else {
      queryConfig.pagination = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 100 });
    }

    if (options?.sorting) {
      if (CONFIG_SYMBOL in options.sorting) {
        queryConfig.sorting = options.sorting;
      } else {
        const { fields, defaultField, defaultDirection } = options.sorting;
        queryConfig.sorting = createSortingConfigSchema(fields, {
          defaultField,
          defaultDirection: defaultDirection ?? "asc",
        });
      }
    }

    if (options?.filtering) {
      if (CONFIG_SYMBOL in options.filtering) {
        queryConfig.filtering = options.filtering;
      } else {
        queryConfig.filtering = createFilteringConfigSchema(
          options.filtering.fields,
          { allowLogicalOperators: options.filtering.allowLogicalOperators }
        );
      }
    }

    const queryBuilder = createQueryBuilder(queryConfig);
    const inputSchema = queryBuilder.buildInputSchema();
    const baseOutputSchema = queryBuilder.buildOutputSchema(this.entitySchema);
    const streamPath = (options?.path ?? '/streaming') as HTTPPath;

    // Return RouteBuilder with eventIterator output wrapper
    // The wrapper is applied at build() time
    const builder = new RouteBuilder(
      {
        method: "GET",
        path: streamPath,
        summary: `Streaming ${this.entityName}s list`,
        description: `Real-time streaming list of ${this.entityName}s via EventIterator. Supports both live (replace) and streamed (accumulate) consumption modes.`,
      },
      inputSchema,
      baseOutputSchema
    );

    return builder.wrapOutput(eventIterator) as unknown as RouteBuilder<
      z.ZodType,
      z.ZodType,
      undefined,
      EventIteratorWrapper
    >;
  }

  /**
   * Create a standard COUNT operation
   * 
   * @example
   * ```typescript
   * standard.count(userSchema, 'user')
   *   .build();
   * ```
   */
  count(): RouteBuilder<z.ZodVoid, z.ZodObject<{ count: z.ZodNumber }>> {
    const outputSchema = z.object({
      count: z.number().int().min(0),
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/count",
        summary: `Count ${this.entityName}s`,
        description: `Get the total count of ${this.entityName}s`,
      },
      z.void(),
      outputSchema
    );

    return builder;
  }

  /**
   * Create a standard SEARCH operation with full-text search and filtering
   * 
   * @example
   * ```typescript
   * standard.search(userSchema, 'user', {
   *   searchFields: ['name', 'email'],
   *   pagination: { defaultLimit: 50 }
   * }).build();
   * ```
   */
  search(options?: {
    searchFields?: readonly string[];
    pagination?: ZodSchemaWithConfig<unknown> | { defaultLimit?: number; maxLimit?: number };
  }) {
    const queryConfig: QueryConfig = {};

    // Handle pagination - support both config schema and plain object
    if (options?.pagination) {
      if (CONFIG_SYMBOL in options.pagination) {
        // Already a ZodSchemaWithConfig - use directly
        queryConfig.pagination = options.pagination;
      } else {
        // Plain object - create config schema
        queryConfig.pagination = createPaginationConfigSchema(options.pagination);
      }
    } else {
      // Default pagination
      queryConfig.pagination = createPaginationConfigSchema({ defaultLimit: 20, maxLimit: 100 });
    }

    // Handle search - always create from plain object (no config schema variant exists yet)
    queryConfig.search = createSearchConfigSchema(options?.searchFields, {
      minQueryLength: 1,
      allowFieldSelection: true,
    });

    const queryBuilder = createQueryBuilder(queryConfig);
    const inputSchema = queryBuilder.buildInputSchema();
    const outputSchema = queryBuilder.buildOutputSchema(this.entitySchema);

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/search",
        summary: `Search ${this.entityName}s`,
        description: `Full-text search for ${this.entityName}s with pagination`,
      },
      inputSchema,
      outputSchema
    );

    return builder;
  }

  /**
   * Create a standard CHECK operation (e.g., check if email exists)
   * 
   * @example
   * ```typescript
   * standard.check(userSchema, 'user', 'email', z.email())
   *   .build();
   * ```
   */
  check<
    TField extends keyof z.infer<TEntity>,
    TFieldValue = z.infer<TEntity>[TField]
  >(
    fieldName: TField,
    fieldSchema?: z.ZodType
  ): RouteBuilder<
    z.ZodObject<Record<TField, z.ZodType<TFieldValue>>>,
    z.ZodObject<{ exists: z.ZodBoolean }>
  > {
    // Get schema from entity shape with proper typing
    const entityShape = this.entitySchema.shape as Record<string, z.ZodType | undefined>;
    const schemaFromShape = entityShape[fieldName as string];
    const schema: z.ZodType = fieldSchema ?? schemaFromShape ?? z.unknown();
    
    // Create a properly typed input schema
    type InputShape = Record<TField, z.ZodType>;
     
    const inputSchema = z.object({
      [fieldName]: schema,
    } as InputShape) as z.ZodObject<Record<TField, z.ZodType<TFieldValue>>>;

    const outputSchema = z.object({
      exists: z.boolean(),
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: `/check/${String(fieldName)}`,
        summary: `Check ${this.entityName} ${String(fieldName)}`,
        description: `Check if a ${this.entityName} exists with the given ${String(fieldName)}`,
      },
      inputSchema,
      outputSchema
    );

    return builder;
  }

  /**
   * Create a batch CREATE operation
   */
  batchCreate(options?: { maxBatchSize?: number }): RouteBuilder<
    z.ZodObject<{
      items: z.ZodArray<TEntity>;
    }>,
    z.ZodObject<{
      items: z.ZodArray<TEntity>;
      errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        error: z.ZodString;
      }>>>;
    }>,
    undefined,
    undefined,
    "POST"
  > {
    const maxSize = options?.maxBatchSize ?? 100;
    
    const inputSchema = z.object({
      items: z.array(this.entitySchema).max(maxSize),
    });

    const outputSchema = z.object({
      items: z.array(this.entitySchema),
      errors: z.array(z.object({
        index: z.number(),
        error: z.string(),
      })).optional(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ items: z.ZodArray<TEntity> }>,
      z.ZodObject<{
        items: z.ZodArray<TEntity>;
        errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
          index: z.ZodNumber;
          error: z.ZodString;
        }>>>;
      }>,
      undefined,
      undefined,
      "POST"
    >(
      {
        method: "POST",
        path: "/batch",
        summary: `Batch create ${this.entityName}s`,
        description: `Create multiple ${this.entityName}s in a single request`,
      },
      inputSchema,
      outputSchema,
      undefined,
      undefined,
      "POST"
    );

    return builder;
  }

  /**
   * Create a batch DELETE operation
   */
  batchDelete(options?: { maxBatchSize?: number }): RouteBuilder<
    z.ZodObject<{
      ids: z.ZodArray<z.ZodUUID>;
    }>,
    z.ZodObject<{
      deleted: z.ZodNumber;
      failed: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }>,
    undefined,
    undefined,
    "DELETE"
  > {
    const maxSize = options?.maxBatchSize ?? 100;
    
    const inputSchema = z.object({
      ids: z.array(z.uuid()).max(maxSize),
    });

    const outputSchema = z.object({
      deleted: z.number().int().min(0),
      failed: z.array(z.string()).optional(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ ids: z.ZodArray<z.ZodUUID> }>,
      z.ZodObject<{
        deleted: z.ZodNumber;
        failed: z.ZodOptional<z.ZodArray<z.ZodString>>;
      }>,
      undefined,
      undefined,
      "DELETE"
    >(
      {
        method: "DELETE",
        path: "/batch",
        summary: `Batch delete ${this.entityName}s`,
        description: `Delete multiple ${this.entityName}s by IDs`,
      },
      inputSchema,
      outputSchema,
      undefined,
      undefined,
      "DELETE"
    );

    return builder;
  }

  /**
   * Create a batch READ operation - Get multiple entities by IDs
   * 
   * @example
   * ```typescript
   * const batchReadContract = userOps.batchRead().build();
   * // Input: { ids: ['uuid1', 'uuid2', ...] }
   * // Output: { items: [...], notFound: ['uuid3'] }
   * ```
   */
  batchRead(options?: { maxBatchSize?: number }): RouteBuilder<
    z.ZodObject<{
      ids: z.ZodArray<z.ZodUUID>;
    }>,
    z.ZodObject<{
      items: z.ZodArray<TEntity>;
      notFound: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }>,
    undefined,
    undefined,
    "POST"
  > {
    const maxSize = options?.maxBatchSize ?? 100;
    
    const inputSchema = z.object({
      ids: z.array(z.uuid()).max(maxSize),
    });

    const outputSchema = z.object({
      items: z.array(this.entitySchema),
      notFound: z.array(z.string()).optional(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ ids: z.ZodArray<z.ZodUUID> }>,
      z.ZodObject<{
        items: z.ZodArray<TEntity>;
        notFound: z.ZodOptional<z.ZodArray<z.ZodString>>;
      }>,
      undefined,
      undefined,
      "POST"
    >(
      {
        method: "POST",
        path: "/batch/read",
        summary: `Batch read ${this.entityName}s`,
        description: `Get multiple ${this.entityName}s by their IDs in a single request`,
      },
      inputSchema,
      outputSchema,
      undefined,
      undefined,
      "POST"
    );

    return builder;
  }

  /**
   * Create a batch UPDATE operation - Update multiple entities
   * 
   * @example
   * ```typescript
   * const batchUpdateContract = userOps.batchUpdate().build();
   * // Input: { items: [{ id: 'uuid1', name: 'New Name' }, ...] }
   * // Output: { items: [...], errors: [{ id: 'uuid2', error: 'Not found' }] }
   * ```
   */
  batchUpdate(options?: { maxBatchSize?: number }): RouteBuilder<
    z.ZodObject<{
      items: z.ZodArray<z.ZodObject<{ id: z.ZodUUID }>>;
    }>,
    z.ZodObject<{
      items: z.ZodArray<TEntity>;
      errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        error: z.ZodString;
      }>>>;
    }>,
    undefined,
    undefined,
    "PATCH"
  > {
    const maxSize = options?.maxBatchSize ?? 100;
    
    // Create partial entity schema with required ID
    const partialEntityWithId = this.entitySchema.partial().extend({
      id: z.uuid(),
    });
    
    const inputSchema = z.object({
      items: z.array(partialEntityWithId).max(maxSize),
    });

    const outputSchema = z.object({
      items: z.array(this.entitySchema),
      errors: z.array(z.object({
        id: z.string(),
        error: z.string(),
      })).optional(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ items: z.ZodArray<z.ZodObject<{ id: z.ZodUUID }>> }>,
      z.ZodObject<{
        items: z.ZodArray<TEntity>;
        errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
          id: z.ZodString;
          error: z.ZodString;
        }>>>;
      }>,
      undefined,
      undefined,
      "PATCH"
    >(
      {
        method: "PATCH",
        path: "/batch",
        summary: `Batch update ${this.entityName}s`,
        description: `Update multiple ${this.entityName}s in a single request`,
      },
      inputSchema,
      outputSchema,
      undefined,
      undefined,
      "PATCH"
    );

    return builder as unknown as RouteBuilder<
      z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{ id: z.ZodUUID }>>;
      }>,
      z.ZodObject<{
        items: z.ZodArray<TEntity>;
        errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
          id: z.ZodString;
          error: z.ZodString;
        }>>>;
      }>,
      undefined,
      undefined,
      "PATCH"
    >;
  }

  /**
   * Check if entity exists by ID
   * 
   * @example
   * ```typescript
   * const existsContract = userOps.exists().build();
   * // Input: { id: 'uuid' }
   * // Output: { exists: true }
   * ```
   */
  exists(): RouteBuilder<
    z.ZodObject<{ id: z.ZodUUID }>,
    z.ZodObject<{ exists: z.ZodBoolean }>
  > {
    const inputSchema = z.object({
      id: z.uuid(),
    });

    const outputSchema = z.object({
      exists: z.boolean(),
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/{id}/exists",
        summary: `Check if ${this.entityName} exists`,
        description: `Check if a ${this.entityName} exists by ID`,
      },
      inputSchema,
      outputSchema
    );

    return builder;
  }

  /**
   * Create or update entity (upsert operation)
   * 
   * @example
   * ```typescript
   * // Upsert by ID (default)
   * const upsertContract = userOps.upsert().build();
   * 
   * // Upsert by unique field (e.g., email)
   * const upsertByEmailContract = userOps.upsert({ uniqueField: 'email' }).build();
   * ```
   */
  upsert(options?: {
    /** Field to use for uniqueness check (default: 'id') */
    uniqueField?: string;
    /** Custom path for the endpoint */
    path?: string;
  }): RouteBuilder<TEntity, z.ZodObject<{
    item: TEntity;
    created: z.ZodBoolean;
  }>, undefined, undefined, "PUT"> {
    const uniqueField = options?.uniqueField ?? 'id';
    const upsertPath = (options?.path ?? '/upsert') as HTTPPath;

    const outputSchema = z.object({
      item: this.entitySchema,
      created: z.boolean(),
    });

    const builder = new RouteBuilder<
      TEntity,
      z.ZodObject<{ item: TEntity; created: z.ZodBoolean }>,
      undefined,
      undefined,
      "PUT"
    >(
      {
        method: "PUT",
        path: upsertPath,
        summary: `Upsert ${this.entityName}`,
        description: `Create or update ${this.entityName} by ${uniqueField}`,
      },
      this.entitySchema,
      outputSchema,
      undefined,
      undefined,
      "PUT"
    );

    return builder as unknown as RouteBuilder<TEntity, z.ZodObject<{
      item: TEntity;
      created: z.ZodBoolean;
    }>, undefined, undefined, "PUT">;
  }

  /**
   * Batch upsert - Create or update multiple entities
   * 
   * @example
   * ```typescript
   * const batchUpsertContract = userOps.batchUpsert().build();
   * // Input: { items: [...] }
   * // Output: { created: [...], updated: [...], errors: [...] }
   * ```
   */
  batchUpsert(options?: {
    maxBatchSize?: number;
    uniqueField?: string;
  }): RouteBuilder<
    z.ZodObject<{
      items: z.ZodArray<TEntity>;
    }>,
    z.ZodObject<{
      created: z.ZodArray<TEntity>;
      updated: z.ZodArray<TEntity>;
      errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        error: z.ZodString;
      }>>>;
    }>,
    undefined,
    undefined,
    "PUT"
  > {
    const maxSize = options?.maxBatchSize ?? 100;
    const uniqueField = options?.uniqueField ?? 'id';

    const inputSchema = z.object({
      items: z.array(this.entitySchema).max(maxSize),
    });

    const outputSchema = z.object({
      created: z.array(this.entitySchema),
      updated: z.array(this.entitySchema),
      errors: z.array(z.object({
        index: z.number(),
        error: z.string(),
      })).optional(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ items: z.ZodArray<TEntity> }>,
      z.ZodObject<{
        created: z.ZodArray<TEntity>;
        updated: z.ZodArray<TEntity>;
        errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
          index: z.ZodNumber;
          error: z.ZodString;
        }>>>;
      }>,
      undefined,
      undefined,
      "PUT"
    >(
      {
        method: "PUT",
        path: "/batch/upsert",
        summary: `Batch upsert ${this.entityName}s`,
        description: `Create or update multiple ${this.entityName}s by ${uniqueField}`,
      },
      inputSchema,
      outputSchema,
      undefined,
      undefined,
      "PUT"
    );

    return builder;
  }

  /**
   * Validate entity data without persisting
   * 
   * @example
   * ```typescript
   * const validateContract = userOps.validate().build();
   * // Input: entity data
   * // Output: { valid: true/false, errors: [...] }
   * ```
   */
  validate(): RouteBuilder<
    TEntity,
    z.ZodObject<{
      valid: z.ZodBoolean;
      errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        message: z.ZodString;
      }>>>;
    }>,
    undefined,
    undefined,
    "POST"
  > {
    const outputSchema = z.object({
      valid: z.boolean(),
      errors: z.array(z.object({
        field: z.string(),
        message: z.string(),
      })).optional(),
    });

    const builder = new RouteBuilder<
      TEntity,
      z.ZodObject<{
        valid: z.ZodBoolean;
        errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
          field: z.ZodString;
          message: z.ZodString;
        }>>>;
      }>,
      undefined,
      undefined,
      "POST"
    >(
      {
        method: "POST",
        path: "/validate",
        summary: `Validate ${this.entityName}`,
        description: `Validate ${this.entityName} data without persisting`,
      },
      this.entitySchema,
      outputSchema,
      undefined,
      undefined,
      "POST"
    );

    return builder;
  }

  /**
   * Soft delete (archive) an entity
   * 
   * @example
   * ```typescript
   * const archiveContract = userOps.archive().build();
   * // Input: { id: 'uuid' }
   * // Output: { success: true, archivedAt: Date }
   * ```
   */
  archive(): RouteBuilder<
    z.ZodObject<{ id: z.ZodUUID }>,
    z.ZodObject<{ success: z.ZodBoolean; archivedAt: z.ZodDate }>,
    undefined,
    undefined,
    "POST"
  > {
    const inputSchema = z.object({
      id: z.uuid(),
    });

    const outputSchema = z.object({
      success: z.boolean(),
      archivedAt: z.date(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ id: z.ZodUUID }>,
      z.ZodObject<{ success: z.ZodBoolean; archivedAt: z.ZodDate }>,
      undefined,
      undefined,
      "POST"
    >(
      {
        method: "POST",
        path: "/{id}/archive",
        summary: `Archive ${this.entityName}`,
        description: `Soft delete (archive) a ${this.entityName}`,
      },
      inputSchema,
      outputSchema,
      undefined,
      undefined,
      "POST"
    );

    return builder;
  }

  /**
   * Restore a soft-deleted (archived) entity
   * 
   * @example
   * ```typescript
   * const restoreContract = userOps.restore().build();
   * // Input: { id: 'uuid' }
   * // Output: restored entity
   * ```
   */
  restore(): RouteBuilder<
    z.ZodObject<{ id: z.ZodUUID }>,
    TEntity,
    undefined,
    undefined,
    "POST"
  > {
    const inputSchema = z.object({
      id: z.uuid(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{ id: z.ZodUUID }>,
      TEntity,
      undefined,
      undefined,
      "POST"
    >(
      {
        method: "POST",
        path: "/{id}/restore",
        summary: `Restore ${this.entityName}`,
        description: `Restore a soft-deleted ${this.entityName}`,
      },
      inputSchema,
      this.entitySchema,
      undefined,
      undefined,
      "POST"
    );

    return builder;
  }

  /**
   * Clone/duplicate an entity
   * 
   * @example
   * ```typescript
   * const cloneContract = userOps.clone().build();
   * // Input: { id: 'uuid', overrides: { name: 'Copy of...' } }
   * // Output: cloned entity with new ID
   * ```
   */
  clone(): RouteBuilder<
    z.ZodObject<{
      id: z.ZodUUID;
      overrides: z.ZodOptional<z.ZodType<Partial<z.infer<TEntity>>>>;
    }>,
    TEntity,
    undefined,
    undefined,
    "POST"
  > {
    const inputSchema = z.object({
      id: z.uuid(),
      overrides: this.entitySchema.partial().optional(),
    });

    const builder = new RouteBuilder<
      z.ZodObject<{
        id: z.ZodUUID;
        overrides: z.ZodOptional<z.ZodType<Partial<z.infer<TEntity>>>>;
      }>,
      TEntity,
      undefined,
      undefined,
      "POST"
    >(
      {
        method: "POST",
        path: "/{id}/clone",
        summary: `Clone ${this.entityName}`,
        description: `Create a duplicate of a ${this.entityName}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      inputSchema as any,
      this.entitySchema,
      undefined,
      undefined,
      "POST"
    );

    return builder as unknown as RouteBuilder<
      z.ZodObject<{
        id: z.ZodUUID;
        overrides: z.ZodOptional<z.ZodType<Partial<z.infer<TEntity>>>>;
      }>,
      TEntity,
      undefined,
      undefined,
      "POST"
    >;
  }

  /**
   * Get change history for an entity
   * 
   * @example
   * ```typescript
   * const historyContract = userOps.history().build();
   * // Input: { id: 'uuid', limit: 10 }
   * // Output: { items: [...history entries...], hasMore: true }
   * ```
   */
  history() {
    const inputSchema = z.object({
      id: z.uuid(),
      limit: z.number().int().min(1).max(100).optional(),
      cursor: z.string().optional(),
    });

    const historyItemSchema = z.object({
      id: z.string(),
      entityId: z.string(),
      action: z.enum(['created', 'updated', 'deleted', 'restored']),
      changes: z.record(z.string(), z.object({
        old: z.any(),
        new: z.any(),
      })),
      userId: z.string().optional(),
      timestamp: z.date(),
    });

    const outputSchema = z.object({
      items: z.array(historyItemSchema),
      hasMore: z.boolean(),
      nextCursor: z.string().optional(),
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/{id}/history",
        summary: `Get ${this.entityName} history`,
        description: `Get change history for a ${this.entityName}`,
      },
      inputSchema,
      outputSchema
    );

    return builder;
  }

  /**
   * Get distinct values for a specific field
   * 
   * @example
   * ```typescript
   * const distinctStatusContract = userOps.distinct('status').build();
   * // Input: { limit: 100 }
   * // Output: { values: ['active', 'inactive'], total: 2 }
   * ```
   */
   
  distinct(
    fieldName: keyof z.infer<TEntity>
  ): RouteBuilder<
    z.ZodObject<{ limit: z.ZodOptional<z.ZodNumber> }>,
    z.ZodObject<{
      values: z.ZodArray<z.ZodAny>;
      total: z.ZodNumber;
    }>
  > {
    const inputSchema = z.object({
      limit: z.number().int().min(1).max(1000).optional(),
    });

    const outputSchema = z.object({
      values: z.array(z.any()),
      total: z.number().int().min(0),
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: `/distinct/${String(fieldName)}`,
        summary: `Get distinct ${String(fieldName)} values`,
        description: `Get all unique values for ${String(fieldName)} field`,
      },
      inputSchema,
      outputSchema
    );

    return builder;
  }

  /**
   * Streaming search results
   * 
   * @example
   * ```typescript
   * const streamingSearchContract = userOps.streamingSearch({
   *   searchFields: ['name', 'email']
   * }).build();
   * ```
   */
  streamingSearch(options?: {
    searchFields?: readonly string[];
    pagination?: ZodSchemaWithConfig<unknown> | { defaultLimit?: number; maxLimit?: number };
  }): RouteBuilder<z.ZodType, z.ZodType, undefined, EventIteratorWrapper> {
    const queryConfig: QueryConfig = {};

    // Handle pagination
    if (options?.pagination) {
      if (CONFIG_SYMBOL in options.pagination) {
        queryConfig.pagination = options.pagination;
      } else {
        queryConfig.pagination = createPaginationConfigSchema(options.pagination);
      }
    } else {
      queryConfig.pagination = createPaginationConfigSchema({ defaultLimit: 20, maxLimit: 100 });
    }

    // Handle search
    queryConfig.search = createSearchConfigSchema(options?.searchFields, {
      minQueryLength: 1,
      allowFieldSelection: true,
    });

    const queryBuilder = createQueryBuilder(queryConfig);
    const inputSchema = queryBuilder.buildInputSchema();
    const outputSchema = queryBuilder.buildOutputSchema(this.entitySchema);

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/search/streaming",
        summary: `Streaming search ${this.entityName}s`,
        description: `Real-time streaming search for ${this.entityName}s`,
      },
      inputSchema,
      outputSchema
    );

    return builder.wrapOutput(eventIterator) as unknown as RouteBuilder<
      z.ZodType,
      z.ZodType,
      undefined,
      EventIteratorWrapper
    >;
  }
}

/**
 * Factory function to create standard operations for an entity
 * 
 * @example
 * ```typescript
 * const userOps = standard(userSchema, 'user');
 * 
 * const readContract = userOps.read().build();
 * const createContract = userOps.create()
 *   .inputBuilder.omit(['id', 'createdAt'])
 *   .build();
 * ```
 */
export function standard<TEntity extends EntitySchema>(
  entitySchema: TEntity,
  entityName: string
): StandardOperations<TEntity> {
  return new StandardOperations(entitySchema, entityName);
}
