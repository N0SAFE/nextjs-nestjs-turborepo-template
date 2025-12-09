import { z } from "zod/v4";
import { RouteBuilder } from "../builder/route-builder";
import type { EntitySchema, PaginationOptions } from "../builder/types";
import {
  createPaginationSchema,
  createPaginationMetaSchema,
  createPaginatedResponseSchema,
  type PaginationConfig,
} from "../query/pagination";
import {
  createSortingSchema,
  type SortingConfig,
} from "../query/sorting";
import {
  createFilteringSchema,
  type FilteringConfig,
} from "../query/filtering";
import {
  createSearchSchema,
  type SearchConfig,
} from "../query/search";
import { createQueryBuilder, type QueryConfig } from "../query/query-builder";



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
  read(): RouteBuilder<z.ZodObject<{ id: z.ZodString }>, TEntity> {
    const inputSchema = z.object({
      id: z.string().uuid(),
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
    z.ZodObject<{ id: z.ZodString }>,
    z.ZodObject<{ success: z.ZodBoolean; message: z.ZodOptional<z.ZodString> }>
  > {
    const inputSchema = z.object({
      id: z.string().uuid(),
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
   * @example
   * ```typescript
   * // Simple list with pagination
   * standard.list(userSchema, 'user', {
   *   pagination: { defaultLimit: 20 },
   *   sorting: ['createdAt', 'name']
   * }).build();
   * 
   * // Advanced list with filtering
   * standard.list(userSchema, 'user', {
   *   pagination: { defaultLimit: 20 },
   *   sorting: ['createdAt', 'name'],
   *   filtering: {
   *     fields: {
   *       name: { schema: z.string(), operators: ['eq', 'like'] },
   *       active: z.boolean()
   *     }
   *   }
   * }).build();
   * ```
   */
  list<TFilterFields extends Record<string, any> = {}>(options?: {
    pagination?: PaginationConfig;
    sorting?: readonly string[];
    filtering?: FilteringConfig<TFilterFields>;
  }): RouteBuilder<
    z.ZodType<any>,
    z.ZodObject<{
      data: z.ZodArray<TEntity>;
      meta: z.ZodType<any>;
    }>
  > {
    // Build query using QueryBuilder for type safety
    const queryConfig: QueryConfig<TFilterFields> = {
      pagination: options?.pagination || { defaultLimit: 10, maxLimit: 100 },
    };

    if (options?.sorting && options.sorting.length > 0) {
      queryConfig.sorting = {
        fields: options.sorting,
        defaultDirection: "asc",
      };
    }

    if (options?.filtering) {
      queryConfig.filtering = options.filtering;
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
    pagination?: PaginationConfig;
  }): RouteBuilder<
    z.ZodType<any>,
    z.ZodObject<{
      data: z.ZodArray<TEntity>;
      meta: z.ZodType<any>;
    }>
  > {
    const queryConfig: QueryConfig<{}> = {
      pagination: options?.pagination || { defaultLimit: 20, maxLimit: 100 },
      search: {
        searchableFields: options?.searchFields,
        minQueryLength: 1,
        allowFieldSelection: true,
      },
    };

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
  check<TField extends keyof z.infer<TEntity>>(
    fieldName: TField,
    fieldSchema?: z.ZodTypeAny
  ): RouteBuilder<
    z.ZodType<{ [K in TField]: any }>,
    z.ZodObject<{ exists: z.ZodBoolean }>
  > {
    const schema = fieldSchema ?? this.entitySchema.shape[fieldName as string];
    
    const inputSchema = z.object({
      [fieldName]: schema,
    } as any);

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

    return builder as any;
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
      ids: z.ZodArray<z.ZodString>;
    }>,
    z.ZodObject<{
      deleted: z.ZodNumber;
      failed: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }>
  > {
    const maxSize = options?.maxBatchSize ?? 100;
    
    const inputSchema = z.object({
      ids: z.array(z.string().uuid()).max(maxSize),
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
