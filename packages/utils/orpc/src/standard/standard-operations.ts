import { z } from "zod/v4";
import { RouteBuilder } from "../builder/route-builder";
import type { EntitySchema, PaginationOptions } from "../builder/types";

/**
 * Standard pagination input schema
 */
export function createPaginationSchema(options?: PaginationOptions) {
  const defaultLimit = options?.defaultLimit ?? 10;
  const maxLimit = options?.maxLimit ?? 100;

  const schema: Record<string, z.ZodTypeAny> = {
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(maxLimit)
      .default(defaultLimit),
  };

  if (options?.includeOffset !== false) {
    schema.offset = z.coerce.number().int().min(0).default(0);
  }

  if (options?.includeCursor) {
    schema.cursor = z.string().optional();
  }

  return z.object(schema as z.ZodRawShape);
}

/**
 * Standard pagination output metadata schema
 */
export function createPaginationOutputSchema() {
  return z.object({
    total: z.number().int().min(0),
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
    hasMore: z.boolean(),
  });
}

/**
 * Standard sorting schema
 */
export function createSortingSchema(fields: readonly string[]) {
  return z.object({
    sortBy: z.enum(fields as [string, ...string[]]).optional(),
    sortDirection: z.enum(["asc", "desc"]).default("asc"),
  });
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
  patch(): RouteBuilder<any, TEntity> {
    const partialSchema = this.entitySchema.partial();

    const builder = new RouteBuilder(
      {
        method: "PATCH",
        path: `/{id}`,
        summary: `Partially update ${this.entityName}`,
        description: `Update specific fields of ${this.entityName}`,
      },
      partialSchema,
      this.entitySchema
    );

    return builder;
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
   * Create a standard LIST operation with pagination
   * 
   * @example
   * ```typescript
   * standard.list(userSchema, 'user', {
   *   pagination: { defaultLimit: 20 },
   *   sorting: ['createdAt', 'name']
   * }).build();
   * ```
   */
  list(options?: {
    pagination?: PaginationOptions;
    sorting?: readonly string[];
  }): RouteBuilder<any, any> {
    const paginationSchema = createPaginationSchema(options?.pagination);
    
    let inputSchema: z.ZodTypeAny = paginationSchema;
    
    if (options?.sorting && options.sorting.length > 0) {
      const sortingSchema = createSortingSchema(options.sorting);
      inputSchema = paginationSchema.merge(sortingSchema);
    }

    const paginationOutputSchema = createPaginationOutputSchema();
    const outputSchema = z.object({
      data: z.array(this.entitySchema),
      meta: paginationOutputSchema,
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/",
        summary: `List ${this.entityName}s`,
        description: `Retrieve a paginated list of ${this.entityName}s`,
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
   * Create a standard SEARCH operation
   * 
   * @example
   * ```typescript
   * standard.search(userSchema, 'user', {
   *   searchFields: ['name', 'email']
   * }).build();
   * ```
   */
  search(options?: {
    searchFields?: readonly string[];
    pagination?: PaginationOptions;
  }): RouteBuilder<any, any> {
    const paginationSchema = createPaginationSchema(options?.pagination);
    
    const inputSchema = paginationSchema.extend({
      query: z.string().min(1),
      fields: options?.searchFields
        ? z.array(z.enum(options.searchFields as [string, ...string[]])).optional()
        : z.array(z.string()).optional(),
    });

    const paginationOutputSchema = createPaginationOutputSchema();
    const outputSchema = z.object({
      data: z.array(this.entitySchema),
      meta: paginationOutputSchema,
    });

    const builder = new RouteBuilder(
      {
        method: "GET",
        path: "/search",
        summary: `Search ${this.entityName}s`,
        description: `Search for ${this.entityName}s by query`,
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
  ): RouteBuilder<any, z.ZodObject<{ exists: z.ZodBoolean }>> {
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

    return builder;
  }

  /**
   * Create a batch CREATE operation
   */
  batchCreate(options?: { maxBatchSize?: number }): RouteBuilder<any, any> {
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
  batchDelete(options?: { maxBatchSize?: number }): RouteBuilder<any, any> {
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
