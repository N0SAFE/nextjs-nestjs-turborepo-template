import { z } from "zod/v4";
import { RouteBuilder } from "../builder/route-builder";
import type { EntitySchema, PaginationOptions } from "../builder/types";
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



/**
 * Standard operations factory
 */
export class StandardOperations<TEntity extends EntitySchema> {
  constructor(
    private entitySchema: TEntity,
    private entityName: string
  ) {}

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
   * Create a standard CREATE operation (POST)
   * 
   * @example
   * ```typescript
   * standard.create(userSchema, 'user')
   *   .inputBuilder.omit(['id', 'createdAt', 'updatedAt'])
   *   .build();
   * ```
   */
  create(): RouteBuilder<TEntity, TEntity> {
    const builder = new RouteBuilder(
      {
        method: "POST",
        path: "/",
        summary: `Create a new ${this.entityName}`,
        description: `Create a new ${this.entityName} in the system`,
      },
      this.entitySchema,
      this.entitySchema
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
  update(): RouteBuilder<TEntity, TEntity> {
    const builder = new RouteBuilder(
      {
        method: "PUT",
        path: `/{id}`,
        summary: `Update an existing ${this.entityName}`,
        description: `Update an existing ${this.entityName} in the system`,
      },
      this.entitySchema,
      this.entitySchema
    );

    return builder;
  }

  /**
   * Create a standard PATCH operation (partial update)
   */
  patch(): RouteBuilder<z.ZodType<Partial<z.infer<TEntity>>>, TEntity> {
    const partialSchema = this.entitySchema.partial();

    const builder = new RouteBuilder(
      {
        method: "PATCH",
        path: `/{id}`,
        summary: `Partially update ${this.entityName}`,
        description: `Update specific fields of ${this.entityName}`,
      },
      partialSchema as any,
      this.entitySchema
    );

    return builder as any;
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
    z.ZodObject<{ success: z.ZodBoolean; message: z.ZodOptional<z.ZodString> }>
  > {
    const inputSchema = z.object({
      id: z.uuid(),
    });

    const outputSchema = z.object({
      success: z.boolean(),
      message: z.string().optional(),
    });

    const builder = new RouteBuilder(
      {
        method: "DELETE",
        path: `/{id}`,
        summary: `Delete ${this.entityName}`,
        description: `Delete a ${this.entityName} by ID`,
      },
      inputSchema,
      outputSchema
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
    filtering?: ZodSchemaWithConfig<unknown> | { fields: Record<string, z.ZodTypeAny>; allowLogicalOperators?: boolean };
  }): RouteBuilder<z.ZodTypeAny, z.ZodTypeAny>;
  list(optionsOrConfig?: any) {
    // Check if this is a pre-built QueryConfig or plain options
    const isQueryConfig = optionsOrConfig && 
      (optionsOrConfig.pagination?.[CONFIG_SYMBOL] !== undefined ||
       optionsOrConfig.sorting?.[CONFIG_SYMBOL] !== undefined ||
       optionsOrConfig.filtering?.[CONFIG_SYMBOL] !== undefined ||
       optionsOrConfig.search?.[CONFIG_SYMBOL] !== undefined);

    let queryConfig: QueryConfig;

    if (isQueryConfig) {
      // Already a QueryConfig - use directly
      queryConfig = optionsOrConfig;
    } else {
      // Plain options - build QueryConfig from them
      const options = optionsOrConfig;
      queryConfig = {};

      // Handle pagination - accept ZodSchemaWithConfig OR plain object
      if (options?.pagination !== undefined) {
        // Check if it's already a ZodSchemaWithConfig (has CONFIG_SYMBOL)
        if (CONFIG_SYMBOL in options.pagination) {
          queryConfig.pagination = options.pagination as ZodSchemaWithConfig<unknown>;
        } else {
          // Plain object - create config schema
          queryConfig.pagination = createPaginationConfigSchema(options.pagination);
        }
      } else {
        queryConfig.pagination = createPaginationConfigSchema({ defaultLimit: 10, maxLimit: 100 });
      }

      // Handle sorting - accept ZodSchemaWithConfig OR plain object
      if (options?.sorting) {
        if (CONFIG_SYMBOL in options.sorting) {
          queryConfig.sorting = options.sorting as ZodSchemaWithConfig<unknown>;
        } else {
          const { fields, defaultField, defaultDirection } = options.sorting;
          queryConfig.sorting = createSortingConfigSchema(fields, {
            defaultField,
            defaultDirection: defaultDirection || "asc",
          });
        }
      }

      // Handle filtering - accept ZodSchemaWithConfig OR plain object
      if (options?.filtering) {
        if (CONFIG_SYMBOL in options.filtering) {
          queryConfig.filtering = options.filtering as ZodSchemaWithConfig<unknown>;
        } else {
          queryConfig.filtering = createFilteringConfigSchema(
            options.filtering.fields,
            { allowLogicalOperators: options.filtering.allowLogicalOperators }
          );
        }
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

    return builder;
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
        queryConfig.pagination = options.pagination as ZodSchemaWithConfig<unknown>;
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
    fieldSchema?: z.ZodTypeAny
  ): RouteBuilder<
    z.ZodObject<Record<TField, z.ZodType<TFieldValue>>>,
    z.ZodObject<{ exists: z.ZodBoolean }>
  > {
    const schema = fieldSchema ?? this.entitySchema.shape[fieldName as string];
    
    // Create a properly typed input schema
    type InputShape = Record<TField, typeof schema>;
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
    }>
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

    const builder = new RouteBuilder(
      {
        method: "POST",
        path: "/batch",
        summary: `Batch create ${this.entityName}s`,
        description: `Create multiple ${this.entityName}s in a single request`,
      },
      inputSchema,
      outputSchema
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
    }>
  > {
    const maxSize = options?.maxBatchSize ?? 100;
    
    const inputSchema = z.object({
      ids: z.array(z.uuid()).max(maxSize),
    });

    const outputSchema = z.object({
      deleted: z.number().int().min(0),
      failed: z.array(z.string()).optional(),
    });

    const builder = new RouteBuilder(
      {
        method: "DELETE",
        path: "/batch",
        summary: `Batch delete ${this.entityName}s`,
        description: `Delete multiple ${this.entityName}s by IDs`,
      },
      inputSchema,
      outputSchema
    );

    return builder;
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
